import * as previous from '../refinement-care-v3/score.js';
export * from '../refinement-care-v3/score.js';
export const VERSION='refinement-memory-v1',FPS=60,START_FRAME=5645,END_FRAME=6976,FRAMES=1331;
export const START=START_FRAME/FPS,END=END_FRAME/FPS,DURATION=END,CONTEXT_START=5585/60,HANDOFF=5637/60;
export const CUES={gender:5645/60,FM:5740/60,whatever:5844/60,AMPM:5958/60,role:6067/60,SM:6186/60,enter:6281/60,trance:6406/60,if1:6537/60,feel:6593/60,vibrations:6699/60,then:6757/60,finally:6809/60,completion:6933/60};
export const FOCUS_CUES=[];
export const centerAt=t=>previous.centerAt(t);
const entry=previous.cameraAt(HANDOFF),p0=centerAt(HANDOFF),e=.0001;
const initial=entry.position.map((v,i)=>v-p0[i]);
const before=previous.cameraAt(HANDOFF-e),bc=centerAt(HANDOFF-e);
const velocity=initial.map((v,i)=>(v-(before.position[i]-bc[i]))/e);
// Continuous Hermite path: wide operations remain the subject; the core is never tracked.
const poses=[
 [HANDOFF,initial,[0,.8,0]],
 [95.45,[2,4.8,34],[0,0,0]],
 [97.50,[-9,8,35],[0,0,-1]],
 [99.40,[-5,6,32],[0,0,0]],
 [101.65,[4.5,3.3,31],[0,0,0]],
 [103.80,[13,10,33],[0,.2,-1]],
 [106.25,[8,6,33],[0,.3,-1]],
 [108.75,[-5,4.2,32],[0,0,0]],
 [111.20,[-1,1.5,30],[0,0,0]],
 [113.50,[3,7,32],[0,0,0]],
 [END,[1,5,33],[0,0,0]],
];
function tangent(i,col,axis){
 if(i===0)return col===1?velocity[axis]:0;
 if(i===poses.length-1)return (poses[i][col][axis]-poses[i-1][col][axis])/(poses[i][0]-poses[i-1][0]);
 return (poses[i+1][col][axis]-poses[i-1][col][axis])/(poses[i+1][0]-poses[i-1][0]);
}
function path(t,col){
 let i=poses.findIndex((v,j)=>j<poses.length-1&&t<poses[j+1][0]);if(i<0)i=poses.length-2;
 const a=poses[i],b=poses[i+1],d=b[0]-a[0],u=previous.clamp((t-a[0])/d),u2=u*u,u3=u2*u;
 return a[col].map((v,k)=>(2*u3-3*u2+1)*v+(u3-2*u2+u)*d*tangent(i,col,k)+(-2*u3+3*u2)*b[col][k]+(u3-u2)*d*tangent(i+1,col,k));
}
export function cameraAt(t){
 if(t<=HANDOFF)return previous.cameraAt(t);
 const p=centerAt(t),o=path(t,1),look=path(t,2),position=p.map((v,i)=>v+o[i]);
 return {...entry,position,target:p.map((v,i)=>v+look[i]),fov:44,speed:1.6,distance:13.6-position[2],focus:{id:null,weight:0,zoom:1}};
}
export const SHOTS=Object.entries(CUES).map(([id,at])=>({id:'memory-'+id,at}));
export const shotAt=t=>t<START?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
