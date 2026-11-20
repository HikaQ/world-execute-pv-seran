import {Vector3} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';
import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';

// All animation is a function of film time. A seek never leaves a simulated trail behind.
export function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const gaussian=r=>Math.sqrt(-2*Math.log(Math.max(1e-8,r())))*Math.cos(r()*Math.PI*2);
export function ribbonShape(N,path,{seed=1,width=.033}={}){
 const r=seeded(seed),a=new Float32Array(N*4),last=path.length-1;
 for(let i=0;i<N;i++){
  const u=r(),k=Math.min(last-1,Math.floor(u*last)),v=u*last-k,p=path[k],b=path[k+1];
  const near=path[Math.max(0,k-2)],far=path[Math.min(last,k+3)],dx=far[0]-near[0],dy=far[1]-near[1],len=Math.hypot(dx,dy)||1;
  // A broad body of granular ink, with a few longitudinal fibres inside it.
  const fibre=i%7,w=(fibre<2?(fibre-.5)*width*.8:Math.max(-2.8,Math.min(2.8,gaussian(r)))*width)*(.8+.2*Math.sin(u*31));
  const x=p[0]+(b[0]-p[0])*v-dy/len*w,y=p[1]+(b[1]-p[1])*v+dx/len*w;
  a.set([x,y,.012*gaussian(r)+.018*Math.sin(x*2+y*1.7),u],i*4);
 }
 return a;
}
export function sheetShape(N,{seed=1,width=2.64,height=2.68,bend=.06,grid=.018}={}){
 const r=seeded(seed),a=new Float32Array(N*4);
 for(let i=0;i<N;i++){
  let x=(r()-.5)*width,y=(r()-.5)*height;
  if(i%4===0){x=Math.round(x/grid)*grid;y=Math.round(y/grid)*grid;}
  const z=-.095+bend*Math.sin(x/width*Math.PI)*Math.cos(y/height*Math.PI)+.002*(r()-.5);
  a.set([x,y,z,r()],i*4);
 }
 return a;
}
function extend(material,uniforms,header,body){
 Object.assign(material.uniforms,uniforms);
 material.vertexShader=material.vertexShader.replace('void main() {',header+'\nvoid main() {').replace('  if (vis <= 0.)',body+'\n  if (vis <= 0.)');
 material.needsUpdate=true;
}
export class Ink extends Swarm{
 constructor(options){
  super(options);
  extend(this.material,{uCursor:{value:0},uWriting:{value:1},uSeal:{value:0}},
   'uniform float uCursor, uWriting, uSeal;',`
  float age = uCursor - a.w;
  float fresh = exp(-max(age,0.)*32.)*step(0.,age)*uWriting;
  float sealed = exp(-pow((a.w-uSeal)/.07,2.))*step(.001,uSeal);
  float filament = .55+.45*pow(abs(sin(a.w*86.+p.x*8.)),3.);
  vCol *= (.30+.30*filament+3.0*fresh+1.2*sealed);
  vCol = mix(vCol,vCol.r*vec3(1.,.62,.67),fresh*.55);
 `);
 }
 set(p,camera,H){super.set(p,camera,H);const u=this.material.uniforms;u.uCursor.value=p.cursor??p.reveal??1;u.uWriting.value=p.writing??0;u.uSeal.value=p.seal??0;return this;}
}
export class Laminate extends Swarm{
 constructor(options){
  super(options);
  extend(this.material,{uExtent:{value:new Vector3(1.32,1.34,0)},uScan:{value:0},uSheetLight:{value:1}},
   'uniform vec3 uExtent; uniform float uScan, uSheetLight;',`
  vec2 st = p.xy/max(uExtent.xy,vec2(.001));
  float edge = pow(max(abs(st.x),abs(st.y)),18.);
  float scan = exp(-pow((st.y-uScan)/.14,2.));
  float lamp = exp(-length((st-vec2(-.35,.45))*vec2(.75,1.1))*1.2);
  float rows = .7+.3*pow(abs(sin(p.y*54.)),5.);
  float fade = 1.-smoothstep(.82,1.04,max(abs(st.x),abs(st.y)));
  vCol *= (.12+.72*lamp+.20*edge+1.3*scan*uSheetLight)*rows*fade;
 `);
 }
 set(p,camera,H){super.set(p,camera,H);const u=this.material.uniforms;u.uExtent.value.set(...(p.extent??[1.32,1.34,0]));u.uScan.value=p.scan??3;u.uSheetLight.value=p.sheetLight??1;return this;}
}

// A drawing is deposited on a sampled sheet. The writing tip, fresh ink and settled
// grains are separate exposures; there is no full-bright continuous neon outline.
export class DrawingPlate{
 constructor(scene,key,paths,{central=false}={}){
  this.central=central;this.ink=new Ink({count:central?65536:16384});
  this.sheet=new Laminate({count:central?65536:16384});this.residue=new Ink({count:16384});
  this.shapes=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,this.ink.shape(`quality-${key}-ink-${k}`,N=>ribbonShape(N,p,{seed:713,width:central?.033:.037}))]));
  this.sheetTex=this.sheet.shape(`quality-${key}-sheet`,N=>sheetShape(N,{seed:752,grid:.023}));
  this.oldTex=this.residue.shape(`quality-${key}-residue`,N=>ribbonShape(N,paths.trial??paths.correct,{seed:713,width:.045}));
  this.objects=[this.sheet.points,this.ink.points,this.residue.points];for(const o of this.objects){scene.add(o);o.visible=false;}
 }
 hide(){for(const o of this.objects)o.visible=false;}
 draw(ctx,camera,{pos,scale,rotation=0,key='correct',q=1,opacity=1,cursor=q,writing=0,seal=0,residue=0,sheetLight=1,sheetOpacity=1}){
  const central=this.central,col=central?[1,.035,.085]:[.48,.43,.51],focus=camera.position.distanceTo(new Vector3(...pos));
  for(const o of this.objects){o.position.set(...pos);o.scale.setScalar(scale);o.rotation.set(rotation,0,0);}
  this.sheet.points.visible=opacity>.001&&sheetOpacity>.001;this.ink.points.visible=opacity>.001;this.residue.points.visible=residue>.001;
  this.sheet.set({a:this.sheetTex,size:central?.029:.023,minPx:.85,bright:(central?.075:.060)*opacity*sheetOpacity,colA:central?[.8,.045,.085]:[.31,.27,.34],t:ctx.t,focus,aperture:.004,maxBlur:12,scan:writing>0?1.05-2.1*cursor:3,sheetLight},camera,ctx.H);
  this.ink.set({a:this.shapes[key],reveal:q>=1?1.001:q,revealBy:'w',size:central?.030:.026,minPx:1.05,bright:(central?.72:.63)*opacity,colA:col,t:ctx.t,focus,aperture:.003,maxBlur:10,noise:.0006,sparkle:.07,cursor,writing,seal},camera,ctx.H);
  if(residue>.001)this.residue.set({a:this.oldTex,reveal:1.001,size:.024,minPx:.9,bright:.15*residue,colA:[.5,.23,.28],focus,aperture:.004,t:ctx.t},camera,ctx.H);
 }
}
