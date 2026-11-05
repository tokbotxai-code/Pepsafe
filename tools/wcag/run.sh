#!/bin/bash
# Usage: tools/wcag/run.sh https://szkola.pl [out.pdf]
# Scans one page with axe-core (WCAG A/AA, 2.1) and writes a Polish PDF report. Needs: npm i (in this folder), playwright.
set -e
cd "$(dirname "$0")"
URL="$1"; OUT_PDF="${2:-report-$(echo "$URL" | sed 's#https\?://##; s#[^a-zA-Z0-9]#-#g').pdf}"
[ -d node_modules/axe-core ] || npm i --silent
OUT=run.json node audit.js "$URL"
# drop WCAG 2.2-only rule (target-size); the Polish law refers to WCAG 2.1
python3 -I - <<'PY'
import json
d=json.load(open('run.json'))
for s in d: s['violations']=[v for v in s['violations'] if v['id']!='target-size']
json.dump(d,open('run.json','w'),ensure_ascii=False)
PY
HOST=$(python3 -I -c "import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).hostname)" "$URL")
IN=run.json PDF="$OUT_PDF" node report-pl.js "$HOST"
echo "Raport: tools/wcag/$OUT_PDF"
