# PepSafe – zasady publikacji (Metricool, marka 7506075, Europe/London)

> **Dla autopilota (stan na 22.10 wieczorem):** kanały: Instagram + Facebook + TikTok, wszystko po angielsku, rynek UK/USA.
> Jego polecenie (przepisane 22.10) ma pierwszeństwo tylko w punktach STEP 4 (b), (c), (d). **STEP 4(a) o 6 reklamach dziennie właściciel odwołał 23.10 — obowiązuje sekcja „Reklamy: 2 w tygodniu”** (zero reklam na TikToku). Resztę rozstrzyga ten plik.
> Zasady z 22.10 wieczorem („Mniej, a lepiej”) i z 23.10 („Reklamy: 2 w tygodniu”) zastępują wcześniejsze limity, także STEP 4(a) w poleceniu.

## Pracuj samodzielnie (decyzja właściciela, 21.10)
- **Zmiany w autopilocie wprowadzasz sam w `AUTOPILOT.md`** (commit + push na `main`). Zadanie w aplikacji ma tylko krótkie polecenie „przeczytaj AUTOPILOT.md i wykonaj” i czyta plik od nowa co rano.
  Nigdy nie proś właściciela o edycję zadania. Wyjątki (tylko te wymagają właściciela): godzina uruchomienia, connectory, sekrety. Numerów sesji ani kluczy nie wpisuj do repo (jest publiczne) — sesje wskazuj tytułem.
- Właściciel nie chce pytań ani propozycji do zatwierdzenia. Wszystko, co wynika z tego pliku, **rób od razu sam**
  i opisz w podsumowaniu, co zrobiłeś. Pytaj tylko, gdy coś jest naprawdę ryzykowne albo fakt jest niepewny.
- **Przed końcem każdego uruchomienia sprawdź plan na dziś + 2 dni** i napraw sam:
  - ten sam temat dwa razy jednego dnia (np. karuzela i rolka o tym samym minutę po sobie) → przenieś drugi do pustego okna;
  - puste okno albo brak 3 kart danego dnia → uzupełnij (gotowe tematy w `tiktok/` z datą w przyszłości bierz najpierw,
    przenosząc folder na właściwą datę przez `git mv`);
  - post ze statusem ERROR → ponów na wolną godzinę;
  - opis ucięty w pół zdania (kończy się np. „e.” albo „11.”) albo słowo z listy unikanych → popraw przed zaplanowaniem.
- Zmiana czasu: od 25.10 (02:00) UK ma GMT, czyli offset `+00:00` zamiast `+01:00` w polu `date`.

## Kanały: Instagram + Facebook + TikTok (od 21.10.2026)
- 21.10 właściciel połączył ponownie Instagram i dodał Facebook (stronę) w Metricool. Od teraz każda treść idzie na
  **trzy kanały**: Instagram, Facebook i TikTok.
- Na początku każdego uruchomienia sprawdź `getBrandSettings` → `networksData`. Planuj tylko na kanały, które tam są.
  Jeśli któregoś brakuje, pomiń go i napisz to w podsumowaniu.
- Facebook dostaje to samo co Instagram, w tym samym poście Metricool (dodatkowy provider `facebook`):
  film → `facebookData.type "REEL"`, karuzela/ankieta → `"POST"`. Te same zasady treści co na IG
  (nazwa substancji nie otwiera opisu, bez nazw w hashtagach).
- TikTok bez zmian: tylko tematy przyrodnicze, bez nazw substancji, w limicie dziennym.
- Konto Metricool ma teraz dostęp przez właściciela; stara skrzynka `tokbotx.ai@gmail.com` jest zablokowana — nie używaj jej nigdzie.
- **Tylko angielski na wszystkich trzech kanałach** (decyzja właściciela, 21.10): każda treść EN idzie na Instagram, Facebook i TikTok
  (TikTok z ograniczeniami tematów niżej). Gdy Facebooka nie ma w `networksData`, napisz w podsumowaniu, że trzeba go połączyć.
- **Szkice nie zostają w planie.** Właściciel nie chce, żeby cokolwiek zapychało planer: zamiast zamieniać post na szkic,
  usuń go w Metricool (API nie ma usuwania — jeśli nie da się usunąć, wypisz posty do ręcznego usunięcia w podsumowaniu).

## Więcej postów na IG i FB: karty z katalogu (od 21.10.2026)
- Decyzja właściciela (21.10, na stałe): na Instagramie i Facebooku bazowo **10–12 postów na dobę**: 4 tematy z okien niżej
  + 3 karty z katalogu (decyzja właściciela 23.10).
- **Mniej, a lepiej (decyzja właściciela 22.10 wieczorem, zastępuje „+1 karta co poniedziałek”):** (nieaktualne od 23.10 — obowiązują **3 karty dziennie**, punkt niżej),
  bez wzrostu. Przy ~22 postach dziennie IG miał 243 wyświetlenia — liczba postów nie podnosi zasięgu. Po wynikach testów (2.11)
  raport proponuje, czy zmniejszyć liczbę kart; nie zwiększamy jej bez decyzji właściciela.
- Karty robi skrypt: **`node tools/karty.js 3`** — bierze 3 kolejne substancje bez karty, tworzy `tiktok/karta-<slug>/karta.jpg`
  (4:5) i `caption.txt` z linkiem do strony substancji. Opis już spełnia zasady (nazwa nie otwiera opisu, bez nazw w hashtagach,
  bez słów z listy unikanych). Commit + push, potem planuj z URL z `karta.json`.
- **3 karty dziennie (decyzja właściciela 23.10):** godziny kart (UK) **11:30, 17:30, 22:30**, `node tools/karty.js 3`. Powód: przy 15–20 postach dziennie IG i FB miały 0–3 wyświetlenia na post. Na 26–30.10 część kart jest już w planie — dorób tylko brakujące.
- Post karty: providers `instagram` (`POST`) + `facebook` (`POST`), `media` = JPG karty, `text` = `caption.txt`, pierwszy komentarz EN.
  **Karty nigdy nie idą na TikToka** (są z nazwami substancji).
- Gdy karty się skończą (wszystkie substancje mają folder), zaczynamy drugi obieg dopiero po 30 dniach od pierwszej karty.
- **Żadnych polskich postów** (decyzja właściciela, 21.10): kierujemy się na rynek **UK i USA**. Każdy polski post,
  który wisi w planie (niezależnie od daty utworzenia), usuń z planu (patrz zasada o szkicach wyżej); nie tworzymy nowych wersji PL.

## Rolka z nazwami (IG + FB, od 22.10, pomysł właściciela)
- Codziennie **1 rolka** w formacie: ruchome tło z cząsteczkami, duża nazwa, jedna linijka „do czego badano”, status, lektor US.
  Robi ją skrypt: `node tools/reel.js RRRR-MM-DD-reel-<temat>-en "<krótkie intro>" "Nazwa z katalogu" ...` (4–6 nazw
  z jednej grupy, np. GLP-1, hormon wzrostu, skóra, „research peptides”; nazwy dokładnie jak w `E("...")`).
  Opis i hashtagi z nazwami robi sam (`caption.txt`). Slot **12:30 UK**, tylko IG (`REEL`) + FB (`REEL`). **Nigdy TikTok.**
  Bez powtórki tej samej substancji w rolkach częściej niż raz na 7 dni.

## Harmonogram (codziennie, czas UK)
- 4 okna: 06:00–07:00, 09:00–11:00, 13:00–15:00, 19:00–20:00.
- Każde okno: 1 temat, tylko wersja EN (4 posty dziennie).
- 1 z 4 tematów dziennie to Q&A/ankieta; okno ankiety rotuje z dnia na dzień.
- Ankieta: wersja `feed` 4:5 zapisana jako JPG, jednym postem na IG (POST) i TikToka.
- Treści tworzy codziennie o ~05:00 zaplanowane zadanie „PepSafe content autopilot”.
- Żaden dzień nie może mieć pustego okna: przy każdym uruchomieniu sprawdź dziś i 2 kolejne dni
  (`getScheduledPosts`) i uzupełnij każde wolne okno nowym tematem (EN, oba kanały). Bez powtórek
  tematów z ostatnich 14 dni (sprawdź foldery w `tiktok/`).

## Instagram + Facebook + TikTok zawsze razem
- Każda treść idzie na **wszystkie** połączone kanały, o tej samej porze (najwyżej 1 min różnicy), w wersji EN.
- Filmik: jeden post Metricool z providerami `instagram` (typ `REEL`) + `facebook` (typ `REEL`) + `tiktok`, ten sam MP4.
  Jeśli temat nie nadaje się na TikToka (nazwy substancji), idzie tylko na IG + FB.
- Karuzela na IG (`ig-...`, format `feed`): na TikToka idzie **film**, nie slajdy. Skopiuj `post.json` do
  `tiktok/RRRR-MM-DD-<temat>-<lang>/` bez pola `format`, wyrenderuj `node tiktok/make.js tiktok/<folder>`
  i zaplanuj osobny post TikTok **1 minutę po** poście na IG.
- Q&A/ankieta nie idzie jako story: Q&A/ankieta idzie jako post `feed` 4:5 w JPG na IG (POST), FB (POST) i TikToka razem.
- **Story (od 22.10, decyzja właściciela): 3 dziennie, za każdym razem inne tematy i wygląd.**
  `node tools/story.js RRRR-MM-DD random 3` losuje (stale dla danej daty) typy: Peptide of the day, mit/fakt, słowo ze słownika,
  FAQ, trik marketingowy, losowa karta z katalogu, promocja strony; każda w innym kolorze. Robi 6-sekundowe MP4
  (ruch, pulsująca naklejka „pepsafe.info · link in bio”, spokojna muzyka) → `tiktok/RRRR-MM-DD-story-N-<typ>-en/story.mp4`.
  Commit + push, potem 3 posty Metricool o **09:45, 15:45 i 18:15 UK**: providers `instagram` (`STORY`) + `facebook` (`STORY`),
  media = `story.mp4`, bez `text`. **Nigdy TikTok.** Prawdziwej klikalnej naklejki z linkiem API nie umie dodać — stąd „link in bio”.
  W podsumowaniu podaj linki do plików (właściciel czasem wrzuca story sam z muzyką z aplikacji).
- Przed dodaniem posta sprawdź plan (`getScheduledPosts`), czy treść nie jest już na danym kanale.

## Język: tylko angielski (od 20.10.2026)
- Nowe treści tworzymy **wyłącznie po angielsku** (decyzja właściciela). Zasięgi EN były ok. 20× wyższe niż PL.
- Dotyczy obu kanałów, filmów, ankiet i wpisów „Peptyd dnia” (pole `pl` w `DAILY` zostaje w strukturze strony,
  ale strona i tak ma dwie wersje językowe — treści postów robimy tylko EN).
- Folder tematu: `tiktok/RRRR-MM-DD-<temat>-en/`. Nie dublujemy tematu w wersji `-pl`.
- Pierwszy komentarz i zakończenie opisu w wersji EN („More at pepsafe.info”).

## Dźwięk i długość filmów
- **Każdy film ma lektora.** `node tiktok/make.js tiktok/<folder>` czyta slajdy darmowym głosem Kokoro (US `af_heart`, brytyjski
  przez `KOKORO_VOICE=bf_emma`) i podkłada `music-calm.m4a`. Przed pierwszym renderem w sesji: `pip install -q kokoro-onnx soundfile`.
  Plik do publikacji: `pepsafe-<folder>-lektor.mp4`. ElevenLabs nie używamy (kredyty zostają); nie dodawaj `"vo": "eleven"`.
- Pole `"vo"` w slajdzie nadpisuje zdanie lektora (na slajdzie może być krótszy tekst).
- **Krótko:** 1 zdanie na slajd, 3–5 slajdów, 7–15 s (lektor wydłuża slajd do długości zdania). Średni czas oglądania to 1–3 s,
  więc pierwsze zdanie musi być haczykiem.
- Stare filmy z 18–19.10 (`bpc-157`, `cjc-ipa`, `melanotan`, `mt1-mt2-3diff`, `mt1-vs-mt2`, `semaglutyd`, `tb500`, `wada`, wersje `-en`)
  mają słowa z listy unikanych. Od 27.10 1 dziennie: przepisz slajdy bez tych słów, render z lektorem, tylko IG + FB w wolnym slocie.
- Muzyka z katalogu TikToka/Instagrama przez API jest niemożliwa (403). Nie próbuj ponownie bez sygnału od właściciela.
- Publikacja automatyczna (`autoPublish: true`).

## TikTok dziennie (bez nazw substancji, max 6 postów)
- **2 filmy przyrodnicze z lektorem** w oknach + **krótki pokaz o 17:00** (`node tools/fotki.js tiktok/<folder> RRRR-MM-DD-short-<temat>-en 3`
  albo 3-slajdowy `post.json` + `make.js`) + od 25.10 **obraz w stylu Dola o 21:30** (25–30.10 ten slot zajmują już grafiki właściciela).
- Slot 19:00: film przyrodniczy z zapasu (od 25.10 bez reklam na TikToku).
- Slot 23:00 UK (decyzja właściciela 23.10): trzeci film przyrodniczy z lektorem, z zapasu albo nowy, po `sprawdz.js`. Razem maks. 6 postów na TikToku dziennie, limit API 12/24 h.
- **Hamulec:** gdy w ostatnich 3 dniach jakiś film zniknął albo ma ERROR — 2 filmy dziennie przez 3 dni, napisz to w podsumowaniu.
- Ten sam temat na TikToku najwyżej raz na 14 dni (powtórka tego samego dnia: 5 wyświetleń zamiast ~230).
- **Obraz w stylu Dola:** `node tools/obraz.js RRRR-MM-DD-img-<temat>-en "<prompt tła po angielsku>" "<NAGŁÓWEK>" "<jedno zdanie faktu>"`.
  Tło z Pollinations (ciemne, kinowe: sylwetki, przezroczyste ciało, narządy, komórki — bez strzykawek, fiolek, tabletek, nagości
  i twarzy realnych osób). Temat: skutki szybkiej utraty wagi, fakty ze źródeł, zero nazw. Post: `obraz.jpg`, `autoAddMusic: true`,
  `isAigc: true`; przed planem `sprawdz.js` (zrób `post.json` z caption i slides).
- **Grafiki właściciela z Dola:** `node tools/dola.js <spec.json>`; obrazy AI mają `isAiGenerated: true` (IG) i `isAigc: true` (TikTok).
- Źródło dodatkowych filmów: przyrodnicze tematy, które już poszły na IG + FB, wrzucone na TikToka 3–5 dni później (po `sprawdz.js`).

## Media
- Na początku każdej pracy z repo: `git fetch origin main && git reset --hard origin/main` (historia bywa przepisywana; nie używaj `git pull`).
- TikTok **nie przyjmuje PNG** – używaj MP4 (`pepsafe-<folder>-muzyka.mp4`) albo JPG.
- Pliki publikuj przez commit + push do `main`; GitHub Pages wystawia je pod
  `https://pepsafe.info/tiktok/<folder>/<plik>` (zwykle po ok. 30–60 s). Ten URL podawaj w `media`.

## Treść
- Każdy opis kończy się „Więcej na pepsafe.info” / „More at pepsafe.info” i hashtagiem `#pepsafe`.
- Treść edukacyjna, bez dawkowania i zachęt do stosowania; fakty tylko z wiarygodnych źródeł (FDA, WADA, badania).
- Pola etykiety treści syntetycznych `isAiGenerated` (IG) i `isAigc` (TikTok) = `false` dla grafik/filmów z tekstem
  (decyzja właściciela). Realistyczne syntetyczne obrazy, wideo lub głos wymagałyby `true` (wymóg platform) – nie publikujemy takich.

## Słowa i obrazy, których unikamy (moderacja TikTok/IG)
TikTok blokuje treści, które wyglądają na ułatwianie zakupu lub stosowania substancji (tak został wstrzymany BPC-157 PL z 18.10: „zanim kupisz fiolkę”).
- Nie używamy: kup / zakup / „zanim kupisz” / buy / „before you buy”, fiolka / vial, sklep / shop / „gdzie dostać”,
  wstrzyknąć / „zanim wstrzykniesz” / inject, dawka / dose / dawkowanie, cykl / cycle, protokół / stack.
- Wyjątek: zdanie ostrzegawcze typu „bezpieczeństwo u ludzi nieustalone” zamiast „dawki nieustalone”.
- Bez zdjęć fiolek, strzykawek, proszków; bez linków do sklepów. Bez emotki 💉 w opisach, tytułach i na slajdach.
- Nie robimy poradników „jak kupić bezpiecznie” (np. jak sprawdzić sprzedawcę/COA przed zakupem). Ujęcie: fakty, ryzyka, triki marketingu, status prawny.
- Hashtagi bez #biohacking #fitness #gym #bodybuilding przy nazwach substancji.
- Nazwy substancji piszemy normalnie (bez zmieniania pisowni, kropek, spacji).
- **Nazwy substancji nie trafiają do hashtagów** (zostają w treści jako zwykłe słowa). Hashtag typu `#bpc157`
  stawia nazwę wprost w indeksie wyszukiwania TikToka i tak zdjęto film o WADA z 20.10.
- **Bez emotki 🚫** i bez otwierania opisu od „zakazane / banned / prohibited list”. Dla klasyfikatora TikToka
  „substancje zakazane” + nazwa substancji to sygnał treści narkotykowej, nawet gdy piszemy o antydopingu w sporcie.
  Zamiast tego neutralnie: „WADA's 2026 list — what changed”.
- Pierwsze zdanie opisu to ciekawostka albo fakt, nigdy zakaz ani ostrzeżenie.
- **Zmiana 21.10 (decyzja właściciela): na Instagramie i Facebooku piszemy PEŁNE NAZWY** — nazwa może otwierać opis
  i mieć własny hashtag (np. `#semaglutide`). Karty robią to same (`tools/karty.js`). Dalej obowiązuje lista słów
  unikanych (kup, dawka, wstrzyknąć itd.) i 💉/🚫. **TikTok bez zmian: zero nazw** (punkty niżej dotyczą już tylko TikToka).
  Jeśli post idzie naraz na IG + FB + TikTok, ma jeden opis — wtedy bez nazw; nazwy tylko w postach IG + FB.
- (Tylko TikTok) **Nazwa substancji nie otwiera opisu (decyzja z 20.10, od 21.10 zawężona do TikToka).**
  Zamiast nazwy piszemy mechanizm albo klasę: „potrójny agonista GLP-1”, „kompleks miedziowy”,
  „analog hormonu uwalniającego gonadotropiny”. Nazwa może pojawić się dalej w opisie, jeśli jest potrzebna,
  ale nie w pierwszym zdaniu i nigdy w hashtagu. Powód: pierwsze słowa i hashtagi trafiają do indeksu
  wyszukiwania, a to po nich platformy klasyfikują treść jako narkotykową.
- Hashtagi ogólne zamiast nazw: `#glp1 #peptydy #nauka #fakty` zamiast `#retatrutyd #melanotan`.
  Wyjątek: nazwy, które nie są substancjami regulowanymi, np. `#kolagen`.

## Zaproszenie do pytań i wiadomości prywatnych
- Każdy post ma pierwszy komentarz (`firstCommentText`) w języku posta:
  PL: „💬 Masz pytanie o ten temat? Napisz w komentarzu albo w wiadomości prywatnej, najciekawsze omówimy w Q&A. Więcej faktów: link w bio / pepsafe.info”
  EN: „💬 Got a question about this? Comment or send us a DM, we'll answer the best ones in a Q&A. More facts: link in bio / pepsafe.info”
- Ostatni slajd: zamiast samego katalogu dodaj linię „Pytania? Komentarz lub wiadomość prywatna” / „Questions? Comment or DM us”.
- Odpowiedzi na wiadomości prywatne: gotowce w `docs/odpowiedzi-dm.md`. Nigdy nie doradzamy dawek, źródeł zakupu ani sposobu stosowania.

## Strona: „Peptyd dnia”
- **Priorytet nr 1 każdego dnia** (decyzja właściciela, 21.10): wpis robisz jako PIERWSZĄ rzecz po `git reset`, przed postami.
- Trzymaj **zapas co najmniej 2 dni do przodu** (wpisy z datami jutro i pojutrze). Generator (`tools/v4.js`) pokazuje
  najnowszy wpis z datą ≤ dziś (UK), a workflow `.github/workflows/codziennie.yml` przebudowuje stronę o 00:05 UK,
  więc wpis pojawia się sam, nawet gdy autopilot danego dnia nie ruszy. Sprawdzaj, czy zapas nie spadł do zera.
- Przy każdym uruchomieniu dopisz 1 wpis do `var DAILY=[...]` w `index.html` (na początek tablicy), z datą dzisiejszą (Europe/London),
  tematem jednego z dzisiejszych postów z faktami (musi istnieć w katalogu `E("Nazwa",...)`, pole "n" = dokładnie ta nazwa).
  Pola: "date", "n", "pl" (3–5 zdań), "en" (to samo po angielsku), "src" (1–3 prawdziwe źródła [tytuł, URL]).
- Te same zasady co w postach: bez dawek, bez zachęt, nie wymyślamy liczb. Jeśli wpis z dzisiejszą datą już jest, nie dodawaj drugiego.
- Po zmianie: `node --check` na skryptach strony, commit i push razem z postami.

## Limit TikToka (API)
- TikTok przepuszcza przez Metricool ok. 15 postów w przesuwnym oknie 24 h. Powyżej: błąd „too many posts via OpenAPI”.
- Automatycznie (autoPublish true) wysyłamy na TikToka maks. 12 postów w ciągu 24 h. Harmonogram 4/dzień (plus filmy do kart z IG) się mieści;
  dodatkowe posty (poprawki, powtórki) planuj na TikToka z autoPublish false, czyli do ręcznej publikacji z telefonu
  (Metricool wysyła powiadomienie), albo przesuń na kolejny dzień. Instagram może iść automatycznie.

## Repozytorium jest publiczne: neutralne ślady
- Przed commitem ustaw: `git config user.name "PepSafe"` i `git config user.email "noreply@pepsafe.info"`.
- W opisach commitów nie wspominaj o narzędziach ani modelach; bez linii „Co-Authored-By” innych niż
  `Co-Authored-By: PepSafe <noreply@pepsafe.info>`. Bez linków do sesji.
- Na stronie, w postach i w plikach w repo nie opisujemy, jakimi narzędziami powstają treści.

## Oszczędzanie limitu (ważne przy autopilocie)
- Katalog siedzi w `dane.html` (ok. 404 kB, ~100 tys. tokenów). **Nie czytaj go całego.** Wpis „Peptyd dnia” dodawaj skryptem:
  zapisz jeden wpis do pliku JSON i uruchom `node tools/daily.js <plik.json>`. Skrypt sam sprawdza, czy nazwa jest
  w katalogu i czy wpis z tą datą już istnieje.
- Czegokolwiek szukasz w `dane.html`, używaj `grep`/`Grep` z numerami linii i czytaj tylko potrzebny fragment
  (`Read` z `offset`/`limit`), nigdy całości.
- Jedno uruchomienie dziennie robi całą dniówkę (4 tematy) zamiast wielu krótkich sesji — każda nowa sesja
  czyta od zera CLAUDE.md i plan.
- Do rutynowej dniówki wystarczy tańszy model; Opus tylko do zmian w kodzie strony i analiz.

## Raport tygodniowy (decyzja właściciela 21.10)
- **W każdy poniedziałek autopilot (ten sam poranny przebieg, ma połączenie z Metricool) robi też pełny raport tygodniowy**, po dniówce:
  1. Strona: `node tools/odwiedziny.js 7` i `14` — odsłony/wizyty dzień po dniu, top adresy, skąd, kraje, wejścia z linku w bio
     (`/start/ig|tt|fb.html`), porównanie z poprzednim tygodniem.
  2. IG, FB, TikTok (Metricool `getAnalyticsAvailableMetrics` + `getAnalyticsDataByMetrics`): ostatnie 7 dni vs 7 wcześniej —
     obserwujący, wyświetlenia, zasięg, polubienia, komentarze, udostępnienia, zapisy, wejścia na profil, kliknięcia; plus liczby
     każdego posta z tygodnia z formatem (rolka z lektorem, rolka z nazwami, karta, story, obraz z Doli, pokaz slajdów, ankieta) i tematem.
  3. **Najpierw sumy tygodnia**, w stylu: „Instagram: cały tydzień 2,0 mln wyświetleń (+X% vs poprzedni). Z tego 1 post —
     <temat, format, dzień> — dał 1,5 mln (75%).” Dla każdej platformy i dla strony. Zawsze nazwij posty, które zrobiły dużą część wyniku,
     i najsłabsze formaty.
  4. Przy każdym hicie i wpadce wniosek i działanie: „dlatego: więcej X / mniej Y / powtórzyć temat Z w formacie W o godzinie H”,
     oparte na liczbie. Wnioski od razu stosuj w planie na kolejny tydzień i napisz, co zmieniłeś.
  5. Jedna prywatna strona z wykresami (Artifact „PepSafe raport tygodniowy <zakres dat>”): sumy na platformę, wyświetlenia dzień po dniu,
     udział najlepszych postów, porównanie formatów, odwiedziny i link w bio. Po polsku, krótko.
  6. Liczby tylko z danych; czego brak — „brak danych” i dlaczego. W podsumowaniu: link do raportu, sumy, 3 hity z udziałem, 3–5 działań.
- **Codziennie rano (decyzja właściciela 21.10), na samym początku podsumowania — blok „Wczoraj”, osobna linijka na każdą platformę:**
  - **Strona:** odsłony, wizyty, top 3 adresy, skąd, kraje (`node tools/odwiedziny.js 1`) + zmiana vs przedwczoraj.
  - **Link w bio:** „IG x · TikTok y · FB z” (wejścia na `/start/ig|tt|fb.html`); gdy któryś ma 0 kilka dni z rzędu — napisz, żeby sprawdzić.
  - **Instagram / Facebook / TikTok** (Metricool analytics), każda osobno: obserwujący (+/−), wyświetlenia, zasięg, polubienia,
    komentarze, udostępnienia, ile postów wyszło, najlepszy post (temat, format, liczba) i najsłabszy; posty ERROR/usunięte.
  - Jedno zdanie wniosku na dziś (np. „grafika z Doli zrobiła 60% wyświetleń IG — dziś też taka o 09:15”). Liczby tylko z danych,
    czego brak — „brak danych”.

## Link w bio (od 21.10)
- `tools/v4.js` pod adresami `/start/ig.html`, `/start/tt.html`, `/start/fb.html` wystawia **pełną stronę główną**
  (decyzja właściciela 21.10: bez uproszczonej strony z przyciskami — nie przywracać), noindex, canonical na `/`.
  Na stronie głównej jest baner z przewodnikami PDF i link do Ko-fi, w menu zakładka „Guides (PDF)”. Osobne adresy pokazują
  w `node tools/odwiedziny.js`, która platforma przysyła ludzi. W bio: IG → `pepsafe.info/start/ig.html`, TikTok → `/start/tt.html`,
  Facebook → `/start/fb.html`. Raporty liczą wejścia na te adresy jako „z Instagrama/TikToka/Facebooka”.

## Zarabianie (od 21.10)
- Przewodnik PDF „GLP-1 Weight-Loss Medicines: The Complete Safety Guide” sprzedajemy na Ko-fi: **https://ko-fi.com/s/6d19973042** (£5.99).
  Plik PDF NIE trafia do repo (repo jest publiczne). `GUIDE_URL` w `tools/v4.js` daje ramkę „Get the PDF” na kartach leków GLP-1/GIP
  i przycisk na `/start/`.
- Drugi produkt: „Protein & Muscle on GLP-1” (PDF + kalkulator + tracker) **https://ko-fi.com/s/424db783e5** (£9.99), `MUSCLE_URL` w v4.js — ta sama ramka na kartach GLP-1 i przycisk na `/start/`. W postach o białku/mięśniach można wspomnieć ten przewodnik zamiast pierwszego (limit reklam: sekcja „Reklamy: 2 w tygodniu” niżej; nigdy grafiki przewodnika na TikToku).
- **Lista mailowa (od 21.10):** `/en/free.html` (i `/pl/`) — zapis e-mail + zgoda → FormSubmit na contact@pepsafe.info
  (temat „PepSafe: newsletter signup”), potem `/en/free-thanks.html` z darmową checklistą `free/glp1-muscle-checklist.pdf`
  i poleceniem przewodnika o mięśniach. Polityka prywatności: `/en/privacy.html`, `/pl/privacy.html` (link w stopce).
  Przycisk „Free checklist 🎁” na `/start/`. Od 23.10 zapis idzie naraz do FormSubmit (mail na contact@) i do MailerLite
  (formularz „PepSafe signup”, grupa PepSafe, `ML_FORM` w v4.js, wysyłka w `src/ruch.js`). Domena pepsafe.info jest uwierzytelniona
  w MailerLite od 23.10 (DKIM CNAME `litesrv._domainkey`, SPF `v=spf1 include:_spf-eu.ionos.com include:_spf.mlsend.com ~all` w IONOS — nie zmieniać,
  bo zepsuje pocztę contact@ albo wysyłkę newsletterów). „Domain alignment” (płatne) nie jest potrzebne.
  W postach IG + FB można czasem dodać: „Free checklist: 5 mistakes that cost you muscle on GLP-1 — link in bio”.
- **Strona `/en/guides.html` (i `/pl/`)**: podgląd 3 stron z każdego PDF (`guides/*.jpg`, ze znakiem PREVIEW), prawdziwe źródła, gwarancja zwrotu 14 dni (prośba na contact@ → zwrot przez Ko-fi/PayPal). Link w bio i ramki GLP-1 do niej prowadzą.
- **Opinie klientów (decyzja właściciela 22.10):** dozwolone, ale tylko prawdziwe: autor zatwierdził na piśmie dokładny tekst,
  podpis imieniem albo inicjałami + kraj, cytat słowo w słowo (skrót do dosłownego fragmentu wolno, przeróbki nie).
  Gdy autor dostał przewodnik za darmo, zawsze krótka notka, np. „Reviewers received free copies of both guides.” (wymóg UK DMCC Act
  i FTC w USA — nie usuwamy jej). Nigdy nie wymyślamy, nie łączymy ani nie „poprawiamy” opinii. Na `/en/guides.html` i w reklamach IG + FB, nigdy na TikToku.
- Pakiet obu przewodników (ZIP: 2 PDF + kalkulator + tracker) — £11.99; link jeszcze nie podany przez właściciela. Gdy będzie: stała `BUNDLE_URL` w v4.js i przycisk na `/start/` oraz w ramce GLP-1.
- Wpłaty: profil Ko-fi **https://ko-fi.com/pepsafeinfo** (`KOFI` w `tools/v4.js`: stopka każdej strony + przycisk na `/start/`). Płatności przez PayPal właściciela.
- **Reklamy: 2 w tygodniu (decyzja właściciela 23.10, zastępuje „3 dziennie” z 22.10 i STEP 4(a) w poleceniu autopilota):**
  Dane z 21–22.10: reklamy na IG i FB 0 wyświetleń, na TikToku 1 i 13, a filmy przyrodnicze na TikToku 221–237.
  - **TikTok: zero reklam.** Slot 19:00 dostaje film przyrodniczy z lektorem (zapas: `tiktok/ZAPAS.md`, po `sprawdz.js`).
  - **IG + FB: 1 reklama na platformę w tygodniu** — FB w środę 14:15 (przewodnik, link `/en/guides.html`),
    IG w sobotę 20:15 (na zmianę przewodnik „link in bio” i kawa na Ko-fi). W pozostałe dni te sloty dostają kartę z katalogu
    albo zwykły post z faktami.
  - Ko-fi i darmowa checklista mogą być jedną linijką na końcu zwykłych opisów IG + FB (nie częściej niż co 3. post).
  - Grafiki 4:5 w `tiktok/2026-10-22-ads-en/`; dalej obowiązuje lista słów unikanych, zero zmyślonych liczb i zasada o opiniach.
  - Wracamy do większej liczby reklam dopiero na decyzję właściciela po raporcie 2.11.

## Plan testów (24–30.10)
- Szczegóły w `docs/testy.md`: codziennie jedna zmienna (długość, haczyk, pierwsza klatka, temat, format, „do zapisania”, godzina),
  wersje A/B na filmie z okna 13:00–15:00 i krótkim filmie TikToka o 17:00. Wynik po 48 h, podsumowanie w raporcie 2.11, zwycięzcy wchodzą do stałych zasad.
- Punkt wyjścia: rolki IG oglądane średnio 1–3 s; filmy przyrodnicze na TikToku ~230 wyświetleń; powtórka tematu na TikToku tego samego dnia — 5.

## Odwiedziny na stronie (Cloudflare Web Analytics)
- Beacon wstawia **generator**: stała `CF_BEACON` w `tools/v4.js` trafia do każdej generowanej strony (21.10: 452)
  (token `68889a9fe6604022bd3fa7d786e5d79f`). Po każdej przebudowie sprawdź `grep -c cf-beacon index.html`.
- **Uwaga:** przy przenoszeniu strony na v4 beacon został w starym `index.html` i przez kilka godzin
  20.10 nie zbierał nic. Przy każdej zmianie szablonu upewnij się, że skrypt licznika nadal tam jest.
- Uwaga: `siteTag` w API to INNA wartość niż token beacona — dla pepsafe.info jest to `1ba9f12bd6e545c79b6786f5785794cf`.
  Jeśli statystyki wyjdą zerowe, sprawdź aktualny siteTag zapytaniem bez filtra `siteTag` i z wymiarem `siteTag`.
- Podgląd dla właściciela: dash.cloudflare.com → Analytics & Logs → Web Analytics → pepsafe.info.
- Z sesji: `node tools/odwiedziny.js [dni]` — odsłony, wizyty dzień po dniu, najczęściej otwierane adresy,
  skąd przychodzą i kraje. Wymaga `CLOUDFLARE_API_TOKEN` (uprawnienie Account Analytics: Read)
  i `CLOUDFLARE_ACCOUNT_ID` w zmiennych środowiska.

## Budowanie strony (od 20.10.2026)
- Jedyne źródło treści to `dane.html`. Generator czyta z niego: `D` (katalog), `EN`, `ST`, `FAMS`, `DAILY`,
  `FAQ`, `QA`, `ALERTS`, `TRICKS`, `MYTHS`, `SRC`, `WADA`, `DOSE`, `SY_PL/SY_EN`, **`GL` (słownik),
  `CONFUSE` (bywa mylone z) i `POSTS` (dłuższe teksty)**. Dodając nowy blok danych, dopisz go do listy
  wczytywanych bloków w `tools/v4.js`, inaczej po cichu zniknie ze strony.
  Zmiany wprowadzaj tylko tam.
- Nowe substancje dodawaj skryptem: zapisz wpisy do pliku JSON i uruchom **`node tools/dodaj.js <plik.json>`**
  (pola: n, a, s, c, cat, fam, d, m, u, ev, w, opcjonalnie q i wa, oraz `en` — 7 pól wersji angielskiej).
  Skrypt sprawdza statusy, kategorie i rodziny oraz pomija wpisy, które już są. Nie dopisuj ręcznie do `dane.html`.
- Po dodaniu wpisów uruchom **`node tools/audyt.js`** (albo `--nowe N` dla ostatnich N): sprawdza urwane pola,
  brak wersji angielskiej, powtórzone zdania, dawki przy substancjach niezatwierdzonych i zdanie zamykające
  przy statusie „Niezatwierdzony”. Kod wyjścia 1 = popraw przed publikacją.
- Po dodaniu wpisów uruchom **`node tools/rodziny.js`** — listy członków grup (`FAMS[].m`) są osobne od pola `fam`
  przy wpisie i bez tego nowa substancja nie trafia do grupy ani do sprawdzarki dublowania. `--sprawdz` tylko sprawdza.
- Po każdej zmianie: **`PEP_OUT=. PEP_BASE=/ node tools/v4.js`**. Buduje `/index.html`, `/en/`, `/pl/`,
  `/p/<slug>.html` (EN), `/p/<slug>.pl.html` (PL), `/p/index.html`, `/p/faq.html`, `/assets/` i `sitemap.xml`.
- Style i skrypt strony są w `src/site.css` i `src/ruch.js`; generator kopiuje je do `assets/`.
  Nie edytuj `assets/`, `en/`, `pl/`, `p/` ani `index.html` — są generowane i zostaną nadpisane.
- `tools/og.js` odświeża obrazki udostępniania (`src/og-en.png`, `src/og-pl.png`) — tylko gdy zmienia się hasło strony.
- `tools/strony.js` i `tools/jezyki.js` zostały usunięte (zastąpił je `v4.js`). Nie uruchamiaj ich i nie odtwarzaj.
- Podgląd przed publikacją: `PEP_OUT=/tmp/x PEP_BASE=/ node tools/v4.js`, potem `python3 -m http.server` w tym katalogu.
  Przy `PEP_BASE` innym niż `/` strony dostają `noindex`.
- **Żaden z 252 adresów zaindeksowanych przed przebudową nie może zgasnąć.** Po każdej zmianie struktury
  sprawdź wszystkie `<loc>` ze starej sitemapy (`git show <commit>:sitemap.xml`) i upewnij się, że zwracają 200.
- Po publikacji zgłoś zmiany: POST na `api.indexnow.org/indexnow` z kluczem z pliku `*.txt` w korzeniu.
- **Po każdej przebudowie uruchom `node tools/kontrola.js`** — jedna komenda sprawdza wszystko naraz:
  licznik odwiedzin, słownik, teksty, RSS, ikonę, dane organizacji, stronę 404, liczbę kart i adresów,
  audyt wpisów, zgodność grup, źródła, martwe linki wewnętrzne i to, czy wszystkie wcześniej zaindeksowane
  adresy nadal istnieją. Kod wyjścia 1 = nie publikuj.
  Powstała, bo przy przenosinach na v4 zniknęły licznik, słownik, 6 tekstów, powiązania „bywa mylone z”
  i kanał RSS — każde z innego powodu i żadne nie dało znaku.
- Źródła: `node tools/zrodla.js` dopisuje brakujące odnośniki do DailyMed, ClinicalTrials.gov i PubMed
  (wyszukiwania po nazwie, nie konkretne dokumenty — dzięki temu nie gasną przy aktualizacji etykiety).
  EMA i accessdata.fda.gov blokują zapytania automatyczne, więc ich nie używamy.

## Formularze
- Kontakt (`/<lang>/about.html#contact`) i zgłoszenie skutku ubocznego (`/<lang>/symptoms.html#report`)
  wysyłają przez **FormSubmit** na adres w `FORM_TO` w `tools/v4.js` (`contact@pepsafe.info`).
  Konto nie jest potrzebne; pierwszą wysyłkę właściciel potwierdza raz klikając link aktywacyjny w mailu.
- Adres na własnej domenie, nie prywatna skrzynka: jeśli dostawca poczty zablokuje konto, wymieniamy
  tylko przekierowanie, a kod strony zostaje bez zmian. 20.10 zablokowano `tokbotx.ai@gmail.com`
  i formularz przez kilka godzin wysyłał w próżnię — stąd ta zasada.
- Po aktywacji warto podmienić adres na alias z panelu FormSubmit, żeby nie stał jawnie w kodzie strony.
- Formularz kontaktowy dotyczy strony i katalogu, formularz objawów wyłącznie objawów — oba mają notkę
  odsyłającą do drugiego. Nie łączyć ich.

## TikTok po ograniczeniu konta (od 20.10.2026)
- **Aktualizacja 22.10: TikTok przywraca filmy — usuniętych zostało już tylko 8** (właściciel sprawdza w aplikacji).
  Przywróconych nie publikujemy ponownie ani nie edytujemy; nowe treści dalej wyłącznie przyrodnicze, bez nazw.
- **Aktualizacja 20.10 wieczorem: usuniętych jest 15 filmów.** Para WADA opublikowana 20.10 o 06:15 i 06:30
  została zdjęta tego samego dnia (strony filmów zwracają „This page isn't available”). Miały emotkę 🚫,
  ramę „lista zakazanych substancji” i hashtag `#bpc157` — czyli dokładnie to, czego zakazują zasady niżej.
  Zostały zaplanowane, zanim te zasady powstały.
- **Przeżyły oba filmy bez tego wzorca**: ankieta KLOW/GLOW (nazwy mieszanek, bez nazw substancji w hashtagach)
  i „Fifteen benefits is the tell” (zero nazw). Wzorzec potwierdzony po raz kolejny.
- 19–20.10 TikTok **usunął 13 filmów** (wszystkie oznaczone „Video removed”, nie samo ograniczenie zasięgu).
  Decyzje podjęły automaty: „We have used automated measures in making this decision”.
- Usunięte: para WADA (20.10), para „15 rzeczy, które TB-500 rzekomo leczy”, para CJC-1295 + Ipamorelin,
  para TB-500 „peptyd na regenerację”, para MT1 vs MT2, para Melanotan I i II, BPC-157 „co naprawdę wiadomo”.
  Zawsze obie wersje językowe naraz — czyli wzorzec, nie konkretne sformułowanie.
- **Wspólny mianownik wszystkich 13: nazwa substancji w pierwszych słowach opisu I na okładce filmu.**
  TikTok czyta tekst ze slajdu, nie tylko opis. Dlatego nazwa nie może pojawić się nigdzie: ani w opisie,
  ani w hashtagu, ani na slajdzie, ani w lektorze.
- Dodatkowe sygnały w usuniętych: emotka 💉 (para CJC-1295), 🚫 (para WADA), rama „fact-checking / mit czy fakt”,
  słowa FDA, „zakazany”, „rzekomo leczy”.
- Dane z 14 dni są jednoznaczne: filmy **bez ani jednej nazwy substancji** („What actually is a peptide?”)
  miały 251–252 wyświetlenia, a wszystko z nazwami 4–11. Różnica 20–60×.
- Dlatego na TikToka idą **wyłącznie treści czysto przyrodnicze**: aminokwasy, łańcuchy, zwijanie białek,
  okres półtrwania, enzymy, historia odkryć. Zero nazw substancji w opisie, na slajdach i w lektorze.
  Nazwy zostają na stronie i na Instagramie.
- Hashtagi na TikToka: `#biology #science #chemistry #learnontiktok #education #pepsafe`.
- **Przed zaplanowaniem czegokolwiek na TikToka uruchom `node tools/sprawdz.js tiktok/<folder>`.**
  Skrypt porównuje `post.json` z całym katalogiem substancji (czytanym na bieżąco z `dane.html`, 21.10: 203) i z listą zakazanych słów i emotek.
  Kod wyjścia 1 = nie planuj, popraw. Sprawdza opis, slajdy, lektora i hashtagi naraz.
- Instagram prowadzi dalej pełną treść z nazwami — tam ograniczeń nie ma.
- Wracamy do tematów z nazwami na TikToku dopiero, gdy ograniczenia znikną i kilka filmów przyrodniczych
  z rzędu wyjdzie bez kary.

## Osobne adresy językowe
- `/en/` i `/pl/` mają własny `canonical`, tytuł i wzajemny `hreflang`; `/` to `x-default`. Wszystko buduje `tools/v4.js`
  (dawne `jezyki.js` i `strony.js` są usunięte). Powód: `/` i `/?lang=en` były kiedyś tym samym dokumentem.
