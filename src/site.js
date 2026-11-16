/* Criterion Partners. Plain JavaScript, no dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* mobile menu */
  var burger = $('#burger'), menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  /* tab filters: used for articles and certificates */
  function filterGroup(tabsSel, itemsSel, attr, after) {
    var tabs = $$(tabsSel + ' .tab'); if (!tabs.length) return null;
    var state = { f: 'all' };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        state.f = t.getAttribute('data-f');
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
        apply();
      });
    });
    function apply() {
      $$(itemsSel).forEach(function (el) { el.hidden = !(state.f === 'all' || el.getAttribute(attr) === state.f); });
      if (after) after(state);
    }
    return { state: state, apply: apply };
  }

  /* certificates */
  filterGroup('#certTabs', '#certGrid .cert', 'data-g');

  /* articles: tabs + search */
  var q = $('#q'), feature = $('#feature'), none = $('#none');
  var posts = filterGroup('#postTabs', '#posts .post', 'data-t', function (state) {
    var term = q ? q.value.trim().toLowerCase() : '', shown = 0;
    $$('#posts .post').forEach(function (p) {
      if (!p.hidden && term && p.textContent.toLowerCase().indexOf(term) < 0) p.hidden = true;
      if (!p.hidden) shown++;
    });
    if (feature) {
      var ok = (state.f === 'all' || feature.getAttribute('data-t') === state.f) && (!term || feature.textContent.toLowerCase().indexOf(term) > -1);
      feature.style.display = ok ? '' : 'none'; if (ok) shown++;
    }
    if (none) none.hidden = shown > 0;
  });
  if (q && posts) q.addEventListener('input', posts.apply);

  /* lightbox for certificates */
  var lb = $('#lightbox');
  if (lb) {
    var img = $('img', lb), last = null;
    var close = function () { lb.hidden = true; img.removeAttribute('src'); document.body.style.overflow = ''; if (last) last.focus(); };
    $$('.cert button').forEach(function (b) {
      b.addEventListener('click', function () {
        last = b; img.src = b.getAttribute('data-full'); lb.hidden = false;
        document.body.style.overflow = 'hidden'; $('.lb-x', lb).focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  } else {
    /* on pages without a lightbox (home), certificate tiles link to the proof page */
    $$('.cert button').forEach(function (b) { b.addEventListener('click', function () { location.href = 'peer-review.html'; }); });
  }
})();
