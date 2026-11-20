import {Scene,PerspectiveCamera,Vector3,GlowLines,cloud,glyph,Laminate,seeded,sheetShape,RED,HOT,DARK,mul,mix,clamp,setCamera,post,screen} from './scene-kit.js';
import {SOURCES,SNAPSHOT,releasedCells,ERASE_CUTS,shotAt} from '../refinement-possession-v19/score.js';
const specs={
 R11:{p:[12,8.2,24],target:[0,0,0],drift:[-.25,0,-.15]},
 R12:{p:[6.5,4.5,20],target:[0,0,0],drift:[-.20,0,-.12]},
 R13:{p:[-.5,1.8,19],target:[0,0,0],drift:[-.16,0,-.10]},
 R14:{p:[1.6,1,15.8],target:[0,0,0],drift:[-.22,0,-.12]},
 R15:{p:[4.5,2.8,22],target:[0,0,0],drift:[-.35,0,-.25],fov:34},
 R16:{p:[8.5,12,23],target:[0,0,0],drift:[-.22,0,-.10]},
 R17:{p:[4,9,18],target:[0,0,0],drift:[-.18,0,-.10]},
 R18:{p:[-2.5,7.5,23],target:[0,0,0],drift:[-.15,0,-.10]}
};
function encoded(text){const b=Array.from(new TextEncoder().encode(text));return Array.from({length:50},(_,j)=>`${(j*16).toString(16).padStart(4,'0')}  `+Array.from({length:16},(_,i)=>b[(j*16+i)%b.length].toString(16).padStart(2,'0')).join(' ')).join('\n');}
export function createMemoryScenes(background){
 const scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(24000),objects=[];scene.add(lines.mesh);
 function body(key,N,gen,Class){const p=cloud(scene,key,N,gen,Class);objects.push(p.s.points);return p;}
 function text(key,content,layout,count=4096){const p=glyph(scene,key,content,layout,count);objects.push(p.g.points);return p;}
 function show(p,params,ctx,focus){p.s.points.visible=true;p.s.set({a:p.a,t:ctx.t,focus,aperture:.010,maxBlur:18,...params},camera,ctx.H);}
 function showText(p,params,ctx,focus){p.g.points.visible=true;p.g.set({a:p.a,t:ctx.t,focus,aperture:.010,maxBlur:18,...params},camera,ctx.H);}
 const plates=SOURCES.map((source,i)=>{
  const surface=body('archive-'+i,16384,N=>sheetShape(N,{seed:590+i,width:10.6,height:5.5,bend:.10,grid:.055}),Laminate);
  const chars=text('archive-data-'+i,`${source.id}\n${encoded(source.en)}`,{origin:[-5,2.4,-.06],cell:.13,cols:78,rows:40});
  const p=[.18*Math.sin(i*.9),(i-6)*.72,(i-6)*.38+(i===2?1.2:0)];
  for(const o of [surface.s.points,chars.g.points]){o.position.set(...p);o.rotation.x=-.95;o.updateMatrixWorld();}
  return {surface,chars,p,id:source.id};
 });
 const sheet=body('identity-sheet',65536,N=>sheetShape(N,{seed:293,width:12.6,height:7.6,bend:.10,grid:.035}),Laminate);
 const sourceTexture=text('identity-bytes',encoded(SOURCES[2].en),{origin:[-5.8,-.35,-.06],cell:.16,cols:78,rows:19});
 const identity=text('identity-code','agent = "SERAN";\ncreator = "HIKAQ";',{origin:[-5.5,2.15,.04],cell:.44,cols:30,rows:5});
 const outbox=SNAPSHOT.outbox.map((q,i)=>{
  const surface=body('queue-surface-'+i,16384,N=>sheetShape(N,{seed:70+i,width:3.2,height:5.2,bend:.065,grid:.035}),Laminate);
  const chars=text('queue-data-'+i,`${q.id}\n\n${encoded(q.text)}`,{origin:[-1.4,2.1,-.04],cell:.10,cols:27,rows:42});
  const p=[(i-2)*4.15,0,(i-2)*.62];
  for(const o of [surface.s.points,chars.g.points]){o.position.set(...p);o.rotation.y=-.10;o.updateMatrixWorld();}
  return {surface,chars,p,q};
 });
 const board=body('memory-base',65536,N=>{const a=sheetShape(N,{seed:491,width:16.4,height:12.4,bend:.06,grid:.07});for(let i=0;i<N;i++){const y=a[i*4+1];a[i*4+1]=-.35+a[i*4+2];a[i*4+2]=y;}return a;},Laminate);
 const cells=body('memory-cells',147456,N=>{const r=seeded(721),a=new Float32Array(N*4);for(let i=0;i<N;i++){const k=i%192,x=(k%16-7.5)*.88,z=(Math.floor(k/16)-5.5)*.88,face=Math.floor(i/192)%3;let dx=(r()-.5)*.55,dz=(r()-.5)*.55,y=r()*.55;if(face===0)y=.55;else if(face===1)dx=.275;else dz=.275;a.set([x+dx,y,z+dz,1-(k+.5)/192],i*4);}return a;});
 let last={};
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f),pose=setCamera(camera,specs,f),family=f<10604?'archive':f<10639?'source-detail':f<10686?'queued-slips':'volatile-store';
  objects.forEach(o=>o.visible=false);post(ctx);background.draw(ctx,camera,'memory');lines.begin();let focus,core;
  if(family==='archive'){
   focus=camera.position.distanceTo(new Vector3(...plates[2].p));
   plates.forEach(({surface,chars,p},i)=>{
    const gain=i===2?1:.28+.26*Math.exp(-(((i-5)/3)**2));
    show(surface,{size:.028,minPx:.9,bright:.24*gain,colA:RED,extent:[5.3,2.75,0],scan:i===2?1.1-2.2*clamp((f-10519)/85):3},ctx,focus);
    showText(chars,{size:.112,bright:.35*gain,palette:i===2?[1,.28,.34]:[.62,.07,.11]},ctx,focus);
    const a=new Vector3(-5.25,2.7,-.02).applyMatrix4(surface.s.points.matrixWorld).toArray(),b=new Vector3(5.25,2.7,-.02).applyMatrix4(surface.s.points.matrixWorld).toArray();
    lines.segment(a,b,{color:mul(RED,.12*gain),width:1});
   });
   const p=plates[2].surface.s.points;core=p.localToWorld(new Vector3(-5,2.35-4.7*clamp((f-10519)/85),.02)).toArray();
   lines.segment(core,core,{color:mul(HOT,.85),width:7});
  }else if(family==='source-detail'){
   focus=camera.position.distanceTo(new Vector3(0,0,0));
   show(sheet,{size:.029,bright:.21,colA:RED,extent:[6.3,3.8,0],scan:1.05-2.1*clamp((f-10604)/35)},ctx,focus);
   showText(sourceTexture,{size:.145,bright:.24,palette:[.75,.07,.12]},ctx,focus);
   showText(identity,{size:.43,bright:.65,palette:[1,.38,.43],aperture:.004},ctx,focus);
   const y=3.4-6.8*clamp((f-10604)/35);lines.segment([-6,y,.06],[6,y,.06],{color:mul(RED,.23),width:1.2});core=[6,y,.06];lines.segment(core,core,{color:mul(HOT,.7),width:6});
  }else if(family==='queued-slips'){
   focus=camera.position.distanceTo(new Vector3(...outbox[2].p));
   outbox.forEach(({surface,chars,p},i)=>{
    const gain=i===2?1:.64;
    show(surface,{size:.032,bright:.26*gain,colA:RED,extent:[1.6,2.6,0],scan:3},ctx,focus);
    showText(chars,{size:.095,bright:.43*gain,palette:[1,.20,.28]},ctx,focus);
    const a=surface.s.points.localToWorld(new Vector3(-1.35,2.35,.025)).toArray(),b=surface.s.points.localToWorld(new Vector3(1.35,2.35,.025)).toArray();
    lines.segment(a,b,{color:mul(RED,.20*gain),width:1});
   });core=[0,2.35,.08];lines.segment(core,core,{color:mul(HOT,.75),width:6.5});
  }else{
   focus=camera.position.distanceTo(new Vector3(0,.3,0));const released=releasedCells(f),left=192-released;
   show(board,{size:.028,bright:.055,colA:DARK,extent:[8.2,6.2,0],scan:3},ctx,focus);
   show(cells,{reveal:left/192,revealBy:'w',size:.026,bright:.32,colA:RED,aperture:.009},ctx,focus);
   for(let row=0;row<12;row++)for(let col=0;col<16;col++){
    const k=row*16+col,x=(col-7.5)*.88,z=(row-5.5)*.88,c=mul(RED,k<released?.018:.075);
    lines.polyline([[x-.3,-.12,z-.3],[x+.3,-.12,z-.3],[x+.3,-.12,z+.3],[x-.3,-.12,z+.3],[x-.3,-.12,z-.3]],{color:c,width:.8});
   }
   const z=(Math.floor(released/16)-5.5)*.88;lines.segment([-7.2,.65,z],[7.2,.65,z],{color:mul(HOT,.5),width:1.8});core=[7.2,.65,z];
  }
  lines.end(ctx);ctx.draw(scene,camera);
  last={scene:family,camera:{...pose,redCore:{worldPosition:core,screen:screen(camera,core)}},transition:pose.relay,
   detail:{family,sourceRecords:13,sourceIds:SOURCES.map(s=>s.id),selectedSource:'m003',queuedMessages:5,delivered:0,read:0,releasedCells:releasedCells(f),remainingCells:192-releasedCells(f),releaseCues:ERASE_CUTS,material:'original Laminate / Swarm / GlyphField',sourceContentUnchanged:true,focusDepth:focus,hardOpaqueRectangles:false},particleCount:objects.filter(o=>o.visible).reduce((n,o)=>n+o.geometry.attributes.position.count,0)};
 }
 return {draw,get last(){return last;}};
}
