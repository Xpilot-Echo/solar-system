import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {positionAtDays,scenePosition} from './dist/math.mjs';

const data=JSON.parse(fs.readFileSync(new URL('./dist/data.json',import.meta.url)));
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol, `${a} != ${b}`);
const vectorNear=(a,b,tol=1e-10)=>a.forEach((v,i)=>near(v,b[i],tol));
for(const b of data.bodies){
 const el=b.elements,start=positionAtDays(el,0);
 vectorNear(start,scenePosition(b.position),1e-11);
 for(const turns of [-5,1,10,1000])vectorNear(positionAtDays(el,el.period*turns),start,1e-9);
 for(const days of [0,10,100,10000]){
  const p=positionAtDays(el,days),r=Math.hypot(...p);
  assert.ok(r>=el.q-1e-10&&r<=el.Q+1e-10);
 }
 // Equal time intervals sweep equal areas: perihelion speed exceeds aphelion.
 const periDays=-el.M/el.n,aphDays=(180-el.M)/el.n,delta=.001;
 const speed=t=>Math.hypot(...positionAtDays(el,t+delta).map((x,i)=>x-positionAtDays(el,t)[i]));
 assert.ok(speed(periDays)>speed(aphDays));
}

// Run the shipped offline application with real Three.js vector/camera math.
// Stub only DOM, renderer and input controls; drive its actual frame callbacks.
const elements=new Map();
function element(){
 return {style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},dataset:{},attributes:{},
  hidden:false,open:false,children:[],textContent:'',innerHTML:'',events:{},
  appendChild(x){this.children.push(x);},setAttribute(k,v){this.attributes[k]=v;},
  addEventListener(type,handler,options){this.events[type]={handler,options};},matches(){return false;},showModal(){this.open=true;},close(){this.open=false;}};
}
const get=s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);};
const listeners={};
const document={hidden:false,body:element(),querySelector:get,createElement:element,
 createElementNS:element,addEventListener:(k,f)=>listeners[k]=f};
let now=0,frame;
const context={console,document,innerWidth:1280,innerHeight:800,devicePixelRatio:1,
 performance:{now:()=>now},requestAnimationFrame:f=>{frame=f;},
 matchMedia:()=>({matches:false}),AbortController,URL,TextDecoder,TextEncoder,
 setTimeout,clearTimeout,addEventListener(){},
 TestRenderer:class {constructor(){this.domElement=element();this.info={render:{}};}setPixelRatio(){}setSize(){}setClearColor(){}render(){}}
};
context.window=context;
const script=fs.readFileSync(new URL('../offline-bundle.js',import.meta.url),'utf8')
 .replace('new THREE.WebGLRenderer(','new TestRenderer(')
 .replace('new OrbitControls(camera,renderer.domElement)',`new (class {
 constructor(){this.target=new THREE.Vector3();this.minDistance=1e-7;this.maxDistance=800;}
 update(){camera.lookAt(this.target);}
 addEventListener(){}
 })()`);
await vm.runInNewContext(script,context);
assert.equal(typeof context.solarAudit,'function');
for(const selector of ['#labels','#leaders','#bodies','#details','.time-controls']){
 const overlay=get(selector);
 for(const type of ['wheel','gesturestart','gesturechange']){
  let prevented=false;
  assert.equal(overlay.events[type].options.passive,false);
  overlay.events[type].handler({ctrlKey:true,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
 }
 let prevented=false;
 overlay.events.wheel.handler({ctrlKey:false,preventDefault(){prevented=true;}});
 assert.equal(prevented,false);
}
const tick=seconds=>{now+=seconds*1000;frame(now);return context.solarAudit();};
let initial=tick(0);
initial.centers.slice(1).forEach((n,i)=>vectorNear(n.position,scenePosition(data.bodies[i].position),1e-11));
assert.equal(get('#speed-value').textContent,'1 s = 1 day');
let state=tick(1);
near(state.elapsedDays,1);
assert.equal(state.playing,true);
get('#playback').onclick();
state=tick(2);near(state.elapsedDays,1);
const paused=state.centers.map(n=>[...n.position]);
tick(3).centers.forEach((n,i)=>vectorNear(n.position,paused[i]));
get('#speed').oninput({target:{value:'0'}});
near(context.solarAudit().daysPerSecond,.1);
get('#playback').onclick();
near(tick(1).elapsedDays,1.1);
get('#speed').oninput({target:{value:'500'}});
const middleSpeed=context.solarAudit().daysPerSecond;
assert.ok(middleSpeed>5&&middleSpeed<7);
near(tick(1).elapsedDays,1.1+middleSpeed);
get('#speed').oninput({target:{value:'1000'}});
near(tick(1).elapsedDays,366.1+middleSpeed);
near(context.solarAudit().daysPerSecond,365);
assert.equal(get('#speed').attributes['aria-valuetext'],'1 s = 365 days');
// Keep advancing beyond many orbital periods without wrapping the clock.
const beforeLongRun=context.solarAudit().elapsedDays;
near(tick(100000).elapsedDays,beforeLongRun+36500000,1e-7);
get('#playback').onclick();
// Focus Earth, finish flight, then track it at the fastest speed.
get('#bodies').children[3].onclick();
state=tick(2);
assert.equal(state.selected,'Earth');
const earth=()=>context.solarAudit().centers.find(n=>n.name==='Earth');
vectorNear(state.cameraTarget,earth().position);
const distance=state.cameraDistance;
get('#playback').onclick();
state=tick(1);
vectorNear(state.cameraTarget,earth().position);
near(state.cameraDistance,distance);
get('#zoom-in').onclick();state=tick(2);
vectorNear(state.cameraTarget,earth().position);near(state.cameraDistance,distance/2);
get('#visible').onclick();state=tick(1);assert.equal(state.mode,'visible');
get('#true').onclick();state=tick(1);assert.equal(state.mode,'true');
const beforeHidden=context.solarAudit().elapsedDays;
document.hidden=true;listeners.visibilitychange();tick(100);
document.hidden=false;listeners.visibilitychange();near(tick(100).elapsedDays,beforeHidden);
near(tick(1).elapsedDays,beforeHidden+365);
get('#overview').onclick();state=tick(2);
assert.equal(state.selected,null);vectorNear(state.cameraTarget,[0,0,0]);
assert.ok(!script.includes('#time-reset')&&!script.includes('[data-speed]'));
console.log('PASS: orbital periods and geometry; slow autoplay, logarithmic slider bounds/midpoint, pause, continuous forward time, tracking, zoom, modes and background suspension.');
