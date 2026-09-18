(function () {
  var q = document.getElementById('q');
  var fc = document.getElementById('f-circuit');
  var fo = document.getElementById('f-org');
  var ft = document.getElementById('f-type');
  var fr = document.getElementById('f-races');
  var fx = document.getElementById('f-clash');
  var reset = document.getElementById('reset');
  var count = document.getElementById('count');
  var cards = [].slice.call(document.querySelectorAll('.mtg'));
  var months = [].slice.call(document.querySelectorAll('.month'));
  var total = cards.length;

  function apply() {
    var term = q.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (el) {
      var ok = (!term || el.dataset.search.indexOf(term) > -1)
        && (!fc.value || el.dataset.circuit === fc.value)
        && (!fo.value || el.dataset.organiser === fo.value)
        && (!ft.value || el.dataset.type === ft.value)
        && (!fr.checked || el.dataset.kind === 'race')
        && (!fx.checked || el.dataset.clash === '1');
      el.hidden = !ok;
      if (ok) shown++;
    });
    months.forEach(function (m) {
      m.hidden = !m.querySelector('.mtg:not([hidden])');
    });
    count.textContent = shown === total
      ? total + (total === 1 ? ' meeting' : ' meetings')
      : 'Showing ' + shown + ' of ' + total;
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

  [q, fc, fo, ft, fr, fx].forEach(function (el) {
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });
  reset.addEventListener('click', function () {
    q.value = ''; fc.value = ''; fo.value = ''; ft.value = ''; fr.checked = false; fx.checked = false; apply();
  });
  apply();
})();
