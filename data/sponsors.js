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
  // Where the form posts. Any service that accepts a plain HTML form post will
  // do — Buttondown, MailerLite, Kit, Mailchimp, a self-hosted Listmonk. Leave
  // null and the block is hidden everywhere, which is the current state.
  action: 'https://c31e5155.sibforms.com/serve/MUIFAERs3uZgTWNfv4XcB3vTghraVlEkYkDQgLAW_-Wtr6K8NvQBJKeqayQx4a9ycxSPDgTNZ4KhXCCpCauikZHmC03AAwFQpabQPgGxG9EVjk-yrwNXlnISOaUwY0CaOwbOcaGdjLDxhcz45sJ6sG-jtExgxrD-KBHX5WhlfRARL1ltdzfCWkUWdEk34aM8EmMrBY4h4r4ieg6ICg==',


  // The field name the service expects the address in. Most want 'email';
  // Brevo and Mailchimp want 'EMAIL'. Get this wrong and every signup is
  // silently lost, so check it against their embed code rather than assuming.
  field: 'EMAIL',

  // Any other inputs the provider's own embed code carries. Copy them from
  // there rather than guessing — a made-up name fails silently.
  hidden: { locale: 'en' },

  // A field real people never see and bots fill in anyway; submissions with it
  // filled are dropped. Only set it if the provider expects one, by the name it
  // expects. Brevo calls it 'email_address_check'.
  honeypot: 'email_address_check',

  // Why anyone would hand over an address. Deadlines are the honest answer: a
  // rider who misses one loses a round, and nobody else sends that reminder.
  pitch: 'One email a week through the season: whose entries close next, and which '
    + 'clubs have just published their dates. Nothing else.',

  // Shown under the form. You need a lawful basis to email people and they need
  // to know what they are in for before they consent, not after.
  smallprint: 'Race dates and deadlines only. Unsubscribe in one click.',

  // Where the rider lands after signing up is a setting in the provider's own
  // dashboard, not something this form can carry — the field name for it differs
  // between services, so guessing one here would just silently do nothing.
};

/* Brevo, for reference. Create the form under Contacts → Forms, then open its
   share/embed code and copy the values out of it — do not trust these blind, as
   Brevo has changed the shape of the embed before:

     action:   'https://sibforms.com/serve/<your-form-id>',
     field:    'EMAIL',
     hidden:   { locale: 'en' },
     honeypot: 'email_address_check',

   Double opt-in is worth switching on in Brevo as well: it gives you a record
   of consent, which is what makes the list lawful to mail.                     */

// Accommodation affiliate, shown on circuit pages. Circuits are rural and most
// meetings are a weekend, so this is the one affiliate link that is genuinely
// useful rather than tacked on.
//
// Set `bookingAid` to your Booking.com affiliate id to switch it on; null hides
// the block entirely. Every link is rendered rel="sponsored nofollow" with a
// visible disclosure, which the CMA requires for affiliate content, not just ads.
export const accommodation = {
  bookingAid: null,
  // Booking.com searches on place names. A circuit's own name usually works;
  // override where the nearest town is the better search.
  searchOverrides: {
    'billown': 'Castletown, Isle of Man',
    'iom-mountain': 'Douglas, Isle of Man',
    'olivers-mount': 'Scarborough',
    'nw200': 'Portrush',
    'darley-moor': 'Ashbourne, Derbyshire',
    'cadwell': 'Louth, Lincolnshire',
    'pembrey': 'Llanelli',
    'anglesey': 'Anglesey, Wales',
  },
};
