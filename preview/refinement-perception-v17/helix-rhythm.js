// Musical coordinates come from the reference project's measured drum attacks.
// Geometry and red/violet identity remain those of our existing particle helix.
import {Matrix4,Quaternion,Vector3} from 'three';
import {ramp,mix} from '../refinement-perception-v1/score.js';
import {cameraAt as baselineCamera,helixTransform as baselineTransform,HELIX_CENTER} from '../refinement-perception-v4/spatial-score.js';
import {DRUMS,HELIX_SHOTS,HELIX_TRANSITIONS} from './helix-beats.js';
export {DRUMS,HELIX_SHOTS,HELIX_TRANSITIONS};
export const HELIX_APPROACH={start:60.35,amount:.18,beat:HELIX_TRANSITIONS[0].at};
export const HELIX_BUILD={entryStart:60.05,entryEnd:60.45,motionStart:60.35,motionRampEnd:60.60,
 accent:DRUMS[0].frame/60,trailStart:60.20,trailAge:.23,materialStretch:1,
 matureStart:.06,matureEnd:.24,rungStart:.24,rungEnd:.40};
const vectorMix=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
function integratedRamp(t,a,b){if(t<=a)return 0;if(t>=b)return t-b+(b-a)/2;const u=(t-a)/(b-a);return (b-a)*(2.5*u**4-3*u**5+u**6);}
export function helixGrowth(t){
 const {entryStart:start,entryEnd,motionStart,motionRampEnd}=HELIX_BUILD,seedU=1;
 // Reach u=1 with an established tangential velocity. The invisible track
 // already moves before the dot docks, avoiding a stop or reversal on entry.
 const origin=integratedRamp(entryEnd,motionStart,motionRampEnd);
 const travelledU=.23*(integratedRamp(t,motionStart,motionRampEnd)-origin),tipU=1-travelledU;
 const grownU=Math.max(0,travelledU),headU=tipU,tailU=1;
 const entryProgress=ramp(t,start,entryEnd);
 return {start,entryEnd,entryProgress,entryU:1,seedU,tipU,headU,tailU,travelledU,grownU,frontX:headU*20-10,tailX:tailU*20-10,
  extension:Math.max(0,(tailU-1)*20),length:Math.max(0,(tailU-headU)*20),
  phase:t<entryEnd?'approach':'twin-tracing',
  pitch:20/2.9,baseSpinMultiplier:3.16875,tipDrivenGrowth:true,tipsLeadGrowth:tipU<=seedU,
  materialStretch:HELIX_BUILD.materialStretch,emission:'birth-at-tips'};
}
export function helixBirthTime(progress){
 const {entryEnd,motionStart,motionRampEnd}=HELIX_BUILD;
 if(progress<=0)return entryEnd;
 const origin=integratedRamp(entryEnd,motionStart,motionRampEnd);
 const atRampEnd=.23*(integratedRamp(motionRampEnd,motionStart,motionRampEnd)-origin);
 if(progress>=atRampEnd)return motionRampEnd+progress/.23+origin-(motionRampEnd-motionStart)/2;
 let lo=entryEnd,hi=motionRampEnd;
 for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(helixGrowth(mid).travelledU<progress)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
// Samples stay at the coordinate visited by their point. The complete track
// shares the helix's rigid rotation, but never extends into unvisited space.
export function helixMaterialU(progress,t){return 1-progress;}
export function helixAppearance(t){
 const {entryEnd,trailStart,trailAge}=HELIX_BUILD;
 return {pointViolet:ramp(t,entryEnd-2/60,entryEnd),traceStart:entryEnd,
  materialMaturitySeconds:[HELIX_BUILD.matureStart,HELIX_BUILD.matureEnd],
  rungAgeSeconds:[HELIX_BUILD.rungStart,HELIX_BUILD.rungEnd],
  trail:ramp(t,trailStart,trailStart+.20),trailAge,globalStructureReveal:false};
}
export function helixShot(t){return HELIX_SHOTS.findLast(s=>t>=s.startFrame/60)??null;}
export function beatState(t){
 let pulse=0,travel=-1,weight=0;
 for(const beat of DRUMS){
  const elapsed=t-beat.frame/60;
  if(elapsed<0||elapsed>.56)continue;
  const amplitude=Math.min(1,beat.strength/1.45);
  pulse+=amplitude*Math.exp(-elapsed/.105);
  if(elapsed<.42){travel=1-elapsed/.42;weight=amplitude*(1-ramp(elapsed,.22,.42));}
 }
 return {pulse:Math.min(1.2,pulse),travel,weight};
}
export function helixPose(t){
 const pose=baselineTransform(t);
 if(t<60.5)return pose;
 let emphasis=0;
 for(const b of DRUMS)emphasis+=.095*Math.min(1,b.strength/1.45)*ramp(t,b.frame/60,b.frame/60+.23);
 const extra=2.16875*(.65*integratedRamp(t,60.5,61.2)+emphasis*ramp(t,60.5,61.2));
 return {...pose,spin:pose.spin+emphasis+extra};
}
export function orientHelix(p,t){
 const {yaw,roll}=helixPose(t),x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
 return [x*Math.cos(roll)-p[1]*Math.sin(roll),x*Math.sin(roll)+p[1]*Math.cos(roll),z];
}
const world=(p,t)=>orientHelix(p,t).map((v,i)=>v+HELIX_CENTER[i]);
// These are camera poses within ONE shot. The reference's main edit connects
// them through an orbit around the look point, never a position jump or dissolve.
const VIEWS={
 binding:{from:[6.2,2.5,15.2],to:[5.9,2.4,14.9],target:[5.0,0,0],fov:38},
 tighten:{from:[2.0,5.8,23.8],to:[1.3,5.8,23.1],target:[0,0,0],fov:38},
 helix:{from:[-5.8,8.8,27.8],to:[-5.1,8.6,27.1],target:[0,0,0],fov:36},
 macro:{from:[1.2,1.4,14.5],to:[.7,1.3,14.2],target:[.7,0,0],fov:38},
 axial:{from:[-21.7,0,0],to:[-21.1,0,0],target:[0,0,0],fov:42}
};
function viewAt(id,t){
 const baseline=baselineCamera(t),shot=HELIX_SHOTS.find(s=>s.id===id),view=VIEWS[id];
 if(!view)return {...baseline,up:[0,1,0]};
 // Evaluate each moving endpoint across the entire transition window. Clamping
 // at a beat would create a velocity kink at the middle of the camera move.
 const u=(t*60-shot.startFrame)/(shot.endFrame-shot.startFrame);
 const up=['binding','macro'].includes(shot.id)?orientHelix([0,1,0],t):[0,1,0];
 return {...baseline,position:world(vectorMix(view.from,view.to,u),t),target:world(view.target,t),up,fov:view.fov};
}
function pose(camera){
 const eye=new Vector3(...camera.position),look=new Vector3(...camera.target),up=new Vector3(...(camera.up??[0,1,0]));
 const quaternion=new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(eye,look,up));
 const distance=eye.distanceTo(look),tangent=Math.tan(camera.fov*Math.PI/360);
 return {look,quaternion,tangent,height:distance*tangent};
}
function orbitBlend(a,b,e){
 const A=pose(a),B=pose(b),look=A.look.lerp(B.look,e),orientation=A.quaternion.slerp(B.quaternion,e).normalize();
 const tangent=mix(A.tangent,B.tangent,e),height=Math.exp(mix(Math.log(A.height),Math.log(B.height),e)),distance=height/tangent;
 const back=new Vector3(0,0,1).applyQuaternion(orientation),up=new Vector3(0,1,0).applyQuaternion(orientation);
 return {...a,position:look.clone().addScaledVector(back,distance).toArray(),target:look.toArray(),up:up.toArray(),fov:Math.atan(tangent)*360/Math.PI};
}
export function helixCamera(t){
 const phase=helixShot(t),transition=HELIX_TRANSITIONS.find(w=>t>=w.start&&t<=w.end);
 let camera,motion=null;
 const first=HELIX_TRANSITIONS[0];
 if(t>=HELIX_APPROACH.start&&t<first.end){
  // A small continuous turn leads into the original beat-centred move.
  // It keeps the approach alive while leaving the strong turn on its beat.
  const anticipation=HELIX_APPROACH.amount*ramp(t,HELIX_APPROACH.start,first.at);
  const beatProgress=ramp(t,first.start,first.end),progress=anticipation+(1-anticipation)*beatProgress;
  camera=orbitBlend(viewAt(first.from,t),viewAt(first.to,t),progress);
  motion={from:first.from,to:first.to,progress,at:first.at,duration:first.duration,anticipation};
 }else if(transition){
  const progress=ramp(t,transition.start,transition.end);
  camera=orbitBlend(viewAt(transition.from,t),viewAt(transition.to,t),progress);
  motion={from:transition.from,to:transition.to,progress,at:transition.at,duration:transition.duration};
 }else camera=viewAt(phase?.id??'arrival',t);
 return {...camera,helixShot:'continuous',helixBeatPose:phase?.id??'arrival',helixTransition:motion,focus:{id:null,weight:0,zoom:1}};
}
