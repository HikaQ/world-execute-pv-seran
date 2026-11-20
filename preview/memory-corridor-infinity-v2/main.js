import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {createWorld} from './world.js';
import {at,START,FINISH,CUTS} from './score.js';
window.filmReady=false;const capture=new URLSearchParams(location.search).has('capture');if(capture)document.body.classList.add('capture');
await loadFonts();const lyrics=await (await fetch('/data/lyrics-a-v2.json')).json();
const world=await createWorld(),film=document.getElementById('film'),g=film.getContext('2d',{alpha:false});
function tracked(text,x,y,size,spacing,color,font='JetBrains Mono'){
 g.font=`500 ${size}px "${font}"`;g.fillStyle=color;g.textBaseline='alphabetic';
 for(const ch of text){g.fillText(ch,x,y);x+=g.measureText(ch).width+spacing;}
}
function render(t,{lyricsVisible=true}={}){
 const cue=at(t),{canvas,...s}=world.frame(cue.id,cue.geometryTime,cue.view);g.reset();g.fillStyle='#020307';g.fillRect(0,0,1920,1080);g.drawImage(canvas,0,0,1920,1080);
 if(cue.id==='write')tracked('write(memory.md)',104,104,21,.6,'#a394b4');
 else if(cue.id==='clock'){
  tracked('t ∈ [0, 24 h)',104,104,21,.6,'#a394b4');
  tracked(s.clock.display,1510,838,36,1.2,'#ded2ed');
  tracked(s.clock.period,1513,873,18,2,'#a594b7');
 }
 else if(cue.formula)tracked(cue.formula,104,104,21,.6,'#b6a2c9');
 const word=t>=6699/60&&t<6753/60?'VIBRATIONS':t>=6933/60&&t<6976/60?'COMPLETION':t>=7367/60&&t<7419/60?'ISOLATION':t>=7611/60&&t<7641/60?'FRAGMENTS':t>=7819/60?'DISHEARTENED':null;
 if(word){
  const cfg=word==='ISOLATION'?{x:405,y:427,size:68,spacing:25,alpha:.65}:word==='FRAGMENTS'?{x:1010,y:215,size:53,spacing:10,alpha:.75}:word==='DISHEARTENED'?{x:700,y:340,size:57,spacing:10,alpha:.76}:word==='COMPLETION'?{x:570,y:220,size:70,spacing:16,alpha:.85}:{x:520,y:230,size:72,spacing:15,alpha:.86};
  tracked(word,cfg.x,cfg.y,cfg.size,cfg.spacing,`rgba(221,208,238,${cfg.alpha})`,'Space Grotesk');
 }
 const f=Math.round(cue.time*60),line=lyrics.groups.find(x=>f>=x.startFrame&&f<x.displayEndFrame);
 let alpha=1;if(line){if(line.fadeInFrames>0)alpha=Math.min(alpha,(f-line.startFrame+1)/line.fadeInFrames);if(line.fadeOutFrames>0)alpha=Math.min(alpha,(line.displayEndFrame-f)/line.fadeOutFrames);}
 if(lyricsVisible&&line){
  g.globalAlpha=Math.max(0,Math.min(1,alpha));g.lineWidth=1.8;g.strokeStyle='rgba(0,0,0,.75)';g.shadowColor='rgba(0,0,0,.65)';g.shadowBlur=5;g.shadowOffsetY=2;
  for(const item of [{text:line.displayEn,size:30,font:'Space Grotesk',spacing:.5,y:966,color:'#c9c3d2'},
                    {text:line.displayZh,size:38,font:'Noto Sans SC',spacing:.7,y:1014,color:'#f0edf4'}]){
   g.font=`500 ${item.size}px "${item.font}"`;g.fillStyle=item.color;let x=88;
   for(const ch of item.text){g.strokeText(ch,x,item.y);g.fillText(ch,x,item.y);x+=g.measureText(ch).width+item.spacing;}
  }
 }
 return {...s,filmTime:cue.time,shot:cue.shot,lyric:lyricsVisible?line?.id??null:null,lyricAlpha:alpha,scan:cue.scan??null,accepted:!!cue.accepted};
}
window.renderAtVideoTime=render;window.filmMeta={start:START,end:FINISH,cuts:CUTS};render(START);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav'),play=document.getElementById('play'),seek=document.getElementById('seek'),time=document.getElementById('time');audio.currentTime=START;
 function show(t){render(t);seek.value=t;time.textContent=Math.floor(t/60)+':'+(t%60).toFixed(2).padStart(5,'0');}
 function tick(){if(audio.paused)return;if(audio.currentTime>=FINISH){audio.pause();play.textContent='播放';return;}show(audio.currentTime);requestAnimationFrame(tick);}
 play.onclick=async()=>{if(audio.paused){if(audio.currentTime>=FINISH-.03)audio.currentTime=START;await audio.play();play.textContent='暂停';tick();}else{audio.pause();play.textContent='播放';}};
 seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};
}
