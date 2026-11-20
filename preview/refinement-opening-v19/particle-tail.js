import * as THREE from 'three';
import {baseCameraAt,random,ramp} from './score.js';
export const TAIL={start:24.75,ready:25.1,fade:34.35,end:35.1,lifetime:.36,count:1400};
export function createParticleTail(scene,camera){
 const n=TAIL.count,rnd=random(416327),positions=new Float32Array(n*3),ages=new Float32Array(n),seeds=new Float32Array(n),phases=new Float32Array(n),radii=new Float32Array(n),angles=new Float32Array(n);
 for(let i=0;i<n;i++){seeds[i]=rnd();phases[i]=rnd();radii[i]=Math.min(2.8,Math.sqrt(-2*Math.log(Math.max(.001,rnd()))));angles[i]=rnd()*Math.PI*2;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('age',new THREE.BufferAttribute(ages,1));geo.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  uniforms:{gain:{value:0},focal:{value:2225},time:{value:0}},
  vertexShader:`attribute float age,seed;uniform float gain,focal,time;varying float energy;varying vec3 tint;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp((.018+.030*seed)*focal/max(.5,-mv.z),1.4,6.2);
    energy=.24*gain*pow(1.-age,1.6)*(.8+.2*sin(time*17.+seed*139.));
    tint=mix(vec3(1.4,.004,.020),vec3(1.2,.07,.14),step(.95,seed));}`,
  fragmentShader:`varying float energy;varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*27.);if(a<.008)discard;gl_FragColor=vec4(tint*energy*a,1.);}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=4;scene.add(points);
 const tangent=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),view=new THREE.Vector3();
 function frame(t,core){
  const envelope=ramp(t,TAIL.start,TAIL.ready)*(1-ramp(t,TAIL.fade,TAIL.end));points.visible=envelope>.000001;if(!points.visible)return {active:false,gain:0};
  const samples=Array.from({length:33},(_,i)=>new THREE.Vector3(...baseCameraAt(t-TAIL.lifetime*i/32).target));
  tangent.copy(samples[0]).sub(samples[1]).normalize();right.set(tangent.z,0,-tangent.x).normalize();up.crossVectors(tangent,right).normalize();
  view.copy(camera.position).sub(core).normalize();const side=Math.sqrt(Math.max(0,1-Math.pow(view.dot(tangent),2)));
  mat.uniforms.gain.value=envelope*(.10+.90*Math.min(1,side/.42));mat.uniforms.focal.value=1620/(2*Math.tan(camera.fov*Math.PI/360));mat.uniforms.time.value=t;
  for(let i=0;i<n;i++){
   const age=i===0?0:((t/TAIL.lifetime+phases[i])%1),s=age*32,k=Math.min(31,Math.floor(s)),u=s-k;
   const spread=(.012+.052*Math.pow(age,.7))*radii[i],x=Math.cos(angles[i])*spread,y=Math.sin(angles[i])*spread;
   for(let a=0;a<3;a++)positions[i*3+a]=samples[k].getComponent(a)*(1-u)+samples[k+1].getComponent(a)*u+right.getComponent(a)*x+up.getComponent(a)*y;
   ages[i]=age;
  }
  positions.set(core.toArray(),0);geo.attributes.position.needsUpdate=true;geo.attributes.age.needsUpdate=true;
  const end=samples.at(-1).clone().project(camera),head=core.clone().project(camera);
  return {active:true,particleCount:n,gain:mat.uniforms.gain.value,lifetime:TAIL.lifetime,worldLength:core.distanceTo(samples.at(-1)),projectedLength:Math.hypot((head.x-end.x)*960,(head.y-end.y)*540),headError:Math.hypot(...core.toArray().map((x,i)=>x-positions[i])),source:'historical red-core world positions',usesSimulationHistory:false};
 }
 return {frame,points};
}
