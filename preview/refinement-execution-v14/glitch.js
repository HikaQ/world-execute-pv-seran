import * as THREE from 'three';

const W=1920,H=1080;
const hash=n=>{const x=Math.sin(n*93.17+71.21)*43758.5453;return x-Math.floor(x);};

export function createGlitch(plan){
 const events=plan.glitch.events;
 const input=document.createElement('canvas');input.width=W;input.height=H;
 const inputContext=input.getContext('2d',{alpha:false});
 const texture=new THREE.CanvasTexture(input);texture.colorSpace=THREE.NoColorSpace;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
 const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const uniforms={source:{value:texture},strength:{value:0},seed:{value:0},split:{value:0},bandCount:{value:3},bands:{value:Array.from({length:5},()=>new THREE.Vector4())},kind:{value:0}};
 const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`precision highp float;
   uniform sampler2D source;uniform float strength,seed,split,bandCount,kind;uniform vec4 bands[5];varying vec2 vUv;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   vec3 sampleAt(vec2 p){return texture2D(source,clamp(p,vec2(.0006),vec2(.9994))).rgb;}
   void main(){
    vec2 uv=vUv;vec3 original=sampleAt(uv);float top=1.-uv.y;
    float tear=0.,stripe=0.;
    for(int i=0;i<5;i++){
     if(float(i)>=bandCount)break;
     vec4 b=bands[i];float inside=1.-step(b.y,abs(top-b.x));
     // A horizontal run ends at a discrete packet boundary; other rows keep moving.
     float range=step(b.w,uv.x)*step(uv.x,.97);
     tear+=inside*range*b.z/1920.;stripe=max(stripe,inside*range);
    }
    vec2 p=uv;p.x+=tear;
    // Sparse blocks are displaced only inside the damaged rows of this frame.
    vec2 cell=floor(vec2(uv.x*26.,top*68.));float fault=step(.88,hash(cell+vec2(seed,3.7)))*stripe;
    p.x+=fault*(hash(cell+seed+9.)-.5)*.008*strength;
    float centreMask=smoothstep(.02,.16,uv.x)*smoothstep(.02,.16,1.-uv.x);
    float ca=split/1920.*centreMask*(.68+.32*stripe);
    vec3 rgb=vec3(sampleAt(p+vec2(ca,0.)).r,sampleAt(p).g,sampleAt(p-vec2(ca,0.)).b);
    // Brightness is kept stable. Dropouts darken a few pixels instead of flashing the screen.
    float scan=step(.70,fract(top*540.))*stripe;
    rgb*=1.-scan*.11*strength;
    rgb*=1.-fault*.28*strength;
    gl_FragColor=vec4(rgb,1.);
   }`});
 scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));

 function stateAt(frame,shot){
  const event=events.findLast(e=>frame>=e.frame&&frame<e.frame+e.duration);
  if(!event)return null;
  const age=frame-event.frame,envelope=age<2?1:Math.pow(1-(age-1)/(event.duration-1),1.25),strength=event.strength*envelope;
  return {eventFrame:event.frame,anchor:event.anchor,kind:event.kind,age,duration:event.duration,strength,shot:shot.id,
   displacementMaxPx:34*strength,rgbSplitPx:22*strength*(event.rgbMultiplier??1),currentFrameOnly:true,cameraRetimed:false,lyricsAffected:false,countGlyphsAffected:false};
 }
 function apply(ctx,frame,shot){
  const state=stateAt(frame,shot);if(!state)return null;
  inputContext.drawImage(ctx.canvas,0,0);texture.needsUpdate=true;
  const base=state.eventFrame,phase=Math.floor(state.age/2),s=state.strength;
  uniforms.strength.value=s;uniforms.seed.value=base+phase*71;uniforms.split.value=state.rgbSplitPx;
  const n=state.kind==='recall'?2:state.kind==='count'?3:s>.52?5:s>.3?4:3;uniforms.bandCount.value=n;
  // The headline is crossed by at most one thin tear, not displaced as a whole.
  const locations=[.405,.25,.61,.76,.52];
  for(let i=0;i<5;i++){
   const y=locations[i]+(hash(base+i*83)-.5)*.09;
   const height=(3.5+hash(base+i*17)*9+s*5)/H;
   const direction=hash(base+i*43)>.5?1:-1;
   const dx=direction*(.45+hash(base+i*23)*.55)*state.displacementMaxPx;
   uniforms.bands.value[i].set(y,height,dx,.035+hash(base+i*51)*.22);
  }
  renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,W,H);
  return state;
 }
 return {apply,stateAt,events};
}
