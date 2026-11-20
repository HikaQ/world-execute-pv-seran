import {GEO} from './heart-shards.js';
import {qRot} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
import {SOURCE_POSE} from './start-pose.js';

export const ASSEMBLY={start:11143,joined:11305,end:11342,scale:6.2};
const clamp=x=>Math.max(0,Math.min(1,x)),smoother=x=>x*x*x*(x*(x*6-15)+10);
export const progressAt=frame=>smoother(clamp((frame-ASSEMBLY.start)/(ASSEMBLY.joined-ASSEMBLY.start)));
const sub=(a,b)=>a.map((x,k)=>x-b[k]);

// Only the dispersed pose is sampled. The subsequent motion is newly authored;
// the reference's slip clock, sample-and-hold vibration and ballistic replay are
// never evaluated while these fragments converge.
const dispersed=SOURCE_POSE.cells;
const relative=GEO.cent.map((c,i)=>[c[0]-GEO.seeds[i][0],c[1]-GEO.seeds[i][1],0]);
const offsets=dispersed.map((s,i)=>sub(qRot(s.q,relative[i]),relative[i]).map((x,k)=>x+s.t[k]));
export const START=dispersed.map((s,i)=>{
 const norm=Math.hypot(...s.q),sign=s.q[3]<0?-1:1,q=s.q.map(v=>v*sign/norm);
 // Retain the actual falling pose, including the original downward displacement.
 // No recentering, anisotropic scaling or sideways redistribution is applied.
 return {offset:offsets[i],q,source:s,angle:2*Math.acos(Math.min(1,Math.max(-1,q[3])))};
});
function rotateHome(start,u){
 if(u>=1)return [0,0,0,1];if(u<=0)return [...start.source.q];
 const theta=start.angle/2;if(theta<1e-8)return [0,0,0,1];
 const w=Math.sin((1-u)*theta)/Math.sin(theta);
 return [...start.q.slice(0,3).map(v=>v*w),Math.cos((1-u)*theta)];
}
export function assemblyAt(frame){
 const u=progressAt(frame),remaining=1-u;
 const cells=START.map((start,i)=>{
  const q=rotateHome(start,u),offset=start.offset.map(v=>v*remaining),rot=qRot(q,relative[i]);
  // Compensate rotation about the seed, so the actual polygon centroid follows
  // a straight path to its own final position, rather than orbiting that seed.
  const t=u===1?[0,0,0]:u===0?[...start.source.t]:offset.map((v,k)=>v+relative[i][k]-rot[k]);
  const s=start.source,peelRecovery=smoother(clamp(u*2));
  return {t,q,bright:s.bright+(.88-s.bright)*u,heat:s.heat+(.22-s.heat)*u,burst:s.burst*(1-peelRecovery),scale:1,seam:s.seam+(.055-s.seam)*u,
   centroid:[GEO.cent[i][0]+offset[0],GEO.cent[i][1]+offset[1],offset[2]],remainingDistance:Math.hypot(...offset),remainingAngle:start.angle*remaining};
 });
 return {frame,progress:u,stage:u===1?'assembled':'rising-and-converging',assembled:u===1,cells,sourcePoseFrame:SOURCE_POSE.sourceFrame,originalLayoutPreserved:true,recordedMotionPlayback:false,oscillation:false,overshoot:false};
}
