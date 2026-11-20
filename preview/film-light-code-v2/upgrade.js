import * as T from '/node_modules/three/build/three.module.js';
import {profileAt,ease} from './profile.js';
import {glyphField} from './glyph-field.js';
import {lineHalo} from './line-halo.js';
import {emissionLine} from '../integrated-code-light-v1/emission-line.js';
const scenes=new WeakMap(),objectData=new WeakMap(),materialData=new WeakMap();
const appendMain=(source,extra)=>{const end=source.lastIndexOf('}');return source.slice(0,end)+extra+'\n'+source.slice(end);};
const visible=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
function bounds(o){
 const g=o.geometry;if(!g?.attributes?.position)return null;
 if(!g.boundingBox)g.computeBoundingBox();if(!g.boundingBox||g.boundingBox.isEmpty())return null;
 return g.boundingBox;
}
function litMaterial(o,context){
 if(Array.isArray(o.material)||!o.material||o.material.map||o.isSprite)return null;
 const old=o.material;
 if(o.isMesh&&!o.geometry?.attributes?.normal&&!old.isShaderMaterial)return null;
 if(old.isRawShaderMaterial)return null;
 const bb=bounds(o),size=bb?.getSize(new T.Vector3()).length()??0;
 const stars=(o.isPoints&&size>180)||old.uniforms?.speed||old.uniforms?.ignite||/nebula|star/i.test(o.name);
 if(stars||o.isMesh&&o.geometry?.type==='PlaneGeometry')return null;
 // Scene animation retains references to these materials and their uniforms.
 // Patch the original material; cloning it would disconnect animated uniforms.
 const m=old,existing=materialData.get(m),glowLines=!!o.geometry?.attributes?.aP,codeGlyph=/vChar/.test(old.vertexShader??'');
 const amount=codeGlyph?.55:glowLines?1.3:o.isPoints?1:o.isLine?.70:.40;
 if(existing)return {...existing,amount};
 const previous=old.onBeforeCompile,oldKey=old.customProgramCacheKey?.();
 const uniforms={upGain:{value:0},upHead:context.head,upCenter:{value:new T.Vector3()},upInverse:context.inverse};
 m.onBeforeCompile=(shader,renderer)=>{
  if(previous)previous.call(m,shader,renderer);
  Object.assign(shader.uniforms,uniforms);
  const gl3=m.glslVersion===T.GLSL3,helixKind=!!o.geometry?.attributes?.kind;
  if(glowLines)shader.vertexShader=shader.vertexShader.replace('float w = aP.x *','float w = aP.x * (1.+upGain*.65) *');
  shader.vertexShader=`uniform mat4 upInverse;uniform float upGain;${gl3?'out':'varying'} vec3 upWorld;${helixKind?'varying float upKind;':''}\n`+appendMain(shader.vertexShader,
   `vec4 upP=upInverse*gl_Position;upWorld=upP.xyz/max(.00001,abs(upP.w))*sign(upP.w);${o.isPoints?'gl_PointSize*=1.+.06*upGain;':''}${helixKind?'upKind=kind;':''}`);
  const outName=gl3?(shader.fragmentShader.match(/out\s+vec4\s+(\w+)/)?.[1]??'gl_FragColor'):'gl_FragColor';
  shader.fragmentShader=`uniform float upGain;uniform vec3 upHead,upCenter;${gl3?'in':'varying'} vec3 upWorld;${helixKind?'varying float upKind;':''}\n`+appendMain(shader.fragmentShader,`
   float upPeak=max(${outName}.r,max(${outName}.g,${outName}.b));
   vec3 upN=normalize(upWorld-upCenter+vec3(.0001));float upFace=.45+.55*abs(dot(upN,normalize(vec3(-.45,.7,.8))));
   float upNear=exp(-dot(upWorld-upHead,upWorld-upHead)/20.);
   float upEnergy=upPeak/(upPeak+.065);float upProtect=1.-.65*smoothstep(1.3,3.,upPeak);
   ${outName}.rgb*=1.+upGain*upEnergy*(.66+upFace*.34)*upProtect;
   ${outName}.rgb+=vec3(.15,.003,.014)*upNear*upGain*upEnergy*min(.5,upPeak);
   ${helixKind?`${outName}.rgb*=1.-.52*upGain*step(.5,upKind);`:''}
  `);
 };
 m.customProgramCacheKey=()=>`film-light-code-v2-${o.isPoints?'points':o.isLine?'line':'mesh'}-${oldKey??''}`;
 m.needsUpdate=true;
 const data={uniforms,amount,original:old,codeGlyph};materialData.set(m,data);return data;
}
function findEmitter(objects,camera){
 let best=null,score=-Infinity;
 for(const o of objects){
  const m=Array.isArray(o.material)?o.material[0]:o.material;
  const c=m?.color,red=c&&c.r>.6&&c.r>c.g*4&&c.r>c.b*2;
  if(!red&&!m?.uniforms?.ignite)continue;
  if(!o.isPoints&&!o.isMesh)continue;
  const pos=o.getWorldPosition(new T.Vector3()),screen=pos.clone().project(camera);
  if(Math.abs(screen.x)>1.7||Math.abs(screen.y)>1.7||screen.z>1)continue;
  const v=(m.uniforms?.ignite?10:2)+Math.max(0,4-(o.geometry?.boundingSphere?.radius??5))-(Math.abs(screen.x)+Math.abs(screen.y));
  if(v>score){score=v;best=pos;}
 }
 return best;
}
function findSubject(objects,camera){
 let best=null,score=-Infinity;
 for(const o of objects){
  if(!o.isPoints||o.userData.upgradeOwned)continue;
  const m=o.material;if(m?.uniforms?.ignite||m?.uniforms?.speed)continue;
  const bb=bounds(o);if(!bb)continue;
  const wb=bb.clone().applyMatrix4(o.matrixWorld),size=wb.getSize(new T.Vector3()).length();
  if(size<3||size>150)continue;
  const center=wb.getCenter(new T.Vector3()),sp=center.clone().project(camera);
  if(Math.abs(sp.x)>2||Math.abs(sp.y)>2||sp.z>1)continue;
  const v=Math.log2(1+o.geometry.attributes.position.count)*2-Math.abs(sp.x)*5-Math.abs(sp.y)*4-size*.05;
  if(v>score){score=v;best=o;}
 }
 return best;
}
function ensureField(ctx,object,family){
 if(ctx.fields.some(x=>x.owner===object&&x.family===family))return;
 const parent=family==='mobius'?object.parent.parent:object.parent;
 const matrix=new T.Matrix4().copy(parent.matrixWorld).invert().multiply(object.matrixWorld);
 const bb=bounds(object).clone().applyMatrix4(matrix),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());
 const span=Math.max(12,Math.min(40,Math.max(size.x,size.y,size.z)*1.12));
 const field=glyphField(parent,{center:center.toArray(),span,family,seed:Math.round(span*3)});
 ctx.fields.push({...field,owner:object,family});
}
function ensureSurfaceFields(ctx,objects){
 for(const o of objects){
  const param=o.geometry?.parameters;
  if(!o.isMesh||o.geometry.type!=='BoxGeometry'||!param||param.height>.6||param.height<.1||param.width<1.5||param.width>11)continue;
  if(ctx.surfaceOwners.has(o))continue;ctx.surfaceOwners.add(o);
  const seed=o.parent.parent.children.indexOf(o.parent)*3+o.parent.children.indexOf(o);
  const field=glyphField(o,{family:'context',surface:{width:param.width,height:param.height,depth:param.depth},seed});
  ctx.scene.add(field.mesh);field.mesh.matrixAutoUpdate=false;field.mesh.renderOrder=2;
  ctx.fields.push({...field,owner:o,family:'context'});
 }
}
function helix(ctx,scene,p,f){
 const h=globalThis.__upgradeHelix;if(!h)return;
 if(!ctx.helix){
  ctx.helix=[emissionLine(scene,650),emissionLine(scene,650)];
  ctx.helix.forEach((x,i)=>{x.mesh.userData.upgradeOwned=true;x.mat.uniforms.hot.value.set(...(i?[1.15,.72,1.8]:[1.6,.035,.18]));x.mat.uniforms.soft.value.set(...(i?[.25,.12,.46]:[.4,.008,.038]));x.mat.uniforms.coreWidth.value=.45;});
  const field=glyphField(scene,{family:'helix',center:[h.HELIX_CENTER[0],h.HELIX_CENTER[1]+2,h.HELIX_CENTER[2]-9],span:32,plane:'wall'});ctx.helixField=field;
 }
 const t=f/60,g=h.helixGrowth(t),weight=ease((t-60.5)/.5);
 for(let strand=0;strand<2;strand++){
  const points=[],weights=[];const n=Math.max(3,Math.min(640,Math.ceil(g.grownU*500)));
  for(let i=0;i<n;i++){const u=g.headU+(g.tailU-g.headU)*i/(n-1),age=t-h.helixBirthTime(Math.max(0,1-u));points.push(h.helixWorld(u,strand,t));weights.push(ease((age-.055)/.19));}
  const x=ctx.helix[strand];x.set(points,{gain:.38*weight,weights,head:h.helixWorld(g.headU,strand,t),headGain:strand?0:1});
  x.mat.uniforms.resolution.value.copy(ctx.resolution);
 }
 ctx.helixField.mesh.visible=true;ctx.helixField.material.uniforms.gain.value=p.code*weight;
 ctx.helixField.material.uniforms.head.value.copy(ctx.head.value);ctx.helixField.material.uniforms.clock.value=t;
}
export function beforeScene(renderer,scene,camera){
 const f=globalThis.__upgradeFrame;if(f===undefined||!camera?.isPerspectiveCamera||!scene?.isScene)return;
 const p=profileAt(f);globalThis.__upgradeProfile=p;
 let ctx=scenes.get(scene);
 if(!ctx){ctx={head:{value:new T.Vector3(99999,99999,99999)},inverse:{value:new T.Matrix4()},resolution:new T.Vector2(),fields:[],surfaceOwners:new WeakSet(),materials:[],halos:[],camera,scene};scenes.set(scene,ctx);(globalThis.__upgradeContexts??=[]).push(ctx);}
 camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 ctx.camera=camera;ctx.inverse.value.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);renderer.getDrawingBufferSize(ctx.resolution);
 const objects=[];scene.traverseVisible(o=>{if(o.material&&!o.userData.upgradeOwned)objects.push(o);});
 const emitter=findEmitter(objects,camera);ctx.head.value.copy(emitter??new T.Vector3(99999,99999,99999));
 for(const o of objects){
  let data=objectData.get(o);
  if(!data){data={light:litMaterial(o,ctx),halo:o.isLine?lineHalo(o):null};objectData.set(o,data);
   if(data.light){ctx.materials.push({object:o,...data.light});const previous=o.onBeforeRender;o.onBeforeRender=function(...args){previous?.apply(this,args);const light=data.light,bb=bounds(o);light.uniforms.upCenter.value.copy(bb?bb.getCenter(new T.Vector3()).applyMatrix4(o.matrixWorld):o.getWorldPosition(new T.Vector3()));light.uniforms.upGain.value=globalThis.__upgradeDisabled?0:profileAt(globalThis.__upgradeFrame).material*light.amount;o.material.uniformsNeedUpdate=true;};}
   if(data.halo)ctx.halos.push({object:o,...data.halo});}
 }
 for(const l of ctx.materials){l.uniforms.upGain.value=globalThis.__upgradeDisabled?0:p.material*l.amount;
  const bb=bounds(l.object);l.uniforms.upCenter.value.copy(bb?bb.getCenter(new T.Vector3()).applyMatrix4(l.object.matrixWorld):l.object.getWorldPosition(new T.Vector3()));}
 for(const l of ctx.halos)l.update(renderer,globalThis.__upgradeDisabled?0:p.halo);
 if(p.code>0&&!globalThis.__upgradeDisabled){
  if(p.family==='context')ensureSurfaceFields(ctx,objects);
  else if(p.family==='memory'&&objects.some(o=>o.material?.uniforms?.scanZ)){
   const owner=objects.find(o=>o.material?.uniforms?.scanZ);
   if(!ctx.fields.some(x=>x.corridor&&x.owner===owner))for(const side of [-1,1])for(let depth=0;depth<3;depth++){
    const field=glyphField(owner.parent,{family:'memory',span:19,plane:'wall',seed:depth});
    field.mesh.rotation.y=side*Math.PI/2;field.mesh.position.set(side*7.98,3.2,-depth*31-9);
    ctx.fields.push({...field,owner,family:'memory',corridor:true});
   }
  }
  else if(p.family!=='helix'&&p.family!=='intro'&&p.family!=='execution'){
   const subject=findSubject(objects,camera);if(subject)ensureField(ctx,subject,p.family);
  }
 }
 for(const field of ctx.fields){field.mesh.visible=!globalThis.__upgradeDisabled&&p.family===field.family&&visible(field.owner);field.material.uniforms.gain.value=field.mesh.visible?p.code:0;field.material.uniforms.red.value=p.red?1:0;field.material.uniforms.clock.value=f/60;field.material.uniforms.head.value.copy(ctx.head.value);if(field.surface)field.mesh.matrix.copy(field.owner.matrixWorld);}
 if(ctx.helix){ctx.helix.forEach(x=>x.mesh.visible=false);ctx.helixField.mesh.visible=false;}
 if(p.family==='helix'&&!globalThis.__upgradeDisabled)helix(ctx,scene,p,f);
 scene.updateMatrixWorld(true);
 if(globalThis.__upgradeAudit){
  globalThis.__upgradeAudit.push({family:p.family,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},
   visibleOriginalObjects:objects.length,litMaterials:ctx.materials.filter(x=>visible(x.object)).length,haloLines:ctx.halos.filter(x=>visible(x.object)).length,
   glyphs:ctx.fields.filter(x=>x.mesh.visible).reduce((n,x)=>n+x.glyphs,0)+(ctx.helixField?.mesh.visible?ctx.helixField.glyphs:0),
   sourceCode:[...new Set(ctx.fields.filter(x=>x.mesh.visible).map(x=>x.source))],head:emitter?.toArray()??null});
 }
}
export function modifyPost(post){
 if(globalThis.__upgradeDisabled||globalThis.__upgradeFrame===undefined)return post;
 const p=profileAt(globalThis.__upgradeFrame);
 post.bloom*=p.bloom;post.threshold*=p.threshold;
 // Existing severe faults keep their own beat-driven displacement.
 post.ca=Math.max(post.ca??0,p.red?.007:.012);
 return post;
}
