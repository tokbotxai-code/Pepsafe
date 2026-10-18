# Filmiki TikTok PepSafe

Każdy folder `RRRR-MM-DD-<temat>-pl` / `-en` zawiera:
- `post.json` – treść slajdów i opis,
- `slide-XX.png` – slajdy 1080×1920 (do karuzeli zdjęć),
- `pepsafe-<folder>-muzyka.mp4` – filmik z muzyką w tle (do publikacji),
- `pepsafe-<folder>.mp4` – ta sama wersja bez muzyki,
- `caption.txt` – opis z hashtagami.

Generowanie: `node tiktok/make.js tiktok/<folder>` (wymaga Playwright i ffmpeg).
Muzyka `music-calm.m4a` jest własna, wygenerowana programowo, bez praw autorskich osób trzecich.
