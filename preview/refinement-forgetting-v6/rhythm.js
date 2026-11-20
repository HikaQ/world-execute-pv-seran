// Absolute film time, including the 312-frame prelude.
// Preparation precedes the lyric; activation crests on the vocal cue.
export const HANDOFF=3855/60;
export const BEATS={first:3879/60,second:3935/60,stimulation:4037/60,then:4095/60,only:4151/60};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
export const advance=(t,a,b)=>smooth((t-a)/(b-a));
export function accent(t,at,lead=.12,release=.28){
 return t<=at?advance(t,at-lead,at):1-advance(t,at,at+release);
}
export function rhythmAt(t){
 const first=accent(t,BEATS.first),second=accent(t,BEATS.second),stimulation=accent(t,BEATS.stimulation,.14,.28);
 return {first,second,stimulation,then:accent(t,BEATS.then),only:accent(t,BEATS.only),
  propagation:advance(t,BEATS.first,BEATS.first+.60)+advance(t,BEATS.second,BEATS.second+.65)+advance(t,BEATS.second+.78,BEATS.stimulation-.14),
  network:advance(t,HANDOFF,BEATS.first)*(1-advance(t,BEATS.stimulation-.30,BEATS.stimulation)),
  matrix:advance(t,BEATS.stimulation-.34,BEATS.stimulation),
  queryRow:11*advance(t,BEATS.stimulation-.28,BEATS.stimulation)+6*advance(t,BEATS.then-.12,BEATS.then+.26)+6*advance(t,BEATS.only-.12,BEATS.only+.28)};
}
