# 仰卧屈膝扭转 / Supine bent-knee twist

ID: `h-supine-twist`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "仰卧屈膝扭转",
    "en": "Supine bent-knee twist"
  },
  "purpose": {
    "zh": "拉伸腰两侧和下背",
    "en": "Practise a gentle alternating supine knee-drop movement to lengthen the sides of the waist and lower back."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "obliques",
      "erectors"
    ],
    "synergistMuscles": [
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
    "trainingType": "stretch"
  },
  "unilateral": true,
  "startingSide": "left",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "双膝倒向一侧，肩膀贴地",
        "en": "Drop both knees to one side, shoulders stay down"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "仰卧屈髋屈膝，双臂向两侧打开，头颈放松",
        "en": "Lie on the back with the hips and knees bent, arms open to the sides, and head and neck relaxed."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "双膝先向右侧移动，慢慢回中，再换另一侧",
        "en": "Move both knees to the right first, return slowly through the centre, then change direction."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "只转到肩部仍能舒适承托的范围，不用手压膝盖",
        "en": "Rotate only as far as you can keep the shoulders comfortably supported without pressing on the knees."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "强行把膝盖压地，导致对侧肩膀明显抬起",
      "en": "Forcing the knees down until the opposite shoulder lifts."
    },
    {
      "zh": "用惯性甩腿、扭颈或憋气保持大幅扭转",
      "en": "Throwing the legs, twisting the neck or holding the breath in a forced twist."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰背与髋：小幅缓慢转动，不把更深扭转当作必要目标。",
        "en": "Lower back and hips: rotate slowly through a modest range without treating a deeper twist as necessary."
      },
      {
        "zh": "肩与颈：头颈自然放松，双肩舒适承托，不强压肩部贴地。",
        "en": "Shoulders and neck: let the head and neck relax and keep the shoulders comfortably supported rather than forcing them down."
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
        "zh": "已有医嘱限制仰卧或脊柱旋转时，先取得许可。",
        "en": "Obtain clearance first if supine exercise or spinal rotation has been restricted."
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
    "h-knee-hug"
  ],
  "regressions": [],
  "progressions": [],
  "defaultDose": {
    "mode": "time",
    "sets": 1,
    "seconds": 40,
    "restSeconds": 10
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "seconds": [
      20,
      80
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
        "id": "dropKneesToSide",
        "seconds": 1.4
      },
      {
        "id": "sidePause",
        "seconds": 1.2
      },
      {
        "id": "returnCentre",
        "seconds": 1.1
      }
    ]
  },
  "countingSemantics": "The source demonstrates knees right then left, one 4-second side movement each, with only 1.2 seconds at each peak. Preserve the legacy 40-second-per-side hold prescription but do not claim this dynamic alternating loop implements a continuous 40-second hold. Editorial/playback reconciliation is pending. Starting side left identifies the initially lengthened body side; knee direction is right. No mirrored media.",
  "movementSides": "Both knees first drop right, then left at 4 seconds. Starting side denotes the initially lengthened left body side, not knee travel; source highlight remains both.",
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
    "root已核实r3为已发布r2的camera-only修订，有docs/reviews/2026-10-19-visual-audit.md及pr8-previews可见性证据；本轮显式以r3新迁移r4，旧catalog仍r2不改。r2的38度roll修正继续保留，不回退55度。",
    "startingSide=left按膝向右时主要被拉长的体侧记录，movementSides另明确右膝落方向；highlight源仍both，单侧高亮不做假断言。",
    "旧审核明确默认每侧40秒hold，数值及每侧处方保留；现源左右各1.2秒plateau且4秒换向，动态循环不能冒充持续每侧40秒静态hold。播放/处方须编辑裁决，发布继续阻断。",
    "h-knee-hug为不同非旋转下背目标替代候选，不是等价扭转处方；缩小本ID幅度为调整，未核定独立同模式降阶/进阶。",
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
- zh.phase.start: text/audio status must pass
- zh.phase.start: measured loudness/peak audit must pass

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
      "path": "drill-anim/specs/h-supine-twist-r4.js",
      "sha256": "caecc610474db3e3883519635bd264f7977e24795b50b2c9c86cd8fc6f364248",
      "bytes": 488,
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
        "path": "drill-anim/specs/h-supine-twist-r2.js",
        "sha256": "14103d9993b464853abb2502345f60bb83c2a52ecfa7ee7456b81d14385a4299",
        "bytes": 2710,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/h-supine-twist-r3.js",
        "sha256": "4e1efbf0db45e48c0c54a206542e170834217a5b9e4d16d1b8861f6dbbf183e4",
        "bytes": 540,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/h-supine-twist.js",
        "sha256": "53f0ab3d0799252e76aa280780772e166908b23957d5a00904d8af2e74e61ad7",
        "bytes": 4243,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.3,
      "end": 8,
      "switchPoint": {
        "kind": "in-clip",
        "seconds": 4,
        "semantics": "Both knees first drop right, then left at 4 seconds. Starting side denotes the initially lengthened left body side, not knee travel; source highlight remains both. The source demonstrates knees right then left, one 4-second side movement each, with only 1.2 seconds at each peak. Preserve the legacy 40-second-per-side hold prescription but do not claim this dynamic alternating loop implements a continuous 40-second hold. Editorial/playback reconciliation is pending. Starting side left identifies the initially lengthened body side; knee direction is right. No mirrored media."
      }
    },
    "highlightMuscles": [
      "obliques",
      "erectors"
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
    "actionId": "h-supine-twist",
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
