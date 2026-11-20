import * as T from '/node_modules/three/build/three.module.js';
let atlas;
function glyphAtlas(){
 if(atlas)return atlas;
 const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');
 g.font='500 38px "JetBrains Mono", monospace';g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
 for(let n=0;n<96;n++)g.fillText(String.fromCharCode(n+32),(n%16)*64+32,Math.floor(n/16)*80+40);
 atlas=new T.CanvasTexture(c);atlas.colorSpace=T.NoColorSpace;atlas.anisotropy=8;return atlas;
}
export function glyphField(parent,{center=[0,0,0],span=24,family='memory',surface=null,seed=0,plane='floor'}={}){
 const snippets=globalThis.__upgradeSnippets?.[family]??globalThis.__upgradeSnippets?.memory;
 const blocks=snippets?.blocks??[['function update(time) {','  return stateAt(time);','}']];
 const origins=[],codes=[],tones=[];let sx=span*.008,sy=span*.014;
 const tiles=surface?1:6;
 if(surface){sx=surface.width/Math.min(70,Math.max(26,Math.round(surface.width/.075)));sy=surface.height*.52;}
 for(let tile=0;tile<tiles;tile++){
  const block=blocks[(tile*3+seed)%blocks.length];
  const rows=surface?[block[0]]:block;
  rows.forEach((text,row)=>{
   const count=surface?Math.floor((surface.width-.08)/sx):Math.min(74,text.length);
   for(let col=0;col<Math.min(count,text.length);col++){
    const ch=text.charCodeAt(col);if(ch<=32||ch>127)continue;
    const x=surface?-surface.width/2+.04+col*sx:center[0]+(tile%2===0?-.98:.12)*span+col*sx;
    const y=surface?0:plane==='wall'?center[1]+(Math.floor(tile/2)-1)*span*.36-row*sy*1.55:center[1]-span*.38;
    const z=surface?surface.depth/2+.065:plane==='wall'?center[2]:center[2]+(Math.floor(tile/2)-1)*span*.36+row*sy*1.55;
    origins.push(x,y,z);codes.push(ch-32);tones.push(row===0?.92:.45+.17*((col*7+tile*11)%19)/19);
   }
  });
 }
 const g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));g.setIndex([0,1,2,0,2,3]);
 g.setAttribute('origin',new T.InstancedBufferAttribute(new Float32Array(origins),3));g.setAttribute('glyph',new T.InstancedBufferAttribute(new Float32Array(codes),1));g.setAttribute('shade',new T.InstancedBufferAttribute(new Float32Array(tones),1));g.instanceCount=codes.length;
 const m=new T.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide,blending:surface?T.NormalBlending:T.AdditiveBlending,
  uniforms:{atlas:{value:glyphAtlas()},gain:{value:0},red:{value:0},head:{value:new T.Vector3()},clock:{value:0}},
  vertexShader:`attribute vec3 origin;attribute float glyph,shade;uniform vec3 head;varying vec2 tex;varying float depth,tone,nearHead,coordinate;
   void main(){vec3 p=origin+${surface||plane==='wall'?`vec3(position.x*${sx},position.y*${sy},0.)`:`vec3(position.x*${sx},0.,-position.y*${sy})`};
    vec4 w=modelMatrix*vec4(p,1.),v=viewMatrix*w;gl_Position=projectionMatrix*v;
    vec2 cell=vec2(mod(glyph,16.),floor(glyph/16.));tex=vec2((cell.x*64.+32.+position.x*58.)/1024.,1.-(cell.y*80.+40.-position.y*70.)/512.);
    depth=-v.z;tone=shade;nearHead=exp(-dot(w.xyz-head,w.xyz-head)/${Math.max(8,span*span*.09).toFixed(6)});coordinate=origin.x+origin.z*.7;
   }`,
  fragmentShader:`uniform sampler2D atlas;uniform float gain,red,clock;varying vec2 tex;varying float depth,tone,nearHead,coordinate;
   void main(){float ink=texture2D(atlas,tex).a;float focus=smoothstep(.7,3.,depth)*(1.-smoothstep(80.,180.,depth));
    float scan=.88+.12*cos(coordinate*.9-clock*.8);vec3 color=mix(vec3(.19,.125,.29),vec3(.40,.009,.026),red);
    color+=vec3(.27,.014,.038)*nearHead*.60;${surface?'gl_FragColor=vec4(color*.35,ink*tone*gain*focus*.9);':'gl_FragColor=vec4(color*ink*tone*gain*focus*scan,1.);'}}`});
 const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.userData.upgradeOwned=true;parent.add(mesh);
 return {mesh,material:m,glyphs:codes.length,source:snippets?.source,surface:!!surface};
}
