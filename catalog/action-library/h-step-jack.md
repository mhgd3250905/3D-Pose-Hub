# 低冲击开合跳 / Low-Impact Step Jack

ID: `h-step-jack`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "低冲击开合跳",
    "en": "Low-Impact Step Jack"
  },
  "purpose": {
    "zh": "低冲击开合跳，不跳起的有氧热身",
    "en": "Warm up with alternating side steps and coordinated arm raises without jumping."
  },
  "tags": {
    "category": "cardio",
    "activeMuscles": [
      "deltoids",
      "hip-abductors"
    ],
    "synergistMuscles": [
      "quadriceps",
      "calves",
      "abs"
    ],
    "equipment": [],
    "position": "standing",
    "scenes": [
      "home",
      "office"
    ],
    "difficulty": 1,
    "trainingType": "control"
  },
  "unilateral": true,
  "startingSide": "right",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "左右交替侧迈步，双臂上举，不跳起",
        "en": "Step out to alternate sides and raise both arms without jumping"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "先右脚侧迈，再回到中间，下一次换左脚",
        "en": "Step right and return to the centre, then repeat with the left foot."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "脚步落稳，手臂在舒适范围内抬起",
        "en": "Place each foot steadily and raise the arms within a comfortable range."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "保持自然呼吸，不用跳跃或猛甩手臂增加速度",
        "en": "Breathe naturally without adding jumps or swinging the arms forcefully."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "把侧迈步做成双脚同时跳起",
      "en": "Jumping with both feet instead of stepping."
    },
    {
      "zh": "脚还没有落稳就急着并步或过度甩臂",
      "en": "Rushing the return before the foot is stable or flinging the arms."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝与踝：缓慢落脚，避免膝盖内扣或脚踝向外翻。",
        "en": "Knees and ankles: place the feet under control without collapsing the knees or rolling the ankles."
      },
      {
        "zh": "肩：手臂上举保持舒适范围，不耸肩硬抬。",
        "en": "Shoulders: keep the arm raise comfortable without forcing a shrug."
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
        "zh": "已有医嘱限制侧向迈步、下肢负重或肩部上举时，先取得许可。",
        "en": "Obtain clearance first if side stepping, lower-limb loading or overhead shoulder movement has been restricted."
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
    "mode": "time",
    "sets": 2,
    "seconds": 40,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      3
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
    "source": "b001-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "stepOutAndArmsUp",
        "seconds": 1.4
      },
      {
        "id": "wideHold",
        "seconds": 0.5
      },
      {
        "id": "stepInAndArmsDown",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 0.4
      }
    ]
  },
  "countingSemantics": "Timed cardio. One step out-and-in counts as one step rep; 8 seconds shows right then left (two alternating steps). Keep the existing 40-second timed dose.",
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
    "unilateral表示交替迈步侧，不表示把40秒计时翻倍；源8秒右脚一次、左脚一次。trainingType=control用于已有力量/拉伸/控制三值分类，category仍cardio。",
    "当前目录只有这一条cardio动作；没有经过验证的同目标替代/独立降阶/进阶ID。步幅缩小或手臂降低属于同ID调整，不伪造关系ID。",
    "相位来自catalog/v2/batches/b001.json真实秒区间；剂量数字与范围保持旧catalog，rhythm不附旧reps来覆盖默认剂量。",
    "双语注意、通用禁用筛查、协同肌群与关系均已有具体草稿，pending表示未审而非缺数据；协同包含姿势稳定或次要拉伸角色，不作为肌电激活或额外高亮处方。",
    "关系目标为本仓库真实ID候选，但未必已有同模型可发布v2包；不得自动回退弃用模型素材。空关系数组的缺口见逐动作说明。",
    "医学通用筛查与证据边界沿用catalog/v2/definition-evidence.md所列AAOS/NHS一手资料；不编造疾病特异绝对禁忌。所有编辑与医学审核保持pending。"
  ],
  "movementSides": "Both arms move together; the first stepping leg is right, then left."
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

### source: complete


### masters: complete


### derivatives: complete


### voice: incomplete

- voice content review and manual listening must pass

### validation: incomplete

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
      "path": "drill-anim/specs/h-step-jack-r3.js",
      "sha256": "c263147df019ae3be570701007b6caea97102b795b541929084b878d8974e408",
      "bytes": 1120,
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
        "path": "drill-anim/specs/h-step-jack-r2.js",
        "sha256": "5e9d36ee309a343297b51219241ff55f7f0e69de9a2c9ffdee2c8192a5882ba3",
        "bytes": 474,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/h-step-jack.js",
        "sha256": "9953be4c78d068c7b8495af79c4e2b641761fe9572536a4417bd0d73e10dac67",
        "bytes": 4166,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.0,
      "end": 8,
      "switchPoint": {
        "kind": "in-clip",
        "seconds": 4,
        "semantics": "Timed cardio. One step out-and-in counts as one step rep; 8 seconds shows right then left (two alternating steps). Keep the existing 40-second timed dose. All encoded side changes: 4 seconds."
      }
    },
    "highlightMuscles": [
      "deltoids",
      "hip-abductors"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-step-jack-evidence.json",
            "sha256": "25747d718b820414f85e52c29ec93aff3bf95708ca1c95ce372bdc9d072a7a48",
            "bytes": 7841
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          120,
          150,
          180,
          210,
          239,
          240
        ]
      },
      "handsFeet": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-step-jack-evidence.json",
            "sha256": "25747d718b820414f85e52c29ec93aff3bf95708ca1c95ce372bdc9d072a7a48",
            "bytes": 7841
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          120,
          150,
          180,
          210,
          239,
          240
        ]
      },
      "propFlicker": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-step-jack-evidence.json",
            "sha256": "25747d718b820414f85e52c29ec93aff3bf95708ca1c95ce372bdc9d072a7a48",
            "bytes": 7841
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          120,
          150,
          180,
          210,
          239,
          240
        ]
      },
      "loopSeam": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-step-jack-evidence.json",
            "sha256": "25747d718b820414f85e52c29ec93aff3bf95708ca1c95ce372bdc9d072a7a48",
            "bytes": 7841
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          120,
          150,
          180,
          210,
          239,
          240
        ]
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
    "skins": {
      "realistic": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "9be3fa274b4464e98b24cc657e7b4bdd4304a211b8e479d92b039d97831a0950",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/h-step-jack/layer-manifest.json",
          "sha256": "3bb7dad02265e0f3a57dab109b98f89d8e07806875a0858eaaa55faa2b9c03dc",
          "bytes": 12502
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-step-jack/body/index.json",
            "sha256": "4cf82e9d867302d058aaca75395e02d9328e6692286e517b290f9e42bfde8091",
            "bytes": 53849
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        },
        "highlightMask": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-step-jack/highlight/index.json",
            "sha256": "44eee8d7f4ddb93a7aaa22a4c511dfbab2156cff8de37f90bfb3e9761768f347",
            "bytes": 55049
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true,
          "grayscale": true,
          "occlusionAware": true
        },
        "shadow": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-step-jack/shadow/index.json",
            "sha256": "5347d20d1c7c1dccb57cf9a553e3f9befd4a434624a3dd938ea6b8a8680209cd",
            "bytes": 54329
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        }
      },
      "tech-white": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "9be3fa274b4464e98b24cc657e7b4bdd4304a211b8e479d92b039d97831a0950",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/h-step-jack/layer-manifest.json",
          "sha256": "260ba3d59c224053ec1eeceb511af8f76b64768c7b699a4c63e363c369993986",
          "bytes": 12755
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/h-step-jack/body/index.json",
            "sha256": "45638e6a26cc97add90ee3a4de36a27b282d9901d847374bcb464808b23ec875",
            "bytes": 54329
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        },
        "highlightMask": {
          "sharedFrom": "realistic"
        },
        "shadow": {
          "sharedFrom": "realistic"
        }
      },
      "neon-night": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "9be3fa274b4464e98b24cc657e7b4bdd4304a211b8e479d92b039d97831a0950",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/h-step-jack/layer-manifest.json",
          "sha256": "b26b885a1627056f7cf3ae89b1db0609418b010f13ba667883bfc5a120c3db63",
          "bytes": 12755
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/h-step-jack/body/index.json",
            "sha256": "42e61679031d80c736ce590456b390f9e1ff884e092a859b9849d280ef75a047",
            "bytes": 54329
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        },
        "highlightMask": {
          "sharedFrom": "realistic"
        },
        "shadow": {
          "sharedFrom": "realistic"
        }
      },
      "neon-night-b": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "9be3fa274b4464e98b24cc657e7b4bdd4304a211b8e479d92b039d97831a0950",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/h-step-jack/layer-manifest.json",
          "sha256": "1c3eb5be7c4587c006b6932d5d7e02526ce710b5b97ea474a6356d5647070c67",
          "bytes": 12763
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/h-step-jack/body/index.json",
            "sha256": "6fef28a0bd9ebe3d75eee96987c216022b121b3ef19ce0fb4b3c6b7bb612a9f4",
            "bytes": 54809
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        },
        "highlightMask": {
          "sharedFrom": "realistic"
        },
        "shadow": {
          "sharedFrom": "realistic"
        }
      },
      "hologram": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "9be3fa274b4464e98b24cc657e7b4bdd4304a211b8e479d92b039d97831a0950",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/h-step-jack/layer-manifest.json",
          "sha256": "c7c52574ac88ea4b55b3e06a6524b1ee811d35ba048b781dc596a4471d2752f2",
          "bytes": 12747
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/h-step-jack/body/index.json",
            "sha256": "c779409b84e128fe49e710bddfc787e84941d4db912fd7123a292a1ca2795bf8",
            "bytes": 53849
          },
          "width": 1080,
          "height": 1080,
          "durationSeconds": 8,
          "frameCount": 240,
          "fps": 30,
          "alpha": true
        },
        "highlightMask": {
          "sharedFrom": "realistic"
        },
        "shadow": {
          "sharedFrom": "realistic"
        }
      }
    },
    "loopReview": {
      "status": "pass",
      "reviewer": "Codex",
      "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
      "evidence": [
        {
          "root": "media",
          "path": "qa/reviews/h-step-jack-evidence.json",
          "sha256": "25747d718b820414f85e52c29ec93aff3bf95708ca1c95ce372bdc9d072a7a48",
          "bytes": 7841
        }
      ]
    }
  },
  "derivatives": {
    "method": "composite-from-masters",
    "mirrored": false,
    "variants": [
      {
        "skin": "realistic",
        "theme": "dark",
        "highlight": {
          "enabled": true,
          "color": "#f08a3c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/dark/loop.720.mp4",
          "sha256": "2963a1b0fe92665dc948d3509b3107d7c658755327e61d6367353c0952b7c48b",
          "bytes": 457960,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/dark/cover.720.jpg",
          "sha256": "fbc7bdb61539f6cbdc104614e91ca37cf70ab20f2aa5f6b0ae0f17049d8df16c",
          "bytes": 28178,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/dark/thumbnail.240.jpg",
          "sha256": "0c423585ac19a154e654130279862595df8509841b96a123481b040989f45ae4",
          "bytes": 5933,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/dark/start.720.png",
              "sha256": "aff50728fd583e157f4061d21f2575a76d742d1f752cd22afa566f7d38cff951",
              "bytes": 63751,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/dark/peak.720.png",
              "sha256": "bb4d7e0a8b0ce5675de1465cca21079ce4d3cb984558df18aeb8d937d97747d7",
              "bytes": 68490,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/dark/end.720.png",
              "sha256": "e2a0591e592c210f79a9ae11dcea4191b331ec48571fbeb4ae10cbc9865de5c9",
              "bytes": 63879,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "realistic",
        "theme": "light",
        "highlight": {
          "enabled": true,
          "color": "#f08a3c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/light/loop.720.mp4",
          "sha256": "906811ba46b85884743c09c86b9f93e6e7bb48e396533ee781f72202f34d6029",
          "bytes": 469840,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/light/cover.720.jpg",
          "sha256": "c3c020d1708e0068ca6e58749b8a02ec2198eba2ea363f9367f7499f76f9d36f",
          "bytes": 34744,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-step-jack/light/thumbnail.240.jpg",
          "sha256": "2011a844e73914b1d223d3f9e2d118f02b174024ef4b9f2b2f96e6523e93b0cf",
          "bytes": 8071,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/light/start.720.png",
              "sha256": "1aa24cfff877bd8d1e19a51ba30dd0e69e8f350d9f83ba9674df46f3684808ef",
              "bytes": 73172,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/light/peak.720.png",
              "sha256": "30e89f7d61bd27ff9c199ba9c5cfa63b9a22dd831f00db9aa1bb1053222813ba",
              "bytes": 78266,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-step-jack/light/end.720.png",
              "sha256": "47c34b24905193583bbc6080a8af7fdeaf22421143181611ff16e1fe993548c0",
              "bytes": 73153,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "tech-white",
        "theme": "dark",
        "highlight": {
          "enabled": true,
          "color": "#f08a3c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/dark/loop.720.mp4",
          "sha256": "886678d59cf19e2810962628bb4df6701b308c4a7a3e42906cb32ebb7b215637",
          "bytes": 706189,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/dark/cover.720.jpg",
          "sha256": "86f89a6ed38f33fe31e9f225d7797dc98ab28d4605d9b6d2e652e971a7a21cf4",
          "bytes": 38861,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/dark/thumbnail.240.jpg",
          "sha256": "212b58605161eebef28b41d58174d5573c86d9696275ab0eba94ac73dc221282",
          "bytes": 7913,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/dark/start.720.png",
              "sha256": "822dd07e9574d412c0fd177addf50de00ee352a2f0b26c10eab7ac91776bed4b",
              "bytes": 91355,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/dark/peak.720.png",
              "sha256": "4b4dfe828bd1780604b298708e7b37cf7e48d5c1c8d0b6c681ccd482329c01bd",
              "bytes": 97909,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/dark/end.720.png",
              "sha256": "8f9d4c0701429d53d2ac4b26d8e3b8b6b7057f1cd8089375df816e53c86c2520",
              "bytes": 91592,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "tech-white",
        "theme": "light",
        "highlight": {
          "enabled": true,
          "color": "#f08a3c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/light/loop.720.mp4",
          "sha256": "2b44be867909e1e6676d238a580acfae1d9683a9a72272dca19b86ae5234b1af",
          "bytes": 641519,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/light/cover.720.jpg",
          "sha256": "61e83cb571d5973eedeeda754ff48535fd41272f784df65aff2efa981b2abff5",
          "bytes": 36440,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-step-jack/light/thumbnail.240.jpg",
          "sha256": "373344bc0253cf39a3ce99100457a2bb1d65d1de1f781ebf6251bdcc6a7f6541",
          "bytes": 6717,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/light/start.720.png",
              "sha256": "dca54cc304400030437e563e70bc943f065428b0e199179c1c7cfda31493e853",
              "bytes": 92508,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/light/peak.720.png",
              "sha256": "faf5b78c655e0b623968d97e8b57c805411ca41999e75e8f0e15eed73068aed9",
              "bytes": 97127,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-step-jack/light/end.720.png",
              "sha256": "280e3f38bf98610a21a318bc80c3737a97e84f4a4ebda7581721f05b4461e234",
              "bytes": 92637,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "neon-night",
        "theme": "dark",
        "highlight": {
          "enabled": true,
          "color": "#9fdcff",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/dark/loop.720.mp4",
          "sha256": "8a551d0b9108fc1f47c0c59f21b59514a9df7275c8b9abf2186e6029f6ec4cd2",
          "bytes": 710042,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/dark/cover.720.jpg",
          "sha256": "93fffd2cd49a1e221e73758734659238e97d7fac598d9a3419faa7842022a575",
          "bytes": 38814,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/dark/thumbnail.240.jpg",
          "sha256": "0a40fedad31a4cd876a2d358289ab4f87f50616ebf22b3a2527ddb41a7dd02e9",
          "bytes": 7119,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/dark/start.720.png",
              "sha256": "45e9b91b980fb3047c3f026a6f52bc050a59e5b8072dd39f976dff8a9c3356f2",
              "bytes": 91063,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/dark/peak.720.png",
              "sha256": "82a90d818eb8588729fa24a9800f7348553325f2703e6ab308e32d51cc324bfb",
              "bytes": 96949,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/dark/end.720.png",
              "sha256": "d408ac32284867b459c36d6da0f57f4340c31f9fd67d023d0e638d4360b36ccb",
              "bytes": 91297,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "neon-night",
        "theme": "light",
        "highlight": {
          "enabled": true,
          "color": "#9fdcff",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/light/loop.720.mp4",
          "sha256": "21646ae7f9237e63462acf0c261d758aa0590843ccfa0b02dc91f0cfa1018bbe",
          "bytes": 776000,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/light/cover.720.jpg",
          "sha256": "356b00b5f5d088d6b59264cac0167a5f3fd3dc258159876d8b28dbf2076274fe",
          "bytes": 47093,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-step-jack/light/thumbnail.240.jpg",
          "sha256": "10bc99edaa20cbac1b0531d144e9afd8c1632a71f571c9e1cee9df39d997c883",
          "bytes": 9637,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/light/start.720.png",
              "sha256": "36239863a839cf2cc6422d67e0665952ac754fd4649e50c386361f12454094c2",
              "bytes": 102988,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/light/peak.720.png",
              "sha256": "f8d8eb9209668ab8780129c03c4d0e32699ab3c586a2339428e00e9ac495ce25",
              "bytes": 109519,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-step-jack/light/end.720.png",
              "sha256": "a40a81af231744c773e27439e1a35667a736650564136ca2a5565999d3a23e33",
              "bytes": 103245,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "neon-night-b",
        "theme": "dark",
        "highlight": {
          "enabled": true,
          "color": "#b6ffd0",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/dark/loop.720.mp4",
          "sha256": "b86e9b1cbbe86f83c787ea9345dc838aca88777d4830b7cc4a6897b086307d2f",
          "bytes": 730892,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/dark/cover.720.jpg",
          "sha256": "e433bc14dd0a7617fcaddca5e7debca91690a357dac97ea0a7b290c2f0cb93c3",
          "bytes": 38847,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/dark/thumbnail.240.jpg",
          "sha256": "f84ebb329d80d37c521aa864a8dd11fb34863f2d2d7c1319ac1d761f653f116c",
          "bytes": 7186,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/dark/start.720.png",
              "sha256": "d386c9b90440c154663534f40f7d17246716286227f2fada93fdf007a8412298",
              "bytes": 90813,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/dark/peak.720.png",
              "sha256": "0ce1e1ed46fda9a88dbce9dfc86ffc0eec257cddf1834cf5c79064282757e8f7",
              "bytes": 96537,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/dark/end.720.png",
              "sha256": "c1045105712feb5b7f893b29c823d2a04f27cfa64cad11d05c8fcddf5b728789",
              "bytes": 91047,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "neon-night-b",
        "theme": "light",
        "highlight": {
          "enabled": true,
          "color": "#b6ffd0",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/light/loop.720.mp4",
          "sha256": "0a8cee0d9f6aaebbc6964551a6b3e9d72ff4cc57e085934b5dd51915e8492d48",
          "bytes": 787321,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/light/cover.720.jpg",
          "sha256": "defb8174944b70e36f38e78195beba32e893cdbcafe328964886da1e377d51ab",
          "bytes": 46525,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-step-jack/light/thumbnail.240.jpg",
          "sha256": "b2a9715e108e0391b45fa5015b8c622aba74156c5e15adf17c30b0a4fe3504e2",
          "bytes": 9488,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/light/start.720.png",
              "sha256": "47700c5d7c56f8a1f7bb011fce319dd889869bbea65c0d6a4380a42ea90379ff",
              "bytes": 102755,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/light/peak.720.png",
              "sha256": "35b355abc0b26c393c342f12fe3687bc2315e4f733fe0b1ced439b1e252931bf",
              "bytes": 109373,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-step-jack/light/end.720.png",
              "sha256": "d91c3fce794f08d76265c99e483b40efcf9cc336043fd6b61d8da0eccb1e596a",
              "bytes": 103024,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "hologram",
        "theme": "dark",
        "highlight": {
          "enabled": true,
          "color": "#e9d49c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/dark/loop.720.mp4",
          "sha256": "110d4ca38b1ac1ea35dcdfaba560522dcacb4dfa885ffc5f0b19b944a18d5192",
          "bytes": 817843,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/dark/cover.720.jpg",
          "sha256": "6d6819fd6a666382494b4cbe2aab68df01e4b68070886e8f62a7b4ff649203c9",
          "bytes": 36976,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/dark/thumbnail.240.jpg",
          "sha256": "eb47fa70a13aa3683e2c9313aeea607aa216885f108c89ce04d48b1d4aee3c71",
          "bytes": 6703,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/dark/start.720.png",
              "sha256": "9d7b8200c73e5fc30c561d5a62f38d4404e2ae0e309e66bcf86fd22092a77131",
              "bytes": 100618,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/dark/peak.720.png",
              "sha256": "a2d521e8577feebec8e427595e9894e40b722813398137ed476ba9d7653a683b",
              "bytes": 105535,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/dark/end.720.png",
              "sha256": "ebce7c74d4ab7a88e3e839db38e109583490cca6d6da12050de1962d9a715ba4",
              "bytes": 100668,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      },
      {
        "skin": "hologram",
        "theme": "light",
        "highlight": {
          "enabled": true,
          "color": "#e9d49c",
          "brightness": 0.45
        },
        "modelVersion": "1.0.0-rc2",
        "mirrored": false,
        "video": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/light/loop.720.mp4",
          "sha256": "f867fca2b20759cfa0b900c06f6b8947b25e6af82df483083000b4c897e6b2e6",
          "bytes": 413951,
          "width": 720,
          "height": 720,
          "durationSeconds": 8,
          "frames": 240,
          "fps": 30,
          "codec": "h264",
          "pixelFormat": "yuv420p"
        },
        "cover": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/light/cover.720.jpg",
          "sha256": "2ca7d0f584427201ea61ac962fdfa9292ce9c1849a4d6d0bacfda61f986262d1",
          "bytes": 31400,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-step-jack/light/thumbnail.240.jpg",
          "sha256": "07ec32b4ba64480c30cfcb917f07571fbd892efcc87717c0faa8cbed74893c1f",
          "bytes": 6506,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/light/start.720.png",
              "sha256": "d964aed73682c90e49f6d4df601564ba6c77f0874e998eb3aeb5074d5a8c488c",
              "bytes": 93054,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/light/peak.720.png",
              "sha256": "38254af331b35712841d2f2a96e8d3b70be91c565488c9f7e8f05cf893727df0",
              "bytes": 96536,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-step-jack/light/end.720.png",
              "sha256": "46d598a104c98eae583445ebed799813254964ccc1ec58a9a1de3179ffded7bc",
              "bytes": 93148,
              "width": 720,
              "height": 720,
              "frame": 239
            }
          }
        ]
      }
    ],
    "transparentCovers": {
      "realistic": {
        "root": "media",
        "path": "derivatives/realistic/h-step-jack/cover.transparent.1080.png",
        "sha256": "c3e275fc158f5714cb4ec9a9f39c71085b129404be34a70e86734b5c978b3167",
        "bytes": 145807,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/h-step-jack/cover.transparent.1080.png",
        "sha256": "9305c3e317365b32930e053d85881b4e17ecb554e38d67ecb252a0114916b9e4",
        "bytes": 198923,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/h-step-jack/cover.transparent.1080.png",
        "sha256": "a1bcb6ae9d47bb90df24aef14b01179d0156f9a8de62bcfe028e71f75cb2f8a4",
        "bytes": 219738,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/h-step-jack/cover.transparent.1080.png",
        "sha256": "4a4ebe4374df8aedcc4f2d4ffe9c21a00ca3f66e224dc87eb28f366c2e5f4ec2",
        "bytes": 219895,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/h-step-jack/cover.transparent.1080.png",
        "sha256": "19cddb59ea53b5271a41ffaeddd69cd12f5016b828c76f6966adddd0c6c95c86",
        "bytes": 267778,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "compositor": {
      "root": "repo",
      "path": "tools/action-library-v2/media.py",
      "sha256": "17b92fc84cee47091e90cceae19fd1f4cf518f81db04767466d8745b784a76fb",
      "bytes": 7731
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/h-step-jack.json",
        "sha256": "43dee4862d1ec85bef3dbe69e33a37b7b2ae88a7901e012d86c524d8af3f968a",
        "bytes": 294
      }
    },
    "framingId": "fixed-square-43dee4862d1ec85b"
  },
  "voice": {
    "actionId": "h-step-jack",
    "manifest": {
      "root": "repo",
      "path": "catalog/voice-v2/batches/b001-manifest.json",
      "sha256": "31d97faf1000eceafa65bf290e66a9265d82d86425ab8ce3ed4f67f03ee401c0",
      "bytes": 270954
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
    },
    "manifest": {
      "root": "media",
      "path": "manifests/h-step-jack.json",
      "sha256": "8d13f5338b832c6797f726c301be7d73eac3a1e5d7628ac0e7e846209b6ce319",
      "bytes": 28065
    }
  }
}
```
