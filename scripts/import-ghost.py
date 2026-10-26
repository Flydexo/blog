"""Import published Ghost API JSON, or a Ghost export. No credentials required.
Usage: python3 scripts/import-ghost.py posts.json pages.json [--complete]
--complete asserts input contains full article bodies (not public API previews).
"""
import json, sys, re, hashlib, urllib.request
from pathlib import Path
from urllib.parse import urlparse
complete='--complete' in sys.argv
items=[]
for filename in [a for a in sys.argv[1:] if a!='--complete']:
    data=json.loads(Path(filename).read_text())
    if 'db' in data: items += data['db'][0]['data']['posts']
    else:
        for kind in ('posts','pages'):
            items += [dict(p,type='page' if kind=='pages' else 'post') for p in data.get(kind,[])]
out=[]; pending=[]; assets={}
for p in items:
    if p.get('status','published')!='published': continue
    slug=p['slug']
    if not re.fullmatch(r'[a-z0-9_-]+',slug): raise ValueError('Unsafe slug: '+slug)
    body=p.get('html')
    if not body: raise ValueError('Missing rendered HTML: '+slug+'. Export rendered posts from the Admin API.')
    draft=p.get('visibility','public')!='public' and not complete
    if draft: pending.append(slug)
    # Retain imported content as HTML; strip executable scripts and Ghost membership CTAs.
    body=re.sub(r'<script\b[^>]*>.*?</script>', '',body,flags=re.S|re.I)
    body=re.sub(r'<p>[^<]*(?:subscribing|newsletter)[^<]*</p>','',body,flags=re.I)
    for url in set(re.findall(r'https?://[^\s"<>]+',body)):
        parsed=urlparse(url)
        if parsed.hostname in ('matheold.com','www.matheold.com','flydexo.com','www.flydexo.com'):
            if parsed.path.startswith('/content/'):
                suffix=Path(parsed.path).suffix
                local='/media/'+hashlib.sha256(url.encode()).hexdigest()[:20]+suffix
                target=Path('public'+local);target.parent.mkdir(parents=True,exist_ok=True)
                if not target.exists():
                    with urllib.request.urlopen(urllib.request.Request('https://matheold.com'+parsed.path, headers={'User-Agent':'Mozilla/5.0'})) as response: target.write_bytes(response.read())
                assets[url]=local;body=body.replace(url,local)
            else: body=body.replace(url,parsed.path+('?' + parsed.query if parsed.query else '')+('#'+parsed.fragment if parsed.fragment else ''))
    out.append(dict(slug=slug,title=p['title'],description=p.get('meta_description') or p.get('custom_excerpt') or p.get('excerpt',''),date=p['published_at'],tags=[t['name'] for t in p.get('tags',[]) if isinstance(t,dict)],html=body,kind=p.get('type','post'),draft=draft))
Path('src/data/ghost.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
Path('migration/report.json').write_text(json.dumps(dict(imported=len(out),published=sum(not p['draft'] for p in out),incomplete_drafts=pending,assets=assets),indent=2))
print(f'Imported {len(out)} entries; {len(pending)} incomplete drafts; {len(assets)} media references localized.')
