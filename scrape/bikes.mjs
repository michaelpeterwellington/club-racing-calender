// Build a bike index from scraped results.
//
// The point: nobody should have to encode each club's eligibility regulations.
// The results already say which bikes actually raced in which classes, and that
// is both more honest and self-maintaining. A rider picks their bike and gets
// the classes riders on that bike really enter, plus how quick those specific
// riders were at that circuit — a far better benchmark than a class-wide one,
// because a class often spans very different machinery.
//
// Bike strings are free text ("NINJA400", "NINJA 400", "EX400"), so they are
// normalised, not perfectly resolved. Over-merging would be worse than a few
// near-duplicates, so only obvious variants are joined.
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

// Canonical identity is make + capacity, because that is what decides what a
// bike can race. "Honda 500" and "Honda CB500" are the same machine and must
// group together; "R6" is a 600 even though the only digit in it is a 6.
export function normaliseBike(raw) {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  const words = s.split(' ');
  const make = MAKE_OF[words[0]] ?? words[0];
  if (!make || make.length < 2) return null;

  const rest = words.slice(1).filter((w) => !/^(RACING|RACE|CUP|SPEC|BIKE|MOTORCYCLE|MOTO)$/.test(w));
  const model = rest.join(' ');

  // 1. an explicit, plausible capacity anywhere in the string
  let cc = null;
  for (const w of rest) {
    const n = Number(w);
    if (Number.isFinite(n) && n >= 49 && n <= 1400) { cc = n; break; }
  }
  // 2. otherwise a designator that encodes it ("R6", "ZX6R", "CB500")
  if (cc == null) {
    const squashed = rest.join('');
    const keys = Object.keys(capacityOf).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (rest.includes(k)) { cc = capacityOf[k]; break; }          // whole token
      const i = squashed.indexOf(k);
      // Only at a token boundary: "ER6" must not match the "R6" rule.
      if (i === 0 || (i > 0 && /\d/.test(squashed[i - 1]))) { cc = capacityOf[k]; break; }
    }
  }
  // 3. a designator glued to a number, e.g. "CBR600RR"
  if (cc == null) {
    const m = rest.join('').match(/(\d{3,4})/);
    const n = m ? Number(m[1]) : null;
    if (n && n >= 49 && n <= 1400) cc = n;
  }

  const family = (rest.find((w) => /^[A-Z]{2,}/.test(w)) ?? '').replace(/\d+/g, '');
  const blocked = dontMerge.find(([mk, c, fam]) => mk === make && c === cc && family.startsWith(fam));
  const key = cc ? `${make}|${cc}${blocked ? '|' + family : ''}` : `${make}|${model || '?'}`;
  return { make, model, cc, key, raw: s };
}

const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const i = s.length >> 1; return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2; };
const SIDECAR = /sidecar/i;

const groups = new Map();   // circuit|config|club|class -> Map(bikeLabel -> stats)
const overall = new Map();  // bikeLabel -> { riders:Set, races:n, classes:Set }

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
      if (multi && !config) continue;   // unknown layout: lap times are not comparable
      const classKey = race.className.toUpperCase().replace(/\s+/g, ' ').trim();
      const key = `${m.circuit}|${config ?? ''}|${ev.club}|${classKey}`;
      if (!groups.has(key)) groups.set(key, new Map());
      const g = groups.get(key);

      for (const r of race.rows) {
        const b = normaliseBike(r.bike);
        if (!b) continue;
        const sec = toSec(r.best);
        if (!g.has(b.key)) g.set(b.key, { make: b.make, cc: b.cc, riders: new Set(), laps: [], forms: new Map() });
        const e = g.get(b.key);
        e.forms.set(b.raw, (e.forms.get(b.raw) ?? 0) + 1);
        e.riders.add(r.name);
        if (sec) e.laps.push(sec);
        if (!overall.has(b.key)) overall.set(b.key, { make: b.make, cc: b.cc, riders: new Set(), races: 0, classes: new Set(), forms: new Map() });
        const o = overall.get(b.key);
        o.forms.set(b.raw, (o.forms.get(b.raw) ?? 0) + 1);
        o.riders.add(r.name); o.races++; o.classes.add(`${ev.club}|${race.className}`);
      }
    }
  }
}

// Per group, keep bikes with a real presence; a single entry proves nothing.
// Prefer the commonest spelling that names a model, so a group of "Honda 500"
// and "Honda CB500" is labelled with the informative one.
function bestLabel(forms, make, cc) {
  const ranked = [...forms].sort((a, b) => b[1] - a[1]);
  const named = ranked.filter(([f]) => /[A-Z]{2,}/.test(f.replace(make, '').trim()));
  const pick = (named[0] ?? ranked[0])?.[0] ?? make;
  return pick.replace(/\s+/g, ' ').trim() + (cc && !pick.includes(String(cc)) ? ` ${cc}` : '');
}

const byGroup = {};
for (const [key, bikes] of groups) {
  const list = [...bikes].map(([, e]) => ({
    label: bestLabel(e.forms, e.make, e.cc), riders: e.riders.size, entries: e.laps.length,
    bestLap: e.laps.length ? fmt(Math.min(...e.laps)) : null,
    typicalLap: e.laps.length ? fmt(median(e.laps)) : null,
  })).filter((b) => b.riders >= 2).sort((a, b) => b.riders - a.riders);
  if (list.length) byGroup[key] = list;
}

const index = [...overall].map(([key, o]) => ({
  label: bestLabel(o.forms, o.make, o.cc), key, make: o.make, cc: o.cc, riders: o.riders.size, entries: o.races,
  spellings: [...o.forms].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => `${f} (${n})`),
  classes: [...o.classes].map((c) => ({ club: c.split('|')[0], className: c.split('|')[1] })),
})).filter((b) => b.riders >= 3).sort((a, b) => b.riders - a.riders);

writeFileSync('data/bikes.json', JSON.stringify({ index, byGroup }, null, 2));
console.error(`✓ data/bikes.json: ${index.length} bikes (3+ riders), ${Object.keys(byGroup).length} circuit/class groups`);
console.error(`  most raced: ${index.slice(0, 6).map((b) => `${b.label} (${b.riders})`).join(', ')}`);
if (process.argv.includes('--review')) {
  console.error('\n--- how entries are being grouped (edit data/bike-aliases.js to correct) ---');
  for (const b of index.slice(0, 30)) console.error(`  ${b.label.padEnd(22)} ${String(b.riders).padStart(3)} riders  <- ${b.spellings.join(', ')}`);
}
