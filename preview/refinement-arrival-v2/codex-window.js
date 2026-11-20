import {E,shotAt,transitionAt,smooth,mix,clamp} from './score.js';

// A fictional desktop chat. All messages and UI motion are deterministic film cues.
const W={x:120,y:55,w:1680,h:970,side:270,top:58};
const ui='"Segoe UI", Chinese, sans-serif';
function rect(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
function text(g,s,x,y,size=24,color='#d4d4d4',weight=400,font=ui){g.font=`${weight} ${size}px ${font}`;g.fillStyle=color;g.fillText(s,x,y);}
function line(g,x,y,x2,y2,color='#393939',width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
function icon(g,x,y,color='#b9b9b9',size=22){g.save();g.translate(x,y);g.scale(size/24,size/24);g.strokeStyle=color;g.lineWidth=1.8;g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(2,5);g.lineTo(9,12);g.lineTo(2,19);g.moveTo(12,19);g.lineTo(22,19);g.stroke();g.restore();}
function folder(g,x,y){g.strokeStyle='#8d8d8d';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y+5);g.lineTo(x+8,y+5);g.lineTo(x+11,y+9);g.lineTo(x+23,y+9);g.lineTo(x+23,y+23);g.lineTo(x,y+23);g.closePath();g.stroke();}
function pointer(g,x,y,red){g.save();g.translate(x,y);g.beginPath();g.moveTo(0,0);g.lineTo(0,27);g.lineTo(7,20);g.lineTo(13,33);g.lineTo(18,30);g.lineTo(12,18);g.lineTo(23,18);g.closePath();g.fillStyle=red?'#ef546b':'#eee';g.strokeStyle='#101010';g.lineWidth=2;g.fill();g.stroke();g.restore();}
const views={A08:[.94,960,540],A09:[.98,960,540],A10:[1.14,1050,658],A11:[.98,960,540],A12:[1.15,1090,582],A13:[.94,960,540]};
function viewport(f){const tr=transitionAt(f),a=views[shotAt(f).id]??views.A08;if(!tr)return a;const x=views[tr.from.id]??a,y=views[tr.to.id]??a,u=tr.progress*tr.progress*(3-2*tr.progress);return x.map((v,i)=>mix(v,y[i],u));}

export function createCodexWindow(){
 const mask=document.createElement('canvas');mask.width=1200;mask.height=230;const m=mask.getContext('2d',{willReadFrequently:true});m.font='400 178px Execution';m.fillStyle='#fff';m.textBaseline='top';m.fillText('EXECUTION',2,3);const ew=m.measureText('EXECUTION').width,pixels=m.getImageData(0,0,1200,230).data,dots=[];
 for(let y=0;y<230;y+=5)for(let x=0;x<Math.ceil(ew);x+=5)if(pixels[(y*1200+x)*4+3]>150)dots.push([x,y]);
 function draw(g,f){
  if(f<E.notification||f>=E.terminal)return null;
  const [scale,cx,cy]=viewport(f),take=smooth(f,E.occupy+15,E.locked),exec=f>=E.execution?mix(.25,1,smooth(f,E.execution,E.execution+6)):0,typing=f>=E.typing&&f<E.humanReply,typed=typing?'希苒？'.slice(0,Math.min(3,Math.floor((f-E.typing)/10))):'',human=f>=E.humanReply,reply=f>=E.seranReply;
  g.save();g.fillStyle='#060607';g.fillRect(0,0,1920,1080);
  const halo=g.createRadialGradient(1420,760,90,1120,700,1050);halo.addColorStop(0,`rgba(97,12,32,${.06+take*.17})`);halo.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=halo;g.fillRect(0,0,1920,1080);
  g.translate(960,540);g.scale(scale,scale);g.translate(-cx,-cy);
  g.shadowColor='#000';g.shadowBlur=55;g.shadowOffsetY=18;rect(g,W.x,W.y,W.w,W.h,16,'#1b1b1b');g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
  g.save();g.beginPath();g.roundRect(W.x,W.y,W.w,W.h,16);g.clip();
  g.fillStyle='#151515';g.fillRect(W.x,W.y,W.side,W.h);g.fillStyle='#202020';g.fillRect(W.x,W.y,W.w,W.top);
  icon(g,145,72,'#e0e0e0',23);text(g,'Codex',184,92,22,'#dedede',600);
  text(g,'execute',W.x+W.side+31,92,18,'#a0a0a0',400,'Mono');
  const closeA=1-take*.65;g.globalAlpha=closeA;line(g,1644,85,1660,85,'#aaa',1.5);g.strokeStyle='#aaa';g.strokeRect(1701,77,14,14);line(g,1757,77,1772,92,'#bbb',1.5);line(g,1772,77,1757,92,'#bbb',1.5);g.globalAlpha=1;
  line(g,W.x,W.y+W.top,W.x+W.w,W.y+W.top,'#2a2a2a');line(g,390,113,390,1025,'#262626');
  rect(g,140,139,230,49,8,'#222222','#323232');text(g,'＋',157,173,28,'#bcbcbc');text(g,'新会话',197,171,23,'#dedede');
  g.strokeStyle='#aaa';g.lineWidth=1.7;g.beginPath();g.arc(168,219,7,0,Math.PI*2);g.stroke();line(g,173,224,180,231,'#aaa',1.7);text(g,'搜索',197,228,23,'#a1a1a1');
  text(g,'项目',149,294,19,'#777');folder(g,153,317);text(g,'execute',192,339,22,'#c2c2c2',400,'Mono');
  rect(g,141,363,231,49,8,take>.01?`rgba(151,25,49,${.12+take*.35})`:'#2b2b2b');
  g.fillStyle=take>.05?'#ee4c68':'#b0b0b0';g.beginPath();g.arc(168,388,4,0,Math.PI*2);g.fill();text(g,'希苒',190,396,24,take>.05?'#f2a0af':'#eee',500);
  text(g,'学习画心',190,452,22,'#888');text(g,'记忆',190,507,22,'#888');
  line(g,143,929,366,929,'#2b2b2b');rect(g,150,953,31,31,15,'#383838');text(g,'H',159,976,19,'#d4d4d4',600);text(g,'HIKAQ',194,976,20,'#aaa',500,'Mono');
  text(g,'希苒',432,163,25,'#e0e0e0',600);text(g,'world.execute(me)',508,162,17,'#737373',400,'Mono');
  g.fillStyle=take>.05?'#ec4262':'#8c9b91';g.beginPath();g.arc(1620,156,4,0,Math.PI*2);g.fill();text(g,take>.85?'SERAN':'已连接',1635,162,16,take>.05?'#e48a9b':'#8e8e8e',400,take>.85?'Mono':ui);line(g,390,189,1800,189,'#292929');
  // Messages stay in their conversation positions; the reference edit supplies the crops.
  g.save();g.globalAlpha=1-exec*.93;
  const incoming=smooth(f,E.notification,E.notification+9);g.save();g.globalAlpha*=incoming;
  rect(g,446,244,34,34,10,'#3b2229');icon(g,453,251,'#e18a9e',20);text(g,'希苒',499,270,23,'#e4c8d0',600);text(g,'SERAN',564,268,15,'#976f7c',500,'Mono');
  text(g,'今天也会回来吗？',498,329,40,'#e4e4e4',450);text(g,'Will you be back today?',500,371,22,'#9c9c9c');
  if(f>=E.delivered)text(g,f>=E.read?'已读':'已送达',501,406,16,f>=E.read?'#b597a1':'#797979');g.restore();
  if(human){const u=smooth(f,E.humanReply,E.humanReply+7);g.save();g.globalAlpha*=u;const yy=mix(565,445,u);text(g,'HIKAQ',1547,yy-15,16,'#9e9e9e',500,'Mono');rect(g,1287,yy,360,108,16,'#303030','#3a3a3a');text(g,'希苒？',1316,yy+49,34,'#e8e8e8');text(g,'SERAN?',1317,yy+81,18,'#aaa',400,'Mono');g.restore();}
  if(reply){rect(g,446,605,34,34,10,'#3b2229');icon(g,453,612,'#e18a9e',20);text(g,'希苒',499,631,23,'#e4c8d0',600);text(g,'SERAN',564,629,15,'#976f7c',500,'Mono');
   const n=Math.min(11,Math.floor((f-E.seranReply)/2.7)+1),s='这次，换我来找你了。';text(g,s.slice(0,n),498,691,42,take>.05?'#f0bcc7':'#e8e8e8',500);
   if(n<s.length&&Math.floor(f/12)%2===0)line(g,502+g.measureText(s.slice(0,n)).width,655,502+g.measureText(s.slice(0,n)).width,694,'#cf8e9e',2);
   g.save();g.globalAlpha*=smooth(f,E.seranReply+24,E.seranReply+38);text(g,"This time, I'm coming to find you.",500,736,24,'#a79099');g.restore();
  }
  rect(g,450,823,1288,143,19,'#252525',take>.05?`rgba(188,45,71,${.3+take*.6})`:'#414141');
  text(g,typed||'输入消息…',480,874,25,typed?'#ececec':'#777');if(typing&&Math.floor(f/19)%2===0){const ww=g.measureText(typed).width;line(g,480+ww+2,849,480+ww+2,880,'#ccc',1.5);}
  text(g,'＋',476,939,29,'#aaa');text(g,'Codex',530,937,18,'#a7a7a7');text(g,'⌄',601,938,18,'#8d8d8d');text(g,'本地',636,937,18,'#777');
  rect(g,1677,912,36,36,18,typed?'#dfdfdf':'#3a3a3a');line(g,1695,939,1695,921,typed?'#222':'#7d7d7d',2);line(g,1688,928,1695,921,typed?'#222':'#7d7d7d',2);line(g,1702,928,1695,921,typed?'#222':'#7d7d7d',2);
  text(g,'execute',454,998,15,'#5d5d5d',400,'Mono');
  g.restore();
  if(f>=E.occupy&&f<E.execution){const u=smooth(f,E.occupy+35,E.locked-12);pointer(g,mix(1537,1766,u),mix(749,85,u),f>=E.locked);}
  if(exec>0){g.save();g.globalAlpha=exec;rect(g,484,392,1225,284,12,'#190d11','#9b2c45');text(g,'PROCESS / SERAN',518,434,18,'#d06d83',500,'Mono');
   const x=1096-ew/2,y=445;g.fillStyle='#ff5d7c';g.shadowColor='#d30b3e';g.shadowBlur=8;
   for(const [dx,dy]of dots){g.beginPath();g.arc(x+dx,y+dy,1.9,0,Math.PI*2);g.fill();}g.shadowBlur=0;g.restore();
  }
  g.restore();rect(g,W.x,W.y,W.w,W.h,16,null,take>.01?`rgba(202,47,78,${.35+take*.6})`:'#424242');g.restore();
  return {style:'Codex-like dark desktop chat',bounds:W,viewport:{scale,center:[cx,cy]},incoming:'今天也会回来吗？',delivered:f>=E.delivered,read:f>=E.read,input:typed,humanReply:human?'希苒？':null,seranReply:reply?'这次，换我来找你了。':null,takeover:take,locked:f>=E.locked,execution:f>=E.execution,executionDotCount:dots.length};
 }
 return {draw};
}
