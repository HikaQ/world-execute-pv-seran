import * as THREE from 'three';
const clamp=x=>Math.max(0,Math.min(1,x));
const palettes={wave:['#807396','#c1a6d9','#8067a8'],helix:['#7e7098','#cfb3ed','#9e69bc'],execution:['#6b3446','#e49ba9','#a9556f']};
export async function createCodeLayer(scene,kind,url){
 const source=await (await fetch(url)).text();
 const lines=source.split('\n').map((text,i)=>({text:text.trimEnd(),line:i+1})).filter(x=>x.text.trim()&&!x.text.trim().startsWith('import ')&&!x.text.trim().startsWith('//'));
 const color=palettes[kind],canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.NoColorSpace;texture.anisotropy=4;
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{map:{value:texture},gain:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D map;uniform float gain;varying vec2 vUv;void main(){
   vec4 c=texture2D(map,vUv);vec2 s=gl_FragCoord.xy/vec2(1920.,1080.);
   float quiet=1.-.98*(1.-smoothstep(.30,.53,s.x))*(1.-smoothstep(.14,.29,s.y));
   quiet*=1.-.95*(1.-smoothstep(.36,.55,s.x))*smoothstep(.87,.96,s.y);
   float edge=smoothstep(0.,.1,vUv.x)*smoothstep(0.,.1,1.-vUv.x)*smoothstep(0.,.12,vUv.y)*smoothstep(0.,.08,1.-vUv.y);
   gl_FragColor=vec4(c.rgb*gain*quiet*edge,c.a);}`});
 const group=new THREE.Group(),main=new THREE.Mesh(new THREE.PlaneGeometry(42,28),material);group.add(main);scene.add(group);
 // Keep the deep code plane in the peripheral reading zone while the main
 // helix camera makes its large orbit. Its oblique surface retains perspective;
 // its apparent type size cannot surge as the camera passes through its plane.
 if(kind!=='execution'){
  const previous=scene.onBeforeRender,anchor=new THREE.Vector3(),turn=new THREE.Quaternion();
  scene.onBeforeRender=function(renderer,scene0,camera,...rest){
   previous?.call(this,renderer,scene0,camera,...rest);
   const depth=70,tangent=Math.tan(camera.fov*Math.PI/360),h=2*depth*tangent,w=h*camera.aspect;
   anchor.set((450/1920-.5)*w,(.5-320/1080)*h,-depth).applyMatrix4(camera.matrixWorld);
   group.position.copy(anchor);group.quaternion.copy(camera.quaternion);group.scale.setScalar(w*(640/1920)/42);
   const parallax=.10*Math.sin(camera.rotation.y*2.4);turn.setFromAxisAngle(new THREE.Vector3(0,1,0),-.20+parallax);group.quaternion.multiply(turn);group.updateMatrixWorld(true);
  };
 }
 let last={};
 function update(frame,{origin=[0,0,0],reveal=1,active='curveY',values=[],orientation=0,scale=1}={}){
  group.position.set(...origin);main.rotation.set(0,orientation,0);group.scale.setScalar(scale);group.visible=reveal>.001;
  material.uniforms.gain.value=reveal*(kind==='execution'?.54:.48);
  const selected=Math.max(0,lines.findIndex(l=>l.text.includes(active))),begin=Math.max(0,selected-5);
  ctx.clearRect(0,0,1536,1024);ctx.textBaseline='top';ctx.font='500 24px "JetBrains Mono"';
  const scroll=kind==='execution'?((frame-9162)/60)*5:((frame%1200)/60)*1.2;
  for(let row=0;row<27;row++){
   const item=lines[(begin+row)%lines.length],y=92+row*30-scroll%30,on=begin+row===selected;
   if(on){ctx.fillStyle=kind==='execution'?'rgba(130,20,45,.12)':'rgba(116,73,145,.10)';ctx.fillRect(66,y-3,1360,29);}
   ctx.fillStyle=on?color[1]:color[0];ctx.globalAlpha=on?.95:.38;
   ctx.fillText(String(item.line).padStart(3,'0'),70,y);ctx.fillText(item.text.slice(0,89),146,y);
  }
  ctx.globalAlpha=.74;ctx.fillStyle=color[2];ctx.font='500 23px "JetBrains Mono"';
  values.forEach((v,i)=>ctx.fillText(v,146,918+i*30));ctx.globalAlpha=1;texture.needsUpdate=true;
  last={source:url,activeFunction:active,activeSourceLine:lines[selected].line,values,worldSpace:true,position:origin,opacity:material.uniforms.gain.value};return last;
 }
 return {group,main,update,get last(){return last;}};
}
