import {Scene,PerspectiveCamera,Vector3,GlowLines,cloud,glyph,Laminate,seeded,sheetShape,RED,HOT,DARK,mul,clamp,post,screen} from '../refinement-possession-rework-v4/scene-kit.js';
import {Ink,ribbonShape} from '../refinement-possession-v19/quality-materials.js';
import {correct,plots} from '../refinement-possession-v19/plot.js';
import {shotAt,plotProgress,E,entryOpacity} from '../refinement-possession-v19/score.js';
import {createAssemblyHeart} from '../refinement-possession-v19/assembly-heart.js';
export const FIRST=10962,END=11419;
const normalize=a=>a.map(([x,y])=>[x,-y,0]);
const paths={seran:normalize(correct),...Object.fromEntries(Object.entries(plots).map(([key,p])=>[key,normalize(p)]))};
const sample=(p,u)=>{const n=clamp(u)*720,i=Math.min(719,Math.floor(n)),a=p[i],b=p[i+1];return a.map((v,k)=>v+(b[k]-v)*(n-i));};
const specs={
 H01:{p:[0,.5,28],target:[0,.5,0],fov:36},
 H03:{p:[0,.4,25.4],target:[0,.4,0],fov:36},
 H04:{p:[0,.4,25.4],target:[0,.4,0],fov:36},
 H05:{p:[1,1,25],target:[1,1,0],fov:36},
 H06:{p:[-.35,2.3,10.5],target:[0,1.6,0],fov:38}
};
export function createLearning(){
 const scene=new Scene(),camera=new PerspectiveCamera(36,16/9,.05,200000),lines=new GlowLines(55000),assembly=createAssemblyHeart();scene.add(lines.mesh);
 const all=[];function add(p){all.push(p.s?.points??p.g.points);return p;}
 const strokes=Object.fromEntries(Object.entries(paths).map(([key,p])=>[key,add(cloud(scene,'learning-'+key,key==='seran'?65536:16384,N=>ribbonShape(N,p,{seed:944,width:key==='seran'?.005:.006}),Ink))]));
 const paper=add(cloud(scene,'learning-coordinate-plane',65536,N=>sheetShape(N,{seed:502,width:28,height:16,bend:0,grid:.14}),Laminate));
 const formulas={
  workshop:add(glyph(scene,'learning-heart-formula','x(t) = 16 sin^3(t)\ny(t) = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)',{origin:[-13.4,7.6,.03],cell:.26,cols:80,rows:4},4096)),
  open:add(glyph(scene,'learning-open-test','|| P(1) - P(0) || > 0',{origin:[-11.3,6.4,.03],cell:.27,cols:50,rows:2},1024)),
  cross:add(glyph(scene,'learning-cross-test','P(t_1) = P(t_2),  t_1 != t_2',{origin:[1.3,6.4,.03],cell:.27,cols:50,rows:2},1024)),
  unstable:add(glyph(scene,'learning-quantized-test','Q(x) = round(x / d) * d',{origin:[-11.3,6.4,.03],cell:.27,cols:50,rows:2},1024)),
  diverge:add(glyph(scene,'learning-divergent-test','x(t) = 1.1t cos(5.4 PI t)\ny(t) = t sin(5.4 PI t)',{origin:[1.3,6.4,.03],cell:.27,cols:50,rows:4},1024)),
  solver:add(glyph(scene,'learning-sample-formula','P(t) = (x(t), y(t))\nt = 0 ... 2 PI',{origin:[-11.6,7.6,.03],cell:.31,cols:46,rows:4},4096)),
  closure:add(glyph(scene,'learning-closure-formula','P(0) = P(2 PI)',{origin:[-5.5,4.6,.05],cell:.23,cols:38,rows:2},1024))
 };
 let programStates=[],programBounds=[],last={};
 function formula(key,ctx){const p=formulas[key];p.g.points.visible=true;p.g.set({a:p.a,size:key==='closure'?.225:key==='solver'?.30:.255,bright:.56,palette:[1,.30,.36],focus:camera.position.length(),aperture:.001,t:ctx.t},camera,ctx.H);}
 function grid(p,scale,{minor=.024,major=.07,extent=1.3}={}){
  for(let i=-5;i<=5;i++){
   const a=i*.25*scale,c=mul(RED,i===0?major:minor),width=i===0?1.15:.65;
   lines.segment([p[0]+a,p[1]-extent*scale,p[2]-.15],[p[0]+a,p[1]+extent*scale,p[2]-.15],{color:c,width});
   lines.segment([p[0]-extent*scale,p[1]+a,p[2]-.15],[p[0]+extent*scale,p[1]+a,p[2]-.15],{color:c,width});
  }
  for(let i=-5;i<=5;i++){const k=i*.25*scale;lines.segment([p[0]+k,p[1]-.05,p[2]-.10],[p[0]+k,p[1]+.05,p[2]-.10],{color:mul(RED,.22),width:1});}
 }
 function pathAt(key,pos,scale){return paths[key].map(v=>v.map((x,i)=>pos[i]+x*scale));}
 function drawStroke(ctx,key,pos,scale,q=1,{gain=1,cursor=q,writing=q<.999?1:0,markers=true,ghost=false}={}){
  const p=strokes[key],v=paths[key];p.s.points.visible=true;p.s.points.position.set(...pos);p.s.points.scale.setScalar(scale);p.s.points.rotation.set(0,0,0);
  p.s.set({a:p.a,reveal:q>=1?1.001:q,revealBy:'w',size:key==='seran'?.020:.018,minPx:.95,bright:(key==='seran'?.50:.36)*gain,colA:key==='seran'?RED:[.66,.12,.17],cursor,writing,seal:0,
   focus:camera.position.distanceTo(new Vector3(...pos)),aperture:.0012,maxBlur:5,t:ctx.t,noise:0},camera,ctx.H);
  const points=pathAt(key,pos,scale),tip=sample(v,cursor).map((x,i)=>pos[i]+x*scale);
  lines.polyline(points,{draw:q,color:mul(key==='seran'?RED:[.75,.16,.22],.19*gain),width:key==='seran'?1.35:1.05});
  if(ghost){const ideal=pathAt('seran',pos,scale);for(let i=0;i<720;i+=20)lines.polyline(ideal.slice(i,i+8),{color:mul(RED,.055),width:.7});}
  if(markers){for(let i=0;i<=Math.floor(q*720);i+=60)lines.segment(points[i],points[i],{color:mul(HOT,.22*gain),width:2.4});}
  if(writing>0)lines.segment(tip,tip,{color:mul(HOT,.80*gain),width:key==='seran'?8:5});
  const visible=points.slice(0,Math.max(2,Math.floor(q*720)+1)).map(p=>screen(camera,p));
  programBounds.push({id:key,minX:Math.min(...visible.map(p=>p[0])),maxX:Math.max(...visible.map(p=>p[0])),minY:Math.min(...visible.map(p=>p[1])),maxY:Math.max(...visible.map(p=>p[1])),visible:q>0});
  programStates.push({id:key,progress:q,cursor,worldTip:tip,visible:q>0,correct:key==='seran'});
  return {points,tip};
 }
 function bracket(p,size=.13,gain=.4){for(const sign of [-1,1]){
  lines.polyline([[p[0]+sign*size,p[1]+size,p[2]],[p[0]+sign*size*1.5,p[1]+size,p[2]],[p[0]+sign*size*1.5,p[1]-size,p[2]],[p[0]+sign*size,p[1]-size,p[2]]],{color:mul(HOT,gain),width:1});
 }}
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f);
  if(shot.id==='H02'){
   assembly.draw({...ctx,t:Math.min(f,11161)/60});const v=assembly.last;
   last={...v,scene:'heart-reassembly',camera:{...v.camera,quaternion:null},detail:{family:'heart-reassembly',originalAssemblyUnchanged:true,actionFrames:18,holdFrames:22},finite:true};return;
  }
  const spec=specs[shot.id];camera.position.set(...spec.p);camera.fov=spec.fov;camera.lookAt(new Vector3(...spec.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
  all.forEach(o=>o.visible=false);lines.begin();post(ctx);programStates=[];programBounds=[];
  paper.s.points.visible=true;paper.s.points.position.set(0,0,-.20);
  paper.s.set({a:paper.a,size:.020,minPx:.75,bright:shot.id==='H06'?.025:.04,colA:DARK,extent:[14,8,0],scan:3,focus:camera.position.length(),aperture:.001,t:ctx.t},camera,ctx.H);
  let core,detail;
  if(shot.id==='H01'){
   const q=plotProgress(f,true),side=plotProgress(f,false),center=[0,.55,0];
   grid(center,4.6,{minor:.021,major:.075});core=drawStroke(ctx,'seran',center,4.6,q,{writing:q<1?1:.12}).tip;
   [['open',-9.8,3.2],['cross',-9.8,-3.1],['unstable',9.8,3.2],['diverge',9.8,-3.1]].forEach(([key,x,y])=>{
    grid([x,y,0],2.05,{minor:.015,major:.05});drawStroke(ctx,key,[x,y,0],2.05,side,{gain:.8});
   });
   formula('workshop',ctx);detail={family:'coordinate-workshop',programCount:5,centralPath:'original correct curve',sameCoordinateScalePerAxis:true};
  }else if(shot.id==='H03'||shot.id==='H04'){
   const keys=shot.id==='H03'?['open','cross']:['unstable','diverge'],q=plotProgress(f,false);
   keys.forEach((key,i)=>{
    const pos=[i?6.7:-6.7,.3,0],scale=4.25;grid(pos,scale,{minor:.022,major:.08});
    const d=drawStroke(ctx,key,pos,scale,q,{gain:1,ghost:key==='open',writing:q<1?.5:0});formula(key,ctx);core=d.tip;
    if(key==='open'){bracket(d.points[0]);bracket(d.tip);}
    if(key==='cross'){bracket(pos,.20,.45);}
    if(key==='unstable')for(let j=0;j<Math.floor(q*720);j+=24)lines.segment(d.points[j],d.points[j],{color:mul(HOT,.45),width:3.2});
    if(key==='diverge'){lines.segment(pos,d.tip,{color:mul(RED,.22),width:.9});bracket(d.tip,.13,.30);}
   });detail={family:'error-comparison',sourcePaths:keys,sourcePathDataUnchanged:true};
  }else if(shot.id==='H05'){
   const pos=[2.7,.4,0],scale=4.45,u=clamp((f-11322)/52);grid(pos,scale,{minor:.025,major:.08});
   const p=drawStroke(ctx,'seran',pos,scale,u,{cursor:u,writing:1,gain:1}),left=-7.5,bottom=-5.5;
   const xHead=[p.tip[0],bottom,.04],yHead=[left,p.tip[1],.04];
   lines.segment([left,bottom,.02],[left,5.2,.02],{color:mul(RED,.46),width:1.7});
   lines.segment([left,bottom,.02],[8.2,bottom,.02],{color:mul(RED,.46),width:1.7});
   lines.segment(xHead,p.tip,{color:mul(RED,.32),width:1.15});lines.segment(yHead,p.tip,{color:mul(RED,.32),width:1.15});
   for(const head of [xHead,yHead]){lines.segment(head,head,{color:mul(HOT,.75),width:6});bracket(head,.14,.45);}
   // Orthogonal displacement values are taken from the same sample as the pen.
   const trailStart=Math.max(0,u-.09),trail=[];for(let j=0;j<=35;j++){const v=sample(paths.seran,trailStart+(u-trailStart)*j/35);trail.push(v.map((x,i)=>pos[i]+x*scale));}
   lines.polyline(trail,{color:mul(HOT,.42),width:2});formula('solver',ctx);core=p.tip;
   detail={family:'orthogonal-sampler',t:u*Math.PI*2,unitPoint:sample(paths.seran,u),worldPoint:p.tip,xHead,yHead,actualCoordinateProjection:true};
  }else{
   const pos=[0,.1,0],scale=5.6,u=clamp((f-11374)/45)*.24;grid(pos,scale,{minor:.018,major:.065});
   const p=drawStroke(ctx,'seran',pos,scale,1,{cursor:u,writing:1,gain:.9}),seam=p.points[0];core=p.tip;
   bracket(seam,.12,.34);const age=f-11374,seal=Math.exp(-age/7);lines.segment(seam,seam,{color:mul(HOT,.55*seal),width:7+5*seal});
   formula('closure',ctx);detail={family:'closing-seam',endpointDistance:Math.hypot(...paths.seran[0].map((x,i)=>x-paths.seran.at(-1)[i])),closed:true,penContinues:true};
  }
  lines.end(ctx);ctx.draw(scene,camera);
  last={scene:detail.family,camera:{position:camera.position.toArray(),target:spec.target,quaternion:camera.quaternion.toArray(),fov:camera.fov,redCore:{worldPosition:core,screen:screen(camera,core)},motion:'held within reference shot'},
   detail,programStates,programBounds,particleCount:all.filter(o=>o.visible).reduce((n,o)=>n+o.geometry.attributes.position.count,0),finite:camera.position.toArray().every(Number.isFinite)};
 }
 return {draw,get last(){return last;}};
}
