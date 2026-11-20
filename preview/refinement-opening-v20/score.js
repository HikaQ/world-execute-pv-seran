import {travel as originalTravel} from '../refinement-opening-v19/score.js';
export const VERSION='refinement-opening-v20',FPS=60,DURATION=35.1,FRAMES=2106,PRELUDE=5.2,ENTER=1216/60;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,t)=>a+(b-a)*t;
// Keep the original vocal cues, with the user's 30-frame picture lead on
// the two construction transitions. The audio remains at its original time.
export const PERSONA_CUES={prepare:(241+312-30)/60,begin:(340+312)/60,creation:(394+312)/60,parameters:(460+312)/60,initialization:(617+312)/60,world:(681+312)/60};
// Anticipate the vocal cue visually: follow the unfolding workspace without
// waiting on an empty red core. The original lyric/audio cues stay unchanged.
export const PERSONA_MOTION={reveal:591/60,revealEnd:675/60,spreadStart:633/60,spreadEnd:699/60};
// L002 starts the construction scene: "[LYRIC OMITTED]" at song 1.95 s.
export const STARTUP_CUES={entry:(117+312-30)/60,shrinkEnd:(198+312-30)/60,memoryStart:6.80,memoryStep:.024,memoryDuration:.28,packetStep:.072,packetDuration:.64,pictureLead:.5};
// A slow luminance-only breath: keep a red floor, and land on the crest at
// Enter so switching to the steady submitted state has no brightness jump.
export const CORE_BREATH={period:1.8,coreMinimum:.55,haloMinimum:.35};
export function coreBreath(t){
 const start=ENTER-8*CORE_BREATH.period,active=t>start&&t<ENTER;
 const wave=active?.5+.5*Math.cos((t-ENTER)*Math.PI*2/CORE_BREATH.period):1;
 return {core:mix(CORE_BREATH.coreMinimum,1,wave),halo:mix(CORE_BREATH.haloMinimum,1,wave),lighting:mix(.65,1,wave),period:CORE_BREATH.period,active};
}
export function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
// Integrate a strictly positive speed profile. This prevents the backwards
// overshoot that position splines can develop before a large acceleration.
export const SPEED_KEYS=[[0,.03],[4.6,.08],[5.2,.2],[9.2,.5],[16.55,.5],[19.55,.65],[ENTER,1.8],[20.75,22],[21.4,58],[22.1,42],[22.8,24],[23.6,18],[29.8,18],[32.5,14],[35.1,9],[37,9]];
// Fixed world-space distances, reached on the actual drum attacks. Quintic
// Hermite segments share velocity and acceleration, including both handoffs.
// The two accepted side excursions keep their original travel and poses.
const d=t=>originalTravel(t).distance;
const acceleration=t=>(originalTravel(t+1e-4).speed-originalTravel(t-1e-4).speed)/2e-4;
export const RHYTHM_TRAVEL=[
 [
  [ENTER,d(ENTER),originalTravel(ENTER).speed,acceleration(ENTER)],
  [1243/60,18.4,42,0],
  [1271/60,d(21.4),58,0],
  [1299/60,59.5,40,0],
  [1327/60,d(22.1215),30,0],
  [1409/60,d(24.65)-25,18,0],
  [1493/60,d(24.65),30,0],
  [1521/60,d(1521/60),18,0],
 ],
 [
  [1880/60,d(1880/60),originalTravel(1880/60).speed,acceleration(1880/60)],
  [1908/60,259.6,18,0],
  [1935/60,d(32.2512),21,0],
  [1963/60,d(32.7156),22,0],
  [1991/60,d(33.1859),22,0],
  [2018/60,284.6,18,0],
  [2047/60,d(34.1205),15,0],
  [2075/60,d(2075/60),12,0],
  [2102/60,d(2102/60),9,0],
  [FRAMES/60,d(FRAMES/60),9,acceleration(FRAMES/60)],
 ],
];
function segment(t,A,B){
 const h=B[0]-A[0],u=clamp((t-A[0])/h),v=A[2]*h,a=A[3]*h*h;
 const P=B[1]-A[1]-v-a/2,V=B[2]*h-v-a,Q=B[3]*h*h-a;
 const c3=10*P-4*V+Q/2,c4=-15*P+7*V-Q,c5=6*P-3*V+Q/2;
 return {distance:A[1]+v*u+a*u*u/2+c3*u**3+c4*u**4+c5*u**5,
  speed:(v+a*u+3*c3*u*u+4*c4*u**3+5*c5*u**4)/h};
}
export function travel(t){
 for(const keys of RHYTHM_TRAVEL)if(t>=keys[0][0]&&t<=keys.at(-1)[0]){
  const i=Math.min(keys.length-2,Math.max(0,keys.findLastIndex(k=>k[0]<=t)));
  return segment(t,keys[i],keys[i+1]);
 }
 return originalTravel(t);
}
export function route(distance){const u=ramp(distance,95,255);return [13*u,3.5*u,13.6-distance];}
export function baseCameraAt(t){const {distance,speed}=travel(t),position=route(distance),target=route(distance+25),fov=38+5*ramp(t,ENTER,21.45)-3*ramp(t,22.0,24.1);return {position,target,fov,distance,speed};}
// Two continuous side views, timed to the reference drum onsets + 5.2 s.
// Orbit the existing beacon; preserve its world trajectory and apparent scale.
export const SIDE_MOVES=[
 {id:'right-of-core',side:'right',start:1521/60,peak:1576/60,end:1630/60,degrees:32},
 {id:'left-of-core',side:'left',start:1770/60,peak:1825/60,end:1880/60,degrees:-26}
];
export function sideMoveAt(t){
 const s=SIDE_MOVES.find(s=>t>s.start&&t<s.end);
 if(!s)return {id:null,side:'center',degrees:0,weight:0};
 const weight=t<=s.peak?ramp(t,s.start,s.peak):1-ramp(t,s.peak,s.end);
 return {id:s.id,side:s.side,degrees:s.degrees*weight,weight};
}
export function cameraAt(t){
 const base=baseCameraAt(t),move=sideMoveAt(t);if(!move.id)return base;
 const back=base.position.map((x,i)=>x-base.target[i]),radius=Math.hypot(...back);
 const horizontal=Math.hypot(back[0],back[2]),right=[back[2]/horizontal,0,-back[0]/horizontal];
 const angle=move.degrees*Math.PI/180;
 const position=base.target.map((x,i)=>x+back[i]*Math.cos(angle)+right[i]*radius*Math.sin(angle));
 return {...base,position};
}
// The title already exists when the sandbox field comes into view. Its larger
// world-space lettering is approached and crossed, never assembled after entry.
export const PARTICLE_TITLE={text:'world.execute(me);',start:1243/60,formed:1243/60,fadeIn:28/60,pass:1493/60,end:1496/60,count:65536,width:22.2};
// Type while the input panel appears, then wait on the completed command.
export const TEST_INPUT={panelStart:18.5,panelReady:18.9,keyFrames:[1110,1118,1126,1134]};
export const CREDITS=[
 {id:'hikaq',start:1513/60,end:26.65,readAt:1521/60,fadeOut:12/60,role:'DIRECTION & PRODUCTION',names:['希克君'],nameSize:210,anchor:[525,520],distance:44,reference:1576/60,inkWidth:260,font:'cjk'},
 {id:'music',start:1596/60,end:28.40,readAt:1604/60,fadeOut:12/60,role:'MUSIC',names:['Mili'],nameSize:240,anchor:[1590,760],distance:80,reference:27.6,inkWidth:140},
 {id:'story',start:1762/60,end:31.15,readAt:1770/60,fadeOut:12/60,role:'STORY & SCREENPLAY',names:['DeepSeek 4.1 Flash'],nameSize:150,anchor:[1075,245],distance:120,reference:1825/60,inkWidth:380},
 {id:'code-heading',roleId:'code-composition',start:1900/60,end:1991/60,readAt:1908/60,fadeOut:12/60,role:'CODE & VISUAL COMPOSITION',names:[],nameSize:150,anchor:[960,185],distance:65,reference:32.5,inkWidth:365},
 {id:'code-left',start:1900/60,end:1991/60,readAt:1908/60,fadeOut:12/60,role:'',names:['GPT-6 Astra Max'],nameSize:150,fontPixels:36,anchor:[370,620],distance:65,reference:32.5,inkWidth:350},
 {id:'code-right',start:1900/60,end:1991/60,readAt:1908/60,fadeOut:12/60,role:'',names:['Claude Opus 5.5 Max'],nameSize:150,fontPixels:36,anchor:[1580,620],distance:65,reference:32.5,inkWidth:350},
];
export const SHOTS=[
 [0,'warning'],[4.6,'dormant-core'],[5.2,'ignition'],[STARTUP_CUES.entry,'allocation'],[PERSONA_CUES.prepare,'prepare-persona'],[PERSONA_MOTION.reveal,'reveal-seran'],[PERSONA_CUES.creation,'object-creation'],[PERSONA_CUES.parameters,'persona-parameters'],[PERSONA_CUES.initialization,'initialize-persona'],[PERSONA_CUES.world,'verify-isolation'],[18.0,'ready'],[TEST_INPUT.panelStart,'typing-test'],[TEST_INPUT.panelReady,'waiting-after-test'],[ENTER,'enter'],[22.4,'sandbox-cosmos'],[25.6,'four-dimensional-lattice'],[29.6,'target-sandbox'],[32.5,'inside-seran'],
].map(([at,id])=>({at,id}));
export const shotAt=t=>SHOTS.findLast(s=>t>=s.at);
