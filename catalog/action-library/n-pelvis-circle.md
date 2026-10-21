# 站姿骨盆画圈 / Standing pelvic circles

ID: `n-pelvis-circle`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "站姿骨盆画圈",
    "en": "Standing pelvic circles"
  },
  "purpose": {
    "zh": "活动髋前侧和臀部",
    "en": "Mobilise the hips with slow pelvic circles in both directions while the feet stay planted."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "hip-flexors",
      "glute-max",
      "hip-abductors"
    ],
    "synergistMuscles": [
      "abs",
      "obliques"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home",
      "office"
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
        "zh": "双脚不动，骨盆慢慢画圈",
        "en": "Feet still, draw slow circles with your pelvis"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "双手轻放髋侧，膝盖微屈",
        "en": "Rest the hands on the hips and soften the knees."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "先向前再向身体左侧画圈，完整一圈后反方向",
        "en": "Circle forwards and towards your left first, then reverse after completing a full circle."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "肩部尽量平稳，圈的大小以可控和舒适为限",
        "en": "Keep the shoulders fairly steady and make the circle only as large as you can control comfortably."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "脚步跟着移动，靠转身代替骨盆画圈",
      "en": "Moving the feet and turning the whole body instead of circling the pelvis."
    },
    {
      "zh": "圈画得过大、猛顶腰部或憋气",
      "en": "Forcing a large circle, thrusting the lower back or holding the breath."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰背与髋：用舒适的小圈起步，不强行把腰推到极限。",
        "en": "Lower back and hips: begin with a comfortable small circle without forcing the back to an end position."
      },
      {
        "zh": "膝踝与平衡：双脚持续踩稳，膝盖保持柔和，避免锁膝。",
        "en": "Knees, ankles and balance: keep the feet planted and the knees soft rather than locked."
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
        "zh": "已有医嘱限制站立负重、骨盆活动或腰髋活动时，先取得许可。",
        "en": "Obtain clearance first if standing load, pelvic movement or lower-back or hip movement has been restricted."
      }
    ],
    "review": {
      "status": "pending",
      "reviewer": null,
      "reviewedAt": null,
      "evidence": []
    }
  },
  "alternatives": [],
  "regressions": [],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 1,
    "reps": 4,
    "restSeconds": 15
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "reps": [
      2,
      6
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_cycle",
    "leadSeconds": 0,
    "source": "b002-source-timeline",
    "phases": [
      {
        "id": "easePelvisForward",
        "seconds": 0.2
      },
      {
        "id": "circleTowardsLeft",
        "seconds": 3.6
      },
      {
        "id": "frontPause",
        "seconds": 0.4
      },
      {
        "id": "reverseCircle",
        "seconds": 3.6
      },
      {
        "id": "returnCentre",
        "seconds": 0.2
      }
    ]
  },
  "countingSemantics": "Preserve the legacy rep_cycle interpretation: one complete circle in each direction is one 8-second rep cycle. Default reps=4 means four two-direction cycles (four circles per direction), not four single circles or four per-side leg reps. Direction reverses at 4 seconds; feet remain planted throughout. The 0–0.6 and 7.4–8 second amplitude ramps overlap the angular phases.",
  "movementSides": "Pelvis first travels forward then towards body left; direction reverses near 4 seconds. Both feet support the body throughout; no working-leg switch.",
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
    "名称与主点复用HipLab原句。旧catalog审核说明把顺/逆各一圈作为一个rep_cycle；默认4次因此表示4个8秒双向周期，共每方向4圈，不擅改为总4圈。",
    "双足持续支撑，方向反转不等于单侧训练换腿；unilateral=false。幅度缩小是同ID调整；仓库未验证等价画圈替代或独立降阶/进阶ID，关系留空并待编辑补充。",
    "源amp在0–0.6秒渐入、7.4–8秒渐出，0–0.2不是完全静止；首尾回到骨盆居中。",
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
      "path": "drill-anim/specs/n-pelvis-circle-r2.js",
      "sha256": "d32ed0a30bea725972adc33308e9222ef29cbdf6c68735c410856f5ef30e4020",
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
        "path": "drill-anim/specs/n-pelvis-circle.js",
        "sha256": "5e1e140167ac622a79c2874e5957b1bb1f12799d26e4950857b36c32e4690381",
        "bytes": 3861,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 1.1,
      "end": 8
    },
    "highlightMuscles": [
      "hip-flexors",
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
    "actionId": "n-pelvis-circle",
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
