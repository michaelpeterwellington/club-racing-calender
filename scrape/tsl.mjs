// Scrape TSL Timing race results for a club season.
//
//   node scrape/tsl.mjs bmcrc                 all 2026 events for the club
//   node scrape/tsl.mjs bmcrc --event 261179  one event
//   node scrape/tsl.mjs bmcrc --limit 1       first event only
//
// Everything is cached to scrape/.cache, so re-runs cost nothing and repeated
// development doesn't hammer TSL. Requests are serialised with a delay and
// carry a User-Agent that says who we are.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parseResult, pdfToText } from './parse-tsl.mjs';

const BASE = 'https://www.tsl-timing.com';
const UA = 'uk-race-calendar/0.1 (club racing calendar aggregator; contact via site)';
const DELAY_MS = 1200;
const CACHE = 'scrape/.cache';
const CLUBS = { bmcrc: 'BEMSEE', nolimits: 'No Limits', emra: 'EMRA', ngroadracing: 'NG Road Racing' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;

async function get(url, binary = false) {
  mkdirSync(CACHE, { recursive: true });
  const key = join(CACHE, createHash('sha1').update(url).digest('hex') + (binary ? '.bin' : '.txt'));
  if (existsSync(key)) return binary ? key : readFileSync(key, 'utf8');
  const wait = DELAY_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  if (binary) { writeFileSync(key, Buffer.from(await res.arrayBuffer())); return key; }
  const text = await res.text();
  writeFileSync(key, text);
  return text;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

export async function listEvents(club) {
  const html = await get(`${BASE}/Results/${club}/`);
  // Each <a href="/event/ID"> wraps a whole card, so its closing tag is a long
  // way off. Match the ids alone; the event page carries the title anyway.
  const ids = [...new Set([...html.matchAll(/href="\/event\/(\d+)"/g)].map((m) => m[1]))];
  const found = (html.match(/Found\s*<b>(\d+)<\/b>\s*events\s*in\s*<b>(\d{4})<\/b>/i) ?? []).slice(1);
  if (found.length) process.stderr.write(`  page reports ${found[0]} events in ${found[1]}\n`);
  if (found.length && Number(found[0]) !== ids.length) {
    process.stderr.write(`  ! parsed ${ids.length} event links but page says ${found[0]} \u2014 check the selector\n`);
  }
  return ids.map((id) => ({ id }));
}

// Every result PDF on an event page, with the link text that describes it.
export async function listResultPdfs(eventId) {
  const html = await get(`${BASE}/event/${eventId}`);
  const meetingTitle = decode((html.match(/<title>([\s\S]*?)<\/title>/) ?? [, ''])[1]).replace(/\s*::.*$/, '').replace(/^Event Details - /, '');
  const out = [];
  for (const m of html.matchAll(/href="(\/file\/\?f=[^"]+\.pdf)"[^>]*>([\s\S]{0,80}?)<\/a>/g)) {
    const label = decode(m[2].replace(/<[^>]*>/g, ' '));
    if (!/^Race \d+ Result$/i.test(label)) continue;        // skip grids, qualifying, PDF books, points
    out.push({ url: BASE + m[1].replace(/&amp;/g, '&'), label, race: Number(label.match(/\d+/)[0]) });
  }
  return { meetingTitle, pdfs: out };
}

async function scrapeEvent(club, eventId) {
  const { meetingTitle, pdfs } = await listResultPdfs(eventId);
  process.stderr.write(`  event ${eventId}: ${meetingTitle}\n    ${pdfs.length} race results\n`);
  const races = [];
  for (const p of pdfs) {
    try {
      const parsed = parseResult(pdfToText(await get(p.url, true)));
      if (!parsed?.rows.length) { process.stderr.write(`    ! no rows: ${p.label}\n`); continue; }
      races.push({ race: p.race, url: p.url, ...parsed });
    } catch (e) {
      process.stderr.write(`    ! ${p.label}: ${e.message}\n`);
    }
  }
  return { club, clubName: CLUBS[club] ?? club, eventId, meetingTitle, races };
}

const args = process.argv.slice(2);
const club = args[0];
if (!club || !CLUBS[club]) {
  console.error(`usage: node scrape/tsl.mjs <${Object.keys(CLUBS).join('|')}> [--event ID] [--limit N]`);
  process.exit(1);
}
const only = args.includes('--event') ? args[args.indexOf('--event') + 1] : null;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

const events = only ? [{ id: only, title: '' }] : (await listEvents(club)).slice(0, limit);
process.stderr.write(`${CLUBS[club]}: ${events.length} event(s)\n`);
const out = [];
for (const e of events) out.push(await scrapeEvent(club, e.id));

const races = out.reduce((n, e) => n + e.races.length, 0);
if (!races) {
  process.stderr.write(`\n! no races parsed for ${club} \u2014 refusing to overwrite an existing file\n`);
  process.exit(1);
}
mkdirSync('data/results', { recursive: true });
const file = `data/results/${club}-2026.json`;
writeFileSync(file, JSON.stringify(out, null, 2));
const rows = out.reduce((n, e) => n + e.races.reduce((m, r) => m + r.rows.length, 0), 0);
process.stderr.write(`\n✓ ${file}: ${out.length} event(s), ${races} races, ${rows} result rows\n`);
