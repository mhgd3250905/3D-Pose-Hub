# 站姿侧抬腿 / Standing Side Leg Raise

ID: `h-side-leg-raise`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "站姿侧抬腿",
    "en": "Standing Side Leg Raise"
  },
  "purpose": {
    "zh": "练臀部外侧",
    "en": "Train the outer hip with a controlled standing side leg raise while keeping the trunk steady."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "hip-abductors"
    ],
    "synergistMuscles": [
      "abs",
      "obliques",
      "glute-max"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home",
      "office"
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
        "zh": "身体站直，右腿向侧面抬起再慢慢放下，脚尖朝前",
        "en": "Stand tall, raise your right leg to the side, and lower it slowly with your toes facing forwards"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左脚踩稳，骨盆尽量保持水平，双手轻放髋侧",
        "en": "Keep the left foot planted and pelvis level, with the hands resting lightly on the hips."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "向侧面抬右腿，不把脚尖转向外或把身体倒向另一侧",
        "en": "Lift the right leg sideways without turning the toes out or leaning the trunk away."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "缓慢放下到脚悬在身旁，完成当前侧剂量后再换边",
        "en": "Lower slowly until the foot hovers beside you and complete this side dose before changing sides."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "身体向左倒、耸髋，靠甩腿增加高度",
      "en": "Leaning left, hiking the pelvis or swinging the leg to gain height."
    },
    {
      "zh": "脚尖外转，膝盖明显弯曲或回落时踩地借力",
      "en": "Turning the toes out, bending the knee excessively or pushing off the ground between raises."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "支撑膝踝与平衡：左足踩稳，左膝保持自然，不靠扭脚或锁膝稳定。",
        "en": "Supporting knee, ankle and balance: keep the left foot stable and knee natural rather than twisting the foot or forcing the knee locked."
      },
      {
        "zh": "髋与腰侧：只抬到骨盆和躯干仍能保持稳定的高度，不耸髋。",
        "en": "Hip and side of the waist: raise the leg only as high as you can keep the pelvis and trunk steady without hiking the hip."
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
        "zh": "已有医嘱限制单腿负重、站立平衡或髋外展时，先取得许可。",
        "en": "Obtain clearance first if single-leg loading, standing balance or hip abduction has been restricted."
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
    "source": "b002-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.4
      },
      {
        "id": "raiseRightLeg",
        "seconds": 1.2
      },
      {
        "id": "topHold",
        "seconds": 0.6
      },
      {
        "id": "lowerRightLeg",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 0.4
      }
    ]
  },
  "countingSemantics": "One right-leg raise and controlled lowering counts as one rep. The 8-second clip contains two right-leg reps with left-foot support and no side change. Keep default reps=12; proposed interpretation is 12 per working side (six loops), but legacy metadata does not explicitly state per-side versus total and editorial confirmation is required. Do not switch sides automatically every loop or generate mirrored media.",
  "movementSides": "Right leg abducts while the left leg supports throughout. Eight seconds is an optional external boundary after the prescribed per-side dose, not a switch encoded in the clip.",
  "apps": [
    "smartfit"
  ],
  "editorialReview": {
    "status": "pending",
    "reviewer": null,
    "reviewedAt": null,
    "evidence": []
  },
  "editorialNotes": [
    "startingSide=right指抬起/主要外展训练腿，left为支撑腿。8秒源右腿2次，无片内换边，不生成镜像。",
    "旧catalog默认12但没有明确perSide处方文本，本稿提出每侧12次（右侧6loops），数值不变；总计/每侧解释仍须编辑确认，不因unilateral=true自动翻倍。",
    "同ID可缩小外展幅度作为调整。未验证同模式替代/独立扶物降阶/进阶的稳定ID，关系留空而不把无关内收肌动作充数；源不含扶椅，不新增椅子或改锚点。",
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
      "path": "drill-anim/specs/h-side-leg-raise-r2.js",
      "sha256": "d4c6685ced3b5a88700299238096375841b55cdd5f36e8073149b04b3b7cf49b",
      "bytes": 487,
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
        "path": "drill-anim/specs/h-side-leg-raise.js",
        "sha256": "e412ec1c05994fee8e25a1b8d7c852fc9677fa997ad5511b50b92888259a0341",
        "bytes": 3293,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 1.9,
      "end": 8,
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "Right leg abducts while the left leg supports throughout. Eight seconds is an optional external boundary after the prescribed per-side dose, not a switch encoded in the clip. One right-leg raise and controlled lowering counts as one rep. The 8-second clip contains two right-leg reps with left-foot support and no side change. Keep default reps=12; proposed interpretation is 12 per working side (six loops), but legacy metadata does not explicitly state per-side versus total and editorial confirmation is required. Do not switch sides automatically every loop or generate mirrored media."
      }
    },
    "highlightMuscles": [
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
    "actionId": "h-side-leg-raise",
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
