export const FPS=60,FIRST=5625,END=5844,START=FIRST/FPS,FINISH=END/FPS,ENTRY=5645;
export const CUTS=[
 {frame:5625,id:'proof-hold',join:'relay'},
 {frame:5645,id:'glyph-f-light',reference:'pre2/square',join:'cut',referenceOffsetFrames:-2},
 {frame:5698,id:'glyph-f-dark',reference:'pre2/glyphF',join:'light-sweep'},
 {frame:5740,id:'glyph-f-read',reference:'pre2/bitsF',join:'relay'},
 {frame:5778,id:'glyph-rewrite-start',join:'relay'},
 {frame:5797,id:'glyph-rewrite',reference:'pre2/switch',join:'relay'},
 {frame:5812,id:'glyph-m',reference:'pre2/glyphM',join:'relay'}
];
export const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,u)=>a+(b-a)*u;
export const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const poses=[
 [5645,[9,5,42],[2,0,0]],
 [5698,[10,4.5,40],[2,0,0]],
 [5740,[9,3.8,38.5],[2,0,0]],
 [5778,[7,3.8,38.8],[2,0,0]],
 [5812,[3,4.6,40],[2,0,0]],
 [5844,[1,5,41],[2,0,0]]
];
export function hermite(a,b,va,vb,u,d){return a*(2*u**3-3*u*u+1)+va*d*(u**3-2*u*u+u)+b*(-2*u**3+3*u*u)+vb*d*(u**3-u*u);}
function tangent(i,col,k){const a=poses[Math.max(0,i-1)],b=poses[Math.min(poses.length-1,i+1)];return (b[col][k]-a[col][k])/(b[0]-a[0]);}
export function cameraAtFrame(f){
 const ff=Math.max(5645,Math.min(5844,f));let i=poses.findIndex((p,j)=>j<poses.length-1&&ff<poses[j+1][0]);if(i<0)i=poses.length-2;
 const a=poses[i],b=poses[i+1],d=b[0]-a[0],u=(ff-a[0])/d;
 const path=col=>a[col].map((v,k)=>hermite(v,b[col][k],tangent(i,col,k),tangent(i+1,col,k),u,d));
 return {camera:path(1),target:path(2),fov:39};
}
export function at(t){
 t=Math.max(START,Math.min(FINISH,t));const f=t*60,shot=CUTS.findLast(c=>f>=c.frame-1e-7).id;
 return {time:t,frame:f,shot,...cameraAtFrame(f),flip:clamp((f-5778)/34),light:1-smooth((f-5670)/50),code:f<5797?70:77};
}
