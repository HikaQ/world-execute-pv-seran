import {createClosingCore} from './red-core.js';
import {E,closureAt,stateAt,ZERO_CENTER} from './score.js';
export function createTerminal(){
 const text='[Process exited with code 0]',font='500 43px Mono',zeroIndex=text.indexOf('0');
 const mask=document.createElement('canvas');mask.width=1100;mask.height=100;
 const m=mask.getContext('2d',{willReadFrequently:true});m.font=font;m.textBaseline='alphabetic';m.fillStyle='#fff';m.fillText(text,10,64);
 const width=m.measureText(text).width,cell=width/text.length,pixels=m.getImageData(0,0,1100,100).data,points=[];
 const x0=960-width/2-10,y0=480;
 for(let y=4;y<95;y+=2.3)for(let x=5;x<1095;x+=2.3)if(pixels[(Math.floor(y)*1100+Math.floor(x))*4+3]>155){
  points.push({x,y,zero:x>=10+zeroIndex*cell&&x<10+(zeroIndex+1)*cell});
 }
 const kernel=createClosingCore();
 const layer=document.createElement('canvas');layer.width=1920;layer.height=1080;const tg=layer.getContext('2d',{alpha:false,willReadFrequently:true});
 function drawKernel(g,options,additive=true){
  const result=kernel.frame(options);g.save();g.globalAlpha=1;g.globalCompositeOperation=additive?'lighter':'source-over';
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(result.canvas,0,0,1920,1080);g.restore();
  const {canvas,...meta}=result;return meta;
 }
 return {
  draw(g,frame){
   if(frame<E.terminal)return null;
   const s=closureAt(frame);g.save();g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,0,1920,1080);g.restore();
   const n=Math.min(text.length,Math.max(0,Math.floor((frame-E.terminalText)/(E.exitComplete-E.terminalText)*text.length)));
   const c=s.redMix,zeroColor=`rgb(${Math.round(209+30*c)},${Math.round(185-163*c)},${Math.round(196-155*c)})`;
   tg.reset();tg.fillStyle='#000';tg.fillRect(0,0,1920,1080);
   tg.save();tg.fillStyle='#d1b9c4';tg.shadowColor='#b12549';tg.shadowBlur=3;
   for(const p of points)if(p.x<=10+n*cell){
    const alpha=p.zero?s.zeroAlpha:s.restAlpha;if(alpha<=0)continue;
    tg.globalAlpha=alpha;tg.fillStyle=p.zero?zeroColor:'#d1b9c4';tg.beginPath();tg.arc(x0+p.x,y0+p.y,.82,0,Math.PI*2);tg.fill();
   }
   const cursor=stateAt(frame).cursorVisible;
   if(cursor){tg.globalAlpha=s.restAlpha;tg.fillStyle='#ed788f';tg.shadowBlur=8;for(let y=600;y<637;y+=3){tg.beginPath();tg.arc(x0+12,y,1.05,0,Math.PI*2);tg.fill();}}
   tg.restore();
   g.drawImage(layer,0,0);
   let core=null;
   if(s.coreVisible){
    const diameter=s.initialDiameter+(kernel.referenceDiameter-s.initialDiameter)*s.approach;
    core=drawKernel(g,{phase:s.corePhase,gain:s.coreGain,screenCenter:s.center,diameter});
   }
   const textVisible=s.restAlpha>0||s.zeroAlpha>0;
   return {...s,text:textVisible?(s.restAlpha>0?text.slice(0,n):'0'):'',cursor,core,
    zeroAnchor:ZERO_CENTER,zeroVisible:s.zeroAlpha>0&&n>zeroIndex,zeroPointCount:points.filter(p=>p.zero).length,
    textVisible,terminalCleared:!textVisible,oneCore:true,background:'black'};
  },
  drawReference(g){g.reset();return drawKernel(g,{reference:true},false);}
 };
}
