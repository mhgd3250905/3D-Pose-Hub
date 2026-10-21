# 相扑深蹲肘推膝停留 / Sumo squat elbow pry

ID: `h-sumo-pry`. State: draft. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "相扑深蹲肘推膝停留",
    "en": "Sumo squat elbow pry"
  },
  "purpose": {
    "zh": "拉伸大腿内侧和臀部",
    "en": "Practice a controlled wide squat with a gentle elbow pry to mobilise the inner thighs and hips."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "adductors",
      "glute-max"
    ],
    "synergistMuscles": [
      "quadriceps",
      "abs"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home"
    ],
    "difficulty": 3,
    "trainingType": "stretch"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "蹲低，手肘把膝盖轻轻向外推",
        "en": "Sit low and gently press the knees out with your elbows"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "双脚宽站，脚尖向外，脚跟保持踩稳",
        "en": "Stand wide with the toes turned out and keep the heels planted."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "双手在胸前合十，轻推时膝盖沿脚尖方向",
        "en": "Bring the palms together in front of the chest and let the knees follow the toes as you gently press out."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "胸口保持抬起，继续呼吸，到舒适范围后缓慢起身",
        "en": "Keep the chest lifted and breathe, then rise slowly from a comfortable depth."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "膝盖内扣或脚跟离地，还继续向下压",
      "en": "Letting the knees collapse inwards or the heels lift while forcing more depth."
    },
    {
      "zh": "用手肘猛顶膝盖，髋前侧夹痛仍继续",
      "en": "Jabbing the knees with the elbows or continuing through pinching pain at the front of the hip."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝与踝：脚跟稳定，轻推膝盖的方向与脚尖一致，不强迫扭膝。",
        "en": "Knees and ankles: keep the heels stable and guide the knees with the toes rather than twisting them."
      },
      {
        "zh": "髋前侧与腹股沟：深度与推力保持舒适；出现夹痛或疼痛时停止。",
        "en": "Front of the hips and groin: use a comfortable depth and gentle pressure; stop for pinching or pain."
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
        "zh": "已有医嘱限制深蹲、下肢负重或髋膝活动时，先取得许可。",
        "en": "Obtain clearance first if deep squatting, lower-limb loading or hip or knee movement has been restricted."
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
    "h-squat"
  ],
  "regressions": [
    "h-squat"
  ],
  "progressions": [],
  "defaultDose": {
    "mode": "reps",
    "sets": 1,
    "reps": 3,
    "holdSeconds": 10,
    "restSeconds": 15
  },
  "doseRange": {
    "sets": [
      1,
      2
    ],
    "reps": [
      2,
      5
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_hold",
    "leadSeconds": 0,
    "source": "b002-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.2
      },
      {
        "id": "squatDown",
        "seconds": 1.6
      },
      {
        "id": "bottomPry",
        "seconds": 1.4
      },
      {
        "id": "riseToHalfSquat",
        "seconds": 0.8
      }
    ]
  },
  "countingSemantics": "One descent, gentle bottom pry and return to the half squat counts as one rep; 8 seconds contains two bilateral demonstration reps. Preserve the existing 3 reps with 10 seconds held per rep, but the actual source plateau is only 1.4 seconds per rep. The clip does not implement a 10-second hold; prescription/playback reconciliation requires editorial approval.",
  "movementSides": "Both sides move together; no working-side change.",
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
    "名称和主要点与HipLab既有双语语音原句一致。原剂量3次、每次停10秒完整保留；源每次底部仅1.4秒，不得把短样片循环当作已执行10秒静态停留。处方停留与播放排程冲突须编辑确认，未改动画配剂量。",
    "h-squat为相同下肢蹲模式、减少肘推和强制深度的替代/降阶候选；不是同样的内收肌拉伸处方。没有已验证同模式进阶ID。",
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
      "path": "drill-anim/specs/h-sumo-pry-r2.js",
      "sha256": "a15d736c39f4eed8ed445e3b28760a48f58214e1d0978a03cb001cb193d80d82",
      "bytes": 475,
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
        "path": "drill-anim/specs/h-sumo-pry.js",
        "sha256": "2822e6600f341862bc8491d7e58b35876bddc53c0635a727d69ec270baadac7a",
        "bytes": 3421,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.6,
      "end": 8
    },
    "highlightMuscles": [
      "adductors",
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
    "actionId": "h-sumo-pry",
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
