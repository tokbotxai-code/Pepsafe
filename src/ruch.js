/* PepSafe v4 — motion, theme and filtering, added on top of pages that already work without it.
   No framework: reveals use IntersectionObserver, the chains use one canvas, and every answer
   the overlap checker can give is already written into the HTML. */
(function () {
  'use strict';

  var html = document.documentElement;
  // the Spanish pages reuse the English branch of every message, swapped here
  var ES = html.lang === 'es';
  function es(en, sp) { return ES ? sp : en; }
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stored = null;
  try { stored = localStorage.getItem('pep-motion'); } catch (e) {}
  var motionOn = !reduced && stored !== 'off';
  html.classList.add('js');
  if (!motionOn) html.classList.add('still');

  /* ── theme ─────────────────────────────────────────── */
  var sys = matchMedia('(prefers-color-scheme: dark)');
  // the browser bar takes the page's colour, not the phone's, once the reader picks a theme
  var themeBar = function () {
    var c = html.getAttribute('data-theme') === 'dark' ? '#0B0F0D' : '#F6F6F3';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  };
  var setTheme = function (t) { html.setAttribute('data-theme', t); themeBar(); paint(); };
  themeBar();
  var tbtn = document.getElementById('theme');
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    // picking the phone's own theme hands control back to the phone
    try { if (next === (sys.matches ? 'dark' : 'light')) localStorage.removeItem('pep-theme'); else localStorage.setItem('pep-theme', next); } catch (e) {}
    setTheme(next);  // the chains repaint in the new palette straight away
  });
  // follow the phone switching light/dark while the page is open, unless the reader chose a theme
  var follow = function () {
    var saved = null; try { saved = localStorage.getItem('pep-theme'); } catch (e) {}
    if (saved === 'dark' || saved === 'light') return;
    setTheme(sys.matches ? 'dark' : 'light');
  };
  if (sys.addEventListener) sys.addEventListener('change', follow); else if (sys.addListener) sys.addListener(follow);

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
    var pl = html.lang === 'pl';
    // czlonkowie grupy prosto z katalogu, zeby odpowiedz nazywala konkretne substancje
    function members(id) {
      if (!window.PEP) return [];
      return window.PEP.rows.filter(function (r) { return r.g === id; });
    }
    function label(sel) { return sel.options[sel.selectedIndex].textContent; }
    function side(sel) {
      var m = members(sel.value), ex = m.slice(0, 3).map(function (r) { return r.n; }).join(', ');
      return '<b>' + label(sel) + '</b>' +
        (m.length ? ' <span class="muted">' + m.length + (pl ? ' wpisów' : es(' entries', ' fichas')) +
          (ex ? (pl ? ', m.in. ' : es(', e.g. ', ', p. ej. ')) + ex : '') + '</span>' : '');
    }
    var render = function () {
      var same = a.value === b.value;
      var src = document.getElementById(same ? 'a-' + a.value : 'a-diff');
      out.className = 'verdict' + (same ? ' same' : '');
      var pair = '<p class="vpair">' + side(a) + '<i aria-hidden="true">' + (same ? '=' : '↔') + '</i>' + side(b) + '</p>';
      out.innerHTML = '<b>' + (same ? sr.dataset.same : sr.dataset.diff) + '</b>' + pair +
        '<span>' + (src ? src.innerHTML : '') + '</span>';
      out.classList.remove('flash'); void out.offsetWidth; out.classList.add('flash');
    };
    a.addEventListener('change', render);
    b.addEventListener('change', render);
    render();
  }

  /* ── catalog search and status filter ──────────────── */
  var q = document.getElementById('q'), chips = document.getElementById('chips'), list = document.getElementById('list');
  if (q && list) {
    var items = [].slice.call(list.children), nohit = document.getElementById('nohit'), pick = '';
    // accents, hyphens and spaces ignored, so "bpc157" finds BPC-157
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); };
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


  /* ── saved entries, kept in this browser only ──────── */
  var SK = 'pep-saved';
  function readSaved() { try { return JSON.parse(localStorage.getItem(SK) || '[]'); } catch (e) { return []; } }
  function writeSaved(v) { try { localStorage.setItem(SK, JSON.stringify(v)); } catch (e) {} }
  function markStars() {
    var on = readSaved();
    document.querySelectorAll('.star').forEach(function (b) { b.classList.toggle('on', on.indexOf(b.dataset.key) > -1); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.star');
    if (!b) return;
    e.preventDefault();
    var list = readSaved(), i = list.indexOf(b.dataset.key);
    if (i > -1) list.splice(i, 1); else list.push(b.dataset.key);
    writeSaved(list); markStars();
    if (document.getElementById('savedOut')) renderSaved();
  });
  markStars();

  function rowCard(r) {
    return '<div class="entry tile"><a class="entry-link" href="p/' + r.s + '.html">' +
      '<span class="pill ' + r.tone + '">' + r.st + '</span><b>' + r.n + '</b><em>' + r.c + '</em></a>' +
      '<button class="star on" data-key="' + r.s + '" aria-label="x"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 2.6l2.2 4.5 5 .7-3.6 3.5.9 4.9L10 14l-4.5 2.2.9-4.9L2.8 7.8l5-.7z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button></div>';
  }
  function renderSaved() {
    var box = document.getElementById('savedOut'); if (!box || !window.PEP) return;
    var on = readSaved();
    var rows = window.PEP.rows.filter(function (r) { return on.indexOf(r.s) > -1; });
    box.innerHTML = rows.map(rowCard).join('');
    var empty = document.getElementById('savedEmpty'); if (empty) empty.hidden = rows.length > 0;
  }

  /* ── compare ───────────────────────────────────────── */
  var cq = document.getElementById('cmpQ');
  if (cq && window.PEP) {
    var picked = [], dl = document.getElementById('cmpList'),
        cout = document.getElementById('cmpOut'), cempty = document.getElementById('cmpEmpty'),
        cwarn = document.getElementById('cmpWarn');
    dl.innerHTML = window.PEP.rows.map(function (r) { return '<option value="' + r.n + '">'; }).join('');
    var drawCmp = function () {
      cout.innerHTML = picked.map(function (r) {
        return '<article class="tile glass cmp"><p class="kick">' + r.st + '</p><h2 class="gtitle sm">' + r.n + '</h2>' +
          '<p class="small ink2">' + r.c + (r.gl ? ' · ' + r.gl : '') + '</p>' +
          (r.ev ? '<p class="kick mt">' + (html.lang === 'pl' ? 'Dowody' : es('Evidence', 'Evidencia')) + '</p><p class="small">' + r.ev + '</p>' : '') +
          (r.w ? '<p class="kick mt">' + (html.lang === 'pl' ? 'Uwaga' : es('Watch for', 'Atención')) + '</p><p class="small">' + r.w + '</p>' : '') +
          '<p><a class="more" href="p/' + r.s + '.html">' + r.n + '</a></p></article>';
      }).join('');
      cempty.hidden = picked.length > 0;
      var groups = picked.filter(function (r) { return r.g; }).map(function (r) { return r.g; });
      var clash = groups.some(function (g, i) { return groups.indexOf(g) !== i; });
      cwarn.innerHTML = clash
        ? '<div class="verdict same reveal in"><b>' + (html.lang === 'pl' ? 'Dwie z nich są w tej samej grupie — nie łączyć' : es('Two of these share a group — do not combine', 'Dos de ellas comparten grupo: no combinar')) + '</b><span>' +
          (html.lang === 'pl' ? 'Działają na ten sam cel, więc łączenie powtarza mechanizm, zamiast dodawać drugi.' : es('They act on the same target, so stacking repeats a mechanism instead of adding one.', 'Actúan sobre la misma diana, así que combinarlas repite un mecanismo en lugar de añadir otro.')) + '</span></div>'
        : '';
    };
    cq.addEventListener('change', function () {
      var r = window.PEP.rows.filter(function (x) { return x.n.toLowerCase() === cq.value.trim().toLowerCase(); })[0];
      if (r && picked.indexOf(r) < 0) { picked.push(r); if (picked.length > 3) picked.shift(); }
      cq.value = ''; drawCmp();
    });
    var cc = document.getElementById('cmpClear');
    if (cc) cc.addEventListener('click', function () { picked = []; drawCmp(); });
    drawCmp();
  }

  /* ── symptom search ────────────────────────────────── */
  var sq = document.getElementById('syQ');
  if (sq && window.PEP) {
    var sout = document.getElementById('syOut'), shint = document.getElementById('syHint');
    var runSy = function () {
      var v = sq.value.trim().toLowerCase();
      if (v.length < 3) { sout.innerHTML = ''; shint.hidden = false; return; }
      var hits = window.PEP.rows.filter(function (r) { return r.t.indexOf(v) > -1; });
      shint.hidden = hits.length > 0;
      if (!hits.length) { shint.hidden = false; shint.textContent = html.lang === 'pl' ? 'Nic nie pasuje.' : es('Nothing matches that.', 'No hay coincidencias.'); }
      sout.innerHTML = hits.slice(0, 60).map(rowCard).join('');
      markStars();
    };
    sq.addEventListener('input', runSy);
    var sc = document.getElementById('syChips');
    if (sc) sc.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      sq.value = c.dataset.sy; runSy();
    });
  }

  renderSaved();

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

  /* ── drifting chains, one instance per canvas ──────── */
  var painters = [];
  function hues() {
    var st = getComputedStyle(html);
    return ['--k1', '--k2', '--k3', '--k4', '--neon'].map(function (v) { return st.getPropertyValue(v).trim() || '#2F6DB5'; });
  }
  function makeChains(cv, dense) {
    var ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    var chains = [], w = 0, h = 0, dpr = Math.min(2, devicePixelRatio || 1), raf = 0, visible = true;
    var seed = 7 + painters.length * 131;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function init() {
      var c = hues();
      chains = []; var n = Math.round((w < 600 ? 7 : 12) * dense);
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
    size(); init(); requestAnimationFrame(draw);
    addEventListener('resize', function () { size(); init(); if (!raf) requestAnimationFrame(draw); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && motionOn && !raf) raf = requestAnimationFrame(draw);
      }).observe(cv);
    }
    painters.push(function () { init(); if (!raf) requestAnimationFrame(draw); });
    return function () { if (!raf) requestAnimationFrame(draw); };
  }
  function paint() { painters.forEach(function (f) { f(); }); }
  [].slice.call(document.querySelectorAll('#chains, canvas.chains')).forEach(function (cv) {
    makeChains(cv, cv.dataset.dense ? +cv.dataset.dense : 1);
  });

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

  /* ── szukanie w calej witrynie: lupka w belce, / na klawiaturze ─── */
  (function () {
    var wrap = document.getElementById('findwrap'), inp = document.getElementById('fq');
    if (!wrap || !inp) return;
    var listEl = document.getElementById('fr'), hint = document.getElementById('fh');
    var btn = document.getElementById('find'), close = document.getElementById('fx');
    var up = /\/p\/[^\/]*$/.test(location.pathname) ? '../' : '';
    var sel = -1, hits = [], last = '';

    var norm = function (s) {
      return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
    };
    var mark = function (name, needle) {
      var i = norm(name).indexOf(needle);
      if (i < 0) return esc(name);
      return esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + needle.length)) + '</mark>' + esc(name.slice(i + needle.length));
    };
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

    function find(v) {
      var n = norm(v.trim());
      if (n.length < 2 || !window.PEP) return [];
      var pre = [], mid = [], deep = [];
      var sq = n.replace(/[^a-z0-9]/g, ''); // "bpc157" also finds BPC-157
      window.PEP.rows.forEach(function (r) {
        var nn = norm(r.n);
        if (nn.indexOf(n) === 0) pre.push(r);
        else if (nn.indexOf(n) > -1) mid.push(r);
        else if (sq.length > 1 && nn.replace(/[^a-z0-9]/g, '').indexOf(sq) > -1) mid.push(r);
        else if (norm(r.t).indexOf(n) > -1) deep.push(r);
      });
      var by = function (a, b) { return a.n.localeCompare(b.n); };
      return pre.sort(by).concat(mid.sort(by), deep.sort(by));
    }

    function render() {
      var v = inp.value, n = norm(v.trim());
      if (v === last) return; last = v;
      hits = find(v); sel = -1;
      listEl.innerHTML = '';
      if (n.length < 2) { hint.textContent = hint.dataset.base || hint.textContent; hint.hidden = false; return; }
      if (!hits.length) { hint.textContent = hint.dataset.none; hint.hidden = false; return; }
      hint.hidden = true;
      hits.slice(0, 40).forEach(function (r) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + up + 'p/' + r.s + '.html"><b>' + mark(r.n, n) + '</b>' +
          '<span class="fcat">' + esc(r.c || '') + '</span><small>' + esc(r.st || '') + '</small></a>';
        listEl.appendChild(li);
      });
      if (hits.length > 40) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + up + 'catalog.html"><b>' + esc(hint.dataset.more || '') +
          '</b><small>' + hits.length + '</small></a>';
        listEl.appendChild(li);
      }
    }

    function move(d) {
      var li = listEl.children; if (!li.length) return;
      if (sel > -1 && li[sel]) li[sel].classList.remove('sel');
      sel = (sel + d + li.length) % li.length;
      li[sel].classList.add('sel');
      li[sel].scrollIntoView({ block: 'nearest' });
    }

    function open() {
      wrap.hidden = false;
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      setTimeout(function () { inp.focus(); inp.select(); }, 30);
    }
    function shut() {
      wrap.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      if (btn) btn.focus();
    }

    hint.dataset.base = hint.textContent;
    hint.dataset.none = hint.dataset.none || (html.lang === 'pl' ? 'Nic nie pasuje.' : es('Nothing matches that.', 'No hay coincidencias.'));
    hint.dataset.more = html.lang === 'pl' ? 'Zobacz wszystkie wyniki' : es('See all results', 'Ver todos los resultados');

    if (btn) btn.addEventListener('click', open);
    [].slice.call(document.querySelectorAll('[data-find]')).forEach(function (b) { b.addEventListener('click', open); });
    if (close) close.addEventListener('click', shut);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) shut(); });
    inp.addEventListener('input', render);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var a = (listEl.children[sel > -1 ? sel : 0] || {}).firstChild;
        if (a && a.href) { e.preventDefault(); location.href = a.href; }
      } else if (e.key === 'Escape') shut();
    });
    document.addEventListener('keydown', function (e) {
      if (wrap.hidden && (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); open(); }
      else if (!wrap.hidden && e.key === 'Escape') shut();
    });
  })();


  /* ── formularze: sprawdzenie pol przed zwyklym wyslaniem ───────── */
  (function () {
    var co = document.getElementById('coForm'), ef = document.getElementById('efForm');
    var pl = html.lang === 'pl';
    var MSG = pl ? {
      co: 'Uzupełnij imię, poprawny e-mail i wiadomość (min. 10 znaków) oraz zaznacz zgodę.',
      ef: 'Uzupełnij opis objawu i zaznacz zgodę.'
    } : {
      co: es('Enter your name, a valid email and a message (min. 10 characters) and tick the consent.', 'Escribe tu nombre, un correo válido y un mensaje (mín. 10 caracteres) y marca el consentimiento.'),
      ef: es('Describe the symptom and tick the consent box.', 'Describe el síntoma y marca la casilla de consentimiento.')
    };
    function say(el, text) { el.hidden = false; el.textContent = text; el.classList.add('bad'); }
    function flag(el, bad) { if (el) el.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    function busy(form) {
      var b = form.querySelector('[type="submit"]');
      if (b && b.dataset.busy) { b.disabled = true; b.textContent = b.dataset.busy; }
    }

    if (co) {
      var out = document.getElementById('coMsgOut');
      co.addEventListener('submit', function (e) {
        var n = co.coName.value.trim(), m = co.coEmail.value.trim(), msg = co.coMsg.value.trim();
        var cons = document.getElementById('coCons').checked;
        var okMail = /^\S+@\S+\.\S+$/.test(m);
        flag(co.coName, !n); flag(co.coEmail, !okMail); flag(co.coMsg, msg.length < 10);
        if (!n || !okMail || msg.length < 10 || !cons) { e.preventDefault(); say(out, MSG.co); return; }
        out.hidden = true; busy(co);
      });
    }

    if (ef) {
      var eout = document.getElementById('efMsg'), sub = document.getElementById('efSub');
      if (sub && window.PEP) {
        window.PEP.rows.slice().sort(function (a, b) { return a.n.localeCompare(b.n); }).forEach(function (r) {
          var o = document.createElement('option'); o.textContent = r.n; sub.appendChild(o);
        });
      }
      ef.addEventListener('submit', function (e) {
        var sym = ef.efSym.value.trim(), cons = document.getElementById('efCons').checked;
        flag(ef.efSym, !sym);
        if (!sym || !cons) { e.preventDefault(); say(eout, MSG.ef); return; }
        eout.hidden = true; busy(ef);
      });
    }
  })();

  /* ── zapis na liste: wysylka w tle (FormSubmit ajax), potem strona z checklista ─ */
  (function () {
    var f = document.getElementById('nlForm');
    if (!f || !window.fetch) return;
    var out = document.getElementById('nlOut'), pl = html.lang === 'pl';
    f.addEventListener('submit', function (e) {
      var mail = f.email.value.trim(), cons = f.consent.checked;
      if (!/^\S+@\S+\.\S+$/.test(mail) || !cons) {
        e.preventDefault(); out.hidden = false; out.classList.add('bad');
        out.textContent = pl ? 'Wpisz poprawny e-mail i zaznacz zgodę.' : es('Enter a valid email and tick the consent box.', 'Escribe un correo válido y marca la casilla de consentimiento.');
        return;
      }
      e.preventDefault();
      var b = f.querySelector('[type="submit"]'); if (b) { b.disabled = true; b.textContent = b.dataset.busy; }
      out.hidden = false; out.classList.remove('bad'); out.textContent = pl ? 'Wysyłanie…' : es('Sending…', 'Enviando…');
      var go = function () { location.href = f.dataset.next; };
      setTimeout(go, 6000);   // gdyby serwer formularzy nie odpowiadal, i tak pokaz checkliste
      var jobs = [fetch(f.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(f)
      }).catch(function () {})];
      if (f.dataset.ml) {   // ta sama osoba trafia tez na liste w MailerLite (grupa PepSafe)
        var ml = new FormData(); ml.append('fields[email]', mail); ml.append('ml-submit', '1'); ml.append('anticsrf', 'true');
        jobs.push(fetch(f.dataset.ml, { method: 'POST', mode: 'no-cors', body: ml }).catch(function () {}));
      }
      Promise.all(jobs).then(go, go);
    });
  })();

  /* ── strona z podziekowaniem: inny tekst po zgloszeniu objawu ───── */
  (function () {
    var m = document.getElementById('thxMsg');
    if (m && /[?&]r=1/.test(location.search)) m.textContent = m.dataset.report;
  })();

  /* ── menu na telefonie ─────────────────────────────── */
  (function () {
    var wrap = document.getElementById('menu'), btn = document.getElementById('burger');
    if (!wrap || !btn) return;
    var x = document.getElementById('menux');
    function open() { wrap.hidden = false; btn.setAttribute('aria-expanded', 'true'); html.style.overflow = 'hidden'; var f = wrap.querySelector('a'); if (f) f.focus(); }
    function shut() { wrap.hidden = true; btn.setAttribute('aria-expanded', 'false'); html.style.overflow = ''; btn.focus(); }
    btn.addEventListener('click', open);
    if (x) x.addEventListener('click', shut);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) shut(); });
    document.addEventListener('keydown', function (e) { if (!wrap.hidden && e.key === 'Escape') shut(); });
  })();

})();
