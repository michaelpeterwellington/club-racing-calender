(function () {
  var input = document.getElementById('mylap');
  var clear = document.getElementById('mylap-clear');
  var table = document.getElementById('pacetable');
  if (!input || !table) return;
  var rows = [].slice.call(table.querySelectorAll('tbody tr'));

  // "1:38.5", "98.5", "1.38.5" all mean the same thing to a rider.
  function toSec(v) {
    v = String(v || '').trim().replace(',', '.');
    var m = v.match(/^(?:(\d+)[:.])?(\d{1,2}(?:\.\d+)?)$/);
    if (!m) return null;
    if (m[1] === undefined) return parseFloat(m[2]);
    return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
  }
  var f2 = function (n) { return (n < 0 ? '-' : '+') + Math.abs(n).toFixed(2) + 's'; };

  function apply() {
    var you = toSec(input.value);
    rows.forEach(function (tr) {
      var cell = tr.querySelector('.verdict');
      tr.className = '';
      if (!you) { cell.textContent = ''; return; }
      var win = parseFloat(tr.dataset.win), pod = parseFloat(tr.dataset.podium),
          mid = parseFloat(tr.dataset.mid), nat = parseFloat(tr.dataset.nat),
          ratio = parseFloat(tr.dataset.ratio) || 1.015;
      var label, cls;
      if (win && you <= win) { label = 'Win ' + f2(you - win); cls = 'v-win'; }
      else if (pod && you <= pod) { label = 'Podium'; cls = 'v-podium'; }
      else if (mid && you <= mid) { label = 'Top half ' + f2(you - win); cls = 'v-mid'; }
      else { label = f2(you - win) + ' off the win'; cls = 'v-off'; }
      // national mark compares race averages, so project the best lap forward
      if (nat) {
        var projected = you * ratio;
        label += projected <= nat ? ' · national ✓' : '';
        if (projected > nat) label += ' · national needs ' + (projected - nat).toFixed(2) + 's';
      }
      cell.textContent = label;
      tr.className = cls;
    });
    try {
      if (you) localStorage.setItem('mylap', input.value); else localStorage.removeItem('mylap');
    } catch (e) {}
  }

  try { var saved = localStorage.getItem('mylap'); if (saved) input.value = saved; } catch (e) {}
  input.addEventListener('input', apply);
  clear.addEventListener('click', function () { input.value = ''; apply(); input.focus(); });
  apply();
})();
