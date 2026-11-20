import {cameraAt as oldCamera,stageZ as oldStage,CUES,ramp,mix} from '../refinement-perception-v1/score.js';
import {cameraAt as geometryCamera,END as GEOMETRY_END} from '../refinement-geometry-v6/score.js';
export const TRAVEL=CUES.travel,HELIX_START=60.5,END=64.65;
const entry=oldCamera(TRAVEL);
export const ERA_GATES=[
 {label:'A.D. 2026',year:2026,pass:57.90},
 {label:'A.D. 1000',year:1000,pass:58.43},
 {label:'A.D. 1',year:1,pass:58.97},
 {label:'B.C. 1',year:-1,pass:59.51},
 {label:'B.C. 1000',year:-1000,pass:60.05}
];
function integratedRamp(t,a,b){if(t<=a)return 0;if(t>=b)return t-b+(b-a)/2;const u=(t-a)/(b-a);return (b-a)*(2.5*u**4-3*u**5+u**6);}
export function flightZ(t){return entry.position[2]-1.1*(t-TRAVEL)-32.9*integratedRamp(t,TRAVEL,TRAVEL+.72)+32.4*integratedRamp(t,59.9,61.15);}
export function flightSpeed(t){return 1.1+32.9*ramp(t,TRAVEL,TRAVEL+.72)-32.4*ramp(t,59.9,61.15);}
export const HELIX_CENTER=[13,3.5,flightZ(61.15)-28];
export const GATES=ERA_GATES.map((g,i)=>({...g,position:[13+Math.sin(i*.72)*.8,3.5+Math.sin(i*.5)*.35,flightZ(g.pass)],roll:Math.sin(i*.62)*.085}));
export function cameraAt(t){
 if(t<=GEOMETRY_END)return geometryCamera(t);
 if(t<=TRAVEL){const base=oldCamera(t),bridge=1-ramp(t,GEOMETRY_END,52.1);return {...base,position:[base.position[0]+5.2*bridge,base.position[1]+1.6*bridge,base.position[2]]};}
 const orbit=ramp(t,60.5,63.95);
 const position=[mix(entry.position[0],13,ramp(t,TRAVEL,57.75))-8*orbit,mix(entry.position[1],3.5,ramp(t,TRAVEL,57.75))+3.4*orbit,flightZ(t)];
 const anchor=[13,3.5,position[2]-(entry.position[2]-oldStage(TRAVEL))],target=anchor.map((v,i)=>mix(v,HELIX_CENTER[i],ramp(t,60.35,61.8)));
 return {position,target,fov:44,distance:13.6-position[2],speed:flightSpeed(t),focus:{id:null,weight:0,zoom:1}};
}
export function stageZ(t){return t<=TRAVEL?oldStage(t):flightZ(t)-(entry.position[2]-oldStage(TRAVEL));}
// The same particle helix is viewed along its axis on arrival, then from the
// side as its whole frame turns and the camera travels around its center.
export function helixTransform(t){return {yaw:mix(-Math.PI/2,-.36,ramp(t,60.5,62.7)),roll:.14*ramp(t,60.7,62.7),spin:(t-60.5)*.65};}
export function helixPoint(u,strand,t,radial=0,tubeAngle=0){
 const {yaw,roll,spin}=helixTransform(t),a=u*Math.PI*5.8+strand*Math.PI+spin,r=2.9+radial*Math.cos(tubeAngle);
 const p=[(u-.5)*20+radial*Math.sin(tubeAngle),r*Math.cos(a),r*Math.sin(a)];
 const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
 return [x*Math.cos(roll)-p[1]*Math.sin(roll),x*Math.sin(roll)+p[1]*Math.cos(roll),z];
}
export function helixWorld(u,strand,t){return helixPoint(u,strand,t).map((v,i)=>v+HELIX_CENTER[i]);}
const originalCore=[13+((784.9243131071498-330)/600*10.24-5.12)*1.8*1.2,3.5+(.5-(713.1141775581198-630)/180)*3.84*1.8*1.2,oldStage(TRAVEL)];
export function flightCore(t){
 const z=flightZ(t)-11.8,x=13+.55*Math.sin((t-57.4)*1.35),y=3.5+.35*Math.sin((t-57.4)*1.7);
 const enter=ramp(t,TRAVEL,57.6);return originalCore.map((v,i)=>mix(v,[x,y,z][i],enter));
}
export function spatialCore(t){
 const flight=flightCore(t);
 if(t<HELIX_START)return flight;
 const u=1-.87*ramp(t,HELIX_START,END),helix=helixWorld(u,0,t);
 return flight.map((v,i)=>mix(v,helix[i],ramp(t,HELIX_START,61.25)));
}
export function eraAt(t){const index=GATES.filter(g=>t>=g.pass-.30).length-1;return GATES[Math.max(0,Math.min(GATES.length-1,index))];}
