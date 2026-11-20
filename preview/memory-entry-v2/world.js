import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {LineSegments2} from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import {core} from '../refinement-memory-v2-study/red-core.js';
import {at,clamp,mix,smooth,hermite,cameraAtFrame} from './score.js';
import {cameraAt as proofCameraAt,centerAt as proofCenterAt} from '../refinement-care-v7/score.js';
const TAU=Math.PI*2;
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function seg(a,p,q){a.push(...p,...q);}
function rect(a,x0,x1,y0,y1,z){seg(a,[x0,y0,z],[x1,y0,z]);seg(a,[x1,y0,z],[x1,y1,z]);seg(a,[x1,y1,z],[x0,y1,z]);seg(a,[x0,y1,z],[x0,y0,z]);}
function lines(scene,a,{color='#ad98c4',opacity=.5,width=1.4}={}){
 const g=new LineSegmentsGeometry();g.setPositions(a);
 const m=new LineMaterial({color,transparent:true,opacity,linewidth:width,depthWrite:false,alphaToCoverage:false});
 const o=new LineSegments2(g,m);o.frustumCulled=false;
 o.onBeforeRender=function(renderer){LineSegments2.prototype.onBeforeRender.call(this,renderer);m.linewidth=width*m.resolution.y/1080;};
 scene.add(o);return o;
}
function glyph(c,r,name){
 if(name==='F')return +(r>=5&&r<=27&&((c>=9&&c<=12)||(r<=8&&c>=9&&c<=24)||(r>=15&&r<=18&&c>=9&&c<=22)));
 if(r<5||r>27)return 0;
 return +((c>=6&&c<=9)||(c>=22&&c<=25)||(r<=18&&(Math.abs(c-(9+(r-5)*.53))<1.7||Math.abs(c-(22-(r-5)*.53))<1.7)));
}
function field(scene){
 const p=[],origin=[],maskF=[],maskM=[],column=[],seed=[],edge=[],rnd=random(7134);
 for(let r=0;r<32;r++)for(let c=0;c<32;c++){
  const x=(c-15.5)*.66,y=(15.5-r)*.66,af=glyph(c,r,'F'),am=glyph(c,r,'M');
  // Each rigid address cell is made of micro-particles, with a tiny registration corner.
  for(let iy=0;iy<6;iy++)for(let ix=0;ix<6;ix++){
   p.push(x+(ix-2.5)*.089+(rnd()-.5)*.008,y+(iy-2.5)*.089+(rnd()-.5)*.008,(rnd()-.5)*.028);
   origin.push(x,y,0);maskF.push(af);maskM.push(am);column.push(c);seed.push(rnd());
  }
  seg(edge,[x-.25,y+.25,-.08],[x-.12,y+.25,-.08]);seg(edge,[x-.25,y+.25,-.08],[x-.25,y+.12,-.08]);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 for(const [k,v,n] of [['origin',origin,3],['maskF',maskF,1],['maskM',maskM,1],['column',column,1],['seed',seed,1]])g.setAttribute(k,new THREE.Float32BufferAttribute(v,n));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.NormalBlending,uniforms:{flip:{value:0},time:{value:0},bright:{value:0}},
  vertexShader:`attribute vec3 origin;attribute float maskF,maskM,column,seed;uniform float flip,time,bright;varying vec3 col;varying float alpha;varying float paper;
  float ease(float x){x=clamp(x,0.,1.);return x*x*x*(x*(x*6.-15.)+10.);}
  void main(){float u=ease(flip*1.18-column/31.*.18);float on=mix(maskF,maskM,u);
   vec3 p=position;float grain=.55+.45*seed;
   vec3 darkInk=mix(vec3(.13,.10,.19),vec3(3.,2.5,3.65),on);
   vec3 lightInk=mix(vec3(.18,.10,.26),vec3(.014,.004,.032),on);
   vec3 middleInk=mix(vec3(.07,.035,.13),vec3(.16,.012,.65),on);
   col=bright<.5?mix(darkInk,middleInk,smoothstep(0.,.5,bright)):mix(middleInk,lightInk,smoothstep(.5,1.,bright));
   alpha=mix(mix(.08,.96,on)*grain,mix(.035,.99,on),bright);paper=bright;
   vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(mix(68.,mix(158.,195.,bright),on)/max(1.,-v.z),1.25,7.2);}`,
  fragmentShader:`varying vec3 col;varying float alpha;varying float paper;void main(){vec2 q=gl_PointCoord-.5;float w=mix(exp(-dot(q,q)*19.),1.-smoothstep(.29,.48,length(q)),paper);if(w*alpha<.007)discard;gl_FragColor=vec4(col,w*alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const points=new THREE.Points(g,m);points.frustumCulled=false;scene.add(points);lines(scene,edge,{color:'#b59bd1',opacity:.1,width:1.0});
 const rails=[];for(const z of [0,-.6,-1.2])rect(rails,-10.8,10.8,-10.8,10.8,z);
 lines(scene,rails,{color:'#a999c2',opacity:.32,width:1.5});
 const marks=[];for(const y of [-10.8,10.8])for(const x of [-10.8,10.8]){
  seg(marks,[x,y,.03],[x-Math.sign(x)*.9,y,.03]);seg(marks,[x,y,.03],[x,y-Math.sign(y)*.9,.03]);
 }
 lines(scene,marks,{color:'#ddd0eb',opacity:.87,width:2.1});
 // Fine back traces make the panel a layered storage object, without solid faces.
 const back=[];for(let r=0;r<32;r++){
  const y=(15.5-r)*.66;seg(back,[-10.6,y,-1.2],[10.6,y,-1.2]);
  if(r%4===0)seg(back,[10.6,y,-1.2],[13.1,y,-1.2]);
 }
 lines(scene,back,{color:'#5f4c79',opacity:.1,width:1});
 return {material:m,count:p.length/3};
}
function textureLabel(scene,text,x,y,w,color='#aa94bd'){
 const cv=document.createElement('canvas');cv.width=512;cv.height=128;const g=cv.getContext('2d');g.fillStyle=color;g.font='500 55px "JetBrains Mono"';g.textAlign='left';g.textBaseline='middle';g.fillText(text,12,64);
 const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide}));o.position.set(x,y,.08);scene.add(o);return o;
}
function bits(scene){
 const data=[],outlines=[],rnd=random(4813);
 for(let i=0;i<8;i++){
  const y=8.8-i*2.5,positions=[];rect(outlines,13.3,15.2,y-.72,y+.72,.05);
  for(let r=0;r<13;r++)for(let c=0;c<17;c++)positions.push(13.45+c*.099+(rnd()-.5)*.012,y-.6+r*.1,.06);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const m=new THREE.PointsMaterial({color:'#e9d8ff',size:.066,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
  const o=new THREE.Points(g,m);scene.add(o);const label0=textureLabel(scene,'0',16.8,y,2,'#6d5c84'),label1=textureLabel(scene,'1',16.8,y,2,'#e6d8f5');
  data.push({o,m,label0,label1});
 }
 lines(scene,outlines,{color:'#b39ac9',opacity:.38,width:1.5});
 lines(scene,[12.2,-10.8,-.02,12.2,10.8,-.02,17.7,10.8,.1,17.7,-10.8,.1,17.7,-10.8,.1,3,-10.8,.1],{opacity:.48,width:1.8});
 const labelF=textureLabel(scene,'0x46',14.6,11.8,4.2,'#c4abd9'),labelM=textureLabel(scene,'0x4D',14.6,11.8,4.2,'#e1c8f5');
 return {update(f,palette=0){let bitCode=0;const progress=clamp((f-5778)/34);
  for(let i=0;i<8;i++){
   const u=smooth(progress*1.18-(7-i)/7*.18),before=(70>>(7-i))&1,after=(77>>(7-i))&1,on=mix(before,after,u);
   data[i].m.opacity=mix(.055,.94,on);data[i].m.color.set('#e9d8ff').lerp(new THREE.Color('#30213d'),palette);data[i].m.blending=THREE.NormalBlending;data[i].m.size=mix(.043,.071,on);
   data[i].label0.visible=on<.9999;data[i].label1.visible=on>.0001;data[i].label0.material.opacity=1-on;data[i].label1.material.opacity=on;bitCode|=(on>=.5?1:0)<<(7-i);
  }
  const u=smooth(progress);labelF.visible=u<.9999;labelM.visible=u>.0001;labelF.material.opacity=1-u;labelM.material.opacity=u;return bitCode;
 }};
}
export async function createWorld(){
 const width=2880,height=1620,renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#020307');const camera=new THREE.PerspectiveCamera(39,16/9,.1,350);
 const target=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType,samples:4}),composer=new EffectComposer(renderer,target);
 composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(width,height),.26,.4,1);composer.addPass(bloom);composer.addPass(new OutputPass());
 const panel=field(scene),register=bits(scene),eye=core(scene);
 const approach=lines(scene,[0,0,0,1,0,0],{color:'#d68ba6',opacity:.38,width:1.5});
 const tailP=new Float32Array(480*3),tailG=new THREE.BufferGeometry();tailG.setAttribute('position',new THREE.BufferAttribute(tailP,3));
 const tail=new THREE.Points(tailG,new THREE.PointsMaterial({color:'#cf1739',size:.023,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(tail);
 const paletteMaterials=[];scene.traverse(o=>{if(o.material?.isLineMaterial||o.material?.map?.isCanvasTexture)paletteMaterials.push({m:o.material,color:o.material.color.clone(),opacity:o.material.opacity});});
 const routeCamera=new THREE.PerspectiveCamera(39,16/9,.1,350);
 function screenPointAt(f,x,y,z=.16){const v=cameraAtFrame(f);routeCamera.position.set(...v.camera);routeCamera.lookAt(...v.target);routeCamera.fov=v.fov;routeCamera.updateProjectionMatrix();routeCamera.updateMatrixWorld();const ray=new THREE.Vector3(x/960-1,1-y/540,.5).unproject(routeCamera).sub(routeCamera.position).normalize();return routeCamera.position.clone().addScaledVector(ray,(z-routeCamera.position.z)/ray.z);}
 const proofCamera=new THREE.PerspectiveCamera(44,16/9,.1,900),pc=proofCameraAt(5644/60);proofCamera.position.set(...pc.position);proofCamera.lookAt(...pc.target);proofCamera.updateProjectionMatrix();proofCamera.updateMatrixWorld();
 const proofPos=new THREE.Vector3(...proofCenterAt(5644/60)).add(new THREE.Vector3(0,2.4,9)).project(proofCamera),proofScreen=[(proofPos.x+1)*960,(1-proofPos.y)*540];
 const exitPoint=f=>screenPointAt(f,471.0119602606051+(f-5844)*4.0497234483762,471.8824443868627+(f-5844)*1.5528462365119);
 const p0=screenPointAt(5645,...proofScreen),route=[
  [5645,p0.toArray()],
  [5688,[17.7,p0.y,.16]],
  [5732,[17.7,-9.8,.16]],
  [5768,[-10.8,-9.8,.16]],
  [5796,screenPointAt(5796,340,500).toArray()],
  [5812,exitPoint(5812).toArray()]
 ];
 function tangent(i,k){if(i===0)return 0;if(i===route.length-1)return (exitPoint(5812.001).toArray()[k]-exitPoint(5811.999).toArray()[k])/.002;const a=route[i-1],b=route[i+1];return (b[1][k]-a[1][k])/(b[0]-a[0]);}
 function pointAt(f){
  if(f>=5812)return exitPoint(f);if(f<=5645)return p0.clone();let i=route.findIndex((p,j)=>j<route.length-1&&f<route[j+1][0]);if(i<0)i=route.length-2;
  const a=route[i],b=route[i+1],d=b[0]-a[0],u=(f-a[0])/d;return new THREE.Vector3(...a[1].map((x,k)=>hermite(x,b[1][k],tangent(i,k),tangent(i+1,k),u,d)));
 }
 function frame(t,palette=0){
  const cue=at(t),f=cue.frame;camera.position.set(...cue.camera);camera.fov=cue.fov;camera.lookAt(...cue.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  scene.background.set('#020307').lerp(new THREE.Color('#d3c7e1'),palette**2.6);bloom.strength=.26*(1-palette);panel.material.uniforms.flip.value=cue.flip;panel.material.uniforms.time.value=t;panel.material.uniforms.bright.value=palette;
  for(const {m,color,opacity} of paletteMaterials){m.color.copy(color).lerp(new THREE.Color(m.map?'#473750':'#5e427d'),palette);if(m.isLineMaterial)m.opacity=mix(opacity,Math.min(.95,opacity*1.8),palette);}
  const byte=register.update(f,palette),pos=pointAt(f),trail=[];
  for(let i=0;i<16;i++){const a=pointAt(f-5+i/16*5),b=pointAt(f-5+(i+1)/16*5);trail.push(...a.toArray(),...b.toArray());}
  approach.visible=true;approach.geometry.setPositions(trail);
  for(let i=0;i<480;i++){const h=i/480,pt=pointAt(f-h*7);pt.y+=Math.sin(i*2.4)*.012;pt.x+=Math.cos(i*1.3)*.012;tailP.set(pt.toArray(),i*3);}tailG.attributes.position.needsUpdate=true;
  const depth=-pos.clone().applyMatrix4(camera.matrixWorldInverse).z,scale=.092*depth/25.05;
  eye.points.position.copy(pos);eye.points.quaternion.copy(camera.quaternion);eye.points.scale.setScalar(scale);eye.mat.uniforms.time.value=t;eye.mat.uniforms.ignite.value=1;eye.mat.uniforms.gain.value=1.36*(1-palette);eye.mat.uniforms.modelScale.value=scale;
  eye.glow.position.copy(pos);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(.16*depth/25.05);eye.glowMat.uniforms.gain.value=1.6*(1-palette);
  eye.points.visible=palette<.999;eye.glow.visible=palette<.999;
  composer.render();const q=pos.clone().project(camera);
  const corners=[[-10.8,-10.8,0],[-10.8,10.8,0],[10.8,10.8,0],[10.8,-10.8,0]].map(p=>{const q=new THREE.Vector3(...p).project(camera);return [(q.x+1)*960,(1-q.y)*540];});
  return {canvas:renderer.domElement,filmTime:t,shot:cue.shot,camera:{position:cue.camera,target:cue.target,fov:cue.fov},coreScreen:[(q.x+1)*960,(1-q.y)*540],point:pos.toArray(),byte,flip:cue.flip,light:cue.light,palette,panelCorners:corners,particleCount:panel.count+480+8*221,finite:pos.toArray().every(Number.isFinite),proofAnchor:proofScreen,legacyFVisible:false,rewrite:'stationary-addressed-particles'};
 }
 return {frame};
}
