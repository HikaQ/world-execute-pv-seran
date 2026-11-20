import {readdir,readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT} from './server.mjs';
const skip=new Set(['node_modules','output','media.local','.git']);
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk(ROOT),issues=[];
for(const file of files){
 const rel=path.relative(ROOT,file),ext=path.extname(file);
 if(/\.(?:mp4|mkv|mov|wav|flac|mp3|m4a|srt|lrc|ass)$/.test(file))issues.push(`${rel}: media/captions should not be bundled`);
 if((await stat(file)).size>=50*1024*1024)issues.push(`${rel}: unusually large file`);
 if(['.js','.mjs','.json','.html','.md'].includes(ext)){
  const text=await readFile(file,'utf8');
  if(/[A-Z]:[\\/]Users[\\/]|[A-Z]:[\\/]execute[\\/]|codex:\/\/threads\//i.test(text))issues.push(`${rel}: private machine or conversation path`);
  if(/(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text))issues.push(`${rel}: possible credential`);
  if(ext==='.json'){try{JSON.parse(text);}catch{issues.push(`${rel}: invalid JSON`);}}
  if(ext==='.js'||ext==='.mjs'){
   const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});
   if(check.status!==0)issues.push(`${rel}: ${check.stderr.trim()}`);
  }
 }
}
const timeline=JSON.parse(await readFile(path.join(ROOT,'data/timeline-v24.json'),'utf8'));
let end=0;for(const s of timeline.segments){assert.equal(s.first,end,`Timeline gap at ${s.id}`);assert(s.end>s.first);await stat(path.join(ROOT,'preview',s.version,'index.html'));end=s.end;}assert.equal(end,13147);assert.equal(timeline.fps,60);
for(const p of ['LICENSE','NOTICE.md','docs/THIRD_PARTY.md'])await stat(path.join(ROOT,p));
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else console.log(`PASS: ${files.length} files; JavaScript syntax, JSON, contiguous V24 timeline, licence files, sensitive-pattern and binary exclusions.`);
