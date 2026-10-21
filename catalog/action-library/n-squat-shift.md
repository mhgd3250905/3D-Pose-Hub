# 低位蹲姿左右移重心 / Deep squat side shift

ID: `n-squat-shift`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "低位蹲姿左右移重心",
    "en": "Deep squat side shift"
  },
  "purpose": {
    "zh": "活动大腿内侧和臀部",
    "en": "Practise controlled side-to-side weight shifts in a low wide squat to mobilise the inner thighs and hips."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "adductors",
      "glute-max"
    ],
    "synergistMuscles": [
      "quadriceps",
      "abs"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home"
    ],
    "difficulty": 3,
    "trainingType": "control"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "低蹲，重心慢慢左右移",
        "en": "Stay low and shift your weight side to side"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "双脚宽站，脚尖朝外，脚跟持续踩稳",
        "en": "Stand wide with the toes turned out and keep the heels planted."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "先移向左脚承重，再回中换右侧，不急着滑过中间",
        "en": "Shift towards the left foot first, return through the centre, then shift right without rushing."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "胸口抬起，膝盖沿脚尖方向移动",
        "en": "Keep the chest lifted and let the knees follow the toes."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "膝盖内扣、脚跟离地或脚底滑动",
      "en": "Collapsing a knee inwards, lifting a heel or letting the feet slide."
    },
    {
      "zh": "猛甩重心、塌腰，或不断起身代替低位转移",
      "en": "Throwing the weight, collapsing the back or standing up instead of shifting in the low position."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝与踝：保持脚跟稳定，承重侧膝盖跟随脚尖方向。",
        "en": "Knees and ankles: keep the heels stable and align the loaded knee with the toes."
      },
      {
        "zh": "髋与腰背：只在能控制的蹲深和侧移幅度内练习，避免弹振。",
        "en": "Hips and lower back: use a squat depth and side-shift range you can control without bouncing."
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
        "zh": "已有医嘱限制深蹲、侧向负重转移或髋膝活动时，先取得许可。",
        "en": "Obtain clearance first if deep squatting, sideways weight transfer or hip or knee movement has been restricted."
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
  "regressions": [
    "h-adductor-rock"
  ],
  "progressions": [
    "adductors-A"
  ],
  "defaultDose": {
    "mode": "reps",
    "sets": 1,
    "reps": 8,
    "restSeconds": 15
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "reps": [
      4,
      12
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_alternate",
    "leadSeconds": 0,
    "source": "b002-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "shiftTowardsLoadedSide",
        "seconds": 1.5
      },
      {
        "id": "sidePause",
        "seconds": 1.0
      },
      {
        "id": "returnCentre",
        "seconds": 1.2
      }
    ]
  },
  "countingSemantics": "One shift towards one side and return to centre counts as one rep. The 8-second clip shifts left then right, for two total alternating reps; default reps=8 means eight total shifts (four per direction), not eight per side. Both feet remain planted and legacy unilateral=false is retained for bilateral-supported weight-transfer control.",
  "movementSides": "Both feet stay planted; first load shift is towards the left foot, then towards the right at 4 seconds. This is a direction change within bilateral-supported movement, not a single-leg demonstration.",
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
    "双足持续支撑的移重心控制保留旧unilateral=false；运动方向先左后右，不能与单腿侧抬的workingSide混用。",
    "旧catalog明确左右交替各算1次；默认8为总8次单方向侧移归中、每方向4次，源8秒包含左、右各一次。",
    "h-adductor-rock是旧目录明确的内收肌活动替代，四足体位减少站立平衡要求，可作目标降阶候选而非相同承重动作；adductors-A是更深单侧承重及伸直腿抬趾的源可验证进阶候选，需编辑审定。",
    "相位来自catalog/v2/batches/b002.json真实源时间；剂量数字与范围保持旧catalog。rhythm只描述动画，不使用旧reps或holdSeconds来覆盖处方。",
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
      "path": "drill-anim/specs/n-squat-shift-r2.js",
      "sha256": "5cffde80bea08369b2e658b75e8ea06ffd5059d50377a521ea46c293b6dbc5c9",
      "bytes": 481,
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
        "path": "drill-anim/specs/n-squat-shift.js",
        "sha256": "273960ac6a819c7b0438f4647efa7606926b3e1e23a5b6d67b26ec59c25e2191",
        "bytes": 3274,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.2,
      "end": 8
    },
    "highlightMuscles": [
      "adductors",
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
    "actionId": "n-squat-shift",
    "manifest": {
      "root": "repo",
      "path": "catalog/voice-v2/batches/b002-manifest.json",
      "sha256": "49ec936b6badcecb00076a1a4e39664b8ba4223094e7e6ec0a145401a45fac64",
      "bytes": 231448
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
