# 仰卧雨刷式 / Supine Windshield Wipers

ID: `n-windshield`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "仰卧雨刷式",
    "en": "Supine Windshield Wipers"
  },
  "purpose": {
    "zh": "仰卧屈膝，缓慢向两侧活动髋部旋转",
    "en": "Practise controlled side-to-side hip rotation with bent knees and planted feet while lying on the back."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "glute-max",
      "hip-abductors"
    ],
    "synergistMuscles": [
      "obliques"
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
        "zh": "双膝一起慢慢左右倒，肩膀贴地",
        "en": "Let both knees fall side to side, keeping the shoulders down"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "仰卧屈膝，双脚比髋稍宽踩稳，双手放在体侧垫上",
        "en": "Lie on the back with bent knees, feet slightly wider than the hips and hands on the mat beside the body."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "先让双膝向右移动，再回到中间，随后换向左侧",
        "en": "Move both knees to the right first, return through the centre, then move to the left."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "只用舒适的小幅度，骨盆轻随动，继续自然呼吸",
        "en": "Use a comfortable modest range, allow a gentle pelvic roll and keep breathing naturally."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "甩动双膝、用力扭到肩膀抬起或憋气",
      "en": "Throwing the knees, forcing the twist until a shoulder lifts, or holding the breath."
    },
    {
      "zh": "双脚滑走、两膝分头移动，或强迫膝盖碰地",
      "en": "Letting the feet slide, moving the knees in different directions or forcing them to touch the floor."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "髋与膝：双脚稳定，膝随髋缓慢转动，不硬扭关节。",
        "en": "Hips and knees: keep the feet stable and let the knees follow a slow hip rotation without forcing the joints."
      },
      {
        "zh": "腰背与肩：采用肩部能舒适承托的幅度，不用手把膝盖压低。",
        "en": "Lower back and shoulders: use a range that allows comfortable shoulder support, without pressing the knees down by hand."
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
        "zh": "已有医嘱限制仰卧、髋部或脊柱旋转时，先取得许可。",
        "en": "Obtain clearance first if supine exercise, hip rotation or spinal rotation has been restricted."
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
    "h-supine-twist"
  ],
  "regressions": [],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 1,
    "reps": 8,
    "restSeconds": 10
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
    "kind": "rep_cycle",
    "leadSeconds": 0,
    "source": "b004-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "kneesRight",
        "seconds": 1.4
      },
      {
        "id": "rightPause",
        "seconds": 1.0
      },
      {
        "id": "returnFromRight",
        "seconds": 1.2
      },
      {
        "id": "centrePause",
        "seconds": 0.4
      },
      {
        "id": "kneesLeft",
        "seconds": 1.4
      },
      {
        "id": "leftPause",
        "seconds": 1.0
      },
      {
        "id": "returnFromLeft",
        "seconds": 1.2
      },
      {
        "id": "reset",
        "seconds": 0.1
      }
    ]
  },
  "countingSemantics": "The source defines one right-and-left pair per eight seconds: knees right, centre, left, centre. Both legs move together; this is not a single-leg unilateral action. Preserve default reps=8 and legacy range. Whether the app counts eight pairs or eight one-sided excursions is unresolved because the legacy four-second alternate rhythm differs from the source eight-second cycle; do not silently double or halve the dose.",
  "movementSides": "Both knees move right first then left after the centre crossing; movement direction is not a unilateral working-side assignment.",
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
    "目录源保持不变，原生8秒是双侧方向的一整对，旧rhythm的4秒交替计数不可直接当作整对。剂量计数单位待编辑明确。",
    "h-supine-twist为同样仰卧向两侧转动的不同腿位替代候选；本源双脚着地，不能混成双腿悬起的姿势。当前无已验证同模式独立降阶/进阶ID。",
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
      "path": "drill-anim/specs/n-windshield-r2.js",
      "sha256": "f0172719960c9ab41957e5ad09fb054c01ad5bbbfa7e3ef044e76affdaf9376d",
      "bytes": 480,
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
        "path": "drill-anim/specs/n-windshield.js",
        "sha256": "10d16b2ccd6c637b95b6f134236e6fa3c6bccc7943f9be72712cdc5b829f3b75",
        "bytes": 3744,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.2,
      "end": 8
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
    "actionId": "n-windshield",
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
