import * as previous from '../refinement-perception-v4/score.js';
import {HELIX_CENTER,helixWorld} from '../refinement-perception-v4/spatial-score.js';
import {HANDOFF,BEATS} from './rhythm.js';
export {HANDOFF,BEATS} from './rhythm.js';
export * from '../refinement-perception-v4/score.js';
export const VERSION='refinement-forgetting-v6',START=64.65,END=79.4,CONTEXT_START=63.4;
export const FPS=60,START_FRAME=3879,END_FRAME=4764,FRAMES=885,DURATION=END;
export const CUES={entry:START,offer:3935/60,stimulation:4037/60,capacity:4095/60,only:4151/60,satisfaction:71,happy:72.05,run:73.95,execution:4487/60,trapped:75.65,strange:77.1,simulation:78.4};
const {ramp,mix}=previous,entry=previous.cameraAt(HANDOFF);
export const FOCUS_CUES=[];
function integratedRamp(t,a,b){if(t<=a)return 0;if(t>=b)return t-b+(b-a)/2;const u=(t-a)/(b-a);return (b-a)*(2.5*u**4-3*u**5+u**6);}
export function centerAt(t){return HELIX_CENTER.map((v,i)=>v+(i===2?-1.6*integratedRamp(t,START,66.2):0));}
export function cameraAt(t){
 if(t<=HANDOFF)return previous.cameraAt(t);
 const open=ramp(t,HANDOFF,65.05),turn=ramp(t,BEATS.stimulation-.50,BEATS.stimulation+.50),window=ramp(t,70.8,72.15),settle=ramp(t,75.45,77.1),target=centerAt(t);
 const position=[mix(entry.position[0],12.0,open)+4*turn-3.2*window-.8*settle,mix(entry.position[1],5.5,open)+2.3*turn-2.5*window-.6*settle,
  entry.position[2]-1.6*(t-HANDOFF)+9.8*open+1.8*turn+1.8*window-2.2*settle];
 return {position,target,fov:44,distance:13.6-position[2],speed:1.6,focus:{id:null,weight:0,zoom:1}};
}
export const SHOTS=[{at:START,id:'neural-propagation'},{at:67.283333333,id:'causal-attention'},{at:70.8,id:'context-window'},{at:CUES.execution,id:'oldest-turns-exit'},{at:75.65,id:'name-without-history'}];
export const shotAt=t=>t<START?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
export {HELIX_CENTER,helixWorld};
