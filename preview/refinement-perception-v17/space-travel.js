import * as THREE from 'three';
import {line,label,text} from './geometry.js';
import {ramp,mix,random} from './score.js';
import {TRAVEL,HELIX_START,GATES,HELIX_CENTER,helixTransform,helixPoint,helixWorld,spatialCore,spatialTip,flightCore,eraAt,corridorAdvance} from './spatial-score.js';
import {beatState,helixShot,helixGrowth,helixAppearance,helixBirthTime,HELIX_BUILD} from './helix-rhythm.js';
const WHITE='#e9e1ff',VIOLET='#c5a0ff',RED='#ff354d',DIM='#8f75af';
const sans='"Space Grotesk"',mono='"JetBrains Mono"';
function pairs(points,closed=true){const out=[];for(let i=1;i<points.length;i++)out.push(points[i-1],points[i]);if(closed)out.push(points.at(-1),points[0]);return out;}
function framePoints(w,h,z){return [[-w/2,-h/2,z],[w/2,-h/2,z],[w/2,h/2,z],[-w/2,h/2,z]];}

function makeHelix(scene){
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

function makeRedTrail(scene){
 const samples=80,perSample=6,count=samples*perSample,positions=new Float32Array(count*3),weights=new Float32Array(count),baseWeights=new Float32Array(count),jitter=[],rnd=random(1403653);
 for(let i=0;i<count;i++){
  const age=Math.floor(i/perSample)/(samples-1);
  baseWeights[i]=weights[i]=Math.pow(1-age,1.9)*(.8+.2*rnd());
  jitter.push([rnd()-.5,rnd()-.5,rnd()-.5]);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('weight',new THREE.BufferAttribute(weights,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  uniforms:{gain:{value:0}},vertexShader:`attribute float weight;uniform float gain;varying float vAlpha;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(.034*2050./max(.1,-mv.z),1.,4.2);vAlpha=weight*gain;if(mv.z>-.3)gl_PointSize=0.;}`,
  fragmentShader:`varying float vAlpha;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=dot(p,p);if(r>1.)discard;gl_FragColor=vec4(1.,.018,.065,vAlpha*(1.-smoothstep(.08,1.,r)));
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
 return {frame(t){
  const appearance=helixAppearance(t),gain=appearance.trail*.28;
  points.visible=gain>.001&&t<HELIX_BUILD.entryEnd+HELIX_BUILD.trailAge;mat.uniforms.gain.value=gain;
  if(points.visible)for(let s=0;s<samples;s++){
   const age=s/(samples-1),sampleTime=t-age*HELIX_BUILD.trailAge,history=spatialCore(sampleTime);
   const radius=.05+.08*age;
   for(let j=0;j<perSample;j++){const i=s*perSample+j;positions.set(history.map((v,k)=>v+jitter[i][k]*radius),i*3);weights[i]=sampleTime<HELIX_BUILD.entryEnd?baseWeights[i]:0;}
  }
  geo.attributes.position.needsUpdate=true;geo.attributes.weight.needsUpdate=true;
  return {visible:points.visible,gain,maxAge:HELIX_BUILD.trailAge,particles:count,headWorld:spatialCore(t),incomingOnly:true};
 }};
}

export function createSpaceTravel({scene,camera}){
 const space=new THREE.Group();scene.add(space);
 const gates=GATES.map((data,i)=>{
  const group=new THREE.Group();group.position.set(...data.position);group.rotation.z=data.roll;space.add(group);
  const outline=line(group,i%2?VIOLET:WHITE,1.8),inner=line(group,VIOLET,.9),ticks=line(group,DIM,.85),depth=line(group,VIOLET,1.1);
  outline.set(framePoints(21,13,0).concat([[-10.5,-6.5,0]]),1);
  inner.set(framePoints(22.5,14.5,-1.3).concat([[-11.25,-7.25,-1.3]]),1);
  const cornerPairs=[];for(const [x,y] of [[-10.5,-6.5],[10.5,-6.5],[10.5,6.5],[-10.5,6.5]])cornerPairs.push([x,y,0],[x/10.5*11.25,y/6.5*7.25,-1.3]);depth.set(cornerPairs,1,true);
  const tp=[];for(let j=-9;j<=9;j++){tp.push([j,6.5,0],[j,6.1+(j%3===0?-.25:0),0]);tp.push([j,-6.5,0],[j,-6.1,0]);}ticks.set(tp,1,true);
  const caption=label(group,{width:6.2,height:1.8,at:[-10.1,1.35,.05],render(g,w,h){text(g,data.label,0,0,142,WHITE,sans);text(g,`CHRONOLOGY / ${String(i+1).padStart(2,'0')}`,0,180,46,DIM);}});
  return {data,group,outline,inner,ticks,depth,caption};
 });
 const rnd=random(591247),cards=[];
 for(let i=0;i<20;i++){
  const side=i%2?1:-1,group=new THREE.Group();group.position.set(13+side*(12.5+rnd()*4),3.5+(rnd()-.5)*11,GATES[0].position[2]+6-i*6.1);group.rotation.set(0,side*-.26,(rnd()-.5)*.09);space.add(group);
  const panel=label(group,{width:5.6,height:4.9,at:[-2.8,0,0],render(g,w,h){g.fillStyle='rgba(20,13,33,.55)';g.fillRect(0,0,w,h);text(g,i%2?'STATE VECTOR':'TEMPORAL INDEX',50,45,72,VIOLET,sans);for(let j=0;j<15;j++){const row=Array.from({length:7},(_,k)=>((i*173+j*31+k*13)%256).toString(16).padStart(2,'0')).join(' ');text(g,row,50,175+j*73,46,j===i%15?WHITE:'#705c90');}text(g,`frame ${String(i*128).padStart(4,'0')} / local`,50,1320,46,VIOLET);}});
  const border=line(group,VIOLET,.8);border.set(pairs(framePoints(5.6,4.9,0)),1,true);cards.push({group,panel,border});
 }
 const rails=line(space,'#9b77c0',.9),railPairs=[];
 for(const [x,y] of [[-13,-8],[13,-8],[-13,8],[13,8]])for(let i=0;i<GATES.length-1;i++)railPairs.push([13+x,3.5+y,GATES[i].position[2]],[13+x,3.5+y,GATES[i+1].position[2]]);
 // Rails are individually clipped as they approach the camera to prevent
 // near-plane line quads from filling the screen with flashes.
 const dustCount=4200,p=new Float32Array(dustCount*3),c=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){const a=rnd()*Math.PI*2,r=11+rnd()*11;p.set([13+r*Math.cos(a),3.5+r*Math.sin(a)*.7,GATES[0].position[2]+15-rnd()*145],i*3);const color=new THREE.Color(i%11?VIOLET:WHITE).multiplyScalar(.35+rnd()*.35);c.set(color.toArray(),i*3);}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(p,3));dustGeo.setAttribute('color',new THREE.BufferAttribute(c,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:0,depthWrite:false}));space.add(dust);
 const helix=makeHelix(scene),redTrail=makeRedTrail(scene);
 function frame(t){
  const active=t>=TRAVEL,enter=ramp(t,TRAVEL,57.38);space.visible=active;
  space.position.z=corridorAdvance(t);
  const cameraZ=camera.position.z-space.position.z;
  gates.forEach(({data,group,outline,inner,ticks,depth,caption},i)=>{
   const d=cameraZ-data.position[2],gain=enter*ramp(d,-1,7);
   group.visible=active&&d>-.1&&gain>.001;
   outline.mat.opacity=gain*.9;inner.mat.opacity=gain*.45;ticks.mat.opacity=gain*.6;depth.mat.opacity=gain*.6;caption.update({},gain*ramp(t,57.2,57.42)*ramp(d,14,28));
  });
  cards.forEach(({group,panel,border})=>{const d=cameraZ-group.position.z,gain=enter*ramp(d,1,10);group.visible=active&&d>1;panel.update({},gain*.9);border.mat.opacity=gain*.5;});
  const clipped=[];for(let i=0;i<railPairs.length;i+=2){const a=railPairs[i].slice(),b=railPairs[i+1].slice(),z=Math.min(a[2],b[2]);if(z>cameraZ-3)continue;a[2]=Math.min(a[2],cameraZ-3);b[2]=Math.min(b[2],cameraZ-3);clipped.push(a,b);}rails.set(clipped,enter*.5,true);dust.material.opacity=enter*.8;
  const tr=helix.frame(t),trailState=redTrail.frame(t),appearance=helixAppearance(t);
  if(!active)return {active:false};
 const coreWorld=spatialCore(t),sourceWorld=spatialTip(t,1);
  const last=cards.at(-1),mesh=last.panel.mesh,bounds=[Infinity,Infinity,-Infinity,-Infinity];
  mesh.updateWorldMatrix(true,false);const positions=mesh.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   const p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(camera);
   bounds[0]=Math.min(bounds[0],p.x);bounds[1]=Math.min(bounds[1],p.y);bounds[2]=Math.max(bounds[2],p.x);bounds[3]=Math.max(bounds[3],p.y);
  }
  const lastPanel={index:cards.length-1,opacity:last.panel.mat.opacity,visible:last.group.visible&&mesh.visible,bounds};
  lastPanel.inView=lastPanel.visible&&bounds[2]>=-1&&bounds[0]<=1&&bounds[3]>=-1&&bounds[1]<=1;
  const probes=[0,.2,.4,.6,.8,1].flatMap(u=>[helixPoint(u,0,t),helixPoint(u,1,t)]);
  const zValues=probes.map(p=>p[2]);
  return {active:true,coreWorld,sourceWorld,phase:t<60.5?'space-travel':'particle-helix',year:eraAt(t).year,gateCrossings:GATES.filter(g=>t>=g.pass).map(g=>g.label),forwardTravel:cameraZ-GATES[0].position[2],corridor:{advance:space.position.z,lastPanel,exitMode:'pass-camera'},particleCount:helix.count,baseParticleCount:helix.baseParticleCount,growth:helixGrowth(t),appearance,emission:helix.emission,redTrail:trailState,backboneParticles:helix.backboneParticles,rungParticles:helix.rungParticles,rungs:helix.rungs,helixDepthSpan:Math.max(...zValues)-Math.min(...zValues),helixTransform:tr,helixVisible:helix.points.visible,depthTest:true,depthWrite:true,focus:false,shot:helixShot(t)?.id??null,beat:beatState(t)};
 }
 return {frame,particleCount:helix.count,gates:GATES};
}
