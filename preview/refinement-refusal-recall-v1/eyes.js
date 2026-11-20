import {mix,clamp} from './score.js';
export const EYE_SOURCE={path:'/assets/char/seran-avatar-user-20261110.png',crop:[330,615,600,210],centers:{left:[514,732],right:[785,713]},outputRect:[215,276,1490,521.5],sourceOrientation:'unmirrored'};
const tint={red:[217,71,103],violet:[160,126,210],silver:[160,164,183]};
export async function createEyes(g){
 const image=new Image();image.src=EYE_SOURCE.path;await image.decode();
 const sample=document.createElement('canvas');sample.width=600;sample.height=210;
 const sg=sample.getContext('2d',{willReadFrequently:true});sg.drawImage(image,330,615,600,210,0,0,600,210);
 const rgba=sg.getImageData(0,0,600,210).data,points=[];
 const feather=(v)=>{const a=clamp(v);return a*a*(3-2*a);};
 for(let iy=0;iy<210;iy+=1.8)for(let ix=0;ix<600;ix+=1.8){
  const x=Math.min(599,Math.round(ix)),y=Math.min(209,Math.round(iy)),k=(y*600+x)*4;
  const rgb=[rgba[k],rgba[k+1],rgba[k+2]],luma=(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255;
  const alpha=rgba[k+3]/255,edge=feather(ix/38)*feather((600-ix)/38)*feather(iy/19)*feather((210-iy)/19);
  if(alpha*edge<.015)continue;
  const sx=330+ix,sy=615+iy,chroma=clamp((Math.max(...rgb)-Math.min(...rgb))/85);
  const left=Math.exp(-(((sx-514)/54)**4+((sy-732)/38)**4))*chroma;
  const right=Math.exp(-(((sx-785)/56)**4+((sy-713)/38)**4))*chroma;
  points.push({x:215+(ix+(Math.round(iy/1.8)%2?.22:-.22))*1490/600,y:276+iy*1490/600,luma,alpha:alpha*edge,left,right});
 }
 function layer(correct){
  const c=document.createElement('canvas');c.width=1920;c.height=1080;const p=c.getContext('2d',{alpha:false});
  p.fillStyle='#090c11';p.fillRect(0,0,1920,1080);
  for(const q of points){
   const col=tint.silver.map(v=>v*(.035+.965*q.luma**2.05));
   for(const [weight,name] of [[q.left,correct?'violet':'red'],[q.right,correct?'red':'violet']]){
    const power=.10+1.35*q.luma;
    col.forEach((v,j)=>col[j]=mix(v,tint[name][j]*power,weight*.95));
   }
   p.fillStyle=`rgba(${col.map(v=>Math.round(clamp(v,0,255))).join(',')},${q.alpha})`;
   p.beginPath();p.arc(q.x,q.y,1.42,0,Math.PI*2);p.fill();
  }
  return c;
 }
 const wrong=layer(false),correct=layer(true);
 return {points:points.length,render(s){g.drawImage(wrong,0,0);if(s.correction){g.globalAlpha=s.correction;g.drawImage(correct,0,0);g.globalAlpha=1;}}};
}
