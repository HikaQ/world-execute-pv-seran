import * as THREE from 'three';
import {CUES,ramp} from './score.js';
import {createExistenceSequence as createLegacy,wordPoints} from './existence-legacy.js';

export const EXISTENCE_ENTRY=90.5;
export const MOBIUS={radius:8.2,halfWidth:2.65,columns:960,rows:84};
const TAU=Math.PI*2,origin=new THREE.Vector3(0,2.4,9);
const output=`\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n`;

// M(0,v) = M(2π,-v): a single half-twisted surface with one closed boundary.
export function mobiusPoint(u,v){
 const r=MOBIUS.radius+v*Math.cos(u*.5);
 return new THREE.Vector3(r*Math.cos(u)*1.25,r*Math.sin(u),v*Math.sin(u*.5));
}
function normalAt(u,v){
 return mobiusPoint(u+.0001,v).sub(mobiusPoint(u-.0001,v))
  .cross(mobiusPoint(u,v+.0001).sub(mobiusPoint(u,v-.0001))).normalize();
}
const common=`
 uniform float gain,time,reply,arrival,word;
 varying float angle,across; varying vec3 nview;
 float sweep(){
  float head=.70+6.283185*reply;
  float d=mod(angle-head+3.141593,6.283185)-3.141593;
  float lead=exp(-pow(d/.095,2.));
  float tail=exp(d/.42)*step(d,0.)*step(-1.25,d);
  return (lead+tail*.26)*smoothstep(0.,.035,reply)*(1.-smoothstep(.97,1.,reply));
 }
 float lighting(){
  vec3 n=normalize(nview);return .24+.76*abs(dot(n,normalize(vec3(-.55,.85,.85))));
 }
 float energy(){return sweep()+.48*exp(-pow((abs(across)-arrival)/.20,2.))*smoothstep(0.,.08,arrival)*(1.-smoothstep(.6,1.,arrival));}
`;
function addAttributes(geometry,positions,normals,uvs,seeds){
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 if(seeds)geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
 return geometry;
}
function append(p,n,uv,u,v){p.push(...mobiusPoint(u,v).toArray());n.push(...normalAt(u,v).toArray());uv.push(u,v/MOBIUS.halfWidth);}
function hash(x){x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;}

export function createExistenceSequence(parent,camera){
 const legacyRoot=new THREE.Group();parent.add(legacyRoot);const legacy=createLegacy(legacyRoot,camera);
 const root=new THREE.Group();root.name='single-mobius-surface';parent.add(root);
 const band=new THREE.Group();root.add(band);band.position.copy(origin);
 const materials=[];
 function material(vertexShader,fragmentShader,extra={}){
  const uniforms={gain:{value:1},time:{value:90.5},reply:{value:0},arrival:{value:0},word:{value:0}};
  const m=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,vertexShader,fragmentShader,...extra});materials.push(m);return m;
 }
 const vertex=`${common}void main(){angle=uv.x;across=uv.y;nview=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const p=[],n=[],uv=[],indices=[],NX=320,NY=40;
 for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++)append(p,n,uv,i/NX*TAU,(j/NY*2-1)*MOBIUS.halfWidth);
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){let k=j*(NX+1)+i;indices.push(k,k+1,k+NX+1,k+1,k+NX+2,k+NX+1);}
 const geo=addAttributes(new THREE.BufferGeometry(),p,n,uv);geo.setIndex(indices);
 const body=new THREE.Mesh(geo,material(vertex,`${common}void main(){
  float d=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(d>gain)discard;
  vec3 ink=mix(vec3(.006,.004,.012),vec3(.023,.015,.041),lighting());
  gl_FragColor=vec4(ink*(1.-word*.55),1.);${output}}`,{depthWrite:true}));
 body.renderOrder=-3;band.add(body);
 const dp=[],dn=[],du=[],seeds=[];
 for(let j=0;j<MOBIUS.rows;j++)for(let i=0;i<MOBIUS.columns;i++){
  const seed=hash((j*MOBIUS.columns+i)*3+1);
  const crossSeed=hash((j*MOBIUS.columns+i)*3+2);
  append(dp,dn,du,(i+.17+.66*seed)/MOBIUS.columns*TAU,((j+.17+.66*crossSeed)/MOBIUS.rows*2-1)*MOBIUS.halfWidth);seeds.push(seed);
 }
 const dots=new THREE.Points(addAttributes(new THREE.BufferGeometry(),dp,dn,du,seeds),material(
  `${common}attribute float seed;varying float grain;void main(){angle=uv.x;across=uv.y;nview=normalMatrix*normal;grain=seed;
   vec4 mv0=modelViewMatrix*vec4(position,1.);float side=sign(dot(normalMatrix*normal,-mv0.xyz));
   vec4 mv=modelViewMatrix*vec4(position+normal*.012*side,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((65.+seed*29.)/max(1.,-mv.z),1.1,3.0);}`,
  `${common}varying float grain;void main(){
   float disc=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*20.);
   float lit=lighting(),edge=smoothstep(.60,1.,abs(across)),pulse=energy();
   vec3 ink=mix(vec3(.25,.15,.43),vec3(.89,.82,1.05),pow(lit,1.35));ink+=vec3(.8,.76,.9)*edge*.27+vec3(1.4,1.3,1.6)*pulse;
   float a=disc*gain*(.40+.32*grain)*mix(1.,.13,word);if(a<.006)discard;gl_FragColor=vec4(ink,a);${output}}`,
  {transparent:true,depthWrite:false}));
 dots.frustumCulled=false;band.add(dots);
 const lp=[],ln=[],lu=[];
 const segment=(a,b,v)=>{append(lp,ln,lu,a,v);append(lp,ln,lu,b,v);};
 for(let j=0;j<=8;j++){const v=(j/8*2-1)*MOBIUS.halfWidth;for(let i=0;i<480;i++)segment(i/480*TAU,(i+1)/480*TAU,v);}
 for(let i=0;i<72;i++)for(let j=0;j<24;j++){
  append(lp,ln,lu,i/72*TAU,(j/24*2-1)*MOBIUS.halfWidth);append(lp,ln,lu,i/72*TAU,((j+1)/24*2-1)*MOBIUS.halfWidth);
 }
 const wires=new THREE.LineSegments(addAttributes(new THREE.BufferGeometry(),lp,ln,lu),material(vertex,
  `${common}void main(){float rim=smoothstep(.97,.999,abs(across));float light=lighting(),e=energy();
   vec3 ink=mix(vec3(.37,.25,.55),vec3(.95,.87,1.15),rim)+vec3(1.4)*e;
   float a=mix(.105,.77,rim)*gain*(.5+.5*light)*mix(1.,.16,word);gl_FragColor=vec4(ink,a);${output}}`,
  {transparent:true,depthWrite:false}));band.add(wires);
 // A short directed reply leaves the band when it reaches the protagonist.
 const pulseGeo=new THREE.BufferGeometry(),pulsePos=new Float32Array(720*3),pulseA=new Float32Array(720);
 pulseGeo.setAttribute('position',new THREE.BufferAttribute(pulsePos,3));pulseGeo.setAttribute('strength',new THREE.BufferAttribute(pulseA,1));
 const pulseMat=material('attribute float strength;varying float a;void main(){a=strength;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(90./max(1.,-mv.z),1.4,4.);}',
  `uniform float gain;varying float a;void main(){float k=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*22.);if(a*k*gain<.008)discard;gl_FragColor=vec4(vec3(1.8,1.65,2.),a*k*gain);${output}}`,{transparent:true,depthWrite:false});
 const pulse=new THREE.Points(pulseGeo,pulseMat);root.add(pulse);pulse.frustumCulled=false;
 const word=wordPoints(root);word.points.material.depthTest=false;
 function frame(t){
  const active=t>=EXISTENCE_ENTRY;root.visible=active;legacyRoot.visible=!active;
  if(!active)return legacy.frame(t);
  // One rigid band: no shape stretching, wobble or superimposed rings.
  const age=t-EXISTENCE_ENTRY;band.rotation.set(.42+.06*age,-.30+.095*age,-.23+.035*age);band.updateMatrix();
  const reply=ramp(t,CUES.reference,CUES.existence-.19),arrival=ramp(t,CUES.existence,CUES.existence+.6);
  const assemble=ramp(t,CUES.existence-.25,CUES.existence),wordGain=ramp(t,CUES.existence-.23,CUES.existence-.015);
  for(const m of materials){m.uniforms.gain.value=1;m.uniforms.time.value=t;m.uniforms.reply.value=reply;m.uniforms.arrival.value=arrival;m.uniforms.word.value=wordGain;}
  const open=ramp(t,90.25,91.25),human=new THREE.Vector3(9.4+3.1*open,8*open,10*open)
   .lerp(mobiusPoint(.70,.40*MOBIUS.halfWidth).applyMatrix4(band.matrix),ramp(t,90.5,91.25));
  const exit=mobiusPoint(.70,0).applyMatrix4(band.matrix),protagonist=origin.clone();
  const progress=ramp(t,CUES.existence-.23,CUES.existence),fade=1-ramp(t,CUES.existence,CUES.existence+.11);
  const curve=new THREE.QuadraticBezierCurve3(exit,exit.clone().lerp(protagonist,.48).add(new THREE.Vector3(0,.9,1.2)),protagonist);
  for(let i=0;i<720;i++){const u=i/719,q=curve.getPoint(u),a=i*2.399963;q.y+=.045*Math.sin(a);q.z+=.045*Math.cos(a);pulsePos.set(q.toArray(),i*3);pulseA[i]=u<=progress?Math.exp(-Math.pow((u-progress)/.12,2))*fade:0;}
  pulseGeo.attributes.position.needsUpdate=true;pulseGeo.attributes.strength.needsUpdate=true;pulse.visible=t>CUES.existence-.23&&fade>.001;
  const wordDisplayGain=wordGain*(1-ramp(t,93.75,5645/60));
  word.update(t,assemble,wordDisplayGain,camera.quaternion);
  return {active:true,gain:1,open:ramp(t,90.25,91.25),reply,arrival,assemble,wordGain,
   legacyGain:0,corePath:ramp(t,90.25,91.15),protagonist:protagonist.toArray(),human:human.toArray(),pulsePosition:curve.getPoint(progress).toArray(),
   surfaces:1,surfaceShape:'single-half-twisted-mobius-band',boundaryComponents:1,particleCount:dp.length/3,codeGlyphs:0,
   wordParticles:word.count,keyword:'EXISTENCE',oldCubeVisible:false,oldChapterOverlayVisible:false,groundVisible:false,oldContextRecovered:false,
   rigidBand:true,wordDisplayGain,bandEuler:band.rotation.toArray().slice(0,3),responseCue:CUES.reference,arrivalCue:CUES.existence};
 }
 return {frame};
}
