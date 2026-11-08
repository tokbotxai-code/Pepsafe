const {chromium}=require('playwright');const fs=require('fs');
const data=JSON.parse(fs.readFileSync(__dirname+'/'+(process.env.IN||'results.json'),'utf8'));
const target=process.argv[2];const s=data.find(x=>x.url.includes(target));
const FIX={
'button-name':'Każdy przycisk powinien mieć czytelną nazwę (tekst lub aria-label), żeby czytnik ekranu mówił, do czego służy.',
'aria-required-children':'Element z rolą ARIA nie zawiera wymaganych elementów podrzędnych. Popraw strukturę kodu albo usuń rolę ARIA.',
'aria-required-parent':'Element z rolą ARIA nie ma wymaganego elementu nadrzędnego. Umieść go poprawnie albo usuń rolę.',
'color-contrast':'Tekst i tło muszą mieć kontrast co najmniej 4,5:1 (3:1 dla dużego tekstu). Przyciemnij tekst albo rozjaśnij tło.',
'list':'Lista może zawierać tylko elementy listy. Wyprowadź inne elementy poza listę albo popraw kod.',
'listitem':'Elementy listy muszą być wewnątrz listy (ul lub ol).',
'html-has-lang':'Dodaj do strony atrybut języka (np. lang="pl"), żeby czytnik ekranu poprawnie wymawiał tekst.',
'document-title':'Nadaj stronie opisowy tytuł, żeby dało się odróżnić karty i wyniki wyszukiwania.',
'aria-input-field-name':'Dodaj polu etykietę (widoczną lub aria-label), żeby technologie asystujące mówiły, do czego służy.'};
const PLH={
'color-contrast':'Za niski kontrast tekstu do tła','html-has-lang':'Brak atrybutu języka strony','link-name':'Linki bez czytelnej nazwy',
'label-content-name-mismatch':'Widoczny tekst nie jest częścią nazwy elementu','aria-valid-attr':'Niepoprawne atrybuty ARIA','frame-title':'Ramki (iframe) bez nazwy',
'image-alt':'Obrazy bez tekstu alternatywnego','button-name':'Przyciski bez czytelnej nazwy','definition-list':'Niepoprawna struktura listy definicji',
'meta-viewport':'Zablokowane powiększanie strony','document-title':'Brak tytułu strony','aria-prohibited-attr':'Niedozwolone atrybuty ARIA',
'role-img-alt':'Elementy graficzne (role img) bez opisu','scrollable-region-focusable':'Przewijany obszar niedostępny z klawiatury','list':'Niepoprawna struktura listy',
'aria-hidden-focus':'Ukryty element, który można aktywować klawiaturą','aria-roles':'Niepoprawne role ARIA','nested-interactive':'Zagnieżdżone elementy interaktywne',
'aria-allowed-attr':'Nieobsługiwane atrybuty ARIA','label':'Pola formularza bez etykiet','listitem':'Elementy listy poza listą','link-in-text-block':'Linki odróżnialne tylko kolorem',
'aria-required-children':'Brak wymaganych elementów podrzędnych ARIA','aria-required-parent':'Brak wymaganego elementu nadrzędnego ARIA','aria-input-field-name':'Pole bez nazwy'};
const MORE={
'link-name':'Każdy link musi mieć tekst (lub aria-label) opisujący, dokąd prowadzi. Linki-ikony i zdjęcia bez opisu są dla czytników ekranu „pustymi" linkami.',
'label-content-name-mismatch':'Nazwa przekazywana technologiom asystującym (aria-label) powinna zawierać widoczny napis, żeby sterowanie głosem działało.',
'aria-valid-attr':'Usuń lub popraw atrybuty ARIA o błędnych nazwach.','frame-title':'Dodaj każdej ramce (np. mapie, filmowi) atrybut title opisujący jej zawartość.',
'image-alt':'Dodaj obrazom opis alternatywny (alt). Obrazy ozdobne oznacz pustym alt="".','definition-list':'Lista definicji (dl) może zawierać tylko pary dt/dd. Popraw kod.',
'meta-viewport':'Nie blokuj powiększania strony (usuń user-scalable=no i maximum-scale z meta viewport).','aria-prohibited-attr':'Usuń atrybuty ARIA, które nie są dozwolone dla danego elementu.',
'role-img-alt':'Elementy z role=img wymagają opisu (aria-label).','scrollable-region-focusable':'Obszar z przewijaniem musi dać się obsłużyć klawiaturą (tabindex="0").',
'aria-hidden-focus':'Nie ukrywaj aria-hidden elementów, które można aktywować klawiaturą.','aria-roles':'Użyj poprawnych wartości roli ARIA.','nested-interactive':'Nie zagnieżdżaj przycisków/linków wewnątrz innych elementów interaktywnych.',
'aria-allowed-attr':'Usuń atrybuty ARIA, których dany element nie obsługuje.','label':'Każde pole formularza potrzebuje etykiety (label lub aria-label).','link-in-text-block':'Odróżnij linki w tekście nie tylko kolorem (np. podkreśleniem).'};
Object.assign(FIX,MORE);
const IMP={critical:'#b42318',serious:'#c2410c',moderate:'#a16207',minor:'#475467'};
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const crit=t=>{const m=t.match(/^wcag(\d)(\d)(\d+)$/);return m?m[1]+'.'+m[2]+'.'+m[3]:null};
const host=new URL(s.url).hostname;
const rows=s.violations.map(v=>`<tr><td><b style="color:${IMP[v.impact]}">${v.impact}</b></td><td><b>${esc(PLH[v.id]||v.help)}</b><br><span class=m>${FIX[v.id]||''}</span></td><td>${v.tags.map(crit).filter(Boolean).join(', ')}</td><td>${v.count}</td></tr>`).join('');
const ex=s.violations.slice(0,3).map(v=>`<p><b>${v.id}</b><br><code>${v.examples[0].html.replace(/</g,'&lt;')}</code></p>`).join('');
const total=s.violations.reduce((a,v)=>a+v.count,0);
const html=`<html lang=pl><head><meta charset=utf-8><style>
body{font:13px/1.5 'Helvetica',Arial,sans-serif;color:#1f2b24;margin:0}
.p{padding:34px 40px}h1{font-size:24px;margin:0 0 4px;color:#14501a}h2{font-size:15px;margin:22px 0 8px;color:#14501a}
.bar{background:#14501a;color:#fff;padding:18px 40px}.bar b{font-size:16px}
.k{display:flex;gap:12px;margin:14px 0}.k div{flex:1;border:1px solid #d6dcd5;border-radius:8px;padding:10px 12px}.k b{font-size:22px;display:block}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e5e8e4;padding:7px 6px;text-align:left;vertical-align:top}th{font-size:11px;text-transform:uppercase;color:#667}
.m{color:#475467;font-size:12px}code{display:block;background:#f4f5f3;padding:6px 8px;border-radius:4px;font-size:11px;word-break:break-all}
.n{break-inside:avoid;background:#fff7e6;border:1px solid #f1d28a;border-radius:8px;padding:10px 12px;font-size:12px;margin-top:16px}</style></head><body>
<div class=bar><b>Wstępna kontrola dostępności strony</b><br>Skan automatyczny względem WCAG, poziom A i AA</div>
<div class=p><h1>${host}</h1><div class=m>Skanowana strona: ${s.url}<br>Data skanu: ${new Date().toLocaleDateString('pl-PL')} &nbsp;|&nbsp; Przygotowano przez PepSafe Studio${process.env.SAMPLE?' (PRÓBKA)':''}</div>
<div class=k><div><b>${s.violations.length}</b>rodzajów błędów</div><div><b>${total}</b>elementów do poprawy</div><div><b>${s.passes}</b>testów zaliczonych</div><div><b>${s.incomplete}</b>do ręcznej oceny</div></div>
<h2>Do poprawy</h2><table><tr><th>Waga</th><th>Problem i jak go naprawić</th><th>WCAG</th><th>Elementów</th></tr>${rows}</table>
<h2>Przykłady z kodu strony</h2>${ex}
<div class=n><b>Czym jest ten raport, a czym nie.</b> To automatyczna wstępna kontrola jednej strony. Narzędzia automatyczne wykrywają tylko część problemów z dostępnością; obsługę z klawiatury, czytniki ekranu, napisy, prosty język i wiele innych punktów musi sprawdzić człowiek. To nie jest certyfikat zgodności ani porada prawna. Brak błędów w skanie nie oznacza, że strona spełnia wymogi ustawy.</div>
</div></body></html>`;
fs.writeFileSync(__dirname+'/report-pl.html',html);
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent(html);await p.pdf({path:__dirname+'/'+(process.env.PDF||'sample-report-pl.pdf'),format:'A4',printBackground:true,margin:{top:'0',bottom:'0',left:'0',right:'0'}});await b.close();console.log('pdf ok');})();
