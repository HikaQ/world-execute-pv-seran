# 来源与改编范围

## FrostNova / world-execute-web

本地参考工程的 README 指向 <https://execute.frostnova.org>。其 LICENSE 与 NOTICE 声明代码使用 **AGPL-3.0-or-later**，Copyright (C) 2026 FrostNova。本发布目录保留原 LICENSE、NOTICE 和 README。

这里实际使用了其 WebGL 渲染引擎、Timeline、粒子和发光线条、形状生成、字形、后处理，以及这些模块导入的依赖。部分场景在该系统上重新编排镜头、轨迹、配色和叙事。`references/` 不是只供观摩的文档目录，它也是运行依赖；不能删除后改称完全独立原创引擎。

公开版保留测得的节拍、onset、音频特征数值，但移除 timing 中的完整歌词文字与逐词文字。源码中出现的完整歌词句子作删节处理；EXECUTION、SIMULATION、INITIALIZATION、AM、PM 等通用画面词与代码标识符保留。完整参考工程的音乐载入页面、封面与音源不纳入包中。

原项目保留了 Vite / Rolldown 生成的文件和查询串；公共版保持这些导入路径。原 README 中部分链接指向上游完整工程，这个裁剪版本不保证包含所有上游网页和编辑工具。

## 运行库与字体

| 内容 | 来源 / 许可 | 处理 |
|---|---|---|
| Three.js 原参考版本 | 上游 vendor，MIT | 保留原文件及 LICENSE |
| Three.js 0.187.0 | npm，MIT | 由锁文件安装，不复制 node_modules |
| Playwright 1.65.0 | npm，Apache-2.0 | 仅用于离线浏览器捕获 |
| Vite / Rolldown 辅助运行代码 | 原参考构建产物，MIT | 独立许可文本见 licenses/ |
| JetBrains Mono / Space Grotesk | SIL OFL 1.1 | 附原许可 |
| Noto Sans SC 与字幕、署名子集 | SIL OFL 1.1 | 附 NotoSansSC-OFL.txt；credit-name.ttf 同源 |
| Anton / Space Mono | SIL OFL 1.1 | 附原许可 |

## 音乐与其他标识

音乐作品是 Mili 的 `world.execute (me) ;`。本仓库不包含录音、完整歌词与官方中文翻译，也不赋予这些内容的使用许可。

参考依赖中可能保留 Claude 标识生成代码；片尾模拟界面使用 Codex 名称。对应商标仍属于各自权利人，不属于 AGPL 授权对象。这里的界面、运行日志和错误窗口是影片表现，不执行对外部系统的攻击或逃逸。

## 早期研究

制作早期还参考过 MisakaZentai/world-execute-me-dsh-pv（MIT）和 yym8224961/world.execute-me-ascii 的视觉表达。该发布包不包含早期 Python v7 渲染器或后一项目的源码。若未来加入早期实验代码，应另行复核其来源与许可，不能直接沿用当前文件清单。
