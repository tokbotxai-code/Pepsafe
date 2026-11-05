# pepsafe.uk (studio site) and the free accessibility check

- Site source: `uk-site/` (static copy of the IONOS AI build, plus our pages). Do not edit by hand-minified bundle unless needed; small patches only (see git log).
- Deploy: GitHub Actions `UK SFTP deploy (manual)` (`.github/workflows/uk-deploy.yml`), secrets `UK_SFTP_HOST/USER/PASS/DIR`. Uploads `uk-site/` to `public/` on the IONOS SFTP webspace (no deletes). Run it after every change.
- Verify live by page titles, not status codes: the server returns the SPA index with 200 for any missing path.
- Domain pepsafe.uk is connected to the webspace (folder `public`). Wildcard SSL `*.pepsafe.uk` issued 5 Nov 2026.
- Free accessibility check (PL): `uk-site/dostepnosc/` (landing with consent form, study 2026, declaration guide, privacy policy). Form posts to FormSubmit -> contact@pepsafe.info. First submission needs a one-time activation click by the owner.
- Report tool: `tools/wcag/run.sh <url> [out.pdf]` (axe-core, WCAG 2.1 A/AA, Polish PDF). Needs `playwright` and `npm i` in `tools/wcag`.
- Rules: no cold e-mail to schools (art. 398 Prawa komunikacji elektronicznej, consent needed); no ads (owner decision 5.11); report is a pre-check, never a certificate; no school names in public results.
