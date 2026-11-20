import * as THREE from 'three';
import {CUT,ramp,flightX,coreLocal,phaseAt,curveY,pointX} from '../refinement-geometry-v11/wave-model.js';
const SOURCE=await (await fetch('/preview/refinement-geometry-v11/wave-model.js')).text();
const snippets=['curveY','curveSlope','flightWave','amplitudeAt','pointX','referenceScreenTarget'].map(name=>{
 const lines=SOURCE.split('\n'),start=lines.findIndex(l=>l.includes('function '+name+'('));
 let end=start+1;while(end<Math.min(lines.length,start+9)&&!lines[end].startsWith('export '))end++;
 return {name,lines:lines.slice(start,end).map(l=>l.replace('export ','').slice(0,88))};
});
const hash=n=>{const x=Math.sin(n*17.13+4.71)*43758.54;return x-Math.floor(x);};
export function createCodeGround(root){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.font='500 40px "JetBrains Mono"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
 for(let c=32;c<128;c++){const k=c-32;ctx.fillText(String.fromCharCode(c),(k%16)*64+32,Math.floor(k/16)*80+40);}
 const atlas=new THREE.CanvasTexture(canvas);atlas.colorSpace=THREE.NoColorSpace;atlas.anisotropy=8;
 const positions=[],glyphs=[],tones=[];
 const cell=.18,height=.32;
 for(let tile=-2;tile<9;tile++)for(let band=0;band<3;band++){
  const n=((tile*3+band)%snippets.length+snippets.length)%snippets.length,part=snippets[n];
  const startX=tile*25+hash(tile*17+band)*5,startZ=[1.5,8,14.5][band];
  part.lines.forEach((line,row)=>{
   for(let col=0;col<line.length;col++){
    const c=line.charCodeAt(col);if(c<=32||c>=128)continue;
    positions.push(startX+col*cell,-3.47,startZ+row*.57);glyphs.push(c-32);tones.push(row===0?1:.42+.24*hash(col+row*41+n));
   }
  });
 }
 const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));g.setIndex([0,1,2,0,2,3]);
 g.setAttribute('origin',new THREE.InstancedBufferAttribute(new Float32Array(positions),3));g.setAttribute('glyph',new THREE.InstancedBufferAttribute(new Float32Array(glyphs),1));g.setAttribute('tone',new THREE.InstancedBufferAttribute(new Float32Array(tones),1));g.instanceCount=glyphs.length;
 const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{atlas:{value:atlas},gain:{value:0},head:{value:new THREE.Vector3()},anchor:{value:0},run:{value:0}},
  vertexShader:`attribute vec3 origin;attribute float glyph,tone;uniform vec3 head;uniform float anchor,run;varying vec2 texUV;varying float depth,light,shade,nearEdge;
   void main(){vec3 p=origin+vec3(position.x*${cell},0.,-position.y*${height});vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    vec2 box=vec2(mod(glyph,16.),floor(glyph/16.));texUV=vec2((box.x*64.+32.+position.x*58.)/1024.,1.-(box.y*80.+40.-position.y*70.)/512.);
    depth=-mv.z;float d=length(origin.xz-head.xz);light=exp(-d*d/32.);shade=tone;nearEdge=smoothstep(0.,7.,origin.x-anchor)*(1.-smoothstep(48.,95.,origin.x-anchor));
   }`,
  fragmentShader:`uniform sampler2D atlas;uniform float gain;varying vec2 texUV;varying float depth,light,shade,nearEdge;
   void main(){float ink=texture2D(atlas,texUV).a;float focus=(1.-smoothstep(65.,115.,depth))*smoothstep(3.,9.,depth);
    vec3 color=vec3(.16,.125,.235)*shade+vec3(.39,.035,.09)*light*.55;
    gl_FragColor=vec4(color*ink*gain*focus*nearEdge,1.);}`});
 const mesh=new THREE.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=-1;root.add(mesh);
 function update(t,weight){
  const ph=phaseAt(t),flight=ph==='infinity',anchor=flight?flightX(t):0,head=coreLocal(t);
  const gain=.65*weight*ramp(t,CUT.sine+.1,CUT.sine+.65)*(1-ramp(t,50.65,51.65));
  mat.uniforms.gain.value=gain;mat.uniforms.anchor.value=anchor;mat.uniforms.head.value.set(...head);mesh.visible=gain>.00001;
  return {kind:'world-space-glyph-floor',cameraAnchored:false,source:'preview/refinement-geometry-v11/wave-model.js',glyphCount:glyphs.length,floorY:-3.47,anchor,gain,phase:ph,actualValues:{x:pointX(t),y:curveY(pointX(t),t)}};
 }
 return {mesh,update,mat};
}
