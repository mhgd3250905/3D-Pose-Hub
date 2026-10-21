# 坐姿体前屈 / Seated Forward Fold

ID: `s-seated-fold`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "坐姿体前屈",
    "en": "Seated Forward Fold"
  },
  "purpose": {
    "zh": "双腿向前的坐姿中从髋部缓慢前倾，拉伸大腿后侧",
    "en": "Hinge forwards slowly in a legs-forward sitting position to stretch the backs of the thighs."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "hamstrings"
    ],
    "synergistMuscles": [
      "erectors"
    ],
    "equipment": [
      "mat"
    ],
    "position": "seated",
    "scenes": [
      "home"
    ],
    "difficulty": 1,
    "trainingType": "stretch"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "膝盖伸直，从髋部往前折",
        "en": "Keep the knees straight and hinge forwards from the hips"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "双腿向前放稳，脚跟承托，不用猛拉脚趾",
        "en": "Set both legs forwards with the heels supported, without yanking the toes."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "双手沿大腿和小腿轻滑，背部保持舒展",
        "en": "Let the hands slide lightly along the thighs and shins while keeping the back long."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "只到舒适范围，继续呼吸，再缓慢坐回",
        "en": "Use a comfortable range, keep breathing and return upright slowly."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "憋气弓背，猛拉双脚或强行追求额头碰膝",
      "en": "Holding the breath with a rounded back, pulling hard on the feet or forcing the forehead towards the knees."
    },
    {
      "zh": "弹振、膝盖反顶或脚跟滑动来增加距离",
      "en": "Bouncing, forcing the knees backwards or sliding the heels to gain distance."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰背与大腿后侧：从髋部轻柔前倾，不用腰部疼痛换取更深距离。",
        "en": "Lower back and hamstrings: hinge gently from the hips rather than forcing a deeper reach through back pain."
      },
      {
        "zh": "膝与脚跟：腿保持舒适伸展，不反顶膝，脚跟有承托。",
        "en": "Knees and heels: keep the legs comfortably extended without forcing the knees backwards, with the heels supported."
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
        "zh": "已有医嘱限制坐姿前屈、直膝伸展或脊柱屈曲时，先取得许可。",
        "en": "Obtain clearance first if seated forward bending, straight-knee stretching or spinal flexion has been restricted."
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
    "n-straddle-fold"
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
    "kind": "rep_cycle",
    "leadSeconds": 0,
    "source": "b004-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.6
      },
      {
        "id": "foldForward",
        "seconds": 1.4
      },
      {
        "id": "deepenFold",
        "seconds": 1.8
      },
      {
        "id": "easeFold",
        "seconds": 1.8
      },
      {
        "id": "returnUpright",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 1
      }
    ]
  },
  "countingSemantics": "The source demonstrates one slow bilateral fold and return per8-second loop. Preserve default40 seconds and range; the source does not maintain a40-second maximum stretch. Dynamic repeated practice versus a separately held position requires editorial confirmation. Both legs are demonstrated together, with no side change.",
  "movementSides": "Both sides move together.",
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
    "继续采用目录已选r3局部左手hem绕行（31/30、197/30峰值），不回退原源或已失败的全程12mm偏移草案。",
    "历史QA/验收有2.05mm左手间隙与63帧可达警告的例外记录；这不是新版模型已通过，也不把旧阈值放宽成新验收。",
    "n-straddle-fold为改变腿间角度的前倾目标替代候选，侧重与剂量不同；同模式独立降阶/进阶ID尚未验证。",
    "旧“伸膝”主点保留；配套点明确不反顶膝、不强迫触地，编辑/医学审核待审。",
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
      "path": "drill-anim/specs/s-seated-fold-r4.js",
      "sha256": "f14ee2f4f6bbfdedfcd7f34d136334e6738f2aa1a1af431a8ec96f277ff33853",
      "bytes": 485,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/specs/s-seated-fold-r3.js",
        "sha256": "13e38b9e0fb74935868633656b8cc98040f93cf13565132aa95f32c87cd75cc8",
        "bytes": 1072,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/s-seated-fold.js",
        "sha256": "034ec878a0d9498356c48f218bd0ef4754fa5837bff4e5d4e2ae9f87c3b35766",
        "bytes": 5250,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 3.8,
      "end": 8
    },
    "highlightMuscles": [
      "hamstrings"
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
    "actionId": "s-seated-fold",
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
