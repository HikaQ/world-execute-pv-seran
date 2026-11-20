import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {loadCreditFont} from '../refinement-opening-v15/intro-titles.js';
import {createWorld} from './world.js';
import {VERSION,FPS,END,START,CONTEXT_START,PRELUDE,clamp,shotAt} from '../refinement-geometry-v11/score.js';
import {loadGeometryFont} from '../refinement-geometry-v11/geometry.js';
import {loadPerceptionFont} from '../refinement-geometry-v11/perception.js';
const film=document.getElementById('film'),g=film.getContext('2d',{alpha:false,willReadFrequently:true});
const capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');
window.filmReady=false;
await Promise.all([loadFonts(),loadCreditFont(),loadGeometryFont(),loadPerceptionFont()]);
const world=await createWorld();
window.__lightWorld=world;
function render(t){
 window.__copyFrame=Math.round(t*60);
 t=clamp(t,CONTEXT_START,END-1/FPS);const {canvas,...state}=world.frame(t);
 g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(canvas,0,0,1920,1080);
 const cinema=state.geometry.cinema;
 if(cinema?.active){
  g.save();g.globalAlpha=(cinema.phase==='unroll'?Math.max(0,Math.min(1,(t-41.38)/.20)):cinema.weight)*(1-Math.max(0,Math.min(1,(t-51.55)/.27)));g.font='500 25px "JetBrains Mono"';g.fillStyle='#bba5d8';g.textBaseline='top';g.fillText(cinema.formula,112,104);
  if(cinema.phase==='contact'&&cinema.delta>.015&&cinema.contactLabel){const [x,y]=cinema.contactLabel;if(x>180&&x<1600&&y<820){g.font='500 16px "JetBrains Mono"';g.fillStyle='#ac91c6';g.fillText('Δx = '+cinema.delta.toFixed(3),x-48,y+20);}}
  if(cinema.phase==='infinity'){g.textAlign='right';g.font='500 18px "JetBrains Mono"';g.fillStyle='#9884ab';g.fillText('x = 10^'+(1+cinema.flightDistance*.085).toFixed(2),1808,114);}
  g.textAlign='center';
  for(const r of cinema.rulers??[]){g.globalAlpha=(cinema.phase==='unroll'?Math.max(0,Math.min(1,(t-41.38)/.20)):cinema.weight)*Math.min(.68,25/r.depth);g.font='500 '+Math.max(11,Math.min(23,570/r.depth)).toFixed(1)+'px "JetBrains Mono"';g.fillStyle='#a58bb8';g.fillText('10^'+r.value,r.x,r.y);}
  g.restore();
 }
 return {videoTime:t,song:t-PRELUDE,shot:shotAt(t).id,lyrics:null,dialogue:null,...state};
}
window.renderAtVideoTime=render;
window.fullMeta={version:VERSION,fps:FPS,start:START,end:END,width:1920,height:1080,lyricsVisible:false};
render(CONTEXT_START);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav');audio.currentTime=CONTEXT_START;
 const play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
 function show(t){render(t);seek.value=t;clock.textContent=t.toFixed(2)+' / '+END.toFixed(2);}
 function tick(){if(audio.paused)return;if(audio.currentTime>=END){audio.pause();play.textContent='PLAY';show(END);return;}show(audio.currentTime);requestAnimationFrame(tick);}
 play.onclick=async()=>{if(!audio.paused){audio.pause();play.textContent='PLAY';return;}if(audio.currentTime>END-.1)audio.currentTime=CONTEXT_START;await audio.play();play.textContent='PAUSE';tick();};
 seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};
}
