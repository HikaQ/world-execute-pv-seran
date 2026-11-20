import * as THREE from 'three';
import {memoryAt,ramp,EXECUTION,pulse,shotAt} from './score.js';

export async function loadMemoryFont(){const f=new FontFace('Forgetting Notes','url("/preview/refinement-forgetting-v6/forgetting-notes.ttf")',{weight:'500 600'});document.fonts.add(await f.load());}

function textPlane(parent,w,h,{resolution=2048,color='#d9cdeb'}={}){
 const cv=document.createElement('canvas');cv.width=resolution;cv.height=Math.round(resolution*h/w);const g=cv.getContext('2d');
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);parent.add(mesh);let previous='';
 return {mesh,set(text,x,y,z=.1,alpha=1){mesh.position.set(x,y,z);mesh.visible=alpha>.001;material.opacity=alpha;
  if(previous===text)return;previous=text;g.clearRect(0,0,cv.width,cv.height);g.textBaseline='middle';g.font=`500 ${Math.floor(cv.height*.64)}px "JetBrains Mono", "Forgetting Notes"`;g.fillStyle=color;g.fillText(text,0,cv.height*.51,cv.width-4);tex.needsUpdate=true;
 }};
}

export function createMemory(groups,{cloud,arrays,put,C}){
 const all=[];
 // Parallel pages are actual record surfaces, not decorative connecting wires.
 const pa=arrays();
 for(let page=0;page<12;page++)for(let row=0;row<52;row++)for(let col=0;col<102;col++){
  const edge=row===0||row===51||col===0||col===101;
  const field=row%5===0?.75:(col%17<12?.45:.12);
  put(pa,[(col-50.5)*.16,(25.5-row)*.16,-page*.68],C.white.clone().lerp(C.violet,page/24).multiplyScalar(edge?.95:field).toArray(),edge?.045:.038,[col/101,row/51,page]);
 }
 const pages=cloud(groups.pages,pa,`p.z+=hit*.10*(1.-data.z/12.);col*=.55+.45*(1.-data.z/12.);`);all.push(pages);
 // A record page occludes the pages behind it. The depth-only face emits no
 // colour; the visible drawing remains particles, without layered-grid moire.
 const pageDepth=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:THREE.DoubleSide});
 for(let page=0;page<12;page++){const occluder=new THREE.Mesh(new THREE.PlaneGeometry(16.14,8.14),pageDepth);occluder.position.z=-page*.68-.006;groups.pages.add(occluder);}

 const ra=arrays();
 for(let row=0;row<64;row++)for(let col=0;col<180;col++)for(let micro=0;micro<3;micro++){
  const u=col/179,block=Math.floor(u*5),phase=u*5-block;
  const extent=.36+.55*((row*17+block*11+Math.floor(row/5)*7)%29)/28;
  if(phase>extent)continue;
  const syntax=block===0?C.violet:block===1&&row%2===0?C.red:C.white;
  const intensity=(block===0?.56:.42)+.28*((row+block)%4)/3;
  put(ra,[(u-.5)*18.4,6.9-row*.58+(micro-1)*.062,0],syntax.clone().multiplyScalar(intensity).toArray(),.048,[u,row,0]);
  if(micro===1)put(ra,[(u-.5)*18.4,6.9-row*.58,-.40],C.violet.clone().multiplyScalar(.18).toArray(),.026,[u,row,1]);
 }
 const records=cloud(groups.records,ra,`
  p.y+=memoryHead*.58;
  // Clip the moving data itself, never leave a faded copy above the window.
  alpha=step(-7.25,p.y)*step(p.y,7.25);
  float entering=exp(-pow((p.y+7.0)/.30,2.));
  col*=1.+.16*hit;col+=vec3(.24,.13,.40)*entering;
 `,{memoryHead:{value:0},search:{value:0}});all.push(records);
 const ba=arrays();
 for(let j=0;j<260;j++)for(const y of [-7.25,7.25])put(ba,[-9.55+j/259*19.1,y,.03],C.white.clone().multiplyScalar(.45).toArray(),.026);
 for(let row=0;row<24;row++)for(let j=0;j<5;j++)put(ba,[-9.7-j*.055,6.9-row*.58,.02],C.violet.clone().multiplyScalar(.50).toArray(),.027);
 const bounds=cloud(groups.records,ba,`col=mix(col,vec3(.95,.12,.22),hit*.7);`);all.push(bounds);
 const identity=textPlane(groups.records,19.1,.73,{color:'#c4b1df'}),counter=textPlane(groups.records,19.1,.55,{color:'#877294'});

 // The same regular typography becomes the last retained identity.
 const cv=document.createElement('canvas');cv.width=920;cv.height=290;const g=cv.getContext('2d');
 g.fillStyle='white';g.font='600 226px "JetBrains Mono"';g.textBaseline='middle';g.fillText('HIKAQ',0,145);
 const px=g.getImageData(0,0,920,290).data,na=arrays();
 for(let y=0;y<290;y+=2)for(let x=0;x<920;x+=2){const a=px[(y*920+x)*4+3]/255;if(a>.1)put(na,[-11+x/920*12,3.4-y/290*3.8,0],C.white.clone().multiplyScalar(a*.84).toArray(),.026,[x/920,y/290,0]);}
 const name=cloud(groups.recall,na,`col*=.91+.09*exp(-pow((data.x-progress)/.08,2.));`);all.push(name);
 const ea=arrays();
 for(let row=0;row<4;row++)for(let col=0;col<100;col++){
  put(ea,[2.3+col/99*8.7,2.5-row*.92,0],C.violet.clone().multiplyScalar(.45).toArray(),.039,[col/99,row,0]);
  if(col<3||col>96)put(ea,[2.3+col/99*8.7,2.7-row*.92,0],C.white.clone().multiplyScalar(.4).toArray(),.028);
 }
 const empty=cloud(groups.recall,ea,`float scan=exp(-pow((data.x-progress)/.055,2.));col*=.5+.5*scan;`);all.push(empty);
 const ev=document.createElement('canvas');ev.width=ev.height=320;const eg=ev.getContext('2d');eg.fillStyle='white';eg.font='500 260px "JetBrains Mono"';eg.textBaseline='middle';eg.textAlign='center';eg.fillText('∅',160,160);
 const ep=eg.getImageData(0,0,320,320).data,er=arrays();
 for(let y=0;y<320;y+=2)for(let x=0;x<320;x+=2){const alpha=ep[(y*320+x)*4+3]/255;if(alpha>.1)put(er,[6.7+(x/320-.5)*3.6,1.2+(.5-y/320)*3.6,.12],C.white.clone().lerp(C.violet,.3).multiplyScalar(alpha*.85).toArray(),.027);}
 const emptyResult=cloud(groups.recall,er,`alpha=progress;`);all.push(emptyResult);
 const profile=textPlane(groups.recall,11,.55,{color:'#af95cd'}),missing=textPlane(groups.recall,9,.55,{color:'#8a779b'});
 const question=textPlane(groups.recall,23.8,.83,{resolution:4096,color:'#bda4e3'}),answer=textPlane(groups.recall,23.8,.83,{resolution:4096,color:'#e8d5e6'}),source=textPlane(groups.recall,23.8,.48,{color:'#756581'});

 // One fixed red actor marks the active boundary; it never drags the camera.
 const coreGeo=new THREE.SphereGeometry(.075,16,10),coreMat=new THREE.MeshBasicMaterial({color:new THREE.Color('#ff3357').multiplyScalar(2)});
 const core=new THREE.Mesh(coreGeo,coreMat);groups.records.add(core);
 const recallCore=new THREE.Mesh(coreGeo,coreMat);recallCore.position.set(-11,4.25,.1);groups.recall.add(recallCore);

 function frame(t){
  const m=memoryAt(t);records.uniforms.memoryHead.value=m.head;records.uniforms.search.value=m.search;
  records.uniforms.progress.value=ramp(t,71.9574,74.5684);records.uniforms.gain.value=1.8;pages.uniforms.gain.value=1.65;bounds.uniforms.gain.value=1.3;
  empty.uniforms.gain.value=1.5;empty.uniforms.progress.value=ramp(t,77.0142,77.48);
  bounds.uniforms.hit.value=pulse(t,EXECUTION,.13);
  identity.set('PROFILE / HIKAQ                                      RETAINED',0,8.35);
  counter.set(`CURRENT INPUT   24 / 24                   OLDEST / ${String(m.firstVisibleRow).padStart(3,'0')}`,0,-8.23);
  core.position.set(-10.15,-7.12,.15);
  core.scale.setScalar(1+.32*pulse(t,EXECUTION,.13));
  profile.set('PROFILE / RETAINED',-5.5,4.35);
  missing.set('EARLIER TURNS / NOT LOADED',6.7,4.35);
  emptyResult.uniforms.progress.value=ramp(t,77.48,77.7);
  question.mesh.visible=false;answer.mesh.visible=false;
  source.set('I KNOW YOUR NAME.   I CANNOT FIND OUR PAST.',0,-3.5);
  name.uniforms.progress.value=ramp(t,77.01,77.5);
  return {...m,standaloneChatWindow:false,decorativeConnectionCount:0,evictionMechanism:'continuous upward motion; rows clip at the fixed top edge',recordCount:64,retainedIdentity:'HIKAQ'};
 }
 return {clouds:all,frame};
}
