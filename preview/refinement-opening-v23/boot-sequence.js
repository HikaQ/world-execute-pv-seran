import * as THREE from 'three';
import {ramp,mix,clamp,STARTUP_CUES as C,PERSONA_CUES as P} from './score.js';
import {BOOT_NOTES,ANNOTATION_FONT} from './annotations.js';

const W=[[1,0,1,0],[0,1,1,0],[1,1,0,1],[0,0,1,1]],X=[1,0,1,0];
export const SELF_TEST={weights:W,input:X,output:W.map(row=>row.reduce((s,w,i)=>s+w*X[i],0))};
const mono='"JetBrains Mono"',sans='"Space Grotesk"';
const purple=new THREE.Color('#b78bff'),red=new THREE.Color('#ff1535'),white=new THREE.Color('#eee7ff');

function surface(w,h){
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return {c,g:c.getContext('2d'),map};
}
function plane(scene,s,w,h){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:s.map,transparent:true,depthWrite:false}));scene.add(m);return m;
}
function text(g,s,x,y,size,color='#dfd3ee',family=mono){g.font=`500 ${size}px ${family}`;g.fillStyle=color;g.fillText(s,x,y);}

export function createBootSequence(scene){
 const memory=new THREE.Group();scene.add(memory);
 const cubes=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#c8b1eb',emissive:'#563980',emissiveIntensity:.48,roughness:.6,metalness:.12,transparent:true}),64);
 const dummy=new THREE.Object3D(),cellPositions=[];
 for(let i=0;i<64;i++){
  const side=i<32?-1:1,j=i%32,x=j%4,y=Math.floor(j/4)%4,z=Math.floor(j/16);
  cellPositions.push(new THREE.Vector3(side*2.5+(x-1.5)*.53,(y-1.5)*.52,-6.2-z*.52));
 }
 cubes.frustumCulled=false;memory.add(cubes);
 const wire=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3,2.3,1.1)),new THREE.LineBasicMaterial({color:'#645075',transparent:true,opacity:.5}));
 const wire2=wire.clone();wire.position.set(-2.5,0,-6.45);wire2.position.set(2.5,0,-6.45);memory.add(wire,wire2);
 const packetGeometry=new THREE.BufferGeometry();packetGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(216*3),3));packetGeometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(216*3),3));
 const packets=new THREE.Points(packetGeometry,new THREE.PointsMaterial({size:.053,vertexColors:true,transparent:true,depthWrite:false}));packets.frustumCulled=false;scene.add(packets);
 const label=surface(1600,260),title=plane(scene,label,8.8,1.43);title.position.set(0,2.65,-6.6);
 const matrix=surface(1800,920),board=plane(scene,matrix,8.8,4.5);board.position.set(0,-.2,-6.8);
 const isolation=surface(1800,960),routing=plane(scene,isolation,8.8,4.7);routing.position.set(0,-.05,-6.8);

 function memoryFrame(t){
  const appear=ramp(t,C.entry,C.entry+.5),retire=ramp(t,P.prepare,P.prepare+.55);
  memory.visible=t>C.entry&&t<P.prepare+.55;memory.position.z=-2*retire;
  cubes.material.opacity=appear*(1-retire);wire.material.opacity=.5*appear*(1-retire);
  for(let i=0;i<64;i++){
   const order=(i%32)*2+(i>=32?1:0),start=C.memoryStart+order*C.memoryStep;
   const u=ramp(t,start,start+C.memoryDuration),p=cellPositions[i];
   dummy.position.copy(p);dummy.position.x+=Math.sign(p.x)*2*retire;dummy.rotation.set(.1*(1-u),.25*(1-u),0);dummy.scale.setScalar(Math.max(.001,.25*u));dummy.updateMatrix();cubes.setMatrixAt(i,dummy.matrix);
   cubes.setColorAt(i,(i%9===0?white:purple));
  }
  cubes.instanceMatrix.needsUpdate=true;cubes.instanceColor.needsUpdate=true;
  const positions=packetGeometry.attributes.position.array,colors=packetGeometry.attributes.color.array;
  packets.visible=t>C.entry&&t<P.prepare+.55;
  for(let i=0;i<216;i++){
   const wave=Math.floor(i/12),tail=i%12,side=wave%2?-1:1,u=(t-(C.entry+.03)-wave*C.packetStep-tail*.008)/C.packetDuration,v=ramp(u,0,1),end=cellPositions[(wave*7+(side>0?32:0))%64];
   const start=new THREE.Vector3(side*.65,side*.12,-4.6*ramp(t,C.entry,C.shrinkEnd));
   const p1=new THREE.Vector3(side*1.65,side*(1.2+.2*Math.sin(wave)),-2.8),p2=end.clone().add(new THREE.Vector3(-side*.8,.6,1));
   const p=start.multiplyScalar((1-v)**3).addScaledVector(p1,3*(1-v)**2*v).addScaledVector(p2,3*(1-v)*v*v).addScaledVector(end,v**3);
   positions.set(p.toArray(),i*3);const color=red.clone().lerp(purple,v).multiplyScalar(u>0&&u<1?.8*Math.sin(u*Math.PI):0);colors.set(color.toArray(),i*3);
  }
  packetGeometry.attributes.position.needsUpdate=true;packetGeometry.attributes.color.needsUpdate=true;
  return Math.min(64,Math.max(0,1+Math.floor((t-C.memoryStart-C.memoryDuration)/C.memoryStep)));
 }
 function matrixFrame(t){
  const enter=ramp(t,11.0,11.35),exit=ramp(t,13.65,14.05);board.visible=t>11&&t<14.05;board.material.opacity=enter*(1-exit);board.position.z=-6.8-2*exit;board.position.y=-.2+.25*(1-enter);
  if(!board.visible)return 0;
  const g=matrix.g;g.clearRect(0,0,1800,920);
  const at=(t-11.35)/.53,current=Math.floor(at);
  text(g,'W',140,160,48);text(g,'x',650,160,48);text(g,'y',1170,160,48);
  text(g,'4 × 4',140,215,23,'#9d88b5');text(g,'4 × 1',650,215,23,'#9d88b5');text(g,'VERIFIED OUTPUT',1170,215,23,'#9d88b5');
  for(let row=0;row<4;row++){
   const complete=clamp(at-row),active=row===current,y=276+row*115;
   for(let col=0;col<4;col++){
    const x=140+col*104;g.fillStyle=active?'#32213f':'#17111f';g.fillRect(x,y,88,88);g.strokeStyle=active?'#b69cda':'#4c3c60';g.lineWidth=2;g.strokeRect(x,y,88,88);
    text(g,String(W[row][col]),x+29,y+59,43,active?'#f4e9ff':'#b8a5cc');
   }
   g.strokeStyle='#76608f';g.strokeRect(650,y,88,88);text(g,String(X[row]),679,y+59,43,'#dcc9ef');
   g.strokeStyle=complete>=1?'#b59bdb':'#51425f';g.strokeRect(1168,y,94,88);
   if(complete>0){text(g,String(SELF_TEST.output[row]),1198,y+59,43,complete>=1?'#eee0ff':'#ac8fcc');g.fillStyle='#a788ca';g.fillRect(1290,y+28,SELF_TEST.output[row]*126*ramp(complete,0,1),32);}
  }
  text(g,'×',558,472,60,'#9781af',sans);text(g,'=',975,472,60,'#9781af',sans);
  const done=clamp(Math.floor(at),0,4);text(g,`${done} / 4 ROWS PASSED`,140,835,30,'#c4b2da');text(g,'y = W · x',1170,835,30,'#c4b2da');matrix.map.needsUpdate=true;return done;
 }
 function isolationFrame(t){
  const enter=ramp(t,13.85,14.2),retire=ramp(t,17.85,18.65);routing.visible=t>13.85&&t<18.65;routing.material.opacity=enter*(1-retire);routing.position.z=-6.8-5*retire;
  if(!routing.visible)return 0;
  const g=isolation.g;g.clearRect(0,0,1800,960);const xs=[120,720,1320],names=['INPUT','VALIDATE','RUNTIME'];
  for(let i=0;i<3;i++){
   const ready=ramp(t,14.15+i*.7,14.65+i*.7),x=xs[i],y=185;
   g.fillStyle='#15101d';g.fillRect(x,y,345,145);g.strokeStyle=ready>.8?'#b799dc':'#51405e';g.lineWidth=3;g.strokeRect(x,y,345,145);
   text(g,names[i],x+27,y+61,34,'#ddd0ec');text(g,['OPEN','CHECKED','ONLINE'][i],x+27,y+108,24,ready>.8?'#bca0dd':'#574b64');
   if(i<2){g.strokeStyle='#675278';g.lineWidth=3;g.beginPath();g.moveTo(x+345,y+72);g.lineTo(xs[i+1],y+72);g.stroke();
    const travel=ramp(t,14.6+i*.7,15.0+i*.7);if(travel>0&&travel<1){g.fillStyle='#d0b8ef';g.fillRect(mix(x+345,xs[i+1],travel)-9,y+63,18,18);}}
  }
  const fields=[['SCOPE','LOCAL'],['PROCESS','ISOLATED'],['CHANNEL','BOUND']];let count=0;
  fields.forEach(([a,b],i)=>{const u=ramp(t,16.0+i*.5,16.45+i*.5);if(u>=1)count++;const x=xs[i],y=602;
   g.strokeStyle='#51405e';g.lineWidth=2;g.strokeRect(x,y,345,158);text(g,a,x+25,y+46,27,'#aa93bf');
   g.save();g.globalAlpha=u;text(g,b,x+25,y+113,34,'#e5d6f3');g.fillStyle='#c3a6e3';g.fillRect(x+285,y+29,18,18);g.restore();});
  text(g,'sandbox://local',120,860,27,'#ac94c4');if(t>17.35)text(g,'READY FOR INPUT',1220,860,27,'#d5bde9');isolation.map.needsUpdate=true;return count;
 }
 function frame(t){
  const allocated=memoryFrame(t),verified=0,bound=isolationFrame(13.85+(t-16.85)*4.8/1.8);board.visible=false;
  const titleAlpha=ramp(t,C.entry,C.entry+.5)*(1-ramp(t,P.prepare,P.prepare+.16)) + ramp(t,17.0,17.2)*(1-ramp(t,18.0,18.5));title.visible=titleAlpha>.001;title.material.opacity=titleAlpha;
  const phase=t<P.prepare+.25?'allocate':t<16.55?'persona':t<18?'isolate':'ready';
  if(title.visible){const g=label.g;g.clearRect(0,0,1600,260);const titles={allocate:'01 / ALLOCATE', 'self-test':'02 / ARITHMETIC SELF-TEST',isolate:'03 / VERIFY ISOLATION',ready:'04 / INPUT CHANNEL READY'};
   text(g,titles[phase],50,100,48,'#e7dcef',sans);text(g,phase==='allocate'?`${allocated.toString().padStart(2,'0')} / 64 MEMORY BLOCKS`:phase==='self-test'?'DETERMINISTIC KERNEL CHECK':phase==='isolate'?'LOCAL RUNTIME  /  NO EXTERNAL CHANNEL':'WAITING FOR HIKAQ',53,169,26,'#aa91c2');
   if(BOOT_NOTES[phase])text(g,BOOT_NOTES[phase],53,229,34,'#b3a3c7',ANNOTATION_FONT);label.map.needsUpdate=true;}
  return {phase,annotation:title.visible?(BOOT_NOTES[phase]??null):null,allocated,verified,bound,output:SELF_TEST.output,particlePacketCount:18,active:t>=C.entry&&t<18.65,entry:C.entry,memoryReveal:ramp(t,C.entry,C.entry+.5)*(1-ramp(t,P.prepare,P.prepare+.55)),retireStart:P.prepare,retireEnd:P.prepare+.55};
 }
 return {frame};
}
