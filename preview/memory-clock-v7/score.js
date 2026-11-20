import {CLOCK_START,CLOCK_END,CLOCK_CUT} from './clock.js';
export const FPS=60,FIRST=5844,END=6067,START=FIRST/FPS,FINISH=END/FPS;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,u)=>a+(b-a)*u;
export const CUTS=[{frame:5844,id:'memory-write-wide'},{frame:5896,id:'memory-write-detail'},
 {frame:5958,id:'clock-oblique'},{frame:6004,id:'clock-front'}];
export function at(t){
 t=Math.max(START,Math.min(FINISH-1/60,t));
 if(t<CLOCK_START){
  const q=(t-START)/(CLOCK_START-START),scan=-13.5+q*27;
  const detail=t>=5896/60;
  const u=detail?(t-5896/60)/(CLOCK_START-5896/60):(t-START)/(5896/60-START);
  return {id:'write',shot:detail?'memory-write-detail':'memory-write-wide',time:t,
   geometryTime:99.3+(scan+4.3)/5.2,scan,
   view:detail?{camera:[mix(21,19,u),mix(11,10,u),mix(28,27,u)],target:[mix(2,4,u),-.3,2],fov:37}:
    {camera:[mix(27,25,u),15,33],target:[0,-1,0],fov:39}};
 }
 const front=t>=CLOCK_CUT;
 const u=front?(t-CLOCK_CUT)/(CLOCK_END-CLOCK_CUT):(t-CLOCK_START)/(CLOCK_CUT-CLOCK_START);
 return {id:'clock',shot:front?'clock-front':'clock-oblique',time:t,geometryTime:t,
  view:front?{camera:[0,0,mix(43.8,42.9,u)],target:[0,0,0],fov:39}:
    {camera:[mix(14,10,u),mix(9,6,u),mix(43,42,u)],target:[0,0,0],fov:39,offsetY:174*(1-clamp(u))**2}};
}
