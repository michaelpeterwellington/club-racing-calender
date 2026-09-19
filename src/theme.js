// Everything sticky is positioned below the site header, so --head has to equal
// the header's real height. That height is content- and width-dependent: the bar
// folds to two rows on a tablet and three on a phone, and CSS cannot express
// "stick below that element". Pinning it per breakpoint would drift silently the
// next time a nav item is added, so measure it instead. Without JavaScript the
// stylesheet's own value stands, which is right on desktop and a little short on
// a phone — a worse sticky offset, not a broken page.
(function () {
  // Both bars wrap to two or three rows as the viewport narrows, so their real
  // heights have to be measured rather than assumed.
  var bars = [
    // Deliberately NOT --head / --filterbar: those are the authored minimums the
    // bars are laid out from. Writing a measurement back into one feeds an element
    // its own size, and it grows by a border on every observation.
    { el: document.querySelector('header.site'), prop: '--head-actual', last: 0 },
    { el: document.querySelector('.filters'), prop: '--filterbar-actual', last: 0 }
  ].filter(function (b) { return b.el; });
  if (!bars.length) return;

  function measure() {
    bars.forEach(function (b) {
      // A bar that has stopped sticking contributes nothing to sit below.
      var stuck = getComputedStyle(b.el).position === 'sticky';
      // Ceil, not round: a fraction short leaves the pinned heading peeking out
      // from under the bar it is supposed to sit below.
      var h = stuck ? Math.ceil(b.el.getBoundingClientRect().height) : 0;
      if (h === b.last) return;
      b.last = h;
      document.documentElement.style.setProperty(b.prop, h + 'px');
    });
  }
  measure();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(measure);
    bars.forEach(function (b) { ro.observe(b.el); });
  } else {
    window.addEventListener('resize', measure);
  }
  // Webfonts land after first paint and change the heights with them.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();

(function () {
  var KEY = 'theme';
  // Dark is the site's own look, so it is what an undecided visitor gets.
  // Change this to 'auto' to follow the operating system by default instead.
  var FALLBACK = 'dark';

  var box = document.querySelector('.theme');
  if (!box) return;
  var mq = window.matchMedia('(prefers-color-scheme: light)');

  function preference() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'auto' || v === 'light' || v === 'dark' ? v : FALLBACK;
    } catch (e) {
      // Private mode, or storage blocked. The site still works, it just forgets.
      return FALLBACK;
    }
  }

  function paint() {
    var pref = preference();
    document.documentElement.dataset.theme =
      pref === 'auto' ? (mq.matches ? 'light' : 'dark') : pref;
    var buttons = box.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.themeSet === pref));
    }
  }

  box.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-set]');
    if (!btn) return;
    try { localStorage.setItem(KEY, btn.dataset.themeSet); } catch (e2) {}
    paint();
  });

  // Following the system means following it as it changes, not only at load.
  mq.addEventListener('change', paint);

  box.hidden = false;
  paint();
})();
