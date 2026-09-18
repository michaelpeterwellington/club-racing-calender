// Turn scraped results into pace benchmarks per circuit / club / class.
//
// Answers: how fast is quick here, what would win, what would podium, and what
// meets the 92.5%-of-the-winner's-speed mark used for a national licence.
//
// IMPORTANT: that 92.5% figure is a SPEED rule measured over a race, not a
// best-lap rule. Converting it to a lap time therefore uses the winner's
// AVERAGE lap (race time / laps) divided by 0.925 — not their best lap. A rider
// comparing their best lap against a threshold derived from a best lap would
// flatter themselves by a second or more. The number of qualifying results and
// which sessions count are ACU matters and are not modelled here.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { circuits } from '../data/circuits.js';
import { layouts } from '../data/layouts.js';

export const toSec = (t) => {
  if (!t) return null;
  const m = String(t).match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  return m ? (Number(m[1] ?? 0) * 60 + Number(m[2])) : null;
};
export const fmt = (s) => {
  if (s == null) return null;
  const m = Math.floor(s / 60), r = s - m * 60;
  return m ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3);
};
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const i = s.length >> 1; return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2; };

// "Brands Hatch Indy" -> { circuit: 'brands-hatch', config: 'Indy' }
const NAMES = circuits.map((c) => ({ id: c.id, name: c.name })).sort((a, b) => b.name.length - a.name.length);
// TSL don't always spell a venue the way the circuit is named.
const ALIASES = { 'donington': 'donington', 'trac mon': 'anglesey', 'brands hatch indy': 'brands-hatch', 'brands hatch gp': 'brands-hatch' };
export function matchVenue(venue) {
  const v = (venue ?? '').trim();
  for (const c of NAMES) {
    const base = c.name.replace(/\s*\(.*\)$/, '');
    if (v.toLowerCase().startsWith(base.toLowerCase())) {
      return { circuit: c.id, config: v.slice(base.length).trim() || null };
    }
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (v.toLowerCase().startsWith(alias)) return { circuit: id, config: v.slice(alias.length).trim() || null };
  }
  return { circuit: null, config: null, raw: v };
}

const SIDECAR = /sidecar/i;

// Find a known circuit inside a free-text meeting title.
export function venueFromTitle(title) {
  const t = (title ?? '').toLowerCase();
  for (const c of NAMES) {
    const base = c.name.replace(/\s*\(.*\)$/, '').toLowerCase();
    const i = t.indexOf(base);
    if (i > -1) return (title ?? '').slice(i, i + base.length);
  }
  return null;
}

export function analyse() {
  const groups = new Map();   // circuit|config|club|className -> stats accumulator
  const unmatched = new Set();
  const needLayout = new Set();

  for (const f of readdirSync('data/results').filter((f) => f.endsWith('.json'))) {
    for (const ev of JSON.parse(readFileSync(`data/results/${f}`, 'utf8'))) {
      for (const race of ev.races) {
        if (SIDECAR.test(race.className)) continue;                // solos only
        if (!race.className.trim()) continue;   // a group with no class name is not usable
        // The PDF names its venue after an '@', but combined books don't, so
        // fall back to finding a circuit name in the TSL event title.
        let venue = (race.meeting.split('@')[1] ?? '').trim();
        if (!venue || !matchVenue(venue).circuit) venue = venueFromTitle(ev.meetingTitle) ?? venue;
        const m = matchVenue(venue);
        const circuit = m.circuit;
        if (!circuit) { if (venue) unmatched.add(venue); continue; }
        // Layout must be part of the group's identity. Lap times from different
        // layouts of the same venue are not comparable and must never pool.
        const config = m.config ?? layouts[`${ev.club}|${venue}`] ?? null;
        const known = Boolean(m.config || layouts[`${ev.club}|${venue}`]);
        // Only an ambiguity where the venue actually runs several layouts.
        const multi = (circuits.find((c) => c.id === circuit)?.layouts ?? []).length > 1;
        if (!known && multi) needLayout.add(`${ev.club}|${venue}`);

        const rows = race.rows.filter((r) => r.best && toSec(r.best));
        if (rows.length < 3) continue;
        const classKey = race.className.toUpperCase().replace(/\s+/g, ' ').trim();
        const key = `${circuit}|${config ?? '?'}|${ev.club}|${classKey}`;
        if (!groups.has(key)) groups.set(key, {
          circuit, config, layoutKnown: known || !multi, club: ev.club, clubName: ev.clubName, className: race.className,
          meetings: new Set(), riders: new Set(), races: 0, names: new Map(),
          winnerBest: [], p3Best: [], fieldSizes: [], nationalLap: [], nationalMph: [], allLaps: [], avgToBest: [],
        });
        const g = groups.get(key);
        g.names.set(race.className, (g.names.get(race.className) ?? 0) + 1);
        g.meetings.add(ev.meetingTitle);
        g.races++;
        for (const r of rows) {
          g.riders.add(r.name);
          g.allLaps.push({ sec: toSec(r.best), name: r.name, bike: r.bike });
          // How much slower a rider's race average is than their best lap. The
          // national mark is an average-speed rule, so a rider holding their
          // best lap for a whole race is a fiction; this ratio makes the
          // comparison honest.
          const avg = r.time && r.laps ? toSec(r.time) / r.laps : null;
          if (avg && toSec(r.best) && r.laps >= 4) g.avgToBest.push(avg / toSec(r.best));
        }
        g.fieldSizes.push(race.rows.length);

        const byPos = [...race.rows].sort((a, b) => a.pos - b.pos);
        const win = byPos[0], p3 = byPos[2];
        if (win?.best) g.winnerBest.push(toSec(win.best));
        if (p3?.best) g.p3Best.push(toSec(p3.best));
        // 92.5% of the winner's race average speed, expressed as an average lap
        if (win?.time && win?.laps) g.nationalLap.push((toSec(win.time) / win.laps) / 0.925);
        if (win?.mph) g.nationalMph.push(win.mph * 0.925);
      }
    }
  }

  const out = [];
  for (const g of groups.values()) {
    g.allLaps.sort((a, b) => a.sec - b.sec);
    out.push({
      circuit: g.circuit, config: g.config, layoutKnown: g.layoutKnown, club: g.club, clubName: g.clubName,
      // display the spelling used most often across that class's sheets
      className: [...g.names].sort((a, b) => b[1] - a[1])[0]?.[0] ?? g.className,
      meetings: g.meetings.size, races: g.races, riders: g.riders.size,
      typicalField: Math.round(median(g.fieldSizes) ?? 0),
      fastestLap: fmt(g.allLaps[0]?.sec), fastestBy: g.allLaps[0]?.name ?? null,
      winningLap: fmt(median(g.winnerBest)),
      podiumLap: fmt(median(g.p3Best)),
      midfieldLap: fmt(median(g.allLaps.map((l) => l.sec))),
      nationalLap: fmt(median(g.nationalLap)),
      nationalMph: median(g.nationalMph) ? Number(median(g.nationalMph).toFixed(2)) : null,
      avgToBest: median(g.avgToBest) ? Number(median(g.avgToBest).toFixed(4)) : null,
    });
  }
  out.sort((a, b) => a.circuit.localeCompare(b.circuit) || a.club.localeCompare(b.club) || a.className.localeCompare(b.className));
  return { pace: out, unmatched: [...unmatched], needLayout: [...needLayout] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pace, unmatched, needLayout } = analyse();
  mkdirSync('data', { recursive: true });
  writeFileSync('data/pace.json', JSON.stringify(pace, null, 2));
  console.error(`✓ data/pace.json: ${pace.length} circuit/club/class groups`);
  if (unmatched.length) console.error(`  ! venues not matched to a circuit: ${unmatched.join(', ')}`);
  if (needLayout.length) {
    console.error(`  ! layout unconfirmed for ${needLayout.length} club/venue pair(s) \u2014 add to data/layouts.js:`);
    for (const k of needLayout) console.error(`      '${k}': '?',`);
  }
}
