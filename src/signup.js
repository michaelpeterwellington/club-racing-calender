(function () {
  var form = document.querySelector('.signup form');
  if (!form || !window.fetch || !window.URLSearchParams) return;
  var note = form.querySelector('.signup-note');
  var button = form.querySelector('button');
  var smallprint = note ? note.textContent : '';

  function say(text, kind) {
    if (!note) return;
    note.textContent = text;
    note.className = 'signup-note' + (kind ? ' signup-note--' + kind : '');
  }

  // Without this the browser posts natively and navigates to the provider's bare
  // JSON reply — which is what the target="_blank" fallback is for, and why it
  // exists only for people with no JavaScript.
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // We control the submit, so the trap can be sprung here: a bot that filled
    // the hidden field gets a success message and nothing else happens.
    var trap = form.querySelector('input.vh[type=text]');
    if (trap && trap.value) { say('Done — check your email to confirm.', 'ok'); return; }

    button.disabled = true;
    say('Signing you up…');

    // Form-encoded rather than multipart: it is what the endpoint accepts, and it
    // keeps this a simple request that needs no CORS preflight.
    fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form)) })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (data) {
        if (data && data.success) {
          form.reset();
          say('Done — check your email to confirm.', 'ok');
        } else {
          throw new Error('rejected');
        }
      })
      .catch(function () {
        // Never claim success we cannot see. A silently lost address is the one
        // failure that costs a subscriber without anyone noticing.
        say('That did not go through. Try again in a moment.', 'bad');
        button.disabled = false;
        setTimeout(function () { say(smallprint, ''); }, 6000);
      });
  });
})();
