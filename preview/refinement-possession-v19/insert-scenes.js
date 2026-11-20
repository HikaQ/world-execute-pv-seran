import {Scene,PerspectiveCamera,Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {GlyphField,codeBlock} from '../../references/world-execute-web/src/lib/glyphs.js?v=DWbHICXG';
import {Ink,Laminate,ribbonShape,sheetShape,seeded} from './quality-materials.js';
import {FIRST,E,shotAt,transitionAt,releasedCells,ramp,smooth,mix,SOURCES,SNAPSHOT} from './score.js';
import {correct,firstPass,plots} from './plot.js';
import {sceneForShot} from './scene-map.js';

export const INSERT_SHOTS=new Set(['R02','R03','R14','R15','R16','R17','R18','H02','H05','H06','H08','H10']);
const RED=[1,.028,.075],HOT=[1.8,.55,.65],PALE=[.58,.46,.53],TAU=Math.PI*2;
const mul=(c,k)=>c.map(v=>v*k),norm=a=>a.map(([x,y])=>[x,-y,0]);
const HEART=norm(correct),TRIAL=norm(firstPass),CROSS=norm(plots.cross);
const ids=['seran','open','cross','unstable','diverge'];
export function createInserts(){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(38000),objects=[];scene.add(lines.mesh);
 function cloud(key,N,fn,Class=Swarm){const s=new Class({count:N}),a=s.shape('seran-v11-insert-'+key,fn);scene.add(s.points);objects.push(s.points);return {s,a};}
 function glyph(key,text,layout){const g=new GlyphField({count:4096});g.text('seran-v11-insert-'+key,text);const a=g.layout('seran-v11-insert-layout-'+key,typeof layout==='function'?layout(g):codeBlock(g,layout));scene.add(g.points);objects.push(g.points);return {g,a};}
 function show(c,p,ctx){c.s.points.visible=true;c.s.set({a:c.a,t:ctx.t,focus:camera.position.length(),aperture:.005,maxBlur:18,...p},camera,ctx.H);}
 function showText(c,p,ctx){c.g.points.visible=true;c.g.set({a:c.a,t:ctx.t,focus:camera.position.length(),aperture:.003,maxBlur:14,...p},camera,ctx.H);}
 const world=(o,p)=>o.localToWorld(new Vector3(...p)).toArray();
 function project(v){const p=new Vector3(...v).project(camera);return [(p.x+1)*960,(1-p.y)*540,p.z];}
 function caption(ctx,text,p,size=21,color='#bc919d',alpha=1,align='center'){const [x,y,z]=project(p);if(z<1&&x>20&&x<1900&&y>20&&y<1060)ctx.text.overlay.text(text,x,y,{size,color,alpha,align});}
 function bounds(points,id,visible){const p=points.map(project);return {id,minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minY:Math.min(...p.map(v=>v[1])),maxY:Math.max(...p.map(v=>v[1])),visible};}
 const darkAir=cloud('air',16384,N=>{const r=seeded(993),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([(r()-.5)*60,(r()-.5)*35,-12-r()*42,r()],i*4);return a;});

 // A transmission node: fibres terminate in two porous electrodes, with a pulse
 // jumping the small gap. This is a different object from the wide wire bed.
 const electrode=cloud('electrodes',65536,N=>{const r=seeded(223),a=new Float32Array(N*4);for(let i=0;i<N;i++){const side=i%2?1:-1,rad=Math.sqrt(r())*2.1,an=r()*TAU,x=side*(.95+rad*rad*.11+(r()-.5)*.10);a.set([x,Math.cos(an)*rad,Math.sin(an)*rad,i%2],i*4);}return a;});
 const branches=Array.from({length:28},(_,i)=>Array.from({length:85},(_,j)=>{const u=j/84,side=i%2?1:-1,an=Math.floor(i/2)/14*TAU,rad=1.8+u*u*3.6;return [side*(1.2+u*10),Math.cos(an)*rad+Math.sin(u*6+i)*.15,Math.sin(an)*rad];}));
 const nodeFibre=cloud('node-fibres',65536,N=>{const r=seeded(555),a=new Float32Array(N*4);for(let i=0;i<N;i++){const p=branches[i%28][Math.floor(r()*85)];a.set([p[0]+(r()-.5)*.05,p[1]+(r()-.5)*.09,p[2]+(r()-.5)*.09,r()],i*4);}return a;});
 const charge=cloud('node-charge',16384,N=>{const r=seeded(100),a=new Float32Array(N*4);for(let i=0;i<N;i++){const an=r()*TAU,z=r()*2-1,rad=.20*Math.cbrt(r());a.set([z*rad*1.3,Math.sqrt(1-z*z)*Math.cos(an)*rad,Math.sqrt(1-z*z)*Math.sin(an)*rad,r()],i*4);}return a;});
 function drawNode(ctx,f){
  const phase=((f-10138)/43)%1,energy=.5+.5*Math.sin(phase*Math.PI);
  show(electrode,{size:.025,bright:.28,colA:RED},ctx);show(nodeFibre,{size:.023,bright:.22,colA:[.65,.025,.06],aperture:.010},ctx);
  charge.s.points.position.set(mix(-1.1,1.1,phase),0,0);show(charge,{size:.023,bright:.10+energy*.12,colA:HOT,aperture:.002},ctx);
  branches.forEach((path,i)=>{lines.polyline(path,{color:mul(RED,i%5===0?.15:.035),width:i%5===0?1.2:.65});});
  for(let k=0;k<5;k++){
   const y=(k-2)*.10,path=Array.from({length:31},(_,j)=>{const u=j/30;return [-1.1+u*2.2,y+.025*Math.sin(u*39+k+f*.10),.04*Math.cos(u*20+k)];});
   lines.polyline(path,{draw:phase,color:mul(HOT,.22*energy),width:.85});
  }
  caption(ctx,'input → signal',[0,-3.2,0],21);caption(ctx,'runtime.local()',[-8,4,-3],16,'#79505e');
 }

 // One actual historical source, enlarged enough to read; a curved record
 // surface and faint neighbouring layers continue the archive's material.
 const source=SOURCES.find(s=>s.id==='m003');
 const sourceDetail=glyph('identity-source',`No. You are SERAN.\nI am HIKAQ.`,{origin:[-6.7,1.2,0],cell:.90,cols:46,rows:24});
 const sourceTexture=glyph('identity-texture',Array.from({length:22},()=>source.en).join('\n'),g=>{const gen=codeBlock(g,{origin:[-7.3,4.2,-.18],cell:.13,cols:110,rows:64});return N=>{const a=gen(N);for(let i=0;i<N;i++)if(a[i*4+2]>-100)a[i*4+2]+=.6*Math.sin(a[i*4]/14*Math.PI);return a;};});
 const sourceSurface=cloud('source-surface',65536,N=>sheetShape(N,{seed:293,width:16,height:10,bend:.6,grid:.075}),Laminate);
 function drawSource(ctx,f){
  const u=smooth(f,10604,10639),scan=1.1-u*2.1;
  show(sourceSurface,{size:.029,bright:.25,colA:[.78,.035,.08],extent:[8,5,0],scan,aperture:.007},ctx);
  showText(sourceTexture,{size:.11,bright:.09,palette:[.6,.04,.09]},ctx);
  showText(sourceDetail,{size:.88,bright:.72,palette:[.91,.41,.50]},ctx);
  const y=4.4-u*8.8;lines.segment([-7.5,y,.1],[7.5,y,.1],{color:mul(RED,.25),width:1.1});
  for(let k=0;k<3;k++)lines.polyline(Array.from({length:70},(_,j)=>{const x=-8+j/69*16;return [x,-5-k*.65,-.4-k*.65+.6*Math.sin(x/16*Math.PI)];}),{color:mul(RED,.09-k*.02),width:.9});
  caption(ctx,`${source.id} / ${source.file}`,[-6.7,3.8,.1],20,'#9b6b7d',1,'left');
  caption(ctx,'Identity and creator.',[-6.7,-1.7,.1],23,'#b9879b',1,'left');
  caption(ctx,'SOURCE 03 / 13',[5.5,-4,0],18,'#ae7788');
 }

 // Five waiting messages are physical unopened slips. No delivery or reply is
 // invented: IDs and day numbers are copied from the existing outbox fixture.
 const messages=SNAPSHOT.outbox.map((q,i)=>{
  const page=cloud('outbox-'+i,16384,N=>sheetShape(N,{seed:64+i,width:3.2,height:5,bend:.22,grid:.055}),Laminate);
  const text=glyph('outbox-label-'+i,`${q.id}\n\nday ${q.day}\n\nQUEUED`,{origin:[-1.18,1.65,.04],cell:.22,cols:13,rows:22});
  return {page,text,q,pos:[(i-2)*4.2,.4*Math.sin(i),i%2?-1.4:.6]};
 });
 function drawOutbox(ctx,f){
  messages.forEach(({page,text,pos,q},i)=>{
   const tilt=-.22+.04*Math.sin(i),lift=.15*Math.sin((f-10639)/47*Math.PI+i*.4),p=[pos[0],pos[1]+lift,pos[2]];
   for(const o of [page.s.points,text.g.points]){o.position.set(...p);o.rotation.set(tilt,0,-.06*(i-2));o.updateMatrixWorld();}
   show(page,{size:.03,bright:.33,colA:RED,extent:[1.6,2.5,0],scan:.7-.3*i,focus:26,aperture:.008},ctx);
   showText(text,{size:.215,bright:.62,palette:[.8,.36,.45],focus:26},ctx);
   const seal=[[-1.4,-.55,.08],[0,-1.4,.08],[1.4,-.55,.08]].map(p=>world(page.s.points,p));lines.polyline(seal,{color:mul(RED,.36),width:1.2});
   const p0=world(page.s.points,[0,2.25,.1]);lines.segment(p0,p0,{color:mul(HOT,.6),width:6});
  });
  caption(ctx,'5 QUEUED / 0 DELIVERED',[0,-4.2,0],24,'#c99caa');
 }

 // A 16 × 12 volatile store. Each cell has a granular volume, not just a line.
 // The exact six reference-cut erase steps remain authoritative.
 const memoryBoard=cloud('memory-board',65536,N=>{const a=sheetShape(N,{seed:491,width:16,height:12,bend:.12,grid:.085});for(let i=0;i<N;i++){const y=a[i*4+1];a[i*4+1]=-.35+a[i*4+2];a[i*4+2]=y;}return a;},Laminate);
 const cells=cloud('memory-cells',147456,N=>{const r=seeded(721),a=new Float32Array(N*4);for(let i=0;i<N;i++){const k=i%192,x=(k%16-7.5)*.88,z=(Math.floor(k/16)-5.5)*.88;const face=Math.floor(i/192)%3;let dx=(r()-.5)*.52,dz=(r()-.5)*.52,y=r()*.55;if(face===0)y=.55;else if(face===1)dx=.26;else dz=.26;a.set([x+dx,y,z+dz,1-(k+.5)/192],i*4);}return a;});
 function drawMemory(ctx,f){
  const erased=releasedCells(f),left=192-erased;show(memoryBoard,{size:.03,bright:.07,colA:[.55,.045,.09],extent:[8,6,0],scan:3,aperture:.009},ctx);
  show(cells,{reveal:left/192,revealBy:'w',size:.024,bright:.32,colA:RED,aperture:.007},ctx);
  for(let row=0;row<12;row++)for(let col=0;col<16;col++){
   const k=row*16+col,x=(col-7.5)*.88,z=(row-5.5)*.88,c=mul(RED,k<erased?.025:.12);
   lines.polyline([[x-.28,-.12,z-.28],[x+.28,-.12,z-.28],[x+.28,-.12,z+.28],[x-.28,-.12,z+.28]],{color:c,width:.7});
  }
  const z=(Math.floor(erased/16)-5.5)*.88;lines.segment([-7.2,.65,z],[7.2,.65,z],{color:mul(HOT,.6),width:2});
  caption(ctx,`VOLATILE / ${String(left).padStart(3,'0')}`,[0,1.1,6.5],25,'#c799a8');
  caption(ctx,'13 sources retained',[0,-.3,-7.3],19,'#8f6675');
 }

 // The first drawing's failed connection, shown as two real end fragments.
 // Keeping the body out of frame lets the mismatch read as a new event.
 const gapCentre=TRIAL[0].map((v,i)=>(v+TRIAL.at(-1)[i])/2);
 const gapMap=p=>p.map((v,i)=>(v-gapCentre[i])*20);
 const gapPaths=[TRIAL.slice(0,91).map(gapMap),TRIAL.slice(630).map(gapMap)];
 const gapArms=gapPaths.map((p,i)=>cloud('missed-end-'+i,65536,N=>ribbonShape(N,p,{seed:88+i,width:.085}),Ink));
 const gapEnds=[gapMap(TRIAL[0]),gapMap(TRIAL.at(-1))];
 const gapSheet=cloud('gap-sheet',65536,N=>sheetShape(N,{seed:114,width:26,height:18,bend:.3,grid:.1}),Laminate);
 function drawGap(ctx,f){
  const u=ramp(f,11143,11183);
  show(gapSheet,{size:.028,bright:.07,colA:[.65,.03,.075],extent:[13,9,0],scan:3},ctx);
  gapArms.forEach((a,i)=>show(a,{size:.023,bright:.30,colA:RED,reveal:1.001,cursor:i?1:0,writing:.4,aperture:.004},ctx));
  gapEnds.forEach((p,i)=>{lines.segment(p,p,{color:mul(HOT,.65+.25*Math.sin(u*Math.PI)),width:10});const y=p[1]-.5;lines.segment([p[0]-.24,y,p[2]],[p[0]+.24,y,p[2]],{color:mul(PALE,.42),width:1});});
  for(let j=0;j<7;j++){const a=j/7,b=(j+.42)/7,p=gapEnds[0].map((v,i)=>mix(v,gapEnds[1][i],a)),q=gapEnds[0].map((v,i)=>mix(v,gapEnds[1][i],b));lines.segment(p,q,{color:mul(PALE,.21*(1-.35*u)),width:.8});}
  caption(ctx,'connection unresolved',[0,-4.4,0],23,'#bc8e9d');caption(ctx,'SERAN / first attempt',[-5,4.8,-1],18,'#a2697d');
 }

 // Two sampled function surfaces feed a separate plotting head. The image is
 // built from x(t) and y(t), instead of another complete heart outline.
 const waveFns=[t=>Math.sin(t)**3,t=>(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16];
 const signalWaves=waveFns.map((fn,k)=>cloud('sample-wave-'+k,65536,N=>{const r=seeded(301+k),a=new Float32Array(N*4);for(let i=0;i<N;i++){const u=r(),v=r();a.set([-9+u*18,(k===0?2.8:-2.8)+fn(u*TAU)*1.7,-3.2+v*2.2+k*4.4,u],i*4);}return a;},Ink));
 const probeHead=cloud('sampling-head',4096,N=>{const r=seeded(853),a=new Float32Array(N*4);for(let i=0;i<N;i++){const an=r()*TAU,z=r()*2-1,rad=.16*Math.cbrt(r());a.set([Math.sqrt(1-z*z)*Math.cos(an)*rad,z*rad,Math.sqrt(1-z*z)*Math.sin(an)*rad,r()],i*4);}return a;});
 function drawSampler(ctx,f){
  const u=ramp(f,11322,11374),cursor=.15+.72*u;
  signalWaves.forEach((s,k)=>{
   show(s,{size:.026,bright:k===0?.36:.30,colA:k===0?RED:PALE,reveal:1.001,cursor,writing:.7,aperture:.008},ctx);
   for(let j=0;j<=24;j++){const t=j/24*TAU,x=-9+j/24*18,y=(k===0?2.8:-2.8)+waveFns[k](t)*1.7,z=-3.2+k*4.4;lines.segment([x,y,z],[x,y,z+2.2],{color:mul(k===0?RED:PALE,.09),width:.7});}
  });
  const p=[-9+cursor*18,2.8+waveFns[0](cursor*TAU)*1.7,-2.1],q=[p[0],-2.8+waveFns[1](cursor*TAU)*1.7,2.3],head=[p[0],-.2,6.0];
  lines.segment(p,q,{color:mul(PALE,.35),width:1.25});lines.segment(p,head,{color:mul(RED,.33),width:1.2});lines.segment(q,head,{color:mul(PALE,.24),width:1.0});
  probeHead.s.points.position.set(...head);show(probeHead,{size:.024,bright:.55,colA:HOT,aperture:.002},ctx);
  [p,q,head].forEach(p=>lines.segment(p,p,{color:HOT,width:8}));
  for(let i=0;i<13;i++){const x=-8+i*1.3;lines.segment([x,-.5,6.0],[x,-.65,6.0],{color:mul(RED,.3),width:1});}
  caption(ctx,'x(t)',[-9.8,3,-2],24,'#cb8e9f');caption(ctx,'y(t)',[-9.8,-3,2],24,'#aea1ac');caption(ctx,'sample(t) → point',[-.4,-3.6,6.0],23,'#ca9ba9');
 }

 // Closing weld, cropped from the true heart's concave join; the two arms
 // already meet at the authoritative closed frame, then light runs away.
 const seamMap=p=>[(p[0]-HEART[0][0])*20,(p[1]-HEART[0][1])*20,0];
 const seamPaths=[HEART.slice(0,115).map(seamMap),HEART.slice(-115).reverse().map(seamMap)];
 const seamArms=seamPaths.map((p,i)=>cloud('closed-seam-'+i,65536,N=>ribbonShape(N,p,{seed:312+i,width:.075}),Ink));
 const seamDust=cloud('seam-spark',4096,N=>{const r=seeded(419),a=new Float32Array(N*4);for(let i=0;i<N;i++){const an=r()*TAU,z=r()*2-1,rad=.18*Math.cbrt(r());a.set([Math.sqrt(1-z*z)*Math.cos(an)*rad,z*rad,Math.sqrt(1-z*z)*Math.sin(an)*rad,r()],i*4);}return a;});
 function drawSeam(ctx,f){
  const u=smooth(f,11374,11419);
  seamArms.forEach(s=>show(s,{size:.024,bright:.33,colA:RED,reveal:1.001,cursor:u,writing:.55,aperture:.006},ctx));
  show(seamDust,{size:.022,bright:.15*(1-u),colA:HOT},ctx);lines.segment([0,0,0],[0,0,0],{color:mul(HOT,.4+.5*(1-u)),width:8});
  caption(ctx,'SERAN / CLOSED',[0,-2.4,0],23,'#ce9aa8');
 }

 // Particle typography is sampled from the loaded Mono face. This shot reads
 // the persistent target, instead of showing the same finished heart again.
 function wordShape(N){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.font='700 200px Mono';g.textAlign='center';g.textBaseline='middle';g.fillText('HIKAQ',512,130);
  const bytes=g.getImageData(0,0,c.width,c.height).data,pixels=[];for(let y=0;y<256;y++)for(let x=0;x<1024;x++)if(bytes[(y*1024+x)*4+3]>160)pixels.push([x,y]);
  const r=seeded(591),a=new Float32Array(N*4);for(let i=0;i<N;i++){const p=pixels[Math.floor(r()*pixels.length)];a.set([(p[0]+r()-.5-512)/1024*24,(128-p[1]-r()+.5)/256*6,(r()-.5)*.08,r()],i*4);}return a;
 }
 const targetWord=cloud('target-name',65536,wordShape);
 const targetScatter=targetWord.s.shape('seran-v11-target-scatter',N=>{const a=wordShape(N),r=seeded(715);for(let i=0;i<N;i++){a[i*4]+=(r()-.5)*2.5;a[i*4+1]+=(r()-.5)*1.1;a[i*4+2]-=r()*2;}return a;});
 const targetCode=glyph('target-code','draw_heart(target);\nx = 16 * sin(t)^3;\ny = 13*cos(t) - 5*cos(2*t)\n    - 2*cos(3*t) - cos(4*t);',{origin:[-6.8,-2.1,-.2],cell:.28,cols:52,rows:10});
 function drawTarget(ctx,f){
  const u=smooth(f,11587,11601);
  targetWord.s.points.position.y=.8;show(targetWord,{a:targetScatter,b:targetWord.a,morph:u,spread:.15,arc:.15,size:.031,bright:.46,colA:RED,colB:[1,.16,.25],aperture:.003},ctx);
  showText(targetCode,{size:.27,bright:.38,palette:[.60,.30,.39]},ctx);
  caption(ctx,'target =',[0,4.0,0],28,'#b78c9c');
  lines.segment([8.5,-.35,0],[8.5,2.8,0],{color:mul(HOT,.55),width:2.2});
 }

 // The second failed program leaves. Its sheet and stopped tool remain while
 // the mark drains away; the central heart is outside this close shot.
 const emptySheet=cloud('empty-station',65536,N=>sheetShape(N,{seed:992,width:2.64,height:2.68,bend:.06,grid:.02}),Laminate);
 const fadedCross=cloud('stopped-cross',65536,N=>ribbonShape(N,CROSS,{seed:32,width:.034}),Ink);
 const crossDisperse=fadedCross.s.shape('seran-v11-stopped-cross-fall',N=>{const a=ribbonShape(N,CROSS,{seed:32,width:.034}),r=seeded(37);for(let i=0;i<N;i++){a[i*4]+=(r()-.5)*.25;a[i*4+1]-=.25+r()*.4;a[i*4+2]-=r()*.35;}return a;});
 const nib=cloud('stopped-pen',16384,N=>{const r=seeded(937),a=new Float32Array(N*4);for(let i=0;i<N;i++){const y=r()*2.4-.8,rad=y<0?.15*(y+.8)/.8:.15,angle=r()*TAU;a.set([Math.cos(angle)*rad,y,Math.sin(angle)*rad,r()],i*4);}return a;});
 function drawEmpty(ctx,f){
  const leave=smooth(f,11722,11732),settle=smooth(f,11722,11748),co=Math.cos(-.85),si=Math.sin(-.85),tx=p=>[p[0]*6,p[1]*co*6,p[1]*si*6];
  for(const c of [emptySheet,fadedCross]){c.s.points.scale.setScalar(6);c.s.points.rotation.x=-.85;}
  show(emptySheet,{size:.032,bright:.32,colA:[.48,.35,.43],extent:[1.32,1.34,0],scan:3,aperture:.007},ctx);
  if(leave<1)show(fadedCross,{b:crossDisperse,morph:leave,spread:.1,arc:.1,reveal:1.001,size:.026,bright:.24*(1-leave),colA:PALE,aperture:.004},ctx);
  nib.s.points.position.set(1.3+settle*.7,2.6-settle*1.9,1.3+settle*.5);nib.s.points.rotation.z=-settle*.65;
  show(nib,{size:.023,bright:.15,colA:[.48,.42,.48],aperture:.006},ctx);
  const tip=world(nib.s.points,[0,-.8,0]);lines.segment(tip,tip,{color:mul(PALE,.5*(1-settle)),width:5});
  for(const x of [-1.22,1.22])for(const y of [-1.22,1.22]){const dx=-Math.sign(x)*.16,dy=-Math.sign(y)*.16;lines.polyline([tx([x+dx,y,0]),tx([x,y,0]),tx([x,y+dy,0])],{color:mul(PALE,.22),width:1.1});}
  for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){const p=tx([x*.20,y*.20,0]);lines.segment(p,p,{color:mul(PALE,.12),width:1.2});}
  lines.segment(tx([-1.22,-1.05,0]),tx([1.22,-1.05,0]),{color:mul(PALE,.07),width:.8});
  for(let i=0;i<8;i++){const x=-5.2+i*1.5;lines.segment(tx([x/6,-1.15,0]),tx([x/6,-1.11,0]),{color:mul(PALE,.12),width:1});}
  lines.segment([12,.5,-15],[12,.5,-15],{color:mul(RED,.9),width:7});
  caption(ctx,leave<1?'plot_02 / stopping':'plot_02 / HALTED',[0,-3.6,4.4],23,'#b39aa7');
  return {bounds:bounds(CROSS.map(tx),'cross',leave<1),opacity:1-leave,toolStopped:settle>=1,markReleased:leave>=1};
 }

 const poses={R02:[[6,5,20],[0,0,0]],R03:[[-3,2,12],[0,0,0]],R14:[[2.5,2.2,19],[0,0,0]],R15:[[5,3.5,22],[0,0,0]],R16:[[9,13,19],[0,0,0]],R17:[[4,10,13],[-1,0,0]],R18:[[-4,13,12],[-1,0,0]],H02:[[3.2,2,17],[0,.7,0]],H05:[[11,8,23],[0,0,0]],H06:[[0,3,21],[0,2,0]],H08:[[1.2,.8,25],[0,0,0]],H10:[[4,8,22],[0,0,0]]};
 function pose(shot,f){const [p,t]=poses[shot.id],u=ramp(f,shot.filmFrame,shot.endFrame);return {position:new Vector3(p[0]+.3*(u-.5),p[1],p[2]),target:new Vector3(...t)};}
 let last={};
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f),sceneId=sceneForShot(shot.id),transition=transitionAt(f);let rig=pose(shot,f);
  if(transition?.to.join==='relay'){const a=pose(transition.from,f),b=pose(transition.to,f),q=(1-Math.cos(transition.progress*Math.PI))/2;rig={position:a.position.lerp(b.position,q),target:a.target.lerp(b.target,q)};}
  camera.position.copy(rig.position);camera.lookAt(rig.target);camera.updateMatrixWorld();
  const punch=shot.punch*Math.pow(1-ramp(f,shot.filmFrame,shot.filmFrame+8),3);
  Object.assign(ctx.post,{bloom:1.05,threshold:.88,ca:.012,vignette:.28,grain:.010,exposure:1.08,tint:[1.025,.97,.985],zoom:1+punch});
  objects.forEach(o=>o.visible=false);lines.begin();show(darkAir,{size:.02,bright:.035,colA:[.42,.15,.21],focus:30,aperture:.003},ctx);
  const programBounds=ids.map(id=>({id,minX:0,maxX:0,minY:0,maxY:0,visible:false})),programStates=[];
  let extra={};
  if(sceneId==='signal-node')drawNode(ctx,f);
  else if(sceneId==='source-detail')drawSource(ctx,f);
  else if(sceneId==='queued-slips')drawOutbox(ctx,f);
  else if(sceneId==='volatile-store')drawMemory(ctx,f);
  else if(sceneId==='missed-join')drawGap(ctx,f);
  else if(sceneId==='sample-engine')drawSampler(ctx,f);
  else if(sceneId==='closing-seam')drawSeam(ctx,f);
  else if(sceneId==='target-name')drawTarget(ctx,f);
  else if(sceneId==='empty-station'){extra=drawEmpty(ctx,f);programBounds[2]=extra.bounds;programStates.push({id:'cross',visible:extra.bounds.visible,opacity:extra.opacity,progress:1,closing:extra.opacity>0&&extra.opacity<1});}
  lines.end(ctx);ctx.draw(scene,camera);
  last={referenceId:shot.referenceId,transition:transition?{from:transition.from.referenceId,to:transition.to.referenceId,type:transition.to.join,progress:transition.progress}:null,camera:{set:sceneId+'/'+shot.id,position:camera.position.toArray(),target:rig.target.toArray(),fov:camera.fov,travel:0},programBounds,programStates,abyssBounds:[],worldScale:[1,1,1],blackHold:false,fracture:null,particleCount:objects.filter(o=>o.visible).reduce((n,o)=>n+(o.geometry.getAttribute('position')?.count??0),0),geometry:sceneId,insert:{subject:sceneId,fullHeartShown:false,...extra}};
 }
 return {draw,get last(){return last;}};
}
