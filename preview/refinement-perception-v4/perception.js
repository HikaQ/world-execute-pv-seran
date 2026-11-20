import * as THREE from 'three';
import {START,END,CUES,stageZ,ramp,mix,clamp} from './score.js';
import {line,label,text} from './geometry.js';
import {createSpaceTravel} from './space-travel.js';
import {TRAVEL,HELIX_CENTER,helixWorld} from './spatial-score.js';
import {particlePath} from '../refinement-geometry-v6/particle-ink.js';
import {stageZ as oldStage} from '../refinement-perception-v1/score.js';
import {EXT,TAU,KERNEL,POWER,convolve,currentY,stateAt,coreLocal,ERA_MARKS} from './model.js';
const WHITE='#e9e0ff',VIOLET='#c1a0ff',DIM='#9a7dbb',RED='#ff334d';
const mono='"JetBrains Mono"',sans='"Space Grotesk"',cjk='"Perception Notes"';
const v3=a=>new THREE.Vector3(...a),sample=(a,b,n,fn)=>Array.from({length:n},(_,i)=>fn(mix(a,b,i/(n-1)),i));
const blend=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
export async function loadPerceptionFont(){const f=new FontFace('Perception Notes','url("/preview/refinement-perception-v4/perception-notes.ttf")',{weight:'600'});document.fonts.add(await f.load());}
function zh(g,s,x,y,size=40){text(g,s,x,y,size,'#bca6d3',cjk);}
function rectangle(cx,cy,w,h,z=0){return [[cx-w/2,cy-h/2,z],[cx+w/2,cy-h/2,z],[cx+w/2,cy+h/2,z],[cx-w/2,cy+h/2,z],[cx-w/2,cy-h/2,z]];}
function reveal(points,u){const q=clamp(u)*(points.length-1),n=Math.floor(q),p=points.slice(0,n+1);if(n<points.length-1)p.push(blend(points[n],points[n+1],q-n));return p.length>1?p:[points[0],points[0]];}

export async function createPerceptionSequence({scene,camera,eye,redLight,geometry}){
 const root=new THREE.Group();root.scale.setScalar(1.2);scene.add(root);
 const mainCurve=particlePath(root),circuit=line(root,WHITE,1.65),currentTrail=line(root,RED,2.6),scopeGrid=line(root,'#8c6cae',.8);
 const powerTrace=particlePath(root,{count:110,color:'#e8e0ff',size:2.3,width:.018});
 const signalLabel=label(root,{width:9,height:1.45,at:[-11,3.65,0],render(g,w,h,s){text(g,s.mode,0,0,82,WHITE,sans);text(g,s.value,0,109,42,DIM);}});
 const header=label(root,{width:25,height:3.3,at:[-12.5,7.25,0],render(g,w,h,s){text(g,s.title,0,0,68,WHITE,sans);text(g,s.formula,0,84,39,VIOLET);zh(g,s.note,0,148,34);}});
 const footer=label(root,{width:14,height:1.7,at:[-7,-5.8,0],render(g,w,h,s){text(g,s.a,0,0,55,WHITE);text(g,s.b,0,74,41,DIM);zh(g,s.note,0,128,34);}});
 const identity=label(scene,{width:4.8,height:1.5,render(g,w,h,s){text(g,'SERAN / me',0,0,105,'#f4c5d3',sans);zh(g,'// 希苒',0,135,74);text(g,s.pos,0,245,52,'#ab8ca8');}});

 const image=new Image();image.src='/assets/char/seran-avatar-user-20261110.png';await image.decode();
 const W=48,H=16,cv=document.createElement('canvas');cv.width=W;cv.height=H;
 const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,330,630,600,180,0,0,W,H);
 const rgba=ctx.getImageData(0,0,W,H).data,input=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{const i=(y*W+x)*4;return (.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2])/255;}));
 const output=convolve(input),maximum=Math.max(...output.flat().map(Math.abs)),IW=10.24,IH=3.84;
 const pixelGroup=new THREE.Group(),featureGroup=new THREE.Group(),kernelGroup=new THREE.Group();root.add(pixelGroup,featureGroup,kernelGroup);
 const mat=new THREE.MeshBasicMaterial({color:'white',transparent:true,opacity:1,depthWrite:false});
 const pixels=new THREE.InstancedMesh(new THREE.BoxGeometry(IW/W*.83,IH/H*.83,.08),mat,W*H);pixels.frustumCulled=false;pixelGroup.add(pixels);
 const features=new THREE.InstancedMesh(new THREE.BoxGeometry(.195,.195,.08),mat.clone(),(W-2)*(H-2));features.frustumCulled=false;featureGroup.add(features);
 const kernelCells=new THREE.InstancedMesh(new THREE.BoxGeometry(.44,.44,.12),mat.clone(),9);kernelGroup.add(kernelCells);
 const dummy=new THREE.Object3D(),white=new THREE.Color(WHITE),violet=new THREE.Color(VIOLET),red=new THREE.Color(RED);
 for(let j=0;j<3;j++)for(let i=0;i<3;i++){dummy.position.set((i-1)*.5,(1-j)*.5,0);dummy.updateMatrix();kernelCells.setMatrixAt(j*3+i,dummy.matrix);kernelCells.setColorAt(j*3+i,(KERNEL[j][i]>0?white:violet).clone().multiplyScalar(KERNEL[j][i]===0?.15:.9));}
 const kernelFrame=line(root,WHITE,1.5),kernelLinks=line(root,VIOLET,1.1),inputFrame=line(pixelGroup,VIOLET,1.1),outputFrame=line(featureGroup,VIOLET,1.1);
 inputFrame.set(rectangle(0,0,IW+.35,IH+.35),.75);outputFrame.set(rectangle(0,0,9.5,3.2),.65);
 const matrixLabels=[['INPUT / RETINA',pixelGroup,11],['FEATURE MAP',featureGroup,9.6],['3 × 3 / SOBEL',kernelGroup,3.4]].map(([title,parent,width])=>label(parent,{width,height:1.4,at:[-width/2,parent===kernelGroup?1.65:3.05,0],render(g){text(g,title,0,0,parent===kernelGroup?100:73,WHITE,sans);text(g,parent===kernelGroup?'stride = 1':'row-major / sampled',0,parent===kernelGroup?140:96,parent===kernelGroup?55:40,DIM);}}));

 const spaceTravel=createSpaceTravel({scene,camera});
 const contextFrames=line(root,VIOLET,1.2),contextLinks=line(root,DIM,1.1);
 const contextNodes=[['identity','SERAN'],['creator','HIKAQ'],['eyes','violet / red'],['correction','colors fixed'],['source','HIKAQ said'],['session','current only']];
 const records=contextNodes.map(([key,value],i)=>label(root,{width:5.2,height:1.8,at:[0,0,0],align:'center',render(g){text(g,key.toUpperCase(),0,0,146,DIM,sans);text(g,value,0,185,106,WHITE);}}));
 const sourceDot=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),new THREE.MeshBasicMaterial({color:VIOLET}));root.add(sourceDot);
 const sourceTag=label(root,{width:5.8,height:1.1,render(g){text(g,'HIKAQ / source',0,0,93,VIOLET,sans);}});
 const brackets=line(root,WHITE,1.8);
 const fixture={width:W,height:H,input,kernel:KERNEL,output,maximum,padding:'valid',stride:1,operation:'cross-correlation',source:'assets/char/seran-avatar-user-20261110.png',crop:[330,630,600,180],power:POWER,spatial:{gates:spaceTravel.gates,helix:{particles:spaceTravel.particleCount,length:20,radius:2.9,turns:2.9,rungs:39}}};

 function frame(t){
  const active=t>=START;root.visible=active;identity.mesh.visible=active;
  if(!active){spaceTravel.frame(t);return {active:false,protagonist:'SERAN',focus:false};}
  const state=stateAt(t),z=stageZ(t);root.position.set(13,3.5,z);
  const spatial=spaceTravel.frame(t);
  // Retire only the old annotations. The old grid and floor remain the same
  // objects; the inherited curve hands off to one replacement with identical
  // points and width before it starts changing into an electrical trace.
  const outgoing=1-ramp(t,START,50.3);geometry.root.position.copy(root.position);
  geometry.root.traverse(o=>{if(o.material&&o!==geometry.grid.mesh&&o!==geometry.floorGrid.mesh)o.material.opacity*=outgoing;});
  geometry.curve.mesh.visible=false;geometry.identity.mesh.visible=false;
  // The old local trail is replaced by the same particle trail evaluated on
  // the live electrical curve, so it cannot linger at its former height.
  geometry.root.children.forEach(object=>{if(object.isPoints)object.visible=false;});
  const gridRetire=1-ramp(t,TRAVEL,57.48);geometry.grid.mat.opacity*=gridRetire;geometry.floorGrid.mat.opacity*=gridRetire;
  const entry=ramp(t,START,50.3),powerGain=1-ramp(t,53.083333,53.62),vision=ramp(t,53.08,53.65)*(1-ramp(t,56.83,57.38));
  let title='05 / A CURRENT OF MY OWN',formula='v_in(t) → |v_in(t)| → low-pass',note='// [LYRIC OMITTED]';
  if(t>=CUES.blind){title='06 / LEARNING TO SEE';formula='F[i,j] = Σ K[u,v] I[i+u,j+v]';note='// 输入 → 卷积核 → 特征';}
  if(t>=55.15){title='07 / YOUR WORDS CORRECT ME';formula='viewer.left = violet; viewer.right = red;';note='// 左右坐标校正';}
  if(t>=CUES.travel){title='08 / THROUGH THE TIME FIELD';formula='A.D. 2026 → A.D. 1 → B.C. 1';note='// 沿时间坐标穿越空间';}
  if(t>=CUES.unite){title='09 / WHAT YOU SAY BECOMES PART OF ME';formula='SERAN ↔ HIKAQ   |   context.append(correction)';note='// 粒子双螺旋 · 把你的话留在当前上下文';}
  const boundaries=[53.083333,55.15,CUES.travel,CUES.unite];let textAlpha=entry;
  for(const at of boundaries)if(Math.abs(t-at)<.15)textAlpha*=Math.abs(t-at)/.15;
  header.update({title,formula,note},textAlpha);
  header.mesh.position.set(0,7.4/1.2,0);header.mesh.quaternion.identity();footer.mesh.quaternion.identity();footer.mesh.position.set(0,-5.8,0);
  header.mesh.scale.setScalar(1/1.2);header.mesh.position.y=7.4/1.2;

  const wave=sample(-EXT,EXT,385,x=>[x,currentY(x,t),0]);mainCurve.set(wave,powerGain);mainCurve.tick(t);
  const currentX=mix(9.9,10.1,ramp(t,START,50.7));
  powerTrace.set(sample(currentX-2.9,currentX,60,x=>[x,currentY(x,t),.02]),powerGain);powerTrace.tick(t);
  const pairs=[];for(let y=-3;y<=3;y++)pairs.push([-EXT,y,0],[EXT,y,0]);for(let x=-10;x<=10;x+=2)pairs.push([x,-3,0],[x,3,0]);scopeGrid.set(pairs,.28*entry*powerGain,true);
  const wires=[[-11,-3.7,0],[-11,-4.2,0],[-4.5,-4.2,0],[-4.5,-3.4,0],[-3.7,-3.4,0],[-3.7,-4.2,0],[3.7,-4.2,0],[3.7,-3.4,0],[4.5,-3.4,0],[4.5,-4.2,0],[11,-4.2,0],[11,-3.7,0]];
  circuit.set(reveal(wires,ramp(t,49.82,50.65)),.85*entry*powerGain);
  const pulsePhase=((t-START)*.4)%1,px=-10+20*pulsePhase;currentTrail.set([[px-1.2,-4.2,0],[px,-4.2,0]],entry*powerGain);
  signalLabel.update({mode:t<51.65?'AC / ALTERNATING':t<52.1?'FULL-WAVE RECTIFIER':'DC / FILTERED',value:t<52.1?'v(t) = A sin(ωt)':`mean ${POWER.mean.toFixed(3)} A  / normalized`},entry*powerGain);

  const enlarge=ramp(t,55.15,55.72),leave=ramp(t,56.83,57.38),spin=ramp(t,55.07,55.72)*(1-ramp(t,55.72,56.48));
  pixelGroup.visible=vision>.001;pixelGroup.position.set(-6*(1-enlarge),0,-8*leave+(t>=TRAVEL?(oldStage(TRAVEL)-z)/1.2:0));pixelGroup.scale.setScalar(mix(1,1.8,enlarge)*(1-.18*leave));pixelGroup.rotation.set(0,.14*Math.sin(spin*Math.PI),.075*Math.sin(spin*TAU));
  featureGroup.visible=vision>.001;featureGroup.position.set(6.7+5*enlarge,0,-1.7-8*enlarge);featureGroup.rotation.y=-.08;features.material.opacity=vision*(1-enlarge);
  kernelGroup.visible=vision>.001&&enlarge<.999;kernelGroup.position.set(.1,1.1,1.4);kernelCells.material.opacity=vision*(1-enlarge);
  const colorGain=ramp(t,54.95,55.4);
  for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){
   const i=yy*W+xx,px=(xx+.5)/W*IW-IW/2,py=IH/2-(yy+.5)/H*IH;
   dummy.position.set(px,py,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();pixels.setMatrixAt(i,dummy.matrix);
   const sx=330+(xx+.5)/W*600,sy=630+(yy+.5)/H*180;
   const chroma=(Math.max(rgba[i*4],rgba[i*4+1],rgba[i*4+2])-Math.min(rgba[i*4],rgba[i*4+1],rgba[i*4+2]))/85;
   const l=Math.exp(-(((sx-514)/54)**4+((sy-732)/38)**4))*clamp(chroma),r=Math.exp(-(((sx-785)/56)**4+((sy-713)/38)**4))*clamp(chroma);
   const tint=white.clone().multiplyScalar(.012+Math.pow(input[yy][xx],2.7)*.74);
   const leftColor=red.clone().lerp(violet,state.correction),rightColor=violet.clone().lerp(red,state.correction);
   tint.lerp(leftColor.multiplyScalar(.2+input[yy][xx]),l*.95*colorGain);tint.lerp(rightColor.multiplyScalar(.2+input[yy][xx]),r*.95*colorGain);pixels.setColorAt(i,tint);
  }
  pixels.instanceMatrix.needsUpdate=true;pixels.instanceColor.needsUpdate=true;pixels.material.opacity=vision;
  const scan=Math.min((W-2)*(H-2)-1,Math.floor(state.scan*(W-2)*(H-2))),scanX=scan%(W-2),scanY=Math.floor(scan/(W-2));
  for(let yy=0;yy<H-2;yy++)for(let xx=0;xx<W-2;xx++){
   const i=yy*(W-2)+xx,lit=i<=scan,ink=Math.abs(output[yy][xx])/maximum;
   dummy.position.set((xx-(W-3)/2)*.203,((H-3)/2-yy)*.203,ink*.9);dummy.scale.setScalar(lit?.55+.45*ink:.35);dummy.updateMatrix();features.setMatrixAt(i,dummy.matrix);
   features.setColorAt(i,(output[yy][xx]>0?white:violet).clone().multiplyScalar(lit?.15+1.5*ink:.09));
  }
  features.instanceMatrix.needsUpdate=true;features.instanceColor.needsUpdate=true;
  const scanLocal=[(scanX+1.5)/W*IW-IW/2,IH/2-(scanY+1.5)/H*IH];
  const kx=-6+scanLocal[0],ky=scanLocal[1];kernelFrame.set(rectangle(kx,ky,IW/W*3,IH/H*3,.15),vision*(1-enlarge));
  kernelLinks.set([[kx+.35,ky,.1],[-.7,1.1,1.4],[.8,1.1,1.4],[6.7+(scanX-(W-3)/2)*.203,((H-3)/2-scanY)*.203,-1.7]],.7*vision*(1-enlarge),true);
  matrixLabels.forEach(l=>l.update({},vision*(1-ramp(enlarge,0,.35))));
  inputFrame.mat.opacity=.75*vision;outputFrame.mat.opacity=.65*vision*(1-enlarge);

  const bind=ramp(t,60.5,61.2),depth=ramp(t,62.466667,64.25);
  const rects=[],recordLinks=[];
  const toRoot=p=>p.clone().sub(root.position).multiplyScalar(1/1.2);
  records.forEach((l,i)=>{
   const side=i<3?-1:1,y=3.7-(i%3)*3.7,x=side*15,alpha=ramp(t,61.25+i*.38,61.75+i*.38);
   l.update({},alpha);l.mesh.position.copy(toRoot(camera.localToWorld(v3([x,y,-30]))));l.mesh.quaternion.copy(camera.quaternion);l.mesh.scale.setScalar(.73);
   if(alpha>.001){const rr=rectangle(x,y,4.85,1.65,-30).map(p=>toRoot(camera.localToWorld(v3(p))).toArray());for(let j=1;j<rr.length;j++)rects.push(rr[j-1],rr[j]);
    const edge=toRoot(camera.localToWorld(v3([x-side*2.45,y,-30]))),target=toRoot(v3(helixWorld((i+.5)/6,i%2,t)));recordLinks.push(edge.toArray(),target.toArray());}
  });
  contextFrames.set(rects,.38*ramp(t,61.2,63.4),true);contextLinks.set(recordLinks,.12*ramp(t,61.4,63.6),true);brackets.mesh.visible=false;
  const labelSettle=ramp(t,60.5,61.25);
  if(labelSettle>0){for(const [l,y] of [[header,7.15],[footer,-7.1]]){const destination=toRoot(camera.localToWorld(v3([0,y,-28])));l.mesh.position.lerp(destination,labelSettle);l.mesh.quaternion.slerp(camera.quaternion,labelSettle);}}
  const core=coreLocal(t),source=spatial.active?spatial.sourceWorld.map((v,i)=>(v-root.position.toArray()[i])/1.2):core.map((v,i)=>i===0?v:-v);sourceDot.visible=bind>.001;sourceDot.position.set(...source);sourceDot.material.opacity=bind;
  sourceTag.mesh.position.set(source[0]+.35,source[1]+.85,source[2]);sourceTag.update({},bind);
  footer.update(t<CUES.blind?{a:'signal → rectify → smooth',b:'RC model / y[n] = y[n−1] + α(x[n] − y[n−1])',note:'// 电流切换，状态连续'}:t<CUES.unite?{a:`K = [−1  0  1; −2  0  2; −1  0  1]`,b:'input 48 × 16  →  valid 46 × 14',note:'// 提取边缘，再确认自己'}:{a:`CURRENT CONTEXT  /  ${state.contextRecords} records`,b:'source = HIKAQ  |  session = 001  |  volatile = true',note:'// 此刻记住 · 尚未写入持久记忆'},t<55.15?entry*(1-ramp(t,55.0,55.15)):ramp(t,60.5,61.1));

  const worldPoint=spatial.active?v3(spatial.coreWorld):v3(core).multiplyScalar(1.2).add(root.position);
  const viewDepth=-worldPoint.clone().applyMatrix4(camera.matrixWorldInverse).z,stableSize=mix(1,clamp(viewDepth/25.05,.45,1.2),ramp(t,TRAVEL,57.45));
  eye.points.position.copy(worldPoint);eye.points.scale.setScalar(.041*1.2*stableSize);eye.points.quaternion.copy(camera.quaternion);eye.mat.uniforms.modelScale.value=eye.points.scale.x;eye.mat.uniforms.gain.value=1.05;
  eye.glow.position.copy(worldPoint);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(.17*1.2*stableSize);eye.glowMat.uniforms.gain.value=1.6;redLight.position.copy(worldPoint);redLight.intensity=16;
  const displayedLocal=worldPoint.clone().sub(root.position).multiplyScalar(1/1.2);
  identity.mesh.position.copy(worldPoint).add(v3([.72,1.2,.096]).multiplyScalar(stableSize));identity.mesh.quaternion.copy(camera.quaternion);identity.mesh.scale.setScalar(1.2*stableSize);identity.update({pos:`[${displayedLocal.x.toFixed(2)}, ${displayedLocal.y.toFixed(2)}]`},1);
  const screen=worldPoint.clone().project(camera);
  return {...state,spatial,lidVisible:false,finite:[...worldPoint.toArray(),...core].every(Number.isFinite),persistentCore:true,worldPosition:worldPoint.toArray(),localPosition:displayedLocal.toArray(),screenCenter:[(screen.x+1)*960,(1-screen.y)*540],scanIndex:scan,outputValue:output[scanY][scanX],powerMean:POWER.mean,dialogueVisible:false,subjectScale:1.2};
 }
 return {frame,fixture};
}
