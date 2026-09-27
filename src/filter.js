(function () {
  var q = document.getElementById('q');
  var fc = document.getElementById('f-circuit');
  var fo = document.getElementById('f-org');
  var ft = document.getElementById('f-type');
  var fr = document.getElementById('f-races');
  var fx = document.getElementById('f-clash');
  var reset = document.getElementById('reset');
  var count = document.getElementById('count');
  var rows = [].slice.call(document.querySelectorAll('.mtg'));
  var months = [].slice.call(document.querySelectorAll('.month'));
  var total = rows.length;
  // Which months the page was served with open, so clearing a filter puts them
  // back rather than leaving the whole season expanded.
  months.forEach(function (m) { m.dataset.defaultOpen = m.open ? '1' : '0'; });

  // The headline figures describe the calendar you are looking at, so they are
  // recounted from the visible rows rather than left showing the whole season
  // while the list underneath shows one club. Every number comes off data
  // attributes already on each row, so there is nothing to keep in step.
  var statEls = {
    meetings: document.getElementById('stat-meetings'),
    clubs: document.getElementById('stat-clubs'),
    circuits: document.getElementById('stat-circuits'),
    clashes: document.getElementById('stat-clashes')
  };
  // The header carries the same three figures. Leaving those static would put
  // two different answers to the same question on screen at once. Only this
  // page has a filter, and only this page loads this script, so the counts stay
  // site-wide everywhere else.
  var headEls = {
    meetings: document.querySelector('.hs-meetings'),
    clubs: document.querySelector('.hs-clubs'),
    circuits: document.querySelector('.hs-circuits')
  };
  var LABELS = {
    meetings: ['Race meeting', 'Race meetings'], clubs: ['Club', 'Clubs'],
    circuits: ['Circuit', 'Circuits'], clashes: ['Date clash', 'Date clashes']
  };
  var HEAD_LABELS = {
    meetings: ['Meeting', 'Meetings'], clubs: ['Club', 'Clubs'], circuits: ['Circuit', 'Circuits']
  };
  function stats(vis) {
    var races = 0, clashes = 0, clubs = {}, circuits = {};
    for (var i = 0; i < vis.length; i++) {
      var d = vis[i].dataset;
      if (d.kind === 'race') races++;
      if (d.clash === '1') clashes++;
      if (d.organiser) clubs[d.organiser] = 1;
      // A meeting with no venue yet would otherwise count as a circuit.
      if (d.circuit) circuits[d.circuit] = 1;
    }
    var n = { meetings: races, clubs: Object.keys(clubs).length,
              circuits: Object.keys(circuits).length, clashes: clashes };
    // Filtering to one club is a normal thing to do, and "1 Clubs" reads as a
    // bug. The labels move with the number.
    for (var k in statEls) if (statEls[k]) {
      statEls[k].textContent = n[k];
      var lab = statEls[k].nextElementSibling;
      if (lab && LABELS[k]) lab.textContent = LABELS[k][n[k] === 1 ? 0 : 1];
    }
    for (var h in headEls) if (headEls[h]) {
      headEls[h].textContent = n[h];
      // The header's label is a bare text node beside the number, not an element.
      var t = headEls[h].nextSibling;
      if (t && HEAD_LABELS[h]) t.textContent = ' ' + HEAD_LABELS[h][n[h] === 1 ? 0 : 1];
    }
  }

  function apply() {
    var term = q.value.trim().toLowerCase();
    var filtering = !!(term || fc.value || fo.value || ft.value || fr.checked || fx.checked);
    var shown = 0;
    var vis = [];
    rows.forEach(function (el) {
      var ok = (!term || el.dataset.search.indexOf(term) > -1)
        && (!fc.value || el.dataset.circuit === fc.value)
        && (!fo.value || el.dataset.organiser === fo.value)
        && (!ft.value || el.dataset.type === ft.value)
        && (!fr.checked || el.dataset.kind === 'race')
        && (!fx.checked || el.dataset.clash === '1');
      el.hidden = !ok;
      if (ok) { shown++; vis.push(el); }
    });
    months.forEach(function (m) {
      var n = m.querySelectorAll('.mtg:not([hidden])').length;
      m.hidden = !n;
      // A match hidden inside a closed month reads as no match at all, so a
      // running filter opens every month that has one.
      m.open = filtering ? true : m.dataset.defaultOpen === '1';
      // The month header carries its own count, so it has to track the filter.
      var c = m.querySelector('.month-count');
      if (c) c.textContent = n + (n === 1 ? ' meeting' : ' meetings');
    });
    count.textContent = shown === total
      ? total + (total === 1 ? ' result' : ' results')
      : shown + ' of ' + total;
    stats(vis);
    try {
      var p = new URLSearchParams();
      if (term) p.set('q', term);
      if (fc.value) p.set('circuit', fc.value);
      if (fo.value) p.set('club', fo.value);
      if (ft.value) p.set('type', ft.value);
      if (fr.checked) p.set('races', '1');
      if (fx.checked) p.set('clashes', '1');
      var s = p.toString();
      history.replaceState(null, '', s ? '?' + s : location.pathname);
    } catch (e) {}
  }

  try {
    var p = new URLSearchParams(location.search);
    q.value = p.get('q') || '';
    fc.value = p.get('circuit') || '';
    fo.value = p.get('club') || '';
    ft.value = p.get('type') || '';
    fr.checked = p.get('races') === '1';
    fx.checked = p.get('clashes') === '1';
  } catch (e) {}

  /* ---------- suggestions ----------
     Safari draws a <datalist> as a small popover rather than a dropdown that
     filters, and on a phone it is worse, so the list attribute is dropped and
     this drives its own listbox. The datalist stays in the markup as the
     no-JavaScript fallback; removing the attribute means a browser never shows
     both at once. */
  (function () {
    var box = document.getElementById('q-list');
    var data = document.getElementById('searchterms');
    if (!box || !data) return;
    var terms = [].slice.call(data.options).map(function (o) {
      return { t: o.value, k: o.dataset.kind || '' };
    });
    q.removeAttribute('list');
    var open = [];
    var active = -1;

    function close() {
      box.hidden = true; box.innerHTML = ''; open = []; active = -1;
      q.setAttribute('aria-expanded', 'false');
      q.removeAttribute('aria-activedescendant');
    }

    function mark(text, term) {
      var i = text.toLowerCase().indexOf(term);
      if (i < 0) return document.createTextNode(text);
      var f = document.createDocumentFragment();
      f.appendChild(document.createTextNode(text.slice(0, i)));
      var b = document.createElement('b');
      b.textContent = text.slice(i, i + term.length);
      f.appendChild(b);
      f.appendChild(document.createTextNode(text.slice(i + term.length)));
      return f;
    }

    function show() {
      var term = q.value.trim().toLowerCase();
      if (!term) return close();
      // Anywhere in the word, not just the start: "park" should find Cadwell
      // Park. Ones that start with it rank first, because that is what a person
      // typing two letters is usually after.
      var hits = terms.filter(function (x) { return x.t.toLowerCase().indexOf(term) > -1; });
      hits.sort(function (a, b) {
        var ai = a.t.toLowerCase().indexOf(term) === 0 ? 0 : 1;
        var bi = b.t.toLowerCase().indexOf(term) === 0 ? 0 : 1;
        return ai - bi || a.t.localeCompare(b.t, 'en');
      });
      hits = hits.slice(0, 8);
      // An exact match is already typed out in full; offering it says nothing.
      if (!hits.length || (hits.length === 1 && hits[0].t.toLowerCase() === term)) return close();
      box.innerHTML = '';
      hits.forEach(function (x, i) {
        var li = document.createElement('li');
        li.id = 'q-opt-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        // The name goes in its own element. The li is a flex row, so loose text
        // nodes each became a flex item and the row gap opened up inside the
        // word: "P embrey".
        var name = document.createElement('span');
        name.className = 'combo-name';
        name.appendChild(mark(x.t, term));
        li.appendChild(name);
        if (x.k) {
          var kind = document.createElement('span');
          kind.className = 'combo-kind';
          kind.textContent = x.k;
          li.appendChild(kind);
        }
        // mousedown, not click: the input blurs first on click and the list is
        // already gone by then.
        li.addEventListener('mousedown', function (e) { e.preventDefault(); pick(i); });
        box.appendChild(li);
      });
      open = hits; active = -1;
      box.hidden = false;
      q.setAttribute('aria-expanded', 'true');
    }

    function highlight(n) {
      var items = box.children;
      for (var i = 0; i < items.length; i++) {
        var on = i === n;
        items[i].classList.toggle('is-active', on);
        items[i].setAttribute('aria-selected', String(on));
      }
      active = n;
      if (n > -1) {
        q.setAttribute('aria-activedescendant', 'q-opt-' + n);
        if (items[n].scrollIntoView) items[n].scrollIntoView({ block: 'nearest' });
      } else {
        q.removeAttribute('aria-activedescendant');
      }
    }

    function pick(n) {
      if (!open[n]) return;
      q.value = open[n].t;
      close();
      apply();
    }

    q.addEventListener('input', show);
    q.addEventListener('focus', show);
    q.addEventListener('blur', function () { setTimeout(close, 120); });
    q.addEventListener('keydown', function (e) {
      if (box.hidden) {
        if (e.key === 'ArrowDown') { show(); e.preventDefault(); }
        return;
      }
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % open.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight((active - 1 + open.length) % open.length); }
      else if (e.key === 'Enter' && active > -1) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') { close(); }
    });
    reset.addEventListener('click', close);
  })();

  [q, fc, fo, ft, fr, fx].forEach(function (el) {
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });
  reset.addEventListener('click', function () {
    q.value = ''; fc.value = ''; fo.value = ''; ft.value = ''; fr.checked = false; fx.checked = false; apply();
  });

  // Opening a row leaves the previous one open too, which turns a scan into a
  // scroll. One at a time reads like a timing screen drilling into a session.
  document.addEventListener('toggle', function (e) {
    var el = e.target;
    if (!el.open || !el.classList.contains('mtg')) return;
    rows.forEach(function (o) { if (o !== el) o.open = false; });
  }, true);

  apply();
})();
