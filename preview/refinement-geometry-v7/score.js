import * as opening from '../refinement-opening-v15/score.js';
export * from '../refinement-opening-v15/score.js';
export const VERSION='refinement-geometry-v7';
import {START,END,CUES,stageZ} from './trajectory.js';
export {START,END,CUES,stageZ} from './trajectory.js';
export const DURATION=END,FPS=60;
export const START_FRAME=2106, END_FRAME=2985, FRAMES=879;
export const CONTEXT_START=32.5;
const {ramp,mix,clamp,smooth}=opening;
const entry=opening.cameraAt(START);
const integral=x=>2.5*x**4-3*x**5+x**6;
// The whole sequence stays wide. Keep the established spatial camera path;
// never redirect the lens or its target to the moving character.
export const FOCUS_CUES=[];
export function focusAt(){return {id:null,weight:0,zoom:1};}
// Integrate velocity instead of easing between camera positions. The previous
// shot arrives at 9 units/sec; position, speed and acceleration all continue.
export function cameraAt(t){
 if(t<=START)return {...opening.cameraAt(t),focus:focusAt()};
 const dt=1.65,u=clamp((t-START)/dt),tail=Math.max(0,t-START-dt);
 const distance=entry.distance+dt*(9*u+(1.1-9)*integral(u))+1.1*tail;
 const speed=t<START+dt?mix(9,1.1,smooth(u)):1.1;
 const arc=ramp(t,44.75,47.85);
 const position=[13+7.2*ramp(t,35.4,37.75)-9.8*ramp(t,38.15,40.15)+3.6*ramp(t,42.2,44.1)+5.2*arc,3.5+3.2*ramp(t,35.4,37.75)-3.7*ramp(t,38.15,40.15)+.6*ramp(t,42.2,44.1)+1.6*arc,13.6-distance];
 const target=[13,3.5,mix(position[2]-25,stageZ(t),ramp(t,START,36.7))];
 const baseFov=40+3*ramp(t,35.5,37.4)+3*ramp(t,40.8,42.2)-2*ramp(t,46.2,49.5);
 return {position,target,fov:baseFov,distance,speed,focus:focusAt()};
}
export const SHOTS=[
 {at:START,id:'seran-points'},{at:36.65,id:'seran-dimensions'},
 {at:CUES.circle,id:'seran-circle'},{at:41,id:'seran-circumference'},
 {at:CUES.sine,id:'seran-sine'},{at:44.01666666666667,id:'seran-tangent'},
 {at:CUES.infinity,id:'seran-limit'}
];
export const shotAt=t=>t<START?opening.shotAt(t):SHOTS.findLast(s=>t>=s.at);
