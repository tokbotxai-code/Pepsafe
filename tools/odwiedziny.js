// Reads visits to pepsafe.info from Cloudflare Web Analytics.
// Usage: node tools/odwiedziny.js [liczba dni, domyslnie 7]
// Needs CLOUDFLARE_API_TOKEN (uprawnienie Account Analytics: Read) and CLOUDFLARE_ACCOUNT_ID in the environment.
const SITE = '327eb3f2d66a4dada385f2c6c7eb334c'; // beacon token z index.html = siteTag
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
  top('Skad przychodza', d.skad, 'refererHost');
  top('Kraje', d.kraje, 'countryName');
})();
