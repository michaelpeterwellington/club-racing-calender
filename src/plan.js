(function () {
  var KEY = 'season';
  var list = document.getElementById('plandata');
  var countEl = document.getElementById('plan-count');
  var dl = document.getElementById('plan-dl');
  var clear = document.getElementById('plan-clear');
  var warn = document.getElementById('plan-warn');
  var prompt = document.getElementById('plan-signup');
  if (!list || !dl) return;

  var data = {};
  try { data = JSON.parse(list.textContent || '{}'); } catch (e) { return; }
  var boxes = [].slice.call(document.querySelectorAll('.picks input[type=checkbox]'));

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      // Drop anything no longer in the calendar, so a meeting that has been
      // cancelled or has passed does not sit in the plan for ever.
      return v.filter(function (id) { return data[id]; });
    } catch (e) { return []; }
  }
  function save(ids) {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) {}
  }
  function chosen() {
    return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
  }

  function paint() {
    var ids = chosen();
    save(ids);
    var n = ids.length;
    countEl.textContent = n
      ? n + (n === 1 ? ' meeting picked' : ' meetings picked')
      : 'Nothing picked yet';
    dl.disabled = !n;
    clear.disabled = !n;
    // Only worth asking once there is a plan to go stale.
    if (prompt) prompt.hidden = !n;

    // A clash only matters if both sides are in the plan. Warning about every
    // meeting that clashes with something would flag nearly the whole calendar.
    var set = {}, i;
    for (i = 0; i < ids.length; i++) set[ids[i]] = 1;
    var pairs = [];
    for (i = 0; i < ids.length; i++) {
      var against = data[ids[i]].c || [];
      for (var j = 0; j < against.length; j++) {
        if (set[against[j]] && ids[i] < against[j]) pairs.push([ids[i], against[j]]);
      }
    }
    boxes.forEach(function (b) {
      var bad = b.checked && (data[b.value].c || []).some(function (o) { return set[o]; });
      b.closest('.pick').classList.toggle('is-clash', bad);
    });
    if (!pairs.length) { warn.hidden = true; warn.textContent = ''; return; }
    warn.hidden = false;
    warn.textContent = pairs.length === 1
      ? 'Two of your picks are on the same weekend. You cannot do both.'
      : pairs.length + ' pairs of your picks are on the same weekend. You cannot do both of each.';
  }

  function build(ids) {
    // The server already produced each VEVENT, correctly escaped and folded;
    // this only wraps the chosen ones. CRLF throughout, as iCalendar requires.
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UK Race Calendar//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:My season', 'X-PUBLISHED-TTL:PT12H'];
    // In date order, which is the order the page lists them in.
    boxes.forEach(function (b) { if (b.checked) out.push(data[b.value].v); });
    out.push('END:VCALENDAR');
    return out.join('\r\n') + '\r\n';
  }

  dl.addEventListener('click', function () {
    var ids = chosen();
    if (!ids.length) return;
    var blob = new Blob([build(ids)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'my-season.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });

  clear.addEventListener('click', function () {
    boxes.forEach(function (b) { b.checked = false; });
    paint();
  });

  boxes.forEach(function (b) { b.addEventListener('change', paint); });

  var saved = load();
  for (var i = 0; i < boxes.length; i++) {
    if (saved.indexOf(boxes[i].value) > -1) boxes[i].checked = true;
  }
  paint();
})();
