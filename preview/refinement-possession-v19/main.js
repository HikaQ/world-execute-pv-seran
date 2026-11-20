import {Engine} from '../../references/world-execute-web/src/engine/engine.js?v=BCZDiMvz';
import {Timeline} from '../../references/world-execute-web/src/engine/timeline.js?v=vYBbdLfo';
import {loadTiming} from '../../references/world-execute-web/src/engine/timing.js?v=BkOIwBI0';
import {loadFeatures} from '../../references/world-execute-web/src/engine/features.js?v=i06jw_tL';
import {loadFonts} from '../../references/world-execute-web/src/engine/text.js?v=BTU-dakh';
import {FIRST,END,DURATION,PLAN,E,stateAt,transitionAt,entryOpacity} from './score.js';
import {createScene} from './world.js';
import {createTypography} from './type.js';
import {HEART_ASSEMBLY_CUT} from './assembly-heart.js';
const canvas=document.getElementById('film'),g=canvas.getContext('2d',{alpha:false,willReadFrequently:true}),capture=new URLSearchParams(location.search).has('capture');
if(capture)document.body.classList.add('capture');window.filmReady=false;
await loadFonts(null);
await Promise.all([
 new FontFace('Mono','url(/assets/fonts/frost-reference/JetBrainsMono-VF.ttf)',{weight:'100 800'}),
 new FontFace('Chinese','url(/assets/fonts/frost-reference/NotoSansSC-VF.ttf)',{weight:'100 900'}),
 new FontFace('Execution','url(/assets/fonts/v7/Anton-Regular.ttf)',{weight:'400'})
].map(async f=>document.fonts.add(await f.load())));await document.fonts.ready;
const worldCanvas=document.createElement('canvas'),engine=new Engine(worldCanvas,{width:1920,height:1080,mode:'render',edit:'orig',mb:'off',preserve:true,fonts:null,preroll:0});
[engine.T,engine.F]=await Promise.all([loadTiming(),loadFeatures()]);engine.T.preroll=0;engine.T.clockZero=0;engine.duration=engine.T.duration;
const world=createScene(),type=createTypography();
engine.timeline=new Timeline(engine.T,[],{edit:null,chapters:[{id:'seran-possession-v18',ownsLyrics:true,shots:[{id:'film',at:0,draw:ctx=>world.draw(ctx)}]}]});
function render(time){
 const frame=Math.max(FIRST,Math.min(END-1,Math.round(time*60))),state=stateAt(frame);g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);
 const transition=transitionAt(frame),shutter=state.abyssActive&&frame>E.abyss?[.4375,.375,.3125,.25,.1875,.125,.0625,0]:transition?.to.join==='relay'?[.5,.25,0]:[0];
 const poseFrame=state.shot==='H02'?Math.min(frame,HEART_ASSEMBLY_CUT.joined):frame;
 shutter.forEach((offset,i)=>{engine.renderFrame((poseFrame-offset)/60);if(frame>FIRST+2&&!state.blackHold){g.globalAlpha=(frame>=E.learn?entryOpacity(frame):1)/(i+1);g.drawImage(worldCanvas,0,0);}});g.globalAlpha=1;
 if(engine.errors.length)throw Error(engine.errors.join('\n'));
 const typography=type.draw(g,frame),v=world.last;
  return {videoTime:frame/60,localTime:(frame-FIRST)/60,shot:state.shot,referenceId:v.referenceId,transition:v.transition,entryOpacity:frame>=E.learn?entryOpacity(frame):1,state,camera:v.camera,programBounds:v.programBounds,programStates:v.programStates,abyssBounds:v.abyssBounds,worldScale:v.worldScale,particleCount:v.particleCount,geometry:v.geometry,sceneId:v.sceneId,subject:v.subject,fracture:v.fracture??null,typography,insert:v.insert??null,reverseHeart:v.reverseHeart??null,convergence:v.convergence??null,...(v.assembly?{assembly:v.assembly}:{}),lyrics:false};
}
window.renderAtVideoTime=render;window.studyMeta={plan:PLAN,executionCues:PLAN.executions};window.possessionStateAtFrame=stateAt;
for(const f of [E.closed,E.refine+20,E.abyss+20,E.release+20,E.failed+12,FIRST])render(f/60);
window.filmReady=true;
if(!capture){
 const audio=new Audio('/out/refinement-possession-v18/audio.wav'),play=document.getElementById('play'),seek=document.getElementById('seek'),clock=document.getElementById('clock');let active=false;
 function show(t){render(FIRST/60+t);seek.value=t;clock.textContent=`${t.toFixed(2)} / ${DURATION.toFixed(2)}`;}
 play.onclick=async()=>{if(active){audio.pause();active=false;play.textContent='PLAY';}else{if(audio.currentTime>=DURATION-.04)audio.currentTime=0;await audio.play();active=true;play.textContent='PAUSE';}};
 seek.oninput=()=>{audio.currentTime=+seek.value;show(+seek.value);};audio.onended=()=>{active=false;play.textContent='PLAY';};
 function tick(){if(active)show(audio.currentTime);requestAnimationFrame(tick);}tick();
}
