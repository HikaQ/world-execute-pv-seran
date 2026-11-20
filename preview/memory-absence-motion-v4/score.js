import {at as acceptedAt,CUTS as acceptedCuts} from '../memory-clock-v7/score.js';
export const FPS=60,FIRST=5844,END=7861,START=FIRST/FPS,FINISH=END/FPS;
export const clamp=x=>Math.max(0,Math.min(1,x));
export const mix=(a,b,u)=>a+(b-a)*u;
export const phase=(t,a,b)=>clamp((t-a)/(b-a));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const entries=[
 [6067,'index-front','pre2/formation'],[6118,'index-side','pre2/formSide'],[6186,'index-query','pre2/swap'],[6228,'index-route','pre2/braid'],[6261,'index-lead','pre2/lead'],
 [6281,'corridor-gate','pre2/gate'],[6339,'index-micro','pre2/moire'],[6367,'hit-detail','pre2/moireMacro'],[6405,'corridor-dive','pre2/tunnel'],
 [6533,'resonance-oblique','c2/plate'],[6588,'resonance-top','c2/blueprint'],[6644,'resonance-low','c2/plate2'],[6699,'resonance-impact','c2/vibrations'],
 [6753,'read-slice','c2/strings'],[6781,'return-bus','c2/spectrum'],[6809,'writeback','c2/scope'],[6837,'mode-lock','c2/thermal'],[6865,'complete-build','c2/panel'],[6933,'complete-impact','c2/completion'],
 [6976,'link-loss','c2/rise'],[7059,'empty-port','c2/ping'],[7114,'unanswered-channel','c2/search2'],[7168,'queue-stack','c2/search3'],[7222,'local-only','c2/search4'],[7280,'queue-pressure','c2/prompt'],[7363,'isolation','c2/isolation'],
 [7419,'cache-whole','c2x/memory'],[7480,'cache-erase','c2x/defrag'],[7530,'cache-profile','c2x/defragIso'],[7558,'cache-dissolve','c2x/dissolve'],[7611,'cache-fragments','c2x/fragments'],[7641,'cache-drift','c2x/drift'],[7695,'cache-align','c2x/assemble'],[7751,'retry-port','c2x/heart'],[7779,'retry-empty','c2x/crack'],[7819,'no-reply','c2x/dishearten'],[7848,'departure','c2x/land']
];
const relays=new Set(['index-side','index-query','index-route','index-lead','retry-empty','departure']);
export const CUTS=[...acceptedCuts.map(x=>({...x,accepted:true})),...entries.map(([frame,id,reference])=>({frame,id,reference,join:relays.has(id)?'relay':'cut'}))];
function vector(a,b,u){return a.map((x,i)=>mix(x,b[i],u));}
// Time-aware cubic interpolation keeps a moving camera moving through relay cues.
function path(t,keys){
 let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],prev=keys[Math.max(0,i-1)],next=keys[Math.min(keys.length-1,i+2)],dt=b[0]-a[0],u=phase(t,a[0],b[0]);
 return a[1].map((x,k)=>{const m0=(b[1][k]-prev[1][k])/(b[0]-prev[0]),m1=(next[1][k]-a[1][k])/(next[0]-a[0]);return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*dt*m0+(-2*u**3+3*u*u)*b[1][k]+(u**3-u*u)*dt*m1;});
}
export function at(t){
 t=Math.max(START,Math.min(FINISH-1/60,t));if(t<6067/60)return {...acceptedAt(t),accepted:true};
 const f=t*60;let i=0;while(i<entries.length-1&&f>=entries[i+1][0])i++;
 const [start,shot]=entries[i],end=entries[i+1]?.[0]??END,u=phase(f,start,end);
 let id,geometryTime=t,camera,target=[0,0,0],fov=42,formula='';
 if(f<6281){
  id='index';formula=f<6186?'q = read(memory)':'top_k(q · vᵢ, 3)';
  camera=path(f,[[6067,[0,0,42.9]],[6118,[21,12,29]],[6186,[23,29,15]],[6228,[13,20,13]],[6261,[5,8,18]],[6281,[0,4,21]]]);
  target=path(f,[[6067,[0,0,0]],[6118,[0,0,-8]],[6186,[0,0,-14]],[6281,[0,-1,-23]]]);fov=39;
 }else if(shot==='index-micro'||shot==='read-slice'){
  id='index';geometryTime=103.2+u*.4;camera=vector([19,5,0],[17,3,-2],u);target=[-2,0,-13];fov=44;formula='q · vᵢ';
 }else if(shot==='writeback'){
  id='write';geometryTime=99.3+mix(7,17,u)/5.2;camera=[19,11,27];target=[4,-.3,2];fov=37;formula='write(memory.md)';
 }else if(['corridor-gate','hit-detail','corridor-dive','return-bus','unanswered-channel'].includes(shot)){
  id='corridor';formula='top_k(q · vᵢ, 3)';
  if(shot==='corridor-gate'){camera=vector([0,4,29],[0,3,24],u);target=[0,0,-28];fov=48;}
  if(shot==='hit-detail'){camera=vector([3,5,-1],[1,4,-3],u);target=[-8,1,-13];fov=44;}
  if(shot==='corridor-dive'){camera=[0,2,mix(18,-18,u)];target=[0,-2.5,mix(-26,-54,u)];fov=55;}
  if(shot==='return-bus'){camera=[18,6,-12];target=[0,-4,-30];fov=46;geometryTime=108.1+u*.4;}
  if(shot==='unanswered-channel'){camera=[0,3,mix(18,6,u)];target=[0,-2,-55];fov=57;formula='await response';}
 }else if(shot.startsWith('resonance')||shot==='mode-lock'){
  id='resonance';formula='∇²u + k²u = 0';
  if(shot==='resonance-oblique'){camera=vector([20,28,25],[18,27,24],u);fov=46;}
  if(shot==='resonance-top'){camera=[0,48-u*2,.01];fov=44;}
  if(shot==='resonance-low'){camera=vector([18,22,25],[16,21,24],u);fov=46;}
  if(shot==='resonance-impact'){camera=[3,26-u*2,30-u*2];fov=49;target=[0,3,0];}
  if(shot==='mode-lock'){camera=[0,43,.01];fov=47;geometryTime=111.9+u*.2;}
 }else if(shot.startsWith('complete')){
  id='complete';formula='memory ← memory ∪ result';
  camera=shot==='complete-build'?vector([25,19,31],[23,18,29],u):vector([19,19,31],[18,18,30],u);target=[0,1,0];fov=42;
 }else if(shot.startsWith('queue')){
  id='queue';formula='pending += 1';
  camera=shot==='queue-stack'?vector([17,7,25],[15,7,24],u):vector([9,7,22],[7,8,20],u);target=shot==='queue-stack'?[0,0,0]:[0,4,0];fov=44;
 }else if(shot==='isolation'){
  id='isolation';camera=[-22,28,75];target=[0,8,0];fov=49;
 }else if(shot.startsWith('cache')){
  id='cache';formula='cache := unique(cache)';
  const poses={
   'cache-whole':[[8,4,43],[7,4,41],[0,0,-3],44],
   'cache-erase':[[18,7,25],[16,6,24],[1,0,-3],44],
   'cache-profile':[[34,6,8],[32,5,7],[0,0,-4],48],
   'cache-dissolve':[[10,4,24],[8,3,22],[1,0,-3],48],
   'cache-fragments':[[14,7,31],[13,7,30],[1.3,1,-2],43],
   'cache-drift':[[25,9,20],[24,8,19],[1,0,-3],45],
   'cache-align':[[7,3,39],[5,3,37],[0,0,-3],43]};
  const v=poses[shot];camera=vector(v[0],v[1],u);target=v[2];fov=v[3];
 }else if(f>=7819){
  id='boundary';camera=[0,0,32];target=[0,0,0];fov=46;
 }else{
  id='link';formula='await response';
  if(shot==='link-loss'){camera=vector([22,13,28],[21,13,27],u);target=[0,1,0];fov=42;}
  if(shot==='empty-port'){camera=vector([18,12,19],[17,11,18],u);target=[12,1,0];fov=40;}
  if(shot==='local-only'){camera=[0,30,.01];target=[0,0,0];fov=48;}
  if(f>=7751){camera=path(f,[[7751,[21,10,42]],[7779,[18,11,43]],[7819,[14,12,45]],[7861,[10,13,46]]]);target=[0,1,0];fov=46;}
 }
 return {id,shot,time:t,geometryTime,formula,view:{camera,target,fov,shot,filmTime:t},accepted:false};
}
