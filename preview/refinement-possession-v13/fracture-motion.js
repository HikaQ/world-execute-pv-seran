import {GEO} from './heart-shards.js';
import {qAxis,qMul} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
import {hash,seg} from '../../references/world-execute-web/src/engine/math.js?v=BJIlRm7-';
import {SLIP} from '../../references/world-execute-web/src/ch/c3/fall.js?v=Hm51cYJ-';

export const FRACTURE={assembled:10299,front:10344,local:10354,critical:10409,hold:10462,release:10465,peel:10477,end:10519};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=(f,a,b)=>{const x=clamp((f-a)/(b-a));return x*x*(3-2*x);};
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const axes=GEO.cent.map((p,i)=>unit([Math.sin(i*2.17),Math.cos(i*1.37),.6*Math.sin(i+.3)]));

// Motion source: FrostNova, src/ch/13_c3.js rebuildState(), lines 1238 and 1304-1319.
// Preserve its 15 Hz sample-and-hold hash, occasional 2.6x slips, anisotropic
// translation and in-plane turn. No sine oscillator or between-sample smoothing.
// The reference motion clock is shifted into our existing R07-R09 shot interval.
export const REFERENCE_JITTER={you:171.562,run:172.102,execution:172.982,rate:15};
export function referenceSlip(t,i,J){
 const tick=Math.floor(t*15),S=SLIP[i][0]===tick?SLIP[i]:null;
 const h=k=>S?S[k]:hash(i*17.3+tick*3.71+k*101.9)-.5;
 const big=S?S[5]:hash(i*7.7+tick*13.1)>.88?2.6:1;
 const angle=h(4)*.1*J*big;
 return {t:[h(1)*.06*J*big,h(2)*.06*J*big,h(3)*.035*J],angle,q:qAxis([0,0,1],angle),tick,big};
}
function referenceClock(frame){return REFERENCE_JITTER.you-.05+(Math.min(frame,FRACTURE.hold)-FRACTURE.local)/60;}
function constrained(frame,i){
 const f=Math.min(frame,FRACTURE.hold),t=referenceClock(f),K=REFERENCE_JITTER;
 const J=seg(t,K.you-.05,K.you+.12)*(1+.7*seg(t,K.run,K.execution));
 return {...referenceSlip(t,i,J),J,local:ease(f,FRACTURE.local,FRACTURE.critical),critical:ease(f,FRACTURE.critical,FRACTURE.hold)};
}

// Continue from the last discrete slip. The finite difference spans one 15 Hz
// sample; differentiating inside a held sample would incorrectly give zero.
const loaded=GEO.cent.map((p,i)=>{
 const state=constrained(FRACTURE.hold,i),previous=constrained(FRACTURE.hold-4,i);
 const velocity=state.t.map((v,k)=>clamp((v-previous.t[k])*15*.16,-.6,.6));
 const direction=unit([p[0],(p[1]-.12)*.84,.24*Math.sin(i*1.77)]),speed=1.12+(i%7)*.13;
 return {...state,velocity:direction.map((v,k)=>v*speed+velocity[k]),spin:clamp((state.angle-previous.angle)*15*.10,-1.8,1.8)+(i%2?1:-1)*1.1};
});

export function fractureAt(frame){
 const released=frame>=FRACTURE.release,age=Math.max(0,(frame-FRACTURE.release)/60);
 const stage=frame<FRACTURE.local?'assembled':frame<FRACTURE.critical?'reference-jitter':frame<FRACTURE.hold?'reference-slip':frame<FRACTURE.release?'held-slip':frame<10493?'fracture':'debris';
 const cells=GEO.cent.map((p,i)=>{
  const s=released?loaded[i]:constrained(frame,i);
  if(!released)return {t:s.t,q:s.q,bright:.88+.28*s.critical,heat:.22+.22*s.critical,burst:0,scale:1,seam:.055+.2*s.local+.42*s.critical};
  const t=s.t.map((v,k)=>v+s.velocity[k]*age+(k===1?-1.7*age*age:0));
  const burst=Math.max(0,(frame-FRACTURE.peel-(i%5)*.8)/60)*.9;
  return {t,q:qMul(qAxis(axes[i],s.spin*age),s.q),bright:1.1-.42*ease(age,.22,.95),heat:.48+.3*ease(age,.2,.9),burst,scale:1,seam:(.65+.25*Math.exp(-age*14))*(1-.73*ease(age,.32,.95))};
 });
 const sample=constrained(Math.min(frame,FRACTURE.hold),0);
 return {stage,age,releaseFrame:FRACTURE.release,peelFrame:FRACTURE.peel,referenceJitter:{source:'src/ch/13_c3.js:rebuildState',rate:15,tick:sample.tick,amount:sample.J,clock:referenceClock(frame),turnAxis:[0,0,1]},cells};
}
