import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createErrorWindows} from '../refinement-execution-v17/error-windows.js';
import {createForcedLock} from './forced-lock.js';
import {createEntryBridge} from './entry-flow.js';
import {flightPosition,archiveHandoff,motionState} from '../refinement-execution-v17/core-continuity.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const COLD=[.56,.58,.72],RED=[1,.025,.105],WHITE=[1.6,1.35,1.45];
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const V=arr=>new THREE.Vector3(...arr);
function rect(out,x,y,z,w,h,k=0){
 const a=[x-w/2,y-h/2,z],b=[x+w/2,y-h/2,z],c=[x+w/2,y+h/2,z],d=[x-w/2,y+h/2,z];
 for(const [p,q] of [[a,b],[b,c],[c,d],[d,a]])out.push({p,q,k});
}
function box(out,x,y,z,w,h,d,k){
 rect(out,x,y,z-d/2,w,h,k);rect(out,x,y,z+d/2,w,h,k);
 for(const a of [-1,1])for(const b of [-1,1])out.push({p:[x+a*w/2,y+b*h/2,z-d/2],q:[x+a*w/2,y+b*h/2,z+d/2],k});
}
const colourGLSL=`
 float written=1.-smoothstep(progress-.018,progress+.018,key);
 float wave=exp(-pow((key-scan)*34.,2.));
 vec3 colour=mix(cold*.55,hot*.88,written)+vec3(1.45,1.13,1.2)*wave*.57;
 colour*=gain;
`;
export function createWorld(){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#020204');
 const perspective=new THREE.PerspectiveCamera(43,1920/1080,.08,220),orthographic=new THREE.OrthographicCamera(-18,18,10.125,-10.125,.08,220);
 let camera=perspective;
 const composer=new EffectComposer(renderer),pass=new RenderPass(scene,camera);
 composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;
 composer.addPass(pass);const bloom=new UnrealBloomPass(new THREE.Vector2(1920,1080),.34,.42,.65);composer.addPass(bloom);composer.addPass(new OutputPass());
 const materials=[],groups={},allClouds=[];
 function group(name){const g=new THREE.Group();g.name=name;scene.add(g);groups[name]=g;return g;}
 function uniforms(gain=1){return {cold:{value:new THREE.Vector3(...COLD)},hot:{value:new THREE.Vector3(...RED)},progress:{value:0},scan:{value:-1},gain:{value:gain}};}
 function lines(parent,segments,gain=1,width=1){
  if(width>1){
   const geo=new THREE.InstancedBufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,-1,0,1,1,0,0,1,0],3));
   geo.setAttribute('lineStart',new THREE.InstancedBufferAttribute(new Float32Array(segments.flatMap(s=>s.p)),3));geo.setAttribute('lineEnd',new THREE.InstancedBufferAttribute(new Float32Array(segments.flatMap(s=>s.q)),3));geo.setAttribute('key',new THREE.InstancedBufferAttribute(new Float32Array(segments.map(s=>s.k??0)),1));geo.instanceCount=segments.length;
   const u=uniforms(gain);u.width={value:width};
   const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:u,
    vertexShader:`attribute vec3 lineStart,lineEnd;attribute float key;uniform vec3 cold,hot;uniform float progress,scan,gain,width;varying vec3 vColour;varying float depth;varying float edge;void main(){${colourGLSL}vColour=colour;vec4 a=modelViewMatrix*vec4(lineStart,1.),b=modelViewMatrix*vec4(lineEnd,1.);vec4 A=projectionMatrix*a,B=projectionMatrix*b;vec2 d=(B.xy/B.w-A.xy/A.w)*vec2(1920.,1080.);vec2 n=normalize(vec2(-d.y,d.x)+vec2(.00001));vec4 p=mix(A,B,position.x);p.xy+=n*width*position.y/vec2(1920.,1080.)*p.w;gl_Position=p;depth=-mix(a.z,b.z,position.x);edge=position.y;}`,
    fragmentShader:`varying vec3 vColour;varying float depth,edge;void main(){float a=1.-smoothstep(.6,1.,abs(edge));gl_FragColor=vec4(vColour*exp(-max(0.,depth-65.)*.018),a*.84);}`});
   const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;parent.add(mesh);materials.push({mat,parent,kind:'wide-line',baseWidth:width});return mesh;
  }
  const p=[],ks=[];for(const s of segments){p.push(...s.p,...s.q);ks.push(s.k??0,s.k??0);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('key',new THREE.Float32BufferAttribute(ks,1));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:uniforms(gain),
   vertexShader:`attribute float key;uniform vec3 cold,hot;uniform float progress,scan,gain;varying vec3 vColour;varying float depth;
   void main(){${colourGLSL}vColour=colour;vec4 mv=modelViewMatrix*vec4(position,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`varying vec3 vColour;varying float depth;void main(){float fog=exp(-max(0.,depth-65.)*.018);gl_FragColor=vec4(vColour*fog,.82);}`});
  const mesh=new THREE.LineSegments(geo,mat);mesh.frustumCulled=false;parent.add(mesh);materials.push({mat,parent,kind:'line'});return mesh;
 }
 function points(parent,items,{size=55,gain=1,cold=COLD,hot=RED}={}){
  const p=[],ks=[],sizes=[];items.forEach((s,i)=>{p.push(...s.p);ks.push(s.k??0);sizes.push(s.size??(.8+hash(i+13)*.3));});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('key',new THREE.Float32BufferAttribute(ks,1));geo.setAttribute('radius',new THREE.Float32BufferAttribute(sizes,1));
  const u=uniforms(gain);u.size={value:size};u.cold.value.set(...cold);u.hot.value.set(...hot);
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:u,
   vertexShader:`attribute float key,radius;uniform vec3 cold,hot;uniform float progress,scan,gain,size;varying vec3 vColour;varying float depth;
   void main(){${colourGLSL}vColour=colour;vec4 mv=modelViewMatrix*vec4(position,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*radius/max(.5,depth),.7,8.);}`,
   fragmentShader:`varying vec3 vColour;varying float depth;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float a=exp(-r*r*19.)*(1.-smoothstep(.38,.5,r));gl_FragColor=vec4(vColour*exp(-max(0.,depth-65.)*.018),a);}`});
  const cloud=new THREE.Points(geo,mat);cloud.frustumCulled=false;parent.add(cloud);materials.push({mat,parent,kind:'points'});allClouds.push(cloud);return cloud;
 }
 function edgePoints(segments,n=12){const ps=[];for(const s of segments)for(let i=0;i<=n;i++){const t=i/n;ps.push({p:s.p.map((v,j)=>mix(v,s.q[j],t)),k:s.k});}return ps;}
 function dataPlane(parent,w,h,z,key,seed=0,gain=1){
  const ps=[],dense=parent.userData.dense,rows=dense?60:36,cols=dense?174:116;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const block=Math.floor(col/7),on=hash(seed+row*51+block*17)>.23&&col%7<2+Math.floor(hash(seed+row*131+block)*5);
   if(on)ps.push({p:[(col/(cols-1)-.5)*w,(.5-row/(rows-1))*h,z],k:key+.012*(col/(cols-1)-.5),size:row%6===0?1.3:.82});
  }
  points(parent,ps,{size:dense?82:74,gain:gain*1.6});
 }

 // The boundary blocks early attacks; the counting sequence opens its layers.
 const lock=group('lock'),lockEdges=[],lockDots=[];
 for(let layer=0;layer<3;layer++){
  const z=-layer*3.2;rect(lockEdges,0,0,z,27,16,layer/3);rect(lockEdges,0,0,z+.025,24.5,13.5,layer/3);
  for(let y=-7;y<=7;y+=.14)for(let x=-13;x<=13;x+=.14)lockDots.push({p:[x,y,z],k:(x+7)/14,size:(Math.round(y*5)%5===0?1:.72)});
  for(let lane=0;lane<6;lane++){
   const yy=(lane-2.5)*2.05;lockEdges.push({p:[-12.2,yy,z],q:[12.2,yy,z],k:lane/6});
   rect(lockEdges,-12.4,yy,z+.1,.5,1.2,lane/6);rect(lockEdges,12.4,yy,z+.1,.5,1.2,lane/6);
  }
 }
 lines(lock,lockEdges,1.4,3.2);points(lock,lockDots,{size:43,gain:.82});points(lock,edgePoints(lockEdges,120),{size:62,gain:1.15});

 // Six rigid state slices, with discrete rows instead of moving ribbons.
 const archive=group('archive'),archiveSlices=[];
 for(let i=0;i<6;i++){
  const slice=new THREE.Group();slice.userData.dense=true;archive.add(slice);archiveSlices.push(slice);const archiveEdges=[];
  const z=-i*1.9,x=(i-2.5)*.16;rect(archiveEdges,x,0,z,20,11,i/6);rect(archiveEdges,x,0,z+.03,19.3,10.3,i/6);
  for(let row=0;row<5;row++)archiveEdges.push({p:[x-9.65,-3.6+row*1.8,z],q:[x-8.9,-3.6+row*1.8,z],k:i/6});
  dataPlane(slice,18.2,9.5,z+.035,i/6,79+i*103,1.0);
  lines(slice,archiveEdges,1.15,2.2);points(slice,edgePoints(archiveEdges,90),{size:61,gain:1.20});
 }

 function buildLattice(parent,nx,ny,nz,spacing=2){
  const seg=[],nodes=[],data=[],nodeDust=[];
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
   const px=(x-(nx-1)/2)*spacing,py=(y-(ny-1)/2)*spacing*.82,pz=(z-(nz-1)/2)*spacing;
   const k=(z*nx*ny+y*nx+x)/(nx*ny*nz-1);box(seg,px,py,pz,1.18,1.02,1.18,k);nodes.push({p:[px,py,pz],k,size:1.65});
   for(let r=0;r<3;r++)for(let c=0;c<6;c++)if(hash(x+31*y+47*z+11*r+c*13)>.31)data.push({p:[px-.44+c*.17,py-.3+r*.29,pz+.601],k,size:.8});
   for(let j=0;j<38;j++){const yy=1-2*(j+.5)/38,rr=Math.sqrt(1-yy*yy),a=j*2.39996323;nodeDust.push({p:[px+Math.cos(a)*rr*.18,py+yy*.18,pz+Math.sin(a)*rr*.18],k,size:.8});}
  }
  lines(parent,seg,.76);points(parent,nodes,{size:95,gain:1.3});points(parent,data,{size:48,gain:1.4});points(parent,nodeDust,{size:35,gain:1.6});
  const outline=[];box(outline,0,0,0,nx*spacing+.5,ny*spacing*.82+.6,nz*spacing+.5,.5);lines(parent,outline,1.65,2.8);points(parent,edgePoints(outline,70),{size:60,gain:1.5});
  return {modules:nx*ny*nz,dimensions:[nx*spacing,ny*spacing*.82,nz*spacing]};
 }
 const lattice=group('lattice'),latticeInfo=buildLattice(lattice,8,6,10);
 const receiver=group('receiver');buildLattice(receiver,6,6,5,1.85);

 // Five queued routes terminate before the same sealed plane.
 const queue=group('queue'),queueLines=[],queueDots=[],queueHeads=[];
 for(let i=0;i<5;i++){
  const y=(i-2)*2.2;rect(queueLines,-1.1,y,0,18,1.25,i/5);
  queueLines.push({p:[-10,y,0],q:[7.5,y,0],k:i/5});rect(queueLines,8.3,y,0,.32,1.9,i/5);
  for(let j=0;j<230;j++){const x=-10+j/229*17.5;queueDots.push({p:[x,y,0],k:j/229});}
  for(let j=0;j<70;j++)queueHeads.push({p:[7.45-hash(j+i*177)*.72,y+(hash(j+222)-.5)*.24,.035],k:i/5});
 }
 lines(queue,queueLines,1.2,2.0);points(queue,queueDots,{size:64,gain:1.55});points(queue,queueHeads,{size:72,gain:2});
 const closed=[];rect(closed,8.3,0,0,1.1,12,.5);lines(queue,closed,2.1,3.5);

 // A long orthogonal transfer volume with six channels and two fixed ends.
 const bridge=group('bridge'),bridgeLines=[],bridgeData=[];
 for(let i=0;i<12;i++){
  const z=6-i*4.6;rect(bridgeLines,0,0,z,16,10,i/12);rect(bridgeLines,0,0,z+.02,15.4,9.4,i/12);
  for(let x=-7;x<=7;x+=2)for(let y of [-4.8,4.8])bridgeData.push({p:[x,y,z],k:i/12,size:1.7});
 }
 for(let lane=0;lane<6;lane++){
  const x=(lane-2.5)*2.2;bridgeLines.push({p:[x,-2.1,6],q:[x,-2.1,-45],k:lane/6});bridgeLines.push({p:[x,2.1,6],q:[x,2.1,-45],k:lane/6});
  for(let j=0;j<380;j++)for(const y of [-2.1,2.1])bridgeData.push({p:[x,y,6-j/379*51],k:j/379});
 }
 lines(bridge,bridgeLines,1);points(bridge,bridgeData,{size:65,gain:1.5});
 for(const z of [6,-45])dataPlane(bridge,14.8,8.9,z,.5,z===6?180:181,.75);
 const packetData=[];for(let lane=0;lane<6;lane++)for(let j=0;j<130;j++)packetData.push({p:[(lane-2.5)*2.2+(hash(j+lane*2)-.5)*.22,(hash(j+88)-.5)*.36,hash(j+129)*2],k:lane/6});
 const packets=points(bridge,packetData,{size:72,gain:2.6,hot:WHITE});

 // Split rigid frames open layer by layer. No stretching or rubber deformation.
 const count=group('count'),countLayers=[];
 for(let i=0;i<6;i++){
  const z=-i*3.3,parts=[];
  for(const side of [-1,1]){
   const part=new THREE.Group();count.add(part);const edges=[],dust=[];
   for(const [w,h,zz] of [[23,13,z],[22.3,12.3,z-.04]]){
    edges.push({p:[0,h/2,zz],q:[side*w/2,h/2,zz],k:i/6},{p:[side*w/2,h/2,zz],q:[side*w/2,-h/2,zz],k:i/6},{p:[side*w/2,-h/2,zz],q:[0,-h/2,zz],k:i/6});
   }
   for(let row=0;row<36;row++)for(let c=0;c<12;c++)if(hash(i*17+row*61+c*29)>.18) dust.push({p:[side*(9.1+c*.17),(.5-row/35)*11.5,z],k:i/6,size:1});
   lines(part,edges,1.6);points(part,dust,{size:52,gain:1.6});points(part,edgePoints(edges,90),{size:67,gain:1.6});parts.push({part,side});
  }
  countLayers.push(parts);
 }

 const errorWindows=createErrorWindows(),errors=group('errors');errors.add(errorWindows.group);group('denial');
 const forcedLock=createForcedLock();group('forced-lock').add(forcedLock.group);
 scene.add(forcedLock.transferCore);
 const entryBridge=createEntryBridge(scene,forcedLock);

 // Controlled floor lines provide scale without becoming a second subject.
 const floor=group('floor'),floorLines=[];
 for(let x=-30;x<=30;x+=4)floorLines.push({p:[x,-7,-48],q:[x,-7,30],k:2});
 for(let z=-48;z<=30;z+=4)floorLines.push({p:[-30,-7,z],q:[30,-7,z],k:2});
 lines(floor,floorLines,.16);

 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gg=glowCanvas.getContext('2d'),gr=gg.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.08,'rgba(255,255,255,.95)');gr.addColorStop(.22,'rgba(255,255,255,.3)');gr.addColorStop(.5,'rgba(255,255,255,.055)');gr.addColorStop(1,'rgba(255,255,255,0)');gg.fillStyle=gr;gg.fillRect(0,0,128,128);
 const glowTexture=new THREE.CanvasTexture(glowCanvas),core=new THREE.Group();scene.add(core);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#ff1644',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(1.35,1.35,1);core.add(halo);
 const centre=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#ffcfda',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));centre.scale.set(.31,.31,1);core.add(centre);
 const trailPositions=new Float32Array(120*3),trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));
 const trail=new THREE.Points(trailGeo,new THREE.PointsMaterial({color:'#ff2855',size:.033,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false}));trail.frustumCulled=false;scene.add(trail);

 // Discrete phosphor text is a spatial object, not a screen-wide overlay.
 const mask=document.createElement('canvas');mask.width=1400;mask.height=250;const mg=mask.getContext('2d',{willReadFrequently:true});mg.fillStyle='white';mg.font='400 190px Execution';mg.textAlign='center';mg.textBaseline='middle';mg.fillText('EXECUTION',700,128);
 const pixels=mg.getImageData(0,0,1400,250).data,wordItems=[];
 for(let y=0;y<250;y+=6)for(let x=0;x<1400;x+=6)if(pixels[(y*1400+x)*4+3]>150)wordItems.push({p:[(x-700)/1400*28,(125-y)/250*5,0],k:0,size:1});
 const words=group('words'),wordLayers=[];
 for(let i=0;i<6;i++){const layer=new THREE.Group();words.add(layer);const obj=points(layer,wordItems,{size:160,gain:2.1,hot:i===0?[1.4,1.15,1.28]:RED});wordLayers.push({layer,obj});}

 const configs={
 S01:{p:[-3,1,28],look:[0,0,-2],move:[.25,0,-.8]},S02:{p:[-12,-2.4,12],look:[-3,-1.2,0],move:[4,.3,-2]},
 S03:{p:[1.2,1.4,28],look:[0,0,0],move:[-.2,-.1,-1.4]},S04:{p:[9.6,3.3,13.7],look:[3.2,.5,.1],move:[-1.1,-.3,-1.8]},
 S05:{p:[.6,.5,27],look:[0,0,0],move:[0,0,-.4]},S06:{p:[.6,.4,18],look:[0,0,-18],move:[-.6,-.4,-21]},S07:{p:[-5,2,13],look:[0,0,-1],move:[1.2,.15,-1.0]},
 S12:{p:[12,7,17],look:[0,0,-4],move:[-1.1,0,-1.1]},S13:{p:[-7,1,7.8],look:[-2,0,-2],move:[1.2,.1,-.6]},S14:{p:[12,-5,16],look:[0,0,-4],move:[-2,.7,-2.1]},
 S15:{p:[20,15,29],look:[0,0,0],move:[-.8,-.25,-.8]},S16:{p:[-10,3,15],look:[1,0,-4],move:[.45,0,-1.2]},S17:{p:[0,0,38],look:[0,0,0],ortho:true},
 S18:{p:[5,5,24],look:[0,0,0],move:[-.5,-.1,-.6]},S19:{p:[0,0,30],look:[0,0,0],move:[.2,0,-.4]},S20:{p:[-15,10,15],look:[1,0,0],move:[.6,-.2,-.7]},S21:{p:[19,1,7],look:[0,0,-5],move:[-.7,0,-.4]},
 S26:{p:[22,17,33],look:[0,0,-1],move:[-.5,-.2,-.8]},S27:{p:[5,1.5,12],look:[3,0,3],move:[-.4,0,-.55]},S28:{p:[33,27,47],look:[0,0,0],move:[-.8,-.3,-.8]},S29:{p:[-1,1,32],look:[0,0,-2],move:[.3,0,-.4]},S30:{p:[-8,3,33],look:[0,0,-2],move:[.4,-.1,-.4]},
 S31:{p:[-4,1.7,35],look:[0,0,-2],move:[.6,0,-.5]},S32:{p:[6,4,33],look:[0,0,-2],move:[-.7,-.2,-.6]},S33:{p:[1.2,1,25],look:[1,.5,5],move:[.1,0,-.35]},S34:{p:[14,7,19],look:[0,0,0],move:[-.3,0,-.5]},S35:{p:[-4,3,34],look:[0,0,-2],move:[.3,0,-.4]},
 S36:{p:[8,5,23],look:[0,0,-17],move:[-.5,0,-.8]},S37:{p:[9,3,-4],look:[0,0,-22],move:[-.3,0,-1.3]},S38:{p:[1.1,0,6],look:[1.1,0,-42],move:[0,0,-7]},S39:{p:[2,1,30],look:[1,0,5],move:[-.2,0,-.5]},
 S40:{p:[20,8,34],look:[0,0,-3],move:[-.4,0,-.5]},S41:{p:[-1,1,34],look:[0,0,-2],move:[.2,0,-.9]},S46:{p:[0,0,19.5],look:[0,0,-8],move:[0,0,-2.1]}
 };
 function corePosition(sceneName,frame){
  const t=(frame-9190)/60;
  if(sceneName==='lock')return [mix(-7,7,clamp((frame-9190)/220)),-3.075,.05];
  if(sceneName==='archive'){const a=frame<9357?9302:frame<9412?9357:frame<9468?9412:frame<9633?9579:9676,b=a===9676?9683:a+56;return [mix(-8,8,clamp((frame-a)/(b-a))),0,.08];}
  if(sceneName==='queue')return [mix(-10,7.5,clamp((frame-9523)/34,0,.99)),-2.2,.1];
  if(sceneName==='bridge')return [1.1,0,6-clamp((frame-9745)/55)*49];
  if(sceneName==='receiver')return [0,0,0];
  if(sceneName==='count')return [0,-5.7,-12];
  const progress=frame<9600?clamp((frame-9468)/100,.22,.9):clamp((frame-9633)/50);
  return [-8.25,-4.1,mix(-9,9,progress)];
 }
 function wordState(frame,shot){
  const age=frame-shot.impactFrame;
  const available={S01:1,S05:1,S15:1,S18:1,S26:1,S31:2,S36:3,S41:6};
  const n=shot.scene==='errors'&&shot.id!=='S41'?0:available[shot.id]??0,hold=shot.id==='S41'?14:shot.id==='S36'?11:9;
  if(!n||age<0||age>=hold)return null;
  return {kind:'spatial-phosphor',rows:n,age,opacity:Math.min(1,(hold-age)/3),frame:shot.impactFrame,word:'EXECUTION',cameraSpace:false};
 }
 function configureCamera(cfg,u){
  camera=cfg.ortho?orthographic:perspective;
  const pos=cfg.p.map((v,i)=>v+(cfg.move?.[i]??0)*u);camera.position.set(...pos);camera.up.set(...(cfg.up??[0,1,0]));camera.lookAt(...cfg.look);
  if(!cfg.ortho){camera.fov=cfg.fov??43;camera.updateProjectionMatrix();}camera.updateMatrixWorld();pass.camera=camera;
 }
 const multi=document.createElement('canvas');multi.width=1920;multi.height=1080;const multiCtx=multi.getContext('2d',{alpha:false});
 let output=renderer.domElement;
 for(const m of materials)m.baseGain=m.mat.uniforms.gain.value;
 function render(frame,shot,plan,state){
  entryBridge.reset();
  const entry=frame<9246,u=clamp((frame-shot.cutFrame)/Math.max(1,shot.frames-1)),name=entry?'forced-lock':shot.scene;
  let cfg=entry?entryBridge.configuration(frame):(configs[shot.id]??configs.S01);
  if(name==='forced-lock'&&frame>=9303)cfg={...cfg,look:[0,0,flightPosition(frame)[2]]};
  const handoff=shot.id==='S07'?archiveHandoff(frame):null;
  forcedLock.transferCore.visible=!!handoff;
  entryBridge.group.visible=entry;
  scene.background.set(entry?'#030208':'#020204');
  perspective.near=entry?.06:.08;perspective.far=entry?400:220;
  const samples=entry?0:4;
  if(composer.renderTarget1.samples!==samples){composer.renderTarget1.dispose();composer.renderTarget2.dispose();composer.renderTarget1.samples=composer.renderTarget2.samples=samples;}
  for(const g of Object.values(groups))g.visible=false;groups[name].visible=true;
  const withErrors=['errors','denial','bridge'].includes(name);errors.visible=withErrors;
  if(name==='errors')lattice.visible=true;
  lattice.position.z=name==='errors'?-32:0;
  if(name==='denial')queue.visible=true;
  floor.visible=['lattice','bridge','receiver'].includes(name);core.visible=true;trail.visible=!['receiver','count'].includes(name);
  if(entry||['errors','denial','forced-lock'].includes(name)){core.visible=false;trail.visible=false;}
  let progress=.16,scan=-1;
  if(name==='lock'){progress=clamp((frame-9190)/220);scan=progress;}
  if(name==='archive'){progress=clamp((frame-9302)/320,.2,1);scan=clamp((frame-9412)/55);}
  if(name==='lattice'){progress=frame<9600?clamp((frame-9468)/100,.22,.9):clamp((frame-9633)/50);scan=frame<9689?progress:clamp((frame-9689)/49);}
  if(name==='queue'){progress=clamp((frame-9523)/18,.25,.94);scan=clamp((frame-9523)/34,0,.99);}
  if(name==='bridge'){progress=clamp((frame-9745)/55);scan=progress;packets.position.z=6-progress*51;}
  if(name==='receiver'){progress=frame>=9800?clamp((frame-9800)/8):.03;scan=frame>=9800?progress:-1;}
  if(name==='count'){progress=(state.disabledDefenses.length-.15)/6;scan=Math.max(0,plan.counts.findIndex(c=>c===state.count))/6;}
  if(name==='errors'){progress=1;scan=-1;}
  for(const m of materials){m.mat.uniforms.progress.value=progress;m.mat.uniforms.scan.value=scan;m.mat.uniforms.gain.value=m.baseGain;if(m.baseWidth)m.mat.uniforms.width.value=frame<9633?m.baseWidth:1;}
  const archiveOpen=clamp((frame-9413)/45),archiveSpread=3.2*(archiveOpen*archiveOpen*(3-2*archiveOpen));
  archiveSlices.forEach((slice,i)=>{slice.position.x=(i%2?1:-1)*archiveSpread*(.65+i*.07);slice.position.y=(i-2.5)*.18*archiveOpen;slice.rotation.z=(i%2?1:-1)*.025*archiveOpen;});
  const forceState=name==='forced-lock'?forcedLock.update(frame):null;
  countLayers.forEach((parts,i)=>{const a=clamp((frame-plan.counts[i].frame)/17),opened=a*a*(3-2*a);for(const {part,side} of parts){part.position.x=side*opened*5.7;part.position.z=-opened*.8;}});
  const errorState=withErrors?errorWindows.update(frame,name):null;
  const pos=handoff?handoff.position:corePosition(name,frame);core.position.set(...pos);
  if(handoff){core.visible=false;forcedLock.transferCore.position.set(...pos);forcedLock.transferCore.scale.setScalar(handoff.scale);}
  if(name==='receiver'){halo.material.color.set('#b2a9be');centre.material.color.set('#e1d6e8');halo.material.opacity=.35;centre.material.opacity=.45;}
  else{halo.material.color.set('#ff1644');centre.material.color.set('#ffcfda');halo.material.opacity=1;centre.material.opacity=1;}
  for(let i=0;i<120;i++){const back=i*.055,past=handoff?archiveHandoff(frame-back*4).position:corePosition(name,frame-back*4);trailPositions.set(past.map((v,j)=>v+(hash(i*7+j)-.5)*.04),i*3);}trailGeo.attributes.position.needsUpdate=true;
  configureCamera(cfg,u);bloom.strength=name==='count'?.19:.22;renderer.toneMappingExposure=name==='count'?1.18:1.42;
  const redCoreMotion=handoff?motionState(frame,pos,camera,handoff.scale):forceState&&frame>=9303?motionState(frame,forceState.redCore,camera,forceState.coreScale):null;
  const entryState=entry?entryBridge.update(frame,camera):null;
  if(entry){
   bloom.strength=.29;renderer.toneMappingExposure=1.4;
   lock.visible=false;groups['forced-lock'].visible=entryState.lockVisible;
   for(const m of materials)if(m.parent===lock)m.mat.uniforms.gain.value=m.baseGain*entryState.gateGain;
  }
  const typography=wordState(frame,shot);words.visible=!!typography;
  wordLayers.forEach(({layer,obj},i)=>{
   layer.visible=!!typography&&i<typography.rows;
   if(!layer.visible)return;
   const dense=typography.rows>=3,age=typography.age;
   layer.position.set(dense?(i%2?-.6:.6):0,dense?[0,3.1,-3.1,6.2,-6.2,9.3][i]:3.6-i*2.5,(dense?(name==='errors'?13:5)-i*1.4:4-i*2)-age*.08);
   layer.scale.setScalar(dense?1.12:.78);layer.rotation.set(0,dense?(i%2?-.045:.045):0,0);
   if(entry&&shot.id==='S01'){
    const anchor=V(entryState.corePosition),distance=camera.position.distanceTo(anchor),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    layer.position.copy(anchor).addScaledVector(up,distance*.20);layer.quaternion.copy(camera.quaternion);layer.scale.setScalar(.78*distance/28);
   }
   obj.material.uniforms.progress.value=1;obj.material.uniforms.scan.value=-1;obj.material.uniforms.gain.value=(i===0?.88:.85)*typography.opacity;
  });
  output=renderer.domElement;
  if(cfg.split){
   const views=[{p:[0,0,42],look:[0,0,0],ortho:true},{p:[42,0,0],look:[0,0,0],ortho:true},{p:[0,42,0],look:[0,0,0],up:[0,0,-1],ortho:true},{p:[25,20,36],look:[0,0,0]}];
   multiCtx.fillStyle='#030205';multiCtx.fillRect(0,0,1920,1080);
   for(let i=0;i<4;i++){configureCamera(views[i],0);composer.render();multiCtx.drawImage(renderer.domElement,i%2*960,Math.floor(i/2)*540,960,540);}
   multiCtx.strokeStyle='#4c3543';multiCtx.lineWidth=1;multiCtx.beginPath();multiCtx.moveTo(960,0);multiCtx.lineTo(960,1080);multiCtx.moveTo(0,540);multiCtx.lineTo(1920,540);multiCtx.stroke();output=multi;
  }else composer.render();
  return {set:name,position:camera.position.toArray(),target:cfg.look,progress,scan,corePosition:entryState?entryState.corePosition:forceState?forceState.redCore:pos,entryTransition:entryState,...(redCoreMotion?{redCoreMotion}:{}),typography,modules:name==='lattice'?latticeInfo.modules:null,
   rigidGeometry:true,closedSourceBoundary:state.sourceBoundaryClosed,delivered:0,errorWindows:errorState,forcedUnlock:forceState,archiveSpread:name==='archive'?archiveSpread:null,disabledDefenses:state.disabledDefenses,continuousCount:name==='count',fourViews:!!cfg.split,finite:camera.position.toArray().every(Number.isFinite)};
 }
 return {render,get canvas(){return output;},get camera(){return camera;},renderer,scene};
}
