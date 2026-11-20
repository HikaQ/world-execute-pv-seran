import {Swarm} from '../../references/world-execute-web/src/engine/swarm.js?v=DTFpJa7B';
import {seeded} from '../refinement-possession-v13/quality-materials.js';

// Text is sampled into discrete phosphor dots. The opaque raster mask is never shown.
export function dotLayout(text,{width=10,font='600 96px Chinese',pitch=3.25}={}){
 const c=document.createElement('canvas'),g=c.getContext('2d',{willReadFrequently:true});g.font=font;
 const w=Math.ceil(g.measureText(text).width+24),h=142;c.width=w;c.height=h;
 g.font=font;g.fillStyle='#fff';g.textBaseline='alphabetic';g.fillText(text,12,108);
 const data=g.getImageData(0,0,w,h).data,points=[];
 for(let y=6;y<h;y+=pitch)for(let x=6;x<w-6;x+=pitch)if(data[(Math.floor(y)*w+Math.floor(x))*4+3]>150)points.push([((x-12)/(w-24)-.5)*width,(71-y)/(w-24)*width,0]);
 if(!points.length)throw Error('Empty glyph mask: '+text);
 return {text,width,height:96/(w-24)*width,dots:points.length,points,shape(N){const a=new Float32Array(N*4),r=seeded(617);for(let i=0;i<N;i++){const j=Math.floor(i/N*points.length),p=points[j];a.set([p[0],p[1],p[2],r()],i*4);}return a;}};
}
export function particleText(scene,text,opts={}){
 const layout=dotLayout(text,opts),side=Math.ceil(Math.sqrt(layout.dots)),N=side*side;
 const s=new Swarm({count:N}),a=s.shape('arrival-text-'+text+'-'+(opts.width??10),layout.shape);scene.add(s.points);s.points.visible=false;
 return {s,a,layout,draw(ctx,camera,{position=[0,0,0],scale=1,color=[.9,.73,.78],opacity=1,reveal=1,rotation=[0,0,0],size=.025,focus,aperture=.0015}={}){
  s.points.visible=opacity>.001;s.points.position.set(...position);s.points.rotation.set(...rotation);s.points.scale.setScalar(scale);
  s.set({a,t:ctx.t,size:size*1.48,minPx:1.6,bright:1.26*opacity,colA:color,reveal:reveal>=1?1.001:reveal,revealBy:'w',focus:focus??camera.position.distanceTo(s.points.position),aperture,maxBlur:8},camera,ctx.H);
 }};
}
