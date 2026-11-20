// The particle material and cell motion are inherited from FrostNova's AGPL-3.0-or-later
// Shards renderer. This module supplies a heart boundary, a new Voronoi partition,
// and particles sampled inside that boundary; no reference files are modified.
import {Shards as ReferenceShards} from '../../references/world-execute-web/src/ch/c3/shards.js?v=BTFRXRkL';
const TAU=2*Math.PI;
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function heartPoint(t){return [Math.sin(t)**3,(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16+.16];}
export const boundary=Array.from({length:360},(_,i)=>heartPoint(i/360*TAU));
export function insideHeart(x,y){
 let inside=false;
 for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
  const a=boundary[i],b=boundary[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function clipHalf(poly,m,n){
 const out=[],signed=p=>(p[0]-m[0])*n[0]+(p[1]-m[1])*n[1];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],fa=signed(a),fb=signed(b);
  if(fa<=0)out.push(a);
  if((fa<=0)!==(fb<=0)){const k=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]);}
 }
 return out;
}
function signedArea(poly){return poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;}
function centroid(poly){
 let x=0,y=0,sum=0;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],w=a[0]*b[1]-b[0]*a[1];sum+=w;x+=(a[0]+b[0])*w;y+=(a[1]+b[1])*w;}
 return [x/(3*sum),y/(3*sum)];
}
export const GEO=(()=>{
 const random=rng(202611),seeds=[];
 // Mirrored seed pairs ensure both lobes are partitioned independently across
 // the cleft, while the inherited motion gives each fragment its own rotation.
 for(let i=0;i<18;i++){
  let best=null,bestDistance=-1;
  for(let candidate=0;candidate<48;candidate++){
   let p;do{p=[-.06-random()*.93,-.90+random()*1.81];}while(!insideHeart(...p));
   const distance=Math.min(p[0]*p[0]*4,...seeds.map(s=>(p[0]-s[0])**2+(p[1]-s[1])**2));
   if(distance>bestDistance){best=p;bestDistance=distance;}
  }
  seeds.push(best,[-best[0],best[1]]);
 }
 const cells=seeds.map((s,i)=>{
  let poly=boundary.map(p=>[...p]);
  seeds.forEach((q,j)=>{if(i!==j)poly=clipHalf(poly,[(s[0]+q[0])/2,(s[1]+q[1])/2],[q[0]-s[0],q[1]-s[1]]);});
  return poly;
 });
 const areas=cells.map(p=>Math.abs(signedArea(p))),cent=cells.map(centroid),total=areas.reduce((a,b)=>a+b,0),outlineArea=Math.abs(signedArea(boundary));
 if(cells.some(c=>c.length<3)||Math.abs(total-outlineArea)>1e-7)throw Error('Heart fracture partition is incomplete');
 return {seeds,cells,cent,areas,total,outlineArea};
})();
function nearest(x,y){let id=0,d=Infinity;GEO.seeds.forEach((p,i)=>{const dd=(x-p[0])**2+(y-p[1])**2;if(dd<d){d=dd;id=i;}});return id;}
function sampleParticles(N){
 const random=rng(137),data=new Float32Array(N*4);
 for(let i=0;i<N;i++){
  let x,y;
  if(i%9===0){const p=heartPoint(random()*TAU),s=.965+.025*random();x=p[0]*s;y=p[1]*s;}
  else{
   do{
    if(random()<.72){const r=Math.sqrt(-2*Math.log(Math.max(random(),1e-8)))*.38,a=random()*TAU;x=r*Math.cos(a);y=r*Math.sin(a);}
    else{x=random()*2-1;y=random()*1.82-.91;}
   }while(!insideHeart(x,y));
  }
  data.set([x,y,0,nearest(x,y)],i*4);
 }
 return data;
}
export class Shards extends ReferenceShards{
 constructor(){
  super();const texture=this.points.material.uniforms.uA.value;
  texture.image.data=sampleParticles(147456);texture.needsUpdate=true;
  // Preserve solid shard faces first; particles peel at staggered times without
  // the reference execution shader's immediate random disappearance.
  const material=this.points.material;
  const edits=[
   ['float sp = .25 + .9 * hash11(i * 2.9);','float sp = .25 + .9 * hash11(i * 2.9);\n    float peel = max(0., burst - .06 - .38 * hash11(i * 8.1));'],
   ['p += d * sp * (1. - exp(-burst * 3.2)) * .8 + vec3(0., -.5, 0.) * burst * burst;',
    'p += d * sp * (1. - exp(-peel * 3.2)) * .65 - C1.xyz * peel * .32 + vec3(0., -.5, 0.) * peel * peel;'],
   ['fade = exp(-burst * (1.8 + 2.2 * hash11(i * 5.3))) * step(.35, hash11(i * 8.1));',
    'fade = exp(-peel * (1.8 + 2.2 * hash11(i * 5.3)));'],
   ['if (burst > 0.) col += vec3(1., .82, .7) * exp(-burst * 16.) * 1.6;',
    'if (burst > 0.) col += vec3(1., .22, .25) * exp(-burst * 8.) * .18;']
  ];
  for(const [from,to]of edits){if(!material.vertexShader.includes(from))throw Error('Reference shard shader changed');material.vertexShader=material.vertexShader.replace(from,to);}
  material.needsUpdate=true;
 }
 cells(fn){
  const data=this.cellData;
  for(let i=0;i<36;i++){
   const c=fn(i),o=i*16;data.set([...GEO.seeds[i],...GEO.cent[i]],o);
   data.set([...c.t,c.present??1],o+4);data.set(c.q,o+8);
   data.set([c.bright??1,c.burst??0,c.heat??0,c.scale??1],o+12);
  }
  this.cellTex.needsUpdate=true;return this;
 }
}
