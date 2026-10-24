# Lista ulepszeń strony (autopilot bierze 1 w każdy piątek)

Zasada: jedna zmiana na raz, po niej `PEP_OUT=. PEP_BASE=/ node tools/v4.js` i `node tools/kontrola.js` (kod 0), commit, push, IndexNow.
Zrobione przenieś na dół do „Zrobione” z datą.

## Do zrobienia (kolejność)
1. Kolejne pary porównań, gdy pojawią się nowe leki GLP-1 albo pytania z Search Console (lista `VS` w v4.js).
2. Strona „Glossary” → każde hasło z własnym adresem (`/en/glossary/<hasło>.html`), bo ludzie szukają pojedynczych pojęć.
3. Kalkulator „ile to białka” na stronie przewodnika o mięśniach (darmowa wersja, zachęta do PDF).

## Zrobione
- 24.10: daty „Last updated”, zasada poprawek, dane strukturalne kart, linki do tekstów w kartach („Further reading”), daty w sitemap per karta, linki z tekstów do kart.
- 24.10: 5 stron porównań GLP-1 (`/en/vs-*.html`, `/pl/vs-*.html`, lista `VS` w v4.js), strona „Sources & methods” (`/en/methods.html`).
- 24.10: „Common questions” na każdej karcie (4 pytania z pól wpisu) + dane FAQPage.
- 24.10: własne obrazki udostępniania (`og/<slug>.png`) dla 20 najczęściej oglądanych kart; generator bierze je sam, gdy plik istnieje.
- 24.10: „Most read this week” na stronie głównej (`tools/najczytane.json`, odświeżane w poniedziałki).
