import {Scene,PerspectiveCamera,Vector3,GlowLines,Swarm,cloud,glyph,seeded,RED,HOT,mul,clamp,post,screen} from '../refinement-possession-rework-v4/scene-kit.js';
import {Ink,ribbonShape} from '../refinement-possession-v19/quality-materials.js';
import {shotAt,sideClose,EXIT_FRAMES,loopCycleFrames,E} from '../refinement-possession-v18/score.js';
import {createClosing} from './closing.js';
export const FIRST=11419,END=11858;
const TAU=Math.PI*2,mod=x=>(x%1+1)%1,mix=(a,b,u)=>a+(b-a)*u;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const heart=u=>{const t=u*TAU;return [5.6*Math.sin(t)**3,5.6*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16,.35];};
const orbit=(t,r)=>[r*Math.cos(t),r*Math.sin(t),0];
const difference=t=>[7.2*(.723*Math.cos(t*13/8)-Math.cos(t)),7.2*(.723*Math.sin(t*13/8)-Math.sin(t)),.14];
const START_T=1.1,END_T=START_T+TAU*1.25;
const path=Array.from({length:1201},(_,i)=>difference(END_T*i/1200));
const lanes=[-11,-7.8,7.8,11],ids=['open','cross','unstable','diverge'];
function inject(s,uniforms,header,position='',light=''){
 Object.assign(s.material.uniforms,uniforms);
 s.material.vertexShader=s.material.vertexShader.replace('void main() {',header+'\nvoid main() {')
  .replace('  vec4 mv = modelViewMatrix',position+'\n  vec4 mv = modelViewMatrix')
  .replace('  if (vis <= 0.)',light+'\n  if (vis <= 0.)');s.material.needsUpdate=true;
}
class Readout extends Swarm{
 constructor(o){super(o);inject(this,{uScan:{value:-12},uLock:{value:0}},'uniform float uScan,uLock;','',`
  float strip=exp(-pow((p.x-uScan)/.32,2.));
  float hit=exp(-dot(p.xy-vec2(3.3,.8),p.xy-vec2(3.3,.8))*1.8)*uLock;
  vCol *= .12 + .24*step(p.x,uScan)+3.5*strip+3.*hit;
 `);}
 set(p,c,H){super.set(p,c,H);this.material.uniforms.uScan.value=p.scan;this.material.uniforms.uLock.value=p.lock;return this;}
}
class Boundary extends Swarm{
 constructor(o){super(o);inject(this,{uContact:{value:new Vector3()},uPressure:{value:0}},'uniform vec3 uContact; uniform float uPressure;','',`
  float contactDistance=length(p.xy-uContact.xy);
  float localized=exp(-contactDistance*contactDistance*.72);
  float ripple=pow(.5+.5*cos(contactDistance*18.-uT*10.),8.)*exp(-contactDistance*1.3);
  vCol *= .18+uPressure*(2.4*localized+2.1*ripple);
 `);}
 set(p,c,H){super.set(p,c,H);this.material.uniforms.uContact.value.set(...p.contact);this.material.uniforms.uPressure.value=p.pressure;return this;}
}
class ConfinedFlow extends Swarm{
 constructor(o){super(o);inject(this,{uPhase:{value:0},uTail:{value:.05},uPressure:{value:1}},'uniform float uPhase,uTail,uPressure;',`
  float phase=fract(uPhase-a.w*uTail+1.);
  float angle=phase*6.28318530718;
  vec2 center=vec2(5.6*pow(sin(angle),3.),.35*(13.*cos(angle)-5.*cos(2.*angle)-2.*cos(3.*angle)-cos(4.*angle)));
  float thickness=mix(.075,.30,uPressure);
  float fibre=(mod(i,7.)-3.)*.009;
  p=vec3(center+ a.xy*(.025+.055*a.w)+vec2(fibre,-fibre),.35+a.z*thickness*.5);
 `,`vCol*=.28+.72*pow(1.-a.w,2.);`);}
 set(p,c,H){super.set(p,c,H);this.material.uniforms.uPhase.value=p.phase;this.material.uniforms.uTail.value=p.tail;this.material.uniforms.uPressure.value=p.pressure;return this;}
}
function sphere(N,seed=1){const r=seeded(seed),a=new Float32Array(N*4);for(let i=0;i<N;i++){const z=2*r()-1,t=TAU*r(),rad=Math.pow(r(),.34),s=Math.sqrt(1-z*z)*rad;a.set([s*Math.cos(t),s*Math.sin(t),z*rad,r()],i*4);}return a;}

export function createOutcome(){
 const original=createClosing(),scene=new Scene(),camera=new PerspectiveCamera(38,16/9,.05,200000),lines=new GlowLines(48000);scene.add(lines.mesh);
 const objects=[],add=p=>{objects.push(p.s?.points??p.g.points);return p;};
 const trace=add(cloud(scene,'outcome-v2-relative-orbit',65536,N=>ribbonShape(N,path,{seed:900,width:.035}),Ink));
 const orbitBodies=[7.2,7.2*.723].map((r,i)=>add(cloud(scene,'outcome-v2-orbit-'+i,16384,N=>ribbonShape(N,Array.from({length:721},(_,j)=>orbit(j/720*TAU,r)),{seed:910+i,width:.012}),Ink)));
 const cores=Array.from({length:6},(_,i)=>add(cloud(scene,'outcome-v2-core-'+i,4096,N=>sphere(N,970+i))));
 const readout=add(cloud(scene,'outcome-v2-optical-grating',65536,N=>{
  const r=seeded(116),a=new Float32Array(N*4);for(let i=0;i<N;i++){const col=Math.floor(r()*100),row=Math.floor(r()*36),x=(col-49.5)*.24,y=(row-17.5)*.24;
   const bit=(Math.sin(col*37.7+row*71.3)*193.123)%1;
   a.set([x+(r()-.5)*.14,y+(r()-.5)*(bit>.2?.15:.03),(r()-.5)*.045,(x+12)/24],i*4);}return a;
 },Readout));
 const readCode=add(glyph(scene,'outcome-v2-target-code','target = "HIKAQ";',{origin:[1.7,-2.1,.1],cell:.29,cols:38,rows:2},1024));
 const membranes=[0,.70].map((z,i)=>{
  const p=add(cloud(scene,'outcome-v2-membrane-'+i,65536,N=>{
   const r=seeded(144+i),a=new Float32Array(N*4);for(let j=0;j<N;j++){
    let x,y;do{x=(r()-.5)*30;y=(r()-.5)*18;}while(lanes.some(l=>Math.abs(x-l)<.65&&Math.abs(y)<2.3));
    if(j%3!==0){x=Math.round(x/.15)*.15;y=Math.round(y/.15)*.15;}
    a.set([x,y,z+(r()-.5)*.008,r()],j*4);
   }return a;
  },Boundary));return p;
 });
 const flow=add(cloud(scene,'outcome-v2-confined-stream',16384,N=>sphere(N,778),ConfinedFlow));
 const pressureGrains=add(cloud(scene,'outcome-v2-contact-grains',16384,N=>{
  const r=seeded(779),a=new Float32Array(N*4);for(let i=0;i<N;i++){const ang=r()*TAU,rad=Math.pow(r(),1.4);a.set([Math.cos(ang)*rad,Math.sin(ang)*rad,(r()-.5)*.03,r()],i*4);}return a;
 }));
 const logText=Array.from({length:60},(_,i)=>[
  `t = ${(i*.0625).toFixed(4)};   sample = evaluate(t);`,
  'r = 0.723 * exp(13i*t/8) - exp(i*t);',
  'target = source.lookup("HIKAQ");',
  'queue.push(sample);  await boundary.resolve();',
  'if (!route.open) return runtime.continue();',
  'delivered = 0;  outbox.length = 5;'
 ][i%6]).join('\n');
 const logs=add(glyph(scene,'outcome-v2-depth-log',logText,{origin:[-14,8,0],cell:.23,cols:100,rows:64},16384));
 logs.g.points.position.set(0,0,-22);logs.g.points.rotation.y=.1;
 let last={};
 function cam(p,t,fov=38){camera.position.set(...p);camera.fov=fov;camera.lookAt(new Vector3(...t));camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 function put(p,ctx,s={}){p.s.points.visible=true;p.s.set({a:p.a,t:ctx.t,colA:RED,noise:0,sparkle:0,minPx:1,focus:camera.position.length(),aperture:.002,maxBlur:10,...s},camera,ctx.H);}
 function dot(p,width=9,brightness=1){lines.segment(p,p,{color:mul(HOT,brightness),width});}
 function line(a,b,c=.2,w=1.4){lines.segment(a,b,{color:mul(RED,c),width:w});}
 function outline(p,c=.3,w=1.5){lines.polyline(p,{color:mul(RED,c),width:w});}
 function core(ctx,i,p,r=.17,bright=.75){const a=cores[i];a.s.points.position.set(...p);a.s.points.scale.setScalar(r);put(a,ctx,{size:.018,bright,colA:i===0?HOT:RED,focus:camera.position.distanceTo(new Vector3(...p)),aperture:.002});dot(p,i===0?8:5,bright*(i===0?1:.65));}
 function caption(ctx,s,x=94,y=86){ctx.text.overlay.text(s,x,y,{font:'Mono',size:20,color:'#cf697b',alpha:.85,weight:400,align:'left'});}
 function background(ctx,bright=.055){logs.g.points.visible=true;logs.g.set({a:logs.a,size:.18,bright,palette:[.65,.07,.11],focus:camera.position.length(),aperture:.018,maxBlur:24,t:ctx.t,scroll:[0,(ctx.t-FIRST/60)*.22,0]},camera,ctx.H);}
 function brackets(p,r,c=.65){for(const sx of [-1,1])for(const sy of [-1,1]){line([p[0]+sx*r,p[1]+sy*(r-.20),p[2]],[p[0]+sx*r,p[1]+sy*r,p[2]],c,2.1);line([p[0]+sx*r,p[1]+sy*r,p[2]],[p[0]+sx*(r-.20),p[1]+sy*r,p[2]],c,2.1);}}
 function gates(ctx,f,contact,pressure=0,mode='wide'){
  for(const p of membranes)put(p,ctx,{size:mode==='macro'?.028:.022,bright:mode==='wide'?.15:.22,colA:[.8,.045,.075],contact,pressure,focus:camera.position.distanceTo(new Vector3(...contact)),aperture:mode==='macro'?.008:.003,maxBlur:15});
  for(const z of [0,.70]){
   const layer=z===0?1:.38;
   for(let y=-8.4;y<=8.4;y+=1.2){
    if(Math.abs(y)<2.3){let x=-15;for(const a of lanes){line([x,y,z],[a-.68,y,z],.050*layer,1.1);x=a+.68;}line([x,y,z],[15,y,z],.050*layer,1.1);}
    else line([-15,y,z],[15,y,z],.050*layer,1.1);
   }
   for(let x=-15;x<=15;x+=1.5){if(lanes.every(a=>Math.abs(x-a)>.68))line([x,-9,z],[x,9,z],.035*layer,1);}
   if(mode==='macro')for(const x of [-1.5,6.0])line([x,-9,z],[x,9,z],.35,2.2);
  }
  const programStates=[];
  for(let i=0;i<4;i++){
   const x=lanes[i],age=f-sideClose[i],visible=age<EXIT_FRAMES;
   const before=Math.max(0,age+24),z=age<0?7-before*before/96:1-.5*age-.17*age*age;
   const marker=age<10?.42:.13;
   for(const edge of [-.67,.67]){line([x+edge,-2.3,0],[x+edge,2.3,0],marker,1.8);line([x+edge,-2.3,.7],[x+edge,2.3,.7],marker*.45,1);}
   line([x-.67,2.3,0],[x+.67,2.3,0],marker*.5,1);
   if(mode==='wide'){
    for(const side of [-.67,.67])line([x+side,-2.3,0],[x+side,-2.3,-45],.10,1.4);
    outline([[x-.67,-2.3,-24],[x-.67,2.3,-24],[x+.67,2.3,-24],[x+.67,-2.3,-24]],.12,1.3);
    if(age>=10&&age<54){const zWake=-21-(age-10)*.62;line([x,0,zWake],[x,0,zWake+7],.30*(1-(age-10)/44),2.0);}
   }
   if(visible){core(ctx,i+1,[x,0,z],.14,.56);if(age>-24){const length=Math.min(4.4,.35+Math.max(0,age)*.3);line([x,0,z],[x,0,z+length],.34,2.6);}}
   programStates.push({id:ids[i],visible,exitStart:sideClose[i],exitProgress:clamp(age/EXIT_FRAMES),worldPosition:[x,0,z]});
  }
  return programStates;
 }
 function trapped(ctx,f,u,pressure=0,macro=false){
  const p=heart(u);put(flow,ctx,{size:macro?.015:.018,bright:macro?.36:.48,colA:[.9,.012,.035],phase:u,tail:macro?.065:.055,pressure,focus:camera.position.distanceTo(new Vector3(...p)),aperture:.003});
  core(ctx,0,p,.085,.96);
  if(pressure>0){pressureGrains.s.points.position.set(p[0],p[1],.015);pressureGrains.s.points.scale.set(.9,.4,1);put(pressureGrains,ctx,{size:.018,bright:.045*pressure,colA:RED,focus:camera.position.distanceTo(new Vector3(...p)),aperture:.002});
   for(let k=0;k<3;k++){const r=.22+mod((f-11722)/28+k/3)*1.4;outline(Array.from({length:65},(_,j)=>[p[0]+Math.cos(j/64*TAU)*r,p[1]+Math.sin(j/64*TAU)*r*.62,.025]),.17*pressure*(1-r/1.7),1.2);}}
  return p;
 }
 function draw(ctx){
  const f=Math.round(ctx.t*60),shot=shotAt(f),u=mod((f-E.leave)/loopCycleFrames);
  if(f>=11809){original.draw(ctx);last={...original.last,scene:shot.id==='H12'?'closed-loop-reveal':'original-handoff',finite:true,detail:{family:shot.id==='H12'?'closed-loop-reveal':'original-handoff',originalRendererPreserved:f>=11819,originalHeroAndCameraPreserved:true,lastExitUsesParticleCore:f<11819,fullHeartVisible:true},penPhase:u,loopPeriodFrames:loopCycleFrames};return;}
  objects.forEach(o=>o.visible=false);lines.begin();post(ctx);Object.assign(ctx.post,{ca:.006,bloom:1.10,threshold:.86,grain:.01,exposure:1.13});
  const q=(f-shot.frame)/(shot.endFrame-shot.frame-1);let detail,target,corePosition,motion='fixed',programStates=[];
  if(shot.id==='H07'){
   target=[0,0,0];cam([5,25,33+10*q],target,40);motion='constant-speed-retreat';background(ctx,.14);
   const t=mix(START_T,END_T,q),a=orbit(t*13/8,7.2*.723),b=orbit(t,7.2),delta=difference(t),reveal=t/END_T;
   orbitBodies.forEach((p,i)=>{put(p,ctx,{size:.032,bright:.42,colA:i?[.65,.04,.075]:RED,reveal:1.001,cursor:1,writing:0});outline(Array.from({length:241},(_,k)=>orbit(k/240*TAU,i?7.2*.723:7.2)),i?.24:.38,1.6);});
   put(trace,ctx,{size:.027,bright:.90,reveal,revealBy:'w',cursor:reveal,writing:1,colA:RED});
   lines.polyline(path,{draw:reveal,color:mul(RED,.33),width:2.0});core(ctx,0,delta,.13,1.15);core(ctx,1,a,.15,.62);core(ctx,2,b,.19,.60);
   line(a,b,.12,1.05);line([0,0,.14],delta,.10,1);dot([0,0,0],4,.25);
   for(let k=0;k<64;k++){const v=k/64*TAU;line(orbit(v,7.36),orbit(v,k%4?7.43:7.55),k%4?.14:.34,k%4?1:1.5);}
   caption(ctx,'r(t) = 0.723 e^(13it/8) - e^(it)');
   corePosition=delta;detail={family:'dual-orbit-calculation',angle:t,reveal,orbitA:a,orbitB:b,result:delta,fullHeartVisible:false};
  }else if(shot.id==='H08'){
   target=[0,0,0];cam([0,0,22.5],target,38);
   const scan=-11.8+15.1*clamp(q/.48),lock=smooth((q-.40)/.20),p=[3.3,.8,.12];
   put(readout,ctx,{size:.025,bright:.36,scan,lock,aperture:0});line([scan,-4.45,.06],[scan,4.45,.06],.95,2.1);
   for(let y=-4.4;y<=4.4;y+=1.1)line([-12,y,0],[12,y,0],.055,1);
   for(let x=-12;x<=12;x+=1.2)line([x,-4.4,0],[x,4.4,0],.035,1);
   core(ctx,0,p,.11,.25+lock);brackets(p,1.0-.35*lock,.25+.55*lock);
   readCode.g.points.visible=true;readCode.g.set({a:readCode.a,size:.27,bright:.65*lock,palette:[1,.30,.38],focus:22.5,aperture:0,t:ctx.t},camera,ctx.H);
   corePosition=p;detail={family:'optical-target-readout',scan,lock,target:'HIKAQ',messageDelivered:false,fullHeartVisible:false};
  }else if(shot.id==='H09'){
   target=[0,0,-5];cam([13.5,6.8,24],target,42);background(ctx,.05);
   corePosition=heart(u);programStates=gates(ctx,f,corePosition,.08,'wide');trapped(ctx,f,u,.05);
   caption(ctx,'exit(program);',94,86);
   detail={family:'open-exits',fullHeartVisible:false,boundaryPlanes:[0,.7],firstExit:sideClose[0]};
  }else if(shot.id==='H10'){
   target=[-2.4,1.8,.35];cam([-2.4,3.1,14.2],target,38);background(ctx,.035);
   corePosition=heart(u);const pressure=.45+.55*smooth(q/.32);programStates=gates(ctx,f,corePosition,pressure,'near');trapped(ctx,f,u,pressure);
   caption(ctx,'boundary.contains(me) = true;');
   detail={family:'boundary-contact',pressure,fullHeartVisible:false,boundaryPlanes:[0,.7],coreMovesContinuously:true};
  }else{
   target=[2.6,1.0,.35];cam([15.0,2.5,3.12],target,40);background(ctx,.045);
   corePosition=heart(u);programStates=gates(ctx,f,corePosition,1.25,'macro');trapped(ctx,f,u,1.1,true);
   caption(ctx,'0 < z(me) < 0.70');
   detail={family:'confined-between-membranes',pressure:1.1,fullHeartVisible:false,boundaryPlanes:[0,.7],coreMovesContinuously:true};
  }
  lines.end(ctx);ctx.draw(scene,camera);
  last={scene:detail.family,detail,programStates,camera:{position:camera.position.toArray(),target,quaternion:camera.quaternion.toArray(),fov:camera.fov,motion,redCore:{worldPosition:corePosition,screen:screen(camera,corePosition)}},penPhase:u,loopPeriodFrames:loopCycleFrames,finite:[...camera.position.toArray(),...corePosition].every(Number.isFinite)};
 }
 return {draw,get last(){return last;}};
}
