// Publication adapter. Original scene coordinates and timing stay in design units.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {once} from 'node:events';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FX = '/preview/film-light-code-v2';
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8','.css':'text/css','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.f32':'application/octet-stream'};
const exists = async p => {try {return (await stat(p)).isFile();} catch {return false;}};
function localPath(url) {
  const p = path.resolve(ROOT, '.' + decodeURIComponent(url));
  const rel = path.relative(ROOT, p);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some(s=>s.startsWith('.'))) throw Error('Invalid path');
  return p;
}
function placeholder(url) {
  // Deliberately neutral, labelled demo image. Never presented as original art.
  const label = url.includes('avatar') ? 'LOCAL PORTRAIT NOT INCLUDED' : 'LOCAL IMAGE NOT INCLUDED';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#060409"/><g fill="none" stroke="#8a779e" stroke-width="2"><rect x="610" y="200" width="700" height="680"/><circle cx="960" cy="470" r="130"/><path d="M760 780 Q760 620 960 620 Q1160 620 1160 780"/></g><circle cx="960" cy="470" r="7" fill="#ff244a"/><text x="960" y="960" text-anchor="middle" fill="#b6aabd" font-family="monospace" font-size="24">${label}</text></svg>`;
}
export async function startServer({port=0, native4k=false, demo=true}={}) {
  const timeline = JSON.parse(await readFile(new URL('../data/timeline-v24.json',import.meta.url),'utf8'));
  const snippets = JSON.parse(await readFile(new URL('../preview/film-light-code-v2/snippets.json',import.meta.url),'utf8'));
  const rules = JSON.parse(await readFile(new URL('../data/scene-copy-v7.json',import.meta.url),'utf8'));
  const copy = await readFile(new URL('./scene_copy_v7.js',import.meta.url),'utf8');
  const shim = native4k ? await readFile(new URL('./export_4k_canvas.js',import.meta.url),'utf8') : '';
  const missing = new Set();
  function transform(p, source, url) {
    let s = source;
    if (p.endsWith('.html') && url.pathname.startsWith('/preview/')) {
      s=s.replaceAll('/node_modules/three/build/three.module.js',FX+'/three-proxy.js');
      if (!s.includes('type="importmap"') && !s.includes("type='importmap'")) s=s.replace(/<script/i,`<script type="importmap">{"imports":{"three":"${FX}/three-proxy.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script`);
      const frame=Number(url.searchParams.get('frame')||0);
      const seg=timeline.segments.find(s=>frame>=s.first&&frame<s.end) || timeline.segments[0];
      const init = `${shim}\nglobalThis.__releaseSegment=${JSON.stringify(seg)};globalThis.__releaseNative4k=${native4k};globalThis.__upgradeFrame=${frame};globalThis.__upgradeDisabled=${!seg.materialPass};globalThis.__upgradeSnippets=${JSON.stringify(snippets)};globalThis.__sceneCopyConfig=${JSON.stringify({enabled:seg.copyPolicy,remove:rules.remove,replace:rules.replace})};\n${copy}`;
      s=s.replace(/<script/i,()=>`<script>${init.replaceAll('</script','<\\/script')}</script><script`);
      s+='\n<script type="module" src="/tools/browser-capture.js"></script>';
    }
    if (p.endsWith('/src/engine/engine.js')) {
      s=s.replace('import { WebGLRenderer } from "../../vendor/three/build/three.module.js?v=BkIP_83j";',`import { WebGLRenderer } from "${FX}/vendor-proxy.js";\nimport {modifyPost} from "${FX}/upgrade.js";`);
      s=s.replace('const bloomTex = this.bloom.render(', 'modifyPost(post);\nconst bloomTex = this.bloom.render(');
    }
    if(p.endsWith('/postprocessing/UnrealBloomPass.js')) {
      s=s.replace("this.highPassUniforms[ 'luminosityThreshold' ].value = this.threshold;","this.highPassUniforms[ 'luminosityThreshold' ].value = this.threshold * (globalThis.__upgradeDisabled ? 1 : (globalThis.__upgradeProfile?.threshold ?? 1));");
      s=s.replace("this.compositeMaterial.uniforms[ 'bloomStrength' ].value = this.strength;","this.compositeMaterial.uniforms[ 'bloomStrength' ].value = this.strength * (globalThis.__upgradeDisabled ? 1 : (globalThis.__upgradeProfile?.bloom ?? 1));");
    }
    if(native4k) {
      s=s.replace(/\brenderer\.setSize\((2880\s*,\s*1620(?:\s*,\s*false)?|1920\s*,\s*1080(?:\s*,\s*false)?|W\s*,\s*H(?:\s*,\s*false)?|width\s*,\s*height(?:\s*,\s*false)?)\)/g,'globalThis.__resize4k(renderer,$1)');
      s=s.replace(/new THREE\.WebGLRenderTarget\((?:2880\s*,\s*1620|1920\s*,\s*1080|W\s*,\s*H|width\s*,\s*height)/g,'new THREE.WebGLRenderTarget(3840,2160');
      if(s.includes('new Engine(')) {
        s=s.replace(/new Engine\(canvas,\{width:1920,height:1080/g,'new Engine(canvas,{width:3840,height:2160');
        s=s.replace(/\.drawImage\(canvas,0,0\)/g,'.drawImage(canvas,0,0,1920,1080)');
      }
      s=s.replace('const mask=tg.getImageData(0,0,1600,300).data;tg.clearRect','const mask=tg.getImageData(0,0,1600,300).data;type.width=3200;type.height=600;tg.scale(2,2);tg.clearRect');
    }
    return s;
  }
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://127.0.0.1');
      if(url.pathname==='/favicon.ico') {res.writeHead(204).end();return;}
      if(url.pathname==='/api/status') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({demo,native4k,placeholders:[...missing].sort()}));return;}
      let p=localPath(url.pathname);
      const external=path.join(ROOT,'media.local',path.relative(ROOT,p));
      if(await exists(external)) p=external;
      else if((await stat(p).catch(()=>null))?.isDirectory()) p=path.join(p,'index.html');
      if(!await exists(p)) {
        if(demo && /\.(?:png|jpg|jpeg|webp)$/i.test(p) && /^\/(?:assets|preview|out)\//.test(url.pathname)) {
          missing.add(url.pathname);res.setHeader('Content-Type','image/svg+xml');res.setHeader('X-Source-Placeholder','true');res.end(placeholder(url.pathname));return;
        }
        res.writeHead(404).end('Missing file: '+url.pathname);return;
      }
      res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');
      const bytes=await readFile(p);
      res.end(/\.(?:html|js)$/.test(p)?transform(p.replaceAll('\\','/'),bytes.toString('utf8'),url):bytes);
    } catch(e) {res.writeHead(400).end('Request failed');}
  });
  server.listen(port,'127.0.0.1');await once(server,'listening');
  return {server,url:`http://127.0.0.1:${server.address().port}`,missing,timeline};
}
