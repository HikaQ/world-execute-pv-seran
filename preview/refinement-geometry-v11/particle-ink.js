import * as THREE from 'three';

// Fixed particle identities and analytic positions: seeking never accumulates
// simulation error, and the same points can continue across scene boundaries.
export function particleCloud(parent,{count=560,color='#c5a1ff',size=2.35,intensity=1.55}={}){
 const positions=new Float32Array(count*3),weights=new Float32Array(count).fill(1),phase=new Float32Array(count),seed=new Float32Array(count);
 for(let i=0;i<count;i++){phase[i]=i/Math.max(1,count-1);seed[i]=((i*16807+739)%65521)/65521;}
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('weight',new THREE.BufferAttribute(weights,1));
 geometry.setAttribute('phase',new THREE.BufferAttribute(phase,1));geometry.setAttribute('seed',new THREE.BufferAttribute(seed,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,blending:THREE.NormalBlending,
  uniforms:{time:{value:0},gain:{value:0},size:{value:size},intensity:{value:intensity},tint:{value:new THREE.Color(color)}},
  vertexShader:`attribute float weight,phase,seed;uniform float time,gain,size,intensity;uniform vec3 tint;varying vec3 ink;varying float alpha;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=1.5*size*(.86+.28*seed)*clamp(28./max(1.,-mv.z),.65,1.6);
    float d=abs(fract(phase-time*.24)-.5);float pulse=exp(-d*d*460.);
    ink=mix(tint,vec3(.88,.78,1.),.12*seed)*intensity*(.88+.28*pulse);alpha=gain*weight;
    if(mv.z>-.1)gl_PointSize=0.;}`,
  fragmentShader:`varying vec3 ink;varying float alpha;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;
   float a=(1.-smoothstep(.16,.48,r))*.88+exp(-dot(p,p)*22.)*.12;gl_FragColor=vec4(ink,a*alpha);}`});
 Object.defineProperty(mat,'opacity',{get(){return mat.uniforms.gain.value;},set(value){mat.uniforms.gain.value=value;},configurable:true});
 const mesh=new THREE.Points(geometry,mat);mesh.frustumCulled=false;parent.add(mesh);
 return {mesh,mat,positions,weights,phase,seed,count,
  tick(t){mat.uniforms.time.value=t;},
  finish(alpha=1){mesh.visible=alpha>.001;mat.opacity=alpha;geometry.attributes.position.needsUpdate=true;geometry.attributes.weight.needsUpdate=true;}
 };
}

export function particlePath(parent,options={}){
 const result=particleCloud(parent,options),width=options.width??.022;
 return {...result,set(points,alpha=1){
  if(points.length<2||alpha<=.001){result.finish(0);return;}
  for(let i=0;i<result.count;i++){
   const u=i/(result.count-1)*(points.length-1),a=Math.min(points.length-2,Math.floor(u)),q=u-a,seed=result.seed[i];
   const theta=seed*113.31,radius=width*(.25+.75*seed);
   for(let axis=0;axis<3;axis++){
    const offset=axis===0?0:radius*(axis===1?Math.cos(theta):Math.sin(theta));
    result.positions[i*3+axis]=points[a][axis]+(points[a+1][axis]-points[a][axis])*q+offset;
   }
  }
  result.finish(alpha);
 }};
}
