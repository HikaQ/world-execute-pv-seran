import {Engine} from '../../references/world-execute-web/src/engine/engine.js?v=BCZDiMvz';
import {Timeline} from '../../references/world-execute-web/src/engine/timeline.js?v=vYBbdLfo';
import {loadTiming} from '../../references/world-execute-web/src/engine/timing.js?v=BkOIwBI0';
import {loadFeatures} from '../../references/world-execute-web/src/engine/features.js?v=i06jw_tL';
import {loadFonts} from '../../references/world-execute-web/src/engine/text.js?v=BTU-dakh';
import {stateAt,shotAt,transitionAt} from '../refinement-possession-v19/score.js';
import {createWorld,FIRST,END} from './world.js';
try{
 const film=document.querySelector('#film'),g=film.getContext('2d',{alpha:false});window.filmReady=false;
 await loadFonts(null);
 for(const [name,url] of [['Mono','/assets/fonts/frost-reference/JetBrainsMono-VF.ttf'],['Execution','/assets/fonts/v7/Anton-Regular.ttf']]){const font=new FontFace(name,`url(${url})`);await font.load();document.fonts.add(font);}
 await document.fonts.ready;
 const code=await Promise.all(['runtime-scene.js','memory-scenes.js'].map(async name=>{const r=await fetch('/preview/refinement-possession-rework-v4/'+name);if(!r.ok)throw Error(name);return r.text();}));
 const canvas=document.createElement('canvas'),engine=new Engine(canvas,{width:1920,height:1080,mode:'render',edit:'orig',mb:'off',preserve:true,fonts:null,preroll:0});
 [engine.T,engine.F]=await Promise.all([loadTiming(),loadFeatures()]);engine.T.preroll=0;engine.T.clockZero=0;engine.duration=engine.T.duration;
 const world=createWorld(code.join('\n\n')),type=document.createElement('canvas');type.width=1600;type.height=300;const tg=type.getContext('2d');
 tg.fillStyle='#fff';tg.font='258px Execution';tg.textAlign='center';tg.textBaseline='middle';tg.fillText('EXECUTION',800,147);
 const mask=tg.getImageData(0,0,1600,300).data;tg.clearRect(0,0,1600,300);tg.fillStyle='#ffa4a8';
 for(let y=5;y<300;y+=7)for(let x=5;x<1600;x+=7)if(mask[(y*1600+x)*4+3]>128){tg.beginPath();tg.arc(x,y,2.3,0,Math.PI*2);tg.fill();}
 engine.timeline=new Timeline(engine.T,[],{edit:null,chapters:[{id:'possession-v4',ownsLyrics:true,shots:[{id:'film',at:0,draw:ctx=>world.draw(ctx)}]}]});
 function render(time){
  const frame=Math.max(FIRST,Math.min(END-1,Math.round(time*60))),state=stateAt(frame),shot=shotAt(frame),transition=transitionAt(frame),shutter=transition?.to.join==='relay'?[.5,.25,0]:[0];
  g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
  shutter.forEach((offset,i)=>{engine.renderFrame((frame-offset)/60);g.globalAlpha=1/(i+1);g.drawImage(canvas,0,0);});g.globalAlpha=1;
  if(engine.errors.length)throw Error(engine.errors.join('\n'));
  const cue=state.execution;
  if(cue){const age=frame-cue.frame,a=Math.min(1,age<3?.72+age*.14:1)*Math.min(1,(cue.endFrame-frame)/7);g.save();g.globalAlpha=a;g.shadowColor='rgba(255,35,48,.35)';g.shadowBlur=age<8?16:5;g.drawImage(type,160,80,1600,300);g.restore();}
  const s=world.last;
  return {frame,shot:shot.id,referenceId:shot.referenceId,state,...s,finite:[...s.camera.position,...s.camera.redCore.screen].every(Number.isFinite),
   executionTypography:cue?{word:'EXECUTION',startFrame:cue.frame,endFrame:cue.endFrame}:null,
   backgroundLogs:{layout:'world-space-source-code',cameraAttached:false,depthSoftness:true,palette:'red'},lyrics:false};
 }
 window.renderAtVideoTime=render;window.filmReady=true;render((FIRST+28)/60);
 if(!new URLSearchParams(location.search).has('capture')){const start=performance.now();function tick(now){render((FIRST+(now-start)/1000*60%(END-FIRST))/60);requestAnimationFrame(tick);}requestAnimationFrame(tick);}
}catch(e){window.filmFailure=e.stack;console.error(e);}
