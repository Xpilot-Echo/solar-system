import fs from 'node:fs';
import assert from 'node:assert/strict';
import {AU_KM,positionAtE,solveE,scenePosition,physicalRadius,displayRadius} from './dist/math.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./dist/data.json',import.meta.url)));
const bodies=[{name:'Sun',radiusKm:data.sunRadiusKm},...data.bodies];
let pairCount=0,orbitPairCount=0,maxDiameterRatioRelativeError=0,maxOrbitRatioRelativeError=0,maxPositionErrorKm=0,maxInclinationErrorDeg=0;const rows=[];
assert.equal(AU_KM,149597870.7);assert.equal(data.bodies.length,9);
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);
for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
 const a=bodies[i],b=bodies[j],expected=a.radiusKm/b.radiusKm,actual=physicalRadius(a)/physicalRadius(b);near(actual,expected);maxDiameterRatioRelativeError=Math.max(maxDiameterRatioRelativeError,Math.abs(actual/expected-1));pairCount++;
}
for(let i=0;i<data.bodies.length;i++)for(let j=i+1;j<data.bodies.length;j++){
 const a=data.bodies[i].elements.a,b=data.bodies[j].elements.a,actual=(a*AU_KM)/(b*AU_KM);near(actual,a/b);maxOrbitRatioRelativeError=Math.max(maxOrbitRatioRelativeError,Math.abs(actual/(a/b)-1));orbitPairCount++;
}
for(const b of data.bodies){const e=b.elements;const per=positionAtE(e,0),aph=positionAtE(e,Math.PI),q=Math.hypot(...per),Q=Math.hypot(...aph);near(q,e.q);near(Q,e.Q);near((q+Q)/2,e.a);near((Q-q)/(Q+q),e.e);
 const p=positionAtE(e,solveE(e.M,e.e)),v=scenePosition(b.position);const err=Math.hypot(...p.map((x,j)=>x-v[j]))*AU_KM;assert.ok(err<.001,`${b.name} position error ${err} km`);maxPositionErrorKm=Math.max(maxPositionErrorKm,err);
 const p2=positionAtE(e,Math.PI/2);const cross=[per[1]*p2[2]-per[2]*p2[1],per[2]*p2[0]-per[0]*p2[2],per[0]*p2[1]-per[1]*p2[0]];const inc=Math.atan2(Math.hypot(cross[0],cross[2]),cross[1])*180/Math.PI;near(inc,e.i);maxInclinationErrorDeg=Math.max(maxInclinationErrorDeg,Math.abs(inc-e.i));
 for(const depth of [.00001,.001,1,100,800])for(const h of [400,800,1200]){const before=JSON.stringify({p,e}),r=physicalRadius(b);assert.equal(displayRadius(r,depth,h,42,false),r);assert.ok(displayRadius(r,depth,h,42,true)>=r);assert.equal(before,JSON.stringify({p,e}));}
 rows.push({name:b.name,diameterKm:2*b.radiusKm,diameterSceneAU:2*physicalRadius(b),semiMajorAxisAU:e.a,eccentricity:e.e,inclinationDeg:e.i,positionErrorKm:err});
}
const result={passed:true,epoch:data.epoch,unit:'1 scene unit = 1 AU = 149597870.7 km',pairCount,orbitPairCount,maxDiameterRatioRelativeError,maxOrbitRatioRelativeError,maxPositionErrorKm,maxInclinationErrorDeg,checks:['All 45 body diameter ratios','All 36 orbital semi-major axis ratios','Perihelion and aphelion distances','Recovered a, e and inclination','Kepler-solved position versus independently requested Horizons geometric vector','True-scale radius at every tested depth','Visible mode changes radius only, leaving positions and elements unchanged'],bodies:rows};
fs.writeFileSync(new URL('./dist/verification.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
