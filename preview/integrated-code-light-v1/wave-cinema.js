import * as THREE from 'three';
import {emissionLine} from './emission-line.js';
import {createCodeGround} from './code-ground.js';
import {particleCloud,particlePath} from '../refinement-geometry-v11/particle-ink.js';
import {CUT,phaseAt,coreLocal,curveY,curveSlope,deltaAt,flightX,weightAt,worldPoint,EXT,LIMIT,ramp,mix,originalPoint,curvePoint,pulseFront,contactBlendAt,referenceArrivalAt,referenceEntryDepth} from '../refinement-geometry-v11/wave-model.js';
const sample=(a,b,n,fn)=>Array.from({length:n},(_,i)=>fn(mix(a,b,i/(n-1)),i));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

// A single analytic filament supplies both its visible particles and the red
// core's center. The camera changes scale; the curve never chases the core.
export function createWaveCinema({scene,camera,eye,redLight,line}){
 const root=new THREE.Group();scene.add(root);root.scale.setScalar(1.2);root.visible=false;
 const flags=new URLSearchParams(location.search),glowEnabled=!flags.has('baseline')&&!flags.has('noGlow'),codeEnabled=!flags.has('baseline')&&!flags.has('noCode');
 const light=emissionLine(root),ground=createCodeGround(root),viewPoint=new THREE.Vector3();
 const body=particleCloud(root,{count:6800,color:'#ded0f4',size:1.55,intensity:1.42});
 const latent=particleCloud(root,{count:6800,color:'#ded0f4',size:1.55,intensity:1.42});
 const spine=particlePath(root,{count:1350,color:'#dfcdec',width:.006,size:1.15,intensity:1.35});
 const tail=particlePath(root,{count:460,color:'#ff456d',width:.027,size:1.6,intensity:1.5});
 const tangent=line(root,'#be95ff',1.35),secant=line(root,'#e1caff',1.15),axis=line(root,'#8f71b1',.62);
 const measure=line(root,'#a788c9',.64),baseline=line(root,'#be95ff',1.2),bands=line(root,'#9974c9',.65);
 const tangentStrokes=Array.from({length:9},(_,i)=>line(root,i%2===0?'#e6d8ff':'#b792ed',1.04));
 const floor=line(root,'#76638f',.60),majorFloor=line(root,'#9980b9',.74);
 const dust=particleCloud(root,{count:1800,color:'#baa2d1',size:1.25,intensity:1.1});
 const probe=new THREE.Mesh(new THREE.SphereGeometry(.054,20,16),new THREE.MeshBasicMaterial({color:new THREE.Color('#be95ff').multiplyScalar(2.5),transparent:true}));root.add(probe);
 const haloMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{gain:{value:1}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 v;uniform float gain;void main(){float r=length(v-.5);float a=exp(-r*r*38.)*(1.-smoothstep(.27,.5,r));gl_FragColor=vec4(vec3(.32,.12,.58)*gain*a,1.);}'});
 const halo=new THREE.Mesh(new THREE.PlaneGeometry(.95,.95),haloMat);root.add(halo);
 const seed=Array.from({length:body.count},(_,i)=>({angle:hash(i+18)*Math.PI*2,r:Math.sqrt(hash(i+39)),u:(i+.32*hash(i+8))/body.count}));
 function frame(t){
  const weight=weightAt(t),phase=phaseAt(t);root.visible=weight>.00001;
  if(!root.visible)return {active:false,weight,phase};
  root.position.set(...worldPoint([0,0,0],t));
  root.updateMatrixWorld(true);
  const unrolling=t<CUT.sine,flight=phase==='infinity',contact=phase==='contact',array=phase==='tangents',limit=t>=CUT.reference&&t<CUT.current,current=t>=CUT.current;
  const cp=coreLocal(t),x=cp[0],slope=curveSlope(x,t),anchor=flightX(t);
  const contactWeight=t<CUT.tangents?contactBlendAt(t):0;
  const a=flight?anchor-15:mix(-EXT,x-9,contactWeight),b=flight?anchor+155:mix(EXT,x+10,contactWeight),frontEdge=mix(x,b,contactWeight);
  const radius=flight?.037:mix(.033,.044,contactWeight);
  for(let i=0;i<body.count;i++){
   const q=seed[i],px=mix(a,b,flight?Math.pow(q.u,1.6):q.u),c=curvePoint(px,t),prev=curvePoint(px-.001,t),next=curvePoint(px+.001,t),vx=next[0]-prev[0],vy=next[1]-prev[1],norm=1/Math.max(.000001,Math.hypot(vx,vy));
   const r=radius*q.r,ny=Math.cos(q.angle)*r,nz=Math.sin(q.angle)*r;
   body.positions.set([c[0]-ny*vy*norm,c[1]+ny*vx*norm,nz],i*3);
   const front=!unrolling&&t<CUT.tangents?1-ramp(px,frontEdge-.01,frontEdge+.06):1,depth=flight?1-.55*ramp(px,anchor+24,anchor+145):1;
   const impulse=current?1+2.4*Math.exp(-(((px-pulseFront(t))/1.2)**2))*(1-ramp(t,50.32,50.56)):1;
   body.weights[i]=(.38+.55*(1-q.r))*front*depth*impulse;
   latent.positions.set([px,ny,nz],i*3);latent.weights[i]=(.38+.55*(1-q.r))*(1-ramp(x,px-.08,px+.08));
  }
  body.mat.uniforms.size.value=flight?1.9:1.55;body.mat.uniforms.intensity.value=flight?1.65:1.42;
  body.tick(t);body.finish(weight*(array?.7:1));
  latent.tick(t);latent.finish(t>=CUT.sine&&t<CUT.contact?weight*(1-ramp(t,CUT.sine,CUT.sine+.62)):0);
  spine.set(sample(a,!unrolling&&t<CUT.tangents?frontEdge:b,700,px=>curvePoint(px,t)),weight*(flight?.40:mix(.28,.24,contactWeight)));spine.tick(t);
  const glowEnd=!unrolling&&t<CUT.tangents?frontEdge:b;
  const lightPoints=sample(a,glowEnd,1050,px=>curvePoint(px,t)).filter(p=>{
   viewPoint.set(...p).applyMatrix4(root.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
   return viewPoint.z<-.3;
  });
  const lightWeights=lightPoints.map(p=>flight?1-.78*ramp(p[0],anchor+20,anchor+140):1);
  light.set(lightPoints,{gain:glowEnabled?weight*(array?.58:1):0,head:cp,headGain:unrolling?0:1,weights:lightWeights});
  const codeState=ground.update(t,codeEnabled?weight:0);
  root.userData.lightAudit={emissionEnabled:glowEnabled,emissionGain:light.mat.uniforms.gain.value,continuousSamples:lightPoints.length,code:codeState};
  const tailLength=flight?3.6:mix(1.1,.55,contactWeight);
  tail.set(sample(x-tailLength,x,80,px=>[px,curveY(px,t),.012]),unrolling?0:weight*.40);tail.tick(t);
  const dx=deltaAt(t),p2=[x+dx,curveY(x+dx,t),.05];
  const probeGain=ramp(dx,.015,.20),probeAppearance=ramp(t,CUT.contact+.02,CUT.contact+.29);probe.material.opacity=probeAppearance;probe.visible=contact&&probeGain*probeAppearance>.001;halo.visible=probe.visible;probe.scale.setScalar(Math.max(.001,probeGain));probe.position.set(...p2);halo.position.set(...p2);halo.quaternion.copy(camera.quaternion);haloMat.uniforms.gain.value=weight*.8*probeGain*probeAppearance;
  const m=dx>1e-6?(p2[1]-cp[1])/dx:slope,half=5.2*ramp(t,CUT.contact+.10,CUT.contact+.36)/Math.sqrt(1+m*m);
  secant.set([[x-half,cp[1]-m*half,.015],[x+half,cp[1]+m*half,.015]],contact?weight*.9*probeAppearance:0);
  const th=4.7/Math.sqrt(1+slope*slope);
  tangent.set([[x-th,cp[1]-slope*th,.02],[x+th,cp[1]+slope*th,.02]],contact?weight*ramp(t,45.20,45.37):0);
  const bracketY=Math.min(cp[1],p2[1])-.36;
  measure.set([[x,cp[1],0],[x,bracketY,0],[x,bracketY,0],[x+dx,bracketY,0],[x+dx,bracketY,0],p2],contact?weight*.4*probeAppearance*(1-ramp(t,45.05,45.35)):0,true);
  tangentStrokes.forEach((stroke,i)=>{const tx=mix(-10.6,10.6,i/8),ty=curveY(tx,t),tm=curveSlope(tx,t),on=ramp(t,CUT.tangents+i*.025,CUT.tangents+i*.025+.13),h=1.8*on/Math.sqrt(1+tm*tm);stroke.set([[tx-h,ty-h*tm,.015],[tx+h,ty+h*tm,.015]],array?weight*on*.88:0);});
  const axisPairs=[];
  if(!flight&&!contact&&!unrolling){axisPairs.push([[-EXT-1,limit?LIMIT:0,-.08],[EXT+1,limit?LIMIT:0,-.08]]);for(let i=-10;i<=10;i+=2)axisPairs.push([[i,-.09,-.08],[i,.09,-.08]]);}
  axis.set(axisPairs.flat(),weight*(limit?.10:.18),true);
  const refOn=limit?ramp(t,CUT.reference,CUT.reference+.36):flight?.10+.22*ramp(t,47.65,CUT.reference):0;
  baseline.set([[a,LIMIT,-.035],[b,LIMIT,-.035]],weight*refOn*.72);
  const eps=mix(.64,.07,ramp(t,CUT.limit,49.36)),epsStart=mix(2.8,-EXT,ramp(t,CUT.gap,49.6));
  bands.set([[epsStart,LIMIT-eps,-.04],[EXT+.3,LIMIT-eps,-.04],[epsStart,LIMIT+eps,-.04],[EXT+.3,LIMIT+eps,-.04]],limit?weight*.55*ramp(t,CUT.limit,CUT.limit+.15):0,true);
  const minor=[],major=[];
  if(flight){const start=Math.floor((anchor-32)/4)*4;for(let i=0;i<70;i++){const px=start+i*4,pair=[[px,-3.5,-38],[px,-3.5,38]];if(Math.round(px/4)%4===0)major.push(...pair);else minor.push(...pair);}for(const z of [-36,-24,-12,0,12,24,36])minor.push([anchor-32,-3.5,z],[anchor+248,-3.5,z]);}
  floor.set(minor,flight?weight*.18:0,true);majorFloor.set(major,flight?weight*.36:0,true);
  const tile=Math.floor(anchor/24);
  for(let i=0;i<dust.count;i++){const cell=Math.floor(i/300),key=(tile+cell-1)*300+i%300,px=(tile+cell-1)*24+hash(key+2)*24,pz=(hash(key+20)-.5)*22;dust.positions.set([px,-3.48+hash(key+43)*.055,pz],i*3);dust.weights[i]=.38*(1-ramp(px,anchor+75,anchor+125));}
  dust.tick(t);dust.finish(flight?weight*.72:0);
  const local=cp;
  eye.points.position.set(...worldPoint(local,t));eye.points.quaternion.copy(camera.quaternion);
  const ignition=t>=CUT.current?1+.24*Math.exp(-(((t-49.87)/.065)**2)):1;
  const arrival=t>=CUT.reference&&t<CUT.current?referenceArrivalAt(t):1;
  const viewDepth=-eye.points.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
  const desiredCore=flight?.045:mix(.036,.022,contactWeight),desiredGlow=flight?.145:mix(.14,.084,contactWeight);
  const arrivalCore=mix(.045*viewDepth/referenceEntryDepth,desiredCore,arrival),arrivalGlow=mix(.145*viewDepth/referenceEntryDepth,desiredGlow,arrival);
  const coreScale=mix(.0492,arrivalCore,weight)*ignition;eye.points.scale.setScalar(coreScale);eye.mat.uniforms.modelScale.value=coreScale;eye.mat.uniforms.gain.value=mix(1.05,1.12,weight);
  eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(mix(.204,arrivalGlow,weight));eye.glowMat.uniforms.gain.value=mix(1.6,1.15,weight);
  redLight.position.copy(eye.points.position);redLight.intensity=mix(16,4,weight);
  const projected=eye.points.position.clone().project(camera),labelPosition=new THREE.Vector3(...worldPoint([x+dx*.5,bracketY-.12,0],t)).project(camera),rulers=[];
  if(flight)for(let px=Math.floor((anchor-16)/16)*16;px<anchor+144;px+=16){const wp=new THREE.Vector3(...worldPoint([px,-3.40,4.1],t)),vp=wp.clone().applyMatrix4(camera.matrixWorldInverse),sp=wp.project(camera);if(vp.z<-.5&&Math.abs(sp.x)<.96&&Math.abs(sp.y)<.8)rulers.push({x:(sp.x+1)*960,y:(1-sp.y)*540,depth:-vp.z,value:(1+px*.085).toFixed(1)});}
  return {active:true,phase,weight,contactWeight,referenceArrival:arrival,coreScale,viewDepth,coreLocal:local,coreScreen:[(projected.x+1)*960,(1-projected.y)*540],coreWorld:eye.points.position.toArray(),curveRange:[a,b],slope,delta:dx,secantSlope:m,tangentCount:array?9:contact?1:0,flightDistance:flight?anchor:null,epsilon:eps,rulers,contactLabel:contact?[(labelPosition.x+1)*960,(1-labelPosition.y)*540]:null,
   formula:unrolling?'C = ∮ ds = 2πr':current?(t>=CUT.rectify?'v_in(t) → |v_in(t)| → low-pass':'v(t) = A sin(ωt)'):phase==='sine'?'y = A sin(kx)':contact?'Δx → 0    m = f′(x)':array?'T(x) = f(a) + f′(a)(x − a)':flight?'x → ∞':phase==='reference'?'y = L':'lim(x → ∞) f(x) = L',finite:[...local,...camera.position.toArray(),slope].every(Number.isFinite),protagonist:'SERAN',persistentCore:true};
 }
 return {frame,root};
}
