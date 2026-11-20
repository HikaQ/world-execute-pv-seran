import * as THREE from 'three';
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import { LineSegments2 } from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import { random } from './math.js';
import { FONTS } from './typography.js';
import { bezierControls } from './motion.js';
export const RENDER_SCALE=2;

export const WHITE = [1.36, 1.48, 1.65], PURPLE = [.79, .40, 1.50], ROSE = [1.6, .31, .54];
export const AMBER = [1.5, .82, .36], BLUE = [.32, .80, 1.30], RED = [2.1, .16, .12];
export function glyphAtlas() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 384;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = `500 48px ${FONTS.mono}`; g.textAlign='center'; g.textBaseline='middle';
  for (let i=0; i<96; i++) g.fillText(String.fromCharCode(i+32), (i%16)*64+32, Math.floor(i/16)*64+32);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Independently written analytic point/character shader. Each point keeps its identity.
const vertex = `
attribute vec3 nextPosition, controlA, controlB, ink, nextInk;
attribute float rank, glyph, jitter;
uniform float progress, time, reveal, spread, size, focal, focus, aperture, gain, drift, glyphMode, selection, pixelRatio, bend;
varying vec3 tint; varying float blurAmount, glyphIndex, characterMix, energy;
void main(){
  float start=rank*spread;
  float f=clamp((progress-start)/max(.01,1.-spread),0.,1.);
  float q=1.-f;
  f=f<.5?f*f*f*(35.+f*(-105.+f*(126.+f*(-70.+15.*f)))):1.-q*q*q*q*q*(21.-35.*q+15.*q*q);
  float v=1.-f;
  vec3 c1=mix(mix(position,nextPosition,.20),controlA,bend);
  vec3 c2=mix(mix(position,nextPosition,.82),controlB,bend);
  vec3 p=v*v*v*position+3.*v*v*f*c1+3.*v*f*f*c2+f*f*f*nextPosition;
  // Stable subpixel offsets decorrelate dense raster rows; no frame-dependent noise.
  p.xy += vec2(jitter-.5,fract(jitter*137.17)-.5)*.006;
  float travel=sin(f*3.14159265);
  p += drift*vec3(sin(p.y*1.8+time*.45+jitter*4.),cos(p.x*1.1+time*.38),sin(p.x*.9-time*.3))*travel;
  vec4 eye=modelViewMatrix*vec4(p,1.);
  float z=max(.1,-eye.z);
  float core=max(1.1*pixelRatio,size*focal/z);
  float blur=min(19.*pixelRatio,aperture*abs(z-focus)*focal/z);
  float diameter=min(52.*pixelRatio,core+blur);
  float born=smoothstep(rank-.018,rank+.018,reveal);
  float highlight=exp(-pow((rank-selection)*24.,2.));
  tint=mix(ink,nextInk,f)*gain*(.78+.22*jitter+highlight*.65);
  energy=born*core*core/(diameter*diameter);
  blurAmount=blur/max(1.,diameter); glyphIndex=glyph; characterMix=glyphMode;
  gl_Position=projectionMatrix*eye; gl_PointSize=diameter;
  if(born<.001||eye.z>-.08){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;}
}`;
const fragment = `
uniform sampler2D atlas;
varying vec3 tint; varying float blurAmount,glyphIndex,characterMix,energy;
void main(){
  vec2 p=gl_PointCoord-.5; float r=length(p)*2.;
  float dotInk=exp(-r*r*5.)*(1.-smoothstep(.84,1.,r));
  float lens=(1.-smoothstep(.80,1.,r))*.29;
  float pointInk=mix(dotInk,lens,clamp(blurAmount*1.6,0.,1.));
  vec2 cell=vec2(mod(glyphIndex,16.),floor(glyphIndex/16.));
  vec2 uv=(cell+gl_PointCoord)/vec2(16.,6.);
  uv.y=1.-uv.y;
  float letter=texture2D(atlas,uv).a;
  float alpha=mix(pointInk,letter,characterMix*(1.-blurAmount));
  gl_FragColor=vec4(tint*energy*alpha,1.);
}`;

export class Cloud {
  constructor(scene, count, atlas, seed=10) {
    this.count=count; const rnd=random(seed), rank=new Float32Array(count), glyph=new Float32Array(count), jitter=new Float32Array(count);
    const chars='001101:;<>/[]+=*xqkv';
    for(let i=0;i<count;i++){rank[i]=i/count;glyph[i]=chars.charCodeAt(Math.floor(rnd()*chars.length))-32;jitter[i]=rnd();}
    this.geo=new THREE.BufferGeometry();
    for(const [name,data,n] of [['position',new Float32Array(count*3),3],['nextPosition',new Float32Array(count*3),3],
      ['controlA',new Float32Array(count*3),3],['controlB',new Float32Array(count*3),3],
      ['ink',new Float32Array(count*3),3],['nextInk',new Float32Array(count*3),3],['rank',rank,1],['glyph',glyph,1],['jitter',jitter,1]])
      this.geo.setAttribute(name,new THREE.BufferAttribute(data,n));
    this.material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,uniforms:{atlas:{value:atlas},progress:{value:0},time:{value:0},
        reveal:{value:1.04},spread:{value:.25},size:{value:.027},focal:{value:1600},focus:{value:14},aperture:{value:.008},gain:{value:1},
        drift:{value:0},glyphMode:{value:0},selection:{value:-1},pixelRatio:{value:RENDER_SCALE},bend:{value:1}}});
    this.points=new THREE.Points(this.geo,this.material); this.points.frustumCulled=false; scene.add(this.points);
  }
  shapes(a,b=a,guide=null){
    if(this.a===a&&this.b===b&&this.guide===guide)return;
    this.a=a;this.b=b;this.guide=guide;
    for(const [name,arr] of [['position',a.positions],['nextPosition',b.positions],['ink',a.colors],['nextInk',b.colors]]){
      this.geo.attributes[name].array=arr;this.geo.attributes[name].needsUpdate=true;
    }
    const ca=this.geo.attributes.controlA.array,cb=this.geo.attributes.controlB.array;
    for(let i=0;i<this.count;i++){
      const k=i*3,[p,q]=bezierControls(Array.from(a.positions.subarray(k,k+3)),Array.from(b.positions.subarray(k,k+3)),i,this.count);
      if(guide)for(let axis=0;axis<3;axis++){
        p[axis]=a.positions[k+axis]+(guide.positions[k+axis]-a.positions[k+axis])*2.1;
        q[axis]=b.positions[k+axis]+(guide.positions[k+axis]-b.positions[k+axis])*.12;
      }
      ca.set(p,k);cb.set(q,k);
    }
    this.geo.attributes.controlA.needsUpdate=true;this.geo.attributes.controlB.needsUpdate=true;
    if(a.glyphs){this.geo.attributes.glyph.array=a.glyphs;this.geo.attributes.glyph.needsUpdate=true;}
  }
  set(params,camera,height=1080*RENDER_SCALE){
    this.points.visible=params.gain>0.001;
    for(const [key,value] of Object.entries(params))if(this.material.uniforms[key])this.material.uniforms[key].value=value;
    this.material.uniforms.focal.value=height/(2*Math.tan(camera.fov*Math.PI/360));
  }
}

export class Lines {
  constructor(scene,max=7000,width=1.1){
    this.positions=new Float32Array(max*6);this.colors=new Float32Array(max*6);this.max=max;this.count=0;
    this.geometry=new LineSegmentsGeometry();this.geometry.setPositions(this.positions);this.geometry.setColors(this.colors);
    this.geometry.attributes.instanceStart.data.setUsage(THREE.DynamicDrawUsage);
    this.geometry.attributes.instanceColorStart.data.setUsage(THREE.DynamicDrawUsage);
    this.material=new LineMaterial({vertexColors:true,linewidth:width*RENDER_SCALE,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    this.material.resolution.set(1920*RENDER_SCALE,1080*RENDER_SCALE);
    this.mesh=new LineSegments2(this.geometry,this.material);this.mesh.frustumCulled=false;scene.add(this.mesh);
  }
  reset(){this.count=0;}
  line(a,b,color=WHITE,gain=1,endGain=gain){
    if(this.count>=this.max)return;
    const i=this.count++*6;
    for(let k=0;k<3;k++){this.positions[i+k]=a[k];this.positions[i+3+k]=b[k];this.colors[i+k]=color[k]*gain;this.colors[i+3+k]=color[k]*endGain;}
  }
  path(points,color=WHITE,gain=1){for(let i=1;i<points.length;i++)this.line(points[i-1],points[i],color,gain);}
  commit(){this.geometry.instanceCount=this.count;this.geometry.attributes.instanceStart.data.needsUpdate=true;this.geometry.attributes.instanceColorStart.data.needsUpdate=true;}
}

export function createRenderer(){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(1920*RENDER_SCALE,1080*RENDER_SCALE,false);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#05070b');
  const camera=new THREE.PerspectiveCamera(39,16/9,.08,160);
  const target=new THREE.WebGLRenderTarget(1920*RENDER_SCALE,1080*RENDER_SCALE,{type:THREE.HalfFloatType});
  target.samples=Math.min(2,renderer.capabilities.maxSamples);
  const composer=new EffectComposer(renderer,target);
  const pass=new RenderPass(scene,camera);composer.addPass(pass);
  const bloom=new UnrealBloomPass(new THREE.Vector2(1920*RENDER_SCALE,1080*RENDER_SCALE),.48,.32,1.04);composer.addPass(bloom);composer.addPass(new OutputPass());
  const setCamera=view=>{camera.position.set(...view.position);camera.lookAt(...view.target);camera.fov=view.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();};
  const project=p=>{const v=new THREE.Vector3(...p).project(camera);return [(v.x*.5+.5)*1920,(.5-v.y*.5)*1080];};
  return {renderer,scene,camera,composer,bloom,setCamera,project,draw(){composer.render(0);return renderer.domElement;}};
}
