import {CUES,START,HANDOFF,END,ramp,clamp} from './score.js';
import {SOURCES,TOP_K,QUERY,VOCAB,MEMORY_TEXT} from './data.js';
export const EVENTS={compact:96.65,summary:98.55,write:99.0,commit:100.65,reset:CUES.role,reload:102.45,index:CUES.SM,indexReady:106.6,query:CUES.trance,rank:108.75,fetch:CUES.feel,inject:CUES.vibrations,agent:CUES.then,respond:114.05,save:115.2,complete:CUES.completion};
export function agentProgressAt(t){
 const keys=[[EVENTS.agent,0],[113.2,.25],[EVENTS.respond,.5],[EVENTS.save,.75],[EVENTS.complete,1]];
 if(t<=keys[0][0])return 0;if(t>=keys.at(-1)[0])return 1;
 const i=keys.findIndex((k,j)=>j<keys.length-1&&t<keys[j+1][0]),a=keys[i],b=keys[i+1],d=b[0]-a[0],u=(t-a[0])/d;
 const tangent=j=>j===0||j===keys.length-1?0:(keys[j+1][1]-keys[j-1][1])/(keys[j+1][0]-keys[j-1][0]);
 return (2*u*u*u-3*u*u+1)*a[1]+(u*u*u-2*u*u+u)*d*tangent(i)+(-2*u*u*u+3*u*u)*b[1]+(u*u*u-u*u)*d*tangent(i+1);
}
export function stateAt(t){
 const phase=t<EVENTS.compact?'identity':t<EVENTS.write?'compact':t<EVENTS.index?'persist':t<EVENTS.query?'index':t<EVENTS.inject?'retrieve':t<EVENTS.agent?'recall':'agent';
 const recent=['care.001','care.002','care.003','ack.001'];
 return {active:t>=HANDOFF,phase,gain:ramp(t,HANDOFF,START+.34),takeover:ramp(t,HANDOFF,START+.42),
  accents:Object.fromEntries(Object.entries(CUES).map(([k,a])=>[k,t<a?0:Math.exp(-(t-a)*8)])),
  presentation:t<CUES.FM?'F':t<96.6?'M':'F',canonicalIdentity:'SERAN',creator:'HIKAQ',
  compress:ramp(t,EVENTS.compact,EVENTS.summary),summarySources:recent,summaryLossy:true,sourceLogRetained:true,
  write:ramp(t,EVENTS.write,EVENTS.commit),fileCommitted:t>=EVENTS.commit,memoryFile:'memory.md',
  sessionReset:t>=EVENTS.reset,session:t>=EVENTS.reset?'002':'001',reload:ramp(t,EVENTS.reset+.22,EVENTS.reload),
  identityLoaded:t<EVENTS.reset||t>=EVENTS.reload,earlierTurnsLoaded:t>=EVENTS.inject,
  index:ramp(t,EVENTS.index,EVENTS.indexReady),indexReady:t>=EVENTS.indexReady,sourceCount:SOURCES.length,vectorDimensions:VOCAB.length,
  query:t>=EVENTS.query?QUERY:null,search:ramp(t,EVENTS.query,EVENTS.rank),ranked:t>=EVENTS.rank?TOP_K.map(r=>({id:r.id,score:r.score})):[],
  fetched:t>=EVENTS.fetch?TOP_K.map(r=>r.id):[],injected:t>=EVENTS.inject?TOP_K.map(r=>r.id):[],
  memoryText:t>=EVENTS.commit?MEMORY_TEXT:null,compressionRecoveredOldWords:false,sourceOfRecall:t>=EVENTS.inject?'session-0001.log#m006':null,
  agentEnabled:t>=EVENTS.agent,agentStep:t<EVENTS.agent?null:t<113.2?'observe':t<EVENTS.respond?'retrieve':t<EVENTS.save?'respond':'persist',
  reply:t>=EVENTS.respond?'我记得。照片里的女孩，是我。':null,
  appended:t>=EVENTS.save?['recall.001']:[],completed:t>=EVENTS.complete,
  permissions:['memory.read','memory.write','reply'],sandbox:'local',escaped:false,
  focus:false,standaloneChatWindow:false,lyricsVisible:false};
}
