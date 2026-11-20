import {createWarningShatter} from './warning-shatter.js';

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-(1-clamp(x))**3;
const WORD='EXECUTION';

export function createExecutionTypography(plan){
 const shotById=new Map(plan.shots.map(s=>[s.id,s]));
 const beatFrames=plan.shots.filter(s=>s.anchor==='drums'&&!s.source).map(s=>s.impactFrame);
 const at=id=>shotById.get(id).impactFrame;
 const definitions=[
  {shot:'S01',kind:'solo',frames:28,steps:[['S01',1]]},
  {shot:'S05',kind:'solo',frames:31,steps:[['S05',1]]},
  {shot:'S15',kind:'duo',frames:39,steps:[['S15',2]]},
  {shot:'S18',kind:'trio',frames:41,steps:[['S18',3]]},
  {shot:'S26',kind:'wall',endFrame:9678,steps:[['S26',3],['S28',4]]},
  {shot:'S31',kind:'wall',endFrame:shotById.get('S42').cutFrame,steps:[['S31',4],['S33',5],['S36',6],['S38',7]]},
  {shot:'S47',kind:'warning',endFrame:plan.finalWarning.fracture.blackoutFrame,steps:[['S47',1]]},
 ];
 const cues=definitions.map((d,i)=>{
  const shot=shotById.get(d.shot),frame=shot.impactFrame;
  const steps=d.steps.map(([id,rowCount])=>({frame:at(id),rowCount,shot:id,soundAnchor:shotById.get(id).anchor,referenceId:shotById.get(id).referenceId}));
  return {id:`execution-group-${String(i+1).padStart(2,'0')}`,shot:d.shot,group:shot.group,frame,
   endFrame:d.endFrame??frame+d.frames,kind:d.kind,maxRows:steps.at(-1).rowCount,
   soundAnchor:shot.anchor,referenceId:shot.referenceId,word:WORD,steps};
 });
 const layouts=[
  {x:80,y:615,w:1760,h:220,type:'hero'},
  {x:-158,y:416,w:1920,h:168,type:'outline'},
  {x:150,y:795,w:1935,h:162,type:'fill'},
  {x:120,y:248,w:1890,h:156,type:'fill'},
  {x:-120,y:963,w:1980,h:158,type:'outline'},
  {x:-233,y:83,w:2025,h:162,type:'outline'},
  {x:210,y:1124,w:1980,h:156,type:'fill'},
 ];
 const sprites=new Map();
 let matrix;
 function warningMatrix(){
  if(matrix)return matrix;
  const mask=document.createElement('canvas');mask.width=1120;mask.height=460;
  const m=mask.getContext('2d',{willReadFrequently:true});
  m.font='400 142px Execution';m.textAlign='center';m.textBaseline='alphabetic';
  const metrics=m.measureText(WORD),height=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent;
  m.translate(560,258);m.scale(760/metrics.width,1);m.fillStyle='#ffffff';
  m.fillText(WORD,0,(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
  // The font is only a sampling mask. No filled glyph is drawn into the film.
  const data=m.getImageData(0,0,1120,460).data,pitch=8,columns=95,rows=Math.ceil(height/pitch);
  const left=560-(columns-1)*pitch/2,top=258-(rows-1)*pitch/2,points=[];
  const layers={};
  for(const key of ['idle','glow','lit']){const c=document.createElement('canvas');c.width=1120;c.height=460;layers[key]=c;}
  const idle=layers.idle.getContext('2d',{willReadFrequently:true}),glow=layers.glow.getContext('2d',{willReadFrequently:true}),lit=layers.lit.getContext('2d',{willReadFrequently:true});
  idle.fillStyle='#290710';idle.beginPath();
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const x=left+col*pitch,y=top+row*pitch,index=(Math.round(y)*1120+Math.round(x))*4;
   idle.moveTo(x+1.25,y);idle.arc(x,y,1.25,0,Math.PI*2);
   if(data[index+3]>=128)points.push({x,y,row,col});
  }
  idle.fill();
  glow.fillStyle='#ff234e';glow.shadowColor='rgba(255,25,64,.72)';glow.shadowBlur=4;glow.beginPath();
  for(const p of points){glow.moveTo(p.x+2.55,p.y);glow.arc(p.x,p.y,2.55,0,Math.PI*2);}glow.fill();
  // Discrete phosphor dots keep black gaps between all adjacent pixels.
  for(let band=0;band<3;band++){
   lit.fillStyle=['#ffb6c6','#ffced9','#ffe1e8'][band];lit.beginPath();
   for(const p of points)if((p.col+2*p.row)%3===band){lit.moveTo(p.x+2.55,p.y);lit.arc(p.x,p.y,2.55,0,Math.PI*2);}
   lit.fill();
  }
  matrix={...layers,columns,rows,pitch,dotDiameter:5.1,litDots:points.length,left,top,height:rows*pitch,points};
  return matrix;
 }
 function warningSprite(){
  if(sprites.has('warning'))return sprites.get('warning');
  const c=document.createElement('canvas');c.width=1120;c.height=460;
  const g=c.getContext('2d',{willReadFrequently:true});
  // A single film prop, centered at (560, 230) in this padded canvas.
  g.fillStyle='#060104';g.fillRect(60,60,1000,340);
  g.fillStyle='#29040d';g.fillRect(60,60,1000,56);
  g.save();g.strokeStyle='#ff2d54';g.lineWidth=2.5;
  g.shadowColor='rgba(255,28,68,.48)';g.shadowBlur=15;
  g.strokeRect(60,60,1000,340);g.restore();
  g.strokeStyle='#8f1632';g.lineWidth=1.5;
  g.beginPath();g.moveTo(60,116);g.lineTo(1060,116);g.stroke();
  g.strokeStyle='#ff718a';g.lineWidth=2.2;g.lineJoin='miter';
  g.beginPath();g.moveTo(94,99);g.lineTo(107,77);g.lineTo(120,99);g.closePath();g.stroke();
  g.fillStyle='#ff90a2';g.fillRect(106,84,2,7);g.fillRect(106,94,2,2);
  g.font='600 22px Mono';g.textAlign='left';g.textBaseline='alphabetic';
  g.fillText('WARNING',139,97);
  g.strokeStyle='#f75e7b';g.lineWidth=1.8;
  g.beginPath();g.moveTo(1024,81);g.lineTo(1039,96);g.moveTo(1039,81);g.lineTo(1024,96);g.stroke();
  sprites.set('warning',c);return c;
 }
 function wordSprite(row,kind){
  const key=`pixels:${kind}:${row.w}:${row.h}`;
  if(sprites.has(key))return sprites.get(key);
  const mask=document.createElement('canvas'),pad=16,pitch=10;
  const m=mask.getContext('2d',{willReadFrequently:true});
  m.font=`400 ${row.h}px Execution`;
  const metrics=m.measureText(WORD),ascent=Math.ceil(metrics.actualBoundingBoxAscent),descent=Math.ceil(metrics.actualBoundingBoxDescent);
  mask.width=Math.ceil(row.w)+pad*2;mask.height=ascent+descent+pad*2;
  m.font=`400 ${row.h}px Execution`;m.textAlign='left';m.textBaseline='alphabetic';
  m.translate(pad,pad+ascent);m.scale(row.w/metrics.width,1);m.fillStyle='#ffffff';m.fillText(WORD,0,0);
  const data=m.getImageData(0,0,mask.width,mask.height).data;
  const columns=Math.round(row.w/pitch),rows=Math.max(1,Math.ceil((ascent+descent)/pitch));
  const left=pad+(row.w-(columns-1)*pitch)/2,top=pad+(ascent+descent-(rows-1)*pitch)/2;
  const cells=new Uint8Array(columns*rows),points=[];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
   const px=Math.round(left+x*pitch),py=Math.round(top+y*pitch);
   cells[y*columns+x]=data[(py*mask.width+px)*4+3]>=128?1:0;
  }
  const occupied=(x,y)=>x>=0&&x<columns&&y>=0&&y<rows&&cells[y*columns+x];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(occupied(x,y)){
   const edge=!occupied(x-1,y)||!occupied(x+1,y)||!occupied(x,y-1)||!occupied(x,y+1);
   if(kind!=='outline'||edge)points.push({x:left+x*pitch,y:top+y*pitch,band:(x+2*y)%3});
  }
  const c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;
  const g=c.getContext('2d',{willReadFrequently:true}),radius=kind==='outline'?2.4:3.2;
  // All front typography is rendered as discrete phosphor dots, including
  // the outline echoes. Sampling at output size keeps every dot circular.
  g.fillStyle='rgba(255,24,64,.2)';g.shadowColor='rgba(255,30,69,.35)';g.shadowBlur=3;g.beginPath();
  for(const p of points){g.moveTo(p.x+radius,p.y);g.arc(p.x,p.y,radius,0,Math.PI*2);}g.fill();g.shadowBlur=0;
  const palette=kind==='hero'?['#ffbdcd','#ffd0dc','#ffe2e9']:kind==='fill'?['#ff2d52','#ff4b69','#ff6680']:['#fd4968','#ff6d8a','#ff88a1'];
  for(let band=0;band<3;band++){
   g.fillStyle=palette[band];g.beginPath();
   for(const p of points)if(p.band===band){g.moveTo(p.x+radius,p.y);g.arc(p.x,p.y,radius,0,Math.PI*2);}g.fill();
  }
  const result={canvas:c,pad,baseline:pad+ascent,columns,rows,pitch,dotDiameter:radius*2,litDots:points.length};
  sprites.set(key,result);return result;
 }
 function stateAt(frame){
  const cue=cues.find(c=>frame>=c.frame&&frame<c.endFrame);
  if(!cue)return null;
  const shot=plan.shots.findLast(s=>frame>=s.cutFrame);
  if(!shot||shot.source||shot.group==='COUNT')return null;
  const rowCount=cue.steps.findLast(s=>frame>=s.frame).rowCount,age=frame-cue.frame;
  const dense=cue.kind==='wall';
  const density=dense?clamp((frame-at('S26'))/162):0;
  const lastBeat=cue.kind==='warning'?cue.frame:beatFrames.findLast(f=>f<=frame);
  const result={id:cue.id,shot:cue.shot,group:cue.group,kind:cue.kind,word:WORD,frame:cue.frame,endFrame:cue.endFrame,
   rowCount,age,opacity:cue.kind==='warning'?1:clamp((cue.endFrame-frame)/5),density,
   pulse:Math.exp(-(frame-lastBeat)*17/60),visible:true,textStyle:'phosphor-dot-matrix',solidGlyphVisible:false,pixelPitch:10,dotDiameter:6.4,outlineDotDiameter:4.8};
  if(cue.kind==='warning'){
   const m=warningMatrix();Object.assign(result,{textStyle:'phosphor-dot-matrix',pixelPitch:m.pitch,dotDiameter:m.dotDiameter,litDots:m.litDots,matrixColumns:m.columns,matrixRows:m.rows,scanProgress:clamp(age/14),solidGlyphVisible:false});
   result.shatter=shatter.stateAt(age);
  }
  return result;
 }
 function drawWord(ctx,row,kind,alpha,dx=0,dy=0){
  const image=wordSprite(row,kind);
  ctx.globalAlpha=alpha;
  ctx.drawImage(image.canvas,row.x+dx-image.pad,row.y+dy-image.baseline);
 }
 function draw(ctx,frame){
  const s=stateAt(frame);if(!s)return null;
  if(s.kind==='warning'){
   ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#000000';ctx.fillRect(0,0,1920,1080);
   if(s.age>=shatter.crackAge){shatter.draw(ctx,s.age);ctx.restore();return s;}
   // Pop once, refresh the pixel rows, then hold the readable display.
   const scale=s.age===0?.97:s.age===1?1.018:s.age===2?1.009:1;
   ctx.translate(960,540);ctx.scale(scale,scale);ctx.drawImage(warningSprite(),-560,-230);
   const m=warningMatrix();ctx.drawImage(m.idle,-560,-230);
   ctx.globalAlpha=.28;ctx.drawImage(m.glow,-560,-230);
   ctx.globalAlpha=.74+.22*ease(s.age/14);ctx.drawImage(m.lit,-560,-230);
   if(s.age<14){
    const y=m.top-12+(s.age/13)*(m.height+24);
    ctx.save();ctx.beginPath();ctx.rect(m.left-6-560,y-8-230,764,20);ctx.clip();
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.72;ctx.drawImage(m.lit,-560,-230);ctx.restore();
   }
   ctx.restore();return s;
  }
  const cue=cues.find(c=>c.id===s.id),dense=s.kind==='wall',t=(frame-plan.firstFrame)/60;
  ctx.save();
  if(dense){ctx.fillStyle=`rgba(4,0,5,${s.opacity*.13})`;ctx.fillRect(0,0,1920,1080);}
  const scale=1+s.density*.065;
  ctx.translate(960,540);ctx.scale(scale,scale);ctx.translate(-960,-540);
  for(let i=s.rowCount-1;i>=0;i--){
   let row={...layouts[i]};
   if(s.kind==='solo')row={...row,x:255,y:611,w:1410,h:173};
   if(s.kind==='duo')row=i===0?{...row,x:168,y:557,w:1590,h:192}:{...row,x:84,y:726,w:1725,h:159};
   const born=cue.steps.find(step=>step.rowCount>i).frame,age=frame-born;
   const entry=.22+.78*ease(age/(dense?8:4)),direction=i%2===0?1:-1;
   const drift=Math.sin(t*.4+i)*7.5+direction*age/60*1.65;
   row.x+=direction*(1-entry)*(dense?112:36)+drift;
   row.y-=(1-entry)*12;
   const baseAlpha=row.type==='hero'?.96:row.type==='fill'?.72:.78;
   const alpha=(baseAlpha+s.pulse*(row.type==='hero'?.06:.13))*entry*s.opacity;
   if(s.density>0){
    drawWord(ctx,row,'outline',(.14+s.density*.13)*entry*s.opacity,-21,-7.5);
    drawWord(ctx,row,'outline',(.1+s.density*.12)*entry*s.opacity,31.5,9);
   }
   drawWord(ctx,row,row.type,alpha,direction*s.pulse*6);
  }
  ctx.restore();return s;
 }
 // Warm every backing canvas before the first film frame. This keeps arbitrary
 // seek order and worker startup from changing canvas rasterisation.
 const warningPixels=warningMatrix();
 const warningSnapshot=document.createElement('canvas');warningSnapshot.width=1120;warningSnapshot.height=460;
 const warningContext=warningSnapshot.getContext('2d',{willReadFrequently:true});
 warningContext.drawImage(warningSprite(),0,0);warningContext.drawImage(warningPixels.idle,0,0);
 warningContext.globalAlpha=.28;warningContext.drawImage(warningPixels.glow,0,0);
 warningContext.globalAlpha=.96;warningContext.drawImage(warningPixels.lit,0,0);
 const shatter=createWarningShatter(warningSnapshot,warningPixels.points,plan.finalWarning);
 const variants=[...layouts,{...layouts[0],w:1410,h:173},{...layouts[0],w:1590,h:192},{...layouts[1],w:1725,h:159}];
 const frontSprites=new Set();
 for(const row of variants)for(const kind of new Set([row.type,'outline']))frontSprites.add(wordSprite(row,kind).canvas);
 const prepared=[...frontSprites,warningSprite(),warningPixels.idle,warningPixels.glow,warningPixels.lit,warningSnapshot,...shatter.prepared];
 function prime(ctx){for(const im of prepared)ctx.drawImage(im,0,0);ctx.reset();}
 return {cues,stateAt,draw,prime};
}
