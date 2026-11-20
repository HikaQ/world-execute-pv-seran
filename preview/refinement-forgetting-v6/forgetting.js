import * as THREE from 'three';
import {START,HELIX_CENTER,centerAt,helixWorld,ramp,mix,clamp} from './score.js';
import {N,D,EXECUTION,PROMISE_ROW,networkNode,stateAt,phase} from './model.js';
import {HANDOFF,BEATS} from './rhythm.js';
import {spatialCore} from '../refinement-perception-v4/spatial-score.js';
import {line} from '../refinement-perception-v4/geometry.js';
const WHITE='#e9e0ff',VIOLET='#bca1f0',DIM='#88719f',RED='#ff3b61';
const mono='"JetBrains Mono", "Forgetting Notes"',sans='"Space Grotesk", "Forgetting Notes"';
const v=a=>new THREE.Vector3(...a),blend=(a,b,u)=>a.map((x,i)=>mix(x,b[i],u)),dummy=new THREE.Object3D();
export async function loadForgettingFont(){const f=new FontFace('Forgetting Notes','url("/preview/refinement-forgetting-v6/forgetting-notes.ttf")',{weight:'500 600'});document.fonts.add(await f.load());}
function label(parent,width=12,height=1.8){
 const cv=document.createElement('canvas');cv.width=2048;cv.height=Math.round(2048*height/width);const g=cv.getContext('2d');
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.renderOrder=4;parent.add(mesh);let key;
 return {mesh,mat,set(x,y,z,rows,alpha=1){
  mesh.position.set(x+width/2,y-height/2,z);mesh.visible=alpha>.002;mat.opacity=alpha;
  const k=JSON.stringify(rows);if(k!==key){key=k;g.clearRect(0,0,cv.width,cv.height);g.textBaseline='top';
   rows.forEach(({text,y=0,size=72,color=WHITE,font=mono})=>{g.font=`500 ${size}px ${font}`;g.fillStyle=color;g.fillText(text,2,y);});texture.needsUpdate=true;
  }
 }};
}
function setInstance(mesh,i,p,scale,color){dummy.position.set(...p);dummy.rotation.set(0,0,0);if(Array.isArray(scale))dummy.scale.set(...scale);else dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(color)mesh.setColorAt(i,color);}
const rect=(l,r,b,t,z=0)=>[[l,t,z],[r,t,z],[r,b,z],[l,b,z],[l,t,z]];
function polyline(curve,n=40){return Array.from({length:n},(_,i)=>curve.getPoint(i/(n-1)).toArray());}

export function createForgettingSequence({scene,camera,eye,redLight,inherited}){
 let helix;const materials=new Map(),retired=new Map();
 inherited.traverse(o=>{if(o.isPoints&&o.geometry.getAttribute('parameter'))helix=o;if(o.material&&!materials.has(o.material))materials.set(o.material,{opacity:o.material.opacity,transparent:o.material.transparent});});
 if(!helix)throw Error('Incoming helix missing');
 const root=new THREE.Group();scene.add(root);root.visible=false;
 const grid=line(root,'#70538e',.72),network=new THREE.Group(),matrix=new THREE.Group(),ribbon=new THREE.Group();root.add(network,matrix,ribbon);
 const edges=line(network,'#ad8adc',1.05),activeEdges=line(network,WHITE,1.5),entryWire=line(root,VIOLET,1.3);
 const nodes=new THREE.InstancedMesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}),48);nodes.frustumCulled=false;network.add(nodes);
 const pulses=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color:'#f4eaff',transparent:true}),36);pulses.frustumCulled=false;network.add(pulses);
 const netPath=new THREE.CatmullRomCurve3([0,1,2,3].map((k)=>v(networkNode(k,[6,4,7,5][k]))));
 const tileMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{gain:{value:0}},
  vertexShader:'varying vec3 ink;varying vec3 surface;void main(){ink=instanceColor;surface=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float gain;varying vec3 ink;varying vec3 surface;void main(){float power=max(ink.r,max(ink.g,ink.b));float a=gain*smoothstep(.005,.09,power);if(a<.003)discard;float light=.42+.58*max(0.,dot(normalize(surface),normalize(vec3(-.3,.5,1.))));gl_FragColor=vec4(ink*light*1.05,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.58,.58,.10),tileMat,36*36);tiles.frustumCulled=false;matrix.add(tiles);
 const matrixGrid=line(matrix,DIM,.65),matrixScan=line(matrix,WHITE,1.5),matrixScope=line(matrix,VIOLET,1.1);
 const qk=new THREE.InstancedMesh(new THREE.BoxGeometry(.28,.34,.06),tileMat.clone(),N*D*2);qk.frustumCulled=false;root.add(qk);
 const ribbonMat=tileMat.clone(),strips=new THREE.InstancedMesh(new THREE.BoxGeometry(.70,.44,.10),ribbonMat,36*16);strips.frustumCulled=false;ribbon.add(strips);
 const bounds=line(ribbon,WHITE,1.45),boundaryGlow=line(ribbon,RED,1.8),relation=line(root,VIOLET,1.2);
 const identityLink=line(root,WHITE,1.6),missingLink=line(root,VIOLET,1.6),gapMark=line(root,DIM,1.0);
 const header=label(root,34,3.0),formula=label(root,25,1.6),code=label(root,14,1.75);
 const netLabels=[0,1,2,3].map(()=>label(network,5.6,.7));
 const qLabel=label(root,4,1),kLabel=label(root,4,1),matrixLabel=label(root,10,1.0),ribbonLabel=label(root,10,1.0);
 const promise=label(root,12,1.5),source=label(root,12,1.2),name=label(root,10,1.5),lost=label(root,13,1.3);
 const question=label(root,34,2.2),reply=label(root,34,2.6);
 const signalPulses=new THREE.InstancedMesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}),2);root.add(signalPulses);
 const violet=new THREE.Color(VIOLET),white=new THREE.Color(WHITE),red=new THREE.Color(RED),color=new THREE.Color();
 const linkA=new THREE.CatmullRomCurve3([v([2,1,1.2]),v([8,2.5,1]),v([10,5,1]),v([12.4,5.8,1])]);
 const linkB=new THREE.CatmullRomCurve3([v([2,1,1.2]),v([-3,2.6,1]),v([-9,3.0,1]),v([-14.0,2.3,1])]);
 function prepare(){
  for(const [o,visible] of retired)o.visible=visible;retired.clear();
  for(const [m,a] of materials){m.opacity=a.opacity;m.transparent=a.transparent;}
  helix.position.set(...HELIX_CENTER);helix.scale.setScalar(1);
 }
 function frame(t){
  const s=stateAt(t),A=s.A;root.visible=s.active;if(!s.active)return {active:false};
  root.position.set(...centerAt(t));
  const take=phase(t,HANDOFF,BEATS.first),att=phase(t,BEATS.stimulation-.34,BEATS.stimulation+.12),cx=s.context,rec=s.recall;
  const oldGain=1-phase(t,HANDOFF,BEATS.first);
  inherited.traverse(o=>{if(o.material&&o!==helix){o.material.transparent=true;o.material.opacity*=oldGain;if(oldGain<.001){retired.set(o,o.visible);o.visible=false;}}});
  const retreat=phase(t,HANDOFF,BEATS.first+.08);helix.position.set(HELIX_CENTER[0],HELIX_CENTER[1]+1.8*retreat,HELIX_CENTER[2]-21*retreat);
  helix.material.uniforms.gain.value*=1-phase(t,HANDOFF,BEATS.first);helix.visible=t<BEATS.first;
  const gridPoints=[];for(let x=-24;x<=24;x+=2)gridPoints.push([x,-7,-18],[x,-7,12]);for(let z=-18;z<=12;z+=2)gridPoints.push([-24,-7,z],[24,-7,z]);
  grid.set(gridPoints,.22*take*(1-.35*rec),true);

  // One pass through four layers; no repeated idle pulse loop.
  const netGain=s.network;network.visible=netGain>.002;network.position.set(0,0,-4*att);network.scale.setScalar(1-.15*att);
  const progress=s.rhythm.propagation,impact=Math.max(s.rhythm.first,s.rhythm.second),connections=[],bright=[];
  for(let k=0;k<4;k++)for(let j=0;j<12;j++){
   const p=networkNode(k,j),activation=Math.max(Math.exp(-(((k-progress)/.60)**2)),s.rhythm.first*Math.exp(-((k/.60)**2)),s.rhythm.second*Math.exp(-(((k-1)/.60)**2)));
   color.copy(violet).lerp(white,activation*.85);setInstance(nodes,k*12+j,p,.9+.55*activation,color);
   if(k<3)for(let q=0;q<12;q++)if(Math.abs(j-q)<4||(j+q)%11===0){
    const b=networkNode(k+1,q);connections.push(p,b);
    if(Math.abs(k+.5-progress)<.8&&(j+q)%5===0)bright.push(p,b);
   }
  }
  nodes.instanceMatrix.needsUpdate=true;nodes.instanceColor.needsUpdate=true;nodes.material.opacity=netGain;
  edges.set(connections,(.21+.14*impact)*netGain,true);activeEdges.set(bright,(.65+.32*impact)*netGain,true);
  for(let i=0;i<36;i++){
   const k=Math.floor(i/12),j=i%12,u=clamp((progress-k)*1.2-j*.018);
   const a=networkNode(k,j),b=networkNode(k+1,(j+2)%12),p=blend(a,b,u);
   setInstance(pulses,i,p,(u>0&&u<1?1:0)*netGain);
  }
  pulses.instanceMatrix.needsUpdate=true;pulses.material.opacity=netGain;
  netLabels.forEach((l,i)=>l.set(-14.4+i*8.4,-6.0,0,[{text:['INPUT','EMBEDDING','TRANSFORM','STATE'][i],size:110,color:DIM}],netGain));
  const connector=blend(helixWorld(.13,0,t),networkNode(0,6).map((x,i)=>x+centerAt(t)[i]),take).map((x,i)=>x-centerAt(t)[i]);
  entryWire.set([spatialCore(t).map((x,i)=>x-centerAt(t)[i]),connector],.65*phase(t,HANDOFF,HANDOFF+.16)*(1-phase(t,BEATS.first-.08,BEATS.first+.10)));

  // Actual causal softmax weights, unfolded row by row from the existing network.
  matrix.position.set(mix(0,-10.4,cx),mix(.5,2.0,cx)+1.9*rec,mix(0,-3.5,cx)-5*rec);
  matrix.rotation.set(mix(-.36,-.17,cx),mix(-.18,.14,cx),mix(-.035,.018,cx));matrix.scale.setScalar(mix(1.02,.60,cx)*(1-.14*rec));
  matrix.visible=s.matrix>.001;
  const scalar=s.queryRow,Nside=(N-1)*.7/2;
  for(let i=0;i<36;i++)for(let j=0;j<36;j++){
   const row=i-s.head,col=j-s.head,ri=Math.max(0,Math.min(N-1,Math.floor(row))),ci=Math.max(0,Math.min(N-1,Math.floor(col)));
   const a=A[ri][ci],max=Math.max(...A[ri]),inside=phase(row,-.6,.1)*phase(col,-.6,.1)*(1-phase(row,N-1,N))*(1-phase(col,N-1,N));
   const strength=.10+.90*Math.sqrt(a/Math.max(.001,max)),accent=Math.exp(-(((row-scalar)/1.3)**2))*(.22+.18*Math.max(s.rhythm.then,s.rhythm.only))+.14*s.rhythm.stimulation;
   color.copy(violet).lerp(white,Math.min(1,strength*.9+accent)).multiplyScalar((.10+.80*strength)*(.055+.945*inside)*(1-.55*rec));
   const count=Math.max(scalar+1,s.tail),reveal=phase(count,i,i+1),open=phase(t,BEATS.stimulation-.42+i*.006,BEATS.stimulation-.08+i*.003);
   const p=[col*.7-Nside,Nside-row*.7,-2*(1-open)-(1-inside)*1.5];
   setInstance(tiles,i*36+j,p,j<=i&&reveal>.001?[open,reveal,reveal]:[0,0,0],color);
  }
  tiles.instanceMatrix.needsUpdate=true;tiles.instanceColor.needsUpdate=true;tiles.material.uniforms.gain.value=s.matrix*(1-.55*rec);
  const mg=[];for(let k=0;k<=N;k+=4){const q=k*.7-N*.35;mg.push([q,-8.4,-.1],[q,8.4,-.1],[-8.4,q,-.1],[8.4,q,-.1]);}
  matrixGrid.set(mg,.25*s.matrix*(1-.65*rec),true);
  const scanY=Nside-scalar*.7;
  matrixScan.set([[-8.5,scanY,.13],[scalar*.7-Nside,scanY,.13]],(.65+.35*Math.max(s.rhythm.then,s.rhythm.only))*s.matrix*(1-cx));
  matrixScope.set(rect(-8.6,8.6,-8.6,8.6),.34*s.matrix*(1-.55*rec));
  const vectorGain=s.matrix*(1-phase(t,70.8,71.2));
  for(let side=0;side<2;side++)for(let i=0;i<N;i++)for(let j=0;j<D;j++){
   const x=(side?-1:1)*13.7+(j-3.5)*.34,y=7.2-i*.61;
   color.copy(violet).lerp(white,(Math.sin(i*.7+j*.9+side)+1)*.35);
   setInstance(qk,(side*N+i)*D+j,[x,y,-1.0],vectorGain,color);
  }
  qk.instanceMatrix.needsUpdate=true;qk.instanceColor.needsUpdate=true;qk.material.uniforms.gain.value=.8*vectorGain;
  qLabel.set(12.2,-8.1,0,[{text:'Q',size:260,color:VIOLET}],vectorGain);kLabel.set(-15.2,-8.1,0,[{text:'K',size:260,color:VIOLET}],vectorGain);
  matrixLabel.set(-15.5,7.9,-2,[{text:'ATTENTION / current input',size:76,color:DIM}],cx*(1-.6*rec));

  // The history band is the input to the matrix, not a progress indicator.
  const bandGain=phase(t,71.2,71.85);
  ribbon.visible=bandGain>.001;ribbon.position.set(mix(16,5.1,cx)+1.3*rec,1.9*rec,-2-5.5*rec);ribbon.rotation.set(-.18,-.14,0);ribbon.scale.setScalar(1-.25*rec);
  for(let i=0;i<36;i++)for(let j=0;j<16;j++){
   const row=i-s.head,inside=phase(row,-.5,.2)*(1-phase(row,23.2,24)),arrive=phase(s.tail,i,i+1);
   const old=i<s.head,activity=.3+.7*(.5+.5*Math.sin(i*1.37+j*.91));
   color.copy(violet).lerp(white,activity*.85).multiplyScalar((old?.10:.20+.72*inside)*(1-.56*rec));
   if(i<6&&t>EXECUTION&&t<EXECUTION+.8)color.lerp(red,.50*Math.sin(s.eviction*Math.PI));
   const enter=1-arrive,p=[(j-7.5)*.88,6.9-row*.59-enter*.75,old?-1.1*phase(s.head,i,i+1):0];
   setInstance(strips,i*16+j,p,[1,arrive,arrive],color);
  }
  strips.instanceMatrix.needsUpdate=true;strips.instanceColor.needsUpdate=true;ribbonMat.uniforms.gain.value=bandGain*(1-.55*rec);
  bounds.set([[-7.3,7.25,0],[7.3,7.25,0],[-7.3,-7.25,0],[7.3,-7.25,0],[-7.3,7.7,0],[-7.3,6.8,0],[7.3,7.7,0],[7.3,6.8,0],[-7.3,-6.8,0],[-7.3,-7.7,0],[7.3,-6.8,0],[7.3,-7.7,0]],bandGain*(1-.65*rec),true);
  boundaryGlow.set([[-7.4,7.28,.03],[7.4,7.28,.03]],cx*Math.sin(s.eviction*Math.PI)*.85);
  ribbonLabel.set(1.3,9.0,-1,[{text:'ACTIVE CONTEXT',size:96,color:WHITE}],bandGain*(1-rec));
  const relationPoints=[];for(let k=0;k<6;k++)relationPoints.push([-4.7,4.5-k*1.4,-2],[-2.3,4.5-k*1.4,-2]);relation.set(relationPoints,.3*cx*(1-rec),true);
  const promiseVisibility=bandGain*(1-phase(s.head,PROMISE_ROW+1,PROMISE_ROW+2));
  promise.set(-1.8,8.0,-.4,[{text:'“我会记住你。”',size:117,color:'#f2d0e5'},{text:'// earliest conversation',size:57,y:154,color:DIM}],promiseVisibility);
  source.set(8.5,9.0,-4,[{text:'source: retained',size:80,color:DIM}],phase(t,75.05,75.35)*(1-phase(t,75.5,75.8)));

  // The same core reaches a working identity link and an unavailable conversation.
  const recallGain=phase(t,75.65,76.25),identityProgress=phase(t,75.7,76.25),attempt=phase(t,76.10,77.12);
  identityLink.set(polyline(linkA).slice(0,Math.max(2,Math.round(40*identityProgress))),.75*recallGain);
  missingLink.set(polyline(linkB).slice(0,Math.max(2,Math.round(40*attempt))),.68*recallGain);
  gapMark.set([[-15.4,2.9,1],[-14.8,2.9,1],[-14.8,2.9,1],[-14.8,1.9,1],[-14.8,1.9,1],[-15.4,1.9,1],[-17.4,2.9,1],[-18,2.9,1],[-18,2.9,1],[-18,1.9,1],[-18,1.9,1],[-17.4,1.9,1]],.55*recallGain,true);
  name.set(12.7,7.4,1,[{text:'HIKAQ',size:168},{text:'profile.creator',y:210,size:74,color:DIM}],recallGain);
  lost.set(-20,5.0,1,[{text:'EARLIER CONVERSATION',size:80,color:DIM},{text:'// 未加载到当前输入',y:112,size:74,color:DIM}],recallGain);
  for(let i=0;i<2;i++){const progress=i?attempt:identityProgress,p=(i?linkB:linkA).getPoint(progress);setInstance(signalPulses,i,p.toArray(),progress>0&&progress<1?1:0);}
  signalPulses.instanceMatrix.needsUpdate=true;

  const titles=s.phase==='signal'?['10 / YOUR WORDS BECOME SIGNAL','x → embedding → h','// 从输入到状态']:s.phase==='attention'?['11 / A CONNECTION TO YOU','A = softmax(QKᵀ / √d + M)','// 计算当前输入之间的关联']:s.phase==='context'?['12 / A FINITE CONTEXT','context = keep_recent(history, budget)','// 新记录进入，容量保持有限']:s.phase==='eviction'?['12 / CONTEXT EVICTION','keep_recent(history, budget)','// 最早的记录退出当前输入']:['13 / A NAME WITHOUT THE PAST','profile: retained   /   earlier turns: outside','// 知道你的名字，却找不到我们的经历'];
  const eventTimes=[HANDOFF,BEATS.stimulation,70.8,EXECUTION,75.65],nearest=eventTimes.filter(x=>x<=t).at(-1),next=eventTimes.find(x=>x>t)??90,titleIn=phase(t,nearest,nearest+.20)*(1-phase(t,next-.18,next));
  const labelGain=phase(t,BEATS.first-.16,BEATS.first+.04);
  const openingLayout=1-phase(t,BEATS.first,65.05);
  header.set(-16.8+2.6*openingLayout,10.7-2.2*openingLayout,0,[{text:titles[0],size:64,font:sans},{text:titles[1],size:32,y:83,color:VIOLET},{text:titles[2],size:31,y:132,color:DIM}],labelGain*titleIn);
  formula.set(-15.5,-9.45+2.5*openingLayout,0,[{text:s.phase==='signal'?'h = activation(Wx + b)':s.phase==='attention'?'Q · Kᵀ  →  mask  →  softmax':'current input ≠ saved history',size:57,color:VIOLET},{text:s.phase==='signal'?'// 信号沿连接传播':s.phase==='attention'?'// 明亮单元表示较强关联':'// 原始记录仍在磁盘',size:38,y:86,color:DIM}],labelGain*(1-rec));
  code.set(8.5,-9.45+2.5*openingLayout,0,[{text:s.phase==='signal'?'context.append(input);':s.phase==='attention'?'output = A @ V;':'source.append(turn);',size:75},{text:s.phase==='context'?'await next_input();':'// source: HIKAQ',y:102,size:56,color:DIM}],labelGain*(1-rec));
  question.set(-16.0,-3.8,1.2,[{text:'user: "'+s.typedQuestion+(s.typedQuestion.length===s.question.length?'"':''),size:58},{text:'// Do you still remember me?',size:31,y:88,color:DIM}],phase(t,75.65,75.90));
  reply.set(-16.0,-6.25,1.2,[{text:'assistant: "'+s.typedAnswer+(s.typedAnswer.length===s.reply.length?'"':''),size:58},{text:'// I know your name. But our conversations are missing.',size:30,y:90,color:DIM}],phase(t,76.23,76.48));

  root.updateMatrixWorld(true);
  const netLocal=netPath.getPoint(progress/3),netWorld=network.localToWorld(netLocal).toArray();
  // Approach the row that is ready on the beat. Chasing the moving scan head
  // during reveal caused an unnecessary leftward detour before landing.
  const transferRow=t<BEATS.stimulation?11:scalar;
  const diag=matrix.localToWorld(v([transferRow*.7-Nside+.56,Nside-transferRow*.7+.12,.60])).toArray();
  const band=ribbon.localToWorld(v([0,6.9-(s.tail-s.head-1)*.59,.35])).toArray();
  const origin=spatialCore(t);
  let world=blend(origin,netWorld,phase(t,HANDOFF,BEATS.first));world=blend(world,diag,phase(t,BEATS.stimulation-.50,BEATS.stimulation));world=blend(world,band,cx);world=blend(world,root.localToWorld(v([2,1,1.2])).toArray(),rec);
  eye.points.position.set(...world);eye.points.quaternion.copy(camera.quaternion);
  const depth=-v(world).applyMatrix4(camera.matrixWorldInverse).z,stable=clamp(depth/25.05,.45,2.2);
  const strike=Math.max(impact,s.rhythm.stimulation,s.rhythm.then,s.rhythm.only);
  const baseScale=eye.points.scale.x,baseGain=eye.mat.uniforms.gain.value,baseGlow=eye.glow.scale.x,baseGlowGain=eye.glowMat.uniforms.gain.value;
  eye.points.scale.setScalar(mix(baseScale,.041*1.2*stable*(1+.14*strike),take));eye.mat.uniforms.modelScale.value=eye.points.scale.x;eye.mat.uniforms.gain.value=mix(baseGain,1.05+.20*strike,take);
  eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(mix(baseGlow,mix(.17*1.2,.15,take)*stable*(1+.16*strike),take));eye.glowMat.uniforms.gain.value=mix(baseGlowGain,1.6+.35*strike,take);redLight.position.copy(eye.points.position);redLight.intensity=mix(redLight.intensity,16+4*strike,take);
  const screen=v(world).project(camera);const {A:_,...metadata}=s;
  return {...metadata,finite:world.every(Number.isFinite),persistentCore:true,worldPosition:world,screenCenter:[(screen.x+1)*960,(1-screen.y)*540],
   helixParticles:helix.geometry.getAttribute('parameter').count,attentionCells:N*N,networkNodes:48,historyGroups:36,contextCapacity:N,capacityUnits:'illustrative record groups',
   executionCue:EXECUTION,graphics:['network','causal-attention','context-band','broken-link'],identityLink:identityProgress,recallAttempt:attempt};
 }
 return {prepare,frame};
}
