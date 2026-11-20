import {EXECUTIONS,ramp} from './score.js';
export function createTypography(){
 const mask=document.createElement('canvas');mask.width=1420;mask.height=270;const g=mask.getContext('2d',{willReadFrequently:true});g.font='200px Execution';g.textAlign='center';g.fillStyle='#fff';g.fillText('EXECUTION',710,217);
 const data=g.getImageData(0,0,1420,270).data,points=[];for(let y=8;y<264;y+=8)for(let x=8;x<1412;x+=8)if(data[(y*1420+x)*4+3]>160)points.push([x,y]);
 const sprite=document.createElement('canvas');sprite.width=1420;sprite.height=270;const s=sprite.getContext('2d',{willReadFrequently:true});s.fillStyle='#ffd9e5';for(const [x,y]of points){s.beginPath();s.arc(x,y,2.65,0,Math.PI*2);s.fill();}
 function draw(ctx,frame){const cue=EXECUTIONS.find(e=>frame>=e.frame&&frame<e.endFrame);if(!cue)return null;
  const age=frame-cue.frame,a=1-ramp(age,36,43),scale=cue.id===2?.72:1;ctx.save();ctx.globalAlpha=a;
  const x=(1920-1420*scale)/2,y=cue.id===2?817:[300,400,470][cue.id-1],w=1420*scale,h=270*scale;
  ctx.shadowColor='#ff164d';ctx.shadowBlur=13*scale;ctx.drawImage(sprite,x,y,w,h);ctx.shadowBlur=0;ctx.drawImage(sprite,x,y,w,h);ctx.restore();return {...cue,age,dots:points.length,bounds:{x,y,width:w,height:h}};
 }
 return {draw,dots:points.length};
}
