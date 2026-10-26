# Converts saved outputs only. Never executes notebooks.
from pathlib import Path
import subprocess, shutil
source=Path('notebooks')
target=Path('src/content/blog/notebooks')
if target.exists(): shutil.rmtree(target)
for notebook in source.glob('*.ipynb'):
    if shutil.which('jupyter') is None:
        raise SystemExit('Install notebook dependencies: python3 -m pip install -r requirements.txt')
    target.mkdir(parents=True,exist_ok=True)
    subprocess.run(['jupyter','nbconvert','--to','markdown','--output-dir',str(target),'--output',notebook.stem,str(notebook)],check=True)
    page=target/(notebook.stem+'.md')
    if not page.read_text().startswith('---'):
        raise SystemExit(f'{notebook}: first Markdown cell must contain YAML title, description, pubDate and draft metadata')
    assets=target/(notebook.stem+'_files')
    if assets.exists():
        dest=Path('public/notebooks')/assets.name
        shutil.copytree(assets,dest,dirs_exist_ok=True)
        page.write_text(page.read_text().replace(notebook.stem+'_files/','/notebooks/'+assets.name+'/'))
