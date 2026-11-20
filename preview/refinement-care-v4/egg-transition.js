import * as THREE from 'three';
import {cameraAt as textCamera} from '../refinement-forgetting-v17/score.js';
export const EGG_TRANSITION={start:4738,end:4810,firstLyric:4764};
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function glyphPoints(){
 const width=23.4,height=4.4,resolution=2400,cv=document.createElement('canvas');cv.width=resolution;cv.height=Math.round(resolution*height/width);
 const g=cv.getContext('2d');g.fillStyle='white';g.font='600 210px "Forgetting Notes", "Microsoft YaHei"';g.textBaseline='middle';g.textAlign='center';g.fillText('我找不到了。',cv.width/2,cv.height/2,cv.width*.96);
 const rgba=g.getImageData(0,0,cv.width,cv.height).data,points=[],ortho=textCamera(EGG_TRANSITION.start/60).ortho;
 for(let y=0;y<cv.height;y+=2)for(let x=0;x<cv.width;x+=2){const alpha=rgba[(y*cv.width+x)*4+3]/255;if(alpha>.08){
  const px=((x+(hash(x,y)-.5)*.88)/cv.width-.5)*width,py=(.5-(y+(hash(y,x+7)-.5)*.88)/cv.height)*height;
  points.push({x:px/(ortho*16/9/2),y:py/(ortho/2),alpha});
 }}
 const code=document.createElement('canvas');code.width=2200;code.height=Math.round(2200*.70/18);
 const cg=code.getContext('2d');cg.fillStyle='white';cg.font='500 38px "JetBrains Mono"';cg.textBaseline='middle';cg.textAlign='center';cg.fillText('throw new Error("MEMORY_NOT_FOUND");',code.width/2,code.height/2,code.width*.96);
 const pixels=cg.getImageData(0,0,code.width,code.height).data;
 for(let y=0;y<code.height;y+=2)for(let x=0;x<code.width;x+=2){const alpha=pixels[(y*code.width+x)*4+3]/255;if(alpha>.08){
  const px=((x+(hash(x,y)-.5)*.88)/code.width-.5)*18,py=(.5-(y+(hash(y,x+7)-.5)*.88)/code.height)*.70-3.2;
  points.push({x:px/(ortho*16/9/2),y:py/(ortho/2),alpha:alpha*.45});
 }}
 return points;
}
function morton(x,y){x=Math.max(0,Math.min(1023,Math.floor(x*1023)));y=Math.max(0,Math.min(1023,Math.floor(y*1023)));let key=0;for(let i=0;i<10;i++)key|=((x>>i)&1)<<(i*2)|((y>>i)&1)<<(i*2+1);return key;}
export function createEggTransition({root,eggSurface,eggGroup}){
 const glyph=glyphPoints(),geometry=eggSurface.points.geometry,pos=geometry.getAttribute('position'),count=pos.count;
 // Spatial assignment keeps adjacent grains moving together instead of turning
 // the interlude into random crossing trails. Destination vertices are unchanged.
 const src=glyph.map((p,i)=>({i,key:morton((p.x+1)/2,(p.y+1)/2)})).sort((a,b)=>a.key-b.key);
 const box=new THREE.Box3().setFromBufferAttribute(pos),size=box.getSize(new THREE.Vector3());
 const dest=Array.from({length:count},(_,i)=>({i,key:morton((pos.getX(i)-box.min.x)/size.x,(pos.getY(i)-box.min.y)/size.y)})).sort((a,b)=>a.key-b.key);
 const starts=new Float32Array(count*3),seeds=new Float32Array(count);
 dest.forEach(({i},rank)=>{const p=glyph[src[Math.min(src.length-1,Math.floor((rank+.5)*src.length/count))].i];starts.set([p.x,p.y,p.alpha],i*3);seeds[i]=hash(i,83);});
 geometry.setAttribute('textOrigin',new THREE.Float32BufferAttribute(starts,3));geometry.setAttribute('transitionSeed',new THREE.Float32BufferAttribute(seeds,1));
 const mat=eggSurface.material,animated=mat.clone();animated.uniforms=mat.uniforms;mat.uniforms.textMorph={value:1};
 animated.vertexShader='attribute vec3 textOrigin;attribute float transitionSeed;uniform float textMorph;\n'+animated.vertexShader;
 const marker='gl_PointSize=clamp((pointType>.5?260.:92.)/max(1.,-mv.z),pointType>.5?4.:1.7,pointType>.5?11.:4.8);';
 if(!animated.vertexShader.includes(marker))throw Error('Egg shader changed; transition hook needs review');
 animated.vertexShader=animated.vertexShader.replace(marker,marker+`
 if(textMorph<1.){
  float delay=.055+.105*transitionSeed;
  float q=smoothstep(delay,.88+.12*transitionSeed,textMorph);
  vec3 from=vec3(textOrigin.x*24./projectionMatrix[0][0],textOrigin.y*24./projectionMatrix[1][1],-24.);
  vec3 delta=mv.xyz-from;
  vec3 bend=vec3(.30*sin(transitionSeed*17.),.42*cos(transitionSeed*11.),1.25*sin(transitionSeed*23.));
  vec3 point=mix(from,mv.xyz,q)+bend*sin(q*3.14159265);
  float loosen=pow(sin(textMorph*3.14159265),2.);
  point+=vec3(1.35*sin(transitionSeed*71.),1.15*cos(transitionSeed*37.),1.9*sin(transitionSeed*53.))*loosen;
  gl_Position=projectionMatrix*vec4(point,1.);
  float settling=smoothstep(.22,.98,q);
  gl_PointSize=mix(2.15,gl_PointSize,settling);
  tint=mix(vec3(.36,.335,.41)*textOrigin.z,tint,settling);
  kind=pointType*step(.84,q);facing=mix(1.,facing,settling);
 }`);
 animated.needsUpdate=true;
 let saved=[];
 function restore(){for(const [m,opacity,gain] of saved){m.opacity=opacity;if(gain!==null)m.uniforms.gain.value=gain;}saved=[];mat.uniforms.textMorph.value=1;eggSurface.points.material=mat;}
 function apply(frame){
  const u=clamp((frame-EGG_TRANSITION.start)/(EGG_TRANSITION.end-EGG_TRANSITION.start)),environment=smooth((u-.13)/.77);
  mat.uniforms.textMorph.value=u;mat.uniforms.gain.value=1;eggGroup.visible=true;eggSurface.points.material=animated;
  const seen=new Set();root.traverse(o=>{for(const m of [o.material].flat().filter(Boolean)){
   if(m===mat||m===animated||seen.has(m))continue;seen.add(m);const gain=m.uniforms?.gain?.value??null;saved.push([m,m.opacity,gain]);m.opacity*=environment;if(gain!==null)m.uniforms.gain.value*=environment;
  }});
  return {active:true,frame,progress:u,environment,sourceText:'我找不到了。',errorCode:'throw new Error("MEMORY_NOT_FOUND");',codeParticipatesInMorph:true,sourceGlyphSamples:glyph.length,particleCount:count,target:'original eggplant surface',morphInViewSpace:true,randomCuts:false,shapeDeformation:false,sourceToTarget:'spatially ordered particle reassignment',fullyJoined:frame>=EGG_TRANSITION.end};
 }
 return {restore,apply};
}
