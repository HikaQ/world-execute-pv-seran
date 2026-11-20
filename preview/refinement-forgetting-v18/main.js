import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {loadCreditFont} from '../refinement-opening-v15/intro-titles.js';
import {loadGeometryFont} from '../refinement-perception-v16/geometry.js';
import {loadPerceptionFont} from '../refinement-perception-v16/perception.js';
import {loadMemoryFont} from '../refinement-forgetting-v14/memory.js';
import {createWorld as createAcceptedWorld} from '../refinement-perception-v16/world.js';
import {createOrderedWorld} from '../refinement-forgetting-v14/ordered-world.js';
import {createWorld as createEvictionWorld} from './context-world.js';
import {createEndingWorld} from './ending-world.js';
import {VERSION,FPS,START,CONTEXT_START,END,EVICTION_START,ENDING_START,shotAt} from './score.js';
const film=document.getElementById('film'),g=film.getContext('2d',{alpha:false,willReadFrequently:true});
const capture=new URLSearchParams(location.search).has('capture');if(capture)document.body.classList.add('capture');
window.filmReady=false;
await Promise.all([loadFonts(),loadCreditFont(),loadGeometryFont(),loadPerceptionFont(),loadMemoryFont()]);
const accepted=await createAcceptedWorld(),ordered=await createOrderedWorld(),eviction=createEvictionWorld(),ending=await createEndingWorld();
function render(t,options={}){
 t=Math.max(CONTEXT_START,Math.min(END-1/FPS,t));const s=shotAt(t);
 const state=t<START?accepted.frame(t):t<EVICTION_START?ordered.frame(t,options):t<ENDING_START?eviction.frame(t,options):ending.frame(t,options);
 g.reset();g.fillStyle='#020105';g.fillRect(0,0,1920,1080);g.imageSmoothingEnabled=true;g.imageSmoothingQuality=t>=START&&t<EVICTION_START?'low':'high';g.drawImage(state.canvas,0,0,1920,1080);
 if(t>=START&&t<EVICTION_START){
  g.save();g.fillStyle='#ada4c2';g.font='500 21px "JetBrains Mono"';g.textBaseline='top';g.fillText(`${String(s.index+1).padStart(2,'0')} / ${s.label}`,78,58);
  g.globalAlpha=.72;g.font='400 16px "JetBrains Mono"';g.fillText(s.index<14?'YOUR WORDS BECOME SIGNAL':'EVERY INPUT TAKES SPACE',78,91);g.restore();
 }
 const {canvas,...data}=state;
 return {...data,version:VERSION,time:t,frame:Math.round(t*FPS),shot:s.id,shotIndex:s.index,family:s.family,
  acceptedPrefix:t<START,helixVisible:t<START?true:false,bridgePacketVisible:false,decorativeConnectionCount:data.decorativeConnectionCount??0};
}
window.renderAtVideoTime=render;window.fullMeta={version:VERSION,fps:FPS,start:CONTEXT_START,end:END,width:1920,height:1080,kind:'complete-section-preview'};
render(CONTEXT_START);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav');audio.currentTime=CONTEXT_START;
 const play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
 const show=t=>{render(t);seek.value=t;clock.textContent=t.toFixed(2)+' / '+END.toFixed(2);};
 const tick=()=>{if(audio.paused)return;if(audio.currentTime>=END){audio.pause();play.textContent='播放';show(END);return;}show(audio.currentTime);requestAnimationFrame(tick);};
 play.onclick=async()=>{if(!audio.paused){audio.pause();play.textContent='播放';return;}if(audio.currentTime>=END-.08)audio.currentTime=CONTEXT_START;await audio.play();play.textContent='暂停';tick();};
 seek.oninput=()=>{audio.currentTime=Number(seek.value);show(audio.currentTime);};
}
