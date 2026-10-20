# Zapas tematów (EN, bez nazw substancji)

Przygotowane, nie wyrenderowane i nie zaplanowane. Autopilot może je wziąć, gdy dzień ma puste okno.
Wszystkie przeszły `node tools/sprawdz.js` — zero nazw substancji w opisie, na slajdach i w lektorze,
więc nadają się **i na TikToka, i na Instagram**.

| Folder | Temat | Długość |
|---|---|---|
| `2026-10-26-why-injections-en` | Dlaczego zastrzyk, a nie tabletka: układ pokarmowy rozkłada łańcuchy | 15,8 s |
| `2026-10-26-how-long-approval-en` | Dwanaście lat od wyniku w laboratorium do leku; kończy co dziesiąty | 16,4 s |
| `2026-10-27-why-chains-fold-en` | Kształt decyduje o działaniu; ciepło i kwas rozkładają go nieodwracalnie | 15,6 s |
| `2026-10-27-nobel-chains-en` | Pierwszy łańcuch zbudowany w laboratorium, Nobel 1955, dziś robi to maszyna | 16,2 s |
| `2026-10-28-receptor-selectivity-en` | Ten sam receptor w jelicie, mózgu i sercu — stąd biorą się działania niepożądane | 16,2 s |
| `2026-10-28-purity-vs-identity-en` | Czystość to nie tożsamość: dwa różne pomiary, pokazują zwykle jeden | 16,0 s |

## Jak ich użyć
1. `node tiktok/make.js tiktok/<folder>` — lektor wymaga `ELEVENLABS_API_KEY`, bez niego powstaje wersja z samą muzyką.
2. Lektora dostaje **tylko jeden film dziennie** (limit darmowego planu). Pozostałe renderuj z `"vo": false`.
3. Commit i push, potem URL `https://pepsafe.info/tiktok/<folder>/<plik>.mp4` w polu `media`.
4. Przed zaplanowaniem na TikToka: `node tools/sprawdz.js tiktok/<folder>`.

Każdy ma 5 slajdów i mieści się w 15–17 s, zgodnie z zasadą o retencji.
Lektor to ok. 300 znaków na film, czyli ok. 3% miesięcznego limitu ElevenLabs.
