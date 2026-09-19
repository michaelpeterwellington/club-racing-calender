import { writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { circuits } from './data/circuits.js';
import { organisers } from './data/organisers.js';
import { championships } from './data/championships.js';
import { meetings } from './data/meetings.js';
import { sponsors, circuitLinks, newsletter, accommodation } from './data/sponsors.js';
import { SITE } from './site.config.js';

// Pace benchmarks from scraped results (scrape/analyse.mjs). Optional: the site
// builds fine without them.
let PACE = [];
try { PACE = JSON.parse(readFileSync('data/pace.json', 'utf8')); }
catch { console.log('  (no data/pace.json \u2014 skipping pace tables)'); }
let BIKES = { index: [], byGroup: {} };
try { BIKES = JSON.parse(readFileSync('data/bikes.json', 'utf8')); } catch {}

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

// Venue codes are no longer printed anywhere, but they still feed the search
// index, so a missing one costs a search term rather than breaking a layout.
// Derive it quietly in that case.
for (const c of circuits) {
  if (!c.short) c.short = c.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

const all = [...meetings].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
const upcoming = all.filter((m) => (m.end ?? m.start) >= TODAY);
// The one the "next race" panel points at, and the one row highlighted in the
// list: the soonest actual race, not a test day or a cancelled meeting.
const nextUp = upcoming.find((m) => (m.kind ?? 'race') === 'race' && m.status !== 'cancelled') ?? null;
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
const fmt = (s) => {
  if (s == null) return null;
  const m = Math.floor(s / 60), r = s - m * 60;
  return m ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3);
};
const toSec = (t) => {
  if (!t) return null;
  const m = String(t).match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  return m ? Number((Number(m[1] ?? 0) * 60 + Number(m[2])).toFixed(3)) : null;
};
const shortRange = (m) => { const d = dateLabel(m); return `${d.big} ${d.small}`; };
const monthKey = (m) => m.start.slice(0, 7);

/* ---------- components ---------- */
const daysUntil = (d) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(TODAY + 'T00:00:00Z')) / 86400000);

function entryNote(m) {
  if (m.status === 'cancelled' || m.status === 'full') return null;
  const past = (m.end ?? m.start) < TODAY;
  // A closing date is the one that costs you a round if you miss it, so it wins.
  if (m.entriesClose && !past) {
    const n = daysUntil(m.entriesClose);
    if (n < 0) return { text: 'Entries closed', urgent: false };
    if (n === 0) return { text: 'Entries close today', urgent: true };
    if (n <= 21) return { text: `Entries close in ${n} day${n === 1 ? '' : 's'}`, urgent: true };
    return { text: `Entries close ${dateLong({ start: m.entriesClose })}`, urgent: false };
  }
  if (!m.entriesOpen || past) return null;
  if (m.entriesOpen > TODAY) return { text: `Entries open ${dateLong({ start: m.entriesOpen })}`, urgent: false };
  return { text: 'Entries open now', urgent: false };
}

const KINDS = { test: 'test day', school: 'race school', marshal: 'marshal training' };

// The one word in the status column. A meeting can be several things at once \u2014
// provisional AND closing on Friday \u2014 so this picks the one a rider would act
// on, and the rest is spelled out when the row is opened.
function statusChip(m, note) {
  const status = m.status ?? 'confirmed';
  if (status === 'cancelled') return { key: 'cancelled', label: 'Cancelled' };
  if (status === 'full') return { key: 'full', label: 'Entries full' };
  if (note?.urgent) return { key: 'open', label: note.text };
  if (status === 'provisional') return { key: 'provisional', label: 'Provisional' };
  if (m.entryUrl && note) return { key: 'open', label: 'Entries open' };
  return { key: 'confirmed', label: 'Confirmed' };
}

// A row, not a card: the calendar reads as one list you scan down a column at a
// time. <details> rather than a click handler so it still opens without JS.
function meetingRow(m, { base, next }) {
  const c = m.circuit ? C[m.circuit] : null, o = O[m.organiser];
  const dl = dateLabel(m);
  const champs = (m.championships ?? []).map((id) => ({ id, name: S[id]?.name ?? id, known: !!S[id] }));
  const note = entryNote(m);
  const status = m.status ?? 'confirmed';
  const kind = m.kind ?? 'race';
  const venue = c ? esc(c.name) : 'Venue TBC';
  const clash = clashMap.get(m.id) ?? [];
  const chip = statusChip(m, note);
  const past = (m.end ?? m.start) < TODAY;
  const club = esc(o?.short ?? o?.name ?? m.organiser);
  const search = [c?.name, c?.short, m.config, o?.name, o?.short, m.name, ...champs.map((x) => x.name), c?.region, KINDS[kind], ...daysCovered(m)].filter(Boolean).join(' ').toLowerCase();
  const sub = [
    kind !== 'race' ? esc(KINDS[kind]) : null,
    m.round ? `Round ${esc(m.round)}` : null,
    m.name ? esc(m.name) : null,
  ].filter(Boolean).join(' <span class="sep">\u00b7</span> ');
  return `<details class="mtg${m.example ? ' is-example' : ''}${past ? ' mtg--past' : ''}${m.id === next ? ' mtg--next' : ''}" data-search="${esc(search)}" data-circuit="${esc(m.circuit ?? '')}" data-organiser="${esc(m.organiser)}" data-type="${esc(c?.type ?? '')}" data-status="${esc(status)}" data-kind="${esc(kind)}" data-clash="${clash.length ? '1' : '0'}">
  <summary>
    <div class="mtg-date"><b>${esc(dl.big)}</b><span>${esc(dl.small)}</span><em>${esc(dayLabel(m))}</em></div>
    <div class="mtg-main">
      <h3>${venue}${m.config ? `<span class="cfg">${esc(m.config)}</span>` : ''}</h3>
      ${sub ? `<span class="mtg-meta">${sub}</span>` : ''}
      ${clash.length || c?.type === 'road' || champs.length ? `<div class="mtg-flags">
        ${clash.length ? '<span class="tag tag--clash">Clash</span>' : ''}
        ${c?.type === 'road' ? '<span class="tag tag--road">Roads</span>' : ''}
        ${champs.map((x) => `<span class="tag">${esc(x.name)}</span>`).join('')}
      </div>` : ''}
    </div>
    <div class="mtg-club">${club}</div>
    <div class="mtg-status">
      <span class="badge badge--${chip.key}">${esc(chip.label)}</span>
      ${note && !note.urgent ? `<span class="entries">${esc(note.text)}</span>` : ''}
    </div>
    <div class="caret" aria-hidden="true">\u25b6</div>
  </summary>
  <div class="mtg-more">
    <div>
      <span class="lbl">Details</span>
      <p class="dl">
        <b>Dates</b> <i>${esc(dateLong(m))}</i><br>
        <b>Venue</b> <i>${venue}${m.config ? ' ' + esc(m.config) : ''}</i><br>
        ${c ? `<b>Region</b> <i>${esc(c.region)}</i><br>` : ''}
        <b>Club</b> <i>${esc(o?.name ?? m.organiser)}</i><br>
        <b>Type</b> <i>${esc(KINDS[kind] ?? 'race meeting')}</i>${note ? `<br><b>Entries</b> <i class="${note.urgent ? 'entries--soon' : ''}">${esc(note.text)}</i>` : ''}
      </p>
    </div>
    ${champs.length ? `<div>
      <span class="lbl">Championships</span>
      <div class="chips">${champs.map((x) => x.known ? `<a href="${base}championship/${x.id}/">${esc(x.name)}</a>` : `<span>${esc(x.name)}</span>`).join('')}</div>
    </div>` : ''}
    <div class="acts">
      ${m.entryUrl && status !== 'cancelled' && status !== 'full' ? `<a class="btn js-out" href="${esc(m.entryUrl)}" rel="noopener">Enter \u2192</a>` : ''}
      ${c ? `<a class="btn btn--ghost" href="${base}circuit/${m.circuit}/">${venue} dates</a>` : ''}
      <a class="btn btn--ghost" href="${base}organiser/${m.organiser}/">${club} calendar</a>
    </div>
    ${m.notes ? `<p class="mtg-notes">${esc(m.notes)}</p>` : ''}
    ${clash.length ? `<p class="mtg-clash"><b>Clashes with</b>${clash.map((x) => `<a href="${base}organiser/${x.organiser}/">${esc(O[x.organiser]?.short ?? x.organiser)}</a> at ${esc(x.circuit ? C[x.circuit].name : 'venue TBC')}${x.config ? ' ' + esc(x.config) : ''} <span class="nowrap">(${esc(shortRange(x))})</span>`).join(', ')}</p>` : ''}
  </div>
</details>`;
}

// The column headings, which only earn their space once the row actually lays
// out in columns \u2014 under 60rem the row stacks and these are hidden by CSS.
const LISTHEAD = `<div class="listhead"><div>Date</div><div>Meeting</div><div>Club</div><div>Status</div><div></div></div>`;

function monthList(list, { base, next = null }) {
  if (!list.length) return `<p class="empty">No meetings in the calendar yet \u2014 add them in data/meetings.js</p>`;
  const groups = [];
  for (const m of list) {
    const k = monthKey(m);
    if (!groups.length || groups.at(-1).k !== k) groups.push({ k, items: [] });
    groups.at(-1).items.push(m);
  }
  const inline = sponsors.filter((s) => s.slot === 'inline');
  return groups.map((g, i) => {
    const [y, mo] = g.k.split('-');
    return `<section class="month" data-month="${g.k}">
  <h2 id="m-${g.k}">${esc(MONTH[+mo - 1])}<span class="yr">${esc(y)}</span><span class="month-count" data-total="${g.items.length}">${g.items.length} meeting${g.items.length === 1 ? '' : 's'}</span></h2>
  ${g.items.map((m) => meetingRow(m, { base, next })).join('\n')}
</section>${inline[i] ? adBlock(inline[i]) : ''}`;
  }).join('\n');
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

function paceTable(circuitId) {
  const rows = PACE.filter((p) => p.circuit === circuitId)
    .sort((a, b) => (toSec(a.winningLap) ?? 1e9) - (toSec(b.winningLap) ?? 1e9));
  if (!rows.length) return '';
  const cfg = [...new Set(rows.map((r) => r.config).filter(Boolean))];
  const gkey = (r) => `${r.circuit}|${r.config ?? ''}|${r.club}|${r.className.toUpperCase().replace(/\s+/g, ' ').trim()}`;
  // Only bikes that actually appear at this circuit are worth offering.
  // Key on the canonical bike, not its printed name, so nothing can split.
  const here = new Map();
  for (const r of rows) for (const b of BIKES.byGroup[gkey(r)] ?? []) {
    const cur = here.get(b.key) ?? { label: b.label, riders: 0 };
    cur.riders += b.riders;
    here.set(b.key, cur);
  }
  // Alphabetical: with a hundred options you are looking for your bike, not
  // browsing. `numeric` keeps 500 before 1000 rather than sorting as text.
  const bikeOpts = [...here].sort((a, b) =>
    a[1].label.localeCompare(b[1].label, 'en', { numeric: true, sensitivity: 'base' }));
  const groupData = Object.fromEntries(rows.map((r) => [gkey(r), BIKES.byGroup[gkey(r)] ?? []]));
  return `<section class="pace">
  <h2>Pace here</h2>
  <p class="pace-intro">From ${rows.reduce((n, r) => n + r.races, 0)} races in the 2026 season${cfg.length ? ` (${cfg.map(esc).join(', ')})` : ''}. Put your best lap in to see where it would have put you \u2014 the classes you would go best in move to the top.</p>
  <div class="pace-input">
    <label for="mylap">Your best lap</label>
    <input id="mylap" type="text" inputmode="decimal" placeholder="e.g. 1:38.5 or 55.0" autocomplete="off">
    ${bikeOpts.length ? `<label for="mybike">Your bike</label>
    <select id="mybike">
      <option value="">Any bike</option>
      ${bikeOpts.map(([key, v]) => `<option value="${esc(key)}">${esc(v.label)} (${v.riders})</option>`).join('')}
    </select>` : ''}
    <button type="button" id="mylap-clear">Clear</button>
  </div>
  <p class="pace-hint" id="bikehint" hidden></p>
  <div class="tablewrap"><table id="pacetable">
    <thead><tr><th>Club</th><th>Class</th><th class="n">Field</th><th class="n">Win</th><th class="n">Podium</th><th class="n">National mark</th><th class="n">On your bike</th><th class="verdict-h">You</th></tr></thead>
    <tbody>
    ${rows.map((r) => `<tr data-key="${esc(gkey(r))}" data-win="${toSec(r.winningLap) ?? ''}" data-podium="${toSec(r.podiumLap) ?? ''}" data-mid="${toSec(r.midfieldLap) ?? ''}" data-nat="${toSec(r.nationalLap) ?? ''}" data-ratio="${r.avgToBest ?? ''}">
      <td>${esc(r.clubName)}</td>
      <td>${esc(r.className)}</td>
      <td class="n">${r.typicalField || '\u2014'}</td>
      <td class="n">${esc(r.winningLap ?? '\u2014')}</td>
      <td class="n">${esc(r.podiumLap ?? '\u2014')}</td>
      <td class="n">${esc(r.nationalLap ?? '\u2014')}</td>
      <td class="onbike"></td>
      <td class="verdict"></td>
    </tr>`).join('')}
    </tbody>
  </table></div>
  <script type="application/json" id="bikedata">${JSON.stringify(groupData).replace(/</g, '\\u003c')}</script>
  <p class="pace-note"><b>On your bike</b> is the pace of riders running the bike you picked, in that class at this circuit \u2014 usually a fairer target than the class as a whole, since one class often spans very different machinery. Classes where nobody raced your bike are dimmed and sink to the bottom. Which classes a bike is eligible for is taken from what riders actually entered, not from the regulations, so treat it as a guide and check the club\u2019s SRs.<br><br><b>National mark</b> is 92.5% of the winner\u2019s race average speed, shown as the average lap you would need to hold \u2014 not a single fast lap. When you enter a best lap it is projected into a realistic race average using the best-to-average ratio measured in that class, so the comparison is like for like. Indicative only: the ACU\u2019s criteria, and how many results count, are theirs.</p>
</section>`;
}

// All of these are cookieless and store no personal data, so the site still
// needs no consent banner. Nothing is emitted unless a provider is configured.
function analyticsTag() {
  const a = SITE.analytics ?? {};
  switch (a.provider) {
    case 'plausible':
      return a.domain ? `<script defer data-domain="${esc(a.domain)}" src="${esc(a.src ?? 'https://plausible.io/js/script.js')}"></script>` : '';
    case 'fathom':
      return a.siteId ? `<script src="${esc(a.src ?? 'https://cdn.usefathom.com/script.js')}" data-site="${esc(a.siteId)}" defer></script>` : '';
    case 'cloudflare':
      return a.siteId ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(a.siteId)}"}'></script>` : '';
    case 'umami':
      return a.siteId && a.src ? `<script defer src="${esc(a.src)}" data-website-id="${esc(a.siteId)}"></script>` : '';
    default: return '';
  }
}

// Booking.com affiliate for the circuit's area. Rendered with a visible
// disclosure and rel="sponsored nofollow" — the CMA requires affiliate links
// to be as obvious as ads, not just paid links to be marked for Google.
function accommodationBlock(c) {
  if (!accommodation?.bookingAid) return '';
  const q = accommodation.searchOverrides?.[c.id] ?? `${c.name}, UK`;
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}&aid=${encodeURIComponent(accommodation.bookingAid)}`;
  return `<aside class="promo promo--stay">
  <span class="promo-tag">Affiliate</span>
  <a href="${esc(url)}" rel="sponsored nofollow noopener" class="js-out" target="_blank">
    <b>Places to stay near ${esc(c.name)}</b>
    <span>Most meetings here are a weekend. Searches ${esc(q)} on Booking.com.</span>
  </a>
  <p class="promo-disc">We may earn a commission if you book through this link. It costs you nothing extra and never affects what is listed on this site.</p>
</aside>`;
}

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
// A paddock timing screen scrolls the next few sessions across the top, so the
// site does the same with the next few meetings. Duplicated once because the
// animation translates by exactly -50% to loop seamlessly.
function ticker() {
  const items = upcoming.filter((m) => (m.kind ?? 'race') === 'race' && m.status !== 'cancelled').slice(0, 14);
  if (!items.length) return '';
  const run = items.map((m) => {
    const o = O[m.organiser];
    const where = m.circuit ? C[m.circuit].name : 'Venue TBC';
    return `<span>${esc(shortRange(m))} · ${esc(where)} · ${esc(o?.short ?? o?.name ?? m.organiser)}<i>◆</i></span>`;
  }).join('');
  return `<div class="ticker" aria-hidden="true"><div class="ticker-run">${run}${run}</div></div>`;
}

// `main: false` lets a page lay itself out full-bleed (the home page's hero and
// filter bar run edge to edge); everything else gets the standard centred column.
// Auto / light / dark. The buttons carry no state in the HTML — theme.js sets
// aria-pressed once it knows the stored preference — so every page can be served
// from a cache without one theme's markup leaking into another visitor's page.
const THEME_ICONS = {
  auto: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="5.6"/><path d="M8 2.4a5.6 5.6 0 010 11.2z" fill="currentColor" stroke="none"/></svg>',
  light: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2L3.1 3.1"/></svg>',
  dark: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 9.7A5.9 5.9 0 016.3 2.5a5.9 5.9 0 107.2 7.2z"/></svg>',
};
const THEME_LABELS = { auto: 'Match system', light: 'Light', dark: 'Dark' };

function themeToggle() {
  return `<div class="theme" role="group" aria-label="Colour theme" hidden>${
    ['auto', 'light', 'dark'].map((t) =>
      `<button type="button" data-theme-set="${t}" aria-pressed="false" title="${esc(THEME_LABELS[t])}">${THEME_ICONS[t]}<span class="vh">${esc(THEME_LABELS[t])} theme</span></button>`
    ).join('')}</div>`;
}

// Runs before the first paint so a stored light preference never flashes dark.
// Kept inline and tiny for that reason; theme.js does everything else.
const THEME_BOOT = `<script>(function(){try{var p=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=p==='auto'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p}catch(e){}})();</script>`;

function layout({ title, description, body, base, canonical, jsonld = [], wide = false, filters = false, main = true }) {
  const raceCount = upcoming.filter((m) => (m.kind ?? 'race') === 'race').length;
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
${THEME_BOOT}
${analyticsTag()}
${jsonld.length ? `<script type="application/ld+json">${JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld)}</script>` : ''}
</head>
<body class="${[wide ? 'wide' : '', filters ? 'has-filters' : ''].filter(Boolean).join(' ')}">
<a class="vh" href="#main">Skip to content</a>
${ticker()}
<header class="site">
  <div class="wrap">
    <a class="brand" href="${base}">
      <span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><b>${esc(SITE.name)}</b><span class="brand-sub">UK motorcycle club racing</span></span>
    </a>
    <nav><a href="${base}clashes/">Clashes</a><a href="${base}feeds/">Feeds</a><a href="${base}about/">About</a></nav>
    <div class="headstats">
      <span><b>${raceCount}</b> Meetings</span>
      <span><b>${new Set(upcoming.map((m) => m.organiser)).size}</b> Clubs</span>
      <span><b>${new Set(upcoming.map((m) => m.circuit).filter(Boolean)).size}</b> Circuits</span>
    </div>
    ${themeToggle()}
  </div>
</header>
${hasExamples ? `<div class="warnbar"><div class="wrap">This site is showing <b>example data</b> \u2014 delete the demo rows in <code>data/meetings.js</code></div></div>` : ''}
${adSlot('top') ? `<div class="wrap">${adSlot('top')}</div>` : ''}
${main ? `<main id="main" class="wrap">\n${body}\n</main>` : body}
${newsletterBlock() ? `<div class="wrap">${newsletterBlock()}</div>` : ''}
<footer class="site">
  <div class="wrap">
    <div class="foot-brand">
      <b>${esc(SITE.name)}</b>
      <p>An independent listing of UK motorcycle road race meetings, aggregated from the organising clubs\u2019 own calendars. Always check with the club before travelling \u2014 dates change.</p>
    </div>
    <div class="foot-links">
      <a href="${base}">Calendar</a>
      <a href="${base}clashes/">Date clashes</a>
      <a href="${base}feeds/">Calendar feeds</a>
      <a href="${base}about/">About &amp; corrections</a>
    </div>
    <p>\u00a9 ${new Date().getFullYear()} ${esc(SITE.name)}<br>Not affiliated with the ACU, MSUK, or any individual club</p>
  </div>
  ${adSlot('footer') ? `<div class="wrap">${adSlot('footer')}</div>` : ''}
</footer>
<script src="${base}theme.js" defer></script>
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
      m.entriesOpen ? 'Entries open: ' + m.entriesOpen : '',
      m.entriesClose ? 'Entries CLOSE: ' + m.entriesClose : '',
      m.status && m.status !== 'confirmed' ? 'Status: ' + m.status : '']
      .filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT',
      `UID:${m.id}@${SITE.uidDomain ?? SITE.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
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
  canonical: '/', base: '', wide: true, filters: true, main: false,
  jsonld: upcoming.slice(0, 60).map(eventLd),
  body: `<div class="hero${SITE.hero ? ' hero--img' : ''}">
  ${SITE.hero ? `<img class="hero-img" src="${esc(SITE.hero.src)}" alt="${esc(SITE.hero.alt ?? '')}" decoding="async">` : ''}
  <div class="wrap">
    <div>
      <h1>${esc(nextUp ? nextUp.start.slice(0, 4) : new Date().getFullYear())} racing calendar</h1>
      <p>Every UK club and national road race meeting in one place</p>
    </div>
    ${nextUp ? `<a class="nextrace" href="#m-${monthKey(nextUp)}">
      <span class="lbl">Next race</span>
      <b>${esc(nextUp.circuit ? C[nextUp.circuit].name : 'Venue TBC')}</b>
      <em>${esc(shortRange(nextUp))} \u00b7 ${esc(O[nextUp.organiser]?.short ?? nextUp.organiser)}</em>
    </a>` : ''}
  </div>
</div>
<div class="filters">
  <div class="wrap filters-in">
    <input type="search" id="q" placeholder="Search circuit or club\u2026" aria-label="Search meetings">
    <select id="f-circuit" aria-label="Filter by circuit"><option value="">All circuits</option>${usedCircuits.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>
    <select id="f-org" aria-label="Filter by club"><option value="">All clubs</option>${usedOrgs.map((o) => `<option value="${esc(o.id)}">${esc(o.short ?? o.name)}</option>`).join('')}</select>
    <select id="f-type" aria-label="Filter by circuit type"><option value="">Circuits &amp; roads</option><option value="short">Short circuits</option><option value="road">Road races</option></select>
    <label class="chk"><input type="checkbox" id="f-races"> Races only</label>
    <label class="chk"><input type="checkbox" id="f-clash"> Clashes only</label>
    <button id="reset" type="button">Reset \u00d7</button>
    <p class="count" id="count" aria-live="polite"></p>
  </div>
</div>
<main id="main" class="wrap">
<div class="stats">
  <div class="stat"><b>${upcoming.filter((m) => (m.kind ?? 'race') === 'race').length}</b><span>Race meetings</span></div>
  <div class="stat"><b>${new Set(upcoming.map((m) => m.organiser)).size}</b><span>Clubs</span></div>
  <div class="stat"><b>${new Set(upcoming.map((m) => m.circuit).filter(Boolean)).size}</b><span>Circuits</span></div>
  ${upcomingClashes.length ? `<a class="stat stat--alert" href="clashes/"><b>${upcomingClashes.length}</b><span>Date clashes</span></a>` : ''}
</div>
${LISTHEAD}
<div id="list">${monthList(upcoming, { base: '', next: nextUp?.id ?? null })}</div>
<p class="subscribe"><a href="feeds/">Add this calendar to your phone \u2192</a></p>
<script src="filter.js" defer></script>
</main>`,
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
<p class="lede">${esc(c.region)} \u00b7 ${c.type === 'road' ? 'Closed roads course' : 'Short circuit'}${(c.layouts ?? []).length ? ` \u00b7 ${c.layouts.map(esc).join(' / ')} layouts` : ''}</p>
${(() => {
  const pc = PACE.filter((p) => p.circuit === c.id);
  const fastest = pc.map((p) => toSec(p.fastestLap)).filter(Boolean).sort((a, b) => a - b)[0];
  return `<div class="stats">
    <div class="stat"><b>${up.length}</b><span>Upcoming</span></div>
    <div class="stat"><b>${new Set(all.filter((m) => m.circuit === c.id).map((m) => m.organiser)).size}</b><span>Clubs racing here</span></div>
    ${pc.length ? `<div class="stat"><b>${pc.length}</b><span>Classes with data</span></div>` : ''}
    ${fastest ? `<div class="stat"><b>${esc(fmt(fastest) ?? '')}</b><span>Fastest lap 2026</span></div>` : ''}
  </div>`;
})()}
<p class="subscribe"><a href="../../feeds/circuit-${c.id}.ics">Subscribe to ${esc(c.name)} dates (.ics)</a></p>
${links.map((l) => adBlock({ ...l, slot: 'inline' })).join('')}
${accommodationBlock(c)}
${paceTable(c.id)}
${paceTable(c.id) ? '<h2>Meetings</h2>' : ''}
${up.length ? LISTHEAD : ''}
${monthList(up, { base: '../../' })}
${list.length > up.length ? `<details class="past"><summary>Past meetings (${list.length - up.length})</summary>${monthList(list.filter((m) => (m.end ?? m.start) < TODAY), { base: '../../' })}</details>` : ''}
${paceTable(c.id) ? '<script src="../../pace.js" defer></script>' : ''}`,
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
${up.length ? LISTHEAD : ''}
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
${up.length ? LISTHEAD : ''}
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
${upcomingClashes.length ? LISTHEAD + monthList(upcomingClashes, { base: '../' }) : '<p class="empty">No clashes in the calendar. Add more clubs and that will change.</p>'}`,
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
for (const f of ['style.css', 'filter.js', 'pace.js', 'theme.js']) if (existsSync(join('src', f))) cpSync(join('src', f), join(OUT, f));
if (existsSync('src/fonts')) cpSync('src/fonts', join(OUT, 'fonts'), { recursive: true });
if (existsSync('src/img')) cpSync('src/img', join(OUT, 'img'), { recursive: true });
if (SITE.hero && !existsSync(join('src', SITE.hero.src))) warn(`SITE.hero.src "${SITE.hero.src}" not found under src/`);

console.log(`\u2713 built ${written.length + 2} files to ${OUT}/  (${all.length} meetings, ${upcoming.length} upcoming)`);
if (hasExamples) console.log('  ! example data is still present in data/meetings.js');
