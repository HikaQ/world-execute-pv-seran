import {Scene,PerspectiveCamera,Vector3,GlowLines,Swarm,cloud,seeded,RED,HOT,DARK,mul,mix,clamp,setCamera,post,screen} from './scene-kit.js';
import {runtimeCore} from './core-path.js';
import {shotAt} from '../refinement-possession-v19/score.js';

const specs={
 R01:{p:[27,15,33],target:[0,0,-6],drift:[-.6,-.15,-.4],fov:40},
 R02:{p:[6.8,3.7,13],target:[0,0,.6],drift:[-.35,0,-.18],fov:38},
 R03:{p:[-1.5,1.1,8.6],target:[0,0,.6],drift:[-.12,0,-.12],fov:36},
 R04:{p:[19,13,28],target:[0,0,-6],drift:[-.3,0,-.15],fov:40},
 R05:{p:[11,6,28],target:[0,-1,-6],drift:[-.25,0,-.10],fov:40}
};
export function createRuntimeScene(background){
 const scene=new Scene(),camera=new PerspectiveCamera(40,16/9,.05,200000),lines=new GlowLines(24000);scene.add(lines.mesh);
 const data=cloud(scene,'runtime-module-grain',262144,N=>{
  const r=seeded(825),a=new Float32Array(N*4);
  for(let i=0;i<N;i++){const id=i%168,layer=Math.floor(id/42),col=id%7,row=Math.floor(id/7)%6,x=(col-3)*3.2,y=-6.3+layer*4.2,z=-16+row*3.5,face=i%5;
   a.set([x+(r()-.5)*2.18,y+(face===0?r()*.48:.54),z+(face===0?1.15:(r()-.5)*2.24),r()],i*4);
  }return a;
 });
 const m=data.s.material;m.uniforms.uShutdown={value:-100};
 m.vertexShader=m.vertexShader.replace('void main() {','uniform float uShutdown;\nvoid main() {').replace('  if (vis <= 0.)',`
  float distToFault=length(p-vec3(0.,0.,.2));
  float alive=1.-smoothstep(distToFault,distToFault+3.,uShutdown);
  float front=exp(-pow((distToFault-uShutdown)/1.0,2.));
  float keyLight=.30+.70*exp(-length((p-vec3(-4.,1.,0.))*vec3(.10,.10,.065)));
  vCol*=keyLight*(.025+alive*.975+front*1.2);
  if (vis <= 0.)`);m.needsUpdate=true;
 const contacts=cloud(scene,'runtime-contact-grain',65536,N=>{const r=seeded(892),a=new Float32Array(N*4);for(let i=0;i<N;i++){let x,y;do{x=(r()-.5)*3.35;y=(r()-.5)*3.05;}while(Math.abs(x)<.38&&Math.abs(y)<.38);a.set([x,y,i%2?1.72:-.48,r()],i*4);}return a;});
 const core=cloud(scene,'runtime-core',4096,N=>{const r=seeded(253),a=new Float32Array(N*4);for(let i=0;i<N;i++){const u=r()*Math.PI*2,z=r()*2-1,v=.13*Math.cbrt(r());a.set([Math.sqrt(1-z*z)*Math.cos(u)*v,z*v,Math.sqrt(1-z*z)*Math.sin(u)*v,r()],i*4);}return a;});
 function rectangle(x,y,z,w,d,c,width=.9){lines.polyline([[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[x-w/2,y,z-d/2]],{color:c,width});}
 let last={};
 function draw(ctx){
  const f=ctx.t*60,shot=shotAt(f),pose=setCamera(camera,specs,f),p=runtimeCore(f),wave=f<10243?-100:(f-10243)*.77,entry=clamp((f-10081)/8);
  const macro=f>=10138&&f<10243;
  const focus=camera.position.distanceTo(new Vector3(...(macro?[0,0,1.72]:[0,0,-6])));
  post(ctx);background.draw(ctx,camera,'runtime');lines.begin();
  data.s.set({a:data.a,size:macro?.023:.032,minPx:.8,bright:(macro?.16:.26)*entry,colA:RED,focus,aperture:.006,maxBlur:12,t:Math.min(f,10243)/60,noise:0},camera,ctx.H);m.uniforms.uShutdown.value=wave;
  contacts.s.set({a:contacts.a,size:macro?.012:.024,minPx:.7,bright:.25*entry*(1-.85*clamp((f-10243)/18)),colA:RED,focus,aperture:.0025,maxBlur:7},camera,ctx.H);
  for(let layer=0;layer<4;layer++){
   const y=-6.3+layer*4.2;
   for(let col=0;col<7;col++)for(let row=0;row<6;row++){
    const x=(col-3)*3.2,z=-16+row*3.5,d=Math.hypot(x,y,z-.2),off=clamp((wave-d)/3),pulse=Math.exp(-((d-wave)**2));
    rectangle(x,y+.56,z,2.25,2.35,mul(RED,entry*(.032*(1-.95*off)+pulse*.18)),.8);
   }
   rectangle(0,y+.05,-7.25,23,21,mul(RED,.065*entry*(1-.85*clamp((wave-Math.abs(y)-10)/8))),1.1);
  }
  for(const x of [-11.5,11.5])for(const z of [-17.75,3.25])lines.segment([x,-6.3,z],[x,6.3,z],{color:mul(RED,.055*entry),width:1.0});
  for(const z of [1.55,-.65])lines.polyline([[-1.75,-1.6,z],[1.75,-1.6,z],[1.75,1.6,z],[-1.75,1.6,z],[-1.75,-1.6,z]],{color:mul(RED,.19*entry),width:1.15});
  const trail=Array.from({length:18},(_,i)=>runtimeCore(Math.max(10081,f-12+i*12/17)));
  for(let i=1;i<trail.length;i++)lines.segment(trail[i-1],trail[i],{color:mul(HOT,.28*(i/trail.length)**2*entry),width:1.6});
  core.s.points.position.fromArray(p);core.s.set({a:core.a,size:.023,bright:.35*entry,colA:HOT,focus:camera.position.distanceTo(core.s.points.position),aperture:.002,maxBlur:8},camera,ctx.H);
  lines.segment(p,p,{color:mul(HOT,.70*entry),width:8});
  lines.end(ctx);ctx.draw(scene,camera);
  last={scene:'runtime',camera:{...pose,redCore:{worldPosition:p,screen:screen(camera,p)}},detail:{family:'runtime',modules:168,faultFrame:10243,sourceGeometry:'same module positions and contact gap as V3',grainMaterial:'reference Swarm',waveRadius:wave},transition:pose.relay,particleCount:331776};
 }
 return {draw,get last(){return last;}};
}
