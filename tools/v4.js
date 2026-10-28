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
// longer write-ups per substance, kept out of dane.html so they can grow: {"<PL name>": {"pl": [paragraphs], "en": [paragraphs]}}
const SKUTKI = require('./skutki.js');
const PLUS = fs.existsSync(path.join(root, 'plusy.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'plusy.json'), 'utf8')) : {};   // advantages and disadvantages per card (plusy.json: en/pl/es lists)
const OPISY = fs.existsSync(path.join(root, 'opisy.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'opisy.json'), 'utf8')) : {};
// "Peptyd dnia": the newest entry dated today or earlier (UK), so entries written ahead show up on their own day
const TODAY = process.env.PEP_TODAY || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const DAY = DAILY.filter(e => e.date <= TODAY).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0] || DAILY[DAILY.length - 1];

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
// "Last updated" per card: date the entry's content (catalog, EN text, sources, WADA) last changed, kept in tools/zmiany.json
const ZM_FILE = path.join(__dirname, 'zmiany.json');
const ZM = (() => { try { return JSON.parse(fs.readFileSync(ZM_FILE, 'utf8')); } catch (e) { return {}; } })();
for (const e of D) {
  const h = require('crypto').createHash('md5').update(JSON.stringify([e, EN[e.n], (SRC || {})[e.n], (WADA || {})[e.n]])).digest('hex').slice(0, 12);
  const k = key(e);
  if (!ZM[k] || ZM[k].h !== h) ZM[k] = { h, d: TODAY };
}
fs.writeFileSync(ZM_FILE, JSON.stringify(ZM, null, 0).replace(/\},/g, '},\n') + '\n');
const fmtDate = (d, en) => new Date(d + 'T12:00:00Z').toLocaleDateString(en ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const STATS = [['approved', D.filter(e => e.s === 'A').length], ['unapproved', D.filter(e => e.s === 'U').length],
['trials', D.filter(e => e.s === 'P').length], ['other', D.filter(e => !'AUP'.includes(e.s)).length]];

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
const ML_FORM = 'https://assets.mailerlite.com/jsonp/2731773/forms/202148889924470010/subscribe'; // MailerLite „PepSafe signup”, grupa PepSafe
const TT = 'https://www.tiktok.com/@pepsafe.info';
const IG = 'https://www.instagram.com/pepsafe.info/';
// wersja plikow css/js w adresie, zeby telefony nie trzymaly starej kopii po zmianie
const ASSET_V = require('crypto').createHash('md5').update(fs.readFileSync(path.join(__dirname, '..', 'src', 'ruch.js')) + fs.readFileSync(path.join(__dirname, '..', 'src', 'site.css'))).digest('hex').slice(0, 8);
const KOFI = 'https://ko-fi.com/pepsafeinfo';
const FB = 'https://www.facebook.com/1331805220024626';
const ICO_FB = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z"/></svg>';
const ICO_TT = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.6 5.8a5 5 0 0 0 3.5 1.4V10a8.1 8.1 0 0 1-4.5-1.4v6.3a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a5 5 0 0 0 1 3.8Z"/></svg>';
const ICO_IG = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>';
const ORG = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://pepsafe.info/#org',
  name: 'PepSafe', url: 'https://pepsafe.info/', sameAs: [TT, IG, FB]
});

const W = {
  en: {
    nav: { home: 'Home', catalog: 'Substances', groups: 'Groups', faq: 'Questions', alerts: 'Warnings', about: 'About' },
    cta: 'Open catalog', theme: 'Theme', motionOff: 'Stop motion', motionOn: 'Start motion',
    skip: 'Skip to content', srcs: 'Sources', back: 'Catalog',
    foot: 'PepSafe — peptide facts, no sales. Educational content, not medical advice.',
    group: 'Group', wada: 'Anti-doping', wadaNone: 'not listed', seq: 'Sequence',
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
    coHowH: 'How it works', coHow: 'The message goes straight to our inbox. We do not publish it. Your e-mail address is used only to reply.',
    coMed: 'We do not give medical advice or personal dosing recommendations. For health matters, contact your doctor.',
    efH: 'Report a side effect', efLab: 'Report',
    efLead: 'Noticed a worrying symptom after a medicine? Report it to the official system below. This is not medical help.',
    efWarn: 'For an overdose, a severe allergic reaction, chest pain or breathing difficulty call 112 (or your local emergency number) or a poison centre. Do not wait for a reply from us.',
    efSub: 'Substance', efSym: 'Description of the symptom (no personal data)',
    efSev: 'Severity', efSev1: 'Mild', efSev2: 'Moderate', efSev3: 'Severe or worrying',
    efWhen: 'When it happened (e.g. after 2 days)',
    efCons: 'I agree that PepSafe processes the health information in this report to read it and spot safety patterns. I understand it does not replace a doctor, goes only to the site authors and is not published.',
    efSend: 'Send report', efErr: 'Describe the symptom and tick the consent box.',
    efOk: 'Sent. Thank you for the report.',
    efEmerg: 'Sent. With severe symptoms call 112 or your doctor, do not wait for a reply from us.',
    efNote: 'For severe symptoms (breathlessness, severe abdominal pain, facial swelling, fainting) do not write to us: call emergency services.',
    official: 'Report an adverse reaction to the regulator:'
  },
  pl: {
    nav: { home: 'Start', catalog: 'Substancje', groups: 'Grupy', faq: 'Pytania', alerts: 'Ostrzeżenia', about: 'O projekcie' },
    cta: 'Otwórz katalog', theme: 'Motyw', motionOff: 'Zatrzymaj ruch', motionOn: 'Włącz ruch',
    skip: 'Przejdź do treści', srcs: 'Źródła', back: 'Katalog',
    foot: 'PepSafe — fakty o peptydach, bez sprzedaży. Treść edukacyjna, nie porada medyczna.',
    group: 'Grupa', wada: 'Antydoping', wadaNone: 'nie ma na liście', seq: 'Sekwencja',
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
    coHowH: 'Jak to działa', coHow: 'Wiadomość trafia prosto do naszej skrzynki. Nie publikujemy jej. Twój adres e-mail służy tylko do odpowiedzi.',
    coMed: 'Nie udzielamy porad medycznych ani indywidualnych zaleceń dawkowania. W sprawach zdrowia skontaktuj się z lekarzem.',
    efH: 'Zgłoś skutek uboczny', efLab: 'Zgłoszenie',
    efLead: 'Niepokojący objaw po leku? Zgłoś go w oficjalnym systemie poniżej. To nie jest pomoc medyczna.',
    efWarn: 'Przy przedawkowaniu, silnej reakcji alergicznej, bólu w klatce piersiowej lub trudnościach z oddychaniem dzwoń pod 112 albo do centrum zatruć. Nie czekaj na odpowiedź od nas.',
    efSub: 'Substancja', efSym: 'Opis objawu (bez danych osobowych)',
    efSev: 'Nasilenie', efSev1: 'Lekkie', efSev2: 'Umiarkowane', efSev3: 'Silne lub niepokojące',
    efWhen: 'Kiedy wystąpiło (np. po 2 dniach)',
    efCons: 'Zgadzam się, by PepSafe przetwarzał informacje o zdrowiu z tego zgłoszenia, żeby je przeczytać i wychwycić powtarzające się problemy. Rozumiem, że zgłoszenie nie zastępuje lekarza, trafia tylko do autorów strony i nie jest publikowane.',
    efSend: 'Wyślij zgłoszenie', efErr: 'Uzupełnij opis objawu i zaznacz zgodę.',
    efOk: 'Wysłano. Dziękujemy za zgłoszenie.',
    efEmerg: 'Wysłano. Przy silnych objawach zadzwoń pod 112 lub do lekarza, nie czekaj na odpowiedź od nas.',
    efNote: 'Przy nasilonych objawach (duszność, silny ból brzucha, obrzęk twarzy, omdlenie) nie pisz do nas, tylko dzwoń pod 112 lub jedź na pogotowie.',
    official: 'Działanie niepożądane zgłosisz do urzędu:'
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

// desktop menu: the main tabs stay visible, the rest sit under "More" (the phone menu lists everything)
const NAV_MAIN = ['index.html', 'catalog.html', 'steroids.html', 'groups.html', 'compare.html', 'dosing.html', 'symptoms.html'];
function layout(o) {
  const L = o.lang, t = W[L];
  const other = L === 'en' ? 'pl' : 'en';
  const self = o.depth ? o.twin : L + '/' + o.here;   // sciezka strony od korzenia witryny
  const up = BASE + L + '/';                           // odnosniki do stron tego jezyka
  const twinHref = BASE + (o.depth ? (o.twin || '').replace(/(\.pl)?\.html$/, other === 'pl' ? '.pl.html' : '.html')
    : other + '/' + (o.twin || ''));
  const nav = [['index.html', t.nav.home], ['catalog.html', t.nav.catalog], ['steroids.html', L === 'en' ? 'Steroids' : 'Sterydy'], ['dosing.html', t.dosingNav],
  ['groups.html', t.nav.groups], ['compare.html', t.compareNav], ['symptoms.html', t.symptomsNav],
  ['faq.html', t.nav.faq], ['alerts.html', t.nav.alerts], ['blog.html', t.blogNav],
  ['glossary.html', t.glossNav], ['guides.html', L === 'en' ? 'Guides (PDF)' : 'Przewodniki (PDF)'], ['about.html', t.nav.about]];
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
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Sora:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BASE}assets/site.css?v=${ASSET_V}">
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
<meta property="og:image" content="${SITE}${BASE}${o.og || `assets/og-${L}.png`}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${SITE}${BASE}${o.og || `assets/og-${L}.png`}">
<script type="application/ld+json">${ORG}</${'script'}>
${o.ld ? `<script type="application/ld+json">${o.ld}</${'script'}>\n` : ''}</head>
<body>
<a class="skip" href="#main">${esc(t.skip)}</a>
<i class="progress" aria-hidden="true"></i>

<header class="bar">
  <nav class="wrap">
    <a class="brand" href="${up}index.html">${LOGO}<span class="wm" role="img" aria-label="PepSafe">${[...'PepSafe'].map((ch, i) => `<i style="--i:${i}" aria-hidden="true">${ch}</i>`).join('')}</span></a>
    <ul class="links">
      ${nav.filter(([h]) => NAV_MAIN.includes(h)).map(([h, l]) => `<li><a href="${up}${h}"${o.here === h && !o.depth ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('\n      ')}
      <li><details class="nm"><summary>${L === 'en' ? 'More' : 'Więcej'}</summary><ul>${nav.filter(([h]) => !NAV_MAIN.includes(h)).map(([h, l]) => `<li><a href="${up}${h}"${o.here === h && !o.depth ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`).join('')}</ul></details></li>
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
    <p class="menufoot"><a href="${twinHref}">${other.toUpperCase()}</a> · <a href="${TT}" rel="me noopener" target="_blank">TikTok</a> · <a href="${IG}" rel="me noopener" target="_blank">Instagram</a> · <a href="${FB}" rel="me noopener" target="_blank">Facebook</a></p>
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
      <a class="soc" href="${FB}" rel="me noopener" target="_blank">${ICO_FB}<span>Facebook</span></a>
      <a class="soc" href="mailto:${FORM_TO}">${FORM_TO}</a>
      <a class="soc" href="${goUrl('kofi', 'footer')}" rel="noopener" target="_blank">☕ <span>${L === 'en' ? 'Support PepSafe' : 'Wesprzyj PepSafe'}</span></a>
    </p>
    <p><button id="motion" class="linkish" data-off="${esc(t.motionOff)}" data-on="${esc(t.motionOn)}">${esc(t.motionOff)}</button> · <span class="mono">pepsafe.info</span> · <a href="${BASE}${L}/privacy.html">${L === 'en' ? 'Privacy' : 'Prywatność'}</a></p>
  </div>
</footer>

<script src="${BASE}assets/dane-${L}.js" defer></script>
<script src="${BASE}assets/ruch.js?v=${ASSET_V}" defer></script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_BEACON}"}'></script>
</body>
</html>
`;
}

const NST = require('./sterydy.js').finder('en').length;   // steroid entries, counted into the substance totals
// ── homepage copy ─────────────────────────────────────────────────────────────
const H = {
  en: {
    badge: 'Independent · no ads · no affiliates', h1: [`${D.length + NST} substances.`, 'Legal status and evidence.', 'Nothing for sale.'],
    lede: `A reference for peptides, GLP-1 drugs and steroids: what each one is, what the research shows, whether a regulator approved it, and which ones act on the same receptor. No doses for unapproved substances, nothing for sale.`,
    b1: 'Check an overlap', b2: `Browse all ${D.length + NST}`, railTitle: 'Peptide catalog, by status',
    stats: { approved: 'Approved medicines', unapproved: 'Unapproved', trials: 'In clinical trials', other: 'Other statuses' },
    s1kick: '01 — Overlap checker', s1h: 'Two names, one receptor.',
    s1p: 'The most common mistake online is stacking substances that act on the same target. Pick two groups and see whether they collide — with the reason, not just a red light.',
    selA: 'Group A', selB: 'Group B', same: 'Same group — do not combine', diff: 'No shared target found',
    diffWhy: 'These act on different targets, so there is no duplication between them. That is not the same as being safe together: interactions outside a shared receptor are a question for a doctor, not for a chart.',
    ruleKick: 'The rule', rule: ['Same receptor,', 'no added benefit,', 'added risk.'],
    ruleP: 'Doubling a mechanism rarely doubles the benefit, but it can add to the side effects of both.',
    hs: 'Human studies', hsP: 'participants in total, across the three human studies of the most-discussed “research” peptide — none with a control group.',
    ladderKick: 'What “studied” can mean',
    ladder: [['Cells', 'A dish is not a body.'], ['Animals', 'Most results never carry over to people.'], ['A few people', 'Often with no control group.'], ['Real trials', 'Where approval starts.']],
    s2kick: '02 — Peptide of the day', s3kick: '03 — Substances', s3h: 'Status before story.',
    s3p: 'Every entry opens with its legal status, then what the research shows, then what to watch for. Sources are linked. Where the evidence is thin, we say so plainly instead of filling the gap with adjectives.',
    all: `All ${D.length + NST} entries`, s4kick: '04 — Questions', s5kick: '05 — What this is not',
    s5h: 'No shop. No doses from strangers. No promises.',
    not: ['We publish doses only for approved medicines, straight from the label, and only as information — never as a recommendation.',
      'For unapproved substances there is no dose to give. Where human safety is unestablished, that is the finding, not a gap to fill.',
      'Educational content, not medical advice. Decisions about treatment belong with a doctor who knows your case.']
  },
  pl: {
    badge: 'Niezależnie · bez reklam · bez afiliacji', h1: [`${D.length + NST} substancji.`, 'Status prawny i dowody.', 'Niczego nie sprzedajemy.'],
    lede: `Przewodnik po peptydach, lekach GLP-1 i sterydach: czym każda z nich jest, co pokazują badania, czy regulator ją zatwierdził i które działają na ten sam receptor. Bez dawek dla substancji niezatwierdzonych i bez niczego na sprzedaż.`,
    b1: 'Sprawdź dublowanie', b2: `Zobacz wszystkie ${D.length + NST}`, railTitle: 'Katalog peptydów według statusu',
    stats: { approved: 'Zatwierdzone leki', unapproved: 'Niezatwierdzone', trials: 'W badaniach klinicznych', other: 'Pozostałe statusy' },
    s1kick: '01 — Sprawdzarka dublowania', s1h: 'Dwie nazwy, jeden receptor.',
    s1p: 'Najczęstszy błąd w internecie to łączenie substancji działających na ten sam cel. Wybierz dwie grupy i zobacz, czy się pokrywają — razem z powodem, nie samym czerwonym światłem.',
    selA: 'Grupa A', selB: 'Grupa B', same: 'Ta sama grupa — nie łączyć', diff: 'Nie wykryto wspólnego celu',
    diffWhy: 'Działają na inne cele, więc nie ma tu dublowania. To nie znaczy, że są bezpieczne razem: o interakcjach poza wspólnym receptorem decyduje lekarz, nie tabelka.',
    ruleKick: 'Zasada', rule: ['Ten sam receptor,', 'brak dodatkowej korzyści,', 'większe ryzyko.'],
    ruleP: 'Podwojenie mechanizmu rzadko podwaja korzyść, za to może sumować działania niepożądane obu substancji.',
    hs: 'Badania u ludzi', hsP: 'uczestników łącznie w trzech badaniach u ludzi najgłośniejszego peptydu „badawczego” — żadne bez grupy kontrolnej.',
    ladderKick: 'Co może znaczyć „przebadany”',
    ladder: [['Komórki', 'Szalka to nie organizm.'], ['Zwierzęta', 'Większość wyników nie przenosi się na ludzi.'], ['Kilka osób', 'Często bez grupy kontrolnej.'], ['Prawdziwe badania', 'Tu zaczyna się rejestracja.']],
    s2kick: '02 — Peptyd dnia', s3kick: '03 — Substancje', s3h: 'Najpierw status, potem historia.',
    s3p: 'Każdy wpis zaczyna się od statusu prawnego, potem mówi, co pokazują badania, a na końcu na co uważać. Źródła są podlinkowane. Gdzie dowodów jest mało, piszemy to wprost, zamiast zasypywać lukę przymiotnikami.',
    all: `Wszystkie ${D.length + NST} wpisów`, s4kick: '04 — Pytania', s5kick: '05 — Czym to nie jest',
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

// werdykt mitu z danych: f = falsz, p = czesciowo, t = do sprawdzenia
const verdict = (v, en) => v === 'f' ? (en ? 'Myth' : 'Mit') : v === 'p' ? (en ? 'Partly true' : 'Częściowo prawda') : (en ? 'Worth checking' : 'Do sprawdzenia');
// rotacja na glownej: peptyd dnia na zmiane z mitem, trikiem, slowkiem ze slownika i losowa karta katalogu.
// Kolejnosc zalezy od daty, wiec codziennie inna; bez JS widac pierwszy element.
function spotlight(L) {
  const en = L === 'en', i = en ? 1 : 0, seed = +TODAY.replace(/-/g, '');
  const pick = (arr, n) => { const a = arr.slice(); let x = seed; for (let k = a.length - 1; k > 0; k--) { x = (x * 1103515245 + 12345) % 2147483648; const j = x % (k + 1); [a[k], a[j]] = [a[j], a[k]]; } return a.slice(0, n); };
  const de = D.find(x => x.n === DAY.n);
  const dayItem = { k: en ? 'Peptide of the day' : 'Peptyd dnia', t: nm(DAY.n, en), d: (en ? DAY.en : DAY.pl).split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.'), u: de ? BASE + cardPath(de, L) : '' };
  const myths = pick((MYTHS || []).filter(x => Array.isArray(x) && x.length >= 4 && x[2] !== 't'), 6).map(x => ({ k: verdict(x[2], en), t: x[i], d: (x[en ? 4 : 3] || x[3]).split('. ')[0].replace(/\.?$/, '.'), u: `${BASE}${L}/alerts.html` }));
  const tricks = pick((TRICKS || []).filter(x => x && x.t && x.d), 6).map(x => ({ k: en ? 'Marketing trick' : 'Trik marketingowy', t: x.t[i], d: x.d[i].split('. ')[0].replace(/\.?$/, '.'), u: `${BASE}${L}/alerts.html` }));
  const words = pick((GL || []).map(g => (en ? g.en : g.pl)).filter(Boolean), 6).map(g => ({ k: en ? 'Word of the day' : 'Słowo ze słownika', t: g[0], d: g[1], u: `${BASE}${L}/glossary.html` }));
  const cards = pick(D.filter(x => x.n !== DAY.n), 6).map(x => ({ k: en ? 'From the catalog' : 'Z katalogu', t: nm(x.n, en), d: en && EN[x.n] ? EN[x.n][1] : x.c, u: BASE + cardPath(x, L) }));
  const items = [];
  for (let r = 0; r < 6; r++) for (const g of [myths, tricks, words, cards]) { if (g[r]) { items.push(dayItem, g[r]); } }
  if (!items.length) return '';
  const fresh = D.slice(-3).reverse();
  const freshHtml = `<p class="small ink2" style="margin-top:14px"><b>${en ? 'New in the catalog:' : 'Nowe w katalogu:'}</b> ${fresh.map(x => `<a href="${esc(BASE + cardPath(x, L))}">${esc(nm(x.n, en))}</a>`).join(' · ')}</p>`;
  const first = items[1] || items[0];
  const more = en ? 'Read more' : 'Czytaj dalej';
  return `
  <div class="wrap">
    <a class="tile glass spot reveal" id="spot" href="${esc(first.u)}" style="display:block;margin-top:28px;text-decoration:none;color:inherit;transition:opacity .4s" aria-live="polite">
      <p class="kick" id="spot-k">${esc(first.k)}</p>
      <h3 class="gtitle sm" id="spot-t">${esc(first.t)}</h3>
      <p class="small ink2" id="spot-d">${esc(first.d)}</p>
      <p class="small"><b>${esc(more)}</b>${ARROW}</p>
    </a>
    ${freshHtml}
  </div>
  <script>(function(){var I=${JSON.stringify(items).replace(/</g, '\\u003c')},n=1,a=document.getElementById('spot');if(!a||I.length<2)return;
  function show(){var x=I[n%I.length];a.style.opacity=0;setTimeout(function(){document.getElementById('spot-k').textContent=x.k;document.getElementById('spot-t').textContent=x.t;document.getElementById('spot-d').textContent=x.d;if(x.u)a.href=x.u;a.style.opacity=1;},400);n++;}
  var tm=setInterval(show,8000);a.addEventListener('mouseenter',function(){clearInterval(tm)});a.addEventListener('mouseleave',function(){tm=setInterval(show,8000)});})();</script>`;
}
function home(L) {
  const en = L === 'en', t = W[L], h = H[L], day = DAY;
  const faq = FAQ.filter(x => Array.isArray(x) && x[0] && x[1]).slice(0, 4);
  const answers = GROUPS.map(g => `<p class="answer" id="a-${g.id}" hidden><b>${esc(g[L].rule)}</b> ${esc(g[L].why)} <span class="muted">${g.n} ${esc(t.inGroup)}.</span></p>`).join('');
  const opts = sel => GROUPS.map((g, i) => `<option value="${g.id}"${i === sel ? ' selected' : ''}>${esc(g[L].label)}</option>`).join('');

  const body = `
<section id="top" class="hero paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap hero-grid">
    <div>
      <p class="badge reveal">${esc(h.badge)}<i class="dot" aria-hidden="true"></i></p>
      <h1 class="display">${h.h1.map((x, i) => `<span class="reveal${i === 1 ? ' dim' : ''}">${esc(x)}</span>`).join(' ')}</h1>
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
      <ul class="trust reveal"><li><b>${D.length}</b> <span>${en ? 'entries' : 'wpisów'}</span></li><li><b>${require('./sterydy.js').finder('en').length}</b> <span>${en ? 'steroids' : 'sterydów'}</span></li><li><b>3</b> <span>${en ? 'languages' : 'języki'}</span></li><li><span>${en ? 'Sources on every page' : 'Źródła przy każdej stronie'}</span></li></ul>
    </div>
    <aside class="rail">
      <p class="kick reveal">${esc(h.railTitle)}</p>
      <dl>${STATS.map(([k, n]) => `<div class="rail-row reveal"><dt>${esc(h.stats[k])}</dt><dd class="num"><span data-count="${n}">${n}</span></dd></div>`).join('')}</dl>
    </aside>
  </div>
</section>

<section class="field" style="padding-top:0">
  <div class="wrap">
    <p class="kick reveal">${en ? 'Popular' : 'Popularne'}</p>
    <p class="chips reveal">${[['retatrutide', 0], ['tirzepatide', 0], ['semaglutide', 0], ['bpc-157', 0], ['tb-500', 0], ['testosterone', 1], ['oxandrolone', 1]].map(([k, st]) => {
      if (st) { const r = require('./sterydy.js').finder(L).find(x => x.s === 's-' + k); return r ? `<a class="chip" href="${BASE}${L}/t/${r.s}.html">${esc(r.n)}</a>` : ''; }
      const e = D.find(x => key(x) === k); return e ? `<a class="chip" href="${BASE}${cardPath(e, L)}">${esc(nm(e.n, en))}</a>` : '';
    }).join('')}</p>
    <a class="promo reveal" href="${BASE}${L}/steroids.html">
      <span><b>🆕 ${en ? 'Steroids: what they are and what they do to the body' : 'Sterydy: czym są i co robią z organizmem'}</b><br><span class="small ink2">${en ? 'Advantages and disadvantages for each one, a comparison table and plain-language articles on risks and the law' : 'Zalety i wady każdego, tabela porównawcza i artykuły o ryzyku i prawie prostym językiem'}</span></span>
      <span class="btn">${en ? 'Open the section' : 'Otwórz sekcję'}${ARROW}</span>
    </a>
  </div>
</section>

<section class="field" style="padding-top:0">
  <div class="wrap">
    <p class="kick reveal">${en ? 'Who this is for' : 'Dla kogo to jest'}</p>
    <div class="grid-cards">
      <a class="card tile reveal piece" href="${BASE}${L}/groups.html"><span><em class="kick">GLP-1</em><b>${en ? 'You take or are thinking about a GLP-1 medicine' : 'Bierzesz lek GLP-1 albo o nim myślisz'}</b><em>${en ? 'See which names are the same drug and which should never be mixed' : 'Zobacz, które nazwy to ten sam lek i których nie wolno łączyć'}</em></span>${ARROW}</a>
      <a class="card tile reveal piece" href="${BASE}${L}/steroids.html"><span><em class="kick">${en ? 'Sport' : 'Sport'}</em><b>${en ? 'You hear about steroids or peptides in the gym' : 'Słyszysz o sterydach lub peptydach na siłowni'}</b><em>${en ? 'Plain facts on what they do, the risks and the law' : 'Fakty prostym językiem: co robią, jakie ryzyko i co mówi prawo'}</em></span>${ARROW}</a>
      <a class="card tile reveal piece" href="${BASE}${L}/symptoms.html"><span><em class="kick">${en ? 'Safety' : 'Bezpieczeństwo'}</em><b>${en ? 'You want to check a symptom or a warning' : 'Chcesz sprawdzić objaw albo ostrzeżenie'}</b><em>${en ? 'Search side effects and see what regulators have warned about' : 'Wyszukaj skutki uboczne i ostrzeżenia organów nadzoru'}</em></span>${ARROW}</a>
    </div>
  </div>
</section>

<section class="field" style="padding-top:0">
  <div class="wrap">
    <a class="reveal" href="${BASE}${L}/guides.html" style="display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;border:2px solid #3CCFA9;border-radius:14px;padding:16px 20px;text-decoration:none;color:inherit">
      <span><b>📘 ${en ? 'On GLP-1 medicines? Our plain-English PDF guides' : 'Przyjmujesz lek GLP-1? Nasze przewodniki PDF (po angielsku)'}</b><br><span class="small ink2">${en ? 'Safety Guide £5.99 · Protein &amp; Muscle £9.99 · sources on every page' : 'Bezpieczeństwo £5.99 · Białko i mięśnie £9.99 · źródła na każdej stronie'}</span></span>
      <span class="btn">${en ? 'See inside' : 'Zobacz podgląd'}${ARROW}</span>
    </a>
    <p class="small ink2 reveal" style="margin-top:10px">${en ? 'The catalog stays free and ad-free.' : 'Katalog zostaje darmowy i bez reklam.'} <a href="${goUrl('kofi', 'home')}" rel="noopener">${en ? 'Buy us a coffee ☕' : 'Postaw nam kawę ☕'}</a></p>
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
  ${spotlight(L)}
</section>
${mostRead(L)}
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

<section id="guides" class="band gband">
  <div class="wrap gpromo">
    <a class="gthumb" href="${goUrl('guide', 'home')}" rel="noopener"><img src="${BASE}guides/safety-1.jpg" alt="${esc(en ? 'The GLP-1 Safety Guide, preview of page 1' : 'Przewodnik bezpieczeństwa GLP-1, podgląd strony 1')}" width="150" height="212" loading="lazy"></a>
    <div>
      <p class="kick reveal">${en ? 'Guides' : 'Przewodniki (po angielsku)'}</p>
      <h2 class="display sm reveal">${en ? 'Taking a GLP-1 medicine? Read this first.' : 'Przyjmujesz lek GLP-1? Przeczytaj to najpierw.'}</h2>
      <p class="lead reveal">${en ? 'Two plain-English PDF guides built from official labels and clinical trials: side effects, warnings, protein and muscle. Instant download.' : 'Dwa przystępne przewodniki PDF oparte na etykietach i badaniach: skutki uboczne, ostrzeżenia, białko i mięśnie. Natychmiastowe pobranie.'}</p>
      <p class="actions reveal"><a class="btn" href="${goUrl('guide', 'home')}" rel="noopener">${en ? 'Safety guide — £5.99' : 'Przewodnik bezpieczeństwa — £5.99'}${ARROW}</a>
      <a class="btn ghost" href="${goUrl('muscle', 'home')}" rel="noopener">${en ? 'Muscle guide — £9.99' : 'Przewodnik o mięśniach — £9.99'}</a>
      <a class="btn ghost" href="${BASE}${L}/free.html">${en ? 'Free checklist' : 'Darmowa checklista'}</a></p>
      <p class="small ink2 reveal"><a href="${BASE}${L}/guides.html">${en ? 'See inside both guides' : 'Zobacz podgląd obu przewodników'}${ARROW}</a></p>
    </div>
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
    title: en ? 'PepSafe — peptide facts, no sales' : 'PepSafe — fakty o peptydach, bez sprzedaży',
    desc: en ? `Independent reference to ${D.length} peptides: legal status, what the research shows and which act on the same receptor. No peptides for sale, no affiliates.` : `Niezależny przewodnik po ${D.length} peptydach: status prawny, co pokazują badania i które działają na ten sam receptor. Nie sprzedajemy peptydów, bez afiliacji.`
  });
}

// ── catalog ───────────────────────────────────────────────────────────────────
function catalog(L) {
  const en = L === 'en', t = W[L];
  const STERR = require('./sterydy.js').finder(L);
  const statuses = [...new Set(D.map(e => e.s))];
  const isGlp = e => { const f = famOf(e); return !!(f && f.id === 'glp1'); };
  const sorted = D.slice().sort((a, b) => nm(a.n, en).localeCompare(nm(b.n, en), en ? 'en' : 'pl'));
  const nGlp = D.filter(isGlp).length, nPep = D.length - nGlp, nSt = STERR.length;
  const star = k => `<button class="star" data-key="${k}" aria-label="${esc(t.save)}" title="${esc(t.save)}">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 2.6l2.2 4.5 5 .7-3.6 3.5.9 4.9L10 14l-4.5 2.2.9-4.9L2.8 7.8l5-.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>`;
  const pepRow = e => `<div class="entry tile" data-t="${isGlp(e) ? 'glp1' : 'pep'}" data-s="${e.s}" data-n="${esc((nm(e.n, en) + ' ' + (e.a || '') + ' ' + e.n).toLowerCase())}">
        <a class="entry-link" href="${BASE}${cardPath(e, L)}">
          <span class="pill ${toneOf(e)}">${esc(statusOf(e, en))}</span>
          <b>${esc(nm(e.n, en))}</b>
          <em>${esc(en && EN[e.n] ? EN[e.n][1] : e.c)}</em>
        </a>${star(key(e))}
      </div>`;
  const stRow = r => `<div class="entry tile" data-t="ster" data-s="ster" data-n="${esc(r.t)}">
        <a class="entry-link" href="${BASE}${L}/t/${r.s}.html">
          <span class="pill warn">${esc(r.st)}</span>
          <b>${esc(r.n)}</b>
          <em>${esc(r.c)}</em>
        </a>
      </div>`;
  const all = sorted.map(pepRow).concat(STERR.slice().sort((a, b) => a.n.localeCompare(b.n, en ? 'en' : L)).map(stRow));
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.catalog)}</p>
    <h1 class="display reveal">${en ? 'Every substance, with its status.' : 'Każda substancja, razem ze statusem.'}</h1>
    <p class="lede reveal">${en ? `${D.length + nSt} substances: GLP-1 drugs, other peptides and steroids. What each one is, what the research shows, side effects and whether any regulator approved it.` : `${D.length + nSt} substancji: leki GLP-1, inne peptydy i sterydy. Czym jest każda, co pokazują badania, jakie ma skutki uboczne i czy jakikolwiek regulator ją zatwierdził.`}</p>
    <p class="herofind reveal">
      <button type="button" class="findfake" data-find>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12.9 12.9 17 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <span>${esc(t.findPh)}</span>
      </button>
    </p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="filters reveal">
      <label class="search"><span class="sr">${esc(t.search)}</span>
        <input id="q" type="search" placeholder="${esc(t.search)}" autocomplete="off"></label>
      <div class="chips" id="tchips">
        <button class="chip on" data-t="">${esc(t.filterAll)} <span class="num">${D.length + nSt}</span></button>
        <button class="chip" data-t="glp1">${en ? 'GLP-1 drugs' : 'Leki GLP-1'} <span class="num">${nGlp}</span></button>
        <button class="chip" data-t="pep">${en ? 'Peptides &amp; others' : 'Peptydy i inne'} <span class="num">${nPep}</span></button>
        <button class="chip" data-t="ster">${en ? 'Steroids' : 'Sterydy'} <span class="num">${nSt}</span></button>
      </div>
      <div class="chips" id="chips">
        <button class="chip on" data-s="">${esc(en ? 'Any status' : 'Dowolny status')}</button>
        ${statuses.map(s => `<button class="chip" data-s="${s}">${esc(en ? (ST_EN[s] || s) : (ST[s] || s))} <span class="num">${D.filter(e => e.s === s).length}</span></button>`).join('')}
      </div>
    </div>
    <p id="nohit" class="muted" hidden>${esc(t.noHit)}</p>
    <div class="grid-cards" id="list">
      ${all.join('')}
    </div>
  </div>
</section>`;
  return layout({
    lang: L, here: 'catalog.html', twin: 'catalog.html', body,
    title: (en ? `Substances: ${D.length} peptides and drugs, ${nSt} steroids` : `Substancje: ${D.length} peptydów i leków, ${nSt} sterydów`) + ' | PepSafe',
    desc: en ? `All ${D.length + nSt} entries with legal status, mechanism, evidence and side effects.` : `Wszystkie ${D.length + nSt} wpisów ze statusem prawnym, mechanizmem, dowodami i skutkami ubocznymi.`
  });
}

// ── substance card ────────────────────────────────────────────────────────────

// przewodnik PDF (sprzedaz przez Ko-fi): ramka na kartach lekow z rodziny GLP-1
const GUIDE_URL = 'https://ko-fi.com/s/6d19973042';
const MUSCLE_URL = 'https://ko-fi.com/s/424db783e5';
// every buy / support link goes through /go/<product>-<place>.html, a tiny page that counts the click and forwards to Ko-fi
const GO = {};
const goUrl = (kind, place) => { const url = { guide: GUIDE_URL, muscle: MUSCLE_URL, kofi: KOFI }[kind]; GO[kind + '-' + place] = url; return BASE + 'go/' + kind + '-' + place + '.html'; };
function guideBox(e, en, L) {
  if (!/GLP-1|GIP/.test((EN[e.n] || [])[1] || '')) return '';
  const g = x => (x[L] || x.en);
  return `<section class="blk reveal gbox">
  <a class="gthumb" href="${goUrl('guide', 'card')}" rel="noopener"><img src="${BASE}guides/safety-1.jpg" alt="${esc(g({ en: 'The GLP-1 Safety Guide, preview of page 1', pl: 'Przewodnik bezpieczeństwa GLP-1, podgląd strony 1' }))}" width="150" height="212" loading="lazy"></a>
  <div>
    <h2 class="kick">${esc(g({ en: 'The GLP-1 Safety Guide', pl: 'Przewodnik bezpieczeństwa GLP-1 (po angielsku)' }))}</h2>
    <p>${esc(g({ en: '23 pages in plain English: side effects and how often they happen, label warnings, surgery, pregnancy, protein and muscle, stopping, spotting fakes. Sources from MHRA, EMA and FDA.', pl: '23 strony napisane zrozumiale: skutki uboczne i ich częstość, ostrzeżenia z etykiet, zabiegi, ciąża, białko i mięśnie, odstawienie, podróbki. Źródła MHRA, EMA i FDA.' }))}</p>
    <p class="actions"><a class="btn" href="${goUrl('guide', 'card')}" rel="noopener">${esc(g({ en: 'Get the PDF — £5.99', pl: 'Pobierz PDF — £5.99' }))}${ARROW}</a>
    <a class="btn ghost" href="${BASE}${L}/free.html">${esc(g({ en: 'Free checklist', pl: 'Darmowa checklista' }))}</a></p>
    <p class="small ink2">${esc(g({ en: 'Also: Protein & Muscle on GLP-1 — protein calculator, 7-day meal plan, home workouts.', pl: 'Także: Białko i mięśnie przy GLP-1: kalkulator białka, 7-dniowy plan posiłków, trening w domu.' }))}
    <a href="${goUrl('muscle', 'card')}" rel="noopener">${esc(g({ en: 'Get it — £9.99', pl: 'Pobierz — £9.99' }))}</a> · <a href="${BASE}${L}/guides.html">${esc(g({ en: 'See inside both guides', pl: 'Zobacz podgląd obu przewodników' }))}</a></p>
  </div>
</section>`;
}

// ── darmowa checklista za zapis na liste mailowa (FormSubmit -> contact@), polityka prywatnosci ──
const CHECKLIST = 'free/glp1-muscle-checklist.pdf';
function freePage(L) {
  const en = L === 'en';
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${en ? 'Free checklist' : 'Darmowa checklista (po angielsku)'}</p>
    <h1 class="display reveal">${en ? '5 mistakes that cost you muscle on GLP-1 medicines' : '5 błędów, przez które tracisz mięśnie na lekach GLP-1'}</h1>
    <p class="lede reveal">${en ? 'One page, plain English, with a simple fix for each mistake. Join our free weekly email — short research summaries and safety updates on peptides and GLP-1 medicines — and get the checklist straight away.' : 'Jedna strona, prosty język, przy każdym błędzie prosta poprawka. Zapisz się na darmowy cotygodniowy e-mail — krótkie podsumowania badań i ostrzeżeń o peptydach i lekach GLP-1 — a checklistę dostaniesz od razu.'}</p>
    <form class="sheet reveal" id="nlForm" method="POST" action="https://formsubmit.co/${FORM_TO}" data-next="${BASE}${L}/free-thanks.html" data-ml="${ML_FORM}">
      <input type="hidden" name="_subject" value="PepSafe: newsletter signup (${L})">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_next" value="${SITE}${BASE}${L}/free-thanks.html">
      <input type="hidden" name="list" value="newsletter">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="frow"><label for="nlEmail">${en ? 'Your email' : 'Twój e-mail'}</label><input type="email" id="nlEmail" name="email" autocomplete="email" maxlength="120" required></p>
      <p class="check"><label><input type="checkbox" name="consent" value="yes" required> <span>${en ? 'Yes, send me the weekly PepSafe email. I can unsubscribe at any time. See our' : 'Tak, wysyłajcie mi cotygodniowy e-mail PepSafe. Mogę się wypisać w każdej chwili. Zobacz'} <a href="privacy.html">${en ? 'privacy policy' : 'politykę prywatności'}</a>.</span></label></p>
      <p class="formfoot"><button class="btn big" type="submit" data-busy="${en ? 'Sending…' : 'Wysyłanie…'}">${en ? 'Send me the checklist' : 'Wyślij checklistę'}${ARROW}</button></p>
      <p class="formmsg" id="nlOut" role="status" hidden></p>
    </form>
    <p class="small ink2 reveal">${en ? 'No spam, no sales of medicines or peptides. One email a week at most.' : 'Bez spamu i bez sprzedaży leków czy peptydów. Najwyżej jeden e-mail w tygodniu.'}</p>
  </div>
</section>`;
  return layout({ lang: L, here: 'free.html', twin: 'free.html', body,
    title: (en ? 'Free checklist: 5 mistakes that cost you muscle on GLP-1' : 'Darmowa checklista: 5 błędów przy GLP-1') + ' | PepSafe',
    desc: en ? 'Free one-page checklist: five habits that cost you muscle on semaglutide or tirzepatide, and the simple fix for each.' : 'Darmowa checklista: pięć nawyków, przez które tracisz mięśnie na lekach GLP-1, i prosta poprawka dla każdego.' });
}
function freeThanks(L) {
  const en = L === 'en';
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${en ? 'You are in' : 'Gotowe'}</p>
    <h1 class="display reveal">${en ? 'Thank you — here is your checklist' : 'Dziękujemy — oto Twoja checklista'}</h1>
    <p class="actions reveal"><a class="btn big" href="${BASE}${CHECKLIST}" download>${en ? 'Download the checklist (PDF)' : 'Pobierz checklistę (PDF)'}${ARROW}</a></p>
    <p class="notice reveal">${en ? 'Our weekly email comes from <b>contact@pepsafe.info</b>. Add it to your contacts, and if the first one lands in spam or Promotions, mark it “Not spam” so the next ones reach your inbox.' : 'Nasz cotygodniowy e-mail przychodzi z adresu <b>contact@pepsafe.info</b>. Dodaj go do kontaktów, a jeśli pierwszy trafi do spamu lub Ofert, oznacz go „To nie spam”, żeby kolejne trafiały do skrzynki odbiorczej.'}</p>
    <p class="lede reveal">${en ? 'Want the full plan? Protein targets, a 7-day meal plan, a 12-week home routine, a protein calculator and a printable tracker.' : 'Chcesz pełny plan? Cele białkowe, 7-dniowy plan posiłków, 12-tygodniowy trening w domu, kalkulator białka i dzienniczek.'}</p>
    <p class="actions reveal"><a class="btn ghost big" href="${goUrl('muscle', 'thanks')}" rel="noopener">${en ? 'Protein &amp; Muscle on GLP-1 — £9.99' : 'Białko i mięśnie przy GLP-1 — £9.99'}${ARROW}</a></p>
  </div>
</section>`;
  return layout({ lang: L, here: 'free-thanks.html', twin: 'free-thanks.html', body, noindex: true,
    title: (en ? 'Your checklist' : 'Twoja checklista') + ' | PepSafe', desc: en ? 'Download your checklist.' : 'Pobierz checklistę.' });
}
// strona z przewodnikami: podglad stron, prawdziwe sygnaly zaufania, (bez zmyslonych opinii)
function guidesPage(L) {
  const en = L === 'en';
  const card = (url, price, title, what, list, imgs) => `
<section class="blk reveal" style="border:2px solid #3CCFA9;border-radius:14px;padding:18px 20px;margin-top:22px">
  <h2>${title}</h2>
  <p>${what}</p>
  <div style="display:flex;gap:10px;overflow-x:auto;padding:6px 0 10px">${imgs.map(i => `<img src="${BASE}guides/${i}.jpg" alt="${en ? 'Preview page' : 'Podgląd strony'}" loading="lazy" style="height:260px;width:auto;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.15);flex:none">`).join('')}</div>
  <ul>${list.map(x => `<li>${x}</li>`).join('')}</ul>
  <p><a class="btn big" href="${url}" rel="noopener">${en ? 'Get it' : 'Pobierz'} — ${price}${ARROW}</a></p>
</section>`;
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${en ? 'PepSafe guides' : 'Przewodniki PepSafe (po angielsku)'}</p>
    <h1 class="display reveal">${en ? 'Plain-English guides for people on GLP-1 medicines' : 'Przystępne przewodniki dla osób przyjmujących leki GLP-1'}</h1>
    <p class="lede reveal">${en ? 'Built from official labels, regulators and the major clinical trials — with sources on every page. Instant PDF download.' : 'Oparte na etykietach, zaleceniach regulatorów i dużych badaniach klinicznych — ze źródłami na każdej stronie. PDF do pobrania od razu.'}</p>
    <ul class="reveal small">
      <li>${en ? 'Sources: MHRA, EMA, FDA labels, STEP and SURMOUNT trials, WHO and NHS guidance' : 'Źródła: MHRA, EMA, etykiety FDA, badania STEP i SURMOUNT, zalecenia WHO i NHS'}</li>
      <li>${en ? 'Independent: no ads, and we never sell medicines or peptides' : 'Niezależne: bez reklam, nie sprzedajemy leków ani peptydów'}</li>
      <li>${en ? 'Updated October 2026' : 'Aktualizacja: październik 2026'}</li>
    </ul>
    ${card(goUrl('guide', 'guides'), '£5.99', 'The GLP-1 Safety Guide', en ? '23 pages: what to expect, what to watch for and what to ask your doctor.' : '23 strony: czego się spodziewać, na co uważać i o co pytać lekarza.',
      en ? ['Side effects and how often they really happen', 'Label warnings: pancreas, gallbladder, kidneys, eyes', 'Surgery, other medicines, pregnancy', 'Stopping and the long term; spotting fakes', 'Appointment checklist and pocket cheat sheet']
         : ['Skutki uboczne i jak często naprawdę występują', 'Ostrzeżenia z etykiet: trzustka, woreczek, nerki, oczy', 'Zabiegi, inne leki, ciąża', 'Odstawienie i długi termin; podróbki', 'Lista pytań do lekarza i ściąga'], ['safety-1', 'safety-2', 'safety-3'])}
    ${card(goUrl('muscle', 'guides'), '£9.99', 'Protein &amp; Muscle on GLP-1', en ? '21-page guide + protein calculator + printable weekly tracker.' : '21 stron + kalkulator białka + dzienniczek do druku.',
      en ? ['Your personal protein target in 2 minutes', '7-day meal plan with vegetarian swaps', '20-minute home strength routine, no gym', '12-week progression plan', 'Older adults, bones and balance']
         : ['Twój cel białkowy w 2 minuty', '7-dniowy plan posiłków z wersją wegetariańską', '20-minutowy trening siłowy w domu', '12-tygodniowy plan postępów', 'Starsi dorośli, kości i równowaga'], ['muscle-1', 'muscle-2', 'muscle-3'])}
    <p class="small ink2 reveal" style="margin-top:22px">${en ? 'Educational information only — not medical advice and no dosing instructions. Bought a guide? Tell us what you think at ' + FORM_TO + '.' : 'Informacje edukacyjne — nie porada medyczna i bez instrukcji dawkowania. Masz już przewodnik? Napisz nam, co o nim sądzisz: ' + FORM_TO + '.'}</p>
    <p class="reveal"><a href="free.html">${en ? 'Not ready? Get the free one-page checklist first' : 'Nie teraz? Weź najpierw darmową checklistę'}${ARROW}</a></p>
  </div>
</section>`;
  return layout({ lang: L, here: 'guides.html', twin: 'guides.html', body,
    title: (en ? 'GLP-1 guides: safety, protein and muscle' : 'Przewodniki GLP-1: bezpieczeństwo, białko i mięśnie') + ' | PepSafe',
    desc: en ? 'Plain-English PDF guides for people on semaglutide or tirzepatide: safety guide and protein & muscle guide, with preview pages.' : 'Przewodniki PDF dla osób na lekach GLP-1: bezpieczeństwo oraz białko i mięśnie, z podglądem stron.' });
}
function privacy(L) {
  const en = L === 'en';
  const S = en ? [
    ['Who we are', 'PepSafe (pepsafe.info) is an independent educational website about peptides, GLP-1 medicines and related hormonal and anabolic drugs. Contact: ' + FORM_TO + '.'],
    ['What we collect', 'If you join our email list, we collect your email address and the date of your consent. If you use the contact form, email us or message us, we keep what you send. We do not ask for health records and you should not send them.'],
    ['Why', 'To send you the weekly PepSafe email and the free checklist (legal basis: your consent), and to answer messages you send us.'],
    ['Who processes it', 'Messages from the contact form are passed to our inbox by the form service Web3Forms. Our email list is hosted by MailerLite (UAB MailerLite, Lithuania, EU), which stores your email address and consent date and sends our emails on our behalf. Purchases on Ko-fi are handled by Ko-fi and PayPal/Stripe under their own privacy policies; we receive only what they share with sellers.'],
    ['Analytics', 'We count visits with Cloudflare Web Analytics, which does not use cookies and does not track you across websites.'],
    ['How long', 'We keep your email until you unsubscribe or ask us to delete it. Messages are kept only as long as needed to reply.'],
    ['Your rights', 'You can unsubscribe at any time with the link in every email, or ask us to see, correct or delete your data by writing to ' + FORM_TO + '.'],
    ['No sales of data', 'We never sell or rent your data, and we do not sell medicines or peptides.']
  ] : [
    ['Kim jesteśmy', 'PepSafe (pepsafe.info) to niezależna strona edukacyjna o peptydach, lekach GLP-1 oraz pokrewnych lekach hormonalnych i anabolicznych. Kontakt: ' + FORM_TO + '.'],
    ['Co zbieramy', 'Jeśli zapiszesz się na listę mailową — Twój adres e-mail i datę zgody. Jeśli użyjesz formularza kontaktowego, napiszesz mailem lub wiadomością — to, co wyślesz. Nie prosimy o dokumentację medyczną i nie wysyłaj jej.'],
    ['Po co', 'Żeby wysyłać cotygodniowy e-mail PepSafe i darmową checklistę (podstawa: Twoja zgoda) oraz odpowiadać na wiadomości.'],
    ['Kto przetwarza', 'Wiadomości z formularza kontaktowego przekazuje do naszej skrzynki usługa formularzy Web3Forms. Listę mailową prowadzi MailerLite (UAB MailerLite, Litwa, UE): przechowuje Twój adres i datę zgody i wysyła w naszym imieniu e-maile. Zakupy na Ko-fi obsługują Ko-fi i PayPal/Stripe według własnych zasad prywatności.'],
    ['Statystyki', 'Odwiedziny liczymy przez Cloudflare Web Analytics, bez ciasteczek i bez śledzenia między stronami.'],
    ['Jak długo', 'Adres trzymamy, dopóki się nie wypiszesz albo nie poprosisz o usunięcie. Wiadomości tylko tak długo, jak trzeba, by odpowiedzieć.'],
    ['Twoje prawa', 'Możesz wypisać się w każdej chwili linkiem w każdym e-mailu albo poprosić o wgląd, poprawienie lub usunięcie danych pod adresem ' + FORM_TO + '.'],
    ['Bez sprzedaży danych', 'Nigdy nie sprzedajemy ani nie udostępniamy Twoich danych i nie sprzedajemy leków ani peptydów.']
  ];
  const body = `
<section class="page-head paper"><div class="wrap narrow">
  <p class="kick reveal">PepSafe</p>
  <h1 class="display reveal">${en ? 'Privacy policy' : 'Polityka prywatności'}</h1>
  ${S.map(([h, b]) => `<section class="blk reveal"><h2 class="kick">${esc(h)}</h2><p>${esc(b)}</p></section>`).join('\n  ')}
  <p class="small ink2">${en ? 'Last updated: October 2026.' : 'Ostatnia aktualizacja: październik 2026.'}</p>
</div></section>`;
  return layout({ lang: L, here: 'privacy.html', twin: 'privacy.html', body,
    title: (en ? 'Privacy policy' : 'Polityka prywatności') + ' | PepSafe', desc: en ? 'How PepSafe handles your data.' : 'Jak PepSafe przetwarza Twoje dane.' });
}
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
    <p class="crumbs reveal"><a href="/${L}/catalog.html">${esc(t.back)}</a> › <span>${esc(name)}</span></p>
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
          ${wa ? (wa[1] === 'none' ? `<span class="pill">${esc(t.wada)}: ${esc(t.wadaNone)}</span>` : `<span class="pill warn">${esc(t.wada)}: ${esc(wa[0])}</span>`) : ''}
        </p>
      </div>
      ${f ? `<aside class="group-box tile glass reveal">
        <p class="kick">${esc(t.group)}</p>
        <p class="gname">${esc(en ? ((FAMS_EN[f.id] || [])[0] || f.lab) : f.lab)}</p>
        <p class="small ink2">${esc(en ? ((FAMS_EN[f.id] || [])[1] || f.t) : f.t)}</p>
        <a class="more" href="/${L}/groups.html#${f.id}">${esc(t.group)}${ARROW}</a>
      </aside>` : ''}
    </div>

    ${sec(t.what, d)}${sec(t.how, m)}${sec(t.use, u)}${sec(t.ev, ev)}${(() => { const o = (OPISY[e.n] || {})[L] || (OPISY[e.n] || {}).en; return o && o.length ? `<section class="blk reveal"><h2 class="kick">${en ? 'In depth' : 'Więcej szczegółów'}</h2>${o.map(x => `<p>${esc(x)}</p>`).join('')}</section>` : ''; })()}${guideBox(e, en, L)}
    ${(() => { const pc = PLUS[e.n]; if (!pc) return ''; const li = a => (a[L] || a.en || []).map(x => `<li>${esc(x)}</li>`).join(''); return `<section class="blk reveal pcgrid"><div class="pc"><h2 class="kick">${en ? 'Advantages' : 'Zalety'}</h2><ul class="srcs-list">${li(pc.pros)}</ul></div><div class="pc"><h2 class="kick">${en ? 'Disadvantages' : 'Wady'}</h2><ul class="srcs-list">${li(pc.cons)}</ul></div></section>`; })()}
    ${SKUTKI.html(e.n, L, esc)}
    ${w ? `<section class="blk note reveal"><h2 class="kick">${esc(t.care)}</h2><p>${esc(w)}</p></section>` : ''}
    ${wa ? `<section class="blk reveal"><h2 class="kick">${esc(t.wada)}</h2><p>${en
      ? esc(t.listedWada + ' ' + wa[0] + (wa[1] === 'always' ? t.always : '') + '.')
      : esc(wa[2] || (t.listedWada + ' ' + wa[0] + '.'))} <a href="${WADA_URL}" rel="nofollow noopener" target="_blank">WADA</a></p></section>` : ''}
    ${e.q ? `<section class="blk reveal"><h2 class="kick">${esc(t.seq)}</h2><p class="seq">${esc(e.q)}</p></section>` : ''}
    ${(() => {
      // every card also gets searches in PubMed and ClinicalTrials.gov (idea from the owner's data package, 27.10),
      // plus a note that a search result is not evidence; EMA and accessdata.fda.gov block automated checks, so they are left out
      const term = encodeURIComponent((EN[e.n] || [])[0] || e.n);
      const all = src.slice();
      if (!all.some(x => /pubmed\.ncbi/.test(x[1]))) all.push([en ? 'PubMed: scientific publications' : 'PubMed: publikacje naukowe', 'https://pubmed.ncbi.nlm.nih.gov/?term=' + term]);
      if (!all.some(x => /clinicaltrials\.gov/.test(x[1]))) all.push([en ? 'ClinicalTrials.gov: registered clinical trials' : 'ClinicalTrials.gov: zarejestrowane badania kliniczne', 'https://clinicaltrials.gov/search?term=' + term]);
      return `<section class="blk reveal"><h2 class="kick">${esc(t.srcs)}</h2><ul class="srcs-list">${all.map(s => `<li><a href="${esc(s[1])}" rel="nofollow noopener" target="_blank">${esc(s[0])}</a></li>`).join('')}</ul><p class="small muted">${en ? 'Search links show what is published or registered for this name. A result alone does not prove efficacy, safety or approval.' : 'Linki wyszukiwania pokazują, co opublikowano lub zarejestrowano pod tą nazwą. Sam wynik nie dowodzi skuteczności, bezpieczeństwa ani zatwierdzenia.'}</p></section>`;
    })()}
    ${ZM[key(e)] ? `<p class="small muted reveal">${en ? 'Last updated' : 'Ostatnia aktualizacja'}: <time datetime="${ZM[key(e)].d}">${fmtDate(ZM[key(e)].d, en)}</time> · <a href="../${L}/about.html#corrections">${en ? 'Report an error' : 'Zgłoś błąd'}</a></p>` : ''}
    ${(() => { const qs = cardQs(e, en); return `<section class="blk reveal"><h2 class="kick">${en ? 'Common questions' : 'Częste pytania'}</h2>${qs.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`; })()}
    ${(() => { const arts = articlesFor(e), vs = VS.filter(v => v.includes(e)); return arts.length || vs.length ? `<section class="blk reveal"><h2 class="kick">${en ? 'Further reading' : 'Więcej do czytania'}</h2><ul class="srcs-list">${vs.map(v => `<li><a href="../${L}/${vsFile(v)}">${esc(nm(v[0].n, en) + ' vs ' + nm(v[1].n, en))}</a></li>`).join('')}${arts.map(x => `<li><a href="../${L}/t/${postSlug(x)}.html">${esc(x.title[L] || x.title.en)}</a></li>`).join('')}</ul></section>` : ''; })()}
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
    title: `${name} — ${statusOf(e, en)} | PepSafe`, desc: clip(`${name} — ${statusOf(e, en)}. ${d}`, 155),
    og: fs.existsSync(path.join(root, 'og', key(e) + '.png')) ? 'og/' + key(e) + '.png' : null,   // own share image for the most-read entries
    ld: JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'MedicalWebPage', name: `${name} — ${statusOf(e, en)}`, url: `${SITE}${BASE}${cardPath(e, L)}`, inLanguage: L,
        description: clip(d, 300), publisher: { '@id': 'https://pepsafe.info/#org' },
        ...(ZM[key(e)] ? { dateModified: ZM[key(e)].d } : {}),
        about: { '@type': e.s === 'A' ? 'Drug' : 'ChemicalSubstance', name, description: clip(d, 300) },
        ...(src.length ? { citation: src.map(x => x[1]) } : {}) },
      { '@type': 'FAQPage', mainEntity: cardQs(e, en).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.back, item: `${SITE}${BASE}${L}/catalog.html` },
        { '@type': 'ListItem', position: 2, name } ] }
    ] }).replace(/</g, '\\u003c')
  });
}

const postSlug = x => slug(x.title.en || x.title.pl);
// Questions people type into search, answered only with this entry's own fields
function cardQs(e, en) {
  const tr = EN[e.n] || [], name = nm(e.n, en);
  const g = i => en ? (tr[i] || [0, 0, e.d, e.m, e.u, e.ev, e.w][i]) : [0, 0, e.d, e.m, e.u, e.ev, e.w][i];
  return [
    [en ? `Is ${name} approved?` : `${name}: czy jest zatwierdzony?`, `${statusOf(e, en)}. ${g(4) || ''}`.trim()],
    [en ? `How does ${name} work?` : `${name}: jak działa?`, g(3)],
    [en ? `What does the research on ${name} show?` : `${name}: co pokazują badania?`, g(5)],
    [en ? `What are the risks and side effects of ${name}?` : `${name}: jakie są ryzyka i działania niepożądane?`, g(6)]
  ].filter(([, a]) => a && a.length > 20);
}
// Cards link back to the long articles that mention them (reading paths for people and search engines)
const ART_TEXT = new Map();
function articlesFor(e) {
  const names = [...new Set([e.n, nm(e.n, true)])].filter(x => x && x.length > 3);
  const re = new RegExp('(?<![\\w-])(' + names.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])', 'i');
  return (POSTS || []).filter(x => x && x.title).filter(x => {
    if (!ART_TEXT.has(x)) ART_TEXT.set(x, [x.title.en, x.title.pl, ...(x.p.en || []), ...(x.p.pl || [])].join(' '));
    return re.test(ART_TEXT.get(x));
  }).slice(0, 4);
}

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

// Articles: link the first mention of each catalog name to its card (internal links for search engines and readers)
const NAME_LINKS = D.flatMap(e => [...new Set([e.n, nm(e.n, true)])].filter(x => x && x.length > 3).map(x => [x, e]))
  .sort((a, b) => b[0].length - a[0].length);
const NAME_RE = new RegExp('(?<![\\w-])(' + NAME_LINKS.map(([x]) => esc(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])', 'g');
function linkNames(html, L, seen) {
  return html.replace(NAME_RE, m => {
    const hit = NAME_LINKS.find(([x]) => esc(x) === m); if (!hit || seen.has(hit[1].n)) return m;
    seen.add(hit[1].n); return `<a href="../../${cardPath(hit[1], L)}">${m}</a>`;
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
  ${(() => { const seen = new Set(); return paras.map(para => `<p class="lead reveal">${linkNames(esc(para), L, seen)}</p>`).join('\n  '); })()}
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
  const st = require('./sterydy.js').faqItems(L);
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.nav.faq)}</p>
    <h1 class="display reveal">${en ? 'Questions, answered plainly.' : 'Pytania i proste odpowiedzi.'}</h1>
    <p class="lede reveal"><b>${faq.length + qa.length + st.length}</b> ${en ? 'questions about peptides, hormones and anabolic drugs, answered from the research — and about what we will not answer.' : 'pytań o peptydy, hormony i środki anaboliczne, z odpowiedziami opartymi na badaniach — i o tym, na co nie odpowiadamy.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="faq wide">
    ${faq.map(q => `<details class="reveal"><summary>${esc(en ? q[0].en : q[0].pl)}</summary><p>${esc(en ? q[1].en : q[1].pl)}</p></details>`).join('')}
    ${qa.map(q => `<details class="reveal"><summary>${esc(q.q[en ? 1 : 0])}</summary><p>${esc(q.a[en ? 1 : 0])}</p></details>`).join('')}
    ${st.map(q => `<details class="reveal"><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}
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
  <div class="stack">${my.map(x => `<article class="tile glass reveal"><p class="verdict-tag ${x[2] === 'f' ? 'bad' : x[2] === 'p' ? '' : 'good'}">${verdict(x[2], en)}</p><h3 class="gtitle sm">${esc(x[en ? 1 : 0])}</h3><p class="small ink2">${esc(x[en ? 4 : 3] || x[3])}</p></article>`).join('')}</div>
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
    <article class="tile glass reveal" id="corrections"><h2 class="gtitle sm">${en ? 'Corrections' : 'Poprawki'}</h2>
      <p class="small ink2">${en ? 'Found an error or a newer source? Write to us using the form below. We check every report against the source, fix confirmed errors and update the date on the entry. Every entry shows when it last changed. <a href="methods.html">Sources &amp; methods</a>.' : 'Widzisz błąd albo nowsze źródło? Napisz do nas przez formularz niżej. Każde zgłoszenie sprawdzamy w źródle, potwierdzone błędy poprawiamy i aktualizujemy datę wpisu. Każdy wpis pokazuje, kiedy ostatnio się zmienił. <a href="methods.html">Źródła i metoda</a>.'}</p></article>
  </div>
</div></section>

<section id="contact"><div class="wrap narrow">
  <p class="kick reveal">${esc(t.contact)}</p>
  <h2 class="display sm reveal">${esc(t.writeUs)}</h2>
  <p class="lede reveal">${esc(t.contactP)}</p>
  <form class="sheet reveal" id="coForm" method="POST" action="https://api.web3forms.com/submit" novalidate>
    <input type="hidden" name="access_key" value="fad7f9a3-408f-447d-9e48-592fc5d30c02">
    <input type="hidden" name="subject" value="PepSafe: ${L === 'pl' ? 'wiadomość ze strony' : 'message from the site'}">
    <input type="hidden" name="from_name" value="pepsafe.info">
    <input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="f2">
      <p class="frow"><label for="coName">${esc(t.coName)}</label><input type="text" id="coName" name="name" autocomplete="name" maxlength="80" required></p>
      <p class="frow"><label for="coEmail">${esc(t.coMail)}</label><input type="email" id="coEmail" name="email" autocomplete="email" maxlength="120" required></p>
    </div>
    <p class="frow"><label for="coTopic">${esc(t.coTopic)}</label><select id="coTopic" name="topic">${t.coT.map(x => `<option>${esc(x)}</option>`).join('')}</select></p>
    <p class="frow"><label for="coMsg">${esc(t.coMsg)}</label><textarea id="coMsg" name="message" rows="5" maxlength="2000" required></textarea></p>
    <p class="formfoot"><button class="btn big" type="submit" data-busy="${esc(t.coSending)}">${esc(t.coSend)}</button></p>
    <p class="formmsg" id="coMsgOut" role="status" hidden></p>
  </form>
  <div class="stack">
    <article class="tile glass reveal"><h3 class="gtitle sm">${esc(t.coHowH)}</h3><p class="small ink2">${esc(t.coHow)}</p></article>
    <article class="tile glass reveal"><h3 class="gtitle sm">TikTok · Instagram</h3>
      <p class="small ink2">${en ? 'Prefer your phone? Send a direct message instead. We read every one and answer the best ones in a Q&A.' : 'Wolisz z telefonu? Napisz wiadomość prywatną. Czytamy każdą, a najciekawsze omawiamy w Q&A.'}</p>
      <p class="social"><a class="soc" href="${TT}" rel="me noopener" target="_blank">${ICO_TT}<span>${esc(t.dmTT)}</span></a>
      <a class="soc" href="${IG}" rel="me noopener" target="_blank">${ICO_IG}<span>${esc(t.dmIG)}</span></a>
      <a class="soc" href="${FB}" rel="me noopener" target="_blank">${ICO_FB}<span>Facebook</span></a></p></article>
    <article class="tile glass reveal"><h3 class="gtitle sm">${en ? 'By email' : 'Mailem'}</h3>
      <p class="small ink2">${en ? 'Prefer your own email app? Write to us directly.' : 'Wolisz własną pocztę? Napisz do nas wprost.'}</p>
      <p class="social"><a class="soc" href="mailto:${FORM_TO}">${FORM_TO}</a></p></article>
  </div>
  <p class="notice reveal">${esc(t.coMed)}</p>
</div></section>`;
  return layout({
    lang: L, here: 'about.html', twin: 'about.html', body,
    title: (en ? 'About the project' : 'O projekcie') + ' | PepSafe',
    desc: en ? 'What PepSafe is, the rules every entry follows, what we never publish, and how to contact us.' : 'Czym jest PepSafe, jakie zasady obowiązują każdy wpis, czego nigdy nie publikujemy i jak się z nami skontaktować.'
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
// Head-to-head pages for the pairs people search most (semaglutide vs tirzepatide etc.), built only from catalog data
const VS = [['Semaglutyd', 'Tirzepatyd'], ['Tirzepatyd', 'Retatrutyd'], ['Semaglutyd', 'Retatrutyd'], ['Semaglutyd', 'Liraglutyd'], ['Tirzepatyd', 'Mazdutyd'],
  ['Liraglutyd', 'Tirzepatyd'], ['Semaglutyd', 'Dulaglutyd'], ['Semaglutyd', 'Foundayo (orforglipron)'], ['Semaglutyd', 'Cagrilintyd'], ['Retatrutyd', 'Survodutyd'], ['Liraglutyd', 'Eksenatyd']]
  .map(([a, b]) => [D.find(e => e.n === a), D.find(e => e.n === b)]).filter(([a, b]) => a && b);
const vsFile = ([a, b]) => 'vs-' + key(a) + '-vs-' + key(b) + '.html';
function vsPage(pair, L) {
  const en = L === 'en', t = W[L], [a, b] = pair;
  const f = (e, i) => { const tr = EN[e.n] || []; return en ? (tr[i] || [0, 0, e.d, e.m, e.u, e.ev, e.w][i]) : [0, 0, e.d, e.m, e.u, e.ev, e.w][i]; };
  const na = nm(a.n, en), nb = nm(b.n, en);
  const rows = [[en ? 'Status' : 'Status', statusOf(a, en), statusOf(b, en)], [t.what, f(a, 2), f(b, 2)], [t.how, f(a, 3), f(b, 3)],
    [t.use, f(a, 4), f(b, 4)], [t.ev, f(a, 5), f(b, 5)], [t.care, f(a, 6), f(b, 6)]];
  const srcs = [...((SRC || {})[a.n] || []), ...((SRC || {})[b.n] || [])];
  const title = `${na} vs ${nb}`;
  const body = `
<section class="page-head paper"><div class="wrap narrow">
  <p class="kick reveal">${en ? 'Head to head' : 'Porównanie'}</p>
  <h1 class="display reveal">${esc(title)}</h1>
  <p class="lede reveal">${esc(en ? `How ${na} and ${nb} differ: approval status, how they work, what the research shows and what to watch for. Facts from the catalog, with sources.` : `Czym różnią się ${na} i ${nb}: status, mechanizm, wyniki badań i na co uważać. Fakty z katalogu, ze źródłami.`)}</p>
</div></section>
<section><div class="wrap narrow">
  ${rows.map(([h, x, y]) => `<section class="blk reveal"><h2 class="kick">${esc(h)}</h2><div class="cols2"><p><b>${esc(na)}:</b> ${esc(x || '—')}</p><p><b>${esc(nb)}:</b> ${esc(y || '—')}</p></div></section>`).join('')}
  <p class="actions reveal"><a class="btn" href="../${cardPath(a, L)}">${esc(na)}${ARROW}</a> <a class="btn" href="../${cardPath(b, L)}">${esc(nb)}${ARROW}</a></p>
  ${srcs.length ? `<section class="blk reveal"><h2 class="kick">${esc(t.srcs)}</h2><ul class="srcs-list">${srcs.map(x => `<li><a href="${esc(x[1])}" rel="nofollow noopener" target="_blank">${esc(x[0])}</a></li>`).join('')}</ul></section>` : ''}
  <p class="small ink2 reveal">${en ? 'Educational content, not medical advice. Decisions about treatment belong with a doctor.' : 'Treść edukacyjna, nie porada medyczna. Decyzje o leczeniu należą do lekarza.'}</p>
</div></section>`;
  return layout({ lang: L, here: vsFile(pair), twin: vsFile(pair), body,
    title: `${title}: ${en ? 'differences, research and status' : 'różnice, badania i status'} | PepSafe`,
    desc: clip(en ? `${na} vs ${nb}: approval status, mechanism, what the trials showed and side effects to watch for, with sources.` : `${na} czy ${nb}: status, mechanizm, wyniki badań i działania niepożądane, ze źródłami.`, 155) });
}
// Sources & methods: how the catalog is built and checked (only true statements about our process)
function methods(L) {
  const en = L === 'en';
  const items = en ? [
    ['Where the facts come from', 'Drug labels (DailyMed, FDA), trial registries (ClinicalTrials.gov), peer-reviewed studies (PubMed), regulators (FDA, EMA, MHRA) and the WADA Prohibited List. Each entry links its sources.'],
    ['How evidence is described', 'Every entry says what kind of evidence exists: cells, animals, a few people, or full clinical trials. Where human data is missing or small, the entry says so instead of filling the gap.'],
    ['Doses', 'Doses appear only for approved medicines, copied from the official label, as information. For unapproved substances we publish no doses.'],
    ['How sources are checked', `Every week an automated check opens the source links, flags dead or moved documents, retracted papers and searches that point to the wrong substance. Broken sources are replaced with official registry searches.`],
    ['How entries change', 'Each entry shows the date its content last changed. Corrections from readers are checked against the source before anything is changed.'],
    ['What we are not', 'We sell no peptides or medicines and take no affiliate money. The catalog is free; two optional PDF guides help pay for it. This is educational content, not medical advice.']
  ] : [
    ['Skąd są fakty', 'Charakterystyki leków (DailyMed, FDA), rejestry badań (ClinicalTrials.gov), recenzowane publikacje (PubMed), regulatorzy (FDA, EMA, MHRA) i lista WADA. Każdy wpis linkuje swoje źródła.'],
    ['Jak opisujemy dowody', 'Każdy wpis mówi, jakie są dowody: komórki, zwierzęta, kilka osób czy pełne badania kliniczne. Gdy danych u ludzi brak albo jest ich mało, piszemy to wprost.'],
    ['Dawki', 'Dawki podajemy tylko dla zatwierdzonych leków, przepisane z oficjalnej charakterystyki, jako informację. Dla substancji niezatwierdzonych nie podajemy dawek.'],
    ['Jak sprawdzamy źródła', 'Co tydzień automatyczna kontrola otwiera linki do źródeł i wyłapuje martwe lub przeniesione dokumenty, wycofane publikacje i wyszukiwania wskazujące inną substancję. Zepsute źródła zastępujemy wyszukiwaniem w oficjalnych rejestrach.'],
    ['Jak zmieniają się wpisy', 'Każdy wpis pokazuje datę ostatniej zmiany treści. Zgłoszone poprawki sprawdzamy w źródle, zanim cokolwiek zmienimy.'],
    ['Czym nie jesteśmy', 'Nie sprzedajemy peptydów ani leków i nie bierzemy prowizji. Katalog jest darmowy; utrzymują go dwa opcjonalne przewodniki PDF. To treść edukacyjna, nie porada medyczna.']
  ];
  const body = `
<section class="page-head paper"><div class="wrap narrow">
  <p class="kick reveal">${en ? 'Sources &amp; methods' : 'Źródła i metoda'}</p>
  <h1 class="display reveal">${en ? 'How the catalog is built and checked' : 'Jak powstaje i jak sprawdzamy katalog'}</h1>
</div></section>
<section><div class="wrap narrow">
  ${items.map(([h, p]) => `<section class="blk reveal"><h2 class="kick">${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}
  <p class="reveal"><a href="about.html#corrections">${en ? 'Report an error' : 'Zgłoś błąd'}</a> · <a href="catalog.html">${en ? 'Browse the catalog' : 'Przeglądaj katalog'}</a></p>
</div></section>`;
  return layout({ lang: L, here: 'methods.html', twin: 'methods.html', body,
    title: (en ? 'Sources & methods' : 'Źródła i metoda') + ' | PepSafe',
    desc: en ? 'Where PepSafe facts come from, how evidence is described and how sources are checked every week.' : 'Skąd PepSafe bierze fakty, jak opisuje dowody i jak co tydzień sprawdza źródła.' });
}
// "Most read this week": tools/najczytane.json is written every Monday from site analytics (node tools/odwiedziny.js); no file, no section
function mostRead(L) {
  let top = [];
  try { top = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'najczytane.json'), 'utf8')).slugs || []; } catch (x) { return ''; }
  const rows = top.map(k => D.find(e => key(e) === k)).filter(Boolean).slice(0, 5);
  if (!rows.length) return '';
  const en = L === 'en';
  return `<section class="field"><div class="wrap">
  <p class="kick reveal">${en ? 'Most read this week' : 'Najczęściej czytane w tym tygodniu'}</p>
  <ol class="reveal">${rows.map(e => `<li><a href="${BASE}${cardPath(e, L)}">${esc(nm(e.n, en))}</a> <span class="small ink2">${esc(statusOf(e, en))}</span></li>`).join('')}</ol>
</div></section>`;
}
function compare(L) {
  const en = L === 'en', t = W[L];
  const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(t.compareNav)}</p>
    <h1 class="display reveal">${en ? 'Side by side, same questions.' : 'Obok siebie, te same pytania.'}</h1>
    <p class="lede reveal">${en ? 'Pick up to six substances and read their status, group, evidence and warnings in one view. If two share a group, the page says so.' : 'Wybierz do sześciu substancji i przeczytaj ich status, grupę, dowody i ostrzeżenia w jednym widoku. Jeśli dwie należą do tej samej grupy, strona to powie.'}</p>
  </div>
</section>
<section><div class="wrap">
  <div class="filters reveal">
    <label class="search"><span class="sr">${esc(t.pick)}</span>
      <input id="cmpQ" type="search" placeholder="${esc(t.pick)}" autocomplete="off" autocorrect="off" spellcheck="false"></label>
    <ul class="findlist cmpsug" id="cmpSug" hidden></ul>
    <div class="chips"><button class="chip" id="cmpClear">${esc(t.clear)}</button></div>
  </div>
  <div id="cmpWarn"></div>
  <div class="grid-cards" id="cmpOut"></div>
  <p class="muted" id="cmpEmpty">${en ? 'Nothing picked yet. Start typing a name above.' : 'Nic nie wybrano. Zacznij wpisywać nazwę powyżej.'}</p>
</div></section>`;
  return layout({
    lang: L, here: 'compare.html', twin: 'compare.html', body,
    title: (en ? 'Compare substances' : 'Porównaj substancje') + ' | PepSafe',
    desc: en ? 'Put up to six substances, peptides or steroids, side by side: status, group, evidence and warnings.' : 'Zestaw do sześciu substancji, peptydów lub sterydów, obok siebie: status, grupa, dowody i ostrzeżenia.'
  });
}

function symptoms(L) {
  const en = L === 'en', t = W[L];
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
    <div class="chips" id="syChips"></div>
  </div>
  <div class="chips" id="syTabs"></div>
  <p class="muted" id="syNote"></p>
  <p class="muted" id="syHint"></p>
  <div class="grid-cards" id="syOut"></div>
</div></section>

<section id="report" class="band"><div class="wrap narrow">
  <p class="kick reveal">${esc(t.efLab)}</p>
  <h2 class="display sm reveal">${esc(t.efH)}</h2>
  <p class="lede reveal">${esc(t.efLead)}</p>
  <p class="notice warn reveal"><strong>${en ? 'Emergency' : 'Nagły przypadek'}:</strong> ${esc(t.efWarn)}</p>
  <p class="small ink2 reveal">${esc(t.efNote)}</p>
  <p class="small ink2 reveal">${esc(t.official)}
    <a href="https://yellowcard.mhra.gov.uk/" rel="noopener" target="_blank">MHRA Yellow Card (UK)</a> ·
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
      t: searchText(e, en), k: SKUTKI.tags(e.n), sy: SKUTKI.text(e.n, L)
    };
  });
  return 'window.PEP = ' + JSON.stringify({ lang: L, rows, extra: require('./sterydy.js').finder(L) }) + ';\n';
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
    'faq.html': faqPage(L), 'alerts.html': alerts(L), 'about.html': about(L), 'thanks.html': thanks(L), 'free.html': freePage(L), 'free-thanks.html': freeThanks(L), 'guides.html': guidesPage(L), 'privacy.html': privacy(L),
    'blog.html': blogIndex(L), 'glossary.html': glossary(L), 'methods.html': methods(L), '404.html': notFound(L),
    ...Object.fromEntries(VS.map(v => [vsFile(v), vsPage(v, L)]))
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


// „link in bio” (/start/ig.html, /start/tt.html, /start/fb.html): pelna strona glowna pod osobnymi adresami,
// zeby licznik odwiedzin pokazal, ktora platforma przysyla ludzi; canonical na korzen, noindex
function start() {
  return enLinks(retarget(home('en'), '')).replace('<head>', '<head>\n<meta name="robots" content="noindex">');
}
// strona glowna poza /en/ (korzen, /start/): wzgledne odnosniki typu catalog.html prowadza do /en/
function enLinks(html) {
  return html.replace(/href="([a-z0-9-]+\.html(?:#[^"]*)?)"/g, `href="${BASE}en/$1"`);
}

// strony pod starymi adresami, zeby zaden zaindeksowany odnosnik nie zgasl:
// korzen witryny oraz /p/ i /p/faq, ktore Google zna od tygodnia
function retarget(html, canon) {
  return html
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${BASE}${canon}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${BASE}${canon}">`);
}
fs.writeFileSync(path.join(out, 'index.html'), enLinks(retarget(home('en'), '')));
fs.writeFileSync(path.join(out, '404.html'), notFound('en'));
fs.mkdirSync(path.join(out, 'start'), { recursive: true });
for (const f of ['index.html', 'ig.html', 'tt.html', 'fb.html']) fs.writeFileSync(path.join(out, 'start', f), start());   // GitHub Pages serwuje to przy kazdym 404
fs.writeFileSync(path.join(out, 'p', 'index.html'), retarget(catalog('en'), 'en/catalog.html'));
fs.writeFileSync(path.join(out, 'p', 'faq.html'), retarget(faqPage('en'), 'en/faq.html'));
fs.writeFileSync(path.join(out, 'p', 'faq.pl.html'), retarget(faqPage('pl'), 'pl/faq.html'));
n += 5;

// steroids section (data in sterydy/*.json, code in tools/sterydy.js)
const STER = require('./sterydy.js')({ layout, esc, BASE, ARROW, clip, out, LANGS, SITE });

// /go/*.html: count the click (Cloudflare page view), then forward to Ko-fi
fs.mkdirSync(path.join(out, 'go'), { recursive: true });
for (const [name, url] of Object.entries(GO)) {
  fs.writeFileSync(path.join(out, 'go', name + '.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Opening Ko-fi…</title>` +
    `<meta http-equiv="refresh" content="3;url=${url}"><style>body{font:16px system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f6f6f2;color:#161a18}a{color:#0A7C66}</style></head>` +
    `<body><p>Opening Ko-fi… · Otwieram Ko-fi… · Abriendo Ko-fi… <a href="${url}">Ko-fi</a></p>` +
    `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_BEACON}"}'></script>` +
    `<script>setTimeout(function(){location.replace(${JSON.stringify(url)})},900)</script></body></html>`);
}

// sitemapa: tylko adresy kanoniczne
const when = new Date().toISOString().slice(0, 10);
const urls = [''].concat(
  LANGS.flatMap(L => ['index.html', 'catalog.html', 'dosing.html', 'groups.html', 'compare.html',
    'symptoms.html', 'faq.html', 'alerts.html', 'about.html', 'blog.html', 'glossary.html', 'free.html', 'guides.html', 'privacy.html', 'methods.html'].map(f => L + '/' + f)),
  LANGS.flatMap(L => (POSTS || []).map(x => L + '/t/' + postSlug(x) + '.html')),
  LANGS.flatMap(L => VS.map(v => L + '/' + vsFile(v))),
  LANGS.flatMap(L => D.map(e => cardPath(e, L))),
  STER);
fs.writeFileSync(path.join(out, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => { const k = (/^p\/([^.]+)(\.pl)?\.html$/.exec(u) || [])[1]; const d = (k && ZM[k] && ZM[k].d) || when;   // cards: real date of the last content change
    return `  <url><loc>${SITE}${BASE}${u}</loc><lastmod>${d}</lastmod></url>`; }).join('\n') +
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
console.log(`grupy: ${GROUPS.length}, peptyd dnia: ${DAY.n} (${DAY.date}), ostrzezenia: ${(ALERTS || []).length}, triki: ${(TRICKS || []).length}, mity: ${(MYTHS || []).length}`);
