// Championships and series. These are what riders actually search for, and they
// are NOT the same thing as the organiser — a series can run as part of several
// different clubs' meetings (Forgotten Era, Lansdowne), and one meeting hosts many.
//
// `organiser` is the club that runs it, or null if it travels between clubs.

export const championships = [
  { id: 'forgotten-era', name: 'Forgotten Era Racing', organiser: null },
  { id: 'lansdowne',     name: 'Lansdowne Classic Series', organiser: null },
  { id: 'nlr-sprint',    name: 'No Limits Sprint Championship',    organiser: 'no-limits' },
  { id: 'nlr-endurance', name: 'No Limits Endurance Championship', organiser: 'no-limits' },
  // Add more as you go — a meeting can reference championships that aren't
  // listed here yet, the build will just warn.
];
