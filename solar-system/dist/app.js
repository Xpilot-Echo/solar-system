import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {positionAtE,physicalRadius,scenePosition,displayRadius} from './math.mjs';
import {projectedDiameterPx,trueScalePresentation} from './true-scale.mjs';
const $=s=>document.querySelector(s);
try { await start(); } catch(error) { $('#loading').hidden=false; $('#loading').textContent='The 3D view could not load. Please enable WebGL and reload.'; console.error(error); }
async function start(){
 const [data,audit]=await Promise.all(['data.json','verification.json'].map(async f=>{const r=await fetch('./'+f);if(!r.ok)throw Error(f);return r.json();}));
 const bodies=[{name:'Sun',radiusKm:data.sunRadiusKm,color:'#edc992',position:[0,0,0]},...data.bodies];
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);
 const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,1e-8,3000),renderCamera=camera.clone();
 const renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x000000);$('#universe').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Solar System. Drag to orbit, scroll or pinch to zoom. Use the planet list to focus.');renderer.domElement.tabIndex=0;
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=1e-7;controls.maxDistance=800;controls.zoomSpeed=.8;controls.enablePan=true;
 let visible=false,selected=null,flight=null,lastTime=0;
 document.body.classList.add('true-scale');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const home=()=>new THREE.Vector3(4,62,79).multiplyScalar(Math.max(1,1.7/camera.aspect));camera.position.copy(home());controls.update();
 scene.add(new THREE.AmbientLight(0xffffff,1.2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-3,5,4);scene.add(light);
 const sphere=new THREE.SphereGeometry(1,64,32);
 const orbitGroup=new THREE.Group();scene.add(orbitGroup);
 const lineMaterial=new THREE.LineBasicMaterial({color:0x42464b,transparent:true,opacity:.64});
 const nodes=bodies.map((b,index)=>{
  const pos=new THREE.Vector3(...scenePosition(b.position));
  const radius=physicalRadius(b);
  const mesh=new THREE.Mesh(sphere,index===0?new THREE.MeshBasicMaterial({color:b.color}):new THREE.MeshStandardMaterial({color:b.color,roughness:1,metalness:0}));mesh.scale.setScalar(radius);scene.add(mesh);
  if(b.elements){const points=[];for(let k=0;k<4096;k++)points.push(new THREE.Vector3(...positionAtE(b.elements,2*Math.PI*k/4096)));const path=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),lineMaterial.clone());if(b.name==='Pluto'){path.material.color.set(0x746659);path.material.opacity=.65;}orbitGroup.add(path);}
  const label=document.createElement('button');label.className='marker';label.style.setProperty('--c',b.color);label.innerHTML='<span class="mark"></span>'+b.name;label.setAttribute('aria-label','Focus on '+b.name);$('#labels').appendChild(label);
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');$('#leaders').appendChild(line); const anchor=document.createElementNS('http://www.w3.org/2000/svg','circle');anchor.setAttribute('r','2');anchor.setAttribute('fill','none');anchor.setAttribute('stroke',b.color);$('#leaders').appendChild(anchor);
  const nav=document.createElement('button');nav.style.setProperty('--c',b.color);nav.innerHTML='<span class="dot"></span>'+b.name;$('#bodies').appendChild(nav);
  const node={b,pos,radius,mesh,label,line,anchor,nav,displayRadius:radius,trueSphereVisible:null};label.onclick=nav.onclick=anchor.onclick=()=>focus(node);anchor.classList.add('body-anchor');return node;
 });
 function animateCamera(target,distance){controls.update();flight={start:performance.now(),fromTarget:controls.target.clone(),toTarget:target.clone(),fromDistance:camera.position.distanceTo(controls.target),toDistance:distance,direction:camera.position.clone().sub(controls.target).normalize()};}
 function focus(n){selected=n;nodes.forEach(x=>{x.nav.classList.toggle('active',x===n);x.label.classList.toggle('selected',x===n)});$('#overview').classList.remove('active');$('#details').hidden=false;$('#kind').textContent=n.b.name==='Sun'?'OUR STAR':n.b.name==='Pluto'?'DWARF PLANET':'PLANET';$('#body-name').textContent=n.b.name;
  const e=n.b.elements;const rows=[['Mean diameter',Math.round(n.b.radiusKm*2).toLocaleString()+' km']];if(e)rows.push(['Distance to Sun',n.pos.length().toFixed(5)+' AU'],['Semi-major axis',e.a.toFixed(6)+' AU'],['Eccentricity',e.e.toFixed(6)],['Inclination',e.i.toFixed(5)+'°']);
  $('#body-data').innerHTML=rows.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');animateCamera(n.pos,n.radius*9);}
 function reset(){selected=null;$('#details').hidden=true;nodes.forEach(x=>{x.nav.classList.remove('active');x.label.classList.remove('selected')});$('#overview').classList.add('active');controls.update();const h=home();flight={start:performance.now(),fromTarget:controls.target.clone(),toTarget:new THREE.Vector3(),fromDistance:camera.position.distanceTo(controls.target),toDistance:h.length(),direction:camera.position.clone().sub(controls.target).normalize(),toDirection:h.normalize()};}
 function setMode(v){if(visible!==v)nodes.forEach(n=>n.trueSphereVisible=null);visible=v;document.body.classList.toggle('true-scale',!v);$('#true').setAttribute('aria-pressed',String(!v));$('#visible').setAttribute('aria-pressed',String(v));$('#scale-title').textContent=v?'Larger bodies. Identical orbits.':'One scale. Every distance.';$('#mode-note').textContent=v?'Planets enlarged to at least 7 px radius. Distances stay true.':'Actual-size spheres; centered hollow markers below 2 px.';}
 $('#true').onclick=()=>setMode(false);$('#visible').onclick=()=>setMode(true);$('#overview').onclick=$('#reset').onclick=reset;
 const zoom=f=>animateCamera(controls.target,THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)*f,controls.minDistance,controls.maxDistance));$('#zoom-in').onclick=()=>zoom(.5);$('#zoom-out').onclick=()=>zoom(2);
 controls.addEventListener('start',()=>{flight=null});
 window.addEventListener('keydown',e=>{if($('#data-dialog').open)return;if(e.key.toLowerCase()==='r')reset();if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.5)}if(e.key==='-'){e.preventDefault();zoom(2)}});
 $('#sources').onclick=()=>$('#data-dialog').showModal();$('#close-dialog').onclick=()=>$('#data-dialog').close();$('#data-dialog').addEventListener('click',e=>{if(e.target===$('#data-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 const earth=data.bodies.find(b=>b.name==='Earth');$('#verification-rows').innerHTML=bodies.map(b=>`<tr><td>${b.name}</td><td>${(b.radiusKm/earth.radiusKm).toFixed(6)}</td><td>${b.elements?(b.elements.a/earth.elements.a).toFixed(6):'—'}</td><td>${b.elements?b.elements.a.toFixed(6):'—'}</td><td>${b.elements?b.elements.e.toFixed(6):'—'}</td><td>${b.elements?b.elements.i.toFixed(6):'—'}</td></tr>`).join('');$('#verification-status').textContent=audit.passed?'Numerical verification · passed':'Numerical verification · attention';$('#verification-summary').textContent=`${audit.pairCount} pairwise diameter ratios and ${audit.orbitPairCount} pairwise semi-major-axis ratios verified. Element-derived positions agree with independent Horizons vectors within ${audit.maxPositionErrorKm.toExponential(2)} km. Both modes retain identical body centers and orbit vertices.`;
 let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const p=new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,renderCamera);const hits=ray.intersectObjects(nodes.filter(n=>n.mesh.visible).map(n=>n.mesh));if(hits.length)focus(nodes.find(n=>n.mesh===hits[0].object));down=null;});
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
 const v=new THREE.Vector3(),view=new THREE.Vector3();const placed=[];
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
  if(flight){const t=reduced?1:Math.min((now-flight.start)/1600,1),s=t*t*(3-2*t);controls.target.lerpVectors(flight.fromTarget,flight.toTarget,s);const dist=Math.exp(THREE.MathUtils.lerp(Math.log(flight.fromDistance),Math.log(flight.toDistance),s));const dir=flight.toDirection?flight.direction.clone().lerp(flight.toDirection,s).normalize():flight.direction;camera.position.copy(controls.target).addScaledVector(dir,dist);if(t===1)flight=null;}
  controls.update(dt);const dist=camera.position.distanceTo(controls.target);camera.near=Math.max(1e-10,dist*1e-5);camera.far=Math.max(2000,dist*10);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  // Floating origin: all physical centers remain double precision in AU;
  // subtract the camera target before converting positions to GPU floats.
  renderCamera.copy(camera);renderCamera.position.sub(controls.target);renderCamera.updateMatrixWorld();orbitGroup.position.copy(controls.target).negate();
  placed.length=0;const ordered=[...nodes].sort((a,b)=>Number(b===selected)-Number(a===selected));
  for(const n of ordered){n.mesh.position.copy(n.pos).sub(controls.target);view.copy(n.mesh.position).applyMatrix4(renderCamera.matrixWorldInverse);n.displayRadius=displayRadius(n.radius,-view.z,innerHeight,camera.fov,visible&&n.b.name!=='Sun');n.mesh.scale.setScalar(n.displayRadius);v.copy(n.mesh.position).project(renderCamera);
   const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;
   const inViewport=view.z<0&&v.z>=-1&&v.z<=1&&x>0&&x<innerWidth&&y>0&&y<innerHeight;
   const shown=inViewport&&y>100&&y<innerHeight-125;
   if(!visible){
    n.projectedDiameter=projectedDiameterPx(n.radius,view.x,view.y,-view.z,innerHeight,camera.fov);
    const presentation=trueScalePresentation(n.projectedDiameter,n.trueSphereVisible);
    n.trueSphereVisible=presentation.sphereVisible;
    n.mesh.visible=presentation.sphereVisible;
    n.anchor.style.display=inViewport&&presentation.markerVisible?'':'none';
    n.line.style.display='none';
   }else{
    n.mesh.visible=true;
    n.anchor.style.display=n.line.style.display=shown?'':'none';
   }
   n.label.hidden=!shown;
   n.anchor.setAttribute('cx',x);n.anchor.setAttribute('cy',y);
   if(!shown)continue;
   const radiusPx=n.displayRadius/(-view.z)*innerHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));let lx=Math.min(innerWidth-100,Math.max(innerWidth>700?185:8,x+Math.max(10,radiusPx+6))),ly=y-15;
   const minY=innerWidth<700?165:105,maxY=innerHeight-(innerWidth<700?220:150);let found=false;
   for(const side of [1,-1]){if(found)break;const candidateX=Math.min(innerWidth-100,Math.max(innerWidth>700?185:8,side===1?x+Math.max(10,radiusPx+6):x-110-radiusPx));for(let attempt=0;attempt<24;attempt++){const dy=attempt===0?0:Math.ceil(attempt/2)*30*(attempt%2?1:-1),candidateY=THREE.MathUtils.clamp(y-15+dy,minY,maxY);if(!placed.some(r=>candidateX<r.x+100&&candidateX+100>r.x&&candidateY<r.y+29&&candidateY+29>r.y)){lx=candidateX;ly=candidateY;found=true;break;}}}
   placed.push({x:lx,y:ly});n.label.style.transform=`translate(${lx}px,${ly}px)`;n.line.setAttribute('x1',x);n.line.setAttribute('y1',y);n.line.setAttribute('x2',lx+10);n.line.setAttribute('y2',ly+15);
  }
  if(selected)$('#magnification').textContent=visible&&selected.b.name!=='Sun'?`Display size ×${(selected.displayRadius/selected.radius).toLocaleString(undefined,{maximumFractionDigits:1})} · orbit unchanged`:'Physical diameter · 1:1 scale';
  const auPerPixel=2*dist*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight;const raw=auPerPixel*80,power=10**Math.floor(Math.log10(raw));const step=[1,2,5,10].reduce((a,b)=>Math.abs(b*power-raw)<Math.abs(a*power-raw)?b:a,1)*power;$('#ruler i').style.width=(step/auPerPixel)+'px';$('#ruler span').textContent=(step<.001?(step*data.auKm).toLocaleString(undefined,{maximumSignificantDigits:3})+' km':step.toLocaleString(undefined,{maximumSignificantDigits:3})+' AU')+' at focus';
  renderer.render(scene,renderCamera);
 }
 $('#loading').hidden=true;requestAnimationFrame(frame);
 window.solarAudit=()=>({mode:visible?'visible':'true',selected:selected?.b.name||null,epoch:data.epoch,renderer:renderer.info.render,centers:nodes.map(n=>({name:n.b.name,position:n.pos.toArray(),radius:n.radius,displayRadius:n.mesh.scale.x,sphereVisible:n.mesh.visible,markerVisible:n.anchor.style.display!=='none',projectedDiameter:n.projectedDiameter})),orbits:orbitGroup.children.map(l=>({count:l.geometry.attributes.position.count,first:Array.from(l.geometry.attributes.position.array.slice(0,3))})),cameraDistance:camera.position.distanceTo(controls.target),passed:audit.passed});
}
