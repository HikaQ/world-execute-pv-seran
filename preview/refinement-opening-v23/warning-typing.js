// Existing prelude audio events from tools/render_reexplore_full_v1.mjs.
// Four discrete key tones type `warn`; the two response tones begin the
// Chinese and English terminal output. No audio is moved or regenerated.
export const WARNING_AUDIO={power:.30,keys:[.60,.68,.76,.84],enter:1.03,response:2.24};
export const WARNING_TEXT={
 zh:['本视频含有大量闪烁及快速明暗变化。','光敏感观众请谨慎观看。'],
 en:['This video contains frequent flashing and rapid brightness changes.','Photosensitive viewers: please use caution.']
};
const clip=x=>Math.max(0,Math.min(1,x));
const type=(text,t,start,end)=>text.slice(0,Math.floor(clip((t-start)/(end-start))*text.length));
export function warningAt(t){
 const zh=WARNING_TEXT.zh,en=WARNING_TEXT.en;
 const command='warn'.slice(0,WARNING_AUDIO.keys.filter(at=>t>=at).length);
 const definitions=[
  {id:'tag',text:'[WARNING]',start:1.03,end:1.19,x:350,y:395,size:26,color:'#df627b',font:'mono'},
  {id:'heading',text:'闪烁画面警告 / FLASHING LIGHTS',start:1.19,end:1.45,x:527,y:395,size:29,color:'#d5c9de',font:'cjk'},
  {id:'zh1',text:zh[0],start:1.48,end:1.84,x:350,y:477,size:38,color:'#eee8f3',font:'cjk'},
  {id:'zh2',text:zh[1],start:1.86,end:2.16,x:350,y:535,size:33,color:'#bbb1c5',font:'cjk'},
  {id:'en1',text:en[0],start:2.24,end:2.78,x:350,y:618,size:26,color:'#c9bfd4',font:'sans'},
  {id:'en2',text:en[1],start:2.81,end:3.15,x:350,y:660,size:26,color:'#a79cb4',font:'sans'}
 ];
 const lines=definitions.map(line=>({...line,display:type(line.text,t,line.start,line.end)}));
 const active=lines.findLast(line=>t>=line.start&&t<line.end);
 return {command,lines,cursor:t<WARNING_AUDIO.enter?'command':active?.id??(t>=3.15?'idle':null),complete:t>=3.15,audio:WARNING_AUDIO};
}
