import * as THREE from 'three';
export const WHITE='#eee6ff',PALE='#d3bcf4',VIOLET='#ae79ec',DIM='#75628e',RED='#ff3453';
export const V=a=>new THREE.Vector3(...a),dummy=new THREE.Object3D();
export function label(parent,text,size=.55,color=PALE,font='mono',align='left'){
 const cv=document.createElement('canvas'),g=cv.getContext('2d'),family=font==='sans'?'"Space Grotesk", "Memory Notes"':'"JetBrains Mono", "Memory Notes"';
 g.font=`500 100px ${family}`;const w=Math.ceil(g.measureText(text).width)+24;cv.width=w;cv.height=144;
 g.font=`500 100px ${family}`;g.textBaseline='alphabetic';g.fillStyle=color;g.fillText(text,12,108);
 const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
 const mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w/100*size,1.44*size),mat);mesh.renderOrder=5;parent.add(mesh);
 const width=w/100*size;
 return {mesh,mat,width,show(p,a=1,q){mesh.visible=a>.001;mesh.position.set(...p);if(align==='left')mesh.position.x+=width/2;else if(align==='right')mesh.position.x-=width/2;mat.opacity=a;if(q)mesh.quaternion.copy(q);}};
}
export function instance(parent,n,geometry=new THREE.BoxGeometry(1,1,1),color=PALE){
 const mat=new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.3,emissive:color,emissiveIntensity:.15,transparent:true});
 const mesh=new THREE.InstancedMesh(geometry,mat,n);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;parent.add(mesh);return mesh;
}
export function set(mesh,i,p,scale=1,rot=[0,0,0],color){
 dummy.position.set(...p);dummy.rotation.set(...rot);if(Array.isArray(scale))dummy.scale.set(...scale);else dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(color)mesh.setColorAt(i,color);
}
export function points(parent,p,{color=PALE,size=80,opacity=1}={}){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 const uniforms={gain:{value:opacity},ink:{value:new THREE.Color(color)},size:{value:size}};
 const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
  vertexShader:'uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size/max(1.,-p.z),1.,5.);}',
  fragmentShader:'uniform float gain;uniform vec3 ink;void main(){vec2 q=gl_PointCoord-.5;float a=exp(-dot(q,q)*22.)*gain;if(a<.004)discard;gl_FragColor=vec4(ink*1.65,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'.replace(';#include',';\n#include')});
 const mesh=new THREE.Points(geometry,mat);mesh.frustumCulled=false;parent.add(mesh);return {mesh,geometry,uniforms,count:p.length/3};
}
export function word(parent,text,width,color=WHITE){
 const cv=document.createElement('canvas');cv.width=2400;cv.height=420;const g=cv.getContext('2d');g.font='600 300px "Space Grotesk"';g.fillStyle='white';g.textAlign='center';g.textBaseline='middle';g.fillText(text,1200,210);
 const data=g.getImageData(0,0,2400,420).data,p=[];
 for(let y=0;y<420;y+=3)for(let x=0;x<2400;x+=3)if(data[(y*2400+x)*4+3]>90)p.push((x/2400-.5)*width,(.5-y/420)*width*420/2400,Math.sin(x*17+y)*.05);
 return points(parent,p,{color,size:90});
}
export function line(parent,color=VIOLET,capacity=8192){
 const p=new Float32Array(capacity*6),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setDrawRange(0,0);
 const mat=new THREE.LineBasicMaterial({color,transparent:true,depthWrite:false});const mesh=new THREE.LineSegments(g,mat);mesh.frustumCulled=false;parent.add(mesh);
 return {mesh,mat,set(pairs,alpha=1){if(pairs.length>capacity*2)throw Error('Line capacity');mesh.visible=alpha>.001;mat.opacity=alpha;let i=0;for(const v of pairs)p.set(v,i++*3);g.attributes.position.needsUpdate=true;g.setDrawRange(0,pairs.length);}};
}
export function pairs(path){return path.slice(1).flatMap((p,i)=>[path[i],p]);}
export function bezier(a,b,c,d,n=65){const curve=new THREE.CubicBezierCurve3(V(a),V(b),V(c),V(d));return Array.from({length:n},(_,i)=>curve.getPoint(i/(n-1)).toArray());}
export function colorMix(a,b,u){return new THREE.Color(a).lerp(new THREE.Color(b),u);}
export function plane(parent,w,h,color='#160e26'){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.12),new THREE.MeshBasicMaterial({color,transparent:true}));parent.add(mesh);return mesh;
}
