import {createWorld} from './world.js';
import {stateAt,SNAPSHOT,FIELD_NAMES} from './state.js';
import {createExecutionTypography} from './execution-type.js';
import {createGlitch} from './glitch.js';
const canvas=document.querySelector('#film'),ctx=canvas.getContext('2d',{alpha:false}),capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');
const [plan,recall]=await Promise.all(['edit-plan.json','recall-manifest.json'].map(p=>fetch(p).then(r=>r.json())));
await Promise.all([
 new FontFace('Display','url(/assets/fonts/frost-reference/SpaceGrotesk-VF.ttf)',{weight:'300 700'}),
 new FontFace('Execution','url(/assets/fonts/v7/Anton-Regular.ttf)',{weight:'400'}),
 new FontFace('Mono','url(/assets/fonts/frost-reference/JetBrainsMono-VF.ttf)',{weight:'100 800'}),
 new FontFace('Chinese','url(/assets/fonts/frost-reference/NotoSansSC-VF.ttf)',{weight:'100 900'}),
 new FontFace('Korean','local("Malgun Gothic Bold")',{weight:'700'})
].map(async f=>document.fonts.add(await f.load())));await document.fonts.ready;
const world=createWorld(),cache=new Map(),legacyWarning=createExecutionTypography(plan);legacyWarning.prime(ctx);
const glitchEffect=createGlitch(plan);
async function recallFrame(key,index){const q=recall[key],i=Math.min(q.frames-1,Math.max(0,index)),url=q.url+'/'+String(i).padStart(4,'0')+'.jpg';if(cache.has(url))return cache.get(url);const im=new Image();im.src=url;await im.decode();cache.set(url,im);if(cache.size>64)cache.delete(cache.keys().next().value);return im;}
function text(s,x,y,size,color='#c3b8cd',font='Mono',align='left',weight=400){ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function tracked(s,x,y){ctx.font='500 44px Display';const widths=[...s].map(c=>ctx.measureText(c).width),width=widths.reduce((a,b)=>a+b,0)+11*(s.length-1);let at=x-width/2;ctx.fillStyle='#c9bdce';ctx.textAlign='left';for(let i=0;i<s.length;i++){ctx.fillText(s[i],at,y);at+=widths[i]+11;}}
const formulas={lock:'x ∉ Ω',archive:'D = D₁ ∩ D₂ ∩ ··· ∩ D₆',lattice:'λ > μ',queue:'|q| = 5;   delivered = 0',bridge:'∂Ω → 0',receiver:'x ∈ Ω'};
async function renderAtVideoTime(time){
 const frame=Math.max(plan.firstFrame,Math.min(plan.endFrame-1,Math.round(time*60))),shot=plan.shots.findLast(s=>frame>=s.cutFrame),state=stateAt(frame,plan);
 ctx.reset();ctx.fillStyle='#020204';ctx.fillRect(0,0,1920,1080);let camera,typography=null,glitch=null;
 if(frame>=plan.finalWarning.blackFrame){ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);legacyWarning.draw(ctx,frame);typography=legacyWarning.stateAt(frame);camera={set:'warning-window',position:[0,0,1],finite:true};glitch=glitchEffect.apply(ctx,frame,shot);}
 else if(shot.source){
  const im=await recallFrame(shot.source.key,frame-shot.cutFrame);ctx.save();ctx.filter='saturate(.3) contrast(1.06)';ctx.drawImage(im,0,0);ctx.filter='none';
  ctx.globalCompositeOperation='color';ctx.globalAlpha=shot.group==='E04'?.18:shot.group==='E08'?.48:.78;ctx.fillStyle='#b73a55';ctx.fillRect(0,0,1920,1080);ctx.restore();
  camera={set:'historical',source:shot.source.key,sourceFilmFrame:recall[shot.source.key].sourceFilmFrame+frame-shot.cutFrame,refreshed:true,finite:true};
  glitch=glitchEffect.apply(ctx,frame,shot);
 }else{
  camera=world.render(frame,shot,plan,state);ctx.drawImage(world.canvas,0,0,1920,1080);typography=camera.typography;
  glitch=glitchEffect.apply(ctx,frame,shot);
  if(shot.group==='COUNT'){
   const e=state.count,family=e.language==='ko'?'Korean':e.language==='zh'?'Chinese':'Display';
   const shade=ctx.createRadialGradient(960,510,120,960,510,690);shade.addColorStop(0,'rgba(1,0,4,.46)');shade.addColorStop(1,'rgba(1,0,4,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,1920,1080);
   text(e.sourceText,960,610,300,'#fff1f6',family,'center',700);tracked(e.english,960,711);
  }else if(formulas[shot.scene])text(formulas[shot.scene],72,82,21,'#aaa1b8');
  const vignette=ctx.createRadialGradient(960,520,380,960,520,1250);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.3)');ctx.fillStyle=vignette;ctx.fillRect(0,0,1920,1080);
 }
 return {videoTime:frame/60,frame,shot:shot.id,scene:shot.scene,state,camera,executionTypography:typography,glitch,finite:camera.finite,lyricsVisible:false,dialogue:false};
}
window.renderAtVideoTime=renderAtVideoTime;window.executionFixture={plan,recall,snapshot:SNAPSHOT,fields:FIELD_NAMES};
await renderAtVideoTime(plan.start);window.filmReady=true;
if(!capture){const audio=new Audio('/out/refinement-execution-v14/audio.wav'),seek=document.querySelector('#seek'),clock=document.querySelector('#clock'),play=document.querySelector('#play');let active=false,busy=false;
 play.onclick=async()=>{if(active){audio.pause();active=false;play.textContent='PLAY';}else{if(audio.currentTime>=plan.duration-.04)audio.currentTime=0;await audio.play();active=true;play.textContent='PAUSE';}};
 seek.oninput=async()=>{audio.currentTime=+seek.value;await renderAtVideoTime(plan.start+audio.currentTime);};audio.onended=()=>{active=false;play.textContent='PLAY';};
 async function tick(){if(active&&!busy){busy=true;try{await renderAtVideoTime(plan.start+audio.currentTime);seek.value=audio.currentTime;clock.textContent=audio.currentTime.toFixed(2)+' / '+plan.duration;}finally{busy=false;}}requestAnimationFrame(tick);}tick();}
