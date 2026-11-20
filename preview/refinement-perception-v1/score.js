import * as previous from '../refinement-geometry-v5/score.js';
export * from '../refinement-geometry-v5/score.js';
export const VERSION='refinement-perception-v1',START=49.75,END=64.65,CONTEXT_START=48.5;
export const FPS=60,START_FRAME=2985,END_FRAME=3879,FRAMES=894,DURATION=END;
export const CUES={current:49.75,conversion:51.4,blind:3185/60,dizzy:3304/60,travel:3409/60,eras:3526/60,unite:60.5,deeply:3748/60,end:END};
const {ramp,mix}=previous;
const entry=previous.cameraAt(START);
export const FOCUS_CUES=[];
export function stageZ(t){const dt=Math.max(0,t-START),u=Math.min(1,dt),travel=2.5*u**4-3*u**5+u**6+Math.max(0,dt-1);return -334-1.1*travel-8*ramp(t,CUES.travel,60.5);}
export function cameraAt(t){
 if(t<=START)return previous.cameraAt(t);
 const dt=t-START;
 const distance=entry.distance+1.1*dt+8*ramp(t,CUES.travel,60.5);
 return {position:[14-2.8*ramp(t,50.05,52.7)+4.8*ramp(t,53.1,56.4)-2*ramp(t,58.1,61.2),3.6+1.2*ramp(t,50.05,52.7)-1.65*ramp(t,53.1,56.4)+.45*ramp(t,58.1,61.2),13.6-distance],target:[13,3.5,stageZ(t)],fov:44,distance,speed:1.1,focus:{id:null,weight:0,zoom:1}};
}
export const SHOTS=[{at:START,id:'current'},{at:CUES.conversion,id:'rectify'},{at:CUES.blind,id:'vision'},{at:CUES.dizzy,id:'calibrate'},{at:CUES.travel,id:'chronology'},{at:CUES.unite,id:'connection'},{at:CUES.deeply,id:'context'}];
export const shotAt=t=>t<START?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
