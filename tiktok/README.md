# Filmiki TikTok PepSafe

Każdy folder `RRRR-MM-DD-<temat>-pl` / `-en` zawiera:
- `post.json` – treść slajdów i opis,
- `slide-XX.png` – slajdy 1080×1920 (do karuzeli zdjęć),
- `pepsafe-<folder>-muzyka.mp4` – filmik z muzyką w tle (do publikacji),
- `pepsafe-<folder>.mp4` – ta sama wersja bez muzyki,
- `caption.txt` – opis z hashtagami.

Generowanie: `node tiktok/make.js tiktok/<folder>` (wymaga Playwright i ffmpeg).
Muzyka `music-calm.m4a` jest własna, wygenerowana programowo, bez praw autorskich osób trzecich.

Format `"format":"story"` w `post.json` (folder `story-RRRR-MM-DD-...`) tworzy jeden
obrazek 1080×1920 do Stories/posta z pytaniem do odbiorców (np. ankieta, prośba
o zgłaszanie problemów/pytań na dany temat) zamiast filmiku. Pola: `title`,
`text`, `opts` (lista opcji ankiety), `ask` (wezwanie do komentarza/DM), `foot`.
