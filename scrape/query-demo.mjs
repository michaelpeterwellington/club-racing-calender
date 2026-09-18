// Demo of the two questions: "what can I run?" and "how fast is it?"
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/results/bmcrc-2026.json', 'utf8'));

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const rows = data.flatMap((e) => e.races.map((r) => ({ e, r }))).flatMap(({ e, r }) =>
  r.rows.map((row) => ({ ...row, className: r.className, race: r.race, venue: e.meetingTitle.split(' - ').slice(-2)[0], meeting: e.meetingTitle })));

// 1. bike -> classes riders on that bike actually raced in
export function classesForBike(q) {
  const t = norm(q).split(' ').filter(Boolean);
  const hits = rows.filter((r) => { const b = norm(r.bike); return t.every((w) => b.includes(w)); });
  const by = new Map();
  for (const r of hits) {
    if (!by.has(r.className)) by.set(r.className, { riders: new Set(), bikes: new Set(), n: 0 });
    const g = by.get(r.className); g.riders.add(r.name); g.bikes.add(r.bike); g.n++;
  }
  return [...by].sort((a, b) => b[1].riders.size - a[1].riders.size);
}

// 2. top N in a class at a venue, by best lap
export function topInClass(className, n = 5) {
  const hits = rows.filter((r) => r.className === className && r.best);
  const best = new Map();
  for (const r of hits) {
    const k = r.name;
    const sec = (t) => { const [m, s] = t.includes(':') ? t.split(':') : [0, t]; return +m * 60 + +s; };
    if (!best.has(k) || sec(r.best) < sec(best.get(k).best)) best.set(k, r);
  }
  const sec = (t) => { const [m, s] = t.includes(':') ? t.split(':') : [0, t]; return +m * 60 + +s; };
  return [...best.values()].sort((a, b) => sec(a.best) - sec(b.best)).slice(0, n);
}

const bike = process.argv[2] ?? 'Kawasaki Ninja 400';
console.log(`\n"I have a ${bike}" — classes riders on that bike actually raced in:\n`);
const cls = classesForBike(bike);
for (const [name, g] of cls) console.log(`  ${String(g.riders.size).padStart(3)} riders  ${name}`);

if (cls.length) {
  const target = cls[0][0];
  const venue = rows.find((r) => r.className === target)?.venue ?? '';
  console.log(`\nTop 5 by best lap — ${target}\n  BEMSEE @ ${venue}, 2026\n`);
  console.log('   ' + 'RIDER'.padEnd(20) + 'BEST LAP   BIKE');
  topInClass(target).forEach((r, i) =>
    console.log(`  ${i + 1}. ${r.name.padEnd(20)}${r.best.padEnd(11)}${r.bike}`));
}
