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
  // brand palette, saturated variants that hold up on paper white — no grey
  var INK = ['#2F6DB5', '#0A7C66', '#C2410C', '#8B3FA8', '#00FF66'];
  var chains = [], w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, visible = true;
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function init() {
    chains = []; var n = w < 600 ? 7 : 12;
    for (var i = 0; i < n; i++) chains.push({
      x: rnd() * w, y: rnd() * h, a: rnd() * 6.28, sp: .11 + rnd() * .17,
      len: 5 + Math.floor(rnd() * 6), ph: rnd() * 6.28, sz: 2.8 + rnd() * 2.4,
      col: INK[i % INK.length], glow: i % 5 === 4
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
      ctx.strokeStyle = c.col;
      ctx.lineWidth = 1.5; ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
      ctx.globalAlpha = c.glow ? .46 : .36;
      ctx.fillStyle = c.col;
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
  }

  /* ── parallax: columns move at different speeds, no library ── */
  var par = [].slice.call(document.querySelectorAll('[data-par]'));
  if (par.length && !reduced && innerWidth >= 1024) {
    var ticking = 0;
    var place = function () {
      ticking = 0;
      par.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var mid = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = 'translate3d(0,' + (mid * +el.dataset.par * -40).toFixed(1) + 'px,0)';
      });
    };
    addEventListener('scroll', function () { if (!ticking && motionOn) { ticking = 1; requestAnimationFrame(place); } }, { passive: true });
    place();
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
      if (motionOn) start(); else if (ctx) requestAnimationFrame(draw); // one last frame, then still
    });
  }
})();
