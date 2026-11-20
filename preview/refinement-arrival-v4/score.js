import {stateAt as previousState,PLAN as previousPlan,E} from '../refinement-arrival-v2/score.js';
export {FIRST,END,FPS,FRAMES,DURATION,E,SHOTS,shotAt,transitionAt,clamp,mix,ramp,smooth,SNAPSHOT,SOURCES} from '../refinement-arrival-v2/score.js';
export const CLOSURE={zeroFirst:12792,isolate:12840,restGone:12852,reveal:12848,zeroOut:12854,coreAlone:12868,move:12873,approach:12903,hold:12954,end:13027};
export const ZERO_CENTER=[1282.5,528.5];
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
const span=(f,a,b)=>ease((f-a)/(b-a));
export function closureAt(frame){
 const restAlpha=1-span(frame,CLOSURE.isolate,CLOSURE.restGone);
 const zeroAlpha=1-span(frame,CLOSURE.zeroOut,CLOSURE.coreAlone);
 const redMix=span(frame,CLOSURE.isolate,CLOSURE.zeroOut);
 const reveal=span(frame,CLOSURE.reveal,CLOSURE.coreAlone),move=span(frame,CLOSURE.move,CLOSURE.hold);
 const approach=span(frame,CLOSURE.approach,CLOSURE.hold);
 const hold=Math.max(0,Math.min(1,(frame-CLOSURE.hold)/(CLOSURE.end-1-CLOSURE.hold)));
 const breath=1-.035*Math.sin(hold*Math.PI)**2;
 const coreGain=frame<CLOSURE.zeroFirst?0:(.0015+.9985*reveal)*breath;
 return {restAlpha,zeroAlpha,redMix,reveal,move,approach,coreGain,coreVisible:coreGain>0,
  corePhase:Math.max(0,(frame-CLOSURE.zeroFirst)/60),initialDiameter:6+12*reveal,
  center:[ZERO_CENTER[0]+(960-ZERO_CENTER[0])*move,ZERO_CENTER[1]+(540-ZERO_CENTER[1])*move],
  stage:frame<CLOSURE.isolate?'terminal':frame<CLOSURE.coreAlone?'zero-reveal':frame<CLOSURE.move?'core-at-zero':frame<CLOSURE.hold?'core-to-center':'core-hold'};
}
export function stateAt(frame){
 const base=previousState(frame),ending=closureAt(frame);
 return {...base,cursorVisible:base.cursorVisible&&ending.restAlpha>0,ending,
  lastSubject:frame>=CLOSURE.isolate?'exit-code-zero-is-SERAN':base.sceneId};
}
export const PLAN={...previousPlan,version:'refinement-arrival-v4',closure:CLOSURE,changedRangeFrames:[CLOSURE.zeroFirst,CLOSURE.end],lastFrameRedCore:true,zeroIsCore:true};
