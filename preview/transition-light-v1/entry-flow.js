import * as THREE from 'three';
import {createTakeover} from '../refinement-execution-v10/takeover.js';
import {core as createParticleCore} from '../refinement-memory-v2-study/red-core.js';
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const hermite=(a,b,va,vb,u,dt)=>a.map((v,i)=>(2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*dt*va[i]+(-2*u**3+3*u*u)*b[i]+(u**3-u*u)*dt*vb[i]);
const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(-7.5,-3.5,3),new THREE.Vector3(-3,-7,7),new THREE.Vector3(3,-10,4),new THREE.Vector3(13,-10,0));
function oldPoint(f){const t=(f-9190)/60,p=curve.getPoint(.015);p.y+=Math.sin(t*8)*.12;p.z+=Math.sin(t*6)*.1;return p.toArray();}
const start=oldPoint(9162),velocity=start.map((v,i)=>v-oldPoint(9161)[i]);
export function entryPosition(f){return f<9192?hermite(start,[0,0,.5],velocity,[0,0,0],clamp((f-9162)/30),30):[0,0,.5];}
export function createEntryBridge(scene,lock){
 const group=new THREE.Group();group.name='single-lock-entry';scene.add(group);
 const boundary=new THREE.Group();group.add(boundary);const off=new THREE.Group();
 function empty(p,xyz=[0,0,0]){const o=new THREE.Object3D();o.position.set(...xyz);p.add(o);return o;}
 const takeover=createTakeover({boundary,planet:empty(boundary,[17,5,-7]),halo:empty(boundary),outerWall:empty(off),outerHalo:empty(off),bridgeLeft:empty(off),bridgeRight:empty(off)});
 const cloud=boundary.children.find(o=>o.name==='assembled-boundary-particles');
 cloud.material.uniforms.visibilityGain={value:1};cloud.material.vertexShader='uniform float visibilityGain;\n'+cloud.material.vertexShader.replace('tint=red*energy*domainGain*(.52+ownership*.48);','tint=red*energy*domainGain*(.52+ownership*.48)*visibilityGain;');
 for(const c of boundary.children)if(c.isPoints&&c!==cloud)c.visible=false;
 const kernel=createParticleCore(group),baseGains=lock.pointMaterials.map(m=>m.uniforms.gain.value),baseOpacities=lock.lineMaterials.map(m=>m.opacity);
 const trailPositions=new Float32Array(320*3),trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));
 const trail=new THREE.Points(trailGeo,new THREE.PointsMaterial({color:'#ec264d',size:.021,transparent:true,opacity:.40,depthWrite:false,blending:THREE.AdditiveBlending}));group.add(trail);trail.frustumCulled=false;
 function reset(){lock.pointMaterials.forEach((m,i)=>m.uniforms.gain.value=baseGains[i]);lock.lineMaterials.forEach((m,i)=>m.opacity=baseOpacities[i]);lock.core.material.opacity=1;}
 function configuration(f){
  if(f<9205){const u=smooth((f-9162)/42);return {p:[mix(-9,1.2,u),mix(1,1.4,u),mix(26,27.7,u)],look:[mix(2,0,u),0,mix(-4,0,u)],fov:43};}
  const u=(f-9205)/41;return {p:[9-.4*u,2.2-.1*u,26.1-.4*u],look:[0,0,.5],fov:43};
 }
 function update(f,camera){
  const leave=smooth((f-9162)/28),reveal=smooth((f-9174)/18),impact=f>=9191?Math.exp(-(f-9191)/5):0;
  takeover.update((f-9190)/60,0);boundary.visible=f<9190;
  boundary.position.set(16*leave,3*leave,-22*leave);cloud.material.uniforms.visibilityGain.value=(1-leave)**1.4;
  const p=new THREE.Vector3(...entryPosition(f)),shrink=smooth((f-9162)/30),radius=mix(.62,.20,shrink),particleAlpha=1-smooth((f-9190)/18);
  for(const o of [kernel.points,kernel.glow]){o.position.copy(p);o.quaternion.copy(camera.quaternion);o.scale.setScalar(radius/1.85);}
  kernel.mat.uniforms.modelScale.value=radius/1.85;kernel.mat.uniforms.time.value=f/60;kernel.mat.uniforms.ignite.value=1;kernel.mat.uniforms.gain.value=.88*particleAlpha;
  kernel.mat.uniforms.pixelRatio.value=1;kernel.glowMat.uniforms.gain.value=.88*particleAlpha;
  lock.pointMaterials.forEach((m,i)=>{m.uniforms.gain.value=baseGains[i]*reveal;m.uniforms.energy.value=Math.min(.7,.14+impact*.6);});
  lock.lineMaterials.forEach((m,i)=>m.opacity=baseOpacities[i]*reveal);
  lock.core.position.copy(p);const transfer=smooth((f-9174)/24);lock.core.material.opacity=transfer;
  const dist=camera.position.distanceTo(p),sizeMatch=f>=9205?mix(27.22/27.26,1,smooth((f-9205)/23)):1;
  lock.core.scale.setScalar((2.1+.55*impact)*sizeMatch);
  lock.jet.visible=f>=9226;lock.jet.material.uniforms.gain.value=1.15*smooth((f-9226)/20);
  trail.visible=f<9196;trail.material.opacity=.32*(1-smooth((f-9190)/6));
  for(let i=0;i<320;i++){const q=entryPosition(Math.max(9162,f-i*.045));trailPositions.set(q.map((v,j)=>v+Math.sin(i*17.3+j)*.016),i*3);}trailGeo.attributes.position.needsUpdate=true;
  const n=p.clone().project(camera),edge=p.clone().add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(radius)).project(camera);
  return {method:'single-lock-continuous-entry',corePosition:p.toArray(),coreScreen:[(n.x+1)*960,(1-n.y)*540],coreScreenRadius:Math.abs(edge.x-n.x)*960,lockVisible:reveal>0,lockReveal:reveal,boundaryRetreat:leave,gateGain:0,gateReveal:0,sourceBoundaryStillClosed:true,distance:dist,impact};
 }
 return {group,configuration,update,reset};
}
