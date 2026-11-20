import {SHOTS as ORIGINAL,HITS,cameraAt as originalCamera,RELAYS as ORIGINAL_RELAYS} from '../refinement-forgetting-v14/score.js';
import {FLOW,rowAt,rowEvent,START as FLOW_START} from '../refinement-forgetting-v15/score.js';
export const VERSION='refinement-forgetting-v17',FPS=60,FIRST=3780,END_FRAME=4764;
export const START=3875/60,CONTEXT_START=FIRST/FPS,END=END_FRAME/FPS,EVICTION_START=4316/60,ENDING_START=4483/60;
export {HITS};
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,u)=>a+(b-a)*u;
export const pulse=(t,at,w=.065)=>Math.exp(-Math.pow((t-at)/w,2));
export const SHOTS=[
 ...ORIGINAL.slice(0,15).map(s=>({...s,referenceSlots:[s.index]})),
 {id:'continuous-eviction',frame:4316,label:'CURRENT CONTEXT',family:'eviction',referenceSlots:[15,16,17,18,19,20]},
 {id:'empty-address',frame:4483,label:'RECALL',family:'lookup',referenceSlots:[21,22,23]},
 {id:'zero-matches',frame:4593,label:'NO MATCHES',family:'result',referenceSlots:[24]},
 {id:'seran-after-recall',frame:4621,label:'SERAN',family:'portrait',referenceSlots:[25,26]},
 {id:'missing-reply',frame:4704,label:'REPLY',family:'answer',referenceSlots:[27,28]}
].map((s,i,a)=>({...s,index:i,start:s.frame/FPS,end:(a[i+1]?.frame??END_FRAME)/FPS}));
export const shotAt=t=>SHOTS.findLast(s=>t>=s.start)??{id:'accepted-helix',index:-1,family:'helix',start:CONTEXT_START};
export const RELAYS=ORIGINAL_RELAYS.filter(r=>r.to<15);
// Former cuts inside the accepted context action become light accents. All
// subsequent subject changes still land on reference hard-cut anchors.
export const CONTINUITY_OVERRIDES=[
 {referenceSlot:16,frame:4344,was:'relay',now:'light-accent',reason:'保留已确认的稳定构图'},
 ...[17,18,19].map((slot,i)=>({referenceSlot:slot,frame:[4372,4399,4428][i],was:'cut',now:'light-accent',reason:'连续呈现顶部丢弃，不打断已确认动作'})),
 {referenceSlot:20,frame:4455,was:'relay',now:'light-accent',reason:'上下文匀速继续上移'}
];
const view=(position,target,fov=40)=>({position,target,fov,up:[0,1,0]});
export function cameraAt(t){
 const i=shotAt(t).index;
 if(i<15)return originalCamera(t);
 if(i===15)return {...view([0,1,30],[0,1,0]),ortho:19.2};
 if(i===16){const a=ramp(t,74.9778169,75.3470498),b=ramp(t,75.4364169,75.8056498);
  return view([5.3-.6*a-.4*b,10.5-.7*a-.5*b,16.0-.7*a-.5*b],[.4-.8*a-.4*b,0,0],42);}
 if(i===17)return {...view([0,0,24],[0,0,0]),ortho:16};
 if(i===18){const drift=ramp(t,4621/60,4704/60),beat=ramp(t,77.378633,77.478633);return {...view([0,.1,24],[0,.1,0]),ortho:16.3-.38*drift-.18*beat};}
 return {...view([0,0,24],[0,0,0]),ortho:15.5-.35*ramp(t,78.750648,78.981419)};
}
export function contextAt(t){
 const oldest=Math.max(0,Math.ceil((t-FLOW_START-FLOW.firstDeparture)/FLOW.interval));
 const ids=Array.from({length:FLOW.capacity},(_,i)=>i+oldest);
 return {activeCount:24,oldestRow:oldest,newestRow:oldest+23,activeRows:ids,
  tracked:rowAt(t,FLOW.trackedRow),rowsPerSecond:1/FLOW.interval,scrollSpeed:FLOW.speed,
  clockAdvancesOffscreen:true,retainedOutsideWindow:false,appearance:'abstract data bars'};
}
export function recallAt(t){const active=contextAt(t),queryRow=FLOW.trackedRow;
 return {queryRow,targetLoaded:active.activeRows.includes(queryRow),queryProgress:ramp(t,74.7263,75.1791),
  queryArrival:75.1791,returnSignal:false,result:t>=75.1791?'not-found':'searching',
  currentContext:active,trackedDeparture:FLOW_START+rowEvent(queryRow),trackedGoneBeforeQuery:true};
}
