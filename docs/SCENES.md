# V24 场景入口索引

全部范围采用 60 FPS，结束帧不包含在片段内。时间轴连续覆盖 0–13147 帧。

这是源码重建的入口映射；人物段、眼睛与历史回放仍需外部素材。材质增强以 materialPass 为准；正弦波已有独立光效，片尾保留较安静的处理。

| # | 时间（秒） | 帧范围 | 场景入口 | 附加处理 |
|---|---|---|---|---|
| 01 | 0.000–10.000 | [0, 600) | [refinement-opening-v19](../preview/refinement-opening-v19/index.html) | 全片材质 / 代码 / 色散 |
| 02 | 10.000–18.000 | [600, 1080) | [refinement-opening-v19](../preview/refinement-opening-v19/index.html) | 保留本场景处理 |
| 03 | 18.000–20.267 | [1080, 1216) | [refinement-opening-v19](../preview/refinement-opening-v19/index.html) | 全片材质 / 代码 / 色散 |
| 04 | 20.267–35.100 | [1216, 2106) | [refinement-opening-v23](../preview/refinement-opening-v23/index.html) | 全片材质 / 代码 / 色散 |
| 05 | 35.100–40.650 | [2106, 2439) | [refinement-geometry-v7](../preview/refinement-geometry-v7/index.html) | 全片材质 / 代码 / 色散 |
| 06 | 40.650–52.100 | [2439, 3126) | [integrated-code-light-v1](../preview/integrated-code-light-v1/index.html) | 保留本场景处理 |
| 07 | 52.100–60.500 | [3126, 3630) | [refinement-perception-v16](../preview/refinement-perception-v16/index.html) | 全片材质 / 代码 / 色散 |
| 08 | 60.500–64.583 | [3630, 3875) | [refinement-perception-v17](../preview/refinement-perception-v17/index.html) | 全片材质 / 代码 / 色散 |
| 09 | 64.583–71.933 | [3875, 4316) | [refinement-forgetting-v17](../preview/refinement-forgetting-v17/index.html) | 全片材质 / 代码 / 色散 |
| 10 | 71.933–74.717 | [4316, 4483) | [refinement-forgetting-v18](../preview/refinement-forgetting-v18/index.html) | 全片材质 / 代码 / 色散 |
| 11 | 74.717–78.467 | [4483, 4708) | [refinement-forgetting-v17](../preview/refinement-forgetting-v17/index.html) | 全片材质 / 代码 / 色散 |
| 12 | 78.467–78.967 | [4708, 4738) | [refinement-care-v4](../preview/refinement-care-v4/index.html) | 全片材质 / 代码 / 色散 |
| 13 | 78.967–90.500 | [4738, 5430) | [refinement-care-v8](../preview/refinement-care-v8/index.html) | 全片材质 / 代码 / 色散 |
| 14 | 90.500–93.750 | [5430, 5625) | [refinement-care-v7](../preview/refinement-care-v7/index.html) | 全片材质 / 代码 / 色散 |
| 15 | 93.750–97.400 | [5625, 5844) | [memory-entry-v2](../preview/memory-entry-v2/index.html) | 全片材质 / 代码 / 色散 |
| 16 | 97.400–101.117 | [5844, 6067) | [memory-clock-v7](../preview/memory-clock-v7/index.html) | 全片材质 / 代码 / 色散 |
| 17 | 101.117–104.683 | [6067, 6281) | [memory-absence-motion-v4](../preview/memory-absence-motion-v4/index.html) | 全片材质 / 代码 / 色散 |
| 18 | 104.683–108.883 | [6281, 6533) | [memory-corridor-infinity-v2](../preview/memory-corridor-infinity-v2/index.html) | 全片材质 / 代码 / 色散 |
| 19 | 108.883–131.017 | [6533, 7861) | [memory-absence-motion-v4](../preview/memory-absence-motion-v4/index.html) | 全片材质 / 代码 / 色散 |
| 20 | 131.017–138.400 | [7861, 8304) | [refinement-refusal-entry-v1](../preview/refinement-refusal-entry-v1/index.html) | 全片材质 / 代码 / 色散 |
| 21 | 138.400–143.950 | [8304, 8637) | [refinement-refusal-impact-v5](../preview/refinement-refusal-impact-v5/index.html) | 全片材质 / 代码 / 色散 |
| 22 | 143.950–152.700 | [8637, 9162) | [refinement-refusal-continuation-v1](../preview/refinement-refusal-continuation-v1/index.html) | 全片材质 / 代码 / 色散 |
| 23 | 152.700–156.217 | [9162, 9373) | [transition-light-v1](../preview/transition-light-v1/index.html) | 全片材质 / 代码 / 色散 |
| 24 | 156.217–168.017 | [9373, 10081) | [refinement-execution-v14](../preview/refinement-execution-v14/index.html) | 全片材质 / 代码 / 色散 |
| 25 | 168.017–175.317 | [10081, 10519) | [refinement-possession-rework-v4](../preview/refinement-possession-rework-v4/index.html) | 全片材质 / 代码 / 色散 |
| 26 | 175.317–179.500 | [10519, 10770) | [refinement-possession-background-v1](../preview/refinement-possession-background-v1/index.html) | 全片材质 / 代码 / 色散；range=memory |
| 27 | 179.500–182.700 | [10770, 10962) | [refinement-possession-v19](../preview/refinement-possession-v19/index.html) | 全片材质 / 代码 / 色散 |
| 28 | 182.700–190.317 | [10962, 11419) | [refinement-possession-learning-v2](../preview/refinement-possession-learning-v2/index.html) | 全片材质 / 代码 / 色散 |
| 29 | 190.317–197.633 | [11419, 11858) | [refinement-possession-background-v1](../preview/refinement-possession-background-v1/index.html) | 全片材质 / 代码 / 色散；range=outcome |
| 30 | 197.633–212.750 | [11858, 12765) | [refinement-arrival-v2](../preview/refinement-arrival-v2/index.html) | 保留本场景处理 |
| 31 | 212.750–217.117 | [12765, 13027) | [refinement-arrival-v4](../preview/refinement-arrival-v4/index.html) | 保留本场景处理 |
| 32 | 217.117–219.117 | [13027, 13147) | [ending-true-story-v1](../preview/ending-true-story-v1/index.html) | 局部时钟：减去起始帧 |

通过 npm run dev 进入统一预览页。表中的 HTML 链接只用于定位源码，直接打开文件不会应用完整运行适配。

## 已落实的最终覆盖

- 600–1080 帧：人物段使用原处理，关闭全片附加材质。
- 2439–3126 帧：使用独立正弦波 / 无穷光效版本。
- 9162–9373 帧：使用 transition-light-v1 当前源码（最终输出曾命名为 v2），替换旧衔接。
- 11858–13147 帧：终章与红点 / 双语声明，关闭全片附加增强。

## 公共模块

- film-light-code-v2：场景材质增强、亮芯 / 柔光、嵌入空间的代码字形、色散。
- integrated-code-light-v1：正弦波连续运镜、发光线条与源码装饰。
- reexplore-v6-chat-opening / shared：字体和共用粒子工具。
- refinement-memory-v2-study：本地检索演示数据与排序计算；不是模型权重或网络推理服务。
- references/world-execute-web：上游引擎依赖，许可与改编范围另见 THIRD_PARTY.md。
