# world.execute(me) · SERAN / 希苒

源码仓库：[`HikaQ/world-execute-pv-seran`](https://github.com/HikaQ/world-execute-pv-seran)

一部用 JavaScript、Three.js、WebGL 和 Canvas 制作的粒子叙事音乐短片。

红点从命令行启动，经过坐标空间、正弦波、双螺旋、记忆检索与沙盒边界，最终回到终端中的 `code 0`。代码既生成画面，也作为画面的一部分出现。

这是 **V24 成片对应的源码整理版**。成片为 **3840 × 2160 / 60 FPS / 13147 帧，约 3 分 39 秒**；日常预览为 1920 × 1080。工程由希克君 / HikaQ 策划、导演及迭代，制作过程使用 Codex 辅助编程。工程使用并改编了 FrostNova 的开源渲染代码，具体范围见 [第三方说明](docs/THIRD_PARTY.md)。

> 仓库包含源码、时间轴、字体和静音场景预览，不包含 Mili 的录音、完整歌词、角色原画、成片视频及制作会话记录。缺少外部图片时，演示模式会明确显示占位图；它不等同于最终成片，也不宣称能够直接复现 V24 的全部画面。

## 可以研究什么

- 粒子形变、轨迹生成、连续运镜与逐帧确定性渲染。
- 正弦波、无限走廊、双螺旋、莫比乌斯环等几何动画。
- 玻璃裂纹、错位镜面、Glitch、RGB 色散与亮芯柔光。
- 源码字形融入空间的背景装饰、执行高潮的镜头安排。
- 英文打字机字幕、重复演唱的 `×2 / ×3` 计数；中文保持整句显示。
- 浏览器画面捕获与 FFmpeg 60 FPS 编码。

## 快速开始

需要 Node.js 20 或更新版本，以及支持 WebGL2 的 Chromium 浏览器。

```sh
git clone https://github.com/HikaQ/world-execute-pv-seran.git
cd world-execute-pv-seran
npm ci
npm run check
npm run dev
```

打开终端显示的本机地址，默认 `http://127.0.0.1:4173`。从列表选择片段；拖动进度条定位帧，或播放当前片段。该页面没有音轨；60 FPS 指时间轴与导出帧率，实时播放速度取决于显卡。

不要直接双击场景 HTML，也不要跳过项目服务器：服务器负责加载路径、最终材质处理及版本覆盖。

## 导出静帧与局部样片

首次使用自动捕获时安装 Playwright Chromium：

```sh
npx playwright install chromium
npm run stills -- --demo --frame=2670
npm run stills -- --demo --frame=2670 --4k
```

输出位于 `output/`。如已有 Google Chrome，可通过 `BROWSER_CHANNEL=chrome` 使用它；PowerShell 中先执行 `$env:BROWSER_CHANNEL='chrome'`。

安装 FFmpeg 后可导出**同一片段范围内**的静音视频：

```sh
npm run render -- --demo --frame=2670 --frames=120
npm run render -- --demo --frame=2670 --frames=120 --4k
```

默认使用 `libx264`。支持 NVENC 的环境可追加 `--encoder=h264_nvenc`；通过 `FFMPEG_PATH` 指定 FFmpeg 可执行文件。不会自动下载编码器，也不会静默切换编码方式。原生产环境用 FFmpeg 7.1 完成过 NVENC 编码，但公共版默认不依赖该机器配置。

`--demo` 允许明确标注的图片占位。去掉此参数进入严格模式，缺少原图或回放素材会报错。禁止把演示占位输出当作原成片复现结果。

## 工程结构

| 路径 | 用途 |
|---|---|
| `data/timeline-v24.json` | 最终帧范围与场景入口，包含人物段恢复和 09→10 衔接替换 |
| `data/final-film.json` | 已确认 V24 的规格与文件校验值，不含本机路径 |
| `preview/` | 最终场景及其仍在使用的公共依赖 |
| `preview/film-light-code-v2/` | 全片亮芯柔光、源码装饰与镜头色散 |
| `references/world-execute-web/` | 实际引用的 FrostNova AGPL 引擎及依赖 |
| `assets/fonts/` | 字体与对应 OFL 许可 |
| `tools/` | 公共版服务器、捕获、检查与字幕时序工具 |
| `docs/` | 时间轴索引、来源、外部素材和复现边界 |
| `examples/` | 不使用原曲内容的字幕输入示例 |
| `media.local/` | 自行提供的外部素材，Git 忽略 |
| `output/` | 运行时生成的图片、视频和检查结果，Git 忽略 |

`preview/` 中较小的版本号不一定代表废弃：一些最终场景仍从早期目录导入模块。发布版按依赖提取，保留这些路径，避免改名后破坏导入。**请通过最终时间轴选择入口，不要按目录版本号判断成片版本。**

## 外部素材与复现范围

见 [外部素材说明](docs/ASSETS.md)、[完整场景索引](docs/SCENES.md) 和 [验证记录](docs/VALIDATION.md)。图片可在 `media.local/` 下按原相对路径提供。音乐及歌词需要你自行取得使用权限并配置；仓库不提供下载渠道。

公开预览对缺失图片使用占位图，移除了完整歌词数据，并把片尾和历史回放所需的缓存列为外部输入。因此这是一份可研究、可修改、可运行场景的源码档案，尚不是无外部输入的一键成片工程。跨片段拼接、音轨与最终字幕合成需要另外准备素材并进行校验。

## 许可与署名

代码按 **AGPL-3.0-or-later** 发布，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE.md)。FrostNova 原有版权声明、Three.js 的 MIT 许可、字体 OFL 许可均保留。上游代码中的修改与裁剪记录见 [source-changes.json](docs/source-changes.json)。

Mili 的音乐、歌词、录音、名称和标识，以及第三方角色原画、商标，不因本仓库的代码许可而获得授权。本项目不是 Mili、Anthropic 或 OpenAI 的官方作品。
