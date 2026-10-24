# Lista ulepszeń strony (autopilot bierze 1 w każdy piątek)

Zasada: jedna zmiana na raz, po niej `PEP_OUT=. PEP_BASE=/ node tools/v4.js` i `node tools/kontrola.js` (kod 0), commit, push, IndexNow.
Zrobione przenieś na dół do „Zrobione” z datą.

## Do zrobienia (kolejność)
1. Strony porównań dla najczęściej wyszukiwanych par GLP-1 (`/en/vs/semaglutide-vs-tirzepatide.html` itd., 3–5 par): tabela status / mechanizm / wyniki badań / skutki uboczne z danych katalogu + źródła, linki do obu kart, w sitemap.
2. Na kartach leków GLP-1: sekcja „Common questions” (3–4 pytania z FAQ/QA przypisane do leku), z danymi strukturalnymi FAQPage.
3. Obrazki udostępniania dla 20 najczęściej oglądanych kart (nazwa + status na tle marki), `og:image` per karta.
4. Strona „Sources & methods” (/en/methods.html): skąd bierzemy dane, jak oceniamy dowody, jak często sprawdzamy źródła (`tools/linki.js` co poniedziałek) — tylko prawdziwe informacje.
5. Na stronie głównej sekcja „Most read this week” z 5 kartami (z `node tools/odwiedziny.js 7`, aktualizowana przy przebudowie).

## Zrobione
- 24.10: daty „Last updated”, zasada poprawek, dane strukturalne kart, linki do tekstów w kartach („Further reading”), daty w sitemap per karta, linki z tekstów do kart.
