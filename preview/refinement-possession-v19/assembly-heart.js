import {createAssemblyScene} from './assembly-scene.js';
import {ASSEMBLY} from './assembly-motion.js';

// Fit the approved spatial path into the unchanged 40-frame reference shot.
// Complete the same path in 18 frame intervals, then hold without recoil.
export const HEART_ASSEMBLY_CUT={start:11143,end:11183,joined:11161,
 sourceStart:ASSEMBLY.start,sourceEnd:ASSEMBLY.joined,
 speed:(ASSEMBLY.joined-ASSEMBLY.start)/18,holdFrames:22};
export function assemblySourceAt(frame){
 const u=Math.max(0,Math.min(1,(frame-HEART_ASSEMBLY_CUT.start)/(HEART_ASSEMBLY_CUT.joined-HEART_ASSEMBLY_CUT.start)));
 return ASSEMBLY.start+u*(ASSEMBLY.joined-ASSEMBLY.start);
}
export function createAssemblyHeart(){
 const scene=createAssemblyScene();let last={};
 return {draw(ctx){
  const sourceFrame=assemblySourceAt(ctx.t*60),poseFrame=Math.min(sourceFrame,ASSEMBLY.joined);
  scene.draw({...ctx,t:poseFrame/60});
  const view=scene.last;
  last={...view,programBounds:[],programStates:[],abyssBounds:[],worldScale:[1,1,1],blackHold:false,
   fracture:null,reverseHeart:null,
   assembly:{...view.assembly,playback:{...HEART_ASSEMBLY_CUT,sourceFrame,poseFrame,
    sourceVersion:'refinement-heart-assembly-v2',originalReferenceCutPreserved:true,accelerated:true}}};
 },get last(){return last;}};
}
