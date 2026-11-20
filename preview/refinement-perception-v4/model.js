import {eraAt as spatialEraAt} from './spatial-score.js';
import {ramp,mix,clamp,CUES,START,END} from './score.js';
import {wave as oldWave} from '../refinement-geometry-v6/trajectory.js';
export const EXT=Math.PI*3.8,TAU=Math.PI*2;
export const KERNEL=[[-1,0,1],[-2,0,2],[-1,0,1]];
// CNN-style cross-correlation: valid padding, unit stride, no kernel flip.
export function convolve(input){return Array.from({length:input.length-2},(_,y)=>Array.from({length:input[0].length-2},(_,x)=>KERNEL.reduce((s,row,j)=>s+row.reduce((sum,k,i)=>sum+k*input[y+j][x+i],0),0)));}
// A deterministic, sampled one-pole low-pass follows a full-wave rectifier.
// These are illustrative normalized units; there is no claim of hardware simulation.
const N=512,alpha=1-Math.exp(-1/(N*.45)),filtered=new Float64Array(N);
let y=2/Math.PI;
for(let cycle=0;cycle<20;cycle++)for(let i=0;i<N;i++){y+=alpha*(Math.abs(Math.sin(TAU*i/N))-y);if(cycle===19)filtered[i]=y;}
export const POWER={mean:Array.from(filtered).reduce((a,b)=>a+b,0)/N,ripple:Math.max(...filtered)-Math.min(...filtered),sampleRate:N,alpha};
export function filteredAt(phase){const q=((phase%1)+1)%1*N,i=Math.floor(q),u=q-i;return mix(filtered[i%N],filtered[(i+1)%N],u);}
export function currentY(x,t){
 const phase=(x+EXT)/(2*EXT)*2.3-(t-START)*.35;
 const ac=2.4*Math.sin(TAU*phase),rect=Math.abs(ac);
 const mode=ramp(t,51.43,51.98),filter=ramp(t,51.98,52.72);
 const current=mix(mix(ac,rect,mode),2.4*filteredAt(phase),filter);
 return mix(oldWave(x,START),current,ramp(t,START,50.5));
}
export const ERA_MARKS=[{label:'A.D. 2026',year:2026},{label:'A.D. 1000',year:1000},{label:'A.D. 1',year:1},{label:'B.C. 1',year:-1},{label:'B.C. 1000',year:-1000}];
export function eraAt(t){return spatialEraAt(t);}
export function stateAt(t){
 const correction=ramp(t,55.72,56.48),scan=clamp((t-53.35)/1.95),attach=ramp(t,60.5,63.95);
 return {active:t>=START,phase:t<53.083333?'power':t<55.066667?'vision':t<56.816667?'calibrate':t<60.5?'chronology':'context',correction,scan,viewerLeftEye:correction>.999?'violet':'red',viewerRightEye:correction>.999?'red':'violet',channelBasis:'viewer coordinates',timelineYear:eraAt(t).year,simulatedChronology:true,contextRecords:Math.floor(attach*6+1e-7),contextCapacity:64,persistentMemory:false,source:'HIKAQ',lyricsVisible:false,focus:false,protagonist:'SERAN = red core'};
}
function blend(a,b,u){return a.map((v,i)=>mix(v,b[i],u));}
export const RED_IRIS=[(784.9243131071498-330)/600*10.24-5.12,(.5-(713.1141775581198-630)/180)*3.84,0];
export const VIOLET_IRIS=[(514-330)/600*10.24-5.12,(.5-(732-630)/180)*3.84,0];
export function coreLocal(t){
 const source=[9.9,oldWave(9.9,START),0];
 const power=[10.1,currentY(10.1,t),0];
 const left=VIOLET_IRIS.map(v=>v*1.8),right=RED_IRIS.map(v=>v*1.8);
 if(t<53.08){const x=mix(source[0],power[0],ramp(t,START,50.7));return [x,currentY(x,t),0];}
 const captured=[-6+VIOLET_IRIS[0],VIOLET_IRIS[1],0];
 if(t<55.15){const q=ramp(t,53.08,54.35),p=blend([10.1,currentY(10.1,53.08),0],captured,q);p[1]+=2*Math.sin(q*Math.PI)**2;return p;}
 if(t<55.72)return blend(captured,left,ramp(t,55.15,55.72));
 if(t<56.82){const q=ramp(t,55.72,56.48),p=blend(left,right,q);p[1]+=1.6*Math.sin(q*Math.PI)**2;p[2]=1.4*Math.sin(q*Math.PI)**2;return p;}
 const u=ramp(t,57.15,60.25),chrono=[10.3-20.6*u,1.25+1.5*Math.sin(Math.PI*u),-1.5*Math.sin(Math.PI*u)];
 if(t<60.5)return blend(right,chrono,ramp(t,56.82,57.25));
 const q=ramp(t,60.5,64.25),a=q*Math.PI*2.1;
 const weave=[-9.8+17.6*q,1.8*Math.sin(a),1.8*Math.cos(a)];
 return blend([-10.3,1.25,0],weave,ramp(t,60.5,61.1));
}
