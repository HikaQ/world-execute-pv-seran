import * as THREE from 'three';
import {LineSegments2} from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import {baseCameraAt,ramp,random} from './score.js';

// The threshold and the inherited coordinate field occupy one world space.
// Keep the original 4,928 coordinates and material at the geometry handoff.
export const SANDBOX={center:[13,3.5],width:23,height:15,front:-271,back:-299,scanSpeed:18.6};
let lo=30,hi=33;
for(let i=0;i<60;i++){const t=(lo+hi)/2;if(baseCameraAt(t).target[2]>SANDBOX.front)lo=t;else hi=t;}
export const CORE_ENTRY_TIME=(lo+hi)/2;
const resolution=new THREE.Vector2(2880,1620);
function strokes(parent,positions,color,width,alpha){
 const geo=new LineSegmentsGeometry();geo.setPositions(positions.flat());
 const mat=new LineMaterial({color,linewidth:width*1.5,transparent:true,opacity:alpha,depthWrite:false});mat.resolution.copy(resolution);
 const object=new LineSegments2(geo,mat);object.frustumCulled=false;parent.add(object);return {object,mat};
}
function annotate(parent){
 const c=document.createElement('canvas');c.width=768;c.height=128;const g=c.getContext('2d');
 g.font='500 72px "Space Grotesk"';g.fillStyle='#c7b3e0';g.fillText('SERAN',12,94);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const object=new THREE.Mesh(new THREE.PlaneGeometry(4.7,4.7/6),mat);
 object.position.set(13-11.5+2.35,3.5+7.5+.55,SANDBOX.front);parent.add(object);return {object,mat};
}
function activationMaterial(material,softNear=false){
 const uniforms={scanZ:{value:0},fieldGain:{value:0}};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float scanZ,fieldGain;varying float nodeLevel,nodeFlash;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
    float edge=1.-smoothstep(position.z-.8,position.z+.8,scanZ);
    nodeLevel=mix(.43,1.,edge)*fieldGain;
    nodeFlash=exp(-pow((position.z-scanZ)/.95,2.))*fieldGain;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float nodeLevel,nodeFlash;')
   .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= 1.+.85*nodeFlash;diffuseColor.a *= nodeLevel;');
  if(softNear){
   shader.vertexShader=shader.vertexShader.replace('#include <logdepthbuf_vertex>','gl_PointSize = min(gl_PointSize,5.0);\n#include <logdepthbuf_vertex>');
   shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','diffuseColor.a *= exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*18.);\n#include <alphatest_fragment>');
  }
 };
 material.customProgramCacheKey=()=> 'seran-field-activation-v1'+(softNear?'-soft-near':'');return uniforms;
}
export function createSeranSandbox(scene,camera,lattice){
 const group=new THREE.Group();scene.add(group);const {width:w,height:h,front,back}=SANDBOX,[cx,cy]=SANDBOX.center;
 const corners=[];
 for(const z of [front,back])for(const sx of [-1,1])for(const sy of [-1,1]){
  const x=cx+sx*w/2,y=cy+sy*h/2;
  corners.push([x,y,z],[x-sx*1.65,y,z],[x,y,z],[x,y-sy*1.15,z]);
 }
 const marks=strokes(group,corners,'#d6c8f0',1.1,.74),rules=[];
 // Dashed segments describe the volume; no complete heavy box edges.
 for(const z of [front,back]){
  for(const sy of [-1,1])for(let i=0;i<10;i++){const x=cx-w/2+2.4+i*1.83;rules.push([x,cy+sy*h/2,z],[x+.46,cy+sy*h/2,z]);}
  for(const sx of [-1,1])for(let i=0;i<6;i++){const y=cy-h/2+2+i*1.86;rules.push([cx+sx*w/2,y,z],[cx+sx*w/2,y+.32,z]);}
 }
 for(const sx of [-1,1])for(const sy of [-1,1])for(let i=0;i<14;i++){const z=front-1.1-i*1.92;rules.push([cx+sx*w/2,cy+sy*h/2,z],[cx+sx*w/2,cy+sy*h/2,z-.46]);}
 const dashed=strokes(group,rules,'#9680b9',.55,.27),tag=annotate(group);
 const rng=random(92367),p=[],weights=[];
 // Restrained, ordered particles along four boundary surfaces. The front and
 // rear stay open; there are no opaque floors, panels or glass caps.
 for(let k=0;k<=58;k++){
  const z=front+(back-front)*k/58;
  for(let i=0;i<=46;i++)for(const sy of [-1,1]){p.push(cx-w/2+w*i/46,cy+sy*h/2+(rng()-.5)*.055,z);weights.push(.45+.55*rng());}
  for(let i=1;i<30;i++)for(const sx of [-1,1]){p.push(cx+sx*w/2+(rng()-.5)*.055,cy-h/2+h*i/30,z);weights.push(.45+.55*rng());}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('weight',new THREE.Float32BufferAttribute(weights,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  uniforms:{scanZ:{value:front+10},gain:{value:0},focal:{value:2200},wake:{value:0}},
  vertexShader:`attribute float weight;uniform float scanZ,gain,focal,wake;varying vec3 tint;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    float pulse=exp(-pow((position.z-scanZ)/1.2,2.))*wake;float depth=max(.4,-mv.z);
    gl_PointSize=clamp((.018+.009*weight)*focal/depth,1.1,3.2);
    tint=mix(vec3(.30,.14,.55),vec3(1.1,.92,1.4),pulse)*gain*weight*(.46+.55*pulse);
    if(mv.z>-.25)gl_PointSize=0.;}`,
  fragmentShader:`varying vec3 tint;void main(){vec2 p=gl_PointCoord-.5;float ink=exp(-dot(p,p)*24.);if(ink<.01)discard;gl_FragColor=vec4(tint*ink,1.);}`});
 const shell=new THREE.Points(geo,material);shell.frustumCulled=false;group.add(shell);
 const nearP=[],nearC=[],violet=new THREE.Color('#b78bff'),white=new THREE.Color('#dce2ff');
 for(let z=0;z<8;z++)for(let y=0;y<14;y++)for(let x=0;x<22;x++){
  nearP.push(cx+(x-10.5)*.82,cy+(y-6.5)*.7,-276.8-z*1.4);
  const color=(x+y+z)%7===0?white:violet;nearC.push(...color.toArray().map(v=>v*.48));
 }
 const nearG=new THREE.BufferGeometry();nearG.setAttribute('position',new THREE.Float32BufferAttribute(nearP,3));nearG.setAttribute('color',new THREE.Float32BufferAttribute(nearC,3));
 const nearM=new THREE.PointsMaterial({size:.075,vertexColors:true,transparent:true,opacity:.95,depthWrite:false});
 const near=new THREE.Points(nearG,nearM);near.frustumCulled=false;group.add(near);
 const nearU=activationMaterial(nearM,true),fieldU=activationMaterial(lattice.material);
 const latticeOriginal=lattice.geometry.attributes.position.array.slice();
 function frame(t,core){
  const visible=t>=21,settle=ramp(t,21,23),scanZ=t<CORE_ENTRY_TIME?front+10:front-(t-CORE_ENTRY_TIME)*SANDBOX.scanSpeed;
  const crossingFlash=ramp(t,CORE_ENTRY_TIME,CORE_ENTRY_TIME+.065)*(1-ramp(t,CORE_ENTRY_TIME+.18,CORE_ENTRY_TIME+.42));
  group.visible=visible;marks.mat.opacity=(.74+.26*crossingFlash)*settle;dashed.mat.opacity=(.28+.10*crossingFlash)*settle;
  material.uniforms.scanZ.value=scanZ;material.uniforms.gain.value=settle;material.uniforms.focal.value=1620/(2*Math.tan(camera.fov*Math.PI/360));
  material.uniforms.wake.value=ramp(t,CORE_ENTRY_TIME,CORE_ENTRY_TIME+.065);
  tag.mat.opacity=.76*ramp(t,28.2,29.0)*(1-ramp(t,32.5,33.15));
  fieldU.scanZ.value=nearU.scanZ.value=scanZ;fieldU.fieldGain.value=nearU.fieldGain.value=settle;
  lattice.visible=visible;lattice.material.opacity=.95;
  // These near layers are behind the lens by the cut, so the original
  // coordinate field continues without dissolving or replacing its points.
  const beforeCut=Math.abs(t-35.1)<.035;
  let nearVisiblePoints=0,boundaryVisiblePoints=0;
  if(beforeCut){
   const v=new THREE.Vector3();for(let i=0;i<nearP.length;i+=3){v.fromArray(nearP,i).project(camera);if(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z>-1&&v.z<1)nearVisiblePoints++;}
   for(let i=0;i<p.length;i+=3){v.fromArray(p,i).project(camera);if(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z>-1&&v.z<1)boundaryVisiblePoints++;}
  }
  const activatedLayers=Array.from({length:16},(_,i)=>-288-i*1.4).filter(z=>scanZ<z-.8).length;
  return {type:'open-particle-boundary',visible,opaqueFloors:0,solidPanels:0,cornerMarkers:8,boundaryParticles:weights.length,entryParticles:nearP.length/3,inheritedLatticeParticles:latticeOriginal.length/3,entryTime:CORE_ENTRY_TIME,entryFrame:CORE_ENTRY_TIME*60,corePlaneDistance:core.z-front,scanZ,scanTriggered:t>=CORE_ENTRY_TIME,activatedLayers,latticeCoordinatesUnchanged:lattice.geometry.attributes.position.array.every((v,i)=>v===latticeOriginal[i]),nearVisiblePointsAtHandoff:beforeCut?nearVisiblePoints:null,boundaryVisiblePointsAtHandoff:beforeCut?boundaryVisiblePoints:null};
 }
 return {group,frame};
}

