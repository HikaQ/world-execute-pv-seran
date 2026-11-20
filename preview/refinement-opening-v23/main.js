import {loadFonts,FONTS} from '../reexplore-v6-chat-opening/typography.js';
import {createWorld} from './world.js';
import {VERSION,FPS,DURATION,FRAMES,ENTER,PRELUDE,ramp,clamp,shotAt} from './score.js';
import {WARNING_TEXT,warningAt} from './warning-typing.js';
import {loadCreditFont} from './intro-titles.js';

const film=document.getElementById('film'),g=film.getContext('2d',{alpha:false,willReadFrequently:true}),capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');
window.filmReady=false;await Promise.all([loadFonts(),loadCreditFont()]);const world=await createWorld();
const WARN_ZH=WARNING_TEXT.zh,WARN_EN=WARNING_TEXT.en;
function label(s,x,y,size,color,family=FONTS.mono){g.font=`500 ${size}px ${family}`;g.fillStyle=color;g.fillText(s,x,y);}
function warning(t){
 const alpha=ramp(t,.28,.34)*(1-ramp(t,4.30,4.65));if(alpha<.001)return null;
 g.save();g.globalAlpha=alpha;const x=350;
 const typing=warningAt(t);label('> '+typing.command,x,309,27,'#c5b5d9');
 if(typing.cursor==='command'){g.fillStyle='#bca3df';g.fillRect(x+g.measureText('> '+typing.command).width+6,286,3,28);}
 g.strokeStyle='#3a303e';g.lineWidth=1;g.beginPath();g.moveTo(x,338);g.lineTo(1570,338);g.stroke();
 for(const line of typing.lines){
  label(line.display,line.x,line.y,line.size,line.color,FONTS[line.font]);
  if(typing.cursor===line.id){g.fillStyle='#bca3df';g.fillRect(line.x+g.measureText(line.display).width+5,line.y-line.size*.8,3,line.size);}
 }
 if(typing.cursor==='idle'&&Math.floor(t/.65)%2===0){g.fillStyle='#b09acb';g.fillRect(x+1,703,3,27);}
 g.restore();return {alpha,zh:WARN_ZH,en:WARN_EN,typing};
}
function render(t){
 t=clamp(t,0,DURATION);const state=world.frame(t);g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.globalAlpha=ramp(t,4.42,4.95);g.drawImage(state.canvas,0,0,1920,1080);g.globalAlpha=1;const notice=warning(t);
 const {canvas,...meta}=state;return {videoTime:t,song:t-PRELUDE,shot:shotAt(t).id,warning:notice,lyrics:null,dialogue:null,...meta};
}
window.renderAtVideoTime=render;
window.fullMeta={version:VERSION,fps:FPS,frames:FRAMES,end:DURATION,enter:ENTER,enterFrame:ENTER*60,prelude:PRELUDE,lyricsVisible:false,dialogueVisible:false,warning:{zh:WARN_ZH,en:WARN_EN},width:1920,height:1080};
render(0);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav'),play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
 function show(t){render(t);seek.value=t;clock.textContent=t.toFixed(2)+' / 35.10';}
 function tick(){if(audio.paused)return;if(audio.currentTime>=DURATION){audio.pause();play.textContent='PLAY';show(DURATION);return;}show(audio.currentTime);requestAnimationFrame(tick);}
 play.onclick=async()=>{if(!audio.paused){audio.pause();play.textContent='PLAY';return;}if(audio.currentTime>DURATION-.1)audio.currentTime=0;await audio.play();play.textContent='PAUSE';tick();};seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};
}
