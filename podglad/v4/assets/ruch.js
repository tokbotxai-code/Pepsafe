/* PepSafe v4 — motion and interaction, added on top of a page that already works without it.
   No framework: reveals use IntersectionObserver, the chains use one canvas, and every
   answer the overlap checker can give is already in the HTML. */
(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('pep-motion'); } catch (e) {}
  var motionOn = !reduced && stored !== 'off';

  html.classList.add('js');

  /* ── reveal on scroll ──────────────────────────────── */
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // small stagger inside one section, so a row of tiles does not snap in as one block
        var peers = [].slice.call(el.parentNode.children).filter(function (n) { return n.classList && n.classList.contains('reveal'); });
        el.style.transitionDelay = Math.min(peers.indexOf(el), 5) * 60 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── counters in the data rail ─────────────────────── */
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
      out = document.getElementById('verdict'), sr = document.querySelector('.sr');
  if (a && b && out) {
    var render = function () {
      var same = a.value === b.value;
      var src = document.getElementById(same ? 'a-' + a.value : 'a-diff');
      out.className = 'verdict' + (same ? ' same' : '');
      out.innerHTML = '<b>' + (same ? sr.dataset.same : sr.dataset.diff) + '</b><span>' +
        (src ? src.innerHTML : '') + '</span>';
    };
    a.addEventListener('change', render);
    b.addEventListener('change', render);
    render();
  }

  /* ── pointer-tracked border glow ───────────────────── */
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest && e.target.closest('.tile');
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ── drifting chains ───────────────────────────────── */
  var cv = document.getElementById('chains');
  var chains = [], w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, visible = true, scrolling = 0;
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function init() {
    chains = []; var n = w < 600 ? 4 : 7;
    for (var i = 0; i < n; i++) chains.push({
      x: rnd() * w, y: rnd() * h, a: rnd() * 6.28, sp: .05 + rnd() * .09,
      len: 5 + Math.floor(rnd() * 5), ph: rnd() * 6.28, sz: 2.4 + rnd() * 1.8, neon: i % 4 === 0
    });
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    chains.forEach(function (c) {
      if (motionOn && !scrolling) {
        c.x += Math.cos(c.a) * c.sp; c.y += Math.sin(c.a) * c.sp; c.a += .0012;
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
      ctx.globalAlpha = c.neon ? .16 : .09;
      ctx.strokeStyle = c.neon ? '#00FF66' : '#111413';
      ctx.lineWidth = 1.3; ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
      ctx.globalAlpha = c.neon ? .22 : .12;
      ctx.fillStyle = c.neon ? '#00FF66' : '#111413';
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], c.sz, 0, 6.2832); ctx.fill(); });
    });
    ctx.globalAlpha = 1;
    raf = (motionOn && visible) ? requestAnimationFrame(draw) : 0;
  }
  function start() { if (!raf && ctx) raf = requestAnimationFrame(draw); }

  if (ctx) {
    size(); init(); requestAnimationFrame(draw);
    addEventListener('resize', function () { size(); init(); if (!raf) requestAnimationFrame(draw); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && motionOn) start(); }).observe(cv);
    }
    // pause the drift while the page is scrolling, so it never competes with the reveals
    var tm; addEventListener('scroll', function () {
      scrolling = 1; clearTimeout(tm); tm = setTimeout(function () { scrolling = 0; }, 180);
    }, { passive: true });
  }

  /* ── motion switch ─────────────────────────────────── */
  var btn = document.getElementById('motion');
  if (btn) {
    var label = function () { btn.textContent = motionOn ? btn.dataset.off : btn.dataset.on; };
    label();
    btn.addEventListener('click', function () {
      motionOn = !motionOn;
      try { localStorage.setItem('pep-motion', motionOn ? 'on' : 'off'); } catch (e) {}
      label();
      if (motionOn) start(); else if (ctx) requestAnimationFrame(draw); // one last frame, then still
    });
  }
})();
