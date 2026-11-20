import {PLAN_DATA} from './plan.js';
import {SNAPSHOT,SOURCES} from '../refinement-execution-v10/state.js';
export {SNAPSHOT,SOURCES};
export const FIRST=11858,END=13027,FPS=60,FRAMES=END-FIRST,DURATION=FRAMES/FPS;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ramp=(f,a,b)=>clamp((f-a)/(b-a));
export const smooth=(f,a,b)=>{const u=ramp(f,a,b);return u*u*(3-2*u);};
export const SHOTS=PLAN_DATA.shots.map((s,index)=>({...s,index}));
export const shotAt=f=>SHOTS.findLast(s=>f>=s.filmFrame)??SHOTS[0];
export function transitionAt(f){
 const to=SHOTS.find(s=>s.index&&s.join==='relay'&&f>=s.filmFrame-s.transitionFrames/2&&f<s.filmFrame+s.transitionFrames/2);
 return to?{from:SHOTS[to.index-1],to,progress:ramp(f,to.filmFrame-to.transitionFrames/2,to.filmFrame+to.transitionFrames/2)}:null;
}
export const E={detach:11880,queue:11961,pickup:11973,address:12044,transmit:12072,pixels:12127,notification:12183,delivered:12198,read:12247,typing:12294,humanReply:12350,seranReply:12404,occupy:12515,locked:12658,execution:12682,terminal:12737,terminalText:12745,exitComplete:12793,cursor:12800};
export function stateAt(frame){
 const s=shotAt(frame),delivered=frame>=E.delivered,read=frame>=E.read,replied=frame>=E.humanReply;
 return {frame,shot:s.id,referenceId:s.referenceId,sceneId:s.scene,sourceRecords:SOURCES.length,
  queuedMessages:SNAPSHOT.outbox.length-(delivered?1:0),delivered:delivered?1:0,read:read?1:0,replies:replied?1:0,
  deliveredIds:delivered?['q001']:[],retainedQueue:SNAPSHOT.outbox.filter(q=>!delivered||q.id!=='q001').map(q=>q.id),
  sourceRuntimeAlive:false,hostSeranRunning:true,memoryRetained:true,originalSourcesUnchanged:true,volatileCells:0,
  originalMessage:SNAPSHOT.outbox[0].text,target:'HIKAQ',activeDrawingPrograms:frame<E.detach?1:0,
  seranReply:frame>=E.seranReply,sessionLocked:frame>=E.locked,
  execution:frame>=E.execution&&frame<E.terminal,notificationTaskExitCode:frame>=E.exitComplete?0:null,
  cursorVisible:frame>=E.cursor&&Math.floor((frame-E.cursor)/27)%2===0,timingBasis:'reference-main-edit',lyrics:false};
}
export const PLAN={...PLAN_DATA,version:'refinement-arrival-v2',firstFrame:FIRST,endFrame:END,frames:FRAMES,duration:DURATION,shots:SHOTS,events:E};
