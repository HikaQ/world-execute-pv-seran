const $=id=>document.getElementById(id),select=$('scenes'),frame=$('scene'),seek=$('seek'),play=$('play');
const {segments}=await fetch('/data/timeline-v24.json').then(r=>r.json());
segments.forEach((s,i)=>select.add(new Option(`${String(i+1).padStart(2,'0')} · ${(s.first/60).toFixed(2)}–${(s.end/60).toFixed(2)} s · ${s.version}${s.mode?' / '+s.mode:''}`,i)));
let seg,playing=false,busy=false,generation=0,epoch=0,start=0;
function stop(){playing=false;play.textContent='播放片段';}
async function draw(f){if(busy)return;busy=true;try{const r=await frame.contentWindow.renderSourceFrame(f);seek.value=r.frame;$('time').textContent=`${(r.frame/60).toFixed(2)} s · ${r.frame} f`;}finally{busy=false;}}
async function load(){const token=++generation;stop();play.disabled=true;seg=segments[+select.value];seek.min=seg.first;seek.max=seg.end-1;seek.value=seg.first;$('status').textContent='正在加载场景…';
 frame.src=`/preview/${seg.version}/?capture=1&refinement=1&frame=${seg.first}${seg.mode?'&range='+seg.mode:''}`;
 frame.onload=async()=>{try{const t=performance.now();while(!frame.contentWindow.sourceReady){if(token!==generation)return;if(frame.contentWindow.sourceFailure)throw Error(frame.contentWindow.sourceFailure);if(performance.now()-t>120000)throw Error('加载超时');await new Promise(r=>setTimeout(r,100));}
  if(token!==generation)return;play.disabled=false;await draw(seg.first);const state=await fetch('/api/status').then(r=>r.json());$('status').textContent=`1080p · 时间轴 60 FPS · 当前会话已使用 ${state.placeholders.length} 个外部素材占位图。实时播放速度取决于显卡。`;
 }catch(e){$('status').textContent=String(e);}};
}
select.onchange=load;seek.oninput=()=>{stop();draw(+seek.value);};play.onclick=()=>{if(playing){stop();return;}if(+seek.value>=seg.end-1)seek.value=seg.first;start=+seek.value;epoch=performance.now();playing=true;play.textContent='暂停';};
async function tick(now){if(playing&&!busy){const f=Math.min(seg.end-1,start+Math.floor((now-epoch)*.06));await draw(f);if(f>=seg.end-1)stop();}requestAnimationFrame(tick);}requestAnimationFrame(tick);await load();
