import * as THREE from 'three';
import {LineSegments2} from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
export const CLOCK_START=5958/60,CLOCK_END=6067/60,CLOCK_CUT=6004/60;
export const TURN_START=6016/60,TURN_LAND=6034/60;
const TAU=Math.PI*2,R=11.65;
const clamp=x=>Math.max(0,Math.min(1,x));
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function clockHoursAt(t){
 const u=clamp((t-TURN_START)/(TURN_LAND-TURN_START)),peak=1/3;
 // Integrate a cosine velocity ramp: 6 frames building speed, 12 settling.
 // Speed and acceleration both reach zero at the endpoints, with no overshoot.
 const progress=u<peak
  ?u-peak/Math.PI*Math.sin(Math.PI*u/peak)
  :u+(1-peak)/Math.PI*Math.sin(Math.PI*(u-peak)/(1-peak));
 return 6+12*progress;
}
function line(group,values,color,opacity=1,width=1.35){
 const g=new LineSegmentsGeometry();g.setPositions(values);
 const m=new LineMaterial({color,transparent:true,opacity,depthWrite:false,linewidth:width,alphaToCoverage:false});
 const o=new LineSegments2(g,m);o.frustumCulled=false;
 // Specify visible strokes at 1080p, including the offscreen supersampling scale.
 o.onBeforeRender=function(renderer){
  LineSegments2.prototype.onBeforeRender.call(this,renderer);
  this.material.linewidth=width*this.material.resolution.y/1080;
 };
 group.add(o);return o;
}
function moveLine(o,values){const buffer=o.geometry.attributes.instanceStart.data;buffer.array.set(values);buffer.needsUpdate=true;}
function arc(group,r,a,b,color,opacity=.5,z=0,width=1.35){const p=[],n=Math.ceil((b-a)*140);for(let i=0;i<n;i++){const u=a+(b-a)*i/n,v=a+(b-a)*(i+1)/n;p.push(Math.sin(u)*r,Math.cos(u)*r,z,Math.sin(v)*r,Math.cos(v)*r,z);}return line(group,p,color,opacity,width);}
function label(group,text,x,y,size,color='#b6a8c8'){
 const c=document.createElement('canvas'),g=c.getContext('2d');g.font='600 100px "JetBrains Mono"';c.width=Math.ceil(g.measureText(text).width)+30;c.height=140;
 g.font='600 100px "JetBrains Mono"';g.textAlign='center';g.textBaseline='middle';
 g.strokeStyle='#020307';g.lineWidth=18;g.lineJoin='round';g.strokeText(text,c.width/2,69);
 g.fillStyle=color;g.fillText(text,c.width/2,69);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(c.width/100*size,1.4*size),material);mesh.position.set(x,y,.08);mesh.renderOrder=2;group.add(mesh);return mesh;
}
function pointMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 uniforms:{angle:{value:Math.PI/2},time:{value:0},gain:{value:1},trailSpan:{value:0},trailGain:{value:0}},
 vertexShader:`attribute float phase,seed,kind;uniform float angle,time,trailSpan,trailGain;varying vec3 c;varying float a;
 void main(){vec3 p=position;float radius=length(p.xy);float at=phase;
 if(kind>1.5){at=angle-seed*trailSpan;float rr=11.65+(fract(seed*173.)-.5)*.10;p=vec3(sin(at)*rr,cos(at)*rr,.12);}
 vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp((60.+seed*35.)/max(1.,-v.z),1.1,3.4);
 float d=abs(at-angle);float head=exp(-pow(d/.05,2.));
 c=kind>1.5?vec3(2.2,.002,.015):mix(vec3(.19,.14,.28),vec3(1.5,1.3,1.9),head);
 a=kind>1.5?pow(1.-seed,2.)*.64*trailGain:(.10+head*.6);
 if(kind>.5&&kind<1.5){a=(at>=1.5707&&at<=angle)?.34:.025;c=vec3(.65,.43,.95);}
 }`,
 fragmentShader:`varying vec3 c;varying float a;void main(){float q=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*20.);gl_FragColor=vec4(c,q*a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
export function createClock(group){
 const ticks=[],minor=[],rnd=random(240601),p=[],phase=[],seed=[],kind=[];
 arc(group,12.30,0,TAU,'#e7ddf3',.92,0,2.3);arc(group,11.32,0,TAU,'#a58abf',.42,0,1.15);arc(group,12.73,0,TAU,'#b3a1c6',.42,0,1.25);
 for(let i=0;i<144;i++){
  const a=i/144*TAU,major=i%6===0,r0=major?11.65:12.02,r1=12.30;
  (major?ticks:minor).push(Math.sin(a)*r0,Math.cos(a)*r0,.02,Math.sin(a)*r1,Math.cos(a)*r1,.02);
 }
 line(group,ticks,'#f0e7f7',.95,2.5);line(group,minor,'#c4b2d9',.72,1.35);
 for(let h=0;h<24;h+=2){const a=h/24*TAU,r=10.56;label(group,String(h).padStart(2,'0'),Math.sin(a)*r,Math.cos(a)*r,h%6===0?.59:.43,h%6===0?'#f0e7f7':'#c2b1d4');}
 const am=label(group,'AM',4.7,.65,.76,'#e9ddf5'),pm=label(group,'PM',-4.7,.65,.76,'#e9ddf5');
 label(group,'24 H',0,-1.3,.34,'#bba5d1');
 // One restrained hand: the red core is fixed to its exact endpoint.
 const hand=line(group,[0,0,.1,R,0,.1],'#f8f2ff',.98,3.3),counter=line(group,[0,0,.09,-2,0,.09],'#cab6df',.62,1.7);
 const shutterHands=Array.from({length:6},()=>line(group,[0,0,.10,R,0,.10],'#c3accf',0,.8));
 arc(group,.15,0,TAU,'#eee3f8',.96,.13,2.2);arc(group,.29,0,TAU,'#a28bbd',.55,.12,1.2);
 for(let i=0;i<20000;i++){
  const a=rnd()*TAU,r=11.25+rnd()*1.56;
  p.push(Math.sin(a)*r,Math.cos(a)*r,(rnd()-.5)*.055);phase.push(a);seed.push(rnd());kind.push(i%3===0?1:0);
 }
 for(let i=0;i<1400;i++){p.push(0,0,0);phase.push(0);seed.push(rnd());kind.push(2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('phase',new THREE.Float32BufferAttribute(phase,1));geo.setAttribute('seed',new THREE.Float32BufferAttribute(seed,1));geo.setAttribute('kind',new THREE.Float32BufferAttribute(kind,1));
 const mat=pointMaterial(),dots=new THREE.Points(geo,mat);dots.frustumCulled=false;group.add(dots);
 return {count:p.length/3,update(t){
  // Start near the end of AM; decelerate into the exact sung PM landing.
  const hours=clockHoursAt(t),angle=hours/24*TAU;
  mat.uniforms.angle.value=angle;mat.uniforms.time.value=t;
  const trailSpan=angle-clockHoursAt(t-.045)/24*TAU;
  mat.uniforms.trailSpan.value=Math.max(0,trailSpan);mat.uniforms.trailGain.value=Math.min(1,Math.max(0,trailSpan)*8);
  shutterHands.forEach((o,i)=>{
   const past=clockHoursAt(t-(i+1)/6*.0125)/24*TAU,delta=angle-past;
   moveLine(o,[0,0,.1,R*Math.sin(past),R*Math.cos(past),.1]);
   o.material.opacity=Math.min(1,Math.max(0,delta)*18)*.085*(1-i/7);
  });
  const head=[R*Math.sin(angle),R*Math.cos(angle),.16];
  moveLine(hand,[0,0,.12,...head]);
  moveLine(counter,[0,0,.1,-2.0*Math.sin(angle),-2.0*Math.cos(angle),.1]);
  const noon=clamp((hours-11.6)/.8);am.material.opacity=1-noon*.78;pm.material.opacity=.22+noon*.78;
  const minutes=Math.floor(hours*60),display=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
  return {point:head,coreScale:.88,anchor:[0,0,0],clock:{hours,angle,display,period:hours<12?'AM':'PM',handTip:head,amOpacity:am.material.opacity,pmOpacity:pm.material.opacity,
   movement:'hold-speed-ramp-hold',turnFrames:[6016,6034],turnDurationSeconds:.3,easing:'integrated-cosine-velocity',peakSpeedFrame:6022,
   phase:t<TURN_START?'AM-hold':t<TURN_LAND?'turn':'PM-hold',trailSpan}};
 }};
}
