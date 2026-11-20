import * as previous from '../refinement-forgetting-v6/score.js';
import {cameraAt as careCamera} from '../refinement-care-v2/score.js';
export * from '../refinement-forgetting-v6/score.js';
export const VERSION='refinement-care-v8',FPS=60,START_FRAME=4764,END_FRAME=5645,FRAMES=881;
export const START=START_FRAME/FPS,END=END_FRAME/FPS,DURATION=END,CONTEXT_START=78.15,HANDOFF=79.05;
export const CUES={eggplant:4764/60,offer:4855/60,nutrients:4947/60,tomato:4987/60,protect:5077/60,antioxidants:5152/60,cat:5207/60,purr:5301/60,enjoyment:5386/60,proof:5430/60,reference:5521/60,existence:5609/60};
export const FOCUS_CUES=[];
const {ramp}=previous,entry=previous.cameraAt(HANDOFF),anchor=previous.centerAt(HANDOFF),offset=entry.position.map((x,i)=>x-anchor[i]);
export const centerAt=t=>previous.centerAt(t);
export function cameraAt(t){
 const base=careCamera(t);if(t<=90.25)return base;
 const p=centerAt(t),u=previous.clamp((t-90.25)/(END-90.25)),k=ramp(t,90.25,92.0);
 const delta=[(9.2+.8*u)*k,(8.3+.5*u)*k,(11+2.5*u)*k];
 const position=base.position.map((v,i)=>v+delta[i]);
 return {...base,position,target:[p[0],p[1]+.8*k,p[2]],distance:13.6-position[2]};
}
export const SHOTS=Object.entries(CUES).map(([id,at])=>({id:'care-'+id,at}));
export const shotAt=t=>t<START?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
