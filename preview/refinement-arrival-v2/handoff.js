import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {GlyphField,codeBlock} from '../../references/world-execute-web/src/lib/glyphs.js?v=DWbHICXG';
import {heartCurveShape,fourierChain} from '../../references/world-execute-web/src/ch/love/curves.js?v=Ny6Hciv0';
import {backdrop} from '../../references/world-execute-web/src/ch/love/backdrop.js?v=D4RftAfW';
import {qRot} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
import {Ink,Laminate,DrawingPlate,ribbonShape,sheetShape} from '../refinement-possession-v13/quality-materials.js';
import {GEO,Shards} from '../refinement-possession-v13/heart-shards.js';
import {FRACTURE,fractureAt} from '../refinement-possession-v13/fracture-motion.js';
import {FIRST,E,shotAt,transitionAt,sideClose,EXIT_FRAMES,plotProgress,repeatProgress,releasedCells,ramp,smooth,mix,SOURCES} from '../refinement-possession-v13/score.js';
import {sceneForShot} from '../refinement-possession-v13/scene-map.js';
import {correct,firstPass,plots} from '../refinement-possession-v13/plot.js';
const RED=[1,.025,.075],HOT=[1.8,.58,.7],COLD=[.70,.81,.94],TAU=Math.PI*2;
const mul=(c,k)=>c.map(v=>v*k),add=(a,b)=>a.map((v,i)=>v+b[i]);
const norm=a=>a.map(([x,y])=>[x,-y,0]);
const curves={correct:norm(correct),trial:norm(firstPass),...Object.fromEntries(Object.entries(plots).map(([k,p])=>[k,norm(p)]))};
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const lerp3=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
export function createHandoff(){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(50000);scene.add(lines.mesh);
 const objects=[];
 function cloud(key,N,gen,Material=Swarm){const s=new Material({count:N}),a=s.shape('seran-v5-'+key,gen);scene.add(s.points);objects.push(s.points);return {s,a};}
 const wires=Array.from({length:78},(_,k)=>Array.from({length:90},(_,j)=>{
  const u=j/89,layer=Math.floor(k/13),v=(k%13-6)/6;
  return [(u-.5)*26,Math.sin(u*TAU+.7*layer)*(.8+1.8*Math.abs(v))+v*3.6,layer*-1.2+1.6*Math.sin(u*Math.PI)+.2*v];
 }));
 const primaryWires=[8,20,35,47,62,73];
 const wireDust=cloud('v10-circuit-fibres',147456,N=>{const r=rng(621),a=new Float32Array(N*4);for(let i=0;i<N;i++){const k=primaryWires[i%primaryWires.length],u=r(),j=Math.min(88,Math.floor(u*89)),v=u*89-j,p=lerp3(wires[k][j],wires[k][j+1],v),fibre=i%11;const width=fibre<3?.018:.17;a.set([p[0]+(r()-.5)*.11,p[1]+(r()-.5)*width,p[2]+(r()-.5)*width,u],i*4);}return a;},Ink);
 const circuitNear=cloud('v10-circuit-near',16384,N=>{const r=rng(541),a=new Float32Array(N*4);for(let i=0;i<N;i++){const u=r(),x=(u-.5)*36;a.set([x,-6+1.7*Math.sin(u*6)+(r()-.5)*.20,8+(r()-.5)*.3,u],i*4);}return a;});
 const shards=new Shards();scene.add(shards.points);objects.push(shards.points);shards.points.scale.setScalar(6.2);
 const plateTexts=SOURCES.map((source,i)=>{
  const g=new GlyphField({count:4096}),text=`${source.id} / ${source.file}\n${source.en}`.replace(/[^\x20-\x7e\n]/g,' ');
  const wrapped=text.split('\n').flatMap(l=>l.match(/.{1,70}/g)??['']).join('\n');
  g.text('seran-v10-source-'+i,Array.from({length:18},()=>wrapped).join('\n\n'));
  const gen=codeBlock(g,{origin:[-4.3,2.1,0],cell:.12,cols:72,rows:35});
  const bend=(x,y)=>-.095+.32*Math.sin(x/9.2*Math.PI)*Math.cos(y/4.7*Math.PI);
  const a=g.layout('seran-v10-source-layout-'+i,N=>{const a=gen(N);for(let k=0;k<N;k++)if(a[k*4+2]>-100)a[k*4+2]=bend(a[k*4],a[k*4+1])+.02;return a;});
  g.points.position.set(.55*Math.sin(i*.9),(i-6)*.72,(i-6)*.36);g.points.rotation.x=-.95;scene.add(g.points);objects.push(g.points);
  const face=cloud('v10-archive-surface-'+i,16384,N=>sheetShape(N,{seed:590+i,width:9.2,height:4.7,bend:.32,grid:.075}),Laminate);
  face.s.points.position.copy(g.points.position);face.s.points.rotation.copy(g.points.rotation);
  return {g,a,i,face,bend};
 });
 const memory=cloud('volatile-array',65536,N=>{const r=rng(41),a=new Float32Array(N*4);for(let i=0;i<N;i++){const k=i%192;const x=(k%16-7.5)*.36,y=1.1+(r()-.5)*.13,z=(Math.floor(k/16)-5.5)*.36;a.set([x,y,z,1-(k+.5)/192],i*4);}return a;});
 memory.s.points.position.set(7.2,-.8,1.6);
 const drawingPlates=Array.from({length:5},(_,i)=>new DrawingPlate(scene,'cinema-'+i,curves,{central:i===0}));
 drawingPlates.forEach(p=>objects.push(...p.objects));
 const formula=new GlyphField({count:4096});formula.text('v10-formula','x = 16 sin^3(t)\ny = 13 cos(t) - 5 cos(2t)\n    - 2 cos(3t) - cos(4t)\n\npoint = sample(t)\nconnect(previous, point)\n\ntarget = HIKAQ');
 const formulaTex=formula.layout('v10-formula-sheet',codeBlock(formula,{origin:[-11.8,3.2,0],cell:.50,cols:38,rows:18}));scene.add(formula.points);objects.push(formula.points);
 const calculationSheet=cloud('v10-calculation-sheet',65536,N=>sheetShape(N,{seed:863,width:12,height:8,bend:.25,grid:.07}),Laminate);calculationSheet.s.points.position.set(-6.5,0,-.3);
 const air=cloud('air',16384,N=>{const r=rng(813),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([(r()-.5)*70,(r()-.5)*35,-15-r()*45,r()],i*4);return a;});
 const specs={
  R01:[[13,9,24],[0,0,-2]],R02:[[0,.8,19],[0,0,-3]],R03:[[-3.5,2,11],[0,0,-1]],R04:[[4,1,15],[0,0,-2]],R05:[[12,9,24],[0,0,-2]],
  R06:[[0,0,23],[0,0,0]],R07:[[-.8,.2,13.5],[-.8,.2,0]],R08:[[0,0,23],[0,0,0]],R09:[[0,0,25],[0,0,0]],R10:[[-8,1.8,22],[0,-1.2,0]],
  R11:[[14,10,23],[1,0,0]],R12:[[8,4,16],[1,0,0]],R13:[[-6,8,20],[0,0,0]],R14:[[1,14,18],[1,0,0]],R15:[[11,3,17],[3,0,0]],R16:[[13,10,22],[2,0,0]],R17:[[4,6,16],[1,0,0]],R18:[[-4,8,19],[0,0,0]],
  H02:[[0,0,22],[0,0,0]],H03:[[0,0,23],[0,0,0]],H04:[[1.2,1.2,23],[0,0,0]],H05:[[4.8,5,24],[0,0,0]],H06:[[0,.3,22],[0,.1,0]],H08:[[.2,.6,25],[0,0,0]],
  H09:[[11,15,24],[0,0,-1]],H10:[[-9,8.5,18],[-3,.4,1]],H11:[[-1.2,4,12.5],[0,1.7,0]],H12:[[0,6.5,23],[0,.4,1]],T01:[[-2,5,16],[0,0,0]]
 };
 function pose(shot,f){
  if(shot.id==='R06'){
   // A short descending arc from above-left: less yaw, a slight approach, and
   // zero velocity/acceleration at both ends instead of a fast sideways turn.
   const u=ramp(f,FRACTURE.assembled,FRACTURE.front),settle=u*u*u*(u*(u*6-15)+10),remaining=1-settle;
   const azimuth=-.24*remaining,elevation=.32*remaining,radius=23+1.4*remaining;
   return {position:new Vector3(radius*Math.cos(elevation)*Math.sin(azimuth),radius*Math.sin(elevation),radius*Math.cos(elevation)*Math.cos(azimuth)),target:new Vector3(0,0,0)};
  }
  if(shot.id==='H11'){const u=repeatProgress(f)%1,point=curves.correct[Math.min(720,Math.floor(u*720))],co=Math.cos(-.75),si=Math.sin(-.75),target=new Vector3(point[0]*5.6*.45,1.7+(point[1]*co*5.6-1.3)*.45,point[1]*si*5.6*.3);return {position:new Vector3(target.x-1.2,target.y+2.3,12.5),target};}
  if(shot.id==='T01'&&f>=11858){
   const u=smooth(f,11858,11961),lift=smooth(f,11892.42,11920.11);
   return {position:new Vector3(-1.85+.42*u+2.0*lift,5+.6*u+1.1*lift,16+.5*u+3.2*lift),target:new Vector3(1.9*lift,.8*lift,-.3*lift)};
  }
  const [p,a]=specs[shot.id]??specs.H06,q=ramp(f,shot.filmFrame,shot.endFrame);
  const frontal=['R07','R08','R09'].includes(shot.id);
  return {position:new Vector3(p[0]+(frontal?0:.3*(q-.5)),p[1],p[2]),target:new Vector3(...a)};
 }
 function project(v){const p=new Vector3(...v).project(camera);return [(p.x+1)*960,(1-p.y)*540,p.z];}
 function caption(ctx,text,p,size=18,color='#b9b6c6',alpha=1){const [x,y,z]=project(p);if(z<1&&x>20&&x<1900&&y>20&&y<1060)ctx.text.overlay.text(text,x,y,{size,color,alpha,align:'center',weight:400});}
 let programStates=[],programBounds=[],last={},fracture=null;
 function curve(ctx,index,key,pos,scale,q,{rotation=0,opacity=1,label='',pen=true,loop=false,stroke=1}={}){
  const P=curves[key],central=index===0,f=ctx.t*60;
  const co=Math.cos(rotation),si=Math.sin(rotation);
  const transform=v=>[pos[0]+v[0]*scale,pos[1]+(v[1]*co-v[2]*si)*scale,pos[2]+(v[1]*si+v[2]*co)*scale];
  const points=P.map(transform),c=central?RED:COLD,u=loop?repeatProgress(Math.min(f,11880))%1:q,k=Math.min(720,Math.floor(u*720)),tip=points[k];
  const settledAt=central?(key==='trial'?E.trialEnd:E.closed):E.halt;
  const writing=loop?1:q<.999?1:Math.max(0,Math.min(1,1-(f-settledAt)/35))*.4;
  const seal=central&&f>=E.closed&&f<E.closed+45?smooth(f,E.closed,E.closed+45):0;
  drawingPlates[index].draw(ctx,camera,{pos,scale,rotation,key,q,opacity,cursor:u,writing,seal,residue:central&&key==='correct'&&f<E.closed?.4*(1-q):0,sheetOpacity:loop?.50:1});
  lines.polyline(points,{draw:q,color:mul(c,.055*opacity*stroke),width:.65});
  if(pen){lines.segment(tip,tip,{color:mul(central?HOT:COLD,opacity*(writing>.01?1.2:.3)),width:central?9:5});}
  for(let j=0;j<=Math.floor(q*720);j+=central?48:60)lines.segment(points[j],points[j],{color:mul(c,.22*opacity),width:1.7});
  if(label)caption(ctx,label,transform([0,1.1,0]),20,central?'#ff6688':'#c4c9d4',opacity);
  const projected=points.map(project);programBounds[index]={id:central?'seran':['open','cross','unstable','diverge'][index-1],minX:Math.min(...projected.map(p=>p[0])),maxX:Math.max(...projected.map(p=>p[0])),minY:Math.min(...projected.map(p=>p[1])),maxY:Math.max(...projected.map(p=>p[1])),visible:opacity>.001};
  programStates.push({id:programBounds[index].id,visible:opacity>.001,opacity,progress:q});return {points,tip,transform};
 }
 function drawCircuit(ctx,f){
  const freeze=smooth(f,E.freeze,E.freeze+55),clock=Math.min(f,E.freeze),entry=smooth(f,FIRST+3,FIRST+38),cursor=((clock-FIRST)*.008)%1;
  wireDust.s.points.visible=true;
  wireDust.s.set({a:wireDust.a,size:.026,minPx:1,bright:.58*entry*(1-.8*freeze),colA:RED,t:clock/60,noise:.003*(1-freeze),focus:camera.position.distanceTo(new Vector3(0,0,-2)),aperture:.012,maxBlur:18,cursor,writing:(1-freeze)*.9},camera,ctx.H);
  circuitNear.s.points.visible=true;circuitNear.s.set({a:circuitNear.a,size:.04,bright:.11*entry*(1-.7*freeze),colA:[.8,.04,.08],focus:21,aperture:.028,maxBlur:30},camera,ctx.H);
  wires.forEach((path,k)=>{
   const layer=Math.floor(k/13),main=primaryWires.includes(k),off=smooth(f,E.freeze+layer*7,E.freeze+layer*7+20);
   lines.polyline(path,{color:mul(RED,entry*(main?.105:.018)*(1-.82*off)),width:main?1.1:.65});
   if(main){
    const j=Math.min(89,Math.floor(cursor*89)),pos=path[j];
    lines.polyline(path.slice(Math.max(0,j-4),j+1),{color:mul(HOT,entry*(1-off)*.5),width:1.6});
    lines.segment(pos,pos,{color:mul(HOT,entry*(1-off)*1.2),width:9});
    for(let n=12;n<90;n+=24)lines.segment(path[n],path[n],{color:mul(RED,.45*entry*(1-off)),width:3});
   }
  });
  caption(ctx,f<E.freeze?'runtime.local()':'write halted',[0,-5,-1],23,'#b99ca7');
  lines.segment([10,-3,0],[10,-3,0],{color:mul(HOT,.9*entry),width:11});
 }
 function drawFracture(ctx,f){
  const motion=fractureAt(f),cellState=i=>motion.cells[i];
  shards.points.rotation.set(0,0,0);shards.points.updateMatrixWorld();
  shards.cells(cellState).set({t:ctx.t,size:.014,bright:.62,focus:camera.position.length(),aperture:.004,maxBlur:12,colA:[.52,.025,.05],colB:RED,ember:[1,.2,.22],ash:[.09,.025,.04]},camera,ctx.H);
  GEO.cells.forEach((poly,i)=>{const st=cellState(i),seed=GEO.seeds[i];const points=poly.map(([x,y])=>{
   const v=qRot(st.q,[x-seed[0],y-seed[1],0]),p=new Vector3(v[0]+seed[0]+st.t[0],v[1]+seed[1]+st.t[1],v[2]+st.t[2]);return shards.points.localToWorld(p).toArray();
  });lines.polyline([...points,points[0]],{color:mul(RED,st.seam),width:f<10354?.7:1.3});});
  const eyeDirection=camera.getWorldDirection(new Vector3()).negate();
  fracture={...motion,frontReadyFrame:FRACTURE.front,cameraFacingAngleDegrees:Math.acos(Math.max(-1,Math.min(1,eyeDirection.z)))*180/Math.PI,projectedCenters:GEO.cent.map(([x,y],i)=>{
   const st=cellState(i),seed=GEO.seeds[i],v=qRot(st.q,[x-seed[0],y-seed[1],0]);
   return project(shards.points.localToWorld(new Vector3(v[0]+seed[0]+st.t[0],v[1]+seed[1]+st.t[1],v[2]+st.t[2])).toArray());
  })};
  lines.segment([9,-3,1],[9,-3,1],{color:HOT,width:10});
  if(f<E.failed)caption(ctx,'runtime.local()',[0,-7,0],20,'#bf9aa7');
 }
 function drawArchive(ctx,f){
  plateTexts.forEach(({g,a,i,face,bend})=>{
   const emphasis=.27+.73*Math.exp(-Math.pow((i-8)/3,2)),focus=camera.position.distanceTo(new Vector3(...plateTexts[8].g.points.position.toArray()));
   g.points.visible=true;g.points.updateMatrixWorld();
   face.s.points.visible=true;face.s.set({a:face.a,size:.031,minPx:.9,bright:.24*emphasis,colA:i%3===0?[.9,.06,.11]:[.52,.09,.15],t:ctx.t,extent:[4.6,2.35,0],scan:1.2-((f-E.memory)/140+i*.13)%2.4,focus,aperture:.012,maxBlur:20},camera,ctx.H);
   g.set({a,size:.10,bright:.32*emphasis,palette:i===8?[1,.35,.44]:[.65,.18,.25],t:ctx.t,focus,aperture:.008,maxBlur:15,noise:0},camera,ctx.H);
   const edge=Array.from({length:51},(_,j)=>{const x=-4.6+j/50*9.2,y=2.35;return g.points.localToWorld(new Vector3(x,y,bend(x,y))).toArray();});
   lines.polyline(edge,{color:mul(RED,.25*emphasis),width:1.1});
   lines.segment(edge[0],edge[0],{color:mul(HOT,.6*emphasis),width:4.5});
  });
  const released=releasedCells(f);memory.s.points.visible=released<192;
  memory.s.set({a:memory.a,reveal:1-released/192,revealBy:'w',size:.024,bright:.23,colA:RED,t:ctx.t,noise:.003,focus:camera.position.distanceTo(memory.s.points.position),aperture:.005,maxBlur:16},camera,ctx.H);
  const row=Math.floor(released/16),z=1.6+(row-5.5)*.36;
  if(released<192)lines.segment([4.3,.4,z],[10.1,.4,z],{color:HOT,width:3});
  caption(ctx,'13 SOURCES / RETAINED',[-.5,5.7,0],23,'#d0b4bf');
  caption(ctx,'5 messages / pending',[-.5,-5.8,0],18,'#a999ac');
 }
 function drawHearts(ctx,f,sceneId,shot){
  const q=plotProgress(f,true),side=plotProgress(f,false);
  if(sceneId==='draft'){
   curve(ctx,0,'trial',[0,.3,0],5.8,1,{label:'SERAN / first attempt'});
   caption(ctx,'connection unresolved',[0,-6.5,0],20,'#cb96a7');
  }else if(sceneId==='error-bench'){
   backdrop(ctx,[0,0,1920,1080],{top:[.0025,.0003,.0007],bottom:[.0003,.0001,.0002],radius:0});
   const second=shot.id==='H04',indices=second?[3,4]:[1,2],keys=second?['unstable','diverge']:['open','cross'];
   indices.forEach((i,j)=>{
    const p=[j?6.3:-6.3,.3,0];curve(ctx,i,keys[j],p,4.0,side,{label:`plot_0${i} / ${['OPEN','CROSS','UNSTABLE','DIVERGED'][i-1]}`,rotation:second?.14:-.13});
    for(let t=-5;t<=5;t++){const x=p[0]+t;lines.segment([x,-5.5,0],[x,-5.35,0],{color:mul(COLD,.15),width:1});}
    lines.segment([p[0]-5,-5.5,0],[p[0]+5,-5.5,0],{color:mul(COLD,.14),width:1});
   });
  }else if(sceneId==='solver'){
   const p=curve(ctx,0,'correct',[0,.5,0],5.5,q,{label:'SERAN',rotation:-.12});
   const chain=fourierChain(q*TAU).map(v=>p.transform([v[0]/16,v[1]/16,0]));
   for(let i=1;i<chain.length;i++){lines.segment(chain[i-1],chain[i],{color:mul(COLD,.23),width:1.2});lines.segment(chain[i],chain[i],{color:HOT,width:6});}
   const railA=[-8,-5,0],railB=[-8,p.tip[1],0],railC=[p.tip[0],-5,0];
   lines.segment([-8,-5,0],[-8,6,0],{color:mul(COLD,.22),width:2});
   lines.segment([-8,-5,0],[8,-5,0],{color:mul(COLD,.22),width:2});
   lines.segment(railB,p.tip,{color:mul(COLD,.23),width:1.2});
   lines.segment(railC,p.tip,{color:mul(RED,.28),width:1.8});
   for(const p of [railB,railC]){lines.segment(p,p,{color:HOT,width:10});}
   caption(ctx,'y(t)',[-8.8,p.tip[1],0],18,'#cbb8c7');
   caption(ctx,'x(t)',[p.tip[0],-5.6,0],18,'#cbb8c7');
   caption(ctx,'sample(t) → connect(x, y)',[0,-6.2,0],22,'#d5c6d0');
  }else if(sceneId==='closure'){
   const p=curve(ctx,0,'correct',[0,.3,0],5.8,1,{label:'SERAN',pen:false});
   const pulse=1-smooth(f,E.closed,E.closed+26);lines.segment(p.points[0],p.points[0],{color:mul(HOT,1+pulse),width:9+13*pulse});
  }else if(sceneId==='expression'){
   curve(ctx,0,'correct',[6,.2,0],4.5,1,{label:'SERAN',pen:false});
   calculationSheet.s.points.visible=true;calculationSheet.s.set({a:calculationSheet.a,size:.03,bright:.18,colA:[.7,.045,.09],extent:[6,4,0],focus:25,aperture:.005,scan:.8},camera,ctx.H);
   formula.points.visible=true;formula.set({a:formulaTex,size:.49,bright:.86,palette:[.86,.38,.48],focus:25,aperture:.002,t:ctx.t},camera,ctx.H);
   for(let j=0;j<12;j++){const y=-3+j*.18;lines.segment([-.5,y,0],[1.1,y+.65,0],{color:mul(RED,.12),width:1});}
  }else if(sceneId==='departure'){
   const rot=-.75,fade=smooth(f,11885,11954),hero=curve(ctx,0,'correct',[0,.6,1],5.6,1,{rotation:rot,label:'SERAN',loop:true,opacity:1-fade,pen:f<11880});
   const positions=[[-10,3.7,-7],[-9,-.2,4],[8.8,4.5,-7],[9.3,-.5,4]],keys=['open','cross','unstable','diverge'];
   positions.forEach((p,i)=>{
    const leave=smooth(f,sideClose[i],sideClose[i]+EXIT_FRAMES);if(leave>=1)return;
    curve(ctx,i+1,keys[i],[p[0],p[1]+leave*3,p[2]-leave*9],2.4,1,{rotation:rot-.1,opacity:(1-leave)*.62,pen:false});
   });
   caption(ctx,f>=E.loop?'while (true)  draw_heart("HIKAQ");':'draw_heart("HIKAQ");',[0,-4.2,5.9],22,'#d5afc0',1-fade);
    if(f>=11880){
     const u=smooth(f,11880,11958),k=Math.floor((repeatProgress(11880)%1)*720),start=hero.points[k];
     const path=Array.from({length:101},(_,j)=>{const t=j/100,v=1-t;return [v*v*start[0]+2*v*t*3+t*t*8.2,v*v*start[1]+2*v*t*6+t*t*4,v*v*start[2]+2*v*t*1+t*t*(-2)];});
     lines.polyline(path,{draw:u,color:mul(RED,.22),width:1.15});
     const tip=path[Math.min(100,Math.floor(u*100))];
     for(let i=0;i<9;i++){const p=path[Math.max(0,Math.floor(u*100)-i)];lines.segment(p,p,{color:mul(HOT,.8*(1-i/9)),width:8-i*.6});}
     lines.segment(tip,tip,{color:HOT,width:10});
    }
   // A few ground traces establish a different, nearly empty physical stage.
   for(let k=-4;k<=4;k++)lines.segment([k*4,-3.5,-16],[k*4,-3.5,13],{color:mul(RED,.025*(1-smooth(f,E.leave,sideClose[3]))),width:1});
  }
 }
 function draw(ctx){
  const f=ctx.t*60,frame=Math.round(f),shot=shotAt(f),sceneId=sceneForShot(shot.id),transition=transitionAt(f);
  let rig=pose(shot,f);
  if(transition?.to.join==='relay'){
   const a=pose(transition.from,f),b=pose(transition.to,f),q=(1-Math.cos(transition.progress*Math.PI))/2;
   rig={position:a.position.lerp(b.position,q),target:a.target.lerp(b.target,q)};
  }
  camera.position.copy(rig.position);camera.lookAt(rig.target);camera.updateMatrixWorld();
  const punch=shot.punch*Math.pow(1-ramp(f,shot.filmFrame,shot.filmFrame+8),3);
  Object.assign(ctx.post,{bloom:1.2,threshold:.82,ca:.018,vignette:.26,grain:.012,exposure:1.05,tint:[1.02,.98,1],zoom:1+punch});
  if(sceneId!=='fracture')Object.assign(ctx.post,{bloom:1.05,threshold:.88,ca:.012,vignette:.28,grain:.010,exposure:1.08,tint:[1.025,.97,.985]});
  objects.forEach(o=>o.visible=false);lines.begin();fracture=null;programStates=[];programBounds=['seran','open','cross','unstable','diverge'].map(id=>({id,minX:0,maxX:0,minY:0,maxY:0,visible:false}));
  air.s.points.visible=true;air.s.set({a:air.a,size:.02,bright:.04,colA:sceneId==='fracture'?[.4,.32,.45]:[.42,.15,.21],t:ctx.t,focus:30,aperture:.003,maxBlur:10},camera,ctx.H);
  if(sceneId==='circuit')drawCircuit(ctx,f);else if(sceneId==='fracture')drawFracture(ctx,f);else if(sceneId==='archive')drawArchive(ctx,f);else drawHearts(ctx,f,sceneId,shot);
  lines.end(ctx);ctx.draw(scene,camera);
  last={referenceId:shot.referenceId,transition:transition?{from:transition.from.referenceId,to:transition.to.referenceId,type:transition.to.join,progress:transition.progress}:null,camera:{set:sceneId+'/'+shot.id,position:camera.position.toArray(),target:rig.target.toArray(),fov:camera.fov,travel:0},programBounds,programStates,abyssBounds:[],worldScale:[1,1,1],blackHold:false,fracture,particleCount:objects.reduce((n,o)=>n+(o.geometry.getAttribute("position")?.count??0),0),geometry:sceneId,visibleObjectFamilies:objects.filter(o=>o.visible).length};
 }
 return {draw,get last(){return last;}};
}
