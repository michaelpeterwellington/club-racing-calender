// Venues. One entry per VENUE, not per layout — "Snetterton 300" and
// "Snetterton 200" are the same place, so they share one page. The layout goes
// in the meeting's `config` field.
// type: 'short' (permanent circuit) | 'road' (closed public roads)

export const circuits = [
  // England & Wales — short circuits
  { id: 'brands-hatch',  name: 'Brands Hatch',        region: 'South East',    type: 'short' },
  { id: 'cadwell',       name: 'Cadwell Park',        region: 'East Midlands', type: 'short' },
  { id: 'snetterton',    name: 'Snetterton',          region: 'East',          type: 'short' },
  { id: 'donington',     name: 'Donington Park',      region: 'East Midlands', type: 'short' },
  { id: 'oulton',        name: 'Oulton Park',         region: 'North West',    type: 'short' },
  { id: 'croft',         name: 'Croft',               region: 'North East',    type: 'short' },
  { id: 'mallory',       name: 'Mallory Park',        region: 'East Midlands', type: 'short' },
  { id: 'darley-moor',   name: 'Darley Moor',         region: 'East Midlands', type: 'short' },
  { id: 'silverstone',   name: 'Silverstone',         region: 'East Midlands', type: 'short' },
  { id: 'thruxton',      name: 'Thruxton',            region: 'South',         type: 'short' },
  { id: 'castle-combe',  name: 'Castle Combe',        region: 'South West',    type: 'short' },
  { id: 'lydden-hill',   name: 'Lydden Hill',         region: 'South East',    type: 'short' },
  { id: 'pembrey',       name: 'Pembrey',             region: 'Wales',         type: 'short' },
  { id: 'anglesey',      name: 'Anglesey',            region: 'Wales',         type: 'short' },
  // Scotland & Northern Ireland — short circuits
  { id: 'knockhill',     name: 'Knockhill',           region: 'Scotland',      type: 'short' },
  { id: 'kirkistown',    name: 'Kirkistown',          region: 'Northern Ireland', type: 'short' },
  { id: 'bishopscourt',  name: 'Bishopscourt',        region: 'Northern Ireland', type: 'short' },
  // Road courses
  { id: 'olivers-mount', name: "Oliver's Mount",      region: 'Yorkshire',     type: 'road' },
  { id: 'billown',       name: 'Billown Circuit',     region: 'Isle of Man',   type: 'road' },
  { id: 'iom-mountain',  name: 'Isle of Man Mountain Course', region: 'Isle of Man', type: 'road' },
  { id: 'aberdare-park', name: 'Aberdare Park',       region: 'Wales',         type: 'road' },
  { id: 'nw200',         name: 'North West 200 Circuit', region: 'Northern Ireland', type: 'road' },
  { id: 'dundrod',       name: 'Dundrod',             region: 'Northern Ireland', type: 'road' },
  { id: 'cookstown',     name: 'Cookstown (Orritor)', region: 'Northern Ireland', type: 'road' },
  { id: 'tandragee',     name: 'Tandragee',           region: 'Northern Ireland', type: 'road' },
  { id: 'armoy',         name: 'Armoy',               region: 'Northern Ireland', type: 'road' },
];
