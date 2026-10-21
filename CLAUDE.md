# PepSafe – zasady publikacji (Metricool, marka 7506075, Europe/London)

> **Dla autopilota:** jego polecenie startowe (z 19.10) mówi o PL i EN, 8 postach dziennie, dwóch kanałach, każdej treści
> na TikToku i pliku `-muzyka.mp4`. To jest nieaktualne. Kanały są trzy: Instagram, Facebook i TikTok (sekcja niżej). Okna zostają te same, ale w każdym jest **jeden temat tylko po angielsku**,
> TikTok dostaje tylko tematy przyrodnicze bez nazw substancji (max 2 dziennie do 25.10), a lektor i nazwy plików
> są opisane niżej. Przy każdej rozbieżności obowiązuje ten plik, także w sprawie okien i języka.

## Pracuj samodzielnie (decyzja właściciela, 21.10)
- Właściciel nie chce pytań ani propozycji do zatwierdzenia. Wszystko, co wynika z tego pliku, **rób od razu sam**
  i opisz w podsumowaniu, co zrobiłeś. Pytaj tylko, gdy coś jest naprawdę ryzykowne albo fakt jest niepewny.
- **Przed końcem każdego uruchomienia sprawdź plan na dziś + 2 dni** i napraw sam:
  - ten sam temat dwa razy jednego dnia (np. karuzela i rolka o tym samym minutę po sobie) → przenieś drugi do pustego okna;
  - puste okno albo brak 7 kart danego dnia → uzupełnij (gotowe tematy w `tiktok/` z datą w przyszłości bierz najpierw,
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
  + 7 kart z katalogu = 11.
- **Tempo rośnie co tydzień** (decyzja właściciela, 21.10): w każdy poniedziałek dochodzi **+1 karta na dobę**
  (26.10: 8 kart = 12 postów, 2.11: 9 kart = 13, itd.). Nowe godziny kart wstawiaj w luki między istniejącymi,
  najlepiej wieczorem i w nocy UK (ruch z USA). Górny limit: 25 postów na dobę na kanał (limit API Instagrama to 50/24 h,
  zostawiamy zapas). Przy błędach limitu albo spadku zasięgów wstrzymaj wzrost i napisz to w podsumowaniu.
- Karty robi skrypt: **`node tools/karty.js 7`** — bierze 7 kolejnych substancji bez karty, tworzy `tiktok/karta-<slug>/karta.jpg`
  (4:5) i `caption.txt` z linkiem do strony substancji. Opis już spełnia zasady (nazwa nie otwiera opisu, bez nazw w hashtagach,
  bez słów z listy unikanych). Commit + push, potem planuj z URL z `karta.json`.
- Godziny kart (UK): **08:00, 11:30, 16:00, 17:30, 21:00, 22:30, 00:30** (późne łapią USA, skąd jest połowa ruchu).
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
- **Budżet lektora:** przed renderem z lektorem uruchom `node tools/lektor.js` (liczy znaki z filmów `-lektor.mp4`
  od 20.10). Kod wyjścia 1 = zostało < 400 znaków: renderuj wszystko z `"vo": false` aż do odnowienia limitu.
  21.10 po 17 filmach zostało ok. 4 900 znaków, więc lektor **tylko 1 film dziennie i tylko ten, który idzie na TikToka**,
  zdania krótkie (cel ≤ 250 znaków na film). Gdy limit się odnowi, zmień datę startu w wywołaniu skryptu.
- **Darmowy lektor Kokoro (od 21.10, decyzja właściciela: KAŻDY film ma głos, ElevenLabs NIE używamy — kredyty zostają):**
  `make.js` domyślnie czyta wszystko głosem US `af_heart`; nie dodawaj `"vo": "eleven"` bez decyzji właściciela.
  Zasady o budżecie ElevenLabs i „1 film dziennie” wyżej są nieaktualne. `"vo": false` nie używamy — wtedy też ma głos (open source, Apache 2.0, bez limitu). Przed pierwszym renderem w sesji:
  `pip install -q kokoro-onnx soundfile` (model ~350 MB pobiera się sam do `~/.cache/kokoro`). Głos domyślny `af_heart`
  (US), brytyjski `bf_emma` przez `KOKORO_VOICE=bf_emma`. Gdy ElevenLabs zwróci błąd albo nie ma klucza, `make.js`
  sam przełącza się na Kokoro. Plik wynikowy jak zawsze `pepsafe-<folder>-lektor.mp4`.
- **Stare filmy bez głosu (decyzja właściciela, 21.10: każdy film ma mieć lektora, także te, które już wyszły).**
  Ponownie opublikowane z głosem: COA (21.10), GHK-Cu (23.10), „What is a peptide” i TB-500 vs BPC-157 (26.10).
  Zostało 9 folderów z 18–19.10 (`bpc-157`, `cjc-ipa`, `melanotan`, `mt1-mt2-3diff`, `mt1-vs-mt2`, `semaglutyd`,
  `tb500`, `wada` i podobne `-en`): mają na slajdach słowa z listy unikanych (injection, dose, banned, buy, shops, vials).
  Od 27.10 bierz **1 dziennie**: przepisz slajdy bez tych słów (4–5 krótkich slajdów), opis wg obecnych zasad,
  render z `"vo": "kokoro"`, publikacja tylko IG + FB w wolnym slocie. Na TikToka nigdy (nazwy substancji).
- Publikacja zostaje automatyczna (`autoPublish: true`) na obu kanałach.
- Muzyka z katalogu TikToka jest niemożliwa przez API (da się tylko montując w aplikacji). Katalog audio
  Instagrama zwraca 403 dla tego konta i **temat jest zamknięty**: wymagałby konta Business połączonego
  z Facebook Page. 21.10 wieczorem, po przełączeniu konta na Business przez właściciela, test nadal dał
  „Authorization Error” z katalogu audio Metricool. Nie próbuj ponownie, dopóki właściciel nie napisze, że podłączył IG w Metricool przez Facebooka.
- Slajdy piszemy krótko: 1 zdanie na slajd, 4–5 slajdów, cały film 12–15 s. Lektor wydłuża slajd do długości
  zdania, więc długie akapity dają filmy 45 s+ i zabijają retencję (średni czas obejrzenia to teraz 1–3 s).
- Do niedzieli 25.10 na TikToka idą maks. **2 filmy dziennie**. Instagram i Facebook zostają w pełnym harmonogramie;
  nadwyżkowe tematy planujemy tylko na IG + FB.
- **Wzrost na TikToku od 26.10** (decyzja właściciela, 21.10): pon–śr **3 filmy dziennie**, od czwartku 29.10 **4 dziennie**
  (każde okno ma film przyrodniczy). Warunek każdego kroku: przez ostatnie 3 dni żaden film nie został usunięty
  ani zablokowany (status ERROR/usunięty w Metricool albo „Video removed”). Jeśli był — wróć do 2 dziennie na 3 dni
  i napisz to w podsumowaniu. Więcej niż 4 dziennie nie dajemy bez decyzji właściciela.
- **TikTok dziennie (decyzja właściciela 21.10, zastępuje limity „2 dziennie” i „wzrost od 26.10” wyżej):**
  - do soboty 24.10: **2 filmy z lektorem + 1 krótki pokaz slajdów z muzyką** (17:00) = 3;
  - od niedzieli 25.10: **2 z lektorem + 2 z muzyką** = 4 — krótki pokaz slajdów (17:00) i **obraz w stylu Dola** (21:30 UK).
  - Dalej obowiązuje hamulec: gdy w ostatnich 3 dniach jakiś film zniknął/ERROR, wracamy do 2 dziennie na 3 dni.
- **Obraz w stylu Dola (TikTok, od 25.10):** `node tools/obraz.js RRRR-MM-DD-img-<temat>-en "<prompt tła po angielsku>" "<NAGŁÓWEK>" "<jedno zdanie faktu>"`.
  Tło generuje darmowy Pollinations (ciemne, kinowe: sylwetki z żaru, przezroczyste ciało, narządy, komórki — bez strzykawek,
  fiolek, tabletek, nagości i twarzy realnych osób), nagłówek i fakt nakłada skrypt (nasza pisownia). Temat: ostrzeżenia typu
  „szybka utrata wagi → mięśnie / kości / woreczek / włosy / serce”, fakty ze źródeł, **zero nazw substancji**.
  Post TikTok: `media` = `obraz.jpg`, `tiktokData.autoAddMusic: true`, opis z hashtagami TikToka + #pepsafe; przed planem `sprawdz.js`
  (zrób `post.json` z polami caption i slides z nagłówkiem i faktem).
- **Grafiki właściciela z Dola (21.10):** `node tools/dola.js <spec.json>` zasłania znak Doli, dodaje logo PepSafe i pasek z faktem
  i źródłem (4:5). Zaplanowane: IG + FB z nazwami 20:30 (22–27.10), IG + FB + TikTok bez nazw 21:30 (25–30.10) —
  te 6 postów **zajmują slot „obraz w stylu Dola” 21:30 na TikToku w dniach 25–30.10**, nie dokładaj tam drugiego.
  Obrazy z generatora AI: `isAiGenerated: true` (IG) i `isAigc: true` (TikTok) — wyjątek od zasady w sekcji „Treść”.
- **Krótki pokaz slajdów na TikToka (od 22.10, decyzja właściciela):** karuzela zdjęć przez API stała w miejscu, więc
  wysyłamy **film**, który sam przełącza 2–3 strony (ok. 7 s, nasza spokojna muzyka). 1 dziennie o **17:00 UK**, tylko TikTok.
  `node tools/fotki.js tiktok/<folder-przyrodniczy> RRRR-MM-DD-short-<temat>-en 3` → `pepsafe-<folder>-slajdy.mp4`
  (z `post.json` tematu, który już wyszedł; bez powtórki tego samego tematu), potem `node tools/sprawdz.js` (exit 0),
  commit + push, post TikTok z tym MP4, `text` = `caption.txt`, `isAigc: false`. To jest normalny post: liczy się do limitu
  API (12/24 h) i do dziennej liczby filmów na TikToku (do 25.10 max 2 — wtedy krótki pokaz zastępuje jeden z filmów).
- Najprostsze źródło dodatkowych filmów: przyrodnicze tematy, które już poszły na IG + FB (np. białko jajka, zwijanie
  łańcuchów, receptor), wrzucone na TikToka 3–5 dni później — po `node tools/sprawdz.js` (exit 0).

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
- `tools/v4.js` buduje stronę **pepsafe.info/start/** (przyciski: peptyd dnia, katalog, porównanie, objawy, słownik, pytanie)
  pod adresami `/start/ig.html`, `/start/tt.html`, `/start/fb.html` (noindex). Ta sama treść; osobne adresy pokazują
  w `node tools/odwiedziny.js`, która platforma przysyła ludzi. W bio: IG → `pepsafe.info/start/ig.html`, TikTok → `/start/tt.html`,
  Facebook → `/start/fb.html`. Raporty liczą wejścia na te adresy jako „z Instagrama/TikToka/Facebooka”.

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
