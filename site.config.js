export const SITE = {
  name: 'UK Race Calendar',
  // Used for canonical URLs and the sitemap. Change when you pick a domain.
  url: 'https://club-racing-calender.pages.dev',

  // iCal UIDs are built from this, NOT from `url`. A UID identifies an event
  // for the life of a subscription: change it and every calendar that has
  // subscribed treats every meeting as brand new, duplicating the lot. So it is
  // deliberately a fixed identifier rather than the current hostname — moving
  // the site to a custom domain must not touch it. It never needs to resolve.
  uidDomain: 'club-racing-calender.pages.dev',
  contact: null, // e.g. 'hello@yourdomain.co.uk' — shown on the About page

  // Optional photograph behind the home page hero. Put the file in src/img/ and
  // name it here; leave null and the hero keeps its plain kerb-stripe treatment.
  // Self-hosted on purpose — hotlinking a stock library would be the only
  // third-party request the whole site makes. Landscape and wide works best:
  // it is cropped to a band roughly 1600x280 and sits well behind the heading.
  // Unsplash (unsplash.com/photos/1489731007795), free to use commercially
  // with no attribution required. Downscaled and re-encoded to 104KB — it
  // sits at low opacity behind a gradient, so it does not need to be sharp.
  hero: { src: 'img/hero.webp', alt: 'Four riders cranked over through a corner' },

  // Cookieless analytics. All four options below set no cookies and store no
  // personal data, so they need no consent banner under PECR — which is the
  // whole point of choosing them over Google Analytics. Leave provider null and
  // no script is emitted at all.
  //
  //   plausible  — domain: 'yourdomain.co.uk'                    (~£7/mo, or self-host free)
  //   fathom     — siteId: 'ABCDEFGH'                            (~£12/mo)
  //   cloudflare — siteId: '<token>'                             (free with Cloudflare Pages)
  //   umami      — siteId: '<uuid>', src: 'https://your-umami/script.js'  (self-host, free)
  analytics: {
    provider: null,
    domain: null,
    siteId: null,
    src: null,
  },
};
