import * as THREE from 'three';
export function createLens(){
 const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const g=canvas.getContext('2d',{alpha:false});
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.NoColorSpace;tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;
 const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),uniforms={source:{value:tex},ca:{value:2},fault:{value:0},seed:{value:0},core:{value:new THREE.Vector2(-10,-10)}};
 const mat=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`precision highp float;uniform sampler2D source;uniform float ca,fault,seed;uniform vec2 core;varying vec2 uv0;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   vec3 tap(vec2 q){return texture2D(source,clamp(q,vec2(.0003),vec2(.9997))).rgb;}
   void main(){vec2 size=vec2(1920.,1080.),uv=uv0,d=uv-.5;
    float protectedCore=1.-smoothstep(22.,65.,length((uv-core)*size));
    float protectedText=(1.-smoothstep(.40,.54,uv.x))*smoothstep(.78,.83,uv.y);
    protectedText=max(protectedText,smoothstep(.55,.63,uv.x)*(1.-smoothstep(.13,.19,uv.y)));
    float protection=1.-max(protectedCore,protectedText);
    float row=floor(uv.y*53.),band=step(.93,hash(vec2(row,seed)));
    uv.x+=band*(hash(vec2(row*7.,seed))-.5)*fault*.018*protection;
    vec2 offset=(d*(ca*2.)*(.7+dot(d,d)*1.6)+vec2(fault*22.*(.68+.32*band),0.))/size*protection;
    vec3 c=vec3(tap(uv-offset).r,tap(uv).g,tap(uv+offset).b);
    c*=1.-band*fault*.09;gl_FragColor=vec4(c,1.);
   }`});scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
 function apply(input,{frame,ca=2,fault=0,core=null}={}){
  g.drawImage(input,0,0,1920,1080);tex.needsUpdate=true;uniforms.ca.value=ca;uniforms.fault.value=fault;uniforms.seed.value=Math.floor(frame/2);
  uniforms.core.value.set(core?core[0]/1920:-10,core?1-core[1]/1080:-10);renderer.render(scene,camera);
  return renderer.domElement;
 }
 return {apply};
}
