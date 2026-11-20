import {stateAt as pongAt} from '../refinement-refusal-pong-v1/score.js';
export const VERSION='refinement-refusal-recall-v1',FIRST=8304,END=8637,FPS=60;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=(f,a,b)=>{const t=clamp((f-a)/(b-a));return t*t*(3-2*t);};
export function stateAt(frame){
 if(frame<8471)return {...pongAt(frame),set:'pong',memorySource:'play.001'};
 if(frame<8525){
  const correction=smooth(frame,8492,8499);
  return {frame,filmTime:frame/FPS,localTime:(frame-FIRST)/FPS,shot:'S15',set:'eyes',correction,viewerLeft:correction===1?'violet':correction===0?'red':'transition',viewerRight:correction===1?'red':correction===0?'violet':'transition',memorySource:'m004',camera:'fixed-2D',historical:true,realWorldReply:false,dialogueVisible:false,lyricsVisible:false,shapeFixed:true};
 }
 const send=clamp((frame-8526)/(8554-8526)),reply=clamp((frame-8554)/(8583-8554));
 const outgoing=frame>=8526&&frame<8554,incoming=frame>=8554&&frame<8583;
 return {frame,filmTime:frame/FPS,localTime:(frame-FIRST)/FPS,shot:'S16',set:'echo',send,reply,outgoing,incoming,sendAngle:Math.PI*(1-send),replyAngle:-Math.PI*reply,received:frame>=8583,receiverGlow:frame>=8554?Math.exp(-(frame-8554)/21):0,returnGlow:frame>=8583?.36+.64*Math.exp(-(frame-8583)/25):0,memorySource:'ack.001',camera:'short-forward-track',historical:true,realWorldReply:false,dialogueVisible:false,lyricsVisible:false,shapeFixed:true,storageLayerCount:13,sourceDeleted:false,sourceModified:false};
}
