# 坐姿后撑单膝内倒 / Seated knee drop-in

ID: `n-seated-ir-drop`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "坐姿后撑单膝内倒",
    "en": "Seated knee drop-in"
  },
  "purpose": {
    "zh": "活动臀部",
    "en": "Practise controlled alternating hip internal rotation while sitting with the hands supported behind the body."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "glute-max",
      "hip-abductors"
    ],
    "synergistMuscles": [
      "triceps",
      "deltoids",
      "abs"
    ],
    "equipment": [
      "mat"
    ],
    "position": "seated",
    "scenes": [
      "home"
    ],
    "difficulty": 1,
    "trainingType": "control"
  },
  "unilateral": true,
  "startingSide": "right",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "手在身后撑地，一侧膝盖向内倒",
        "en": "Hands behind you, drop one knee inward"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "屈膝宽站脚，双手在身后稳定撑垫",
        "en": "Sit with bent knees and feet wide, keeping the hands supported steadily behind you."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "先让右膝向内缓慢下落，双脚保持踩稳",
        "en": "Lower the right knee inwards slowly first while both feet stay planted."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "回到中间再换左侧，不强压膝盖或翻动骨盆",
        "en": "Return through the centre before changing left without pushing the knee down or rolling the pelvis."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "手脚滑动、肩膀塌陷，靠移动脚来躲开髋内旋",
      "en": "Letting the hands or feet slide, collapsing the shoulders or moving a foot to avoid hip internal rotation."
    },
    {
      "zh": "用手压膝盖、突然倒膝或强扭膝踝",
      "en": "Pressing the knee down by hand, dropping suddenly or twisting the knee or ankle forcefully."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝踝与髋：膝盖向内的幅度以舒适为限，不对固定脚强行扭转。",
        "en": "Knees, ankles and hips: use a comfortable inward knee range without forcing rotation over a planted foot."
      },
      {
        "zh": "手腕与肩：后撑保持稳定，躯干后倾以能舒适承托为限。",
        "en": "Wrists and shoulders: keep the rear support stable and lean back only as far as you can support comfortably."
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
        "zh": "已有医嘱限制手掌负重、肩部后伸、髋内旋或膝踝旋转时，先取得许可。",
        "en": "Obtain clearance first if palm weight bearing, shoulder extension, hip internal rotation or knee or ankle rotation has been restricted."
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
    "h-reverse-clam"
  ],
  "regressions": [],
  "progressions": [
    "h-9090-liftoff"
  ],
  "defaultDose": {
    "mode": "time",
    "sets": 1,
    "seconds": 30,
    "restSeconds": 15
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "seconds": [
      15,
      60
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_alternate",
    "leadSeconds": 0,
    "source": "b003-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "dropWorkingKneeIn",
        "seconds": 1.5
      },
      {
        "id": "innerPause",
        "seconds": 1.0
      },
      {
        "id": "returnKneeUpright",
        "seconds": 1.1
      },
      {
        "id": "reset",
        "seconds": 0.1
      }
    ]
  },
  "countingSemantics": "The 8-second source shows one right-knee drop/return followed by one left-knee drop/return; each peak lasts only 1 second. Preserve the legacy 30-second-per-side static-hold prescription as an unresolved requirement. Alternating dynamic loops must not be represented as a continuous 30-second hold. Editorial and playback reconciliation remain pending.",
  "movementSides": "Right knee drops inward first with the right foot planted; the left knee follows after 4 seconds. Both hands remain supporting behind the hips.",
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
    "旧审核明确每侧30秒static hold，数值及每侧处方保留；源实际右左交替，每侧仅1秒plateau且4秒换侧。不得把循环示范写成已执行每侧30秒静态保持；需要编辑/播放裁决，继续pending。",
    "新wrapper保留h0求解、左右手脚floor锁和arm reach176；掌面厚度问题应由后续独立修订解决，不能改free丢锁。",
    "h-reverse-clam为同髋内旋目标但主动/侧卧支撑不同的替代候选；h-9090-liftoff为90/90主动末端控制候选进阶，非等价静态hold处方。独立同模式降阶未核定。",
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
      "path": "drill-anim/specs/n-seated-ir-drop-r2.js",
      "sha256": "fbce029f4aeff239e37c43013722c572f256306ac24517a5089514e70b1bd586",
      "bytes": 489,
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
        "path": "drill-anim/specs/n-seated-ir-drop.js",
        "sha256": "48e44c56e8c7de96f905d2f572c85368cab18ac313ba2413942c22726c49676a",
        "bytes": 3831,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.2,
      "end": 8,
      "switchPoint": {
        "kind": "in-clip",
        "seconds": 4,
        "semantics": "Right knee drops inward first with the right foot planted; the left knee follows after 4 seconds. Both hands remain supporting behind the hips. The 8-second source shows one right-knee drop/return followed by one left-knee drop/return; each peak lasts only 1 second. Preserve the legacy 30-second-per-side static-hold prescription as an unresolved requirement. Alternating dynamic loops must not be represented as a continuous 30-second hold. Editorial and playback reconciliation remain pending."
      }
    },
    "highlightMuscles": [
      "glute-max",
      "hip-abductors"
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
    },
    "demonstratedSide": "both"
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
    "actionId": "n-seated-ir-drop",
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
