import * as THREE from 'three';
import {MarchingCubes} from '/node_modules/three/examples/jsm/objects/MarchingCubes.js';
import {MeshSurfaceSampler} from '/node_modules/three/examples/jsm/math/MeshSurfaceSampler.js';
import {mergeGeometries} from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

// One continuous sculpt for the sleeping pose. Surface samples remain fixed:
// breathing moves the sculpt, depth silhouette and fur together, never resamples.
const headCenter=new THREE.Vector3(1.16,.75,.90);
const headRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.14,.24,-.14));
const headInverse=headRotation.clone().invert();
const hp=p=>new THREE.Vector3(...p).applyQuaternion(headRotation).add(headCenter);
const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function volume(center,radii,rotation=new THREE.Quaternion()){
 const e=new THREE.Matrix4().makeRotationFromQuaternion(rotation.clone().invert()).elements;
 return {c:center,r:radii,e};
}
const volumes=[
 volume([-.57,.79,-.20],[1.52,.77,.94],new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-.18,0))),
 volume([-1.25,.65,-.04],[.87,.65,.85]),
 volume([.39,.68,.27],[.85,.64,.77]),
 volume([.89,.57,.65],[.57,.49,.52]),
 volume(headCenter.toArray(),[.79,.61,.60],headRotation),
 ...[-1,1].map(s=>volume(hp([s*.25,-.25,.43]).toArray(),[.31,.23,.28],headRotation)),
 volume(hp([0,-.25,.60]).toArray(),[.26,.16,.19],headRotation),
 volume(hp([0,-.43,.23]).toArray(),[.41,.20,.37],headRotation),
 volume([.63,.32,1.02],[.64,.30,.45],new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-.4,-.16))),
 volume([.94,.20,1.57],[.58,.20,.46]),
 volume([1.58,.21,1.37],[.48,.21,.43],new THREE.Quaternion().setFromEuler(new THREE.Euler(0,.23,0))),
 volume([-.84,.34,.52],[.87,.33,.64])
];
function sdf(x,y,z){
 let d=100;
 for(const {c,r,e} of volumes){
  const a=x-c[0],b=y-c[1],v=z-c[2],px=e[0]*a+e[4]*b+e[8]*v,py=e[1]*a+e[5]*b+e[9]*v,pz=e[2]*a+e[6]*b+e[10]*v;
  const k0=Math.hypot(px/r[0],py/r[1],pz/r[2]),k1=Math.hypot(px/(r[0]*r[0]),py/(r[1]*r[1]),pz/(r[2]*r[2]));
  const vdist=k1<1e-8?-Math.min(...r):k0*(k0-1)/k1;
  d=smoothMin(d,vdist,.13);
 }
 return Math.max(d,.035-y);
}
function skinGeometry(){
 const size=96,mc=new MarchingCubes(size,new THREE.MeshBasicMaterial(),false,false,120000);mc.isolation=0;
 const extent=[3.0,1.75,2.65],cy=.66;
 for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++)mc.field[x+size*(y+size*z)]=-sdf((x/size*2-1)*extent[0],cy+(y/size*2-1)*extent[1],(z/size*2-1)*extent[2]);
 mc.update();const p=mc.positionArray.slice(0,mc.count*3),n=mc.normalArray.slice(0,mc.count*3),nn=new THREE.Vector3();
 for(let i=0;i<mc.count;i++){
  p[3*i]*=extent[0];p[3*i+1]=p[3*i+1]*extent[1]+cy;p[3*i+2]*=extent[2];
  nn.set(n[3*i]/extent[0],n[3*i+1]/extent[1],n[3*i+2]/extent[2]).normalize();n.set(nn.toArray(),i*3);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('normal',new THREE.BufferAttribute(n,3));
 mc.geometry.dispose();mc.material.dispose();return geo;
}
function tailGeometry(){
 const path=new THREE.CatmullRomCurve3([[-1.78,.47,-.45],[-2.02,.27,.30],[-1.56,.23,1.24],[-.45,.22,1.68],[.48,.24,1.67],[.88,.29,1.53]].map(p=>new THREE.Vector3(...p)));
 const frames=path.computeFrenetFrames(140,false),p=[],uv=[],indices=[];
 for(let i=0;i<=140;i++){
  const u=i/140,c=path.getPoint(u),r=.235*Math.pow(1-u,.35)+.008;
  for(let j=0;j<=16;j++){const a=j/16*Math.PI*2,v=c.clone().addScaledVector(frames.normals[i],r*Math.cos(a)).addScaledVector(frames.binormals[i],r*Math.sin(a));p.push(...v.toArray());uv.push(u,j/16);
   if(i<140&&j<16){const k=i*17+j;indices.push(k,k+1,k+17,k+1,k+18,k+17);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g.toNonIndexed();
}
function earGeometry(side,inner=false){
 const shape=new THREE.Shape();
 shape.moveTo(side*.29,.30);shape.bezierCurveTo(side*.46,.51,side*.65,.75,side*.78,.84);shape.bezierCurveTo(side*.84,.88,side*.92,.43,side*.81,.27);shape.quadraticCurveTo(side*.55,.24,side*.29,.30);
 const g=new THREE.ExtrudeGeometry(shape,{depth:inner?.015:.11,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:inner?.005:.035,bevelThickness:inner?.005:.03,curveSegments:16});
 if(inner){g.translate(-side*.65,-.47,0);g.scale(.69,.71,1);g.translate(side*.65,.47,.145);}
 else g.translate(0,0,.025);
 g.applyQuaternion(headRotation);g.translate(...headCenter.toArray());return g;
}
function facePoint(x,y,offset=.014){
 let high=1.3,low=.05;
 for(let i=0;i<18;i++){const z=(high+low)/2,p=hp([x,y,z]);if(sdf(p.x,p.y,p.z)>0)high=z;else low=z;}
 return hp([x,y,high+offset]);
}
const deformGLSL=`
 uniform float time;
 vec3 deform(vec3 p,float part){
  float b=sin((time-86.78)*1.9634954-.6);
  float ribs=exp(-pow((p.x+.45)/1.45,2.))*smoothstep(.2,1.05,p.y);
  p.y+=.027*b*ribs;p.z+=.014*b*ribs;
  if(part>1.5&&part<3.5){float flick=exp(-pow((time-88.72)/.15,2.))*.023;float tip=smoothstep(1.02,1.63,p.y);p.x+=(part<2.5?-1.:1.)*tip*flick;}
  return p;
 }
`;
function furColor(p,n,part,random){
 const base=new THREE.Color('#b7b0cf'),stripe=new THREE.Color('#3b334e'),cream=new THREE.Color('#d8cfdf');
 if(part===4||part===5)return base.set('#8e6e94').lerp(cream,random()*.18);
 if(part>=2)return base.lerp(stripe,.32+.18*random());
 let bands;
 if(part===1)bands=Math.pow(Math.max(0,Math.cos(p.x*10+p.z*4)),5)*.8;
 else{
  const h=p.clone().sub(headCenter).applyQuaternion(headInverse),isHead=THREE.MathUtils.smoothstep(p.x,.35,.95);
  const bodyBands=Math.pow(Math.max(0,Math.cos(p.x*8.1+p.z*1.3+Math.sin(p.y*3)*.8)),8)*(.48+.25*Math.abs(n.z));
  const faceBands=Math.pow(Math.max(0,Math.cos(h.x*21+h.y*4)),10)*THREE.MathUtils.smoothstep(h.y,.12,.43)*.76;
  bands=THREE.MathUtils.lerp(bodyBands,faceBands,isHead);
  const bib=THREE.MathUtils.smoothstep(p.z,.75,1.4)*(1-THREE.MathUtils.smoothstep(p.y,.2,.65));base.lerp(cream,bib*.75);
 }
 return base.lerp(stripe,bands).multiplyScalar(.91+random()*.16);
}
export function createSleepingCat(){
 const group=new THREE.Group();group.name='sleeping-tabby-particle-sculpt';
 const shapes=[skinGeometry(),tailGeometry(),earGeometry(-1),earGeometry(1),earGeometry(-1,true),earGeometry(1,true)];
 shapes.forEach((g,i)=>{g.deleteAttribute('uv');g.setAttribute('part',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(i),1));});
 const solid=mergeGeometries(shapes,false),uniforms={gain:{value:0},time:{value:0}};
 const depthMaterial=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,colorWrite:false,depthWrite:true,
  vertexShader:`attribute float part;${deformGLSL}void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(deform(position,part),1.);}`,
  fragmentShader:`uniform float gain;void main(){float h=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(h>gain)discard;gl_FragColor=vec4(0.);}`});
 const depthMesh=new THREE.Mesh(solid,depthMaterial);depthMesh.renderOrder=-3;group.add(depthMesh);
 let state=41739;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const pos=[],normal=[],inks=[],parts=[],sizes=[],p=new THREE.Vector3(),n=new THREE.Vector3();
 function add(p,n,c,part,size=1){pos.push(...p.toArray());normal.push(...n.toArray());inks.push(...c.toArray());parts.push(part);sizes.push(size);}
 const amounts=[190000,26000,8000,8000,2400,2400];
 shapes.forEach((geometry,part)=>{
  const sampler=new MeshSurfaceSampler(new THREE.Mesh(geometry)).setRandomGenerator(random).build();
  for(let i=0;i<amounts[part];i++){
   sampler.sample(p,n);const c=furColor(p,n,part,random);p.addScaledVector(n,.012+random()*.006);add(p,n,c,part,.72+random()*.52);
   // A minority of outward fur tips break the silhouette, not the entire coat.
   if(i%14===0&&part<4){const tangent=new THREE.Vector3(-.14,.86,.25).addScaledVector(n,-n.dot(new THREE.Vector3(-.14,.86,.25))).normalize();for(let j=1;j<=3;j++)add(p.clone().addScaledVector(n,j*.006).addScaledVector(tangent,j*.006),n,c,part,.58);}
  }
 });
 const detailNormal=new THREE.Vector3(0,0,1).applyQuaternion(headRotation),dark=new THREE.Color('#292435'),lid=new THREE.Color('#262032'),light=new THREE.Color('#d7c9e1');
 function faceStroke(fn,steps=160,width=.006,color=dark){
  for(let i=0;i<steps;i++){const [x,y]=fn(i/(steps-1));for(let k=0;k<4;k++){const q=facePoint(x+(random()-.5)*width,y+(random()-.5)*width);add(q,detailNormal,color,0,1.28);}}
 }
 for(const side of [-1,1]){
  // Soft closed eyelids, a short cheek mark, relaxed mouth and muzzle dots.
  faceStroke(u=>[side*.32+(u-.5)*.39,.045-.072*Math.sin(Math.PI*u)],180,.012,lid);
  faceStroke(u=>[side*(.43+.17*u),-.12-.07*u],90,.014,new THREE.Color('#665b7d'));
  faceStroke(u=>[side*(.03+.17*u),-.37-.04*Math.sin(Math.PI*u)],100,.007,dark);
  for(let j=0;j<4;j++){
   const start=facePoint(side*.29,-.27-j*.035,.025),end=hp([side*(1.10+j*.04),-.24-j*.11,.56]);
   const path=new THREE.QuadraticBezierCurve3(start,start.clone().lerp(end,.5).add(new THREE.Vector3(0,.04,0)),end);
   for(let i=0;i<130;i++)add(path.getPoint(i/129),detailNormal,light,0,.68);
  }
 }
 faceStroke(u=>[0,-.25-.12*u],65,.01);
 // A small rounded triangular nose, with no glossy open-eye highlights.
 for(let i=0;i<850;i++){let a=random(),b=random();if(a+b>1){a=1-a;b=1-b;}const x=-.10+a*.20+b*.10,y=-.20-b*.105;add(facePoint(x,y,.03),detailNormal,new THREE.Color('#8e647d'),0,1.03);}
 // Toe separations run across the two resting forepaws.
 for(const [cx,cz] of [[1.08,1.77],[1.68,1.63]])for(const dx of [-.10,.08])for(let i=0;i<70;i++){
  const u=i/69,q=new THREE.Vector3(cx+dx,.32+.04*Math.sin(Math.PI*u),cz+.13*u);add(q,new THREE.Vector3(0,1,1).normalize(),new THREE.Color('#6b607c'),0,.76);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));geo.setAttribute('ink',new THREE.Float32BufferAttribute(inks,3));geo.setAttribute('part',new THREE.Float32BufferAttribute(parts,1));geo.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
  vertexShader:`attribute vec3 ink;attribute float part,size;varying vec3 tint;varying float facing,mote;${deformGLSL}
   void main(){mote=fract(sin(dot(position,vec3(12.9898,78.233,38.719)))*43758.5453);vec4 mv=modelViewMatrix*vec4(deform(position,part),1.);vec3 nn=normalize(normalMatrix*normal);facing=dot(nn,normalize(-mv.xyz));float light=.22+.78*max(0.,dot(nn,normalize(vec3(-.45,.72,1.))));tint=ink*light*1.02;gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*59./max(1.,-mv.z),1.,4.4);}`,
  fragmentShader:`uniform float gain,time;varying vec3 tint;varying float facing,mote;void main(){if(time>=90.25&&mote>gain)discard;vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5||facing<-.15)discard;float a=(1.-smoothstep(.13,.5,r))*.92*gain;gl_FragColor=vec4(tint,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const points=new THREE.Points(geo,material);points.frustumCulled=false;points.renderOrder=2;group.add(points);
 // A subtle support/shadow conveys weight while retaining the existing stage.
 const support=new THREE.Mesh(new THREE.PlaneGeometry(6.5,4.5),new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float gain;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*3.5)*gain*.20;gl_FragColor=vec4(.24,.16,.34,a);}'}));
 support.rotation.x=-Math.PI/2;support.position.set(-.15,.006,.35);group.add(support);
 return {group,count:pos.length/3,triangles:solid.attributes.position.count/3,
  update(time,gain){uniforms.time.value=time;uniforms.gain.value=gain;group.visible=gain>.001;},
  anchor(){return new THREE.Vector3(.45,.60,1.75);},
  throat(){return hp([.12,-.43,.65]);},
  state(time){return {pose:'curled-sleeping-full-body',eyes:'closed',coat:'silver-lavender-tabby',depthOcclusion:true,breathPeriod:3.2,breath:Math.sin((time-86.78)*1.9634954-.6),particles:pos.length/3,triangles:solid.attributes.position.count/3};}
 };
}

export function createPurrParticles(parent){
 const N=2700,geo=new THREE.BufferGeometry(),positions=new Float32Array(N*3),alphas=new Float32Array(N);
 geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('strength',new THREE.BufferAttribute(alphas,1));
 const material=new THREE.ShaderMaterial({uniforms:{gain:{value:0}},transparent:true,depthWrite:false,
  vertexShader:'attribute float strength;varying float a;void main(){a=strength;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(85./max(1.,-p.z),1.2,4.6);}',
  fragmentShader:'uniform float gain;varying float a;void main(){vec2 p=gl_PointCoord-.5;float q=exp(-dot(p,p)*20.)*a*gain;if(q<.004)discard;gl_FragColor=vec4(.70,.51,.90,q);}'});
 const points=new THREE.Points(geo,material);points.frustumCulled=false;parent.add(points);
 return {update(t,begin,end,start,gain){
  const progress=THREE.MathUtils.clamp((t-begin)/(end-begin),0,1),dest=new THREE.Vector3(9.4,0,0),a=start.clone(),span=dest.clone().sub(a),side=new THREE.Vector3(0,1,0);
  for(let i=0;i<N;i++){
   const u=i/(N-1),phase=u*42-(t-begin)*11.5,window=Math.exp(-Math.pow((u-(progress-.14))/.17,2)),strand=i%3-1;
   const p=a.clone().addScaledVector(span,u).addScaledVector(side,Math.sin(phase)*(.48-.22*u)*window+strand*.17);p.z+=Math.cos(phase)*.13*window;
   positions.set(p.toArray(),i*3);alphas[i]=window*(u<=progress?1:0)*(.65+.35*Math.sin(i*2.4)**2);
  }geo.attributes.position.needsUpdate=true;geo.attributes.strength.needsUpdate=true;material.uniforms.gain.value=gain;points.visible=gain>.001;return a.x+(9.4-a.x)*progress;
 }};
}
