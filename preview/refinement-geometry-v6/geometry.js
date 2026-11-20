import * as THREE from 'three';
import {createCalculus} from './calculus.js';
import {particlePath} from './particle-ink.js';
import {LineSegments2} from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import {START,END,CUES,stageZ,ramp,mix,clamp,smooth} from './score.js';

export const NOTES='希苒的坐标空间从点到线从平面到体积描出完整圆周保持连续变化切线跟随当前位置逐渐接近希克设下的边界局部坐标维度展开圆周长度正弦波导数极限原点输入状态已就绪';
export async function loadGeometryFont(){
 const font=new FontFace('Geometry Notes','url("/preview/refinement-geometry-v6/geometry-notes.ttf")',{weight:'600'});
 document.fonts.add(await font.load());
}
const mono='"JetBrains Mono"',sans='"Space Grotesk"',zh='"Geometry Notes"';
const VIOLET='#c5a1ff',INK='#8f74bc',WHITE='#e8e0ff';
import {R,EXT,AMP,K,LIMIT,LAMBDA,MOTION,unroll,wave,derivative,movingPoint,presentationScaleAt} from './trajectory.js';
export {unroll,wave,derivative} from './trajectory.js';
const sample=(a,b,n,fn)=>Array.from({length:n},(_,i)=>fn(mix(a,b,i/(n-1)),i));
const v3=a=>new THREE.Vector3(...a);
function line(parent,color=VIOLET,width=1.4){
 const geo=new LineSegmentsGeometry(),mat=new LineMaterial({color,linewidth:width*1.5,transparent:true,opacity:1,depthWrite:false,worldUnits:false});
 // Reuse fixed-capacity buffers. Replacing interleaved attributes with a
 // growing arc leaves WebGL's cached maximum instance count at the first arc
 // length, silently truncating the circle to its first segment.
 const capacity=1024,positions=new Float32Array(capacity*6);
 mat.resolution.set(2880,1620);geo.setPositions(positions);geo.instanceCount=0;
 const mesh=new LineSegments2(geo,mat);mesh.frustumCulled=false;parent.add(mesh);
 return {mesh,mat,set(points,alpha=1,pairs=false){
  mesh.visible=alpha>.001&&points.length>1;if(!mesh.visible)return;
  const a=[];if(pairs){for(const p of points)a.push(...p);}else for(let i=1;i<points.length;i++)a.push(...points[i-1],...points[i]);
  if(a.length>positions.length)throw Error('Line capacity exceeded');
  positions.set(a);geo.attributes.instanceStart.data.needsUpdate=true;geo.instanceCount=a.length/6;mat.opacity=alpha;
 }};
}
function label(parent,{width=10,height=2,at=[0,0,0],align='left',render}){
 const cv=document.createElement('canvas');cv.width=1536;cv.height=Math.round(1536*height/width);
 const g=cv.getContext('2d'),texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.position.set(...at);if(align==='left')mesh.position.x+=width/2;
 mesh.renderOrder=3;parent.add(mesh);
 return {mesh,mat,update(data,alpha=1){
  mesh.visible=alpha>.001;mat.opacity=alpha;if(!mesh.visible)return;
  g.clearRect(0,0,cv.width,cv.height);g.textBaseline='top';render(g,cv.width,cv.height,data);texture.needsUpdate=true;
 }};
}
function text(g,s,x,y,size,color=WHITE,font=mono){g.fillStyle=color;g.font=`500 ${size}px ${font}`;g.fillText(s,x,y);}
function chinese(g,s,x,y,size=34){g.fillStyle='#b6a2cc';g.font=`600 ${size}px ${zh}`;g.fillText(s,x,y);}
function polyReveal(points,p){
 const q=clamp(p)*(points.length-1),n=Math.floor(q),out=points.slice(0,n+1);
 if(n<points.length-1)out.push(points[n].map((v,j)=>mix(v,points[n+1][j],q-n)));
 return out.length>1?out:[points[0],points[0]];
}
export function createGeometrySequence({scene,camera,lattice,eye,redLight}){
 const root=new THREE.Group();scene.add(root);root.visible=false;
 const baseLattice=lattice.geometry.attributes.position.array.slice();
 const cube=line(root,WHITE,1.9),axes=line(root,VIOLET,1.8),dimMarks=line(root,INK,1.0),grid=line(root,INK,.65);
 const circle=line(root,VIOLET,2.1),radius=line(root,WHITE,1.35),tickMarks=line(root,INK,1.05),measured=line(root,WHITE,1.65);
 const sine=line(root,VIOLET,2.15),trace=particlePath(root,{count:110,color:WHITE,size:2.3,width:.018});
 const curveGroup=new THREE.Group();root.add(curveGroup);curveGroup.add(circle.mesh);
 const particleCurve=particlePath(curveGroup);
 const calculus=createCalculus({root,line,label,text});
 const floorGrid=line(root,'#605078',.6);
 const sphereGeo=new THREE.SphereGeometry(.075,12,8),dotMat=new THREE.MeshBasicMaterial({color:WHITE});
 const corners=new THREE.InstancedMesh(sphereGeo,dotMat,8);root.add(corners);const dummy=new THREE.Object3D();
 const header=label(root,{width:24,height:3.4,at:[-12,7.5,0],render(g,w,h,s){
  text(g,s.title,0,0,s.compact?58:70,WHITE,sans);text(g,s.formula,0,s.compact?80:94,s.compact?38:45,'#bfa8de');chinese(g,s.note,0,s.compact?137:160,s.compact?30:35);
 }});
 const identity=label(scene,{width:4.8,height:1.5,at:[0,0,0],render(g,w,h,s){
  text(g,'SERAN / me',0,0,105,'#f4c5d3',sans);chinese(g,'// 希苒',0,135,74);
  text(g,s.pos,0,245,52,'#ab8ca8');
 }});
 const matrix=label(root,{width:6.9,height:5.6,at:[-13.2,-1.0,1],render(g,w,h,s){
  text(g,'LOCAL COORDINATES',0,0,71,VIOLET,sans);chinese(g,'// 局部坐标',0,95,52);
  const rows=[`x    ${s.p[0].toFixed(3)}`,`y    ${s.p[1].toFixed(3)}`,`z    ${s.p[2].toFixed(3)}`];
  rows.forEach((r,i)=>text(g,r,70,255+i*134,87,WHITE));
  text(g,'p = (x, y, z)',0,825,67,'#b59dcf');text(g,`rank(B) = ${s.rank}`,0,955,67,VIOLET);
 }});
 const code=label(root,{width:8.0,height:3.25,at:[4.8,-5.8,1],render(g,w,h,s){
  text(g,s.title,0,0,52,'#ad93cd',sans);g.fillStyle='#45354f';g.fillRect(0,84,w,2);
  s.rows.forEach((r,i)=>text(g,r,0,122+i*74,43,i===s.active?WHITE:'#917fa6'));
 }});
 const measurement=label(root,{width:9.5,height:2.2,at:[-4.75,-5.3,.2],render(g,w,h,s){
  text(g,s.top,0,0,80,WHITE,sans);text(g,s.bottom,0,105,51,'#af96ce');chinese(g,s.note,0,184,43);
 }});
 const axisLabels=[];
 for(let i=0;i<3;i++)axisLabels.push(label(root,{width:1.7,height:1.3,at:[0,0,0],align:'center',render(g,w,h){text(g,['x','y','z'][i],120,0,340,VIOLET,mono);}}));
 const vectorPaths=[[[0,0,0],[6,0,0]],[[0,0,0],[0,5,0]],[[0,0,0],[0,0,-6]]];
 function frame(t,cam){
  const active=t>=START;root.visible=active;identity.mesh.visible=active;
  // Reset the mutable lattice on every seek; frame order is never simulation state.
  const attr=lattice.geometry.attributes.position;
  if(!active){attr.array.set(baseLattice);attr.needsUpdate=true;eye.points.rotation.set(0,.055*Math.sin(t*.22),0);return {active:false,protagonist:'SERAN',persistentCore:true};}
  root.position.set(13,3.5,stageZ(t));
  curveGroup.visible=true;
  // Enlarge the subject inside the original camera move. Ease in only after
  // the handoff so the accepted Intro keeps its exact framing and velocity.
  const presentationScale=presentationScaleAt(t);
  root.scale.setScalar(presentationScale);
  const entry=ramp(t,START,36.32),dimAlpha=ramp(t,35.72,36.28)*(1-ramp(t,38.25,CUES.circle));
  const cubeP=ramp(t,36.0,36.65),cubeQ=ramp(t,36.65,37.28),cubeR=ramp(t,37.25,38.06666666666667);
  for(let i=0;i<attr.count;i++){
   const x=i%22,y=Math.floor(i/22)%14,z=Math.floor(i/(22*14));
   const target=[13+(x/21-.5)*10*presentationScale,3.5+(y/13-.5)*7*presentationScale,stageZ(t)+(z/15-.5)*6*presentationScale];
   const local=ramp(t,35.1+z*.011,36.15+z*.011);
   for(let a=0;a<3;a++)attr.array[i*3+a]=mix(baseLattice[i*3+a],target[a],local);
  }
  attr.needsUpdate=true;lattice.material.opacity=.95*(1-ramp(t,38.25,CUES.circle));lattice.visible=t<CUES.circle;
  const gridPairs=[];
  for(let x=-12;x<=12;x+=2)gridPairs.push([x,-4.3,-.06],[x,4.3,-.06]);
  for(let y=-4;y<=4;y++)gridPairs.push([-12,y,-.06],[12,y,-.06]);
  grid.set(gridPairs,.30*ramp(t,37.9,39.3)*(1-.55*ramp(t,43.2,44.5)),true);
  const floorPairs=[];for(let x=-18;x<=18;x+=2)floorPairs.push([x,-7.9,8],[x,-7.9,-24]);for(let z=-24;z<=8;z+=2)floorPairs.push([-18,-7.9,z],[18,-7.9,z]);
  floorGrid.set(floorPairs,.55*ramp(t,35.3,36.8)*(1-.3*ramp(t,43.2,44.5)),true);
  const cp=[];
  for(let i=0;i<8;i++)cp.push([(i&1?1:-1)*5*cubeP,(i&2?1:-1)*3.5*cubeQ,(i&4?1:-1)*3*cubeR]);
  const ed=[];for(let i=0;i<8;i++)for(let axis=0;axis<3;axis++){const j=i^(1<<axis);if(j>i)ed.push(cp[i],cp[j]);}
  cube.set(ed,dimAlpha,true);corners.visible=dimAlpha>.01;
  cp.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.setScalar(Math.max(.01,dimAlpha));dummy.updateMatrix();corners.setMatrixAt(i,dummy.matrix);});corners.instanceMatrix.needsUpdate=true;
  const basis=[];vectorPaths.forEach((ps,i)=>{const q=[cubeP,cubeQ,cubeR][i];basis.push(ps[0],ps[1].map(v=>v*q));
   for(const sign of [-1,1]){const end=ps[1].map(v=>v*q),side=end.slice();side[i]-=.42*(i===2?-1:1);side[(i+1)%3]+=.18*sign;basis.push(end,side);}
   axisLabels[i].mesh.position.set(...ps[1].map((v,j)=>v+(j===i?.65:0)));
   if(i===1)axisLabels[i].mesh.position.set(.65,4.65,.08);
   axisLabels[i].update({},dimAlpha*q);
  });axes.set(basis,dimAlpha,true);
  const dimensional=movingPoint(t),drop=[[dimensional[0],0,0],[dimensional[0],dimensional[1],0],[dimensional[0],dimensional[1],dimensional[2]]];
  dimMarks.set([[0,0,0],drop[0],drop[0],drop[1],drop[1],drop[2]],dimAlpha,true);
  matrix.update({p:dimensional,rank:cubeR>.9?3:cubeQ>.9?2:1},dimAlpha);

  const circleAlpha=ramp(t,38.55,CUES.circle)*(1-ramp(t,42.3,42.75));
  const unfolding=ramp(t,41,42.1),circlePoints=sample(-EXT,EXT,361,s=>unroll(s,unfolding));
  const arcReveal=ramp(t,MOTION.circle.start,MOTION.circle.end);
  circle.set(polyReveal(circlePoints,arcReveal),circleAlpha);
  const anglePoint=t<41?movingPoint(Math.max(CUES.circle,t)):unroll(-EXT,unfolding);
  radius.set([[0,0,0],anglePoint],circleAlpha*(1-unfolding));
  const ticks=[];for(let i=0;i<=32;i++){const a=-Math.PI+Math.PI*2*i/32,q=R+.12;const p=[Math.sin(a)*q,Math.cos(a)*q,0],p1=[Math.sin(a)*(q+(i%4===0?.25:.12)),Math.cos(a)*(q+(i%4===0?.25:.12)),0];ticks.push(p,p1);}
  tickMarks.set(ticks,circleAlpha*(1-unfolding)*.68,true);
  const y=-.75;measured.set([[-EXT,y,0],[EXT,y,0],[-EXT,y-.18,0],[-EXT,y+.18,0],[EXT,y-.18,0],[EXT,y+.18,0]],circleAlpha*unfolding,true);

  const sineAlpha=ramp(t,42.25,42.7),wavePoints=sample(-EXT,EXT,385,x=>[x,wave(x,t),0]);
  // The unrolled circumference itself becomes the wave. Keep one curve
  // renderer alive so a fading straight line cannot ghost below the wave.
  sine.mesh.visible=false;
  const particleReveal=ramp(t,42.22,42.6);
  if(t>=42.22)circle.set(wavePoints,1-particleReveal);
  particleCurve.set(wavePoints,particleReveal);particleCurve.tick(t);
  const point=movingPoint(t),traceStart=Math.max(-EXT,point[0]-2.9);
  trace.set(sample(traceStart,Math.max(traceStart+.001,point[0]),60,x=>[x,wave(x,t),.02]),sineAlpha);trace.tick(t);
  const slope=derivative(point[0],t);
  const calculusState=calculus.frame(t,point);

  const rank=cubeR>.99?3:cubeQ>.99?2:1;
  let title='01 / A SPACE TO EXIST',formula=`p = (x, y, z)   |   dim(span B) = ${rank}`,note='// 希苒的坐标空间';
  let codeTitle='BASIS / LOCAL INSTANCE',rows=['const me = new Point();','basis.extend("x", "y", "z");','me.position = [x, y, z];'],row=clamp(Math.floor((t-36.2)/.7),0,2);
  let readTop='R¹  →  R²  →  R³',readBottom='ONE POINT. THREE DIRECTIONS.',readNote='// 从点到线 · 从平面到体积';
  const phases=[{at:35.1,end:38.62},{at:38.62,end:42.35},{at:42.35,end:46.17},{at:46.17,end:END+1}];
  const phase=phases.findIndex(s=>t>=s.at&&t<s.end),phaseStart=phases[Math.max(0,phase)].at,phaseEnd=phases[Math.max(0,phase)].end;
  const textAlpha=ramp(t,phaseStart,phaseStart+.2)*(1-ramp(t,phaseEnd-.14,phaseEnd));
  if(phase===1){title='02 / THE PATH I TRACE';formula='C = ∮ ds = 2πr';note='// 描出完整圆周';codeTitle='ARC LENGTH / PRESERVED';rows=['r = 3.800;','s = r * theta;','C = 2 * PI * r;'];row=Math.min(2,Math.floor((t-38.6)/1.05));readTop=`C = ${(2*Math.PI*R).toFixed(3)}`;readBottom='radius × one complete turn';readNote='// 圆周长度';}
  if(phase===2){title='03 / FINDING A DIRECTION';formula='[f(x + Δx) − f(x)] / Δx → f′(x)';note='// 从两点连线，到当前位置的方向';codeTitle='LOCAL DERIVATIVE';rows=[`x     = ${(point[0]+EXT).toFixed(3)};`,`f(x)  = ${point[1].toFixed(3)};`,`f'(x) = ${slope.toFixed(3)};`];row=2;readTop=`df / dx = ${slope.toFixed(3)}`;readBottom='T(x) = f(a) + f\'(a)(x − a)';readNote='// 保持连续变化';}
  if(phase===3){title='04 / YOU BECOME MY REFERENCE';formula='f(x) = L + A(t) e^(−λx) sin(kx)';note='// 从波动，到稳定';codeTitle='BOUNDARY / HIKAQ';rows=['L = owner.boundary;','lim(x → ∞) f(x) = L;',`|f(x) - L| = ${Math.abs(point[1]-LIMIT).toFixed(5)};`];row=2;readTop='lim f(x) = L';readBottom='x → ∞    |    L = HIKAQ';readNote='// 极限';}
  header.update({title,formula,note,compact:t>=42.35},textAlpha*(1-ramp(t,49.1,49.75)));
  // Keep the title's safe top margin while aligning its left edge with the
  // wider plot. Formula/readout labels below the plot grow with the subject.
  header.mesh.scale.setScalar(1/presentationScale);
  header.mesh.position.set(12/presentationScale-12,(7.5-.22*(1-textAlpha))/presentationScale,0);
  code.update({title:codeTitle,rows,active:row},textAlpha*ramp(t,36.25,36.85)*(1-ramp(t,43.15,43.55)));
  measurement.update({top:readTop,bottom:readBottom,note:readNote},textAlpha*ramp(t,36.4,37.1)*(1-ramp(t,43.15,43.55)));
  const readoutLayout=ramp(t,38.25,38.85);
  code.mesh.position.y=mix(-6.4,-5.8,readoutLayout);
  measurement.mesh.position.y=mix(-6.35,-5.3,readoutLayout);

  // One and the same core from the opening. Only its trajectory and physical
  // scale change; there is no second Seran sprite or cross-faded replacement.
  const worldPoint=v3(point).multiplyScalar(presentationScale).add(root.position),blend=ramp(t,START,36.32);
  eye.points.position.lerp(worldPoint,blend);eye.points.scale.setScalar(mix(.013,.041,entry)*presentationScale);
  eye.points.quaternion.copy(camera.quaternion);eye.mat.uniforms.modelScale.value=eye.points.scale.x;
  eye.mat.uniforms.gain.value=mix(1,1.05,entry);eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);
  eye.glow.scale.setScalar(mix(.10,.17,entry)*presentationScale);eye.glowMat.uniforms.gain.value=mix(1.3,1.6,entry);
  redLight.position.copy(eye.points.position);redLight.intensity=16;
  identity.mesh.position.copy(eye.points.position).add(new THREE.Vector3(.6,1.0,.08).multiplyScalar(presentationScale));identity.mesh.quaternion.copy(camera.quaternion);identity.mesh.scale.setScalar(presentationScale);
  identity.update({pos:`[${point[0].toFixed(2)}, ${point[1].toFixed(2)}]`},ramp(t,35.5,36.35));
  const screen=eye.points.position.clone().project(camera);
  return {active:true,calculus:calculusState,protagonist:'SERAN',persistentCore:true,presentationScale,phase,phaseName:['points / dimension','circle / circumference','sine / tangent','infinity / boundary'][phase],worldPosition:eye.points.position.toArray(),localPosition:point,coreScreen:[(screen.x+1)*960,(1-screen.y)*540],latticeCount:attr.count,dimensionalRank:cubeR>.99?3:cubeQ>.99?2:1,circleRadius:R,circleArcLength:2*Math.PI*R,unfolding,slope,limit:LIMIT,limitError:Math.abs(point[1]-LIMIT),formula,finite:[...eye.points.position.toArray(),...point,slope].every(Number.isFinite),lyricsVisible:false};
 }
 return {frame,root,identity,curve:{mesh:curveGroup},grid,floorGrid};
}

export {line,label,text};
