import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {ROOT,startServer} from './server.mjs';
const args=process.argv.slice(2),value=(key,fallback)=>args.find(a=>a.startsWith('--'+key+'='))?.split('=').slice(1).join('=')??fallback;
const native4k=args.includes('--4k'),video=args.includes('--video'),smoke=args.includes('--smoke');
const frame=Number(value('frame',2670)),count=Number(value('frames',120));
if(!Number.isInteger(frame)||frame<0||frame>=13147||!Number.isInteger(count)||count<1)throw Error('Invalid frame range');
const output=path.join(ROOT,'output');await mkdir(output,{recursive:true});
const host=await startServer({native4k,demo:args.includes('--demo')});
let browser;
const report={mode:video?'video':smoke?'smoke':'still',native4k,demo:args.includes('--demo'),samples:[],status:'running'};
try {
  browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
  const selected=smoke?host.timeline.segments:host.timeline.segments.filter(s=>frame>=s.first&&frame<s.end);
  for(const seg of selected){
    const f=smoke?Math.floor((seg.first+seg.end)/2):frame;
    if(video&&f+count>seg.end)throw Error('A clip must stay within one timeline segment; choose fewer --frames');
    const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[],failedRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failedRequests.push(`${r.status()} ${new URL(r.url()).pathname}`);});
    try {
      await page.goto(`${host.url}/preview/${seg.version}/?capture=1&refinement=1&frame=${f}${seg.mode?'&range='+seg.mode:''}`);
      await page.waitForFunction(()=>window.sourceReady||window.sourceFailure||window.filmFailure,null,{timeout:60000});
      const failure=await page.evaluate(()=>window.sourceFailure||window.filmFailure);
      if(failure)throw Error(failure);
      const capture=async n=>{
        const result=await page.evaluate(async n=>{const state=await window.renderSourceFrame(n);return {state,image:document.querySelector('#film').toDataURL('image/png').split(',')[1]};},n);
        if(!result.state.finite||result.state.dimensions.join('x')!==(native4k?'3840x2160':'1920x1080'))throw Error('Invalid frame geometry');
        if(errors.length||failedRequests.length)throw Error([...errors,...failedRequests].join('\n'));
        return result;
      };
      const still=await capture(f);const file=`${String(f).padStart(5,'0')}-${native4k?'4k':'1080p'}.png`;
      await writeFile(path.join(output,file),Buffer.from(still.image,'base64'));
      if(video){
        const codec=value('encoder','libx264');if(!['libx264','h264_nvenc'].includes(codec))throw Error('Supported encoders: libx264, h264_nvenc');
        const encode=codec==='libx264'?['-c:v',codec,'-preset','fast','-crf','16']:['-c:v',codec,'-preset','p7','-cq','16','-b:v','0'];
        const target=path.join(output,`${f}-${f+count}-${native4k?'4k':'1080p'}-silent.mp4`);
        const ff=spawn(process.env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-v','error','-y','-f','image2pipe','-vcodec','png','-framerate','60','-i','pipe:0','-an',...encode,'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-r','60','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',target],{stdio:['pipe','ignore','pipe'],windowsHide:true});
        let err='';ff.stderr.on('data',b=>err+=b);ff.stdin.on('error',()=>{});
        const done=new Promise((resolve,reject)=>{ff.once('error',reject);ff.once('close',code=>code===0?resolve():reject(Error(err||`FFmpeg exit ${code}`)));});
        // Attach a handler immediately; a missing FFmpeg binary must not create
        // an unhandled rejection while the next frame is being generated.
        done.catch(()=>{});
        try {for(let n=f;n<f+count;n++){const r=n===f?still:await capture(n);if(!ff.stdin.write(Buffer.from(r.image,'base64')))await once(ff.stdin,'drain');}ff.stdin.end();await done;}catch(e){ff.kill();throw e;}
      }
      report.samples.push({...still.state,status:'passed',file});console.log(`PASS ${f} ${seg.version}${seg.mode?' / '+seg.mode:''}`);
    } catch(e){report.samples.push({frame:f,source:seg.version,status:'failed',error:String(e),requests:failedRequests});console.error(`FAIL ${f} ${seg.version}: ${String(e).slice(0,1400)}`);if(!smoke)throw e;}
    finally{await page.close();}
  }
  report.status=report.samples.every(s=>s.status==='passed')?'passed':'failed';
  if(report.status==='failed')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e);process.exitCode=1;console.error(e);}
finally{report.placeholders=[...host.missing].sort();await writeFile(path.join(output,smoke?'smoke-report.json':'capture-report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>host.server.close(r));}
