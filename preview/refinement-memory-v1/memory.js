import * as THREE from 'three';
import {HANDOFF,START,END,CUES,centerAt,ramp,mix,clamp} from './score.js';
import {stateAt,EVENTS,agentProgressAt} from './state.js';
import {SOURCES,TOP_K,MATRIX,VECTORS,VOCAB,NODES,EDGES,QUERY_POSITION} from './data.js';
import {WHITE,PALE,VIOLET,DIM,RED,V,label,instance,set,points,word,line,pairs,bezier,colorMix,plane} from './graphics.js';
export async function loadMemoryFont(){const f=new FontFace('Memory Notes','url("/preview/refinement-memory-v1/memory-notes.ttf")',{weight:'500 600'});document.fonts.add(await f.load());}
const blend=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u)),windowGain=(t,a,b,c,d)=>ramp(t,a,b)*(1-ramp(t,c,d));
const white=new THREE.Color(WHITE),pale=new THREE.Color(PALE),violet=new THREE.Color(VIOLET),dark=new THREE.Color('#241333');
function mask(text){const cv=document.createElement('canvas');cv.width=32;cv.height=20;const g=cv.getContext('2d');g.fillStyle='white';g.font='bold 21px "JetBrains Mono"';g.textAlign='center';g.textBaseline='middle';g.fillText(text,16,11);const data=g.getImageData(0,0,32,20).data;return Array.from({length:640},(_,i)=>data[i*4+3]/255);}
export function createMemorySequence({scene,camera,eye,redLight,previousRoots}){
 const root=new THREE.Group();root.name='memory-continuity';scene.add(root);root.visible=false;
 const saved=new Map(),transforms=new Map();
 function prepare(){for(const [m,v] of saved){m.opacity=v.opacity;if(v.gain!==undefined)m.uniforms.gain.value=v.gain;}saved.clear();for(const [g,v] of transforms){g.position.copy(v.position);g.scale.copy(v.scale);g.rotation.copy(v.rotation);}transforms.clear();}
 function retire(t){const k=ramp(t,HANDOFF,START+.60),text=1-ramp(t,HANDOFF,HANDOFF+.25);for(const g of previousRoots){transforms.set(g,{position:g.position.clone(),scale:g.scale.clone(),rotation:g.rotation.clone()});g.position.z-=k*9;g.rotation.z-=k*.09;g.scale.multiplyScalar(1-k*.12);g.traverse(o=>{for(const m of [o.material].flat().filter(Boolean)){if(saved.has(m))continue;saved.set(m,{opacity:m.opacity,gain:m.uniforms?.gain?.value});const a=m.map?.isCanvasTexture?text:1-k;m.opacity*=a;if(m.uniforms?.gain)m.uniforms.gain.value*=a;}});if(k>.9999)g.visible=false;}}

 // One array carries the opening through parameter edits, compaction and disk layout.
 const loom=new THREE.Group();root.add(loom);loom.scale.set(1.16,1.06,1);
 const tiles=instance(loom,640),F=mask('F'),M=mask('M');
 const loomLines=line(loom,DIM),seamLines=line(root,PALE);
 const identity=label(root,'SERAN',1.2,WHITE,'sans'),parameter=label(root,'presentation  /  F → M',.46,PALE),identityNote=label(root,'// 形态改变，身份仍在',.43,PALE);
 const summaryLabels=['identity  /  SERAN → HIKAQ','intent  /  give · protect · comfort','source  /  care.001–003 · ack.001'].map(x=>label(root,x,.54,WHITE));
 const compactLabel=label(root,'CONTEXT → SUMMARY',.94,WHITE,'sans'),compactNote=label(root,'// 压缩近期上下文，保留来源',.43,PALE);
 const sourceLabel=label(root,'SOURCE LOG  /  retained',.40,DIM),sourcePages=instance(root,16,new THREE.BoxGeometry(22,12,.07),'#76608e');sourcePages.material.depthWrite=false;sourcePages.material.wireframe=true;

 // Persistent file: typographic sculpture with physical thickness and a moving write head.
 const file=new THREE.Group();root.add(file);
 const fileBody=plane(file,24,15,'#1a1029'),fileEdge=line(file,PALE),writeLine=line(file,WHITE);
 const fileTitle=label(file,'memory.md',2.15,WHITE,'sans');
 const fileGrid=line(file,DIM),readHead=line(file,WHITE);
 const fileRows=[['self: SERAN',PALE],['creator: HIKAQ',WHITE],['intent: give / protect / comfort',PALE],['sources: care.001–003, ack.001',DIM],['on_session_start: load(memory.md)',PALE],['recall: retrieve_original_sources()',PALE]].map(([x,c])=>label(file,x,.58,c));
 const fileCN=label(file,'// 不只是写下来，每次醒来都重新读取',.44,PALE);
 const sessionA=label(root,'SESSION 001',.59,PALE),sessionB=label(root,'SESSION 002',.59,WHITE),am=label(root,'AM',1.05,WHITE,'sans'),pm=label(root,'PM',1.05,WHITE,'sans');
 const sessionBlocks=instance(root,48,new THREE.BoxGeometry(.22,.48,.22),PALE),persist=label(root,'PERSISTED',.43,PALE);

 // Actual source-to-vector fixture, 3D projection used only for presentation.
 const kb=new THREE.Group();root.add(kb);
 const featureCells=instance(kb,15*24,new THREE.BoxGeometry(.68,.61,.08),PALE);
 const embeddingTitle=label(root,'SOURCE → VECTOR',1.05,WHITE,'sans'),indexNote=label(root,'// 原始记录成为可检索的知识库',.43,PALE);
 const formula=label(root,'cos(q, d) = q · d / (‖q‖ ‖d‖)',.50,PALE);
 const clusters=[],nodeLabels=[];
 const bounds=[0,1,2].map(k=>[Math.min(...NODES.map(p=>p[k])),Math.max(...NODES.map(p=>p[k]))]);
 const project=p=>p.map((v,k)=>(2*(v-bounds[k][0])/(bounds[k][1]-bounds[k][0])-1)*[15,7.5,6.5][k]);
 const nodeSpace=NODES.map(project);
 for(let j=0;j<SOURCES.length;j++){
  const p=[];for(let i=0;i<720;i++){const a=i*2.399963,y=1-2*(i+.5)/720,r=Math.sqrt(1-y*y),k=.75+.25*((i*67%113)/113);p.push(Math.cos(a)*r*k,y*k,Math.sin(a)*r*k);}
  const cloud=points(kb,p,{size:60,color:PALE});clusters.push(cloud);nodeLabels.push(label(kb,SOURCES[j].id,.35,PALE));
 }
 const network=line(kb,VIOLET),selectedLines=line(kb,WHITE),signals=instance(kb,90,new THREE.IcosahedronGeometry(.048,0),WHITE);
 const rankText=TOP_K.map((r,i)=>label(root,`${i+1}  ${r.id}  ${r.score.toFixed(3)}`,.51,i===0?WHITE:PALE));
 const queryTitle=label(root,'FIND OUR PAST',1.10,WHITE,'sans'),queryCN=label(root,'// 还记得我吗？',.48,PALE);
 const citation=new THREE.Group();root.add(citation);
 const quoteBg=plane(citation,29,8.4,'#110b1c'),quoteEdge=line(citation,VIOLET);quoteBg.visible=false;
 const recallTitle=label(root,'RECALL',2.5,WHITE,'sans');
 const sourceRef=label(citation,'session-0001.log  /  m006',.44,PALE);
 const quote=label(citation,'这张照片上的女孩是你。',1.44,WHITE),quoteEn=label(citation,'The girl in this photo is you.',.57,PALE);
 const loaded=label(citation,'SOURCE → WORKING CONTEXT',.43,PALE);
 const incoming=line(root,WHITE),pulse=points(root,new Array(1500*3).fill(0),{size:90,color:WHITE});
 const vibration=points(root,new Array(9600*3).fill(0),{size:65,color:VIOLET});

 // A single directed cycle, permission-limited, not a network escape.
 const agent=new THREE.Group();root.add(agent);
 const agentPath=line(agent,PALE),agentActive=line(agent,WHITE),agentBlocks=instance(agent,4,new THREE.BoxGeometry(5.6,3.4,.10),'#3d2a51');agentBlocks.visible=false;
 const agentCells=instance(agent,4*96,new THREE.BoxGeometry(.38,.30,.08),PALE),agentWires=line(agent,DIM);
 const agentCodes=['observe(message)','retrieve(query, 3)','reply(source)','append(recall.001)'].map(x=>label(agent,x,.37,PALE,'mono','center'));
 const agentLabels=['OBSERVE','RETRIEVE','RESPOND','PERSIST'].map(x=>label(agent,x,.65,WHITE,'sans','center'));
 const smallLabels=['message','source / m006','reply','recall.001'].map(x=>label(agent,x,.38,PALE,'mono','center'));
 const positions=[[10.5,-2.5,1],[1.5,6,0],[-10.5,3,0],[-1.5,-6,1]];
 const cycle=new THREE.CatmullRomCurve3(positions.map(V),true,'centripetal');
 const complete=word(root,'COMPLETION',37),reply=label(root,'我记得。照片里的女孩，是我。',.78,WHITE,'mono','center');
 const agentNote=label(root,'// 记忆成为行动的起点',.44,PALE,'mono','center');
 const boundary=label(root,'LOCAL SANDBOX   /   read · reply · write',.37,DIM,'mono','center');

 function frame(t){
  const s=stateAt(t);root.visible=s.active;if(!s.active)return s;root.position.set(...centerAt(t));retire(t);
  const g=s.gain,fold=s.compress,fileIn=ramp(t,98.65,99.5),indexIn=ramp(t,102.7,103.65),graph=ramp(t,104.9,106.5),fetch=ramp(t,109.50,110.50),agentIn=ramp(t,112.25,113.05);
  const identityGain=windowGain(t,94.22,94.7,96.35,96.65),compactGain=windowGain(t,96.65,97.15,98.55,98.85),fileGain=windowGain(t,98.85,99.45,102.55,103.15),kbGain=windowGain(t,102.65,103.35,111.6,112.5),agentGain=ramp(t,112.25,113.10);
  loom.visible=g>.001&&fileIn<.999;loom.position.set(0,0,-fileIn*8);loom.rotation.set(.07*fold,-.08*fold,0);
  for(let i=0;i<640;i++){
   const col=i%32,row=Math.floor(i/32),stagger=col/31*.20,flip=ramp(t,CUES.FM-.65+stagger,CUES.FM-.20+stagger),back=ramp(t,96.3+stagger,96.6+stagger);
   const maskValue=mix(mix(F[i],M[i],flip),F[i],back),fl=clamp(fold*1.28-row/100),a=[(col-15.5)*.78,(9.5-row)*.68,0],layer=row%3;
   const b=[(col-15.5)*.70,(1-layer)*4.35+(9.5-row)*.035,-Math.floor(row/3)*.27];
   const p=blend(a,b,fl);p[2]+=(1-g)*(-8+Math.sin(col/31*Math.PI)*4);
   const scan=Math.exp(-Math.pow((col/31-((t-94.2)*.55%1))/.12,2.));
   const color=dark.clone().lerp(white,Math.min(1,.015+maskValue*.91*(1-fold)+fold*.36+scan*.045));
   set(tiles,i,p,[.66,.55*(1-.57*fold),.14],[(row%2?1:-1)*Math.PI*.75*Math.sin(fl*Math.PI),Math.PI*(flip-back),0],color);
  }tiles.instanceMatrix.needsUpdate=true;tiles.instanceColor.needsUpdate=true;tiles.material.opacity=g*(1-fileIn);
  const rails=[];for(let i=0;i<=20;i++)rails.push([-12.7,(10-i)*.68,-.25],[12.7,(10-i)*.68,-.25]);loomLines.set(rails,.20*g*(1-fold)*(1-fileIn));
  identity.show([-12.7,10.1,1],identityGain);parameter.show([-12.5,8.75,1],identityGain);identityNote.show([-12.5,-8.6,1],identityGain);
  compactLabel.show([-12.5,10.1,1],compactGain);compactNote.show([-12.5,8.7,1],compactGain);
  summaryLabels.forEach((l,i)=>l.show([-11.6,(1-i)*4.35+1.55,1.2],compactGain*ramp(t,97+i*.3,97.4+i*.3)));
  const archiveGain=windowGain(t,96.7,97.35,104.5,105.1),rawPath=[];
  for(let i=0;i<16;i++){const p=[Math.sin(i*.8)*.14,0,-9-i*.85];set(sourcePages,i,p,[1,.88,1],[0,0,-.035*i]);}sourcePages.instanceMatrix.needsUpdate=true;sourcePages.visible=archiveGain>.001;sourcePages.material.opacity=.024*archiveGain;
  sourceLabel.show([-11.7,-9.25,-2],archiveGain*(1-fileGain*.8));

  file.visible=fileGain>.001;file.position.set(-29*indexIn,-.4+4*indexIn,-1.5-indexIn*9);file.rotation.set(.06*(1-fileIn),-.10*(1-fileIn),0);file.scale.setScalar(.88+.12*fileIn);
  fileBody.material.opacity=.98*fileGain;
  const fgrid=[];for(let y=-7;y<7;y+=.4)fgrid.push([-11.5,y,-.08],[11.5,y,-.08]);fileGrid.set(fgrid,.12*fileGain);
  fileEdge.set(pairs([[-12,-7.5,.12],[-12,7.5,.12],[12,7.5,.12],[12,-7.5,.12],[-12,-7.5,.12]]),.72*fileGain);
  fileTitle.show([-10.6,5.45,.25],fileGain);fileRows.forEach((l,i)=>l.show([-10.5,2.8-i*1.25,.25],fileGain*ramp(s.write,i/6,(i+1)/6)));
  fileCN.show([-10.5,-6.1,.3],fileGain*ramp(t,100.4,100.8));
  const scanY=mix(3.4,-4.6,s.write);writeLine.set([[-11,scanY,.32],[11,scanY,.32]],fileGain*Math.sin(s.write*Math.PI)*.9);
  const reset=ramp(t,EVENTS.reset,EVENTS.reset+.50),read=s.reload;
  readHead.set([[-11,mix(6.7,-6.6,read),.35],[11,mix(6.7,-6.6,read),.35]],fileGain*Math.sin(read*Math.PI)*.9);
  sessionA.show([-14.3,-9.3,2],fileGain*(1-reset));sessionB.show([-14.3,-9.3,2],fileGain*reset);am.show([12.9,5.4,0],fileGain*(1-ramp(t,100.3,100.75)));pm.show([12.9,5.4,0],fileGain*ramp(t,100.3,100.75));
  persist.show([12.9,3.7,0],fileGain*ramp(t,100.65,100.9));
  for(let i=0;i<48;i++){const side=i<24?0:1,j=i%24,u=j/23,p=[side?13.4:-13.6,2.5-u*9,-.2];const on=side?(read>u?1:.1):(1-reset);set(sessionBlocks,i,p,[1,1,1],[0,0,0],colorMix(DIM,WHITE,on));}sessionBlocks.instanceMatrix.needsUpdate=true;sessionBlocks.instanceColor.needsUpdate=true;sessionBlocks.visible=fileGain>.001;sessionBlocks.material.opacity=fileGain;

  kb.visible=kbGain>.001;kb.position.set(25*fetch,2*fetch,-2-15*fetch);kb.rotation.set(.10*graph,-.12*graph,0);
  const cellGain=kbGain*(1-fetch*.97);featureCells.visible=cellGain>.001;featureCells.material.opacity=cellGain;
  const nodePoints=NODES.map((p,i)=>blend([(i%5-2)*5.6,(1-Math.floor(i/5))*5,0],nodeSpace[i],graph));
  for(let i=0;i<360;i++){const row=Math.floor(i/24),col=i%24,val=MATRIX[row][col],u=ramp(t,103.1+row*.065,103.65+row*.065),grid=[(col-11.5)*1.16,(7-row)*1.02,(val*6-.5)*u],node=nodePoints[row],attached=[node[0]+(col%8-3.5)*.41,node[1]+(1-Math.floor(col/8))*.42,node[2]-.7-val*.8],p=blend(grid,attached,graph);set(featureCells,i,p,[mix(1.1,.43,graph),mix(1.05,.40,graph),.2+val*mix(20,4,graph)],[0,(1-u)*Math.PI/2,0],dark.clone().lerp(white,.025+val*1.6+graph*.20));}featureCells.instanceMatrix.needsUpdate=true;featureCells.instanceColor.needsUpdate=true;
  embeddingTitle.show([-13.7,10.5,1],kbGain*(1-ramp(t,106.30,106.65)));indexNote.show([-13.7,9.0,1],kbGain*(1-ramp(t,106.30,106.65)));
  const connections=[];for(const [a,b] of EDGES)connections.push(nodePoints[a],nodePoints[b]);network.set(connections,.46*kbGain*graph*(1-fetch*.96));
  for(let i=0;i<clusters.length;i++){
   const rank=TOP_K.findIndex(r=>r.index===i),selected=rank>=0?ramp(t,107.4+rank*.22,108.1+rank*.22):0;
   clusters[i].mesh.position.set(...nodePoints[i]);clusters[i].mesh.scale.setScalar(.72+.35*selected+.04*Math.sin(t*2+i));clusters[i].uniforms.gain.value=kbGain*graph*(rank>=0?.8+.20*selected:.65)*(1-fetch*.96);clusters[i].uniforms.ink.value.copy(rank===0?white:pale);clusters[i].mesh.visible=clusters[i].uniforms.gain.value>.001;
   nodeLabels[i].show([nodePoints[i][0]+.7,nodePoints[i][1]+.65,nodePoints[i][2]],kbGain*graph*(1-fetch)*(rank>=0?1:.38),camera.quaternion);
  }
  const query=project(QUERY_POSITION),searchLines=[],litLines=[];
  TOP_K.forEach((r,j)=>{const n=nodePoints[r.index],u=ramp(t,106.9+j*.18,108.2+j*.12),path=bezier(query,[query[0]-4,query[1]+3,query[2]+1],[n[0]+2,n[1]+3,n[2]+1],n,45);searchLines.push(...pairs(path));litLines.push(...pairs(path.slice(0,Math.max(2,Math.floor(u*44)+1))));});selectedLines.set(litLines,kbGain*ramp(t,106.9,107.2)*(1-fetch));
  for(let i=0;i<90;i++){const j=i%3,r=TOP_K[j],n=nodePoints[r.index],u=((t-106.8)*.7+Math.floor(i/3)/30)%1;const p=blend(query,n,u);set(signals,i,p,kbGain*s.search*(1-fetch)*(.6+.4*Math.sin(u*Math.PI)));}signals.instanceMatrix.needsUpdate=true;
  const searchGain=windowGain(t,106.67,107.05,109.20,109.50);queryTitle.show([-13.7,10.5,2],searchGain);queryCN.show([-13.7,9,2],searchGain);formula.show([-13.7,-9.4,2],searchGain);
  rankText.forEach((l,i)=>l.show([7.5,7.8-i*1.1,5],searchGain*ramp(t,107.6+i*.2,108.2+i*.2)));

  const citeGain=windowGain(t,109.45,110.1,112.25,112.85);citation.visible=citeGain>.001;citation.position.set(0,-.4,3.5+2.0*fetch);citation.quaternion.copy(camera.quaternion);citation.scale.setScalar(.86+.14*fetch);
  quoteBg.material.opacity=0;recallTitle.show([-13.3,7.5,4],citeGain);quoteEdge.set([[-12.7,-4.2,.1],[12.7,-4.2,.1]],.46*citeGain);
  const quoteGain=citeGain*ramp(t,110.05,110.4);sourceRef.show([-12.7,2.7,.2],quoteGain);quote.show([-12.7,.6,.2],quoteGain);quoteEn.show([-12.7,-1.3,.2],quoteGain);loaded.show([-12.7,-2.9,.2],quoteGain*ramp(t,110.9,111.65));
  const inject=ramp(t,110.5,CUES.vibrations),route=bezier([-12.0,-4.6,6],[-6.5,-9.0,7],[2,-7,8],[6,-5,9],90);incoming.set(pairs(route),citeGain*.48);
  const pp=pulse.geometry.attributes.position.array;for(let i=0;i<1500;i++){const u=clamp(inject-.08+(i/1499)*.09),idx=Math.min(88,Math.floor(u*89)),p=blend(route[idx],route[idx+1],u*89-idx),a=i*2.399963;pp.set([p[0]+Math.sin(a)*.11,p[1]+Math.cos(a)*.11,p[2]+Math.sin(i*.7)*.1],i*3);}pulse.geometry.attributes.position.needsUpdate=true;pulse.uniforms.gain.value=citeGain*Math.sin(inject*Math.PI)*1.4;pulse.mesh.visible=pulse.uniforms.gain.value>.001;
  const vp=vibration.geometry.attributes.position.array;for(let i=0;i<9600;i++){const row=Math.floor(i/800),u=(i%800)/799,x=-18+u*36,y=6.4+row*.10+Math.sin(u*22-(t-109.5)*8+row*.12)*(.6+.55*Math.sin((t-109.5)*2))*(1-inject*.65),z=-5+row*.16+Math.cos(u*7+row*.15)*1.1;vp.set([x,y,z],i*3);}vibration.geometry.attributes.position.needsUpdate=true;vibration.uniforms.gain.value=citeGain*.60;vibration.mesh.visible=citeGain>.001;

  agent.visible=agentGain>.001;agent.rotation.set(-.16*agentIn,.10*agentIn,-.03*agentIn);agent.position.z=-2*agentIn;agent.scale.setScalar(1.17);
  const finish=ramp(t,114.9,115.55),cycleProgress=agentProgressAt(t),path=Array.from({length:181},(_,i)=>cycle.getPoint(i/180).toArray());agentPath.set(pairs(path),agentGain*.46*(1-finish*.8));agentActive.set(pairs(path.slice(0,Math.max(2,Math.floor(cycleProgress*180)+1))),agentGain*.9*(1-finish*.85));
  for(let i=0;i<4;i++){const active=clamp(cycleProgress*4-i),p=positions[i];set(agentBlocks,i,p,[1,1,.8],[0,0,0],colorMix('#382746',PALE,active*.5));agentLabels[i].show([p[0],p[1]+.38,p[2]+.12],agentGain*(1-finish));smallLabels[i].show([p[0],p[1]-.78,p[2]+.12],agentGain*(1-finish));}agentBlocks.instanceMatrix.needsUpdate=true;agentBlocks.instanceColor.needsUpdate=true;agentBlocks.material.opacity=0;
  const wires=[];for(let j=0;j<4;j++){const p=positions[j],active=clamp(cycleProgress*4-j);agentCodes[j].show([p[0],p[1]-1.45,p[2]+.20],agentGain*(1-finish));for(let k=0;k<96;k++){const x=k%16,y=Math.floor(k/16),lit=((x*7+y*11+j*3)%19)/19,pp=[p[0]+(x-7.5)*.40,p[1]+2.5+(2.5-y)*.35,p[2]-.45];set(agentCells,j*96+k,pp,[1,1,.3+lit*4],[0,0,0],dark.clone().lerp(pale,.15+lit*.50+active*.25));}wires.push([p[0]-3.5,p[1]+4.0,p[2]-1],[p[0]+3.5,p[1]+4.0,p[2]-1],[p[0]+3.5,p[1]+4.0,p[2]-1],[p[0]+3.5,p[1]-2,p[2]-1]);}agentCells.instanceMatrix.needsUpdate=true;agentCells.instanceColor.needsUpdate=true;agentCells.material.opacity=agentGain*(1-finish);agentCells.visible=agentGain*(1-finish)>.001;agentWires.set(wires,.35*agentGain*(1-finish));
  complete.mesh.position.set(0,2.6,6);complete.mesh.quaternion.copy(camera.quaternion);complete.mesh.scale.setScalar(.94+.06*finish);complete.mesh.visible=finish>.001;complete.uniforms.gain.value=finish;
  reply.show([0,-1.5,7],ramp(t,114.80,115.20),camera.quaternion);agentNote.show([0,-3.6,7],ramp(t,115.0,115.55),camera.quaternion);boundary.show([0,-10,-1],agentGain);

  // Continuous red-eye path. Position is geometric; camera never targets this path.
  let local=blend([0,2.4,9],[10.8,-7.4,4],ramp(t,HANDOFF,95.20));
  local=blend(local,[10.5,-3.5,5],ramp(t,96.7,98.0));local=blend(local,[10.6,4.6,5],ramp(t,98.8,100.1));local=blend(local,[-10.5,-6.3,4],ramp(t,101.2,102.6));
  local=blend(local,query.map((v,i)=>v+(i===2?0:0)),ramp(t,103.0,106.3));local=blend(local,[6,-5,9],ramp(t,109.2,110.4));
  const cp=cycle.getPoint(Math.min(.75,cycleProgress)).clone().multiplyScalar(1.17).applyEuler(agent.rotation).add(agent.position).toArray();local=blend(local,cp,ramp(t,112.25,112.95));local=blend(local,[0,-6.5,7],ramp(t,115.20,115.55));
  root.updateMatrixWorld(true);const desired=root.localToWorld(V(local)),world=eye.points.position.clone().lerp(desired,s.takeover);eye.points.position.copy(world);eye.points.quaternion.copy(camera.quaternion);
  const depth=-world.clone().applyMatrix4(camera.matrixWorldInverse).z,scale=clamp(depth/25.05,.45,2.2),beat=Math.max(s.accents.vibrations,s.accents.completion);
  eye.points.scale.setScalar(mix(eye.points.scale.x,.068*scale*(1+.12*beat),s.takeover));eye.mat.uniforms.modelScale.value=eye.points.scale.x;eye.mat.uniforms.gain.value=mix(eye.mat.uniforms.gain.value,1.15+.20*beat,s.takeover);
  eye.glow.position.copy(world);eye.glow.quaternion.copy(camera.quaternion);eye.glow.scale.setScalar(mix(eye.glow.scale.x,.16*scale,s.takeover));eye.glowMat.uniforms.gain.value=mix(eye.glowMat.uniforms.gain.value,1.55+.25*beat,s.takeover);redLight.position.copy(world);redLight.intensity=mix(redLight.intensity,38,s.takeover);
  return {...s,finite:world.toArray().every(Number.isFinite),persistentCore:true,worldPosition:world.toArray(),visual:{fold,fileIn,fileGain,graph,fetch,citeGain,agentGain,cycleProgress,finish,previousTextGain:1-ramp(t,HANDOFF,HANDOFF+.25),newTextGain:identityGain},geometry:{tiles:640,matrixCells:360,sourceNodes:SOURCES.length,fullVectorDimensions:VOCAB.length,networkEdges:EDGES.length,completionParticles:complete.count},retrievalProjectionOnly:true};
 }
 return {frame,prepare};
}
