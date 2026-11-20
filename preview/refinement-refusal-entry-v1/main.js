import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {core} from '../refinement-memory-v2-study/red-core.js';
import {createTakeover} from '../refinement-execution-v10/takeover.js';

// Original records are not this collapsing presentation structure. Nothing in
// this study writes to the narrative data or runs the execution/transfer state.
const FIRST=7861,END=8304,W=1920,H=1080;
const plan=await fetch('./edit-plan.json').then(r=>r.json());
const out=document.querySelector('#film');out.width=W;out.height=H;
const ctx=out.getContext('2d',{alpha:false});
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color('#030208');
const camera=new THREE.PerspectiveCamera(43,W/H,.06,400);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.22,.48,.65);
composer.addPass(bloom);composer.addPass(new OutputPass());
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const groups={};
function group(name){const g=new THREE.Group();g.name=name;scene.add(g);groups[name]=g;return g;}
function lines(parent,positions,color='#bcb8d6',opacity=.5){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
 const o=new THREE.LineSegments(g,m);parent.add(o);return o;
}
function rectangle(parent,w,h,z=0,color='#bcb8d6',alpha=.55){
 const x=w/2,y=h/2;
 return lines(parent,[-x,-y,z,x,-y,z,x,-y,z,x,y,z,x,y,z,-x,y,z,-x,y,z,-x,-y,z],color,alpha);
}
const pointVertex=`attribute float strength;uniform float size;
 varying float vStrength;varying float vDepth;
 void main(){vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z;vStrength=strength;
 gl_PointSize=clamp(size*1100./max(.2,-p.z),.9,3.1);gl_Position=projectionMatrix*p;}`;
const pointFragment=`uniform vec3 tint;uniform float alpha,fog;varying float vStrength,vDepth;
 void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
 float feather=1.-smoothstep(.25,1.,r);float fade=exp(-fog*fog*vDepth*vDepth);
 gl_FragColor=vec4(tint,alpha*vStrength*feather*fade);}`;
function points(parent,positions,color='#b9b7d4',size=.025,alpha=.65,fog=.009){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('strength',new THREE.Float32BufferAttribute(Array.from({length:positions.length/3},(_,i)=>.45+.55*hash(i*17)),1));
 const m=new THREE.ShaderMaterial({vertexShader:pointVertex,fragmentShader:pointFragment,
  uniforms:{tint:{value:new THREE.Color(color)},size:{value:size},alpha:{value:alpha},fog:{value:fog}},
  transparent:true,depthWrite:false,blending:THREE.NormalBlending});
 const p=new THREE.Points(g,m);p.frustumCulled=false;parent.add(p);return p;
}

// A precision readout enclosure: planes are open outlines and sampled points.
// All pieces keep their dimensions. The fracture follows the existing joints.
const cage=group('readout'),panels=[];
function panel(w,h,pos,rot,index,face){
 const gr=new THREE.Group();cage.add(gr);gr.position.set(...pos);gr.rotation.set(...rot);
 rectangle(gr,w,h,0,index%11===0?'#eb7a99':'#b5b9d2',index%11===0?.85:.68);
 const data=[];const nx=Math.ceil(w/.055),ny=Math.ceil(h/.057);
 for(let iy=1;iy<ny;iy++)for(let ix=1;ix<nx;ix++){
  // Quiet row groups and repeated gaps give the points a data-like order.
  if(iy%9>5||hash(Math.floor(ix/5)*31+iy*79+index*101)<.28)continue;
  data.push(-w/2+ix*w/nx,-h/2+iy*h/ny,.006);
 }
 points(gr,data,index%11===0?'#e0c6dc':'#c1c3de',.026,.75,.012);
 const center=new THREE.Vector3(...pos),q=gr.quaternion.clone();
 panels.push({gr,center,q,index,face,seed:hash(index*73),w,h});
}
let pi=0;
// Three large reading planes, rather than a small regular cube. The unequal
// column widths are consistent across depth; damage reveals their alignment.
const panelCuts=[-12,-7.5,-3.6,0,3.6,7.5,12];
for(const z of [1.8,-.8,-3.4])for(let iy=0;iy<3;iy++)for(let ix=0;ix<6;ix++){
 const x0=panelCuts[ix],x1=panelCuts[ix+1];
 panel(x1-x0-.12,3.87,[(x0+x1)/2,(iy-1)*4,z],[0,0,0],pi++,z>0?'front':'back');
}

// The large indexing plane breaks tile by tile. A shared rigid transform is
// evaluated for edges and points, so sampled data stays attached to each tile.
const floor=group('support'),floorPositions=[],floorOrigins=[],floorSeeds=[],floorStrength=[],edgePositions=[],edgeOrigins=[],edgeSeeds=[];
function tileVertex(target,origins,seeds,p,origin,seed){target.push(...p);origins.push(...origin);seeds.push(...seed);}
for(let iz=0;iz<25;iz++)for(let ix=0;ix<17;ix++){
 const origin=[(ix-8)*3.9,-4.5,24-iz*4.5],seed=[hash(ix*39+iz*71),Math.abs(ix-8)*.048+Math.abs(iz-8)*.018,hash(ix*23+iz*53)];
 const x=1.875,z=2.175;
 const edges=[[-x,0,-z],[x,0,-z],[x,0,-z],[x,0,z],[x,0,z],[-x,0,z],[-x,0,z],[-x,0,-z]];
 for(const p of edges)tileVertex(edgePositions,edgeOrigins,edgeSeeds,p,origin,seed);
 for(let zi=0;zi<31;zi++)for(let xi=0;xi<27;xi++){
  if(zi%8===7||hash(Math.floor(xi/3)*19+zi*11+ix*7+iz*3)<.23)continue;
  tileVertex(floorPositions,floorOrigins,floorSeeds,[-1.79+xi*.137,0,-2.06+zi*.137],origin,seed);
  floorStrength.push(.5+hash(xi*7+zi*73+ix*31)*.5);
 }
}
const tileMotion=`attribute vec3 origin,seed;uniform float drive;
 vec3 movingTile(){float a=max(0.,drive-seed.y-seed.x*.09);
 float ang=a*(seed.x-.5)*.22;float c=cos(ang),s=sin(ang);
 vec3 p=vec3(position.x,position.y*c-position.z*s,position.y*s+position.z*c);
 p+=origin+vec3(sign(origin.x)*a*a*.95,-a*a*(18.+seed.z*10.),-a*a*.7);return p;}`;
function floorGeometry(p,o,s,strengths){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('origin',new THREE.Float32BufferAttribute(o,3));g.setAttribute('seed',new THREE.Float32BufferAttribute(s,3));if(strengths)g.setAttribute('strength',new THREE.Float32BufferAttribute(strengths,1));return g;}
const floorPointMat=new THREE.ShaderMaterial({uniforms:{drive:{value:0},size:{value:.034},tint:{value:new THREE.Color('#bcb4da')},alpha:{value:.76},fog:{value:.008}},
 vertexShader:tileMotion+pointVertex.replace('void main(){vec4 p=modelViewMatrix*vec4(position,1.);','void main(){vec4 p=modelViewMatrix*vec4(movingTile(),1.);'),fragmentShader:pointFragment,
 transparent:true,depthWrite:false});
const floorCloud=new THREE.Points(floorGeometry(floorPositions,floorOrigins,floorSeeds,floorStrength),floorPointMat);floorCloud.frustumCulled=false;floor.add(floorCloud);
const floorEdgeMat=new THREE.ShaderMaterial({uniforms:{drive:{value:0}},vertexShader:tileMotion+`varying float depth;void main(){vec4 p=modelViewMatrix*vec4(movingTile(),1.);depth=-p.z;gl_Position=projectionMatrix*p;}`,
 fragmentShader:`varying float depth;void main(){gl_FragColor=vec4(.47,.47,.64,.42*exp(-.012*.012*depth*depth));}`,transparent:true,depthWrite:false});
const floorEdges=new THREE.LineSegments(floorGeometry(edgePositions,edgeOrigins,edgeSeeds),floorEdgeMat);floorEdges.frustumCulled=false;floor.add(floorEdges);

// A protected stack of thirteen source layers. These never disintegrate.
const archive=group('archive');
for(let n=0;n<13;n++){
 const gr=new THREE.Group();archive.add(gr);gr.position.set((n-6)*.045,(n-6)*.30,0);gr.rotation.x=-Math.PI/2;
 rectangle(gr,10.8,6.7,0,n===6?'#db6488':'#b7afcf',n===6?.85:.46);
 const pp=[];for(let row=0;row<44;row++)for(let col=0;col<99;col++){
  if(row%7===6||hash(Math.floor(col/4)*47+row*7+n*29)<.39)continue;
  pp.push(-5.2+col*.106,-3.16+row*.145,.003);
 }
 points(gr,pp,n===6?'#d96a91':'#c0b4d5',.022,.55,.014);
}

// Five queued packets terminate before five closed ends. No outgoing light.
const outbox=group('outbox'),packets=[];
for(let n=0;n<5;n++){
 const gr=new THREE.Group();outbox.add(gr);gr.position.set(-1.1,(n-2)*1.65,0);
 rectangle(gr,12,1.25,0,'#aeb1d1',.62);
 lines(gr,[6,-.625,0,6,.625,0,6,-.625,-.65,6,.625,-.65,6,-.625,-.65,6,-.625,0,6,.625,-.65,6,.625,0],'#d5cbe5',.82);
 const channel=[];for(let row=0;row<12;row++)for(let col=0;col<142;col++)if(hash(Math.floor(col/4)*19+row*73+n*31)>.32)channel.push(-5.8+col*.082,-.47+row*.085,-.08);
 points(gr,channel,'#a9a2c2',.022,.27,.008);
 const packet=new THREE.Group();gr.add(packet);
 const pp=[];for(let i=0;i<3300;i++){const h=hash(i*73+n*29),y=hash(i*37+n*41)-.5,z=hash(i*31+n*11)-.5;pp.push(-1.9+h*2.2,y*.78,z*.22);}
 points(packet,pp,'#ff8eb2',.032,.96,.006);
 const outline=rectangle(packet,2.25,.84,.12,'#ef789d',.72);outline.position.x=-.8;
 packets.push(packet);
}

// Use the established particle boundary and kernel for a compatible handoff.
// Placeholders have no geometry; only the boundary's point cloud is visible.
const boundary=group('boundary');
function placeholder(parent,pos=[0,0,0]){const o=new THREE.Object3D();o.position.set(...pos);parent.add(o);return o;}
const offstage=new THREE.Group();
const takeover=createTakeover({boundary,planet:placeholder(boundary,[17,5,-7]),halo:placeholder(boundary),outerWall:placeholder(offstage),outerHalo:placeholder(offstage),bridgeLeft:placeholder(offstage),bridgeRight:placeholder(offstage)});
const boundaryCloud=boundary.children.find(o=>o.name==='assembled-boundary-particles');
const boundaryMat=boundaryCloud.material;
boundaryMat.uniforms.warmth={value:0};boundaryMat.uniforms.visibilityGain={value:1};
boundaryMat.vertexShader='uniform float warmth,visibilityGain;\n'+boundaryMat.vertexShader.replace('tint=red*energy*domainGain*(.52+ownership*.48);','tint=mix(vec3(.23,.18,.36),red,warmth)*energy*domainGain*(.52+ownership*.48)*visibilityGain;');
for(const c of boundary.children)if(c.isPoints&&c!==boundaryCloud)c.visible=false;
const kernelGroup=group('kernel'),redCore=core(kernelGroup);
redCore.glow.name='emissive-particle-bloom';
function setCore(position,r,t,gain){
 redCore.points.position.set(...position);redCore.points.quaternion.copy(camera.quaternion);redCore.points.scale.setScalar(r/1.85);
 Object.assign(redCore.mat.uniforms.modelScale,{value:r/1.85});
 redCore.mat.uniforms.time.value=t;redCore.mat.uniforms.ignite.value=1;redCore.mat.uniforms.gain.value=gain;redCore.mat.uniforms.pixelRatio.value=1;
 redCore.glow.position.set(...position);redCore.glow.quaternion.copy(camera.quaternion);redCore.glow.scale.setScalar(r/1.85);redCore.glowMat.uniforms.gain.value=gain;
}

// Two parallel closed sampling planes. Their outlines never open or deform.
const gate=group('gate');
for(const x of [2.5,3.35]){
 const layer=new THREE.Group();gate.add(layer);layer.position.x=x;layer.rotation.y=Math.PI/2;
 rectangle(layer,7.2,8.4,0,'#beb0db',x===2.5?.85:.36);
 const field=[];for(let y=0;y<150;y++)for(let z=0;z<125;z++){
  if(hash(y*37+z*71+(x>3?1000:0))<.18)continue;
  field.push(-3.55+z*.057, -4.16+y*.056,0);
 }
 points(layer,field,'#c7b6e0',.023,x===2.5?.73:.35,.010);
}
for(const x of [-10,-7.5,-5,-2.5,0]){
 const hoop=new THREE.Group();gate.add(hoop);hoop.position.x=x;hoop.rotation.y=Math.PI/2;
 rectangle(hoop,.85,.85,0,'#8c8aab',.32);
}
lines(gate,[-10.5,-.42,-.42,2.5,-.42,-.42,-10.5,.42,.42,2.5,.42,.42],'#9b95b7',.24);
function packet(parent){
 const gr=new THREE.Group();parent.add(gr);const pp=[];
 for(let i=0;i<9000;i++){
  const a=hash(i*71),r=Math.sqrt(hash(i*43))*.18,t=hash(i*23)*Math.PI*2;
  pp.push((a-.5)*1.30,r*Math.cos(t),r*Math.sin(t));
 }
 points(gr,pp,'#ff557d',.026,.92,.006);return gr;
}
const gatePacket=packet(gate);
const stopFlash=[];for(let y=0;y<36;y++)for(let z=0;z<36;z++)if(hash(y*19+z*37)>.24)stopFlash.push(2.493,(y-17.5)*.035,(z-17.5)*.035);
const contact=points(gate,stopFlash,'#ff7294',.027,0,.006);
const boundaryPulse=group('boundary-pulse'),localPacket=packet(boundaryPulse);
const scanPoints=[];
for(let n=0;n<240;n++)for(let x=0;x<3;x++)scanPoints.push((x-1)*.025,-3.2+n*6.4/239,.035);
const archiveScanner=points(archive.children[6],scanPoints,'#f4a6bb',.031,.90,.008);

// Same core identity as the previous section, initially at its screen location.
const entryCamera=new THREE.PerspectiveCamera(43,W/H,.06,400);entryCamera.position.set(-9,1,26);entryCamera.lookAt(2,0,-4);entryCamera.updateProjectionMatrix();entryCamera.updateMatrixWorld();
const ray=new THREE.Vector3(-.40,1-.862*2,.5).unproject(entryCamera).sub(entryCamera.position).normalize();
const initialCore=entryCamera.position.clone().addScaledVector(ray,(3-entryCamera.position.z)/ray.z);
const boundaryStop=new THREE.Vector3(-2.4,-3.8,6),direction=boundaryStop.clone().sub(initialCore).normalize();
localPacket.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),direction);

function renderAtFrame(request){
 const frame=Math.max(FIRST,Math.min(END-1,Math.round(request))),shot=plan.shots.findLast(s=>frame>=s.cutFrame),cfg=shot.camera;
 const p=(frame-shot.cutFrame)/shot.frames,t=(frame-FIRST)/60;
 for(const g of Object.values(groups))g.visible=false;
 for(const name of shot.sets)groups[name].visible=true;
 const pos=cfg.position.map((v,i)=>v+cfg.travel[i]*p);
 camera.position.set(...pos);camera.up.set(0,1,0);camera.fov=cfg.fov;camera.lookAt(...cfg.target);camera.rotation.z+=cfg.roll;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 takeover.update(t-6.5,0);boundaryMat.uniforms.warmth.value=0;boundaryMat.uniforms.visibilityGain.value=1.0;
 const corePos=shot.id==='S04'?[0,0,0]:initialCore.toArray();
 setCore(corePos,shot.id==='S04'?.45:.32,t,shot.id==='S04'?.75:.90);
 localPacket.position.copy(initialCore).lerp(boundaryStop,clamp((frame-7867)/44));
 localPacket.visible=frame>=7867;
 // Fixed-length pulses stop 0.25 units before the closed plane. The second
 // attempt retracts along the same local route, with no remote response.
 let packetX;
 if(frame<8027)packetX=1.60;
 else if(frame<8060)packetX=mix(-9.5,1.60,smooth((frame-8027)/33));
 else if(frame<8083)packetX=1.60;
 else packetX=mix(1.60,-9.5,smooth((frame-8083)/55));
 gatePacket.position.x=packetX;
 contact.material.uniforms.alpha.value=(frame<8027?.75:frame>=8056&&frame<8092?.75:0)*(.8+.2*Math.sin(t*7));
 for(let i=0;i<packets.length;i++){
  packets[i].position.x=4.52+.025*Math.sin(t*2+i);
  const cloud=packets[i].children.find(c=>c.isPoints);
  cloud.material.uniforms.alpha.value=i===0&&frame>=8083?.87+.12*Math.sin(t*7):.96;
 }
 // A restrained read sweep across an existing, intact source layer.
 const scan=smooth((frame-8194)/110);
 archiveScanner.position.x=mix(-5.1,5.1,scan);
 for(let n=0;n<archive.children.length;n++){
  const layer=archive.children[n],cloud=layer.children.find(c=>c.isPoints);
  cloud.material.uniforms.alpha.value=.47+(n===6?.21*scan:0);
 }
 bloom.strength=.20;renderer.toneMappingExposure=1.25;
 composer.render();ctx.drawImage(renderer.domElement,0,0);
 const vig=ctx.createRadialGradient(960,490,380,960,510,1170);vig.addColorStop(0,'rgba(1,0,5,0)');vig.addColorStop(1,'rgba(1,0,5,.48)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
 const screen=new THREE.Vector3(...corePos).project(camera);
 return {frame,shot:shot.id,name:shot.name,p,sets:shot.sets,camera:pos,core:{position:corePos,screen:[(screen.x+1)/2,(1-screen.y)/2]},packetX,packetRightEdge:packetX+.65,closedStopX:2.5,
  originalRecords:13,outboxCount:5,externalDelivered:0,replies:0,read:0,externalAdapter:false,scope:'local',executionStarted:false,escaped:false,sourceRecordsModified:false,shapeDeformation:false};
}
window.renderAtFrame=renderAtFrame;
window.structureAudit=()=>Object.entries(groups).filter(([name])=>['boundary','kernel','gate','outbox','archive','boundary-pulse'].includes(name)).map(([name,g])=>{let meshes=0,emissiveBillboards=0,lineObjects=0,clouds=0,particles=0;g.traverse(o=>{if(o.isMesh){if(o.name==='emissive-particle-bloom')emissiveBillboards++;else meshes++;}if(o.isLineSegments)lineObjects++;if(o.isPoints){clouds++;particles+=o.geometry.attributes.position.count;}});return {name,filledGeometryMeshes:meshes,emissiveBillboards,lineObjects,clouds,particles};});
window.editPlan=plan;window.filmReady=true;renderAtFrame(FIRST);

