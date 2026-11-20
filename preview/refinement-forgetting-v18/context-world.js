import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {FLOW,EVICTION_START,shotAt,cameraAt,contextAt,rowAt,rowEvent,beatAt,ramp,clamp} from './score.js';

const W=2880,H=1620;
const hash=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*73.43)*43758.5453;return n-Math.floor(n);};
const white=new THREE.Color('#c7bfd2'),purple=new THREE.Color('#b389e0');
const data=()=>({p:[],c:[],s:[],e:[],id:[],part:[]});
function add(a,p,color,size,id,part=0){a.p.push(...p);a.c.push(...color);a.s.push(size);a.id.push(id);a.e.push(rowEvent(id));a.part.push(part);}

// Deterministic, slightly staggered grains over the six surfaces of each
// shallow piece. No particle is displaced independently while it moves.
function piece(a,{x,y=0,z=0,w,h=.32,d=.24,id=0,part=0,query=false}){
 const pitch=.022;
 const surfaces=[
  {o:[x,y-h/2,z+d/2],u:[w,0,0],v:[0,h,0],light:.92},
  {o:[x,y+h/2,z-d/2],u:[w,0,0],v:[0,0,d],light:.71},
  {o:[x,y-h/2,z-d/2],u:[w,0,0],v:[0,0,d],light:.36},
  {o:[x,y-h/2,z-d/2],u:[0,h,0],v:[0,0,d],light:.58},
  {o:[x+w,y-h/2,z-d/2],u:[0,h,0],v:[0,0,d],light:.30}
 ];
 for(let si=0;si<surfaces.length;si++){
  const f=surfaces[si],nu=Math.ceil(Math.hypot(...f.u)/pitch),nv=Math.ceil(Math.hypot(...f.v)/pitch);
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const k=id*3001+part*71+si*129;
   const u=clamp((i+(hash(i,j,k)-.5)*.65)/nu),v=clamp((j+(hash(j,i,k+13)-.5)*.65)/nv);
   const p=f.o.map((o,n)=>o+u*f.u[n]+v*f.v[n]);
   const tint=(id===FLOW.trackedRow&&!query?purple:white).clone();
   if(query)tint.lerp(purple,.28);
   const noise=.94+.12*hash(i+19,j,k);
   tint.multiplyScalar(f.light*noise*(query?.50-.055*Math.floor(part/2):id===FLOW.trackedRow?.86:.36));
   add(a,p,tint.toArray(),.036*(.96+.08*hash(i,j,k+3)),id,part);
  }
 }
}
function makeGeo(a){const g=new THREE.BufferGeometry();for(const [k,v,n] of [['position',a.p,3],['tint',a.c,3],['size',a.s,1],['eventAt',a.e,1],['rowId',a.id,1],['part',a.part,1]])g.setAttribute(k,new THREE.Float32BufferAttribute(v,n));return g;}
const f=x=>Number(x).toFixed(9);
function makeMaterial(query=false,tail=0){
 const uniforms={clock:{value:0},beat:{value:0},pointScale:{value:1},mode:{value:0},progress:{value:0},focus:{value:20},aperture:{value:0}};
 return new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,
  vertexShader:`attribute vec3 tint;attribute float size,eventAt,rowId,part;
   uniform float clock,beat,pointScale,mode,progress,focus,aperture;
   varying vec3 ink;varying float opacity,clipY,blurAmount;
   void main(){vec3 p=position;float gain=1.;opacity=1.;
   ${query?`
    float assembled=smoothstep(part*.045,part*.045+.19,progress);
    p.x+=(1.-assembled)*.42;p.y+=(1.-assembled)*(.12*mod(part,2.));
    opacity=assembled;gain=.94+.10*beat;
   `:`
    float age=clock-eventAt-${f(tail)};float up=max(0.,age);
    float center=${f(FLOW.top)}+${f(FLOW.speed)}*age+.5*${f(FLOW.acceleration)}*up*up;
    p.y+=center;
    opacity=step(${f(FLOW.bottom-.2)},p.y)*(1.-step(${f(FLOW.exitDuration)},age));
    float hot=exp(-pow((center-(${f(FLOW.bottom)}+.25))/.72,2.));
    float tracked=1.-step(.1,abs(rowId-${f(FLOW.trackedRow)}));
    float edge=exp(-pow(age/.07,2.));
    gain=.88+.34*hot+.10*edge+.14*hot*beat;
    if(mode>1.5)gain=.30+1.30*hot;
    if(mode>.5&&mode<1.5)gain*=mix(.14+.58*exp(-pow((center-(${f(FLOW.top)}-.8))/1.4,2.)),1.18,tracked);
    ${tail?`opacity*=step(0.,age)*.012;gain*=.55;`:''}
   `}
    clipY=p.y;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float depth=max(.1,-mv.z),sharp=size*pointScale/depth;
    float blur=min(3.2,abs(depth-focus)*aperture);blurAmount=blur;
    gl_PointSize=clamp(sqrt(sharp*sharp+blur*blur),.85,22.);
    opacity*=sharp*sharp/max(.01,sharp*sharp+blur*blur);
    ink=tint*gain;
    if(opacity<.004||mv.z>-.1)gl_PointSize=0.;
   }`,
  fragmentShader:`varying vec3 ink;varying float opacity,clipY,blurAmount;
   void main(){${query?'':`if(clipY<${f(FLOW.bottom)})discard;`}
    vec2 q=(gl_PointCoord-.5)*2.;float r=dot(q,q);if(r>1.)discard;
    float edge=1.-smoothstep(.35,1.,r);float a=opacity*edge;if(a<.003)discard;
    float relief=.82+.18*sqrt(max(0.,1.-r));gl_FragColor=vec4(ink*relief,a);
   }`
 });
}

export function createWorld(){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setSize(W,H,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.localClippingEnabled=true;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030207');
 const camera=new THREE.PerspectiveCamera(30,16/9,.1,150);
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,samples:4}));
 const pass=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.20,.28,.85);
 composer.addPass(pass);composer.addPass(bloom);composer.addPass(new OutputPass());
 const records=new THREE.Group(),query=new THREE.Group();scene.add(records,query);
 const rows=data(),masks=[];
 const black=new THREE.MeshBasicMaterial({color:'#0b080e',clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,1,0),-FLOW.bottom)]});
 const patterns=[[7.6,5.7,3.4],[6.5,8.2,3.1],[9.3,4.3,4.9],[5.6,7.5,5.2]];
 for(let id=FLOW.firstRow;id<FLOW.totalRows;id++){
  let x=-10.2;const group=new THREE.Group();group.renderOrder=-1;records.add(group);
  for(const [part,w]of patterns[((id%4)+4)%4].entries()){
   piece(rows,{x,w,id,part});
   const box=new THREE.Mesh(new THREE.BoxGeometry(w-.024,.296,.208),black);box.position.set(x+w/2,0,0);box.renderOrder=-1;group.add(box);x+=w+.36;
  }
  masks.push({id,group});
 }
 const rowGeo=makeGeo(rows),rowMat=makeMaterial(),rowCloud=new THREE.Points(rowGeo,rowMat);rowCloud.frustumCulled=false;records.add(rowCloud);
 const tails=[.012,.024].map(delay=>{const mat=makeMaterial(false,delay),cloud=new THREE.Points(rowGeo,mat);cloud.frustumCulled=false;cloud.renderOrder=-.5;records.add(cloud);return mat;});
 const lineMat=new THREE.LineBasicMaterial({color:'#847294',transparent:true,opacity:.28});
 const boundary=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10.6,FLOW.top,0),new THREE.Vector3(10.1,FLOW.top,0)]),lineMat);records.add(boundary);
 const corners=[];
 for(const y of [FLOW.top,FLOW.bottom])for(const x of [-10.55,10.2]){const sign=x<0?1:-1;corners.push(new THREE.Vector3(x+sign*.32,y,0),new THREE.Vector3(x,y,0),new THREE.Vector3(x,y,0),new THREE.Vector3(x,y+(y>0?-.25:.25),0));}
 records.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(corners),lineMat));
 const redMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(4.0,.008,.035)});
 const marker=new THREE.Mesh(new THREE.SphereGeometry(.062,20,12),redMaterial);marker.position.set(-10.72,FLOW.bottom+.04,.15);records.add(marker);

 const address=data(),specs=[[-2.8,.8,3.8,.44],[1.25,.8,1.15,.44],[-2.8,-.15,1.45,.4],[-1.1,-.15,3.5,.4],[-2.8,-1.1,2.5,.4],[-.05,-1.1,2.45,.4]];
 for(const [part,[x,y,w,h]]of specs.entries())piece(address,{x,y,w,h,d:.25,id:4,part,query:true});
 const queryMat=makeMaterial(true),queryCloud=new THREE.Points(makeGeo(address),queryMat);queryCloud.frustumCulled=false;query.add(queryCloud);
 const queryRed=new THREE.Mesh(new THREE.SphereGeometry(.084,24,16),redMaterial);queryRed.position.set(3.25,1.02,.16);query.add(queryRed);
 const focusPoint=new THREE.Vector3();
 function frame(t,{noBloom=false}={}){
  const s=shotAt(t),c=cameraAt(t),q=s.family==='query';records.visible=!q;query.visible=q;
  camera.position.set(...c.position);camera.up.set(...c.up);camera.lookAt(...c.target);camera.fov=c.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const mode=s.index===17?1:s.index===18?2:0;
  focusPoint.set(0,mode===1?FLOW.top:mode===2?FLOW.bottom:.3,0).applyMatrix4(camera.matrixWorldInverse);
  for(const mat of [rowMat,...tails,queryMat]){
   const u=mat.uniforms;u.clock.value=t-EVICTION_START;u.beat.value=beatAt(t);u.pointScale.value=H/(2*Math.tan(c.fov*Math.PI/360));u.mode.value=mode;
   u.progress.value=t-4428/60;u.focus.value=-focusPoint.z;u.aperture.value=q?0:mode===2?.32:mode===1?.18:0;
  }
  for(const {id,group}of masks){const r=rowAt(t,id);group.visible=r.visible;group.position.y=r.y;}
  boundary.visible=mode===1;lineMat.opacity=mode===1?.27:.22;
  marker.scale.setScalar(1+.08*beatAt(t));queryRed.scale.setScalar(.96+.05*beatAt(t));
  bloom.enabled=!noBloom;composer.render();
  const current=contextAt(t);
  return {canvas:renderer.domElement,camera:c,finite:[...c.position,...c.target,c.fov,current.tracked.y].every(Number.isFinite),
   context:current,tracked:current.tracked,query:q?{queryRow:4,targetLoaded:false,assembly:ramp(t,4428/60,74.23),addressOnly:true}:null,
   visibleRows:q?[]:masks.filter(x=>x.group.visible).map(x=>x.id),particleCount:q?address.s.length:rows.s.length,
   geometry:'shallow 3D particle data pieces',helixVisible:false,bridgePacketVisible:false,decorativeConnectionCount:0,reusedFootage:false,
   noBloom,viewMode:q?'query':mode===1?'loss-macro':mode===2?'input-closeup':'overview',capacity:10,grainStable:true};
 }
 return {frame};
}
