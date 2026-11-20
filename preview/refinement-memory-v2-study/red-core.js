import * as THREE from 'three';
import {random} from './score.js';
export function core(scene){
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
