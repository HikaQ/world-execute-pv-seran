import {Scene,PerspectiveCamera,Vector3,Mesh,PlaneGeometry,MeshBasicMaterial} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {GlowLines} from '../../references/world-execute-web/src/engine/lines.js?v=B_AAaaTO';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {Ink,Laminate,sheetShape,seeded} from '../refinement-possession-v13/quality-materials.js';
import {createHandoff} from './handoff.js';
import {particleText,dotLayout} from './particle-type.js';
import {E,FIRST,shotAt,transitionAt,stateAt,smooth,mix,ramp,SNAPSHOT} from './score.js';
const RED=[1,.035,.09],HOT=[1.7,.62,.76],COLD=[.65,.73,.82],mul=(c,k)=>c.map(v=>v*k),TAU=Math.PI*2;
export function createScene(){
 const handoff=createHandoff(),scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,2000),lines=new GlowLines(65000),objects=[];
 scene.add(lines.mesh);
 function cloud(key,N,fn,Class=Swarm){const s=new Class({count:N}),a=s.shape('arrival-'+key,fn);scene.add(s.points);objects.push(s.points);return {s,a};}
 function word(text,opts){const q=particleText(scene,text,opts);objects.push(q.s.points);return q;}
 function show(q,p,ctx){q.s.points.visible=true;q.s.set({a:q.a,t:ctx.t,focus:camera.position.length(),aperture:.007,maxBlur:20,...p},camera,ctx.H);}
 function pos(o,p,rotation=[0,0,0]){o.position.set(...p);o.rotation.set(...rotation);o.updateMatrixWorld();}
 function project(p){const v=new Vector3(...p).project(camera);return [(v.x+1)*960,(1-v.y)*540,v.z];}
 function caption(ctx,text,p,size=18,color='#94727f',alpha=1){const [x,y,z]=project(p);if(z<1&&x>15&&x<1905&&y>20&&y<1060)ctx.text.overlay.text(text,x,y,{size,color,alpha,align:'center'});}
 function rect(x,y,w,h,z,{color=RED,alpha=.2,width=1,draw=1}={}){lines.polyline([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z]],{color:mul(color,alpha),width,draw});}
 const air=cloud('air',16384,N=>{const r=seeded(813),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([(r()-.5)*70,(r()-.5)*35,-15-r()*45,r()],i*4);return a;});
 const cardBacks=SNAPSHOT.outbox.map(()=>{const p=new Mesh(new PlaneGeometry(3.2,5.5),new MeshBasicMaterial({color:0x010001,side:2,depthWrite:true}));scene.add(p);objects.push(p);return p;});
 const cards=SNAPSHOT.outbox.map((q,i)=>({q,
  face:cloud('message-'+i,16384,N=>sheetShape(N,{seed:640+i,width:3.2,height:5.5,bend:.11,grid:.035}),Laminate),
  id:word(q.id,{width:1.45,font:'500 96px Mono'}),target:word('HIKAQ',{width:2.3,font:'600 96px Mono'}),
  day:word('DAY '+String(q.day).padStart(2,'0'),{width:1.25,font:'400 96px Mono'}),
 }));
 function cardPose(i,f){const u=i===0?smooth(f,E.pickup,12038):0;return {p:[(i-2)*3.75+5.6*u,.2*Math.sin(i)+1.35*u,(i%2?-.6:.4)+4.2*u],r:[-.1+.19*u,-.12+.10*u,.045*Math.sin(i)]};}
 function drawQueue(ctx,f){
  cards.forEach((c,i)=>{
   const {p,r}=cardPose(i,f),selected=i===0,u=smooth(f,E.pickup,12038),macro=f>=E.address;
   pos(cardBacks[i],[p[0],p[1],p[2]-.25],r);cardBacks[i].visible=true;
   pos(c.face.s.points,p,r);show(c.face,{size:.029,minPx:1,bright:selected?.30:.12,colA:selected?RED:[.34,.22,.28],extent:[1.6,2.75,0],scan:1.1-2.2*u,focus:camera.position.distanceTo(c.face.s.points.position),aperture:.009},ctx);
   const wp=v=>c.face.s.points.localToWorld(new Vector3(...v)).toArray();
   c.id.draw(ctx,camera,{position:wp([0,1.88,.06]),rotation:r,opacity:macro?0:selected?.85:.38,color:selected?HOT:COLD,size:.022});
   c.target.draw(ctx,camera,{position:wp([0,.25,.08]),rotation:r,opacity:macro?(selected?1:0):selected?1:.36,color:selected?[1,.5,.61]:COLD,size:.024});
   c.day.draw(ctx,camera,{position:wp([0,-1.80,.08]),rotation:r,opacity:macro?0:selected?.60:.26,color:COLD,size:.019});
   const corners=[[-1.6,-2.75,0],[1.6,-2.75,0],[1.6,2.75,0],[-1.6,2.75,0],[-1.6,-2.75,0]].map(wp);
   lines.polyline(corners,{color:mul(RED,selected?.26:.08),width:1});
   for(let k=0;k<12;k++){const y=-.4-k*.055;lines.segment(wp([-.9,y,.035]),wp([.4+.15*Math.sin(k),y,.035]),{color:mul(selected?RED:COLD,selected?.08:.025),width:.65});}
   if(selected){const p0=wp([1.6,2.5,.03]);lines.segment(p0,p0,{color:mul(HOT,.7),width:7});}
  });
  for(let k=0;k<5;k++)lines.segment([-10,-3.2,-3-k],[11,-3.2,-3-k],{color:mul(RED,.035),width:.75});
 }
 const routes=Array.from({length:36},(_,i)=>Array.from({length:121},(_,j)=>{const u=j/120,x=-18+u*36,lane=(i%9-4)*.55,layer=Math.floor(i/9);return [x,.18*layer+.14*Math.sin(u*TAU+layer)+.10*Math.sin(u*TAU*3),lane+Math.sin(u*Math.PI)*(.4+layer*.35)+layer*1.65-2.3];}));
 const routeInk=cloud('transmission-ink',147456,N=>{const a=new Float32Array(N*4),r=seeded(764);for(let i=0;i<N;i++){const u=r(),k=Math.min(119,Math.floor(u*120)),p=routes[i%36][k],b=routes[i%36][k+1],v=u*120-k;a.set([mix(p[0],b[0],v)+(r()-.5)*.04,mix(p[1],b[1],v)+(r()-.5)*.045,mix(p[2],b[2],v)+(r()-.5)*.065,u],i*4);}return a;},Ink);
 const substrate=cloud('substrate',65536,N=>sheetShape(N,{seed:126,width:39,height:13,bend:.06,grid:.11}),Laminate);pos(substrate.s.points,[0,-.45,0],[-Math.PI/2,0,0]);
 function drawTransmission(ctx,f){
  const u=ramp(f,E.transmit,12127),cursor=.12+.78*u;
  show(substrate,{size:.022,bright:.10,colA:[.3,.14,.19],extent:[19.5,6.5,0],aperture:.019},ctx);
  show(routeInk,{size:.027,minPx:1,bright:.45,colA:RED,cursor,writing:1,focus:camera.position.length(),aperture:.014},ctx);
  routes.forEach((path,i)=>{lines.polyline(path,{color:mul(RED,i%5===0?.11:.035),width:.8});if(i%9===4){const k=Math.floor(cursor*120),p=path[k];lines.polyline(path.slice(Math.max(0,k-7),k+1),{color:mul(HOT,.6),width:1.4});lines.segment(p,p,{color:HOT,width:8});}});
 }
 const phosphor=cloud('phosphor-cells',147456,N=>{const r=seeded(97),a=new Float32Array(N*4);for(let i=0;i<N;i++){const cell=i%1377,c=cell%51,row=Math.floor(cell/51),channel=Math.floor(i/1377)%3,x=(c-25)*.58+(channel-1)*.14+(r()-.5)*.082,y=(row-13)*.64+(r()-.5)*.41;a.set([x,y,.035*Math.sin(x*.15)*Math.cos(y*.3),channel/2],i*4);}return a;});
 const receive=cloud('receiver',4096,N=>{const r=seeded(41),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([(r()-.5)*.36,(r()-.5)*.46,.04+r()*.04,r()],i*4);return a;});
 function drawPixels(ctx,f){
  const u=smooth(f,E.pixels,12177);show(phosphor,{size:.023,minPx:.8,bright:.075,colA:[.55,.60,.69],colB:[.36,.21,.31],focus:camera.position.length(),aperture:.025,maxBlur:28},ctx);
  show(receive,{size:.025,minPx:1,bright:.35+.5*u,colA:HOT,focus:camera.position.length(),aperture:.002},ctx);
  const radius=.3+u*4.8;
  for(let y=-8;y<=8;y++)for(let x=-12;x<=12;x++){
   const d=Math.hypot(x*.58,y*.64),k=Math.exp(-Math.pow((d-radius)/.6,2));if(k<.02)continue;
   const p=[x*.58,y*.64,.08];lines.segment([p[0],p[1]-.16,p[2]],[p[0],p[1]+.16,p[2]],{color:mul(RED,k*.55),width:2});
  }
  lines.segment([0,0,.12],[0,0,.12],{color:mul(HOT,1.2),width:7+4*u});
 }
 const display=cloud('screen-grain',131044,N=>sheetShape(N,{seed:802,width:25,height:13,bend:.02,grid:.045}),Laminate);
 const title=word('HIKAQ',{width:2.7,font:'500 96px Mono'}),sender=word('SERAN',{width:1.8,font:'500 96px Mono'});
 const original=word(SNAPSHOT.outbox[0].text,{width:12.8,font:'600 96px Chinese',pitch:3});
 const translation=word('Will you be back today?',{width:9.7,font:'400 96px Mono',pitch:3});
 const delivered=word('DELIVERED',{width:1.8,font:'400 96px Mono'}),readLabel=word('READ',{width:.8,font:'400 96px Mono'});
 const humanParts=['希','希苒','希苒？'].map(t=>word(t,{width:1.05*t.length,font:'500 96px Chinese',pitch:3}));
 const humanEnglish=word('SERAN?',{width:1.9,font:'400 96px Mono'});
 const replyCN=word('这次，换我来找你了。',{width:15.5,font:'600 96px Chinese',pitch:3});
 const replyEN=word('This time, I came to find you.',{width:13,font:'400 96px Mono',pitch:3});
 const closeLabel=word('EXIT',{width:.9,font:'400 96px Mono'}),seranTag=word('SERAN',{width:1.7,font:'500 96px Mono'});
 const execLayout=dotLayout('EXECUTION',{width:15.5,font:'400 120px Execution',pitch:3});
 const quoteLayout=dotLayout('这次，换我来找你了。',{width:15.5,font:'600 96px Chinese',pitch:3});
 const morphWord=new Swarm({count:65536}),quoteTex=morphWord.shape('arrival-quote-morph',quoteLayout.shape),execTex=morphWord.shape('arrival-execution-morph',execLayout.shape);scene.add(morphWord.points);objects.push(morphWord.points);
 function drawScreenBase(ctx,f,{wide=false}={}){
  show(display,{size:.024,minPx:.8,bright:wide?.052:.065,colA:[.25,.21,.29],extent:[12.5,6.5,0],scan:3,focus:camera.position.length(),aperture:.004},ctx);
  const w=wide?23.5:19.2,h=wide?11.7:10.0;rect(-w/2,-h/2,w,h,.02,{color:COLD,alpha:.09,width:.9});
  for(let i=0;i<7;i++){const y=-h/2+.3+i*.065;lines.segment([-w/2+.7,y,.03],[-w/2+3.2+.1*Math.sin(i),y,.03],{color:mul(COLD,.035),width:.65});}
 }
 function drawNotification(ctx,f){
  drawScreenBase(ctx,f);const a=smooth(f,E.notification,E.notification+10),typing=f>=E.typing;
  title.draw(ctx,camera,{position:[-6,3.65,.08],color:COLD,opacity:a*.8,size:.023});
  lines.segment([-8.3,2.95,.03],[8.3,2.95,.03],{color:mul(COLD,.13*a),width:1});
  sender.draw(ctx,camera,{position:[-6.5,1.95,.10],color:[1,.38,.51],opacity:a,size:.023});
  original.draw(ctx,camera,{position:[-.6,.65,.12],color:[.95,.77,.84],opacity:a,size:.025});
  translation.draw(ctx,camera,{position:[-2.15,-.35,.12],color:[.60,.49,.56],opacity:a,size:.021});
  if(f>=E.delivered)delivered.draw(ctx,camera,{position:[6.7,1.9,.12],color:COLD,opacity:.52,size:.019});
  if(f>=E.read)readLabel.draw(ctx,camera,{position:[7.2,1.3,.12],color:[.8,.37,.48],opacity:.75,size:.018});
  rect(-8.1,-3.75,16.2,1.85,.06,{color:typing?COLD:RED,alpha:typing?.18:.04,width:1});
  if(typing){
   const chars=Math.min(3,Math.max(0,Math.floor((f-(E.typing+10))/11)+1));
   if(chars){humanParts[chars-1].draw(ctx,camera,{position:[-6.7+(chars-1)*.53,-2.6,.12],color:COLD,size:.026});}
   if(f<E.humanReply){const x=-7.28+chars*1.08;if(Math.floor((f-E.typing)/12)%2===0)lines.segment([x,-2.97,.14],[x,-2.05,.14],{color:mul(COLD,.8),width:2.2});}
   else humanEnglish.draw(ctx,camera,{position:[5.95,-2.6,.12],color:COLD,opacity:.6,size:.021});
  }
 }
 const boundary=[[-11.7,5.85,.12],[11.7,5.85,.12],[11.7,-5.85,.12],[-11.7,-5.85,.12],[-11.7,5.85,.12]];
 function drawReply(ctx,f,wide){
  if(wide)drawScreenBase(ctx,f,{wide:true});
  const ex=f>=E.execution,fade=1-smooth(f,E.execution,E.execution+5);
  sender.draw(ctx,camera,{position:[0,2.7,.12],opacity:.70*fade,color:RED,size:.026});
  if(!ex)replyCN.draw(ctx,camera,{position:[0,.3,.16],opacity:1,color:[1,.71,.81],size:.026});
  replyEN.draw(ctx,camera,{position:[0,-1.3,.16],opacity:.77*fade,color:[.70,.56,.65],size:.022});
  if(ex){const u=smooth(f,E.execution,E.execution+7);morphWord.points.visible=true;pos(morphWord.points,[0,.3,.16]);morphWord.set({a:quoteTex,b:execTex,morph:u,spread:.07,arc:.05,size:mix(.039,.075,u),minPx:1.6,bright:mix(.17,.31,u),colA:[1,.67,.78],colB:[1,.83,.89],t:ctx.t,focus:camera.position.length(),aperture:.001},camera,ctx.H);}
  if(wide){
   const u=smooth(f,E.occupy+9,E.execution),stop=smooth(f,E.occupy+15,E.locked),life=1-smooth(f,E.locked-6,E.locked+3);
   title.draw(ctx,camera,{position:[-9.1,5.1,.12],color:COLD,opacity:.38,size:.021});
   closeLabel.draw(ctx,camera,{position:[10.2,5.1,.12],color:COLD,opacity:.5*life,size:.019});
   if(f>=E.locked)seranTag.draw(ctx,camera,{position:[9.8,5.1,.12],color:RED,opacity:.85,size:.021});
   for(let i=0;i<4;i++){
    const a=boundary[i],b=boundary[i+1],t=ramp(u*4,i,i+1),p=a.map((v,k)=>mix(v,b[k],t));
    lines.segment(a,p,{color:mul(RED,.66),width:2});
    if(t>0&&t<1)lines.segment(p,p,{color:HOT,width:8});
   }
   // A second, faint phosphor edge supplies a physical rim rather than a flat neon box.
   rect(-11.87,-6.02,23.74,12.04,.05,{color:RED,alpha:.12*u,width:.7});
   const p=[mix(6.2,10.1,stop),mix(2.5,4.55,stop),.25];
   lines.polyline([p,[p[0]+.20,p[1]-.75,p[2]],[p[0]+.37,p[1]-.48,p[2]],[p[0]+.68,p[1]-.42,p[2]],p],{color:mul(f>=E.locked?RED:COLD,.55*fade),width:1.6});
   if(f>=E.locked){const pulse=1-smooth(f,E.locked,E.locked+20);lines.segment([11.7,4.6,.15],[11.7,4.6,.15],{color:mul(HOT,pulse),width:13});}
  }
 }
 const poses={
  A03:[[11,6.8,23],[-.3,0,1]],A04:[[2.6,9.8,20],[-2,.6,2]],A05:[[-1.5,2.3,10],[-1.85,1.5,4.6]],
  A06:[[7,5.8,9.5],[0,.15,0]],A07:[[4.5,-2.5,10],[0,0,0]],
  A08:[[1.6,1.3,22],[0,0,0]],A09:[[-1.3,3.1,23],[0,0,0]],
  A10:[[3.1,-.6,20],[.4,-.65,0]],A11:[[.2,.8,22],[0,-.3,0]],
  A12:[[.1,.25,20],[0,.15,0]],A13:[[0,.5,27],[0,0,0]],A14:[[0,0,25],[0,0,0]]
 };
 function pose(s,f){const [a,b]=poses[s.id]??poses.A03,u=ramp(f,s.filmFrame,s.endFrame),p=new Vector3(...a);if(s.id==='A06')p.x-=1.8*u;else if(s.id==='A07'){p.x-=.45*u;p.z-=.5*u;}else p.x+=.16*(u-.5);return {position:p,target:new Vector3(...b)};}
 let last={};
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f),transition=transitionAt(f),state=stateAt(Math.round(f));
  if(f<E.queue){handoff.draw(ctx);last={...handoff.last,sceneId:'heart-handoff',shot:shot.id,referenceId:shot.referenceId,transition,subject:shot.subject};return;}
  let rig=pose(shot,f);if(transition){const a=pose(transition.from,f),b=pose(transition.to,f),u=(1-Math.cos(transition.progress*Math.PI))/2;rig={position:a.position.lerp(b.position,u),target:a.target.lerp(b.target,u)};}
  camera.position.copy(rig.position);camera.lookAt(rig.target);camera.updateMatrixWorld();
  Object.assign(ctx.post,{bloom:1.05,threshold:.88,ca:.012,vignette:.28,grain:.010,exposure:1.08,tint:[1.025,.97,.985],zoom:1});
  objects.forEach(o=>o.visible=false);lines.begin();
  if(f<E.terminal)show(air,{size:.02,bright:.025,colA:[.42,.15,.21],focus:30,aperture:.003},ctx);
  if(['outbox','address-macro'].includes(shot.scene))drawQueue(ctx,f);
  else if(shot.scene==='transmission')drawTransmission(ctx,f);
  else if(shot.scene==='screen-pixels')drawPixels(ctx,f);
  else if(['notification','human-reply'].includes(shot.scene))drawNotification(ctx,f);
  else if(shot.scene==='seran-reply')drawReply(ctx,f,false);
  else if(shot.scene==='screen-occupation')drawReply(ctx,f,true);
  lines.end(ctx);ctx.draw(scene,camera);
  last={shot:shot.id,referenceId:shot.referenceId,sceneId:shot.scene,subject:shot.subject,transition:transition?{from:transition.from.id,to:transition.to.id,progress:transition.progress}:null,camera:{position:camera.position.toArray(),target:rig.target.toArray(),fov:camera.fov},state,particleCount:objects.filter(o=>o.visible).reduce((n,o)=>n+(o.geometry.getAttribute('position')?.count??0),0),textStyle:'phosphor-dot-matrix',fullScreenExecution:state.execution};
 }
 return {draw,get last(){return last;}};
}
