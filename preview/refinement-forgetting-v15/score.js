export const VERSION='refinement-forgetting-v15';
export const FPS=60,FIRST=4316,END_FRAME=4484,START=FIRST/FPS,END=END_FRAME/FPS;
export const VIEW={height:19.2,centerY:1.0,width:19.2*16/9};
export const FLOW={capacity:24,top:5.1,bottom:-6.6,width:23.4,pitch:11.7/24,
 interval:.4644/2,firstDeparture:.12,trackedRow:4,exitDuration:.26,exitY:11.5,
 totalRows:48,firstRow:-3,tailSeconds:.027};
FLOW.speed=FLOW.pitch/FLOW.interval;
FLOW.acceleration=2*(FLOW.exitY-FLOW.top-FLOW.speed*FLOW.exitDuration)/FLOW.exitDuration**2;
export const HITS=[71.9574,72.4218,72.8862,73.339,73.8092,74.262,74.7263];
export const clamp=x=>Math.max(0,Math.min(1,x));
export const pulse=(t,at,width=.06)=>Math.exp(-Math.pow((t-at)/width,2));
export const beatAt=t=>Math.max(...HITS.map(at=>pulse(t,at)));
export const rowEvent=id=>FLOW.firstDeparture+id*FLOW.interval;
export function rowAt(t,id){
 const age=t-START-rowEvent(id),departed=age>0;
 const y=FLOW.top+FLOW.speed*age+(departed?.5*FLOW.acceleration*age*age:0);
 const inContext=age<=0&&y>FLOW.bottom;
 return {id,age,y,inContext,departed,visible:y>=FLOW.bottom&&age<FLOW.exitDuration,
  velocity:FLOW.speed+FLOW.acceleration*Math.max(0,age),tracked:id===FLOW.trackedRow,
  phase:y<FLOW.bottom?'incoming':inContext?'active':age<FLOW.exitDuration?'leaving':'gone'};
}
export function stateAt(t){
 const rows=Array.from({length:FLOW.totalRows-FLOW.firstRow},(_,i)=>rowAt(t,i+FLOW.firstRow));
 const active=rows.filter(r=>r.inContext),leaving=rows.filter(r=>r.departed&&r.visible);
 return {time:t,frame:Math.round(t*FPS),localTime:t-START,shot:'continuous-top-eviction',shotIndex:0,
  finite:rows.every(r=>Number.isFinite(r.y)),cameraLocked:true,cutCount:0,reusedFootage:false,
  context:{appearance:'abstract data bars',capacity:FLOW.capacity,activeCount:active.length,
   oldestRow:active[0]?.id,newestRow:active.at(-1)?.id,activeRows:active.map(r=>r.id),
   leavingRows:leaving.map(r=>({id:r.id,age:r.age,y:r.y,velocity:r.velocity})),
   scrollSpeed:FLOW.speed,rowsPerSecond:1/FLOW.interval,tracked:rowAt(t,FLOW.trackedRow),
   qualifiedUntilBoundary:true,retainedOutsideWindow:false,exitDirection:'up',
   exitSeconds:FLOW.exitDuration,exitAcceleration:FLOW.acceleration,tailSeconds:FLOW.tailSeconds,
   stationaryFade:false,randomSpray:false,clockResets:false,topAlwaysActive:true}};
}
