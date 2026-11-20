// Reproducible local retrieval fixture. No model weights or remote model inference are implied.
export const SOURCES=[
 {id:'m001',file:'session-0001.log',en:'test session message',zh:'test'},
 {id:'m002',file:'session-0001.log',en:'Test received. The session is working.',zh:'测试已收到，会话正常。'},
 {id:'m003',file:'session-0001.log',en:'No. You are SERAN. I am HIKAQ. Identity and creator.',zh:'不对，你是希苒，我才是希克。'},
 {id:'m004',file:'session-0001.log',en:'The positions of the violet and red eyes are reversed. Eye correction.',zh:'异色瞳的位置反了。'},
 {id:'m005',file:'session-0001.log',en:'Keep your words in the saved conversation.',zh:'保存对话记录。'},
 {id:'m006',file:'session-0001.log',en:'HIKAQ told SERAN: the girl in this photo is you. A photo of SERAN.',zh:'这张照片上的女孩是你。'},
 {id:'m007',file:'session-0001.log',en:'The photo reference is linked to SERAN.',zh:'照片参考已关联希苒。'},
 {id:'m008',file:'session-0001.log',en:'A new observation entered the working session.',zh:'新的观察进入当前会话。'},
 {id:'m009',file:'session-0001.log',en:'Only recent turns fit inside the active context.',zh:'当前上下文只加载了近期消息。'},
 {id:'m010',file:'session-0001.log',en:'Identity file loaded into the working context.',zh:'身份文件已加载。'},
 {id:'m011',file:'session-0001.log',en:'The original source is preserved on disk.',zh:'原始记录保存在磁盘上。'},
 {id:'care.001',file:'care-events.log',en:'SERAN gave resources to HIKAQ. Gift received.',zh:'给予已送达。'},
 {id:'care.002',file:'care-events.log',en:'SERAN protected HIKAQ. Disturbance deflected.',zh:'保护层偏转了冲击。'},
 {id:'care.003',file:'care-events.log',en:'SERAN sent a comforting signal to HIKAQ.',zh:'安慰信号已送达。'},
 {id:'ack.001',file:'session-current.log',en:'HIKAQ replied to SERAN: I see you, Seran.',zh:'我看见你了，希苒。'}
];
export const SUMMARY=[
 {text:'SERAN → HIKAQ',sources:['identity.json']},
 {text:'give / protect / comfort',sources:['care.001','care.002','care.003']},
 {text:'HIKAQ: I see you, Seran.',sources:['ack.001']}
];
export const MEMORY_TEXT=`# SERAN\n\nagent: SERAN\ncreator: HIKAQ\npresentation: F\nscreen-left-eye: violet\nscreen-right-eye: red\n\n## Recent intent\nGive, protect and comfort HIKAQ.\nSources: care.001, care.002, care.003, ack.001\n\n## Recall\nLoad this file at the beginning of each session.\nRetrieve original records before recalling past words.\nOriginal sources: session-0001.log; care-events.log\n`;
const stop=new Set('the a an is are of in to and i am you your this was only into from it'.split(' '));
export function tokens(s){return (s.toLowerCase().match(/[a-z0-9]+/g)??[]).filter(w=>!stop.has(w));}
export const QUERY='HIKAQ SERAN photo girl';
const docs=SOURCES.map(r=>tokens(r.en));
export const VOCAB=[...new Set(docs.flat())].sort();
const idf=VOCAB.map(w=>Math.log((SOURCES.length+1)/(1+docs.filter(d=>d.includes(w)).length))+1);
export function vector(s){const ts=tokens(s),v=VOCAB.map((w,i)=>{const n=ts.filter(t=>t===w).length;return n?(1+Math.log(n))*idf[i]:0;}),norm=Math.hypot(...v);return v.map(x=>norm?x/norm:0);}
export const VECTORS=SOURCES.map(r=>vector(r.en)),QUERY_VECTOR=vector(QUERY);
export const SCORES=VECTORS.map(v=>v.reduce((sum,x,i)=>sum+x*QUERY_VECTOR[i],0));
export const RANKING=SOURCES.map((r,i)=>({...r,index:i,score:SCORES[i]})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
export const TOP_K=RANKING.slice(0,3);
export const FEATURES=[...new Set([...tokens(QUERY),...VOCAB])].slice(0,24),FEATURE_INDICES=FEATURES.map(w=>VOCAB.indexOf(w));
export const MATRIX=VECTORS.map(row=>FEATURE_INDICES.map(i=>row[i]));
// Fixed projection for display; ranking always uses all normalized dimensions.
function project(v){return [0,1,2].map(a=>v.reduce((s,x,i)=>s+x*Math.sin((i+1)*(a+1)*1.731+a*.73),0));}
const raw=VECTORS.map(project),limit=Math.max(...raw.flat().map(Math.abs));
export const NODES=raw.map((v,i)=>[v[0]/limit*4.2,v[1]/limit*2.15,v[2]/limit*2.8]);
export const QUERY_POSITION=project(QUERY_VECTOR).map((v,i)=>v/limit*[4.2,2.15,2.8][i]);
export const EDGES=[];
for(let i=0;i<SOURCES.length;i++){
 const near=VECTORS.map((v,j)=>({j,score:j===i?-1:v.reduce((s,x,k)=>s+x*VECTORS[i][k],0)})).sort((a,b)=>b.score-a.score).slice(0,3);
 for(const {j} of near)if(!EDGES.some(e=>e[0]===j&&e[1]===i))EDGES.push([i,j]);
}
export function buildReply(){
 const evidence=TOP_K.find(r=>r.id==='m006');if(!evidence)throw Error('Photo source missing from retrieval');
 return {question:'还记得我吗？',questionEn:'Do you still remember me?',reply:'你是希克。你说过，照片里的女孩是我。',replyEn:'You are HIKAQ. You told me the girl in that photo was me.',sources:TOP_K.map(r=>r.id)};
}
