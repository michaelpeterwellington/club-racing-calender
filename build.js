import { writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { circuits } from './data/circuits.js';
import { organisers } from './data/organisers.js';
import { championships } from './data/championships.js';
import { meetings } from './data/meetings.js';
import { sponsors, circuitLinks, newsletter } from './data/sponsors.js';
import { SITE } from './site.config.js';

const OUT = 'dist';
const TODAY = new Date().toISOString().slice(0, 10);
const warn = (m) => console.warn('  ! ' + m);

/* ---------- lookups + validation ---------- */
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const C = byId(circuits), O = byId(organisers), S = byId(championships);

for (const m of meetings) {
  if (m.circuit && !C[m.circuit]) warn(`meeting "${m.id}": unknown circuit "${m.circuit}"`);
  if (!O[m.organiser]) warn(`meeting "${m.id}": unknown organiser "${m.organiser}"`);
  for (const c of m.championships ?? []) if (!S[c]) warn(`meeting "${m.id}": unknown championship "${c}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.start)) warn(`meeting "${m.id}": bad start date "${m.start}"`);
  if (m.end && m.end < m.start) warn(`meeting "${m.id}": end before start`);
}
const dupes = meetings.map((m) => m.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) warn(`duplicate meeting ids: ${[...new Set(dupes)].join(', ')}`);

const all = [...meetings].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
const upcoming = all.filter((m) => (m.end ?? m.start) >= TODAY);
const hasExamples = all.some((m) => m.example);

/* ---------- clash detection ----------
   Two meetings clash if their dates overlap and a different club runs each —
   i.e. a rider has to choose. Test days, race schools and cancelled meetings
   are excluded; a club clashing with itself isn't a choice, it's a typo. */
const overlaps = (a, b) => a.start <= (b.end ?? b.start) && b.start <= (a.end ?? a.start);
const clashMap = new Map();
{
  const races = all.filter((m) => (m.kind ?? 'race') === 'race' && m.status !== 'cancelled');
  for (let i = 0; i < races.length; i++) {
    for (let j = i + 1; j < races.length; j++) {
      const a = races[i], b = races[j];
      if (a.organiser === b.organiser || !overlaps(a, b)) continue;
      if (!clashMap.has(a.id)) clashMap.set(a.id, []);
      if (!clashMap.has(b.id)) clashMap.set(b.id, []);
      clashMap.get(a.id).push(b);
      clashMap.get(b.id).push(a);
    }
  }
}
const clashing = all.filter((m) => clashMap.has(m.id));
const upcomingClashes = clashing.filter((m) => (m.end ?? m.start) >= TODAY);

/* ---------- formatting ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (d) => { const [y, m, dd] = d.split('-').map(Number); return { y, m: m - 1, d: dd }; };
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dow = (d) => new Date(d + 'T12:00:00Z').getUTCDay();

// 'Sun' for one day, 'Fri\u2013Sun' for a range. Ranges longer than a week
// (TT, Manx GP) would read as nonsense, so they just get the start day onwards.
function dayLabel(m) {
  if (!m.end || m.end === m.start) return DAY[dow(m.start)];
  const span = (Date.parse(m.end) - Date.parse(m.start)) / 86400000;
  if (span >= 7) return DAY[dow(m.start)] + ' onwards';
  return DAY[dow(m.start)] + '\u2013' + DAY[dow(m.end)];
}
// Every day the meeting covers, so searching 'friday' works.
function daysCovered(m) {
  const out = []; const end = m.end ?? m.start;
  for (let d = m.start; d <= end && out.length < 16; d = plusDay(d)) out.push(DAY_FULL[dow(d)]);
  return out;
}

function dateLabel(m) {
  const a = parts(m.start);
  if (!m.end || m.end === m.start) return { big: String(a.d), small: MON[a.m] };
  const b = parts(m.end);
  return a.m === b.m
    ? { big: `${a.d}\u2013${b.d}`, small: MON[a.m] }
    : { big: `${a.d} ${MON[a.m]}\u2013${b.d}`, small: MON[b.m] };
}
function dateLong(m) {
  const a = parts(m.start);
  if (!m.end || m.end === m.start) return `${DAY[dow(m.start)]} ${a.d} ${MONTH[a.m]} ${a.y}`;
  const b = parts(m.end);
  if (a.m === b.m) return `${a.d}\u2013${b.d} ${MONTH[a.m]} ${a.y}`;
  return `${a.d} ${MONTH[a.m]} \u2013 ${b.d} ${MONTH[b.m]} ${b.y}`;
}
const shortRange = (m) => { const d = dateLabel(m); return `${d.big} ${d.small}`; };
const monthKey = (m) => m.start.slice(0, 7);
const monthName = (k) => { const [y, mo] = k.split('-'); return `${MONTH[+mo - 1]} ${y}`; };

/* ---------- components ---------- */
function entryNote(m) {
  if (m.status === 'cancelled' || m.status === 'full') return '';
  if (!m.entriesOpen) return '';
  if (m.entriesOpen > TODAY) return `Entries open ${dateLong({ start: m.entriesOpen })}`;
  if ((m.end ?? m.start) >= TODAY) return 'Entries open now';
  return '';
}

const KINDS = { test: 'test day', school: 'race school', marshal: 'marshal training' };

function meetingCard(m, { base }) {
  const c = m.circuit ? C[m.circuit] : null, o = O[m.organiser];
  const dl = dateLabel(m);
  const champs = (m.championships ?? []).map((id) => S[id]?.name ?? id);
  const note = entryNote(m);
  const status = m.status ?? 'confirmed';
  const kind = m.kind ?? 'race';
  const venue = c ? esc(c.name) : 'Venue TBC';
  const clash = clashMap.get(m.id) ?? [];
  const search = [c?.name, m.config, o?.name, o?.short, m.name, ...champs, c?.region, KINDS[kind], ...daysCovered(m)].filter(Boolean).join(' ').toLowerCase();
  return `<article class="mtg${m.example ? ' is-example' : ''}" data-search="${esc(search)}" data-circuit="${esc(m.circuit ?? '')}" data-organiser="${esc(m.organiser)}" data-type="${esc(c?.type ?? '')}" data-status="${esc(status)}" data-kind="${esc(kind)}" data-clash="${clash.length ? '1' : '0'}">
  <div class="mtg-date"><b>${esc(dl.big)}</b><span>${esc(dl.small)}</span><em>${esc(dayLabel(m))}</em></div>
  <div class="mtg-main">
    <h3>${c ? `<a href="${base}circuit/${m.circuit}/">${venue}</a>` : venue}${m.config ? `<span class="cfg">${esc(m.config)}</span>` : ''}</h3>
    <p class="mtg-org"><a href="${base}organiser/${m.organiser}/">${esc(o?.short ?? o?.name ?? m.organiser)}</a>${m.round ? ` <span class="sep">\u00b7</span> Round ${esc(m.round)}` : ''}${m.name ? ` <span class="sep">\u00b7</span> ${esc(m.name)}` : ''}</p>
    ${champs.length ? `<p class="mtg-champs">${champs.map((n) => `<span>${esc(n)}</span>`).join('')}</p>` : ''}
    ${m.notes ? `<p class="mtg-notes">${esc(m.notes)}</p>` : ''}
    ${clash.length ? `<p class="mtg-clash"><b>Clashes with</b> ${clash.map((x) => `<a href="${base}organiser/${x.organiser}/">${esc(O[x.organiser]?.short ?? x.organiser)}</a> at ${esc(x.circuit ? C[x.circuit].name : 'venue TBC')}${x.config ? ' ' + esc(x.config) : ''} <span class="nowrap">(${esc(shortRange(x))})</span>`).join(', ')}</p>` : ''}
  </div>
  <div class="mtg-side">
    ${kind !== 'race' ? `<span class="badge badge--kind">${esc(KINDS[kind])}</span>` : ''}
    ${status !== 'confirmed' ? `<span class="badge badge--${esc(status)}">${esc(status)}</span>` : ''}
    ${c?.type === 'road' ? '<span class="badge badge--road">roads</span>' : ''}
    ${note ? `<span class="entries">${esc(note)}</span>` : ''}
    ${m.entryUrl ? `<a class="btn js-out" href="${esc(m.entryUrl)}" rel="noopener">Enter</a>` : ''}
    ${m.resultsUrl ? `<a class="btn btn--ghost js-out" href="${esc(m.resultsUrl)}" rel="noopener">Results</a>` : ''}
  </div>
</article>`;
}

function monthList(list, { base }) {
  if (!list.length) return `<p class="empty">No meetings in the calendar yet. Add them in <code>data/meetings.js</code>.</p>`;
  const groups = [];
  for (const m of list) {
    const k = monthKey(m);
    if (!groups.length || groups.at(-1).k !== k) groups.push({ k, items: [] });
    groups.at(-1).items.push(m);
  }
  const inline = sponsors.filter((s) => s.slot === 'inline');
  return groups.map((g, i) => `<section class="month" data-month="${g.k}">
  <h2 id="m-${g.k}">${esc(monthName(g.k))}</h2>
  ${g.items.map((m) => meetingCard(m, { base })).join('\n')}
</section>${inline[i] ? adBlock(inline[i]) : ''}`).join('\n');
}

function adBlock(s) {
  if (!s) return '';
  const rel = s.sponsored ? ' rel="sponsored nofollow noopener"' : ' rel="noopener"';
  return `<aside class="promo">
  ${s.sponsored ? '<span class="promo-tag">Ad</span>' : ''}
  <a href="${esc(s.url)}"${rel} class="js-out"><b>${esc(s.title)}</b>${s.body ? `<span>${esc(s.body)}</span>` : ''}</a>
</aside>`;
}
const adSlot = (slot) => sponsors.filter((s) => s.slot === slot).map(adBlock).join('\n');

function newsletterBlock() {
  if (!newsletter.action) return '';
  return `<section class="signup">
  <h2>Weekly email</h2>
  <p>${esc(newsletter.pitch)}</p>
  <form action="${esc(newsletter.action)}" method="post">
    <label class="vh" for="nl-email">Email address</label>
    <input id="nl-email" type="email" name="email" placeholder="you@example.com" required>
    <button type="submit">Subscribe</button>
  </form>
</section>`;
}

/* ---------- page shell ---------- */
function layout({ title, description, body, base, canonical, jsonld = [], wide = false }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${esc(SITE.url + canonical)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${base}style.css">
${jsonld.length ? `<script type="application/ld+json">${JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld)}</script>` : ''}
</head>
<body${wide ? ' class="wide"' : ''}>
<a class="vh" href="#main">Skip to content</a>
<header class="site">
  <div class="wrap">
    <a class="brand" href="${base}">${esc(SITE.name)}</a>
    <nav><a href="${base}clashes/">Clashes</a><a href="${base}feeds/">Calendar feeds</a><a href="${base}about/">About</a></nav>
  </div>
</header>
${hasExamples ? `<div class="warnbar"><div class="wrap">This site is showing <b>example data</b>. Delete the demo rows in <code>data/meetings.js</code>.</div></div>` : ''}
${adSlot('top') ? `<div class="wrap">${adSlot('top')}</div>` : ''}
<main id="main" class="wrap">
${body}
</main>
${newsletterBlock() ? `<div class="wrap">${newsletterBlock()}</div>` : ''}
<footer class="site">
  <div class="wrap">
    ${adSlot('footer')}
    <p>${esc(SITE.name)} \u2014 an independent listing of UK motorcycle road race meetings. Always check with the organising club before travelling; dates change.</p>
    <p><a href="${base}feeds/">Subscribe by calendar feed</a> \u00b7 <a href="${base}about/">About &amp; corrections</a></p>
  </div>
</footer>
</body>
</html>`;
}

/* ---------- JSON-LD ---------- */
function eventLd(m) {
  const c = m.circuit ? C[m.circuit] : null, o = O[m.organiser];
  const endExclusive = m.end ?? m.start;
  return {
    '@context': 'https://schema.org', '@type': 'SportsEvent',
    name: [m.name, `${o?.short ?? o?.name ?? ''}${c ? ` at ${c.name}${m.config ? ' ' + m.config : ''}` : ''}`].filter(Boolean).join(' \u2014 '),
    startDate: m.start, endDate: endExclusive,
    eventStatus: m.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(c ? { location: { '@type': 'Place', name: c.name, address: { '@type': 'PostalAddress', addressRegion: c.region, addressCountry: 'GB' } } } : {}),
    organizer: o ? { '@type': 'Organization', name: o.name, ...(o.website ? { url: o.website } : {}) } : undefined,
    ...(m.entryUrl ? { url: m.entryUrl } : {}),
  };
}

/* ---------- iCal ---------- */
function fold(line) {
  const b = Buffer.from(line, 'utf8');
  if (b.length <= 73) return line;
  const out = []; let cur = Buffer.alloc(0);
  for (const ch of [...line]) {
    const cb = Buffer.from(ch, 'utf8');
    if (cur.length + cb.length > (out.length ? 72 : 73)) { out.push(cur.toString('utf8')); cur = Buffer.alloc(0); }
    cur = Buffer.concat([cur, cb]);
  }
  out.push(cur.toString('utf8'));
  return out.join('\r\n ');
}
const icsEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const plusDay = (d) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

function ics(list, name) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${SITE.name}//EN`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEsc(name)}`, 'X-PUBLISHED-TTL:PT12H'];
  for (const m of list) {
    if (m.status === 'cancelled') continue;
    const c = m.circuit ? C[m.circuit] : null, o = O[m.organiser];
    const champs = (m.championships ?? []).map((id) => S[id]?.name ?? id);
    const desc = [o?.name, champs.length ? 'Championships: ' + champs.join(', ') : '', m.notes,
      m.entriesOpen ? 'Entries open: ' + m.entriesOpen : '', m.status && m.status !== 'confirmed' ? 'Status: ' + m.status : '']
      .filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT',
      `UID:${m.id}@${SITE.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${m.start.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${plusDay(m.end ?? m.start).replace(/-/g, '')}`,
      fold(`SUMMARY:${icsEsc(`${c ? c.name + (m.config ? ' ' + m.config : '') : 'Venue TBC'} \u2014 ${o?.short ?? o?.name ?? m.organiser}${m.name ? ' (' + m.name + ')' : ''}`)}`),
      fold(`LOCATION:${icsEsc(c ? c.name : '')}`),
      desc ? fold(`DESCRIPTION:${icsEsc(desc)}`) : null,
      m.entryUrl ? fold(`URL:${icsEsc(m.entryUrl)}`) : null,
      'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n') + '\r\n';
}

/* ---------- emit ---------- */
const written = [];
function write(path, content) {
  const full = join(OUT, path);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
  written.push(path);
}
rmSync(OUT, { recursive: true, force: true });

// home
const usedCircuits = circuits.filter((c) => all.some((m) => m.circuit === c.id));
const usedOrgs = organisers.filter((o) => all.some((m) => m.organiser === o.id));
write('index.html', layout({
  title: `${SITE.name} \u2014 UK motorcycle racing calendar`,
  description: 'Every UK motorcycle club and national road race meeting, from every organising club, in one calendar.',
  canonical: '/', base: '', wide: true,
  jsonld: upcoming.slice(0, 60).map(eventLd),
  body: `<div class="hero">
  <h1>UK motorcycle racing calendar</h1>
  <p>Every club and national road race meeting, from every organising club, in one place. ${upcoming.length} upcoming meeting${upcoming.length === 1 ? '' : 's'}${upcomingClashes.length ? `, including <a href="clashes/">${upcomingClashes.length} that clash</a>` : ''}.</p>
</div>
<div class="filters">
  <input type="search" id="q" placeholder="Search circuit, club, series\u2026" aria-label="Search meetings">
  <select id="f-circuit" aria-label="Filter by circuit"><option value="">All circuits</option>${usedCircuits.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>
  <select id="f-org" aria-label="Filter by club"><option value="">All clubs</option>${usedOrgs.map((o) => `<option value="${esc(o.id)}">${esc(o.short ?? o.name)}</option>`).join('')}</select>
  <select id="f-type" aria-label="Filter by circuit type"><option value="">Circuits &amp; roads</option><option value="short">Short circuits</option><option value="road">Road races</option></select>
  <label class="chk"><input type="checkbox" id="f-races"> Race meetings only</label>
  <label class="chk"><input type="checkbox" id="f-clash"> Clashes only</label>
  <button id="reset" type="button">Reset</button>
</div>
<p class="count" id="count" aria-live="polite"></p>
<div id="list">${monthList(upcoming, { base: '' })}</div>
<p class="subscribe"><a href="feeds/">Add this calendar to your phone \u2192</a></p>
<script src="filter.js" defer></script>`,
}));

// circuit pages
for (const c of usedCircuits) {
  const list = all.filter((m) => m.circuit === c.id);
  const up = list.filter((m) => (m.end ?? m.start) >= TODAY);
  const links = circuitLinks[c.id] ?? [];
  write(`circuit/${c.id}/index.html`, layout({
    title: `${c.name} motorcycle race dates \u2014 ${SITE.name}`,
    description: `Motorcycle race meetings at ${c.name}, ${c.region}. ${up.length} upcoming, across every organising club.`,
    canonical: `/circuit/${c.id}/`, base: '../../', jsonld: up.slice(0, 40).map(eventLd),
    body: `<nav class="crumbs"><a href="../../">Calendar</a> <span>/</span> ${esc(c.name)}</nav>
<h1>${esc(c.name)}</h1>
<p class="lede">${esc(c.region)} \u00b7 ${c.type === 'road' ? 'Closed roads course' : 'Short circuit'} \u00b7 ${up.length} upcoming meeting${up.length === 1 ? '' : 's'}</p>
<p class="subscribe"><a href="../../feeds/circuit-${c.id}.ics">Subscribe to ${esc(c.name)} dates (.ics)</a></p>
${links.map((l) => adBlock({ ...l, slot: 'inline' })).join('')}
${monthList(up, { base: '../../' })}
${list.length > up.length ? `<details class="past"><summary>Past meetings (${list.length - up.length})</summary>${monthList(list.filter((m) => (m.end ?? m.start) < TODAY), { base: '../../' })}</details>` : ''}`,
  }));
  write(`feeds/circuit-${c.id}.ics`, ics(list, `${c.name} \u2014 race dates`));
}

// organiser pages
for (const o of usedOrgs) {
  const list = all.filter((m) => m.organiser === o.id);
  const up = list.filter((m) => (m.end ?? m.start) >= TODAY);
  write(`organiser/${o.id}/index.html`, layout({
    title: `${o.name} race calendar \u2014 ${SITE.name}`,
    description: `${o.name} motorcycle race meeting dates. ${up.length} upcoming.`,
    canonical: `/organiser/${o.id}/`, base: '../../', jsonld: up.slice(0, 40).map(eventLd),
    body: `<nav class="crumbs"><a href="../../">Calendar</a> <span>/</span> ${esc(o.short ?? o.name)}</nav>
<h1>${esc(o.name)}</h1>
<p class="lede">${up.length} upcoming meeting${up.length === 1 ? '' : 's'}${o.website ? ` \u00b7 <a href="${esc(o.website)}" rel="noopener" class="js-out">Club website</a>` : ''}</p>
${o.note ? `<p class="clubnote">${esc(o.note)}</p>` : ''}
${(o.results ?? []).length ? `<div class="results-box">
  <h2>Past results</h2>
  <p>See how competitive this club\u2019s grids are before you enter \u2014 grid sizes, lap times and who turns up.</p>
  <ul class="feeds">${o.results.map((r) => `<li><a href="${esc(r.url)}" rel="noopener" class="js-out">${esc(r.provider)}${r.years ? ` <span class="yr">${esc(r.years)}</span>` : ''}${r.note ? ` \u2014 ${esc(r.note)}` : ''}</a></li>`).join('')}</ul>
</div>` : ''}
<p class="subscribe"><a href="../../feeds/organiser-${o.id}.ics">Subscribe to ${esc(o.short ?? o.name)} dates (.ics)</a></p>
${monthList(up, { base: '../../' })}
${list.length > up.length ? `<details class="past"><summary>Past meetings (${list.length - up.length})</summary>${monthList(list.filter((m) => (m.end ?? m.start) < TODAY), { base: '../../' })}</details>` : ''}`,
  }));
  write(`feeds/organiser-${o.id}.ics`, ics(list, `${o.name} \u2014 race dates`));
}

// championship pages
for (const s of championships) {
  const list = all.filter((m) => (m.championships ?? []).includes(s.id));
  if (!list.length) continue;
  const up = list.filter((m) => (m.end ?? m.start) >= TODAY);
  write(`championship/${s.id}/index.html`, layout({
    title: `${s.name} calendar \u2014 ${SITE.name}`,
    description: `${s.name} round dates and host clubs. ${up.length} upcoming.`,
    canonical: `/championship/${s.id}/`, base: '../../', jsonld: up.slice(0, 40).map(eventLd),
    body: `<nav class="crumbs"><a href="../../">Calendar</a> <span>/</span> ${esc(s.name)}</nav>
<h1>${esc(s.name)}</h1>
<p class="lede">${up.length} upcoming round${up.length === 1 ? '' : 's'}, run as part of other clubs\u2019 meetings.</p>
<p class="subscribe"><a href="../../feeds/championship-${s.id}.ics">Subscribe to ${esc(s.name)} rounds (.ics)</a></p>
${monthList(up, { base: '../../' })}`,
  }));
  write(`feeds/championship-${s.id}.ics`, ics(list, `${s.name} \u2014 rounds`));
}

// feeds index
const usedChamps = championships.filter((s) => all.some((m) => (m.championships ?? []).includes(s.id)));
write('feeds/all.ics', ics(all, `${SITE.name} \u2014 all meetings`));
write('feeds/index.html', layout({
  title: `Calendar feeds \u2014 ${SITE.name}`,
  description: 'Subscribe to UK motorcycle race dates in Google Calendar, Apple Calendar or Outlook. Feeds by circuit, club or championship.',
  canonical: '/feeds/', base: '../',
  body: `<nav class="crumbs"><a href="../">Calendar</a> <span>/</span> Feeds</nav>
<h1>Calendar feeds</h1>
<p class="lede">Subscribe once and the dates stay up to date in your phone. In Google Calendar use <em>Other calendars \u2192 From URL</em>; on iPhone use <em>Settings \u2192 Calendar \u2192 Add Subscribed Calendar</em>.</p>
<h2>Everything</h2>
<ul class="feeds"><li><a href="all.ics">All UK race meetings</a></li></ul>
<h2>By circuit</h2>
<ul class="feeds">${usedCircuits.map((c) => `<li><a href="circuit-${c.id}.ics">${esc(c.name)}</a></li>`).join('')}</ul>
<h2>By club</h2>
<ul class="feeds">${usedOrgs.map((o) => `<li><a href="organiser-${o.id}.ics">${esc(o.name)}</a></li>`).join('')}</ul>
${usedChamps.length ? `<h2>By championship</h2>\n<ul class="feeds">${usedChamps.map((s) => `<li><a href="championship-${s.id}.ics">${esc(s.name)}</a></li>`).join('')}</ul>` : ''}`,
}));

// clashes
write('clashes/index.html', layout({
  title: `Date clashes \u2014 ${SITE.name}`,
  description: 'UK motorcycle race meetings that fall on the same weekend as another club\u2019s, so you can plan a season without booking two places at once.',
  canonical: '/clashes/', base: '../', wide: true,
  body: `<nav class="crumbs"><a href="../">Calendar</a> <span>/</span> Clashes</nav>
<h1>Date clashes</h1>
<p class="lede">Weekends where two clubs are running at once, so you have to pick. ${upcomingClashes.length} of ${upcoming.filter((m) => (m.kind ?? 'race') === 'race').length} upcoming race meetings clash with another club\u2019s.</p>
${upcomingClashes.length ? monthList(upcomingClashes, { base: '../' }) : '<p class="empty">No clashes in the calendar. Add more clubs and that will change.</p>'}`,
}));

// about
write('about/index.html', layout({
  title: `About \u2014 ${SITE.name}`,
  description: `What ${SITE.name} is, where the dates come from, and how to send a correction.`,
  canonical: '/about/', base: '../',
  body: `<nav class="crumbs"><a href="../">Calendar</a> <span>/</span> About</nav>
<h1>About</h1>
<p>${esc(SITE.name)} lists motorcycle road race meetings run by UK clubs and national organisers, in one calendar, so you can plan a season without checking twenty websites.</p>
<h2>Where the dates come from</h2>
<p>Dates are taken from the organising clubs\u2019 own published calendars and announcements, and entered by hand. They are checked, but they are not official \u2014 <strong>always confirm with the club before booking travel.</strong> Meetings get moved and cancelled, especially early in the season.</p>
<h2>Corrections</h2>
<p>If a date here is wrong, or your club is missing, ${SITE.contact ? `email <a href="mailto:${esc(SITE.contact)}">${esc(SITE.contact)}</a>` : 'get in touch'} and it will be fixed. Clubs: listings are free and always will be.</p>
<h2>Scope</h2>
<p>Solo tarmac racing \u2014 short circuits and closed roads. No off-road, no sidecars.</p>`,
}));

// sitemap + robots
const pages = written.filter((p) => p.endsWith('index.html')).map((p) => '/' + p.replace(/index\.html$/, ''));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${SITE.url}${p}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

// static assets
for (const f of ['style.css', 'filter.js']) if (existsSync(join('src', f))) cpSync(join('src', f), join(OUT, f));

console.log(`\u2713 built ${written.length + 2} files to ${OUT}/  (${all.length} meetings, ${upcoming.length} upcoming)`);
if (hasExamples) console.log('  ! example data is still present in data/meetings.js');
