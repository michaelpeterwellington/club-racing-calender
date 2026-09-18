// Bike identity rules. Riders enter machines however they like — "Honda 500",
// "Honda CB500" and "Honda CB 500" are one bike — so results are canonicalised
// to make + capacity, which is what actually determines what you can race.
//
// Two things need help:
//   capacityOf   model names that carry their capacity in the designator rather
//                than as a number ("R6" is a 600, not a 6).
//   dontMerge    make+capacity pairs that are genuinely different machines and
//                must stay apart despite sharing a capacity.
//
// This is the file to edit when the grouping gets something wrong. Run
// `node scrape/bikes.mjs --review` to see how entries are being grouped.

export const capacityOf = {
  // Yamaha
  R1: 1000, R6: 600, R7: 690, R3: 320, R125: 125, YZFR1: 1000, YZFR6: 600,
  FZR600: 600, TZ250: 250, TZ350: 350, TZR250: 250, RD350: 350, RD250: 250, SRX: 600,
  // Honda
  CB500: 500, CBR600: 600, CBR600RR: 600, CBR1000: 1000, CBR1000RR: 1000,
  CBR900: 900, CBR929: 900, CBR954: 1000, RS125: 125, RS250: 250, NSR250: 250,
  VFR400: 400, NC30: 400, RVF400: 400, CB750: 750, CB450: 450, CB350: 350,
  // Kawasaki
  ZX6R: 600, ZX636: 600, ZX10R: 1000, ZX9R: 900, ZX7R: 750, ZXR400: 400,
  NINJA400: 400, EX400: 400, NINJA300: 300, EX300: 300, NINJA650: 650, ER6: 650,
  // Suzuki
  GSXR600: 600, GSXR750: 750, GSXR1000: 1000, SV650: 650, SV: 650,
  RGV250: 250, GSXR400: 400,
  // Triumph / Ducati / Aprilia / BMW / KTM
  DAYTONA675: 675, STREET675: 675, RS660: 660, RSV4: 1000, RS250: 250,
  S1000RR: 1000, PANIGALE: 950, DUKE690: 690, RC390: 390,
  // Classics
  G50: 500, '7R': 350, MANX: 500, GOLDSTAR: 500, BANTAM: 175, TSS: 350,
};

// Kept apart despite matching make+capacity.
export const dontMerge = [
  // e.g. ['HONDA', 500, 'RS', 'two-stroke RS500 is not a CB500'],
];
