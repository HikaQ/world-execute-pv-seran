import {Engine} from '../../references/world-execute-web/src/engine/engine.js?v=BCZDiMvz';
import {Timeline} from '../../references/world-execute-web/src/engine/timeline.js?v=vYBbdLfo';
import {loadTiming} from '../../references/world-execute-web/src/engine/timing.js?v=BkOIwBI0';
import {loadFeatures} from '../../references/world-execute-web/src/engine/features.js?v=i06jw_tL';
import {loadFonts} from '../../references/world-execute-web/src/engine/text.js?v=BTU-dakh';
import {stateAt,shotAt,entryOpacity} from '../refinement-possession-v19/score.js';
import {createLearning,FIRST,END} from './learning.js';
try{
 const film=document.querySelector('#film'),g=film.getContext('2d',{alpha:false});window.filmReady=false;await loadFonts(null);
 const font=new FontFace('Mono','url(/assets/fonts/frost-reference/JetBrainsMono-VF.ttf)');await font.load();document.fonts.add(font);await document.fonts.ready;
 const canvas=document.createElement('canvas'),engine=new Engine(canvas,{width:1920,height:1080,mode:'render',edit:'orig',mb:'off',preserve:true,fonts:null,preroll:0});
 [engine.T,engine.F]=await Promise.all([loadTiming(),loadFeatures()]);engine.T.preroll=0;engine.T.clockZero=0;engine.duration=engine.T.duration;
 const world=createLearning();engine.timeline=new Timeline(engine.T,[],{edit:null,chapters:[{id:'learning-v2',ownsLyrics:true,shots:[{id:'film',at:0,draw:ctx=>world.draw(ctx)}]}]});
 function render(time){
  const f=Math.max(FIRST,Math.min(END-1,Math.round(time*60))),state=stateAt(f),shot=shotAt(f);
  g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);engine.renderFrame((shot.id==='H02'?Math.min(f,11161):f)/60);g.globalAlpha=entryOpacity(f);g.drawImage(canvas,0,0);g.globalAlpha=1;
  if(engine.errors.length)throw Error(engine.errors.join('\n'));
  return {frame:f,shot:shot.id,referenceId:shot.referenceId,state,...world.last,entryOpacity:entryOpacity(f),lyrics:false};
 }
 window.renderAtVideoTime=render;render((FIRST+90)/60);window.filmReady=true;
 if(!new URLSearchParams(location.search).has('capture')){const start=performance.now();function tick(now){render((FIRST+(now-start)/1000*60%(END-FIRST))/60);requestAnimationFrame(tick);}requestAnimationFrame(tick);}
}catch(e){window.filmFailure=e.stack;console.error(e);}
