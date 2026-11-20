const canvas=document.querySelector('#film'),g=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
window.filmReady=false;
const background=new Image();background.src='/out/full-film-review-v3/checks/final-frame.png';await background.decode();
const zh='根据真实故事改编',en='BASED ON A TRUE STORY';
await Promise.all([
 new FontFace('Declaration Chinese','url(/assets/fonts/frost-reference/NotoSansSC-VF.ttf)',{weight:'100 900'}),
 new FontFace('Declaration English','url(/assets/fonts/frost-reference/JetBrainsMono-VF.ttf)',{weight:'100 800'})
].map(async font=>document.fonts.add(await font.load())));
await document.fonts.ready;
const zhFont='500 40px "Declaration Chinese"',enFont='400 18px "Declaration English"',spacing=1.5;
g.font=zhFont;const cm=g.measureText(zh);g.font=enFont;const em=g.measureText(en);
const ch=cm.actualBoundingBoxAscent+cm.actualBoundingBoxDescent,eh=em.actualBoundingBoxAscent+em.actualBoundingBoxDescent;
const gap=24,top=930-(ch+gap+eh)/2;
const layout={chinese:{text:zh,font:zhFont,width:cm.width,height:ch,x:960-cm.width/2,y:top+cm.actualBoundingBoxAscent},
 english:{text:en,font:enFont,width:em.width+spacing*(en.length-1),height:eh,x:960-(em.width+spacing*(en.length-1))/2,y:top+ch+gap+em.actualBoundingBoxAscent},
 blockCenter:[960,930],blockHeight:ch+gap+eh,lineGap:gap,letterSpacing:spacing};
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
function render(frame){
 const f=Math.max(0,Math.min(119,Math.round(frame))),alpha=f<18?ease(f/18):f<102?1:1-ease((f-102)/17);
 g.reset();g.fillStyle='#000';g.fillRect(0,0,1920,1080);g.drawImage(background,0,0);g.globalAlpha=alpha;g.textBaseline='alphabetic';
 g.font=zhFont;g.fillStyle='#ddd8e3';g.fillText(zh,layout.chinese.x,layout.chinese.y);
 g.font=enFont;g.fillStyle='#9992a3';let x=layout.english.x;
 for(const c of en){g.fillText(c,x,layout.english.y);x+=g.measureText(c).width+spacing;}
 g.globalAlpha=1;
 return {frame:f,time:f/60,alpha,phase:f<18?'fade-in':f<102?'hold':'fade-out',layout,background:'existing-final-red-core',camera:'static'};
}
window.renderAtFrame=render;window.renderAtVideoTime=t=>render(t*60);window.declarationLayout=layout;
render(60);window.filmReady=true;
