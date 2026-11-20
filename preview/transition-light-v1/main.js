import * as THREE from 'three';
import {createLens} from './lens-4k.js';
import {createCodeLayer} from './code-layer.js';
const params=new URLSearchParams(location.search),mode='transition',raw=false;
const film=document.querySelector('#film'),ctx=film.getContext('2d',{alpha:false}),lens=createLens();
const stage=document.createElement('canvas');stage.width=1920;stage.height=1080;const stageCtx=stage.getContext('2d',{alpha:false});
const formulas={};
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const clips=await (await fetch('./clips.json')).json(),clip=clips.find(c=>c.id===mode);
await Promise.all([['JetBrains Mono','/assets/fonts/frost-reference/JetBrainsMono-VF.ttf'],['Space Grotesk','/assets/fonts/frost-reference/SpaceGrotesk-VF.ttf'],['Execution','/assets/fonts/v7/Anton-Regular.ttf'],['Display','/assets/fonts/frost-reference/SpaceGrotesk-VF.ttf'],['Mono','/assets/fonts/frost-reference/JetBrainsMono-VF.ttf']].map(async([name,url])=>document.fonts.add(await new FontFace(name,`url(${url})`,{weight:'100 900'}).load())));
let world,code,model,plan,stateAt,helix,center,recall,cache=new Map();
if(mode==='wave'||mode==='helix'){
 const folder=mode==='wave'?'refinement-geometry-v11':'refinement-perception-v17';
 const [a,b,c,d,e]=await Promise.all([import('../reexplore-v6-chat-opening/typography.js'),import('../refinement-opening-v15/intro-titles.js'),import(`../${folder}/geometry.js`),import(`../${folder}/perception.js`),import(`../${folder}/world.js`)]);
 await Promise.all([a.loadFonts(),b.loadCreditFont(),c.loadGeometryFont(),d.loadPerceptionFont()]);world=await e.createWorld();
 if(mode==='wave'){model=await import('../refinement-geometry-v11/wave-model.js');code=await createCodeLayer(world.scene,'wave','../refinement-geometry-v11/wave-model.js');}
 else{helix=await import('../refinement-perception-v16/helix-rhythm.js');center=(await import('../refinement-perception-v16/spatial-score.js')).HELIX_CENTER;code=await createCodeLayer(world.scene,'helix','../refinement-perception-v16/helix-rhythm.js');}
}else{
 const m=await import('./world.js');world=m.createWorld();plan=await (await fetch('./edit-plan.json')).json();stateAt=(await import('../refinement-execution-v17/state.js')).stateAt;
 recall=await (await fetch('../refinement-execution-v14/recall-manifest.json')).json();code=await createCodeLayer(world.scene,'execution','./forced-lock.js');
}
async function image(url){if(!cache.has(url)){const im=new Image();im.src=url;await im.decode();cache.set(url,im);if(cache.size>16)cache.delete(cache.keys().next().value);}return cache.get(url);}
function drawFormula(state,t){
 const cinema=state.geometry?.cinema;if(!cinema?.active)return;
 ctx.save();ctx.globalAlpha=cinema.weight??1;ctx.font='500 25px "JetBrains Mono"';ctx.fillStyle='#bba5d8';ctx.textBaseline='top';ctx.fillText(cinema.formula,112,104);
 if(cinema.phase==='infinity'){ctx.textAlign='right';ctx.font='500 18px "JetBrains Mono"';ctx.fillStyle='#9884ab';ctx.fillText('x = 10^'+(1+cinema.flightDistance*.085).toFixed(2),1808,114);}
 if(cinema.phase==='contact'&&cinema.delta>.015&&cinema.contactLabel){const [x,y]=cinema.contactLabel;if(x>180&&x<1600&&y<820){ctx.font='500 16px "JetBrains Mono"';ctx.fillStyle='#ac91c6';ctx.fillText('Δx = '+cinema.delta.toFixed(3),x-48,y+20);}}
 ctx.textAlign='center';for(const r of cinema.rulers??[]){ctx.globalAlpha=(cinema.weight??1)*Math.min(.68,25/r.depth);ctx.font=`500 ${Math.max(11,Math.min(23,570/r.depth)).toFixed(1)}px "JetBrains Mono"`;ctx.fillText('10^'+r.value,r.x,r.y);}ctx.restore();
}
async function renderAtVideoTime(t){
 const frame=Math.round(t*60);window.__copyFrame=frame;ctx.reset();ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);
 let state,source,core=null,ca=2.0,fault=0,decoration=null;
 if(mode==='wave'){
  const phase=model.phaseAt(t),active=phase==='infinity'?'flightWave':phase==='contact'?'curveSlope':'curveY';
  decoration=code.update(frame,{origin:[1,14,model.stageZ(t)-21],orientation:.16,scale:.70,reveal:raw?0:ease((frame-clip.a)/20)*.65,active,values:[`t = ${t.toFixed(3)}; x = ${model.pointX(t).toFixed(3)};`,`y = ${model.curveY(model.pointX(t),t).toFixed(4)}; phase = "${phase}";`]});
  state=world.frame(t);source=state.canvas;core=state.geometry?.cinema?.coreScreen;ca=2.1;
 }else if(mode==='helix'){
  const growth=helix.helixGrowth(t);decoration=code.update(frame,{origin:[center[0]-18,center[1]+10,center[2]-30],orientation:-.18,reveal:raw?0:ease((frame-clip.a)/26)*.62,scale:.85,active:'helixGrowth',values:[`t = ${t.toFixed(3)}; phase = "${growth.phase}";`,`headU = ${Number(growth.headU??0).toFixed(4)}; pitch = ${Number(growth.pitch).toFixed(3)};`]});
  state=world.frame(t);source=state.canvas;core=state.perception?.screenCenter;ca=1.75;
 }else if(frame<9162){source=await image(`/out/global-fx-trial-v1/context/${frame}.jpg`);state={frame,context:true};ca=2*ease((frame-clip.a)/28);
 }else{
  const shot=plan.shots.findLast(s=>frame>=s.cutFrame)??{id:'ENTRY',scene:'lock',cutFrame:9162,frames:28,impactFrame:9191,group:'ENTRY'},s=stateAt(frame,plan);
  if(shot.source){const q=recall[shot.source.key],f=Math.min(q.frames-1,Math.max(0,frame-shot.cutFrame)),im=await image(`/preview/refinement-execution-v14/recall/${shot.source.key}/${String(f).padStart(4,'0')}.jpg`);ctx.save();ctx.filter='saturate(.3) contrast(1.06)';ctx.drawImage(im,0,0,1920,1080);ctx.filter='none';ctx.globalCompositeOperation='color';ctx.globalAlpha=shot.group==='E04'?.18:shot.group==='E08'?.48:.78;ctx.fillStyle='#b73a55';ctx.fillRect(0,0,1920,1080);ctx.restore();source=film;state={frame,shot:shot.id,scene:'recall'};}
  else{
   const late=mode==='climax',gain=late?.24:ease((frame-9176)/30)*(1-ease((frame-9295)/30));
   decoration=code.update(frame,{origin:late?[-27,17,-38]:[-27,15,-11],orientation:.18,scale:late?1.8:1,reveal:0,active:frame<9303?'const load':'localOpen',values:[`frame = ${frame}; load = ${clamp((frame-9247)/56).toFixed(3)};`,`open = ${(1-Math.pow(1-clamp((frame-9303)/18),3)).toFixed(3)}; queued = ${s.queuedMessages};`]});
   state=world.render(frame,shot,plan,s);source=world.canvas;core=state.entryTransition?.coreScreen??state.redCoreMotion?.screen;
   if(!core&&state.corePosition){const p=new THREE.Vector3(...state.corePosition).project(world.camera);core=[(p.x+1)*960,(1-p.y)*540];}
   // The film-light-code-v2 lens is applied by the capture layer.
  }
  const event=plan.glitch.events.findLast(e=>frame>=e.frame&&frame<e.frame+e.duration);
  if(event){const age=frame-event.frame;fault=event.strength*(event.rgbMultiplier??1)*(age<2?1:Math.pow(1-(age-1)/Math.max(1,event.duration-1),1.3));}
  ca=mode==='climax'?2.7:2.15;
 }
 if(raw)ctx.drawImage(source,0,0,1920,1080);else ctx.drawImage(lens.apply(source,{frame,ca,fault,core}),0,0,1920,1080);
 if(mode==='wave')drawFormula(state,t);
 if((mode==='climax'||mode==='transition')&&frame>=9191&&formulas[state.set]){ctx.font='400 21px "Mono"';ctx.fillStyle='#aaa1b8';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(formulas[state.set],72,82);}
 const finite=state.finite!==false&&(!core||core.every(Number.isFinite));
 const result={frame,mode,shot:state.shot??state.set??state.geometry?.cinema?.phase,state:{camera:state.camera??{position:world?.camera?.position.toArray()},entry:state.entryTransition,forcedUnlock:state.forcedUnlock,redCore:state.redCoreMotion,footerPlacement:state.perception?.footerPlacement},decoration,fx:{ca:raw?0:ca,fault:raw?0:fault,protectedCore:core},finite};
 window.lastState=result;return result;
}
window.renderAtVideoTime=renderAtVideoTime;window.clip=clip;await renderAtVideoTime(clip.a/60);window.filmReady=true;
