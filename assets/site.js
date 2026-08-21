/* ============================================================
   CRITERION PARTNERS
   Plain vanilla JavaScript. No framework, no build step.
   ============================================================ */
(function () {
'use strict';

var VIDEO_URL   = 'assets/hero-scrub.mp4';
var VIDEO_BYTES = 7298811;          // the real byte size, used when Content-Length is missing
var POSTER_URL  = 'assets/hero-poster.jpg';
var ENDING_URL  = 'assets/hero-ending.jpg';

var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
var smoothstep = function (p, e0, e1) {
  var t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
function rng(seed) {
  var s = seed >>> 0;
  return function () { return (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
}
var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
var reduced  = function () { return reduceMQ.matches; };

/* ============================================================
   TEXT SPLITTING, done once at load with a seeded generator
   ============================================================ */

function splitText(el) {
  var raw = el.textContent.trim();
  var seed = parseInt(el.getAttribute('data-seed') || '1', 10);
  var spread = parseFloat(el.getAttribute('data-spread') || '0.5');
  var emWord = el.getAttribute('data-em') || '';
  var rand = rng(seed);
  var mode = el.parentNode.parentNode.className;

  el.textContent = '';

  var sr = document.createElement('span');
  sr.className = 'vh';
  sr.textContent = raw.replace(/\|/g, ' ');
  el.appendChild(sr);

  var vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');

  var lines = raw.split('|');
  var words = [];
  lines.forEach(function (line, li) {
    if (li > 0) vis.appendChild(document.createElement('br'));
    line.trim().split(/\s+/).forEach(function (word, wi, arr) {
      var w = document.createElement('span');
      w.className = 'w';
      if (emWord && word === emWord) w.className += ' em';
      for (var i = 0; i < word.length; i++) {
        var c = document.createElement('span');
        c.className = 'c';
        c.textContent = word[i];
        w.appendChild(c);
      }
      if (wi < arr.length - 1) {
        var sp = document.createElement('span');
        sp.className = 'c';
        sp.textContent = ' ';
        w.appendChild(sp);
      }
      vis.appendChild(w);
      words.push(w);
    });
  });
  el.appendChild(vis);

  var chars = $$('.c', vis);
  if (mode.indexOf('e-scatter') > -1) {
    chars.forEach(function (c, i) {
      c.style.setProperty('--th', (rand() * 0.42 + (i / chars.length) * 0.13).toFixed(3));
      c.style.setProperty('--jx', ((rand() - 0.5) * 74).toFixed(1) + 'px');
      c.style.setProperty('--jy', ((rand() - 0.5) * 58).toFixed(1) + 'px');
      c.style.setProperty('--jr', ((rand() - 0.5) * 34).toFixed(1) + 'deg');
    });
  } else {
    words.forEach(function (w, i) {
      var t = words.length > 1 ? (i / (words.length - 1)) * spread : 0;
      w.style.setProperty('--th', t.toFixed(3));
    });
  }
}

$$('.split').forEach(splitText);

/* ============================================================
   THE SCRUB HERO
   ============================================================ */

var hero    = $('.hero');
var stage   = $('#stage');
var video   = $('#hero');
var poster  = $('#poster');
var ring    = $('#ring');
var bandEls = $$('.band');

var bands = bandEls.map(function (el) {
  return {
    el: el,
    a: parseFloat(el.getAttribute('data-a')),
    b: parseFloat(el.getAttribute('data-b')),
    ramp: parseFloat(el.getAttribute('data-ramp')) || 0,
    op: -1,
    k: -1,
    vis: null
  };
});

var target = 0, shown = 0, rafId = null, lastTick = 0, lastFrameAt = 0;
var heroOnScreen = true;
var seekBusy = false, pendingTime = null;
var loadK = 0, loadStart = 0, loadRunning = false;
var cueOn = null;

function heroProgress() {
  if (!hero) return 0;
  var range = hero.offsetHeight - window.innerHeight;
  if (range <= 0) return 0;
  return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
}

/* ---- gated seeks, deadlock safe ----
   Two escapes, because a stuck busy flag freezes the hero permanently:
   1. A seek to the time we are already at fires no 'seeked' event at all,
      so skip it rather than arm a flag nothing will ever clear.
   2. A watchdog clears the flag if 'seeked' never arrives for any reason. */
var seekWatch = null;

function clearSeek() {
  if (seekWatch) { clearTimeout(seekWatch); seekWatch = null; }
  seekBusy = false;
  if (pendingTime !== null) {
    var t = pendingTime; pendingTime = null; requestSeek(t);
  }
}
function requestSeek(t) {
  if (!video.duration || isNaN(video.duration)) return;
  if (Math.abs(t - video.currentTime) < 0.01) return;   // no-op seek, never acknowledged
  if (seekBusy) { pendingTime = t; return; }
  seekBusy = true;
  if (seekWatch) clearTimeout(seekWatch);
  seekWatch = setTimeout(clearSeek, 400);
  try { video.currentTime = t; } catch (e) { clearSeek(); }
}
video.addEventListener('seeked', clearSeek);
video.addEventListener('error', function () {
  if (seekWatch) { clearTimeout(seekWatch); seekWatch = null; }
  seekBusy = false; pendingTime = null;
  if (video.readyState === 0) failVideo();
});

/* ---- caption bands, delta-gated writes ---- */
function updateBands(p) {
  for (var i = 0; i < bands.length; i++) {
    var b = bands[i];
    var f = Math.min(0.02, (b.b - b.a) / 3);
    var op;
    if (i === 0)                  op = 1 - smoothstep(p, b.b - f, b.b);
    else if (i === bands.length - 1) op = smoothstep(p, b.a, b.a + f);
    else op = smoothstep(p, b.a, b.a + f) * (1 - smoothstep(p, b.b - f, b.b));

    var ramp = b.ramp || Math.min(0.025, (b.b - b.a) * 0.35);
    var k = clamp((p - b.a) / ramp, 0, 1);
    if (i === 0) k = Math.max(k, loadK);

    if (Math.abs(op - b.op) > 0.004) {
      b.op = op;
      b.el.style.opacity = op.toFixed(3);
      var wantVis = op > 0.002 ? 'visible' : 'hidden';
      if (wantVis !== b.vis) { b.vis = wantVis; b.el.style.visibility = wantVis; }
    }
    if (Math.abs(k - b.k) > 0.008) {
      b.k = k;
      b.el.style.setProperty('--k', k.toFixed(3));
    }
  }
}

/* ---- the lerp loop, frame-rate independent, rests when converged ---- */
function tick(now) {
  lastFrameAt = now;
  var dt = Math.min(100, now - (lastTick || now));
  lastTick = now;
  var k = 0.16;
  shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

  if (loadRunning) {
    loadK = clamp((now - loadStart) / 900, 0, 1);
    if (loadK >= 1) loadRunning = false;
  }

  var settled = Math.abs(target - shown) < 0.0005;
  if (settled) { shown = target; }

  if (video.duration) requestSeek(shown * video.duration);
  updateBands(shown);

  var wantCue = shown < 0.10;
  if (wantCue !== cueOn) { cueOn = wantCue; stage.classList.toggle('cue-off', !wantCue); }

  if (settled && !loadRunning) { rafId = null; lastTick = 0; }
  else rafId = requestAnimationFrame(tick);
}

function kick() {
  // A backgrounded or non-compositing tab stops firing rAF while rafId is still
  // set, which would strand the loop forever. If no frame has landed in a second,
  // treat the loop as dead and start a fresh one.
  var now = (window.performance && performance.now) ? performance.now() : Date.now();
  if (rafId !== null && lastFrameAt && now - lastFrameAt > 1000) { rafId = null; }
  if (rafId === null && heroOnScreen) { lastTick = 0; rafId = requestAnimationFrame(tick); }
}
function onScroll() { target = heroProgress(); kick(); }

if (hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(function (es) {
    heroOnScreen = es[0].isIntersecting;
    if (heroOnScreen) kick();
    else if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }, { rootMargin: '120px' }).observe(hero);
}

/* ---- the streamed Blob, an honest ring, a watchdog ---- */
var heroInit = false;
function initHeroOnce() {
  if (heroInit) return;
  heroInit = true;

  poster.style.backgroundImage = "url('" + POSTER_URL + "')";
  loadStart = performance.now();
  loadRunning = true;
  kick();

  var started = false;
  function startBlobFetch() {
    if (started) return;
    started = true;
    loadHeroBlob().catch(failVideo);
  }
  var img = new Image();
  img.onload = startBlobFetch;
  img.onerror = startBlobFetch;
  img.src = POSTER_URL;
  setTimeout(startBlobFetch, 4000);
}

function loadHeroBlob() {
  if (!window.fetch || !window.ReadableStream) return Promise.reject(new Error('no stream'));
  var ctrl = new AbortController();
  var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);

  return fetch(VIDEO_URL, { signal: ctrl.signal }).then(function (res) {
    if (!res.ok || !res.body) throw new Error('bad response');
    var total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
    var reader = res.body.getReader();
    var chunks = [], got = 0, lastRing = 0;

    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        clearTimeout(watchdog);
        watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
        chunks.push(r.value);
        got += r.value.length;
        var frac = Math.min(1, got / total);
        var now = performance.now();
        if (now - lastRing > 100 || frac === 1) {
          lastRing = now;
          ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
        }
        return pump();
      });
    }
    return pump().then(function () {
      clearTimeout(watchdog);
      ring.style.setProperty('--ld', 0);
      video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
      video.load();
      video.addEventListener('canplay', function () {
        requestSeek(heroProgress() * video.duration);
        stage.classList.add('video-ready');
        stage.classList.add('live');
        onScroll();
      }, { once: true });
    });
  });
}

function failVideo() {
  if (!stage) return;
  stage.classList.add('video-failed');
  stage.classList.add('live');
  if (ring) ring.style.display = 'none';
}

/* ---- dust motes, whisper level ---- */
(function () {
  var d = $('#dust'); if (!d) return;
  var r = rng(2026), html = '';
  for (var i = 0; i < 26; i++) {
    html += '<i style="left:' + (r() * 100).toFixed(1) + '%;top:' + (r() * 100).toFixed(1) +
            '%;animation-duration:' + (11 + r() * 13).toFixed(1) + 's;animation-delay:-' +
            (r() * 18).toFixed(1) + 's"></i>';
  }
  d.innerHTML = html;
})();

/* ============================================================
   THE FIVE STATIC-HERO GATES
   Character-for-character identical to the media query list in
   site.css. Change one, change both.
   ============================================================ */

var GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
var MQLS = GATES.map(function (q) { return window.matchMedia(q); });
var scrubOn = false;
var staticPainted = false;

function paintStaticHero() {
  if (staticPainted) return;
  staticPainted = true;
  var sh = $('#staticHero');
  if (sh) sh.style.backgroundImage = "url('" + ENDING_URL + "')";
}

function enableScrub() {
  if (scrubOn) return;
  scrubOn = true;
  initHeroOnce();
  window.addEventListener('scroll', onScroll, { passive: true });
  bands.forEach(function (b) { b.op = -1; b.k = -1; b.vis = null; });
  unpinFinalStates();
  target = heroProgress();
  updateBands(target);
  onScroll();
}
function disableScrub() {
  if (!scrubOn) return;
  scrubOn = false;
  window.removeEventListener('scroll', onScroll);
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}
function applyHeroMode() {
  var gated = MQLS.some(function (m) { return m.matches; });
  if (gated) { paintStaticHero(); disableScrub(); }
  else enableScrub();
}
MQLS.forEach(function (m) {
  if (m.addEventListener) m.addEventListener('change', applyHeroMode);
  else if (m.addListener) m.addListener(applyHeroMode);
});

/* ============================================================
   REDUCED MOTION, honoured live in BOTH directions
   ============================================================ */

function pinToFinalStates() {
  document.body.classList.add('pinned');
  $$('.rv,.stg,.thr,.step').forEach(function (el) { el.classList.add('in'); });
  $$('.stg').forEach(function (el) { el.classList.add('done'); });
  $$('.brk').forEach(function (el) { el.classList.add('in'); });
  countersToTarget();
  if (holdState) { holdState.hp = 1; holdState.done = true; holdState.paint(); }
}
function unpinFinalStates() {
  document.body.classList.remove('pinned');
}
if (reduceMQ.addEventListener) {
  reduceMQ.addEventListener('change', function (e) {
    if (e.matches) pinToFinalStates();
    else applyHeroMode();
  });
}

/* ============================================================
   ENTRANCE CHOREOGRAPHY
   ============================================================ */

if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      if (el.classList.contains('stg')) {
        var n = el.children.length;
        setTimeout(function () { el.classList.add('done'); }, 900 + n * 80);
      }
      if (el.hasAttribute('data-count')) runCounter(el);
      io.unobserve(el);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  $$('.rv,.stg,.thr,.step,.brk,[data-count]').forEach(function (el) { io.observe(el); });
} else {
  $$('.rv,.stg,.thr,.step,.brk').forEach(function (el) { el.classList.add('in'); });
  countersToTarget();
}

/* ---- counters, throttled and written only on change ---- */
function runCounter(el) {
  if (reduced()) { setCounter(el, parseInt(el.getAttribute('data-count'), 10)); return; }
  var target = parseInt(el.getAttribute('data-count'), 10);
  var t0 = performance.now(), dur = 1500, lastAt = 0, lastVal = null;
  (function step(now) {
    var p = clamp((now - t0) / dur, 0, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var v = Math.round(target * eased);
    if (now - lastAt > 100 || p === 1) {
      lastAt = now;
      if (v !== lastVal) { lastVal = v; setCounter(el, v); }
    }
    if (p < 1) requestAnimationFrame(step);
    else setCounter(el, target);
  })(t0);
}
function setCounter(el, v) { el.textContent = v + (el.getAttribute('data-suffix') || ''); }
function countersToTarget() {
  $$('[data-count]').forEach(function (el) { setCounter(el, parseInt(el.getAttribute('data-count'), 10)); });
}

/* ============================================================
   NAV
   ============================================================ */

var nav = $('#nav');
(function () {
  var stuck = null;
  function onNav() {
    var want = window.scrollY > 40;
    if (want !== stuck) { stuck = want; nav.classList.toggle('stuck', want); }
  }
  window.addEventListener('scroll', onNav, { passive: true });
  onNav();
})();

/* ============================================================
   FAQ
   ============================================================ */

$$('.faq-q').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var item = btn.parentNode;
    var open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

/* ============================================================
   THE ONE INTERACTIVE MOMENT
   Tick three, watch them fall short, then hold to build a record.
   ============================================================ */

var CRITERIA = [
  { id: 'awards',                 code: 'C-01', label: 'Awards and Prizes',           desc: 'National or international awards for excellence' },
  { id: 'membership',             code: 'C-02', label: 'Membership in Associations',  desc: 'Associations that require outstanding achievement' },
  { id: 'published_material',     code: 'C-03', label: 'Published Material About You',desc: 'Major media coverage of you and your work' },
  { id: 'judging',                code: 'C-04', label: 'Judging the Work of Others',  desc: 'Serving as a judge of work in your field' },
  { id: 'original_contributions', code: 'C-05', label: 'Original Contributions',      desc: 'Contributions of major significance' },
  { id: 'scholarly_articles',     code: 'C-06', label: 'Scholarly Articles',          desc: 'Authorship in professional journals' },
  { id: 'exhibitions',            code: 'C-07', label: 'Exhibitions or Showcases',    desc: 'Display of your work at exhibitions' },
  { id: 'leading_role',           code: 'C-08', label: 'Leading or Critical Role',    desc: 'A leading role in a distinguished organisation' },
  { id: 'high_salary',            code: 'C-09', label: 'High Salary',                 desc: 'High remuneration relative to your field' },
  { id: 'commercial_success',     code: 'C-10', label: 'Commercial Success',          desc: 'Commercial success in the performing arts' }
];

var picked = [];
var holdState = null;

(function buildCriteria() {
  var grid = $('#critGrid'); if (!grid) return;
  CRITERIA.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'crit';
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML =
      '<span class="box" aria-hidden="true"><svg viewBox="0 0 11 11"><path d="M1 5.6l3 3 6-7.4"/></svg></span>' +
      '<span><span class="code">' + c.code + '</span><span class="cl">' + c.label + '</span></span>';
    b.addEventListener('click', function () {
      var i = picked.indexOf(c.id);
      if (i > -1) picked.splice(i, 1); else picked.push(c.id);
      b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
      syncProve();
    });
    grid.appendChild(b);
  });
})();

(function buildProve() {
  var prove = $('#prove'); if (!prove) return;
  var barsG   = $('#proveBars');
  var say     = $('#proveSay');
  var counter = $('#critCounter');
  var btn     = $('#holdBtn');
  var label   = $('#holdLabel');
  var note    = $('#holdNote');

  var BASE = 56, TOP = 158, FLOOR = 190, LINE = 52;
  var hp = 0, holding = false, done = false, raf = null;
  var lastSay = '', lastCount = -1;

  function paint() {
    var bars = $$('rect', barsG);
    var r = rng(5);
    bars.forEach(function (rect, i) {
      var wobble = 0.86 + r() * 0.28;
      var h = BASE * (0.8 + r() * 0.4) + (TOP * wobble - BASE) * hp;
      h = Math.max(10, h);
      rect.setAttribute('height', h.toFixed(1));
      rect.setAttribute('y', (FLOOR - h).toFixed(1));
      rect.classList.toggle('cleared', (FLOOR - h) < LINE);
    });
    btn.style.setProperty('--hp', hp.toFixed(3));
    var text;
    if (done)                    text = 'Same three criteria. Now they carry weight. That is the whole job.';
    else if (hp > 0.05)          text = 'Keep holding. This is the part that takes months.';
    else if (picked.length === 0) text = 'Tick the ones you meet and the bar appears.';
    else                         text = picked.length + (picked.length === 1 ? ' tick.' : ' ticks.') + ' Still under the bar.';
    if (text !== lastSay) { lastSay = text; say.textContent = text; }
  }
  holdState = { get hp() { return hp; }, set hp(v) { hp = v; }, get done() { return done; }, set done(v) { done = v; }, paint: paint };

  function loop() {
    var goal = holding ? 1 : 0;
    var speed = holding ? 0.014 : 0.030;
    hp += (goal - hp) * 0.06 + (holding ? speed : -speed);
    hp = clamp(hp, 0, 1);
    paint();
    if (hp >= 0.995 && !done) {
      done = true; hp = 1;
      btn.setAttribute('data-done', 'true');
      label.textContent = 'The record clears the bar';
      note.textContent = 'That is what we build';
      paint();
      raf = null; return;
    }
    if ((holding && hp < 1) || (!holding && hp > 0.001)) raf = requestAnimationFrame(loop);
    else raf = null;
  }
  function start(e) { if (done) return; e.preventDefault(); holding = true; if (raf === null) raf = requestAnimationFrame(loop); }
  function stop()   { holding = false; if (raf === null && hp > 0.001) raf = requestAnimationFrame(loop); }

  btn.addEventListener('mousedown', start);
  btn.addEventListener('touchstart', start, { passive: false });
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'blur'].forEach(function (ev) {
    btn.addEventListener(ev, stop);
  });
  btn.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!done) { hp = 1; done = true; btn.setAttribute('data-done','true'); label.textContent = 'The record clears the bar'; note.textContent = 'That is what we build'; paint(); } }
  });

  window.syncProve = function () {
    var n = picked.length;
    if (n !== lastCount) {
      lastCount = n;
      counter.innerHTML = '<b>' + n + '</b> of 10 selected';
      counter.classList.toggle('armed', n >= 3);
      barsG.innerHTML = '';
      var w = n ? Math.min(52, (600 / Math.max(n, 1)) - 12) : 0;
      for (var i = 0; i < n; i++) {
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'pbar');
        rect.setAttribute('x', (14 + i * (w + 14)).toFixed(1));
        rect.setAttribute('width', w.toFixed(1));
        rect.setAttribute('height', '0');
        rect.setAttribute('y', String(FLOOR));
        barsG.appendChild(rect);
      }
      prove.classList.toggle('armed', n >= 3);
      if (n < 3) { hp = 0; done = false; btn.setAttribute('data-done', 'false'); label.textContent = 'Press and hold to build the record'; note.textContent = 'Hold it down'; }
      if (reduced() && n >= 3) { hp = 1; done = true; btn.setAttribute('data-done','true'); label.textContent = 'The record clears the bar'; note.textContent = 'That is what we build'; }
      paint();
    }
  };
  window.syncProve();
})();
function syncProve() { if (window.syncProve) window.syncProve(); }

/* ============================================================
   THE INTAKE
   No backend. The summary is built in the browser and the
   visitor sends it themselves, by WhatsApp or by email.
   ============================================================ */

var FIELDS = ['Computer Science / AI / ML','Economics / Finance','Medicine / Healthcare','Engineering',
  'Biotechnology / Pharma','Physics / Mathematics','Business / Management','Law / Policy',
  'Social Sciences','Arts / Design','Environmental Science','Other'];

var SERVICES = [
  { id: 'paper',    label: 'Research Paper Development',        tier: 'Core' },
  { id: 'journal',  label: 'Journal Placement',                 tier: 'Core' },
  { id: 'fellow',   label: 'Fellowship and Society Membership', tier: 'Core' },
  { id: 'awards',   label: 'Awards and Nominations',            tier: 'Core' },
  { id: 'review',   label: 'Peer Review Appointments',          tier: 'Core' },
  { id: 'lor',      label: 'Recommendation Strategy',           tier: 'Core' },
  { id: 'book',     label: 'Book and Chapter Publication',      tier: 'Premium' },
  { id: 'board',    label: 'Editorial Board Appointments',      tier: 'Premium' },
  { id: 'media',    label: 'Earned Media',                      tier: 'Premium' },
  { id: 'vis',      label: 'Research Visibility',               tier: 'Premium' }
];

var STEPS = ['Profile', 'Academic', 'Criteria', 'Services', 'Details', 'Done'];

var modal = $('#intake'), sheet = $('#sheet'), body = $('#intakeBody'), prog = $('#intakeProg');
var step = 0, lastFocus = null;
var form = {
  name: '', email: '', nationality: '', visa: '', role: '', institution: '', field: '', years: '',
  degree: '', degreeField: '', degreeInst: '',
  publications: '', hIndex: '', citations: '', conferences: '', patents: '', grants: '',
  criteria: [], services: [], details: {}, timeline: '', urgency: '', notes: ''
};

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
  return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }

function openIntake() {
  lastFocus = document.activeElement;
  modal.setAttribute('data-open', 'true');
  document.body.style.overflow = 'hidden';
  render();
  setTimeout(function () { var f = $('input,button', body); if (f) f.focus(); }, 40);
}
function closeIntake() {
  modal.setAttribute('data-open', 'false');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
$$('[data-open-intake]').forEach(function (b) { b.addEventListener('click', openIntake); });
$('#intakeClose').addEventListener('click', closeIntake);
modal.addEventListener('mousedown', function (e) { if (e.target === modal) closeIntake(); });
document.addEventListener('keydown', function (e) {
  if (modal.getAttribute('data-open') !== 'true') return;
  if (e.key === 'Escape') { closeIntake(); return; }
  if (e.key !== 'Tab') return;
  var f = $$('a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])', sheet)
          .filter(function (el) { return el.offsetParent !== null; });
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

function renderProg() {
  prog.innerHTML = STEPS.map(function (s, i) {
    return '<div class="' + (i <= step ? 'on' : '') + '"><i></i><span>' + s + '</span></div>';
  }).join('');
}

function canGo() {
  if (step === 0) return form.name && form.role && form.field;
  if (step === 1) return !!form.degree;
  if (step === 2) return form.criteria.length >= 1;
  if (step === 3) return form.services.length >= 1;
  return true;
}

function field(label, key, ph, type) {
  return '<div class="f"><label for="f_' + key + '">' + label + '</label>' +
    '<input id="f_' + key + '" type="' + (type || 'text') + '" value="' + esc(form[key]) +
    '" placeholder="' + esc(ph) + '" data-k="' + key + '"></div>';
}

function render() {
  renderProg();
  var h = '';
  var cc = form.criteria.length;
  var band = cc >= 6 ? 'Very strong' : cc >= 4 ? 'Strong' : cc >= 3 ? 'Viable' : 'Building';

  if (step === 0) {
    h += '<h2 class="step-h" id="intakeTitle">Your profile</h2>' +
         '<p class="step-s">Five short steps. Nothing is stored on this page.</p>' +
         '<div class="fgrid two">' + field('Name *', 'name', 'Dr Jane Smith') + field('Email', 'email', 'jane@university.edu', 'email') + '</div>' +
         '<div class="fgrid two" style="margin-top:14px">' + field('Nationality', 'nationality', 'Indian') + field('Visa status', 'visa', 'H-1B') + '</div>' +
         '<div class="fgrid" style="margin-top:14px">' + field('Current role *', 'role', 'Senior Research Scientist') + '</div>' +
         '<div class="fgrid two" style="margin-top:14px">' + field('Institution or company', 'institution', 'MIT') + field('Years of experience', 'years', '10', 'number') + '</div>' +
         '<div class="f" style="margin-top:18px"><label>Field *</label><div class="chips">' +
         FIELDS.map(function (f) {
           return '<button type="button" class="chip" data-set="field" data-v="' + esc(f) + '" aria-pressed="' + (form.field === f) + '">' + esc(f) + '</button>';
         }).join('') + '</div></div>';
  }

  if (step === 1) {
    h += '<h2 class="step-h" id="intakeTitle">Academic profile</h2>' +
         '<p class="step-s">Rough numbers are fine. Leave anything blank that does not apply.</p>' +
         '<div class="f"><label>Highest degree *</label><div class="chips">' +
         ['PhD', 'MD', 'MBA', "Master's", "Bachelor's", 'Other'].map(function (d) {
           return '<button type="button" class="chip" data-set="degree" data-v="' + d + '" aria-pressed="' + (form.degree === d) + '">' + d + '</button>';
         }).join('') + '</div></div>' +
         '<div class="fgrid two" style="margin-top:18px">' + field('Degree field', 'degreeField', 'Machine Learning') + field('Institution', 'degreeInst', 'Stanford') + '</div>' +
         '<p class="tier-label" style="margin:26px 0 0">Research metrics</p>' +
         '<div class="fgrid three" style="margin-top:16px">' +
           field('Publications', 'publications', '25', 'number') + field('h-index', 'hIndex', '18', 'number') + field('Citations', 'citations', '1200', 'number') + '</div>' +
         '<div class="fgrid three" style="margin-top:14px">' +
           field('Conferences', 'conferences', '15', 'number') + field('Patents', 'patents', '3', 'number') + field('Grants', 'grants', '$500K') + '</div>';
  }

  if (step === 2) {
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:8px">' +
         '<h2 class="step-h" id="intakeTitle" style="margin:0">Which criteria do you meet?</h2>' +
         '<span class="sheet-score ' + (cc >= 3 ? 'armed' : '') + '"><b>' + cc + '</b>/10 ' + band + '</span></div>' +
         '<p class="step-s">Tick the ones you already meet, and say what the evidence is.</p>';
    CRITERIA.forEach(function (c) {
      var on = form.criteria.indexOf(c.id) > -1;
      h += '<button type="button" class="mrow" data-crit="' + c.id + '" aria-pressed="' + on + '">' +
           '<span class="box" aria-hidden="true"></span><span style="flex:1">' +
           '<span class="code">' + c.code + '</span>' +
           '<span class="t">' + c.label + '</span><span class="d">' + c.desc + '</span></span></button>';
      if (on) {
        h += '<div class="mdetail"><textarea data-detail="' + c.id + '" placeholder="What is the evidence for ' +
             esc(c.label.toLowerCase()) + '?">' + esc(form.details[c.id] || '') + '</textarea></div>';
      }
    });
  }

  if (step === 3) {
    h += '<h2 class="step-h" id="intakeTitle">Which services interest you?</h2>' +
         '<p class="step-s">Pick anything you want us to look at. We will tell you honestly what you need.</p>';
    ['Core', 'Premium'].forEach(function (tier) {
      h += '<p class="tier-label" style="margin:22px 0 14px">' + tier + '</p>';
      SERVICES.filter(function (s) { return s.tier === tier; }).forEach(function (s) {
        var on = form.services.indexOf(s.id) > -1;
        h += '<button type="button" class="mrow" data-svc="' + s.id + '" aria-pressed="' + on + '">' +
             '<span class="box" aria-hidden="true"></span><span class="t">' + s.label + '</span></button>';
      });
    });
  }

  if (step === 4) {
    h += '<h2 class="step-h" id="intakeTitle">Last few details</h2>' +
         '<p class="step-s">This helps us tell you how realistic your timeline is.</p>' +
         '<div class="f"><label>Target timeline</label><div class="chips">' +
         ['3 months', '6 months', '9 months', '12 months', 'Over 12 months'].map(function (t) {
           return '<button type="button" class="chip" data-set="timeline" data-v="' + t + '" aria-pressed="' + (form.timeline === t) + '">' + t + '</button>';
         }).join('') + '</div></div>' +
         '<div class="f" style="margin-top:18px"><label>How urgent is this?</label><div class="chips">' +
         ['Critical', 'High', 'Medium', 'Just exploring'].map(function (t) {
           return '<button type="button" class="chip" data-set="urgency" data-v="' + t + '" aria-pressed="' + (form.urgency === t) + '">' + t + '</button>';
         }).join('') + '</div></div>' +
         '<div class="f" style="margin-top:18px"><label for="f_notes">Anything else</label>' +
         '<textarea id="f_notes" data-k="notes" placeholder="Anything you want us to know">' + esc(form.notes) + '</textarea></div>' +
         '<div class="summary" style="margin-top:22px"><b>' + esc(form.name || 'Your profile') + '</b> &middot; ' +
         esc(form.field || 'Field not set') + ' &middot; ' + cc + ' criteria &middot; ' + form.services.length + ' services</div>';
  }

  if (step === 5) {
    var summary = buildSummary();
    var wa = 'https://wa.me/2348079851510?text=' + encodeURIComponent(summary);
    var mail = 'mailto:hello@criterionpartners.net?subject=' +
      encodeURIComponent('EB-1A assessment: ' + (form.name || 'new enquiry')) + '&body=' + encodeURIComponent(summary);
    h += '<div style="text-align:center">' +
      '<svg class="done-mark" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26"/><path d="M17 28.5l8 8 15-17"/></svg>' +
      '<h2 class="step-h" id="intakeTitle">Your summary is ready.</h2>' +
      '<p class="step-s">Send it whichever way suits you. We answer within 24 hours, usually a lot sooner.</p>' +
      '<div class="summary"><b>' + esc(form.name) + '</b><br>' + esc(form.role || '') +
        (form.institution ? ' at ' + esc(form.institution) : '') + '<br>' +
        esc(form.field) + ' &middot; ' + esc(form.degree) + '<br>' +
        cc + ' of 10 criteria &middot; ' + band + '<br>' +
        form.services.length + ' services requested<br>' +
        'Timeline: ' + esc(form.timeline || 'flexible') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<a class="btn btn-primary" href="' + wa + '" target="_blank" rel="noopener noreferrer" data-sent="1">Send on WhatsApp</a>' +
        '<a class="btn btn-ghost" href="' + mail + '" data-sent="1">Send by email</a></div>' +
      '<p class="send-note">Nothing is stored on this page. Your answers go only where you send them.</p></div>';
  }

  if (step <= 4) {
    h += '<div class="sheet-nav">' +
      (step > 0 ? '<button type="button" class="btn btn-ghost" data-nav="-1">Back</button>' : '<span></span>') +
      '<button type="button" class="btn btn-primary" data-nav="1" ' + (canGo() ? '' : 'disabled style="opacity:.4;cursor:not-allowed"') + '>' +
      (step === 4 ? 'Finish' : 'Continue') + '</button></div>';
  }

  body.innerHTML = h;
  wire();
}

function buildSummary() {
  var L = [];
  L.push('EB-1A assessment from the Criterion Partners website');
  L.push('');
  L.push('Name: ' + form.name);
  if (form.email) L.push('Email: ' + form.email);
  if (form.nationality) L.push('Nationality: ' + form.nationality);
  if (form.visa) L.push('Visa status: ' + form.visa);
  L.push('Role: ' + form.role + (form.institution ? ' at ' + form.institution : ''));
  L.push('Field: ' + form.field);
  if (form.years) L.push('Experience: ' + form.years + ' years');
  L.push('');
  L.push('Degree: ' + form.degree + (form.degreeField ? ' in ' + form.degreeField : '') + (form.degreeInst ? ', ' + form.degreeInst : ''));
  var m = [];
  if (form.publications) m.push('publications ' + form.publications);
  if (form.hIndex) m.push('h-index ' + form.hIndex);
  if (form.citations) m.push('citations ' + form.citations);
  if (form.conferences) m.push('conferences ' + form.conferences);
  if (form.patents) m.push('patents ' + form.patents);
  if (form.grants) m.push('grants ' + form.grants);
  if (m.length) L.push('Metrics: ' + m.join(', '));
  L.push('');
  L.push('Criteria met (' + form.criteria.length + ' of 10):');
  form.criteria.forEach(function (id) {
    var c = CRITERIA.filter(function (x) { return x.id === id; })[0];
    L.push('  ' + c.code + ' ' + c.label + ': ' + (form.details[id] || 'no detail given'));
  });
  L.push('');
  L.push('Services requested: ' + form.services.map(function (id) {
    return SERVICES.filter(function (x) { return x.id === id; })[0].label;
  }).join(', '));
  if (form.timeline) L.push('Timeline: ' + form.timeline);
  if (form.urgency) L.push('Urgency: ' + form.urgency);
  if (form.notes) { L.push(''); L.push('Notes: ' + form.notes); }
  return L.join('\n');
}

function wire() {
  $$('[data-k]', body).forEach(function (i) {
    i.addEventListener('input', function () {
      form[i.getAttribute('data-k')] = i.value;
      var next = $('[data-nav="1"]', body);
      if (next) {
        if (canGo()) { next.removeAttribute('disabled'); next.removeAttribute('style'); }
        else { next.setAttribute('disabled', ''); next.setAttribute('style', 'opacity:.4;cursor:not-allowed'); }
      }
    });
  });
  $$('[data-detail]', body).forEach(function (t) {
    t.addEventListener('input', function () { form.details[t.getAttribute('data-detail')] = t.value; });
  });
  $$('[data-set]', body).forEach(function (b) {
    b.addEventListener('click', function () { form[b.getAttribute('data-set')] = b.getAttribute('data-v'); render(); });
  });
  $$('[data-crit]', body).forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-crit'), i = form.criteria.indexOf(id);
      if (i > -1) form.criteria.splice(i, 1); else form.criteria.push(id);
      render();
    });
  });
  $$('[data-svc]', body).forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-svc'), i = form.services.indexOf(id);
      if (i > -1) form.services.splice(i, 1); else form.services.push(id);
      render();
    });
  });
  $$('[data-nav]', body).forEach(function (b) {
    b.addEventListener('click', function () {
      var d = parseInt(b.getAttribute('data-nav'), 10);
      if (d > 0 && !canGo()) return;
      step = clamp(step + d, 0, 5);
      if (step === 5 && window.fbq) {
        window.fbq('track', 'Lead', { content_name: form.field, content_category: 'EB1A Assessment' });
      }
      render();
      sheet.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    });
  });
}

/* ============================================================
   PAUSE EVERYTHING ON HIDDEN TABS
   ============================================================ */

document.addEventListener('visibilitychange', function () {
  document.body.classList.toggle('paused', document.hidden);
});

/* ============================================================
   GO
   ============================================================ */

applyHeroMode();
if (reduced()) pinToFinalStates();

})();
