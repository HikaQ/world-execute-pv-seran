import * as THREE from 'three';
import {PERSONA_CUES as C,PERSONA_MOTION as M,ramp,mix,clamp,random,coreBreath} from './score.js';
import {PERSONA_NOTES,FIELD_NOTES,INSTANCE_NOTE,ANNOTATION_FONT} from './annotations.js';

export const PORTRAIT_URL='/assets/char/seran-avatar-user-20261110.png';
export const PERSONA_FIELDS=[['name','希苒'],['alias','Seran'],['gender','female'],['creator','HIKAQ'],['hair','silver-white'],['eyes','red + violet']];
export const PERSONA_PROFILE=Object.fromEntries(PERSONA_FIELDS);
// Weighted red-iris centroid in the approved, unmirrored 1254 px portrait.
export const RED_IRIS={x:784.9243131071498/1254,y:713.1141775581198/1254};
const irisLocal=[(RED_IRIS.x-.5)*5.2,(.5-RED_IRIS.y)*5.2];
const mono='"JetBrains Mono", "Noto Sans SC"',sans='"Space Grotesk", "Noto Sans SC"';

function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return {c,g:c.getContext('2d'),map};}
function screen(s,w,h){return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:s.map,transparent:true,depthWrite:false,fog:false}));}
function text(g,s,x,y,size,color='#e5d9f2',family=mono){g.font=`500 ${size}px ${family}`;g.fillStyle=color;g.fillText(s,x,y);}

async function createPortrait(){
 const image=new Image();image.src=PORTRAIT_URL;await image.decode();
 const resolution=128,spacing=5.2/(resolution-1);
 const c=document.createElement('canvas');c.width=resolution;c.height=resolution;const g=c.getContext('2d');g.drawImage(image,0,0,resolution,resolution);const pixels=g.getImageData(0,0,resolution,resolution).data;
 const positions=[],colors=[],seeds=[],radii=[],irisMasks=[],rnd=random(1198);
 for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const k=(y*resolution+x)*4;if(pixels[k+3]<100)continue;
  // Offset alternate rows and keep the projected dot diameter proportional to
  // the sample spacing. Subpixel square grids produced visible moire in motion.
  positions.push((x/(resolution-1)-.5)*5.2+(y%2?.25:-.25)*spacing,(.5-y/(resolution-1))*5.2,0);
  colors.push(...[0,1,2].map(j=>Math.pow(pixels[k+j]/255,2.2)*1.12*(pixels[k+3]/255)));
  const distance=Math.hypot(x/(resolution-1)-RED_IRIS.x,y/(resolution-1)-RED_IRIS.y);
  seeds.push(rnd());radii.push(distance/.88);irisMasks.push(Math.exp(-distance*distance/(.045*.045)));
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));geo.setAttribute('radius',new THREE.Float32BufferAttribute(radii,1));geo.setAttribute('irisMask',new THREE.Float32BufferAttribute(irisMasks,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{build:{value:0},gain:{value:0},pointSpacing:{value:spacing},breath:{value:1}},
  vertexShader:`attribute vec3 color;attribute float seed,radius,irisMask;uniform float build,gain,pointSpacing,breath;varying vec3 tint;varying float alpha;
   void main(){float arrive=smoothstep(radius*.57+seed*.05,radius*.57+seed*.05+.18,build);vec3 p=position;
    p.x+=(1.-arrive)*.18*sin(seed*37.);p.y+=(1.-arrive)*.12*sin(seed*23.);p.z+=(1.-arrive)*.16;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float scale=length(modelMatrix[0].xyz);gl_PointSize=clamp(pointSpacing*scale*1.10*810.*projectionMatrix[1][1]/max(.5,-mv.z),1.2,18.);
    tint=color*mix(1.,.88+.12*breath,irisMask);alpha=arrive*gain;}`,
  fragmentShader:`varying vec3 tint;varying float alpha;void main(){vec2 p=gl_PointCoord-.5;float edge=1.-smoothstep(.29,.5,length(p));if(alpha<.005||edge<.005)discard;gl_FragColor=vec4(tint,edge*alpha);}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=4;
 return {points,material:mat,count:seeds.length};
}

export async function createPersonaSequence(scene){
 const group=new THREE.Group();scene.add(group);const avatarGroup=new THREE.Group();group.add(avatarGroup);
 const portrait=await createPortrait();avatarGroup.add(portrait.points);
 const frameSurface=surface(1024,1200),portraitFrame=screen(frameSurface,5.5,6.45);portraitFrame.position.z=.02;avatarGroup.add(portraitFrame);
 const codeSurface=surface(1536,1370),codeGroup=new THREE.Group();group.add(codeGroup);
 const backing=new THREE.Mesh(new THREE.PlaneGeometry(6.5,5.8),new THREE.MeshBasicMaterial({color:'#100d19',transparent:true,opacity:.93,fog:false}));codeGroup.add(backing);
 const code=screen(codeSurface,6.5,5.8);code.position.z=.025;code.renderOrder=4;codeGroup.add(code);
 const headingSurface=surface(1536,180),heading=screen(headingSurface,11.7,1.37);heading.position.set(0,3.75,-5.0);group.add(heading);
 const fieldStarts=PERSONA_FIELDS.map((_,i)=>C.parameters+.05+i*.29),fieldDuration=.22;
 const fieldFinishes=fieldStarts.map(t=>t+fieldDuration),closeAt=fieldFinishes.at(-1)+.04;

 function frameAvatar(t,build,alpha){
  const g=frameSurface.g;g.clearRect(0,0,1024,1200);
  g.strokeStyle='#72568c';g.lineWidth=2;
  for(const [x,y,sx,sy] of [[32,107,1,1],[992,107,-1,1],[32,1080,1,-1],[992,1080,-1,-1]]){g.beginPath();g.moveTo(x+sx*50,y);g.lineTo(x,y);g.lineTo(x,y+sy*50);g.stroke();}
  text(g,build<.99?'AVATAR / CONSTRUCTING':'SERAN / 希苒',52,66,33,'#cfb9e5');
  text(g,t>=C.initialization+.4?'PROFILE LOADED':t>=C.initialization?'INITIALIZING':'PERSONA / LOCAL INSTANCE',52,1140,28,'#aa8ec6');
  portraitFrame.material.opacity=alpha;frameSurface.map.needsUpdate=true;
 }
 function frameCode(t,alpha){
  const g=codeSurface.g;g.clearRect(0,0,1536,1370);text(g,'seran.config.js',78,88,37,'#c1a4dd');text(g,'HIKAQ / LOCAL',1080,88,25,'#9483a8');
  g.strokeStyle='#54415f';g.lineWidth=2;g.beginPath();g.moveTo(78,127);g.lineTo(1450,127);g.stroke();
  const initializing=t>=C.initialization,phase=t<C.parameters?'create':'configure';let completed=0;
  if(phase==='create'){
   text(g,'const seran =',90,360,67,'#c6a8e8');
   const s='new Persona();',n=Math.floor(clamp((t-M.spreadStart)/.62)*s.length);
   text(g,s.slice(0,n),90,470,78,'#eee2fa');
   if(t>=C.creation+.08){text(g,'// avatar instance ready',90,625,35,'#8f7a9f');text(g,INSTANCE_NOTE,90,688,38,'#a897bb',ANNOTATION_FONT);}
  }else{
   text(g,'Object.assign(seran, {',88,258,62,'#cfb1ef');
   PERSONA_FIELDS.forEach(([key,value],i)=>{
    const reveal=clamp((t-fieldStarts[i])/fieldDuration),s=`  ${key}: "${value}",`,part=s.slice(0,Math.floor(reveal*s.length)),y=378+i*112;
    if(reveal<=0)return;if(reveal>=1)completed++;
    if(reveal<1){g.fillStyle='#251b32';g.fillRect(65,y-76,1380,105);}
    const colon=part.indexOf(':');
    if(colon<0)text(g,part,88,y,64,'#c9a8e8');
    else{const prefix=part.slice(0,colon+1);text(g,prefix,88,y,64,'#c9a8e8');const advance=g.measureText(prefix).width;text(g,part.slice(colon+1),88+advance,y,64,'#f0e5fa');}
    if(reveal>=1){g.save();g.globalAlpha=ramp(t,fieldFinishes[i],fieldFinishes[i]+.1);text(g,FIELD_NOTES[key],1080,y,40,'#a897bb',ANNOTATION_FONT);g.restore();}
   });
   if(t>=closeAt)text(g,'});',88,1082,62,'#cfb1ef');
  }
  if(initializing){g.fillStyle='#20192b';g.fillRect(65,1160,1380,126);const s='runtime.attach(seran);',n=Math.floor(ramp(t,C.initialization,C.initialization+.40)*s.length);text(g,s.slice(0,n),88,1244,55,'#e7d6f7');}
  code.material.opacity=alpha;backing.material.opacity=.93*alpha;codeSurface.map.needsUpdate=true;
  return completed;
 }
 function frame(t){
  const enter=ramp(t,C.prepare,C.prepare+.34),retire=ramp(t,16.30,16.90),alpha=enter*(1-ramp(t,16.35,16.84));
  group.visible=alpha>.001;const build=ramp(t,M.reveal,M.revealEnd);
  // The opening lamp occupies the red iris before the face exists. As the
  // composition opens into two columns, that same light travels with her eye.
  const spread=ramp(t,M.spreadStart,M.spreadEnd),avatarScale=mix(1,.18,retire);
  const anchor=[mix(mix(0,-3.65+irisLocal[0],spread),0,retire),mix(mix(0,-.05+irisLocal[1],spread),0,retire),mix(-5.1,-4.63,retire)];
  avatarGroup.position.set(anchor[0]-irisLocal[0]*avatarScale,anchor[1]-irisLocal[1]*avatarScale,anchor[2]);avatarGroup.scale.setScalar(avatarScale);
  codeGroup.position.set(mix(6.8,3.65,spread)+4.1*retire,-.02,-5.0-2.6*retire);codeGroup.rotation.y=-.06*retire;
  portrait.material.uniforms.build.value=build;portrait.material.uniforms.gain.value=alpha;portrait.material.uniforms.breath.value=coreBreath(t).core;
  const eyeLink={weight:ramp(t,C.prepare+.45,M.reveal)*(1-ramp(t,16.9,17.1)),anchor:[anchor[0],anchor[1],anchor[2]+.03],scale:mix(mix(.14,.105,ramp(t,M.reveal,M.reveal+.6)),.14,retire),gain:mix(mix(1,.18,ramp(t,M.reveal+.18,M.reveal+.85)),1,retire),uv:RED_IRIS};
  const fieldsComplete=PERSONA_FIELDS.filter((_,i)=>t>=fieldFinishes[i]).length;
  let headingAnnotation=null;
  if(group.visible){
   frameAvatar(t,build,alpha*spread);frameCode(t,alpha*spread);
   const g=headingSurface.g;g.clearRect(0,0,1536,180);g.textAlign='center';
   const label=t<M.reveal?'PREPARE PERSONA':t<C.creation?'BUILDING SERAN':t<C.parameters?'[LYRIC OMITTED]':t<C.initialization?'[LYRIC OMITTED]':'INITIALIZATION';
   const construct='const seran = new Persona();',typed=construct.slice(0,Math.floor(clamp((t-C.begin)/.55)*construct.length));
   const subtitle=t<M.reveal?'// arrange persona workspace':t<C.begin?'// loading avatar representation':t<C.creation?typed+'▏':t<C.parameters?construct:t<C.initialization?'identity → appearance → creator':'profile → local runtime';
   headingAnnotation=PERSONA_NOTES[label];
   text(g,label,768,61,53,'#eadff4',sans);text(g,headingAnnotation,768,109,26,'#b3a3c7',ANNOTATION_FONT);text(g,subtitle,768,162,21,'#a88cbe');headingSurface.map.needsUpdate=true;heading.material.opacity=alpha;
  }
  return {visible:group.visible,annotation:headingAnnotation,fieldAnnotations:Object.fromEntries(PERSONA_FIELDS.slice(0,fieldsComplete).map(([k])=>[k,FIELD_NOTES[k]])),build,spread,fieldsComplete,profile:Object.fromEntries(PERSONA_FIELDS.slice(0,fieldsComplete)),profileReady:t>=C.initialization+.4,created:t>=M.revealEnd,avatarSource:PORTRAIT_URL,avatarPoints:portrait.count,viewerLeftEye:'purple',viewerRightEye:'red',cues:C,motion:M,fieldStarts,fieldFinishes,eyeLink,metaphor:'power indicator → Seran red iris → watching presence'};
 }
 return {frame};
}
