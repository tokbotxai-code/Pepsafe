// Reads visits to pepsafe.info from Cloudflare Web Analytics.
// Usage: node tools/odwiedziny.js [liczba dni, domyslnie 7]
// Needs CLOUDFLARE_API_TOKEN (uprawnienie Account Analytics: Read) and CLOUDFLARE_ACCOUNT_ID in the environment.
const SITE = '1ba9f12bd6e545c79b6786f5785794cf'; // siteTag z API (to NIE jest token beacona z index.html)
const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) { console.error('brak CLOUDFLARE_API_TOKEN albo CLOUDFLARE_ACCOUNT_ID w srodowisku'); process.exit(1); }

const days = Number(process.argv[2] || 7);
const since = new Date(Date.now() - days * 864e5).toISOString();
const until = new Date().toISOString();

const q = `query($a:String!,$s:String!,$since:Time!,$until:Time!){
  viewer{accounts(filter:{accountTag:$a}){
    dni: rumPageloadEventsAdaptiveGroups(limit:100, filter:{siteTag:$s, datetime_geq:$since, datetime_lt:$until},
      orderBy:[date_ASC]){ count dimensions{date} sum{visits} }
    strony: rumPageloadEventsAdaptiveGroups(limit:15, filter:{siteTag:$s, datetime_geq:$since, datetime_lt:$until},
      orderBy:[count_DESC]){ count dimensions{requestPath} }
    wszystkie: rumPageloadEventsAdaptiveGroups(limit:1000, filter:{siteTag:$s, datetime_geq:$since, datetime_lt:$until},
      orderBy:[count_DESC]){ count dimensions{requestPath} }
    skad: rumPageloadEventsAdaptiveGroups(limit:15, filter:{siteTag:$s, datetime_geq:$since, datetime_lt:$until},
      orderBy:[count_DESC]){ count dimensions{refererHost} }
    kraje: rumPageloadEventsAdaptiveGroups(limit:10, filter:{siteTag:$s, datetime_geq:$since, datetime_lt:$until},
      orderBy:[count_DESC]){ count dimensions{countryName} }
  }}}`;

(async () => {
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { a: account, s: SITE, since, until } })
  });
  const j = await r.json();
  if (j.errors) { console.error('Cloudflare:', JSON.stringify(j.errors).slice(0, 500)); process.exit(1); }
  const d = j.data.viewer.accounts[0];
  if (!d) { console.error('brak danych - sprawdz CLOUDFLARE_ACCOUNT_ID'); process.exit(1); }
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  console.log(`Ostatnie ${days} dni: ${sum(d.dni, x => x.count)} odslon, ${sum(d.dni, x => x.sum.visits)} wizyt\n`);
  console.log('Dzien po dniu:');
  for (const x of d.dni) console.log(`  ${x.dimensions.date}  ${String(x.count).padStart(5)} odslon  ${String(x.sum.visits).padStart(5)} wizyt`);
  const top = (label, rows, key) => {
    console.log('\n' + label + ':');
    for (const x of rows) console.log(`  ${String(x.count).padStart(5)}  ${x.dimensions[key] || '(brak)'}`);
  };
  top('Najczesciej otwierane adresy', d.strony, 'requestPath');
  // money funnel: clicks on tracked buy / support links (/go/<product>-<place>.html) and the free checklist
  const path = x => x.dimensions.requestPath || '';
  const goRows = d.wszystkie.filter(x => /^\/go\//.test(path(x)));
  const sumPath = re => d.wszystkie.filter(x => re.test(path(x))).reduce((t, x) => t + x.count, 0);
  console.log('\nPrzewodniki i Ko-fi (klikniecia w linki /go/ w ostatnich ' + days + ' dniach):');
  if (!goRows.length) console.log('  brak klikniec (linki sa nowe albo nikt jeszcze nie kliknal)');
  for (const x of goRows) console.log(`  ${String(x.count).padStart(5)}  ${path(x).replace('/go/', '').replace('.html', '')}`);
  console.log(`  razem przewodnik bezpieczenstwa: ${sumPath(/^\/go\/guide-/)}, przewodnik o miesniach: ${sumPath(/^\/go\/muscle-/)}, Ko-fi: ${sumPath(/^\/go\/kofi-/)}`);
  console.log(`  strona z podgladem przewodnikow (/guides.html): ${sumPath(/\/guides\.html$/)}, darmowa checklista: otwarcia ${sumPath(/\/free\.html$/)}, zapisy ${sumPath(/\/free-thanks\.html$/)}`);
  top('Skad przychodza', d.skad, 'refererHost');
  top('Kraje', d.kraje, 'countryName');
})();
