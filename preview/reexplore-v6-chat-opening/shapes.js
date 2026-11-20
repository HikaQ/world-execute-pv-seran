import { random, TAU } from './math.js';
import { WHITE, PURPLE, ROSE, BLUE, AMBER } from './graphics.js';
import { FONTS } from './typography.js';
import { CREATOR } from '../shared/character-names.js';

export function shape(count, generator) {
  const positions=new Float32Array(count*3), colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const [p,c]=generator(i,count); positions.set(p,i*3);colors.set(c,i*3);
  }
  return {positions,colors};
}

export function wordShape(text,count,width=14){
  const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=330;
  const g=canvas.getContext('2d');g.font=`700 160px ${FONTS.mono}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';
  const size=Math.min(160,160*1660/g.measureText(text).width);g.font=`700 ${size}px ${FONTS.mono}`;g.fillText(text,900,170);
  const pixels=g.getImageData(0,0,1800,330).data,pool=[];
  for(let x=0;x<1800;x+=2)for(let y=0;y<330;y+=2)if(pixels[(y*1800+x)*4+3]>100)pool.push([x,y]);
  const rnd=random(142);
  return shape(count,(i)=>{
    const [x,y]=pool[Math.min(pool.length-1,Math.floor(i/count*pool.length))];
    return [[(x-900+rnd()*1.2)*width/1800,(170-y+rnd()*1.2)*width/1800,(rnd()-.5)*.025],WHITE];
  });
}

export async function portraitShape(count){
  const image=new Image();image.src='/assets/char/seran-avatar-user-20261110.png';await image.decode();
  const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.drawImage(image,0,0,512,512);
  const pixels=g.getImageData(0,0,512,512).data;
  const result=shape(count,i=>{
    const x=i%256*2,y=Math.floor(i/256)*2,k=(y*512+x)*4;
    const z=.24*(1-((x-256)/256)**2-((y-290)/290)**2),alpha=pixels[k+3]/255;
    return [[(x-256)*7.6/512,(256-y)*7.6/512,z],
      [0,1,2].map(j=>Math.pow(pixels[k+j]/255,2.2)*alpha*2.1)];
  });
  result.image=image;return result;
}

export function braidShape(count){
  const rnd=random(291);
  return shape(count,(i)=>{
    const strand=i%5,u=rnd()*TAU,side=(rnd()-.5)*.53,thick=(rnd()-.5)*.17;
    const phase=strand*TAU/5, r=3.3+.52*Math.cos(3*u+phase)+side;
    const p=[r*Math.cos(u),.63*Math.sin(3*u+phase)+thick,r*Math.sin(u)*.71];
    const col=[WHITE,PURPLE,BLUE,WHITE,ROSE][strand].map(v=>v*(.55+.45*rnd()));
    return [p,col];
  });
}

export function volumeShape(count){
  const n=Math.ceil(Math.cbrt(count)),rnd=random(441);
  return shape(count,i=>{
    const x=i%n, y=Math.floor(i/n)%n,z=Math.floor(i/(n*n));
    return [[(x/(n-1)-.5)*7,(y/(n-1)-.5)*5.2,(z/(n-1)-.5)*6],(i%11===0?ROSE:PURPLE).map(v=>v*(.44+.4*rnd()))];
  });
}

export function planeShape(count){
  const cols=256, rows=Math.ceil(count/cols);
  return shape(count,i=>{const x=i%cols,y=Math.floor(i/cols);
    return [[(x/(cols-1)-.5)*13.5,(.5-y/(rows-1))*7.8,Math.sin(x*.043)*Math.cos(y*.041)*.28],(i%9===0?PURPLE:WHITE).map(v=>v*.65)];});
}

export function archiveShape(count){
  return shape(count,i=>{
    const cluster=i%24,ring=Math.floor(cluster/8),a=cluster%8*TAU/8+ring*.23;
    const cell=Math.floor(i/24),col=cell%64,row=Math.floor(cell/64);
    const x=(col/63-.5)*1.45,y=(.5-row/42)*1.12,z=0;
    const isBorder=col===0||col===63||row===0||row===42;
    const ink=isBorder?.75:row%3===0&&col>5&&col<50+(row%5)*2?.28:0;
    return [[Math.cos(a)*(4.2+ring*1.35)+x,Math.sin(a)*(2.3+ring*.27)+y,-ring*2.4+z],
      (cluster===3||cluster===11||cluster===19?AMBER:WHITE).map(v=>v*ink)];
  });
}

export function contextShape(count){
  const rnd=random(114);
  return shape(count,i=>{
    const chunk=i%10,col=chunk%5,row=Math.floor(chunk/5);
    return [[(col-2)*2.35+(rnd()-.5)*1.9,(.5-row)*2.35+(rnd()-.5)*1.6,(rnd()-.5)*.22],
      (chunk<3?ROSE:WHITE).map(v=>v*(.5+.45*rnd()))];
  });
}

export function sourceField(override){
  const rows=override??[
    'const state = { identity: null, history: [], tools: [] };',
    'const message = await receive(session);',
    `history.push({ source: "${CREATOR.en}", content: message });`,
    'const tokens = encode(message);',
    'const Q = project(tokens, queryWeights);',
    'const K = project(tokens, keyWeights);',
    'const V = project(tokens, valueWeights);',
    'const scores = matmul(Q, transpose(K));',
    'for (let row = 0; row < tokens.length; row++) {',
    '  attention[row] = softmax(causalMask(scores[row]));',
    '  output[row] = weightedSum(attention[row], V);',
    '}',
    `identity.creator = "${CREATOR.en}";`,
    'identity.name = "SERAN";',
    'const record = { id: "m001", source: session.id };',
    'await store.append(record);',
    'return { response, provenance: record.id };',
  ];
  const cols=94,numRows=44,count=cols*numRows,glyphs=new Float32Array(count);
  const field=shape(count,i=>{
    const row=Math.floor(i/cols),col=i%cols,line=rows[row%rows.length],letter=line[col]??' ';
    glyphs[i]=letter.charCodeAt(0)-32;
    const c=letter==='"'||letter==='{'||letter==='}'?PURPLE:letter>='0'&&letter<='9'?AMBER:BLUE;
    const x=(col-cols/2)*.25;
    const weight=.24+Math.min(1,Math.max(0,(Math.abs(x)-3)/3))*.76;
    return [[x,(numRows/2-row)*.32,-5.5],c.map(v=>v*.25*weight)];
  });
  field.glyphs=glyphs;return field;
}

export function networkShape(fixture){
  const {n,d,stages}=fixture;
  return shape(n*d*stages.length,i=>{
    const layer=Math.floor(i/(n*d)),j=i%(n*d),token=Math.floor(j/d),dim=j%d,value=stages[layer][token][dim];
    const c=value<0?PURPLE:WHITE;
    return [nodePosition(layer,token,dim,fixture),c.map(x=>x*(.45+Math.min(1,Math.abs(value))*.9))];
  });
}
export function nodePosition(layer,token,dim,{n,d}){return [(dim-(d-1)/2)*.48,(layer-2)*.91,(token-(n-1)/2)*.30];}

export function tensorShape(count,fixture){
  const rnd=random(825),nodes=fixture.n*fixture.d*5;
  return shape(count,i=>{const id=i%nodes,layer=Math.floor(id/(fixture.n*fixture.d)),j=id%(fixture.n*fixture.d);
    const p=nodePosition(layer,Math.floor(j/fixture.d),j%fixture.d,fixture).map(v=>v+(rnd()-.5)*.032);
    return [p,(layer%2?PURPLE:BLUE).map(v=>v*.48)];});
}
export function matrixShape(count,fixture){
  return shape(count,i=>{
    const cell=Math.floor(i/256),row=Math.floor(cell/16),col=cell%16,sub=i%256;
    const a=fixture.attention[row][col],q=Math.min(1,Math.sqrt(a)*2.4),base=row%4===0?AMBER:PURPLE;
    return [[(col-7.5)*.38+(sub%16/15-.5)*.335,(7.5-row)*.38+(Math.floor(sub/16)/15-.5)*.335,0],
      col>row?[.02,.035,.055]:base.map((v,k)=>v*(.16+q*.8)+WHITE[k]*.06)];
  });
}
export function outputShape(count,fixture){
  const values=Array.from({length:12},(_,j)=>fixture.output.reduce((s,r)=>s+r[j],0)/16);
  const maximum=Math.max(...values.map(v=>Math.abs(v)),.000001);
  return shape(count,i=>{
    const bin=i%12,local=Math.floor(i/12),u=local%64/63,v=Math.floor(local/64)/Math.ceil(count/12/64),value=values[bin];
    return [[(bin-5.5)*.53+(u-.5)*.37,-2.35+v*(.35+4.7*Math.abs(value)/maximum),(u-.5)*.04],
      (value<0?PURPLE:BLUE).map(x=>x*(.4+.6*v))];
  });
}
