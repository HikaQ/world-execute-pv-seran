import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {makeHelix} from './accepted-helix.js';
import {HELIX_CENTER,spatialTip} from '../refinement-perception-v16/spatial-score.js';
import {ATTENTION,embedding} from '../refinement-forgetting-v6/model.js';
import {VERSION,shotAt,cameraAt,LOCAL_Q,world,local,HITS,ramp,mix,pulse,V,clamp,flashbackTime} from './score.js';
import {createMemory} from './memory.js';
import {createRetrieval} from './retrieval.js';

const W=2880,H=1620;
const C={white:new THREE.Color('#e6dbff'),violet:new THREE.Color('#a98ae8'),red:new THREE.Color('#ff294b'),muted:new THREE.Color('#756582')};
const color=(hex,gain=1)=>new THREE.Color(hex).multiplyScalar(gain).toArray();
const put=(a,p,c,size=.035,m=[0,0,0])=>{a.p.push(...p);a.c.push(...c);a.s.push(size);a.m.push(...m);};
const arrays=()=>({p:[],c:[],s:[],m:[]});
function cloud(group,a,code='',extra={}){
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a.p,3));geo.setAttribute('tint',new THREE.Float32BufferAttribute(a.c,3));geo.setAttribute('size',new THREE.Float32BufferAttribute(a.s,1));geo.setAttribute('data',new THREE.Float32BufferAttribute(a.m,3));
 const uniforms={time:{value:0},progress:{value:0},hit:{value:0},gain:{value:1},pointScale:{value:2100},perspective:{value:1},focus:{value:20},aperture:{value:0},...extra};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:true,depthTest:true,blending:THREE.NormalBlending,
  vertexShader:`attribute vec3 tint,data;attribute float size;uniform float time,progress,hit,gain,pointScale,perspective,focus,aperture;${Object.keys(extra).map(k=>'uniform float '+k+';').join('')}varying vec3 ink;varying float opacity,softness;
  void main(){vec3 p=position;vec3 col=tint;float alpha=1.;${code}
   vec4 mv=modelViewMatrix*vec4(p,1.);float depth=max(.15,-mv.z);gl_Position=projectionMatrix*mv;
   float px=size*pointScale/mix(1.,depth,perspective);float blur=min(8.,abs(depth-focus)*aperture);
   gl_PointSize=clamp(px+blur,1.1,24.);softness=blur/max(.5,px);opacity=alpha*min(1.,pow((px+.5)/(px+blur+.5),1.25));ink=col*gain;
   if(mv.z>-.2||alpha<.002)gl_PointSize=0.;
  }`,
  fragmentShader:`varying vec3 ink;varying float opacity,softness;void main(){vec2 p=gl_PointCoord*2.-1.;float rr=dot(p,p);if(rr>1.)discard;
   float edge=1.-smoothstep(.48,1.,rr);float light=.68+.32*max(0.,sqrt(max(0.,1.-rr))-.22*p.x+.28*p.y);
   float a=opacity*edge*mix(1.,exp(-rr*2.),min(1.,softness));if(a<.018)discard;gl_FragColor=vec4(ink*light,a);
  }`});
 const points=new THREE.Points(geo,material);points.frustumCulled=false;group.add(points);
 return {points,material,uniforms,count:a.s.length};
}
function makeFields(group){
 const X=Array.from({length:24},(_,i)=>embedding(i));
 const A=ATTENTION[0],Y=A.map(row=>Array.from({length:8},(_,k)=>row.reduce((sum,w,j)=>sum+w*X[j][k],0)));
 return [0,1,2].map(layer=>{
  const a=arrays();
  for(let r=0;r<76;r++)for(let c=0;c<120;c++){
   const boundary=r%10===0||c%10===0;
   const token=Math.min(23,Math.floor(c/120*24)),dim=Math.min(7,Math.floor(r/76*8)),query=Math.min(23,Math.floor(r/76*24));
   const value=layer===0?Math.abs(X[token][dim])/2.8:layer===1?Math.pow(A[query][token],.42):Math.abs(Y[token][dim])/2.8;
   const v=.19+.95*value;
   put(a,[-18-layer*5,(r-37.5)*.102,(c-59.5)*.102],C.white.clone().multiplyScalar(v).toArray(),boundary?.043:.036,[c/119,r/75,layer]);
  }
  const field=cloud(group,a,`
   float front=progress*1.32-.16;float scan=exp(-pow((data.x-front)/.047,2.));
   float passed=1.-smoothstep(front-.018,front+.018,data.x);
   float row=exp(-pow((data.y-.52)/.023,2.));
   col*=.65+.85*passed+.3*hit;col+=vec3(.42,.23,.78)*scan+vec3(.85,.70,1.05)*row*scan*1.5;
   p.x+=hit*.055;
  `);
  return field;
 });
}
function makeTokens(group){
 const a=arrays(),N=30,R=18;
 for(let r=0;r<R;r++)for(let c=0;c<N;c++)for(let y=0;y<4;y++)for(let x=0;x<4;x++){
  const base=.12+.60*Math.abs(embedding(c)[r%8])/2.8;
  put(a,[(c-14.5)*.49+(x-1.5)*.081,(8.5-r)*.49+(y-1.5)*.081,0],C.white.clone().multiplyScalar(base).toArray(),.041,[c/(N-1),r/(R-1),r]);
 }
 return cloud(group,a,`
  float row=1.-step(.1,abs(data.z-8.));float front=progress*1.25-.05;
  float passed=1.-smoothstep(front-.018,front+.018,data.x);
  float crest=exp(-pow((data.x-front)/.027,2.));
  col*=.85;col=mix(col,vec3(.42,.23,.82)*(1.1+.6*passed),row);col+=vec3(.9,.8,1.1)*row*crest;
 `);
}
function makeWave(group){
 const a=arrays();
 for(let lane=0;lane<68;lane++)for(let x=0;x<380;x++){
  const z=(lane-33.5)*.096,u=(x/379-.5)*25;
  put(a,[u,0,z],C.white.clone().multiplyScalar(.60).toArray(),.033,[x/379,lane/67,0]);
 }
 return cloud(group,a,`
  float phase=p.x*.43-time*2.7+p.z*.14;
  p.y=sin(phase)*1.7;
  float crest=pow(.5+.5*cos(phase),2.);
  float front=progress*1.4-.15;float bright=exp(-pow((data.x-front)/.07,2.));
  col*=.30+.55*crest;col+=vec3(.40,.22,.69)*bright+vec3(.35,.31,.48)*bright*crest;
 `);
}
async function makeEyes(group){
 const im=new Image();im.src='/assets/char/seran-avatar-user-20261110.png';await im.decode();
 const cv=document.createElement('canvas');cv.width=480;cv.height=144;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,330,630,600,180,0,0,480,144);const data=ctx.getImageData(0,0,480,144).data,a=arrays();
 for(let y=0;y<144;y++)for(let x=0;x<480;x++){
  const i=(y*480+x)*4,u=x/479,v=y/143,R=data[i]/255,G=data[i+1]/255,B=data[i+2]/255,lum=.2126*R+.7152*G+.0722*B;
  const left=u>.19&&u<.44&&v>.24&&v<.87&&B>G*1.2&&B>R*.92;
  const right=u>.65&&u<.85&&v>.20&&v<.75&&R>G*1.3&&R>B*1.14;
  const eye=left?-1:right?1:0;
  const edge=ramp(u,0,.045)*(1-ramp(u,.955,1))*ramp(v,0,.12)*(1-ramp(v,.88,1));
  let c=C.white.clone().multiplyScalar(Math.pow(lum,2.3)*.72);
  if(eye)c=new THREE.Color(R,G,B).convertSRGBToLinear().multiplyScalar(1.35);
  c.multiplyScalar(edge);
  put(a,[(u-.5)*23.3,(.5-v)*7,0],c.toArray(),.037,[u,eye,lum]);
 }
 return cloud(group,a,`
  float scan=exp(-pow((data.x-(progress*1.4-.15))/.028,2.));
  col+=vec3(.33,.21,.51)*scan*(.1+.75*data.z);
  if(data.y>.5)col*=1.+hit*.55;
  if(data.y<-.5)col*=1.+hit*.20;
 `);
}
function makeHeads(group){
 const a=arrays(),N=24;
 for(let head=0;head<4;head++)for(let r=0;r<N;r++)for(let c=0;c<=r;c++)for(let y=0;y<4;y++)for(let x=0;x<4;x++){
  const value=ATTENTION[head*2][r][c],v=.09+Math.pow(value,.45)*1.25;
  const pos=[(head-1.5)*5.2+(c-11.5)*.1875+(x-1.5)*.033,(11.5-r)*.1875+(y-1.5)*.033,0];
  put(a,pos,C.white.clone().lerp(C.violet,.25).multiplyScalar(v).toArray(),.024,[r/23,c/23,head]);
 }
 return cloud(group,a,`
  float selected=1.-smoothstep(.018,.025,abs(data.y-13./23.));
  float sweep=1.-smoothstep(progress*1.35-.1,progress*1.35+.03,data.x);
  col*=.55+.8*sweep;col+=vec3(.27,.12,.48)*selected*sweep;
  if(retire>0.){
   float available=smoothstep(retire-.025,retire+.015,data.y);
   float query=exp(-pow((data.x-(.55+progress*.45))/.045,2.));
   col*=available;col+=vec3(.58,.38,.80)*query*available;
  }
 `,{retire:{value:0}});
}
function makeContext(group){
 const a=arrays(),rows=24,columns=60;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)for(let micro=0;micro<3;micro++){
  const x=(col-29.5)*.285+(micro-1)*.052,z=3.2-row*.45;
  put(a,[x,0,z],C.white.clone().multiplyScalar(.30).toArray(),.043,[col/59,row/23,row]);
  put(a,[x,-.08,z-.11],C.violet.clone().multiplyScalar(.17).toArray(),.025,[col/59,row/23,row]);
 }
 return cloud(group,a,`
  float capacity=12.+2.*smoothstep(69.177533,69.65,time)+10.*smoothstep(69.70,71.0518,time);
  float written=1.-smoothstep(capacity-.7,capacity+.2,data.z);float target=1.-step(.1,abs(data.z-6.));
  float front=progress;float passed=1.-smoothstep(front-.013,front+.013,data.x);
  float marker=exp(-pow((data.x-front)/.026,2.));
  col*=.25+written*1.35;
  col=mix(col,vec3(.28,.13,.57)*(.2+passed),target);
  col+=vec3(.8,.68,1.05)*target*marker;
 `);
}
function makePacket(group){
 const a=arrays(),start=local(spatialTip(64.79036273199704,1)),end=[-18,0,0];
 for(let i=0;i<280;i++){
  const row=Math.floor(i/14),angle=(i%14)/14*Math.PI*2,r=.065;
  put(a,[row/19,Math.cos(angle)*r,Math.sin(angle)*r],C.violet.clone().lerp(C.white,.35).multiplyScalar(1.5).toArray(),.039,[0,0,0]);
 }
 const s=start.map(n=>n.toFixed(8)).join(','),e=end.join(',');
 return cloud(group,a,`float u=progress-position.x*.13;alpha=step(0.,u)*step(u,1.);p=mix(vec3(${s}),vec3(${e}),clamp(u,0.,1.))+vec3(0.,position.y,position.z);`);
}
function bead(scene,col){
 const core=new THREE.Mesh(new THREE.SphereGeometry(.105,20,12),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.8)}));scene.add(core);
 const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d'),grad=g.createRadialGradient(32,32,1,32,32,31);grad.addColorStop(0,'rgba(255,255,255,.9)');grad.addColorStop(.15,'rgba(255,255,255,.3)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,64,64);
 const tex=new THREE.CanvasTexture(cv),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));sprite.scale.setScalar(1.25);scene.add(sprite);
 return {core,sprite};
}
export async function createOrderedWorld(){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030207');
 const persp=new THREE.PerspectiveCamera(42,16/9,.1,500),ortho=new THREE.OrthographicCamera(-10,10,6,-6,.1,500);
 const target=new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,samples:4}),composer=new EffectComposer(renderer,target),renderPass=new RenderPass(scene,persp),bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.24,.42,.78);
 composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(new OutputPass());
 const spatial=new THREE.Group();spatial.position.set(...HELIX_CENTER);spatial.quaternion.copy(LOCAL_Q);scene.add(spatial);
 const groups={spatial};for(const name of ['tokens','wave','eyes','heads','context','pages','records','recall','retrieval']){groups[name]=new THREE.Group();scene.add(groups[name]);}
 const helix=makeHelix(scene),red=bead(scene,'#ff203e'),violet=bead(scene,'#bc8df7');
 const fields=makeFields(spatial),packet=makePacket(spatial),tokens=makeTokens(groups.tokens),wave=makeWave(groups.wave),eyes=await makeEyes(groups.eyes),heads=makeHeads(groups.heads),context=makeContext(groups.context);
 const memory=createMemory(groups,{cloud,arrays,put,C}),retrieval=createRetrieval(groups.retrieval,{cloud,arrays,put,C});
 const clouds=[...fields,packet,tokens,wave,eyes,heads,context,...memory.clouds,...retrieval.clouds];
 function frame(t,{noBloom=false}={}){
  const shot=shotAt(t),i=shot.index,c=cameraAt(t),camera=c.ortho?ortho:persp;
  camera.position.set(...c.position);camera.up.set(...c.up);camera.lookAt(...c.target);
  if(c.ortho){ortho.top=c.ortho/2;ortho.bottom=-c.ortho/2;ortho.left=-c.ortho*16/9/2;ortho.right=-ortho.left;}else persp.fov=c.fov;
  camera.updateProjectionMatrix();camera.updateMatrixWorld();renderPass.camera=camera;
  for(const [name,group] of Object.entries(groups))group.visible=name===shot.family;
  // The accepted entrance remains a hard cut. A later, isolated memory
  // insert reuses the same helix motion without the original chapter HUD.
  const flashing=i===17;
  helix.points.visible=false;
  for(const b of [red,violet])b.core.visible=b.sprite.visible=false;
  if(flashing){
   const remembered=flashbackTime(t);helix.frame(remembered);
   for(const [strand,b] of [[0,red],[1,violet]]){const p=spatialTip(remembered,strand);b.core.position.set(...p);b.sprite.position.set(...p);b.core.visible=b.sprite.visible=true;}
  }
  const focus=V(c.position).distanceTo(V(c.target));
  for(const cloud of clouds){const u=cloud.uniforms;u.time.value=t;u.hit.value=pulse(t,HITS[i]);u.pointScale.value=c.ortho?H/c.ortho:H/(2*Math.tan(c.fov*Math.PI/360));u.perspective.value=c.ortho?0:1;u.focus.value=focus;u.aperture.value=i===3?1.1:i===9?1.5:i===12?.7:i===17?.6:0;u.gain.value=1;}
  fields.forEach((f,j)=>{f.uniforms.progress.value=clamp((t-(HITS[j+1]-.05))/.40);f.uniforms.hit.value=pulse(t,HITS[j+1]);f.uniforms.gain.value=(j===1?1.12:.68)*(j===1?1:1-.80*ramp(t,65.65,65.92));});
  packet.points.visible=false;
  tokens.uniforms.progress.value=clamp((t-66.408533)/.4528);tokens.uniforms.gain.value=1.55;wave.uniforms.progress.value=clamp((t-66.861333)/.4702);wave.uniforms.gain.value=1.25;
  eyes.uniforms.progress.value=clamp((t-67.331533)/.4528);heads.uniforms.progress.value=clamp((t-67.784333)/.4644);heads.uniforms.gain.value=1.7;
  heads.uniforms.retire.value=0;
  if(i===18){wave.uniforms.progress.value=clamp((t-4399/60)/(.4702));wave.uniforms.gain.value=1.45;}
  if(i===19||i===20){heads.uniforms.progress.value=clamp((t-4428/60)/.9171);heads.uniforms.retire.value=.015+.30*ramp(t,73.8,74.71);heads.uniforms.gain.value=2;}
  if(i===24){eyes.uniforms.progress.value=clamp((t-76.549833)/.4644);eyes.uniforms.gain.value=.78;}
  context.uniforms.progress.value=ramp(t,68.248733,69.177533);context.uniforms.gain.value=1.6;
  const memoryState=memory.frame(t),retrievalState=retrieval.frame(t);
  bloom.enabled=!noBloom;bloom.strength=i===6?.20:.24;composer.render();
  const finite=[...c.position,...c.target,c.fov].every(Number.isFinite);
  return {canvas:renderer.domElement,version:VERSION,camera:c,finite,regularGrid:true,decorativeConnectionCount:0,helixVisible:flashing,flashbackTime:flashing?flashbackTime(t):null,bridgePacketVisible:false,lineFamily:(i===5||i===18)?'phase-locked-wave':i>=21&&i<=23?'four-parallel-read-bands':'none',particleCount:(flashing?helix.count:0)+clouds.reduce((n,x)=>n+(x.points.visible&&x.points.parent.visible?x.count:0),0),eyeSource:'assets/char/seran-avatar-user-20261110.png',noBloom,writeProgress:context.uniforms.progress.value,memory:memoryState,retrieval:retrievalState};
 }
 return {frame};
}
