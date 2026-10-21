# 徒手单腿罗马尼亚硬拉 / Bodyweight Single-Leg RDL

ID: `hamstrings-A`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "徒手单腿罗马尼亚硬拉",
    "en": "Bodyweight Single-Leg RDL"
  },
  "purpose": {
    "zh": "徒手单腿罗马尼亚硬拉，练腘绳肌与平衡",
    "en": "Train the hamstrings, hips and balance with a controlled bodyweight single-leg hip hinge."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "hamstrings",
      "glute-max"
    ],
    "synergistMuscles": [
      "abs",
      "erectors",
      "hip-abductors"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home",
      "gym"
    ],
    "difficulty": 2,
    "trainingType": "strength"
  },
  "unilateral": true,
  "startingSide": "left",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "支撑腿膝微屈，以髋为轴前倾，骨盆保持端平",
        "en": "Soften the supporting knee, hinge forwards at the hip, and keep your pelvis level"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左脚踩稳支撑，右腿随躯干前倾向后抬起",
        "en": "Keep the left foot planted and let the right leg lift behind as the torso hinges forwards."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "背部自然延长，手臂垂在肩部下方，不主动耸肩",
        "en": "Keep the back long and let the arms hang below the shoulders without shrugging."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "到舒适范围后平稳回正，完成左侧剂量再换边",
        "en": "Return smoothly from a comfortable range and finish the left-side dose before changing sides."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "弓背或向外翻髋，后腿与躯干方向脱节",
      "en": "Rounding the back, opening the pelvis or letting the rear leg move out of line with the torso."
    },
    {
      "zh": "锁死支撑膝、扭脚或靠甩腿找平衡",
      "en": "Locking the supporting knee, twisting the planted foot or swinging the rear leg to balance."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰与骨盆：以髋折叠，骨盆保持朝向地面，不以弓背或开髋加深。",
        "en": "Lower back and pelvis: hinge at the hip with the pelvis square rather than rounding the back or opening the hip."
      },
      {
        "zh": "支撑膝踝与平衡：左膝微屈，左足持续稳定；只前倾到能平稳回正的幅度。",
        "en": "Supporting knee, ankle and balance: keep the left knee soft and foot steady, and hinge only as far as you can return under control."
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
        "zh": "已有医嘱限制单腿负重、站立平衡或髋部前倾时，先取得许可。",
        "en": "Obtain clearance first if single-leg loading, standing balance or hip hinging has been restricted."
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
    "h-good-morning"
  ],
  "regressions": [
    "h-good-morning"
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
      6,
      10
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
        "seconds": 0.3
      },
      {
        "id": "hingeForward",
        "seconds": 1.4
      },
      {
        "id": "bottomHold",
        "seconds": 0.6
      },
      {
        "id": "returnUpright",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 0.3
      }
    ]
  },
  "countingSemantics": "One hinge and return on the supporting leg counts as one rep. Default reps=8 is per side, as explicitly prescribed in the legacy FlareLab record. The 8-second clip shows two left-support reps, with the right leg lifted behind, and no side change. Complete four loops for the default left-side dose before an optional external change; opposite-side media is not produced.",
  "movementSides": "Only the left support/working leg is demonstrated; the right leg lifts behind. Eight seconds is an available loop-boundary cue after the prescribed per-side dose, not an encoded or mandatory every-loop switch.",
  "apps": [
    "flarelab"
  ],
  "editorialReview": {
    "status": "pending",
    "reviewer": null,
    "reviewedAt": null,
    "evidence": []
  },
  "editorialNotes": [
    "旧FlareLab明确3组×每侧8次；默认8为每侧，源每8秒仅左支撑2次，因此左侧默认4loops后才能提示换边，不是每loop强制换。",
    "startingSide=left指支撑/主要训练腿，右腿是后抬腿；source.highlight.side=both原样保留，不能伪称仅左侧高亮。",
    "原spec无modelProfile，保留左腿reach168和原solver；原stillAt0.2秒为准备位，batch peak选2秒。h-good-morning为原目录明确、减少单腿平衡要求的双足髋铰链替代/降阶，非同等平衡刺激；独立同模式负重进阶ID未核定。",
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
      "path": "drill-anim/specs/hamstrings-A-r2.js",
      "sha256": "8750ac69ffd5683c36b3896a9f64c347a069ac3417b2287d590bccedf6aabe0a",
      "bytes": 479,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/specs/hamstrings-A.js",
        "sha256": "2f4805986cf1d425fcac9f929a149f836d6fa6f6e70a603c1fb9455dbf0649a6",
        "bytes": 4449,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.0,
      "end": 8,
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "Only the left support/working leg is demonstrated; the right leg lifts behind. Eight seconds is an available loop-boundary cue after the prescribed per-side dose, not an encoded or mandatory every-loop switch. One hinge and return on the supporting leg counts as one rep. Default reps=8 is per side, as explicitly prescribed in the legacy FlareLab record. The 8-second clip shows two left-support reps, with the right leg lifted behind, and no side change. Complete four loops for the default left-side dose before an optional external change; opposite-side media is not produced."
      }
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
    "demonstratedSide": "left",
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
    "actionId": "hamstrings-A",
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
