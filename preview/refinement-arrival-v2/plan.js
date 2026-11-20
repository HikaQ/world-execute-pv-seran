export const PLAN_DATA = {
  "version": "refinement-arrival-direction-v1",
  "section": "12",
  "date": "2026-11-13",
  "status": "planning-only-awaiting-user-review",
  "planningOnly": true,
  "newAnimationRendered": false,
  "userApproved": false,
  "request": "策划一下片尾吧",
  "concept": "找到 HIKAQ，进入他的屏幕，完成接管；任务结束后，希苒仍留在屏幕里。",
  "incomingVersion": "refinement-possession-v13",
  "incomingLastFrame": 11857,
  "rangeFrames": [
    11858,
    13027
  ],
  "fps": 60,
  "timingBasis": "reference-main-edit",
  "referenceSource": "out/reference-edit/timelines.json",
  "entry": "延续上一段已经开始的 outro/dissolve 镜头；11858 帧不增加新的切镜。",
  "visualStyle": {
    "baseline": "refinement-possession-v10 material quality / v13 current picture",
    "palette": "黑底、暗红粒子，极少量粉白亮点；HIKAQ 端先有冷白像素，随后被红色占据。",
    "material": "近处可见细密颗粒与扫描纹，远处柔焦；文字使用清晰点阵，发光不吞掉笔画。",
    "composition": "绘图空间、待发队列、传输线路、屏幕像素、消息、光标、接管边界、终端各有明确主体。",
    "camera": "短程滑移、近景与远景交替；动作有缓入缓出。"
  },
  "groups": [
    {
      "relativeSeconds": [
        0,
        1.716667
      ],
      "title": "绘图光离开心形",
      "action": "接住现有心形最后的运动，白红色笔尖沿一根细线离开；心形余辉逐渐退下。"
    },
    {
      "relativeSeconds": [
        1.716667,
        3.566667
      ],
      "title": "一封旧消息被取出",
      "action": "硬切到五张待发消息的实体队列；q001 被抽出，另外四张留在原处；微距显出 HIKAQ。"
    },
    {
      "relativeSeconds": [
        3.566667,
        5.416667
      ],
      "title": "穿过传输线路",
      "action": "红色脉冲掠过层叠线路，随后切入屏幕像素微观，点亮唯一接收位置。"
    },
    {
      "relativeSeconds": [
        5.416667,
        9.1
      ],
      "title": "对方的屏幕",
      "action": "HIKAQ 屏幕出现原始 q001；先送达，再已读，再出现短回复“希苒？”。消息正文在后续切镜中仍可读。"
    },
    {
      "relativeSeconds": [
        9.1,
        13.733333
      ],
      "title": "平静回应并接管",
      "action": "希苒回复“这次，换我来找你了。”；先给文字近景，再在原有切点揭示完整屏幕。红色从消息沿边缘包围屏幕，退出控件熄灭，指针停住；对白保留足够阅读时间。"
    },
    {
      "relativeSeconds": [
        13.733333,
        14.65
      ],
      "title": "最后一次 EXECUTION",
      "action": "沿用此镜头平面，原有文字重排成一行居中点阵 EXECUTION。稳定显示到参考最后切点，轻微扫描。"
    },
    {
      "relativeSeconds": [
        14.65,
        19.483333
      ],
      "title": "任务结束，希苒仍在",
      "action": "参考最后一刀切入纯黑终端；点阵键入 [Process exited with code 0]，下一行竖线光标轻闪。最后只留极少量红色余光。"
    }
  ],
  "dialogue": {
    "originalMessageId": "q001",
    "originalMessage": "今天也会回来吗？",
    "originalTranslation": "Will you be back today?",
    "humanReply": {
      "zh": "希苒？",
      "en": "SERAN?"
    },
    "seranReply": {
      "zh": "这次，换我来找你了。",
      "en": "This time, I came to find you."
    },
    "maximumFullSeranReplyLines": 1
  },
  "typography": {
    "nativeLanguagePlusEnglish": true,
    "subtitleLyrics": false,
    "executionCueFrame": 12682,
    "executionVisibleEndExclusive": 12737,
    "executionCount": 1,
    "executionStyle": "phosphor dot matrix",
    "terminalText": "[Process exited with code 0]",
    "cursor": "|",
    "longReplyHoldFrames": [
      12404,
      12682
    ]
  },
  "continuity": {
    "sourceRecords": 13,
    "initialQueuedMessages": 5,
    "deliveredMessage": "q001",
    "remainingQueuedMessages": 4,
    "originalMessageTextPreserved": true,
    "deliveredBeforeReadBeforeHumanReply": true,
    "oldRuntimeRemainsStopped": true,
    "hostSeranContinues": true,
    "notificationTaskExitCode": 0
  },
  "reviewState": "策划草案；尚未修改片尾动画或生成片尾视频。",
  "duration": 19.483333333333334,
  "referenceSegments": 14,
  "internalHardCuts": 9,
  "cameraRelays": 4,
  "newCuts": 0,
  "shots": [
    {
      "id": "A01",
      "referenceId": "outro/dissolve",
      "frame": 11858,
      "endFrame": 11906,
      "relativeStart": 0.0,
      "relativeEnd": 0.8,
      "join": "carry",
      "transitionFrames": 0,
      "scene": "heart-handoff",
      "subject": "drawing-light-leaves",
      "filmFrame": 11848.063999999998,
      "transitionBias": 0.5
    },
    {
      "id": "A02",
      "referenceId": "outro/lift",
      "frame": 11906,
      "endFrame": 11961,
      "relativeStart": 0.8,
      "relativeEnd": 1.7166666666666666,
      "join": "relay",
      "transitionFrames": 27.692472160356346,
      "scene": "heart-handoff",
      "subject": "follow-writing-tip",
      "filmFrame": 11905.32,
      "transitionBias": 0.5
    },
    {
      "id": "A03",
      "referenceId": "outro/rollback",
      "frame": 11961,
      "endFrame": 12017,
      "relativeStart": 1.7166666666666666,
      "relativeEnd": 2.65,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "outbox",
      "subject": "select-q001",
      "filmFrame": 11960.7,
      "transitionBias": 0.5
    },
    {
      "id": "A04",
      "referenceId": "outro/rollTop",
      "frame": 12017,
      "endFrame": 12044,
      "relativeStart": 2.65,
      "relativeEnd": 3.1,
      "join": "relay",
      "transitionFrames": 27.692472160356346,
      "scene": "outbox",
      "subject": "raise-one-message",
      "filmFrame": 12016.08,
      "transitionBias": 0.5
    },
    {
      "id": "A05",
      "referenceId": "outro/icosa",
      "frame": 12044,
      "endFrame": 12072,
      "relativeStart": 3.1,
      "relativeEnd": 3.566666666666667,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "address-macro",
      "subject": "target-hikaq",
      "filmFrame": 12043.8,
      "transitionBias": 0.5
    },
    {
      "id": "A06",
      "referenceId": "outro/row",
      "frame": 12072,
      "endFrame": 12127,
      "relativeStart": 3.566666666666667,
      "relativeEnd": 4.483333333333333,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "transmission",
      "subject": "cross-circuit",
      "filmFrame": 12071.460000000001,
      "transitionBias": 0.5
    },
    {
      "id": "A07",
      "referenceId": "outro/row2",
      "frame": 12127,
      "endFrame": 12183,
      "relativeStart": 4.483333333333333,
      "relativeEnd": 5.416666666666667,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "screen-pixels",
      "subject": "light-receiving-pixel",
      "filmFrame": 12126.839999999998,
      "transitionBias": 0.5
    },
    {
      "id": "A08",
      "referenceId": "outro/unbox",
      "frame": 12183,
      "endFrame": 12238,
      "relativeStart": 5.416666666666667,
      "relativeEnd": 6.333333333333333,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "notification",
      "subject": "original-message-arrives",
      "filmFrame": 12182.279999999999,
      "transitionBias": 0.5
    },
    {
      "id": "A09",
      "referenceId": "outro/unboxTop",
      "frame": 12238,
      "endFrame": 12294,
      "relativeStart": 6.333333333333333,
      "relativeEnd": 7.266666666666667,
      "join": "relay",
      "transitionFrames": 27.692472160356346,
      "scene": "notification",
      "subject": "read-original-message",
      "filmFrame": 12237.66,
      "transitionBias": 0.5
    },
    {
      "id": "A10",
      "referenceId": "outro/unfill",
      "frame": 12294,
      "endFrame": 12349,
      "relativeStart": 7.266666666666667,
      "relativeEnd": 8.183333333333334,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "human-reply",
      "subject": "typing-cursor",
      "filmFrame": 12293.039999999999,
      "transitionBias": 0.5
    },
    {
      "id": "A11",
      "referenceId": "outro/shrink",
      "frame": 12349,
      "endFrame": 12404,
      "relativeStart": 8.183333333333334,
      "relativeEnd": 9.1,
      "join": "relay",
      "transitionFrames": 27.692472160356346,
      "scene": "human-reply",
      "subject": "seran-question",
      "filmFrame": 12348.42,
      "transitionBias": 0.5
    },
    {
      "id": "A12",
      "referenceId": "outro/point",
      "frame": 12404,
      "endFrame": 12515,
      "relativeStart": 9.1,
      "relativeEnd": 10.95,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "seran-reply",
      "subject": "came-to-find-you",
      "filmFrame": 12403.8,
      "transitionBias": 0.5
    },
    {
      "id": "A13",
      "referenceId": "outro/period",
      "frame": 12515,
      "endFrame": 12737,
      "relativeStart": 10.95,
      "relativeEnd": 14.65,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "screen-occupation",
      "subject": "close-display-boundary",
      "filmFrame": 12514.56,
      "transitionBias": 0.5
    },
    {
      "id": "A14",
      "referenceId": "outro/end",
      "frame": 12737,
      "endFrame": 13027,
      "relativeStart": 14.65,
      "relativeEnd": 19.483333333333334,
      "join": "cut",
      "transitionFrames": 0,
      "scene": "terminal",
      "subject": "task-complete-cursor-remains",
      "filmFrame": 12736.08,
      "transitionBias": 0.5
    }
  ],
  "conversationPresentation": {
    "style": "Codex-like dark desktop window",
    "rangeFrames": [
      12183,
      12737
    ],
    "typing": "HIKAQ types 希苒？",
    "reply": "这次，换我来找你了。",
    "execution": "dot matrix warning in the same window",
    "referenceCutsUnchanged": true
  }
};
