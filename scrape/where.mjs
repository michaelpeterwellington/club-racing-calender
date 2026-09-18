// "Where would I finish?" — the question behind what club can I win at, what is
// podium pace here, and what would earn a national licence signature.
//
//   node scrape/where.mjs cadwell 1:38.5
//   node scrape/where.mjs --national 55.0      (all circuits, national mark only)
import { readFileSync } from 'node:fs';
import { toSec, fmt } from './analyse.mjs';
import { circuits } from '../data/circuits.js';

const pace = JSON.parse(readFileSync('data/pace.json', 'utf8'));
const CNAME = Object.fromEntries(circuits.map((c) => [c.id, c.name]));
const args = process.argv.slice(2);
const nationalOnly = args.includes('--national');
const [circuit, lapArg] = nationalOnly ? [null, args[args.indexOf('--national') + 1]] : args;
const you = toSec(lapArg);

if (!you) {
  console.error('usage: node scrape/where.mjs <circuit-id> <your best lap, e.g. 1:38.5>');
  console.error('       node scrape/where.mjs --national <your best lap>');
  console.error('\ncircuits with data: ' + [...new Set(pace.map((p) => p.circuit))].join(', '));
  process.exit(1);
}

const rows = pace.filter((p) => !circuit || p.circuit === circuit);
if (!rows.length) { console.error(`No results data for "${circuit}".`); process.exit(1); }

const d = (a, b) => (a == null || b == null ? null : a - b);
const sign = (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));

function verdict(p) {
  const win = toSec(p.winningLap), pod = toSec(p.podiumLap), mid = toSec(p.midfieldLap);
  if (win && you <= win) return ['WIN', `by ${(win - you).toFixed(2)}s`];
  if (pod && you <= pod) return ['PODIUM', `${sign(d(you, win))}s off the win`];
  if (mid && you <= mid) return ['TOP HALF', `${sign(d(you, win))}s off the win`];
  return ['—', `${sign(d(you, win))}s off the win`];
}

// The national mark is a race-average rule, so project your best lap into a
// realistic race average using the ratio observed in that class.
function national(p) {
  const nat = toSec(p.nationalLap);
  if (!nat) return null;
  const projected = you * (p.avgToBest ?? 1.015);
  return { nat, projected, ok: projected <= nat, margin: nat - projected };
}

console.log(`\nYour best lap: ${fmt(you)}${circuit ? `  at ${CNAME[circuit] ?? circuit}` : '  (all circuits)'}`);
console.log(`Projected race average uses each class's own best-to-average ratio.\n`);

const order = rows.slice().sort((a, b) => (toSec(a.winningLap) ?? 1e9) - (toSec(b.winningLap) ?? 1e9));
const w = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
console.log(w('CLUB', 16) + w('CLASS', 38) + w('FLD', 5) + w('WIN', 9) + w('PODIUM', 9) + w('NAT MARK', 10) + w('RESULT', 16) + 'NATIONAL');
console.log('-'.repeat(122));
for (const p of order) {
  const [v, note] = verdict(p);
  const n = national(p);
  const natCol = n ? (n.ok ? `yes, ${n.margin.toFixed(2)}s spare` : `no, need ${(-n.margin).toFixed(2)}s`) : '-';
  console.log(w(p.clubName, 16) + w(p.className, 38) + w(p.typicalField, 5) +
    w(p.winningLap, 9) + w(p.podiumLap, 9) + w(p.nationalLap, 10) + w(`${v} ${v === 'WIN' ? note : ''}`.trim(), 16) + natCol);
}
if (!nationalOnly) {
  const wins = order.filter((p) => verdict(p)[0] === 'WIN');
  console.log(`\n${wins.length} class(es) you'd have won${circuit ? ` at ${CNAME[circuit] ?? circuit}` : ''}, of ${order.length} with data.`);
}
