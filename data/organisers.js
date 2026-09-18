// Clubs / promoters that hold the permit for a meeting.
// NOTE: `website` is deliberately left null where I wasn't certain of the URL —
// I'd rather ship no link than a wrong one. Filling these in is a 10-minute job.
//
// `results` links to past seasons so riders can judge how competitive a club's
// grids are before entering. Only clubs VERIFIED as present on TSL Timing have a
// link; TSL's club index is at tsl-timing.com/Results. Note that TSL's own year
// selector is JS-driven — /Results/<club>/?y=2025 does NOT work, it just shows
// the current season — so these link to the club's index and you pick the year there.

export const organisers = [
  { id: 'bemsee',        name: 'BEMSEE (British Motorcycle Racing Club)', short: 'BEMSEE',   website: 'https://www.bemsee.co.uk',
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/bmcrc/', note: 'results by season, 2002 onwards' }] },
  { id: 'no-limits',     name: 'No Limits Racing',                        short: 'No Limits', website: null,
    note: 'No Limits publish their calendar with the caveat that all dates and venues are subject to change.',
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/nolimits/', note: 'results by season, 2002 onwards' }] },
  { id: 'msvr',          name: 'MSVR / Club MSV',                         short: 'MSVR',     website: 'https://www.msvr.co.uk' },
  // Wirral 100 Motor Club: closed down, so not listed.
  // Derby Phoenix MCRC: closed down, so not listed. Absent from the ACU's
  // 2026 permit list too, which corroborates it.
  { id: 'darley-moor',   name: 'Darley Moor MRRC',                        short: 'Darley Moor', website: 'https://www.darleymoor.co.uk' },
  { id: 'emra',          name: 'EMRA (East Midlands Racing Association)',  short: 'EMRA',     website: null,
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/emra/', note: 'results by season, 2002 onwards' }] },
  { id: 'ng',            name: 'NG Road Racing',                          short: 'NG',       website: null,
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/ngroadracing/', note: 'results by season, 2002 onwards' }] },
  { id: 'bantam',        name: 'Bantam Racing Club',                      short: 'Bantam RC', website: null },
  { id: 'crmc',          name: 'CRMC (Classic Racing Motorcycle Club)',   short: 'CRMC',     website: 'https://www.crmc.co.uk',
    // Not on TSL. CRMC spread results across four providers over the years; all
    // taken from crmc.co.uk/live-timing-results. Apex only goes back to 2026 —
    // /CRMC/2025/... returns a blank page, so don't "fix" that into a link.
    results: [
      { provider: 'Motorsport Timing', years: '2017\u20132025', url: 'https://www.motorsport-timing.co.uk/championships/crmc/',
        note: 'per-meeting results, the fullest archive' },
      { provider: 'CRMC live timing & results', years: '2026 onwards', url: 'https://www.crmc.co.uk/live-timing-results/',
        note: 'the club\u2019s own index; Apex has no browsable archive, so link here not to Apex directly' },
      { provider: 'Championship standings', years: '2026', url: 'https://1drv.ms/x/c/ed53173064b266fc/IQBbppm4SKguR5bKi7byOI2IAQJDepK5hn9VytVSOJivP70',
        note: 'spreadsheet' },
      { provider: 'Championship standings', years: '2025', url: 'https://1drv.ms/x/c/ed53173064b266fc/EYfac5kmk9pLpawJyt8GGRUBFzshfTJ8p4pDpz2PQ42NXw',
        note: 'spreadsheet' },
      { provider: 'MyLaps Speedhive', years: '2005\u20132017', url: 'https://speedhive.mylaps.com/organizations/24046',
        note: 'linked by CRMC; needs JavaScript, contents unverified' },
    ] },
  { id: 'bhr',           name: 'British Historic Racing Club (BHRC)',     short: 'BHRC',     website: null,
    results: [{ provider: 'The Results Live', years: '2016\u20132026', url: 'https://www.theresultslive.co.uk/british-historic-racing-club',
      note: 'per-session results by season' }] },
  { id: 'cool-fab',      name: 'Cool FAB Racing',                         short: 'Cool FAB', website: null },
  { id: 'auto-66',       name: 'Auto 66 Club',                            short: 'Auto 66',  website: null },
  { id: 'southern-100',  name: 'Southern 100 Racing',                     short: 'Southern 100', website: null },
  { id: 'acu-events',    name: 'ACU Events (TT / Manx GP)',               short: 'ACU Events', website: null },
  { id: 'mcui-ulster',   name: 'MCUI Ulster Centre clubs',                short: 'MCUI Ulster', website: null },
  { id: 'melville',      name: 'Melville Motor Club',                     short: 'Melville', website: null },
  { id: 'east-fife',     name: 'East Fife Motor Club',                    short: 'East Fife', website: null },
];
