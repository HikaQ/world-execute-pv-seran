import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {shotAt,cameraAt,recallAt,HITS,ramp,mix,pulse,clamp} from './score.js';

const W=2880,H=1620;
const white=new THREE.Color('#ddd4ed'),purple=new THREE.Color('#b493de');
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const data=()=>({p:[],c:[],s:[],d:[]});
const put=(a,p,c,s=.04,d=[0,0,0])=>{a.p.push(...p);a.c.push(...c);a.s.push(s);a.d.push(...d);};
function cloud(parent,a,code='',extra={}){
 const geo=new THREE.BufferGeometry();for(const [k,v,n] of [['position',a.p,3],['tint',a.c,3],['size',a.s,1],['data',a.d,3]])geo.setAttribute(k,new THREE.Float32BufferAttribute(v,n));
 const uniforms={time:{value:0},progress:{value:0},hit:{value:0},gain:{value:1},pointScale:{value:100},perspective:{value:1},...extra};
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:true,depthTest:true,uniforms,
  vertexShader:`attribute vec3 tint,data;attribute float size;uniform float time,progress,hit,gain,pointScale,perspective;${Object.keys(extra).map(k=>'uniform float '+k+';').join('')}
   varying vec3 ink;varying float opacity;void main(){vec3 p=position,col=tint;float alpha=1.;${code}
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float depth=max(.2,-mv.z);
   gl_PointSize=clamp(size*pointScale/mix(1.,depth,perspective),1.05,12.);ink=col*gain;opacity=alpha;
   if(alpha<.005||mv.z>-.2)gl_PointSize=0.;}`,
  fragmentShader:`varying vec3 ink;varying float opacity;void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=dot(q,q);if(r>1.)discard;
   vec3 n=vec3(q,sqrt(max(0.,1.-r)));float light=.45+.55*max(0.,dot(n,normalize(vec3(-.35,.5,1.))));
   float a=opacity*(1.-smoothstep(.4,1.,r));if(a<.008)discard;gl_FragColor=vec4(ink*light,a);}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;parent.add(points);return {points,uniforms,count:a.s.length};
}
function glyph(parent,text,width,height,{font='600 250px "JetBrains Mono"',resolution=1600,color=white,step=2,code=''}={}){
 const cv=document.createElement('canvas');cv.width=resolution;cv.height=Math.round(resolution*height/width);
 const g=cv.getContext('2d');g.fillStyle='white';g.font=font;g.textBaseline='middle';g.textAlign='center';g.fillText(text,cv.width/2,cv.height/2,cv.width*.96);
 const rgba=g.getImageData(0,0,cv.width,cv.height).data,a=data();
 for(let y=0;y<cv.height;y+=step)for(let x=0;x<cv.width;x+=step){const alpha=rgba[(y*cv.width+x)*4+3]/255;if(alpha>.08)put(a,[((x+(hash(x,y)-.5)*step*.44)/cv.width-.5)*width,(.5-(y+(hash(y,x+7)-.5)*step*.44)/cv.height)*height,0],color.clone().multiplyScalar(alpha).toArray(),width/resolution*step*.92,[x/cv.width,y/cv.height,0]);}
 return cloud(parent,a,code);
}
function label(parent,text,width,y){const c=glyph(parent,text,width,.65,{font:'500 70px "JetBrains Mono"',resolution:1400,color:purple.clone().multiplyScalar(.7),step:2});c.points.position.y=y;return c;}

function makeLookup(parent){
 const a=data();
 // One thick read surface and a genuinely empty former address. The stripe
 // carries the query; every edge here belongs to one of those two objects.
 for(let col=0;col<246;col++)for(let row=0;row<94;row++){
  const u=col/245,v=row/93,x=2.8+15*u,z=(v-.5)*7.2;
  const field=Math.floor(col/18),lane=Math.floor(row/13);
  if(col%18===17&&row%13>1)continue;
  const value=.23+.27*((field*7+lane*3)%11)/10;
  put(a,[x,0,z],white.clone().lerp(purple,.25).multiplyScalar(value).toArray(),.047,[u,v,0]);
 }
 const surface=cloud(parent,a,`float front=.586666667*(1.-progress);float scan=exp(-pow((data.x-front)/.040,2.));
  float kept=.65+.35*step(front,data.x);col*=kept;col+=vec3(.82,.51,1.0)*scan*(1.-failure*.66);`,{failure:{value:0}});
 // Depth-only plane suppresses shimmer without adding a visible solid slab.
 const occluder=new THREE.Mesh(new THREE.PlaneGeometry(15.04,7.22),new THREE.MeshBasicMaterial({colorWrite:false,side:THREE.DoubleSide}));
 occluder.rotation.x=-Math.PI/2;occluder.position.set(10.3,-.02,0);parent.add(occluder);
 const corners=data();
 for(const x of [-10.2,-4.6])for(const z of [-3.6,3.6])for(let j=0;j<34;j++){
  const u=j/33;put(corners,[x+(x<-7?1:-1)*u*.9,.02,z],purple.clone().multiplyScalar(.46).toArray(),.035);
  put(corners,[x,.02,z+(z<0?1:-1)*u*.9],purple.clone().multiplyScalar(.46).toArray(),.035);
 }
 const empty=cloud(parent,corners);
 const pulseCore=new THREE.Mesh(new THREE.SphereGeometry(.115,24,16),new THREE.MeshBasicMaterial({color:new THREE.Color('#ff3656').multiplyScalar(1.6)}));parent.add(pulseCore);
 const lp=label(parent,'EARLIER RECORD',5.6,-5);lp.points.rotation.x=-Math.PI/2;lp.points.position.set(-7.4,.03,4.6);
 return {clouds:[surface,empty,lp],frame(t){const m=recallAt(t);surface.uniforms.progress.value=m.queryProgress;surface.uniforms.failure.value=ramp(t,75.6377,76.10);surface.uniforms.gain.value=1.65;
  empty.uniforms.gain.value=2.1;pulseCore.position.set(mix(11.6,2.8,m.queryProgress),.17,0);pulseCore.scale.setScalar(1.18+.14*pulse(t,75.1791));
  return {...m,geometry:'single read surface and empty address',queryPosition:pulseCore.position.toArray(),emptyAddressX:[-10.2,-4.6],gapX:[-4.6,2.8]};}};
}
async function makePortrait(parent){
 const im=new Image();im.src='/assets/char/seran-avatar-user-20261110.png';await im.decode();
 const cv=document.createElement('canvas');cv.width=cv.height=500;const g=cv.getContext('2d');g.drawImage(im,0,0,cv.width,cv.height);
 const rgba=g.getImageData(0,0,500,500).data,a=data();
 for(let y=0;y<500;y++)for(let x=0;x<500;x++){
  const k=(y*500+x)*4,alpha=rgba[k+3]/255;if(alpha<.3)continue;
  const u=x/499,v=y/499,R=rgba[k]/255,G=rgba[k+1]/255,B=rgba[k+2]/255,lum=.2126*R+.7152*G+.0722*B;
  const redEye=u>.54&&u<.70&&v>.52&&v<.64&&R>G*1.3&&R>B*1.14;
  const violetEye=u>.33&&u<.46&&v>.53&&v<.65&&B>G*1.2&&B>R*.92;
  const edge=ramp(u,0,.025)*(1-ramp(u,.975,1))*ramp(v,0,.02)*(1-ramp(v,.95,1));
  const c=(redEye||violetEye)?new THREE.Color(R,G,B).convertSRGBToLinear().multiplyScalar(1.6):white.clone().lerp(new THREE.Color('#a79ec8'),.3).multiplyScalar(Math.pow(lum,2.0)*.55);
  // Subpixel, deterministic spacing breaks the sampling grid without moving
  // the face over time or disturbing the image silhouette.
  c.multiplyScalar(alpha*edge);put(a,[(u-.5+(hash(x,y)-.5)*.68/500)*14.4,(.5-v+(hash(y,x+5)-.5)*.68/500)*14.4,0],c.toArray(),.035,[u,v,redEye?1:violetEye?-1:0]);
 }
 return cloud(parent,a,`float scan=exp(-pow((data.y-progress)/.045,2.));col*=.92+.13*scan;
  if(data.z>.5)col*=1.+hit*.2;`);
}

export async function createEndingWorld(){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(W,H,false);renderer.setPixelRatio(1);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030207');
 const persp=new THREE.PerspectiveCamera(42,16/9,.1,150),ortho=new THREE.OrthographicCamera(-16,16,9,-9,.1,150);
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,samples:4})),pass=new RenderPass(scene,persp),bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.23,.32,.83);
 composer.addPass(pass);composer.addPass(bloom);composer.addPass(new OutputPass());
 const groups={};for(const name of ['lookup','result','portrait','answer']){groups[name]=new THREE.Group();scene.add(groups[name]);}
 const lookup=makeLookup(groups.lookup);
 const zero=glyph(groups.result,'0',9.4,12,{font:'600 960px "Space Grotesk"',resolution:1100,step:2,code:'float scan=exp(-pow((data.y-progress)/.07,2.));col*=1.+.18*hit+.25*scan;'});
 const zeroLabel=label(groups.result,'RECORDS FOUND',10,-5.1);
 const portrait=await makePortrait(groups.portrait);
 const answer=glyph(groups.answer,'我找不到了。',23.4,4.4,{font:'600 210px "Forgetting Notes", "Microsoft YaHei"',resolution:2400,step:2,color:white,code:'alpha=smoothstep(data.x-.045,data.x+.045,progress);'});
 const answerLabel=label(groups.answer,'SERAN / RECALL',8.6,-3.2);
 const clouds=[...lookup.clouds,zero,zeroLabel,portrait,answer,answerLabel];
 function frame(t,{noBloom=false}={}){
  const s=shotAt(t),c=cameraAt(t),camera=c.ortho?ortho:persp;
  camera.position.set(...c.position);camera.up.set(...c.up);camera.lookAt(...c.target);
  if(c.ortho){ortho.top=c.ortho/2;ortho.bottom=-c.ortho/2;ortho.left=-c.ortho*16/9/2;ortho.right=-ortho.left;}else persp.fov=c.fov;
  camera.updateProjectionMatrix();camera.updateMatrixWorld();pass.camera=camera;
  for(const [name,group]of Object.entries(groups))group.visible=name===s.family;
  const hit=Math.max(...HITS.map(at=>pulse(t,at)));
  for(const x of clouds){const u=x.uniforms;u.time.value=t;u.hit.value=hit;u.gain.value=1;u.pointScale.value=c.ortho?H/c.ortho:H/(2*Math.tan(c.fov*Math.PI/360));u.perspective.value=c.ortho?0:1;}
  const query=lookup.frame(t);
  zero.uniforms.progress.value=ramp(t,4593/60,76.72)*1.1;zero.uniforms.gain.value=1.35;
  portrait.uniforms.progress.value=clamp((t-77.014233)/1.3932);portrait.uniforms.gain.value=1.15;
  answer.uniforms.progress.value=.30+.8*ramp(t,78.407433,78.75);answer.uniforms.gain.value=1.5;
  answerLabel.uniforms.gain.value=.85;zeroLabel.uniforms.gain.value=.85;
  bloom.enabled=!noBloom;composer.render();
  return {canvas:renderer.domElement,camera:c,finite:[...c.position,...c.target,c.fov].every(Number.isFinite),
   helixVisible:false,bridgePacketVisible:false,decorativeConnectionCount:0,reusedFootage:false,endingFamily:s.family,
   query,context:query.currentContext,newPortraitComposition:true,particleCount:clouds.reduce((n,x)=>n+(x.points.parent.visible?x.count:0),0),noBloom};
 }
 return {frame};
}
