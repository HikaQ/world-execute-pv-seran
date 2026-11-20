import * as THREE from 'three';
import {EffectComposer} from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import {FLOW,VIEW,START,beatAt,stateAt,rowEvent} from './score.js';

const W=2880,H=1620;
const palette={white:new THREE.Color('#d9d3e4'),purple:new THREE.Color('#aba0c1'),tracked:new THREE.Color('#ae66ff')};
function geometry(trails=false){
 const positions=[],colors=[],sizes=[],events=[],tails=[],rowIds=[];
 function add(x,y,z,id,shade,size,tail=0){
  positions.push(x,y,z);colors.push(...shade);sizes.push(size);events.push(rowEvent(id));tails.push(tail);rowIds.push(id);
 }
 for(let id=FLOW.firstRow;id<FLOW.totalRows;id++){
  const tracked=id===FLOW.trackedRow;
  // A short role field, a longer content field and compact trailing fields
  // make each item read as a record instead of five equally weighted columns.
  const fields=[1.6,7.4,5.4,4.1,4.9];let origin=-FLOW.width/2;
  for(let block=0;block<fields.length;block++){
   const slot=fields[block],extent=.46+.45*((id*17+block*11+145)%29)/28;
   const spacing=.074,dots=Math.floor(slot*extent/spacing);
   const tint=(tracked?palette.tracked:block===0?palette.purple:palette.white).clone();
   tint.multiplyScalar(tracked?1.32:.64+.10*((id+block+12)%4)/3);
   for(let dot=0;dot<dots;dot++)for(let micro=0;micro<(trails?1:3);micro++){
    // Stagger the beads into a shallow rounded surface instead of stacking
    // three identical dots into vertical ticks. The whole row stays rigid.
    const x=origin+dot*spacing+(micro===1?.5*spacing:0);
    const y=trails?0:(micro-1)*.030,z=trails?-.02:micro===1?.024:-.014;
    if(trails){for(const delay of [.009,.018,.027])add(x,y,-.015,id,tint.toArray(),.035,delay);}
    else add(x,y,z,id,tint.toArray(),micro===1?.051:.042);
   }
   origin+=slot;
  }
 }
 const g=new THREE.BufferGeometry();
 for(const [name,values,n] of [['position',positions,3],['tint',colors,3],['size',sizes,1],['eventAt',events,1],['delay',tails,1],['rowId',rowIds,1]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,n));
 return g;
}

function material(trails){
 const uniforms={clock:{value:0},beat:{value:0},pointScale:{value:H/VIEW.height}};
 const f=x=>Number(x).toFixed(9);
 const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:!trails,depthTest:true,
  vertexShader:`attribute vec3 tint;attribute float size,eventAt,delay,rowId;
   uniform float clock,beat,pointScale;varying vec3 ink;varying float opacity;
   void main(){
    float age=clock-eventAt;float travelAge=max(0.,age);
    float center=${f(FLOW.top)}+${f(FLOW.speed)}*age+.5*${f(FLOW.acceleration)}*travelAge*travelAge;
    vec3 p=position;p.y+=center;
    float visible=step(${f(FLOW.bottom)},p.y)*(1.-step(${f(FLOW.exitDuration)},age));
    float edge=exp(-pow(age/.065,2.));float newEntry=exp(-pow((p.y-(${f(FLOW.bottom)}))/.52,2.));
    float freshness=1.-smoothstep(${f(FLOW.bottom)},${f(FLOW.top)},center);
    float departing=step(0.,age);
    float tracked=1.-step(.1,abs(rowId-${f(FLOW.trackedRow)}));
    float gain=.92+.23*freshness+.14*edge+.19*departing+.32*newEntry*beat;
    ink=tint*gain*(1.+tracked*.14);opacity=visible;
    ${trails?`
     float older=max(0.,age-delay);
     float past=${f(FLOW.top)}+${f(FLOW.speed)}*older+.5*${f(FLOW.acceleration)}*older*older;
     float lag=min(.29,max(0.,center-past));p.y-=lag;
     opacity*=step(delay,age)*(.09-delay*1.90);ink*=.8;
    `:''}
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    gl_PointSize=size*pointScale;
    if(opacity<.006)gl_PointSize=0.;
   }`,
  fragmentShader:`varying vec3 ink;varying float opacity;
   void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=dot(q,q);if(r>1.)discard;
    vec3 n=vec3(q,sqrt(max(0.,1.-r)));
    float edge=1.-smoothstep(.40,1.,r);
    float light=.45+.55*max(0.,dot(n,normalize(vec3(-.35,.5,1.))));
    float spec=pow(max(0.,dot(n,normalize(vec3(-.17,.24,1.)))),20.)*.14;
    float alpha=opacity*edge;if(alpha<.006)discard;gl_FragColor=vec4(ink*(light+spec),alpha);
   }`});
 return mat;
}

export function createWorld(){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#030207');
 const camera=new THREE.OrthographicCamera(-VIEW.width/2,VIEW.width/2,VIEW.height/2,-VIEW.height/2,.1,100);
 camera.position.set(0,VIEW.centerY,30);camera.lookAt(0,VIEW.centerY,0);camera.updateMatrixWorld();
 const target=new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target),bloom=new UnrealBloomPass(new THREE.Vector2(W,H),.22,.28,.88);
 composer.addPass(new RenderPass(scene,camera));composer.addPass(bloom);composer.addPass(new OutputPass());
 const rowsMaterial=material(false),trailMaterial=material(true);
 const rows=new THREE.Points(geometry(false),rowsMaterial),trails=new THREE.Points(geometry(true),trailMaterial);
 rows.frustumCulled=trails.frustumCulled=false;scene.add(trails,rows);

 // A very low continuous luminance field separates current context from the
 // black exit space. It has no box border, noise, grid or secondary particles.
 const bedMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{beat:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform float beat;void main(){
   float across=pow(max(0.,sin(vUv.x*3.14159265)),.7);
   float inside=smoothstep(0.,.065,vUv.y)*(1.-smoothstep(.94,1.,vUv.y));
   float bottom=exp(-vUv.y*12.);
   gl_FragColor=vec4(vec3(.010,.004,.023),across*inside*(.14+.25*bottom+.12*beat*bottom));
  }`});
 const bed=new THREE.Mesh(new THREE.PlaneGeometry(FLOW.width+.25,FLOW.top-FLOW.bottom),bedMaterial);
 bed.position.set(0,(FLOW.top+FLOW.bottom)/2,-.08);scene.add(bed);
 // Two fixed edges make the loss boundary readable without a container frame.
 const edges=new THREE.Group();scene.add(edges);
 const lineMaterial=new THREE.LineBasicMaterial({color:'#6e5b82',transparent:true,opacity:.50});
 for(const y of [FLOW.top,FLOW.bottom]){
  const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-FLOW.width/2-.18,y,.03),new THREE.Vector3(FLOW.width/2-.18,y,.03)]);
  edges.add(new THREE.Line(g,lineMaterial));
 }
 const marker=new THREE.Mesh(new THREE.SphereGeometry(.052,16,10),new THREE.MeshBasicMaterial({color:new THREE.Color('#ed3555').multiplyScalar(1.3)}));
 marker.position.set(-FLOW.width/2-.42,FLOW.bottom+.1,.05);scene.add(marker);
 function frame(t,{noBloom=false}={}){
  const beat=beatAt(t);for(const m of [rowsMaterial,trailMaterial]){m.uniforms.clock.value=t-START;m.uniforms.beat.value=beat;}
  bedMaterial.uniforms.beat.value=beat;
  lineMaterial.opacity=.43+.06*beat;marker.scale.setScalar(1+.08*beat);
  bloom.enabled=!noBloom;composer.render();
  return {canvas:renderer.domElement,...stateAt(t),particleCount:rows.geometry.attributes.position.count,
   camera:{position:camera.position.toArray(),target:[0,VIEW.centerY,0],orthographicHeight:VIEW.height},
   decorativeConnectionCount:0,noBloom,polish:{staggeredBeads:true,roundedSurface:true,fieldWidths:[1.6,7.4,5.4,4.1,4.9],oldAndNewLightHierarchy:true,referenceBeatAccents:true,readableDialogue:false}};
 }
 return {frame};
}
