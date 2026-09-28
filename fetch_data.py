import urllib.request, urllib.parse, json, pathlib, re
root=pathlib.Path('work/solar-system')
def fetch(url):
 return urllib.request.urlopen(url,timeout=60).read().decode()
for file,path in [('three.module.js','build/three.module.js'),('three.core.js','build/three.core.js'),('OrbitControls.js','examples/jsm/controls/OrbitControls.js'),('LICENSE','LICENSE')]:
 (root/'dist/vendor'/file).write_text(fetch('https://cdn.jsdelivr.net/npm/three@0.180.0/'+path))
bodies=[('Mercury',199,2439.4,'#ada9a3'),('Venus',299,6051.8,'#d8c093'),('Earth',399,6371.0084,'#77b4dc'),('Mars',499,3389.5,'#d28c6d'),('Jupiter',599,69911,'#d9b69b'),('Saturn',699,58232,'#d7c79e'),('Uranus',799,25362,'#a0d9dc'),('Neptune',899,24622,'#668cd9'),('Pluto',999,1188.3,'#c8bdb1')]
out=[]
for name,id,radius,color in bodies:
 b=dict(name=name,id=id,radiusKm=radius,color=color)
 for kind in ['ELEMENTS','VECTORS']:
  p=dict(format='json',COMMAND=str(id),CENTER='500@10',MAKE_EPHEM='YES',EPHEM_TYPE=kind,START_TIME='2026-09-27',STOP_TIME='2026-09-28',STEP_SIZE='1 d',OUT_UNITS='AU-D',REF_PLANE='ECLIPTIC',REF_SYSTEM='ICRF',CSV_FORMAT='YES',OBJ_DATA='YES')
  if kind=='VECTORS': p.update(VEC_TABLE='2',VEC_CORR='NONE')
  url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({k:(v if k=='format' else "'"+v+"'") for k,v in p.items()})
  raw=fetch(url);(root/'data'/f'{name}-{kind}.json').write_text(raw)
  result=json.loads(raw)['result']
  if '$$SOE' not in result: raise Exception(result)
  fields=[s.strip() for s in result.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()[0].split(',')]
  if kind=='ELEMENTS':
   b['elements']=dict(zip(['e','q','i','node','peri','tp','n','M','nu','a','Q','period'],map(float,fields[2:14])))
   b['jd']=float(fields[0]);b['epoch']=fields[1]
  else: b['position']=list(map(float,fields[2:5]));b['velocity']=list(map(float,fields[5:8]))
 out.append(b);print(name,b['elements']['a'],b['position'],flush=True)
(root/'dist/data.json').write_text(json.dumps(dict(epoch='2026-09-27 00:00 TDB',auKm=149597870.7,sunRadiusKm=695700,bodies=out),indent=2))
