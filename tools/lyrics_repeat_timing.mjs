// A counter follows consecutive vocal cues, not shots or merged subtitle plates.
import {englishAtFrame,alphaAtFrame} from './lyrics_typewriter_timing.mjs';
export {graphemes,typingFrames,panelLightAtFrame} from './lyrics_typewriter_timing.mjs';
export const VERSION='lyrics-A-v4';
const normalized=text=>text.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
export function buildRepeatRuns(rows,groups){
 const sequences=[];
 for(const row of rows){
  const last=sequences.at(-1);
  if(last&&normalized(last[0].en)===normalized(row.en))last.push(row);else sequences.push([row]);
 }
 return sequences.filter(s=>s.length>1).map((sequence,i)=>{
  const first=groups.find(g=>g.sourceIds.includes(sequence[0].id));
  const last=groups.find(g=>g.sourceIds.includes(sequence.at(-1).id));
  if(!first||!last)throw Error('Repeated vocal cue has no display group');
  return {id:`R${String(i+1).padStart(3,'0')}`,en:first.en,startFrame:first.startFrame,endFrame:last.displayEndFrame,
   total:sequence.length,groupIds:groups.filter(g=>g.sourceIds.some(id=>sequence.some(r=>r.id===id))).map(g=>g.id),
   events:sequence.map((r,i)=>({frame:r.startFrame,count:i+1,sourceId:r.id,sourceIndex:r.sourceIndex})),
   englishCue:{...first,displayEndFrame:last.displayEndFrame,fadeOutFrames:last.fadeOutFrames}};
 });
}
export function englishWithRepeatsAtFrame(data,frame){
 const run=data.repeatRuns.find(r=>frame>=r.startFrame&&frame<r.endFrame);
 const group=run?.englishCue??data.groups.find(g=>frame>=g.startFrame&&frame<g.displayEndFrame);
 if(!group)return {text:'',fullText:'',alpha:0,count:0,total:0,complete:false,repetitionCount:0,repeatId:null,groupId:null};
 const typed=englishAtFrame(group,frame),repetitionCount=run?.events.findLast(e=>frame>=e.frame)?.count??1;
 const suffix=repetitionCount>1?` ×${repetitionCount}`:'';
 return {...typed,text:typed.text+suffix,fullText:group.displayEn+suffix,alpha:alphaAtFrame(group,frame),
  repetitionCount,repeatId:run?.id??null,groupId:group.id};
}
