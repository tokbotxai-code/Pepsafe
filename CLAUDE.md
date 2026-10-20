# PepSafe – zasady publikacji (Metricool, marka 7506075, Europe/London)

## Harmonogram (codziennie, czas UK)
- 4 okna: 06:00–07:00, 09:00–11:00, 13:00–15:00, 19:00–20:00.
- Każde okno: 1 temat, tylko wersja EN (4 posty dziennie).
- 1 z 4 tematów dziennie to Q&A/ankieta; okno ankiety rotuje z dnia na dzień.
- Ankieta: wersja `feed` 4:5 zapisana jako JPG, jednym postem na IG (POST) i TikToka.
- Treści tworzy codziennie o ~05:00 zaplanowane zadanie „PepSafe content autopilot”.
- Żaden dzień nie może mieć pustego okna: przy każdym uruchomieniu sprawdź dziś i 2 kolejne dni
  (`getScheduledPosts`) i uzupełnij każde wolne okno nowym tematem (EN, oba kanały). Bez powtórek
  tematów z ostatnich 14 dni (sprawdź foldery w `tiktok/`).

## Instagram + TikTok zawsze razem
- Każda treść idzie na **oba** kanały, o tej samej porze (najwyżej 1 min różnicy), w wersji EN.
- Filmik (Reel/TikTok): jeden post Metricool z oboma providerami (`instagram` typ `REEL` + `tiktok`), ten sam MP4.
- Karuzela na IG (`ig-...`, format `feed`): na TikToka idzie **film**, nie slajdy. Skopiuj `post.json` do
  `tiktok/RRRR-MM-DD-<temat>-<lang>/` bez pola `format`, wyrenderuj `node tiktok/make.js tiktok/<folder>`
  i zaplanuj osobny post TikTok **1 minutę po** poście na IG.
- Stories nie są już używane: Q&A/ankieta idzie jako post `feed` 4:5 w JPG na IG (POST) i TikToka razem.
- Przed dodaniem posta sprawdź plan (`getScheduledPosts`), czy treść nie jest już na danym kanale.

## Język: tylko angielski (od 20.10.2026)
- Nowe treści tworzymy **wyłącznie po angielsku** (decyzja właściciela). Zasięgi EN były ok. 20× wyższe niż PL.
- Dotyczy obu kanałów, filmów, ankiet i wpisów „Peptyd dnia” (pole `pl` w `DAILY` zostaje w strukturze strony,
  ale strona i tak ma dwie wersje językowe — treści postów robimy tylko EN).
- Folder tematu: `tiktok/RRRR-MM-DD-<temat>-en/`. Nie dublujemy tematu w wersji `-pl`.
- Pierwszy komentarz i zakończenie opisu w wersji EN („More at pepsafe.info”).

## Dźwięk w filmach (od 20.10.2026)
- Filmy mają **lektora**: `node tiktok/make.js` czyta każdy slajd głosem ElevenLabs „Jessica”
  (`cgSgspJ2msm6clMCkdW9`, model `eleven_multilingual_v2`) i podkłada `music-calm.m4a` ściszony do 14%.
  Plik do publikacji: `pepsafe-<folder>-lektor.mp4`.
- Wymaga zmiennej `ELEVENLABS_API_KEY` w środowisku. Bez niej (albo przy `"vo": false` w `post.json`) film powstaje
  z samą muzyką jako `pepsafe-<folder>-muzyka.mp4` — skrypt się nie wywala.
- Pole `"vo"` w slajdzie nadpisuje zdanie czytane przez lektora (na slajdzie może być krótszy tekst).
- Zostajemy na darmowym planie ElevenLabs (decyzja właściciela): 10 000 znaków/mies. ≈ 40 filmów.
  Dlatego lektora dostaje **tylko jeden film dziennie** — ten z najmocniejszym tematem. Pozostałe renderujemy
  z `"vo": false`, czyli z samym podkładem. Przekroczenie limitu kończy się błędem i filmem bez dźwięku.
- Publikacja zostaje automatyczna (`autoPublish: true`) na obu kanałach.
- Muzyka z katalogu TikToka jest niemożliwa przez API (da się tylko montując w aplikacji). Katalog audio
  Instagrama zwraca 403 dla tego konta i **temat jest zamknięty**: wymagałby konta Business połączonego
  z Facebook Page, a właściciel nie buduje obecności na Facebooku. Nie wracamy do tego.
- Slajdy piszemy krótko: 1 zdanie na slajd, 4–5 slajdów, cały film 12–15 s. Lektor wydłuża slajd do długości
  zdania, więc długie akapity dają filmy 45 s+ i zabijają retencję (średni czas obejrzenia to teraz 1–3 s).
- Do niedzieli 25.10 na TikToka idą maks. **2 filmy dziennie**. Instagram zostaje w pełnym harmonogramie;
  nadwyżkowe tematy planujemy tylko na Instagram.

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

## Zaproszenie do pytań i wiadomości prywatnych
- Każdy post ma pierwszy komentarz (`firstCommentText`) w języku posta:
  PL: „💬 Masz pytanie o ten temat? Napisz w komentarzu albo w wiadomości prywatnej, najciekawsze omówimy w Q&A. Więcej faktów: link w bio / pepsafe.info”
  EN: „💬 Got a question about this? Comment or send us a DM, we'll answer the best ones in a Q&A. More facts: link in bio / pepsafe.info”
- Ostatni slajd: zamiast samego katalogu dodaj linię „Pytania? Komentarz lub wiadomość prywatna” / „Questions? Comment or DM us”.
- Odpowiedzi na wiadomości prywatne: gotowce w `docs/odpowiedzi-dm.md`. Nigdy nie doradzamy dawek, źródeł zakupu ani sposobu stosowania.

## Strona: „Peptyd dnia”
- Przy każdym uruchomieniu dopisz 1 wpis do `var DAILY=[...]` w `index.html` (na początek tablicy), z datą dzisiejszą (Europe/London),
  tematem jednego z dzisiejszych postów z faktami (musi istnieć w katalogu `E("Nazwa",...)`, pole "n" = dokładnie ta nazwa).
  Pola: "date", "n", "pl" (3–5 zdań), "en" (to samo po angielsku), "src" (1–3 prawdziwe źródła [tytuł, URL]).
- Te same zasady co w postach: bez dawek, bez zachęt, nie wymyślamy liczb. Jeśli wpis z dzisiejszą datą już jest, nie dodawaj drugiego.
- Po zmianie: `node --check` na skryptach strony, commit i push razem z postami.

## Limit TikToka (API)
- TikTok przepuszcza przez Metricool ok. 15 postów w przesuwnym oknie 24 h. Powyżej: błąd „too many posts via OpenAPI”.
- Automatycznie (autoPublish true) wysyłamy na TikToka maks. 12 postów w ciągu 24 h. Harmonogram 8/dzień się mieści;
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

## Odwiedziny na stronie (Cloudflare Web Analytics)
- Beacon jest w `index.html` (`data-cf-beacon`, token `68889a9fe6604022bd3fa7d786e5d79f`).
- Uwaga: `siteTag` w API to INNA wartość niż token beacona — dla pepsafe.info jest to `1ba9f12bd6e545c79b6786f5785794cf`.
  Jeśli statystyki wyjdą zerowe, sprawdź aktualny siteTag zapytaniem bez filtra `siteTag` i z wymiarem `siteTag`.
- Podgląd dla właściciela: dash.cloudflare.com → Analytics & Logs → Web Analytics → pepsafe.info.
- Z sesji: `node tools/odwiedziny.js [dni]` — odsłony, wizyty dzień po dniu, najczęściej otwierane adresy,
  skąd przychodzą i kraje. Wymaga `CLOUDFLARE_API_TOKEN` (uprawnienie Account Analytics: Read)
  i `CLOUDFLARE_ACCOUNT_ID` w zmiennych środowiska.

## Budowanie strony (od 20.10.2026)
- Jedyne źródło treści to `dane.html` (katalog `E(...)`, `DAILY`, `FAQ`, `DOSE`, `FAMS`, `ALERTS`, `WADA` itd.).
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
- `tools/strony.js` i `tools/jezyki.js` są **nieużywane** (zastąpił je `v4.js`); zostają jako historia.
- Podgląd przed publikacją: `PEP_OUT=/tmp/x PEP_BASE=/ node tools/v4.js`, potem `python3 -m http.server` w tym katalogu.
  Przy `PEP_BASE` innym niż `/` strony dostają `noindex`.
- **Żaden z 252 adresów zaindeksowanych przed przebudową nie może zgasnąć.** Po każdej zmianie struktury
  sprawdź wszystkie `<loc>` ze starej sitemapy (`git show <commit>:sitemap.xml`) i upewnij się, że zwracają 200.
- Po publikacji zgłoś zmiany: POST na `api.indexnow.org/indexnow` z kluczem z pliku `*.txt` w korzeniu.

## Formularze
- Kontakt (`/<lang>/about.html#contact`) i zgłoszenie skutku ubocznego (`/<lang>/symptoms.html#report`)
  wysyłają przez **FormSubmit** na adres w `FORM_TO` w `tools/v4.js` (`tokbotx.ai@gmail.com`).
  Konto nie jest potrzebne; pierwszą wysyłkę właściciel potwierdza raz klikając link aktywacyjny w mailu.
- Po aktywacji warto podmienić adres na alias z panelu FormSubmit, żeby nie stał jawnie w kodzie strony.
- Formularz kontaktowy dotyczy strony i katalogu, formularz objawów wyłącznie objawów — oba mają notkę
  odsyłającą do drugiego. Nie łączyć ich.

## TikTok po ograniczeniu konta (od 20.10.2026)
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
  Skrypt porównuje `post.json` z całym katalogiem 123 substancji i z listą zakazanych słów i emotek.
  Kod wyjścia 1 = nie planuj, popraw. Sprawdza opis, slajdy, lektora i hashtagi naraz.
- Instagram prowadzi dalej pełną treść z nazwami — tam ograniczeń nie ma.
- Wracamy do tematów z nazwami na TikToku dopiero, gdy ograniczenia znikną i kilka filmów przyrodniczych
  z rzędu wyjdzie bez kary.

## Osobne adresy językowe (historia, zrobione inaczej)
- `node tools/jezyki.js` buduje `/pl/index.html` i `/en/index.html` — kopie strony głównej z zablokowanym
  językiem, własnym `canonical`, tytułem, opisem i wzajemnym `hreflang`. Korzeń `/` zostaje jako `x-default`
  z automatycznym wykrywaniem języka.
- Powód: `/` i `/?lang=en` zwracały ten sam dokument, więc wersja angielska nie istniała dla wyszukiwarek.
- Kolejność przy zmianach w `index.html`: najpierw `node tools/jezyki.js`, potem `node tools/strony.js`
  (ten drugi przebudowuje sitemapę, która zawiera `/`, `/en/`, `/pl/`, `/p/` i 246 stron substancji + FAQ).
- Nie edytuj `pl/` ani `en/` ręcznie — są generowane i zostaną nadpisane.
