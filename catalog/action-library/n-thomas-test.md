# 仰卧单膝抱胸 / Supine single knee hug

ID: `n-thomas-test`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "仰卧单膝抱胸",
    "en": "Supine single knee hug"
  },
  "purpose": {
    "zh": "仰卧单膝抱胸，拉伸对侧髋前侧",
    "en": "Practise a gentle single-knee hug with the other leg resting long to lengthen the front of that opposite hip."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "hip-flexors"
    ],
    "synergistMuscles": [
      "glute-max",
      "erectors"
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
  "startingSide": "right",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "抱住一边膝盖，另一条腿放松伸直",
        "en": "Hug one knee, let the other leg rest straight"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左手轻扶左小腿，左膝靠近胸口，右腿伸长承托在垫上",
        "en": "Hold the left shin gently with the left hand, bring the left knee towards the chest, and rest the right leg long on the mat."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "右臂放松在体侧，头肩保持承托，不抬头追膝",
        "en": "Relax the right arm beside the body with head and shoulders supported, without lifting the head towards the knee."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "随呼吸轻柔抱近再放松，不把右腿压向地面",
        "en": "Gently draw in and ease with the breath without pressing the right leg down."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "猛拉左膝、抬头耸肩或憋气",
      "en": "Yanking the left knee in, lifting the head and shrugging, or holding the breath."
    },
    {
      "zh": "把右腿强压地面、过度拱腰或用样片结果自判疾病",
      "en": "Forcing the right leg down, over-arching the lower back or using the demonstration to self-diagnose a condition."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "髋与膝：左侧抱膝只用轻柔拉力，右腿自然承托，不向两端硬拉。",
        "en": "Hips and knees: use a gentle left-knee hug and let the right leg rest naturally without forcing the limbs apart."
      },
      {
        "zh": "腰背与颈：头肩自然放松，呼吸顺畅，不通过拱腰或抬头增加幅度。",
        "en": "Lower back and neck: relax the head and shoulders and breathe comfortably without arching the back or lifting the head to gain range."
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
        "zh": "已有医嘱限制仰卧、单侧髋深屈曲或对侧髋伸展时，先取得许可。",
        "en": "Obtain clearance first if supine exercise, deep single-hip flexion or opposite-hip extension has been restricted."
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
    "seconds": 30,
    "restSeconds": 10
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "seconds": [
      15,
      60
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_breath",
    "leadSeconds": 0,
    "source": "b003-source-timeline",
    "phases": [
      {
        "id": "easePrepare",
        "seconds": 0.4
      },
      {
        "id": "exhaleDrawLeftKneeCloser",
        "seconds": 1.8
      },
      {
        "id": "gentlePause",
        "seconds": 0.7
      },
      {
        "id": "inhaleEase",
        "seconds": 1.1
      }
    ]
  },
  "countingSemantics": "The left knee is hugged while the right long leg/hip is the lengthened side. The 8-second source shows two gentle breath-led draw-and-ease cycles with no switch. Preserve default 30 seconds; proposed per-side timed breathing movement versus the legacy hold label needs editorial confirmation. It is not a 30-second fixed pose or a validated diagnostic test. Opposite-side media is not produced.",
  "movementSides": "Left hand hugs left knee/shin; right leg stays long and right arm rests on the mat. StartingSide right denotes the lengthened front of the right hip. Optional boundary only after the side dose; no in-clip change or mirrored media.",
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
    "名称沿当前目录去掉测试宣称，英文采用HipLab已有通用名；稳定ID n-thomas-test保留，不将源历史注释的短缩判读当作经验证自测结论。此媒体是动作示范，不能凭大腿抬起诊断原因。",
    "startingSide=right指长腿/受拉伸髋前侧，left是抱膝侧；右臂放在垫上，只有左手抱左小腿，不能写成双手抱同膝。",
    "默认30保持数值；按unilateral示范提出每侧30秒轻柔呼吸活动，旧源并非30秒固定pose，确切hold/动态处方须编辑审定。source8秒只右髋前侧、2次轻柔抱松，不每loop强制换侧。",
    "h-knee-hug是双膝抱胸、下背/臀部目标不同的非等价替代候选，不算本动作屈髋肌拉伸的直接降阶/进阶；同模式独立关系未核定。",
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
      "path": "drill-anim/specs/n-thomas-test-r2.js",
      "sha256": "f50830c9f850ab117ed5429038e60a2031884bbecff961989b4dd44cb497f552",
      "bytes": 483,
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
        "path": "drill-anim/specs/n-thomas-test.js",
        "sha256": "62d3cfa853048dc695812c3042b2ddad2afa313aea938d02dc24ca40c824037f",
        "bytes": 5573,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.5,
      "end": 8,
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "Left hand hugs left knee/shin; right leg stays long and right arm rests on the mat. StartingSide right denotes the lengthened front of the right hip. Optional boundary only after the side dose; no in-clip change or mirrored media. The left knee is hugged while the right long leg/hip is the lengthened side. The 8-second source shows two gentle breath-led draw-and-ease cycles with no switch. Preserve default 30 seconds; proposed per-side timed breathing movement versus the legacy hold label needs editorial confirmation. It is not a 30-second fixed pose or a validated diagnostic test. Opposite-side media is not produced."
      }
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
    "actionId": "n-thomas-test",
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
