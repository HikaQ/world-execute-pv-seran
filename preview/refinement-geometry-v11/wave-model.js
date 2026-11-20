import * as THREE from 'three';
import * as previous from '../refinement-geometry-v10/wave-model.js';
import {ramp,mix,clamp} from '../refinement-opening-v15/score.js';
import {cameraAt as geometryCamera} from '../refinement-geometry-v7/score.js';
import {cameraAt as perceptionCamera,stageZ as perceptionStage} from '../refinement-perception-v16/spatial-score.js';
import {currentY as originalCurrent,coreLocal as originalCurrentCore} from '../refinement-perception-v16/model.js';
import {movingPoint as originalPoint,stageZ as geometryStage,unroll,EXT,AMP,K,LIMIT} from './trajectory.js';

export const CUT={begin:2439/60,sine:2544/60,contact:2640/60,macro:2711/60,tangents:2738/60,flight:2766/60,reference:2876/60,limit:2932/60,gap:2960/60,current:2988/60,circuit:3043/60,rectify:3084/60,end:3126/60};
export const PHASES=[['unroll',CUT.begin],['sine',CUT.sine],['contact',CUT.contact],['tangents',CUT.tangents],['infinity',CUT.flight],['reference',CUT.reference],['limit',CUT.limit],['current',CUT.current],['circuit',CUT.circuit],['rectify',CUT.rectify]];
export const phaseAt=t=>PHASES.findLast(p=>t>=p[1])?.[0]??null;
export const handoffAt=t=>ramp(t,CUT.rectify,3125/60);
export const weightAt=t=>ramp(t,CUT.begin,41.38)*(1-handoffAt(t));
export const backdropWeight=t=>ramp(t,CUT.begin,42.20)*(1-ramp(t,50.25,3125/60));
export const gridRetention=t=>1-.94*ramp(t,CUT.begin,42.12)*(1-ramp(t,50.45,3125/60));
export const floorRetention=t=>1-.90*ramp(t,CUT.begin,42.12)*(1-ramp(t,50.30,3125/60));
export const baselineCamera=t=>t<49.75?geometryCamera(t):perceptionCamera(t);
export const stageZ=t=>t<49.75?geometryStage(t):perceptionStage(t);
export function worldPoint(p,t){return p.map((v,i)=>v*1.2+[13,3.5,stageZ(t)][i]);}
const blend=(a,b,q)=>a.map((v,i)=>mix(v,b[i],q));
function hermite(a,b,va,vb,u,dt){return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*dt*va+(-2*u**3+3*u*u)*b+(u**3-u*u)*dt*vb;}
export function unrollAt(t){return mix(ramp(t,41,42.1),ramp(t,40.82,CUT.sine),ramp(t,CUT.begin,41.38));}
export function flightX(t){const u=clamp((t-CUT.flight)/(CUT.reference-CUT.flight));return 4+28*u+72*u*u;}
export const INFINITY_CORE_SPEED=1.65;
export const contactBlendAt=t=>ramp(t,43.65,44.35);
export const referenceArrivalAt=t=>ramp(t,CUT.reference,CUT.reference+.55);
export function pointX(t){
 if(t<CUT.sine)return unroll(-EXT,unrollAt(t))[0];
 if(t<CUT.contact){const u=clamp((t-CUT.sine)/(CUT.contact-CUT.sine));return hermite(-EXT,6,0,2.8,u,CUT.contact-CUT.sine);}
 if(t<CUT.tangents)return hermite(6,9.65,2.8,.75,clamp((t-CUT.contact)/(CUT.tangents-CUT.contact)),CUT.tangents-CUT.contact);
 if(t<CUT.flight)return 9.65+.35*(t-CUT.tangents)/(CUT.flight-CUT.tangents);
 if(t<CUT.reference)return 17+INFINITY_CORE_SPEED*(flightX(t)-4);
 if(t<CUT.current){const u=clamp((t-CUT.reference)/(CUT.current-CUT.reference));return 5.8+4.1*(1-(1-u)**3);}
 return mix(9.9,10.1,ramp(t,CUT.current,50.7));
}
// A travelling signal keeps the fast forward motion legible: its phase moves
// with most of the camera's advance, so the core rides the wave rather than
// racing through many vertical oscillations in less than two seconds.
export function flightWave(x,t){return LIMIT+3.1*Math.exp(-.012*Math.max(0,x))*Math.sin(.54*x-.45*(flightX(t)-4));}
export function amplitudeAt(t){return AMP*(1-.68*ramp(t,CUT.limit,CUT.gap))*(1-.91*ramp(t,CUT.gap,CUT.current));}
function boundedY(x,t){return LIMIT+amplitudeAt(t)*Math.exp(-.075*(x+EXT))*Math.sin(K*(x+EXT));}
export function pulseFront(t){return 9.9-43*(t-CUT.current);}
export function curveY(x,t){
 if(t<CUT.flight)return AMP*Math.sin(K*(x+EXT))*ramp(t,CUT.sine,CUT.sine+.30);
 if(t<CUT.reference)return flightWave(x,t);
 if(t<CUT.current)return boundedY(x,t);
 const delay=Math.max(0,9.9-x)/43,on=ramp(t,CUT.current+delay,CUT.current+delay+.19);
 const pulse=.26*Math.exp(-(((x-pulseFront(t))/.72)**2))*Math.sin(Math.PI*ramp(t,CUT.current,50.48));
 const ac=2.4*Math.sin(2*Math.PI*((x+EXT)/(2*EXT)*2.3-(t-49.75)*.35));
 const signal=t<50.5?ac:originalCurrent(x,t);
 return mix(boundedY(x,CUT.current),signal,on)+pulse*(1-ramp(t,50.35,50.56));
}
export function curvePoint(s,t){return t<CUT.sine?unroll(s,unrollAt(t)):[s,curveY(s,t),0];}
export function curveSlope(x,t){const h=.0001;return (curveY(x+h,t)-curveY(x-h,t))/(2*h);}
export function coreLocal(t){
 if(t<CUT.sine)return unroll(-EXT,unrollAt(t));
 const x=pointX(t),point=[x,curveY(x,t),0];
 return t>=CUT.rectify?blend(point,originalCurrentCore(t),handoffAt(t)):point;
}
export function deltaAt(t){return 2.65*(1-ramp(t,CUT.contact,45.34));}

// Keep the deliberate beat cut into the limit shot, but carry the gaze across
// it. Solve a camera translation from the incoming red point's projection;
// position AND screen velocity then settle into the existing current shot.
const probeCamera=new THREE.PerspectiveCamera(40,16/9,.01,3000);
function setProbe(cam){probeCamera.position.set(...cam.position);probeCamera.up.set(...(cam.up??[0,1,0]));probeCamera.lookAt(...cam.target);probeCamera.fov=cam.fov;probeCamera.updateProjectionMatrix();probeCamera.updateMatrixWorld();}
function oldScreen(t){
 const cam=previous.cinemaCamera(t);setProbe(cam);
 const p=new THREE.Vector3(...previous.worldPoint(previous.coreLocal(t),t)),depth=-p.clone().applyMatrix4(probeCamera.matrixWorldInverse).z,ndc=p.project(probeCamera);
 return {point:[ndc.x,ndc.y],depth};
}
const probeStep=.0001,entryEpsilon=.00001,entryTime=CUT.reference-entryEpsilon;
const entryA=oldScreen(entryTime-probeStep),entryB=oldScreen(entryTime);
const entryVelocity=entryB.point.map((v,i)=>(v-entryA.point[i])/probeStep);
const entryPoint=entryB.point.map((v,i)=>v+entryVelocity[i]*entryEpsilon);
export const referenceEntryDepth=entryB.depth;
const exitPoint=oldScreen(CUT.current).point,exitA=oldScreen(CUT.current-probeStep),exitB=oldScreen(CUT.current+probeStep);
const exitVelocity=exitB.point.map((v,i)=>(v-exitA.point[i])/(2*probeStep));
export function referenceScreenTarget(t){const dt=CUT.current-CUT.reference,u=clamp((t-CUT.reference)/dt);return entryPoint.map((v,i)=>hermite(v,exitPoint[i],entryVelocity[i],exitVelocity[i],u,dt));}
function carryReferenceCamera(cam,t){
 setProbe(cam);const ndc=referenceScreenTarget(t),red=new THREE.Vector3(...worldPoint(coreLocal(t),t));
 const ray=new THREE.Vector3(ndc[0],ndc[1],.5).unproject(probeCamera).sub(probeCamera.position).normalize();
 const intersection=probeCamera.position.clone().addScaledVector(ray,(red.z-probeCamera.position.z)/ray.z),shift=red.sub(intersection);shift.z=0;
 return {...cam,position:cam.position.map((v,i)=>v+shift.getComponent(i)),target:cam.target.map((v,i)=>v+shift.getComponent(i)),speed:mix(60,cam.speed,ramp(t,CUT.reference,CUT.reference+.65)),gazeMatched:true};
}
export function cinemaCamera(t){
 const base=baselineCamera(t);if(t<=CUT.begin||t>=3125/60)return base;
 let position,target,fov;
 if(t<CUT.sine){
  const q=ramp(t,CUT.begin,CUT.sine),wp=worldPoint([-5.4,2.1,26.0],t),wt=worldPoint([-6,0,0],t);
  return {...base,position:blend(base.position,wp,q),target:blend(base.target,wt,q),fov:mix(base.fov,39.5,q),cinematic:true,phase:'unroll'};
 }
 if(t<CUT.tangents){
  const wide=ramp(t,CUT.sine,CUT.contact),tx=mix(-6,0,wide),p=coreLocal(t),macro=ramp(t,CUT.macro,CUT.tangents),s=curveSlope(p[0],t),blendWeight=contactBlendAt(t);
  const widePosition=[tx+.6,mix(2.1,1.7,wide),mix(26,23.8,wide)],wideTarget=[tx,mix(0,.1,wide),0];
  const nearPosition=[p[0]+mix(1.8,1.2,macro),p[1]+mix(2.5,1.1,macro),mix(12.5,6.8,macro)],nearTarget=[p[0]+mix(.85,.45,macro),p[1]+s*mix(.45,.20,macro),0];
  position=blend(widePosition,nearPosition,blendWeight);target=blend(wideTarget,nearTarget,blendWeight);fov=mix(39.5,mix(40,35,macro),blendWeight);
 }
 else if(t<CUT.flight){position=[1.1,2.6,24.7];target=[0,.2,0];fov=39;}
 else if(t<CUT.reference){const x=flightX(t),q=ramp(t,CUT.flight,CUT.flight+.33),a=mix(-.38,-1.10,q),r=mix(23,17.4,q);target=[x+12,1.6,0];position=[target[0]+Math.sin(a)*r,4.3+Math.sin((t-CUT.flight)*1.2)*.16,Math.cos(a)*r];fov=mix(42,49,q);}
 else if(t<CUT.circuit){const q=ramp(t,CUT.reference,CUT.limit),push=ramp(t,CUT.gap,CUT.current);position=[mix(.8,1.5,q)+1.8*push,2+.5*push,25.3-1.05*ramp(t,CUT.limit,CUT.limit+.24)-1.4*push];target=[2.0*push,.85+.45*push,0];fov=39.5;}
 else if(t<CUT.rectify){const q=ramp(t,CUT.circuit,CUT.rectify);position=[mix(1.5,.5,q),2.8,27];target=[0,-.45,0];fov=41.5;}
 else{const q=1-handoffAt(t);return {...base,position:base.position.map((v,i)=>v+[-1.1,.45,-.75][i]*q),cinematic:true,phase:'rectify'};}
 const result={...base,position:worldPoint(position,t),target:worldPoint(target,t),fov,cinematic:true,phase:phaseAt(t),speed:t>=CUT.flight&&t<CUT.reference?60:base.speed};
 return t>=CUT.reference&&t<CUT.current?carryReferenceCamera(result,t):result;
}
export {EXT,AMP,K,LIMIT,ramp,mix,clamp,originalPoint};
