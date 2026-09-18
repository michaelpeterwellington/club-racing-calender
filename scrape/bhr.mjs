// Scrape British Historic Racing results from theresultslive.co.uk.
//
//   node scrape/bhr.mjs            2026 season
//   node scrape/bhr.mjs --limit 1  first meeting only
//
// Unlike TSL, these are HTML rather than PDF, but they aren't in the page
// either: each session page is a stub whose results are fetched by
//   GET /ms-results-live-ajax?meeting-uuid=<uuid>&race-id=<id>&race-nid=<nid>
// which returns a table fragment. All three parameters are required — omit
// race-nid and it returns an empty body. The ids live on the session page, so
// each session costs two requests.
//
// Output matches the TSL scraper's shape so analyse.mjs treats both alike.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const BASE = 'https://www.theresultslive.co.uk';
const INDEX = `${BASE}/british-historic-racing-club`;
const UA = 'uk-race-calendar/0.1 (club racing calendar aggregator; contact via site)';
const DELAY_MS = 1200;
const CACHE = 'scrape/.cache';
const YEAR = '2026';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url) {
  mkdirSync(CACHE, { recursive: true });
  const key = join(CACHE, 'bhr-' + createHash('sha1').update(url).digest('hex') + '.txt');
  if (existsSync(key)) return readFileSync(key, 'utf8');
  const wait = DELAY_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const t = await res.text();
  writeFileSync(key, t);
  return t;
}

const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#039;|&#39;/g, "'")
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

const toSec = (t) => {
  if (!t) return null;
  const m = String(t).match(/^(?:(\d+):)?(\d{1,2}(?:\.\d+)?)$/);
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2]) : null;
};
// "00:58.37" -> "58.370"; "01:00.18" -> "1:00.180"
function normLap(v) {
  const s = toSec(v);
  if (!s || s <= 0) return null;
  const m = Math.floor(s / 60), r = s - m * 60;
  return m ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3);
}

// The index lists each meeting as a table row of date / venue / round. The
// meeting page's own <h1> is just "2026 meetings", so the venue has to come
// from here or pace data ends up filed under no circuit at all.
async function meetingUrls() {
  const html = await get(INDEX);
  const out = [], seen = new Set();
  for (const row of html.matchAll(/<tr[^>]*data-href="(\/british-historic-racing-club\/[^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const url = BASE + row[1];
    if (!row[1].includes(`/${YEAR}/`) || seen.has(url)) continue;
    seen.add(url);
    const cells = [...row[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1]));
    out.push({ url, date: cells[0] ?? '', venue: cells[1] ?? '', round: cells[2] ?? '' });
  }
  return out;
}

async function raceSessions(meetingUrl) {
  const html = await get(meetingUrl);
  const title = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [, ''])[1]);
  const seen = new Set(), out = [];
  for (const m of html.matchAll(/href="([^"]+)"[^>]*>([^<]*Race\s*\d+[^<]*)<\/a>/gi)) {
    const url = BASE + m[1];
    if (seen.has(url) || !/\/race-\d+/i.test(m[1])) continue;
    seen.add(url);
    out.push({ url, label: strip(m[2]) });
  }
  return { title, sessions: out };
}

// Header names vary in case and wording, so map them rather than assume order.
const COL = {
  pos: /^pos/i, number: /^no\b/i, classCode: /^class/i, name: /^name/i, bike: /^entry/i,
  laps: /^laps/i, best: /^best ?lap/i, gap: /^behind/i, mph: /^best ?mph/i,
  lastLap: /^last ?lap/i, lastMph: /^last ?mph/i,
};

function parseTable(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => strip(c[1])));
  if (rows.length < 2) return [];
  const head = rows[0];
  const idx = {};
  for (const [field, re] of Object.entries(COL)) {
    const i = head.findIndex((h) => re.test(h));
    if (i > -1) idx[field] = i;
  }
  if (idx.pos == null || idx.name == null) return [];
  const out = [];
  for (const r of rows.slice(1)) {
    const cell = (f) => (idx[f] != null ? r[idx[f]] ?? '' : '');
    const pos = Number(cell('pos'));
    if (!Number.isFinite(pos) || !cell('name')) continue;
    // "Best lap" holds the gap to the leader here, not a lap time; the actual
    // lap time is in "Last lap". Take the better of the two as the best lap.
    const lastLap = normLap(cell('lastLap'));
    const bestCell = normLap(cell('best'));
    const best = bestCell && lastLap ? (toSec(bestCell) < toSec(lastLap) ? bestCell : lastLap) : (lastLap ?? bestCell);
    const entry = cell('bike');
    const em = entry.match(/^(\S+)\s+(.*)$/);
    out.push({
      pos, number: cell('number') || null, classCode: cell('classCode') || null, posInClass: null,
      name: cell('name'), bike: entry || null, team: null,
      laps: Number(cell('laps')) || null, time: null,
      gap: cell('gap') || null, diff: null,
      mph: Number(cell('mph')) || Number(cell('lastMph')) || null,
      best, bestOnLap: null, grid: null, gained: null,
    });
  }
  return out;
}

async function scrapeSession(s) {
  const page = await get(s.url);
  const ph = page.match(/id="live-results-placeholder"[^>]*/);
  if (!ph) return null;
  const attr = (n) => (ph[0].match(new RegExp(`data-${n}="([^"]+)"`)) ?? [])[1];
  const uuid = attr('meeting-uuid'), rid = attr('race-id'), nid = attr('race-nid');
  if (!uuid || !rid || !nid) return null;
  const html = await get(`${BASE}/ms-results-live-ajax?meeting-uuid=${uuid}&race-id=${rid}&race-nid=${nid}`);
  const rows = parseTable(html);
  if (!rows.length) return null;
  const label = s.label.replace(/&amp;/g, '&');
  return {
    race: Number((label.match(/Race\s*(\d+)/i) ?? [, 0])[1]),
    url: s.url,
    meeting: '', className: label.replace(/^Race\s*\d+\s*[-–]\s*/i, '').trim(),
    session: `RACE ${(label.match(/Race\s*(\d+)/i) ?? [, ''])[1]} - CLASSIFICATION`,
    distance: null, rows,
  };
}

const limit = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;
const meets = (await meetingUrls()).slice(0, limit);
process.stderr.write(`British Historic Racing: ${meets.length} ${YEAR} meeting(s)\n`);

const out = [];
for (const meet of meets) {
  const mu = meet.url;
  const { title, sessions } = await raceSessions(mu);
  process.stderr.write(`  ${meet.date} ${meet.venue} (${sessions.length} race sessions)\n`);
  const races = [];
  for (const s of sessions) {
    try {
      const r = await scrapeSession(s);
      if (r) { r.meeting = `BHR ${meet.round || title} @ ${meet.venue}`; races.push(r); }
    } catch (e) { process.stderr.write(`    ! ${s.label}: ${e.message}\n`); }
  }
  process.stderr.write(`    ${races.length} with results\n`);
  out.push({ club: 'bhr', clubName: 'British Historic Racing', eventId: mu.split('/').pop(),
    meetingTitle: `${meet.round || title} \u2014 ${meet.venue} (${meet.date})`, venue: meet.venue, races });
}

const races = out.reduce((n, e) => n + e.races.length, 0);
if (!races) { process.stderr.write('\n! no races parsed — not writing\n'); process.exit(1); }
mkdirSync('data/results', { recursive: true });
writeFileSync(`data/results/bhr-${YEAR}.json`, JSON.stringify(out, null, 2));
const rows = out.reduce((n, e) => n + e.races.reduce((m, r) => m + r.rows.length, 0), 0);
process.stderr.write(`\n✓ data/results/bhr-${YEAR}.json: ${out.length} meeting(s), ${races} races, ${rows} rows\n`);
