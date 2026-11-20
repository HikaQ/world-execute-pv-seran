const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// Existing V3 world path, independent of the camera and renderer.
export function runtimeCore(frame){
 const t=frame-10081;
 if(frame<10138){const u=clamp(t/57);return [mix(-8.6,0,smooth(u,0,1)),-2.1,2.4];}
 if(frame<10243){const u=clamp((frame-10138)/105);return [0,mix(-2.1,0,smooth(u,0,.62)),mix(2.4,.20,u)];}
 const u=clamp((frame-10243)/56);return [0,0,mix(.20,-3.5,u)];
}
