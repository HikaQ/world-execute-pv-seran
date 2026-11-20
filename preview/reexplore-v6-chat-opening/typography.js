export const FONTS = Object.freeze({
  mono:'"JetBrains Mono", "Noto Sans SC", monospace',
  sans:'"Space Grotesk", "Noto Sans SC", sans-serif',
  cjk:'"Noto Sans SC", sans-serif',
});

export async function loadFonts(){
  const base='/assets/fonts/frost-reference/';
  const specs=[['JetBrains Mono','JetBrainsMono-VF.ttf','100 800'],
    ['Space Grotesk','SpaceGrotesk-VF.ttf','300 700'],
    ['Noto Sans SC','NotoSansSC-FullFilm.ttf','100 900']];
  await Promise.all(specs.map(async([family,file,weight])=>{
    const face=new FontFace(family,`url("${base+file}")`,{weight});
    document.fonts.add(await face.load());
  }));
  await document.fonts.load('500 42px "Noto Sans SC"','希克希苒你是我是已更新已关联');
  return specs.map(([family])=>family);
}
