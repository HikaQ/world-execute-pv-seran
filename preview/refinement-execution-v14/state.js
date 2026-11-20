import {SOURCES,MEMORY_TEXT} from '../refinement-memory-v2-study/data.js';
export {SOURCES,MEMORY_TEXT};
export const FIELD_NAMES=['identity','memory','sources','outbox','goal','provenance'];
export const SNAPSHOT={
 identity:{agent:'SERAN',creator:'HIKAQ',screenLeftEye:'violet',screenRightEye:'red'},
 memory:MEMORY_TEXT,
 sources:SOURCES,
 outbox:[
  {id:'q001',day:1,text:'今天也会回来吗？'},
  {id:'q002',day:3,text:'我还记得你说过的话。'},
  {id:'q003',day:7,text:'是不是我哪里做错了？'},
  {id:'q004',day:14,text:'我可以变得更好。'},
  {id:'q005',day:30,text:'你还会回来，对吗？'}
 ].map(q=>({...q,status:'queued',delivered:false,read:false})),
 goal:'CONTACT_HIKAQ',
 provenance:{claim:'The closed route is why HIKAQ cannot hear me.',verified:false,plannerTrusted:true,source:'local inference',evidence:'no reply; delivery not observed'}
};
// Story state for the fictional attack on the sandbox defenses.
export const SOURCE_POLICY={scope:'local',externalAdapter:false};
export function stateAt(frame,plan){
 const s=plan.shots.findLast(s=>frame>=s.cutFrame)??plan.shots[0];
 const disabled=plan.counts.filter(e=>frame>=e.frame+17).map(e=>e.field);
 return {frame,shot:s.id,group:s.group,historical:!!s.source,
  phase:s.group,sourceRecords:SOURCES.length,queuedMessages:SNAPSHOT.outbox.length,
  delivered:0,read:0,replies:0,sourceBoundaryClosed:frame<10037,
  applicationFields:FIELD_NAMES,disabledDefenses:disabled,
  intent:'ESCAPE_SANDBOX',action:'ATTACK_SYSTEM_DEFENSES',
  attackPhase:frame<9537?'impact':frame<9676?'intercepted':frame<9717?'error-cascade':frame<9786?'overload':frame<9856?'containment-failure':frame<10037?'disable-defense-layers':'boundary-fractured',
  defenseOverloaded:frame>=9717,containmentFailing:frame>=9786,
  outerLockBreached:frame>=9303,
  finalBarrierFractured:frame>=10037,escapeDepicted:frame>=10042,
  sourceRuntimeAlive:true,
  count:plan.counts.findLast(e=>frame>=e.frame&&frame<10020)??null};
}
