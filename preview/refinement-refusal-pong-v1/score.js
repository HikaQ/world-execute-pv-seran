export const VERSION='refinement-refusal-pong-v1',FIRST=8304,END=8471,FPS=60;
export const CONFIG={width:1920,height:1080,ballRadius:12,paddleWidth:16,paddleHeight:144,leftX:292,rightX:1612,top:204,bottom:876,speed:1600,maxAngle:Math.PI*40/180};
const LO=CONFIG.leftX+CONFIG.paddleWidth+CONFIG.ballRadius,HI=CONFIG.rightX-CONFIG.ballRadius;
const TOP=CONFIG.top+CONFIG.ballRadius,BOTTOM=CONFIG.bottom-CONFIG.ballRadius,SPAN=BOTTOM-TOP;
const vx1=(HI-LO)/((8360-8305)/FPS),vx2=(HI-LO)/((8416-8360)/FPS);
const vy1=Math.sqrt(CONFIG.speed**2-vx1**2),vy2=Math.sqrt(CONFIG.speed**2-vx2**2);
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ease=u=>u*u*u*(u*(u*6-15)+10);
function fold(raw,velocity){
 const q=((raw-TOP)%(2*SPAN)+2*SPAN)%(2*SPAN);
 let slope=q<SPAN?1:-1;
 if(Math.abs(q)<1e-8)slope=Math.sign(velocity);
 if(Math.abs(q-SPAN)<1e-8)slope=-Math.sign(velocity);
 return {y:TOP+(q<=SPAN?q:2*SPAN-q),vy:velocity*slope};
}
function advance(segment,frame){
 const dt=(frame-segment.frame)/FPS;
 const vertical=fold(segment.y+segment.vy*dt,segment.vy);
 return {x:segment.x+segment.vx*dt,y:vertical.y,vx:segment.vx,vy:vertical.vy};
}
const a={frame:8305,x:LO,y:600,vx:vx1,vy:-vy1};
const atB=advance(a,8360),b={frame:8360,x:HI,y:atB.y,vx:-vx2,vy:vy2};
const atC=advance(b,8416),c={frame:8416,x:LO,y:atC.y,vx:vx2,vy:-vy2};
const before={frame:8305,x:LO,y:600,vx:-vx2,vy:-vy2};
export const SEGMENTS=[before,a,b,c];
export const HITS=[a,b,c].map((s,i)=>({frame:s.frame,side:i===1?'right':'left',x:s.x,y:s.y,outgoingVelocity:[s.vx,s.vy],paddleCenter:s.y-Math.atan2(s.vy,Math.abs(s.vx))/CONFIG.maxAngle*(CONFIG.paddleHeight/2)}));
const future=advance(c,8472);
const leftKeys=[[FIRST,HITS[0].paddleCenter],[8370,HITS[0].paddleCenter],[8404,HITS[2].paddleCenter],[8434,HITS[2].paddleCenter],[END,HITS[2].paddleCenter+60]];
const rightKeys=[[FIRST,378],[8315,378],[8347,HITS[1].paddleCenter],[8425,HITS[1].paddleCenter],[8459,Math.min(CONFIG.bottom-CONFIG.paddleHeight/2,future.y-40)],[END,Math.min(CONFIG.bottom-CONFIG.paddleHeight/2,future.y-40)]];
function keyAt(keys,frame){
 if(frame<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(frame<keys[i][0]){
  const [f0,y0]=keys[i-1],[f1,y1]=keys[i];return y0+(y1-y0)*ease((frame-f0)/(f1-f0));
 }
 return keys.at(-1)[1];
}
export function ballAt(frame){return advance(frame<8305?before:frame<8360?a:frame<8416?b:c,frame);}
export function stateAt(frame){
 const ball=ballAt(frame),left=keyAt(leftKeys,frame),right=keyAt(rightKeys,frame);
 const hit=HITS.find(h=>frame>=h.frame&&frame<h.frame+7);
 return {frame,filmTime:frame/FPS,localTime:(frame-FIRST)/FPS,shot:frame<8415?'S13':'S14',ball:{...ball,radius:CONFIG.ballRadius},paddles:{left:{x:CONFIG.leftX,y:left,width:CONFIG.paddleWidth,height:CONFIG.paddleHeight},right:{x:CONFIG.rightX,y:right,width:CONFIG.paddleWidth,height:CONFIG.paddleHeight}},contact:hit?{side:hit.side,y:hit.y,strength:Math.exp(-(frame-hit.frame)/2.5)}:null,camera:'fixed-2D',ballCount:1,paddleCount:2,scoreChanged:false,dialogueVisible:false,lyricsVisible:false,realWorldReply:false,historical:true,memoryId:'play.001'};
}
export function wallEvents(){
 const result=[];
 for(const [s,last] of [[a,8360],[b,8416],[c,END]]){
  const endRaw=s.y+s.vy*(last-s.frame)/FPS;
  const low=Math.min(s.y,endRaw),high=Math.max(s.y,endRaw);
  for(let k=Math.ceil((low-TOP)/SPAN);k<=Math.floor((high-TOP)/SPAN);k++){
   const plane=TOP+k*SPAN,frame=s.frame+(plane-s.y)/s.vy*FPS;
   if(frame>s.frame+1e-7&&frame<last-1e-7)result.push({frame,edge:Math.abs(k%2)===0?'top':'bottom',...ballAt(frame)});
  }
 }
 return result;
}
