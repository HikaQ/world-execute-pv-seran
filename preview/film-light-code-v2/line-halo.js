import * as T from '/node_modules/three/build/three.module.js';
export function lineHalo(line){
 if(line.material?.isShaderMaterial)return null;
 const attr=line.geometry?.attributes?.position;if(!attr)return null;
 const indexed=line.geometry.index?.array;const n=indexed?.length??attr.count;
 if(n<2||n>16000)return null;
 const segments=line.isLineSegments?Math.floor(n/2):n-1;
 const a=new T.InstancedBufferAttribute(new Float32Array(segments*3),3).setUsage(T.DynamicDrawUsage);
 const b=new T.InstancedBufferAttribute(new Float32Array(segments*3),3).setUsage(T.DynamicDrawUsage);
 const g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,1,0],3));g.setIndex([0,1,2,0,2,3]);g.setAttribute('start',a);g.setAttribute('finish',b);
 const m=new T.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
  uniforms:{resolution:{value:new T.Vector2(1920,1080)},color:{value:new T.Color()},gain:{value:0}},
  vertexShader:`attribute vec3 start,finish;uniform vec2 resolution;varying float edge,valid;
   void main(){vec4 a=projectionMatrix*modelViewMatrix*vec4(start,1.),b=projectionMatrix*modelViewMatrix*vec4(finish,1.);
    valid=step(.01,min(a.w,b.w));vec2 d=(b.xy/max(.01,b.w)-a.xy/max(.01,a.w))*resolution;d=length(d)>.001?normalize(d):vec2(1.,0.);
    vec4 p=mix(a,b,position.x);p.xy+=vec2(-d.y,d.x)*position.y*4.*resolution.y/108.*.1/resolution*2.*p.w;
    gl_Position=valid>.5?p:vec4(2.,2.,2.,1.);edge=position.y*4.;}`,
  fragmentShader:`uniform vec3 color;uniform float gain;varying float edge,valid;
   void main(){float d=abs(edge);float halo=exp(-d*d/3.)*.20+exp(-d*d/10.)*.035;float core=(1.-smoothstep(.35,.85,d))*.18;
    gl_FragColor=vec4(color*(halo+core)*gain*valid,1.);}`});
 const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.userData.upgradeOwned=true;line.add(mesh);
 let last=-1;
 return {mesh,update(renderer,gain){
  const src=line.geometry.attributes.position,draw=line.geometry.drawRange,start=Math.max(0,draw.start),end=Math.min(n,draw.count===Infinity?n:start+draw.count);
  if(src.version!==last){for(let i=0;i<segments;i++){
   const i0=line.isLineSegments?i*2:i,i1=i0+1,j0=indexed?.[i0]??i0,j1=indexed?.[i1]??i1;
   a.setXYZ(i,src.getX(j0),src.getY(j0),src.getZ(j0));b.setXYZ(i,src.getX(j1),src.getY(j1),src.getZ(j1));
  }a.needsUpdate=b.needsUpdate=true;last=src.version;}
  // Current project line draw ranges begin at zero; keep a nonzero range dark.
  g.instanceCount=start===0?(line.isLineSegments?Math.floor(end/2):Math.max(0,end-1)):0;
  const mat=Array.isArray(line.material)?line.material[0]:line.material;
  m.uniforms.color.value.copy(mat.color??new T.Color('#ab8acb'));
  const anim=mat.uniforms?.gain?.value,word=mat.uniforms?.word?.value;
  m.uniforms.gain.value=gain*(mat.opacity??1)*(mat.isShaderMaterial?.28:1)*(typeof anim==='number'?anim:1)*(typeof word==='number'?1-word*.85:1);renderer.getDrawingBufferSize(m.uniforms.resolution.value);
  mesh.visible=gain>0&&g.instanceCount>0;
 }};
}
