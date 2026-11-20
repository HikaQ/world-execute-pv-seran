import * as THREE from 'three';
import {MeshSurfaceSampler} from '/node_modules/three/examples/jsm/math/MeshSurfaceSampler.js';
// Sample our existing procedural geometry, preserving the corrected cat ears.
// The atlas is drawn from the shared mono font; no bitmap character art needed.
let atlas;
function glyphAtlas(){
 if(atlas)return atlas;
 const cv=document.createElement('canvas');cv.width=512;cv.height=64;const g=cv.getContext('2d');
 g.font='500 55px "JetBrains Mono"';g.textAlign='center';g.textBaseline='middle';g.fillStyle='white';
 [...'01:+*{}='].forEach((s,i)=>g.fillText(s,i*64+32,32));
 atlas=new THREE.CanvasTexture(cv);return atlas;
}
export function sampledSurface(source,{count=18000,include=()=>true,seed=7,glyphs=.14}={}){
 let r=seed;const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 source.updateMatrixWorld(true);const inv=source.matrixWorld.clone().invert(),meshes=[];
 source.traverse(m=>{if(m.isMesh&&include(m)){const local=inv.clone().multiply(m.matrixWorld),size=new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position')).applyMatrix4(local).getSize(new THREE.Vector3());meshes.push({mesh:m,weight:size.x*size.y+size.y*size.z+size.z*size.x});}});
 const total=meshes.reduce((sum,m)=>sum+m.weight,0);
 const pos=[],normal=[],ink=[],glyph=[],pointType=[],p=new THREE.Vector3(),n=new THREE.Vector3();
 for(const {mesh:m,weight} of meshes){
  const local=inv.clone().multiply(m.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(local),sampler=new MeshSurfaceSampler(m).setRandomGenerator(random).build();
  const amount=Math.max(40,Math.round(count*weight/total));
  const base=m.material.color??new THREE.Color('#cbb4f0');
  for(let i=0;i<amount;i++){
   sampler.sample(p,n);p.applyMatrix4(local);n.applyMatrix3(nm).normalize();pos.push(...p.toArray());normal.push(...n.toArray());
   const c=base.clone().multiplyScalar(.90+.25*random());ink.push(...c.toArray());glyph.push(Math.floor(random()*8));pointType.push(random()<glyphs?1:0);
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));geometry.setAttribute('ink',new THREE.Float32BufferAttribute(ink,3));geometry.setAttribute('glyph',new THREE.Float32BufferAttribute(glyph,1));geometry.setAttribute('pointType',new THREE.Float32BufferAttribute(pointType,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{gain:{value:0},boost:{value:1},slice:{value:100},reveal:{value:1},atlas:{value:glyphAtlas()}},
  vertexShader:`attribute vec3 ink;attribute float glyph,pointType;varying vec3 tint,local;varying float cell,kind,facing;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 nn=normalize(normalMatrix*normal);facing=max(0.,dot(nn,normalize(-mv.xyz)));float light=.40+.60*max(0.,dot(nn,normalize(vec3(-.45,.60,1.))));tint=ink*light*1.35;local=position;cell=glyph;kind=pointType;gl_Position=projectionMatrix*mv;gl_PointSize=clamp((pointType>.5?260.:92.)/max(1.,-mv.z),pointType>.5?4.:1.7,pointType>.5?11.:4.8);}`,
  fragmentShader:`uniform float gain,boost,slice,reveal;uniform sampler2D atlas;varying vec3 tint,local;varying float cell,kind,facing;void main(){if(local.z>slice||local.x>(reveal*7.-3.3))discard;vec2 p=gl_PointCoord-.5;float a=kind>.5?texture2D(atlas,vec2((cell+gl_PointCoord.x)/8.,1.-gl_PointCoord.y)).a:exp(-dot(p,p)*18.);a*=gain*smoothstep(.0,.42,facing);if(a<.008)discard;gl_FragColor=vec4(tint*boost,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;
 return {points,material,count:pos.length/3};
}
