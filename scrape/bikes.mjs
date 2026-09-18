// Build a bike index from scraped results.
//
// Eligibility is derived from what riders actually entered rather than from
// each club's regulations, which change yearly and could never be
// authoritative here. A rider picks their bike and gets the classes riders on
// that bike really enter, plus how quick those specific riders were.
//
// Identity is make + capacity, because that is what decides what you can race.
// Bike strings are free text, so they are normalised, not perfectly resolved;
// over-merging is worse than a few near-duplicates.
//
// Many entries state no capacity at all — "Honda CB", "Suzuki GSXR" — which
// would otherwise sit in the picker as separate, useless options next to the
// real ones. Those capacities are inferred from what riders on the same make
// and model family ran, preferring evidence from the same class, and only
// where one capacity clearly dominates.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { toSec, fmt, matchVenue, venueFromTitle } from './analyse.mjs';
import { layouts } from '../data/layouts.js';
import { circuits } from '../data/circuits.js';
import { capacityOf, dontMerge } from '../data/bike-aliases.js';

const MAKES = {
  KAWASAKI: ['KAWASAKI', 'KWAK'], YAMAHA: ['YAMAHA', 'YAM'], HONDA: ['HONDA'],
  SUZUKI: ['SUZUKI', 'SUZ'], DUCATI: ['DUCATI', 'DUCATTI'], TRIUMPH: ['TRIUMPH'],
  APRILIA: ['APRILIA'], BMW: ['BMW'], KTM: ['KTM'], MZ: ['MZ'], NORTON: ['NORTON'],
  MATCHLESS: ['MATCHLESS'], AJS: ['AJS'], BSA: ['BSA'], MOTOGUZZI: ['MOTO', 'GUZZI'],
  PATON: ['PATON'], SEELEY: ['SEELEY'], HARRIS: ['HARRIS'], LCR: ['LCR'], BAKER: ['BAKER'],
};
const MAKE_OF = {};
for (const [canon, alts] of Object.entries(MAKES)) for (const a of alts) MAKE_OF[a] = canon;

export function normaliseBike(raw) {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  const words = s.split(' ');
  const make = MAKE_OF[words[0]] ?? words[0];
  if (!make || make.length < 2) return null;

  const rest = words.slice(1).filter((w) => !/^(RACING|RACE|CUP|SPEC|BIKE|MOTORCYCLE|MOTO)$/.test(w));
  const model = rest.join(' ');

  let cc = null;
  for (const w of rest) {
    const n = Number(w);
    if (Number.isFinite(n) && n >= 49 && n <= 1400) { cc = n; break; }
  }
  if (cc == null) {
    const squashed = rest.join('');
    for (const k of Object.keys(capacityOf).sort((a, b) => b.length - a.length)) {
      if (rest.includes(k)) { cc = capacityOf[k]; break; }
      const i = squashed.indexOf(k);
      if (i === 0 || (i > 0 && /\d/.test(squashed[i - 1]))) { cc = capacityOf[k]; break; }
    }
  }
  if (cc == null) {
    const m = rest.join('').match(/(\d{3,4})/);
    const n = m ? Number(m[1]) : null;
    if (n && n >= 49 && n <= 1400) cc = n;
  }

  // Model family = the leading letters of the first token containing any:
  // CB500 -> CB, GSXR1000 -> GSXR, CBR600RR -> CBR. Matching only whole
  // alphabetic tokens missed every entry that glued the capacity on, which is
  // most of them, and skewed the inference pools badly.
  const famTok = rest.find((w) => /[A-Z]{2,}/.test(w)) ?? '';
  const family = (famTok.match(/^([A-Z]+)/) ?? [, ''])[1];
  return { make, model, cc, family, raw: s };
}

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const i = s.length >> 1; return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2; };
const SIDECAR = /sidecar/i;

/* ---------- pass 1: flatten every row with its context ---------- */
const records = [];
for (const f of readdirSync('data/results').filter((f) => f.endsWith('.json'))) {
  for (const ev of JSON.parse(readFileSync(`data/results/${f}`, 'utf8'))) {
    for (const race of ev.races) {
      if (SIDECAR.test(race.className) || !race.className.trim()) continue;
      let venue = (race.meeting.split('@')[1] ?? '').trim();
      if (!venue || !matchVenue(venue).circuit) venue = venueFromTitle(ev.meetingTitle) ?? venue;
      const m = matchVenue(venue);
      if (!m.circuit) continue;
      const config = m.config ?? layouts[`${ev.club}|${venue}`] ?? null;
      const multi = (circuits.find((c) => c.id === m.circuit)?.layouts ?? []).length > 1;
      if (multi && !config) continue;
      const classKey = race.className.toUpperCase().replace(/\s+/g, ' ').trim();
      for (const r of race.rows) {
        const b = normaliseBike(r.bike);
        if (!b) continue;
        records.push({ ...b, name: r.name, sec: toSec(r.best),
          group: `${m.circuit}|${config ?? ''}|${ev.club}|${classKey}`, classKey });
      }
    }
  }
}

/* ---------- pass 2: infer the missing capacities ---------- */
// Count capacities per (make, family), globally and within each class, using
// only the entries that stated one.
const tally = (key, map, cc) => {
  if (!map.has(key)) map.set(key, new Map());
  const m = map.get(key);
  m.set(cc, (m.get(cc) ?? 0) + 1);
};
const byFamily = new Map(), byClassFamily = new Map();
for (const r of records) {
  if (!r.cc || !r.family) continue;
  tally(`${r.make}|${r.family}`, byFamily, r.cc);
  tally(`${r.classKey}|${r.make}|${r.family}`, byClassFamily, r.cc);
}
const MIN_SAMPLES = 8, MIN_SHARE = 0.75;
function dominant(map, key) {
  const m = map.get(key);
  if (!m) return null;
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  if (total < MIN_SAMPLES) return null;
  const [cc, n] = [...m].sort((a, b) => b[1] - a[1])[0];
  return n / total >= MIN_SHARE ? { cc, share: n / total, total } : null;
}

const inferences = new Map();
let inferred = 0;
for (const r of records) {
  if (r.cc || !r.family) continue;
  // The same class is the stronger signal: a "Honda CB" in Classic 500 is a 500.
  const hit = dominant(byClassFamily, `${r.classKey}|${r.make}|${r.family}`)
           ?? dominant(byFamily, `${r.make}|${r.family}`);
  if (!hit) continue;
  r.cc = hit.cc;
  r.inferredCc = true;
  inferred++;
  const k = `${r.make} ${r.family}`;
  if (!inferences.has(k)) inferences.set(k, { cc: hit.cc, share: hit.share, from: hit.total, rows: 0 });
  inferences.get(k).rows++;
}

/* ---------- pass 3: aggregate ---------- */
const keyOf = (r) => {
  const blocked = dontMerge.find(([mk, c, fam]) => mk === r.make && c === r.cc && r.family.startsWith(fam));
  return r.cc ? `${r.make}|${r.cc}${blocked ? '|' + r.family : ''}` : `${r.make}|${r.model || '?'}`;
};

const groups = new Map(), overall = new Map();
for (const r of records) {
  const bk = keyOf(r);
  if (!groups.has(r.group)) groups.set(r.group, new Map());
  const g = groups.get(r.group);
  if (!g.has(bk)) g.set(bk, { make: r.make, cc: r.cc, riders: new Set(), laps: [], forms: new Map() });
  const e = g.get(bk);
  e.riders.add(r.name);
  if (r.sec) e.laps.push(r.sec);
  if (!r.inferredCc) e.forms.set(r.raw, (e.forms.get(r.raw) ?? 0) + 1);

  if (!overall.has(bk)) overall.set(bk, { make: r.make, cc: r.cc, riders: new Set(), races: 0, forms: new Map(), inferred: 0 });
  const o = overall.get(bk);
  o.riders.add(r.name); o.races++;
  if (r.inferredCc) o.inferred++; else o.forms.set(r.raw, (o.forms.get(r.raw) ?? 0) + 1);
}

// Prefer the commonest spelling that names a model, so a group of "Honda 500"
// and "Honda CB500" is labelled with the informative one.
function bestLabel(forms, make, cc) {
  const ranked = [...forms].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return cc ? `${make} ${cc}` : make;
  const named = ranked.filter(([f]) => /[A-Z]{2,}/.test(f.replace(make, '').trim()));
  const pick = (named[0] ?? ranked[0])[0];
  return pick.replace(/\s+/g, ' ').trim() + (cc && !pick.includes(String(cc)) ? ` ${cc}` : '');
}

// One label per canonical bike, from every spelling seen anywhere.
const LABEL = new Map();
for (const [k, o] of overall) LABEL.set(k, bestLabel(o.forms, o.make, o.cc));

const byGroup = {};
for (const [gk, bikes] of groups) {
  const list = [...bikes].map(([bk, e]) => ({
    key: bk, label: LABEL.get(bk) ?? bestLabel(e.forms, e.make, e.cc),
    riders: e.riders.size, entries: e.laps.length,
    bestLap: e.laps.length ? fmt(Math.min(...e.laps)) : null,
    typicalLap: e.laps.length ? fmt(median(e.laps)) : null,
  })).filter((b) => b.riders >= 2).sort((a, b) => b.riders - a.riders);
  if (list.length) byGroup[gk] = list;
}

const index = [...overall].map(([k, o]) => ({
  label: LABEL.get(k), key: k, make: o.make, cc: o.cc,
  riders: o.riders.size, entries: o.races, inferredEntries: o.inferred,
  spellings: [...o.forms].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => `${f} (${n})`),
})).filter((b) => b.riders >= 3).sort((a, b) => b.riders - a.riders);

writeFileSync('data/bikes.json', JSON.stringify({ index, byGroup }, null, 2));
console.error(`✓ data/bikes.json: ${index.length} bikes (3+ riders), ${Object.keys(byGroup).length} circuit/class groups`);
console.error(`  capacity inferred for ${inferred} of ${records.length} entries (${(100 * inferred / records.length).toFixed(1)}%)`);
console.error(`  bikes with no capacity left: ${index.filter((b) => !b.cc).length}`);

if (process.argv.includes('--review')) {
  console.error('\n--- capacities inferred (edit data/bike-aliases.js to correct) ---');
  for (const [k, v] of [...inferences].sort((a, b) => b[1].rows - a[1].rows).slice(0, 20)) {
    console.error(`  ${k.padEnd(20)} -> ${String(v.cc).padStart(4)}cc   ${v.rows} entries, from ${(100 * v.share).toFixed(0)}% of ${v.from} stated`);
  }
  console.error('\n--- how entries are being grouped ---');
  for (const b of index.slice(0, 20)) console.error(`  ${(b.label ?? '?').padEnd(22)} ${String(b.riders).padStart(3)} riders  <- ${b.spellings.slice(0, 4).join(', ') || '(all inferred)'}`);
}
