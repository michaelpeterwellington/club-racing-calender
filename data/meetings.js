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
//   entryUrl      optional
//   notes         optional  — one line
//   source        optional  — where it came from, so you can re-check it

export const meetings = [
  /* ---------------- BEMSEE / BMCRC 2027 ----------------
     Source: BMCRC "MRO 2027 PROVISIONAL DATES" post.
     Whole calendar is published as provisional. All race meetings have a
     BMCRC Friday test day.                                                  */
  { id: 'bemsee-2027-marshal-training', start: '2027-03-06',
    circuit: null, organiser: 'bemsee', kind: 'marshal',
    name: 'BMCRC Marshal Training Day', status: 'provisional',
    notes: 'Venue not stated in the club announcement.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-race-school', start: '2027-03-07',
    circuit: 'brands-hatch', config: 'Indy', organiser: 'bemsee', kind: 'school',
    name: 'BMCRC Race School', status: 'provisional',
    notes: 'Date TBC. On-track; ACU BRA-CTC course done online.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-oulton', start: '2027-03-25', end: '2027-03-27',
    circuit: 'oulton', organiser: 'bemsee', status: 'provisional',
    notes: 'Thursday–Saturday over Easter. Friday test day.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-brands', start: '2027-04-23', end: '2027-04-25',
    circuit: 'brands-hatch', config: 'Indy', organiser: 'bemsee', status: 'provisional',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-donington', start: '2027-05-14', end: '2027-05-16',
    circuit: 'donington', config: 'GP', organiser: 'bemsee', status: 'provisional',
    notes: '98dB drive-by noise limit. Friday test day.',
    source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-snetterton', start: '2027-06-11', end: '2027-06-13',
    circuit: 'snetterton', config: '300', organiser: 'bemsee', status: 'provisional',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-cadwell', start: '2027-07-16', end: '2027-07-18',
    circuit: 'cadwell', organiser: 'bemsee', status: 'provisional',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-anglesey', start: '2027-08-20', end: '2027-08-22',
    circuit: 'anglesey', organiser: 'bemsee', status: 'provisional',
    notes: 'Friday test day.', source: 'BMCRC 2027 provisional dates post' },

  { id: 'bemsee-2027-mallory', start: '2027-09-18', end: '2027-09-19',
    circuit: 'mallory', organiser: 'bemsee', status: 'provisional',
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
];
