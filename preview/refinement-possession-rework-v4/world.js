import {createCinema} from '../refinement-possession-v19/scenes.js';
import {createRuntimeScene} from './runtime-scene.js';
import {createMemoryScenes} from './memory-scenes.js';
import {addBackgroundCode,screen} from './scene-kit.js';
export const FIRST=10081,END=10770;
export function createWorld(code){
 const background=addBackgroundCode(code),runtime=createRuntimeScene(background),memory=createMemoryScenes(background),heart=createCinema();let last={};
 return {draw(ctx){
  const f=ctx.t*60;
  if(f<10299){runtime.draw(ctx);last=runtime.last;}
  else if(f<10519){
   let cameraState;
   heart.draw({...ctx,draw(scene,camera){
    background.draw(ctx,camera,'heart');ctx.draw(scene,camera);
    const core=[9,-3,1];cameraState={quaternion:camera.quaternion.toArray(),redCore:{worldPosition:core,screen:screen(camera,core)}};
   }});
   const old=heart.last;
   last={scene:'fractured-heart',camera:{...old.camera,...cameraState,originalCameraRestored:true,source:'refinement-possession-v19/scenes.js'},
    detail:{family:'fractured-heart',cells:old.fracture.cells,stage:old.fracture.stage,fragmentCount:36,cellTransformsPreserved:true,material:'original reference Shards'},transition:old.transition,particleCount:old.particleCount,fracture:old.fracture};
  }else{memory.draw(ctx);last=memory.last;}
 },get last(){return last;}};
}
