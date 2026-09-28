import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const bundle=fs.readFileSync(new URL('./offline-bundle.js',import.meta.url),'utf8');
const prefix=bundle.slice(0,bundle.indexOf('const $=s=>'));
const api=await vm.runInNewContext(prefix+'return {THREE,OrbitControls,physicalRadius,positionAtE,solveE,scenePosition,trueScalePresentation};})();',{console,AbortController,performance,setTimeout,clearTimeout,URL,TextDecoder,TextEncoder});
const {THREE,OrbitControls}=api;
assert.equal(THREE.REVISION,'180');
assert.equal(typeof THREE.WebGLRenderer,'function');
const camera=new THREE.PerspectiveCamera(42,1.5,1e-8,3000);
camera.position.set(4,62,79);
const controls=new OrbitControls(camera,null);controls.zoomSpeed=.8;controls.update();
assert.ok(Number.isFinite(camera.position.length()));
const scene=new THREE.Scene();const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),new THREE.MeshStandardMaterial());scene.add(sphere);
const data=JSON.parse(fs.readFileSync(new URL('../outputs/Solar-System-Offline/data.json',import.meta.url)));
const original=JSON.parse(fs.readFileSync(new URL('./solar-system/dist/data.json',import.meta.url)));
assert.deepEqual(data,original);
const app=bundle.slice(bundle.indexOf('const $=s=>'));
assert.ok(!app.includes('fetch('));assert.ok(!/^import\b/m.test(bundle));assert.ok(!/^export\b/m.test(bundle));
assert.deepEqual(JSON.parse(app.match(/const data=(.*);\n const audit=/)[1]),data);
for(const b of [{name:'Sun',radiusKm:data.sunRadiusKm},...data.bodies]){
 assert.equal(api.physicalRadius(b),b.radiusKm/data.auKm);
 sphere.scale.setScalar(api.physicalRadius(b));assert.equal(sphere.scale.x,b.radiusKm/data.auKm);
 if(b.elements){const p=api.positionAtE(b.elements,api.solveE(b.elements.M,b.elements.e));const expected=api.scenePosition(b.position);assert.ok(Math.hypot(...p.map((x,i)=>x-expected[i]))*data.auKm<.001);}
 for(const d of [0,1.9,2,2.1,2.2,200])for(const old of [null,false,true]){
  const state=api.trueScalePresentation(d,old);assert.notEqual(state.sphereVisible,state.markerVisible);if(d<2)assert.equal(state.sphereVisible,false);
 }
}
controls._getSecondPointerPosition=()=>({x:0,y:0});controls._updateZoomParameters=()=>{};controls._dollyStart.set(0,100);controls._scale=1;
controls._handleTouchMoveDolly({pageX:125,pageY:0});assert.ok(Math.abs(controls._scale-1/Math.pow(1.25,1.6))<1e-12);
console.log('PASS: bundled Three.js/OrbitControls initialize without imports; data is exact; physical scale, independent position checks, hysteresis, and 2× touch pinch pass. Application performs no fetches.');
