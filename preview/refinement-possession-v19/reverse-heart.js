import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {qRot} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
import {GEO,Shards} from './heart-shards.js';
import {fractureAt} from './fracture-motion.js';
import {smooth,mix,ramp} from './score.js';
// Continue the original ballistic/peeling tail until all faces have dispersed.
// A monotone time curve then rewinds every phase without a late jump to rest.
export const REVERSE={start:11143,end:11183,keys:[[11143,10542],[11148,10530],[11158,10484],[11164,10465],[11176,10344],[11182,10344]]};
const keys=REVERSE.keys,intervals=keys.slice(1).map((k,i)=>k[0]-keys[i][0]),rates=keys.slice(1).map((k,i)=>(k[1]-keys[i][1])/intervals[i]);
const tangents=keys.map((k,i)=>{if(!i||i===keys.length-1||rates[i-1]*rates[i]<=0)return 0;const a=intervals[i-1],b=intervals[i],w1=2*b+a,w2=b+2*a;return (w1+w2)/(w1/rates[i-1]+w2/rates[i]);});
export function reverseSourceAt(f){const i=keys.findLastIndex(k=>f>=k[0]);if(i<0)return keys[0][1];if(i>=keys.length-1)return keys.at(-1)[1];const a=keys[i],b=keys[i+1],u=ramp(f,a[0],b[0]),h=b[0]-a[0];return (2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*h*tangents[i]+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*h*tangents[i+1];}
export function createReverseHeart(){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,500),lines=new GlowLines(12000),shards=new Shards();
 scene.add(lines.mesh,shards.points);shards.points.scale.setScalar(6.2);let last={};
 function draw(ctx){
  const f=ctx.t*60,sourceFrame=reverseSourceAt(f),motion=fractureAt(sourceFrame);
  const polygons=GEO.cells.map((poly,i)=>{const st=motion.cells[i],seed=GEO.seeds[i];return poly.map(([x,y])=>{const v=qRot(st.q,[x-seed[0],y-seed[1],0]);return new Vector3(v[0]+seed[0]+st.t[0],v[1]+seed[1]+st.t[1],v[2]+st.t[2]).multiplyScalar(6.2);});});
  const vertices=polygons.flat(),lo=[0,1,2].map(k=>Math.min(...vertices.map(p=>p.getComponent(k)))),hi=[0,1,2].map(k=>Math.max(...vertices.map(p=>p.getComponent(k))));
  const spread=smooth(sourceFrame,10465,10542),target=[0,mix(-.15,(lo[1]+hi[1])*.375,spread),0],margin=4*spread;
  const halfY=Math.max(hi[1]-target[1],target[1]-lo[1])+margin,halfX=Math.max(Math.abs(lo[0]),Math.abs(hi[0]))+margin;
  const distance=Math.max(25,hi[2]+margin+Math.max(halfY,halfX/(16/9))/(Math.tan(19*Math.PI/180)*.84));
  camera.position.set(0,target[1],distance);camera.lookAt(...target);camera.updateMatrixWorld();shards.points.updateMatrixWorld();
  Object.assign(ctx.post,{bloom:1.2,threshold:.82,ca:.018,vignette:.26,grain:.012,exposure:1.05,tint:[1.02,.98,1],zoom:1});
  lines.begin();shards.cells(i=>motion.cells[i]).set({t:sourceFrame/60,size:.014*distance/25,bright:.62*(1+1.2*spread),focus:distance,aperture:.004,maxBlur:12,colA:[.52,.025,.05],colB:[1,.025,.075],ember:[1,.2,.22],ash:[.09,.025,.04]},camera,ctx.H);
  polygons.forEach((poly,i)=>{const st=motion.cells[i],pts=poly.map(p=>p.toArray()),seam=st.seam*(1+.45*spread);lines.polyline([...pts,pts[0]],{color:[seam,.025*seam,.075*seam],width:sourceFrame<10354?.7:1.3});});
  lines.end(ctx);ctx.draw(scene,camera);
  const projected=vertices.map(p=>{const v=p.clone().project(camera);return [(v.x+1)*960,(1-v.y)*540];}),bounds={minX:Math.min(...projected.map(p=>p[0])),maxX:Math.max(...projected.map(p=>p[0])),minY:Math.min(...projected.map(p=>p[1])),maxY:Math.max(...projected.map(p=>p[1]))};
  last={camera:{set:'heart-reassembly/H02',position:camera.position.toArray(),target,fov:38,travel:0},programBounds:[],programStates:[],abyssBounds:[],worldScale:[1,1,1],blackHold:false,particleCount:147456,geometry:'complete reverse of heart shard fracture and particle peeling',fracture:null,reverseHeart:{sourceVersion:'refinement-possession-v13',sourceFrame,sourceRange:[10542,10344],continuedTailFrames:24,cells:motion.cells,assembled:sourceFrame<=10353,sourceClockReversed:true,continuousTimeRemap:true,shardBounds:bounds}};
 }
 return {draw,get last(){return last;}};
}
