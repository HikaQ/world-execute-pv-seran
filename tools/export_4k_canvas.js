// Export-only logical 1920x1080 canvas with a native 3840x2160 backing store.
// Scene coordinates, trajectories, text metrics and timing stay in design units.
(() => {
 const proto=HTMLCanvasElement.prototype;
 const width=Object.getOwnPropertyDescriptor(proto,'width'),height=Object.getOwnPropertyDescriptor(proto,'height');
 const get=proto.getContext,reset=CanvasRenderingContext2D.prototype.reset;
 const resetTransform=CanvasRenderingContext2D.prototype.resetTransform,setTransform=CanvasRenderingContext2D.prototype.setTransform;
 const draw=CanvasRenderingContext2D.prototype.drawImage;
 const tracked=[];globalThis.__exportCanvasAudit=tracked;
 function enhance(c,g){
  if(c.__exportLogicalSize)return;
  c.__exportLogicalSize=[1920,1080];c.__exportCanvas2d=true;
  width.set.call(c,3840);height.set.call(c,2160);
  // Offscreen canvases can become GPU textures: their DOM dimensions must
  // report the real backing size so texture allocation matches texSubImage2D.
  if(c.id==='film'){
   Object.defineProperty(c,'width',{configurable:true,get(){return this.__exportLogicalSize[0];},set(n){this.__exportLogicalSize[0]=+n;width.set.call(this,n*2);setTransform.call(g,2,0,0,2,0,0);}});
   Object.defineProperty(c,'height',{configurable:true,get(){return this.__exportLogicalSize[1];},set(n){this.__exportLogicalSize[1]=+n;height.set.call(this,n*2);setTransform.call(g,2,0,0,2,0,0);}});
  }
  g.reset=function(){reset.call(this);setTransform.call(this,2,0,0,2,0,0);};
  g.resetTransform=function(){setTransform.call(this,2,0,0,2,0,0);};
  g.setTransform=function(...args){
   if(args.length===1){const m=args[0];setTransform.call(this,2*m.a,2*m.b,2*m.c,2*m.d,2*m.e,2*m.f);}
   else setTransform.call(this,...args.map(n=>n*2));
  };
  setTransform.call(g,2,0,0,2,0,0);tracked.push({id:c.id||'offscreen',logical:[1920,1080],physical:[3840,2160]});
 }
 proto.getContext=function(kind,...args){const g=get.call(this,kind,...args);if(g&&kind==='2d'&&width.get.call(this)===1920&&height.get.call(this)===1080)enhance(this,g);return g;};
 CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
  const logical=source?.__exportLogicalSize;
  if(logical&&args.length===2)args.push(...logical);
  else if(source?.__exportCanvas2d&&args.length===8)for(let i=0;i<4;i++)args[i]*=2;
  return draw.call(this,source,...args);
 };
 globalThis.__resize4k=(renderer,w,h,updateStyle=false)=>{
  const factor=(w>=1920&&Math.abs(w/h-16/9)<.001)?3840/w:1;
  renderer.setSize(w*factor,h*factor,updateStyle);
  renderer.domElement.__exportRasterScale=factor;
  renderer.domElement.__exportLogicalSize=[1920,1080];
  tracked.push({id:'webgl',source:[w,h],physical:[w*factor,h*factor],particleScale:factor});
 };
 for(const T of [WebGLRenderingContext,WebGL2RenderingContext]){
  const original=T.prototype.shaderSource;
  T.prototype.shaderSource=function(shader,source){
   const factor=this.canvas.__exportRasterScale||1;
   if(factor!==1&&source.includes('gl_PointSize')&&/#define SHADER_TYPE (Raw)?ShaderMaterial/.test(source)&&/void\s+main\s*\(\s*\)/.test(source)){
    source=source.replace(/void\s+main\s*\(\s*\)/,'void exportOriginalMain');
    // Keep the function parameter parentheses when replacing its name.
    source=source.replace('void exportOriginalMain','void exportOriginalMain()');
    source+=`\nvoid main(){exportOriginalMain();gl_PointSize*=${factor.toFixed(10)};}\n`;
   }
   return original.call(this,shader,source);
  };
 }
})();
