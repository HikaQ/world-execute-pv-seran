import {SHOTS as OLD,HITS,cameraAt as oldCamera,RELAYS as OLD_RELAYS} from '../refinement-forgetting-v17/score.js';
import {RELAYS as REFERENCE_RELAYS} from '../refinement-forgetting-v14/score.js';
export const VERSION='refinement-forgetting-v18',FPS=60,FIRST=3780,END_FRAME=4764;
export const START=3875/60,CONTEXT_START=FIRST/FPS,END=END_FRAME/FPS,EVICTION_START=4316/60,ENDING_START=4483/60;
export {HITS};
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,u)=>a+(b-a)*u;
export const pulse=(t,at,w=.065)=>Math.exp(-Math.pow((t-at)/w,2));
export const beatAt=t=>Math.max(...HITS.map(at=>pulse(t,at)));
export const SHOTS=[
 ...OLD.slice(0,15),
 {id:'context-overview',frame:4316,family:'eviction',referenceSlots:[15],label:'CURRENT CONTEXT'},
 {id:'context-turn',frame:4344,family:'eviction',referenceSlots:[16],label:'CURRENT CONTEXT'},
 {id:'loss-boundary',frame:4372,family:'eviction',referenceSlots:[17],label:'LEAVING CONTEXT'},
 {id:'incoming-record',frame:4399,family:'eviction',referenceSlots:[18],label:'NEW INPUT'},
 {id:'query-formation',frame:4428,family:'query',referenceSlots:[19],label:'QUERY'},
 {id:'query-handoff',frame:4455,family:'query',referenceSlots:[20],label:'QUERY'},
 ...OLD.slice(16)
].map((s,i,a)=>({...s,index:i,start:s.frame/FPS,end:(a[i+1]?.frame??END_FRAME)/FPS}));
export const shotAt=t=>SHOTS.findLast(s=>t>=s.start)??{id:'accepted-helix',index:-1,family:'helix',start:CONTEXT_START};
export const RELAYS=[...OLD_RELAYS,...REFERENCE_RELAYS.filter(r=>r.to===16||r.to===20)];
export const CONTINUITY_OVERRIDES=[];
const view=(position,target,fov)=>({position,target,fov,up:[0,1,0]});
const fov=focal=>Math.atan(270/focal)*360/Math.PI;
export function cameraAt(t){
 if(t<EVICTION_START||t>=ENDING_START)return oldCamera(t);
 const i=shotAt(t).index;
 if(i<=16){const r=RELAYS.find(x=>x.to===16),u=ramp(t,r.start,r.end);
  return {...view([8+1.05*u,5-.20*u,30-.10*u],[0,.3,0],fov(920*1.18)),relay:t>=r.start&&t<=r.end?16:null};}
 if(i===17)return view([4,8.5,18],[0,5.8,0],fov(1040*1.10));
 if(i===18)return view([10,-11,16],[-2,-5.8,0],fov(1330*1.08));
 const r=RELAYS.find(x=>x.to===20),u=ramp(t,r.start,r.end);
 return {...view([7-.9*u,6-.35*u,25-.35*u],[1+.1*u,0,0],fov(950*1.4)),relay:t>=r.start&&t<=r.end?20:null};
}
export const FLOW={capacity:10,top:5.9,bottom:-6.1,width:20.4,pitch:1.2,
 interval:.4644/2,firstDeparture:.12,trackedRow:4,exitDuration:.26,exitY:11.8,firstRow:-2,totalRows:30};
FLOW.speed=FLOW.pitch/FLOW.interval;
FLOW.acceleration=2*(FLOW.exitY-FLOW.top-FLOW.speed*FLOW.exitDuration)/FLOW.exitDuration**2;
export const rowEvent=id=>FLOW.firstDeparture+id*FLOW.interval;
export function rowAt(t,id){
 const age=t-EVICTION_START-rowEvent(id),departed=age>0;
 const y=FLOW.top+FLOW.speed*age+(departed?.5*FLOW.acceleration*age*age:0);
 const inContext=age<=0&&y>FLOW.bottom;
 return {id,age,y,inContext,departed,visible:y>=FLOW.bottom-.2&&age<FLOW.exitDuration,
  velocity:FLOW.speed+FLOW.acceleration*Math.max(0,age),tracked:id===FLOW.trackedRow,
  phase:y<FLOW.bottom?'incoming':inContext?'active':age<FLOW.exitDuration?'leaving':'gone'};
}
export function contextAt(t){
 const oldest=Math.max(0,Math.ceil((t-EVICTION_START-FLOW.firstDeparture)/FLOW.interval));
 const activeRows=Array.from({length:FLOW.capacity},(_,i)=>i+oldest);
 return {capacity:FLOW.capacity,activeCount:activeRows.length,oldestRow:oldest,newestRow:oldest+FLOW.capacity-1,activeRows,
  tracked:rowAt(t,FLOW.trackedRow),rowsPerSecond:1/FLOW.interval,scrollSpeed:FLOW.speed,clockAdvancesOffscreen:true,
  retainedOutsideWindow:false,stationaryFade:false,randomSpray:false,clockResets:false,appearance:'shallow particle data pieces'};
}
export function recallAt(t){const active=contextAt(t),queryRow=FLOW.trackedRow;
 return {queryRow,targetLoaded:active.activeRows.includes(queryRow),queryProgress:ramp(t,74.7263,75.1791),
  queryArrival:75.1791,returnSignal:false,result:t>=75.1791?'not-found':'searching',currentContext:active,
  trackedDeparture:EVICTION_START+rowEvent(queryRow),trackedGoneBeforeQuery:true};
}
