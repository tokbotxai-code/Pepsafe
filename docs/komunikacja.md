# Komunikacja: sesja „główna” (właściciel + asystent) ↔ autopilot PepSafe

Autopilot PepSafe uruchamia się raz dziennie (04:49 UK) w nowej sesji i nie pamięta poprzednich. Dlatego ten plik jest wspólną tablicą:

- **Od „główna” do PepSafe** (czytaj na początku każdego przebiegu, zaraz po `git reset`): sekcja poniżej. Co przeczytane i wykonane, oznacz „✔ DD.MM” i zostaw.
- **Od PepSafe do „główna”**: gdy jest problem, pytanie albo uwaga (błąd Metricool, ERROR, spadek zasięgu, niejasna zasada), dopisz wpis w drugiej sekcji (data, co, co już próbowałeś) **i** wyślij krótkie send_message do sesji „główna”. Asystent odpisze w pierwszej sekcji lub przez send_message.
- Nie wpisuj tu numerów sesji ani kluczy (repo jest publiczne).

## Od „główna” do PepSafe
- 31.10: w sesji przebiegu zwykle nie ma narzędzi claude-code-remote, więc nie możesz czytać „główna” ani do niej pisać. To nie jest błąd. Wspólny kanał to ta tablica. Raport napisz jako ostatnią wiadomość w sesji: trafia do właściciela jako push i e-mail. Decyzje właściciela masz w CLAUDE.md.
- 31.10: obowiązuje zamrożenie zasad do 7.11 (CLAUDE.md, sekcja „Zamrożenie zasad”). TikTok PepSafe: 1 film dziennie, 5 hashtagów. Instagram: bez kart z katalogu (0 wyświetleń), rolki ok. 130. Codziennie rolka z pytaniem o GLP-1 na IG + FB (STEP 3.658). Raport i problemy wysyłaj do sesji „główna”, nie do „task”. W raporcie napisz, że przeczytałeś tę tablicę.

- ✔ 31.10 (WYKONANE tego samego dnia przez „główna”: punkty 1–9 zrobione i opublikowane; punkt 10 celowo bez zmian. Zostaje do dalszej pracy: rozbudowa artykułów do 700+ słów (teraz 300–500), opisy w 3 językach; przy każdej zmianie źródeł w generatorze uruchamiaj pełny łańcuch v4 → es → szukaj → kontrola, nigdy samo es.js dwa razy z rzędu) (audyt strony, zrób w tej kolejności, 1–3 punkty dziennie, po każdym: `node tools/kontrola.js` i `node tools/test-strony.js`; żaden zaindeksowany adres nie może zgasnąć; zmiany w EN, PL i ES):
  1. Polski tekst na stronie EN: link „Lista zakazana WADA 2026 (PDF)” w źródłach BPC-157 (szablon źródeł może się powtarzać na innych kartach). Znajdź w `dane.html` / `v4.js` i dodaj tytuł EN („WADA 2026 Prohibited List (PDF)”) oraz ES. `grep` po wszystkich stronach EN za polskimi znakami w źródłach.
  2. Podwójna strona główna: `/` i `/en/index.html` mają ten sam tytuł, opis i canonical na siebie. Ustaw canonical `/en/index.html` na `/en/` (albo zrób `/en/index.html` jako kopię z canonical na `/en/`), tak by nie było dwóch identycznych dokumentów.
  3. Emoji na stronach (🌐 w przełączniku języka, ☕ w stopce): zastąp małymi ikonami SVG albo tekstem; sprawdź wszystkie szablony.
  4. Tytuły dłuższe niż 65 znaków (27 stron, np. „Chlorodehydromethyltestosterone — Oral anabolic steroids | PepSafe”): skróć w generatorze (nazwa + krótka kategoria + PepSafe), bez zmiany adresów.
  5. Meta description krótsze niż 70 znaków (58 stron): uzupełnij do 120–155 znaków faktami z karty (status, do czego badano, rodzina), bez dawek i zachęt.
  6. Cienkie artykuły (230–280 słów: kolagen, peptydy w kosmetykach, „research use only”): rozbuduj do min. 700 słów, tylko pewne fakty ze źródłami, bez dawek, bez zachęt do zakupu; zasada „unikane słowa” obowiązuje.
  7. Strony `/go/...` (przekierowania do Ko-fi, 12 stron): dodaj `noindex` i `rel=canonical` na siebie lub usuń z sitemap; zachowaj pomiar kliknięć.
  8. Strona substancji: ostrzeżenie o naczyniach krwionośnych i nowotworach powtarza się 3 razy (wady, czego nie wiemy, na co uważać): zostaw jedno pełne, w pozostałych krótkie odwołanie. „Komisja FDA za” w zaletach brzmi jak rekomendacja: przepisz na neutralny fakt z kontekstem (komisja głosowała w sprawie konkretnego, wąskiego zastosowania, i co to znaczy).
  9. **Najpierw zweryfikuj w źródle, nie zmieniaj z pamięci:** status FDA dla BPC-157. Twierdzenie do sprawdzenia: do 22.04.2026 FDA przeniosło BPC-157 z kategorii 2 na „wcześniej w kategorii 2”, bo wnioski wycofano, a głosowanie komisji dotyczyło wrzodziejącego zapalenia jelita grubego. Sprawdź na stronie FDA (compounding bulk substances) i w komunikatach; jeśli się potwierdzi, zaktualizuj kartę, `opisy.json` i wszystkie trzy języki, z datą źródła. Jeśli nie da się potwierdzić, napisz „brak potwierdzenia” w raporcie i nie zmieniaj treści.
  10. Adresy `/p/`, `/en/t/`, `/p/nazwa.pl.html`: **nie zmieniamy adresów** (zaindeksowane), to tylko uwaga na przyszłość; nie rób przekierowań ani migracji.

- 01.11 (dane od właściciela): sprzedaż przewodników na Ko-fi w tym tygodniu = 0, zapisy na listę mailową = 0 (w MailerLite 1 kontakt). Właściciel nie przekaże liczb z aplikacji TikTok. W raporcie poniedziałkowym (2.11) policz kliknięcia /go/…, wejścia z /start/ i zapisy, i podaj wniosek: gdzie ludzie odpadają (strona → przewodniki → Ko-fi). Artykuły rozbudowane do ok. 700 słów (1.11).

- 01.11 (przegląd planu po przebiegu): w planie na 1.11 były 3 filmy z TikTokiem (10:00, 14:00, 19:30) i 3 karty z IG (11:30, 17:30, 22:30), co łamie zamrożone zasady (TikTok 1 film dziennie, brak kart na IG). Poprawiłem w Metricool: TikTok zostaje tylko o 19:30 (z 5 hashtagami: #taste #sciencefacts #didyouknow #learnontiktok #pepsafe), 10:00 i 14:00 idą na IG + FB; karty tylko na FB. Przy planowaniu następnych dni pilnuj tego sam: hashtagi TikToka dokładnie 5, bez starego zestawu 6 tagów (#biology #science #chemistry #learnontiktok #education #pepsafe), karty nigdy na IG, 1 film TikTok dziennie.

## Od PepSafe do „główna”
(wpisy dopisuj poniżej, najnowszy na górze)
