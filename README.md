# UK Race Calendar

Every UK motorcycle club and national road race meeting, from every organising club,
in one calendar. Solo tarmac only — short circuits and closed roads. No off-road,
no sidecars.

Static site, zero dependencies, zero build tooling. `node build.js` turns the data
files into `dist/`, which is plain HTML you can host anywhere for free.

## Adding a meeting

Open `data/meetings.js` and add a row:

```js
{ id: 'bemsee-2027-cadwell', start: '2027-07-16', end: '2027-07-18',
  circuit: 'cadwell', organiser: 'bemsee', status: 'provisional',
  notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },
```

Then `node build.js`. That's the whole workflow.

| field | notes |
|---|---|
| `id` | unique slug, anything you like |
| `start` / `end` | `YYYY-MM-DD`; omit `end` for a one-day meeting |
| `circuit` | id from `data/circuits.js` — the **venue**, not the layout. `null` if TBC |
| `config` | the layout: `'GP'`, `'Indy'`, `'300'`, `'Coastal'`, `'National'`… |
| `organiser` | id from `data/organisers.js` — whoever holds the permit |
| `championships` | ids from `data/championships.js`; a series can travel between clubs |
| `kind` | `'race'` (default), `'test'`, `'school'`, `'marshal'` |
| `status` | `'confirmed'`, `'provisional'`, `'full'`, `'cancelled'` |
| `entriesOpen` | `YYYY-MM-DD` — drives the "entries open" flags |
| `source` | where you got it, so you can re-check it later |

The build warns about unknown circuit/organiser/championship ids, bad dates,
duplicate ids and end-before-start. It doesn't fail — it just tells you.

### The one modelling rule worth remembering

**Venue ≠ organiser ≠ championship.** One Cadwell weekend is Derby Phoenix's permit,
at Cadwell, hosting several championships. Riders search by all three, so they're
separate things with separate pages. Circuit layouts are *not* separate venues —
"Snetterton 300" and "Snetterton 200" are one page, with `config` telling them apart.

## What gets generated

- `/` — the full calendar, filterable by circuit, club, type and race-vs-test
- `/circuit/<id>/` — one page per venue (the SEO pages: "Cadwell Park race dates")
- `/organiser/<id>/` — one page per club
- `/championship/<id>/` — one page per series
- `/feeds/*.ics` — subscribable calendar feeds, per circuit, club and championship
- `sitemap.xml`, `robots.txt`, and schema.org `SportsEvent` JSON-LD on every page

## Commands

```sh
node build.js      # build to dist/
npm run serve      # build, then serve at http://localhost:8080
```

## Deploying

`dist/` is static. Cloudflare Pages or Netlify will host it free — build command
`node build.js`, output directory `dist`. Set your real domain in `site.config.js`
first, or canonical URLs and iCal UIDs will point at `example.com`.

## Phase 2 — monetisation

The hooks are already in place and render nothing while empty, so the site stays
clean until there's something real to put in them. All of it lives in
`data/sponsors.js`:

- `sponsors` — ad slots (`top`, `inline`, `footer`). Anything with `sponsored: true`
  renders a visible "Ad" label and `rel="sponsored nofollow"` — the ASA requirement
  for identifiable ads and Google's requirement for paid links.
- `circuitLinks` — per-circuit affiliate links (accommodation near the circuit, etc.)
- `newsletter.action` — set to a form endpoint to switch the signup block on

Outbound links carry `class="js-out"` so click tracking is a few lines whenever
you want it. Note that adding third-party ad scripts brings a cookie-consent
requirement with it; right now the site sets no cookies and needs no banner.

## Accuracy

Dates are entered by hand from clubs' published calendars. Keep `source` filled in.
The site tells people to confirm with the club before travelling, and it should.
