// Scrape the ACU's permitted-events list — the authoritative record of who is
// actually running meetings in the UK, and so the way to find clubs we've
// missed rather than relying on anyone's recall.
//
//   node scrape/acu.mjs            all disciplines, cached
//   node scrape/acu.mjs --report   print road-race organisers and coverage
//
// The public list is a Sport80 locator behind acu.sport80.com. Its date and
// type filters are ignored on the data endpoint (passing from_date still
// returns 2022 events), so everything is paged and filtered here instead.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://acu.sport80.com/api/public/events/locator/data';
const UA = 'uk-race-calendar/0.1 (club racing calendar aggregator; contact via site)';
const CACHE = 'scrape/.cache';
const PER_PAGE = 100;
const DELAY_MS = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(p) {
  mkdirSync(CACHE, { recursive: true });
  const key = join(CACHE, `acu-p${p}.json`);
  if (existsSync(key)) return JSON.parse(readFileSync(key, 'utf8'));
  await sleep(DELAY_MS);
  const res = await fetch(`${BASE}?p=${p}&i=${PER_PAGE}`, {
    headers: { 'user-agent': UA, accept: 'application/json', referer: 'https://acu.sport80.com/public/events' },
  });
  if (!res.ok) throw new Error(`${res.status} on page ${p}`);
  const j = await res.json();
  writeFileSync(key, JSON.stringify(j));
  return j;
}

const infoOf = (item, title) => {
  const f = (item.info ?? []).find((i) => i.title === title);
  const v = f?.value;
  return typeof v === 'string' ? v : v?.text ?? null;
};

// "24th October 2026 - 25th October 2026 - Nr Canterbury, Kent" -> ISO dates
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function dates(subtitle) {
  const out = [];
  for (const m of String(subtitle ?? '').matchAll(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/g)) {
    const mi = MONTHS.indexOf(m[2].toLowerCase());
    if (mi < 0) continue;
    out.push(`${m[3]}-${String(mi + 1).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`);
  }
  return { start: out[0] ?? null, end: out[1] && out[1] !== out[0] ? out[1] : null };
}

const first = await page(0);
const total = Number(first.total);
const pages = Math.ceil(total / PER_PAGE);
process.stderr.write(`ACU permitted events: ${total} across ${pages} pages\n`);

const items = [...first.data];
for (let p = 1; p < pages; p++) {
  if (p % 10 === 0) process.stderr.write(`  page ${p}/${pages}\n`);
  items.push(...(await page(p)).data);
}

const events = items.map((it) => ({
  id: it.id,
  name: it.name,
  type: infoOf(it, 'Type'),
  status: infoOf(it, 'Status'),
  discipline: infoOf(it, 'Road Racing Event Type'),
  organiser: infoOf(it, 'Road Racing Event Organiser'),
  ageGroup: infoOf(it, 'Age Group'),
  address: it.address ?? null,
  ...dates(it.subtitle),
}));
writeFileSync('data/acu-events.json', JSON.stringify(events, null, 2));
process.stderr.write(`✓ data/acu-events.json: ${events.length} events\n`);

if (process.argv.includes('--report')) {
  const { organisers } = await import('../data/organisers.js');
  const { closedClubs, outOfScope } = await import('../data/closed-clubs.js');
  // "Road Racing" is the ACU's umbrella for a lot we don't cover: hillclimbs,
  // straight-line and twisty sprints, drag racing, pocket bikes, and
  // admin-only entries that aren't meetings at all. The discipline field says
  // which is which, so scope is decided on that rather than club by club —
  // it's accurate, and it stays right as clubs change what they run.
  const IN_SCOPE = /Short Circuit|Street Circuit|British Championship|International/i;
  const rr = events.filter((e) => /Road Racing/i.test(e.type ?? '') && IN_SCOPE.test(e.discipline ?? ''));
  const dropped = events.filter((e) => /Road Racing/i.test(e.type ?? '') && !IN_SCOPE.test(e.discipline ?? ''));
  const why = {};
  for (const e of dropped) {
    const d = (e.discipline ?? 'unstated').replace(/^Road Racing - /, '').replace(/ - .*$/, '');
    why[d] = (why[d] ?? 0) + 1;
  }
  // Matching on squashed substrings is wrong: "ng" appears inside
  // "andreasracingassociation". Compare significant word tokens instead, and
  // carry explicit aliases for names that share no words at all (BMCRC/BEMSEE).
  const NOISE = new Set(['ltd', 'limited', 'club', 'the', 'and', 'motor', 'motorcycle', 'cycle',
    'racing', 'race', 'road', 'association', 'association.', 'mcc', 'mc', 'lbg', 'district']);
  const toks = (s) => new Set((s ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !NOISE.has(w)));
  const ALIAS = {
    bemsee: ['bmcrc'], ng: ['ngroadracing'], emra: ['eastmidland', 'eastmidlands'],
    'darley-moor': ['darleymoor'], crmc: ['classicracingmotorcycle'],
    bhr: ['britishhistoric', 'bhrc'], 'southern-100': ['southern100'], 'no-limits': ['nolimits'],
  };
  const known = organisers.map((o) => ({
    ...o, t: toks(`${o.name} ${o.short ?? ''}`),
    alias: (ALIAS[o.id] ?? []).map((a) => a.toLowerCase()),
  }));
  const byOrg = new Map();
  for (const e of rr) {
    const k = e.organiser ?? '(not stated)';
    if (!byOrg.has(k)) byOrg.set(k, []);
    byOrg.get(k).push(e);
  }
  const rows = [...byOrg].map(([name, evs]) => {
    const nt = toks(name);
    const squashed = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Score every candidate and take the best, rather than the first that
    // happens to share a word: "british" is long but appears in several club
    // names, so on its own it means nothing.
    const VAGUE = new Set(['british', 'classic', 'national', 'vintage', 'modern', 'series', 'historic', 'mini', 'bikes']);
    const scored = known.map((k) => {
      if (k.alias.some((a) => squashed.includes(a))) return { k, score: 100 };
      const shared = [...nt].filter((w) => k.t.has(w));
      const strong = shared.filter((w) => !VAGUE.has(w));
      let score = 0;
      if (strong.length >= 2) score = 10 + strong.length;
      else if (strong.length === 1 && strong[0].length >= 5) score = 5;
      else if (shared.length >= 2 && strong.length >= 1) score = 3;
      return { k, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    const match = scored[0]?.k;
    const years = [...new Set(evs.map((e) => (e.start ?? '').slice(0, 4)).filter(Boolean))].sort();
    const low = name.toLowerCase();
    const closed = closedClubs.find((c) => c.match.some((f) => low.includes(f)));
    const oos = outOfScope.find((c) => c.match.some((f) => low.includes(f)));
    return { name, count: evs.length, years, have: match?.short ?? match?.name ?? null,
      closed: closed?.name ?? null, oos: oos?.why ?? null };
  }).sort((a, b) => b.count - a.count);

  const gaps = rows.filter((r) => !r.have && !r.closed && !r.oos);
  console.error(`\nRoad race meetings in scope: ${rr.length} of ${rr.length + dropped.length}`);
  console.error(`Excluded by discipline: ${Object.entries(why).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.error(`Organisers: ${rows.length} \u2014 ${rows.filter((r) => r.have).length} covered, ` +
    `${rows.filter((r) => r.closed).length} closed, ${rows.filter((r) => r.oos).length} out of scope, ` +
    `${gaps.length} to get\n`);
  console.error('TO GET, biggest first: ' + gaps.slice(0, 8).map((g) => `${g.name.split(/ (?:Ltd|Club|LBG)/)[0]} (${g.count})`).join(', ') + '\n');
  console.error('ORGANISER'.padEnd(46) + 'EVENTS  YEARS'.padEnd(22) + 'IN OUR LIST');
  for (const r of rows) {
    console.error('  ' + r.name.slice(0, 43).padEnd(44) + String(r.count).padStart(4) + '  ' +
      (r.years.join(',') || '?').padEnd(20) +
      (r.have ?? (r.closed ? 'closed down' : r.oos ? `out of scope (${r.oos})` : '— TO GET')));
  }
}
