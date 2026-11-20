import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {blendPoses,poseOf} from '../../references/world-execute-web/src/engine/rig.js?v=39-joEtk';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {GlyphField,codeBlock} from '../../references/world-execute-web/src/lib/glyphs.js?v=DWbHICXG';
import {transitionAt,shotAt} from '../refinement-possession-v19/score.js';
export {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
export {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
export {Swarm};
export {Laminate,seeded,sheetShape} from '../refinement-possession-v19/quality-materials.js';
export const RED=[1,.045,.09],HOT=[1.6,.40,.46],DARK=[.42,.016,.035];
export const mul=(c,k)=>c.map(x=>x*k),mix=(a,b,t)=>a+(b-a)*t,clamp=x=>Math.max(0,Math.min(1,x));
export function cloud(scene,key,count,fn,Class=Swarm){const s=new Class({count}),a=s.shape('realign-v4-'+key,fn);scene.add(s.points);return {s,a};}
export function glyph(scene,key,text,layout,count=16384){const g=new GlyphField({count});g.text('realign-v4-'+key,text);const a=g.layout('realign-v4-'+key,codeBlock(g,layout));scene.add(g.points);return {g,a};}
export function screen(camera,p){const v=new Vector3(...p).project(camera);return [(v.x+1)*960,(1-v.y)*540];}
export function setCamera(camera,specs,f){
 const shot=shotAt(f),transition=transitionAt(f);
 function pose(s){const spec=specs[s.id],q=(f-s.filmFrame)/(s.endFrame-s.filmFrame),c=new PerspectiveCamera(spec.fov??38,16/9,.05,200000);
  c.position.set(...spec.p.map((v,i)=>v+(spec.drift??[.25,0,-.15])[i]*(q-.5)));c.lookAt(new Vector3(...spec.target));c.updateMatrixWorld();return poseOf(c,{look:spec.target});}
 let p=pose(shot),relay=null;
 if(transition?.to.join==='relay'&&specs[transition.from.id]&&specs[transition.to.id]){
  p=blendPoses(pose(transition.from),pose(transition.to),(1-Math.cos(transition.progress*Math.PI))/2);
  relay={from:transition.from.id,to:transition.to.id,startFrame:transition.to.filmFrame-transition.to.transitionFrames*.5,durationFrames:transition.to.transitionFrames,progress:transition.progress};
 }
 camera.position.fromArray(p.pos);camera.quaternion.fromArray(p.quat);camera.fov=p.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 return {position:p.pos,target:p.look,quaternion:p.quat,fov:p.fov,relay,subjectFocused:true,screenLockedToCore:false};
}
export function post(ctx){Object.assign(ctx.post,{bloom:1.08,threshold:.88,ca:.012,vignette:.28,grain:.012,exposure:1.08,tint:[1.025,.97,.985],zoom:1});}
export function addBackgroundCode(text){
 // The same point-glyph and lens blur implementation as the reference scene.
 const scene=new Scene(),floor=glyph(scene,'code-floor',text,{origin:[-20,14,0],cell:.28,cols:140,rows:130});
 const wall=glyph(scene,'code-wall',text,{origin:[-24,13,0],cell:.26,cols:150,rows:110});
 floor.g.points.rotation.x=-Math.PI/2;floor.g.points.position.set(0,-7.6,-8);
 wall.g.points.rotation.y=.22;wall.g.points.position.set(-8,0,-24);
 return {draw(ctx,camera,mode){
  const focus=camera.position.distanceTo(new Vector3(0,0,mode==='runtime'?-4:0));
  wall.g.points.visible=mode==='runtime';floor.g.points.visible=true;
  floor.g.set({a:floor.a,size:.24,bright:mode==='heart'?.07:.09,palette:DARK,t:ctx.t,focus,aperture:.019,maxBlur:23,noise:0},camera,ctx.H);
  wall.g.set({a:wall.a,size:.22,bright:.14,palette:DARK,t:ctx.t,scroll:[0,(ctx.t-10081/60)*.08,0],focus,aperture:.015,maxBlur:20,noise:0},camera,ctx.H);
  ctx.draw(scene,camera);
  return {worldSpace:true,depthSoftness:true,cameraAttached:false,material:'reference GlyphField'};
 }};
}
