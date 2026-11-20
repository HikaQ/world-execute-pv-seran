import * as THREE from 'three';
import {LineSegments2} from '/node_modules/three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '/node_modules/three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from '/node_modules/three/examples/jsm/lines/LineMaterial.js';
import {phase,mix,smooth,clamp,hasInfiniteCorridor} from './score.js';
const TAU=Math.PI*2;
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function seg(out,a,b){out.push(...a,...b);}
function rect(out,x0,x1,y0,y1,z){seg(out,[x0,y0,z],[x1,y0,z]);seg(out,[x1,y0,z],[x1,y1,z]);seg(out,[x1,y1,z],[x0,y1,z]);seg(out,[x0,y1,z],[x0,y0,z]);}
function line(parent,positions,color='#ad98c4',opacity=.5,width=1.4){
 const g=new LineSegmentsGeometry();g.setPositions(positions);
 const m=new LineMaterial({color,transparent:true,opacity,linewidth:width,depthWrite:false,alphaToCoverage:false});
 const o=new LineSegments2(g,m);o.frustumCulled=false;
 o.onBeforeRender=function(renderer){LineSegments2.prototype.onBeforeRender.call(this,renderer);m.linewidth=width*m.resolution.y/1080;};
 parent.add(o);return o;
}
function dots(parent,positions,{ink=[.65,.5,.92],alpha=.5,size=88,gain=2.2,vertex='',uniforms={},attributes={}}={}){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const rnd=random(positions.length+173),seeds=Float32Array.from({length:positions.length/3},()=>rnd());g.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
 for(const [key,value] of Object.entries(attributes))g.setAttribute(key,new THREE.Float32BufferAttribute(value,1));
 const declarations=Object.keys(attributes).map(x=>'attribute float '+x+';').join('\n');
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},gain:{value:gain},ink:{value:new THREE.Vector3(...ink)},size:{value:size},alpha:{value:alpha},...uniforms},
  vertexShader:`attribute float seed;${declarations}uniform float time,gain,size,alpha;uniform vec3 ink;
   ${Object.entries(uniforms).map(([k,v])=>`uniform ${v.value instanceof THREE.Vector2?'vec2':'float'} ${k};`).join('\n')}
   varying vec3 col;varying float a;
   void main(){vec3 p=position;col=ink;float weight=1.;${vertex}
   vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;
   gl_PointSize=clamp(size*(.8+seed*.45)/max(1.,-v.z),1.3,4.4);col*=gain;a=alpha*weight;}`,
  fragmentShader:`varying vec3 col;varying float a;void main(){vec2 p=gl_PointCoord-.5;float w=exp(-dot(p,p)*19.);if(a*w<.007)discard;gl_FragColor=vec4(col,w*a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const o=new THREE.Points(g,m);o.frustumCulled=false;parent.add(o);return o;
}
function beacon(parent,color='#b99af3',size=.8){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),a=c.createRadialGradient(64,64,0,64,64,64);
 a.addColorStop(0,'#ffffff');a.addColorStop(.035,'#ffffff');a.addColorStop(.08,color+'e0');a.addColorStop(.14,color+'80');a.addColorStop(.30,color+'20');a.addColorStop(1,color+'00');c.fillStyle=a;c.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const s=new THREE.Sprite(m);s.scale.setScalar(size);parent.add(s);return s;
}
function corePoint(point,extra={}){return {point,coreScale:.88,anchor:[0,0,0],...extra};}

export function createIndex(group){
 const rnd=random(7411),p=[],layers=[],edges=[],marks=[];
 for(let layer=0;layer<14;layer++){
  const z=-layer*2.7;rect(edges,-13,13,-8,8,z);
  for(let row=0;row<64;row++)for(let col=0;col<210;col++){
   if(col%10>=7||(Math.floor(col/10)*31+row*17+layer*11)%23<5)continue;
   p.push(-12.6+col*.121+(rnd()-.5)*.025,-7.6+row*.238,z);layers.push(layer);
  }
  for(let y=-7;y<8;y+=2)seg(marks,[-13,y,z],[-12.4,y,z]);
 }
 line(group,edges,'#ac94c8',.26,1.5);line(group,marks,'#d7c4ee',.6,1.7);
 const selected=[];rect(selected,-13,13,-8,8,0);const selection=line(group,selected,'#f0e1ff',.8,2.1);
 const cloud=dots(group,p,{ink:[.38,.29,.54],alpha:.9,size:122,attributes:{layer:layers},uniforms:{readZ:{value:0}},vertex:`
  float focus=exp(-pow((p.z-readZ)/2.3,2.));weight=.32+.68*focus;col=mix(vec3(.32,.23,.46),vec3(2.6,2.2,3.2),focus);
  float front=exp(-pow((p.x+11.65)/.45,2.));col+=vec3(.6,.1,.2)*front*focus;`});
 const bus=[];seg(bus,[-11.65,0,.16],[-11.65,0,-32]);seg(bus,[-11.65,0,-32],[0,0,-32]);
 line(group,bus,'#d5b6ed',.6,1.8);
 return {count:p.length/3,update(t){
  const z=mix(.16,-32,phase(t,6067/60,103.7));
  cloud.material.uniforms.readZ.value=z;
  selection.position.z=-Math.round(-z/2.7)*2.7;
  return corePoint([-11.65+smooth(phase(t,103.7,104.683))*11.65,0,z],{queryLayer:Math.round(-z/2.7)});
 }};
}

export function createCorridor(group){
 const rnd=random(8831),p=[],edges=[],routes=[];
 for(let side of [-1,1])for(let layer=0;layer<7;layer++){
  const x=side*(8+layer*1.4);
  for(let y=-8;y<=12;y+=4){seg(edges,[x,y,20],[x,y,-83]);}
  for(let z=18;z>=-83;z-=13){seg(edges,[x,-8,z],[x,12,z]);}
  for(let row=0;row<44;row++)for(let col=0;col<335;col++){
   if(col%10>6||(Math.floor(col/10)*29+row*11+layer*13)%19<4)continue;
   p.push(x,-7.5+row*.44+(rnd()-.5)*.015,18-col*.297);
  }
 }
 line(group,edges,'#9a83b3',.10,1.2);
 const cloud=dots(group,p,{alpha:.8,size:130,uniforms:{scanZ:{value:0},missing:{value:0}},vertex:`
  float sweep=exp(-pow((p.z-scanZ)/2.8,2.));float depth=exp(-(abs(p.x)-8.)*.35);
  weight=(.45+sweep*.8)*depth;col=mix(vec3(.58,.43,.84),vec3(2.,1.7,2.3),sweep)*(1.-missing*.4);`});
 // Continue the existing world-space rows and 13-unit grid rhythm to the
 // vanishing point. Sparse distant samples keep the horizon from becoming
 // an opaque block; the endpoint fades away before the camera's far plane.
 const extension=new THREE.Group();extension.name='corridor-vanishing-depth';group.add(extension);extension.visible=false;
 const deep=[],randomDeep=random(8832);
 for(const side of [-1,1])for(let layer=0;layer<7;layer++){
  const x=side*(8+layer*1.4);
  for(let row=0;row<44;row++)for(let col=335;col<5600;){
   const stride=col<800?1:col<1800?2:col<3200?4:8;
   if(!(col%10>6||(Math.floor(col/10)*29+row*11+layer*13)%19<4)
      &&(col<800||row%2===0)&&(col<1800||layer%2===0))
    deep.push(x,-7.5+row*.44+(randomDeep()-.5)*.015,18-col*.297);
   col+=stride;
  }
 }
 const deepCloud=dots(extension,deep,{alpha:.8,size:130,uniforms:{cameraZ:{value:18}},vertex:`
  float depth=exp(-(abs(p.x)-8.)*.35);
  float distance=max(0.,cameraZ-p.z);
  float horizon=1.-smoothstep(500.,1620.,distance);
  weight=.45*depth*horizon;col=vec3(.58,.43,.84);`});
 const deepBatches=[];
 for(let k=0;k<16;k++){
  const near=-83-k*104,far=near-104,rails=[],bus=[];
  for(const side of [-1,1])for(let layer=0;layer<7;layer++){
   const x=side*(8+layer*1.4);
   for(let y=-8;y<=12;y+=4)seg(rails,[x,y,near],[x,y,far]);
   for(let z=-86-k*104;z>=far;z-=13)seg(rails,[x,-8,z],[x,12,z]);
  }
  seg(bus,[0,-4.8,near],[0,-4.8,far]);
  deepBatches.push({z:(near+far)/2,wall:line(extension,rails,'#9a83b3',.10,1.2),bus:line(extension,bus,'#b79bd5',.6,1.65)});
 }
 const nodes=[[-7.96,1,-13],[7.96,4,-32],[-7.96,-1,-53]],boxes=[],lights=[];
 nodes.forEach(([x,y,z])=>{
  const v=[];seg(v,[x,y-2,z-2.5],[x,y+2,z-2.5]);seg(v,[x,y+2,z-2.5],[x,y+2,z+2.5]);seg(v,[x,y+2,z+2.5],[x,y-2,z+2.5]);seg(v,[x,y-2,z+2.5],[x,y-2,z-2.5]);
  boxes.push(line(group,v,'#e8d8fc',.8,2));
  seg(routes,[0,-4.8,z],[x,-4.8,z]);seg(routes,[x,-4.8,z],[x,y,z]);
  const b=beacon(group,'#c9b6ff',1.15);b.position.set(x,y,z);lights.push(b);
 });
 seg(routes,[0,-4.8,20],[0,-4.8,-83]);line(group,routes,'#b79bd5',.6,1.65);
 const returners=Array.from({length:3},()=>beacon(group,'#d8c7ff',.9));
 return {count:(p.length+deep.length)/3,update(t,view={}){
  const infinite=hasInfiniteCorridor(view.shot),cameraZ=view.camera?.[2]??18;
  extension.visible=infinite;deepCloud.material.uniforms.cameraZ.value=cameraZ;
  for(const batch of deepBatches){const fade=1-smooth(phase(cameraZ-batch.z,500,1620));batch.wall.material.opacity=.10*fade;batch.bus.material.opacity=.6*fade;}
  const missing=t>116,u=phase(t,104.683,108.883),z=missing?mix(8,-62,phase(t,118.567,119.467)):mix(15,-58,u);
  cloud.material.uniforms.scanZ.value=z;cloud.material.uniforms.missing.value=missing?1:0;
  nodes.forEach((n,i)=>{const hit=smooth(phase(t,105.2+i*.65,105.45+i*.65));boxes[i].material.opacity=missing?.12:.2+hit*.65;lights[i].material.opacity=missing?0:hit*.8;
   const q=phase(t,107.1+i*.22,108.5+i*.12),b=returners[i];b.position.set(mix(n[0],0,smooth(q)),mix(n[1],-4.8,smooth(q)),mix(n[2],-30,smooth(q)));b.material.opacity=missing?0:Math.sin(q*Math.PI)*.85;
  });
  return corePoint([0,-4.8,missing?mix(8,-37,phase(t,118.567,119.467)):mix(13,-34,u)],{responsePresent:!missing,
   infiniteCorridor:{active:infinite,originalFarZ:-83,extendedFarZ:-1747,farPlane:infinite?2200:350,
    addedParticles:deep.length/3,horizonFade:[500,1620],coreAndCameraUnchanged:true}});
 }};
}

function nodalSegments(m,n){
 const values=[],N=105,step=32/N,f=(x,z)=>Math.cos(m*Math.PI*x/16)*Math.cos(n*Math.PI*z/16)-Math.cos(n*Math.PI*x/16)*Math.cos(m*Math.PI*z/16);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const x=-16+i*step,z=-16+j*step,c=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]],v=c.map(p=>f(...p)),cross=[];
  for(let e=0;e<4;e++){const k=(e+1)%4;if((v[e]>=0)!==(v[k]>=0)){const q=v[e]/(v[e]-v[k]);cross.push([mix(c[e][0],c[k][0],q),.025,mix(c[e][1],c[k][1],q)]);}}
  for(let e=0;e+1<cross.length;e+=2)seg(values,cross[e],cross[e+1]);
 }
 return values;
}
export function createResonance(group){
 const rnd=random(7701),p=[];for(let i=0;i<140000;i++)p.push((rnd()-.5)*32,0,(rnd()-.5)*32);
 const cloud=dots(group,p,{ink:[1.45,1.15,1.85],alpha:.9,size:133,uniforms:{mode:{value:new THREE.Vector2(1,2)},pulse:{value:0}},vertex:`
  vec2 x=p.xz/16.;float f=cos(mode.x*3.14159265*x.x)*cos(mode.y*3.14159265*x.y)-cos(mode.y*3.14159265*x.x)*cos(mode.x*3.14159265*x.y);
  float node=exp(-f*f*72.);weight=.025+.97*node;
  float wave=sin(length(p.xz)*1.6-time*19.)*exp(-length(p.xz)*.03);p.y=wave*pulse*3.2;
  col=mix(vec3(.28,.16,.44),vec3(1.7,1.4,2.05),node);`});
 const boundary=[];seg(boundary,[-16,0,-16],[16,0,-16]);seg(boundary,[16,0,-16],[16,0,16]);seg(boundary,[16,0,16],[-16,0,16]);seg(boundary,[-16,0,16],[-16,0,-16]);line(group,boundary,'#d1bae8',.65,1.75);
 const modes=[[1,2],[1,3],[2,3],[3,5]],contours=modes.map(([m,n])=>line(group,nodalSegments(m,n),'#e8daff',.46,1.35));
 const exciters=[[-8,0,4],[7,0,-6],[0,0,8]].map(p=>{const b=beacon(group,'#d5c2ff',1.15);b.position.set(...p);return b;});
 return {count:p.length/3,update(t){
  const i=t<109.8?0:t<110.733?1:t<111.65?2:3;
  const impulse=t>=111.65?Math.exp(-(t-111.65)*1.6):.08;
  cloud.material.uniforms.mode.value.set(...modes[i]);cloud.material.uniforms.pulse.value=impulse;
  contours.forEach((o,j)=>{o.visible=j===i;o.material.opacity=.36*(1-impulse*.85);});
  exciters.forEach((b,j)=>{b.material.opacity=.45+impulse*.5;b.scale.setScalar(1+impulse*.7);});
  return corePoint([mix(-8,2,phase(t,108.883,112.558)),.3,8],{mode:modes[i],impulse});
 }};
}

export function createCompletion(group){
 const rnd=random(9719),p=[],edge=[];
 for(let layer=0;layer<9;layer++){
  const y=-3.6+layer*.9;
  seg(edge,[-13,y,-9],[13,y,-9]);seg(edge,[13,y,-9],[13,y,9]);seg(edge,[13,y,9],[-13,y,9]);seg(edge,[-13,y,9],[-13,y,-9]);
  for(let row=0;row<48;row++)for(let col=0;col<130;col++)if(col%10<7&&(row*17+Math.floor(col/10)*23+layer*7)%13>3)p.push(-12.7+col*.197,y+(rnd()-.5)*.018,-8.7+row*.37);
 }
 line(group,edge,'#c9b2e2',.5,1.6);
 const cloud=dots(group,p,{alpha:.95,size:139,uniforms:{activation:{value:0},scanX:{value:0}},vertex:`
  float scan=exp(-pow((p.x-scanX)/1.5,2.));weight=.2+.6*activation+.4*scan;col=mix(vec3(.32,.23,.48),vec3(1.3,1.05,1.65),activation)+scan*vec3(.9,.7,1.2);`});
 const routes=[];seg(routes,[-12,-3.5,9],[14,-3.5,9]);seg(routes,[14,-3.5,9],[14,5,9]);seg(routes,[14,5,9],[14,5,-6]);line(group,routes,'#ceb4ee',.65,1.8);
 const returning=beacon(group,'#c0a1fa',1.5),remote=beacon(group,'#c9b7ed',.95);remote.position.set(14,5,-6);
 return {count:p.length/3,update(t){
  const a=smooth(phase(t,114.416,115.55));cloud.material.uniforms.activation.value=a;cloud.material.uniforms.scanX.value=mix(-13,13,phase(t,114.416,116.266));
  const q=phase(t,115.15,116.267),path=q<.35?[14,5,mix(-6,9,q/.35)]:q<.55?[14,mix(5,-3.5,(q-.35)/.2),9]:[mix(14,-12,(q-.55)/.45),-3.5,9];
  returning.position.set(...path);returning.material.opacity=q>0?.85:0;
  return corePoint([-12,-3.5,9],{activation:a,replyProgress:q});
 }};
}

export function createLink(group){
 const local=[],edges=[],remote=[],r=random(8171),route=[];
 for(const x of [-14,14])for(let l=0;l<5;l++){
  const y=-1+l*.5,e=x<0?edges:remote;
  seg(e,[x-4,y,-5],[x+4,y,-5]);seg(e,[x+4,y,-5],[x+4,y,5]);seg(e,[x+4,y,5],[x-4,y,5]);seg(e,[x-4,y,5],[x-4,y,-5]);
  if(x<0)for(let j=0;j<45;j++)for(let k=0;k<60;k++)if(k%10<7&&(j*11+k*7+l)%9>2)local.push(x-3.8+k*.129,y+(r()-.5)*.014,-4.7+j*.21);
 }
 line(group,edges,'#cebae5',.55,1.7);const vacant=line(group,remote,'#8d7a9d',.37,1.35);
 dots(group,local,{ink:[.9,.7,1.2],alpha:.7,size:110});
 seg(route,[-14,.5,4],[14,.5,4]);line(group,route,'#a68bba',.48,1.5);
 const responses=Array.from({length:3},()=>beacon(group,'#bd9ded',1.3));
 const request=beacon(group,'#e4a2c0',.8);
 return {count:local.length/3,update(t){
  const leaving=phase(t,116.267,117.1),retry=t>=129.183;
  responses.forEach((b,i)=>{b.position.set(14,1+i*.4,-1+i*1.7);b.material.opacity=retry?0:(1-smooth(leaving))*.8;});
  const q=retry?phase(t,129.18,130.25):((t-116.267)*1.15)%1;
  request.position.set(mix(-14,14,smooth(q)),.5,4);request.material.opacity=(retry&&t>130.25)?0:Math.sin(q*Math.PI)*.75;
  vacant.material.opacity=retry?.25:.37;
  const departure=phase(t,130.8,131.016667);
  return corePoint([mix(-14,-6,departure*departure),.55,mix(4,-3,departure*departure)],{responsePresent:t<117.1,waiting:!retry,departing:departure});
 }};
}

export function createQueue(group){
 const r=random(4211),p=[],rows=[],sides=[],bars=[];
 for(let layer=0;layer<6;layer++){
  for(let row=0;row<35;row++){
   const length=13+((row*17+layer*7)%16),y=-5+row*.5,z=-layer*2.1;
   const g=new THREE.Group();group.add(g);
   const edge=[];rect(edge,-14,-14+length,y-.11,y+.11,z);const l=line(g,edge,'#c4aedc',.5,1.45);bars.push({l,row,layer});
   for(let k=0;k<Math.floor(length*9);k++)if(k%12<9){p.push(-14+k/9,y+(r()-.5)*.13,z+.015);rows.push(row);sides.push(layer);}
  }
 }
 const cloud=dots(group,p,{alpha:.85,size:90,attributes:{row:rows,layer:sides},uniforms:{filled:{value:10}},vertex:`
  float on=1.-smoothstep(filled-.8,filled,row);weight=on*exp(-layer*.22);col=mix(vec3(1.3,1.1,1.6),vec3(.35,.22,.55),layer/6.);
  float edge=exp(-pow((row-filled+1.)/1.2,2.));col+=vec3(.5,.1,.25)*edge;`});
 return {count:p.length/3,update(t){
  const n=mix(8,35,phase(t,119.46,122.72));cloud.material.uniforms.filled.value=n;
  bars.forEach(({l,row,layer})=>l.material.opacity=(1-smooth(phase(row,n-.8,n)))*.47*Math.exp(-layer*.27));
  return corePoint([-13.7,-5+Math.min(34,n-1)*.5,.08],{pendingRows:Math.floor(n)});
 }};
}

export function createCache(group){
 const r=random(88119),p=[],duplicate=[],delay=[],layers=[],edge=[],border=[];
 for(let layer=0;layer<10;layer++){
  const z=-layer*.8;rect(edge,-18,18,-7.5,7.5,z);
  for(let row=0;row<36;row++)for(let col=0;col<120;col++){
   if(col%9===8)continue;
   const x=-17.8+col*.3,y=-7.3+row*.417,left=-2.2+Math.floor(row/5)*.18+Math.sin(Math.floor(row/4))*1.15,right=4.9+Math.cos(Math.floor(row/5))*1.2;
   const removed=x>left&&x<right,near=Math.abs(x-left)<.33||Math.abs(x-right)<.33;
   for(let k=0;k<2;k++){p.push(x+(k-.5)*.11+(r()-.5)*.016,y+(r()-.5)*.035,z);duplicate.push(removed?1:0);delay.push(row/36*.45+layer*.018);layers.push(layer);}
   if(near&&layer%3===0)seg(border,[x,y-.18,z],[x,y+.18,z]);
  }
 }
 line(group,edge,'#b99bce',.20,1.2);const gaps=line(group,border,'#e2c8ff',.0,1.65);
 const cloud=dots(group,p,{alpha:.78,size:108,attributes:{duplicate,delay,layer:layers},uniforms:{erase:{value:0},align:{value:0}},vertex:`
  float e=smoothstep(delay,delay+.45,erase)*duplicate;
  p.z-=e*(8.+seed*22.);p.x+=e*(seed-.5)*.8;p.y-=e*.55;
  p.z*=1.-align*.52;
  weight=(1.-e*.97)*exp(-layer*.12);col=mix(vec3(.6,.43,.9),vec3(1.55,1.28,1.9),1.-layer/10.);
  float rim=exp(-pow((position.x-1.)/3.7,2.));col+=rim*erase*vec3(.3,.15,.5);`});
 return {count:p.length/3,update(t){
  const erase=phase(t,124.66,126.84),align=smooth(phase(t,127.345,129.19));
  cloud.material.uniforms.erase.value=erase;cloud.material.uniforms.align.value=align;gaps.material.opacity=smooth(erase)*.56;
  gaps.scale.z=1-align*.52;
  const q=phase(t,123.65,126.84);
  return corePoint([mix(-15,-1.45,smooth(q)),mix(4,-1.5,q),.32],{cacheRemoval:erase,retainedOriginal:true,alignment:align});
 }};
}

export function createBoundary(group){
 const r=random(9503),p=[];
 for(let i=0;i<180000;i++){
  const y=(r()-.5)*66,z=-5-r()*14,x=-3+Math.abs(y)*.10+r()*47;
  p.push(x,y,z);
 }
 dots(group,p,{ink:[.65,.52,.95],alpha:.9,size:95,gain:2.6});
 return {count:p.length/3,update(t){
  const u=phase(t,130.323,131.016667),distance=32,scale=1080/(2*distance*Math.tan(23*Math.PI/180));
  const x=(mix(470,576,smooth(u))-960)/scale,y=(540-mix(845,930,smooth(u)))/scale;
  return corePoint([x,y,0],{boundaryAnchor:[576,930]});
 }};
}
