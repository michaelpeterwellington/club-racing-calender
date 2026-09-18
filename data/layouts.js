// Circuit layout per club, where the timing provider doesn't say.
//
// This matters more than it looks. A Donington GP lap and a Donington National
// lap differ by about 25 seconds, and Brands GP against Brands Indy by over 40,
// so pooling them into one pace table produces numbers that are not merely
// imprecise but meaningless. TSL frequently give only the bare venue name
// ("Brands Hatch", "Snetterton"), so layouts are pinned here, keyed by
// "<club>|<venue string exactly as TSL writes it>".
//
// analyse.mjs warns about any club/venue pair at a multi-layout circuit that
// isn't listed here, and keeps such groups separate rather than merging them.
export const layouts = {
  // Told to us directly.
  'nolimits|Brands Hatch': 'GP',
  'ngroadracing|Brands Hatch': 'Indy',

  // Inferred from lap times against a layout the same data names outright.
  // The separation is not subtle, so these are safe, but they are inferences:
  //   Donington    NG 73.2s vs BMCRC National 75.0s   |  NLR 96.0s vs BMCRC GP 101.4s
  //   Snetterton   NLR 117.4s, BMCRC 122.1s  vs  BMCRC 300 121.3s
  'ngroadracing|Donington': 'National',
  'ngroadracing|Donington Park': 'National',
  'nolimits|Donington Park': 'GP',
  'nolimits|Snetterton': '300',
  'bmcrc|Snetterton': '300',

  // Inferred without a same-venue reference in the data: 72.6s matches the
  // Coastal layout; the International layout is half a minute slower. Lower
  // confidence than the above — worth confirming with the club.
  'ngroadracing|Anglesey': 'Coastal',
  // BHR's fastest lap there is 76.5s. On classic machinery that fits Coastal
  // (NG's modern bikes win in 69-77s); the International layout would put even
  // quick classics past 110s.
  'bhr|Anglesey': 'Coastal',

  // CRMC, inferred from winning pace against layouts named in the same data:
  //   Donington  79s  vs National 73-75s, GP 96-101s
  //   Anglesey   80s  vs Coastal 73-83s
  //   Snetterton 82s  vs the 300 layout at 117-121s, so the short circuit —
  //              and CRMC's own 2027 calendar says "Snetterton 200".
  'crmc|Donington Park': 'National',
  'crmc|Anglesey': 'Coastal',
  'crmc|Snetterton': '200',
};
