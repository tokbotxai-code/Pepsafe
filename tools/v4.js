// Builds the v4 homepage from the real catalog: podglad/v4/{en,pl}/index.html
// Everything a reader needs is written into the HTML. The stylesheet handles the look,
// and assets/ruch.js only adds motion on top — remove the script and the page still works.
// Usage: node tools/v4.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const out = path.join(root, 'podglad', 'v4');
const lines = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('\n');
const at = re => lines.findIndex(l => re.test(l));
const until = i => i + lines.slice(i).findIndex((l, n) => n > 0 && /^(\];|\};)/.test(l)) + 1;
const slice = (a, b) => lines.slice(a, b).join('\n');

// ── pull the data blocks out of the app and run them in a sandbox ──────────────
const box = { console, window: {}, document: {} }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w,q,wa){D.push({n,a,s,c,cat,f,d,m,u,ev,w,q:q||"",wa:!!wa});}', box);
const dataStart = at(/^var ST=\{A:/), dataEnd = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
vm.runInContext(slice(dataStart, dataEnd).replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
for (const re of [/^var FAMS=/, /^var DAILY=\[/, /^var FAQ=\[/]) { const i = at(re); vm.runInContext(slice(i, until(i)), box); }
const { D, EN, ST, ST_EN, CAT_EN, FAMS, FAMS_EN, DAILY, FAQ } = box;

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const count = s => D.filter(e => e.s === s).length;
const STATS = [
  { k: 'approved', n: count('A') }, { k: 'unapproved', n: count('U') },
  { k: 'trials', n: count('P') }, { k: 'sold', n: 0 }
];

// groups that act on the same target — the overlap checker runs on these
const GROUPS = FAMS.filter(f => (f.m || []).length > 1).map(f => ({
  id: f.id, n: f.m.length,
  pl: { label: f.lab, rule: f.t, why: f.x },
  en: { label: (FAMS_EN[f.id] || [])[0] || f.lab, rule: (FAMS_EN[f.id] || [])[1] || f.t, why: (FAMS_EN[f.id] || [])[2] || f.x }
}));

const name = (n, en) => en && EN[n] ? EN[n][0] : n;
const FEATURED = ['Semaglutyd', 'Tesamorelina', 'Retatrutyd', 'BPC-157', 'Melanotan II', 'GHK-Cu']
  .map(n => D.find(e => e.n === n)).filter(Boolean);

const T = {
  pl: {
    lang: 'pl', other: 'en', otherHref: '../en/',
    title: 'PepSafe — fakty o peptydach, bez sprzedaży',
    desc: `Katalog ${D.length} peptydów i substancji pokrewnych: status prawny, co pokazują badania i które grupy działają na ten sam receptor. Treść edukacyjna, nic nie jest na sprzedaż.`,
    nav: { overlap: 'Sprawdzarka', catalog: 'Katalog', daily: 'Peptyd dnia', faq: 'Pytania', about: 'O projekcie' },
    cta: 'Otwórz katalog',
    badge: 'Niezależnie · niekomercyjnie',
    h1: ['Krótkie łańcuchy.', 'Długie konsekwencje.', 'Najpierw dowody.'],
    lede: `Przewodnik po ${D.length} peptydach i substancjach pokrewnych: czym każda z nich jest, co naprawdę pokazują badania, czy jakikolwiek regulator ją zatwierdził i które grupy działają na ten sam receptor. Nic tu nie jest na sprzedaż, a dawek dla substancji niezatwierdzonych nie podajemy nigdy.`,
    b1: 'Sprawdź dublowanie', b2: `Zobacz wszystkie ${D.length}`,
    railTitle: 'Katalog według statusu',
    stats: { approved: 'Zatwierdzone leki', unapproved: 'Niezatwierdzone', trials: 'W badaniach klinicznych', sold: 'Sprzedanych produktów' },
    s1kick: '01 — Sprawdzarka dublowania', s1h: 'Dwie nazwy, jeden receptor.',
    s1p: 'Najczęstszy błąd w internecie to łączenie substancji działających na ten sam cel. Wybierz dwie grupy i zobacz, czy się pokrywają — razem z powodem, nie samym czerwonym światłem.',
    selA: 'Grupa A', selB: 'Grupa B',
    same: 'Ta sama grupa — nie łączyć', diff: 'Różne grupy — różne cele',
    diffWhy: 'Działają na inne cele, więc nie ma tu dublowania. To nie znaczy, że są bezpieczne razem: o interakcjach poza wspólnym receptorem decyduje lekarz, nie tabelka.',
    inCat: 'wpisów w tej grupie w katalogu',
    ruleKick: 'Zasada', rule: ['Ten sam receptor,', 'brak dodatkowej korzyści,', 'większe ryzyko.'],
    ruleP: 'Podwojenie mechanizmu rzadko podwaja działanie. Niezawodnie podwaja działania niepożądane.',
    s2kick: '02 — Peptyd dnia', s3kick: '03 — Katalog', s3h: 'Najpierw status, potem historia.',
    s3p: 'Każdy wpis zaczyna się od statusu prawnego, potem mówi, co pokazują badania, a na końcu na co uważać. Źródła są podlinkowane. Gdzie dowodów jest mało, piszemy to wprost, zamiast zasypywać lukę przymiotnikami.',
    all: `Wszystkie ${D.length} wpisów`,
    s4kick: '04 — Pytania', s5kick: '05 — Czym to nie jest',
    s5h: 'Bez sklepu. Bez dawek od obcych. Bez obietnic.',
    foot: 'PepSafe — fakty o peptydach, bez sprzedaży. Treść edukacyjna, nie porada medyczna.',
    motionOff: 'Zatrzymaj ruch', motionOn: 'Włącz ruch',
    src: 'Źródła'
  },
  en: {
    lang: 'en', other: 'pl', otherHref: '../pl/',
    title: 'PepSafe — peptide facts, no sales',
    desc: `A catalog of ${D.length} peptides and related substances: legal status, what the research shows, and which groups act on the same receptor. Educational, nothing is for sale.`,
    nav: { overlap: 'Overlap', catalog: 'Catalog', daily: 'Peptide of the day', faq: 'Questions', about: 'About' },
    cta: 'Open catalog',
    badge: 'Independent · non-commercial',
    h1: ['Short chains.', 'Long consequences.', 'Evidence first.'],
    lede: `A reference for ${D.length} peptides and related substances: what each one is, what the research actually shows, whether any regulator approved it, and which groups act on the same receptor. Nothing here is for sale, and we never publish doses for substances that are not approved medicines.`,
    b1: 'Check an overlap', b2: `Browse all ${D.length}`,
    railTitle: 'Catalog, by status',
    stats: { approved: 'Approved medicines', unapproved: 'Unapproved', trials: 'In clinical trials', sold: 'Products sold' },
    s1kick: '01 — Overlap checker', s1h: 'Two names, one receptor.',
    s1p: 'The most common mistake online is stacking substances that act on the same target. Pick two groups and see whether they collide — with the reason, not just a red light.',
    selA: 'Group A', selB: 'Group B',
    same: 'Same group — do not combine', diff: 'Different groups — different targets',
    diffWhy: 'These act on different targets, so there is no duplication between them. That is not the same as being safe together: interactions outside a shared receptor are a question for a doctor, not for a chart.',
    inCat: 'entries in this group',
    ruleKick: 'The rule', rule: ['Same receptor,', 'no added benefit,', 'added risk.'],
    ruleP: 'Doubling a mechanism rarely doubles the effect. It reliably doubles the side effects.',
    s2kick: '02 — Peptide of the day', s3kick: '03 — Catalog', s3h: 'Status before story.',
    s3p: 'Every entry opens with its legal status, then what the research shows, then what to watch for. Sources are linked. Where the evidence is thin, we say so plainly instead of filling the gap with adjectives.',
    all: `All ${D.length} entries`,
    s4kick: '04 — Questions', s5kick: '05 — What this is not',
    s5h: 'No shop. No doses from strangers. No promises.',
    foot: 'PepSafe — peptide facts, no sales. Educational content, not medical advice.',
    motionOff: 'Stop motion', motionOn: 'Start motion',
    src: 'Sources'
  }
};

const NOT = {
  pl: ['Dawki podajemy wyłącznie dla zatwierdzonych leków, prosto z etykiety, i tylko jako informację — nigdy jako zalecenie.',
    'Dla substancji niezatwierdzonych nie ma dawki do podania. Jeśli bezpieczeństwo u ludzi jest nieustalone, to jest wynik, a nie luka do wypełnienia.',
    'Treść edukacyjna, nie porada medyczna. Decyzje o leczeniu należą do lekarza, który zna Twój przypadek.'],
  en: ['We publish doses only for approved medicines, straight from the label, and only as information — never as a recommendation.',
    'For unapproved substances there is no dose to give. Where human safety is unestablished, that is the finding, not a gap to fill.',
    'Educational content, not medical advice. Decisions about treatment belong with a doctor who knows your case.']
};

function page(L) {
  const t = T[L], en = L === 'en';
  const day = DAILY[0];
  const faq = FAQ.filter(x => Array.isArray(x) && x[0] && x[1]).slice(0, 4);

  const stat = s => `<div class="rail-row reveal">
      <dt>${esc(t.stats[s.k])}</dt>
      <dd class="num"><span data-count="${s.n}">${s.n}</span>${s.k === 'sold' ? '<i class="dot" aria-hidden="true"></i>' : ''}</dd>
    </div>`;

  const opt = (g, i, sel) => `<option value="${g.id}"${i === sel ? ' selected' : ''}>${esc(g[L].label)}</option>`;

  // every group's answer is written into the page, so the checker works before any script runs
  const answers = GROUPS.map(g => `<p class="answer" id="a-${g.id}" hidden>
      <b>${esc(g[L].rule)}</b> ${esc(g[L].why)} <span class="muted">${g.n} ${esc(t.inCat)}.</span></p>`).join('\n');

  const cards = FEATURED.map(e => {
    const st = en ? (ST_EN[e.s] || e.s) : (ST[e.s] || e.s);
    const cls = e.s === 'A' ? 'ok' : e.s === 'P' ? 'mid' : 'warn';
    return `<a class="card tile reveal" href="/p/${slug(name(e.n, true))}${en ? '' : '.pl'}.html">
      <span><b>${esc(name(e.n, en))}</b><em>${esc(en && EN[e.n] ? EN[e.n][1] : e.c)}</em></span>
      <span class="pill ${cls}">${esc(st)}</span></a>`;
  }).join('\n');

  return `<!doctype html>
<html lang="${t.lang}" style="color-scheme:light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc)}">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/site.css">
</head>
<body>
<a class="skip" href="#main">${en ? 'Skip to content' : 'Przejdź do treści'}</a>

<header class="bar">
  <nav class="wrap">
    <a class="brand" href="#top"><span class="logo"><i></i></span>PepSafe</a>
    <ul class="links">
      <li><a href="#overlap">${esc(t.nav.overlap)}</a></li>
      <li><a href="#catalog">${esc(t.nav.catalog)}</a></li>
      <li><a href="#daily">${esc(t.nav.daily)}</a></li>
      <li><a href="#faq">${esc(t.nav.faq)}</a></li>
    </ul>
    <div class="tools">
      <a class="lang" href="${t.otherHref}">${t.other.toUpperCase()}</a>
      <a class="btn" href="#catalog">${esc(t.cta)}</a>
    </div>
  </nav>
</header>

<main id="main">
<section id="top" class="hero paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap hero-grid">
    <div>
      <p class="badge reveal">${esc(t.badge)}<i class="dot" aria-hidden="true"></i></p>
      <h1 class="display">
        <span class="reveal">${esc(t.h1[0])}</span>
        <span class="reveal dim">${esc(t.h1[1])}</span>
        <span class="reveal">${esc(t.h1[2])}</span>
      </h1>
      <p class="lede reveal">${esc(t.lede)}</p>
      <p class="actions reveal">
        <a class="btn big" href="#overlap">${esc(t.b1)}<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="var(--neon)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        <a class="btn ghost big" href="#catalog">${esc(t.b2)}</a>
      </p>
    </div>
    <aside class="rail">
      <p class="kick reveal">${esc(t.railTitle)}</p>
      <dl>${STATS.map(stat).join('\n')}</dl>
    </aside>
  </div>
</section>

<section id="overlap" class="field">
  <div class="wrap">
    <div class="head">
      <div><p class="kick reveal">${esc(t.s1kick)}</p><h2 class="display reveal">${esc(t.s1h)}</h2></div>
      <p class="reveal lead">${esc(t.s1p)}</p>
    </div>
    <div class="bento">
      <div class="tile glass span4 reveal">
        <form id="checker" onsubmit="return false">
          <div class="picks">
            <label><span class="kick">${esc(t.selA)}</span>
              <select id="selA">${GROUPS.map((g, i) => opt(g, i, 0)).join('')}</select></label>
            <label><span class="kick">${esc(t.selB)}</span>
              <select id="selB">${GROUPS.map((g, i) => opt(g, i, Math.min(9, GROUPS.length - 1))).join('')}</select></label>
          </div>
          <output id="verdict" class="verdict">
            <b>${esc(t.diff)}</b>
            <span>${esc(t.diffWhy)}</span>
          </output>
          <div hidden id="answers">${answers}<p class="answer" id="a-diff">${esc(t.diffWhy)}</p></div>
          <p class="sr" data-same="${esc(t.same)}" data-diff="${esc(t.diff)}"></p>
        </form>
      </div>
      <div class="tile dark span2 reveal">
        <p class="kick neon">${esc(t.ruleKick)}</p>
        <p class="display rule">${t.rule.map((r, i) => i === 2 ? `<span class="neon">${esc(r)}</span>` : esc(r)).join('<br>')}</p>
        <p class="small">${esc(t.ruleP)}</p>
      </div>
      <div class="tile glass span2 reveal">
        <p class="kick">${en ? 'Human studies' : 'Badania u ludzi'}</p>
        <p class="display big-num">&lt;30</p>
        <p class="small ink2">${en
      ? 'participants in total, across the three human studies of the most-discussed “research” peptide — none with a control group.'
      : 'uczestników łącznie w trzech badaniach u ludzi najgłośniejszego peptydu „badawczego” — żadne bez grupy kontrolnej.'}</p>
      </div>
      <div class="tile glass span4 reveal">
        <p class="kick">${en ? 'What “studied” can mean' : 'Co może znaczyć „przebadany”'}</p>
        <ol class="ladder">
          ${[[en ? 'Cells' : 'Komórki', en ? 'A dish is not a body.' : 'Szalka to nie organizm.'],
      [en ? 'Animals' : 'Zwierzęta', en ? 'Roughly one in ten carries over.' : 'Przechodzi mniej więcej jedno na dziesięć.'],
      [en ? 'A few people' : 'Kilka osób', en ? 'Often with no control group.' : 'Często bez grupy kontrolnej.'],
      [en ? 'Real trials' : 'Prawdziwe badania', en ? 'Where approval starts.' : 'Tu zaczyna się rejestracja.']]
      .map((s, i) => `<li${i === 3 ? ' class="last"' : ''}><span class="kick">0${i + 1}</span><b>${esc(s[0])}</b><em>${esc(s[1])}</em></li>`).join('')}
        </ol>
      </div>
    </div>
  </div>
</section>

<section id="daily" class="band">
  <div class="wrap daily-grid">
    <div>
      <p class="kick reveal">${esc(t.s2kick)}</p>
      <h2 class="display reveal">${esc(name(day.n, en))}</h2>
      <p class="muted reveal date">${esc(day.date)}</p>
    </div>
    <div class="reveal">
      <p class="lead">${esc(en ? day.en : day.pl)}</p>
      ${(day.src || []).length ? `<p class="kick srcs">${esc(t.src)}</p><ul class="srcs-list">${day.src.map(s => `<li><a href="${esc(s[1])}" rel="nofollow noopener" target="_blank">${esc(s[0])}</a></li>`).join('')}</ul>` : ''}
    </div>
  </div>
</section>

<section id="catalog">
  <div class="wrap cat-grid">
    <div>
      <p class="kick reveal">${esc(t.s3kick)}</p>
      <h2 class="display reveal">${esc(t.s3h)}</h2>
      <p class="lead reveal">${esc(t.s3p)}</p>
      <p class="reveal"><a class="more" href="/p/">${esc(t.all)}<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a></p>
    </div>
    <div class="cards">${cards}</div>
  </div>
</section>

<section id="faq" class="band">
  <div class="wrap">
    <p class="kick reveal">${esc(t.s4kick)}</p>
    <div class="faq">
      ${faq.map(q => `<details class="reveal"><summary>${esc(en ? q[0].en : q[0].pl)}</summary><p>${esc(en ? q[1].en : q[1].pl)}</p></details>`).join('\n')}
    </div>
  </div>
</section>

<section id="about" class="dark-sec">
  <div class="wrap">
    <p class="kick neon reveal">${esc(t.s5kick)}</p>
    <h2 class="display reveal huge">${esc(t.s5h)}</h2>
    <div class="cols">${NOT[L].map(p => `<p class="reveal">${esc(p)}</p>`).join('')}</div>
  </div>
  <i class="glow" aria-hidden="true"></i>
</section>
</main>

<footer>
  <div class="wrap foot">
    <p>${esc(t.foot)}</p>
    <p><button id="motion" class="linkish" data-off="${esc(t.motionOff)}" data-on="${esc(t.motionOn)}">${esc(t.motionOff)}</button> · <span class="mono">pepsafe.info</span></p>
  </div>
</footer>

<script src="../assets/ruch.js" defer></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(out, 'en'), { recursive: true });
fs.mkdirSync(path.join(out, 'pl'), { recursive: true });
for (const L of ['en', 'pl']) {
  const html = page(L);
  fs.writeFileSync(path.join(out, L, 'index.html'), html);
  console.log(`/podglad/v4/${L}/index.html — ${Math.round(Buffer.byteLength(html) / 1024)} kB`);
}
console.log(`dane: ${D.length} substancji, ${GROUPS.length} grup, peptyd dnia: ${DAILY[0].n} (${DAILY[0].date})`);
