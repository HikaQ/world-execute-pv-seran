export const VERSION='refinement-memory-v2-study',FPS=60,START_FRAME=6324,END_FRAME=6757;
export const START=START_FRAME/FPS,END=END_FRAME/FPS,CONTEXT_START=START,FRAMES=END_FRAME-START_FRAME,PRELUDE=5.2;
export const CUES={query:6406/60,if1:6537/60,feel:6593/60,vibrations:6699/60};
export const EVENTS={rank:108.35,morphStart:108.40,morphEnd:110.15,inject:CUES.vibrations};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,u)=>a+(b-a)*u;
export function ramp(t,a,b){const u=clamp((t-a)/(b-a));return u*u*u*(u*(u*6-15)+10);}
export function random(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const keys=[
 [START,[19,8.8,22],[-3,0,3]],
 [106.30,[20,11.0,30],[-1,0,3]],
 [107.50,[13.2,17.5,33.8],[0,.5,3]],
 [108.75,[5,18.7,35],[0,.5,3]],
 [109.8833333333,[-3,15,34],[0,.2,3]],
 [111.20,[-4.5,35,21],[0,0,3]],
 [END,[-1,40,12],[0,0,3]]
];
function tangent(j,k,a){if(j===0)return (keys[1][k][a]-keys[0][k][a])/(keys[1][0]-keys[0][0]);if(j===keys.length-1)return (keys[j][k][a]-keys[j-1][k][a])/(keys[j][0]-keys[j-1][0]);return (keys[j+1][k][a]-keys[j-1][k][a])/(keys[j+1][0]-keys[j-1][0]);}
function path(t,k){let j=keys.findIndex((v,i)=>i<keys.length-1&&t<keys[i+1][0]);if(j<0)j=keys.length-2;const a=keys[j],b=keys[j+1],d=b[0]-a[0],u=clamp((t-a[0])/d);return a[k].map((x,i)=>(2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*d*tangent(j,k,i)+(-2*u**3+3*u*u)*b[k][i]+(u**3-u*u)*d*tangent(j+1,k,i));}
export function cameraAt(t){return {position:path(t,1),target:path(t,2),fov:48,focus:{id:null,weight:0,zoom:1}};}
export const shotAt=t=>({id:t<EVENTS.rank?'index-query':t<CUES.feel?'sources-unfold':'memory-resonance'});
