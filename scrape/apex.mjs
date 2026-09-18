// Scrape CRMC results from Apex Timing.
//
// Apex has no browsable archive and the results are not in the page. Each
// meeting page carries a menu of classes and sessions, and the results come from
//   GET functions/request_results.php?group_id=&file_id=&path=&type=&window_width=
// returning an HTML table. group_id and file_id are the data-group and data-id
// attributes in that menu, and type is the entry's data-image ("result" for a
// classification, "list" for an entry list).
//
// Note these tables carry no race time, lap count or speed — only a best lap and
// a gap. So the 92.5% national mark, which is a race-average-speed rule, cannot
// be computed for CRMC and is left null rather than guessed at.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tokens, fitTail } from './parse-tsl.mjs';

const BASE = 'https://www.apex-timing.com/goracing';
const UA = 'uk-race-calendar/0.1 (club racing calendar aggregator; contact via site)';
const DELAY_MS = 1200;
const CACHE = 'scrape/.cache';
const YEAR = '2026';

// Apex path slug -> the venue name our circuit matcher understands.
const VENUES = {
  cadwell: 'Cadwell Park', pembrey: 'Pembrey', snetterton: 'Snetterton',
  brandshatch: 'Brands Hatch', doningtonpark: 'Donington Park',
  anglesey: 'Anglesey', mallorypark: 'Mallory Park',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url, binary = false) {
  mkdirSync(CACHE, { recursive: true });
  const key = join(CACHE, 'apex-' + createHash('sha1').update(url).digest('hex') + (binary ? '.pdf' : '.txt'));
  if (existsSync(key)) return binary ? key : readFileSync(key, 'utf8');
  const wait = DELAY_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  if (binary) { writeFileSync(key, Buffer.from(await res.arrayBuffer())); return key; }
  const t = await res.text();
  writeFileSync(key, t);
  return t;
}

const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

const toSec = (t) => {
  const m = String(t ?? '').match(/^(?:(\d+):)?(\d{1,2}(?:\.\d+)?)$/);
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2]) : null;
};

function sessions(html) {
  const out = [];
  const re = /<div class="group_submenu[^"]*" data-group="(\d+)" data-group_title="([^"]*)">([\s\S]*?)(?=<div class="group_submenu|$)/g;
  for (const g of html.matchAll(re)) {
    const [, group, title, body] = g;
    for (const e of body.matchAll(/data-id="([^"]+)"[\s\S]{0,140}?data-image="([^"]+)" class="title">([^<]*)</g)) {
      const [, fileId, type, label] = e;
      if (type !== 'result') continue;
      if (!/^Race\s*\d+/i.test(strip(label))) continue;   // skip practice and entry lists
      out.push({ group, className: strip(title), fileId, type, label: strip(label) });
    }
  }
  return out;
}

// Apex's HTML table gives only a gap and a best lap. Its PDF gives laps, race
// time and speed too, which the national-mark calculation needs, so the PDF is
// the real source and the table is only a fallback.
//   Rnk | +/- | No. | Class | Rnk | Rider | Entry |
//   Laps | Time | mph | Gap | Interv. | Best lap | mph | In Lap | 2nd Best | Spd
// Gap and Interv. are blank for the leader, which fitTail already handles.
export function parseApexPdf(file) {
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const lines = text.split('\n');
  const hi = lines.findIndex((l) => /\bRnk\b/.test(l) && /\bRider\b/.test(l) && /\bLaps\b/.test(l));
  if (hi < 0) return { rows: [], distance: null };
  const header = lines[hi];
  const riderAt = header.indexOf('Rider');
  const entryAt = header.indexOf('Entry');
  if (riderAt < 0 || entryAt < 0) return { rows: [], distance: null };
  const distance = (lines.slice(0, hi).find((l) => /Laps\s*=/.test(l)) ?? '')
    .replace(/.*?(\d+\s*Laps\s*=\s*[\d.]+\s*miles).*/i, '$1').trim() || null;

  // These PDFs run to several pages: page one is the classification, the rest
  // are lap-by-lap charts with entirely different columns. Stop at the next
  // header so those pages aren't read with page one's offsets.
  let end = lines.length;
  for (let i = hi + 1; i < lines.length; i++) {
    if (/\bRnk\b/.test(lines[i]) && (/\bRider\b/.test(lines[i]) || /\bLap\b/.test(lines[i]))) { end = i; break; }
  }

  const rows = [];
  for (let i = hi + 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const head = line.slice(0, riderAt).trim().split(/\s+/).filter(Boolean);
    if (!head.length || !/^\d+$/.test(head[0])) continue;
    if (head.some((t) => /:/.test(t))) continue;   // a lap-chart row, not a result
    // Rnk [gained] No. Class Rnk(class) — gained is blank for the leader and
    // Class may be absent, so take the rank, then read the class from the right.
    // Layout is: Rnk [gained] No. Class Rnk-in-class, and `gained` is blank for
    // the leader. So anchor on the class code — the only non-numeric token —
    // and take the race number as the field immediately before it, rather than
    // the first number after the rank, which is the gained column.
    const pos = Number(head[0]);
    const ci = head.findIndex((t, k) => k > 0 && !/^\d+$/.test(t));
    const classCode = ci > 0 ? head[ci] : null;
    const pic = /^\d+$/.test(head[head.length - 1]) ? Number(head[head.length - 1]) : null;
    const no = ci > 1 ? head[ci - 1] : (head.length >= 4 ? head[2] : head[1]) ?? null;

    const name = line.slice(riderAt, entryAt).replace(/\s+/g, ' ').trim();
    if (!name || !/[A-Za-z]{2}/.test(name) || /^No\./.test(name)) continue;
    const after = line.slice(entryAt);
    const m = after.match(/(?:^|\s)(\d{1,3})\s+(\d{1,2}:\d{2}\.\d{2,3})/);
    if (!m) continue;
    const entry = after.slice(0, m.index).replace(/\s+/g, ' ').trim();
    const t = fitTail(['LAPS', 'TIME', 'MPH', 'GAP', 'DIFF', 'BEST', 'BESTMPH', 'ON', 'SECONDBEST', 'TOPSPEED'],
      tokens(after.slice(m.index)));
    if (!t) continue;

    const cc = (entry.match(/\((\d{2,4})\)/) ?? [])[1] ?? null;
    const bike = entry.replace(/\(\d{2,4}\)/, '').split('/').map((x) => x.trim()).filter(Boolean).join(' ') || null;
    rows.push({
      pos, number: no, classCode, posInClass: pic, name, bike, team: null,
      capacity: cc ? Number(cc) : null,
      laps: Number(t.LAPS) || null, time: t.TIME ?? null,
      gap: t.GAP ?? null, diff: t.DIFF ?? null,
      mph: t.MPH && /^\d+(\.\d+)?$/.test(t.MPH) ? Number(t.MPH) : null,
      best: t.BEST ?? null,
      bestOnLap: t.ON && /^\d+$/.test(t.ON) ? Number(t.ON) : null,
      topSpeed: t.TOPSPEED && /^\d+(\.\d+)?$/.test(t.TOPSPEED) ? Number(t.TOPSPEED) : null,
      grid: null, gained: null,
    });
  }
  return { rows, distance };
}

// Rnk | +/- | No. | Class | Rnk(class) | Rider | Entry | Gap | Best lap
function parseTable(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => strip(c[1])));
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.toLowerCase());
  const find = (re, from = 0) => head.findIndex((h, i) => i >= from && re.test(h));
  const iRider = find(/rider|name/), iEntry = find(/entry/), iBest = find(/best/), iGap = find(/gap/);
  const iNo = find(/^no/), iClass = find(/class/);
  const iPic = iClass > -1 ? find(/rnk|pos/, iClass + 1) : -1;
  if (iRider < 0 || iBest < 0) return [];
  const out = [];
  for (const r of rows) {
    const pos = Number(r[0]);
    if (!Number.isFinite(pos) || !r[iRider]) continue;
    const entry = iEntry > -1 ? r[iEntry] : '';
    // "Kramer / GP1RR / (690)" -> bike "Kramer GP1RR", capacity 690
    const cc = (entry.match(/\((\d{2,4})\)/) ?? [])[1] ?? null;
    const bike = entry.replace(/\(\d{2,4}\)/, '').split('/').map((x) => x.trim()).filter(Boolean).join(' ') || null;
    const best = r[iBest] && toSec(r[iBest]) ? r[iBest] : null;
    out.push({
      pos, number: iNo > -1 ? r[iNo] || null : null,
      classCode: iClass > -1 ? r[iClass] || null : null,
      posInClass: iPic > -1 ? Number(r[iPic]) || null : null,
      name: r[iRider], bike, team: null, capacity: cc ? Number(cc) : null,
      laps: null, time: null,
      gap: iGap > -1 ? r[iGap] || null : null, diff: null,
      mph: null, best, bestOnLap: null, grid: null, gained: null,
    });
  }
  return out;
}

// CLI only, so the parser can be imported without running a scrape.
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;
  const slugs = Object.keys(VENUES).slice(0, limit);
  process.stderr.write(`CRMC via Apex Timing: ${slugs.length} ${YEAR} meeting(s)\n`);

  const out = [];
  for (const slug of slugs) {
    const path = `/CRMC/${YEAR}/${slug}/`;
    let html;
    try { html = await get(`${BASE}/results.php?path=${path}`); }
    catch (e) { process.stderr.write(`  ${slug}: ${e.message}\n`); continue; }
    const list = sessions(html);
    const venue = VENUES[slug];
    process.stderr.write(`  ${venue}: ${list.length} race session(s)\n`);
    const races = [];
    for (const s of list) {
      const url = `${BASE}/functions/request_results.php?group_id=${s.group}&file_id=${encodeURIComponent(s.fileId)}&path=${path}&type=${s.type}&window_width=1400`;
      const pdfUrl = `${BASE}/results_download.php?pdf=${encodeURIComponent(`results${path}${s.fileId}.pdf`)}`;
      try {
        let rows = [], distance = null;
        try {
          const parsed = parseApexPdf(await get(pdfUrl, true));
          rows = parsed.rows; distance = parsed.distance;
        } catch { /* fall back below */ }
        if (!rows.length) rows = parseTable(await get(url));
        if (!rows.length) continue;
        races.push({
          race: Number((s.label.match(/\d+/) ?? [0])[0]), url: pdfUrl,
          meeting: `CRMC ${YEAR} @ ${venue}`, className: s.className,
          session: `RACE ${(s.label.match(/\d+/) ?? [''])[0]} - CLASSIFICATION`,
          distance, rows,
        });
      } catch (e) { process.stderr.write(`    ! ${s.className} ${s.label}: ${e.message}\n`); }
    }
    process.stderr.write(`    ${races.length} with results\n`);
    if (races.length) out.push({ club: 'crmc', clubName: 'CRMC', eventId: slug, meetingTitle: `CRMC ${venue} ${YEAR}`, venue, races });
  }

  const n = out.reduce((a, e) => a + e.races.length, 0);
  if (!n) { process.stderr.write('\n! no races parsed — not writing\n'); process.exit(1); }
  mkdirSync('data/results', { recursive: true });
  writeFileSync(`data/results/crmc-${YEAR}.json`, JSON.stringify(out, null, 2));
  const rows = out.reduce((a, e) => a + e.races.reduce((b, r) => b + r.rows.length, 0), 0);
  process.stderr.write(`\n✓ data/results/crmc-${YEAR}.json: ${out.length} meeting(s), ${n} races, ${rows} rows\n`);

}
