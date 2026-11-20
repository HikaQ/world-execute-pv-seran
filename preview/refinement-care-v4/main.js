import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {loadCreditFont} from '../refinement-opening-v15/intro-titles.js';
import {createWorld} from './world.js';
import {VERSION,FPS,END,START,CONTEXT_START,PRELUDE,clamp,shotAt} from './score.js';
import {loadGeometryFont} from '../refinement-perception-v4/geometry.js';
import {loadPerceptionFont} from '../refinement-perception-v4/perception.js';
import {loadForgettingFont} from '../refinement-forgetting-v6/forgetting.js';
import {loadCareFont} from './care.js';
import {createEndingWorld} from './ending-source.js';
import {EGG_TRANSITION} from './egg-transition.js';
const film=document.getElementById('film'),g=film.getContext('2d',{alpha:false,willReadFrequently:true});
const capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');
window.filmReady=false;
await Promise.all([loadFonts(),loadCreditFont(),loadGeometryFont(),loadPerceptionFont(),loadForgettingFont(),loadCareFont()]);
const world=await createWorld(),ending=await createEndingWorld();
window.perceptionFixture=world.perceptionFixture;
function render(t){
 t=clamp(t,CONTEXT_START,END-1/FPS);const frame=Math.round(t*FPS),active=frame>=EGG_TRANSITION.start&&frame<EGG_TRANSITION.end;
 const {canvas,...state}=frame<EGG_TRANSITION.start?ending.frame(t):world.frame(Math.max(t,START),active?{transitionFrame:frame}:{});
 g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(canvas,0,0,1920,1080);
 if(active&&frame<EGG_TRANSITION.start+7){
  const u=(frame-EGG_TRANSITION.start)/7;g.globalAlpha=1-u*u*(3-2*u);g.drawImage(ending.frame(t).canvas,0,0,1920,1080);g.globalAlpha=1;
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
