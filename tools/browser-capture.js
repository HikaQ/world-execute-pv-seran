// Shared frame API for the public viewer and deterministic captures.
async function initializeCapture() {try {
  const started=performance.now();
  while(!window.filmReady) {
    if(window.filmFailure) throw Error(window.filmFailure);
    if(performance.now()-started>120000) throw Error('Scene initialization timed out');
    await new Promise(r=>setTimeout(r,30));
  }
  const seg=globalThis.__releaseSegment;
  let lens;
  if(seg.materialPass) {
    const [a,b,c]=await Promise.all([
      import('/preview/refinement-perception-v17/spatial-score.js'),
      import('/preview/refinement-perception-v17/helix-rhythm.js'),
      import(globalThis.__releaseNative4k?'/preview/film-light-code-v2/lens-4k.js':'/preview/film-light-code-v2/lens.js')
    ]);
    globalThis.__upgradeHelix={helixWorld:a.helixWorld,HELIX_CENTER:a.HELIX_CENTER,helixGrowth:b.helixGrowth,helixBirthTime:b.helixBirthTime};
    lens=c.createLens();
  }
  window.renderSourceFrame=async frame=>{
    const f=Math.max(seg.first,Math.min(seg.end-1,Math.round(frame)));
    window.__copyFrame=f;window.__upgradeFrame=f;window.__upgradeDisabled=!seg.materialPass;window.__upgradeAudit=[];
    const local=seg.localClock?f-seg.first:f;
    const state=window.renderAtVideoTime?await window.renderAtVideoTime(local/60,{lyricsVisible:false}):await window.renderAtFrame(local,{lyricsVisible:false});
    const canvas=document.querySelector('#film');
    if(lens)canvas.getContext('2d').drawImage(lens.apply(canvas,f),0,0,1920,1080);
    const dimensions=['width','height'].map(k=>Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,k).get.call(canvas));
    return {frame:f,source:seg.version,dimensions,finite:state?.finite!==false};
  };
  await window.renderSourceFrame(Number(new URLSearchParams(location.search).get('frame'))||seg.first);
  window.sourceReady=true;
} catch(e) {window.sourceFailure=String(e.stack||e);console.error(e);}}
initializeCapture();
