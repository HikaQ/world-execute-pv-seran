import {createScene as createSharedScene} from './shared-world.js';
import {createInserts,INSERT_SHOTS} from './insert-scenes.js';
import {createCinema} from './scenes.js';
import {shotAt} from './score.js';
import {sceneForShot} from './scene-map.js';
import {createAssemblyHeart} from './assembly-heart.js';
export function createScene(){
 const shared=createSharedScene(),cinema=createCinema(),inserts=createInserts(),assembly=createAssemblyHeart();let last={};
 return {draw(ctx){
  const shot=shotAt(ctx.t*60),sceneId=sceneForShot(shot.id);
  const renderer=shot.id==='H02'?assembly:INSERT_SHOTS.has(shot.id)?inserts:['abyss','workshop','comparison'].includes(sceneId)?shared:cinema;
  renderer.draw(ctx);
  last={...renderer.last,referenceId:shot.referenceId,sceneId,subject:sceneId==='abyss'?'spatial source remnants':sceneId,stageChange:'subject and environment'};
 },get last(){return last;}};
}
