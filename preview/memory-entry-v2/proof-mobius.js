import * as THREE from 'three';
import {CUES,ramp,centerAt,END} from '../refinement-care-v7/score.js';
import {createExistenceSequence as createLegacy,wordPoints} from '../refinement-care-v7/existence-legacy.js';

export const EXISTENCE_ENTRY=90.25;
export const TRANSITION={entryStart:90.25,entryEnd:90.94,exitStart:93.76,exitEnd:94.40};
export const MOBIUS={radius:8.2,halfWidth:2.65,columns:768,rows:80,flowSpeed:1.9,trailCount:224,haloCount:6000};
const TAU=Math.PI*2,origin=new THREE.Vector3(0,2.4,9);
const output=`\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n`;
const hash=x=>{x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;};

export function mobiusPoint(u,v){const r=MOBIUS.radius+v*Math.cos(u/2);return new THREE.Vector3(1.25*r*Math.cos(u),r*Math.sin(u),v*Math.sin(u/2));}
export const particleAngle=(u,v,t)=>u+(t-90.5)*MOBIUS.flowSpeed*(.96+.12*Math.cos(v/MOBIUS.halfWidth*Math.PI));
export const particlePosition=(u,v,t)=>mobiusPoint(particleAngle(u,v,t),v);

const surface=`
 vec3 surface(float u,float v){float r=8.2+v*cos(u*.5);return vec3(1.25*r*cos(u),r*sin(u),v*sin(u*.5));}
 vec3 surfaceNormal(float u,float v){
  float r=8.2+v*cos(u*.5),h=-.5*v*sin(u*.5);
  vec3 a=vec3(1.25*(h*cos(u)-r*sin(u)),h*sin(u)+r*cos(u),.5*v*cos(u*.5));
  vec3 b=vec3(1.25*cos(u*.5)*cos(u),cos(u*.5)*sin(u),sin(u*.5));return normalize(cross(a,b));
 }
 float flowAngle(float u,float v,float t){return u+(t-90.5)*1.9*(.96+.12*cos(v/2.65*3.141593));}
`;
const common=`
 uniform float gain,time,reply,arrival,word;
 uniform mat4 fromParent;
 uniform vec3 memoryOffset;
 varying float angle,across,grain,depth,stream,facing;
 varying float entryMix,transfer;
 varying vec3 nview,entryInk,exitInk;
 float sqr(float x){return x*x;}
 float ease(float a,float b,float t){float q=clamp((t-a)/(b-a),0.,1.);return q*q*q*(q*(q*6.-15.)+10.);}
 float widthFade(){return 1.-smoothstep(.54,1.14,abs(across));}
 float depthFade(){return mix(1.,.40,smoothstep(23.,42.,depth));}
 float light(){return .30+.70*abs(dot(normalize(nview),normalize(vec3(-.55,.85,.85))));}
 float sweep(){
  float d=mod(angle-(.70+6.283185*reply)+3.141593,6.283185)-3.141593;
  float head=exp(-sqr(d/.16));
  float trail=exp(d/.48)*step(d,0.)*step(-1.40,d);
  float moving=(head+trail*.32)*smoothstep(0.,.035,reply)*(1.-smoothstep(.97,1.,reply));
  float beacon=exp(-sqr((mod(angle-.70+3.141593,6.283185)-3.141593)/.14)-sqr((across-.4)/.25));
  return moving+beacon*.75*smoothstep(90.9,91.3,time)*(1.-smoothstep(0.,.07,reply));
 }
 float energy(){return sweep()+.45*exp(-sqr((abs(across)-arrival)/.24))*smoothstep(0.,.08,arrival)*(1.-smoothstep(.6,1.,arrival));}
`;
const flowingVertex=`${common}${surface}
 attribute float strength;
 attribute vec3 entryPosition,entryColor,exitPosition,exitColor;
 uniform float trailMode,haloMode;
 varying float streak;
 void main(){
  float u0=position.x,v=position.y,seed=position.z;
  float offset=trailMode*(1.-strength)*(.075+.055*seed);
  float u=flowAngle(u0,v,time-offset);
  vec3 nn=surfaceNormal(u,v),q=surface(u,v);
  entryMix=smoothstep(90.26+.12*seed,90.78+.16*seed,time);
  transfer=0.;
  vec3 source=(fromParent*vec4(entryPosition,1.)).xyz;
  float memoryGain=ease(93.95,94.423333,time)*ease(94.05,94.40,time);
  float col=clamp(floor(u0/6.283185*32.),0.,31.);
  vec3 destination=exitPosition+memoryOffset;
  destination.z+=(1.-memoryGain)*(-8.+sin(col/31.*3.141593)*4.);
  destination=(fromParent*vec4(destination,1.)).xyz;
  q=mix(source,q,entryMix);
  q.z+=sin(entryMix*3.141593)*(.35+.45*seed);
  q=mix(q,destination,transfer);
  entryInk=entryColor;exitInk=exitColor;
  vec4 base=modelViewMatrix*vec4(q,1.);vec3 nv=normalMatrix*nn;
  float signSide=sign(dot(nv,-base.xyz));
  q+=nn*signSide*(.025+.055*seed+haloMode*.09);
  vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;
  angle=u;across=v/2.65;grain=seed;depth=-mv.z;nview=nv;facing=abs(dot(normalize(nv),normalize(-mv.xyz)));
  // Unequal density travels with the particles; the surface itself stays fixed.
  float lobe=.5+.5*sin(u0*3.+v*.48+.3*sin(u0*2.));
  stream=.28+.72*pow(clamp(lobe,0.,1.),1.8);streak=strength;
  gl_PointSize=clamp((72.+seed*29.)*(1.+haloMode*1.9)/max(1.,-mv.z),1.1,haloMode>.5?9.:3.4);
 }
`;

export function createExistenceSequence(parent,camera,{cat}){
 const legacyRoot=new THREE.Group();parent.add(legacyRoot);const legacy=createLegacy(legacyRoot,camera);
 const root=new THREE.Group();root.name='flowing-mobius-particles';parent.add(root);
 const band=new THREE.Group();root.add(band);band.position.copy(origin);
 const materials=[];
 function material(vertexShader,fragmentShader,extra={},uniformExtras={}){
  const uniforms={gain:{value:1},time:{value:90.5},reply:{value:0},arrival:{value:0},word:{value:0},fromParent:{value:new THREE.Matrix4()},memoryOffset:{value:new THREE.Vector3()},...uniformExtras};
  const m=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,vertexShader,fragmentShader,...extra});materials.push(m);return m;
 }
 // Depth only in the dense middle of the band. There is no painted solid face.
 const bp=[],buv=[],indices=[],NX=288,NY=32;
 for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){
  const u=i/NX*TAU,v=(j/NY*2-1)*MOBIUS.halfWidth;
  bp.push(...mobiusPoint(u,v).toArray());buv.push(u,v/MOBIUS.halfWidth);
 }
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const k=j*(NX+1)+i;indices.push(k,k+1,k+NX+1,k+1,k+NX+2,k+NX+1);}
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bg.setAttribute('uv',new THREE.Float32BufferAttribute(buv,2));bg.setIndex(indices);
 const body=new THREE.Mesh(bg,material('varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  'uniform float gain;varying vec2 q;void main(){float edge=1.-smoothstep(.38,.94,abs(q.y));float d=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(d>edge*gain)discard;gl_FragColor=vec4(0.,0.,0.,1.);}',
  {colorWrite:false,depthWrite:true}));body.renderOrder=-3;band.add(body);
 const catPoints=cat.group.children.find(o=>o.isPoints),catGeometry=catPoints.geometry;
 const catPosition=catGeometry.attributes.position,catColor=catGeometry.attributes.ink;
 const catMatrix=new THREE.Matrix4().compose(new THREE.Vector3(-6.1,-2.55,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-.16,0)),new THREE.Vector3(2.65,2.65,2.65));
 const orderedCat=Array.from({length:catPosition.count},(_,i)=>i).sort((a,b)=>Math.atan2(catPosition.getY(a)-.6,catPosition.getX(a)+.1)-Math.atan2(catPosition.getY(b)-.6,catPosition.getX(b)+.1));
 const maskCanvas=document.createElement('canvas');maskCanvas.width=32;maskCanvas.height=20;
 const maskContext=maskCanvas.getContext('2d');maskContext.fillStyle='white';maskContext.font='bold 21px "JetBrains Mono"';maskContext.textAlign='center';maskContext.textBaseline='middle';maskContext.fillText('F',16,11);
 const mask=maskContext.getImageData(0,0,32,20).data;
 function particleGeometry(params,strength){
  const start=[],startColor=[],end=[],endColor=[];
  for(let k=0;k<params.length/3;k++){
   const u=params[k*3],v=params[k*3+1],s=params[k*3+2];
   const index=orderedCat[Math.min(orderedCat.length-1,Math.floor(((u/TAU+.003*s)%1)*orderedCat.length))];
   const p=new THREE.Vector3().fromBufferAttribute(catPosition,index).applyMatrix4(catMatrix);start.push(...p.toArray());
   startColor.push(catColor.getX(index)*.78,catColor.getY(index)*.78,catColor.getZ(index)*.78);
   const col=Math.min(31,Math.max(0,Math.floor(u/TAU*32))),row=Math.min(19,Math.max(0,Math.floor((v/(MOBIUS.halfWidth*1.14)+1)*10)));
   end.push(((col-15.5)*.78+(hash(k*2+7101)-.5)*.64)*1.16,((9.5-row)*.68+(hash(k*2+7102)-.5)*.53)*1.06,.075);
   const m=mask[(row*32+col)*4+3]/255,c=new THREE.Color('#241333').lerp(new THREE.Color('#eee6ff'),.015+m*.91);endColor.push(...c.toArray());
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(params,3));g.setAttribute('strength',new THREE.Float32BufferAttribute(strength,1));
  for(const [name,values] of Object.entries({entryPosition:start,entryColor:startColor,exitPosition:end,exitColor:endColor}))g.setAttribute(name,new THREE.Float32BufferAttribute(values,3));
  return g;
 }
 const params=[],strength=[];
 for(let j=0;j<MOBIUS.rows;j++)for(let i=0;i<MOBIUS.columns;i++){
  const k=j*MOBIUS.columns+i,s=hash(k*3+1),cross=hash(k*3+2);
  params.push((i+.12+.76*s)/MOBIUS.columns*TAU,((j+.12+.76*cross)/MOBIUS.rows*2-1)*MOBIUS.halfWidth*1.14,hash(k*3+3));strength.push(1);
 }
 const dots=new THREE.Points(particleGeometry(params,strength),material(flowingVertex,
  `${common}void main(){
   float disc=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*19.);
   float e=energy(),l=light();vec3 ink=mix(vec3(.30,.18,.49),vec3(1.05,.94,1.22),pow(l,1.4));
   ink+=vec3(1.55,1.45,1.75)*e;
   ink=mix(entryInk,ink,entryMix);ink=mix(ink,exitInk*1.40,smoothstep(.62,1.,transfer));
   float transitLight=sin(transfer*3.141593);ink+=vec3(.60,.45,.85)*transitLight;
   float departure=0.;
   float a=disc*gain*(.44+.34*grain)*widthFade()*depthFade()*(.42+.58*stream)*mix(mix(1.,.17,word),1.20,departure)*(1.+1.4*transitLight);
   if(a<.004)discard;gl_FragColor=vec4(ink,a);${output}}`,
  {transparent:true,depthWrite:false},{trailMode:{value:0},haloMode:{value:0}}));
 dots.frustumCulled=false;band.add(dots);

 // Sparse short trails follow the exact particle trajectories.
 const tp=[],ts=[];
 for(let i=0;i<MOBIUS.trailCount;i++){
  const u=hash(i*7+801)*TAU,v=(hash(i*7+802)*2-1)*MOBIUS.halfWidth*.98,s=hash(i*7+803);
  for(let j=0;j<6;j++){tp.push(u,v,s,u,v,s);ts.push(j/6,(j+1)/6);}
 }
 const trails=new THREE.LineSegments(particleGeometry(tp,ts),material(flowingVertex,
  `${common}varying float streak;void main(){
   float e=energy();float a=pow(clamp(streak,0.,1.),1.8)*.16*gain*widthFade()*depthFade()*(.24+.76*stream)*mix(1.,.12,word);
   gl_FragColor=vec4(vec3(.78,.67,1.)+vec3(1.2)*e,a);${output}}`,
  {transparent:true,depthWrite:false},{trailMode:{value:1},haloMode:{value:0}}));trails.frustumCulled=false;band.add(trails);

 const hp=[],hs=[];
 for(let i=0;i<MOBIUS.haloCount;i++){const side=hash(i*3+901)<.5?-1:1;hp.push(hash(i*3+902)*TAU,side*(.46+.70*hash(i*3+903))*MOBIUS.halfWidth,hash(i*3+904));hs.push(1);}
 const halo=new THREE.Points(particleGeometry(hp,hs),material(flowingVertex,
  `${common}void main(){float disc=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*14.);
   float a=disc*.085*gain*widthFade()*depthFade()*(.30+.70*stream)*mix(1.,.15,word);
   if(a<.002)discard;gl_FragColor=vec4(vec3(.52,.34,.78)+energy()*vec3(1.1),a);${output}}`,
  {transparent:true,depthWrite:false,blending:THREE.AdditiveBlending},{trailMode:{value:0},haloMode:{value:1}}));halo.frustumCulled=false;band.add(halo);

 const pulseGeo=new THREE.BufferGeometry(),pulsePos=new Float32Array(720*3),pulseA=new Float32Array(720);
 pulseGeo.setAttribute('position',new THREE.BufferAttribute(pulsePos,3));pulseGeo.setAttribute('strength',new THREE.BufferAttribute(pulseA,1));
 const pulseMat=material('attribute float strength;varying float a;void main(){a=strength;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(90./max(1.,-mv.z),1.4,4.);}',
  `uniform float gain;varying float a;void main(){float k=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*22.);if(a*k*gain<.008)discard;gl_FragColor=vec4(vec3(1.8,1.65,2.),a*k*gain);${output}}`,{transparent:true,depthWrite:false});
 const pulse=new THREE.Points(pulseGeo,pulseMat);root.add(pulse);pulse.frustumCulled=false;
 const word=wordPoints(root);word.points.material.depthTest=false;
 (globalThis.__mobiusFlowFixtures??=[]).push({body,dots,trails,halo,root,band});
 function frame(t){
  const active=t>=EXISTENCE_ENTRY;root.visible=active&&t<TRANSITION.exitEnd;legacyRoot.visible=!active;if(!active)return legacy.frame(t);
  const age=t-90.5;band.rotation.set(.42+.035*age,-.30+.050*age,-.23+.018*age);band.updateMatrix();
  const reply=ramp(t,CUES.reference,CUES.existence-.19),arrival=ramp(t,CUES.existence,CUES.existence+.6);
  const assemble=ramp(t,CUES.existence-.25,CUES.existence),wordGain=ramp(t,CUES.existence-.23,CUES.existence-.015);
  const entryGain=ramp(t,90.25,90.38),exitGain=1,inverseBand=band.matrix.clone().invert();
  const memoryOffset=new THREE.Vector3(...centerAt(t)).sub(new THREE.Vector3(...centerAt(Math.min(t,END))));
  for(const m of materials){m.uniforms.gain.value=entryGain*exitGain;m.uniforms.time.value=t;m.uniforms.reply.value=reply;m.uniforms.arrival.value=arrival;m.uniforms.word.value=wordGain;m.uniforms.fromParent.value.copy(inverseBand);m.uniforms.memoryOffset.value.copy(memoryOffset);}
  body.visible=t>=90.94;
  for(const mesh of [trails,halo])mesh.material.uniforms.gain.value*=ramp(t,90.74,90.94)*(1-ramp(t,93.76,94.02));
  const open=ramp(t,90.25,91.25),human=new THREE.Vector3(9.4+3.1*open,8*open,10*open)
   .lerp(mobiusPoint(.70,.40*MOBIUS.halfWidth).applyMatrix4(band.matrix),ramp(t,90.5,91.25));
  const exit=mobiusPoint(.70,0).applyMatrix4(band.matrix),protagonist=origin.clone();
  const progress=ramp(t,CUES.existence-.23,CUES.existence),fade=1-ramp(t,CUES.existence,CUES.existence+.11);
  const curve=new THREE.QuadraticBezierCurve3(exit,exit.clone().lerp(protagonist,.48).add(new THREE.Vector3(0,.9,1.2)),protagonist);
  for(let i=0;i<720;i++){const u=i/719,q=curve.getPoint(u),a=i*2.399963;q.y+=.045*Math.sin(a);q.z+=.045*Math.cos(a);pulsePos.set(q.toArray(),i*3);pulseA[i]=u<=progress?Math.exp(-Math.pow((u-progress)/.12,2))*fade:0;}
  pulseGeo.attributes.position.needsUpdate=true;pulseGeo.attributes.strength.needsUpdate=true;pulse.visible=t>CUES.existence-.23&&fade>.001;
  const wordDisplayGain=wordGain;word.update(t,assemble,wordDisplayGain,camera.quaternion);
  return {active:true,gain:entryGain*exitGain,open,reply,arrival,assemble,wordGain,legacyGain:1-ramp(t,90.25,90.63),corePath:ramp(t,90.25,91.15),
   protagonist:protagonist.toArray(),human:human.toArray(),pulsePosition:curve.getPoint(progress).toArray(),surfaces:1,
   surfaceShape:'flowing-particle-mobius-band',boundaryComponents:1,particleCount:params.length/3,haloParticles:MOBIUS.haloCount,
   codeGlyphs:0,gridLines:0,edgeOutlines:0,particleFlow:true,flowSpeed:MOBIUS.flowSpeed,trailCount:MOBIUS.trailCount,
   trackedParticle:particlePosition(.6,.9,t).toArray(),rigidBand:true,wordParticles:word.count,keyword:'EXISTENCE',
   oldCubeVisible:false,oldChapterOverlayVisible:false,groundVisible:false,oldContextRecovered:false,wordDisplayGain,
   transition:{entry:ramp(t,TRANSITION.entryStart,TRANSITION.entryEnd),exit:ramp(t,TRANSITION.exitStart,TRANSITION.exitEnd),entryGain,exitGain},
   bandEuler:band.rotation.toArray().slice(0,3),responseCue:CUES.reference,arrivalCue:CUES.existence};
 }
 return {frame};
}
