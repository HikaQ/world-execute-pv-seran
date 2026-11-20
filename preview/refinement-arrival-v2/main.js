import {Engine} from '../../references/world-execute-web/src/engine/engine.js?v=BCZDiMvz';
import {Timeline} from '../../references/world-execute-web/src/engine/timeline.js?v=vYBbdLfo';
import {loadTiming} from '../../references/world-execute-web/src/engine/timing.js?v=BkOIwBI0';
import {loadFeatures} from '../../references/world-execute-web/src/engine/features.js?v=i06jw_tL';
import {loadFonts} from '../../references/world-execute-web/src/engine/text.js?v=BTU-dakh';
import {FIRST,END,DURATION,PLAN,E,stateAt,transitionAt} from './score.js';
import {createScene} from './world.js';
import {createTerminal} from './terminal.js';
import {createCodexWindow} from './codex-window.js';
const canvas=document.getElementById('film'),g=canvas.getContext('2d',{alpha:false,willReadFrequently:true}),capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');window.filmReady=false;
await loadFonts(null);
await Promise.all([new FontFace('Mono','url(/assets/fonts/frost-reference/JetBrainsMono-VF.ttf)',{weight:'100 800'}),new FontFace('Chinese','url(/assets/fonts/frost-reference/NotoSansSC-VF.ttf)',{weight:'100 900'}),new FontFace('Execution','url(/assets/fonts/v7/Anton-Regular.ttf)',{weight:'400'})].map(async f=>document.fonts.add(await f.load())));await document.fonts.ready;
const worldCanvas=document.createElement('canvas'),engine=new Engine(worldCanvas,{width:1920,height:1080,mode:'render',edit:'orig',mb:'off',preserve:true,fonts:null,preroll:0});
[engine.T,engine.F]=await Promise.all([loadTiming(),loadFeatures()]);engine.T.preroll=0;engine.T.clockZero=0;engine.duration=engine.T.duration;
const world=createScene(),terminal=createTerminal(),codexWindow=createCodexWindow();
engine.timeline=new Timeline(engine.T,[],{edit:null,chapters:[{id:'seran-arrival-v2',ownsLyrics:true,shots:[{id:'film',at:0,draw:ctx=>world.draw(ctx)}]}]});
function render(time){
 const frame=Math.max(FIRST-1,Math.min(END-1,Math.round(time*60))),state=stateAt(frame),transition=transitionAt(frame);g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
 const shutter=transition?[.5,.25,0]:[0];
 for(let i=0;i<shutter.length;i++){engine.renderFrame((frame-shutter[i])/60);g.globalAlpha=1/(i+1);g.drawImage(worldCanvas,0,0);}g.globalAlpha=1;
 if(engine.errors.length)throw Error(engine.errors.join('\n'));
 const windowState=codexWindow.draw(g,frame),ending=terminal.draw(g,frame);return {videoTime:frame/60,localTime:(frame-FIRST)/60,shot:state.shot,referenceId:state.referenceId,state,...world.last,codexWindow:windowState,terminal:ending,lyrics:false};
}
window.renderAtVideoTime=render;window.studyMeta={plan:PLAN};window.arrivalStateAtFrame=stateAt;
for(const f of [E.terminal+80,E.execution+14,E.occupy+30,E.humanReply+15,E.delivered+5,E.pixels+20,E.transmit+20,E.address+10,E.queue+20,FIRST])render(f/60);
window.filmReady=true;
if(!capture){const audio=new Audio('/out/refinement-arrival-v2/audio.wav'),play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');let active=false;
 function show(t){render(FIRST/60+t);seek.value=t;clock.textContent=`${t.toFixed(2)} / ${DURATION.toFixed(2)}`;}
 play.onclick=async()=>{if(active){audio.pause();active=false;play.textContent='PLAY';}else{if(audio.currentTime>=DURATION-.04)audio.currentTime=0;await audio.play();active=true;play.textContent='PAUSE';}};
 seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};audio.onended=()=>{active=false;play.textContent='PLAY';};
 function tick(){if(active)show(audio.currentTime);requestAnimationFrame(tick);}tick();}
