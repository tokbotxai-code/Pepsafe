# PepSafe – zasady publikacji (Metricool, marka 7506075, Europe/London)

## Instagram + TikTok zawsze razem
- Każda treść idzie na **oba** kanały, o tej samej porze (najwyżej 1 min różnicy), w wersji PL i EN.
- Filmik (Reel/TikTok): jeden post Metricool z oboma providerami (`instagram` typ `REEL` + `tiktok`), ten sam MP4.
- Karuzela na IG (`ig-...`, format `feed`): na TikToka idzie **film**, nie slajdy. Skopiuj `post.json` do
  `tiktok/RRRR-MM-DD-<temat>-<lang>/` bez pola `format`, wyrenderuj `node tiktok/make.js tiktok/<folder>`
  i zaplanuj osobny post TikTok **1 minutę po** poście na IG.
- Stories (`story-...`) są tylko na IG.
- Przed dodaniem posta sprawdź plan (`getScheduledPosts`), czy treść nie jest już na danym kanale.

## Media
- TikTok **nie przyjmuje PNG** – używaj MP4 (`pepsafe-<folder>-muzyka.mp4`) albo JPG.
- Pliki publikuj przez commit + push do `main`; GitHub Pages wystawia je pod
  `https://pepsafe.info/tiktok/<folder>/<plik>` (zwykle po ok. 30–60 s). Ten URL podawaj w `media`.

## Treść
- Każdy opis kończy się „Więcej na pepsafe.info” / „More at pepsafe.info” i hashtagiem `#pepsafe`.
- Treść edukacyjna, bez dawkowania i zachęt do stosowania; fakty tylko z wiarygodnych źródeł (FDA, WADA, badania).
- `isAiGenerated` (IG) i `isAigc` (TikTok) = `true`.
