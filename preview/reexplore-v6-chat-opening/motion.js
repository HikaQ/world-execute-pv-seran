import {clamp} from './math.js';

// Integral of 105*u^2*(1-u)^4. Fast early travel, a longer landing, and zero
// endpoint velocity AND acceleration. It is monotone and never overshoots.
export const launchEase=u=>{u=clamp(u);const q=1-u;return u<.5?u*u*u*(35+u*(-105+u*(126+u*(-70+15*u)))):1-q*q*q*q*q*(21-35*q+15*q*q);};
export const sineEase=u=>(1-Math.cos(Math.PI*clamp(u)))/2;
export const settleEase=u=>{u=clamp(u);return u*u*u*(10+u*(-15+6*u));};

export function transitionWindow(a,b,from,to){
 const span=b-a;
 if(from===to)return {start:a,end:b,duration:span,sameShape:true};
 const lead=Math.min(.10,span*.07),duration=Math.min(1.05,Math.max(.20,span*.72));
 return {start:a+lead,end:Math.min(b,a+lead+duration),duration:Math.min(span-lead,duration),sameShape:false};
}
export function transition(t,a,b,from,to){
 const window=transitionWindow(a,b,from,to),p=clamp((t-window.start)/(window.end-window.start));
 return {...window,progress:p,amount:launchEase(p)};
}

// The two control points stay longitudinally between the endpoints. Bending
// happens in a perpendicular frame, so it cannot throw a point past its target.
export function bezierControls(a,b,index,count){
 const d=b.map((x,i)=>x-a[i]),length=Math.hypot(...d);
 if(length<1e-7)return [[...a],[...b]];
 const xy=Math.hypot(d[0],d[1]),side=xy>1e-6?[-d[1]/xy,d[0]/xy,0]:[1,0,0];
 const dir=d.map(x=>x/length),lift=[dir[1]*side[2]-dir[2]*side[1],dir[2]*side[0]-dir[0]*side[2],dir[0]*side[1]-dir[1]*side[0]];
 const lane=.7+.3*Math.sin(index/count*Math.PI*4),bend=Math.min(1.55,length*.25);
 return [a.map((x,i)=>x+d[i]*.20+bend*(side[i]*lane+lift[i]*.48)),
         b.map((x,i)=>x-d[i]*.18+bend*(-side[i]*lane*.26+lift[i]*.23))];
}
export function particlePoint(a,b,controls,progress,rank=0,spread=.08,bend=1){
 const u=launchEase(clamp((progress-rank*spread)/(1-spread))),v=1-u;
 const c=controls.map((p,j)=>p.map((x,i)=>a[i]+(b[i]-a[i])*(j?.82:.20)+bend*(x-(a[i]+(b[i]-a[i])*(j?.82:.20)))));
 return a.map((x,i)=>v*v*v*x+3*v*v*u*c[0][i]+3*v*u*u*c[1][i]+u*u*u*b[i]);
}

// Quintic Hermite camera rail. Each waypoint shares its velocity and acceleration
// with both adjacent segments; changing shots never starts another ease-to-zero.
export function cameraRail(keys){
 const n=keys.length,dims=keys[0][1].length;
 const velocities=keys.map((_,i)=>Array.from({length:dims},(_,j)=>{
  if(i===0||i===n-1)return 0;
  const left=(keys[i][1][j]-keys[i-1][1][j])/(keys[i][0]-keys[i-1][0]);
  const right=(keys[i+1][1][j]-keys[i][1][j])/(keys[i+1][0]-keys[i][0]);
  const dt=keys[i+1][0]-keys[i-1][0];
  return .8*(left*(keys[i+1][0]-keys[i][0])+right*(keys[i][0]-keys[i-1][0]))/dt;
 }));
 const accelerations=keys.map((_,i)=>Array.from({length:dims},(_,j)=>{
  if(i===0||i===n-1)return 0;
  const a=(keys[i][1][j]-keys[i-1][1][j])/(keys[i][0]-keys[i-1][0]);
  const b=(keys[i+1][1][j]-keys[i][1][j])/(keys[i+1][0]-keys[i][0]);
  return .5*2*(b-a)/(keys[i+1][0]-keys[i-1][0]);
 }));
 const segments=keys.slice(0,-1).map(([at,a],i)=>{
  const [end,b]=keys[i+1],d=end-at;
  const coefficients=a.map((p,j)=>{
   const c0=p,c1=velocities[i][j]*d,c2=accelerations[i][j]*d*d/2;
   const dp=b[j]-c0-c1-c2,dv=velocities[i+1][j]*d-c1-2*c2,da=accelerations[i+1][j]*d*d-2*c2;
   return [c0,c1,c2,10*dp-4*dv+da/2,-15*dp+7*dv-da,6*dp-3*dv+da/2];
  });return {at,end,d,coefficients};
 });
 function sample(t){
  const s=segments.find(s=>t>=s.at&&t<s.end)??(t<keys[0][0]?segments[0]:segments.at(-1)),u=clamp((t-s.at)/s.d);
  const value=s.coefficients.map(c=>c.reduce((sum,x,k)=>sum+x*u**k,0));
  const velocity=s.coefficients.map(c=>c.slice(1).reduce((sum,x,k)=>sum+(k+1)*x*u**k,0)/s.d);
  const acceleration=s.coefficients.map(c=>c.slice(2).reduce((sum,x,k)=>sum+(k+2)*(k+1)*x*u**k,0)/(s.d*s.d));
  return {position:value.slice(0,3),target:value.slice(3,6),fov:value[6],velocity,acceleration};
 }
 return {sample,keys,segments};
}
