// The opening's 48,000-particle kernel and glow shaders are preserved verbatim.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {random,cameraAt,ramp,coreBreath} from '../refinement-opening-v15/score.js';
function core(scene){
 const count=48000,rnd=random(73816),p=new Float32Array(count*3),seed=new Float32Array(count),radius=new Float32Array(count);
 for(let i=0;i<count;i++){
  const r=Math.sqrt(rnd()),a=rnd()*Math.PI*2,z=(rnd()+rnd()+rnd()-1.5)*.29*Math.sqrt(1-r*r);
  p.set([1.85*r*Math.cos(a),1.85*r*Math.sin(a),z],i*3);seed[i]=rnd();radius[i]=r;
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('seed',new THREE.BufferAttribute(seed,1));geo.setAttribute('radius',new THREE.BufferAttribute(radius,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},ignite:{value:0},gain:{value:0},modelScale:{value:1},pixelRatio:{value:1.5}},
  vertexShader:`attribute float seed,radius;uniform float time,ignite,gain,modelScale,pixelRatio;varying vec3 tint;
   void main(){vec3 p=position;p+=.012*vec3(sin(seed*131.+time*.65),cos(seed*79.+time*.48),sin(seed*193.+time*.7));vec4 mv=modelViewMatrix*vec4(p,1.);float depth=max(.3,-mv.z);
    gl_Position=projectionMatrix*mv;gl_PointSize=pixelRatio*clamp((.013+.011*seed)*1460./depth,1.0,4.2);
    float density=.45+.55*pow(1.-radius,.4);float natural=.65+.35*sin(seed*137.+position.x*2.7)*sin(position.y*2.1+seed*13.);
    vec3 gray=vec3(.045,.049,.057)*(.65+.35*seed);vec3 red=vec3(2.2,.003,.008)*density*natural;
    float retained=max(.0015,modelScale*modelScale);float keep=1.-smoothstep(retained*.85,retained,seed);
    tint=mix(gray,red,ignite)*gain*keep;}`,
  fragmentShader:`varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*23.);if(a<.008)discard;gl_FragColor=vec4(tint*a,1.);}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
 const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{gain:{value:0}},
  vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 uv0;uniform float gain;void main(){vec2 p=(uv0-.5)*2.;float a=exp(-dot(p,p)*4.8)*pow(1.-smoothstep(.65,1.,length(p)),2.);gl_FragColor=vec4(vec3(.30,.0003,.001)*a*gain,1.);}'});
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(7.3,7.3),glowMat);scene.add(glow);return {points,mat,count,glow,glowMat};
}

export function createClosingCore(){
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setSize(2880,1620,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0,0,0);
 const referenceTime=5.7,pose=cameraAt(referenceTime),camera=new THREE.PerspectiveCamera(pose.fov,16/9,.1,5000);
 camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const target=new THREE.WebGLRenderTarget(2880,1620,{type:THREE.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(2880,1620),.41,.4,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
 const eye=core(scene);eye.glow.renderOrder=5;eye.points.renderOrder=6;
 eye.points.position.set(0,0,0);eye.points.scale.setScalar(1);eye.points.rotation.y=.055*Math.sin(referenceTime*.22);
 eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(1);
 eye.mat.uniforms.modelScale.value=1;
 const referenceDistance=pose.position[2];
 const referenceDiameter=2*1.85*1080/(2*Math.tan(THREE.MathUtils.degToRad(pose.fov/2))*referenceDistance);
 function frame({phase=0,gain=1,reference=false,screenCenter=[960,540],diameter=referenceDiameter}={}){
  const ratio=reference?1:diameter/referenceDiameter;
  const depth=referenceDistance/ratio;
  camera.position.set(0,0,depth);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const halfHeight=depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const cx=reference?960:screenCenter[0],cy=reference?540:screenCenter[1];
  eye.points.position.set((cx/960-1)*halfHeight*16/9,(1-cy/540)*halfHeight,0);
  eye.glow.position.copy(eye.points.position);eye.glow.quaternion.copy(camera.quaternion);
  // Keep geometry rigid. Density follows projected area during the camera approach.
  eye.mat.uniforms.modelScale.value=ratio;

  const t=reference?referenceTime:referenceTime+phase*.35;
  const ignite=reference?ramp(referenceTime,5.2,5.95):1;
  const breath=reference?coreBreath(referenceTime):{core:gain,halo:gain};
  eye.mat.uniforms.time.value=t;eye.mat.uniforms.ignite.value=ignite;
  eye.mat.uniforms.gain.value=breath.core;eye.glowMat.uniforms.gain.value=ignite*.75*breath.halo;
  bloom.strength=.31+ignite*.1;composer.render();
  const center=eye.points.position.clone().project(camera);
  return {canvas:renderer.domElement,particleCount:eye.count,screenCenter:[(center.x+1)*960,(1-center.y)*540],
   modelScale:1,densityScale:ratio,apparentDiameter:diameter,referenceDiameter,worldPosition:eye.points.position.toArray(),cameraPosition:camera.position.toArray(),referenceTime,phase,gain:breath.core,ignite,reference,finalSubject:'SERAN red particle core'};
 }
 return {frame,referenceDiameter};
}
