# 外部素材与本地补齐

源码包默认不附带以下内容：

| 类别 | 原用途 | 公开版处理 |
|---|---|---|
| Mili 录音、完整中英文歌词 | 音轨与双语字幕 | 不分发；字幕逻辑保留，输入示例使用原创测试文字 |
| 希苒角色原画 | 开场身份图、眼睛裂镜采样 | 使用标注的中性占位图，不复制原图 |
| EXECUTION 历史回放序列 | 复用先前镜头的短促回忆 | 不分发缓存 JPEG；演示时使用占位图 |
| 片尾最终红点底图 | 最后两秒双语声明的底图 | 不分发旧导出目录；演示时使用占位图 |
| 原制作会话、用户截图、规划与交接日志 | 制作记录 | 不分发 |
| 成片、预览视频、FFmpeg 二进制、node_modules | 输出与机器环境 | 不分发 |

若你有合法可用的替代图片，在 `media.local/` 中保留对应相对路径，例如：

```text
media.local/
  assets/char/seran-avatar-user-20261110.png
  out/full-film-review-v3/checks/final-frame.png
  preview/refinement-execution-v14/recall/<key>/0000.jpg
```

文件名、尺寸与裁切含义可以查看 [external-assets.json](external-assets.json)、眼睛场景的 `EYE_SOURCE` 和 execution 的 `recall-manifest.json`。个别依赖也可能请求 `refinement-execution-v1/recall/`；按运行报告中的具体地址补齐。回放路径里版本号是导入约定；实际缓存内容需按你自己的最终画面生成，不应随意恢复旧版本画面。

静态依赖清单与实际运行时发现的占位地址都记录在清单中。运行 `npm run stills -- --smoke --demo` 后，`output/smoke-report.json` 会给出该次执行触达的路径。抽样检查不保证涵盖每个历史回放 key；完整恢复仍须遍历时间轴。

`media.local/`、`output/` 和音视频扩展名均被 Git 忽略。发布前仍以明确文件清单为准，避免对原生产目录直接执行全量添加。

数值形式的节拍和音频特征不包含可播放的歌曲录音。保留这些数据是为了记录镜头节奏，不提供歌曲下载功能。
