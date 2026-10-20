// Builds the whole v4 site from the live catalog, in two languages, as plain HTML files.
// Pages: index, catalog, one card per substance, groups, questions, warnings, about.
// Everything a reader needs is in the markup; assets/ruch.js only adds motion and filtering.
// Usage: node tools/v4.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const out = path.join(root, 'podglad', 'v4');
const lines = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('\n');
const at = re => lines.findIndex(l => re.test(l));
const until = i => i + lines.slice(i).findIndex((l, n) => n > 0 && /^(\];|\};)/.test(l)) + 1;
const slice = (a, b) => lines.slice(a, b).join('\n');

// ── read the app's data blocks in a sandbox ───────────────────────────────────
const box = { console, window: {}, document: {} }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w,q,wa){D.push({n,a,s,c,cat,f,d,m,u,ev,w,q:q||"",wa:!!wa});}', box);
const ds = at(/^var ST=\{A:/), de = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
vm.runInContext(slice(ds, de).replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
for (const re of [/^var FAMS=/, /^var DAILY=\[/, /^var FAQ=\[/, /^var QA=\[/, /^var ALERTS=/, /^var TRICKS=/, /^var MYTHS=/, /^var DOSE=/]) {
  const i = at(re); if (i >= 0) vm.runInContext(slice(i, until(i)), box);
}
for (const re of [/^var SRC=\{/, /^var WADA=\{/, /^var WADA_URL=/, /^var SY_PL=/, /^var SY_EN=/]) { const i = at(re); if (i >= 0) vm.runInContext(lines[i], box); }
const { D, EN, ST, ST_EN, FAMS, FAMS_EN, DAILY, FAQ, QA, ALERTS, TRICKS, MYTHS, SRC, WADA, WADA_URL, DOSE, SY_PL, SY_EN } = box;

// ── helpers ───────────────────────────────────────────────────────────────────
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;.]+\S*$/, '') + '…' : s; };
const nm = (n, en) => en && EN[n] ? EN[n][0] : n;
const key = e => slug(nm(e.n, true));
const statusOf = (e, en) => en ? (ST_EN[e.s] || e.s) : (ST[e.s] || e.s);
const toneOf = e => e.s === 'A' ? 'ok' : (e.s === 'P' || e.s === 'R') ? 'mid' : (e.s === 'C' || e.s === 'N') ? 'neutral' : 'warn';
const famOf = e => FAMS.find(f => (f.m || []).includes(e.n));
const wadaOf = e => (WADA || {})[e.n] || (e.wa ? ['S0'] : null);

const STATS = [['approved', D.filter(e => e.s === 'A').length], ['unapproved', D.filter(e => e.s === 'U').length],
['trials', D.filter(e => e.s === 'P').length], ['sold', 0]];

const GROUPS = FAMS.filter(f => (f.m || []).length > 1).map(f => ({
  id: f.id, members: f.m, n: f.m.length,
  pl: { label: f.lab, rule: f.t, why: f.x },
  en: { label: (FAMS_EN[f.id] || [])[0] || f.lab, rule: (FAMS_EN[f.id] || [])[1] || f.t, why: (FAMS_EN[f.id] || [])[2] || f.x }
}));


// text the search tools look through: the entry, its dosing rows and its group blurb
function searchText(e, en) {
  const tr = EN[e.n] || [], f = famOf(e);
  return [nm(e.n, en), e.n, e.a, en && tr[1] ? tr[1] : e.c, en ? (tr[2] || e.d) : e.d, en ? (tr[3] || e.m) : e.m,
  en ? (tr[4] || e.u) : e.u, en ? (tr[5] || e.ev) : e.ev, en ? (tr[6] || e.w) : e.w,
  (DOSE || []).filter(x => x.k === e.n).map(x => [x.d, (x.i || [])[en ? 1 : 0], (x.p || [])[en ? 1 : 0],
    (x.m || [])[en ? 1 : 0], (x.x || [])[en ? 1 : 0]].join(' ')).join(' '),
  f ? [en ? ((FAMS_EN[f.id] || [])[0] || f.lab) : f.lab, en ? ((FAMS_EN[f.id] || [])[1] || f.t) : f.t,
    en ? ((FAMS_EN[f.id] || [])[2] || f.x) : f.x].join(' ') : ''
  ].join(' ').toLowerCase();
}

const LANGS = ['en', 'pl'];

const W = {
  en: {
    nav: { home: 'Home', catalog: 'Catalog', groups: 'Groups', faq: 'Questions', alerts: 'Warnings', about: 'About' },
    cta: 'Open catalog', theme: 'Theme', motionOff: 'Stop motion', motionOn: 'Start motion',
    skip: 'Skip to content', srcs: 'Sources', back: 'Catalog',
    foot: 'PepSafe — peptide facts, no sales. Educational content, not medical advice.',
    group: 'Group', wada: 'Anti-doping', seq: 'Sequence',
    what: 'What it is', how: 'How it works', use: 'Use', ev: 'What the research shows', care: 'What to watch for',
    related: 'Related', inGroup: 'entries in this group',
    search: 'Search by name or brand', filterAll: 'All', noHit: 'Nothing matches that.',
    entries: 'entries', listedWada: 'Listed by WADA in class', always: ', prohibited at all times',
    save: 'Save', saved: 'Saved', pick: 'Pick a substance', clear: 'Clear',
    dosingNav: 'Dosing', compareNav: 'Compare', symptomsNav: 'Symptoms', savedNav: 'Saved',
    findLab: 'Search', findPh: 'Type a name, brand or symptom', findHint: 'Type at least two letters.',
    findNone: 'Nothing matches that.', findClose: 'Close', findMore: 'See all results'
  },
  pl: {
    nav: { home: 'Start', catalog: 'Katalog', groups: 'Grupy', faq: 'Pytania', alerts: 'Ostrzeżenia', about: 'O projekcie' },
    cta: 'Otwórz katalog', theme: 'Motyw', motionOff: 'Zatrzymaj ruch', motionOn: 'Włącz ruch',
    skip: 'Przejdź do treści', srcs: 'Źródła', back: 'Katalog',
    foot: 'PepSafe — fakty o peptydach, bez sprzedaży. Treść edukacyjna, nie porada medyczna.',
    group: 'Grupa', wada: 'Antydoping', seq: 'Sekwencja',
    what: 'Co to jest', how: 'Jak działa', use: 'Zastosowanie', ev: 'Co mówią badania', care: 'Na co uważać',
    related: 'Podobne', inGroup: 'wpisów w tej grupie',
    search: 'Szukaj po nazwie lub marce', filterAll: 'Wszystkie', noHit: 'Nic nie pasuje.',
    entries: 'wpisów', listedWada: 'Wymieniony przez WADA w klasie', always: ', zakazany zawsze',
    save: 'Zapisz', saved: 'Zapisane', pick: 'Wybierz substancję', clear: 'Wyczyść',
    dosingNav: 'Dawkowanie', compareNav: 'Porównaj', symptomsNav: 'Objawy', savedNav: 'Zapisane',
    findLab: 'Szukaj', findPh: 'Wpisz nazwę, markę albo objaw', findHint: 'Wpisz co najmniej dwie litery.',
    findNone: 'Nic nie pasuje.', findClose: 'Zamknij', findMore: 'Zobacz wszystkie wyniki'
  }
};

const FAVICON = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 34 34%22%3E%3Cpath d=%22M6 24 L14 10 L22 22 L29 8%22 stroke=%22%238A918D%22 stroke-width=%222%22 fill=%22none%22/%3E%3Ccircle cx=%226%22 cy=%2224%22 r=%224.5%22 fill=%22%232F6DB5%22/%3E%3Ccircle cx=%2214%22 cy=%2210%22 r=%224.5%22 fill=%22%230A7C66%22/%3E%3Ccircle cx=%2222%22 cy=%2222%22 r=%224.5%22 fill=%22%23C2410C%22/%3E%3Ccircle cx=%2229%22 cy=%228%22 r=%224.5%22 fill=%22%238B3FA8%22/%3E%3C/svg%3E">';

const LOGO = '<svg class="logo" width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">' +
  '<path d="M6 24 L14 10 L22 22 L29 8" stroke="var(--ink3)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="6" cy="24" r="4.5" fill="var(--k1)"/><circle cx="14" cy="10" r="4.5" fill="var(--k2)"/>' +
  '<circle cx="22" cy="22" r="4.5" fill="var(--k3)"/><circle cx="29" cy="8" r="4.5" fill="var(--k4)"/></svg>';

const ARROW = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// the theme is resolved before first paint, so the page never flashes the wrong one
const THEME_BOOT = `<script>(function(){try{var t=localStorage.getItem('pep-theme');` +
  `if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
  `document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</` + `script>`;

function layout(o) {
  const L = o.lang, t = W[L];
  const up = o.depth === 1 ? '../' : '';
  const other = L === 'en' ? 'pl' : 'en';
  const nav = [['index.html', t.nav.home], ['catalog.html', t.nav.catalog], ['dosing.html', t.dosingNav],
  ['groups.html', t.nav.groups], ['compare.html', t.compareNav], ['symptoms.html', t.symptomsNav],
  ['faq.html', t.nav.faq], ['alerts.html', t.nav.alerts], ['about.html', t.nav.about]];
  return `<!doctype html>
<html lang="${L}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="robots" content="noindex">
${FAVICON}
${THEME_BOOT}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}../assets/site.css">
</head>
<body>
<a class="skip" href="#main">${esc(t.skip)}</a>
<i class="progress" aria-hidden="true"></i>

<header class="bar">
  <nav class="wrap">
    <a class="brand" href="${up}index.html">${LOGO}PepSafe</a>
    <ul class="links">
      ${nav.map(([h, l]) => `<li><a href="${up}${h}"${o.here === h && !o.depth ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('\n      ')}
    </ul>
    <div class="tools">
      <button class="icon" id="find" type="button" aria-label="${esc(t.findLab)}" aria-expanded="false">
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12.9 12.9 17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <button class="icon" id="theme" type="button" aria-label="${esc(t.theme)}">
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><g class="sun"><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.2 5.2l1.4 1.4M13.4 13.4l1.4 1.4M14.8 5.2l-1.4 1.4M6.6 13.4l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="10" r="3.2" stroke="currentColor" stroke-width="1.5" fill="none"/></g><path class="moon" d="M15 11.5A6 6 0 0 1 8.5 5a6 6 0 1 0 6.5 6.5Z" fill="currentColor"/></svg>
      </button>
      <a class="lang" href="${up}../${other}/${o.twin || ''}">${other.toUpperCase()}</a>
      <a class="btn" href="${up}catalog.html">${esc(t.cta)}</a>
    </div>
  </nav>
</header>

<div class="findwrap" id="findwrap" hidden>
  <div class="findcard" role="dialog" aria-modal="true" aria-label="${esc(t.findLab)}">
    <div class="findtop">
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12.9 12.9 17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <input id="fq" type="search" placeholder="${esc(t.findPh)}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
      <button class="icon" id="fx" type="button" aria-label="${esc(t.findClose)}">
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <p class="findhint" id="fh">${esc(t.findHint)}</p>
    <ul class="findlist" id="fr"></ul>
  </div>
</div>

<main id="main">
${o.body}
</main>

<footer>
  <div class="wrap foot">
    <p>${esc(t.foot)}</p>
    <p><button id="motion" class="linkish" data-off="${esc(t.motionOff)}" data-on="${esc(t.motionOn)}">${esc(t.motionOff)}</button> · <span class="mono">pepsafe.info</span></p>
  </div>
</footer>

<script src="${up}../assets/dane-${L}.js" defer></script>
<script src="${up}../assets/ruch.js" defer></script>
</body>
</html>
`;
}

// ── homepage copy ─────────────────────────────────────────────────────────────
const H = {
  en: {
    badge: 'Independent · non-commercial', h1: ['Short chains.', 'Long consequences.', 'Evidence first.'],
    lede: `A reference for ${D.length} peptides and related substances: what each one is, what the research actually shows, whether any regulator approved it, and which groups act on the same receptor. Nothing here is for sale, and we never publish doses for substances that are not approved medicines.`,
    b1: 'Check an overlap', b2: `Browse all ${D.length}`, railTitle: 'Catalog, by status',
    stats: { approved: 'Approved medicines', unapproved: 'Unapproved', trials: 'In clinical trials', sold: 'Products sold' },
    s1kick: '01 — Overlap checker', s1h: 'Two names, one receptor.',
    s1p: 'The most common mistake online is stacking substances that act on the same target. Pick two groups and see whether they collide — with the reason, not just a red light.',
    selA: 'Group A', selB: 'Group B', same: 'Same group — do not combine', diff: 'Different groups — different targets',
    diffWhy: 'These act on different targets, so there is no duplication between them. That is not the same as being safe together: interactions outside a shared receptor are a question for a doctor, not for a chart.',
    ruleKick: 'The rule', rule: ['Same receptor,', 'no added benefit,', 'added risk.'],
    ruleP: 'Doubling a mechanism rarely doubles the effect. It reliably doubles the side effects.',
    hs: 'Human studies', hsP: 'participants in total, across the three human studies of the most-discussed “research” peptide — none with a control group.',
    ladderKick: 'What “studied” can mean',
    ladder: [['Cells', 'A dish is not a body.'], ['Animals', 'Roughly one in ten carries over.'], ['A few people', 'Often with no control group.'], ['Real trials', 'Where approval starts.']],
    s2kick: '02 — Peptide of the day', s3kick: '03 — Catalog', s3h: 'Status before story.',
    s3p: 'Every entry opens with its legal status, then what the research shows, then what to watch for. Sources are linked. Where the evidence is thin, we say so plainly instead of filling the gap with adjectives.',
    all: `All ${D.length} entries`, s4kick: '04 — Questions', s5kick: '05 — What this is not',
    s5h: 'No shop. No doses from strangers. No promises.',
    not: ['We publish doses only for approved medicines, straight from the label, and only as information — never as a recommendation.',
      'For unapproved substances there is no dose to give. Where human safety is unestablished, that is the finding, not a gap to fill.',
      'Educational content, not medical advice. Decisions about treatment belong with a doctor who knows your case.']
  },
  pl: {
    badge: 'Niezależnie · niekomercyjnie', h1: ['Krótkie łańcuchy.', 'Długie konsekwencje.', 'Najpierw dowody.'],
    lede: `Przewodnik po ${D.length} peptydach i substancjach pokrewnych: czym każda z nich jest, co naprawdę pokazują badania, czy jakikolwiek regulator ją zatwierdził i które grupy działają na ten sam receptor. Nic tu nie jest na sprzedaż, a dawek dla substancji niezatwierdzonych nie podajemy nigdy.`,
    b1: 'Sprawdź dublowanie', b2: `Zobacz wszystkie ${D.length}`, railTitle: 'Katalog według statusu',
    stats: { approved: 'Zatwierdzone leki', unapproved: 'Niezatwierdzone', trials: 'W badaniach klinicznych', sold: 'Sprzedanych produktów' },
    s1kick: '01 — Sprawdzarka dublowania', s1h: 'Dwie nazwy, jeden receptor.',
    s1p: 'Najczęstszy błąd w internecie to łączenie substancji działających na ten sam cel. Wybierz dwie grupy i zobacz, czy się pokrywają — razem z powodem, nie samym czerwonym światłem.',
    selA: 'Grupa A', selB: 'Grupa B', same: 'Ta sama grupa — nie łączyć', diff: 'Różne grupy — różne cele',
    diffWhy: 'Działają na inne cele, więc nie ma tu dublowania. To nie znaczy, że są bezpieczne razem: o interakcjach poza wspólnym receptorem decyduje lekarz, nie tabelka.',
    ruleKick: 'Zasada', rule: ['Ten sam receptor,', 'brak dodatkowej korzyści,', 'większe ryzyko.'],
    ruleP: 'Podwojenie mechanizmu rzadko podwaja działanie. Niezawodnie podwaja działania niepożądane.',
    hs: 'Badania u ludzi', hsP: 'uczestników łącznie w trzech badaniach u ludzi najgłośniejszego peptydu „badawczego” — żadne bez grupy kontrolnej.',
    ladderKick: 'Co może znaczyć „przebadany”',
    ladder: [['Komórki', 'Szalka to nie organizm.'], ['Zwierzęta', 'Przechodzi mniej więcej jedno na dziesięć.'], ['Kilka osób', 'Często bez grupy kontrolnej.'], ['Prawdziwe badania', 'Tu zaczyna się rejestracja.']],
    s2kick: '02 — Peptyd dnia', s3kick: '03 — Katalog', s3h: 'Najpierw status, potem historia.',
    s3p: 'Każdy wpis zaczyna się od statusu prawnego, potem mówi, co pokazują badania, a na końcu na co uważać. Źródła są podlinkowane. Gdzie dowodów jest mało, piszemy to wprost, zamiast zasypywać lukę przymiotnikami.',
    all: `Wszystkie ${D.length} wpisów`, s4kick: '04 — Pytania', s5kick: '05 — Czym to nie jest',
    s5h: 'Bez sklepu. Bez dawek od obcych. Bez obietnic.',
    not: ['Dawki podajemy wyłącznie dla zatwierdzonych leków, prosto z etykiety, i tylko jako informację — nigdy jako zalecenie.',
      'Dla substancji niezatwierdzonych nie ma dawki do podania. Jeśli bezpieczeństwo u ludzi jest nieustalone, to jest wynik, a nie luka do wypełnienia.',
      'Treść edukacyjna, nie porada medyczna. Decyzje o leczeniu należą do lekarza, który zna Twój przypadek.']
  }
};

const FEATURED = ['Semaglutyd', 'Tesamorelina', 'Retatrutyd', 'BPC-157', 'Melanotan II', 'GHK-Cu']
  .map(n => D.find(e => e.n === n)).filter(Boolean);

const cardRow = (e, en, up) => `<a class="card tile reveal" href="${up}p/${key(e)}.html">
      <span><b>${esc(nm(e.n, en))}</b><em>${esc(en && EN[e.n] ? EN[e.n][1] : e.c)}</em></span>
      <span class="pill ${toneOf(e)}">${esc(statusOf(e, en))}</span></a>`;

function home(L) {
  const en = L === 'en', t = W[L], h = H[L], day = DAILY[0];
  const faq = FAQ.filter(x => Array.isArray(x) && x[0] && x[1]).slice(0, 4);
  const answers = GROUPS.map(g => `<p class="answer" id="a-${g.id}" hidden><b>${esc(g[L].rule)}</b> ${esc(g[L].why)} <span class="muted">${g.n} ${esc(t.inGroup)}.</span></p>`).join('');
  const opts = sel => GROUPS.map((g, i) => `<option value="${g.id}"${i === sel ? ' selected' : ''}>${esc(g[L].label)}</option>`).join('');

  const body = `
<section id="top" class="hero paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap hero-grid">
    <div>
      <p class="badge reveal">${esc(h.badge)}<i class="dot" aria-hidden="true"></i></p>
      <h1 class="display">${h.h1.map((x, i) => `<span class="reveal${i === 1 ? ' dim' : ''}">${esc(x)}</span>`).join('')}</h1>
      <p class="lede reveal">${esc(h.lede)}</p>
      <p class="herofind reveal">
        <button type="button" class="findfake" data-find>
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12.9 12.9 17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <span>${esc(W[L].findPh)}</span>
        </button>
      </p>
      <p class="actions reveal">
        <a class="btn big" href="#overlap">${esc(h.b1)}${ARROW}</a>
        <a class="btn ghost big" href="catalog.html">${esc(h.b2)}</a>
      </p>
    </div>
    <aside class="rail">
      <p class="kick reveal">${esc(h.railTitle)}</p>
      <dl>${STATS.map(([k, n]) => `<div class="rail-row reveal"><dt>${esc(h.stats[k])}</dt><dd class="num"><span data-count="${n}">${n}</span>${k === 'sold' ? '<i class="dot"></i>' : ''}</dd></div>`).join('')}</dl>
    </aside>
  </div>
</section>

<section id="overlap" class="field">
  <div class="wrap">
    <div class="head">
      <div><p class="kick reveal">${esc(h.s1kick)}</p><h2 class="display reveal">${esc(h.s1h)}</h2></div>
      <p class="lead reveal">${esc(h.s1p)}</p>
    </div>
    <div class="bento">
      <div class="tile glass span4 reveal">
        <form id="checker" onsubmit="return false">
          <div class="picks">
            <label><span class="kick">${esc(h.selA)}</span><select id="selA">${opts(0)}</select></label>
            <label><span class="kick">${esc(h.selB)}</span><select id="selB">${opts(Math.min(9, GROUPS.length - 1))}</select></label>
          </div>
          <output id="verdict" class="verdict"><b>${esc(h.diff)}</b><span>${esc(h.diffWhy)}</span></output>
          <div hidden id="answers">${answers}<p class="answer" id="a-diff">${esc(h.diffWhy)}</p></div>
          <p class="sr" data-same="${esc(h.same)}" data-diff="${esc(h.diff)}"></p>
        </form>
      </div>
      <div class="tile dark span2 reveal">
        <p class="kick neon">${esc(h.ruleKick)}</p>
        <p class="display rule">${h.rule.map((r, i) => i === 2 ? `<span class="neon">${esc(r)}</span>` : esc(r)).join('<br>')}</p>
        <p class="small">${esc(h.ruleP)}</p>
      </div>
      <div class="tile glass span2 reveal">
        <p class="kick">${esc(h.hs)}</p><p class="display big-num">&lt;30</p><p class="small ink2">${esc(h.hsP)}</p>
      </div>
      <div class="tile glass span4 reveal">
        <p class="kick">${esc(h.ladderKick)}</p>
        <ol class="ladder">${h.ladder.map((s, i) => `<li${i === 3 ? ' class="last"' : ''}><span class="kick">0${i + 1}</span><b>${esc(s[0])}</b><em>${esc(s[1])}</em></li>`).join('')}</ol>
      </div>
    </div>
  </div>
</section>

<section id="daily" class="band">
  <div class="wrap daily-grid">
    <div data-par="0.8">
      <p class="kick reveal">${esc(h.s2kick)}</p>
      <h2 class="display reveal">${esc(nm(day.n, en))}</h2>
      <p class="muted date reveal">${esc(day.date)}</p>
    </div>
    <div class="reveal">
      <p class="lead">${esc(en ? day.en : day.pl)}</p>
      ${(day.src || []).length ? `<p class="kick srcs">${esc(t.srcs)}</p><ul class="srcs-list">${day.src.map(s => `<li><a href="${esc(s[1])}" rel="nofollow noopener" target="_blank">${esc(s[0])}</a></li>`).join('')}</ul>` : ''}
    </div>
  </div>
</section>

<section id="catalog">
  <div class="wrap cat-grid">
    <div data-par="1">
      <p class="kick reveal">${esc(h.s3kick)}</p>
      <h2 class="display reveal">${esc(h.s3h)}</h2>
      <p class="lead reveal">${esc(h.s3p)}</p>
      <p class="reveal"><a class="more" href="catalog.html">${esc(h.all)}${ARROW}</a></p>
    </div>
    <div class="cards" data-par="-0.6">${FEATURED.map(e => cardRow(e, en, '')).join('')}</div>
  </div>
</section>

<section id="faq" class="band">
  <div class="wrap">
    <p class="kick reveal">${esc(h.s4kick)}</p>
    <div class="faq">${faq.map(q => `<details class="reveal"><summary>${esc(en ? q[0].en : q[0].pl)}</summary><p>${esc(en ? q[1].en : q[1].pl)}</p></details>`).join('')}</div>
    <p class="reveal"><a class="more" href="faq.html">${esc(t.nav.faq)}${ARROW}</a></p>
  </div>
</section>

<section id="about" class="dark-sec">
  <div class="wrap">
    <p class="kick neon reveal">${esc(h.s5kick)}</p>
    <h2 class="display huge reveal">${esc(h.s5h)}</h2>
    <div class="cols">${h.not.map(p => `<p class="reveal">${esc(p)}</p>`).join('')}</div>
  </div>
  <i class="glow" aria-hidden="true"></i>
</section>`;

  return layout({
    lang: L, here: 'index.html', twin: '', body,
    title: en ? 'PepSafe — peptide facts, no sales' : 'PepSafe — fakty o peptydach, bez sprzedaży', desc: h.lede
  });
}

// ── catalog ───────────────────────────────────────────────────────────────────
function catalog(L) {
  const en = L === 'en', t = W[L];
  const statuses = [...new Set(D.map(e => e.s))];
  const sorted = D.slice().sort((a, b) => nm(a.n, en).localeCompare(nm(b.n, en), en ? 'en' : 'pl'));
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.catalog)}</p>
    <h1 class="display reveal">${en ? 'Every entry, with its status.' : 'Każdy wpis, razem ze statusem.'}</h1>
    <p class="lede reveal">${D.length} ${esc(t.entries)} — ${en ? 'what each one is, what the research shows, and whether any regulator approved it.' : 'czym jest, co pokazują badania i czy jakikolwiek regulator ją zatwierdził.'}</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="filters reveal">
      <label class="search"><span class="sr">${esc(t.search)}</span>
        <input id="q" type="search" placeholder="${esc(t.search)}" autocomplete="off"></label>
      <div class="chips" id="chips">
        <button class="chip on" data-s="">${esc(t.filterAll)} <span class="num">${D.length}</span></button>
        ${statuses.map(s => `<button class="chip" data-s="${s}">${esc(en ? (ST_EN[s] || s) : (ST[s] || s))} <span class="num">${D.filter(e => e.s === s).length}</span></button>`).join('')}
      </div>
    </div>
    <p id="nohit" class="muted" hidden>${esc(t.noHit)}</p>
    <div class="grid-cards" id="list">
      ${sorted.map(e => `<div class="entry tile" data-s="${e.s}" data-n="${esc((nm(e.n, en) + ' ' + (e.a || '') + ' ' + e.n).toLowerCase())}">
        <a class="entry-link" href="p/${key(e)}.html">
          <span class="pill ${toneOf(e)}">${esc(statusOf(e, en))}</span>
          <b>${esc(nm(e.n, en))}</b>
          <em>${esc(en && EN[e.n] ? EN[e.n][1] : e.c)}</em>
        </a>
        <button class="star" data-key="${key(e)}" aria-label="${esc(t.save)}" title="${esc(t.save)}">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 2.6l2.2 4.5 5 .7-3.6 3.5.9 4.9L10 14l-4.5 2.2.9-4.9L2.8 7.8l5-.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
      </div>`).join('')}
    </div>
  </div>
</section>`;
  return layout({
    lang: L, here: 'catalog.html', twin: 'catalog.html', body,
    title: (en ? `Catalog of ${D.length} peptides` : `Katalog ${D.length} peptydów`) + ' | PepSafe',
    desc: en ? `All ${D.length} entries with legal status, mechanism and evidence.` : `Wszystkie ${D.length} wpisów ze statusem prawnym, mechanizmem i siłą dowodów.`
  });
}

// ── substance card ────────────────────────────────────────────────────────────
function card(e, L) {
  const en = L === 'en', t = W[L], tr = EN[e.n] || [];
  const name = nm(e.n, en);
  const d = en ? (tr[2] || e.d) : e.d, m = en ? (tr[3] || e.m) : e.m, u = en ? (tr[4] || e.u) : e.u;
  const ev = en ? (tr[5] || e.ev) : e.ev, w = en ? (tr[6] || e.w) : e.w;
  const f = famOf(e), wa = wadaOf(e), src = (SRC || {})[e.n] || [];
  const sibs = f ? f.m.filter(x => x !== e.n).slice(0, 6).map(x => D.find(y => y.n === x)).filter(Boolean) : [];
  const sec = (h, b) => b ? `<section class="blk reveal"><h2 class="kick">${esc(h)}</h2><p>${esc(b)}</p></section>` : '';

  const body = `
<article class="card-page">
  <div class="wrap">
    <p class="crumbs reveal"><a href="../catalog.html">${esc(t.back)}</a> › <span>${esc(name)}</span></p>
    <div class="card-head">
      <div>
        <h1 class="display reveal">${esc(name)}</h1>
        ${e.a ? `<p class="sub reveal">${esc(e.a)}</p>` : ''}
        <p class="pills reveal">
          <button class="star solo" data-key="${key(e)}" aria-label="${esc(t.save)}" title="${esc(t.save)}">
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M10 2.6l2.2 4.5 5 .7-3.6 3.5.9 4.9L10 14l-4.5 2.2.9-4.9L2.8 7.8l5-.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <span>${esc(t.save)}</span>
          </button>
          <span class="pill ${toneOf(e)}">${esc(statusOf(e, en))}</span>
          <span class="pill neutral">${esc(en && tr[1] ? tr[1] : e.c)}</span>
          ${wa ? `<span class="pill warn">${esc(t.wada)}: ${esc(wa[0])}</span>` : ''}
        </p>
      </div>
      ${f ? `<aside class="group-box tile glass reveal">
        <p class="kick">${esc(t.group)}</p>
        <p class="gname">${esc(en ? ((FAMS_EN[f.id] || [])[0] || f.lab) : f.lab)}</p>
        <p class="small ink2">${esc(en ? ((FAMS_EN[f.id] || [])[1] || f.t) : f.t)}</p>
        <a class="more" href="../groups.html#${f.id}">${esc(t.group)}${ARROW}</a>
      </aside>` : ''}
    </div>

    ${sec(t.what, d)}${sec(t.how, m)}${sec(t.use, u)}${sec(t.ev, ev)}
    ${w ? `<section class="blk note reveal"><h2 class="kick">${esc(t.care)}</h2><p>${esc(w)}</p></section>` : ''}
    ${wa ? `<section class="blk reveal"><h2 class="kick">${esc(t.wada)}</h2><p>${en
      ? esc(t.listedWada + ' ' + wa[0] + (wa[1] === 'always' ? t.always : '') + '.')
      : esc(wa[2] || (t.listedWada + ' ' + wa[0] + '.'))} <a href="${WADA_URL}" rel="nofollow noopener" target="_blank">WADA</a></p></section>` : ''}
    ${e.q ? `<section class="blk reveal"><h2 class="kick">${esc(t.seq)}</h2><p class="seq">${esc(e.q)}</p></section>` : ''}
    ${src.length ? `<section class="blk reveal"><h2 class="kick">${esc(t.srcs)}</h2><ul class="srcs-list">${src.map(s => `<li><a href="${esc(s[1])}" rel="nofollow noopener" target="_blank">${esc(s[0])}</a></li>`).join('')}</ul></section>` : ''}
    ${sibs.length ? `<section class="blk reveal"><h2 class="kick">${esc(t.related)}</h2><div class="cards">${sibs.map(s => cardRow(s, en, '')).join('')}</div></section>` : ''}
  </div>
</article>`;
  return layout({
    lang: L, here: 'catalog.html', depth: 1, twin: 'p/' + key(e) + '.html', body,
    title: `${name} — ${statusOf(e, en)} | PepSafe`, desc: clip(`${name} — ${statusOf(e, en)}. ${d}`, 155)
  });
}

// ── groups ────────────────────────────────────────────────────────────────────
function groups(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.groups)}</p>
    <h1 class="display reveal">${en ? 'Substances that share a target.' : 'Substancje o wspólnym celu.'}</h1>
    <p class="lede reveal">${en ? 'Stacking inside one group repeats a mechanism instead of adding a second one. Each group says what it shares and why that matters.' : 'Łączenie wewnątrz jednej grupy powtarza mechanizm, zamiast dodawać drugi. Przy każdej grupie jest napisane, co ją łączy i dlaczego to ma znaczenie.'}</p>
  </div>
</section>
<section><div class="wrap groups-list">
  ${GROUPS.map(g => `<article class="tile glass reveal" id="${g.id}">
    <p class="kick">${esc(g[L].rule)}</p>
    <h2 class="gtitle">${esc(g[L].label)}</h2>
    <p class="lead">${esc(g[L].why)}</p>
    <div class="cards">${g.members.map(x => D.find(y => y.n === x)).filter(Boolean).map(s => cardRow(s, en, '')).join('')}</div>
  </article>`).join('')}
</div></section>`;
  return layout({
    lang: L, here: 'groups.html', twin: 'groups.html', body,
    title: (en ? 'Groups that overlap' : 'Grupy, które się dublują') + ' | PepSafe',
    desc: en ? 'Groups of substances acting on the same target, and why combining inside a group adds risk without benefit.' : 'Grupy substancji działających na ten sam cel i dlaczego łączenie w obrębie grupy dokłada ryzyka bez korzyści.'
  });
}

// ── questions ─────────────────────────────────────────────────────────────────
function faqPage(L) {
  const en = L === 'en', t = W[L];
  const faq = FAQ.filter(x => Array.isArray(x) && x[0] && x[1]);
  const qa = (QA || []).filter(x => x && x.q && x.a);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.faq)}</p>
    <h1 class="display reveal">${en ? 'Questions, answered plainly.' : 'Pytania i proste odpowiedzi.'}</h1>
    <p class="lede reveal">${faq.length + qa.length} ${en ? 'questions about peptides, answered from the research — and about what we will not answer.' : 'pytań o peptydy, z odpowiedziami opartymi na badaniach — i o tym, na co nie odpowiadamy.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="faq wide">
    ${faq.map(q => `<details class="reveal"><summary>${esc(en ? q[0].en : q[0].pl)}</summary><p>${esc(en ? q[1].en : q[1].pl)}</p></details>`).join('')}
    ${qa.map(q => `<details class="reveal"><summary>${esc(q.q[en ? 1 : 0])}</summary><p>${esc(q.a[en ? 1 : 0])}</p></details>`).join('')}
  </div>
</div></section>`;
  return layout({
    lang: L, here: 'faq.html', twin: 'faq.html', body,
    title: (en ? 'Questions and answers' : 'Pytania i odpowiedzi') + ' | PepSafe',
    desc: en ? 'What peptides are, why most are injected, what “research only” means, and what we will not answer.' : 'Czym są peptydy, czemu większość się wstrzykuje, co znaczy „tylko do badań” i na co nie odpowiadamy.'
  });
}

// ── warnings ──────────────────────────────────────────────────────────────────
function alerts(L) {
  const en = L === 'en', t = W[L], i = en ? 'en' : 'pl';
  const al = (ALERTS || []).filter(a => a && a[i]);
  const tr = (TRICKS || []).filter(x => x && x.t && x.d);
  const my = (MYTHS || []).filter(x => Array.isArray(x) && x.length >= 4);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.alerts)}</p>
    <h1 class="display reveal">${en ? 'What regulators said. What marketing says.' : 'Co mówią urzędy. Co mówi marketing.'}</h1>
    <p class="lede reveal">${en ? 'Official warnings, the selling tricks that come up again and again, and claims that do not survive contact with the research.' : 'Oficjalne ostrzeżenia, triki sprzedażowe, które wracają w kółko, i twierdzenia, które nie wytrzymują zderzenia z badaniami.'}</p>
  </div>
</section>
${al.length ? `<section><div class="wrap">
  <p class="kick reveal">${en ? 'Regulators' : 'Urzędy'}</p>
  <div class="stack">${al.map(a => `<article class="tile glass reveal"><h2 class="gtitle">${esc(a[i][0])}</h2><p class="lead">${esc(a[i][1])}</p></article>`).join('')}</div>
</div></section>` : ''}
${tr.length ? `<section class="band"><div class="wrap">
  <p class="kick reveal">${en ? 'Selling tricks' : 'Triki sprzedażowe'}</p>
  <div class="grid-cards">${tr.map(x => `<article class="tile glass reveal"><h3 class="gtitle sm">${esc(x.t[en ? 1 : 0])}</h3><p class="small ink2">${esc(x.d[en ? 1 : 0])}</p></article>`).join('')}</div>
</div></section>` : ''}
${my.length ? `<section><div class="wrap">
  <p class="kick reveal">${en ? 'Myth or fact' : 'Mit czy fakt'}</p>
  <div class="stack">${my.map(x => `<article class="tile glass reveal"><p class="verdict-tag ${x[2] === 'f' ? 'bad' : 'good'}">${x[2] === 'f' ? (en ? 'Myth' : 'Mit') : (en ? 'Fact' : 'Fakt')}</p><h3 class="gtitle sm">${esc(x[en ? 1 : 0])}</h3><p class="small ink2">${esc(x[en ? 4 : 3] || x[3])}</p></article>`).join('')}</div>
</div></section>` : ''}`;
  return layout({
    lang: L, here: 'alerts.html', twin: 'alerts.html', body,
    title: (en ? 'Warnings and marketing tricks' : 'Ostrzeżenia i triki marketingu') + ' | PepSafe',
    desc: en ? 'Official warnings from regulators, recurring selling tricks, and myths checked against the research.' : 'Oficjalne ostrzeżenia urzędów, powtarzalne triki sprzedażowe i mity zderzone z badaniami.'
  });
}

// ── about ─────────────────────────────────────────────────────────────────────
function about(L) {
  const en = L === 'en', t = W[L], h = H[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.about)}</p>
    <h1 class="display reveal">${esc(h.s5h)}</h1>
    <p class="lede reveal">${esc(h.lede)}</p>
  </div>
</section>
<section><div class="wrap cols3">${h.not.map(p => `<p class="reveal lead">${esc(p)}</p>`).join('')}</div></section>
<section class="band"><div class="wrap">
  <p class="kick reveal">${en ? 'How the catalog is built' : 'Jak powstaje katalog'}</p>
  <div class="stack">
    <article class="tile glass reveal"><h2 class="gtitle sm">${en ? 'Status first' : 'Najpierw status'}</h2>
      <p class="small ink2">${en ? 'Every entry starts with whether a regulator approved it, and for what. Everything else follows from that.' : 'Każdy wpis zaczyna się od tego, czy i do czego regulator go zatwierdził. Reszta wynika z tego.'}</p></article>
    <article class="tile glass reveal"><h2 class="gtitle sm">${en ? 'Sources, not adjectives' : 'Źródła, nie przymiotniki'}</h2>
      <p class="small ink2">${en ? 'Claims link to labels, reviews and trial registries. Where evidence is thin, the entry says so.' : 'Twierdzenia linkują do etykiet, przeglądów i rejestrów badań. Gdzie dowodów jest mało, wpis mówi to wprost.'}</p></article>
    <article class="tile glass reveal"><h2 class="gtitle sm">${en ? 'No doses from strangers' : 'Bez dawek od obcych'}</h2>
      <p class="small ink2">${en ? 'Doses appear only for approved medicines, copied from the label, as information rather than advice.' : 'Dawki pojawiają się tylko przy zatwierdzonych lekach, przepisane z etykiety, jako informacja, nie porada.'}</p></article>
  </div>
</div></section>`;
  return layout({
    lang: L, here: 'about.html', twin: 'about.html', body,
    title: (en ? 'About the project' : 'O projekcie') + ' | PepSafe', desc: h.lede
  });
}


// ── dosing: copied from the catalog exactly as it stands, with its own caveats ─
function dosing(L) {
  const en = L === 'en', t = W[L], i = en ? 1 : 0;
  const rows = (DOSE || []);
  const byK = {};
  rows.forEach(r => { (byK[r.k] = byK[r.k] || []).push(r); });
  const note = en
    ? 'Doses below are copied from approved labels, for approved medicines only. They are information, not a recommendation, and they have not been reviewed by a pharmacist. Check every number against the current label, and never apply a label dose to a product bought outside a pharmacy.'
    : 'Poniższe dawki są przepisane z zatwierdzonych etykiet i dotyczą wyłącznie zarejestrowanych leków. To informacja, nie zalecenie, i nie była sprawdzana przez farmaceutę. Każdą liczbę zweryfikuj w aktualnej etykiecie i nigdy nie przenoś dawki z etykiety na produkt kupiony poza apteką.';

  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.dosingNav)}</p>
    <h1 class="display reveal">${en ? 'Label doses, approved medicines only.' : 'Dawki z etykiet, tylko leki zatwierdzone.'}</h1>
    <p class="lede reveal">${rows.length} ${en ? 'entries from official labels, across' : 'pozycji z oficjalnych etykiet, dla'} ${Object.keys(byK).length} ${en ? 'substances.' : 'substancji.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="blk note reveal"><h2 class="kick">${en ? 'Read this first' : 'Przeczytaj najpierw'}</h2><p>${esc(note)}</p></div>
  <div class="stack">
    ${rows.map(r => `<article class="tile glass reveal">
      <p class="kick">${esc(nm(r.k, en))}</p>
      <h2 class="gtitle">${esc(r.d)}</h2>
      ${r.i ? `<p class="lead"><b>${en ? 'Indication' : 'Wskazanie'}:</b> ${esc(r.i[i])}</p>` : ''}
      <dl class="dose">
        ${r.p ? `<div><dt>${en ? 'Start' : 'Początek'}</dt><dd>${esc(r.p[i])}</dd></div>` : ''}
        ${r.m ? `<div><dt>${en ? 'Maintenance' : 'Podtrzymanie'}</dt><dd>${esc(r.m[i])}</dd></div>` : ''}
        ${r.x ? `<div><dt>${en ? 'Notes' : 'Uwagi'}</dt><dd>${esc(r.x[i])}</dd></div>` : ''}
      </dl>
      <p class="small muted">${r.r ? (en ? 'Label revision: ' : 'Wersja etykiety: ') + esc(r.r) : ''}${r.s ? ` · <a href="${esc(r.s)}" rel="nofollow noopener" target="_blank">${esc(t.srcs)}</a>` : ''}</p>
    </article>`).join('')}
  </div>
</div></section>`;
  return layout({
    lang: L, here: 'dosing.html', twin: 'dosing.html', body,
    title: (en ? 'Dosing from approved labels' : 'Dawkowanie z zatwierdzonych etykiet') + ' | PepSafe',
    desc: en ? `Label doses for ${Object.keys(byK).length} approved medicines, copied from official labels. Information, not advice.` : `Dawki z etykiet dla ${Object.keys(byK).length} zatwierdzonych leków, przepisane z oficjalnych źródeł. Informacja, nie porada.`
  });
}

// ── compare, symptoms, saved: three tools over one shared dataset ─────────────
function compare(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.compareNav)}</p>
    <h1 class="display reveal">${en ? 'Side by side, same questions.' : 'Obok siebie, te same pytania.'}</h1>
    <p class="lede reveal">${en ? 'Pick up to three substances and read their status, group, evidence and warnings in one view. If two share a group, the page says so.' : 'Wybierz do trzech substancji i przeczytaj ich status, grupę, dowody i ostrzeżenia w jednym widoku. Jeśli dwie należą do tej samej grupy, strona to powie.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="filters reveal">
    <label class="search"><span class="sr">${esc(t.pick)}</span>
      <input id="cmpQ" type="search" placeholder="${esc(t.pick)}" autocomplete="off" list="cmpList"></label>
    <datalist id="cmpList"></datalist>
    <div class="chips"><button class="chip" id="cmpClear">${esc(t.clear)}</button></div>
  </div>
  <div id="cmpWarn"></div>
  <div class="grid-cards" id="cmpOut"></div>
  <p class="muted" id="cmpEmpty">${en ? 'Nothing picked yet. Start typing a name above.' : 'Nic nie wybrano. Zacznij wpisywać nazwę powyżej.'}</p>
</div></section>`;
  return layout({
    lang: L, here: 'compare.html', twin: 'compare.html', body,
    title: (en ? 'Compare substances' : 'Porównaj substancje') + ' | PepSafe',
    desc: en ? 'Put up to three peptides side by side: status, group, evidence and warnings.' : 'Zestaw do trzech peptydów obok siebie: status, grupa, dowody i ostrzeżenia.'
  });
}

function symptoms(L) {
  const en = L === 'en', t = W[L];
  const texts = D.map(e => searchText(e, en));
  const words = ((en ? SY_EN : SY_PL) || [])
    .map(w => ({ w, n: texts.filter(x => x.indexOf(w.toLowerCase()) > -1).length }))
    .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.symptomsNav)}</p>
    <h1 class="display reveal">${en ? 'Start from the symptom.' : 'Zacznij od objawu.'}</h1>
    <p class="lede reveal">${en ? 'Type a symptom and see which entries mention it in their safety or effect sections. This is not a diagnosis and not proof that a substance caused anything — it is a way into the catalog.' : 'Wpisz objaw, a pokażemy wpisy, przy których jest on opisany w sekcji o bezpieczeństwie lub działaniu. To nie jest diagnoza ani dowód, że substancja coś wywołała — to sposób wejścia do katalogu.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="filters reveal">
    <label class="search"><span class="sr">${en ? 'Symptom' : 'Objaw'}</span>
      <input id="syQ" type="search" placeholder="${en ? 'Symptom' : 'Objaw'}" autocomplete="off"></label>
    <div class="chips" id="syChips">${words.slice(0, 12).map(x => `<button class="chip" data-sy="${esc(x.w)}">${esc(x.w)} <span class="num">${x.n}</span></button>`).join('')}</div>
  </div>
  <p class="muted" id="syHint">${en ? 'Type at least 3 characters or click a suggestion.' : 'Wpisz co najmniej 3 znaki albo kliknij podpowiedź.'}</p>
  <div class="grid-cards" id="syOut"></div>
</div></section>`;
  return layout({
    lang: L, here: 'symptoms.html', twin: 'symptoms.html', body,
    title: (en ? 'Search by symptom' : 'Szukaj od objawu') + ' | PepSafe',
    desc: en ? 'Find catalog entries that mention a given symptom in their safety or effect sections.' : 'Znajdź wpisy katalogu, przy których dany objaw jest opisany w sekcji o bezpieczeństwie lub działaniu.'
  });
}

function savedPage(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.savedNav)}</p>
    <h1 class="display reveal">${en ? 'Your shortlist.' : 'Twoja lista.'}</h1>
    <p class="lede reveal">${en ? 'Entries you saved with the star. Kept in this browser only — nothing is sent anywhere, and clearing site data clears the list.' : 'Wpisy zapisane gwiazdką. Trzymane tylko w tej przeglądarce — nic nigdzie nie jest wysyłane, a wyczyszczenie danych strony kasuje listę.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="grid-cards" id="savedOut"></div>
  <p class="muted" id="savedEmpty">${en ? 'Nothing saved yet. Open any entry and press the star.' : 'Nic jeszcze nie zapisano. Otwórz dowolny wpis i naciśnij gwiazdkę.'}</p>
</div></section>`;
  return layout({
    lang: L, here: 'saved.html', twin: 'saved.html', body,
    title: (en ? 'Saved entries' : 'Zapisane wpisy') + ' | PepSafe',
    desc: en ? 'Entries you saved, kept in this browser only.' : 'Zapisane wpisy, trzymane tylko w tej przeglądarce.'
  });
}

// one compact dataset per language, shared by compare, symptoms and the saved list
function dataFile(L) {
  const en = L === 'en';
  const rows = D.map(e => {
    const tr = EN[e.n] || [], f = famOf(e);
    return {
      s: key(e), n: nm(e.n, en), c: en && tr[1] ? tr[1] : e.c, st: statusOf(e, en), tone: toneOf(e),
      g: f ? f.id : '', gl: f ? (en ? ((FAMS_EN[f.id] || [])[0] || f.lab) : f.lab) : '',
      ev: clip(en ? (tr[5] || e.ev) : e.ev, 220), w: clip(en ? (tr[6] || e.w) : e.w, 240),
      t: searchText(e, en)
    };
  });
  return 'window.PEP = ' + JSON.stringify({ lang: L, rows }) + ';\n';
}

// ── write ─────────────────────────────────────────────────────────────────────
let n = 0;
for (const L of LANGS) {
  const dir = path.join(out, L);
  fs.mkdirSync(path.join(dir, 'p'), { recursive: true });
  const pages = {
    'index.html': home(L), 'catalog.html': catalog(L), 'dosing.html': dosing(L), 'groups.html': groups(L),
    'compare.html': compare(L), 'symptoms.html': symptoms(L), 'saved.html': savedPage(L),
    'faq.html': faqPage(L), 'alerts.html': alerts(L), 'about.html': about(L)
  };
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(out, 'assets', 'dane-' + L + '.js'), dataFile(L));
  for (const [f, html] of Object.entries(pages)) { fs.writeFileSync(path.join(dir, f), html); n++; }
  for (const e of D) { fs.writeFileSync(path.join(dir, 'p', key(e) + '.html'), card(e, L)); n++; }
}
console.log(`zbudowano ${n} stron: ${LANGS.length} języki × (10 + ${D.length} kart)`);
console.log(`dawkowanie: ${(DOSE || []).length} pozycji, objawy: ${((SY_PL||[]).length)} hasel`);
console.log(`grupy: ${GROUPS.length}, peptyd dnia: ${DAILY[0].n} (${DAILY[0].date}), ostrzezenia: ${(ALERTS || []).length}, triki: ${(TRICKS || []).length}, mity: ${(MYTHS || []).length}`);
