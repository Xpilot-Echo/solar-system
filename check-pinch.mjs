import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const cwd=new URL('./solar-system/',import.meta.url);
const before=execFileSync('git',['show','HEAD:dist/vendor/OrbitControls.js'],{cwd,encoding:'utf8'});
const after=fs.readFileSync(new URL('./solar-system/dist/vendor/OrbitControls.js',import.meta.url),'utf8');
assert.equal(after.replace('Math.pow( this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed * 2 )','Math.pow( this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed )'),before);
const handler=source=>new Function('event',source.match(/_handleTouchMoveDolly\( event \) \{([\s\S]*?)\n\t\}/)[1]);
function exercise(source,ratio){
 const vec=y=>({x:0,y,set(x,y){this.x=x;this.y=y;},copy(v){this.x=v.x;this.y=v.y;}});
 const context={zoomSpeed:.8,_getSecondPointerPosition:()=>({x:0,y:0}),_dollyEnd:vec(0),_dollyStart:vec(100),_dollyDelta:vec(0),_dollyOut(v){this.factor=v;},_updateZoomParameters(x,y){this.center=[x,y];}};
 handler(source).call(context,{pageX:100*ratio,pageY:0});return context;
}
for(const ratio of [.5,.8,.99,1,1.01,1.25,2]){
 const a=exercise(before,ratio),b=exercise(after,ratio);
 assert.ok(Math.abs(b.factor-a.factor*a.factor)<1e-12);
 assert.deepEqual(b.center,a.center);
 assert.equal(b._dollyStart.y,a._dollyStart.y);
}
console.log('PASS: 2× pinch response in both directions; identical touch center and tracking. Only the touch dolly exponent changed; mouse, wheel, pan, orbit, buttons, damping and limits are unchanged.');
