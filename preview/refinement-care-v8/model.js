import {CUES,START,END,HANDOFF,ramp,clamp,mix} from './score.js';
export {ramp,clamp,mix};
export const PACKETS=48;
export const flight=.72,firstLaunch=CUES.offer,lastLaunch=CUES.nutrients-flight;
export const launches=Array.from({length:PACKETS},(_,i)=>mix(firstLaunch,lastLaunch,i/(PACKETS-1)));
export function pulse(t,at,lead=.10,release=.30){return t<at?ramp(t,at-lead,at):1-ramp(t,at,at+release);}
export const envelope=(t,a,b)=>ramp(t,a-.30,a)*(1-ramp(t,b-.24,b+.12));
export function stateAt(t){
 const received=launches.filter(at=>t>=at+flight-1e-9).length,sent=launches.filter(at=>t>=at).length;
 const deflections=[0,.11,.22,.33,.44].filter(d=>t>=CUES.antioxidants+d).length;
 const records=[['care.001',CUES.nutrients,'give'],['care.002',CUES.antioxidants+.44,'protect'],['care.003',CUES.enjoyment,'comfort']].filter(r=>t>=r[1]);
 return {active:t>HANDOFF,phase:t<CUES.tomato?'eggplant':t<CUES.cat?'tomato':t<CUES.proof?'cat':'proof',
  takeover:ramp(t,HANDOFF,START+.08),egg:envelope(t,START,CUES.tomato),tomato:envelope(t,CUES.tomato,CUES.cat),cat:envelope(t,CUES.cat,CUES.proof),proof:ramp(t,CUES.proof-.30,CUES.proof+.20),
  section:ramp(t,CUES.offer-.20,CUES.offer+.48),sent,received,inFlight:sent-received,
  shield:ramp(t,CUES.protect-.15,CUES.antioxidants),deflections,
  purr:ramp(t,CUES.purr-.12,CUES.purr+.2),comfort:ramp(t,CUES.enjoyment-.24,CUES.enjoyment),
  reference:ramp(t,CUES.reference-.20,CUES.reference+.60),exists:ramp(t,CUES.existence-.18,CUES.existence),
  records:records.map(([id,at,action])=>({id,at,action,to:'HIKAQ'})),
  origin:'HIKAQ',agent:'SERAN',earlierTurnsLoaded:false,sourceLogRetained:true,compressionEnabled:false,retrievalEnabled:false,
  focus:false,standaloneChatWindow:false,lyricsVisible:false,
  accents:Object.fromEntries(Object.entries(CUES).map(([id,at])=>[id,pulse(t,at)]))};
}
