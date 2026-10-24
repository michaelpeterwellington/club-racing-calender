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

  /* ---------------- EMRA 2027 ----------------
     Every round is at Mallory Park. The dates announcement gives dates and
     round numbers only, with no venue against any of them; the venue was
     confirmed separately, which is why `source` still names the dates post.
     Round 2 is the only two-day round.                                       */
  { id: 'emra-2027-test', start: '2027-03-20',
    circuit: 'mallory', organiser: 'emra', kind: 'test',
    name: 'EMRA Test Day', status: 'confirmed',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r1', start: '2027-04-04',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '1',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r2', start: '2027-05-15', end: '2027-05-16',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '2',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r3', start: '2027-06-13',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '3',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r4', start: '2027-08-08',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '4',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r5', start: '2027-09-05',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '5',
    source: 'EMRA 2027 race dates announcement' },
  { id: 'emra-2027-r6', start: '2027-10-03',
    circuit: 'mallory', organiser: 'emra', status: 'confirmed', round: '6',
    source: 'EMRA 2027 race dates announcement' },

  /* ---------------- Darley Moor 2027 ----------------
     Club's own published dates. The CTC and Basic Rider Assessment is the ACU
     licence course rather than a meeting, so it is filed as a race school — the
     nearest kind this site has. Stars at Darley is the only two-day round.    */
  { id: 'darley-moor-2027-ctc', start: '2027-03-06',
    circuit: 'darley-moor', organiser: 'darley-moor', kind: 'school', status: 'confirmed',
    name: 'CTC & Basic Rider Assessment',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-test', start: '2027-04-03',
    circuit: 'darley-moor', organiser: 'darley-moor', kind: 'test', status: 'confirmed',
    name: 'Test Day',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-r1', start: '2027-04-18',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed', round: '1',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-r2', start: '2027-05-09',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed', round: '2',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-r3', start: '2027-06-20',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed', round: '3',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-r4', start: '2027-08-15',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed', round: '4',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-r5', start: '2027-09-12',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed', round: '5',
    source: 'Darley Moor MRRC 2027 dates' },
  { id: 'darley-moor-2027-stars', start: '2027-10-09', end: '2027-10-10',
    circuit: 'darley-moor', organiser: 'darley-moor', status: 'confirmed',
    name: 'Stars at Darley',
    source: 'Darley Moor MRRC 2027 dates' },

  /* ---------------- NG Road Racing 2027 ----------------
     Three races per round, so each weekend covers three championship rounds —
     hence the ranges. Taken from a 2027 season planner table rather than NG's
     own announcement; the same table's BEMSEE, No Limits and EMRA rows agree
     exactly with dates already held here, which is some corroboration, but the
     venues carry no layout so none is recorded.                               */
  { id: 'ng-2027-r1-3', start: '2027-03-20', end: '2027-03-21',
    circuit: 'brands-hatch', organiser: 'ng', status: 'confirmed', round: '1–3',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r4-6', start: '2027-04-17', end: '2027-04-18',
    circuit: 'cadwell', organiser: 'ng', status: 'confirmed', round: '4–6',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r7-9', start: '2027-05-08', end: '2027-05-09',
    circuit: 'anglesey', organiser: 'ng', status: 'confirmed', round: '7–9',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r10-12', start: '2027-06-12', end: '2027-06-13',
    circuit: 'castle-combe', organiser: 'ng', status: 'confirmed', round: '10–12',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r13-15', start: '2027-07-24', end: '2027-07-25',
    circuit: 'snetterton', organiser: 'ng', status: 'confirmed', round: '13–15',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r16-18', start: '2027-08-21', end: '2027-08-22',
    circuit: 'donington', organiser: 'ng', status: 'confirmed', round: '16–18',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r19-20', start: '2027-09-11',
    circuit: 'oulton', organiser: 'ng', status: 'confirmed', round: '19–20',
    source: 'NG Road Racing 2027 dates (season planner)' },
  { id: 'ng-2027-r21-23', start: '2027-10-09', end: '2027-10-10',
    circuit: 'pembrey', organiser: 'ng', status: 'confirmed', round: '21–23',
    source: 'NG Road Racing 2027 dates (season planner)' },

  /* ---------------- British Superbike Championship 2027 ----------------
     Enterable by club racers who hold a national licence, so these are ordinary
     race meetings here and take part in clash detection — a BSB round against a
     club round is exactly the choice this site exists to show. The two official
     tests are midweek, and rounds 1 and 8 run Saturday to Monday over the May
     and August bank holidays.                                                 */
  { id: 'bsb-2027-test1', start: '2027-03-26', end: '2027-03-27',
    circuit: 'donington', config: 'GP', organiser: 'bsb', status: 'confirmed', kind: 'test',
    name: 'Test 1',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-test2', start: '2027-04-20', end: '2027-04-21',
    circuit: 'oulton', config: 'International', organiser: 'bsb', status: 'confirmed', kind: 'test',
    name: 'Test 2',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r1', start: '2027-05-01', end: '2027-05-03',
    circuit: 'oulton', config: 'International', organiser: 'bsb', status: 'confirmed', round: '1',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r2', start: '2027-05-21', end: '2027-05-23',
    circuit: 'donington', config: 'GP', organiser: 'bsb', status: 'confirmed', round: '2',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r3', start: '2027-06-18', end: '2027-06-20',
    circuit: 'knockhill', organiser: 'bsb', status: 'confirmed', round: '3',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r4', start: '2027-07-02', end: '2027-07-04',
    circuit: 'snetterton', config: '300', organiser: 'bsb', status: 'confirmed', round: '4',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r5', start: '2027-07-16', end: '2027-07-18',
    circuit: 'brands-hatch', config: 'GP', organiser: 'bsb', status: 'confirmed', round: '5',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r6', start: '2027-07-30', end: '2027-08-01',
    circuit: 'oulton', config: 'International', organiser: 'bsb', status: 'confirmed', round: '6',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r7', start: '2027-08-06', end: '2027-08-08',
    circuit: 'thruxton', organiser: 'bsb', status: 'confirmed', round: '7',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r8', start: '2027-08-28', end: '2027-08-30',
    circuit: 'cadwell', organiser: 'bsb', status: 'confirmed', round: '8',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r9', start: '2027-09-17', end: '2027-09-19',
    circuit: 'assen', organiser: 'bsb', status: 'confirmed', round: '9',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r10', start: '2027-10-01', end: '2027-10-03',
    circuit: 'donington', config: 'GP', organiser: 'bsb', status: 'confirmed', round: '10',
    source: 'BSB 2027 calendar (season planner)' },
  { id: 'bsb-2027-r11', start: '2027-10-15', end: '2027-10-17',
    circuit: 'brands-hatch', config: 'GP', organiser: 'bsb', status: 'confirmed', round: '11',
    source: 'BSB 2027 calendar (season planner)' },

  /* ---------------- KMSC / Scottish Championship 2027 ----------------
     KMSC rounds at Knockhill double as Scottish Championship rounds, so these
     are one set of weekends, not two. All three fall Saturday–Sunday, which is
     consistent with the club's usual format. 2026 ran four rounds, the last
     being the Jock Taylor Memorial in October, so a final round is likely still
     to be announced. Knockhill is SACU-permitted, so these will never appear in
     the ACU permit data the scraper reads — they have to come from the club.    */
  { id: 'kmsc-2027-r1', start: '2027-04-10', end: '2027-04-11',
    circuit: 'knockhill', organiser: 'kmsc', status: 'confirmed', round: '1',
    name: 'Scottish Championship Round 1',
    source: 'KMSC / Scottish Championship 2027 dates' },
  { id: 'kmsc-2027-r2', start: '2027-05-08', end: '2027-05-09',
    circuit: 'knockhill', organiser: 'kmsc', status: 'confirmed', round: '2',
    name: 'Scottish Championship Round 2',
    source: 'KMSC / Scottish Championship 2027 dates' },
  { id: 'kmsc-2027-r3', start: '2027-07-24', end: '2027-07-25',
    circuit: 'knockhill', organiser: 'kmsc', status: 'confirmed', round: '3',
    name: 'Scottish Championship Round 3',
    source: 'KMSC / Scottish Championship 2027 dates' },

  /* ---------------- Andreas Racing Association 2027 ----------------
     Jurby, Isle of Man. Six race meetings and six test days, taken from the
     club's own 2027 poster. Every date matched the weekday printed against it,
     which is the check that the year is right. Five of the six test days are
     the Saturday before a race Sunday; 14 March stands alone. No round numbers
     were given, so none are recorded — ARA have previously numbered each DAY of
     a two-day meeting as its own round, so guessing them would likely be wrong. */
  { id: 'ara-27-03-14-test', start: '2027-03-14',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-03-20-test', start: '2027-03-20',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-04-10-test', start: '2027-04-10',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-05-08-test', start: '2027-05-08',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-06-26-test', start: '2027-06-26',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-09-11-test', start: '2027-09-11',
    circuit: 'jurby', organiser: 'ara', kind: 'test', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-03-21', start: '2027-03-21',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-04-11', start: '2027-04-11',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-05-09', start: '2027-05-09',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-06-27', start: '2027-06-27',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-07-17', start: '2027-07-17', end: '2027-07-18',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
  { id: 'ara-27-09-12', start: '2027-09-12',
    circuit: 'jurby', organiser: 'ara', status: 'confirmed',
    source: 'ARA 2027 events at Jurby (club poster)' },
];
