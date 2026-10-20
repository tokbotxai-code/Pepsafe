// Builds the whole v4 site from the live catalog, in two languages, as plain HTML files.
// Pages: index, catalog, one card per substance, groups, questions, warnings, about.
// Everything a reader needs is in the markup; assets/ruch.js only adds motion and filtering.
// Usage: node tools/v4.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const out = process.env.PEP_OUT ? path.resolve(root, process.env.PEP_OUT) : path.join(root, 'podglad', 'v4');
const BASE = process.env.PEP_BASE !== undefined ? process.env.PEP_BASE : '/podglad/v4/';  // prefiks adresow na serwerze
const cardPath = (e, L) => 'p/' + key(e) + (L === 'en' ? '' : '.' + L) + '.html';          // adresy, ktore Google juz zna
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const at = re => lines.findIndex(l => re.test(l));
const until = i => i + lines.slice(i).findIndex((l, n) => n > 0 && /^(\];|\};)/.test(l)) + 1;
const slice = (a, b) => lines.slice(a, b).join('\n');

// ── read the app's data blocks in a sandbox ───────────────────────────────────
const box = { console, window: {}, document: {} }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w,q,wa){D.push({n,a,s,c,cat,f,d,m,u,ev,w,q:q||"",wa:!!wa});}', box);
const ds = at(/^var ST=\{A:/), de = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
vm.runInContext(slice(ds, de).replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
for (const re of [/^var GL=/, /^var CONFUSE=/, /^var POSTS=/, /^var FAMS=/, /^var DAILY=\[/, /^var FAQ=\[/, /^var QA=\[/, /^var ALERTS=/, /^var TRICKS=/, /^var MYTHS=/, /^var DOSE=/]) {
  const i = at(re); if (i >= 0) vm.runInContext(slice(i, until(i)), box);
}
for (const re of [/^var SRC=\{/, /^var WADA=\{/, /^var WADA_URL=/, /^var SY_PL=/, /^var SY_EN=/]) { const i = at(re); if (i >= 0) vm.runInContext(lines[i], box); }
const { D, EN, ST, ST_EN, FAMS, FAMS_EN, DAILY, FAQ, QA, ALERTS, TRICKS, MYTHS, SRC, WADA, WADA_URL, DOSE, SY_PL, SY_EN, GL, CONFUSE, POSTS } = box;

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
['trials', D.filter(e => e.s === 'P').length]];

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

const SITE = 'https://pepsafe.info';
const CF_BEACON = '68889a9fe6604022bd3fa7d786e5d79f';  // licznik odwiedzin (Cloudflare Web Analytics)
// FormSubmit: nie wymaga konta ani klucza, wiadomosci ida na ten adres.
// Pierwsza wysylka uruchamia maila aktywacyjnego, ktory wlasciciel klika raz.
// Po aktywacji mozna podmienic adres na alias z panelu, zeby nie stal w kodzie strony.
const FORM_TO = 'contact@pepsafe.info';
const TT = 'https://www.tiktok.com/@pepsafe.info';
const IG = 'https://www.instagram.com/pepsafe.info/';
const ICO_TT = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.6 5.8a5 5 0 0 0 3.5 1.4V10a8.1 8.1 0 0 1-4.5-1.4v6.3a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a5 5 0 0 0 1 3.8Z"/></svg>';
const ICO_IG = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>';
const ORG = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://pepsafe.info/#org',
  name: 'PepSafe', url: 'https://pepsafe.info/', sameAs: [TT, IG]
});

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
    menuLab: 'Menu', menuClose: 'Close menu', findLab: 'Search',
    e404kick: 'Page not found', e404H: 'That page is not here.',
    e404P: 'The address may be old, mistyped, or the page may have moved. The catalog and the search below will get you where you were going.',
    e404Search: 'Search the catalog', e404Home: 'Home',
    glossNav: 'Glossary', glossH: 'The words, in plain language.',
    glossLead: 'Terms that come up on every page, explained once so the rest of the site reads easily.',
    blogNav: 'Reading', blogH: 'Longer pieces.',
    blogLead: 'Where a single entry is not enough: what a document proves, what a vote changed, what a study actually measured.',
    readMin: 'min read', allPieces: 'All pieces', confused: 'Often confused with', findPh: 'Type a name, brand or symptom', findHint: 'Type at least two letters.',
    findNone: 'Nothing matches that.', findClose: 'Close', findMore: 'See all results',
    follow: 'Follow', contact: 'Contact', writeUs: 'Write to us',
    contactP: 'Questions, a correction, a source we missed? Send us a direct message on TikTok or Instagram. We read every one and answer the best ones in a Q&A. We never advise on doses, where to buy, or how to use anything.',
    dmTT: 'TikTok — @pepsafe.info', dmIG: 'Instagram — @pepsafe.info',
    coName: 'Name', coMail: 'Your email', coTopic: 'Topic', coMsg: 'Message',
    coT: ['Question about the catalog', 'Correction or error on the site', 'Other'],
    coCons: 'I agree to my data being processed to reply to this message.',
    coSend: 'Send message', coSending: 'Sending\u2026',
    thxH: 'Thank you.', thxP: 'Your message has reached us. We read every one and answer as soon as we can.',
    thxR: 'Your report has reached us. It is not published anywhere. With severe symptoms call 112 or your doctor — do not wait for a reply from us.',
    thxBack: 'Back to the catalog',
    coErr: 'Enter your name, a valid email and a message (min. 10 characters) and tick the consent.',
    coOk: 'Sent. Thank you, we will reply to the address you gave.',
    coFail: 'Could not send. Check your connection and try again.',
    coHowH: 'How it works', coHow: 'The message is sent through the form. We do not publish it, and the authors\u2019 e-mail address is not shown on the site. Your e-mail is used only to reply.',
    coMed: 'We do not give medical advice or personal dosing recommendations. For health matters, contact your doctor.',
    efH: 'Report a side effect', efLab: 'Report',
    efLead: 'Noticed a worrying symptom after a peptide drug? Describe it below and the report goes straight to the site authors. Reports are not published. This is not medical help.',
    efWarn: 'For an overdose, a severe allergic reaction, chest pain or breathing difficulty call 112 (or your local emergency number) or a poison centre. Do not wait for a reply from us.',
    efSub: 'Substance', efSym: 'Description of the symptom (no personal data)',
    efSev: 'Severity', efSev1: 'Mild', efSev2: 'Moderate', efSev3: 'Severe or worrying',
    efWhen: 'When it happened (e.g. after 2 days)',
    efCons: 'I understand the report does not replace a doctor, goes only to the site authors and is not published.',
    efSend: 'Send report', efErr: 'Describe the symptom and tick the consent box.',
    efOk: 'Sent. Thank you for the report.',
    efEmerg: 'Sent. With severe symptoms call 112 or your doctor, do not wait for a reply from us.',
    efNote: 'Reports go only to the site authors and are not published. For severe symptoms (breathlessness, severe abdominal pain, facial swelling, fainting) do not write to us: call emergency services.',
    official: 'An adverse reaction to an approved medicine is also worth reporting to the regulator:'
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
    menuLab: 'Menu', menuClose: 'Zamknij menu', findLab: 'Szukaj',
    e404kick: 'Nie znaleziono strony', e404H: 'Tej strony tu nie ma.',
    e404P: 'Adres może być stary, z literówką, albo strona się przeniosła. Katalog i wyszukiwarka poniżej doprowadzą Cię tam, gdzie chciałeś.',
    e404Search: 'Przeszukaj katalog', e404Home: 'Strona główna',
    glossNav: 'Słownik', glossH: 'Słowa, po ludzku.',
    glossLead: 'Pojęcia, które wracają na każdej stronie, wyjaśnione raz, żeby resztę czytało się łatwo.',
    blogNav: 'Do czytania', blogH: 'Dłuższe teksty.',
    blogLead: 'Tam, gdzie jeden wpis nie wystarcza: co dokument naprawdę potwierdza, co zmieniło głosowanie, co zmierzyło badanie.',
    readMin: 'min czytania', allPieces: 'Wszystkie teksty', confused: 'Bywa mylone z', findPh: 'Wpisz nazwę, markę albo objaw', findHint: 'Wpisz co najmniej dwie litery.',
    findNone: 'Nic nie pasuje.', findClose: 'Zamknij', findMore: 'Zobacz wszystkie wyniki',
    follow: 'Obserwuj', contact: 'Kontakt', writeUs: 'Napisz do nas',
    contactP: 'Pytanie, sprostowanie, przeoczone źródło? Napisz do nas wiadomość prywatną na TikToku albo Instagramie. Czytamy każdą, a najciekawsze omawiamy w Q&A. Nigdy nie doradzamy dawek, miejsc zakupu ani sposobu stosowania.',
    dmTT: 'TikTok — @pepsafe.info', dmIG: 'Instagram — @pepsafe.info',
    coName: 'Imię', coMail: 'Twój e-mail', coTopic: 'Temat', coMsg: 'Wiadomość',
    coT: ['Pytanie o katalog', 'Poprawka lub błąd na stronie', 'Inne'],
    coCons: 'Zgadzam się na przetwarzanie podanych danych w celu odpowiedzi na wiadomość.',
    coSend: 'Wyślij wiadomość', coSending: 'Wysyłanie\u2026',
    thxH: 'Dziękujemy.', thxP: 'Wiadomość do nas dotarła. Czytamy każdą i odpowiadamy, gdy tylko się da.',
    thxR: 'Zgłoszenie do nas dotarło. Nigdzie go nie publikujemy. Przy silnych objawach dzwoń pod 112 lub do lekarza — nie czekaj na odpowiedź od nas.',
    thxBack: 'Wróć do katalogu',
    coErr: 'Uzupełnij imię, poprawny e-mail i wiadomość (min. 10 znaków) oraz zaznacz zgodę.',
    coOk: 'Wysłano. Dziękujemy, odpowiemy na podany adres.',
    coFail: 'Nie udało się wysłać. Sprawdź połączenie i spróbuj ponownie.',
    coHowH: 'Jak to działa', coHow: 'Wiadomość wysyłamy przez formularz. Nie publikujemy jej, a adres e-mail autorów nie jest pokazywany na stronie. Twój e-mail służy tylko do odpowiedzi.',
    coMed: 'Nie udzielamy porad medycznych ani indywidualnych zaleceń dawkowania. W sprawach zdrowia skontaktuj się z lekarzem.',
    efH: 'Zgłoś skutek uboczny', efLab: 'Zgłoszenie',
    efLead: 'Niepokojący objaw po leku peptydowym? Opisz go poniżej, a zgłoszenie trafi prosto do autorów strony. Zgłoszenia nie są publikowane. To nie jest pomoc medyczna.',
    efWarn: 'Przy przedawkowaniu, silnej reakcji alergicznej, bólu w klatce piersiowej lub trudnościach z oddychaniem dzwoń pod 112 albo do centrum zatruć. Nie czekaj na odpowiedź od nas.',
    efSub: 'Substancja', efSym: 'Opis objawu (bez danych osobowych)',
    efSev: 'Nasilenie', efSev1: 'Lekkie', efSev2: 'Umiarkowane', efSev3: 'Silne lub niepokojące',
    efWhen: 'Kiedy wystąpiło (np. po 2 dniach)',
    efCons: 'Rozumiem, że zgłoszenie nie zastępuje lekarza, trafia tylko do autorów strony i nie jest publikowane.',
    efSend: 'Wyślij zgłoszenie', efErr: 'Uzupełnij opis objawu i zaznacz zgodę.',
    efOk: 'Wysłano. Dziękujemy za zgłoszenie.',
    efEmerg: 'Wysłano. Przy silnych objawach zadzwoń pod 112 lub do lekarza, nie czekaj na odpowiedź od nas.',
    efNote: 'Zgłoszenia trafiają tylko do autorów strony i nie są publikowane. Przy nasilonych objawach (duszność, silny ból brzucha, obrzęk twarzy, omdlenie) nie pisz do nas, tylko dzwoń pod 112 lub jedź na pogotowie.',
    official: 'Działanie niepożądane leku zatwierdzonego warto zgłosić też do urzędu:'
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
  const other = L === 'en' ? 'pl' : 'en';
  const self = o.depth ? o.twin : L + '/' + o.here;   // sciezka strony od korzenia witryny
  const up = BASE + L + '/';                           // odnosniki do stron tego jezyka
  const twinHref = BASE + (o.depth ? (o.twin || '').replace(/(\.pl)?\.html$/, other === 'pl' ? '.pl.html' : '.html')
    : other + '/' + (o.twin || ''));
  const nav = [['index.html', t.nav.home], ['catalog.html', t.nav.catalog], ['dosing.html', t.dosingNav],
  ['groups.html', t.nav.groups], ['compare.html', t.compareNav], ['symptoms.html', t.symptomsNav],
  ['faq.html', t.nav.faq], ['alerts.html', t.nav.alerts], ['blog.html', t.blogNav],
  ['glossary.html', t.glossNav], ['about.html', t.nav.about]];
  return `<!doctype html>
<html lang="${L}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${BASE === '/' && !o.noindex ? '' : '<meta name="robots" content="noindex">\n'}${FAVICON}
${THEME_BOOT}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BASE}assets/site.css">
<link rel="canonical" href="${SITE}${BASE}${self}">
<link rel="alternate" hreflang="en" href="${SITE}${BASE}${self.replace(/^pl\//, 'en/').replace(/\.pl\.html$/, '.html')}">
<link rel="alternate" hreflang="pl" href="${SITE}${BASE}${self.replace(/^en\//, 'pl/').replace(/(?<!\.pl)\.html$/, self.startsWith('p/') ? '.pl.html' : '.html')}">
<link rel="alternate" hreflang="x-default" href="${SITE}${BASE}${self.replace(/^pl\//, 'en/').replace(/\.pl\.html$/, '.html')}">
<meta name="theme-color" content="#F6F6F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B0F0D" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PepSafe">
<meta property="og:locale" content="${L === 'pl' ? 'pl_PL' : 'en_GB'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${SITE}${BASE}${self}">
<meta property="og:image" content="${SITE}${BASE}assets/og-${L}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${SITE}${BASE}assets/og-${L}.png">
<script type="application/ld+json">${ORG}</${'script'}>
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
      <a class="lang" href="${twinHref}">${other.toUpperCase()}</a>
      <button class="icon burger" id="burger" type="button" aria-label="${esc(t.menuLab)}" aria-expanded="false" aria-controls="menu">
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  </nav>
</header>

<div class="menuwrap" id="menu" hidden>
  <nav class="menucard" aria-label="${esc(t.menuLab)}">
    <p class="menutop"><span class="kick">${esc(t.menuLab)}</span>
      <button class="icon" id="menux" type="button" aria-label="${esc(t.menuClose)}">
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button></p>
    <ul>${nav.map(([h, l]) => `<li><a href="${up}${h}"${o.here === h && !o.depth ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('\n      ')}</ul>
    <p class="menufoot"><a href="${twinHref}">${other.toUpperCase()}</a> · <a href="${TT}" rel="me noopener" target="_blank">TikTok</a> · <a href="${IG}" rel="me noopener" target="_blank">Instagram</a></p>
  </nav>
</div>

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
  <canvas class="chains" data-dense="0.55" aria-hidden="true"></canvas>
  <div class="wrap foot">
    <p>${esc(t.foot)}</p>
    <p class="social">
      <a class="soc" href="${TT}" rel="me noopener" target="_blank">${ICO_TT}<span>TikTok</span></a>
      <a class="soc" href="${IG}" rel="me noopener" target="_blank">${ICO_IG}<span>Instagram</span></a>
      <a class="soc" href="mailto:${FORM_TO}">${FORM_TO}</a>
    </p>
    <p><button id="motion" class="linkish" data-off="${esc(t.motionOff)}" data-on="${esc(t.motionOn)}">${esc(t.motionOff)}</button> · <span class="mono">pepsafe.info</span></p>
  </div>
</footer>

<script src="${BASE}assets/dane-${L}.js" defer></script>
<script src="${BASE}assets/ruch.js" defer></script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_BEACON}"}'></script>
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
    stats: { approved: 'Approved medicines', unapproved: 'Unapproved', trials: 'In clinical trials' },
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
    stats: { approved: 'Zatwierdzone leki', unapproved: 'Niezatwierdzone', trials: 'W badaniach klinicznych' },
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

const cardRow = (e, en, L) => `<a class="card tile reveal" href="${BASE}${cardPath(e, L)}">
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
      <dl>${STATS.map(([k, n]) => `<div class="rail-row reveal"><dt>${esc(h.stats[k])}</dt><dd class="num"><span data-count="${n}">${n}</span></dd></div>`).join('')}</dl>
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
    <div class="cards" data-par="-0.6">${FEATURED.map(e => cardRow(e, en, L)).join('')}</div>
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
        <a class="entry-link" href="${BASE}${cardPath(e, L)}">
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
    ${sibs.length ? `<section class="blk reveal"><h2 class="kick">${esc(t.related)}</h2><div class="cards">${sibs.map(s => cardRow(s, en, L)).join('')}</div></section>` : ''}
    ${(() => {
      const mix = ((CONFUSE || {})[e.n] || []).map(x => D.find(y => y.n === x)).filter(Boolean)
        .filter(x => !sibs.some(sb => sb.n === x.n));
      return mix.length ? `<section class="blk reveal"><h2 class="kick">${esc(t.confused)}</h2><div class="cards">${mix.map(x => cardRow(x, en, L)).join('')}</div></section>` : '';
    })()}
  </div>
</article>`;
  return layout({
    lang: L, here: 'catalog.html', depth: 1, twin: cardPath(e, L), body,
    title: `${name} — ${statusOf(e, en)} | PepSafe`, desc: clip(`${name} — ${statusOf(e, en)}. ${d}`, 155)
  });
}

const postSlug = x => slug(x.title.en || x.title.pl);

function notFound(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">404 — ${esc(t.e404kick)}</p>
    <h1 class="display reveal">${esc(t.e404H)}</h1>
    <p class="lede reveal">${esc(t.e404P)}</p>
    <p class="actions reveal">
      <a class="btn big" href="${BASE}${L}/catalog.html">${esc(t.e404Search)}${ARROW}</a>
      <a class="btn ghost big" href="${BASE}${L}/index.html">${esc(t.e404Home)}</a>
    </p>
    <p class="small ink2 reveal" style="margin-top:28px">${en ? 'Looking for a substance? Open the search with the magnifier in the bar above.' : 'Szukasz substancji? Otwórz wyszukiwarkę lupką w belce powyżej.'}</p>
  </div>
</section>`;
  return layout({
    lang: L, here: '404.html', twin: '404.html', body, noindex: true,
    title: (en ? 'Page not found' : 'Nie znaleziono strony') + ' | PepSafe', desc: t.e404P
  });
}

function glossary(L) {
  const en = L === 'en', t = W[L];
  const rows = (GL || []).map(g => (en ? g.en : g.pl)).filter(Boolean)
    .sort((a, b) => a[0].localeCompare(b[0], en ? 'en' : 'pl'));
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.glossNav)}</p>
    <h1 class="display reveal">${esc(t.glossH)}</h1>
    <p class="lede reveal">${esc(t.glossLead)}</p>
  </div>
</section>
<section><div class="wrap narrow">
  <dl class="gloss">${rows.map(r => `<div class="gloss-row reveal"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
</div></section>`;
  return layout({
    lang: L, here: 'glossary.html', twin: 'glossary.html', body,
    title: (en ? 'Glossary' : 'Słownik') + ' | PepSafe', desc: t.glossLead
  });
}

function blogIndex(L) {
  const en = L === 'en', t = W[L];
  const items = (POSTS || []).filter(x => x && x.title);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.blogNav)}</p>
    <h1 class="display reveal">${esc(t.blogH)}</h1>
    <p class="lede reveal">${esc(t.blogLead)}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="grid-cards">${items.map(x => `
    <a class="card tile reveal piece" href="${BASE}${L}/t/${postSlug(x)}.html">
      <span><em class="kick">${esc((x.tag || {})[L] || '')}</em>
      <b>${esc(x.title[L] || x.title.pl)}</b>
      <em>${x.min} ${esc(t.readMin)}</em></span>${ARROW}
    </a>`).join('')}</div>
</div></section>`;
  return layout({
    lang: L, here: 'blog.html', twin: 'blog.html', body,
    title: (en ? 'Reading' : 'Do czytania') + ' | PepSafe', desc: t.blogLead
  });
}

function piece(x, L) {
  const en = L === 'en', t = W[L];
  const paras = (x.p[L] || x.p.pl || []);
  const others = (POSTS || []).filter(y => y !== x).slice(0, 3);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${esc((x.tag || {})[L] || '')} · ${x.min} ${esc(t.readMin)}</p>
    <h1 class="display reveal">${esc(x.title[L] || x.title.pl)}</h1>
  </div>
</section>
<section><div class="wrap narrow">
  ${paras.map(para => `<p class="lead reveal">${esc(para)}</p>`).join('\n  ')}
  <p class="actions reveal"><a class="btn big" href="${BASE}${L}/blog.html">${esc(t.allPieces)}${ARROW}</a></p>
</div></section>
${others.length ? `<section class="band"><div class="wrap">
  <p class="kick reveal">${esc(t.allPieces)}</p>
  <div class="grid-cards">${others.map(y => `
    <a class="card tile reveal piece" href="${BASE}${L}/t/${postSlug(y)}.html">
      <span><em class="kick">${esc((y.tag || {})[L] || '')}</em><b>${esc(y.title[L] || y.title.pl)}</b>
      <em>${y.min} ${esc(t.readMin)}</em></span>${ARROW}</a>`).join('')}</div>
</div></section>` : ''}`;
  return layout({
    lang: L, here: 't/' + postSlug(x) + '.html', twin: 't/' + postSlug(x) + '.html', body,
    title: (x.title[L] || x.title.pl) + ' | PepSafe',
    desc: clip(paras[0] || '', 155)
  });
}

function thanks(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">PepSafe</p>
    <h1 class="display reveal">${esc(t.thxH)}</h1>
    <p class="lede reveal" id="thxMsg" data-plain="${esc(t.thxP)}" data-report="${esc(t.thxR)}">${esc(t.thxP)}</p>
    <p class="actions reveal">
      <a class="btn big" href="${BASE}${L}/catalog.html">${esc(t.thxBack)}${ARROW}</a>
      <a class="btn ghost big" href="${BASE}${L}/index.html">${esc(t.nav.home)}</a>
    </p>
  </div>
</section>`;
  return layout({
    lang: L, here: 'thanks.html', twin: 'thanks.html', body, noindex: true,
    title: (en ? 'Thank you' : 'Dziękujemy') + ' | PepSafe', desc: en ? t.thxP : t.thxP
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
    <div class="cards">${g.members.map(x => D.find(y => y.n === x)).filter(Boolean).map(s => cardRow(s, en, L)).join('')}</div>
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
</div></section>

<section id="contact"><div class="wrap narrow">
  <p class="kick reveal">${esc(t.contact)}</p>
  <h2 class="display sm reveal">${esc(t.writeUs)}</h2>
  <p class="lede reveal">${esc(t.contactP)}</p>
  <p class="notice reveal">${en ? 'This form is about the site and the catalog. If you want to report a symptom after taking something, use the' : 'Ten formularz dotyczy strony i katalogu. Jeśli chcesz zgłosić objaw po zażyciu czegoś, użyj'}
    <a href="symptoms.html#report">${en ? 'side-effect report' : 'zgłoszenia skutku ubocznego'}</a>.</p>
  <form class="sheet reveal" id="coForm" method="POST" action="https://formsubmit.co/${FORM_TO}" novalidate>
    <input type="hidden" name="_subject" value="PepSafe: ${L === 'pl' ? 'wiadomość ze strony' : 'message from the site'}">
    <input type="hidden" name="_template" value="table">
    <input type="hidden" name="_captcha" value="false">
    <input type="hidden" name="_next" value="${SITE}${BASE}${L}/thanks.html">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="f2">
      <p class="frow"><label for="coName">${esc(t.coName)}</label><input type="text" id="coName" name="name" autocomplete="name" maxlength="80" required></p>
      <p class="frow"><label for="coEmail">${esc(t.coMail)}</label><input type="email" id="coEmail" name="email" autocomplete="email" maxlength="120" required></p>
    </div>
    <p class="frow"><label for="coTopic">${esc(t.coTopic)}</label><select id="coTopic" name="topic">${t.coT.map(x => `<option>${esc(x)}</option>`).join('')}</select></p>
    <p class="frow"><label for="coMsg">${esc(t.coMsg)}</label><textarea id="coMsg" name="message" rows="5" maxlength="2000" required></textarea></p>
    <p class="check"><label><input type="checkbox" id="coCons"> <span>${esc(t.coCons)}</span></label></p>
    <p class="formfoot"><button class="btn big" type="submit" data-busy="${esc(t.coSending)}">${esc(t.coSend)}</button></p>
    <p class="formmsg" id="coMsgOut" role="status" hidden></p>
  </form>
  <div class="stack">
    <article class="tile glass reveal"><h3 class="gtitle sm">${esc(t.coHowH)}</h3><p class="small ink2">${esc(t.coHow)}</p></article>
    <article class="tile glass reveal"><h3 class="gtitle sm">TikTok · Instagram</h3>
      <p class="small ink2">${en ? 'Prefer your phone? Send a direct message instead. We read every one and answer the best ones in a Q&A.' : 'Wolisz z telefonu? Napisz wiadomość prywatną. Czytamy każdą, a najciekawsze omawiamy w Q&A.'}</p>
      <p class="social"><a class="soc" href="${TT}" rel="me noopener" target="_blank">${ICO_TT}<span>${esc(t.dmTT)}</span></a>
      <a class="soc" href="${IG}" rel="me noopener" target="_blank">${ICO_IG}<span>${esc(t.dmIG)}</span></a></p></article>
    <article class="tile glass reveal"><h3 class="gtitle sm">${en ? 'By email' : 'Mailem'}</h3>
      <p class="small ink2">${en ? 'If you would rather not use the form, write to us directly. Same inbox, same people.' : 'Jeśli wolisz nie korzystać z formularza, napisz wprost. Ta sama skrzynka, te same osoby.'}</p>
      <p class="social"><a class="soc" href="mailto:${FORM_TO}">${FORM_TO}</a></p></article>
  </div>
  <p class="notice reveal">${esc(t.coMed)}</p>
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
</div></section>

<section id="report" class="band"><div class="wrap narrow">
  <p class="kick reveal">${esc(t.efLab)}</p>
  <h2 class="display sm reveal">${esc(t.efH)}</h2>
  <p class="lede reveal">${esc(t.efLead)}</p>
  <p class="notice warn reveal"><strong>${en ? 'Emergency' : 'Nagły przypadek'}:</strong> ${esc(t.efWarn)}</p>
  <p class="notice reveal">${en ? 'This form is only for symptoms. A question, an error on the site or anything else goes to' : 'Ten formularz dotyczy wyłącznie objawów. Pytanie, błąd na stronie i cokolwiek innego to'}
    <a href="about.html#contact">${en ? 'contact' : 'kontakt'}</a>.</p>
  <form class="sheet reveal" id="efForm" method="POST" action="https://formsubmit.co/${FORM_TO}" novalidate>
    <input type="hidden" name="_subject" value="PepSafe: ${L === 'pl' ? 'zgłoszenie skutku ubocznego' : 'side-effect report'}">
    <input type="hidden" name="_template" value="table">
    <input type="hidden" name="_captcha" value="false">
    <input type="hidden" name="_next" value="${SITE}${BASE}${L}/thanks.html?r=1">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="f2">
      <p class="frow"><label for="efSub">${esc(t.efSub)}</label><select id="efSub" name="substance"></select></p>
      <p class="frow"><label for="efSev">${esc(t.efSev)}</label><select id="efSev" name="severity">
        <option value="1">${esc(t.efSev1)}</option><option value="2">${esc(t.efSev2)}</option><option value="3">${esc(t.efSev3)}</option>
      </select></p>
    </div>
    <p class="frow"><label for="efSym">${esc(t.efSym)}</label><textarea id="efSym" name="symptom" rows="3" maxlength="600" required></textarea></p>
    <p class="frow"><label for="efWhen">${esc(t.efWhen)}</label><input type="text" id="efWhen" name="when" maxlength="100"></p>
    <p class="check"><label><input type="checkbox" id="efCons"> <span>${esc(t.efCons)}</span></label></p>
    <p class="formfoot"><button class="btn big" type="submit" data-busy="${esc(t.coSending)}">${esc(t.efSend)}</button></p>
    <p class="formmsg" id="efMsg" role="status" hidden></p>
  </form>
  <p class="small ink2 reveal">${esc(t.efNote)}</p>
  <p class="small ink2 reveal">${esc(t.official)}
    <a href="https://smz.ezdrowie.gov.pl/" rel="noopener" target="_blank">URPL (PL)</a> ·
    <a href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program" rel="noopener" target="_blank">FDA MedWatch (US)</a></p>
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
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(out, 'p'), { recursive: true });
  const pages = {
    'index.html': home(L), 'catalog.html': catalog(L), 'dosing.html': dosing(L), 'groups.html': groups(L),
    'compare.html': compare(L), 'symptoms.html': symptoms(L), 'saved.html': savedPage(L),
    'faq.html': faqPage(L), 'alerts.html': alerts(L), 'about.html': about(L), 'thanks.html': thanks(L),
    'blog.html': blogIndex(L), 'glossary.html': glossary(L), '404.html': notFound(L)
  };
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  // style, skrypt i obrazki udostepniania trzymamy w src/ i kopiujemy do kazdej kompilacji
  for (const f of fs.readdirSync(path.join(root, 'src'))) fs.copyFileSync(path.join(root, 'src', f), path.join(out, 'assets', f));
  fs.writeFileSync(path.join(out, 'assets', 'dane-' + L + '.js'), dataFile(L));
  for (const [f, html] of Object.entries(pages)) { fs.writeFileSync(path.join(dir, f), html); n++; }
  for (const e of D) { fs.writeFileSync(path.join(out, cardPath(e, L)), card(e, L)); n++; }
  fs.mkdirSync(path.join(dir, 't'), { recursive: true });
  for (const x of (POSTS || [])) { fs.writeFileSync(path.join(dir, 't', postSlug(x) + '.html'), piece(x, L)); n++; }
}

// strony pod starymi adresami, zeby zaden zaindeksowany odnosnik nie zgasl:
// korzen witryny oraz /p/ i /p/faq, ktore Google zna od tygodnia
function retarget(html, canon) {
  return html
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${BASE}${canon}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${BASE}${canon}">`);
}
fs.writeFileSync(path.join(out, 'index.html'), retarget(home('en'), ''));
fs.writeFileSync(path.join(out, '404.html'), notFound('en'));   // GitHub Pages serwuje to przy kazdym 404
fs.writeFileSync(path.join(out, 'p', 'index.html'), retarget(catalog('en'), 'en/catalog.html'));
fs.writeFileSync(path.join(out, 'p', 'faq.html'), retarget(faqPage('en'), 'en/faq.html'));
fs.writeFileSync(path.join(out, 'p', 'faq.pl.html'), retarget(faqPage('pl'), 'pl/faq.html'));
n += 5;

// sitemapa: tylko adresy kanoniczne
const when = new Date().toISOString().slice(0, 10);
const urls = [''].concat(
  LANGS.flatMap(L => ['index.html', 'catalog.html', 'dosing.html', 'groups.html', 'compare.html',
    'symptoms.html', 'faq.html', 'alerts.html', 'about.html', 'blog.html', 'glossary.html'].map(f => L + '/' + f)),
  LANGS.flatMap(L => (POSTS || []).map(x => L + '/t/' + postSlug(x) + '.html')),
  LANGS.flatMap(L => D.map(e => cardPath(e, L))));
fs.writeFileSync(path.join(out, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${SITE}${BASE}${u}</loc><lastmod>${when}</lastmod></url>`).join('\n') +
  '\n</urlset>\n');
console.log(`sitemapa: ${urls.length} adresow`);

// kanal RSS: istniał na starej stronie i był linkowany w stopce, więc nie może zniknąć
const rssItems = (POSTS || []).map(x => `  <item>
    <title>${esc(x.title.en || x.title.pl)}</title>
    <link>${SITE}${BASE}en/t/${postSlug(x)}.html</link>
    <guid isPermaLink="true">${SITE}${BASE}en/t/${postSlug(x)}.html</guid>
    <description>${esc(clip((x.p.en || x.p.pl || [])[0] || '', 300))}</description>
  </item>`).join('\n');
fs.writeFileSync(path.join(out, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>PepSafe</title>
  <link>${SITE}${BASE}en/</link>
  <description>Peptide facts, no sales. Status, evidence and warnings for ${D.length} substances.</description>
  <language>en</language>
  <atom:link href="${SITE}${BASE}feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
</channel>
</rss>
`);
console.log(`kanal RSS: ${(POSTS || []).length} tekstow`);

console.log(`zbudowano ${n} stron: ${LANGS.length} języki × (10 + ${D.length} kart)`);
console.log(`dawkowanie: ${(DOSE || []).length} pozycji, objawy: ${((SY_PL||[]).length)} hasel`);
console.log(`grupy: ${GROUPS.length}, peptyd dnia: ${DAILY[0].n} (${DAILY[0].date}), ostrzezenia: ${(ALERTS || []).length}, triki: ${(TRICKS || []).length}, mity: ${(MYTHS || []).length}`);
