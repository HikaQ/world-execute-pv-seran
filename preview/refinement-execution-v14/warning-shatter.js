const clamp=x=>Math.max(0,Math.min(1,x));
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}

function clip(poly,a,b,c){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=a*p[0]+b*p[1]-c,dq=a*q[0]+b*q[1]-c;
  if(dp<=1e-8)out.push(p);
  if((dp<=0)!==(dq<=0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
 }
 return out;
}
function centroid(poly){
 let sum=0,x=0,y=0;
 for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],a=p[0]*q[1]-q[0]*p[1];sum+=a;x+=(p[0]+q[0])*a;y+=(p[1]+q[1])*a;}
 return {x:x/(3*sum),y:y/(3*sum),area:Math.abs(sum/2)};
}
function path(ctx,poly){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}

export function createWarningShatter(snapshot,pixels,warning){
 const timing=warning.fracture,start=warning.windowFrame;
 const crackAge=timing.crackFrame-start,dropAge=timing.dropFrame-start,tailAge=timing.tailFrame-start,blackAge=timing.blackoutFrame-start;
 const offset={x:400,y:310},rnd=random(710021),seeds=[];
 for(let y=0;y<4;y++)for(let x=0;x<5;x++)seeds.push([40+(x+.5)*208+(rnd()-.5)*137,40+(y+.5)*95+(rnd()-.5)*60]);
 const shards=seeds.map((seed,i)=>{
  let poly=[[40,40],[1080,40],[1080,420],[40,420]];
  for(let j=0;j<seeds.length;j++)if(j!==i){const q=seeds[j];poly=clip(poly,q[0]-seed[0],q[1]-seed[1],(q[0]*q[0]+q[1]*q[1]-seed[0]*seed[0]-seed[1]*seed[1])/2);}
  const center=centroid(poly),left=Math.floor(Math.min(...poly.map(p=>p[0])))-3,top=Math.floor(Math.min(...poly.map(p=>p[1])))-3;
  const width=Math.ceil(Math.max(...poly.map(p=>p[0])))-left+3,height=Math.ceil(Math.max(...poly.map(p=>p[1])))-top+3;
  const image=document.createElement('canvas'),edge=document.createElement('canvas');image.width=edge.width=width;image.height=edge.height=height;
  const g=image.getContext('2d',{willReadFrequently:true}),e=edge.getContext('2d',{willReadFrequently:true});
  g.translate(-left,-top);path(g,poly);g.clip();g.drawImage(snapshot,0,0);
  e.translate(-left,-top);e.beginPath();e.rect(60,60,1000,340);e.clip();
  e.strokeStyle='#ff516e';e.lineWidth=1.15;e.shadowColor='rgba(255,31,73,.45)';e.shadowBlur=3;path(e,poly);e.stroke();
  const r=rnd(),side=(center.x-560)/520;
  return {id:i,poly,center,left,top,image,edge,
   vx:side*55+(rnd()-.5)*100,vy:125+rnd()*115,gravity:5350+rnd()*750,
   delay:(1-Math.min(1,center.area/26000))*.035+rnd()*.008,spin:(rnd()-.5)*2.5,
   crackX:side*(3+rnd()*2),crackY:.8+rnd()*1.6,crackRotation:(rnd()-.5)*.014,shade:.91+r*.09};
 });
 const totalArea=shards.reduce((a,s)=>a+s.center.area,0);
 if(shards.length!==20||Math.abs(totalArea-1040*380)>.001)throw Error('Warning shard geometry does not cover the window');
 const debris=Array.from({length:timing.loosePixels},(_,i)=>{
  const point=pixels[Math.floor((i+.2+rnd()*.6)*pixels.length/timing.loosePixels)%pixels.length];
  return {x:point.x+offset.x,y:point.y+offset.y,release:dropAge+4+Math.floor(rnd()*8),vx:(rnd()-.5)*130,vy:110+rnd()*150,gravity:4800+rnd()*850,radius:1.6+rnd()*1.6,brightness:.65+rnd()*.35};
 });
 function pose(shard,age){
  const cracking=clamp((age-crackAge)/Math.max(1,dropAge-crackAge));
  const t=Math.max(0,(age-dropAge)/60-shard.delay);
  const dx=shard.crackX*cracking+shard.vx*t,dy=shard.crackY*cracking+shard.vy*t+.5*shard.gravity*t*t;
  const rotation=shard.crackRotation*cracking+shard.spin*t,scaleX=1-Math.min(.1,Math.abs(shard.spin*t)*.12);
  const x=offset.x+shard.center.x+dx,y=offset.y+shard.center.y+dy,cs=Math.cos(rotation),sn=Math.sin(rotation);
  const vertices=shard.poly.map(p=>{const px=(p[0]-shard.center.x)*scaleX,py=p[1]-shard.center.y;return [x+px*cs-py*sn,y+px*sn+py*cs];});
  const bottom=Math.max(...vertices.map(p=>p[1])),top=Math.min(...vertices.map(p=>p[1]));
  return {id:shard.id,x,y,dx,dy,rotation,scaleX,top,bottom,visible:age>=crackAge&&age<blackAge&&bottom>=0&&top<1080};
 }
 function dustPose(p,age){
  const t=(age-p.release)/60;if(t<0)return null;
  const x=p.x+p.vx*t,y=p.y+p.vy*t+.5*p.gravity*t*t,alpha=p.brightness*(1-clamp((age-tailAge)/(blackAge-tailAge)));
  return {x,y,alpha,speed:p.vy+p.gravity*t,visible:y-p.radius<1080&&alpha>.005};
 }
 function stateAt(age){
  const phase=age<crackAge?'intact':age<dropAge?'crack':age<tailAge?'fall':age<blackAge?'tail':'black';
  const poses=shards.map(s=>pose(s,age));
  return {phase,mainFragments:shards.length,visibleFragments:poses.filter(p=>p.visible).length,loosePixels:debris.length,
   visibleLoosePixels:debris.map(p=>dustPose(p,age)).filter(p=>p?.visible).length,
   meanFragmentDrop:poses.reduce((a,p)=>a+p.dy,0)/poses.length,fragmentPoses:poses,coverageRatio:totalArea/(1040*380)};
 }
 function draw(ctx,age){
  if(age<crackAge||age>=blackAge)return;
  const cracking=clamp((age-crackAge)/Math.max(1,dropAge-crackAge));
  for(const shard of shards){
   const p=pose(shard,age);if(!p.visible)continue;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.scale(p.scaleX,1);
   ctx.globalAlpha=shard.shade;ctx.drawImage(shard.image,shard.left-shard.center.x,shard.top-shard.center.y);
   ctx.globalAlpha=(.08+.54*cracking)*(.9+.1*shard.shade);ctx.drawImage(shard.edge,shard.left-shard.center.x,shard.top-shard.center.y);ctx.restore();
  }
  ctx.save();ctx.fillStyle='#ff6482';
  for(const dot of debris){
   const p=dustPose(dot,age);if(!p?.visible)continue;
   const trail=Math.min(24,p.speed/60*.72);
   ctx.globalAlpha=p.alpha*.18;ctx.fillRect(p.x-.7,p.y-trail,1.4,trail);
   ctx.globalAlpha=p.alpha;ctx.beginPath();ctx.arc(p.x,p.y,dot.radius,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 return {stateAt,draw,prepared:shards.flatMap(s=>[s.image,s.edge]),geometry:{pieces:shards.length,coverageRatio:totalArea/(1040*380)},crackAge,dropAge,tailAge,blackAge};
}
