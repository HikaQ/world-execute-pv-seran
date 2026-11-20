import * as THREE from 'three';
import {ramp,mix,clamp} from './score.js';
import {EXT,AMP,K,LIMIT,LAMBDA,wave,derivative} from './trajectory.js';
import {particlePath,particleCloud} from './particle-ink.js';

const WHITE='#ede4ff',PURPLE='#bd93ff';
const pointAt=(x,t)=>[x,wave(x,t),0];
const lerpPoint=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
const sample=(a,b,n,fn)=>Array.from({length:n},(_,i)=>fn(mix(a,b,i/(n-1)),i));

// The displayed central slice is the real scalar function. Neighboring slices
// are phase-offset instances, arranged in depth for the spatial metaphor.
export function fieldState(t){
 const deploy=ramp(t,46.17,47.18),settle=ramp(t,48.45,49.72);
 return {deploy,settle,depth:5.4*deploy*(1-settle),gain:1-settle};
}
export function fieldPoint(x,j,t){
 const s=fieldState(t),phase=j*.23*s.deploy;
 const normal=AMP*Math.sin(K*(x+EXT)+phase)*ramp(t,42.22,42.92);
 const bounded=LIMIT+AMP*Math.exp(-LAMBDA*(x+EXT))*Math.sin(K*(x+EXT)+phase)*s.gain;
 const depthTaper=mix(1,Math.exp(-.12*(x+EXT)),ramp(t,46.6,47.5));
 return [x,mix(normal,bounded,ramp(t,46.16666666666667,47.35)),j/4*s.depth*depthTaper];
}
export function secantState(t,x){
 const dx=3.8*(1-ramp(t,43.48,44.95)),a=pointAt(x,t),b=pointAt(x+dx,t);
 const slope=dx>1e-5?(b[1]-a[1])/dx:derivative(x,t);
 return {dx,a,b,slope,derivative:derivative(x,t)};
}

export function createCalculus({root,line,label,text}){
 const group=new THREE.Group();root.add(group);
 const chord=particlePath(group,{count:230,color:WHITE,size:2.55,intensity:1.5,width:.025}),dimension=line(group,PURPLE,1.1);
 const probe=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}));group.add(probe);
 const delta=label(group,{width:5,height:1.15,align:'center',render(g,w,h,s){text(g,`Δx = ${s.dx.toFixed(3)}`,0,0,105,WHITE);}});
 const readout=label(group,{width:18,height:1.8,at:[-9,-5.35,.1],render(g,w,h,s){text(g,s.line,0,0,56,WHITE);g.fillStyle='#ad94c8';g.font='600 38px "Geometry Notes"';g.fillText(s.note,0,80);}});
 const fieldLabel=label(group,{width:6.6,height:1.3,at:[-10.7,5.1,0],render(g){text(g,'HIKAQ / REFERENCE',0,0,85,PURPLE);g.fillStyle='#b9a6cf';g.font='600 55px "Geometry Notes"';g.fillText('// 以你为参照',0,115);}});
 const spokes=Array.from({length:17},(_,i)=>particlePath(group,{count:96,color:i%4===0?WHITE:PURPLE,size:i%4===0?2.3:2.1,intensity:1.6,width:.028}));
 const reference=particlePath(group,{count:560,color:'#d5a9ff',size:2.3,intensity:1.6}),tolerance=line(group,'#9d78d2',1.0);
 const columns=257,rows=39,copies=2;
 const fieldCloud=particleCloud(group,{count:columns*rows*copies,color:'#bd91ff',size:1.95,intensity:1.85});
 const samples=Array.from({length:fieldCloud.count},(_,i)=>{
  const seed=fieldCloud.seed[i],x=mix(-EXT,EXT,((i%columns)+seed*.8)/(columns-.2));
  const j=mix(-4,4,((Math.floor(i/columns)%rows)+((seed*17)%1)*.8)/(rows-.2));
  fieldCloud.phase[i]=(x+EXT)/(2*EXT);
  return {x,j,offset:(seed-.5)*.045,edge:Math.abs(j)/4};
 });
 fieldCloud.mesh.geometry.attributes.phase.needsUpdate=true;

 function frame(t,p){
  group.visible=t>=43.35&&t<49.75;
  if(!group.visible)return {active:false,secantDelta:0,tangentCount:0,fieldDepth:0,settled:t>=49.72};
  const state=secantState(t,p[0]),show=ramp(t,43.35,43.62),retire=1-ramp(t,45.9,46.55);
  const a=state.a,m=state.slope;
  const half=Math.min(mix(.25,4.3,ramp(t,43.55,44.55))/Math.sqrt(1+m*m),Math.max(.3,Math.min(a[1]+4.15,4.7-a[1]))/Math.max(.01,Math.abs(m)));
  chord.set([[a[0]-half,a[1]-half*m,.08],[a[0]+half,a[1]+half*m,.08]],show*retire);chord.tick(t);
  probe.visible=t<44.96;probe.position.set(state.b[0],state.b[1],.12);probe.material.opacity=show*(1-ramp(t,44.72,44.96));
  const bracketY=Math.min(a[1],state.b[1])-.7;
  dimension.set([[a[0],a[1],.04],[a[0],bracketY,.04],[state.b[0],bracketY,.04],[state.b[0],state.b[1],.04]],.6*show*(1-ramp(t,44.65,45.05)));
  delta.mesh.position.set((a[0]+state.b[0])/2,bracketY-.55,.1);delta.update({dx:state.dx},show*(1-ramp(t,44.65,45.1)));

  const field=fieldState(t),ribs=ramp(t,46.17,47.15),tail=1-ramp(t,48.55,49.57);
  let count=0;
  spokes.forEach((stroke,i)=>{
   const x=mix(-10.8,10.8,i/16),v=wave(x,t),s=derivative(x,t),grow=ramp(t,44.88+i*.043,45.22+i*.043),h=2.15*grow/Math.sqrt(1+s*s);
   const points=sample(-1,1,9,(u,j)=>lerpPoint([x+u*h,v+u*h*s,.015],fieldPoint(x,j-4,t),ribs));
   const opacity=grow*mix(i%4===0?.94:.76,.23,ribs)*tail;
   stroke.set(points,opacity);stroke.tick(t);if(grow>.98&&ribs<.01)count++;
  });
  samples.forEach((s,i)=>{
   const point=fieldPoint(s.x,s.j,t);point[1]+=s.offset;point[2]+=s.offset*.65;
   fieldCloud.positions.set(point,i*3);
   const taper=1-.94*ramp(s.x,-1,EXT)*ramp(t,47.15,48.2);
   fieldCloud.weights[i]=taper*(.5+.5*s.edge);
  });
  fieldCloud.tick(t);fieldCloud.finish(.82*ramp(t,46.25,46.95)*(1-ramp(t,48.7,49.65)));

  const referenceOn=ramp(t,47.45,47.95),referenceOff=1-ramp(t,49.25,49.72),span=EXT*ramp(t,47.42,48.05);
  reference.set([[-span,LIMIT,.055],[span,LIMIT,.055]],referenceOn*referenceOff);reference.tick(t);
  fieldLabel.mesh.position.y=4.6;fieldLabel.update({},referenceOn*(1-ramp(t,49.1,49.65)));
  const epsilon=mix(.8,.065,ramp(t,47.8,49.35)),effectiveAmplitude=AMP*field.gain;
  const start=Math.max(-EXT,Math.min(EXT,Math.log(Math.max(1e-9,effectiveAmplitude/epsilon))/LAMBDA-EXT));
  const bands=[[[start,LIMIT-epsilon,-.05],[EXT,LIMIT-epsilon,-.05]],[[start,LIMIT+epsilon,-.05],[EXT,LIMIT+epsilon,-.05]]];
  tolerance.set(bands.flat(),.5*referenceOn*referenceOff,true);
  const end=1-ramp(t,49.1,49.72);
  const lineText=t<45.0?`SECANT → TANGENT   /   Δx → 0`:t<46.17?`TANGENT FIELD   /   m = f′(x)`:t<47.7?'PHASE SLICES   /   ONE CONTINUOUS FIELD':`x > ${(start+EXT).toFixed(2)}  →  |f(x) − L| < ${epsilon.toFixed(3)}`;
  const note=t<45?'// 两点靠近，方向逐渐确定':t<46.17?'// 每一个位置，都有自己的方向':t<47.7?'// 从一条轨迹，展开为立体波束':'// 波动收束，以你为参照';
  readout.update({line:lineText,note},show*end);
  return {active:true,particleRendering:true,particleCount:fieldCloud.count+17*96+230+560,secantDelta:state.dx,secantSlope:state.slope,analyticSlope:state.derivative,tangentCount:count,fieldDepth:field.depth*2,fieldLayers:39,settled:field.settle>.999,epsilon,validFrom:start};
 }
 return {frame};
}
