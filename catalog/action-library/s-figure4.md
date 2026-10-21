# 仰卧4字拉伸（脚踩地版） / Supine figure-four stretch with planted foot

ID: `s-figure4`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "仰卧4字拉伸（脚踩地版）",
    "en": "Supine figure-four stretch with planted foot"
  },
  "purpose": {
    "zh": "仰卧右踝搭左大腿，左脚踩地，温和拉伸右侧臀部",
    "en": "Stretch the right buttock gently with the right ankle crossed over the left thigh and the left foot planted."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "glute-max"
    ],
    "synergistMuscles": [
      "hip-abductors"
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
        "zh": "右脚踝搭在左大腿上，左脚踩地，双手放松在体侧",
        "en": "Rest your right ankle over your left thigh, keep your left foot planted and relax your arms beside you"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "头肩自然承托，右膝向外保持舒适幅度",
        "en": "Let the head and shoulders rest comfortably, with the right knee open through a comfortable range."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "只轻柔加深右侧臀部拉伸，不用手压右膝",
        "en": "Deepen the right-buttock stretch gently without pressing on the right knee."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "慢慢减轻拉伸，片内保持同一侧，不抱腿拉向胸口",
        "en": "Ease the stretch slowly, keep the same side throughout the clip and do not pull the thigh towards the chest."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "照搬抱腿版口令，双手强拉腿或按压右膝",
      "en": "Following the pulled-thigh version by yanking the leg or pressing the right knee."
    },
    {
      "zh": "左脚滑动、拱腰，或通过扭膝凑更深位置",
      "en": "Sliding the left foot, arching the back or twisting the knee to force more range."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "右膝与踝：踝部搭在对侧大腿，不把直接压膝作为加深方法。",
        "en": "Right knee and ankle: rest the ankle on the opposite thigh without pressing directly on the knee to deepen the stretch."
      },
      {
        "zh": "腰背与髋：左脚稳定，头肩舒适承托，只到温和无痛范围。",
        "en": "Lower back and hips: keep the left foot stable and the head and shoulders supported, using only a gentle pain-free range."
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
        "zh": "已有医嘱限制仰卧、盘腿搭踝或髋外旋时，先取得许可。",
        "en": "Obtain clearance first if supine exercise, ankle-over-thigh positioning or hip external rotation has been restricted."
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
    "s-9090"
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
    "kind": "rep_cycle",
    "leadSeconds": 0,
    "source": "b004-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.6
      },
      {
        "id": "easeRightKneeOut",
        "seconds": 1.4
      },
      {
        "id": "deepenRightStretch",
        "seconds": 1.8
      },
      {
        "id": "easeRightStretch",
        "seconds": 1.8
      },
      {
        "id": "returnToStartRange",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 1
      }
    ]
  },
  "countingSemantics": "One gentle right-side deepen-and-ease demonstration occurs per8-second loop. The left foot remains floor-locked and both hands stay on the mat. Preserve default30 seconds and range, with proposed per-side interpretation editorial pending; this is not a30-second static hold, a pulled-thigh variation or a promise of zero knee torque. There is no in-clip side switch.",
  "movementSides": "Right ankle crosses the left thigh; right buttock is stretched. Left foot stays planted. Optional change only after the completed side dose; no mirror is produced.",
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
    "旧目录“抱住大腿拉向胸口”与实际源不符；新主点明确脚踩地、手放垫，不复用旧主点。拟名带脚踩地版供编辑确认，稳定ID不变。",
    "原源注释称左脚向髋走6cm，但实际pose.deltas没有left-foot变化，只有右踝小幅位移和knee-pole变化；以代码为准，不把旧注释当运动证据。",
    "10/19审查明确只有原机位能看清脚踝跨膝，故保留原机位；不为露高亮换掉动作辨识。",
    "删除旧用途“膝不受扭力/膝不适可替代鸽子”的无条件安全宣称。s-9090仅作同臀部拉伸目标、不同坐姿要求的候选关系，降阶/进阶独立ID未核定。",
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
      "path": "drill-anim/specs/s-figure4-r2.js",
      "sha256": "bbde0f08f5fdbdab40bb833a0a898347c9a1b311a0d90ec6aa0dab6a609f4ba1",
      "bytes": 474,
      "normalization": "lf"
    },
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/specs/s-figure4.js",
        "sha256": "cca7676b36347c5c44a56efa9847eef733182d4bfeea5954da55fee148278800",
        "bytes": 3064,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 3.8,
      "end": 8,
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "Right ankle crosses the left thigh; right buttock is stretched. Left foot stays planted. Optional change only after the completed side dose; no mirror is produced. One gentle right-side deepen-and-ease demonstration occurs per8-second loop. The left foot remains floor-locked and both hands stay on the mat. Preserve default30 seconds and range, with proposed per-side interpretation editorial pending; this is not a30-second static hold, a pulled-thigh variation or a promise of zero knee torque. There is no in-clip side switch."
      }
    },
    "highlightMuscles": [
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
    "actionId": "s-figure4",
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
