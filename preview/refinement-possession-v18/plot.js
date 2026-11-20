import {E,plotProgress,repeatProgress,clamp} from './score.js';
export const N=720;
export function heart(t){return [Math.sin(t)**3,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16];}
const sample=fn=>Array.from({length:N+1},(_,i)=>fn(i/N));
export const correct=sample(u=>heart(u*Math.PI*2));
// SERAN learns the same symmetric, closed curve shown in the later comparison.
export const firstPass=correct;
export const plots={
 open:sample(u=>heart((.08+u*.73)*Math.PI*2)),
 cross:sample(u=>[Math.sin(u*Math.PI*2),.82*Math.sin(u*Math.PI*4)]),
 unstable:sample(u=>{const [x,y]=heart(u*Math.PI*2);return [Math.round((x*(u<.5?1.1:.56)+.23*Math.sin(u*Math.PI*8))/.22)*.22,Math.round((y+.3*Math.sin(u*Math.PI*6)+.2*Math.sin(u*Math.PI))/.23)*.23];}),
 diverge:sample(u=>[1.1*u*Math.cos(u*Math.PI*5.4),u*Math.sin(u*Math.PI*5.4)])
};
