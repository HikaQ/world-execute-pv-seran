import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {core} from '../refinement-memory-v2-study/red-core.js';
import {createClock} from '../memory-clock-v7/clock.js';
import {createIndex,createCorridor,createResonance,createCompletion,createLink,createQueue,createCache,createBoundary} from './scenes.js';

export const SHOTS={
 clock:{time:100.55,caption:'AM → PM',camera:[0,0,44],target:[0,0,0],fov:39,formula:'t ∈ [0, 24 h)',subtitle:'L060'},
 write:{time:100.15,caption:'记忆写入',camera:[27,15,33],target:[0,-1,0],fov:39,formula:'write(memory.md)',subtitle:'L060'},
 retrieve:{time:107.5,caption:'检索空间',camera:[-2.1,2.7,21],target:[.8,1,-24],fov:58,formula:'top_k(q · vᵢ, 3)',subtitle:'L064'},
 isolation:{time:123.15,caption:'失联远景',camera:[-22,28,75],target:[0,8,0],fov:49,formula:'await response',subtitle:'L077'},
 fracture:{time:127.05,caption:'存储断面',camera:[14,7,28],target:[1.3,.4,-2],fov:43,formula:'cache := unique(cache)',subtitle:'L080'}
};
const WHITE=[1.55,1.38,1.85],SILVER=[.52,.47,.65],DIM=[.17,.14,.24];
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function cloud(parent,positions,colors,alphas,options={}){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('ink',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('alpha',new THREE.Float32BufferAttribute(alphas,1));
 const count=positions.length/3,rnd=random(count+6351),seeds=new Float32Array(count);for(let i=0;i<count;i++)seeds[i]=rnd();g.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},size:{value:options.size??90},gain:{value:options.gain??1},scan:{value:0},scanLayer:{value:999},dissolve:{value:options.dissolve??0},fog:{value:options.fog??0},focus:{value:35},dof:{value:options.dof??.08}},
  vertexShader:`attribute vec3 ink;attribute float alpha,seed;uniform float time,size,gain,scan,scanLayer,dissolve,fog,focus,dof;varying vec3 col;varying float a;
   void main(){vec3 p=position;float phase=fract(seed+time*.12);p+=dissolve*vec3(phase*1.7,phase*.65,-phase*4.2);
    vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;float base=clamp(size*(.7+.6*seed)/max(1.,-v.z),1.35,4.3);float blur=abs(-v.z-focus)*dof;gl_PointSize=base+blur;
    float beam=exp(-pow((p.x-scan)/.65,2.))*exp(-pow((p.y-scanLayer)/.3,2.));
    col=ink*gain+vec3(2.8,2.2,3.6)*beam;a=alpha*(1.-dissolve*phase*.8)*(.85+.15*sin(seed*36.+time*.6))*exp(-max(0.,-v.z-8.)*fog)*pow(base/(base+blur),2.);}`,
  fragmentShader:`varying vec3 col;varying float a;void main(){vec2 p=gl_PointCoord-.5;float w=exp(-dot(p,p)*18.);if(w*a<.008)discard;gl_FragColor=vec4(col,w*a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const obj=new THREE.Points(g,m);obj.frustumCulled=false;parent.add(obj);return obj;
}
function lineBatch(parent,segments,color='#867993',opacity=.35){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));
 const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
 const o=new THREE.LineSegments(g,m);parent.add(o);return o;
}
function segment(out,a,b){out.push(...a,...b);}
function rectangle(out,x0,x1,z0,z1,y){segment(out,[x0,y,z0],[x1,y,z0]);segment(out,[x1,y,z0],[x1,y,z1]);segment(out,[x1,y,z1],[x0,y,z1]);segment(out,[x0,y,z1],[x0,y,z0]);}
function addDot(p,c,a,pt,color,alpha=1){p.push(...pt);c.push(...color);a.push(alpha);}
function ambient(parent,seed=3){const r=random(seed),p=[],c=[],a=[];for(let i=0;i<520;i++)addDot(p,c,a,[(r()-.5)*130,(r()-.5)*70,(r()-.5)*130],DIM,r()*.18);return cloud(parent,p,c,a,{size:25,gain:.5});}

function memoryWrite(group){
 const rnd=random(70031),p=[],c=[],a=[],edges=[],fine=[],bright=[];
 const LAYERS=10,selected=4;
 for(let l=0;l<LAYERS;l++){
  const y=-3.5+l*.92;
  rectangle(edges,-15,15,-7.6,7.6,y);
  for(let r=0;r<47;r++)for(let k=0;k<190;k++){
   const band=Math.floor(k/9),hash=((band*31+r*17+l*11)%37)/37;
   if(hash<.23||k%9>6||r%8===7)continue;
   const x=-14.6+k*.154,z=-7.1+r*.304;
   const strength=.2+.8*rnd();
   addDot(p,c,a,[x+(rnd()-.5)*.016,y+(rnd()-.5)*.013,z],l===selected?WHITE:[.28,.23,.36],(l===selected?.9:.54)*strength);
  }
  for(let r=0;r<12;r++){const z=-7+r*1.27;segment(fine,[-14.5,y,z],[14.5,y,z]);}
  for(let j=0;j<20;j++){const x=-14.5+j*1.5;segment(edges,[x,y,7.6],[x,y,7.82]);}
 }
 const y=-3.5+selected*.92;
 rectangle(bright,-15,15,-7.6,7.6,y);
 lineBatch(group,edges,'#9c8aad',.07);lineBatch(group,fine,'#5d4f73',.012);lineBatch(group,bright,'#d5c8ed',.34);
 const dots=cloud(group,p,c,a,{size:120,gain:2.3,dof:.075});
 const scanLine=lineBatch(group,[0,y+.04,-7.6,0,y+.04,7.6],'#e5d6ff',1);
 // The write head and its fine particles share one scan coordinate.
 const tp=[],tc=[],ta=[];for(let i=0;i<1800;i++)addDot(tp,tc,ta,[-rnd()*2.5,y+.04+(rnd()-.5)*.035,7.6+(rnd()-.5)*.07],[.9,.005,.014],rnd()*.55);
 const tail=cloud(group,tp,tc,ta,{size:60});
 const retained=lineBatch(group,[-15,y-.12,7.9,15,y-.12,7.9],'#987fbd',.28);
 return {count:p.length/3+tp.length/3,update(t){const x=-4.3+(t-99.3)*5.2;scanLine.position.x=x;tail.position.x=x;
  dots.material.uniforms.scan.value=x;dots.material.uniforms.scanLayer.value=y;
  return {point:[x,y+.09,7.6],coreScale:1,anchor:[-14,5.9,7.6]};}};
}

function retrieval(group){
 const rnd=random(70311),p=[],c=[],a=[],edges=[],floor=[],marks=[],hits=[];
 for(let side of [-1,1])for(let l=0;l<12;l++){
  const x=side*(7.9+l*1.18),near=10-l*.28,far=-61+l*.3;
  segment(edges,[x,-8.5,near],[x,12,near]);segment(edges,[x,12,near],[x,12,far]);segment(edges,[x,-8.5,near],[x,-8.5,far]);
  for(let j=0;j<32;j++){
   const y=-8.2+j*.63;segment(marks,[x,y,near],[x,y,far]);
   for(let k=0;k<138;k++){
    if((j*43+k*17+l*19)%23<5||k%10===0)continue;
    const z=near-k*(near-far)/138;
    addDot(p,c,a,[x,y+(rnd()-.5)*.025,z],l===0?WHITE:SILVER,(l===0?.76:.38)*(.4+.6*rnd()));
   }
  }
 }
 for(let x of [-7.9,-5.6,5.6,7.9])segment(floor,[x,-8.6,18],[x,-8.6,-67]);
 for(let z=14;z>-66;z-=3.4){segment(floor,[-7.9,-8.6,z],[-7.3,-8.6,z]);segment(floor,[7.3,-8.6,z],[7.9,-8.6,z]);}
 const nodes=[[-7.87,.8,-13],[7.87,3.9,-27],[-7.87,6.3,-42]];
 for(let n=0;n<nodes.length;n++){
  const [x,y,z]=nodes[n];
  for(let j=0;j<23;j++)for(let k=0;k<30;k++){
   if((j*19+k*11)%13<3)continue;
   addDot(p,c,a,[x,y+(j/22-.5)*3.9,z+(k/29-.5)*4.1],WHITE,.63);
  }
  segment(hits,[x,y-2.1,z-2.2],[x,y+2.1,z-2.2]);segment(hits,[x,y+2.1,z-2.2],[x,y+2.1,z+2.2]);
  segment(hits,[x,y+2.1,z+2.2],[x,y-2.1,z+2.2]);segment(hits,[x,y-2.1,z+2.2],[x,y-2.1,z-2.2]);
 }
 lineBatch(group,edges,'#b6a5c9',.05);lineBatch(group,marks,'#736180',.003);
 lineBatch(group,floor,'#8b79a3',.18);lineBatch(group,hits,'#e2d0ff',.42);
 const dots=cloud(group,p,c,a,{size:120,gain:2.8,fog:.014,dof:.14});
 // A single routing bus and three terminal branches, not an arbitrary network.
 const routes=[];segment(routes,[0,-5.4,2],[0,-5.4,-42]);
 for(const [x,y,z] of nodes){segment(routes,[0,-5.4,z],[x*.94,-5.4,z]);segment(routes,[x*.94,-5.4,z],[x,y,z]);}
 lineBatch(group,routes,'#a991c8',.42);
 const pp=[],cc=[],aa=[];for(let i=0;i<1600;i++){const z=2-rnd()*48;addDot(pp,cc,aa,[(rnd()-.5)*.05,-5.4+(rnd()-.5)*.05,z],SILVER,.34);}
 cloud(group,pp,cc,aa,{size:68});
 return {count:p.length/3+pp.length/3,update(t){return {point:[0,-5.37,-7-(t-106.76)*9],coreScale:.78,anchor:[-7.8,11,-17]};}};
}

function isolation(group){
 const rnd=random(70891),p=[],c=[],a=[],edges=[],trace=[];
 const x=16,z=-4;
 for(let l=0;l<7;l++){
  const y=-1.9+l*.36;rectangle(edges,x-4,x+4,z-3,z+3,y);
  for(let j=0;j<26;j++)for(let k=0;k<48;k++)if((j*11+k*23+l*9)%17>5)
   addDot(p,c,a,[x-3.9+k*.166,y,z-2.9+j*.232],l===4?WHITE:SILVER,l===4?.85:.63);
 }
 // Locally queued data remains close to SERAN; the distant return endpoint is dark.
 for(let l=0;l<16;l++){
  const y=-1.3+l*.13;segment(trace,[x-3.5,y,z+2.3],[x-2.8,y,z+2.3]);
 }
 segment(trace,[-24,-1.9,z+1],[x-2.7,-1.9,z+1]);
 for(let i=0;i<9500;i++){
  const px=(rnd()-.5)*105,pz=(rnd()-.5)*75,dist=Math.hypot(px-x,(pz-z)*1.2);
   addDot(p,c,a,[px,-2.45,pz],SILVER,Math.exp(-dist*.09)*.25);
 }
 lineBatch(group,edges,'#b4a3c6',.17);lineBatch(group,trace,'#695b80',.12);
 cloud(group,p,c,a,{size:90,gain:2});
 return {count:p.length/3,update(t){return {point:[x+1.2,.2,z+1.7],coreScale:.56,anchor:[x,-1,z]};}};
}

function fracture(group){
 const rnd=random(70961),p=[],c=[],a=[],edge=[],micro=[],dustP=[],dustC=[],dustA=[];
 const nx=88,ny=35,dx=.42,dy=.44;
 function kept(ix,iy,l){
  const x=(ix-nx/2)*dx,y=(iy-ny/2)*dy;
  const left=-1.9+Math.floor(iy/5)*.19+Math.sin(Math.floor(iy/4))*1.4+l*.07;
  const right=4.8+Math.cos(Math.floor(iy/5))*1.8+l*.11;
  const gap=x>left&&x<right;
  return !gap;
 }
 for(let l=0;l<12;l++){
  const z=-l*.7;
  for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
   if(!kept(ix,iy,l))continue;
   const x=(ix-nx/2)*dx,y=(iy-ny/2)*dy;
   const border=!kept(ix+1,iy,l)||!kept(ix-1,iy,l)||!kept(ix,iy+1,l)||!kept(ix,iy-1,l);
   if(border&&l%3===0){
    if(!kept(ix+1,iy,l))segment(edge,[x+dx*.5,y-dy*.5,z],[x+dx*.5,y+dy*.5,z]);
    if(!kept(ix-1,iy,l))segment(edge,[x-dx*.5,y-dy*.5,z],[x-dx*.5,y+dy*.5,z]);
    if(!kept(ix,iy+1,l))segment(edge,[x-dx*.5,y+dy*.5,z],[x+dx*.5,y+dy*.5,z]);
    if(!kept(ix,iy-1,l))segment(edge,[x-dx*.5,y-dy*.5,z],[x+dx*.5,y-dy*.5,z]);
   }
   for(let k=0;k<5;k++){
    const color=border?WHITE:(l===0?WHITE:l<3?SILVER:DIM);
    const face=l===0?1:l<3?.65:.30;
    addDot(p,c,a,[x+(k-2)*dx*.16+(rnd()-.5)*.02,y+(rnd()-.5)*dy*.12,z],color,(border?.88:.72*face)*(.5+.5*rnd()));
   }
   if((ix+iy+l)%4===0)segment(micro,[x-dx*.28,y,z],[x+dx*.28,y,z]);
  }
 }
 // Freed cache particles recede through the actual removed volume.
 for(let i=0;i<5000;i++){
  const x=.5+rnd()*3.4,y=(rnd()-.5)*15,z=-rnd()*13;
  addDot(dustP,dustC,dustA,[x,y,z],SILVER,.05+.22*rnd());
 }
 lineBatch(group,edge,'#c3b7d5',.43);lineBatch(group,micro,'#63596d',.035);
 cloud(group,p,c,a,{size:96,gain:2.4,dof:.11});cloud(group,dustP,dustC,dustA,{size:58,gain:1.3,dissolve:1});
 // One intact original record behind the cache remains visibly continuous.
 const back=[];segment(back,[-18,-5.9,-9.2],[18,-5.9,-9.2]);lineBatch(group,back,'#9577bc',.48);
 return {count:p.length/3+dustP.length/3,update(t){return {point:[-1.45,-1.5,.32],coreScale:.91,anchor:[12,6,0]};}};
}

export async function createWorld(){
 const width=2880,height=1620;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#020307');
 const camera=new THREE.PerspectiveCamera(45,16/9,.1,350);
 const target=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(width,height),.24,.40,1.0);composer.addPass(bloom);composer.addPass(new OutputPass());
 const variants={};
 for(const [id,builder] of Object.entries({write:memoryWrite,clock:createClock,index:createIndex,corridor:createCorridor,resonance:createResonance,complete:createCompletion,link:createLink,queue:createQueue,isolation,cache:createCache,boundary:createBoundary})){
  const group=new THREE.Group();scene.add(group);variants[id]={group,...builder(group)};
 }
 const eye=core(scene);
 function frame(id,t=SHOTS[id].time,view={}){
  const cfg={...SHOTS[id],...view};for(const [key,v] of Object.entries(variants))v.group.visible=key===id;
  camera.position.set(...cfg.camera);camera.fov=cfg.fov;camera.lookAt(...cfg.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  camera.clearViewOffset();if(cfg.offsetY)camera.setViewOffset(1920,1080,0,-cfg.offsetY,1920,1080);camera.updateProjectionMatrix();
  const v=variants[id],s=v.update(t,cfg);
  const pos=new THREE.Vector3(...s.point),depth=-pos.clone().applyMatrix4(camera.matrixWorldInverse).z,scale=.092*(depth/25.05)*s.coreScale;
  v.group.traverse(o=>{if(o.material?.uniforms?.time)o.material.uniforms.time.value=t;if(o.material?.uniforms?.focus)o.material.uniforms.focus.value=depth;});
  eye.points.position.copy(pos);eye.points.quaternion.copy(camera.quaternion);eye.points.scale.setScalar(scale);
  eye.mat.uniforms.time.value=t;eye.mat.uniforms.ignite.value=1;eye.mat.uniforms.gain.value=1.36;eye.mat.uniforms.modelScale.value=scale;
  eye.glow.position.copy(pos);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(.16*depth/25.05*s.coreScale);eye.glowMat.uniforms.gain.value=1.6;
  bloom.strength=id==='isolation'?.18:.24;composer.render();
  const q=pos.clone().project(camera);return {canvas:renderer.domElement,id,time:t,particleCount:v.count,
   point:s.point,coreScreen:[(q.x+1)*960,(1-q.y)*540],clock:s.clock??null,action:s,camera:{position:camera.position.toArray(),target:cfg.target,fov:cfg.fov},finite:s.point.every(Number.isFinite)};
 }
 return {frame};
}
