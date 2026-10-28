#!/usr/bin/env python3
"""Turns the compact files in skutki-src/*.txt into skutki.json.
Block: "=<key>", then lines  t: tags | ec/es/eu (en common/serious/unknown) | pc/ps/pu | sc/ss/su.  Items in lists are separated by " ; "."""
import json, glob, os
root = os.path.join(os.path.dirname(__file__), '..')
out = {}
for f in sorted(glob.glob(os.path.join(root, 'skutki-src', '*.txt'))):
    cur = None
    for line in open(f, encoding='utf8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'): continue
        if line.startswith('='):
            cur = out.setdefault(line[1:].strip(), {'k': [], 'common': {}, 'serious': {}, 'unknown': {}}); continue
        key, _, val = line.partition(':'); key = key.strip(); val = val.strip()
        if key == 't': cur['k'] = [x.strip() for x in val.split(',') if x.strip()]; continue
        lang = {'e': 'en', 'p': 'pl', 's': 'es'}[key[0]]; kind = {'c': 'common', 's': 'serious', 'u': 'unknown'}[key[1]]
        cur[kind][lang] = val if kind == 'unknown' else [x.strip() for x in val.split(' ; ') if x.strip()]
bad = 0
for k, o in out.items():
    for kind in ('common', 'serious'):
        n = {len(v) for v in o[kind].values()}
        if len(n) > 1 or (o[kind] and set(o[kind]) != {'en', 'pl', 'es'}): print('MISMATCH', k, kind); bad += 1
    if o['unknown'] and set(o['unknown']) != {'en', 'pl', 'es'}: print('MISMATCH', k, 'unknown'); bad += 1
    for kind in ('common', 'serious', 'unknown'):
        if not o[kind]: del o[kind]
json.dump(out, open(os.path.join(root, 'skutki.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(out), 'entries', 'ERRORS' if bad else 'ok')
raise SystemExit(1 if bad else 0)
