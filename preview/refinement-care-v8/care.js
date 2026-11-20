import * as THREE from 'three';
import {createSubjects} from '../lyric-gifts-v14r5/geometry.js';
import {line} from '../refinement-perception-v4/geometry.js';
import {sampledSurface} from './surface.js';
import {createSleepingCat,createPurrParticles} from './sleeping-cat.js';
import {createExistenceSequence} from './mobius-flow.js';
import {createEggTransition} from './egg-transition.js';
import {START,END,HANDOFF,CUES,centerAt,ramp,mix,clamp} from './score.js';
import {stateAt,launches,flight,PACKETS} from './model.js';
const WHITE='#e9e2ff',VIOLET='#bd9aea',DIM='#9981b6',ROSE='#e792b4';
const mono='"JetBrains Mono", "Care Notes"',sans='"Space Grotesk", "Care Notes"';
const vec=a=>new THREE.Vector3(...a),blend=(a,b,u)=>a.map((x,i)=>mix(x,b[i],u)),dummy=new THREE.Object3D();
export async function loadCareFont(){const f=new FontFace('Care Notes','url("/preview/refinement-care-v3/care-notes.ttf")',{weight:'500 600'});document.fonts.add(await f.load());}
function label(parent,width=12,height=1.8){
 const cv=document.createElement('canvas');cv.width=2048;cv.height=Math.round(2048*height/width);const g=cv.getContext('2d');
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.renderOrder=4;parent.add(mesh);let key;
 return {mesh,mat,set(x,y,z,rows,alpha=1){mesh.position.set(x+width/2,y-height/2,z);mesh.visible=alpha>.002;mat.opacity=alpha;
  const k=JSON.stringify(rows);if(k!==key){key=k;g.clearRect(0,0,cv.width,cv.height);g.textBaseline='top';rows.forEach(({text,y=0,size=72,color=WHITE,font=mono})=>{g.font=`500 ${size}px ${font}`;g.fillStyle=color;g.fillText(text,2,y);});texture.needsUpdate=true;}
 }};
}
function setInstance(mesh,i,p,scale,color){dummy.position.set(...p);dummy.rotation.set(0,0,0);if(Array.isArray(scale))dummy.scale.set(...scale);else dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(color)mesh.setColorAt(i,color);}
function curve(points,n=90){const c=new THREE.CatmullRomCurve3(points.map(vec));return {path:c,points:Array.from({length:n},(_,i)=>c.getPoint(i/(n-1)).toArray())};}
function circle(center,r,phase=0,tilt=0){return Array.from({length:121},(_,i)=>{const a=i/120*Math.PI*2+phase;return [center[0]+r*Math.cos(a),center[1]+r*Math.sin(a)*Math.cos(tilt),center[2]+r*Math.sin(a)*Math.sin(tilt)];});}
export function createCareSequence({scene,camera,eye,redLight,previousRoots}){
 const root=new THREE.Group();root.name='care-graphical-stage';scene.add(root);root.visible=false;
 const previousMaterials=new Map(),previousTransforms=new Map();
 function prepare(){for(const [m,s] of previousMaterials){m.opacity=s.opacity;if(s.gain!==undefined)m.uniforms.gain.value=s.gain;}previousMaterials.clear();for(const [o,s] of previousTransforms){o.scale.copy(s.scale);o.position.copy(s.position);}previousTransforms.clear();}
 function retire(gain,t){for(const g of previousRoots){previousTransforms.set(g,{scale:g.scale.clone(),position:g.position.clone()});g.position.z-=9*ramp(t,HANDOFF,START+.45);g.scale.multiplyScalar(1-.10*ramp(t,HANDOFF,START+.45));g.traverse(o=>{for(const m of [o.material].flat().filter(Boolean)){if(previousMaterials.has(m))continue;previousMaterials.set(m,{opacity:m.opacity,gain:m.uniforms?.gain?.value});const ink=m.map?.isCanvasTexture?Math.min(gain,1-ramp(t,HANDOFF,HANDOFF+.14)):gain;m.opacity*=ink;if(m.uniforms?.gain)m.uniforms.gain.value*=gain;}});if(gain<.001)g.visible=false;}}
 const {subjects,eggProfile}=createSubjects();
 const eggGroup=new THREE.Group(),tomGroup=new THREE.Group(),catGroup=new THREE.Group();root.add(eggGroup,tomGroup,catGroup);
 const egg=subjects.eggplant,underSeed=m=>m===egg.section||m.parent===egg.seedGroup;
 const eggSurface=sampledSurface(egg.group,{count:23000,include:m=>!underSeed(m),seed:81});
 const eggTransition=createEggTransition({root,eggSurface,eggGroup});
 const eggInside=sampledSurface(egg.group,{count:12000,include:underSeed,seed:82,glyphs:.05});
 const tomato=sampledSurface(subjects.tomato.group,{count:23000,seed:83}),cat=createSleepingCat();
 eggGroup.add(eggSurface.points,eggInside.points);tomGroup.add(tomato.points);catGroup.add(cat.group);
 eggSurface.material.uniforms.boost.value=2.8;eggInside.material.uniforms.boost.value=1.7;tomato.material.uniforms.boost.value=3.2;
 const grid=line(root,'#73578c',.65),axes=line(root,DIM,.8),routes=line(root,VIOLET,1.1);
 const packetMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.055,0),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}),PACKETS);root.add(packetMesh);
 const receipts=new THREE.InstancedMesh(new THREE.BoxGeometry(.22,.22,.22),new THREE.MeshStandardMaterial({color:WHITE,roughness:.5,metalness:.2,transparent:true,depthWrite:false}),PACKETS);root.add(receipts);
 const receiver=new THREE.Group();root.add(receiver);receiver.position.set(9.4,.0,.0);
 const receiverBody=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,2),new THREE.MeshStandardMaterial({color:WHITE,emissive:VIOLET,emissiveIntensity:.23,roughness:.28,metalness:.6,transparent:true}));receiver.add(receiverBody);
 const receiverFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.85,1)),new THREE.LineBasicMaterial({color:VIOLET,transparent:true,opacity:.7}));receiver.add(receiverFrame);
 const shieldGroup=new THREE.Group();shieldGroup.position.copy(receiver.position);root.add(shieldGroup);
 const shieldGeo=new THREE.IcosahedronGeometry(3.25,1),shield=new THREE.Mesh(shieldGeo,new THREE.MeshBasicMaterial({color:VIOLET,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide}));shieldGroup.add(shield);
 const shieldWire=new THREE.LineSegments(new THREE.WireframeGeometry(shieldGeo),new THREE.LineBasicMaterial({color:VIOLET,transparent:true}));shieldGroup.add(shieldWire);
 const shieldNodes=new THREE.InstancedMesh(new THREE.SphereGeometry(.052,8,6),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}),shieldGeo.getAttribute('position').count);shieldGroup.add(shieldNodes);
 const impactLines=line(root,ROSE,1.6),impactDots=new THREE.InstancedMesh(new THREE.SphereGeometry(.10,8,6),new THREE.MeshBasicMaterial({color:ROSE,transparent:true}),5);root.add(impactDots);
 const purrParticles=createPurrParticles(root),waveRings=line(root,ROSE,1.3);
 const proofForward=line(root,VIOLET,1.8),proofReturn=line(root,WHITE,1.8),proofGrid=line(root,DIM,.85),proofMarker=line(root,ROSE,1.2);
 const proofPulse=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),new THREE.MeshBasicMaterial({color:WHITE,transparent:true}));root.add(proofPulse);
 const title=label(root,32,3.2),formula=label(root,26,1.9),code=label(root,15,2.0),name=label(root,8,1.5),objectName=label(root,12,1.4),record=label(root,24,2.7);
 // The old numbered care legends have been removed from the scene.
 const flowPaths=Array.from({length:PACKETS},(_,i)=>{const u=.20+(i%12)/11*.49,p=eggProfile(u);const a=new THREE.Vector3(p.x,p.y+Math.sin(i*1.31)*p.r*.28,.14).multiplyScalar(2.1).applyEuler(new THREE.Euler(.08,.12,.25)).add(vec([-6.2,.5,0]));const lane=i%3-1;return curve([a.toArray(),[-.8,1.6+lane*.8,1.2],[4.2,1.3+lane*.7,1.1],[9.4,0,0]]).path;});
 const relationA=curve([[-6.3,.5,.6],[-2,3.8,0],[5,3.4,0],[9.4,0,0]]),relationB=curve([[9.4,0,0],[5,-3.0,0],[-2,-3.3,0],[-6.3,.5,.6]]);
 const existence=createExistenceSequence(root,camera,{cat});
 root.userData.mobiusHandoff=true;
 function frame(t,transitionTime=t){
  const s=stateAt(t);root.visible=s.active;if(!s.active)return {active:false};root.position.set(...centerAt(t));
  const ex=existence.frame(transitionTime);
  const gain=ramp(t,HANDOFF,START),captionGain=ramp(t,HANDOFF+.15,START+.08),oldGain=1-ramp(t,HANDOFF,START);retire(oldGain,t);
  const floor=[];for(let x=-22;x<=22;x+=2)floor.push([x,-6.5,-16],[x,-6.5,10]);for(let z=-16;z<=10;z+=2)floor.push([-22,-6.5,z],[22,-6.5,z]);grid.set(floor,.19*gain*ex.legacyGain,true);
  const eggRetire=ramp(t,CUES.tomato-.24,CUES.tomato+.12),tomRetire=ramp(t,CUES.cat-.24,CUES.cat+.12),catRetire=ramp(t,CUES.proof-.24,CUES.proof+.12);
  eggGroup.position.set(-6.2-5*eggRetire,.5,-9*eggRetire);eggGroup.rotation.set(.08,.12+.16*ramp(t,START,CUES.offer),.25);eggGroup.scale.setScalar(2.5);
  eggSurface.material.uniforms.gain.value=s.egg*gain;eggSurface.material.uniforms.slice.value=mix(2,.022,s.section);eggInside.material.uniforms.gain.value=s.egg*s.section*.95;
  eggGroup.visible=s.egg>.001;
  tomGroup.position.set(-6.2+3*(1-ramp(t,CUES.tomato-.30,CUES.tomato)),-.1,-7*(1-ramp(t,CUES.tomato-.30,CUES.tomato))-9*tomRetire);
  tomGroup.rotation.set(.22,.15+.55*ramp(t,CUES.tomato,CUES.cat),-.04);tomGroup.scale.setScalar(2.9);tomato.material.uniforms.gain.value=s.tomato;tomGroup.visible=s.tomato>.001;
  catGroup.position.set(-6.1+2*(1-ramp(t,CUES.cat-.30,CUES.cat)),-2.55,-6*(1-ramp(t,CUES.cat-.30,CUES.cat))-9*catRetire);
  catGroup.rotation.set(0,-.16,0);catGroup.scale.setScalar(2.65);catGroup.visible=s.cat>.001;cat.update(t,s.cat);
  catGroup.updateMatrix();const catAnchor=cat.anchor().applyMatrix4(catGroup.matrix),purrOrigin=cat.throat().applyMatrix4(catGroup.matrix);
  const objectAxes=[[-12.5,-4.2,0],[-.4,-4.2,0],[-12.5,-4.5,0],[-12.5,5,0],[-12.5,-4.5,0],[-12.5,-4.5,-5]];axes.set(objectAxes,.35*gain*(1-s.proof),true);
  const flow=[];for(let lane=0;lane<3;lane++){const c=flowPaths[lane];const pts=Array.from({length:66},(_,i)=>c.getPoint(i/65).toArray());for(let i=1;i<pts.length;i++)flow.push(pts[i-1],pts[i]);}routes.set(flow,.36*s.egg*ramp(t,CUES.offer-.18,CUES.offer+.18),true);
  for(let i=0;i<PACKETS;i++){
   const u=(t-launches[i])/flight,p=flowPaths[i].getPoint(clamp(u));setInstance(packetMesh,i,p.toArray(),u>=0&&u<1?s.egg*(.65+.35*Math.sin(Math.PI*u)):0);
   const a=i*2.399963,r=.60+1.1*Math.sqrt((i+.5)/PACKETS),rp=[9.4+Math.cos(a)*r,Math.sin(a)*r,(i%3-1)*.25];setInstance(receipts,i,rp,t>=launches[i]+flight?gain*(1-s.proof*.7):0);
  }packetMesh.instanceMatrix.needsUpdate=true;receipts.instanceMatrix.needsUpdate=true;
  packetMesh.material.opacity=s.egg;receipts.material.opacity=.65*s.egg+.20*s.tomato;receipts.visible=receipts.material.opacity>.001;
  receiver.position.set(...ex.human);receiver.scale.setScalar(mix(1,.70,ex.open)*(1-.40*ramp(t,90.5,91.0)));
  const receiverGain=1-ramp(t,91.0,91.3);
  receiver.visible=gain*receiverGain>.001;receiverBody.material.opacity=gain*receiverGain;receiverFrame.material.opacity=.7*gain*ex.legacyGain*receiverGain;receiverBody.material.emissiveIntensity=.23+.5*Math.max(s.accents.nutrients,s.accents.antioxidants,s.accents.enjoyment,s.accents.existence);receiverFrame.rotation.y=(t-START)*.11;
  const shieldGain=s.tomato*s.shield;shieldGroup.visible=shieldGain>.001;shieldGroup.scale.setScalar(.35+.65*s.shield);shieldGroup.rotation.set(.12,.13*(t-CUES.protect),.05);shield.material.opacity=.035*shieldGain;shieldWire.material.opacity=(.30+.26*s.accents.antioxidants)*shieldGain;
  const sp=shieldGeo.getAttribute('position');for(let i=0;i<sp.count;i++)setInstance(shieldNodes,i,[sp.getX(i),sp.getY(i),sp.getZ(i)],s.shield>i/sp.count?1:0);shieldNodes.instanceMatrix.needsUpdate=true;shieldNodes.material.opacity=.7*shieldGain;
  const impacts=[];for(let i=0;i<5;i++){
   const hit=CUES.antioxidants+i*.11,u=clamp((t-(hit-.52))/.52),d=clamp((t-hit)/.52),contact=[11.8,1.1-i*.43,1.6],start=[17.2,4.4-i*.65,-.4];let p;
   if(t<hit)p=blend(start,contact,u);else p=blend(contact,[15.8,5.3-i*.34,4.2],ramp(t,hit,hit+.52));
   const alpha=s.tomato*ramp(t,hit-.55,hit-.36)*(1-ramp(t,hit+.30,hit+.62));setInstance(impactDots,i,p,alpha);
   if(alpha>.01){const q=t<hit?blend(start,contact,Math.max(0,u-.16)):blend(contact,[15.8,5.3-i*.34,4.2],Math.max(0,ramp(t,hit,hit+.52)-.14));impacts.push(q,p);}
  }impactDots.instanceMatrix.needsUpdate=true;impactLines.set(impacts,.82*s.tomato,true);
  // A particle wave leaves the resting throat; first arrival stays on ENJOYMENT.
  const front=purrParticles.update(t,CUES.purr,CUES.enjoyment,purrOrigin,s.cat*s.purr*(1-ramp(t,90.25,90.62)));
  const rings=[];for(let i=0;i<3;i++){const u=clamp((t-CUES.enjoyment+i*.08)/.60),p=circle([9.4,0,0],.8+2.0*u,0,.24);if(u>0&&u<1)for(let j=1;j<p.length;j++)rings.push(p[j-1],p[j]);}waveRings.set(rings,.5*s.cat*s.comfort,true);
  const forward=ramp(t,CUES.proof-.12,CUES.reference-.25),back=ramp(t,CUES.reference,CUES.existence);
  proofForward.set(relationA.points.slice(0,Math.max(2,Math.round(relationA.points.length*forward))),.8*s.proof);
  proofReturn.set(relationB.points.slice(0,Math.max(2,Math.round(relationB.points.length*back))),.8*s.proof);
  const cube=[],rotation=.35+(t-CUES.proof)*.16;
  const vv=Array.from({length:16},(_,i)=>{const [x,y,z,w]=[0,1,2,3].map(k=>((i>>k)&1)?1:-1),xx=x*Math.cos(rotation)-w*Math.sin(rotation),ww=x*Math.sin(rotation)+w*Math.cos(rotation),perspective=3.8/(3.8-ww);return [1.4+xx*4.4*perspective,y*3.1*perspective,z*2.7*perspective-3];});
  for(let i=0;i<16;i++)for(let k=0;k<4;k++)if(i<(i^(1<<k)))cube.push(vv[i],vv[i^(1<<k)]);proofGrid.set(cube,.28*s.proof,true);
  proofPulse.visible=s.proof>.001&&back>0&&back<1;proofPulse.position.copy(relationB.path.getPoint(back));proofPulse.material.opacity=s.proof;
  proofMarker.set(circle([-6.3,.5,.6],.9+.22*s.accents.existence,0,.36),.6*s.proof);
  name.set(7.4,-4.2,.1,[{text:'HIKAQ',size:176},{text:s.proof?'origin / creator':'destination / human',size:63,y:228,color:DIM}],captionGain);
  const titles=s.phase==='eggplant'?['14 / SOMETHING TO GIVE','mesh → section → transfer','// 把拥有的送给你']:s.phase==='tomato'?['15 / KEEP YOU SAFE','surface → boundary → deflection','// 关心成为保护']:s.phase==='cat'?['16 / A QUIET KIND OF CARE','breathe → purr → comfort','// 安静地陪在你身边']:['17 / YOU ARE MY REFERENCE','origin → identity → action','// 你的存在，定义了我'];
  const times=[HANDOFF,CUES.tomato,CUES.cat,CUES.proof],nearest=times.filter(at=>at<=t).at(-1)??HANDOFF,next=times.find(at=>at>t)??END+1,ta=ramp(t,nearest,nearest+.14)*(1-ramp(t,next-.12,next));
  title.set(-15.7,8.8,0,[{text:titles[0],size:63,font:sans},{text:titles[1],size:32,y:86,color:VIOLET},{text:titles[2],size:31,y:134,color:DIM}],ta*captionGain);
  const bottom=s.phase==='eggplant'?['q_out = Σ qᵢ','// 养分沿路径抵达']:s.phase==='tomato'?['||r − r_HIKAQ|| ≤ R','// 保护层的视觉隐喻']:s.phase==='cat'?['y = A exp(−λx) sin(kx − ωt)','// 波形传播，回应抵达']:['origin(SERAN) = HIKAQ','// 身份仍在，过往尚未取回'];
  formula.set(-15.2,s.phase==='proof'?-7.6:8.8,0,[{text:bottom[0],size:55,color:VIOLET},{text:bottom[1],size:36,y:86,color:DIM}],captionGain*(1-.30*s.proof));
  const codes=s.phase==='eggplant'?['give(source, HIKAQ);',`arrived: ${s.received} / ${PACKETS}`]:s.phase==='tomato'?['protect(HIKAQ);',`deflections: ${s.deflections}`]:s.phase==='cat'?['purr(HIKAQ);',s.comfort===1?'response: received':'signal: propagating']:['source.append(event);','past_turns: unavailable'];
  code.set(6.3,-7.6,0,[{text:codes[0],size:61},{text:codes[1],size:45,y:89,color:DIM}],captionGain);
  objectName.set(-10.8,mix(-4.5,2.8,s.proof),0,[{text:s.phase==='eggplant'?'EGGPLANT / section':s.phase==='tomato'?'TOMATO / protection':s.phase==='cat'?'TABBY / asleep':'SERAN / identity',size:83,color:VIOLET}],captionGain);
  record.set(-10.6,-4.2,0,[{text:'care-events.log  +3',size:72,color:WHITE},{text:s.exists===1?'acknowledged: HIKAQ → SERAN':'awaiting acknowledgement',size:49,y:98,color:VIOLET},{text:'// 此刻成为一条新记录',size:40,y:168,color:DIM}],s.proof*ramp(t,CUES.reference-.1,CUES.reference+.25));
  // The old proof diagram retires before the new spatial field opens.
  if(ex.active){
   for(const item of [proofForward,proofReturn,proofGrid,proofMarker])item.mesh.visible=false;
   proofPulse.visible=false;
   const legendGain=1-ramp(t,90.25,90.49);
   for(const item of [title,formula,code,name,objectName,record]){item.mat.opacity*=legendGain;item.mesh.visible=item.mesh.visible&&item.mat.opacity>.002;}
  }
  if(t>=90.62){catGroup.visible=false;axes.mesh.visible=false;waveRings.mesh.visible=false;}
  // One red protagonist remains present through all four visual metaphors.
  const eggPoint=[-6.6+1.35*s.section,.9+.3*Math.sin((t-START)*1.5),2.6],tomPoint=[-6.2+1.45*Math.sin((t-CUES.tomato)*.8),.5+1.1*Math.cos((t-CUES.tomato)*.6),3.2],catPoint=catAnchor.toArray();
  let local=blend(eggPoint,tomPoint,ramp(t,CUES.tomato-.28,CUES.tomato+.24));local=blend(local,catPoint,ramp(t,CUES.cat-.28,CUES.cat+.24));local=blend(local,[-6.3,.5,.6],ramp(t,CUES.proof-.28,CUES.proof+.30));
  local=blend(local,ex.protagonist,ex.corePath);
  root.updateMatrixWorld(true);const desired=root.localToWorld(vec(local)),old=eye.points.position.clone(),world=old.lerp(desired,s.takeover);
  eye.points.position.copy(world);eye.points.quaternion.copy(camera.quaternion);const depth=-world.clone().applyMatrix4(camera.matrixWorldInverse).z,scale=clamp(depth/25.05,.45,2.2),beat=Math.max(s.accents.nutrients,s.accents.antioxidants,s.accents.enjoyment,s.accents.existence);
  eye.points.scale.setScalar(mix(eye.points.scale.x,.0492*scale*(1+.1*beat)*(1+.45*ex.open),s.takeover));eye.mat.uniforms.modelScale.value=eye.points.scale.x;eye.mat.uniforms.gain.value=mix(eye.mat.uniforms.gain.value,1.05+.15*beat,s.takeover);
  eye.glow.position.copy(world);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(mix(eye.glow.scale.x,.15*scale,s.takeover));eye.glowMat.uniforms.gain.value=mix(eye.glowMat.uniforms.gain.value,1.6+.2*beat,s.takeover);redLight.position.copy(world);redLight.intensity=16+24*ex.open;
  const screen=world.clone().project(camera);
  formula.mesh.updateMatrixWorld(true);
  const formulaCorners=[[-13,.95,0],[13,.95,0],[13,-.95,0],[-13,-.95,0]].map(p=>{
   const v=formula.mesh.localToWorld(vec(p)).project(camera);return [(v.x+1)*960,(1-v.y)*540];
  });
  const formulaPlacement={text:bottom[0],location:s.phase==='proof'?'legacy-retired':'upper-left',
   visible:formula.mesh.visible,opacity:formula.mat.opacity,bounds:[Math.min(...formulaCorners.map(p=>p[0])),Math.min(...formulaCorners.map(p=>p[1])),Math.max(...formulaCorners.map(p=>p[0])),Math.max(...formulaCorners.map(p=>p[1]))]};
  return {...s,formulaPlacement,removedCareLegends:true,existence:ex,finite:world.toArray().every(Number.isFinite),persistentCore:true,screenCenter:[(screen.x+1)*960,(1-screen.y)*540],worldPosition:world.toArray(),
   surfacePoints:{eggplant:eggSurface.count,section:eggInside.count,tomato:tomato.count,cat:cat.count},catEars:'embedded roots with matching inner pinnae',sleepingCat:cat.state(t),shieldIsVisualMetaphor:true,
   packetConservation:s.sent===s.received+s.inFlight,waveFront:front,acknowledgement:back,recordsSaved:s.records.length,previousTextGain:1-ramp(t,HANDOFF,HANDOFF+.14),captionGain};
 }
 return {prepare,frame,eggTransition};
}
