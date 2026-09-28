export const AU_KM = 149597870.7;
export const radians = d => d * Math.PI / 180;
export function positionAtE(el,E) {
 const x=el.a*(Math.cos(E)-el.e), y=el.a*Math.sqrt(1-el.e*el.e)*Math.sin(E);
 const o=radians(el.node), w=radians(el.peri), i=radians(el.i);
 const X=(Math.cos(o)*Math.cos(w)-Math.sin(o)*Math.sin(w)*Math.cos(i))*x+(-Math.cos(o)*Math.sin(w)-Math.sin(o)*Math.cos(w)*Math.cos(i))*y;
 const Y=(Math.sin(o)*Math.cos(w)+Math.cos(o)*Math.sin(w)*Math.cos(i))*x+(-Math.sin(o)*Math.sin(w)+Math.cos(o)*Math.cos(w)*Math.cos(i))*y;
 const Z=Math.sin(w)*Math.sin(i)*x+Math.cos(w)*Math.sin(i)*y;
 return [X,Z,-Y]; // right-handed rotation of J2000 ecliptic axes; no scaling
}
export function solveE(M,e) { let E=radians(M); for(let j=0;j<20;j++){const d=(E-e*Math.sin(E)-radians(M))/(1-e*Math.cos(E)); E-=d;if(Math.abs(d)<1e-15)break;}return E; }
// Fixed-ellipse propagation from the dataset epoch; time in days.
export function positionAtDays(el,days) {
 const mean=((el.M+el.n*(days%el.period))%360+360)%360;
 return positionAtE(el,solveE(mean,el.e));
}
export const scenePosition = p => [p[0],p[2],-p[1]];
export const physicalRadius = b => b.radiusKm/AU_KM;
export function displayRadius(real,depth,height,fov,visible) { return visible ? Math.max(real,7*2*Math.max(0,depth)*Math.tan(radians(fov/2))/height) : real; }
