import * as T from '/node_modules/three/build/three.module.js';
import {profileAt} from './profile.js';
export function createLens(){
 const copy=document.createElement('canvas');copy.width=1920;copy.height=1080;const g=copy.getContext('2d',{alpha:false});
 const tex=new T.CanvasTexture(copy);tex.colorSpace=T.NoColorSpace;tex.generateMipmaps=false;
 const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(1920,1080);renderer.outputColorSpace=T.LinearSRGBColorSpace;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const m=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:tex},amount:{value:0}},
 vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D source;uniform float amount;varying vec2 uv0;
 void main(){vec2 uv=uv0,d=uv-.5;vec3 center=texture2D(source,uv).rgb;
  float label=(1.-smoothstep(.4,.58,uv.x))*smoothstep(.82,.92,uv.y);
  label=max(label,smoothstep(.54,.72,uv.x)*(1.-smoothstep(.10,.20,uv.y)));
  float red=smoothstep(.1,.4,center.r-max(center.g,center.b));float protect=1.-max(label,red);
  vec2 delta=d*(.9+dot(d,d)*1.4)*amount/vec2(1920.,1080.)*protect;
  gl_FragColor=vec4(texture2D(source,uv-delta).r,center.g,texture2D(source,uv+delta).b,1.);
 }`});scene.add(new T.Mesh(new T.PlaneGeometry(2,2),m));
 return {apply(canvas,frame){g.drawImage(canvas,0,0);tex.needsUpdate=true;m.uniforms.amount.value=profileAt(frame).ca;renderer.render(scene,camera);return renderer.domElement;}};
}
