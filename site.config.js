export const SITE = {
  name: 'UK Race Calendar',
  // Used for canonical URLs, sitemap and iCal UIDs. Change when you pick a domain.
  url: 'https://example.com',
  contact: null, // e.g. 'hello@yourdomain.co.uk' — shown on the About page

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
