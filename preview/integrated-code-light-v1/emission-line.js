import * as THREE from 'three';

// Joined ribbon, rather than additive overlapping per-segment caps: a dense
// curve keeps one continuous core with constant energy at every sample join.
export function emissionLine(parent, capacity=1100){
 const previous=new Float32Array(capacity*2*3),current=new Float32Array(capacity*2*3),next=new Float32Array(capacity*2*3),side=new Float32Array(capacity*2),strength=new Float32Array(capacity*2);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(current,3).setUsage(THREE.DynamicDrawUsage));
 g.setAttribute('previous',new THREE.BufferAttribute(previous,3).setUsage(THREE.DynamicDrawUsage));
 g.setAttribute('next',new THREE.BufferAttribute(next,3).setUsage(THREE.DynamicDrawUsage));
 g.setAttribute('side',new THREE.BufferAttribute(side,1));g.setAttribute('strength',new THREE.BufferAttribute(strength,1).setUsage(THREE.DynamicDrawUsage));
 const indices=[];for(let i=0;i<capacity;i++){side[i*2]=-1;side[i*2+1]=1;if(i<capacity-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
 g.setIndex(indices);
 const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{gain:{value:1},resolution:{value:new THREE.Vector2(2880,1620)},halfWidth:{value:10.5},coreWidth:{value:.8},hot:{value:new THREE.Vector3(2.2,1.65,2.9)},soft:{value:new THREE.Vector3(.32,.16,.52)},head:{value:new THREE.Vector3()},headGain:{value:1}},
  vertexShader:`attribute vec3 previous,next;attribute float side,strength;uniform vec2 resolution;uniform float halfWidth;uniform vec3 head;varying float edge,energy,nearHead,depth;varying vec2 dotScreen;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec4 p=projectionMatrix*mv;vec4 a=projectionMatrix*modelViewMatrix*vec4(previous,1.),b=projectionMatrix*modelViewMatrix*vec4(next,1.);
    vec2 pa=a.xy/max(.001,a.w),pb=b.xy/max(.001,b.w);vec2 d=(pb-pa)*resolution;d=length(d)>.001?normalize(d):vec2(1.,0.);vec2 normal=vec2(-d.y,d.x);
    p.xy+=normal*side*halfWidth*resolution.y/1080.*2./resolution*p.w;gl_Position=p;
    vec4 hp=projectionMatrix*modelViewMatrix*vec4(head,1.);dotScreen=(hp.xy/hp.w*.5+.5)*vec2(1920.,1080.);
    edge=side*halfWidth;energy=strength;nearHead=exp(-dot(position-head,position-head)/5.);depth=-mv.z;
    if(mv.z>-.1){gl_Position=vec4(2.,2.,2.,1.);energy=0.;}}
  `,
  fragmentShader:`uniform float gain,coreWidth,headGain;uniform vec3 hot,soft;uniform vec2 resolution;varying float edge,energy,nearHead,depth;varying vec2 dotScreen;
   void main(){float d=abs(edge),core=1.-smoothstep(coreWidth*.45,coreWidth,d),halo=exp(-d*d/13.)*.48,outer=exp(-d*d/62.)*.06;
    float dotDistance=length(gl_FragCoord.xy/resolution*vec2(1920.,1080.)-dotScreen);
    float redContact=exp(-dotDistance*dotDistance/110.)*headGain;
    vec3 color=mix(hot,vec3(2.4,.07,.19),redContact*.94)*core+soft*(halo+outer);color+=vec3(.30,.012,.045)*core*nearHead*headGain;
    gl_FragColor=vec4(color*gain*energy*(1.-smoothstep(9.,10.5,d)),1.);}`});
 const mesh=new THREE.Mesh(g,mat);mesh.frustumCulled=false;parent.add(mesh);
 function set(points,{gain=1,head=[0,0,0],headGain=1,weights=null}={}){
  const n=Math.min(capacity,points.length);mesh.visible=n>1&&gain>.00001;mat.uniforms.gain.value=gain;mat.uniforms.head.value.set(...head);mat.uniforms.headGain.value=headGain;
  if(!mesh.visible)return;
  for(let i=0;i<n;i++)for(let s=0;s<2;s++){
   const k=(i*2+s)*3;current.set(points[i],k);previous.set(points[Math.max(0,i-1)],k);next.set(points[Math.min(n-1,i+1)],k);strength[i*2+s]=weights?.[i]??1;
  }
  for(const name of ['position','previous','next','strength'])g.attributes[name].needsUpdate=true;
  g.setDrawRange(0,(n-1)*6);
 }
 return {mesh,mat,set};
}
