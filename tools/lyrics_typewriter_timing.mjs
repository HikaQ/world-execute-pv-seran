// English-only lyric animation. The shared bilingual cue clock never restarts at cuts.
export const TYPEWRITER_VERSION = 'lyrics-A-v3';
const segmenter = new Intl.Segmenter('en', {granularity:'grapheme'});
export const graphemes = text => [...segmenter.segment(text)].map(x => x.segment);
export function typingFrames(group) {
  const count = graphemes(group.en).length;
  const available = group.displayEndFrame-group.startFrame-(group.fadeOutFrames||0);
  return Math.max(1,Math.min(54,Math.max(4,Math.round(count*1.35)),Math.floor(available*.5)));
}
export function englishAtFrame(group,frame) {
  const chars=graphemes(group.en),duration=group.typewriterFrames??typingFrames(group);
  const age=frame-group.startFrame;
  const count=age<0?0:Math.min(chars.length,Math.max(1,Math.floor((age+1)*chars.length/duration)));
  return {text:'> '+chars.slice(0,count).join(''),count,total:chars.length,complete:count===chars.length};
}
export function alphaAtFrame(group,frame) {
  if(frame<group.startFrame||frame>=group.displayEndFrame)return 0;
  return Math.min(1,group.fadeInFrames?(frame-group.startFrame+1)/group.fadeInFrames:1,
    group.fadeOutFrames?(group.displayEndFrame-frame)/group.fadeOutFrames:1);
}
export function panelLightAtFrame(frame) {
  if(frame<5645||frame>=5844)return 0;
  const t=Math.max(0,Math.min(1,(frame-5670)/50));
  return 1-t*t*t*(t*(t*6-15)+10);
}
