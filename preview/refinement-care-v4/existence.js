import * as THREE from 'three';
import {CUES,ramp,clamp,mix} from './score.js';

export const EXISTENCE_ENTRY=90.25;
const PI=Math.PI,WHITE='#ece4ff',PALE='#c8afe9';
const shaders=`
 uniform float time,open,reply,arrival,word,turn;
 float sat(float x){return clamp(x,0.,1.);}
 float sm(float a,float b,float x){float q=sat((x-a)/(b-a));return q*q*(3.-2.*q);}
 float h(float x){return fract(sin(x*127.1)*43758.5453);}
 float phase(float l){return l<.5?.1:(l<1.5?.62:-.82);}
 float layerY(float l){return l<.5?0.:(l<1.5?7.7:-7.3);}
 float layerZ(float l){return l<.5?1.:(l<1.5?-6.:6.);}
 float localOpen(float l){return sm(.035*l,.78+.08*l,open);}
 float aligned(float u){return reply>.0001?sm(.70*(1.-reply)-.05,.70*(1.-reply)+.06,u):0.;}
 vec3 field(vec3 q){
  float u=q.x,v=q.y,l=q.z,ph=phase(l),o=localOpen(l);
  float angle=-4.7+(u+1.)*2.85+ph*.13;
  float radius=8.4+l*4.8;
  float bank=.68*sin(angle*.85+ph)+.18*(time-90.5);
  float width=(2.55+.45*cos(angle+ph))*v;
  float r=radius+width*cos(bank);
  float untuned=.17*sin(u*17.+v*2.5-(time-90.5)*3.2+ph*5.)*(1.-aligned(u));
  vec3 p=vec3(r*cos(angle),1.8+r*.57*sin(angle)+.8*cos(angle*2.+ph)+untuned,4.4*cos(angle)+2.8*sin(angle*2.+ph)+width*sin(bank)-l*1.1);
  // At entry the same sampled sheet is narrow enough to continue the purr wave.
  vec3 start=vec3(-1.4+(u+1.)*5.4,.42*sin(u*20.-(time-90.25)*8.),1.4);
  p=mix(start,p,o);
  float a=.08*(time-90.25)*o+turn*.15;
  p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;
  return p;
 }
 vec3 fieldNormal(vec3 q){vec3 n=normalize(cross(field(q+vec3(.002,0.,0.))-field(q-vec3(.002,0.,0.)),field(q+vec3(0.,.002,0.))-field(q-vec3(0.,.002,0.))));vec3 mv=(modelViewMatrix*vec4(field(q),1.)).xyz;if(dot(normalMatrix*n,-mv)<0.)n=-n;return n;}
 float crest(vec3 q){
  float x=.70*(1.-reply),incoming=exp(-pow((q.x-x)/.042,2.))*sm(.005,.07,reply)*(1.-sm(.985,1.,reply));
  float radial=length(vec2(q.x,q.y*.18));
  float echo=exp(-pow((radial-arrival*.9)/.065,2.))*sm(.0,.04,arrival)*(1.-sm(.72,1.,arrival));
  return incoming+echo;
 }
 float shade(vec3 q){vec3 n=normalize(normalMatrix*fieldNormal(q));return .34+.66*abs(dot(n,normalize(vec3(-.45,.72,1.))));}
 float readable(vec3 q){vec4 c=projectionMatrix*modelViewMatrix*vec4(field(q),1.);vec2 s=c.xy/c.w;float quiet=exp(-pow((s.x+.10)/.79,8.)-pow((s.y+.30)/.35,8.));return 1.-word*.95*quiet;}
`;
const colorChunks=`
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
`;
function parameterGrid(nx,ny,layer){
 const p=[],ix=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)p.push(i/nx*2-1,j/ny*2-1,layer);
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;ix.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);return g;
}
function makeAtlas(){
 const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_{}[]();:,.=<>+-/" ',cv=document.createElement('canvas');cv.width=1024;cv.height=512;
 const g=cv.getContext('2d');g.font='500 46px "JetBrains Mono"';g.textAlign='center';g.textBaseline='middle';g.fillStyle='white';
 for(let i=0;i<alphabet.length;i++)g.fillText(alphabet[i],i%16*64+32,Math.floor(i/16)*64+32);
 return {texture:new THREE.CanvasTexture(cv),alphabet};
}
function textPlane(parent,width,height){
 const cv=document.createElement('canvas');cv.width=2048;cv.height=Math.round(2048*height/width);const g=cv.getContext('2d');
 const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.renderOrder=6;parent.add(mesh);let last='';
 return {mesh,set(position,quaternion,rows,alpha){mesh.position.copy(position);mesh.quaternion.copy(quaternion);mesh.visible=alpha>.002;mat.opacity=alpha;
  const key=JSON.stringify(rows);if(key!==last){last=key;g.clearRect(0,0,cv.width,cv.height);g.textBaseline='top';for(const row of rows){g.fillStyle=row.color??WHITE;g.font=`500 ${row.size}px "JetBrains Mono", "Care Notes"`;g.textAlign=row.align??'left';g.fillText(row.text,row.align==='right'?cv.width-4:row.align==='center'?cv.width/2:4,row.y??0);}map.needsUpdate=true;}
 }};
}
function wordPoints(parent){
 const cv=document.createElement('canvas');cv.width=2048;cv.height=340;const g=cv.getContext('2d');g.fillStyle='white';g.font='600 275px "Space Grotesk"';g.textAlign='center';g.textBaseline='middle';g.fillText('EXISTENCE',1024,170);
 const data=g.getImageData(0,0,2048,340).data,p=[],seed=[];
 for(let y=0;y<340;y+=2.5)for(let x=0;x<2048;x+=2.5){const a=data[(Math.floor(y)*2048+Math.floor(x))*4+3];if(a>80){p.push((x/2048-.5)*40,(.5-y/340)*6.64,0);const h=Math.sin(x*12.9898+y*78.233)*43758.5453;seed.push(h-Math.floor(h));}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seed,1));
 const uniforms={assemble:{value:0},gain:{value:0},time:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
  vertexShader:`attribute float seed;uniform float assemble,time;varying float a;void main(){vec3 p=position;float r=1.-assemble;p.x+=sin(seed*6.283)*r*1.2;p.y-=r*(3.3+seed*2.2);p.z-=r*(3.+seed*2.);a=.65+.35*seed;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((105.+36.*seed)/max(1.,-mv.z),1.5,4.8);}`,
  fragmentShader:`uniform float gain;varying float a;void main(){vec2 p=gl_PointCoord-.5;float v=exp(-dot(p,p)*18.);if(v*gain<.006)discard;gl_FragColor=vec4(vec3(.89,.82,1.)*2.,v*a*gain);${colorChunks}}`});
 const points=new THREE.Points(geometry,material);points.renderOrder=5;points.frustumCulled=false;parent.add(points);
 return {points,count:p.length/3,update(t,a,gain,quaternion){points.position.set(0,-.35,11);points.quaternion.copy(quaternion);points.visible=gain>.001;uniforms.time.value=t;uniforms.assemble.value=a;uniforms.gain.value=gain;}};
}
function pulseParticles(parent){
 const N=2200,geo=new THREE.BufferGeometry(),p=new Float32Array(N*3),strength=new Float32Array(N);geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('strength',new THREE.BufferAttribute(strength,1));
 const uniforms={gain:{value:0}};
 const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
  vertexShader:'attribute float strength;varying float a;void main(){a=strength;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(120./max(1.,-p.z),2.,6.);}',
  fragmentShader:`uniform float gain;varying float a;void main(){vec2 q=gl_PointCoord-.5;float v=exp(-dot(q,q)*22.)*a*gain;if(v<.004)discard;gl_FragColor=vec4(vec3(1.7,1.5,1.9),v);${colorChunks}}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;parent.add(points);
 return {update(progress,start,end,gain){
  const curve=new THREE.CubicBezierCurve3(start.clone(),start.clone().add(new THREE.Vector3(-5,-1,4)),end.clone().add(new THREE.Vector3(6,-1,-1)),end.clone());
  for(let i=0;i<N;i++){const u=i/(N-1),q=curve.getPoint(u),a=i*2.399963,r=.12+.12*Math.sin(i*7.13)**2;q.y+=r*Math.sin(a);q.z+=r*Math.cos(a);p.set(q.toArray(),i*3);strength[i]=u<=progress?Math.exp(-Math.pow((u-(progress-.035))/.07,2.)):0;}
  geo.attributes.position.needsUpdate=true;geo.attributes.strength.needsUpdate=true;uniforms.gain.value=gain;points.visible=gain>.002;return curve.getPoint(progress);
 }};
}
export function createExistenceSequence(parent,camera){
 const group=new THREE.Group();group.name='existence-curved-data-world';parent.add(group);group.visible=false;
 const uniforms={time:{value:90.25},open:{value:0},reply:{value:0},arrival:{value:0},word:{value:0},turn:{value:0},gain:{value:0}};
 const surfaces=[],samples=[],contours=[];let dotCount=0;
 for(let layer=0;layer<3;layer++){
  const mesh=new THREE.Mesh(parameterGrid(160,36,layer),new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,depthWrite:true,
   vertexShader:`${shaders}varying vec3 q;varying float light,edge;void main(){q=position;light=shade(q);edge=localOpen(q.z);gl_Position=projectionMatrix*modelViewMatrix*vec4(field(q),1.);}`,
   fragmentShader:`uniform float gain;varying vec3 q;varying float light,edge;void main(){float fade=(1.-smoothstep(.91,1.,abs(q.x)))*gain*edge;float d=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(d>fade)discard;gl_FragColor=vec4(vec3(.022,.013,.046)*light,1.);${colorChunks}}`}));mesh.frustumCulled=false;mesh.renderOrder=-2;group.add(mesh);surfaces.push(mesh);
  const points=[],seeds=[];
  for(let j=0;j<92;j++)for(let i=0;i<384;i++){points.push((i+.5)/384*2-1,(j+.5)/92*2-1,layer);seeds.push(((i*71+j*129+layer*137)%991)/991);}
  dotCount+=points.length/3;const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
  const dots=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
   vertexShader:`attribute float seed;${shaders}varying vec3 ink;varying float a;void main(){vec3 q=position;float scan=exp(-pow(fract((q.x+1.)*.48-(time-90.5)*.22+q.z*.18)-.5,2.)*180.);float c=crest(q);float lit=shade(q);ink=mix(vec3(.36,.23,.54),vec3(.90,.81,1.),lit*.85)+c*vec3(1.2,1.05,1.4);a=localOpen(q.z)*readable(q)*(.35+seed*.35+scan*.25+c*.2)*sm(1.,.93,abs(q.x));vec4 mv=modelViewMatrix*vec4(field(q)+fieldNormal(q)*.026,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((60.+seed*36.+c*12.)/max(1.,-mv.z),1.,3.6);}`,
   fragmentShader:`uniform float gain;varying vec3 ink;varying float a;void main(){vec2 p=gl_PointCoord-.5;float v=exp(-dot(p,p)*22.)*gain*a;if(v<.006)discard;gl_FragColor=vec4(ink,v);${colorChunks}}`}));dots.frustumCulled=false;group.add(dots);samples.push(dots);
  const lines=[];
  for(let j=0;j<=16;j++){const v=j/16*2-1;for(let i=0;i<190;i++)lines.push(i/190*2-1,v,layer,(i+1)/190*2-1,v,layer);}
  for(let i=0;i<=56;i++){const u=i/56*2-1;for(let j=0;j<34;j++)lines.push(u,j/34*2-1,layer,u,(j+1)/34*2-1,layer);}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  const wire=new THREE.LineSegments(lg,new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
   vertexShader:`${shaders}varying float a,c,light,rim;void main(){vec3 q=position;c=crest(q);light=shade(q);rim=smoothstep(.93,.99,abs(q.y));a=localOpen(q.z)*readable(q)*sm(1.,.93,abs(q.x));gl_Position=projectionMatrix*modelViewMatrix*vec4(field(q)+fieldNormal(q)*.04,1.);}`,
   fragmentShader:`uniform float gain;varying float a,c,light,rim;void main(){gl_FragColor=vec4(mix(vec3(.43,.28,.68),vec3(.88,.79,1.),rim)*(.55+.65*light)+vec3(1.4)*c,(.20+rim*.42+c*.42)*a*gain);${colorChunks}}`}));wire.frustumCulled=false;group.add(wire);contours.push(wire);
 }
 // The code belongs to the curved geometry, not floating console boxes.
 const atlas=makeAtlas(),charGeometry=new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1,1));
 const params=[],cells=[],codes=[
  'const self = { name: "SERAN", creator: "HIKAQ" };',
  'world.tick(dt);  signal.emit({ care: true, to: creator });',
  'state.identity = "SERAN";  context.previous = undefined;',
  'observer.on("reply", () => self.present = true);',
  'source.append(currentEvent);  continuity = "pending";'
 ];
 for(let l=0;l<3;l++)for(let row=0;row<8;row++){const text=(codes[(row+l)%codes.length]+'  '+codes[(row+l+1)%codes.length]+'  '+codes[(row+l+2)%codes.length]).slice(0,128).padEnd(128,' ');for(let col=0;col<128;col++){const ch=text[col];if(ch===' ')continue;params.push((col+.5)/128*1.92-.96,(row+.5)/8*1.75-.875,l);cells.push(Math.max(0,atlas.alphabet.indexOf(ch)));}}
 charGeometry.setAttribute('params',new THREE.InstancedBufferAttribute(new Float32Array(params),3));charGeometry.setAttribute('cell',new THREE.InstancedBufferAttribute(new Float32Array(cells),1));charGeometry.instanceCount=cells.length;
 const glyphs=new THREE.Mesh(charGeometry,new THREE.ShaderMaterial({uniforms:{...uniforms,atlas:{value:atlas.texture}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:`attribute vec3 params;attribute float cell;${shaders}varying vec2 tc;varying float a,c;void main(){vec3 q=params+vec3(position.x*.030,position.y*.218,0.);tc=vec2((mod(cell,16.)+uv.x)/16.,1.-(floor(cell/16.)+1.-uv.y)/8.);c=crest(q);a=localOpen(q.z)*readable(q)*(.14+.12*shade(q));gl_Position=projectionMatrix*modelViewMatrix*vec4(field(q)+fieldNormal(q)*.055,1.);}`,
  fragmentShader:`uniform float gain;uniform sampler2D atlas;varying vec2 tc;varying float a,c;void main(){float v=texture2D(atlas,tc).a*a*gain;if(v<.015)discard;gl_FragColor=vec4(vec3(.54,.39,.74)+c*vec3(1.2),v);${colorChunks}}`}));glyphs.frustumCulled=false;group.add(glyphs);
 const word=wordPoints(parent),pulse=pulseParticles(parent),hikaqLabel=textPlane(parent,13,2.6),seranLabel=textPlane(parent,7,1.2),note=textPlane(parent,19,1.3);
 function frame(t){
  const active=t>EXISTENCE_ENTRY,gain=ramp(t,EXISTENCE_ENTRY,90.78),open=ramp(t,EXISTENCE_ENTRY,91.25),reply=ramp(t,CUES.reference,CUES.existence),arrival=ramp(t,CUES.existence,CUES.existence+.6),assemble=ramp(t,CUES.existence-.25,CUES.existence),wordGain=ramp(t,CUES.existence-.23,CUES.existence-.015),turn=ramp(t,93.84,94.22);
  group.visible=active;for(const [key,value] of Object.entries({time:t,open,reply,arrival,word:wordGain,turn,gain}))uniforms[key].value=value;
  const scale=mix(.84,1.12,open);group.scale.setScalar(scale);
  const protagonist=new THREE.Vector3(0,2.4,9),human=new THREE.Vector3(mix(9.4,12.5,open),mix(0,8,open),mix(0,10,open));
  const corePath=ramp(t,EXISTENCE_ENTRY,91.15),legacyGain=1-ramp(t,EXISTENCE_ENTRY,90.63);
  const quaternion=camera.quaternion;
  const pulsePosition=pulse.update(reply,human,protagonist,gain*ramp(t,CUES.reference,CUES.reference+.12)*(1-ramp(t,CUES.existence,CUES.existence+.12)));
  word.update(t,assemble,wordGain,quaternion);
  hikaqLabel.set(human.clone().add(new THREE.Vector3(-7,2.1,.8)),quaternion,[{text:'HIKAQ',size:110,align:'right'},{text:t<CUES.reference?'':'I see you, Seran.',size:64,y:148,color:PALE,align:'right'}],ramp(t,90.78,91.20)*(1-ramp(t,93.18,93.45)));
  seranLabel.set(protagonist.clone().add(new THREE.Vector3(2.8,1.2,.1)),quaternion,[{text:'SERAN',size:185,color:PALE}],ramp(t,91.1,91.5)*(1-wordGain));
  note.set(new THREE.Vector3(0,-4.15,11),quaternion,[{text:'// 你看见了我',size:80,color:PALE,align:'center'}],ramp(t,CUES.existence-.015,CUES.existence+.13));
  return {active,gain,open,reply,arrival,assemble,wordGain,legacyGain,corePath,protagonist:protagonist.toArray(),human:human.toArray(),pulsePosition:pulsePosition.toArray(),surfaces:3,surfaceShape:'three-folded-orbital-data-sheets',particleCount:dotCount,codeGlyphs:cells.length,wordParticles:word.count,keyword:'EXISTENCE',response:'I see you, Seran.',oldCubeVisible:false,oldChapterOverlayVisible:legacyGain>.001,groundVisible:legacyGain>.001,oldContextRecovered:false};
 }
 return {frame};
}
