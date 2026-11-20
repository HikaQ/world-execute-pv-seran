import {Scene,Vector3,Swarm,cloud,glyph,seeded,clamp} from '../refinement-possession-rework-v4/scene-kit.js';
import {Mesh,PlaneGeometry,ShaderMaterial} from '../../references/world-execute-web/vendor/three/build/three.core.js?v=q9f7JKE-';

// This layer uses the existing camera. Its clock never resets at a shot cut.
const TAU=Math.PI*2, RED=[1,.075,.12];
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
function quietForeground(material){
 material.fragmentShader=material.fragmentShader.replace('void main() {',`void main() {
  vec2 screenPosition=gl_FragCoord.xy/vec2(1920.,1080.);
  float lyricZone=(1.-smoothstep(.29,.49,screenPosition.x))*(1.-smoothstep(.15,.29,screenPosition.y));
  float formulaZone=(1.-smoothstep(.36,.55,screenPosition.x))*smoothstep(.87,.94,screenPosition.y);
  float quiet=(1.-.97*lyricZone)*(1.-.95*formulaZone);
 `).replace(/o = vec4\(vCol \* /g,'o = vec4(quiet * vCol * ');
 material.needsUpdate=true;
}
class Dust extends Swarm{
 constructor(o){super(o);this.material.vertexShader=this.material.vertexShader.replace('  vec4 mv = modelViewMatrix',`
  p.x += .28*sin(a.w*18.+uT*.11);
  p.y += .18*cos(a.w*23.+uT*.09);
  p.z += .45*sin(a.w*13.+uT*.08);
  vec4 mv = modelViewMatrix`).replace('  if (vis <= 0.)',`
  vCol*=smoothstep(5.,18.,dist);
  gl_PointSize=min(gl_PointSize,4.5);
  if (vis <= 0.)`);quietForeground(this.material);}
}
class Traffic extends Swarm{
 constructor(o){super(o);Object.assign(this.material.uniforms,{uMode:{value:0}});
 this.material.vertexShader=this.material.vertexShader.replace('void main() {','uniform float uMode;\nvoid main() {').replace('  vec4 mv = modelViewMatrix',`
  float age=fract(a.w+uT*.055);
  if(uMode<.5){
   // Ordered packets travel behind the archive, never through its foreground cards.
   p.z=-16.-age*65.;
  }else{
   // Outside the membrane, data proceeds away from the enclosure.
   p.z=-3.-age*100.;
  }
  vec4 mv = modelViewMatrix`).replace('  if (vis <= 0.)',`
  vCol*=smoothstep(0.,.08,age)*(1.-smoothstep(.84,1.,age));
  if (vis <= 0.)`);quietForeground(this.material);}
 set(p,c,H){super.set(p,c,H);this.material.uniforms.uMode.value=p.mode??0;return this;}
}
class Circulation extends Swarm{
 constructor(o){super(o);this.material.vertexShader=this.material.vertexShader.replace('  vec4 mv = modelViewMatrix',`
  float a0=a.w*6.28318530718+uT*.18;
  p=vec3(9.2*cos(a0)+a.x*.16,5.7*sin(a0)+a.y*.16,.35+a.z*.12);
  vec4 mv = modelViewMatrix`);quietForeground(this.material);}
}
function volume(N,seed){const r=seeded(seed),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([(r()-.5)*110,(r()-.5)*65,-74+r()*106,r()],i*4);return a;}
function packetShape(N){const r=seeded(816),a=new Float32Array(N*4);for(let i=0;i<N;i++){
 const lane=i%24,x=(lane%8-3.5)*6.2,y=(Math.floor(lane/8)-1)*8.5;
 a.set([x+(r()-.5)*.10,y+(r()-.5)*.10,-20,r()],i*4);
}return a;}
function listing(kind){const lines=kind==='memory'?[
 'const record = archive.read(address);','if (record) retained.push(record);',
 'sourceRecords = 13; delivered = 0;','queue.write(record.id, record.bytes);',
 'await memory.commit(snapshot);','checksum = hash(record.bytes);',
 'volatile.collect(releasedCells);','outbox.length === 5;'
 ]:kind==='orbit'?[
 't += dt; sample = evaluate(t);','r = 0.723 * exp(13i*t/8) - exp(i*t);',
 'target = source.lookup("HIKAQ");','samples.push({ t, r });',
 'residual = distance(me(t), you(t));','solver.step(dt); await nextFrame();'
 ]:[
 'route = boundary.query(position);','if (route.open) exit(program);',
 'boundary.contains(me) === true;','outbox.pending === 5;',
 'delivered = 0; retry = true;','runtime.continue();'
 ];return Array.from({length:72},(_,i)=>`${(i*16).toString(16).padStart(4,'0')}  ${lines[i%lines.length]}`).join('\n');}

export function createDepthBackground(){
 const scene=new Scene();
 const dust=cloud(scene,'background-v1-dust',4096,N=>volume(N,771),Dust);
 const traffic=cloud(scene,'background-v1-packets',1024,packetShape,Traffic);
 const circulating=cloud(scene,'background-v1-inside',1024,N=>{const r=seeded(23),a=new Float32Array(N*4);for(let i=0;i<N;i++)a.set([r()-.5,r()-.5,r()-.5,r()],i*4);return a;},Circulation);
 const pages={};for(const kind of ['memory','orbit','boundary']){
  pages[kind]=Array.from({length:3},(_,i)=>{
   const p=glyph(scene,`background-v1-${kind}-${i}`,listing(kind),{origin:[-10,10,0],cell:.25,cols:86,rows:72},16384);
   const positions=kind==='memory'?[[-17,4,-23],[6,1,-37],[25,5,-54]]:kind==='orbit'?[[-27,6,-28],[23,1,-40],[-8,-8,-62]]:[[-23,1,-20],[17,2,-35],[-37,5,13]];
   p.g.points.position.set(...positions[i]);p.g.points.rotation.y=kind==='boundary'&&i===2?Math.PI*.5:[.25,-.22,.08][i];
   quietForeground(p.g.material);
   p.g.material.vertexShader=p.g.material.vertexShader.replace('  vChar = g.x;',`
    float edge=smoothstep(-11.,-7.,p.x)*(1.-smoothstep(7.,11.,p.x));
    edge*=smoothstep(-10.,-7.,p.y)*(1.-smoothstep(7.,10.,p.y));
    float scan=.72+.28*exp(-pow((p.y-(7.-mod(uT*.45,14.)))/.65,2.));
    vCol*=edge*scan;
    vChar = g.x;`);
   return p;
  });
 }
 const material=new ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,side:2,blending:2,
 uniforms:{strength:{value:1}},
 vertexShader:'varying vec2 uv0; void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`varying vec2 uv0; uniform float strength; void main(){
  vec2 p=uv0-.5;float glow=exp(-dot(p*vec2(2.1,3.6),p*vec2(2.1,3.6))*4.5);
  float edge=smoothstep(0.,.20,uv0.x)*smoothstep(0.,.20,uv0.y)*smoothstep(0.,.20,1.-uv0.x)*smoothstep(0.,.20,1.-uv0.y);
  vec2 s=gl_FragCoord.xy/vec2(1920.,1080.);float lyric=(1.-smoothstep(.29,.49,s.x))*(1.-smoothstep(.15,.29,s.y));
  gl_FragColor=vec4(vec3(.0095,.00052,.0009)*glow*edge*strength*(1.-.97*lyric),1.);
 }`});
 const light=new Mesh(new PlaneGeometry(90,60),material);scene.add(light);
 let last={};
 return {draw(ctx,camera,kind){
  const frame=ctx.t*60,t=ctx.t-10519/60;
  const fade=kind==='memory'?ease((frame-10519)/10)*ease((10770-frame)/13):1;
  const focus=camera.position.length();
  light.position.set(kind==='boundary'?-22:0,2,kind==='boundary'?-15:-36);light.quaternion.copy(camera.quaternion);material.uniforms.strength.value=fade*(kind==='boundary'?.56:.8);
  dust.s.set({a:dust.a,t,size:kind==='orbit'?.070:.058,minPx:1,bright:fade*(kind==='orbit'?.28:.19),colA:RED,noise:0,sparkle:0,focus,aperture:.003,maxBlur:10},camera,ctx.H);
  traffic.s.points.visible=kind!=='orbit';traffic.s.set({a:traffic.a,t,size:.06,minPx:1,bright:fade*.18,colA:RED,focus,aperture:.004,maxBlur:12,mode:kind==='boundary'?1:0},camera,ctx.H);
  circulating.s.points.visible=kind==='boundary';circulating.s.set({a:circulating.a,t,size:.021,minPx:.8,bright:fade*.065,colA:RED,focus,aperture:.004,maxBlur:10},camera,ctx.H);
  for(const [key,ps] of Object.entries(pages))ps.forEach((p,i)=>{
   p.g.points.visible=key===kind;
   if(key===kind)p.g.set({a:p.a,t,size:.23,minPx:2,bright:fade*[.19,.15,.11][i],palette:[1,.10,.155],focus,aperture:.0035,maxBlur:8,scroll:[0,t*.065,0],flicker:0},camera,ctx.H);
  });
  ctx.draw(scene,camera);
  last={kind,worldSpace:true,cameraAttached:false,clock:t,fade,palette:'red',layers:['depth-code','fine-particles','local-red-light'],outerTraffic:kind==='boundary'?'away-from-boundary':null,innerTraffic:kind==='boundary'?'circulating':null};
 },get last(){return last;}};
}

export function withDepthBackground(world,range){
 const background=createDepthBackground();let last={};
 return {draw(ctx){
  const f=Math.round(ctx.t*60),kind=range==='memory'?'memory':f<11587?'orbit':f>=11625&&f<11809?'boundary':null;
  let painted=false;
  world.draw({...ctx,draw(scene,camera){
   if(!painted&&kind&&globalThis.backgroundEnabled!==false){background.draw(ctx,camera,kind);painted=true;}
   ctx.draw(scene,camera);
  }});
  last={...world.last,backgroundDecoration:painted?background.last:null};
 },get last(){return last;}};
}
