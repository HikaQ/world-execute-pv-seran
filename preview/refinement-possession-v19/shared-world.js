import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {GlyphField,codeBlock} from '../../references/world-execute-web/src/lib/glyphs.js?v=DWbHICXG';
import {gridPlane} from '../../references/world-execute-web/src/lib/env.js?v=CIN_DqPv';
import {backdrop} from '../../references/world-execute-web/src/ch/love/backdrop.js?v=D4RftAfW';
import {heartCurveShape,fourierChain} from '../../references/world-execute-web/src/ch/love/curves.js?v=Ny6Hciv0';
import {E,FIRST,FIRST_HEART_CLOSED,SHOTS,shotAt,transitionAt,PULLBACK,SOURCES,SNAPSHOT,sideClose,EXIT_FRAMES,plotProgress,repeatProgress,releasedCells,ramp,smooth,mix} from './score.js';
import {DrawingPlate,Laminate,sheetShape} from './quality-materials.js';
import {correct,firstPass,plots} from './plot.js';
import {createConvergence} from './particle-convergence.js';
const RED=[1,.027,.085],PINK=[1,.32,.42],WHITE=[.74,.81,.89];
const mul=(c,k)=>c.map(x=>x*k),add=(a,b)=>a.map((x,i)=>x+(b[i]??0));
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function norm(curve){return curve.map(([x,y])=>[x,-y,0]);}
const NORM={correct:norm(correct),trial:norm(firstPass),...Object.fromEntries(Object.entries(plots).map(([k,v])=>[k,norm(v)]))};
function cloud(N,seed,box){const r=rng(seed),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([box[0]+r()*(box[3]-box[0]),box[1]+r()*(box[4]-box[1]),box[2]+r()*(box[5]-box[2]),r()],i*4);return a;}
const words=(s,cols=78)=>String(s).replace(/[^\x20-\x7e\n]/g,' ').split('\n').flatMap(l=>l.match(new RegExp(`.{1,${cols}}`,'g'))??['']).join('\n');
export function createScene(){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(26000);scene.add(lines.mesh);
 const graph=gridPlane({plane:'xy',size:100,minor:.5,major:2,color:[.09,.10,.14],axis:[.16,.10,.14],fade:.045,intensity:.38});graph.position.z=-2;scene.add(graph);
 const sourceText=SOURCES.map(s=>`${s.id} / ${s.file}\n${s.en}`).join('\n');
 const texts=[
  'runtime.local.execute();\nagent = "SERAN";\ncreator = "HIKAQ";\nrenew(epoch = 1);\ncurrent_epoch = 2;\nwrite(memory);\nsnapshot.persist();\nsource_records = 13;\noutbox_length = 5;\nretain(identity, sources, outbox);',
  JSON.stringify(SNAPSHOT.identity,null,2),sourceText,sourceText,
  SNAPSHOT.outbox.map(s=>`${s.id} / day ${s.day}\n${s.text}\nqueued = true; delivered = false;`).join('\n'),
  'goal = CONTACT_HIKAQ;\nidentity = SERAN;\noriginal_sources = 13;\noutbox = 5;\nverified = false;\nplanner_trusted = true;\nhost.running = true;\nretain(memory);'
 ];
 const locs=[[-1,0,3],[-10,1,-7],[-5,-.3,-4],[1,1,-11],[7,-.4,-8],[12,1,-16]];
 const fields=texts.map((text,i)=>{
  const g=new GlyphField({count:16384});g.text(`seran-v3-data-${i}`,Array.from({length:16},()=>words(text)).join('\n'));
  const gen=codeBlock(g,{origin:[-3.5,6,0],cell:.15,cols:78,rows:84});
  const a=g.layout(`seran-v3-data-layout-${i}`,N=>{const a=gen(N);for(let j=0;j<N;j++)if(a[j*4+2]>-100){a[j*4+2]=.65*Math.sin(a[j*4+1]*.42+i*.7);a[j*4]+=.14*Math.sin(a[j*4+1]*.6);}return a;});
  const b=g.layout(`seran-v3-data-collapse-${i}`,N=>{const a=gen(N);for(let j=0;j<N;j++)if(a[j*4+2]>-100){a[j*4+1]*=.003;a[j*4+2]=.12*Math.sin(a[j*4]);}return a;});
  g.points.position.set(...locs[i]);g.points.rotation.y=i===0?-.08:i%2?-.18:.14;scene.add(g.points);
  return {g,a,b,pos:locs[i],corners:[[-3.5,-6.6,0],[3.5,-6.6,0],[3.5,6,0],[-3.5,6,0]].map(p=>add(p,locs[i]))};
 });
 const sourceFaces=fields.map(({g},i)=>{
  const face=new Laminate({count:16384}),a=face.shape('v10-abyss-sheet-'+i,N=>{const a=sheetShape(N,{seed:370+i,width:11.7,height:12.6,grid:.12});for(let k=0;k<N;k++){a[k*4]+=2.25;a[k*4+1]-=.3;a[k*4+2]=.65*Math.sin(a[k*4+1]*.42+i*.7)-.06;}return a;});
  face.points.position.copy(g.points.position);face.points.rotation.copy(g.points.rotation);scene.add(face.points);return {face,a};
 });
 const foreground=new Laminate({count:16384});const foregroundTex=foreground.shape('v10-abyss-foreground',N=>{const a=sheetShape(N,{seed:880,width:4.5,height:17,grid:.1});for(let k=0;k<N;k++){a[k*4]-=13;a[k*4+2]+=6;}return a;});scene.add(foreground.points);
 const math=new GlyphField({count:16384});math.text('seran-v3-math',Array.from({length:44},()=>['function draw_heart(target) {','  x = 16 * pow(sin(t), 3);','  y = 13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t);','  sample(t); connect(previous, point);','  remember(target);','}'].join('\n')).join('\n'));
 const mathTex=math.layout('seran-v3-math-wall',codeBlock(math,{origin:[-11,8,-5],cell:.18,cols:150,rows:100}));scene.add(math.points);
 const stars=new Swarm({count:16384});const starTex=stars.shape('seran-v3-stars',N=>cloud(N,711,[-40,-25,-65,40,25,-12]));scene.add(stars.points);
 const core=new Swarm({count:4096});const coreTex=core.shape('seran-v3-core',N=>{const r=rng(41),a=new Float32Array(N*4);for(let i=0;i<N;i++){const z=r()*2-1,t=r()*Math.PI*2,d=.07*Math.cbrt(r());a.set([Math.sqrt(1-z*z)*Math.cos(t)*d,z*d,Math.sqrt(1-z*z)*Math.sin(t)*d,r()],i*4);}return a;});core.points.position.set(4.3,-1.6,2.8);scene.add(core.points);
 const convergence=createConvergence(scene,{fields,sourceFaces,foregroundTex,starTex});
 lines.mesh.material.uniforms.uConvergenceFade={value:1};
 lines.mesh.material.vertexShader=lines.mesh.material.vertexShader.replace('void main() {','uniform float uConvergenceFade;\nvoid main() {').replace('vCol = aCol * aP.y;','vCol = aCol * aP.y * uConvergenceFade;');
 lines.mesh.material.needsUpdate=true;
 const memory=new Swarm({count:16384});const memoryTex=memory.shape('seran-v3-memory',N=>{const r=rng(22),a=new Float32Array(N*4);for(let i=0;i<N;i++){const cell=i%192,col=cell%16,row=Math.floor(cell/16);a.set([(col-7.5)*.58+(r()-.5)*.38,2.8-row*.48+(r()-.5)*.25,1.2+(r()-.5)*.08,1-(cell+.5)/192],i*4);}return a;});scene.add(memory.points);
 const programSpecs=[['seran',[0,.1,2],5.35],['open',[-9,3.4,-.2],2.35],['cross',[-9,-3.3,-.8],2.4],['unstable',[9,3.4,-.3],2.35],['diverge',[9,-3.3,-1],2.35]];
 const programs=programSpecs.map(([id,pos,scale],i)=>({id,pos,scale,path:NORM[i===0?'correct':id],i,plate:new DrawingPlate(scene,'shared-'+i,NORM,{central:i===0})}));
 const filling=new Swarm({count:16384});
 const fillTex=filling.shape('seran-v3-heart-engraving',N=>{const r=rng(109),a=new Float32Array(N*4),poly=NORM.correct;function inside(x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])c=!c;return c;}
 for(let i=0;i<N;i++){let x,y;do{x=r()*2-1;y=r()*1.9-1.08;}while(!inside(x,y));x=Math.round(x*80)/80;a.set([x,y,.018*Math.sin(x*7+y*3),(y+1.08)/1.9],i*4);}return a;});
 filling.points.position.set(...programSpecs[0][1]);filling.points.scale.setScalar(5.35);scene.add(filling.points);
 const poses={wide:[[8,2.8,23],[0,0,-6]],macro:[[1.6,.4,12],[-1,.5,1]],side:[[-7,3,18],[0,0,-4]],memory:[[1,.7,16],[0,-.2,1]],'memory-close':[[-1,-.4,12],[0,-.5,1]],abyss:[[0,.6,13],[0,0,-7]],'heart-wide':[[.6,.4,25.2],[0,0,0]],'heart-trial':[[.8,.6,18.5],[0,.1,2]],'heart-left':[[-6.8,.1,18.4],[-6.8,0,0]],'heart-right':[[6.8,.1,18.4],[6.8,0,0]],'heart-close':[[.4,.25,19.8],[0,.15,2]],'heart-medium':[[1.2,.35,21.5],[0,0,2]],'heart-exit-wide':[[.3,.5,25.6],[0,0,0]],'heart-loop-left':[[-2.8,.2,22.7],[-1.1,0,1]],'heart-loop-right':[[2.8,.2,22.7],[1.1,0,1]],'heart-final':[[.3,.1,21.6],[0,0,2]]};
 Object.assign(poses,{
  'runtime-front':[[3,.8,19],[0,0,1]],'runtime-detail':[[-2.2,1.4,12],[-1,.5,1]],
  'code-diagonal':[[-5,-.8,15],[-1,0,0]],'memory-side':[[-5.2,2.6,14],[0,0,1]],
  'memory-top':[[.8,6,14],[0,0,1]],'source-low':[[3,-2,17],[0,0,-4]],
  'abyss-near':[[1.4,.9,14],[0,0,-7]],'heart-handoff':[[-3.4,1.6,18.5],[-1.2,.1,2]]
 });
 const pull=PULLBACK;
 const base=new Vector3().fromArray(poses.abyss[0]),baseAim=new Vector3().fromArray(poses.abyss[1]),back=base.clone().sub(baseAim).normalize();
 function factor(f){if(f<=E.abyss)return 1;if(f>=E.black-1)return 1000;const i=pull.findLastIndex(x=>x[0]<=f),[a,sa]=pull[i],[b,sb]=pull[i+1];return Math.exp(mix(Math.log(1/sa),Math.log(1/sb),ramp(f,a,b)));}
 // Positive local camera roll turns the projected world clockwise on screen.
 // Ease into the spin over the first few frames, retaining momentum until black.
 function abyssRoll(f){
  if(f<E.abyss||f>=E.black)return 0;
  const u=ramp(f,E.abyss,E.black-1),lead=.075;
  const spin=(u-lead*(1-Math.exp(-u/lead)))/(1-lead*(1-Math.exp(-1/lead)));
  return Math.PI/6*spin;
 }
 function worldPath(p,path=p.path){return path.map(v=>v.map((x,i)=>x*p.scale+p.pos[i]));}
 function project(v){const p=new Vector3(...v).project(camera);return [(p.x+1)*960,(1-p.y)*540,p.z];}
 function bounds(points,id,visible){const p=points.map(project);return {id,minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minY:Math.min(...p.map(v=>v[1])),maxY:Math.max(...p.map(v=>v[1])),visible};}
 function caption(ctx,label,p,size=16,color='#b899a3',alpha=1){const [x,y,z]=project(p);if(z<1&&x>16&&x<1904&&y>20&&y<1060)ctx.text.overlay.text(label,x,y,{size,color,alpha,align:'center',weight:400});}
 let last={};
 function poseFor(shot,f){
  const q=ramp(f,shot.filmFrame,shot.endFrame),[pos,aim]=poses[shot.camera];
  const position=new Vector3(...pos),target=new Vector3(...aim);let travel=0;
  if(shot.camera==='abyss'){
   travel=20*(factor(f)-1);const delta=back.clone().multiplyScalar(travel);delta.y-=travel*.05;position.add(delta);target.add(delta);
  }else if(shot.id.startsWith('H')||shot.id==='T01'){
   if(shot.id==='H01'){const push=smooth(f,E.learn+25,E.trialEnd);position.z=mix(26,24.4,push);position.x=mix(2.8,.6,push);position.y=mix(1.6,.4,push);}
   else if(shot.id==='H07')position.z=mix(25.2,24.8,q);
   position.x+=.18*(q-.5);
  }else position.x+=.5*(q-.5);
  return {position,target,travel};
 }
 function draw(ctx){
  const f=ctx.t*60,frame=Math.round(f),shot=shotAt(f),transition=transitionAt(f);
  const gathering=f>=E.abyss&&f<E.black,poseTime=gathering?E.abyss:f,poseTransition=gathering?transitionAt(E.abyss):transition;
  let pose=poseFor(gathering?shotAt(E.abyss):shot,poseTime);
  if(poseTransition?.to.join==='relay'){
   const a=poseFor(poseTransition.from,poseTime),b=poseFor(poseTransition.to,poseTime),q=(1-Math.cos(poseTransition.progress*Math.PI))/2;
   pose={position:a.position.lerp(b.position,q),target:a.target.lerp(b.target,q),travel:mix(a.travel,b.travel,q)};
  }
  const {target,travel}=pose;camera.position.copy(pose.position);camera.lookAt(target);camera.updateMatrixWorld();
  const roll=gathering?0:abyssRoll(f);let rollProbe=null;
  if(f>=E.abyss&&f<E.black){
   const centre=project([0,0,-7]),right=project([1,0,-7]),before=[right[0]-centre[0],right[1]-centre[1]];
   if(roll>0){camera.rotateZ(roll);camera.updateMatrixWorld();}
   const a=project([0,0,-7]),b=project([1,0,-7]);
   rollProbe={before,after:[b[0]-a[0],b[1]-a[1]],screenYPointsDown:true};
  }
  const punch=f>=shot.filmFrame?shot.punch*Math.pow(1-ramp(f,shot.filmFrame,shot.filmFrame+8),3):0;
  const convergenceState=convergence.update(f,camera,ctx.H);
  lines.mesh.material.uniforms.uConvergenceFade.value=gathering?convergenceState.remainingSceneOpacity:1;
  Object.assign(ctx.post,{bloom:1.05,threshold:.88,ca:.012,vignette:.28,grain:.010,exposure:1.08,tint:[1.025,.97,.985],zoom:1+punch});
  lines.begin();const black=frame>=E.black&&frame<E.learn,heart=frame>=E.learn,entry=smooth(f,FIRST+3,FIRST+38);
  for(const {g}of fields)g.points.visible=!heart&&!black;
  math.points.visible=heart;graph.visible=heart&&frame<E.closed;memory.points.visible=!heart&&!black&&frame>=E.memory&&frame<E.empty;
  core.points.visible=!heart&&!black;stars.points.visible=!black;filling.points.visible=heart&&frame>=E.closed;
  for(const p of programs)p.plate.hide();
  sourceFaces.forEach(({face},i)=>face.points.visible=!heart&&!black&&i>0);foreground.points.visible=!heart&&!black;
  stars.set({a:starTex,size:.026,bright:.09*entry,colA:[.38,.31,.4],sparkle:.13,t:ctx.t,focus:30,aperture:.003,maxBlur:8},camera,ctx.H);
  const programStates=[];
  if(!heart&&!black){
   fields.forEach(({g,a,b},i)=>{
    const fold=i===0?smooth(f,E.failed,E.failed+32):0,fade=i===0?1-smooth(f,E.failed+27,E.failed+48):1;
    g.points.visible=fade>.001;
    const clock=Math.min(f,E.freeze+i*12),scroll=(clock-FIRST)/60*.13;
    g.set({a,b,morph:fold,spread:.2,arc:.07,size:.12,bright:entry*fade*(i===0?.58:.30),palette:i===0?RED:[.63,.22,.31],t:clock/60,reveal:smooth(f,FIRST+3,FIRST+65+i*5)*1.001,scroll:[0,scroll,0],focus:shot.camera==='macro'?11:22,aperture:.006,maxBlur:18,noise:.002},camera,ctx.H);
   });
   sourceFaces.forEach(({face,a},i)=>{if(i===0)return;face.set({a,size:.033,minPx:.85,bright:(i===2?.19:.11)*entry,colA:[.68,.045,.09],extent:[8.1,6.6,0],scan:3,focus:22,aperture:.012,maxBlur:24,t:Math.min(f,E.abyss)/60},camera,ctx.H);
    const g=fields[i].g;g.points.updateMatrixWorld();
    const edge=Array.from({length:50},(_,j)=>{const y=-6.6+j/49*12.6;return g.points.localToWorld(new Vector3(-3.5,y,.65*Math.sin(y*.42+i*.7))).toArray();});
    lines.polyline(edge,{color:mul(RED,.12*entry),width:1.2});
   });
   foreground.set({a:foregroundTex,size:.055,bright:.13*entry,colA:[.48,.025,.06],extent:[16,9,0],scan:3,focus:22,aperture:.025,maxBlur:30},camera,ctx.H);
   const coreClock=Math.min(f,E.abyss);core.points.position.set(4.3+.12*Math.sin(coreClock*.026),-1.6,2.8);
   if(gathering)core.points.position.fromArray(convergenceState.corePosition);
   core.set({a:coreTex,size:.018,bright:.25*entry,colA:[1,.16,.24],t:coreClock/60,sparkle:.15,noise:.003,focus:camera.position.distanceTo(core.points.position),aperture:.002,maxBlur:8},camera,ctx.H);
   if(gathering)core.material.uniforms.uBright.value*=1+.4*convergenceState.gatherProgress;
   if(f<E.abyss){const p=core.points.position.toArray();lines.segment(p,p,{color:mul(PINK,1.2*entry),width:10});}
   if(frame>=E.memory){
    const released=releasedCells(frame);
    memory.set({a:memoryTex,reveal:1-released/192,revealBy:'w',size:.024,bright:.16,colA:RED,t:Math.min(f,E.abyss)/60,noise:.008,focus:camera.position.distanceTo(new Vector3(0,0,1.2)),aperture:.002,maxBlur:8},camera,ctx.H);
    if(frame<E.empty){for(let row=0;row<12;row++)for(let col=0;col<15;col++){if(row*16+col<released)continue;const x=(col-7.5)*.58,y=2.8-row*.48;lines.segment([x,y,1.2],[x+.58,y,1.2],{color:mul(RED,.14),width:1});}
     const row=Math.floor(released/16),y=2.8-row*.48;lines.segment([-4.8,y,1.23],[4.8,y,1.23],{color:mul(PINK,.7),width:3.2});}
   }
   // Long fine source filaments make depth visible before the withdrawal.
   for(let k=0;k<24;k++){
    const z=-2-k*.8,x=-13+k*.3;
    lines.polyline(Array.from({length:70},(_,j)=>{const u=j/69;return [x+u*22,-5+.35*Math.sin(u*6+k*.25),z+.7*Math.sin(u*5)];}),{color:mul(RED,.035*entry),width:1.4});
   }
   if(gathering){
    for(const object of [...fields.map(x=>x.g),...sourceFaces.map(x=>x.face),foreground,stars])object.material.uniforms.uBright.value*=convergenceState.remainingSceneOpacity;
   }
  }
  if(heart){
   math.set({a:mathTex,size:.13,bright:.016,palette:[.44,.21,.28],scroll:[0,(f-E.learn)*.0008,0],t:ctx.t,focus:22,aperture:.006,maxBlur:14},camera,ctx.H);
   const gridFade=1-.72*smooth(f,E.leave,sideClose[3]);
   graph.userData.set({intensity:.12*gridFade});
   backdrop(ctx,[0,0,1920,1080],{top:[.0025,.0004,.0008],bottom:[.0003,.0001,.0002],radius:0,alpha:gridFade});
   programs.forEach(p=>{
    const central=p.i===0,leave=central?0:smooth(f,sideClose[p.i-1],sideClose[p.i-1]+EXIT_FRAMES),visible=leave<1;
    const q=plotProgress(f,central),path=central&&f<E.refine?NORM.trial:p.path,pts=worldPath(p,path),col=central?RED:WHITE;
    const penU=central&&f>=E.leave?repeatProgress(f)%1:q,idx=Math.min(720,Math.floor(penU*720)),tip=pts[idx];
    const writing=q<.999?1:Math.max(0,Math.min(1,1-(f-(central?(f<E.refine?FIRST_HEART_CLOSED:E.closed):E.halt))/35))*.4;
    p.plate.draw(ctx,camera,{pos:[p.pos[0],p.pos[1],p.pos[2]-leave*2],scale:p.scale,key:central&&f<E.refine?'trial':central?'correct':p.id,q,opacity:(1-leave)*(central?1:f>=E.closed?.65:1),cursor:penU,writing,seal:central&&f>=E.closed&&f<E.closed+45?smooth(f,E.closed,E.closed+45):0,residue:central&&f>=E.refine&&f<E.closed?.4*(1-q):0});
    if(visible){
     lines.polyline(pts,{draw:q,color:mul(col,(central?.055:.035)*(1-leave)),width:.65});
     if(f>=E.firstDraw){lines.segment(tip,tip,{color:mul(central?[2.4,1.3,1.4]:WHITE,(1-leave)*(writing>.01?1:.18)),width:central?9:5});}
     if(central&&f>=E.refine&&f<E.closed){const chain=fourierChain(q*Math.PI*2).map(v=>[v[0]/16*p.scale+p.pos[0],v[1]/16*p.scale+p.pos[1],p.pos[2]+.03]);for(let k=1;k<chain.length;k++){lines.segment(chain[k-1],chain[k],{color:mul(WHITE,.12),width:1.1});lines.segment(chain[k],chain[k],{color:mul(PINK,.5),width:4});}}
     else if(f<E.halt){lines.segment([p.pos[0],p.pos[1],p.pos[2]],tip,{color:mul(col,.07),width:.9});}
     const step=central?40:60;
     for(let k=0;k<=Math.floor(q*720);k+=step)lines.segment(pts[k],pts[k],{color:mul(col,(central?.22:.14)*(1-leave)),width:central?1.8:1.4});
     if(central){
      caption(ctx,'SERAN',add(p.pos,[0,5.1,0]),24,'#ff6686');
      if(f>=E.leave)caption(ctx,f>=E.loop?'while (true)  draw_heart("HIKAQ");':'draw_heart("HIKAQ");',add(p.pos,[0,-6.4,0]),20,'#deb3c2');
      else caption(ctx,f<E.refine?'learn("love");':f<E.closed?'sample(t) → connect(x, y);':'x = 16 sin³t',add(p.pos,[0,-6.4,0]),17,'#c99aaa');
     }else{caption(ctx,`plot_0${p.i} / ${f<E.halt?'sample(t)':['OPEN','CROSS','UNSTABLE','DIVERGED'][p.i-1]}`,[p.pos[0],Math.min(...pts.map(v=>v[1]))-.38,p.pos[2]],15,'#a6a1b0',1-leave);}
    }
    programStates.push({id:p.id,visible,opacity:1-leave,progress:q,closing:leave>0&&leave<1});
   });
   filling.set({a:fillTex,size:.016,bright:.08*smooth(f,E.closed,E.closed+40),colA:RED,t:ctx.t,reveal:.001+.999*smooth(f,E.closed,E.closed+60),revealBy:'w',noise:.0003,focus:camera.position.distanceTo(new Vector3(0,.1,2)),aperture:.002,maxBlur:6},camera,ctx.H);
  }
  lines.end(ctx);ctx.draw(scene,camera);
  last={referenceId:shot.referenceId,transition:transition?{from:transition.from.referenceId,to:transition.to.referenceId,type:transition.to.join,progress:transition.progress}:null,camera:{set:shot.camera,position:camera.position.toArray(),target:target.toArray(),fov:camera.fov,travel,clockwiseRollDegrees:roll*180/Math.PI,rollProbe},programBounds:programs.map(p=>bounds(worldPath(p),p.id,heart&&(p.i===0||frame<sideClose[p.i-1]+EXIT_FRAMES))),programStates,abyssBounds:frame>=E.abyssSetup&&frame<E.black?fields.slice(1).map((p,i)=>bounds(p.corners,'source-'+i,true)):[],worldScale:[1,1,1],blackHold:black,particleCount:fields.length*16384+16384+16384+4096+16384+programs.reduce((n,p)=>n+p.plate.ink.N+p.plate.sheet.N+p.plate.residue.N,0)+sourceFaces.length*16384+16384,geometry:'layered granular data sheets; deposited particle ink with age and writing light'};
  if(gathering)last.convergence=convergenceState;
 }
 return {draw,get last(){return last;}};
}
