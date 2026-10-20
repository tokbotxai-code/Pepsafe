/* PepSafe v4 — motion, theme and filtering, added on top of pages that already work without it.
   No framework: reveals use IntersectionObserver, the chains use one canvas, and every answer
   the overlap checker can give is already written into the HTML. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stored = null;
  try { stored = localStorage.getItem('pep-motion'); } catch (e) {}
  var motionOn = !reduced && stored !== 'off';
  html.classList.add('js');
  if (!motionOn) html.classList.add('still');

  /* ── theme ─────────────────────────────────────────── */
  var tbtn = document.getElementById('theme');
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('pep-theme', next); } catch (e) {}
    paint();  // the chains repaint in the new palette straight away
  });

  /* ── reveal on scroll ──────────────────────────────── */
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var peers = [].slice.call(el.parentNode.children).filter(function (n) { return n.classList && n.classList.contains('reveal'); });
        el.style.transitionDelay = Math.min(peers.indexOf(el), 6) * 55 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });

    // A fast fling can carry an element past the viewport between two observer ticks,
    // and it would then stay invisible for good. Sweep up anything already scrolled past.
    var sweepT;
    var sweep = function () {
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        if (el.getBoundingClientRect().top < innerHeight) { el.style.transitionDelay = '0ms'; el.classList.add('in'); io.unobserve(el); }
      });
    };
    addEventListener('scroll', function () { clearTimeout(sweepT); sweepT = setTimeout(sweep, 120); }, { passive: true });
    addEventListener('load', sweep);
  }

  /* ── reading progress ──────────────────────────────── */
  var bar = document.querySelector('.progress');
  if (bar) {
    var tick = 0;
    var grow = function () {
      tick = 0;
      var max = document.body.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + '%';
    };
    addEventListener('scroll', function () { if (!tick) { tick = 1; requestAnimationFrame(grow); } }, { passive: true });
    grow();
  }

  /* ── counters ──────────────────────────────────────── */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count');
    if (!end || reduced) return;
    var seen = false;
    var ob = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting || seen) return;
      seen = true; ob.disconnect();
      var t0 = performance.now(), dur = 1200;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    el.textContent = '0';
    ob.observe(el);
  });

  /* ── overlap checker ───────────────────────────────── */
  var a = document.getElementById('selA'), b = document.getElementById('selB'),
      out = document.getElementById('verdict'), sr = document.querySelector('.sr[data-same]');
  if (a && b && out && sr) {
    var render = function () {
      var same = a.value === b.value;
      var src = document.getElementById(same ? 'a-' + a.value : 'a-diff');
      out.className = 'verdict' + (same ? ' same' : '');
      out.innerHTML = '<b>' + (same ? sr.dataset.same : sr.dataset.diff) + '</b><span>' + (src ? src.innerHTML : '') + '</span>';
    };
    a.addEventListener('change', render);
    b.addEventListener('change', render);
    render();
  }

  /* ── catalog search and status filter ──────────────── */
  var q = document.getElementById('q'), chips = document.getElementById('chips'), list = document.getElementById('list');
  if (q && list) {
    var items = [].slice.call(list.children), nohit = document.getElementById('nohit'), pick = '';
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var apply = function () {
      var needle = norm(q.value.trim()), shown = 0;
      items.forEach(function (el) {
        var ok = (!pick || el.dataset.s === pick) && (!needle || norm(el.dataset.n).indexOf(needle) > -1);
        el.hidden = !ok; if (ok) shown++;
      });
      if (nohit) nohit.hidden = shown > 0;
    };
    q.addEventListener('input', apply);
    if (chips) chips.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      [].slice.call(chips.children).forEach(function (x) { x.classList.toggle('on', x === c); });
      pick = c.dataset.s || ''; apply();
    });
  }

  /* ── pointer-tracked border glow ───────────────────── */
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest && e.target.closest('.tile');
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ── parallax, hand-rolled ─────────────────────────── */
  var par = [].slice.call(document.querySelectorAll('[data-par]'));
  if (par.length && !reduced && innerWidth >= 1024) {
    var pt = 0;
    var place = function () {
      pt = 0;
      par.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var mid = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = 'translate3d(0,' + (mid * +el.dataset.par * -40).toFixed(1) + 'px,0)';
      });
    };
    addEventListener('scroll', function () { if (!pt && motionOn) { pt = 1; requestAnimationFrame(place); } }, { passive: true });
    place();
  }

  /* ── drifting chains ───────────────────────────────── */
  var cv = document.getElementById('chains');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var chains = [], w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, visible = true, seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function hues() {
    var s = getComputedStyle(html);
    return ['--k1', '--k2', '--k3', '--k4', '--neon'].map(function (v) { return s.getPropertyValue(v).trim() || '#2F6DB5'; });
  }
  function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function init() {
    var c = hues();
    chains = []; var n = w < 600 ? 7 : 12;
    for (var i = 0; i < n; i++) chains.push({
      x: rnd() * w, y: rnd() * h, a: rnd() * 6.28, sp: .11 + rnd() * .17,
      len: 5 + Math.floor(rnd() * 6), ph: rnd() * 6.28, sz: 2.8 + rnd() * 2.4,
      col: c[i % c.length], glow: i % 5 === 4
    });
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    chains.forEach(function (c) {
      if (motionOn) {
        c.x += Math.cos(c.a) * c.sp; c.y += Math.sin(c.a) * c.sp; c.a += .0018;
        if (c.x < -140) c.x = w + 70; if (c.x > w + 140) c.x = -70;
        if (c.y < -140) c.y = h + 70; if (c.y > h + 140) c.y = -70;
      }
      var pts = [];
      for (var i = 0; i < c.len; i++) {
        var u = i * 20, ang = c.a + Math.sin(i * .7 + c.ph + t * .0005) * .6;
        var wob = Math.sin(i * .9 + c.ph + t * .0007) * 8;
        pts.push([c.x + Math.cos(c.a) * u + Math.cos(ang + 1.57) * wob,
                  c.y + Math.sin(c.a) * u + Math.sin(ang + 1.57) * wob]);
      }
      ctx.globalAlpha = c.glow ? .34 : .26;
      ctx.strokeStyle = c.col; ctx.lineWidth = 1.5; ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
      ctx.globalAlpha = c.glow ? .46 : .36;
      ctx.fillStyle = c.col;
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], c.sz, 0, 6.2832); ctx.fill(); });
    });
    ctx.globalAlpha = 1;
    raf = (motionOn && visible) ? requestAnimationFrame(draw) : 0;
  }
  function paint() { if (!ctx) return; init(); if (!raf) requestAnimationFrame(draw); }

  if (ctx) {
    size(); init(); requestAnimationFrame(draw);
    addEventListener('resize', function () { size(); init(); if (!raf) requestAnimationFrame(draw); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && motionOn && !raf) raf = requestAnimationFrame(draw);
      }).observe(cv);
    }
  }

  /* ── motion switch ─────────────────────────────────── */
  var btn = document.getElementById('motion');
  if (btn) {
    var label = function () {
      btn.textContent = motionOn ? btn.dataset.off : btn.dataset.on;
      html.classList.toggle('still', !motionOn);
    };
    label();
    btn.addEventListener('click', function () {
      motionOn = !motionOn;
      try { localStorage.setItem('pep-motion', motionOn ? 'on' : 'off'); } catch (e) {}
      label();
      if (motionOn && !raf) requestAnimationFrame(draw);
      else if (ctx) requestAnimationFrame(draw);  // one last frame, then still
    });
  }
})();
