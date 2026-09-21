// THE ONLY FILE YOU EDIT REGULARLY.
//
//   id            required, unique slug
//   start         required, 'YYYY-MM-DD'
//   end           optional  — omit for a one-day meeting
//   circuit       required, id from data/circuits.js (the VENUE)
//   config        optional  — the layout, e.g. 'GP', 'Indy', '300', 'Coastal'
//   organiser     required, id from data/organisers.js
//   name          optional  — meeting name, if it has one
//   kind          'race' (default) | 'test' | 'school' | 'marshal'
//   championships optional  — array of ids from data/championships.js
//   status        'confirmed' | 'provisional' | 'full' | 'cancelled'
//   entriesOpen   optional  — 'YYYY-MM-DD'
//   entriesClose  optional  — 'YYYY-MM-DD'; the deadline, which is what riders
//                 actually need. Shown as a countdown inside three weeks.
//   entryUrl      optional
//   notes         optional  — one line
//   source        optional  — where it came from, so you can re-check it
//
// This is a CALENDAR. Results don't belong here — they are scraped separately
// into data/pace.json and shown in the pace table on each circuit page.

export const meetings = [
  /* ---------------- BEMSEE / BMCRC 2027 ----------------
     Dates were published as provisional and have since been confirmed.
     All race meetings have a BMCRC Friday test day.                         */
  { id: 'bemsee-2027-marshal-training', start: '2027-03-06',
    circuit: null, organiser: 'bemsee', kind: 'marshal',
    name: 'BMCRC Marshal Training Day', status: 'confirmed',
    notes: 'Venue not stated in the club announcement.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-race-school', start: '2027-03-07',
    circuit: 'brands-hatch', config: 'Indy', organiser: 'bemsee', kind: 'school',
    name: 'BMCRC Race School', status: 'confirmed',
    notes: 'Date TBC. On-track; ACU BRA-CTC course done online.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-oulton', start: '2027-03-25', end: '2027-03-27',
    circuit: 'oulton', organiser: 'bemsee', status: 'confirmed',
    notes: 'Thursday–Saturday over Easter. Friday test day.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-brands', start: '2027-04-23', end: '2027-04-25',
    circuit: 'brands-hatch', config: 'Indy', organiser: 'bemsee', status: 'confirmed',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-donington', start: '2027-05-14', end: '2027-05-16',
    circuit: 'donington', config: 'GP', organiser: 'bemsee', status: 'confirmed',
    notes: '98dB drive-by noise limit. Friday test day.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-snetterton', start: '2027-06-11', end: '2027-06-13',
    circuit: 'snetterton', config: '300', organiser: 'bemsee', status: 'confirmed',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-cadwell', start: '2027-07-16', end: '2027-07-18',
    circuit: 'cadwell', organiser: 'bemsee', status: 'confirmed',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-anglesey', start: '2027-08-20', end: '2027-08-22',
    circuit: 'anglesey', organiser: 'bemsee', status: 'confirmed',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-mallory', start: '2027-09-18', end: '2027-09-19',
    circuit: 'mallory', organiser: 'bemsee', status: 'confirmed',
    notes: 'Friday test day TBC.', source: 'BMCRC 2027 provisional dates post' },

  /* ---------------- CRMC 2027 ----------------
     Source: CRMC 2027 dates announcement.                                   */
  { id: 'crmc-2027-mallory-test', start: '2027-03-07',
    circuit: 'mallory', organiser: 'crmc', kind: 'test',
    name: 'CRMC Test Day', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-cadwell', start: '2027-04-03', end: '2027-04-04',
    circuit: 'cadwell', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-anglesey', start: '2027-05-01', end: '2027-05-02',
    circuit: 'anglesey', config: 'Coastal', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-snetterton', start: '2027-06-05', end: '2027-06-06',
    circuit: 'snetterton', config: '200', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-knockhill', start: '2027-07-03', end: '2027-07-04',
    circuit: 'knockhill', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-donington', start: '2027-07-31', end: '2027-08-01',
    circuit: 'donington', config: 'National', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-pembrey', start: '2027-09-04', end: '2027-09-05',
    circuit: 'pembrey', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  { id: 'crmc-2027-mallory', start: '2027-10-09', end: '2027-10-10',
    circuit: 'mallory', organiser: 'crmc', status: 'confirmed',
    source: 'CRMC 2027 dates announcement' },

  /* ---------------- NO LIMITS RACING 2027 ----------------
     Source: NLR 9-round championship calendar graphic. The graphic gives no
     year; entered as 2027 because those dates fall Fri-Sun / Sat-Sun in 2027
     and Thu-Sat / Thu-Fri in 2026. Worth confirming.                         */
  { id: 'nlr-2027-r1', start: '2027-03-19', end: '2027-03-21',
    circuit: 'snetterton', config: '300', organiser: 'no-limits', round: 1,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r2', start: '2027-04-24', end: '2027-04-25',
    circuit: 'donington', config: 'GP', organiser: 'no-limits', round: 2,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r3', start: '2027-05-28', end: '2027-05-30',
    circuit: 'croft', organiser: 'no-limits', round: 3,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r4', start: '2027-06-26', end: '2027-06-27',
    circuit: 'brands-hatch', config: 'GP', organiser: 'no-limits', round: 4,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r5', start: '2027-07-16', end: '2027-07-18',
    circuit: 'anglesey', config: 'Coastal', organiser: 'no-limits', round: 5,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r6', start: '2027-08-13', end: '2027-08-15',
    circuit: 'knockhill', organiser: 'no-limits', round: 6,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r7', start: '2027-09-03', end: '2027-09-05',
    circuit: 'cadwell', organiser: 'no-limits', round: 7,
    championships: ['nlr-sprint'], status: 'confirmed',
    notes: 'Sprint races only.',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r8', start: '2027-09-17', end: '2027-09-18',
    circuit: 'oulton', organiser: 'no-limits', round: 8,
    championships: ['nlr-endurance'], status: 'confirmed',
    notes: 'Endurance only.',
    source: 'NLR 2027 championship calendar graphic' },
  { id: 'nlr-2027-r9', start: '2027-10-09', end: '2027-10-10',
    circuit: 'donington', config: 'GP', organiser: 'no-limits', round: 9,
    championships: ['nlr-sprint', 'nlr-endurance'], status: 'confirmed',
    source: 'NLR 2027 championship calendar graphic' },


  /* ---------------- BHRC (British Historic Racing Club) 2027 ----------------
     Source: BHRC provisional 2027 dates. The announcement lists venues as
     scattered logos rather than against each round, so they are matched by
     month against the 2026 season, which they reproduce exactly:
       Apr Lydden Hill, May Cadwell, Jun Pembrey, Jul Darley Moor, Aug Anglesey,
       Sep Cadwell \u2014 with Snetterton taking the one new slot, in March.
     Dates have since been confirmed; the venue matching above has not, so
     confirm the venue with the club before booking anything.                */
  { id: 'bhrc-2027-test', start: '2027-03-20',
    circuit: null, organiser: 'bhr', status: 'confirmed',
    name: 'BHRC Test Day',
    kind: 'test',
    notes: 'Venue not stated in the announcement.',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r1-2', start: '2027-03-26', end: '2027-03-27',
    circuit: 'snetterton', config: '200', organiser: 'bhr', status: 'confirmed',
    round: '1 & 2',
    entriesClose: '2027-03-12',
    notes: 'Friday–Saturday, unlike the rest of the season. Snetterton is a new venue for BHRC.',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r3-4', start: '2027-04-17', end: '2027-04-18',
    circuit: 'lydden-hill', organiser: 'bhr', status: 'confirmed',
    round: '3 & 4',
    entriesClose: '2027-04-08',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r5-6', start: '2027-05-15', end: '2027-05-16',
    circuit: 'cadwell', organiser: 'bhr', status: 'confirmed',
    round: '5 & 6',
    entriesClose: '2027-05-01',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r7-8', start: '2027-06-19', end: '2027-06-20',
    circuit: 'pembrey', organiser: 'bhr', status: 'confirmed',
    round: '7 & 8',
    entriesClose: '2027-06-05',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r9-10', start: '2027-07-17', end: '2027-07-18',
    circuit: 'darley-moor', organiser: 'bhr', status: 'confirmed',
    round: '9 & 10',
    entriesClose: '2027-07-03',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r11-12', start: '2027-08-14', end: '2027-08-15',
    circuit: 'anglesey', organiser: 'bhr', status: 'confirmed',
    round: '11 & 12',
    entriesClose: '2027-08-01',
    source: 'BHRC provisional 2027 dates' },
  { id: 'bhrc-2027-r13-14', start: '2027-09-25', end: '2027-09-26',
    circuit: 'cadwell', organiser: 'bhr', status: 'confirmed',
    round: '13 & 14',
    entriesClose: '2027-09-10',
    source: 'BHRC provisional 2027 dates' },

  /* ---------------- Aintree MCRC 2027 ----------------
     Source: Aintree Motor Cycle Racing Club 2027 race dates.
     Every date checks out as a Saturday, with a Wednesday test day, and the
     shape matches their 2026 ACU permits: a test day in early May then four
     Saturday rounds.                                                        */
  { id: 'aintree-2027-test', start: '2027-05-05',
    circuit: 'aintree', organiser: 'aintree', status: 'confirmed',
    name: 'AINTREE Test Day',
    kind: 'test',
    source: 'Aintree MCRC 2027 race dates' },
  { id: 'aintree-2027-r1', start: '2027-05-15',
    circuit: 'aintree', organiser: 'aintree', status: 'confirmed',
    round: '1',
    source: 'Aintree MCRC 2027 race dates' },
  { id: 'aintree-2027-r2', start: '2027-06-12',
    circuit: 'aintree', organiser: 'aintree', status: 'confirmed',
    round: '2',
    source: 'Aintree MCRC 2027 race dates' },
  { id: 'aintree-2027-r3', start: '2027-07-10',
    circuit: 'aintree', organiser: 'aintree', status: 'confirmed',
    round: '3',
    source: 'Aintree MCRC 2027 race dates' },
  { id: 'aintree-2027-r4', start: '2027-09-18',
    circuit: 'aintree', organiser: 'aintree', status: 'confirmed',
    round: '4',
    source: 'Aintree MCRC 2027 race dates' },

  /* ---------------- Southern 100 2027 ----------------
     Billown, Isle of Man. Monday to Thursday, as the road races always are —
     not a weekend meeting.                                                   */
  { id: 'southern-100-2027', start: '2027-07-12', end: '2027-07-15',
    circuit: 'billown', organiser: 'southern-100', status: 'confirmed',
    name: 'Southern 100 Road Races',
    source: 'Southern 100 Racing announcement' },
];
