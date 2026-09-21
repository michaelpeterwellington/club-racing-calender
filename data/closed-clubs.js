// Clubs that have folded.
//
// Worth recording rather than just deleting: the ACU permit list still carries
// their past meetings, so without this they get suggested as gaps in coverage
// every time that list is re-read. `match` holds lowercase fragments tested
// against the ACU's spelling of the name.
//
// Add to this when a club folds — it is the difference between "we haven't got
// them yet" and "there is nothing to get".
export const closedClubs = [
  { name: 'Thundersport GB',               match: ['thundersport'] },
  { name: 'New Era Racing',                match: ['new era', 'newera'] },
  { name: 'Wirral 100 Motor Club',         match: ['wirral'] },
  { name: 'Derby Phoenix MCRC',            match: ['derby phoenix', 'phoenix'] },
  { name: 'Tonfanau Racing Association',   match: ['tonfanau'] },
  { name: 'East Fife Motor Club',          match: ['east fife', 'eastfife'] },
];

// Organisers that hold ACU road-race permits but run something this site does
// not cover. Recorded for the same reason as the closed clubs: otherwise they
// show up as gaps every time the permit list is re-read.
//
// Scope is solo tarmac racing — short circuits and closed roads. No off-road,
// no sidecars, no hillclimb, no drag racing, no cars.
export const outOfScope = [
  { name: 'National Hillclimb Association', match: ['hillclimb'],        why: 'hillclimb' },
  { name: 'Santa Pod Racers Club',          match: ['santa pod'],        why: 'drag racing' },
  { name: 'NoraSport Supermoto',            match: ['supermoto'],        why: 'supermoto' },
  { name: 'Morgan Three Wheeler Club',      match: ['morgan'],           why: 'cars' },
  { name: 'BARC',                           match: ['barc'],             why: 'cars' },
  { name: 'British Mini Bikes',             match: ['mini bikes', 'minibikes', 'bmb'], why: 'minibikes' },
];
