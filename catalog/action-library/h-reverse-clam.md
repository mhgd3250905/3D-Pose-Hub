# 侧卧反向蚌式 / Side-lying reverse clam

ID: `h-reverse-clam`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "侧卧反向蚌式",
    "en": "Side-lying reverse clam"
  },
  "purpose": {
    "zh": "练臀部",
    "en": "Train controlled internal rotation of the top hip while keeping the knees together in side lying."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "hip-abductors",
      "glute-max"
    ],
    "synergistMuscles": [
      "obliques",
      "deltoids"
    ],
    "equipment": [
      "mat"
    ],
    "position": "side_lying",
    "scenes": [
      "home"
    ],
    "difficulty": 1,
    "trainingType": "strength"
  },
  "unilateral": true,
  "startingSide": "right",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "膝盖并拢，小腿慢慢向上抬",
        "en": "Knees together, lift the shin up slowly"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左侧卧，用左前臂承托，右手轻放上侧髋部",
        "en": "Lie on the left side supported by the left forearm, with the right hand resting on the upper hip."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "双膝保持并拢，只让上侧右脚和小腿抬起",
        "en": "Keep the knees together and lift only the upper right foot and shin."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "骨盆上下叠放，缓慢下放，不向后翻身",
        "en": "Keep the pelvis stacked and lower slowly without rolling backwards."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "膝盖分开，做成普通蚌式开膝",
      "en": "Separating the knees into a regular open-knee clamshell."
    },
    {
      "zh": "翻骨盆、耸肩或甩上侧脚来增加高度",
      "en": "Rolling the pelvis, shrugging or swinging the upper foot to gain height."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝与髋：膝盖轻靠，不夹紧或强扭；小腿抬起的幅度保持舒适。",
        "en": "Knees and hips: keep the knees gently together without squeezing or forcing rotation, and lift through a comfortable range."
      },
      {
        "zh": "左肩肘与颈：前臂稳定承托，不把身体重量全部沉进肩颈。",
        "en": "Left shoulder, elbow and neck: support steadily through the forearm without collapsing the body into the shoulder and neck."
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
        "zh": "已有医嘱限制侧卧前臂支撑、髋内旋或膝部活动时，先取得许可。",
        "en": "Obtain clearance first if side-lying forearm support, hip internal rotation or knee movement has been restricted."
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
    "h-9090-liftoff"
  ],
  "regressions": [],
  "progressions": [
    "h-9090-liftoff"
  ],
  "defaultDose": {
    "mode": "reps",
    "sets": 2,
    "reps": 12,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      3
    ],
    "reps": [
      6,
      18
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
        "seconds": 0.3
      },
      {
        "id": "liftUpperRightFoot",
        "seconds": 1.1
      },
      {
        "id": "topHold",
        "seconds": 0.9
      },
      {
        "id": "lowerUpperRightFoot",
        "seconds": 1.2
      },
      {
        "id": "reset",
        "seconds": 0.5
      }
    ]
  },
  "countingSemantics": "One upper-right-foot/shin lift and controlled lowering counts as one rep with knees together. The 8-second clip contains two right-hip reps while lying on the left side and no side change. Preserve default 12; proposed 12 per working side (six loops) remains editorial pending. Change externally only after the side dose; no mirrored media is produced.",
  "movementSides": "Lie on left forearm/side; right upper foot lifts via hip internal rotation with knees together. Available loop boundary after the side dose, not an in-clip or every-loop forced switch.",
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
    "startingSide=right指上侧主动内旋髋，left是支撑侧；2个右侧rep/8秒，无片内换边。默认12保持数值，提出每侧12（6loops）但原记录无明确perSide字段，编辑待审。",
    "h-9090-liftoff为其已有替代关系的反向同髋内旋目标候选，90/90坐姿更高活动范围要求可列进阶候选，不认定固定难度顺序；同模式独立降阶ID未核定。",
    "左手原mode=floor且左前臂支撑保留；不因新掌厚度静默改free丢锁。",
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
      "path": "drill-anim/specs/h-reverse-clam-r2.js",
      "sha256": "6e06c76df67281092de9a2adca75f84c29501af77786b202e802319b322a4bd7",
      "bytes": 485,
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
        "path": "drill-anim/specs/h-reverse-clam.js",
        "sha256": "d6dc4d1b87390a988f617381cb2bc8fe5d6cac45d353ba9fae84e550aef97db2",
        "bytes": 4480,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 1.8,
      "end": 8,
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "Lie on left forearm/side; right upper foot lifts via hip internal rotation with knees together. Available loop boundary after the side dose, not an in-clip or every-loop forced switch. One upper-right-foot/shin lift and controlled lowering counts as one rep with knees together. The 8-second clip contains two right-hip reps while lying on the left side and no side change. Preserve default 12; proposed 12 per working side (six loops) remains editorial pending. Change externally only after the side dose; no mirrored media is produced."
      }
    },
    "highlightMuscles": [
      "hip-abductors",
      "glute-max"
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
    "demonstratedSide": "right",
    "oppositeSideMedia": "not-produced"
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
    "actionId": "h-reverse-clam",
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
