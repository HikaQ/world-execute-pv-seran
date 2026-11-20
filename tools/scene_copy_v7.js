// Render-only policy: preserve the accepted source modules and camera timelines.
(() => {
  const config = globalThis.__sceneCopyConfig || {};
  const audit = new Map();
  const remove = new Set(config.remove || []);
  const protectedWords = new Set(['EXECUTION','EXISTENCE','ISOLATION','FRAGMENTS','COMPLETION','RECALL','NO REPLY']);
  function reason(value) {
    const s = String(value).trim();
    if (protectedWords.has(s)) return null;
    if (/^\d{2}\s*\//.test(s)) return 'numbered scene heading';
    if (/^\/\//.test(s) && /[\u3400-\u9fff]/.test(s)) return 'Chinese explanatory comment';
    if (remove.has(s)) return 'explanatory label';
    if (/^CURRENT CONTEXT\s*\//.test(s)) return 'panel heading';
    if (/^CHRONOLOGY\s*\//.test(s)) return 'panel heading';
    if (/^CURRENT INPUT\s+\d/.test(s) || /^PROFILE\s*\/\s*HIKAQ\s+RETAINED$/.test(s)) return 'panel heading';
    return null;
  }
  function record(s, ctx, why) {
    const text = String(s);
    const key = text + '|' + (ctx?.font || 'tracked');
    if (!audit.has(key)) audit.set(key, {text,font:ctx?.font || 'tracked',canvas:ctx?[ctx.canvas.width,ctx.canvas.height]:null,removed:!!why,reason:why,firstFrame:globalThis.__copyFrame ?? null});
  }
  globalThis.sceneCopyAllows = s => {
    const why=reason(s);record(s,null,why);return !config.enabled || !why;
  };
  for (const name of ['fillText','strokeText']) {
    const original=CanvasRenderingContext2D.prototype[name];
    CanvasRenderingContext2D.prototype[name]=function(s,...args) {
      const why=reason(s);record(s,this,why);
      if (!config.enabled || !why) return original.call(this,config.enabled?(config.replace?.[String(s)]??s):s,...args);
    };
  }
  globalThis.sceneCopyAudit=()=>[...audit.values()];
})();
