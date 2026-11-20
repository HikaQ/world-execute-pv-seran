import {Vector3,Float32BufferAttribute} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {E,smooth} from './score.js';

// Source points are sampled in WORLD space from the existing glyphs, sheets and
// filaments. No rendered image is shrunk, and no substitute cloud is cross-cut in.
export const CONVERGENCE={start:10888,atomized:10898,joined:10924,depart:10930,black:10950};
export function createConvergence(scene,{fields,sourceFaces,foregroundTex,starTex}){
 const source=[],tints=[],families={};
 const v=new Vector3(),push=(p,col,family)=>{source.push(...p);tints.push(...col);families[family]=(families[family]??0)+1;};
 function texture(tex,obj,family,col,{count,scroll=0,stride=1}={}){
  const data=tex.image.data,n=count??data.length/4;obj?.updateMatrixWorld(true);
  for(let i=0;i<n;i+=stride){if(data[i*4+2]<-1000)continue;
   v.set(data[i*4],data[i*4+1]+scroll,data[i*4+2]);if(obj)v.applyMatrix4(obj.matrixWorld);
   push(v.toArray(),col,family);
  }
 }
 fields.forEach(({g,a},i)=>{
  if(i===0)return;const clock=Math.min(E.abyss,E.freeze+i*12),scroll=(clock-10081)/60*.13;
  texture(a,g.points,'characters',[.38,.105,.155],{count:g.count,scroll});
 });
 sourceFaces.forEach(({face,a},i)=>{if(i)texture(a,face.points,'sheets',[.046,.0045,.008],{stride:2});});
 texture(foregroundTex,null,'foreground',[.025,.002,.005],{stride:2});
 texture(starTex,null,'background',[.018,.010,.016],{stride:2});
 for(let k=0;k<24;k++)for(let j=0;j<440;j++){
  const u=j/439;push([-13+k*.3+u*22,-5+.35*Math.sin(u*6+k*.25),-2-k*.8+.7*Math.sin(u*5)],[.11,.005,.014],'filaments');
 }
 fields.forEach(({g},i)=>{if(!i)return;g.points.updateMatrixWorld(true);
  for(let j=0;j<260;j++){const y=-6.6+j/259*12.6;v.set(-3.5,y,.65*Math.sin(y*.42+i*.7)).applyMatrix4(g.points.matrixWorld);push(v.toArray(),[.20,.009,.024],'sheetEdges');}
 });
 const count=source.length/3,N=Math.ceil(Math.sqrt(count))**2;
 const swarm=new Swarm({count:N}),colors=new Float32Array(N*3);
 colors.set(tints);swarm.points.geometry.setAttribute('aTint',new Float32BufferAttribute(colors,3));
 const positions=swarm.shape('ah-world-particles-v1',n=>{const a=new Float32Array(n*4);for(let i=0;i<n;i++)a.set(i<count?[source[i*3],source[i*3+1],source[i*3+2],i/count]:[0,0,-300000,1],i*4);return a;});
 const u=swarm.material.uniforms;
 u.uAge={value:0};u.uGatherTarget={value:new Vector3()};
 swarm.material.vertexShader=swarm.material.vertexShader.replace('void main() {',`in vec3 aTint;
uniform float uAge;
uniform vec3 uGatherTarget;
out float vArrive;
void main() {`).replace('vec3 p = p4.xyz;',`vec3 p = p4.xyz;
  float delay = 3. + 7. * hash11(i*2.17+11.);
  float q = smoothstep(delay,36.,uAge);
  q = pow(q,1.25);
  vec3 jitter = (hash31(i*3.7)-.5)*.10;
  vec3 delta = uGatherTarget-p;
  vec3 tangent = normalize(cross(normalize(delta+vec3(.0001)),vec3(.13,1.,.25)));
  float bow = (.10+.32*hash11(i*1.73))*sin(q*PI);
  p = mix(p,uGatherTarget,q) + tangent*bow + jitter*sin(min(uAge/10.,1.)*PI)*(1.-q);
  vArrive = q;`).replace('  if (vis <= 0.)',`  vCol *= aTint * (1.-smoothstep(.965,1.,vArrive))/(1.+7.*pow(vArrive,4.));
  if (vis <= 0.)`);
 swarm.material.needsUpdate=true;swarm.points.visible=false;scene.add(swarm.points);
 const start=new Vector3(4.3+.12*Math.sin(E.abyss*.026),-1.6,2.8),centre=new Vector3(0,0,-7);
 function update(f,camera,H){
  const active=f>=CONVERGENCE.start&&f<CONVERGENCE.black,age=f-CONVERGENCE.start;
  swarm.points.visible=active&&age<37;
  const core=start.clone().lerp(centre,smooth(f,CONVERGENCE.start+2,CONVERGENCE.joined-7));
  const departure=smooth(f,CONVERGENCE.depart,CONVERGENCE.black);
  const distance=departure>0?20*(Math.exp(departure*5.4)-1):0;
  if(active)core.z-=distance;
  const atomize=smooth(f,CONVERGENCE.start,CONVERGENCE.atomized);
  if(swarm.points.visible){u.uAge.value=age;u.uGatherTarget.value.copy(core);
   swarm.set({a:positions,size:.028,minPx:.8,bright:atomize*1.8,colA:[1,1,1],focus:22,aperture:.001,maxBlur:2,t:f/60},camera,H);
  }
  return {active,phase:age<10?'atomize':age<36?'gather':age<42?'point':'depart',sourceParticleCount:count,families,allContentsParticleBased:true,atomize,corePosition:core.toArray(),gatherProgress:smooth(f,CONVERGENCE.start+10,CONVERGENCE.joined),departureDistance:distance,allJoined:f>=CONVERGENCE.joined,remainingSceneOpacity:1-atomize};
 }
 return {update,count,families};
}
