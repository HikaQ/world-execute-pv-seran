# world.execute(me) · SERAN / 希苒

一部用 JavaScript、Three.js、WebGL 和 Canvas 制作的粒子叙事音乐短片。

红点从命令行启动，经过坐标空间、正弦波、双螺旋、记忆检索与沙盒边界，最终回到终端中的 `code 0`。代码既生成画面，也作为画面的一部分出现。

这里公开的是本片**最终版（第 24 版）的源码**。视频时长约 **3 分 39 秒**，成片规格为 **4K / 60 FPS**，日常预览使用 1080p。作品由希克君 / HikaQ 策划、导演与制作，使用 Codex 辅助编程。项目使用并改编了 FrostNova 的开源渲染代码，详见 [第三方说明](docs/THIRD_PARTY.md)。

> 仓库提供场景源码、时间轴、字体和静音预览。音乐、完整歌词及角色原画需自行准备；缺少图片时，预览会显示占位图。所需素材及配置方式见 [外部素材说明](docs/ASSETS.md)。

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

`--demo` 会为缺失的图片显示带标注的占位图。去掉此参数进入严格模式，缺少原图或回放素材时会报错；请按 [外部素材说明](docs/ASSETS.md) 补齐素材。

## 工程结构

| 路径 | 用途 |
|---|---|
| `data/timeline-v24.json` | 最终成片的镜头时间轴、帧范围与场景入口 |
| `data/final-film.json` | 最终成片的分辨率、帧率、时长与文件校验值 |
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

公开版支持场景预览与局部视频导出。制作完整视频时，需要补齐角色图片、历史镜头回放、片尾底图、音乐和歌词，再拼接片段、合成音轨与字幕，并检查最终效果。

## 许可与署名

代码按 **AGPL-3.0-or-later** 发布，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE.md)。FrostNova 原有版权声明、Three.js 的 MIT 许可、字体 OFL 许可均保留。上游代码中的修改与裁剪记录见 [source-changes.json](docs/source-changes.json)。

Mili 的音乐、歌词、录音、名称和标识，以及第三方角色原画、商标，不因本仓库的代码许可而获得授权。本项目不是 Mili、Anthropic 或 OpenAI 的官方作品。
