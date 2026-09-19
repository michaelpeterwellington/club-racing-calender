// Venues. One entry per VENUE, not per layout — "Snetterton 300" and
// "Snetterton 200" are the same place, so they share one page. The layout goes
// in the meeting's `config` field.
// short: three-letter venue code, the way a timing sheet abbreviates. Not shown
// on the page; it feeds the calendar's search, so typing "SNE" finds Snetterton.
// Kept as data, not derived — "Oliver's Mount" has no sensible abbreviation.
// type: 'short' (permanent circuit) | 'road' (closed public roads)
// layouts: only for venues that run more than one configuration for bikes. Lap
// times from different layouts are not comparable, so where this is present the
// layout has to be known before results can be pooled (see data/layouts.js).

export const circuits = [
  // England & Wales — short circuits
  { id: 'brands-hatch',  short: 'BRH', name: 'Brands Hatch',        region: 'South East',    type: 'short', layouts: ['Indy', 'GP'] },
  { id: 'cadwell',       short: 'CAD', name: 'Cadwell Park',        region: 'East Midlands', type: 'short' },
  { id: 'snetterton',    short: 'SNE', name: 'Snetterton',          region: 'East',          type: 'short', layouts: ['300', '200', '100'] },
  { id: 'donington',     short: 'DON', name: 'Donington Park',      region: 'East Midlands', type: 'short', layouts: ['National', 'GP'] },
  { id: 'oulton',        short: 'OUL', name: 'Oulton Park',         region: 'North West',    type: 'short', layouts: ['International', 'Island', 'Fosters'] },
  { id: 'aintree',       short: 'AIN', name: 'Aintree',             region: 'North West',    type: 'short' },
  { id: 'croft',         short: 'CRO', name: 'Croft',               region: 'North East',    type: 'short' },
  { id: 'mallory',       short: 'MAL', name: 'Mallory Park',        region: 'East Midlands', type: 'short' },
  { id: 'darley-moor',   short: 'DAR', name: 'Darley Moor',         region: 'East Midlands', type: 'short' },
  { id: 'silverstone',   short: 'SIL', name: 'Silverstone',         region: 'East Midlands', type: 'short' },
  { id: 'thruxton',      short: 'THR', name: 'Thruxton',            region: 'South',         type: 'short' },
  { id: 'castle-combe',  short: 'CCB', name: 'Castle Combe',        region: 'South West',    type: 'short' },
  { id: 'lydden-hill',   short: 'LYD', name: 'Lydden Hill',         region: 'South East',    type: 'short' },
  { id: 'pembrey',       short: 'PEM', name: 'Pembrey',             region: 'Wales',         type: 'short' },
  { id: 'anglesey',      short: 'ANG', name: 'Anglesey',            region: 'Wales',         type: 'short', layouts: ['Coastal', 'International', 'National'] },
  // Scotland & Northern Ireland — short circuits
  { id: 'knockhill',     short: 'KNO', name: 'Knockhill',           region: 'Scotland',      type: 'short' },
  { id: 'kirkistown',    short: 'KIR', name: 'Kirkistown',          region: 'Northern Ireland', type: 'short' },
  { id: 'bishopscourt',  short: 'BIS', name: 'Bishopscourt',        region: 'Northern Ireland', type: 'short' },
  // Road courses
  { id: 'olivers-mount', short: 'OLV',name: "Oliver's Mount",      region: 'Yorkshire',     type: 'road' },
  { id: 'billown',       short: 'BIL', name: 'Billown Circuit',     region: 'Isle of Man',   type: 'road' },
  { id: 'iom-mountain',  short: 'IOM', name: 'Isle of Man Mountain Course', region: 'Isle of Man', type: 'road' },
  { id: 'aberdare-park', short: 'ABE',name: 'Aberdare Park',       region: 'Wales',         type: 'road' },
  { id: 'nw200',         short: 'NW2', name: 'North West 200 Circuit', region: 'Northern Ireland', type: 'road' },
  { id: 'dundrod',       short: 'DUN', name: 'Dundrod',             region: 'Northern Ireland', type: 'road' },
  { id: 'cookstown',     short: 'CKS', name: 'Cookstown (Orritor)', region: 'Northern Ireland', type: 'road' },
  { id: 'tandragee',     short: 'TAN', name: 'Tandragee',           region: 'Northern Ireland', type: 'road' },
  { id: 'armoy',         short: 'ARM', name: 'Armoy',               region: 'Northern Ireland', type: 'road' },
];
