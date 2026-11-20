import {ramp} from './score.js';

export const MOBIUS_CAPTION={name:'MÖBIUS STRIP',formula:'M(u + 2π, −v) = M(u, v)',x:88,y:82};
let plate;
export function drawMobiusCaption(g,t){
 const alpha=ramp(t,90.94,91.12)*(1-ramp(t,93.04,93.24));
 if(alpha>.001){
  if(!plate){
   plate=document.createElement('canvas');plate.width=1000;plate.height=176;const p=plate.getContext('2d');p.textBaseline='top';
   p.font='500 38px "JetBrains Mono"';p.fillStyle='#ad99c4';p.fillText(MOBIUS_CAPTION.name,0,8);
   p.font='500 50px "JetBrains Mono"';p.fillStyle='#d8c8eb';p.fillText(MOBIUS_CAPTION.formula,0,76);
  }
  g.save();g.globalAlpha=alpha;g.drawImage(plate,MOBIUS_CAPTION.x,MOBIUS_CAPTION.y,500,88);g.restore();
 }
 return {...MOBIUS_CAPTION,alpha,visible:alpha>.001};
}
