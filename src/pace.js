(function () {
  var input = document.getElementById('mylap');
  var clear = document.getElementById('mylap-clear');
  var bike = document.getElementById('mybike');
  var hint = document.getElementById('bikehint');
  var groups = {};
  try { groups = JSON.parse((document.getElementById('bikedata') || {}).textContent || '{}'); } catch (e) {}
  var table = document.getElementById('pacetable');
  if (!input || !table) return;
  var tbody = table.querySelector('tbody');
  var rows = [].slice.call(table.querySelectorAll('tbody tr'));
  // The published order is fastest class first. Remember it so clearing the
  // form puts the table back exactly as it was served.
  rows.forEach(function (tr, i) { tr.dataset.ord = i; });

  // "1:38.5", "98.5", "1.38.5" all mean the same thing to a rider.
  function toSec(v) {
    v = String(v || '').trim().replace(',', '.');
    var m = v.match(/^(?:(\d+)[:.])?(\d{1,2}(?:\.\d+)?)$/);
    if (!m) return null;
    if (m[1] === undefined) return parseFloat(m[2]);
    return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
  }
  var f2 = function (n) { return (n < 0 ? '-' : '+') + Math.abs(n).toFixed(2) + 's'; };

  // How well the lap went in this class, best first. Mirrors the verdict classes
  // so the ranking can never disagree with the colour on the row.
  function tier(tr) {
    if (tr.classList.contains('v-win')) return 0;
    if (tr.classList.contains('v-podium')) return 1;
    if (tr.classList.contains('v-mid')) return 2;
    if (tr.classList.contains('v-off')) return 3;
    return 4;
  }

  // The point of the table is "where would I be competitive", and that answer is
  // useless at the bottom of thirty rows. Once a lap or a bike is entered the
  // classes the rider would go best in come to the top; clearing puts it back.
  function reorder(you) {
    var order = rows.slice();
    if (!you && !(bike && bike.value)) {
      order.sort(function (a, b) { return a.dataset.ord - b.dataset.ord; });
    } else {
      order.sort(function (a, b) {
        // A class nobody has raced your bike in tells you nothing, so it sinks
        // below every class that does have a comparison.
        var an = a.classList.contains('no-bike') ? 1 : 0;
        var bn = b.classList.contains('no-bike') ? 1 : 0;
        if (an !== bn) return an - bn;
        var at = tier(a), bt = tier(b);
        if (at !== bt) return at - bt;
        // Same verdict: closest to the winning lap first, measured either side.
        // Winning a class by forty seconds is not a race you want to enter, so
        // the tightest class you could still win leads, not the softest.
        var am = you ? Math.abs(you - parseFloat(a.dataset.win)) : NaN;
        var bm = you ? Math.abs(you - parseFloat(b.dataset.win)) : NaN;
        if (isNaN(am)) am = Infinity;
        if (isNaN(bm)) bm = Infinity;
        if (am !== bm) return am - bm;
        return a.dataset.ord - b.dataset.ord;
      });
    }
    order.forEach(function (tr) { tbody.appendChild(tr); });
  }

  function apply() {
    var you = toSec(input.value);
    var chosen = bike ? bike.value : '';
    var matched = 0;
    rows.forEach(function (tr) {
      var cell = tr.querySelector('.verdict');
      var bcell = tr.querySelector('.onbike');
      tr.className = '';

      // Pace of riders on the selected bike, in this class at this circuit.
      var entry = null;
      if (chosen) {
        var list = groups[tr.dataset.key] || [];
        for (var i = 0; i < list.length; i++) if (list[i].key === chosen) { entry = list[i]; break; }
        if (bcell) bcell.textContent = entry ? entry.typicalLap + '  (' + entry.riders + ')' : '\u2014';
        if (!entry) tr.classList.add('no-bike'); else matched++;
      } else if (bcell) bcell.textContent = '';

      if (!you) { cell.textContent = ''; return; }
      var win = parseFloat(tr.dataset.win), pod = parseFloat(tr.dataset.podium),
          mid = parseFloat(tr.dataset.mid), nat = parseFloat(tr.dataset.nat),
          ratio = parseFloat(tr.dataset.ratio) || 1.015;
      var label, cls;
      if (win && you <= win) { label = 'Win ' + f2(you - win); cls = 'v-win'; }
      else if (pod && you <= pod) { label = 'Podium'; cls = 'v-podium'; }
      else if (mid && you <= mid) { label = 'Top half ' + f2(you - win); cls = 'v-mid'; }
      else { label = f2(you - win) + ' off the win'; cls = 'v-off'; }
      // With a bike chosen, compare against riders on that bike too.
      if (entry && entry.typicalLap) {
        var onBike = toSec(entry.typicalLap);
        if (onBike) label += ' \u00b7 ' + (you <= onBike ? 'ahead of' : 'behind') + ' others on your bike';
      }
      // national mark compares race averages, so project the best lap forward
      if (nat) {
        var projected = you * ratio;
        label += projected <= nat ? ' · national ✓' : '';
        if (projected > nat) label += ' · national needs ' + (projected - nat).toFixed(2) + 's';
      }
      cell.textContent = label;
      tr.classList.add(cls);
    });
    // After the verdicts exist, not before — the ranking reads them off the rows.
    reorder(you);
    if (hint) {
      if (chosen) {
        hint.hidden = false;
        var shown = bike.options[bike.selectedIndex].textContent.replace(/\s*\(\d+\)\s*$/, '');
        hint.textContent = matched
          ? shown + ' has raced in ' + matched + ' of these ' + rows.length + ' classes here. The rest are dimmed.'
          : 'No results for a ' + shown + ' at this circuit yet, so every class is shown.';
      } else hint.hidden = true;
    }
    try {
      if (you) localStorage.setItem('mylap', input.value); else localStorage.removeItem('mylap');
      // Remembered per browser, no account needed.
      if (bike) { if (bike.value) localStorage.setItem('mybike', bike.value); else localStorage.removeItem('mybike'); }
    } catch (e) {}
  }

  try {
    var saved = localStorage.getItem('mylap'); if (saved) input.value = saved;
    var sb = localStorage.getItem('mybike');
    if (sb && bike) for (var k = 0; k < bike.options.length; k++) if (bike.options[k].value === sb) bike.value = sb;
  } catch (e) {}
  input.addEventListener('input', apply);
  if (bike) bike.addEventListener('change', apply);
  clear.addEventListener('click', function () {
    input.value = ''; if (bike) bike.value = ''; apply(); input.focus();
  });
  apply();
})();
