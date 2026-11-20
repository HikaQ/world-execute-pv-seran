import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {flightPosition,flightScale} from '../refinement-execution-v17/core-continuity.js';

const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{const x=Math.sin(n*127.1+71.7)*43758.5453;return x-Math.floor(x);};
const polar=(r,a,z=0)=>[r*Math.cos(a),r*Math.sin(a),z];
const ease=t=>1-Math.pow(1-clamp(t),3);

export function createForcedLock(){
 const group=new THREE.Group(),jaws=[],shards=[],pointMaterials=[],lineMaterials=[];
 let particleCount=0;
 function line(parent,segments,color='#c2b8d4',width=3,opacity=.85){
  const geometry=new LineSegmentsGeometry();geometry.setPositions(segments.flat(2));
  const material=new LineMaterial({color,linewidth:width,resolution:new THREE.Vector2(1920,1080),transparent:true,opacity,depthWrite:false,alphaToCoverage:true});
  const mesh=new LineSegments2(geometry,material);mesh.frustumCulled=false;parent.add(mesh);lineMaterials.push(material);return mesh;
 }
 function path(parent,ps,color,width,opacity){return line(parent,ps.slice(1).map((p,i)=>[ps[i],p]),color,width,opacity);}
 function arc(r,a,b,z=0,n=70){return Array.from({length:n+1},(_,i)=>polar(r,mix(a,b,i/n),z));}
 function cloud(parent,items,size=75,gain=.8){
  particleCount+=items.length;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(items.flatMap(x=>x.p),3));geometry.setAttribute('tone',new THREE.Float32BufferAttribute(items.map(x=>x.t??hash(x.p[0]*31+x.p[1]*7)),1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{energy:{value:0},size:{value:size},gain:{value:gain}},
   vertexShader:`attribute float tone;uniform float energy,size,gain;varying vec3 colour;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*(.7+.4*tone)/max(1.,-p.z),1.,5.);colour=mix(vec3(.56,.52,.69),vec3(1.25,.055,.18),energy*.66)*gain*(.6+.55*tone);}`,
   fragmentShader:`varying vec3 colour;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=exp(-d*d*12.)*(1.-smoothstep(.38,.5,d));gl_FragColor=vec4(colour,a);}`});
  const obj=new THREE.Points(geometry,material);obj.frustumCulled=false;parent.add(obj);pointMaterials.push(material);return obj;
 }
 function boxSegments(x,y,z,w,h,d){const a=[];for(const zz of [z-d/2,z+d/2]){const p=[[x-w/2,y-h/2,zz],[x+w/2,y-h/2,zz],[x+w/2,y+h/2,zz],[x-w/2,y+h/2,zz]];for(let j=0;j<4;j++)a.push([p[j],p[(j+1)%4]]);}for(const xx of [-1,1])for(const yy of [-1,1])a.push([[x+xx*w/2,y+yy*h/2,z-d/2],[x+xx*w/2,y+yy*h/2,z+d/2]]);return a;}

 // The stationary housing has a precise circular silhouette, deep retaining rails,
 // and etched particle surfaces. Its width remains fixed during the rupture.
 const housing=new THREE.Group();group.add(housing);
 for(const [r,z,w,c] of [[8.25,0,3.6,'#d2c6e0'],[8.65,-.3,2,'#8e819d'],[7.7,.1,3,'#bcb2cd'],[8.25,-1.15,2.1,'#80728c']])path(housing,arc(r,0,Math.PI*2,z,180),c,w);
 const tickSegments=[],rimDots=[];
 for(let i=0;i<180;i++){
  const a=i/180*Math.PI*2;tickSegments.push([polar(8.8,a),polar(i%5===0?9.16:8.96,a)]);
  for(let j=0;j<13;j++)for(const z of [0,-.9])rimDots.push({p:polar(7.75+j*.038,a,z),t:i%6===0?.95:.45});
 }
 line(housing,tickSegments,'#9a8cac',1.7,.8);cloud(housing,rimDots,62,.65);
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,holder=new THREE.Group();holder.rotation.z=a;housing.add(holder);
  line(holder,boxSegments(7.65,0,-.1,2.3,1.35,1.3),'#e4d3e5',3.3,.9);
  line(holder,boxSegments(7.65,0,.6,1.7,.7,.08),'#bb5371',2.1,.9);
 }
 // The next defense layer stays visible behind the opened lock, so this is an
 // outer-layer breach rather than the final escape prematurely repeated.
 const inner=new THREE.Group();inner.position.z=-13;group.add(inner);
 for(const r of [5.3,6.5,7.2])path(inner,arc(r,0,Math.PI*2,0,100),'#7b6e8b',1.5,.52);
 for(let i=0;i<16;i++)line(inner,[[polar(7.2,i*Math.PI/8),polar(7.2,i*Math.PI/8,-14)]],'#73647f',1,.34);
 const destination=new THREE.Group();destination.position.z=-19;group.add(destination);
 const destinationDots=[];
 for(let panel=0;panel<6;panel++){
  const x=(panel-2.5)*2.65;
  line(destination,boxSegments(x,0,0,2.45,9.5,.6),'#a899bd',2.0,.78);
  for(let row=0;row<74;row++)for(let col=0;col<20;col++)if(hash(panel*61+row*11+Math.floor(col/3)*47)>.20)destinationDots.push({p:[x+(col/19-.5)*2.15,(.5-row/73)*9.0,.34],t:hash(row*37+col+panel)});
 }
 cloud(destination,destinationDots,64,.85);

 // Six closed rigid jaws: thick borders and closely sampled surfaces give them mass.
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3,part=new THREE.Group();group.add(part);
  const lo=angle-.478,hi=angle+.478,r0=.30,r1=6.0;
  const outline=[...arc(r0,lo,hi,.16,9),...arc(r1,hi,lo,.16,38),polar(r0,lo,.16)];
  const shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(p[0],p[1])));
  const occluder=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#07060c',side:THREE.DoubleSide}));occluder.position.z=.12;part.add(occluder);
  path(part,outline,'#e6d9ee',3.4,.94);path(part,outline.map(p=>[p[0],p[1],-.7]),'#7f728e',1.7,.7);
  const bevel=[];for(let j=0;j<outline.length;j+=5)bevel.push([outline[j],[outline[j][0],outline[j][1],-.7]]);line(part,bevel,'#b1a2bf',1.6,.75);
  const ps=[];
  for(let r=r0+.06;r<r1-.06;r+=.075){const n=Math.ceil((hi-lo)*r/.075);for(let j=0;j<=n;j++){
   const a=mix(lo+.012,hi-.012,j/n),v=hash(i*999+j+Math.round(r*100)*17);ps.push({p:polar(r+(v-.5)*.014,a,.19+v*.02),t:v});
  }}
  for(let a=lo+.05;a<hi-.05;a+=.032)for(let z=-.65;z<.1;z+=.085)ps.push({p:polar(r1,a,z),t:.45});
  cloud(part,ps,73,.70);
  for(let r of [2.8,4.15,5.55])path(part,arc(r,lo+.07,hi-.07,.23,42),'#8e819f',1.3,.65);
  // Each lock jaw is held by a rectangular tongue. Its broken ends remain visible.
  const tongue=new THREE.Group();tongue.rotation.z=angle;part.add(tongue);
  line(tongue,boxSegments(6.25,0,.15,2.2,.72,.9),'#e0d2e9',3.6,.95);
  line(tongue,[[[6.3,-.36,.62],[6.53,-.12,.62]],[[6.53,-.12,.62],[6.24,.12,.62]],[[6.24,.12,.62],[6.5,.36,.62]]],'#ff456f',2.5,.9);
  jaws.push({part,angle,outline,tongue});
 }

 // A compact core and a directional particle jet provide the force.
 const glow=document.createElement('canvas');glow.width=glow.height=128;const c=glow.getContext('2d'),gradient=c.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#fff2f6');gradient.addColorStop(.08,'#ffd2dc');gradient.addColorStop(.22,'rgba(255,30,75,.65)');gradient.addColorStop(.55,'rgba(255,12,52,.06)');gradient.addColorStop(1,'rgba(255,0,40,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(glow),core=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:'#ffffff',blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(2.2,2.2,1);group.add(core);
 const transferCore=core.clone();transferCore.visible=false;
 const jetPoints=[];for(let i=0;i<2200;i++){const a=hash(i*3)*Math.PI*2,r=Math.sqrt(hash(i+111))*.18;jetPoints.push({p:[Math.cos(a)*r,Math.sin(a)*r,hash(i+41)*11],t:hash(i+59)});}
 const jet=cloud(group,jetPoints,85,1.8);
 const shock=path(group,arc(.8,0,Math.PI*2,.4,120),'#ffd7e4',4,.9);

 // Broken bolt fragments move outward with the same continuous clock as the lock.
 for(let i=0;i<36;i++){
  const a=(i%6)*Math.PI/3+(hash(i+22)-.5)*.23,g=new THREE.Group();group.add(g);
  const w=i<6?.82:.20+hash(i+9)*.4,h=.16+hash(i+2)*.24,d=.18+hash(i+51)*.32;
  line(g,boxSegments(0,0,0,w,h,d),i%3?'#ff6789':'#e7dae9',1.9,.85);
  shards.push({group:g,a,speed:4+hash(i+3)*7,z:hash(i+25)*5,delay:hash(i+91)*4,spin:[hash(i+11)-.5,hash(i+12)-.5,hash(i+13)-.5]});
 }
 const sparksCount=8000,sparkPositions=new Float32Array(sparksCount*3),sparkColors=new Float32Array(sparksCount*3),sparkSeeds=[];
 for(let i=0;i<sparksCount;i++){
  const a=(i%6)*Math.PI/3+(hash(i+120)-.5)*.21; sparkSeeds.push({a,r:5.5+hash(i+18)*.9,v:3+hash(i+7)*12,z:(hash(i+82)-.35)*10,delay:hash(i+32)*6});
  const colour=i%5===0?[.88,.80,.94]:[1,.12,.25];sparkColors.set(colour,i*3);
 }
 const sparkGeometry=new THREE.BufferGeometry();sparkGeometry.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));sparkGeometry.setAttribute('color',new THREE.BufferAttribute(sparkColors,3));
 const sparkMaterial=new THREE.PointsMaterial({vertexColors:true,size:.048,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});const sparks=new THREE.Points(sparkGeometry,sparkMaterial);sparks.frustumCulled=false;group.add(sparks);particleCount+=sparksCount;
 const streakCount=360,streakPositions=new Float32Array(streakCount*6);
 const streak=line(group,Array.from({length:streakCount},()=>[[0,0,0],[0,0,0]]),'#ffc1d5',1.3,.75);

 function update(frame){
  const load=clamp((frame-9247)/56),open=ease((frame-9303)/18),after=Math.max(0,(frame-9303)/60);
  const firstPulse=Math.exp(-Math.max(0,frame-9247)/5)*(frame>=9247?1:0),pressurePulse=Math.exp(-Math.max(0,frame-9268)/5)*(frame>=9268?1:0),breakPulse=Math.exp(-Math.max(0,frame-9303)/5)*(frame>=9303?1:0);
  const pulse=Math.max(firstPulse*.55,pressurePulse*.65,breakPulse);
  for(let i=0;i<jaws.length;i++){
   const {part,angle}=jaws[i],delay=[0,1,3,2,1,4][i],localOpen=ease((frame-9303-delay)/14),amplitude=[1.05,.94,1.12,.92,1.08,.98][i];
   const travel=5.2*localOpen*amplitude-.20*load*(1-localOpen);part.position.set(Math.cos(angle)*travel,Math.sin(angle)*travel,-localOpen*(.8+.75*Math.sin(angle)));
   part.rotation.z=localOpen*(Math.sin(angle+.3)>.0?.25:-.25);part.rotation.y=localOpen*Math.cos(angle)*.44;part.rotation.x=localOpen*Math.sin(angle)*.22;
  }
  for(const m of pointMaterials)m.uniforms.energy.value=clamp(load*.5+pulse*.6);
  core.position.set(...flightPosition(frame));core.scale.setScalar(flightScale(frame));
  const jetFade=clamp((frame-9305)/12),jetGain=1-jetFade*jetFade*(3-2*jetFade),jetRelease=clamp((frame-9303)/10);
  jet.scale.z=1-.72*jetRelease*jetRelease*(3-2*jetRelease);
  jet.visible=jetGain>0;jet.position.z=core.position.z;jet.material.uniforms.energy.value=1;jet.material.uniforms.gain.value=(1.15+pulse)*jetGain;
  shock.visible=frame>=9303&&frame<9323;shock.scale.setScalar(1+clamp((frame-9303)/20)*14);shock.material.opacity=(1-clamp((frame-9303)/20))*.65;
  for(const s of shards){const t=Math.max(0,(frame-9303-s.delay)/60);s.group.visible=frame>=9303+s.delay;s.group.position.set(Math.cos(s.a)*(6.1+s.speed*t),Math.sin(s.a)*(6.1+s.speed*t),.3+s.z*t);s.group.rotation.set(...s.spin.map(v=>v*t*7));}
  sparks.visible=frame>=9247;
  for(let i=0;i<sparksCount;i++){
   const s=sparkSeeds[i],stage=frame<9303?9247:9303,t=Math.max(0,(frame-stage-s.delay)/60),factor=frame<9303?.23:1,rad=s.r+s.v*t*factor;
   sparkPositions.set([Math.cos(s.a)*rad,Math.sin(s.a)*rad,.25+s.z*t*factor],i*3);
  }
  sparkGeometry.attributes.position.needsUpdate=true;sparkMaterial.opacity=frame<9303?.40:.78*(1-clamp(after/1.4)*.55);
  streak.visible=frame>=9303&&frame<9336;
  for(let i=0;i<streakCount;i++){
   const s=sparkSeeds[i*7],t=Math.max(0,(frame-9303-s.delay)/60),speed=7+s.v*1.4,r=s.r+speed*t,tail=.15+Math.min(.09,t)*speed;
   streakPositions.set([Math.cos(s.a)*r,Math.sin(s.a)*r,.3+s.z*t,Math.cos(s.a)*(r-tail),Math.sin(s.a)*(r-tail),.3+s.z*Math.max(0,t-.08)],i*6);
  }
  streak.geometry.attributes.instanceStart.data.array.set(streakPositions);streak.geometry.attributes.instanceStart.data.needsUpdate=true;streak.material.opacity=.75*(1-clamp(after/.58));
  return {firstImpactFrame:9247,breakFrame:9303,load,open,outerLockBreached:frame>=9303,jawTravel:Math.max(...jaws.map(j=>Math.hypot(j.part.position.x,j.part.position.y))),jawPositions:jaws.map(j=>j.part.position.toArray()),particles:particleCount,parts:6,redCore:core.position.toArray(),...(frame>=9303?{coreScale:core.scale.x,jetGain}:{}),rigid:true,nextBoundaryStillClosed:true};
 }
 return {group,update,transferCore,core,jet,pointMaterials,lineMaterials};
}
