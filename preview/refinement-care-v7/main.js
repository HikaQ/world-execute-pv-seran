import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {loadCreditFont} from '../refinement-opening-v15/intro-titles.js';
import {createWorld} from './world.js';
import {createWorld as createMemoryWorld} from './memory-world.js';
import {loadMemoryFont} from '../refinement-memory-v1/memory.js';
import {VERSION,FPS,END,START,CONTEXT_START,PRELUDE,clamp,shotAt} from './score.js';
import {loadGeometryFont} from '../refinement-perception-v4/geometry.js';
import {loadPerceptionFont} from '../refinement-perception-v4/perception.js';
import {loadForgettingFont} from '../refinement-forgetting-v6/forgetting.js';
import {loadCareFont} from './care.js';
import {drawMobiusCaption} from './mobius-caption.js';
const film=document.getElementById('film'),g=film.getContext('2d',{alpha:false,willReadFrequently:true});
const capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');
window.filmReady=false;
await Promise.all([loadFonts(),loadCreditFont(),loadGeometryFont(),loadPerceptionFont(),loadForgettingFont(),loadCareFont(),loadMemoryFont()]);
const world=await createWorld(), memoryWorld=await createMemoryWorld();
window.perceptionFixture=world.perceptionFixture;
function render(t){
 t=clamp(t,89.5,95.5-1/FPS);const {canvas,...state}=(t<5637/60?world:memoryWorld).frame(t);
 g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(canvas,0,0,1920,1080);
 const mobiusCaption=drawMobiusCaption(g,t);
 return {videoTime:t,song:t-PRELUDE,shot:shotAt(t).id,lyrics:null,dialogue:null,...state,mobiusCaption};
}
window.renderAtVideoTime=render;
window.fullMeta={version:VERSION,fps:FPS,start:START,end:95.5,width:1920,height:1080,lyricsVisible:false};
render(89.5);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav');audio.currentTime=89.5;
 const play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
 function show(t){render(t);seek.value=t;clock.textContent=t.toFixed(2)+' / '+(95.5).toFixed(2);}
 function tick(){if(audio.paused)return;if(audio.currentTime>=95.5){audio.pause();play.textContent='PLAY';show(95.5);return;}show(audio.currentTime);requestAnimationFrame(tick);}
 play.onclick=async()=>{if(!audio.paused){audio.pause();play.textContent='PLAY';return;}if(audio.currentTime>95.4)audio.currentTime=89.5;await audio.play();play.textContent='PAUSE';tick();};
 seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};
}
