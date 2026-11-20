import {ramp} from './score.js';

// Four regular read channels correspond to the four preceding attention heads.
// The old record is a genuinely empty slot. No signal travels back from it.
export function createRetrieval(group,{cloud,arrays,put,C}){
 const bands=arrays(),slots=arrays(),markers=arrays();
 for(let head=0;head<4;head++){
  const y=(1.5-head)*2.65;
  for(let col=0;col<280;col++)for(let row=0;row<11;row++)for(let depth=0;depth<1;depth++){
   const u=col/279,edge=row===0||row===10;
   const shade=edge?.55:.17+.07*(1+Math.cos(col*.18+head*.9));
   put(bands,[-11.7+u*14.0,y+(row-5)*.085,-depth*.34],C.violet.clone().lerp(C.white,edge?.60:.20).multiplyScalar(shade).toArray(),edge?.038:.033,[u,head,row/10]);
  }
  // A short, square-ended slot at the destination; the interior stays black.
  for(const side of [-1,1])for(let j=0;j<26;j++){
   const u=j/25;
   for(const sign of [-1,1]){
    put(slots,[8.0+side*1.7,y+sign*.64*u,0],C.white.clone().multiplyScalar(.38).toArray(),.034,[head,0,0]);
    put(slots,[8.0+side*(1.7-u*.46),y+sign*.64,0],C.violet.clone().multiplyScalar(.48).toArray(),.031,[head,0,0]);
   }
  }
  // One small origin marker per actual read head, not a background grid.
  for(let i=0;i<18;i++)put(markers,[-12.25,y+(i-8.5)*.045,.05],C.white.clone().multiplyScalar(.65).toArray(),.035,[head,0,0]);
 }
 const read=cloud(group,bands,`
  float front=progress;
  float crest=exp(-pow((data.x-front)/.035,2.));
  float trail=exp(-max(0.,front-data.x)/.16)*step(data.x,front);
  float alive=1.-failure*.72;
  col*=.73;col+=vec3(.92,.69,1.18)*crest*alive;
  col+=vec3(.19,.10,.35)*trail*alive;
  // Keep the failed query at the boundary. It never crosses the empty gap.
 `,{failure:{value:0}});
 const empty=cloud(group,slots,`col*=.72+.28*failure;`,{failure:{value:0}});
 const origin=cloud(group,markers);
 return {clouds:[read,empty,origin],frame(t){
  const progress=ramp(t,74.7263,75.1791),failure=ramp(t,75.6377,76.12);
  read.uniforms.progress.value=progress;read.uniforms.failure.value=failure;read.uniforms.gain.value=1.7;
  empty.uniforms.failure.value=failure;empty.uniforms.gain.value=1.5;origin.uniforms.gain.value=1.3;
  return {readHeads:4,queryProgress:progress,arrivalTime:75.1791,targetLoaded:false,
   emptyGap:[2.3,6.3],returnSignal:false,result:t>=75.1791?'not-found':'searching',failureProgress:failure,
   purpose:'four read heads search for an old record outside the current window'};
 }};
}
