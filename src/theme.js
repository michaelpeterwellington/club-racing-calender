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
