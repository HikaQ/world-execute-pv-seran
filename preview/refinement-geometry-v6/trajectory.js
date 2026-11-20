// Deterministic character trajectory, independent of the wide camera.
import {ramp,mix} from '../refinement-opening-v15/score.js';
export const START=35.1,END=49.75;
export const CUES={points:35.1,giveDimensions:36.65,dimension:38.06666666666667,circle:38.81666666666667,giveCircumference:40.31666666666667,circumference:41.71666666666667,sine:42.5,giveTangents:44.01666666666667,tangents:45.65,infinity:46.16666666666667,you:47.7,limitations:48.9,end:END};
export const R=3.8,EXT=Math.PI*R,AMP=2.7,K=.58,LIMIT=1.65,LAMBDA=.21;
// Preserve the existing action timing and audio cues when removing focus.
export const MOTION={
 circle:{start:39.11666666666667,end:40.65},
 tangent:{start:43.416666666666664,end:45.8},
 limit:{start:47.68333333333333,end:49.75}
};
export const WIDE_WINDOWS=[
 {id:'coordinate-space',start:START,end:CUES.circle},
 {id:'circle-unroll-and-wave',start:41,end:42.92},
 {id:'wave-to-limit',start:CUES.infinity,end:47.35}
];
export function stageZ(t){return -322-12*ramp(t,38.5,43.1);}
export function presentationScaleAt(t){return 1+.20*ramp(t,START,36.4);}
export function unroll(s,u){
 const bend=(1-u)/R;
 return [Math.abs(bend)<1e-5?s:Math.sin(bend*s)/bend,Math.abs(bend)<1e-5?0:(Math.cos(bend*s)-1)/bend+R*(1-u),0];
}
export function wave(x,t){
 const normal=AMP*Math.sin(K*(x+EXT))*ramp(t,42.22,42.92);
 const q=ramp(t,46.16666666666667,47.35),physical=x+EXT;
 const bounded=LIMIT+AMP*Math.exp(-LAMBDA*physical)*Math.sin(K*physical)*(1-ramp(t,48.45,49.72));
 return mix(normal,bounded,q);
}
export function derivative(x,t){
 const normal=AMP*K*Math.cos(K*(x+EXT))*ramp(t,42.22,42.92);
 const q=ramp(t,46.16666666666667,47.35),physical=x+EXT;
 const bounded=AMP*Math.exp(-LAMBDA*physical)*(K*Math.cos(K*physical)-LAMBDA*Math.sin(K*physical))*(1-ramp(t,48.45,49.72));
 return mix(normal,bounded,q);
}
export function movingPoint(t){
 const dimensional=[5*ramp(t,36.25,36.85),3.5*ramp(t,36.8,37.35),-3*ramp(t,37.3,37.95)];
 if(t<CUES.circle){const q=ramp(t,38.25,CUES.circle);return dimensional.map((v,i)=>mix(v,[0,-R,0][i],q));}
 if(t<41){const s=-EXT+2*EXT*ramp(t,MOTION.circle.start,MOTION.circle.end);return unroll(s,0);}
 if(t<42.22)return unroll(-EXT,ramp(t,41,42.1));
 const x=mix(-EXT,-2.6,ramp(t,42.22,MOTION.tangent.end))+12.5*ramp(t,CUES.infinity,MOTION.limit.end);
 return [x,wave(x,t),0];
}
