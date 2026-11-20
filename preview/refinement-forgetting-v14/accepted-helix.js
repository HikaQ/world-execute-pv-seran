// Isolated copy of the accepted V16 helix geometry and motion.
import * as THREE from 'three';
import {random} from '../refinement-perception-v16/score.js';
import {HELIX_CENTER,helixTransform} from '../refinement-perception-v16/spatial-score.js';
import {beatState,helixGrowth,helixBirthTime,HELIX_BUILD} from '../refinement-perception-v16/helix-rhythm.js';
const WHITE='#e9e1ff';
export function makeHelix(scene){
 const parameters=[],kinds=[],colors=[],sizes=[],seeds=[],births=[],rnd=random(611203),red=new THREE.Color('#ff204c'),violet=new THREE.Color('#ad69ff'),white=new THREE.Color(WHITE);
 const add=(p,kind,color,size)=>{parameters.push(...p);kinds.push(kind);colors.push(...color.toArray());sizes.push(size);seeds.push(rnd());births.push(helixBirthTime(p[0]/HELIX_BUILD.materialStretch));};
 // The backbones are tubes, not flat strokes. Every longitudinal slice has
 // particles around its circumference, and all points write/test real depth.
 for(let strand=0;strand<2;strand++)for(let i=0;i<620;i++)for(let j=0;j<15;j++){
  const u=(i+.22*rnd())/620,angle=(j+rnd()*.25)/15*Math.PI*2,radius=.13+.11*rnd();
  const tint=(strand?violet:red).clone().lerp(white,.025+rnd()*.10);
  add([u,strand,radius,angle],0,tint,.035+rnd()*.024);
 }
 for(let k=0;k<39;k++)for(let j=0;j<66;j++)for(let ring=0;ring<3;ring++){
  const v=j/65,u=(k+.5)/39,tint=red.clone().lerp(violet,v).lerp(white,.18);
  add([u,v,.055+.045*rnd(),ring*Math.PI*2/3+rnd()*.25],1,tint,.027+rnd()*.017);
 }
 const baseParticleCount=kinds.length;
 // These are material samples, not a pre-existing model. Each sample has a
 // birth time at a moving tip. Future samples remain completely invisible.
 for(let chunk=1;chunk<=24;chunk++){
  const slices=chunk<=2?310:90,ringSamples=chunk<=2?8:4;
  for(let strand=0;strand<2;strand++)for(let i=0;i<slices;i++)for(let j=0;j<ringSamples;j++){
   const u=chunk+(i+.22*rnd())/slices,angle=(j+rnd()*.25)/ringSamples*Math.PI*2;
   add([u,strand,.13+.11*rnd(),angle],0,(strand?violet:red).clone().lerp(white,.025+rnd()*.10),.035+rnd()*.024);
  }
  const across=chunk<=2?36:16,tubeRings=chunk<=2?2:1;
  for(let k=0;k<39;k++)for(let j=0;j<across;j++)for(let ring=0;ring<tubeRings;ring++){
   const v=j/(across-1),u=chunk+(k+.5)/39;
   add([u,v,.055+.045*rnd(),ring*Math.PI*2/3+rnd()*.25],1,red.clone().lerp(violet,v).lerp(white,.18),.027+rnd()*.017);
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('parameter',new THREE.Float32BufferAttribute(parameters,4));geo.setAttribute('kind',new THREE.Float32BufferAttribute(kinds,1));geo.setAttribute('tint',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));geo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));geo.setAttribute('birth',new THREE.Float32BufferAttribute(births,1));
 geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(kinds.length*3),3));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:true,depthTest:true,blending:THREE.NormalBlending,uniforms:{spin:{value:0},yaw:{value:0},roll:{value:0},time:{value:0},beat:{value:0},waveAt:{value:-1},waveGain:{value:0}},
  vertexShader:`attribute vec4 parameter;attribute float kind,size,seed,birth;attribute vec3 tint;uniform float spin,yaw,roll,time,beat,waveAt,waveGain;varying vec3 vTint;varying float vAlpha;
   void main(){float age=time-birth;float u=1.-parameter.x;
    float mature=smoothstep(.06,.24,age),tube=parameter.z*mix(.12,1.,mature);
    float a=u*3.14159265359*5.8+spin;float r=2.9;vec3 p;
    if(kind<.5){a+=parameter.y*3.14159265359;r+=tube*cos(parameter.w);p=vec3((u-.5)*20.+tube*sin(parameter.w),r*cos(a),r*sin(a));}
    else{r*=1.-2.*parameter.y;float d=tube*sin(parameter.w);p=vec3((u-.5)*20.+tube*cos(parameter.w),r*cos(a)-d*sin(a),r*sin(a)+d*cos(a));}
    vec3 q=vec3(p.x*cos(yaw)+p.z*sin(yaw),p.y,-p.x*sin(yaw)+p.z*cos(yaw));p=vec3(q.x*cos(roll)-q.y*sin(roll),q.x*sin(roll)+q.y*cos(roll),q.z);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float depth=max(.1,-mv.z);
    float show=smoothstep(0.,.03,age)*mix(.18,1.,mature);
    if(kind>.5)show=smoothstep(.24,.40,age);
    if(age<0.)show=0.;
    if(u>=1.){
     show*=exp(-max(0.,depth-45.)*.020);
     if(kind>.5)show*=exp(-max(0.,depth-25.)*.040);
    }
    gl_PointSize=clamp(size*2050./depth,1.1,8.5)*sqrt(max(.001,show));if(mv.z>-.3||show<.003)gl_PointSize=0.;
    float far=clamp((depth-20.)/24.,0.,1.);float pulse=exp(-pow((u-waveAt)/.075,2.))*waveGain;
    float fresh=exp(-max(0.,age)/.10);
    vTint=tint*mix(1.32,.48,far)*(1.+pulse*mix(.22,.9,kind)+beat*.045+fresh*.24*(1.-kind));vAlpha=show;
   }`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;void main(){vec2 q=(gl_PointCoord-.5)*2.;float rr=dot(q,q);if(rr>.94||vAlpha<.003)discard;vec3 n=vec3(q,sqrt(max(0.,1.-rr)));vec3 light=normalize(vec3(-.45,.65,1.));float d=.27+.73*max(0.,dot(n,light));float spec=pow(max(0.,dot(n,normalize(vec3(-.2,.3,1.)))),24.)*.5;gl_FragColor=vec4(vTint*d+spec*vTint,vAlpha*(1.-smoothstep(.65,1.,rr)));
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`
 });
 const points=new THREE.Points(geo,mat);points.position.set(...HELIX_CENTER);points.frustumCulled=false;scene.add(points);
 const backboneCount=kinds.filter(kind=>kind===0).length;
 const ordered=births.slice().sort((a,b)=>a-b),strandBirths=births.filter((_,i)=>kinds[i]===0).sort((a,b)=>a-b),rungBirths=births.filter((_,i)=>kinds[i]===1).sort((a,b)=>a-b);
 const countBorn=(array,time)=>{let lo=0,hi=array.length;while(lo<hi){const mid=(lo+hi)>>1;if(array[mid]<=time)lo=mid+1;else hi=mid;}return lo;};
 let emission={};
 return {points,count:kinds.length,baseParticleCount,backboneParticles:backboneCount,rungParticles:kinds.length-backboneCount,rungs:39*25,get emission(){return emission;},frame(t){
  const tr=helixTransform(t),beat=beatState(t),growth=helixGrowth(t),born=countBorn(ordered,t);
  mat.uniforms.spin.value=tr.spin;mat.uniforms.yaw.value=tr.yaw;mat.uniforms.roll.value=tr.roll;
  mat.uniforms.time.value=t;
  mat.uniforms.beat.value=beat.pulse;mat.uniforms.waveAt.value=beat.travel;mat.uniforms.waveGain.value=beat.weight;
  points.visible=born>0;
  emission={birthAtTips:true,globalReveal:false,bornParticles:born,unbornParticles:births.length-born,
   bornBackboneParticles:countBorn(strandBirths,t),matureBackboneParticles:countBorn(strandBirths,t-HELIX_BUILD.matureEnd),
   connectingRungParticles:countBorn(rungBirths,t-HELIX_BUILD.rungStart),earliestBirth:ordered[0],
   materialProgress:[0,growth.grownU],maturationSeconds:[HELIX_BUILD.matureStart,HELIX_BUILD.matureEnd],rungAgeSeconds:[HELIX_BUILD.rungStart,HELIX_BUILD.rungEnd]};
  return tr;
 }};
}
