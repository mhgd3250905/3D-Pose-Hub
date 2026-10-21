# 侧卧蚌式开合 / Side-Lying Clamshell

ID: `w-clamshell`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "侧卧蚌式开合",
    "en": "Side-Lying Clamshell"
  },
  "purpose": {
    "zh": "左侧卧支撑、右膝缓慢开合，练上侧髋外旋与臀部控制",
    "en": "Practise controlled opening and closing of the upper right knee while supported on the left side."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "hip-abductors"
    ],
    "synergistMuscles": [
      "glute-max",
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
        "zh": "双脚并拢，上侧膝盖打开，骨盆不后倒",
        "en": "Keep the feet together, open the top knee and keep the pelvis from rolling backwards"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左侧卧，用左前臂承托，右手轻放右髋",
        "en": "Lie on the left side supported by the left forearm, with the right hand resting lightly on the right hip."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "只打开上侧右膝，双脚保持轻触，骨盆上下叠放",
        "en": "Open only the upper right knee, keeping the feet gently together and the pelvis stacked."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "右膝缓慢合回，避免甩腿或耸肩",
        "en": "Close the right knee slowly without swinging the leg or shrugging the shoulder."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "右膝打开时骨盆整体后翻，双脚分开",
      "en": "Rolling the whole pelvis backwards or separating the feet as the right knee opens."
    },
    {
      "zh": "甩腿追求高度，或把身体重量沉进支撑肩",
      "en": "Swinging the leg to gain height or collapsing the body into the supporting shoulder."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "髋与骨盆：只到能控制且不后翻的幅度，不靠扭腰增加高度。",
        "en": "Hips and pelvis: open only as far as you can control without rolling back or twisting the waist."
      },
      {
        "zh": "左肩肘与颈：前臂稳定承托，颈部自然，不耸肩硬撑。",
        "en": "Left shoulder, elbow and neck: support steadily through the forearm, keep the neck natural and avoid shrugging."
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
        "zh": "已有医嘱限制侧卧前臂支撑、屈膝或髋外旋时，先取得许可。",
        "en": "Obtain clearance first if side-lying forearm support, bent-knee positioning or hip external rotation has been restricted."
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
    "h-side-leg-raise"
  ],
  "regressions": [],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 2,
    "reps": 15,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      3
    ],
    "reps": [
      8,
      22
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_updown",
    "leadSeconds": 0,
    "source": "b004-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "openRightKnee",
        "seconds": 1.0
      },
      {
        "id": "topHold",
        "seconds": 1.0
      },
      {
        "id": "closeRightKnee",
        "seconds": 1.2
      },
      {
        "id": "reset",
        "seconds": 0.5
      }
    ]
  },
  "countingSemantics": "One right-knee opening and closing counts as one rep. The8-second source contains two right-side reps, with left forearm/side support and no side switch. Preserve default15 and range; the proposed per-side15 interpretation requires editorial confirmation because the legacy dose has no explicit perSide field. Legacy rhythm.reps10 does not replace default15. Change externally only after the side dose, not every loop.",
  "movementSides": "Left side and forearm support; right upper knee opens while the feet stay together. No in-clip side change.",
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
    "候选来源r2只有有记录的movement-first机位变更，其余姿态/轨道/道具/高亮/QA与原源相同；迁移r3不再修改镜头。",
    "右是上侧工作髋，左是支撑侧。不得把反向蚌式（内旋抬脚）当成同一开膝动作。",
    "h-side-leg-raise为不同体位的臀部控制/力量目标替代候选，模式和剂量不同；同模式独立降阶/进阶ID未核定。",
    "本稿保留旧目录剂量数字和范围。rhythm描述真实8秒示范，不把短演示循环当作已完成持续时间处方；需要专业编辑确认播放/计数。",
    "主要/协同肌群含姿势稳定或次要拉伸角色，未作肌电定量结论；动作关系是现有ID候选，不能自动消费旧模型媒体。",
    "通用禁用筛查依据catalog/v2/definition-evidence.md及AAOS髋/脊柱康复资料；具体到各动作的应用是待审编辑推断，没有疾病特异绝对禁忌或临床适用性批准。"
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
      "path": "drill-anim/specs/w-clamshell-r3.js",
      "sha256": "79967e04b64526aeab2804d2c14a461ebf61e1dab2a99d04727667675de58961",
      "bytes": 481,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/lib/ss-geo.mjs",
        "sha256": "45ca774079e3a85ecc4f924a3220d4baa721f0435e16f6e6e21ffa19e17e8603",
        "bytes": 3700,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/w-clamshell-r2.js",
        "sha256": "a8ca45becfd77e106896d03e1ee754880eb02cb14b4463078a342458fdadd739",
        "bytes": 5092,
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
        "semantics": "Left side and forearm support; right upper knee opens while the feet stay together. No in-clip side change. One right-knee opening and closing counts as one rep. The8-second source contains two right-side reps, with left forearm/side support and no side switch. Preserve default15 and range; the proposed per-side15 interpretation requires editorial confirmation because the legacy dose has no explicit perSide field. Legacy rhythm.reps10 does not replace default15. Change externally only after the side dose, not every loop."
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
    "actionId": "w-clamshell",
    "manifest": {
      "root": "repo",
      "path": "catalog/voice-v2/batches/b004-manifest.json",
      "sha256": "22fb26dd3bfd5b5d8912d7989d7d5f253dd7c6806af02841714dc5e4f89668c8",
      "bytes": 281067
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
