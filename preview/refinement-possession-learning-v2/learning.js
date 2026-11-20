import {Scene,PerspectiveCamera,Vector3,GlowLines,Swarm,cloud,glyph,Laminate,seeded,sheetShape,RED,HOT,DARK,mul,clamp,post,screen} from '../refinement-possession-rework-v4/scene-kit.js';
import {Ink,ribbonShape} from '../refinement-possession-v19/quality-materials.js';
import {correct,plots} from '../refinement-possession-v19/plot.js';
import {shotAt} from '../refinement-possession-v19/score.js';
import {createLearning as createPrevious} from '../refinement-possession-learning-v1/learning.js';
import {fieldMesh,fieldHeight} from '../../references/world-execute-web/src/ch/love/field.js';
import {heartLoop,taubin,polarRoot} from '../../references/world-execute-web/src/ch/love/curves.js';

export const FIRST=10962,END=11419;
const TAU=Math.PI*2;
const path=correct.map(([x,y])=>[x,-y,0]),openPath=plots.open.map(([x,y])=>[x,-y,0]);
const mix=(a,b,t)=>a+(b-a)*t;
const sample=(points,u)=>{const n=clamp(u)*(points.length-1),i=Math.min(points.length-2,Math.floor(n));return points[i].map((v,k)=>mix(v,points[i+1][k],n-i));};
const cumulative=[0];for(let i=1;i<path.length;i++)cumulative.push(cumulative.at(-1)+Math.hypot(...path[i].map((v,k)=>v-path[i-1][k])));
function penAt(u){
 const d=clamp(u)*cumulative.at(-1);let lo=0,hi=720;
 while(hi-lo>1){const m=(lo+hi)>>1;if(cumulative[m]<=d)lo=m;else hi=m;}
 const k=(d-cumulative[lo])/(cumulative[hi]-cumulative[lo]);return {u:(lo+k)/720,p:path[lo].map((v,j)=>mix(v,path[hi][j],k))};
}
function sectionAt(z,n=240){
 return Array.from({length:n+1},(_,i)=>{
  const a=-Math.PI/2+i/n*TAU,r=polarRoot((x,y)=>taubin(x,y,z),a,.001,1.8,90);
  return [r*Math.cos(a),r*Math.sin(a),z];
 });
}
function surfaceShape(N){
 const r=seeded(91477),out=new Float32Array(N*4);
 for(let i=0;i<N;i++){
  const y=r()*2-1,a=r()*TAU,s=Math.sqrt(1-y*y),dir=[s*Math.cos(a),y,s*Math.sin(a)];
  let lo=0,hi=2;
  for(let j=0;j<27;j++){const m=(lo+hi)/2;if(taubin(...dir.map(v=>v*m))<0)lo=m;else hi=m;}
  const p=dir.map(v=>v*(lo+hi)/2);out.set([...p,(p[2]+.75)/1.5],i*4);
 }
 return out;
}
class ScanParticles extends Swarm{
 constructor(o){super(o);const m=this.material;
  m.uniforms.uScan={value:-.75};m.uniforms.uScanWidth={value:.10};m.uniforms.uContour={value:0};m.uniforms.uEdgeFade={value:0};
  m.vertexShader=m.vertexShader.replace('void main() {','uniform float uScan, uScanWidth, uContour, uEdgeFade;\nvoid main() {')
   .replace('  if (vis <= 0.)',`float fresh=exp(-pow((p.z-uScan)/uScanWidth,2.));
    float light=.72;
    if(uContour>.5){
      float g=p.x*p.x+p.y*p.y+2.25*p.z*p.z-1., g2=3.*g*g, y2=p.y*p.y, y3=y2*p.y;
      vec3 grad=vec3(2.*p.x*(g2-y3),2.*p.y*g2-3.*p.x*p.x*y2-.3375*p.z*p.z*y2,4.5*p.z*g2-.225*p.z*y3);
      vec3 n=normalize(mat3(modelMatrix)*grad+vec3(0.,.000001,0.));
      vec3 v=normalize(cameraPosition-(modelMatrix*vec4(p,1.)).xyz);
      float facing=max(0.,dot(n,v));
      light=.10+.55*pow(facing,.55)+.35*pow(max(0.,dot(n,normalize(vec3(-.5,.8,1.)))),2.);
    }
    float edge=1.-uEdgeFade*smoothstep(1.25,1.66,max(abs(p.x),abs(p.z)));
    vCol *= (light + fresh*2.6)*edge;
    vCol=mix(vCol,vCol.r*vec3(1.,.29,.35),fresh*.55);
    if (vis <= 0.)`);
  m.needsUpdate=true;
 }
 set(p,c,H){super.set(p,c,H);this.material.uniforms.uScan.value=p.scan??-.75;this.material.uniforms.uScanWidth.value=p.scanWidth??.10;this.material.uniforms.uContour.value=p.contour??0;this.material.uniforms.uEdgeFade.value=p.edgeFade??0;return this;}
}
class ExactInk extends Ink{
 constructor(o){super(o);this.material.vertexShader=this.material.vertexShader.replace('uReveal * 1.02 - .02, uReveal * 1.02','uReveal - .006, uReveal');this.material.needsUpdate=true;}
}
export function createLearning(){
 const previous=createPrevious(),scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(52000);scene.add(lines.mesh);
 const objects=[];const add=p=>{objects.push(p.s?.points??p.g.points??p);return p;};
 const open=add(cloud(scene,'v2-gap-ink',65536,N=>ribbonShape(N,openPath,{seed:978,width:.012}),Ink));
 const solved=add(cloud(scene,'v2-solver-ink',65536,N=>ribbonShape(N,path,{seed:201,width:.009}),ExactInk));
 const paper=add(cloud(scene,'v2-inspection-plate',65536,N=>sheetShape(N,{seed:383,width:34,height:22,bend:0,grid:.16}),Laminate));
 const field=fieldMesh();field.scale.setScalar(5.8);scene.add(field);objects.push(field);
 field.material.uniforms.uLine.value.setRGB(.50,.026,.052);
 field.material.uniforms.uZero.value.setRGB(1.35,.24,.31);
 field.material.uniforms.uFill.value.setRGB(.045,.0015,.004);
 field.material.uniforms.uGridCol.value.setRGB(.20,.008,.018);
 const fieldDust=add(cloud(scene,'v2-function-field',262144,N=>{
  const r=seeded(401),a=new Float32Array(N*4);
  for(let i=0;i<N;i++){const x=(r()-.5)*3.35,z=(r()-.5)*3.3; a.set([x,fieldHeight(x,-z,.53)+.002,z,r()],i*4);}
  return a;
 },ScanParticles));fieldDust.s.points.scale.setScalar(5.8);
 const surface=add(cloud(scene,'v2-taubin-surface',262144,surfaceShape,ScanParticles));
 const rings=Array.from({length:19},(_,i)=>sectionAt(-.62+i/18*1.24));
 const loop=heartLoop(720),gapPos=[2,-2,0],gapScale=8.6;
 const gapWorld=openPath.map(p=>p.map((v,k)=>gapPos[k]+v*gapScale));
 const gapEnds=[gapWorld[0],gapWorld.at(-1)];
 const formulae={
  gap:add(glyph(scene,'v2-gap-formula','|| P(1) - P(0) || > 0',{origin:[-10.5,6.2,.06],cell:.30,cols:55,rows:2},4096)),
  solver:add(glyph(scene,'v2-solver-formula','P(t) = (x(t), y(t))\n0 <= t <= 2 PI',{origin:[-13.3,8.0,.05],cell:.33,cols:58,rows:4},4096)),
  volume:add(glyph(scene,'v2-volume-formula','(x^2 + y^2 + 2.25z^2 - 1)^3\n- x^2 y^3 - 0.1125z^2 y^3 = 0',{origin:[-11,6.7,.05],cell:.27,cols:66,rows:4},4096))
 };
 let last={};
 function text(key,ctx){const p=formulae[key];p.g.points.visible=true;p.g.set({a:p.a,size:key==='solver'?.31:.27,bright:.65,palette:[1,.23,.29],focus:camera.position.length(),aperture:0,t:ctx.t},camera,ctx.H);}
 function setCamera(p,t,fov=38){camera.position.set(...p);camera.fov=fov;camera.lookAt(new Vector3(...t));camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 function particle(p,ctx,settings){p.s.points.visible=true;p.s.set({a:p.a,colA:RED,t:ctx.t,noise:0,sparkle:0,minPx:1,focus:camera.position.length(),aperture:.001,maxBlur:5,...settings},camera,ctx.H);}
 function dot(p,size=8,gain=1){lines.segment(p,p,{color:mul(HOT,gain),width:size});}
 function bracket(p,r,gain=.7){
  for(const s of [-1,1])for(const y of [-1,1])lines.polyline([[p[0]+s*r*.55,p[1]+y*r,p[2]],[p[0]+s*r,p[1]+y*r,p[2]],[p[0]+s*r,p[1]+y*r*.55,p[2]]],{color:mul(RED,gain),width:1.7});
 }
 function arc(p,r,q=1,color=RED,width=1.5){lines.polyline(Array.from({length:65},(_,i)=>[p[0]+Math.cos(i/64*TAU)*r,p[1]+Math.sin(i/64*TAU)*r,p[2]]),{draw:q,color,width});}
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f);
  if(f<11183){previous.draw(ctx);last=previous.last;return;}
  objects.forEach(o=>o.visible=false);lines.begin();post(ctx);
  Object.assign(ctx.post,{ca:.006,bloom:.92,threshold:.90,exposure:1.12,grain:.010});
  const q=(f-shot.frame)/(shot.endFrame-shot.frame-1);let core,detail,target,motion='fixed';
  if(shot.id==='H03'){
   target=[-1.4,1.0,0];setCamera([.4,2.7,17.3],target,38);
   paper.s.points.position.set(0,0,-.12);
   particle(paper,ctx,{size:.025,bright:.05,colA:[.50,.025,.045],extent:[17,11,0],scan:3,aperture:.002});
   open.s.points.position.set(...gapPos);open.s.points.scale.setScalar(gapScale);
   particle(open,ctx,{size:.024,bright:.62,reveal:1.001,cursor:1,writing:0});
   lines.polyline(gapWorld,{color:mul(RED,.36),width:2.2});
   // The ghost follows the exact missing part of the same Fourier contour.
   for(let i=0;i<108;i+=6){const pts=[];for(let j=i;j<=i+2;j++){const p=sample(path,(.81+j/108*.27)%1);pts.push(p.map((v,k)=>gapPos[k]+v*gapScale));}lines.polyline(pts,{color:mul(RED,.13),width:1.2});}
   // A single, constant-speed scan crosses each endpoint at its real x position.
   const scanX=-12+20*q;
   for(let i=0;i<9;i++){const x=scanX-i*.045;lines.segment([x,-9,-.04],[x,7,-.04],{color:mul(RED,(1-i/9)*.18),width:1.5});}
   const events=gapEnds.map(p=>{const hit=(p[0]+12)/20,age=(q-hit)*113/60,seen=age>=0;return {point:p,hitFrame:11183+hit*113,seen,age};});
   events.forEach(e=>{if(e.seen){const pulse=Math.exp(-e.age*5);dot(e.point,8+16*pulse,.80+.55*pulse);bracket(e.point,.20+.35*pulse,.85);arc(e.point,.25+Math.max(0,e.age)*.70,1,mul(RED,.30*Math.exp(-e.age*2)),1.1);}});
   if(events.every(e=>e.seen)){
    const a=gapEnds[0],b=gapEnds[1],lineY=4.2;
    lines.polyline([[a[0],a[1],.02],[a[0],lineY,.02],[b[0],lineY,.02],[b[0],b[1],.02]],{color:mul(RED,.22),width:1.2});
    for(const p of [a,b])lines.segment([p[0]-.12,lineY,.02],[p[0]+.12,lineY,.02],{color:mul(HOT,.75),width:2});
   }
   text('gap',ctx);core=[scanX,2,0];
   detail={family:'gap-inspection',scanX,endpointEvents:events,missingCurveFromOriginal:true,scanVelocity:20/(113/60)};
  }else if(shot.id==='H04'){
   target=[.2,-.6,-.3];setCamera([-9.7+.65*q,9.5,14.8],target,41);motion='constant-speed-translation';
   field.visible=true;field.userData.set({intensity:.78,reveal:6,lit:.15,fade:.014,amp:.53});
   particle(fieldDust,ctx,{size:.018,bright:.25,colA:[.72,.035,.067],scan:-1.6+3.2*q,scanWidth:.08,edgeFade:1,minPx:.85,focus:19.0,aperture:.002});
   // A contour-following signal is bright enough to read during the short insert.
   const scanZ=-1.5+3*q,cut=[];
   for(let j=0;j<=220;j++){const x=-1.7+j/220*3.4;cut.push([x*5.8,(fieldHeight(x,-scanZ,.53)+.009)*5.8,scanZ*5.8]);}
   lines.polyline(cut,{color:mul(HOT,.64),width:2.4});
   const boundary=loop.map(p=>[p[0]*5.8,.014,-p[1]*5.8]);lines.polyline(boundary,{color:mul(RED,.26),width:1.7});
   core=[0,fieldHeight(0,-scanZ,.53)*5.8,scanZ*5.8];
   detail={family:'implicit-heart-landscape',function:'(x^2+y^2-1)^3-x^2*y^3',scanZ,referenceField:true,particleCount:262144};
  }else if(shot.id==='H05'){
   target=[.5,1.1,0];setCamera([.5,1.1,27],target,38);
   const pos=[3,1.4,0],scale=5.8,pen=penAt(q),p=pen.p.map((v,k)=>pos[k]+v*scale),left=-7.5,bottom=-6.2;
   solved.s.points.position.set(...pos);solved.s.points.scale.setScalar(scale);
   particle(solved,ctx,{size:.026,bright:.75,reveal:pen.u>=1?1.001:pen.u,revealBy:'w',cursor:pen.u,writing:1});
   const curve=path.map(v=>v.map((x,k)=>pos[k]+x*scale));
   lines.polyline(curve,{color:mul(RED,.075),width:1.2});lines.polyline(curve,{draw:q,color:mul(RED,.50),width:2.6});
   const xHead=[p[0],bottom,.03],yHead=[left,p[1],.03];
   for(const x of [-7.5,10.3])lines.segment([x,bottom-.22,0],[x,bottom+.22,0],{color:mul(RED,.7),width:1.8});
   lines.segment([left,bottom,0],[10.3,bottom,0],{color:mul(RED,.48),width:2.1});
   lines.segment([left,bottom,0],[left,7.5,0],{color:mul(RED,.48),width:2.1});
   for(let x=-7;x<=10;x+=.5)lines.segment([x,bottom-.07,0],[x,bottom+.07,0],{color:mul(RED,.22),width:1.2});
   for(let y=-6;y<=7;y+=.5)lines.segment([left-.07,y,0],[left+.07,y,0],{color:mul(RED,.22),width:1.2});
   // Retained sample columns make the solved region visible without a dense grid.
   for(let j=0;j<=32;j++){const t=j/32;if(t>q)break;const v=penAt(t).p.map((x,k)=>pos[k]+x*scale);lines.segment([v[0],bottom,0],v,{color:mul(RED,.052),width:1});dot(v,2.5,.22);}
   lines.segment(xHead,p,{color:mul(RED,.60),width:2});lines.segment(yHead,p,{color:mul(RED,.60),width:2});
   for(const h of [xHead,yHead]){bracket(h,.22,.95);dot(h,9,.80);}
   dot(p,14,1.25);arc(p,.25,1,mul(HOT,.5),1.6);text('solver',ctx);core=p;
   detail={family:'orthogonal-solver',t:pen.u*TAU,unitPoint:pen.p,worldPoint:p,xHead,yHead,arcLengthProgress:q,actualCoordinateProjection:true};
  }else{
   target=[.8,.5,0];setCamera([18.4+.50*q,7.4,21.0],target,38);motion='constant-speed-translation';
   const pos=[2.2,.45,0],scale=5.9,progress=clamp(.06+q*1.06),scan=-.75+progress*1.5;
   surface.s.points.position.set(...pos);surface.s.points.scale.setScalar(scale);
   particle(surface,ctx,{size:.022,bright:.80,colA:[1,.065,.11],reveal:progress>=1?1.001:progress,revealBy:'w',scan,scanWidth:.065,contour:1,minPx:.90,focus:27,aperture:.0015});
   const world=p=>p.map((v,k)=>pos[k]+v*scale);
   // Each line is an actual constant-z intersection of the implicit solid.
   rings.forEach((ring,i)=>{if(ring[0][2]<=scan)lines.polyline(ring.map(world),{color:mul(RED,.16),width:1.15});});
   lines.polyline(sectionAt(0).map(world),{color:mul(RED,.13),width:1.2});
   const activeZ=Math.max(-.62,Math.min(.62,scan));
   if(scan<.68){const ring=sectionAt(activeZ);lines.polyline(ring.map(world),{color:mul(HOT,.85),width:3.0});core=world(ring[Math.floor(ring.length*.69)]);dot(core,10,.9);}
   else core=world([0,.8,0]);
   text('volume',ctx);
   detail={family:'particle-volume-scan',function:'Taubin implicit heart',progress,scanZ:scan,sectionZ:activeZ,completed:progress>=1,particleCount:262144};
  }
  lines.end(ctx);ctx.draw(scene,camera);
  last={scene:detail.family,camera:{position:camera.position.toArray(),target,quaternion:camera.quaternion.toArray(),fov:camera.fov,redCore:{worldPosition:core,screen:screen(camera,core)},motion},
   detail,programStates:[],programBounds:[],finite:[...camera.position.toArray(),...core].every(Number.isFinite)};
 }
 return {draw,get last(){return last;}};
}
