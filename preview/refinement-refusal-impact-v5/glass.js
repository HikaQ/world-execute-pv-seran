import * as THREE from 'three';
import {createEyes,EYE_SOURCE} from '../refinement-refusal-recall-v1/eyes.js';

// The mirror silhouette is fixed. A radial fracture partitions it into closed
// faces; each face reflects the portrait from its own stable viewing angle.
const W=1920,H=1080,clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const ORIGIN=[215+(EYE_SOURCE.centers.left[0]-330)*1490/600,276+(EYE_SOURCE.centers.left[1]-615)*1490/600];
const angles=[-174,-149,-122,-87,-58,-31,-7,19,49,79,114,151].map(x=>x*Math.PI/180);
const radius=p=>Math.hypot(p[0]-ORIGIN[0],p[1]-ORIGIN[1]);
const polar=(r,a)=>[ORIGIN[0]+Math.cos(a)*r,ORIGIN[1]+Math.sin(a)*r];
function boundary(a){
 const dx=Math.cos(a),dy=Math.sin(a),tx=dx>0?(W-ORIGIN[0])/dx:-ORIGIN[0]/dx,ty=dy>0?(H-ORIGIN[1])/dy:-ORIGIN[1]/dy;
 const p=polar(Math.min(tx,ty),a);return[p[0]<.0001?0:p[0]>W-.0001?W:p[0],p[1]<.0001?0:p[1]>H-.0001?H:p[1]];
}
function perimeter(p){return p[1]===0?p[0]:p[0]===W?W+p[1]:p[1]===H?W+H+W-p[0]:2*W+H+H-p[1];}
function cornersBetween(a,b){
 const length=2*(W+H),start=perimeter(a);let end=perimeter(b);if(end<start)end+=length;
 const corners=[[0,[0,0]],[W,[W,0]],[W+H,[W,H]],[2*W+H,[0,H]]],out=[];
 for(const [s,p] of corners)for(const k of [0,1])if(s+k*length>start+.001&&s+k*length<end-.001)out.push([s+k*length,p]);
 return out.sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
}
const rays=angles.map((a,i)=>{
 const e=boundary(a+(hash(i+92)-.5)*.055),max=radius(e);
 const r1=58+hash(i*47+91)*89,r2=Math.min(max*.72,244+hash(i*89+88)*225);
 return [ORIGIN,polar(r1,a+(hash(i+81)-.5)*.06),polar(r2,a+(hash(i+17)-.5)*.09),e];
});
const facets=[],paths=[];
function facet(poly,ring,sector){
 const id=facets.length,c=[poly.reduce((n,p)=>n+p[0],0)/poly.length,poly.reduce((n,p)=>n+p[1],0)/poly.length];
 const strength=[.50,.88,1][ring],yaw=(sector%2?1:-1)*(6+hash(id+302)*10)*Math.PI/180,pitch=(id%3===0?-1:1)*(3+hash(id+93)*9)*Math.PI/180;
 facets.push({id,poly,ring,sector,center:c,activation:ring===0?0:Math.min(...poly.map(radius)),
  yaw,pitch,roll:(hash(id+922)-.5)*.072,dx:Math.sin(2*yaw)*128*strength,dy:Math.sin(2*pitch)*108*strength,
  sx:1+(hash(id+23)-.5)*.070,sy:1+(hash(id+77)-.5)*.058,shear:Math.sin(yaw)*.15,light:hash(id+204)});
}
for(let i=0;i<rays.length;i++){
 const a=rays[i],b=rays[(i+1)%rays.length];
 facet([ORIGIN,a[1],b[1]],0,i);
 facet([a[1],a[2],b[2],b[1]],1,i);
 facet([a[2],a[3],...cornersBetween(a[3],b[3]),b[3],b[2]],2,i);
 paths.push({p:a,seed:100+i,width:.95+hash(i+11)*.3,type:'radial'});
 for(const k of [1,2])paths.push({p:[a[k],b[k]],seed:400+i*2+k,width:k===1?.66:.74,type:'joining'});
}
function polygonArea(p){return Math.abs(p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a[0]*b[1]-b[0]*a[1];},0)/2);}
const coverage=facets.reduce((n,f)=>n+polygonArea(f.poly),0);
if(Math.abs(coverage-W*H)>.01)throw Error('Mirror faces must partition the entire fixed pane');
function trace(g,p,dx=0,dy=0){g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0]+dx,q[1]+dy):g.moveTo(q[0]+dx,q[1]+dy));}
function visiblePath(path,front){
 const p=path.p;
 if(path.type==='joining'){
  const start=Math.max(radius(p[0]),radius(p[1]))+20,u=smooth((front-start)/90);
  return u>0?[p[0],[p[0][0]+(p[1][0]-p[0][0])*u,p[0][1]+(p[1][1]-p[0][1])*u]]:[];
 }
 if(front<=0)return[];const out=[p[0]];
 for(let i=1;i<p.length;i++){
  const a=p[i-1],b=p[i],da=radius(a),db=radius(b);
  if(front>=db){out.push(b);continue;}
  const u=clamp((front-da)/(db-da));out.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]);break;
 }
 return out;
}
export async function createGlassPortrait(){
 const original=document.createElement('canvas');original.width=W;original.height=H;
 const painter=await createEyes(original.getContext('2d',{alpha:false}));painter.render({correction:1});
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const g=canvas.getContext('2d',{alpha:false});
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const group=new THREE.Group(),pane=new THREE.Mesh(new THREE.PlaneGeometry(18,10.125),new THREE.MeshBasicMaterial({map:texture,color:new THREE.Color(1.8,1.8,1.8),side:THREE.DoubleSide}));group.add(pane);
 function update(frame){
  const front=210*(1-Math.exp(-Math.max(0,frame)/5))+470*smooth((frame-20)/5)+950*smooth((frame-27)/7);
  g.globalAlpha=1;g.drawImage(original,0,0);let activeFaces=0,maxReflectionOffset=0;
  const faceStates=[];
  for(const f of facets){
   const gain=smooth((front-f.activation-8)/110)*smooth(frame/7);if(gain<=0)continue;activeFaces++;
   const dx=f.dx*gain,dy=f.dy*gain;maxReflectionOffset=Math.max(maxReflectionOffset,Math.hypot(dx,dy));
   // Only the reflected image moves. The polygon and its silhouette are fixed.
   g.save();trace(g,f.poly);g.closePath();g.clip();g.fillStyle='#090c11';g.fillRect(0,0,W,H);
   g.translate(f.center[0]+dx,f.center[1]+dy);g.rotate(f.roll*gain);
   g.transform(1+(f.sx-1)*gain,Math.sin(f.pitch)*.055*gain,f.shear*gain,1+(f.sy-1)*gain,0,0);
   g.translate(-f.center[0],-f.center[1]);g.drawImage(original,0,0);g.restore();
   // Different normals catch different light, like separate polished mirrors.
   g.save();trace(g,f.poly);g.closePath();g.clip();
   const light=g.createLinearGradient(f.center[0]-300,f.center[1]-240,f.center[0]+300,f.center[1]+240);
   light.addColorStop(0,`rgba(192,208,232,${(.018+f.light*.060)*gain})`);
   light.addColorStop(.48,'rgba(180,199,224,0)');light.addColorStop(1,`rgba(0,2,9,${(.040+(1-f.light)*.145)*gain})`);
   g.fillStyle=light;g.fillRect(0,0,W,H);g.restore();
   faceStates.push({id:f.id,yaw:f.yaw*gain,pitch:f.pitch*gain,reflectionOffset:[dx,dy],geometryDisplacement:0});
  }
  let visibleSegments=0;g.lineCap='butt';g.lineJoin='miter';
  for(const path of paths){
   const p=visiblePath(path,front);if(p.length<2)continue;visibleSegments+=p.length-1;
   trace(g,p);g.strokeStyle='rgba(0,1,5,.97)';g.lineWidth=3.55*path.width;g.stroke();
   trace(g,p,1.05,-.62);g.strokeStyle=`rgba(222,230,244,${.72+hash(path.seed)*.24})`;g.lineWidth=1.02*path.width;g.stroke();
   trace(g,p,-1.0,.64);g.strokeStyle='rgba(118,127,155,.46)';g.lineWidth=.70*path.width;g.stroke();
  }
  texture.needsUpdate=true;
  return {material:'fractured mirror',crackOriginTexture:ORIGIN,crackOriginEye:'viewer-left-violet-pupil',front,visibleSegments,paneCount:1,mirrorFaces:facets.length,activeFaces,coverageArea:coverage,
   detachedFragments:0,fallingFragments:0,maxReflectionOffset,faceStates,pose:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}};
 }
 update(0);return {group,update,canvas,paths,facets,original};
}
