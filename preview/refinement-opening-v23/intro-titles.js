import * as THREE from 'three';
import {Cloud,glyphAtlas} from '../reexplore-v6-chat-opening/graphics.js';
import {wordShape,shape} from '../reexplore-v6-chat-opening/shapes.js';
import {FONTS} from '../reexplore-v6-chat-opening/typography.js';
import {PARTICLE_TITLE as T,CREDITS,baseCameraAt as cameraAt,cameraAt as movingCameraAt,travel,ramp,random} from './score.js';
import {ROLE_NOTES,ANNOTATION_FONT,ANNOTATION_TEXT} from './annotations.js';

// A local subset covers the credit name and all Chinese glosses. Shared font
// assets and the accepted v14 render remain untouched.
export async function loadCreditFont(){
 const face=new FontFace('Noto Sans SC Credits',`url("${new URL('./credit-name.ttf',import.meta.url).href}")`,{weight:'600'});
 document.fonts.add(await face.load());
 await document.fonts.load('600 52px "Noto Sans SC Credits"',ANNOTATION_TEXT);
}

function viewCamera(t,forCredit=false){
 const view=(forCredit?movingCameraAt:cameraAt)(t),c=new THREE.PerspectiveCamera(view.fov,16/9,.1,900);
 c.position.set(...view.position);c.lookAt(...view.target);c.updateMatrixWorld();return c;
}
function localBounds(points){
 const bounds=new THREE.Box3();for(let i=0;i<points.length;i+=3)bounds.expandByPoint(new THREE.Vector3(points[i],points[i+1],points[i+2]));return bounds;
}
function projectedBounds(bounds,object,camera){
 object.updateMatrixWorld();const pts=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y]){
  const p=new THREE.Vector3(x,y,0).applyMatrix4(object.matrixWorld).project(camera);pts.push([(p.x+1)*960,(1-p.y)*540]);
 }
 return [Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
}

// One fixed world pose on the route. Position and orientation never follow
// the live camera. Perspective, rather than a screen-scale tween, gives passage.
export function createParticleTitle(scene,camera){
 const title=wordShape(T.text,T.count,T.width),bounds=localBounds(title.positions);
 const cloud=new Cloud(scene,T.count,glyphAtlas(),321),passCamera=viewCamera(T.pass);
 cloud.points.position.copy(passCamera.position);cloud.points.quaternion.copy(passCamera.quaternion);
 cloud.material.uniforms.pixelRatio.value=1.5;cloud.material.depthTest=true;cloud.points.renderOrder=18;
 cloud.material.uniforms.beaconDistance={value:25};
 cloud.material.vertexShader=cloud.material.vertexShader.replace('uniform float progress,','uniform float beaconDistance;\nuniform float progress,')
  .replace('float highlight=','born *= smoothstep(.10,.16,length(p.xy));\n  float highlight=')
  .replace('energy=born*core*core/', 'tint += vec3(.55,.001,.004)*exp(-beaconDistance*beaconDistance/5.)*exp(-dot(p.xy,p.xy)/.45)*gain;\n  energy=born*min(core*core,pow(size*focal/z,2.))/');
 cloud.shapes(title);
 const anchor=passCamera.position.clone(),normal=new THREE.Vector3(0,0,1).applyQuaternion(passCamera.quaternion);
 const passDistance=travel(T.pass).distance;
 let a=21,b=T.pass;for(let i=0;i<60;i++){const m=(a+b)/2;if(travel(m).distance+25<passDistance)a=m;else b=m;}
 const beaconPassTime=(a+b)/2;
 function frame(t,beacon){
  const depth=-anchor.clone().applyMatrix4(camera.matrixWorldInverse).z;
  const entrance=ramp(t,T.start,T.start+T.fadeIn);
  const gain=depth>.08?.42*entrance*(1-ramp(t,T.pass,T.end)):0;
  const beaconDistance=beacon.clone().sub(anchor).dot(normal),cameraDistance=camera.position.clone().sub(anchor).dot(normal);
  cloud.material.uniforms.beaconDistance.value=beaconDistance;
  cloud.set({gain,progress:0,time:t,spread:0,drift:0,glyphMode:0,size:.018,aperture:.0012,focus:Math.max(.1,depth),reveal:1.04},camera,1620);
  const screenBounds=depth>.2?projectedBounds(bounds,cloud.points,camera):null;
  const readable=gain>.4&&depth>0&&screenBounds&&screenBounds[0]>35&&screenBounds[2]<1885&&screenBounds[1]>20&&screenBounds[3]<1060;
  return {text:T.text,visible:gain>.001,pointCount:T.count,start:T.start,formed:T.formed,fadeIn:T.fadeIn,entrance,pass:T.pass,end:T.end,readable:!!readable,source:'reexplore-v6-chat-opening/wordShape + Cloud',gain,worldWidth:T.width,prebuilt:true,
   spatial:true,fixedWorldPose:true,worldPosition:anchor.toArray(),worldQuaternion:cloud.points.quaternion.toArray(),bounds:screenBounds,
   beaconPassTime,beaconPlaneDistance:beaconDistance,cameraPlaneDistance:cameraDistance,beaconCenterDistance:beacon.distanceTo(anchor),cameraCenterDistance:camera.position.distanceTo(anchor)};
 }
 return {frame};
}

function creditShape(spec,count,width){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=780;const g=canvas.getContext('2d');
 // Extend the canvas upward; original name baselines keep the same world pose.
 if(spec.role){g.fillStyle='#b6a0d5';g.font=`500 64px ${FONTS.mono}`;g.fillText(spec.role,64,134);
 g.fillStyle='#a99abb';g.font=`600 52px ${ANNOTATION_FONT}`;g.fillText(ROLE_NOTES[spec.roleId??spec.id]??'',64,206);}
 g.fillStyle='#f0e8fc';g.font=`600 ${spec.nameSize}px ${spec.font==='cjk'?'"Noto Sans SC Credits"':FONTS.sans}`;
 spec.names.forEach((name,i)=>g.fillText(name,58,430+i*195));
 const data=g.getImageData(0,0,2048,780).data,pool=[],rnd=random(8241);
 for(let x=0;x<2048;x+=2)for(let y=0;y<780;y+=2){const k=(y*2048+x)*4;if(data[k+3]>120)pool.push([x,y,k]);}
 const minX=Math.min(...pool.map(p=>p[0])),maxX=Math.max(...pool.map(p=>p[0])),minY=Math.min(...pool.map(p=>p[1])),maxY=Math.max(...pool.map(p=>p[1]));
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,span=Math.max(1,maxX-minX);
 if(spec.fontPixels)width*=span*spec.fontPixels/spec.nameSize/spec.inkWidth;
 return shape(count,i=>{
  const [x,y,k]=pool[Math.min(pool.length-1,Math.floor(i/count*pool.length))];
  return [[(x-cx+rnd()-.5)*width/span,(cy-y+rnd()-.5)*width/span,(rnd()-.5)*.018],
   [0,1,2].map(j=>Math.pow(data[k+j]/255,2.2)*1.3)];
 });
}

// Stationary particle objects beside the camera route, with real foreground
// occlusion. There are no 2D labels or rectangular backing cards.
export function createSpatialCredits(scene,camera){
 const atlas=glyphAtlas();
 const records=CREDITS.map(spec=>{
  const mid=spec.reference??(spec.start+spec.end)/2,reference=viewCamera(mid,true),distance=spec.distance;
  const focal=1080/(2*Math.tan(reference.fov*Math.PI/360)),width=spec.inkWidth*distance/focal;
  const count=spec.fontPixels?spec.names.join('').replace(/\s/g,'').length*1800:32768;
  const ink=creditShape(spec,count,width),cloud=new Cloud(scene,count,atlas,560);
  cloud.shapes(ink);cloud.material.uniforms.pixelRatio.value=1.5;cloud.points.renderOrder=17;
  const anchor=spec.anchor;
  const origin=new THREE.Vector3((anchor[0]-960)*distance/focal,(540-anchor[1])*distance/focal,-distance).applyQuaternion(reference.quaternion).add(reference.position);
  cloud.points.position.copy(origin);cloud.points.quaternion.copy(reference.quaternion);
  return {spec,cloud,origin,count,bounds:localBounds(ink.positions)};
 });
 function frame(t){
  const active=[];
  for(const {spec,cloud,origin,count,bounds} of records){
   const enter=ramp(t,spec.start,spec.readAt??spec.start+.22),leave=ramp(t,spec.end-(spec.fadeOut??.28),spec.end),alpha=enter*(1-leave);
   const depth=-origin.clone().applyMatrix4(camera.matrixWorldInverse).z;
   cloud.set({gain:.42*alpha,reveal:1.04*enter,size:.014,aperture:0,focus:Math.max(.1,depth),time:t,progress:0,drift:0,glyphMode:0},camera,1620);
   if(t<=spec.start||t>=spec.end)continue;
   active.push({id:spec.id,role:spec.role,annotation:ROLE_NOTES[spec.roleId??spec.id]??'',names:spec.names,alpha,readable:enter>.99&&leave<.01,bounds:projectedBounds(bounds,cloud.points,camera),spatial:true,particleCount:count,fixedWorldPose:true,worldPosition:origin.toArray(),worldQuaternion:cloud.points.quaternion.toArray()});
  }
  return active;
 }
 return {frame};
}
