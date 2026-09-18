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
  { id: 'wirral-100',    name: 'Wirral 100 Motor Club',                   short: 'Wirral 100', website: null },
  { id: 'derby-phoenix', name: 'Derby Phoenix MCRC',                      short: 'Derby Phoenix', website: null },
  { id: 'darley-moor',   name: 'Darley Moor MRRC',                        short: 'Darley Moor', website: 'https://www.darleymoor.co.uk' },
  { id: 'emra',          name: 'EMRA (East Midlands Racing Association)',  short: 'EMRA',     website: null,
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/emra/', note: 'results by season, 2002 onwards' }] },
  { id: 'ng',            name: 'NG Road Racing',                          short: 'NG',       website: null,
    results: [{ provider: 'TSL Timing', url: 'https://www.tsl-timing.com/Results/ngroadracing/', note: 'results by season, 2002 onwards' }] },
  { id: 'bantam',        name: 'Bantam Racing Club',                      short: 'Bantam RC', website: null },
  { id: 'crmc',          name: 'CRMC (Classic Racing Motorcycle Club)',   short: 'CRMC',     website: 'https://www.crmc.co.uk' },
  // CRMC is NOT on TSL Timing — checked. Their results are elsewhere; add when found.
  { id: 'bhr',           name: 'BHR (British Historic Racing)',           short: 'BHR',      website: null },
  { id: 'cool-fab',      name: 'Cool FAB Racing',                         short: 'Cool FAB', website: null },
  { id: 'auto-66',       name: 'Auto 66 Club',                            short: 'Auto 66',  website: null },
  { id: 'southern-100',  name: 'Southern 100 Racing',                     short: 'Southern 100', website: null },
  { id: 'acu-events',    name: 'ACU Events (TT / Manx GP)',               short: 'ACU Events', website: null },
  { id: 'mcui-ulster',   name: 'MCUI Ulster Centre clubs',                short: 'MCUI Ulster', website: null },
  { id: 'melville',      name: 'Melville Motor Club',                     short: 'Melville', website: null },
  { id: 'east-fife',     name: 'East Fife Motor Club',                    short: 'East Fife', website: null },
];
