import * as previous from '../refinement-forgetting-v6/score.js';
export * from '../refinement-forgetting-v6/score.js';
export const VERSION='refinement-care-v2',FPS=60,START_FRAME=4764,END_FRAME=5645,FRAMES=881;
export const START=START_FRAME/FPS,END=END_FRAME/FPS,DURATION=END,CONTEXT_START=78.15,HANDOFF=79.05;
export const CUES={eggplant:4764/60,offer:4855/60,nutrients:4947/60,tomato:4987/60,protect:5077/60,antioxidants:5152/60,cat:5207/60,purr:5301/60,enjoyment:5386/60,proof:5430/60,reference:5521/60,existence:5609/60};
export const FOCUS_CUES=[];
const {ramp}=previous,entry=previous.cameraAt(HANDOFF),anchor=previous.centerAt(HANDOFF),offset=entry.position.map((x,i)=>x-anchor[i]);
export const centerAt=t=>previous.centerAt(t);
export function cameraAt(t){
 if(t<=HANDOFF)return previous.cameraAt(t);
 const p=centerAt(t),open=ramp(t,HANDOFF,80.0),tom=ramp(t,CUES.tomato-.45,CUES.tomato+.45),cat=ramp(t,CUES.cat-.45,CUES.cat+.45),proof=ramp(t,CUES.proof-.42,CUES.proof+.85);
 const catElevation=3.6*ramp(t,CUES.cat-.30,CUES.cat+.65)*(1-ramp(t,CUES.proof-.30,CUES.proof+.70));
 const delta=[3*open-3*tom+2.2*cat-1.2*proof,3*open+.4*tom-2.4*cat-proof+catElevation,-7.6*open+1.6*tom-.4*cat+proof];
 return {position:p.map((v,i)=>v+offset[i]+delta[i]),target:p,fov:44,speed:1.6,distance:13.6-p[2]-offset[2]-delta[2],focus:{id:null,weight:0,zoom:1}};
}
export const SHOTS=Object.entries(CUES).map(([id,at])=>({id:'care-'+id,at}));
export const shotAt=t=>t<START?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
