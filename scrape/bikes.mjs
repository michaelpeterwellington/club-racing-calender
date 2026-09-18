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

const MAKES = {
  KAWASAKI: ['KAWASAKI', 'KWAK'], YAMAHA: ['YAMAHA', 'YAM'], HONDA: ['HONDA'],
  SUZUKI: ['SUZUKI', 'SUZ'], DUCATI: ['DUCATI', 'DUCATTI'], TRIUMPH: ['TRIUMPH'],
  APRILIA: ['APRILIA'], BMW: ['BMW'], KTM: ['KTM'], MZ: ['MZ'], NORTON: ['NORTON'],
  MATCHLESS: ['MATCHLESS'], AJS: ['AJS'], BSA: ['BSA'], MOTOGUZZI: ['MOTO', 'GUZZI'],
  PATON: ['PATON'], SEELEY: ['SEELEY'], HARRIS: ['HARRIS'], LCR: ['LCR'], BAKER: ['BAKER'],
};
const MAKE_OF = {};
for (const [canon, alts] of Object.entries(MAKES)) for (const a of alts) MAKE_OF[a] = canon;

// "NINJA400" -> "NINJA 400"; drops noise so variants land together.
export function normaliseBike(raw) {
  if (!raw) return null;
  let s = raw.toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  s = s.replace(/([A-Z])(\d)/g, '$1 $2').replace(/(\d)([A-Z])/g, '$1 $2').replace(/\s+/g, ' ');
  const words = s.split(' ');
  const make = MAKE_OF[words[0]] ?? words[0];
  const model = words.slice(1).filter((w) => !/^(RACING|RACE|CUP|SPEC|BIKE|MOTORCYCLE)$/.test(w)).join(' ').trim();
  if (!make || make.length < 2) return null;
  return { make, model, label: model ? `${make} ${model}` : make };
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
        if (!g.has(b.label)) g.set(b.label, { make: b.make, model: b.model, riders: new Set(), laps: [] });
        const e = g.get(b.label);
        e.riders.add(r.name);
        if (sec) e.laps.push(sec);
        if (!overall.has(b.label)) overall.set(b.label, { make: b.make, model: b.model, riders: new Set(), races: 0, classes: new Set() });
        const o = overall.get(b.label);
        o.riders.add(r.name); o.races++; o.classes.add(`${ev.club}|${race.className}`);
      }
    }
  }
}

// Per group, keep bikes with a real presence; a single entry proves nothing.
const byGroup = {};
for (const [key, bikes] of groups) {
  const list = [...bikes].map(([label, e]) => ({
    label, riders: e.riders.size, entries: e.laps.length,
    bestLap: e.laps.length ? fmt(Math.min(...e.laps)) : null,
    typicalLap: e.laps.length ? fmt(median(e.laps)) : null,
  })).filter((b) => b.riders >= 2).sort((a, b) => b.riders - a.riders);
  if (list.length) byGroup[key] = list;
}

const index = [...overall].map(([label, o]) => ({
  label, make: o.make, model: o.model, riders: o.riders.size, entries: o.races,
  classes: [...o.classes].map((c) => ({ club: c.split('|')[0], className: c.split('|')[1] })),
})).filter((b) => b.riders >= 3).sort((a, b) => b.riders - a.riders);

writeFileSync('data/bikes.json', JSON.stringify({ index, byGroup }, null, 2));
console.error(`✓ data/bikes.json: ${index.length} bikes (3+ riders), ${Object.keys(byGroup).length} circuit/class groups`);
console.error(`  most raced: ${index.slice(0, 6).map((b) => `${b.label} (${b.riders})`).join(', ')}`);
