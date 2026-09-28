import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectedDiameterPx,trueScalePresentation} from './dist/true-scale.mjs';
import {physicalRadius,displayRadius} from './dist/math.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./dist/data.json',import.meta.url)));
let checks=0;
function check(d,previous,expected){const s=trueScalePresentation(d,previous);assert.equal(s.sphereVisible,expected);assert.notEqual(s.sphereVisible,s.markerVisible);checks++;return s.sphereVisible;}
check(1.99,null,false);check(2,null,true);check(2.2,false,true);check(2.19,false,false);check(1.99,true,false);
let state=true;
for(const d of [1.99,2.01,1.98,2.1,2.19,2.02])state=check(d,state,false);
state=check(2.2,state,true);
for(const d of [2.19,2.05,2.01,2])state=check(d,state,true);
state=check(1.999,state,false);
for(const b of [{radiusKm:data.sunRadiusKm},...data.bodies])for(const height of [400,800,1600]){
 const r=physicalRadius(b),fov=42,f=height/(2*Math.tan(fov*Math.PI/360));
 for(const d of [.5,1.99,2,2.1,2.2,20,200]){
  const depth=Math.sqrt(r*r+(2*f*r/d)**2);
  const projected=projectedDiameterPx(r,0,0,depth,height,fov);
  assert.ok(Math.abs(projected-d)<1e-10);
  assert.equal(displayRadius(r,depth,height,fov,false),r);
  for(const prior of [null,false,true]){const s=trueScalePresentation(projected,prior);assert.notEqual(s.sphereVisible,s.markerVisible);if(projected<2)assert.equal(s.sphereVisible,false);checks++;}
 }
 const near=projectedDiameterPx(r,0,0,r,height,fov);assert.equal(near,Infinity);
 assert.ok(projectedDiameterPx(r,1,1,10,height,fov)>projectedDiameterPx(r,0,0,10,height,fov));
}
console.log(`Passed ${checks} visibility checks: exclusive representations, 2–2.2 px hysteresis, physical scale preserved for Sun + 9 planets.`);
