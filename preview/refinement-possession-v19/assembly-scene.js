import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {qRot} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
import {GEO,Shards} from './heart-shards.js';
import {ASSEMBLY,assemblyAt} from './assembly-motion.js';
import {SOURCE_POSE} from './start-pose.js';

function polygonsAt(cells){return GEO.cells.map((poly,i)=>{
 const st=cells[i],seed=GEO.seeds[i];return poly.map(([x,y])=>{
  const v=qRot(st.q,[x-seed[0],y-seed[1],0]);return new Vector3(v[0]+seed[0]+st.t[0],v[1]+seed[1]+st.t[1],v[2]+st.t[2]).multiplyScalar(ASSEMBLY.scale);
 });
});}
export function createAssemblyScene(){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,500),lines=new GlowLines(12000),shards=new Shards();
 scene.add(lines.mesh,shards.points);shards.points.scale.setScalar(ASSEMBLY.scale);let last={};
 const finalPosition=[0,-.15,25],finalTarget=[0,-.15,0],startCamera=SOURCE_POSE.camera;
 function draw(ctx){
  const motion=assemblyAt(ctx.t*60),u=motion.progress;
  const position=startCamera.position.map((v,k)=>v+(finalPosition[k]-v)*u),target=startCamera.target.map((v,k)=>v+(finalTarget[k]-v)*u);
  camera.position.set(...position);camera.lookAt(...target);camera.updateMatrixWorld();shards.points.updateMatrixWorld();
  Object.assign(ctx.post,{bloom:1.2,threshold:.82,ca:.018,vignette:.26,grain:.012,exposure:1.05,tint:[1.02,.98,1],zoom:1});
  lines.begin();shards.cells(i=>motion.cells[i]).set({t:SOURCE_POSE.sourceFrame/60,size:.014,bright:.62,focus:camera.position.length(),aperture:.004,maxBlur:12,colA:[.52,.025,.05],colB:[1,.025,.075],ember:[1,.2,.22],ash:[.09,.025,.04]},camera,ctx.H);
  const polygons=polygonsAt(motion.cells);
  polygons.forEach((poly,i)=>{const st=motion.cells[i],pts=poly.map(p=>p.toArray());lines.polyline([...pts,pts[0]],{color:[st.seam,.025*st.seam,.075*st.seam],width:1.3-.6*u});});
  lines.end(ctx);ctx.draw(scene,camera);
  const projected=polygons.flat().map(p=>{const v=p.clone().project(camera);return [(v.x+1)*960,(1-v.y)*540];});
  const bounds={minX:Math.min(...projected.map(p=>p[0])),maxX:Math.max(...projected.map(p=>p[0])),minY:Math.min(...projected.map(p=>p[1])),maxY:Math.max(...projected.map(p=>p[1]))};
  const projectedCenters=motion.cells.map(c=>{const p=new Vector3(...c.centroid).multiplyScalar(ASSEMBLY.scale).project(camera);return [(p.x+1)*960,(1-p.y)*540,p.z];});
  last={camera:{set:'heart-assembly',position:camera.position.toArray(),target,fov:38,startsFromOriginalFractureCamera:true},particleCount:147456,geometry:'original falling-fragment positions, smooth upward assembly',assembly:{...motion,shardBounds:bounds,projectedCenters,visibleCenters:projectedCenters.filter(p=>p[0]>=0&&p[0]<=1920&&p[1]>=0&&p[1]<=1080).length}};
 }
 return {draw,get last(){return last;}};
}
