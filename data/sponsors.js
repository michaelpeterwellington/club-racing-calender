// PHASE 2 — monetisation hooks. Empty for now; slots render nothing when empty,
// so the site stays clean until there's something real to put in them.
//
// slot: 'top' (below header) | 'inline' (between months in the list) | 'footer'
// Keep `sponsored: true` on anything paid — it renders a visible "Ad" label and
// adds rel="sponsored nofollow", which is both the ASA/CAP requirement for
// identifiable ads and Google's requirement for paid links.
export const sponsors = [
  // { id: 'example', slot: 'top', title: 'Race tyres, fitted trackside',
  //   body: 'One line of copy.', url: 'https://...', sponsored: true },
];

// Affiliate/partner links keyed by circuit id — e.g. accommodation near the
// circuit. Rendered on circuit pages. Also empty until phase 2.
export const circuitLinks = {
  // 'cadwell': [{ title: 'Places to stay near Cadwell', url: 'https://...', sponsored: true }],
};

// Set to a form action URL (Buttondown, Mailchimp, Beehiiv...) to switch the
// newsletter block on. null = block is hidden entirely.
export const newsletter = {
  action: null,
  pitch: 'A short email each week: what’s racing, and whose entries just opened.',
};
