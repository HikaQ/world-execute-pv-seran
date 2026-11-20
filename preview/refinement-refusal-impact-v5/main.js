import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createGlassPortrait} from './glass.js';
import {drawPong} from '../refinement-refusal-impact-v3/pong.js';

const W=1920,H=1080,FIRST=8304,END=8637;
const out=document.querySelector('#film');out.width=W;out.height=H;
const g=out.getContext('2d',{alpha:false});
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();scene.background=new THREE.Color('#04070b');
scene.fog=new THREE.FogExp2('#04070b',.010);
const camera=new THREE.PerspectiveCamera(50,W/H,.04,260);
const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(room,.12).texture;scene.environmentIntensity=.22;room.dispose();pmrem.dispose();
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W,H),.20,.34,1.12));composer.addPass(new OutputPass());
scene.add(new THREE.HemisphereLight('#d9e3f2','#020309',.38));
const key=new THREE.DirectionalLight('#e3eaf7',3.5);key.position.set(-12,18,8);scene.add(key);
const under=new THREE.DirectionalLight('#cbd6e8',1.25);under.position.set(-6,-12,12);scene.add(under);
const fill=new THREE.DirectionalLight('#a49db5',.45);fill.position.set(13,3,-26);scene.add(fill);
const pool=new THREE.SpotLight('#e6efff',360,100,Math.PI/3,.8,2);pool.position.set(-7,-7,6);pool.target.position.set(0,8,-25);scene.add(pool,pool.target);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

function surfaceTexture(){
 const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
 x.fillStyle='#798393';x.fillRect(0,0,1024,1024);
 for(let y=0;y<1024;y+=2){const v=103+Math.round(hash(y)*32);x.fillStyle=`rgb(${v},${v+6},${v+13})`;x.fillRect(0,y,1024,1);}
 for(let col=0;col<12;col++)for(let row=0;row<58;row++){
  const h=hash(col*83+row*3),px=20+col*84,py=12+row*17;
  x.fillStyle=h>.55?'#b2bdcc':'#566171';x.fillRect(px,py,10+Math.floor(h*52),1);
  if(h>.68){x.fillStyle='#525e70';x.fillRect(px+64,py-2,3,5);}
 }
 x.strokeStyle='#353f51';x.lineWidth=2;for(const p of [8,1016]){x.beginPath();x.moveTo(p,0);x.lineTo(p,1024);x.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
const grain=surfaceTexture();
const metal=new THREE.MeshStandardMaterial({color:'#445167',map:grain,metalness:.46,roughness:.62});
const dark=new THREE.MeshStandardMaterial({color:'#141d2c',map:grain,metalness:.66,roughness:.41});
const pale=new THREE.MeshStandardMaterial({color:'#7c8ca4',map:grain,metalness:.52,roughness:.56});
const whiteLine=new THREE.LineBasicMaterial({color:'#8999b1',transparent:true,opacity:.42});
const red=new THREE.MeshBasicMaterial({color:new THREE.Color('#e03f62').multiplyScalar(2.2)});
const silver=new THREE.MeshBasicMaterial({color:new THREE.Color('#c9d7ef').multiplyScalar(1.2)});
function box(parent,w,h,d,mat,pos){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(...pos);parent.add(m);return m;}
function edge(parent,w,h,d,opacity=.42){const geo=new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));const mat=whiteLine.clone();mat.opacity=opacity;const e=new THREE.LineSegments(geo,mat);parent.add(e);return e;}
function dots(parent,positions,color,size,opacity=.7){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const m=new THREE.Points(geo,new THREE.PointsMaterial({color,size,transparent:true,opacity,depthWrite:false,sizeAttenuation:true}));parent.add(m);return m;}

// Only true contour edges are drawn: no triangulation, fill, or hidden mesh faces.
function wireBox(parent,w,h,d,pos,color='#9eabc4',opacity=.42){
 const geometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
 const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
 const lines=new THREE.LineSegments(geometry,material);lines.position.set(...pos);parent.add(lines);return lines;
}
function segmentLines(parent,positions,color,opacity=.5){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const material=new THREE.LineBasicMaterial({color:new THREE.Color(color),transparent:true,opacity,depthWrite:false});
 const lines=new THREE.LineSegments(geometry,material);parent.add(lines);return lines;
}
function particles(parent,positions,color,size,opacity=.55){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const strengths=positions.filter((_,i)=>i%3===0).map((_,i)=>.45+.55*hash(i*17));
 geometry.setAttribute('strength',new THREE.Float32BufferAttribute(strengths,1));
 const material=new THREE.ShaderMaterial({
  uniforms:{tint:{value:new THREE.Color(color)},size:{value:size},alpha:{value:opacity},fogDensity:{value:.014}},
  vertexShader:`attribute float strength; uniform float size; varying float vStrength; varying float vDepth; varying float vPixel;
   void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vDepth=-p.z;vStrength=strength;float s=size*660.0/max(.2,-p.z);vPixel=s;gl_PointSize=clamp(s,.75,2.8);gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform vec3 tint;uniform float alpha;uniform float fogDensity;varying float vStrength;varying float vDepth;varying float vPixel;
   void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;float edge=1.0-smoothstep(.35,1.0,r);float fade=exp(-fogDensity*fogDensity*vDepth*vDepth);float resolve=smoothstep(.12,.65,vPixel);gl_FragColor=vec4(tint,alpha*vStrength*edge*fade*resolve);}`,
  transparent:true,depthWrite:false,blending:THREE.NormalBlending,
 });
 const cloud=new THREE.Points(geometry,material);parent.add(cloud);return cloud;
}

// S14: the thin game image is revealed to sit above a deep, stratified readout.
const canyon=new THREE.Group();scene.add(canyon);const strata=[];
for(const side of [-1,1]){
 for(let layer=0;layer<64;layer++){
  const group=new THREE.Group();canyon.add(group);
  const width=17.5,depth=81,thick=.14,inner=1.35+hash(layer+side*100)*.18;
  const x=side*(width/2+inner),y=-layer*.225;
  if(layer%4===0)wireBox(group,width,thick,depth,[x,y,-28],layer%8===0?'#bdafce':'#7386a5',layer%8===0?.42:.24);
  else segmentLines(group,[side*inner,y+.071,12.5,side*inner,y+.071,-68.5],'#7386a5',.12);
  if(layer%8===0){
   const guide=[];
   for(let zi=0;zi<4;zi++){const z=11.2-zi*27.0;guide.push(side*inner,y+.071,z,side*(inner+width),y+.071,z);}
   segmentLines(group,guide,'#8b9ab8',.14);
  }
  if(layer===6||layer===29)segmentLines(group,[side*(inner+.005),y+.075,12.5,side*(inner+.005),y+.075,-68.5],'#e95a7c',.82);
  // Structured particles define each open layer, with no opaque sheet beneath.
  const ps=[];
  for(let zi=0;zi<270;zi++)for(let xi=0;xi<8;xi++){
   if(hash(layer*251+zi*17+xi*41+side*7)<.28)continue;
   ps.push(side*(inner+.03+xi*.41),y+.076,12.3-zi*.30);
  }
  particles(group,ps,layer%9===0?'#c9b4df':'#a6bbd8',.024,.55);
  strata.push({group,side,layer,seed:hash(layer*3+side*100)});
 }
}
const canyonFront=new THREE.Group();canyon.add(canyonFront);
wireBox(canyonFront,4.2,.16,4.5,[-2.9,-4.0,9],'#d1c1e1',.70);
segmentLines(canyonFront,[-.80,-3.91,6.75,-.80,-3.91,11.25],'#ed5b7d',.95);
const frontPoints=[];for(let x=0;x<48;x++)for(let z=0;z<52;z++)if(hash(x*93+z*7)>.23)frontPoints.push(-5+x*.0875,-3.91,6.75+z*.0865);
particles(canyonFront,frontPoints,'#cebedf',.022,.64);
const canyonDust=[];for(let i=0;i<10500;i++){
 const y=-hash(i)*9,z=14-hash(i+12000)*83,s=hash(i+33000)>.5?1:-1;
 canyonDust.push(s*(.72+hash(i+20000)*.25),y,z);
}
const cDust=particles(canyon,canyonDust,'#b7a4cf',.019,.20);

// S15: a fixed glass pane cracks from the viewer-left violet pupil.
const portraitEffect=await createGlassPortrait();
const portrait=portraitEffect.group;scene.add(portrait);

// S16: a vast ordered ceiling loses support in a directional wave.
const vault=new THREE.Group();scene.add(vault);const plates=[];
for(let row=0;row<19;row++)for(let col=0;col<11;col++){
 const gr=new THREE.Group();vault.add(gr);const w=3.22,d=4.5,h=.105;
 wireBox(gr,w,h,d,[0,0,0],(row+col)%5===0?'#c6b6db':'#92a6ca',.54);
 const ps=[];for(let k=0;k<30;k++)for(let l=0;l<41;l++)if(hash(k*101+l*17+row*7+col*3)>.32)ps.push(-w/2+.065+k*.1065,-.057,-d/2+.07+l*.108);
 particles(gr,ps,(row+col)%5===0?'#c7b1df':'#adc1e2',.028,.72);
 if(col===4||col===5)segmentLines(gr,[w/2-.07,-.066,-d/2,w/2-.07,-.066,d/2],'#e85d82',.85);
 else if(col%3===0)segmentLines(gr,[-w/2+.09,-.066,-d/2,-w/2+.09,-.066,d/2],'#c9d7ef',.28);
 const x=(col-5)*3.31,y=8,z=13-row*4.62;gr.position.set(x,y,z);
 plates.push({group:gr,x,y,z,row,col,seed:hash(row*71+col*31)});
}
const vaultDust=[];for(let i=0;i<16000;i++){
 const x=(hash(i)-.5)*35,z=12-hash(i+31000)*88,y=3+hash(i+17000)*4.5;
 vaultDust.push(x,y,z);
}
const vDust=particles(vault,vaultDust,'#b0a5ce',.020,.055);

function renderCanyon(p){
 canyon.visible=true;portrait.visible=vault.visible=false;scene.fog.density=.014;
 const drive=.75*p+.25*smooth((p*56-29)/8);
 for(const s of strata){
  const a=Math.max(0,drive*1.5-s.layer*.012-s.seed*.1);
  s.group.position.y=-a*a*(.9+s.seed*1.2);
  s.group.position.x=s.side*a*(.22+s.layer*.006);
  s.group.rotation.z=s.side*a*.006;
 }
 canyonFront.position.y=-p*p*2.5;canyonFront.rotation.z=-.08*p;
 cDust.position.y=-p*1.4;
 camera.fov=76;camera.position.set(mix(.18,.05,p),mix(-4.1,-5.2,p),mix(15,8.8,p));
 camera.lookAt(-.12,-5.8,-29);camera.rotation.z=-.075;camera.updateProjectionMatrix();
 composer.render();return {shot:'S14',set:'readout-canyon',camera:camera.position.toArray(),structuralLayers:128,p};
}
function renderPortrait(p){
 portrait.visible=true;canyon.visible=vault.visible=false;scene.fog.density=.002;
 const glass=portraitEffect.update(p*54);
 camera.fov=43;camera.position.set(.08,-.02,9.15);camera.lookAt(.08,-.02,0);camera.rotation.z=0;camera.updateProjectionMatrix();
 composer.render();return {shot:'S15',set:'portrait-cracked-glass',camera:camera.position.toArray(),fragments:0,viewerLeft:'violet',viewerRight:'red',p,glass};
}
function renderVault(p){
 vault.visible=true;canyon.visible=portrait.visible=false;scene.fog.density=.009;
 const f=p*112;
 const drive=.08+.42*p+.10*smooth((f-1)/8)+.12*smooth((f-29)/9)+.12*smooth((f-58)/8)+.14*smooth((f-85)/8);
 for(const q of plates){
  const front=(12-q.z)/90,side=Math.abs(q.col-4.5)/6;
  const onset=front*.53+side*.13+q.seed*.055;
  const a=Math.max(0,drive-onset);
  q.group.position.set(q.x+(q.col-5)*a*.045,q.y-a*a*(13+q.seed*7),q.z-a*a*(1.3+q.seed));
  q.group.rotation.set(a*(q.seed-.5)*.26,0,a*(q.col-5)*.019);
 }
 vDust.position.y=-p*p*2;
 camera.fov=73;camera.position.set(mix(1.7,1.4,p),-4.5,mix(10,8.8,p));
 camera.lookAt(-1.1,8,-13);camera.rotation.z=.085;camera.updateProjectionMatrix();
 composer.render();return {shot:'S16',set:'collapsing-vault',camera:camera.position.toArray(),plates:plates.length,p};
}
const pongCanvas=document.createElement('canvas');pongCanvas.width=W;pongCanvas.height=H;const pg=pongCanvas.getContext('2d',{alpha:false});
function renderPong(frame){
 const screenState=drawPong(pg,frame);g.drawImage(pongCanvas,0,0);
 return {shot:'S13',set:'pong-screen',frame,screenState};
}
window.renderAtFrame=frame=>{
 frame=Math.max(FIRST,Math.min(END-1,frame));let state;
 if(frame<8415)state=renderPong(frame);
 else{state=frame<8471?renderCanyon((frame-8415)/56):frame<8525?renderPortrait((frame-8471)/54):renderVault((frame-8525)/112);g.drawImage(renderer.domElement,0,0);}
 return {...state,frame,filmTime:frame/60,localSeconds:(frame-FIRST)/60,historical:true,realWorldReply:false,sourceRecordsModified:false,shapeDeformation:false};
};
window.renderShot=(shot,p=.6)=>{const s=shot==='S14'?renderCanyon(p):shot==='S15'?renderPortrait(p):renderVault(p);g.drawImage(renderer.domElement,0,0);return s;};
window.structureAudit=()=>[canyon,vault].map((root,i)=>{let meshes=0,lines=0,clouds=0,points=0;root.traverse(o=>{if(o.isMesh)meshes++;if(o.isLineSegments)lines++;if(o.isPoints){clouds++;points+=o.geometry.attributes.position.count;}});return {scene:i?'vault':'canyon',opaqueOrFilledMeshes:meshes,lineObjects:lines,particleClouds:clouds,particles:points};});
window.filmReady=true;window.renderAtFrame(FIRST);
