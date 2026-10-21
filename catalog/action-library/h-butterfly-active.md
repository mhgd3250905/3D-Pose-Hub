# 仰卧蝴蝶主动开合 / Active supine butterfly

ID: `h-butterfly-active`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "仰卧蝴蝶主动开合",
    "en": "Active supine butterfly"
  },
  "purpose": {
    "zh": "活动大腿内侧",
    "en": "Practise controlled opening and closing of the hips with the soles together while lying on the back."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "adductors"
    ],
    "synergistMuscles": [
      "hip-abductors",
      "glute-max"
    ],
    "equipment": [
      "mat"
    ],
    "position": "supine",
    "scenes": [
      "home"
    ],
    "difficulty": 1,
    "trainingType": "control"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "脚心相对，膝盖慢慢打开再收回",
        "en": "Soles together, open the knees slowly and bring them back"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "仰卧，头肩和骨盆保持承托，双臂放松在体侧",
        "en": "Lie on the back with the head, shoulders and pelvis supported and the arms relaxed beside the body."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "向两侧打开到舒适范围，不用手压膝盖",
        "en": "Open both knees through a comfortable range without pressing on them by hand."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "主动缓慢合回，双脚尽量保持原位，继续呼吸",
        "en": "Close the knees actively and slowly, keeping the feet in place and continuing to breathe."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "用手硬压膝盖、弹振或强迫膝盖碰地",
      "en": "Forcing the knees down by hand, bouncing or insisting they touch the floor."
    },
    {
      "zh": "骨盆和腰背明显拱起，双脚滑动逃开动作",
      "en": "Arching the pelvis and lower back or letting the feet slide away."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "大腿内侧与腹股沟：慢慢开合，不强迫范围；根部疼痛时停止。",
        "en": "Inner thighs and groin: open and close slowly without forcing the range; stop for pain near the groin."
      },
      {
        "zh": "膝与腰：膝随髋活动，保留腰背承托，不对膝施加额外向下压力。",
        "en": "Knees and lower back: move from the hips with the back supported, without adding downward pressure to the knees."
      }
    ],
    "review": {
      "status": "pending",
      "reviewer": null,
      "reviewedAt": null,
      "evidence": []
    }
  },
  "contraindications": {
    "items": [
      {
        "zh": "本动作引发疼痛时停止，不通过增加幅度或负重继续；先向医生或物理治疗师确认。",
        "en": "Stop if this exercise causes pain; do not add range or load before seeking clinical advice."
      },
      {
        "zh": "已有医嘱限制仰卧、髋外展外旋或屈膝活动时，先取得许可。",
        "en": "Obtain clearance first if supine exercise, hip abduction or external rotation, or bent-knee movement has been restricted."
      }
    ],
    "review": {
      "status": "pending",
      "reviewer": null,
      "reviewedAt": null,
      "evidence": []
    }
  },
  "alternatives": [
    "h-adductor-rock"
  ],
  "regressions": [],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 1,
    "reps": 10,
    "restSeconds": 10
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "reps": [
      5,
      15
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_updown",
    "leadSeconds": 0,
    "source": "b003-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.2
      },
      {
        "id": "openKnees",
        "seconds": 1.8
      },
      {
        "id": "openPause",
        "seconds": 0.6
      },
      {
        "id": "closeKnees",
        "seconds": 1.2
      },
      {
        "id": "reset",
        "seconds": 0.2
      }
    ]
  },
  "countingSemantics": "One simultaneous opening and closing of both knees counts as one rep. The 8-second demonstration contains two bilateral reps; default 10 means ten opening-closing reps in total, not ten per knee or a static hold.",
  "movementSides": "Both sides move together; no working-side change.",
  "apps": [
    "hiplab",
    "smartfit"
  ],
  "editorialReview": {
    "status": "pending",
    "reviewer": null,
    "reviewedAt": null,
    "evidence": []
  },
  "editorialNotes": [
    "一轮双膝同时打开再合回算1次，默认10总双侧动作，旧rhythm.reps6不覆盖。",
    "h-adductor-rock为相同内收肌活动目标的不同体位替代候选，需用其自身侧别/剂量，不认定模式等价；同ID缩小开幅是调整，没有验证独立降阶/进阶稳定ID。",
    "源是主动开合，不是持续静态蝴蝶保持；脚底相对但足踝以free轨迹驱动，必须实际看接触，不能由空pins列表判通过。",
    "相位来自catalog/v2/batches/b003.json真实源时间；剂量数字与范围保持旧catalog。rhythm只描述动画，不使用旧reps或holdSeconds来覆盖处方。",
    "具体双语注意、通用禁用筛查、协同肌群与关系均为待审草稿；协同包含稳定/次要拉伸角色，不是额外高亮或肌电激活结论。",
    "关系均为本仓库真实ID候选，不等于已有同模型可发布v2包；不得自动回退弃用模型素材。空关系缺口见逐动作说明。",
    "通用医学筛查证据边界沿用catalog/v2/definition-evidence.md的AAOS/NHS一手资料；不编造疾病特异绝对禁忌，编辑/医学审核均保持pending。"
  ]
}
```

## Six-layer completeness

### definition: incomplete

- editorialReview: review has not passed
- editorialReview: reviewer and reviewedAt required
- editorialReview: review evidence required
- cautions.review: review has not passed
- cautions.review: reviewer and reviewedAt required
- cautions.review: review evidence required
- contraindications.review: review has not passed
- contraindications.review: reviewer and reviewedAt required
- contraindications.review: review evidence required

### source: incomplete

- qa.intersections: review has not passed
- qa.intersections: reviewer and reviewedAt required
- qa.intersections: review evidence required
- qa.intersections: actual frames reviewed required
- qa.handsFeet: review has not passed
- qa.handsFeet: reviewer and reviewedAt required
- qa.handsFeet: review evidence required
- qa.handsFeet: actual frames reviewed required
- qa.propFlicker: review has not passed
- qa.propFlicker: reviewer and reviewedAt required
- qa.propFlicker: review evidence required
- qa.propFlicker: actual frames reviewed required
- qa.loopSeam: review has not passed
- qa.loopSeam: reviewer and reviewedAt required
- qa.loopSeam: review evidence required
- qa.loopSeam: actual frames reviewed required

### masters: incomplete

- all registered skins required, no extra skins
- realistic.geometrySha256: measured SHA required
- realistic.occlusionSha256: measured SHA required
- realistic.measurement: reference missing
- realistic.bodyProps: requires 1080 square / 240 frames / 30fps / 8s
- realistic.bodyProps: alpha required
- realistic.bodyProps.sequence: reference missing
- realistic.highlightMask: requires 1080 square / 240 frames / 30fps / 8s
- realistic.highlightMask: alpha required
- realistic.highlightMask: grayscale and occlusionAware required
- realistic.highlightMask.sequence: reference missing
- realistic.shadow: requires 1080 square / 240 frames / 30fps / 8s
- realistic.shadow: alpha required
- realistic.shadow.sequence: reference missing
- tech-white.geometrySha256: measured SHA required
- tech-white.occlusionSha256: measured SHA required
- tech-white.measurement: reference missing
- tech-white.bodyProps: requires 1080 square / 240 frames / 30fps / 8s
- tech-white.bodyProps: alpha required
- tech-white.bodyProps.sequence: reference missing
- tech-white.highlightMask: requires 1080 square / 240 frames / 30fps / 8s
- tech-white.highlightMask: alpha required
- tech-white.highlightMask: grayscale and occlusionAware required
- tech-white.highlightMask.sequence: reference missing
- tech-white.shadow: requires 1080 square / 240 frames / 30fps / 8s
- tech-white.shadow: alpha required
- tech-white.shadow.sequence: reference missing
- neon-night.geometrySha256: measured SHA required
- neon-night.occlusionSha256: measured SHA required
- neon-night.measurement: reference missing
- neon-night.bodyProps: requires 1080 square / 240 frames / 30fps / 8s
- neon-night.bodyProps: alpha required
- neon-night.bodyProps.sequence: reference missing
- neon-night.highlightMask: requires 1080 square / 240 frames / 30fps / 8s
- neon-night.highlightMask: alpha required
- neon-night.highlightMask: grayscale and occlusionAware required
- neon-night.highlightMask.sequence: reference missing
- neon-night.shadow: requires 1080 square / 240 frames / 30fps / 8s
- neon-night.shadow: alpha required
- neon-night.shadow.sequence: reference missing
- neon-night-b.geometrySha256: measured SHA required
- neon-night-b.occlusionSha256: measured SHA required
- neon-night-b.measurement: reference missing
- neon-night-b.bodyProps: requires 1080 square / 240 frames / 30fps / 8s
- neon-night-b.bodyProps: alpha required
- neon-night-b.bodyProps.sequence: reference missing
- neon-night-b.highlightMask: requires 1080 square / 240 frames / 30fps / 8s
- neon-night-b.highlightMask: alpha required
- neon-night-b.highlightMask: grayscale and occlusionAware required
- neon-night-b.highlightMask.sequence: reference missing
- neon-night-b.shadow: requires 1080 square / 240 frames / 30fps / 8s
- neon-night-b.shadow: alpha required
- neon-night-b.shadow.sequence: reference missing
- hologram.geometrySha256: measured SHA required
- hologram.occlusionSha256: measured SHA required
- hologram.measurement: reference missing
- hologram.bodyProps: requires 1080 square / 240 frames / 30fps / 8s
- hologram.bodyProps: alpha required
- hologram.bodyProps.sequence: reference missing
- hologram.highlightMask: requires 1080 square / 240 frames / 30fps / 8s
- hologram.highlightMask: alpha required
- hologram.highlightMask: grayscale and occlusionAware required
- hologram.highlightMask.sequence: reference missing
- hologram.shadow: requires 1080 square / 240 frames / 30fps / 8s
- hologram.shadow: alpha required
- hologram.shadow.sequence: reference missing
- masters.loopReview: review has not passed
- masters.loopReview: reviewer and reviewedAt required
- masters.loopReview: review evidence required

### derivatives: incomplete

- derivatives.compositor: reference missing
- one framingId required for thumbnails/keyframes
- each skin x light/dark required exactly once; highlight remains a compositor parameter
- realistic.transparentCover: reference missing
- realistic: transparent cover alpha required
- tech-white.transparentCover: reference missing
- tech-white: transparent cover alpha required
- neon-night.transparentCover: reference missing
- neon-night: transparent cover alpha required
- neon-night-b.transparentCover: reference missing
- neon-night-b: transparent cover alpha required
- hologram.transparentCover: reference missing
- hologram: transparent cover alpha required

### voice: incomplete

- voice content review and manual listening must pass

### validation: incomplete

- validation.manifest: reference missing
- validation.review: review has not passed
- validation.review: reviewer and reviewedAt required
- validation.review: review evidence required

## Source and production metadata

```json
{
  "source": {
    "model": {
      "id": "training-human-v2plus",
      "version": "1.0.0-rc2",
      "manifest": {
        "root": "repo",
        "path": "drill-anim/models/training-human-v2plus.json",
        "sha256": "ec2bc815ded157dbc7673e283ed9b6bb1baa710a39ce3a02f88453e8d7fb0a1d",
        "bytes": 6494,
        "normalization": "lf"
      }
    },
    "spec": {
      "root": "repo",
      "path": "drill-anim/specs/h-butterfly-active-r2.js",
      "sha256": "456e6aba8e6a797e9e586a61bf15db739d9e2f6a29ffe5f4e0ea9a7a9e056de4",
      "bytes": 493,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/lib/home-anim.mjs",
        "sha256": "1798c9e55c28b32391b7ef32aa358427b4743ee1959f86ec488a95fe88a05557",
        "bytes": 3691,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/lib/ss-geo.mjs",
        "sha256": "45ca774079e3a85ecc4f924a3220d4baa721f0435e16f6e6e21ffa19e17e8603",
        "bytes": 3700,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/h-butterfly-active.js",
        "sha256": "58be080dfcac5075cb466e7c990e4b1a171da4bc77fb652a6b8865131ff13bb5",
        "bytes": 4318,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.3,
      "end": 8
    },
    "highlightMuscles": [
      "adductors"
    ],
    "qa": {
      "intersections": {
        "status": "pending",
        "reviewer": null,
        "reviewedAt": null,
        "evidence": [],
        "framesReviewed": []
      },
      "handsFeet": {
        "status": "pending",
        "reviewer": null,
        "reviewedAt": null,
        "evidence": [],
        "framesReviewed": []
      },
      "propFlicker": {
        "status": "pending",
        "reviewer": null,
        "reviewedAt": null,
        "evidence": [],
        "framesReviewed": []
      },
      "loopSeam": {
        "status": "pending",
        "reviewer": null,
        "reviewedAt": null,
        "evidence": [],
        "framesReviewed": []
      }
    }
  },
  "masters": {
    "requiredSkins": [
      "realistic",
      "tech-white",
      "neon-night",
      "neon-night-b",
      "hologram"
    ],
    "skins": {},
    "loopReview": {
      "status": "pending",
      "reviewer": null,
      "reviewedAt": null,
      "evidence": []
    }
  },
  "derivatives": {
    "method": "composite-from-masters",
    "mirrored": false,
    "variants": [],
    "transparentCovers": {}
  },
  "voice": {
    "actionId": "h-butterfly-active",
    "manifest": {
      "root": "repo",
      "path": "catalog/voice-v2/batches/b003-manifest.json",
      "sha256": "47fde228ff512eb917eed28dc55c4a923310e628f285e71592043cad3d119978",
      "bytes": 276261
    }
  },
  "validation": {
    "modelVersion": "1.0.0-rc2",
    "mirrorGenerated": false,
    "review": {
      "status": "pending",
      "reviewer": null,
      "reviewedAt": null,
      "evidence": []
    }
  }
}
```
