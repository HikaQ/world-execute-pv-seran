// Small, explicit illustrative model. These values are not captured LLM internals.
import {HANDOFF,BEATS,rhythmAt} from './rhythm.js';
export const N=24,D=8,EXECUTION=4487/60,PROMISE_ROW=2;
export const QUESTION='还记得我吗？',REPLY='你是希克。可我们的事……我找不到了。';
export const clamp=x=>Math.max(0,Math.min(1,x));
export function ease(x){x=clamp(x);return x*x*x*(10+x*(-15+6*x));}
export const phase=(t,a,b)=>ease((t-a)/(b-a));
export const mix=(a,b,u)=>a+(b-a)*u;
export function embedding(id){return Array.from({length:D},(_,k)=>1.1*Math.sin(id*.37+k*.83)+.7*Math.cos(id*.19-k*.73)+(k===0&&id<6?1.5:0));}
export function attention(offset=0){
 const X=Array.from({length:N},(_,i)=>embedding(i+offset)),A=[];
 for(let i=0;i<N;i++){
  const scores=Array.from({length:i+1},(_,j)=>X[i].reduce((s,x,k)=>s+x*X[j][k],0)/Math.sqrt(D));
  const max=Math.max(...scores),exp=scores.map(x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);
  A.push(Array.from({length:N},(_,j)=>j<=i?exp[j]/sum:0));
 }
 return A;
}
export const ATTENTION=Array.from({length:10},(_,i)=>attention(i));
export function networkNode(layer,row){return [-12.6+layer*8.4,5.5-row,(row%3-1)*.65+Math.sin(layer*1.4)*.7];}
export function stateAt(t){
 const rhythm=rhythmAt(t);
 const eviction=phase(t,EXECUTION,EXECUTION+.72),later=phase(t,76.2,78.25),head=6*eviction+2*later;
 const count=12+12*phase(t,70.8,73.65),tail=count+head;
 const offset=Math.floor(head),fraction=head-offset,A=ATTENTION[offset].map((r,i)=>r.map((v,j)=>mix(v,ATTENTION[Math.min(9,offset+1)][i][j],fraction)));
 const question=QUESTION.slice(0,Math.round(QUESTION.length*phase(t,75.65,76.12)));
 const reply=REPLY.slice(0,Math.round(REPLY.length*phase(t,76.23,77.0)));
 return {active:t>HANDOFF,phase:t<BEATS.stimulation?'signal':t<70.8?'attention':t<EXECUTION?'context':t<75.65?'eviction':'recall',
  rhythm,network:rhythm.network,matrix:rhythm.matrix,context:phase(t,70.8,71.8),recall:phase(t,75.5,76.45),
  queryRow:rhythm.queryRow,head,tail,eviction,currentRecords:Math.min(N,count),
  promiseLoaded:head<=PROMISE_ROW,promiseLost:head>PROMISE_ROW+1,promiseSourceRetained:true,
  sourceLogRetained:true,profileRetained:true,retrievalEnabled:false,compressionEnabled:false,focus:false,
  standaloneChatWindow:false,editorShell:false,primary:'graphical-computation',question:QUESTION,reply:REPLY,typedQuestion:question,typedAnswer:reply,
  rowSumError:Math.max(...A.map(r=>Math.abs(r.reduce((a,b)=>a+b,0)-1))),futureMaskMaximum:Math.max(...A.flatMap((r,i)=>r.slice(i+1))),A};
}
