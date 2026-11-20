import {Vector3,Quaternion,Matrix4} from 'three';
import {HELIX_CENTER,cameraAt as acceptedCamera} from '../refinement-perception-v16/spatial-score.js';
import {orientHelix} from '../refinement-perception-v16/helix-rhythm.js';
import {abstractScrollAt} from './scroll.js';
export const VERSION='refinement-forgetting-v14',FPS=60,PRELUDE=5.2;
export const FIRST=3780,END_FRAME=4764,START=3875/60,END=END_FRAME/60,CONTEXT_START=FIRST/60;
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,u)=>a+(b-a)*u;
export const SHOTS=[
 {id:'signal-array',frame:3875,label:'SIGNAL',family:'spatial'},
 {id:'input-arrival',frame:3901,label:'INPUT',family:'spatial'},
 {id:'depth-reveal',frame:3929,label:'PROPAGATION',family:'spatial'},
 {id:'contact-macro',frame:3956,label:'ACTIVATION',family:'spatial'},
 {id:'token-top',frame:3985,label:'ENCODING',family:'tokens'},
 {id:'wave-response',frame:4012,label:'RESPONSE',family:'wave'},
 {id:'seran-response',frame:4040,label:'SERAN',family:'eyes'},
 {id:'attention-heads',frame:4067,label:'ATTENTION',family:'heads'},
 {id:'selected-context',frame:4095,label:'CURRENT CONTEXT',family:'context'},
 {id:'memory-row',frame:4122,label:'WRITE',family:'context'},
 {id:'capacity-handoff',frame:4151,label:'CAPACITY',family:'context'},
 {id:'capacity-tilt',frame:4178,label:'CAPACITY',family:'context'},
 {id:'capacity-detail',frame:4206,label:'WRITING',family:'context'},
 {id:'capacity-full',frame:4233,label:'24 / 24',family:'context'},
 {id:'record-stack',frame:4262,label:'EVERY WORD',family:'pages'},
 {id:'record-window',frame:4316,label:'CURRENT CONTEXT',family:'records'},
 {id:'record-oblique',frame:4344,label:'CURRENT CONTEXT',family:'records'},
 {id:'memory-flash',frame:4372,label:'ONCE RECORDED',family:'flashback'},
 {id:'signal-echo',frame:4399,label:'SIGNAL ECHO',family:'wave'},
 {id:'association-query',frame:4428,label:'SEARCHING',family:'heads'},
 {id:'association-range',frame:4455,label:'OUTSIDE THE WINDOW',family:'heads'},
 {id:'retrieval-paths',frame:4483,label:'RECALL',family:'retrieval'},
 {id:'retrieval-gap',frame:4510,label:'EARLIER RECORD',family:'retrieval'},
 {id:'retrieval-empty',frame:4537,label:'NO RECORD FOUND',family:'retrieval'},
 {id:'seran-recall',frame:4593,label:'SERAN',family:'eyes'},
 {id:'name-without-past',frame:4621,label:'A NAME WITHOUT THE PAST',family:'recall'},
 {id:'empty-records',frame:4649,label:'A NAME WITHOUT THE PAST',family:'recall'},
 {id:'context-return',frame:4704,label:'THE INPUT CONTINUES',family:'records'},
 {id:'context-forward',frame:4732,label:'THE INPUT CONTINUES',family:'records'}
].map((s,i,a)=>({...s,index:i,start:s.frame/FPS,end:(a[i+1]?.frame??END_FRAME)/FPS}));
export const RELAYS=[
 {from:0,to:1,anchor:65.02113333333334,start:64.79036273199704,end:65.25190393466964},
 {from:2,to:3,anchor:65.93833333333334,start:65.56633112397921,end:66.1663346874536},
 ...[
 [10,11,69.63033333333334,.1,1],
 [15,16,72.40513333333334,.1,1],
 [19,20,74.24533333333333,.6461576837416481,.5],
 [21,22,75.16243333333334,.36923296213808465,.5],
 [22,23,75.62103333333333,.36923296213808465,.5],
 [25,26,77.47863333333333,.1,1],
 [27,28,78.86603333333334,.2307706013363029,.5]
 ].map(([from,to,anchor,duration,bias])=>({from,to,anchor,start:anchor-duration*bias,end:anchor+duration*(1-bias),move:bias===1?'whip':'glide'}))
];
export const HITS=[64.5734,65.0378,65.508,65.955,66.4252,66.878,67.3482,67.801,68.2654,68.724,69.1942,69.647,70.1114,70.5642,71.0518,71.9574,72.4218,72.8862,73.339,73.8092,74.262,74.7263,75.1791,75.6377,76.5665,77.0309,77.4953,78.4241,78.8827];
export const EXECUTION=HITS[21];
export function memoryAt(t){const flow=abstractScrollAt(t);return {...flow,capacity:24,capacityUnits:'abstract record rows',loaded:Math.min(24,12+2*ramp(t,69.177533,69.65)+10*ramp(t,69.7,71.0518)),evicted:flow.droppedRows,sourceRetained:true,profileRetained:true,search:ramp(t,75.6377,76.55)};}
export const flashbackTime=t=>64.05+(t-4372/60);
export const shotAt=t=>SHOTS.findLast(s=>t>=s.start)??{id:'accepted-helix',index:-1,start:CONTEXT_START};
export const pulse=(t,at,width=.085)=>Math.exp(-Math.pow((t-at)/width,2));
export const V=a=>new Vector3(...a);
export const LOCAL_Q=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(V(orientHelix([1,0,0],64.575)),V(orientHelix([0,1,0],64.575)),V(orientHelix([0,0,1],64.575))));
export const world=p=>V(p).applyQuaternion(LOCAL_Q).add(V(HELIX_CENTER)).toArray();
export const local=p=>V(p).sub(V(HELIX_CENTER)).applyQuaternion(LOCAL_Q.clone().invert()).toArray();
const view=(position,target,fov=42)=>({position,target,fov,up:[0,1,0]});
function spatialView(i,t){
 const dt=t-SHOTS[i].start;
 if(i===0)return view([-36+dt*.4,5,-17],[-23,0,0],40);
 if(i===1)return view([-28.5-dt*.4,3.8,-12.5],[-18,0,0],40);
 if(i===2)return view([-34+dt*.4,10.0,-16],[-23.5,0,0],40);
 return view([-26.4-dt*.2,1.3,-3.2],[-23,0,0],44);
}
function blend(a,b,u){
 const pose=c=>{const eye=V(c.position),target=V(c.target),q=new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(eye,target,V(c.up)));return {target,q,dist:eye.distanceTo(target),tan:Math.tan(c.fov*Math.PI/360)};};
 const A=pose(a),B=pose(b),q=A.q.slerp(B.q,u),target=A.target.lerp(B.target,u),dist=Math.exp(mix(Math.log(A.dist),Math.log(B.dist),u)),tan=mix(A.tan,B.tan,u);
 return {position:target.clone().addScaledVector(V([0,0,1]).applyQuaternion(q),dist).toArray(),target:target.toArray(),up:V([0,1,0]).applyQuaternion(q).toArray(),fov:Math.atan(tan)*360/Math.PI};
}
function laterView(i,t){
 const dt=t-SHOTS[i].start;
 if(i===10)return view([2,17,9.5],[0,0,-1.5],42);
 if(i===11)return view([5,16,9.5],[0,0,-1.5],42);
 if(i===12)return view([8+dt*.3,2,2],[5.2,0,-4.4],40);
 if(i===13)return view([0,18,5],[0,0,-1.5],43);
 if(i===14)return view([-13+dt*.7,8,20],[0,0,-3],41);
 if(i===15)return view([0,.2,27],[0,0,0],42);
 if(i===16)return view([3.1,.8,26],[0,0,0],42);
 if(i===17){const c=acceptedCamera(flashbackTime(t));return {...c,up:c.up??[0,1,0]};}
 if(i===18)return view([7.0-dt*.9,6.3,16],[-1.1,0,0],43);
 if(i===19)return view([.1,.4,19.5],[0,0,0],38);
 if(i===20)return view([.8,.7,19.1],[0,0,0],38);
 if(i>=21&&i<=23){
  const a=ramp(t,74.7096,75.346),b=ramp(t,75.4364,76.5498);
  return view([1.2+.7*a+.6*b,4.5-.8*a-1.0*b,26-2*a-2*b],[.4+1.5*a+1.4*b,0,0],38);
 }
 if(i===24)return {...view([0,0,20],[0,0,0]),ortho:12.8};
 if(i===25)return view([3,2,24],[0,0,0],40);
 if(i===26)return view([-1,1,23],[0,0,0],40);
 if(i===27)return view([0,.2,27],[0,0,0],42);
 return view([0,.2,25.8-dt*.4],[0,0,0],42);
}
export function cameraAt(t){
 const s=shotAt(t),i=s.index,dt=t-s.start;
 if(i<4){const relay=RELAYS.find(w=>t>=w.start&&t<=w.end);let c=spatialView(Math.max(0,i),t);if(relay)c=blend(spatialView(relay.from,t),spatialView(relay.to,t),ramp(t,relay.start,relay.end));return {...c,position:world(c.position),target:world(c.target),up:V(c.up).applyQuaternion(LOCAL_Q).toArray(),relay:relay?.to??null};}
 if(i===4)return {...view([0,0,20],[0,0,0]),ortho:11.3};
 if(i===5)return view([9.5-dt*.7,7.4,16.0],[-1.3,0,0],43);
 if(i===6)return {...view([0,0,20],[0,0,0]),ortho:12.8-dt*.10};
 if(i===7)return {...view([0,0,20],[0,0,0]),ortho:12.1};
 if(i===8)return view([12.5-dt*.5,10,14.5],[0,0,-2.0],43);
 if(i===9)return view([8.2+dt*2.5,2.5,7.8],[4.4+dt*2.5,0,0.5],41);
 const relay=RELAYS.find(r=>r.from>=10&&t>=r.start&&t<=r.end);
 return relay?{...blend(laterView(relay.from,t),laterView(relay.to,t),ramp(t,relay.start,relay.end)),relay:relay.to}:laterView(i,t);
}
