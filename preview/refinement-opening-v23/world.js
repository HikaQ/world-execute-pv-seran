import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {RectAreaLightUniformsLib} from '/node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RoomEnvironment} from '/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import {ENTER,cameraAt,baseCameraAt,sideMoveAt,route,travel,ramp,mix,clamp,random,coreBreath,STARTUP_CUES,PERSONA_CUES,TEST_INPUT} from './score.js';
import {createBootSequence} from './boot-sequence.js';
import {createPersonaSequence} from './persona-sequence.js';
import {createNebula} from './nebula.js';
import {createParticleTitle,createSpatialCredits} from './intro-titles.js';
import {WORLD_NOTES,INPUT_NOTES,ANNOTATION_FONT} from './annotations.js';
import {createParticleTail} from './particle-tail.js';
import {createSeranSandbox} from './seran-sandbox.js';
import {submitLaunchAt,createSubmitLaunchPass} from './submit-launch.js';

const PURPLE=new THREE.Color('#b78bff'),RED=new THREE.Color('#ff193b'),WHITE=new THREE.Color('#dce2ff');
const mono='"JetBrains Mono"',sans='"Space Grotesk"';
const unitBox=new THREE.BoxGeometry(1,1,1),unitSphere=new THREE.SphereGeometry(1,12,8);
const v3=(a)=>new THREE.Vector3(...a),dummy=new THREE.Object3D();
function texture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function textTexture(title,subtitle='',color='#ddd8ee',w=1024,h=220){
 const [c,g]=canvas(w,h);g.fillStyle=color;g.font=`500 70px ${sans}`;g.fillText(title,32,102);g.font=`500 29px ${mono}`;g.fillStyle='#9188ae';g.fillText(subtitle,35,163);
 if(WORLD_NOTES[title]){g.font=`600 28px ${ANNOTATION_FONT}`;g.fillStyle='#b0a0c4';g.fillText(WORLD_NOTES[title],35,208);}return texture(c);
}
function textPlane(title,sub,w=6,color='#ddd8ee'){
 const mat=new THREE.MeshBasicMaterial({map:textTexture(title,sub,color),transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*220/1024),mat);m.renderOrder=3;return m;
}
function edges(group,w,h,d,material,thickness=.065){
 const mesh=new THREE.InstancedMesh(unitBox,material,12);let i=0;
 for(let axis=0;axis<3;axis++)for(const a of [-1,1])for(const b of [-1,1]){
  const pos=[0,0,0],size=[thickness,thickness,thickness],dim=[w,h,d],axes=[0,1,2].filter(x=>x!==axis);pos[axes[0]]=a*dim[axes[0]]/2;pos[axes[1]]=b*dim[axes[1]]/2;size[axis]=dim[axis];
  dummy.position.set(...pos);dummy.rotation.set(0,0,0);dummy.scale.set(...size);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);
 }mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function stars(scene){
 const count=13500,rnd=random(9026),p=new Float32Array(count*3),c=new Float32Array(count*3),size=new Float32Array(count);
 for(let i=0;i<count;i++){
  const a=rnd()*Math.PI*2,r=9+Math.pow(rnd(),.7)*175,z=30-rnd()*620;p.set([Math.cos(a)*r,Math.sin(a)*r*.64,z],i*3);
  const color=i%11===0?RED:PURPLE.clone().lerp(WHITE,rnd());c.set(color.toArray().map(v=>v*(.2+rnd()*.65)),i*3);size[i]=.6+rnd()*1.6;
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.setAttribute('dotSize',new THREE.BufferAttribute(size,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{gain:{value:0},speed:{value:0},pixelRatio:{value:1.5}},
  vertexShader:`attribute vec3 color;attribute float dotSize;uniform float gain,speed,pixelRatio;varying vec3 tint;varying vec2 flow;varying float stretch;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec4 clip=projectionMatrix*mv;float z=max(1.,-mv.z);flow=normalize(clip.xy+vec2(.0001));stretch=1.+speed*min(12.,150./z);gl_PointSize=pixelRatio*min(28.,dotSize*(.7+80./z)*stretch);gl_Position=clip;tint=color*gain*(.45+.55*min(1.,z/20.));if(mv.z>-.2)gl_PointSize=0.;}`,
  fragmentShader:`varying vec3 tint;varying vec2 flow;varying float stretch;void main(){vec2 p=gl_PointCoord-.5;float along=dot(p,flow),across=dot(p,vec2(-flow.y,flow.x));float ink=exp(-along*along*24.-across*across*24.*stretch*stretch);if(ink<.008)discard;gl_FragColor=vec4(tint*ink,1.);}`});
 const cloud=new THREE.Points(geo,mat);cloud.frustumCulled=false;scene.add(cloud);return mat;
}
function core(scene){
 const count=48000,rnd=random(73816),p=new Float32Array(count*3),seed=new Float32Array(count),radius=new Float32Array(count);
 for(let i=0;i<count;i++){
  const r=Math.sqrt(rnd()),a=rnd()*Math.PI*2,z=(rnd()+rnd()+rnd()-1.5)*.29*Math.sqrt(1-r*r);
  p.set([1.85*r*Math.cos(a),1.85*r*Math.sin(a),z],i*3);seed[i]=rnd();radius[i]=r;
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('seed',new THREE.BufferAttribute(seed,1));geo.setAttribute('radius',new THREE.BufferAttribute(radius,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},ignite:{value:0},gain:{value:0},modelScale:{value:1},pixelRatio:{value:1.5}},
  vertexShader:`attribute float seed,radius;uniform float time,ignite,gain,modelScale,pixelRatio;varying vec3 tint;
   void main(){vec3 p=position;p+=.012*vec3(sin(seed*131.+time*.65),cos(seed*79.+time*.48),sin(seed*193.+time*.7));vec4 mv=modelViewMatrix*vec4(p,1.);float depth=max(.3,-mv.z);
    gl_Position=projectionMatrix*mv;gl_PointSize=pixelRatio*clamp((.013+.011*seed)*1460./depth,1.0,4.2);
    float density=.45+.55*pow(1.-radius,.4);float natural=.65+.35*sin(seed*137.+position.x*2.7)*sin(position.y*2.1+seed*13.);
    vec3 gray=vec3(.045,.049,.057)*(.65+.35*seed);vec3 red=vec3(2.2,.003,.008)*density*natural;
    float retained=max(.0015,modelScale*modelScale);float keep=1.-smoothstep(retained*.85,retained,seed);
    tint=mix(gray,red,ignite)*gain*keep;}`,
  fragmentShader:`varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*23.);if(a<.008)discard;gl_FragColor=vec4(tint*a,1.);}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
 const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{gain:{value:0}},
  vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 uv0;uniform float gain;void main(){vec2 p=(uv0-.5)*2.;float a=exp(-dot(p,p)*4.8)*pow(1.-smoothstep(.65,1.,length(p)),2.);gl_FragColor=vec4(vec3(.30,.0003,.001)*a*gain,1.);}'});
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(7.3,7.3),glowMat);scene.add(glow);return {points,mat,count,glow,glowMat};
}
function dataTexture(kind){
 const [c,g]=canvas(768,512);g.fillStyle='#11101c';g.fillRect(0,0,768,512);const rnd=random(272+kind);
 g.strokeStyle='#383146';g.lineWidth=1;g.strokeRect(15,15,738,482);g.font=`500 23px ${mono}`;g.fillStyle='#c4b3e1';g.fillText(['LOCAL RUNTIME','CONTEXT BUFFER','MATRIX / FLOAT32','REQUEST QUEUE'][kind],35,57);
 g.strokeStyle='#4c405e';g.beginPath();g.moveTo(35,82);g.lineTo(733,82);g.stroke();
 if(kind%2===0){for(let y=0;y<16;y++)for(let x=0;x<30;x++){const k=rnd(),value=Math.round(28+k*130);g.fillStyle=`rgb(${value},${Math.round(value*.75)},${Math.min(255,value+48)})`;g.fillRect(36+x*23,111+y*22,15,13);}}
 else{
  const lines=['const context = [];','sandbox.scope = "local";','await runtime.ready();','queue.push(request);','state: uninitialized','threads: 01 / isolated','buffer.write(0x03A1);','resolve(input, context);','return { status: "idle" };','policy.allow = ["local"];'];
  g.font=`500 24px ${mono}`;lines.forEach((s,i)=>{g.fillStyle=i%3===0?'#bc8cdb':'#817b97';g.fillText(String(i+1).padStart(2,'0'),32,118+i*35);g.fillStyle=i%3===0?'#cec2e2':'#aaa4b9';g.fillText(s,87,118+i*35);});
 }return texture(c);
}
function tensor(group,w,h,d,seed){
 const rnd=random(seed),points=[],colors=[];
 for(let z=0;z<4;z++)for(let y=0;y<6;y++)for(let x=0;x<8;x++){points.push((x/7-.5)*w*.76,(y/5-.5)*h*.68,(z/3-.5)*d*.65);const q=rnd()>.82;colors.push(...(q?WHITE:PURPLE).toArray().map(v=>v*(q?.9:.3)));}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const m=new THREE.Points(geo,new THREE.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));group.add(m);return m;
}
function sandbox(scene,materials,textures,{position,w=6,h=4,d=4,seed=1,hero=false}){
 const g=new THREE.Group();g.position.set(...position);scene.add(g);
 const rails=edges(g,w,h,d,hero?materials.heroFrame:materials.frame,hero?.095:.065);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(w,.045,d),materials.floor);floor.position.y=-h/2;floor.receiveShadow=true;g.add(floor);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(w*.97,h*.96),materials.back);back.position.z=-d/2;back.receiveShadow=true;back.visible=!hero;g.add(back);
 const scan=new THREE.Mesh(new THREE.PlaneGeometry(w*.88,h*.86),new THREE.MeshStandardMaterial({map:textures[seed%4],emissiveMap:textures[seed%4],emissive:'#bca1ff',emissiveIntensity:.53,roughness:.65,metalness:.16,side:THREE.DoubleSide}));scan.position.z=-d/2+.035;g.add(scan);
 const bars=new THREE.InstancedMesh(unitBox,materials.accent,4);for(let i=0;i<4;i++){dummy.position.set((i<2?-1:1)*w/2,(i%2?-1:1)*h/2,d/2);dummy.scale.set(w*.15,.032,.055);dummy.rotation.set(0,0,0);dummy.updateMatrix();bars.setMatrixAt(i,dummy.matrix);}g.add(bars);
 const label=textPlane(hero?'SERAN / LOCAL INSTANCE':`SANDBOX ${String(seed).padStart(3,'0')}`,hero?'RUNTIME  /  ISOLATED':'LOCAL / '+(seed%3?'READY':'IDLE'),hero?11:w*.84,hero?'#eee7ff':'#a29ab6');label.position.set(0,h/2+.6,d/2+.05);g.add(label);
 if(!hero)tensor(g,w,h,d,seed);
 const pulse=new THREE.Mesh(new THREE.PlaneGeometry(w*.86,.035),new THREE.MeshBasicMaterial({color:'#bc9de8',transparent:true,opacity:.5}));pulse.position.z=-d/2+.06;g.add(pulse);pulse.visible=!hero;
 if(!hero&&seed%3===0){
  // Volumetric kernels break up the flat code-panel silhouettes.
  back.visible=false;floor.visible=false;scan.scale.set(.45,.45,1);scan.position.set(-w*.2,h*.12,-d/2);
  const bits=new THREE.InstancedMesh(unitBox,materials.kernel,64);let index=0;
  for(let z=0;z<4;z++)for(let y=0;y<4;y++)for(let x=0;x<4;x++){dummy.position.set((x-1.5)*w*.2,(y-1.5)*h*.22,(z-1.5)*d*.22);dummy.rotation.set(0,0,0);dummy.scale.setScalar(Math.min(w,h,d)*.045);dummy.updateMatrix();bits.setMatrixAt(index++,dummy.matrix);}g.add(bits);
 }
 return {group:g,scan,label,rails,hero,position,pulse,height:h,seed};
}
function hypercube(scene,materials){
 const group=new THREE.Group();group.position.set(7.8,2.7,-191);scene.add(group);
 const vertices=Array.from({length:16},(_,i)=>[0,1,2,3].map(k=>(i>>k&1)?1:-1)),pairs=[];
 for(let a=0;a<16;a++)for(let k=0;k<4;k++)if(a<(a^(1<<k)))pairs.push([a,a^(1<<k)]);
 const bars=new THREE.InstancedMesh(unitBox,materials.hyper,32),nodes=new THREE.InstancedMesh(unitSphere,materials.node,16);group.add(bars,nodes);
 const label=textPlane('STATE SPACE / R⁴','(x, y, z, w) → projection',7.8);label.position.set(0,7.7,0);group.add(label);
 const axisY=new THREE.Vector3(0,1,0);
 function frame(t){
  const a=.32+(t-24)*.34,b=.2+(t-24)*.19;
  const p=vertices.map(([x,y,z,w])=>{const xx=x*Math.cos(a)-w*Math.sin(a),ww=x*Math.sin(a)+w*Math.cos(a),yy=y*Math.cos(b)-ww*Math.sin(b),www=y*Math.sin(b)+ww*Math.cos(b),f=4.2/(4.2-www);return new THREE.Vector3(xx*f*4.0,yy*f*4.0,z*f*4.0);});
  pairs.forEach(([a,b],i)=>{const d=p[b].clone().sub(p[a]);dummy.position.copy(p[a]).add(p[b]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(axisY,d.clone().normalize());dummy.scale.set(.055,d.length(),.055);dummy.updateMatrix();bars.setMatrixAt(i,dummy.matrix);});
  p.forEach((p,i)=>{dummy.position.copy(p);dummy.quaternion.identity();dummy.scale.setScalar(.105);dummy.updateMatrix();nodes.setMatrixAt(i,dummy.matrix);});bars.instanceMatrix.needsUpdate=true;nodes.instanceMatrix.needsUpdate=true;
  return p.every(p=>Number.isFinite(p.x+p.y+p.z));
 }return {group,frame,edges:pairs.length,vertices:vertices.length};
}

export async function createWorld(){
 RectAreaLightUniformsLib.init();
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});renderer.setSize(2880,1620,false);renderer.setPixelRatio(1);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030309');scene.fog=new THREE.FogExp2('#080610',.035);
 const camera=new THREE.PerspectiveCamera(38,16/9,.1,900);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.045).texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
 const target=new THREE.WebGLRenderTarget(2880,1620,{type:THREE.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(2880,1620),.35,.4,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
 const submitPalette=createSubmitLaunchPass();composer.addPass(submitPalette.pass);
 const ambient=new THREE.HemisphereLight('#b4a9d9','#292037',.12);scene.add(ambient);
 const redLight=new THREE.PointLight('#ff1736',0,45,2);scene.add(redLight);
 const key=new THREE.SpotLight('#eadbff',160,110,.68,.7,1.7);key.position.set(-6,10,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;scene.add(key,key.target);
 const fill=new THREE.RectAreaLight('#a77dff',6,18,12);fill.position.set(11,8,-14);fill.lookAt(0,0,-30);scene.add(fill);
 const cool=new THREE.PointLight('#9d90ff',110,65,1.8);cool.position.set(-12,5,-115);scene.add(cool);
 const following=new THREE.PointLight('#b59fff',170,70,1.8);scene.add(following);
 const materials={
  frame:new THREE.MeshStandardMaterial({color:'#50475e',metalness:.72,roughness:.3,envMapIntensity:.75}),
  heroFrame:new THREE.MeshPhysicalMaterial({color:'#80718e',metalness:.5,roughness:.4,clearcoat:.3,envMapIntensity:.65}),
  floor:new THREE.MeshStandardMaterial({color:'#262031',metalness:.5,roughness:.33,envMapIntensity:.6}),
  back:new THREE.MeshStandardMaterial({color:'#211a2c',metalness:.15,roughness:.6,side:THREE.DoubleSide}),
  accent:new THREE.MeshBasicMaterial({color:new THREE.Color('#a97cf6').multiplyScalar(1.65)}),
  hyper:new THREE.MeshPhysicalMaterial({color:'#a184c2',metalness:.35,roughness:.44,emissive:'#684ba5',emissiveIntensity:.17,clearcoat:.3}),
  node:new THREE.MeshStandardMaterial({color:'#e6d9ff',emissive:'#a98bce',emissiveIntensity:.35,metalness:.3,roughness:.4}),
  kernel:new THREE.MeshStandardMaterial({color:'#8a70a9',emissive:'#573d85',emissiveIntensity:.3,metalness:.3,roughness:.45})
 };
 const eye=core(scene),star=stars(scene),haze=createNebula(scene,camera),textures=[0,1,2,3].map(dataTexture);
 const title=createParticleTitle(scene,camera),credits=createSpatialCredits(scene,camera),tail=createParticleTail(scene,camera);
 eye.glow.renderOrder=5;eye.points.renderOrder=6;
 const stage=new THREE.Group();scene.add(stage);
 // No scaled reflective floor: it used to pass close to the point light during
 // reveal, creating the white-red flare mistaken for a downward laser beam.
 const boot=createBootSequence(scene),persona=await createPersonaSequence(scene);
 const stagePanels=[];for(let i=0;i<6;i++){
  const side=i%2?-1:1,z=-3-Math.floor(i/2)*4.4,g=new THREE.Group();g.position.set(side*(5.4+Math.floor(i/2)*.5),.3,z);g.rotation.y=side*-.20;stage.add(g);
  const back=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.5,.1),materials.frame);back.receiveShadow=true;back.castShadow=true;g.add(back);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.05,2.34),new THREE.MeshStandardMaterial({map:textures[i%4],emissiveMap:textures[i%4],emissive:'#9980bc',emissiveIntensity:.4,roughness:.6}));face.position.z=.06;g.add(face);
  const scan=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.02),new THREE.MeshBasicMaterial({color:'#c1a4ee',transparent:true,opacity:.65}));scan.position.z=.07;g.add(scan);
  stagePanels.push({group:g,scan,start:STARTUP_CUES.entry+Math.floor(i/2)*.48+(i%2)*.10,position:g.position.clone()});
 }
 const gates=[];for(let i=0;i<8;i++){
  const g=new THREE.Group();g.position.set(0,0,-9-i*8.2);g.rotation.z=Math.sin(i*.5)*.06;scene.add(g);edges(g,10.8+i*.24,7.0+i*.18,.6,materials.frame,.10);
  const strips=new THREE.Group();edges(strips,10.75+i*.24,6.95+i*.18,.015,materials.accent,.017);g.add(strips);gates.push({g,strips,start:16.85+i*.27});
 }
 const islands=[];const rnd=random(24862);
 for(let i=0;i<43;i++){
  const z=-82-i*4.45-rnd()*8,angle=i*2.39996,radius=11+rnd()*23,base=route(13.6-z),size=3+rnd()*4;
  const s=sandbox(scene,materials,textures,{position:[base[0]+Math.cos(angle)*radius,base[1]+Math.sin(angle)*radius*.65,z],w:size*1.5,h:size,d:size*.9,seed:i+1});
  s.group.rotation.set((rnd()-.5)*.20,(rnd()-.5)*.34,(rnd()-.5)*.12);islands.push(s);
 }
 const giantA=sandbox(scene,materials,textures,{position:[-18,-3,-112],w:15,h:10,d:8,seed:61});giantA.group.rotation.y=.18;islands.push(giantA);
 const giantB=sandbox(scene,materials,textures,{position:[25,12,-155],w:17,h:12,d:9,seed:62});giantB.group.rotation.y=-.2;islands.push(giantB);
 const heroLight=new THREE.PointLight('#af8fff',75,65,1.8);heroLight.position.set(13,7,-270);scene.add(heroLight);
 const hyper=hypercube(scene,materials);
 // A lattice inside the selected empty sandbox becomes the next geometric world.
 const latticeP=[],latticeC=[];for(let z=0;z<16;z++)for(let y=0;y<14;y++)for(let x=0;x<22;x++){latticeP.push(13+(x-10.5)*.82,3.5+(y-6.5)*.7,-288-z*1.4);const c=(x+y+z)%7===0?WHITE:PURPLE;latticeC.push(...c.toArray().map(v=>v*.48));}
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(latticeP,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(latticeC,3));
 const lattice=new THREE.Points(lg,new THREE.PointsMaterial({size:.075,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));scene.add(lattice);
 const hero=createSeranSandbox(scene,camera,lattice);
 const terminal=new THREE.Group();terminal.position.set(0,-.1,-3.2);scene.add(terminal);
 const terminalMat=new THREE.MeshBasicMaterial({color:'#100b18',transparent:true});const base=new THREE.Mesh(new THREE.BoxGeometry(8.8,2.48,.13),terminalMat);terminal.add(base);
 const [tc,tg]=canvas(2048,576),terminalTexture=texture(tc),tm=new THREE.MeshBasicMaterial({map:terminalTexture,transparent:true,depthWrite:false});
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(8.65,2.43),tm);screen.position.z=.075;terminal.add(screen);
 const launchOutline=new THREE.Group(),launchOutlineMat=new THREE.MeshBasicMaterial({color:'#bca0e2',transparent:true});
 const launchFrame=edges(launchOutline,8.8,2.48,.14,launchOutlineMat,.018);
 launchFrame.castShadow=false;launchFrame.receiveShadow=false;terminal.add(launchOutline);launchOutline.visible=false;
 function terminalText(t){
  tg.clearRect(0,0,2048,576);tg.fillStyle='#9586ac';tg.font=`500 34px ${mono}`;tg.fillText('LOCAL SESSION / INPUT',105,78);tg.fillStyle='#b69bd5';tg.fillText('RUNTIME READY',1430,78);
  tg.font=`600 28px ${ANNOTATION_FONT}`;tg.fillStyle='#a394b7';tg.fillText(INPUT_NOTES.session,105,127);tg.fillText(INPUT_NOTES.ready,1430,127);
  tg.strokeStyle='#51455f';tg.lineWidth=2;tg.beginPath();tg.moveTo(105,145);tg.lineTo(1943,145);tg.stroke();
  const keyTimes=TEST_INPUT.keyFrames.map(f=>f/60),completeAt=keyTimes.at(-1);
  const typed='test'.slice(0,keyTimes.filter(at=>t>=at).length),submitted=t>=ENTER;
  const waiting=t>=completeAt&&!submitted,cursorVisible=!submitted&&(t<completeAt||Math.floor((t-completeAt)/.5)%2===0);
  tg.font=`500 106px ${mono}`;tg.fillStyle='#cbb7e4';tg.fillText('HIKAQ',105,319);tg.fillStyle='#eee9f6';tg.fillText('>',484,319);tg.fillText(typed,600,319);
  if(cursorVisible){const x=600+tg.measureText(typed).width;tg.fillStyle='#dbb8ff';tg.fillRect(x+12,232,7,107);}
  tg.font=`500 30px ${mono}`;tg.fillStyle=submitted?'#dfbfff':'#7c738b';tg.fillText(submitted?'request_0001  →  queued':'sandbox://local  ·  UTF-8  ·  isolated',105,456);
  const annotation=submitted?INPUT_NOTES.submitted:waiting?INPUT_NOTES.waiting:INPUT_NOTES.typing;
  tg.font=`600 36px ${ANNOTATION_FONT}`;tg.fillStyle='#b3a2c9';tg.fillText(annotation,105,520);
  if(submitted){tg.fillStyle='#dfbaff';tg.fillRect(1762,227,170,112);}
  tg.strokeStyle=submitted?'#d7b2ff':'#655576';tg.lineWidth=submitted?4:2;tg.strokeRect(1762,227,170,112);tg.fillStyle=submitted?'#251036':'#ad95c6';tg.font=`500 62px ${sans}`;tg.fillText('↵',1814,303);
  terminalTexture.needsUpdate=true;return {typed,submitted,waiting,cursorVisible,annotation,panelStart:TEST_INPUT.panelStart,panelReady:TEST_INPUT.panelReady,keyTimes,completeAt,holdDuration:ENTER-completeAt};
 }
 function frame(t){
  const cam=cameraAt(t);camera.position.set(...cam.position);camera.lookAt(...cam.target);camera.fov=cam.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const awake=ramp(t,5.2,5.95),build=ramp(t,STARTUP_CUES.entry,STARTUP_CUES.shrinkEnd),space=ramp(t,ENTER-.2,23.1),visible=ramp(t,4.45,4.95);
  scene.background.setRGB(.002*space,.0015*space,.006*space);scene.fog.density=mix(.043,.0015,space);
  scene.environmentIntensity=mix(.12,.72,space);ambient.intensity=mix(.06,.34,space);
  const breath=coreBreath(t),personaState=persona.frame(t),eyeLink=personaState.eyeLink;
  eye.mat.uniforms.time.value=t;eye.mat.uniforms.ignite.value=awake;eye.mat.uniforms.gain.value=visible*breath.core;
  const shrink=mix(1,.14,build),flight=ramp(t,ENTER,ENTER+.65);
  // The core and the vanishing point share the exact optical axis, including
  // the curved part of the route. Shrinking no longer lifts the core upward.
  const beacon=v3(cam.target);
  eye.points.position.set(mix(0,beacon.x,flight),mix(0,beacon.y,flight),mix(-4.6*build,beacon.z,flight));
  eye.points.scale.setScalar(mix(shrink,.013,flight));eye.points.rotation.y=.055*Math.sin(t*.22);
  eye.points.position.lerp(v3(eyeLink.anchor),eyeLink.weight);eye.points.scale.setScalar(mix(eye.points.scale.x,eyeLink.scale,eyeLink.weight));
  const irisGain=mix(1,eyeLink.gain,eyeLink.weight);eye.mat.uniforms.gain.value*=irisGain;
  eye.mat.uniforms.modelScale.value=eye.points.scale.x;eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(Math.max(.10,eye.points.scale.x));eye.glowMat.uniforms.gain.value=awake*visible*mix(.75,1.3,flight)*breath.halo;
  eye.glowMat.uniforms.gain.value*=irisGain;
  redLight.position.copy(eye.points.position);redLight.intensity=awake*mix(18,16,flight)*breath.lighting*irisGain;
  const clearance=ramp(t,PERSONA_CUES.prepare,PERSONA_CUES.prepare+.95)*(1-ramp(t,17.1,18.0));
  stage.visible=t>STARTUP_CUES.entry&&t<22;stage.scale.setScalar(1);stagePanels.forEach(p=>{const u=ramp(t,p.start,p.start+.75),scan=ramp(t,p.start+.5,19.6);p.group.visible=u>.001;p.group.scale.y=Math.max(.001,u);p.group.position.copy(p.position);p.group.position.x+=Math.sign(p.position.x)*4.0*clearance;p.group.position.z-=2*(1-u);p.scan.position.y=mix(.7,-.95,scan);p.scan.material.opacity=.6*Math.sin(scan*Math.PI);});
  gates.forEach(({g,strips,start})=>{const u=ramp(t,start,start+.9);g.scale.setScalar(Math.max(.001,u));strips.visible=u>.02;});
  key.intensity=visible*mix(120,210,space);key.position.copy(camera.position).add(new THREE.Vector3(-8,11,-4));key.target.position.copy(camera.position).add(new THREE.Vector3(0,-2,-25));
  fill.position.copy(camera.position).add(new THREE.Vector3(12,8,-24));fill.lookAt(camera.position.x,0,camera.position.z-38);fill.intensity=mix(2,8,space);
  following.position.copy(camera.position).add(new THREE.Vector3(-6,4,-14));following.intensity=space*95;
  star.uniforms.gain.value=space*.95;star.uniforms.speed.value=clamp((cam.speed-15)/43);
  const nebulaState=haze.frame(space*1.2),titleState=title.frame(t,eye.points.position),creditState=credits.frame(t);
  const submitLaunch=submitLaunchAt(t);
  terminal.visible=t>TEST_INPUT.panelStart&&t<submitLaunch.windowEnd;
  const ta=ramp(t,TEST_INPUT.panelStart,TEST_INPUT.panelReady)*submitLaunch.opacity;
  terminal.position.set(0,submitLaunch.y,submitLaunch.z);terminal.rotation.x=0;
  terminal.scale.setScalar(.76*mix(.96,1,ramp(t,TEST_INPUT.panelStart,TEST_INPUT.panelReady)));
  terminalMat.opacity=ta;tm.opacity=ta;launchOutlineMat.opacity=ta;
  launchOutline.visible=submitLaunch.submitted&&terminal.visible;
  // Keep the submitted card legible while it crosses the initially dense
  // tunnel fog; its perspective motion, rather than fog, carries it away.
  for(const material of [terminalMat,tm,launchOutlineMat]){
   const fog=!submitLaunch.active;if(material.fog!==fog){material.fog=fog;material.needsUpdate=true;}
  }
  const input=terminalText(t),hyperFinite=hyper.frame(t),bootState=boot.frame(t);
  islands.forEach(s=>{const u=(t*.18+s.seed*.131)%1;s.group.visible=t>=21;s.label.material.opacity=ramp(t,21,22.4);s.pulse.position.y=(.5-u)*s.height*.8;s.pulse.material.opacity=.45*Math.sin(u*Math.PI);});
  hyper.group.visible=t>=21;
  const sandboxState=hero.frame(t,eye.points.position);
  const tailState=tail.frame(t,eye.points.position);
  bloom.strength=.31+awake*.10*(1-space);submitPalette.frame(submitLaunch);composer.render();
  const cardCorners=[[-4.4,-1.24],[4.4,-1.24],[-4.4,1.24],[4.4,1.24]].map(([x,y])=>new THREE.Vector3(x,y,.075).applyMatrix4(terminal.matrixWorld).project(camera));
  const cardBounds=[Math.min(...cardCorners.map(v=>(v.x+1)*960)),Math.min(...cardCorners.map(v=>(1-v.y)*540)),Math.max(...cardCorners.map(v=>(v.x+1)*960)),Math.max(...cardCorners.map(v=>(1-v.y)*540))];
  const submitState={...submitLaunch,windowVisible:terminal.visible,windowPosition:terminal.position.toArray(),windowScale:terminal.scale.toArray(),windowBounds:cardBounds,windowOpacity:ta,hasPhysicalForwardMotion:true};
  const center=eye.points.position.clone().project(camera),iris=v3(eyeLink.anchor).project(camera);
  const baseView=baseCameraAt(t),sideMove=sideMoveAt(t),coreDistance=camera.position.distanceTo(eye.points.position);
  return {canvas:renderer.domElement,camera:cam,sideMove,tail:tailState,sandbox:sandboxState,submitLaunch:submitState,core:{particleCount:eye.count,radialBands:false,ignite:awake,visible:visible>0,screenCenter:[(center.x+1)*960,(1-center.y)*540],worldPosition:eye.points.position.toArray(),cameraDistance:coreDistance,baselineDistance:Math.hypot(...baseView.position.map((x,i)=>x-baseView.target[i])),eyeLocked:eyeLink.weight>.999,irisScreen:[(iris.x+1)*960,(1-iris.y)*540],breath},boot:bootState,persona:personaState,input,hyper:{vertices:16,edges:32,finite:hyperFinite},sandboxCount:islands.length+1,
   startup:{cue:STARTUP_CUES.entry,panelsVisible:stage.visible?stagePanels.filter(p=>p.group.visible).length:0,panelStarts:stagePanels.map(p=>p.start),coreShrink:build,workspaceOpen:clearance,workspaceCue:PERSONA_CUES.prepare},lighting:{pbr:true,environment:scene.environmentIntensity,redLight:redLight.intensity,shadowCasting:true,rayTraced:false},nebula:nebulaState,particleTitle:titleState,credits:creditState};
 }
 return {frame,renderer,scene,camera};
}
