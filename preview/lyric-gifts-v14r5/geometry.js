// Original procedural subjects. No reference scene geometry is copied.
import * as THREE from '/node_modules/three/build/three.module.js';

const TAU=Math.PI*2;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function mesh(geometry,color,extra={}){
  return new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.12,...extra}));
}
function sphere(parent,position,scale,color,extra={}){
  const object=mesh(new THREE.SphereGeometry(1,44,28),color,extra);object.position.set(...position);object.scale.set(...scale);parent.add(object);return object;
}
function tube(parent,points,radius,color){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const object=mesh(new THREE.TubeGeometry(curve,30,radius,7,false),color);parent.add(object);return object;
}
function eggProfile(u){
  const x=-2.6+5.15*u,y=.78*(u-.18)**2-.23;
  const r=1.42*Math.sin(Math.PI*u)**.52*(1-.52*u);
  return {x,y,r};
}
function eggGeometry(){
  const positions=[],uvs=[],indices=[],U=88,V=56;
  for(let i=0;i<=U;i++)for(let j=0;j<=V;j++){
    const u=i/U,a=j/V*TAU,p=eggProfile(u);
    positions.push(p.x,p.y+p.r*Math.cos(a),p.r*Math.sin(a));uvs.push(u,j/V);
    if(i<U&&j<V){const n=i*(V+1)+j;indices.push(n,n+1,n+V+1,n+1,n+V+2,n+V+1);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function eggSection(){
  const shape=new THREE.Shape();
  for(let i=0;i<=88;i++){const p=eggProfile(i/88);i?shape.lineTo(p.x,p.y+p.r):shape.moveTo(p.x,p.y+p.r);}
  for(let i=88;i>=0;i--){const p=eggProfile(i/88);shape.lineTo(p.x,p.y-p.r);}
  shape.closePath();return new THREE.ShapeGeometry(shape,88);
}
function eggplant(){
  const group=new THREE.Group();
  const shell=mesh(eggGeometry(),'#9854d0',{side:THREE.DoubleSide,roughness:.30,metalness:.20});group.add(shell);
  const section=mesh(eggSection(),'#e6cfec',{roughness:.82,side:THREE.DoubleSide});section.position.z=.022;group.add(section);
  const seedGroup=new THREE.Group();group.add(seedGroup);
  for(let i=0;i<18;i++){
    const u=.14+(i%9)*.069,p=eggProfile(u),side=i<9?-1:1;
    const seed=sphere(seedGroup,[p.x,p.y+side*p.r*.36,.06],[.072,.032,.026],'#8b628d');seed.rotation.z=.35*side;
  }
  const end=eggProfile(.91);
  for(let i=0;i<6;i++){
    const a=i/6*TAU,vertices=[2.22,end.y+.16*Math.cos(a),.16*Math.sin(a),1.95,end.y+.63*Math.cos(a-.38),.63*Math.sin(a-.38),1.10,end.y+.57*Math.cos(a),.57*Math.sin(a),1.95,end.y+.63*Math.cos(a+.38),.63*Math.sin(a+.38)];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();group.add(mesh(g,'#78ad91',{side:THREE.DoubleSide,roughness:.74}));
  }
  tube(group,[[2.30,.30,0],[2.72,.55,0],[2.94,.83,-.02]],.13,'#8bb69c');
  return {group,shell,section,seedGroup,sectionPlane:new THREE.Plane(new THREE.Vector3(0,0,-1),2)};
}
function tomato(){
  const group=new THREE.Group(),g=new THREE.SphereGeometry(1,80,52),a=g.getAttribute('position');
  for(let i=0;i<a.count;i++){
    let x=a.getX(i),y=a.getY(i),z=a.getZ(i),ang=Math.atan2(z,x),lobes=1+.065*Math.cos(7*ang)*(1-y*y);
    a.setXYZ(i,x*1.65*lobes,y*1.45-.12*(1-y*y),z*1.55*lobes);
  }
  g.computeVertexNormals();group.add(mesh(g,'#e34d65',{roughness:.28,metalness:.12}));
  const star=new THREE.Shape();
  for(let i=0;i<10;i++){const a=i/10*TAU,r=i%2?.28:.92,x=Math.cos(a)*r,y=Math.sin(a)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();
  const calyx=mesh(new THREE.ShapeGeometry(star),'#78a98a',{roughness:.8,side:THREE.DoubleSide});calyx.rotation.x=-Math.PI/2;calyx.position.y=1.44;group.add(calyx);
  for(let i=0;i<6;i++){
    const a=i/6*TAU;
    tube(group,[[0,1.36,0],[Math.cos(a)*.44,1.43,Math.sin(a)*.44],[Math.cos(a)*.83,1.16,Math.sin(a)*.83]],.080,'#85b098');
  }
  tube(group,[[0,1.36,0],[.08,1.79,.03],[.29,1.98,.03]],.11,'#85b098');
  return {group};
}
function cat(){
  const group=new THREE.Group();
  sphere(group,[0,0,0],[1.55,1.25,.86],'#c7c2d7',{roughness:.8});
  const earObjects=[];
  for(const side of [-1,1]){
    // The root is inside the head, and both surfaces share this animation pivot.
    const ear=new THREE.Group();ear.name=side<0?'cat-ear-left':'cat-ear-right';ear.position.set(side*.94,.62,.08);ear.rotation.z=side*-.10;group.add(ear);earObjects.push(ear);
    const shape=new THREE.Shape();shape.moveTo(-.47*side,-.12);
    shape.quadraticCurveTo(-.54*side,-.10,-.45*side,.03);shape.lineTo(.20*side,1.10);
    shape.quadraticCurveTo(.25*side,1.17,.29*side,1.08);shape.lineTo(.45*side,-.15);
    shape.quadraticCurveTo(.44*side,-.24,.32*side,-.21);shape.quadraticCurveTo(-.08*side,-.27,-.47*side,-.12);shape.closePath();
    const outerGeometry=new THREE.ExtrudeGeometry(shape,{depth:.30,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:12});outerGeometry.translate(0,0,-.18);
    const outer=mesh(outerGeometry,'#b4afc6',{roughness:.8});outer.name='outer-ear';ear.add(outer);
    // Inset in the same local space, just above the front cap; no floating layer.
    const inset=new THREE.Shape();inset.moveTo(-.28*side,.04);inset.lineTo(.18*side,.88);
    inset.quadraticCurveTo(.205*side,.92,.22*side,.86);inset.lineTo(.32*side,-.03);
    inset.quadraticCurveTo(.04*side,-.11,-.28*side,.04);inset.closePath();
    const inner=mesh(new THREE.ShapeGeometry(inset,12),'#d99fb9',{roughness:.9,side:THREE.DoubleSide});inner.name='inner-ear';inner.position.z=.158;ear.add(inner);
  }
  const eyes=[];
  for(const side of [-1,1]){
    sphere(group,[side*.66,.16,.73],[.43,.25,.16],'#1c162a');
    sphere(group,[side*.66,.16,.84],[.32,.20,.082],side<0?'#bb8df2':'#e86485',{roughness:.23,emissive:side<0?'#6e3f97':'#94364f',emissiveIntensity:.22});
    const pupil=sphere(group,[side*.66,.16,.912],[.058,.18,.024],'#110d19');eyes.push(pupil);
    sphere(group,[side*.75,.23,.925],[.045,.046,.018],'#fff7fa');
  }
  sphere(group,[-.29,-.43,.78],[.43,.30,.21],'#e5dfe8',{roughness:.9});sphere(group,[.29,-.43,.78],[.43,.30,.21],'#e5dfe8',{roughness:.9});
  const nose=mesh(new THREE.ConeGeometry(.16,.20,3),'#b87594',{roughness:.7});nose.position.set(0,-.32,1.005);nose.rotation.z=Math.PI;nose.rotation.y=Math.PI;group.add(nose);
  tube(group,[[0,-.40,.995],[0,-.54,1.005],[-.24,-.64,.97],[-.38,-.56,.93]],.025,'#4c3c61');
  tube(group,[[0,-.40,.995],[0,-.54,1.005],[.24,-.64,.97],[.38,-.56,.93]],.025,'#4c3c61');
  const stripes=[
    [[-.51,.98,.49],[-.40,.68,.72],[-.22,.91,.65],[0,.62,.80],[.22,.91,.65],[.4,.68,.72],[.51,.98,.49]],
    [[-.18,1.12,.36],[-.13,.96,.57],[-.08,.79,.71]],
    [[.18,1.12,.36],[.13,.96,.57],[.08,.79,.71]],
  ];
  stripes.forEach(points=>tube(group,points,.055,'#635777'));
  for(const side of [-1,1])for(let i=0;i<3;i++)tube(group,[[side*1.02,.43-i*.30,.62],[side*1.28,.30-i*.29,.49],[side*1.44,.18-i*.27,.27]],.060,'#70617e');
  const whiskers=[];
  for(const side of [-1,1])for(let i=0;i<3;i++)whiskers.push([[side*.40,-.44,.96],[side*1.10,-.46+(i-1)*.15,.95],[side*2.08,-.42+(i-1)*.32,.80]]);
  return {group,eyes,whiskers,earObjects};
}

export function createSubjects(){
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#e8dff8','#4b334e',2.0));
  const key=new THREE.DirectionalLight('#ffffff',4.5);key.position.set(-3,5,7);scene.add(key);
  const rim=new THREE.DirectionalLight('#bc9afa',2.0);rim.position.set(5,1,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight('#f6a0b8',.8);fill.position.set(5,0,5);scene.add(fill);
  const egg=eggplant(),tom=tomato(),kitty=cat(),subjects={eggplant:egg,tomato:tom,cat:kitty};
  Object.values(subjects).forEach(subject=>{scene.add(subject.group);subject.group.visible=false;});
  function update(kind,t){
    for(const [name,subject] of Object.entries(subjects))subject.group.visible=name===kind;
    const object=subjects[kind];if(!object)return;
    object.group.position.set(-1.85,.24,0);
    object.group.scale.setScalar(kind==='eggplant'?1.20:kind==='tomato'?1.35:1.27);
    object.group.rotation.set(0,0,0);
    if(kind==='eggplant'){
      object.group.rotation.y=.16+.055*(t-74.2);object.group.rotation.z=.34;
      const cut=smooth((t-75.7166667)/.64);
      object.section.visible=cut>.03;object.seedGroup.visible=cut>.03;
      object.group.updateMatrixWorld(true);
      object.sectionPlane.set(new THREE.Vector3(0,0,-1),2-(1.98*cut)).applyMatrix4(object.group.matrixWorld);
      object.shell.material.clippingPlanes=cut>.01?[object.sectionPlane]:[];
    }else if(kind==='tomato'){
      object.group.rotation.x=.34;object.group.rotation.y=-.12+(t-77.9166667)*.095;object.group.rotation.z=-.035;
    }else{
      object.group.rotation.y=.045*Math.sin((t-81.5833333)*.5);object.group.rotation.z=.02*Math.sin((t-81.5833333)*.75);
      const blink=1-.70*Math.exp(-(((t-84.56)/.13)**2));object.eyes.forEach(e=>e.scale.y=.18*blink);
    }
    object.group.updateMatrixWorld(true);
  }
  return {scene,subjects,update,eggProfile};
}
