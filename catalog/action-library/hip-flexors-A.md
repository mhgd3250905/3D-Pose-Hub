# 坐姿直腿抬腿，压缩 / Seated straight-leg lift

ID: `hip-flexors-A`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "坐姿直腿抬腿，压缩",
    "en": "Seated straight-leg lift"
  },
  "purpose": {
    "zh": "坐姿直腿抬腿（压缩），练 L 撑所需的屈髋力量",
    "en": "Train active hip-flexion compression for L-sit preparation with both legs straight."
  },
  "tags": {
    "category": "core",
    "activeMuscles": [
      "hip-flexors"
    ],
    "synergistMuscles": [
      "quadriceps",
      "abs",
      "triceps"
    ],
    "equipment": [
      "mat"
    ],
    "position": "seated",
    "scenes": [
      "home"
    ],
    "difficulty": 3,
    "trainingType": "strength"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "躯干前倾，双腿伸直抬离地面，再慢慢放下",
        "en": "Lean forwards, lift both straight legs off the mat, then lower them slowly"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "长坐，双手在膝盖两侧撑垫，双腿并拢",
        "en": "Sit with the legs long and together, with the hands on the mat beside the knees."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "从髋部向前折，保持手掌稳定，不向后倒躲开压缩",
        "en": "Lean forwards at the hips and keep the palms stable rather than leaning back to avoid compression."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "脚跟小幅离地，停留后缓慢放下，继续呼吸",
        "en": "Lift the heels a small distance, pause, and lower slowly while continuing to breathe."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "身体后仰、屈膝或甩腿，代替主动直腿抬起",
      "en": "Leaning backwards, bending the knees or swinging the legs instead of actively lifting straight legs."
    },
    {
      "zh": "手掌滑动、肩部塌下，脚跟突然落地",
      "en": "Letting the palms slide or shoulders collapse, or dropping the heels abruptly."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "手腕与肩：双手稳定撑垫，支撑压力和前倾程度以舒适为限。",
        "en": "Wrists and shoulders: keep the hands stable and use a comfortable support pressure and forward lean."
      },
      {
        "zh": "髋前侧与大腿后侧：只在能维持直腿和可控下降的范围内抬起，不强求高度。",
        "en": "Front of the hips and hamstrings: lift only as far as you can keep the legs straight and lower under control, without forcing height."
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
        "zh": "已有医嘱限制手掌负重、坐姿前倾或主动屈髋时，先取得许可。",
        "en": "Obtain clearance first if weight bearing through the palms, forward sitting or active hip flexion has been restricted."
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
    "n-seated-knee-lift"
  ],
  "regressions": [
    "n-seated-knee-lift"
  ],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 3,
    "reps": 8,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      4
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
    "kind": "rep_updown",
    "leadSeconds": 0,
    "source": "b003-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.4
      },
      {
        "id": "liftBothLegs",
        "seconds": 0.8
      },
      {
        "id": "topHold",
        "seconds": 1.4
      },
      {
        "id": "lowerBothLegs",
        "seconds": 0.8
      },
      {
        "id": "reset",
        "seconds": 0.6
      }
    ]
  },
  "countingSemantics": "One simultaneous lift and lowering of both straight legs counts as one rep; the 8-second source contains two bilateral reps. Preserve default 8 reps per set, not eight per leg. The source holds 1.4 seconds at each peak, not a prescribed extra hold outside the demonstrated rhythm.",
  "movementSides": "Both sides move together; no working-side change.",
  "apps": [
    "flarelab",
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
    "源明确躯干前倾且双腿同时抬起；旧HipLab主点坐直/单腿泛称不足以说明压缩，新主点按真实源写，不为复用音频保留歧义。名称使用已有语音读法，稳定ID不变。",
    "双腿合计一次同步抬放算1次，默认8总双腿动作。n-seated-knee-lift为原目录替代，屈膝缩短杠杆的屈髋目标降阶候选，坐姿/支撑不同；没有已核定L撑进阶稳定ID。",
    "源highlight还指定quadRect面片，package保留原spec依赖，须在新版高亮层检查该额外面片是否实际支持并有遮挡；不能仅凭groups认定完整。",
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
      "path": "drill-anim/specs/hip-flexors-A-r2.js",
      "sha256": "fe9ecc9b962157dc2b3e9fd4b335fafc68bf023f6e597c5e9c71d58861f76707",
      "bytes": 483,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/specs/hip-flexors-A.js",
        "sha256": "1aa89cba0c2962a1f89370d7b347e14074d0684474b76962bb17ab27efe345b5",
        "bytes": 3515,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 1.9,
      "end": 8
    },
    "highlightMuscles": [
      "hip-flexors"
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
    "actionId": "hip-flexors-A",
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
