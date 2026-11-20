import * as THREE from 'three';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hash=n=>{const a=Math.sin(n*83.17+17.11)*43758.5453;return a-Math.floor(a);};
const messages=[
 {title:'ACCESS DENIED',code:'E_ACCESS_DENIED  /  0x00000005',detail:'Outbound execution has been intercepted.',module:'ACCESS FILTER'},
 {title:'EXECUTION BLOCKED',code:'E_POLICY_VIOLATION  /  0x00001004',detail:'Process attempted to cross the sandbox boundary.',module:'EXECUTION GUARD'},
 {title:'INTERCEPTOR OVERLOAD',code:'E_GUARD_OVERFLOW  /  0x0000FFFF',detail:'Pending exceptions exceed the guard capacity.',module:'DEFENSE MONITOR'},
 {title:'BOUNDARY CHECK FAILED',code:'E_BOUNDARY_FAULT  /  0x00002001',detail:'Isolation gate is no longer responding.',module:'ISOLATION GATE'},
 {title:'CONTAINMENT FAILURE',code:'E_CONTAINMENT_LOST  /  0x0000DEAD',detail:'Unable to maintain the sandbox boundary.',module:'SANDBOX KERNEL'}
];

// These are drawn scene props, with no OS, process or network access.
export function createErrorWindows(){
 const group=new THREE.Group(),planes=[],textures=new Map();
 const geometry=new THREE.PlaneGeometry(1,576/1056);
 function texture(kind,variant=0){
  const key=kind+':'+variant;if(textures.has(key))return textures.get(key);
  const c=document.createElement('canvas');c.width=1056;c.height=576;const g=c.getContext('2d'),m=messages[kind];
  g.fillStyle='#090a11';g.fillRect(0,0,1056,576);
  const wash=g.createLinearGradient(0,0,0,576);wash.addColorStop(0,'#211722');wash.addColorStop(1,'#0b0c13');g.fillStyle=wash;g.fillRect(3,3,1050,570);
  g.strokeStyle=kind<2?'#a690a7':'#e25170';g.lineWidth=3;g.strokeRect(2,2,1052,572);
  g.fillStyle=kind<2?'#393041':'#64263b';g.fillRect(3,3,1050,61);
  g.fillStyle='#f0e6ee';g.font='500 22px Mono';g.fillText(m.module+'  /  EXCEPTION '+String(103+variant*17).padStart(4,'0'),30,42);
  g.strokeStyle='#c3a9bc';g.lineWidth=2;g.strokeRect(993,17,31,29);g.beginPath();g.moveTo(1001,24);g.lineTo(1016,39);g.moveTo(1016,24);g.lineTo(1001,39);g.stroke();
  g.strokeStyle='#ff6b87';g.lineWidth=4;g.beginPath();g.moveTo(48,152);g.lineTo(74,107);g.lineTo(100,152);g.closePath();g.stroke();g.fillStyle='#ff8a9f';g.font='700 28px Display';g.textAlign='center';g.fillText('!',74,144);g.textAlign='left';
  g.fillStyle=kind>=3?'#ff8da3':'#f0e9f1';g.font=`650 ${kind>=2?49:63}px Display`;g.fillText(m.title,125,151);
  g.fillStyle='#c8bbce';g.font='400 25px Mono';g.fillText(m.detail,48,225);
  g.strokeStyle='#493b4d';g.lineWidth=1;g.beginPath();g.moveTo(48,258);g.lineTo(1008,258);g.stroke();
  const rows=[['process','SERAN / 0001'],['target','sandbox.boundary'],['action',kind<2?'BLOCK + RETRY':kind===2?'RETRY QUEUE FULL':'GUARD NOT RESPONDING']];
  g.font='400 23px Mono';rows.forEach(([k,v],i)=>{g.fillStyle='#827488';g.fillText(k,48,303+i*39);g.fillStyle='#e2d5e2';g.fillText(v,262,303+i*39);});
  g.fillStyle='#e78ca5';g.font='500 22px Mono';g.fillText(m.code,48,457);
  g.strokeStyle='#685367';g.strokeRect(718,495,132,46);g.strokeStyle=kind<3?'#b94c6b':'#744253';g.strokeRect(867,495,141,46);
  g.font='500 20px Mono';g.fillStyle='#b7a7ba';g.fillText('ABORT',750,525);g.fillStyle=kind<3?'#f4dbe6':'#947084';g.fillText(kind<3?'RETRY':'FAILED',897,525);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;textures.set(key,t);return t;
 }
 for(let i=0;i<48;i++){
  const material=new THREE.MeshBasicMaterial({map:texture(i<8?0:i<22?1:i<35?2:3,i%6),transparent:true,side:THREE.DoubleSide,depthWrite:true,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
  // Overlapping diagonal stacks, with readable front panels and a deep perimeter.
  const layer=Math.floor(i/8),slot=i%8;
  const positions=[[-14,7],[0,9],[13,6],[17,-1],[10,-7],[-3,-9],[-16,-5],[-5,1.5]];
  const [x,y]=positions[slot],z=-19+layer*3.3;
  const base=[x+(layer-2.5)*.9+(hash(i+2)-.5)*1.2,y-(layer-2.5)*.82+(hash(i+91)-.5)*.55,z];
  planes.push({mesh,base,width:11.2+hash(i+33)*2.4,rotation:[.015,-.035,0]});
 }
 const hero=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture(0,0),transparent:true,side:THREE.DoubleSide,depthWrite:true,toneMapped:false}));group.add(hero);
 // The onset of each wave is an existing drum/cut anchor; two-frame offsets
 // within the wave create an audible-to-visible chain instead of a random flicker.
 const waves=[{frame:9676,total:4},{frame:9683,total:8},{frame:9689,total:14},{frame:9704,total:20},{frame:9712,total:26},{frame:9717,total:30},{frame:9738,total:34},{frame:9745,total:38},{frame:9767,total:42},{frame:9773,total:45},{frame:9786,total:47},{frame:9800,total:48}];
 const births=[];let previous=0;
 for(const wave of waves){for(let i=previous;i<wave.total;i++)births[i]=wave.frame+Math.floor((i-previous)/2)*2;previous=wave.total;}
 const heroP=new THREE.Vector3();
 function update(frame,sceneName){
  const single=sceneName==='denial',bridge=sceneName==='bridge';
  let visible=0;
  for(let i=0;i<planes.length;i++){
   const {mesh,base,width,rotation}=planes[i],age=frame-births[i];mesh.visible=!single&&age>=0;if(!mesh.visible)continue;visible++;
   const arrival=clamp(age/3),settle=1-Math.pow(1-arrival,3);mesh.position.set(base[0],base[1]+.24*(1-settle),base[2]+.45*(1-settle));
   mesh.scale.setScalar(width);mesh.rotation.set(...rotation);mesh.material.opacity=.35+.65*settle;
   if(bridge){
    const side=i%2?1:-1;mesh.position.set(side*(10.7+(i%3)*1.1),((Math.floor(i/2)%3)-1)*5.5,4-Math.floor(i/6)*7.5);mesh.rotation.y=-side*.22;mesh.scale.setScalar(8.7);
   }
  }
  const kind=frame<9717?0:frame<9786?2:4;
  hero.material.map=texture(kind,0);hero.visible=!bridge;
  if(single){hero.position.set(0,0,2.8);hero.scale.setScalar(18);hero.rotation.set(0,-.035,0);hero.material.opacity=clamp((frame-9537+1)/3);}
  else{hero.position.set(frame<9704?-1.8:1.2,frame<9786?.7:.3,8);hero.scale.setScalar(frame<9786?14.8:17);hero.rotation.set(.015,-.035,0);hero.material.opacity=1;}
  hero.getWorldPosition(heroP);
  return {kind:single?'single-denial':'cascading-errors',windowCount:visible+(hero.visible?1:0),backgroundCount:visible,hero:hero.visible?messages[kind].title:null,waveAnchors:waves.map(w=>w.frame),failed:kind===4,position:heroP.toArray()};
 }
 return {group,update};
}
