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

## Hero image

The home page hero runs a plain kerb-stripe treatment by default. To put a
photograph behind it, drop the file in `src/img/` and name it in
`site.config.js`:

```js
hero: { src: 'img/hero.webp', alt: 'Four riders cranked over through a corner' },
```

Wide and landscape works best — it is cropped to a band about 1600x280. The
build copies `src/img/` to `dist/img/` and warns if the file named is missing.
Keep it self-hosted: hotlinking a stock library would be the only third-party
request the whole site makes, and the site's promise is that it contacts nobody.

## Commands

```sh
node build.js      # build to dist/
npm run serve      # build, then serve at http://localhost:8080
```

## Keeping it current

The build compiles today's date into the HTML: `upcoming` is filtered against
it, entry-close countdowns are rendered from it, and the ticker and "next race"
panel are picked by it. So the site has to be rebuilt even when the data has not
changed — otherwise past meetings linger and a countdown reading "Entries close
in 5 days" stays frozen at five days, which is wrong rather than merely stale.

`.github/workflows/daily-rebuild.yml` pokes a Cloudflare Pages deploy hook once
a day. To wire it up:

1. Cloudflare Pages → the project → Settings → Builds & deployments →
   **Deploy hooks** → create one against the `main` branch, and copy the URL.
2. GitHub → the repo → Settings → Secrets and variables → Actions →
   **New repository secret**, named `CLOUDFLARE_DEPLOY_HOOK`, holding that URL.
3. Actions → Daily rebuild → **Run workflow** to check it before trusting it.

The hook URL is a password: anyone holding it can trigger builds, so it belongs
in the secret and not in the workflow file. Note that GitHub suspends scheduled
workflows on repositories with no activity for 60 days, and will email first.

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
