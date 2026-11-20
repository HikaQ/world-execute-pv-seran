import {loadFonts} from '../reexplore-v6-chat-opening/typography.js';
import {createWorld} from './world.js';
import {FIRST,END,START,FINISH,CUTS,at,smooth,clamp} from './score.js';
import {createWorld as createProofWorld} from './proof-world.js';
import {loadCreditFont} from '../refinement-opening-v15/intro-titles.js';
import {loadGeometryFont} from '../refinement-perception-v4/geometry.js';
import {loadPerceptionFont} from '../refinement-perception-v4/perception.js';
import {loadForgettingFont} from '../refinement-forgetting-v6/forgetting.js';
import {loadCareFont} from './proof-care.js';
window.filmReady=false;const capture=new URLSearchParams(location.search).has('capture');if(capture)document.body.classList.add('capture');
await Promise.all([loadFonts(),loadCreditFont(),loadGeometryFont(),loadPerceptionFont(),loadForgettingFont(),loadCareFont()]);const lyrics=await(await fetch('/data/lyrics-a-v2.json')).json();const world=await createWorld(),proof=await createProofWorld(),film=document.getElementById('film'),g=film.getContext('2d',{alpha:false});
function tint(hexA,hexB,u){const a=hexA.match(/\w\w/g).map(x=>parseInt(x,16)),b=hexB.match(/\w\w/g).map(x=>parseInt(x,16));return 'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*u)).join(',')+')';}
function lightAt(x,light){return light;}
function tracked(text,x,y,size,spacing,color,font='JetBrains Mono'){
 g.font=`500 ${size}px "${font}"`;g.fillStyle=color;g.textBaseline='alphabetic';for(const ch of text){g.fillText(ch,x,y);x+=g.measureText(ch).width+spacing;}
}
function render(t,{lyricsVisible=true}={}){
 const cue=at(t),f=Math.round(t*60);let state;
 g.reset();g.fillStyle='#020307';g.fillRect(0,0,1920,1080);
 if(f<5645){
  const {canvas,...p}=proof.frame(t);g.drawImage(canvas,0,0,1920,1080);state={filmTime:t,shot:'proof-hold',camera:p.camera,coreScreen:p.core.screenCenter,point:p.care.worldPosition,finite:p.care.finite,byte:null,flip:0,light:0,wordGain:p.care.existence.wordDisplayGain,legacyFVisible:false};
 }else{
  const {canvas,...s}=world.frame(t,cue.light);state=s;g.drawImage(canvas,0,0,1920,1080);
  if(cue.light>0){
   const [x,y]=state.coreScreen,glow=g.createRadialGradient(x,y,1,x,y,27);g.save();g.globalAlpha=cue.light;glow.addColorStop(0,'#c40e37');glow.addColorStop(.13,'#cc1741');glow.addColorStop(.35,'rgba(213,22,65,.42)');glow.addColorStop(1,'rgba(216,20,67,0)');g.fillStyle=glow;g.fillRect(x-28,y-28,56,56);
   g.fillStyle='#ee6381';g.beginPath();g.arc(x,y,2.5,0,Math.PI*2);g.fill();g.restore();
  }
  const label=state.flip===0?'0x46 → 0x4D':state.flip===1?'0x4D':'0x46 ⊕ 0x0B = 0x4D';tracked(label,104,104,21,.6,tint('a394b4','503b62',lightAt(104,cue.light)));
 }
 const line=lyrics.groups.find(x=>f>=x.startFrame&&f<x.displayEndFrame);let alpha=1;
 if(line){if(line.fadeInFrames>0)alpha=Math.min(alpha,(f-line.startFrame+1)/line.fadeInFrames);if(line.fadeOutFrames>0)alpha=Math.min(alpha,(line.displayEndFrame-f)/line.fadeOutFrames);}
 if(lyricsVisible&&line){
  g.globalAlpha=Math.max(0,Math.min(1,alpha));g.lineWidth=1.8;g.textBaseline='alphabetic';
  for(const item of [{text:line.displayEn,size:30,font:'Space Grotesk',spacing:.5,y:966,color:'c9c3d2',lightColor:'50445c'},{text:line.displayZh,size:38,font:'Noto Sans SC',spacing:.7,y:1014,color:'f0edf4',lightColor:'30233e'}]){
   g.font=`500 ${item.size}px "${item.font}"`;let x=88;for(const ch of item.text){const L=f<5645?0:lightAt(x,cue.light);g.fillStyle=tint(item.color,item.lightColor,L);g.strokeStyle=L>.5?'rgba(222,217,229,.35)':'rgba(0,0,0,.75)';g.shadowColor=L>.5?'transparent':'rgba(0,0,0,.65)';g.shadowBlur=L>.5?0:5;g.shadowOffsetY=L>.5?0:2;g.strokeText(ch,x,item.y);g.fillText(ch,x,item.y);x+=g.measureText(ch).width+item.spacing;}
  }
 }
 return {...state,lyric:lyricsVisible?line?.id??null:null,lyricAlpha:alpha};
}
window.renderAtVideoTime=render;window.filmMeta={start:START,end:FINISH,cuts:CUTS};render(START);window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/reexplore-full-v2/full-audio.wav'),play=document.getElementById('play'),seek=document.getElementById('seek'),time=document.getElementById('time');audio.currentTime=START;
 function show(t){render(t);seek.value=t;time.textContent=Math.floor(t/60)+':'+(t%60).toFixed(2).padStart(5,'0');}
 function tick(){if(audio.paused)return;if(audio.currentTime>=FINISH){audio.pause();play.textContent='播放';return;}show(audio.currentTime);requestAnimationFrame(tick);}
 play.onclick=async()=>{if(audio.paused){if(audio.currentTime>=FINISH-.03)audio.currentTime=START;await audio.play();play.textContent='暂停';tick();}else{audio.pause();play.textContent='播放';}};seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};
}
