from pathlib import Path
import re,json,base64,shutil,zipfile
src=Path('work/solar-system/dist');out=Path('outputs/Solar-System-Offline');out.mkdir(exist_ok=True)
def read(p):return (src/p).read_text()
def mappings(spec,for_import=False):
 entries=[]
 for part in spec.split(','):
  bits=re.split(r'\s+as\s+',part.strip())
  if not bits[0]:continue
  if len(bits)==1:entries.append(bits[0])
  else:entries.append((bits[0]+': '+bits[1]) if for_import else (bits[1]+': '+bits[0]))
 return ', '.join(entries)
def convert_module(s,namespace):
 s=re.sub(r"^import\s*\{([\s\S]*?)\}\s*from\s*['\"][^'\"]+['\"];",lambda m:'const { '+mappings(m[1],True)+' } = '+namespace+';',s,flags=re.M)
 reexports=[]
 def reexport(m):
  reexports.append('...'+namespace);return ''
 s=re.sub(r"^export\s*\{([\s\S]*?)\}\s*from\s*['\"][^'\"]+['\"];",reexport,s,flags=re.M)
 exports=[]
 def export(m):exports.append(mappings(m[1]));return ''
 s=re.sub(r'^export\s*\{([\s\S]*?)\};',export,s,flags=re.M)
 return '(()=>{\n'+s+'\nreturn { '+', '.join(reexports+exports)+' };\n})()'
core=convert_module(read('vendor/three.core.js'),'null')
renderer=convert_module(read('vendor/three.module.js'),'CORE')
controls=convert_module(read('vendor/OrbitControls.js'),'THREE')
math=re.sub(r'^export\s+','',read('math.mjs'),flags=re.M)
visibility=re.sub(r'^export\s+','',read('true-scale.mjs'),flags=re.M)
app=re.sub(r'^import[^\n]+\n','',read('app.js'),flags=re.M)
fetchline=" const [data,audit]=await Promise.all(['data.json','verification.json'].map(async f=>{const r=await fetch('./'+f);if(!r.ok)throw Error(f);return r.json();}));"
assert fetchline in app
app=app.replace(fetchline,' const data='+json.dumps(json.loads(read('data.json')),separators=(',',':'))+';\n const audit='+json.dumps(json.loads(read('verification.json')),separators=(',',':'))+';')
script='/* Bundled Three.js r180 and OrbitControls. MIT license included in this ZIP. */\n(async()=>{\n"use strict";\nconst CORE='+core+';\nconst THREE='+renderer+';\nconst {OrbitControls}='+controls+';\n'+math+'\n'+visibility+'\n'+app+'\n})();'
# Retain XML namespace identifiers, which are identifiers, never requests.
# Strip vendor documentation/diagnostic URLs from this offline distribution.
script=re.sub(r'https?://[^\s\'"`<>\\)\]}]+',lambda m:m[0] if m[0] in ['http://www.w3.org/1999/xhtml','http://www.w3.org/2000/svg'] else '[offline-reference]',script)
Path('work/offline-bundle.js').write_text(script)
html=read('index.html')
html=re.sub(r'<script type="importmap">.*?</script>','',html)
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+read('style.css')+'</style>')
icon='data:image/svg+xml;base64,'+base64.b64encode(read('favicon.svg').encode()).decode()
html=html.replace('./favicon.svg',icon)
html=re.sub(r'<a href="https?://[^\"]+"[^>]*>(.*?)</a>',r'\1',html)
html=html.replace('<script type="module" src="./app.js"></script>','<script>'+script.replace('</script','<\\/script')+'</script>')
html=html.replace('<meta name="viewport"','<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; connect-src \'none\'; font-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">\n<meta name="viewport"',1)
(out/'index.html').write_text(html)
for f in ['data.json','verification.json']:shutil.copy2(src/f,out/f)
shutil.copy2(src/'vendor/LICENSE',out/'THREE-LICENSE.txt')
(out/'README.txt').write_text('''SOLAR SYSTEM — OFFLINE EDITION

1. Extract this ZIP completely.
2. Open index.html in a modern browser (Chrome, Edge, Firefox, or Safari).

No internet connection, installation, account, local server, or build step is
required. The browser must support JavaScript and WebGL 2.

The HTML file contains Three.js r180, OrbitControls, all application code,
styles, the favicon, and the astronomical dataset and numerical audit.
The system fonts Arial / Helvetica / sans-serif are used directly from your
device. There are no downloaded fonts or image textures. Body colors are
identifiers, as in the hosted version. No external links or API calls are used.
A Content Security Policy explicitly blocks network connections.

CONTROLS
Drag to orbit. Scroll or pinch to zoom. Two-finger touch pinch has 2x
sensitivity. Select a body name or marker to focus. R resets the view.
TRUE SCALE shows physical spheres or centered hollow markers with the
2–2.2 CSS pixel hysteresis. VISIBLE PLANETS retains enlarged planet display.
Labels retain the requested 35% smaller type.

DATA AND SOURCES (offline references)
NASA / Jet Propulsion Laboratory, Solar System Dynamics, Horizons System.
Body-center geometric positions and osculating elements, Sun-centered,
J2000 ecliptic, 2026-09-27 00:00 TDB. This is a fixed snapshot, not live data.
NASA / JPL, Planetary Physical Parameters: volume-equivalent mean radii.
IAU 2012 Resolution B1: astronomical unit = 149,597,870.7 km.
IAU 2015 Resolution B3: nominal solar radius = 695,700 km.

The in-app Data & scale verification panel works offline. The accompanying
JSON files contain the dataset and audit for inspection. All 45 diameter
ratios and 36 orbital semi-major axis ratios passed the original numerical
checks. The offline edition embeds those exact values without changes.

THIRD-PARTY LICENSE
Three.js and OrbitControls are included under the MIT license; see
THREE-LICENSE.txt. The touch pinch exponent is locally adjusted to 2x.

Sharing: send this ZIP. Recipients extract it and open index.html.
''')
archive=Path('outputs/Solar-System-Offline.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for file in sorted(out.iterdir()):z.write(file,'Solar-System-Offline/'+file.name)
print(json.dumps({'archive':str(archive.resolve()),'bytes':archive.stat().st_size,'htmlBytes':(out/'index.html').stat().st_size,'files':[p.name for p in sorted(out.iterdir())]}))
