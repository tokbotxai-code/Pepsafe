# Lista ulepszeń strony (autopilot bierze 1 w każdy piątek)

Zasada: jedna zmiana na raz, po niej `PEP_OUT=. PEP_BASE=/ node tools/v4.js` i `node tools/kontrola.js` (kod 0), commit, push, IndexNow.
Zrobione przenieś na dół do „Zrobione” z datą.

## Do zrobienia (kolejność)
3. Obrazki udostępniania dla 20 najczęściej oglądanych kart (nazwa + status na tle marki), `og:image` per karta.
5. Na stronie głównej sekcja „Most read this week” z 5 kartami (z `node tools/odwiedziny.js 7`, aktualizowana przy przebudowie).

## Zrobione
- 24.10: daty „Last updated”, zasada poprawek, dane strukturalne kart, linki do tekstów w kartach („Further reading”), daty w sitemap per karta, linki z tekstów do kart.
- 24.10: 5 stron porównań GLP-1 (`/en/vs-*.html`, `/pl/vs-*.html`, lista `VS` w v4.js), strona „Sources & methods” (`/en/methods.html`).
- 24.10: „Common questions” na każdej karcie (4 pytania z pól wpisu) + dane FAQPage.
