import {E,smooth,stateAt} from './score.js';
export function createTerminal(){
 const text='[Process exited with code 0]',font='500 43px Mono';
 const mask=document.createElement('canvas');mask.width=1100;mask.height=100;const m=mask.getContext('2d',{willReadFrequently:true});m.font=font;m.textBaseline='alphabetic';m.fillStyle='#fff';m.fillText(text,10,64);
 const width=m.measureText(text).width,cell=width/text.length,pixels=m.getImageData(0,0,1100,100).data,points=[];
 for(let y=4;y<95;y+=2.3)for(let x=5;x<1095;x+=2.3)if(pixels[(Math.floor(y)*1100+Math.floor(x))*4+3]>155)points.push([x,y]);
 return {draw(g,f){if(f<E.terminal)return null;g.fillStyle='#000';g.fillRect(0,0,1920,1080);
  const n=Math.min(text.length,Math.max(0,Math.floor((f-E.terminalText)/(E.exitComplete-E.terminalText)*text.length))),x0=960-width/2-10,y0=480;
  g.save();g.fillStyle='#d1b9c4';g.shadowColor='#b12549';g.shadowBlur=3;
  for(const [x,y]of points)if(x<=10+n*cell){g.beginPath();g.arc(x0+x,y0+y,.82,0,Math.PI*2);g.fill();}
  if(stateAt(Math.round(f)).cursorVisible){g.fillStyle='#ed788f';g.shadowBlur=8;for(let y=600;y<637;y+=3){g.beginPath();g.arc(x0+12,y,1.05,0,Math.PI*2);g.fill();}}
  g.restore();return {text:text.slice(0,n),complete:n===text.length,cursor:stateAt(Math.round(f)).cursorVisible,dotCount:points.length};
 }};
}
