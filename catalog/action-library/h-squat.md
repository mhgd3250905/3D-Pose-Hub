# 徒手深蹲 / Bodyweight squat

ID: `h-squat`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "徒手深蹲",
    "en": "Bodyweight squat"
  },
  "purpose": {
    "zh": "练大腿前侧和臀部",
    "en": "Practice controlled squatting to train the thighs and hips."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "quadriceps",
      "glute-max"
    ],
    "synergistMuscles": [
      "hamstrings",
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
    "trainingType": "strength"
  },
  "unilateral": false,
  "startingSide": null,
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "脚跟踩稳，膝盖对准脚尖",
        "en": "Heels down, knees track over the toes"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "臀部向后下坐，双臂前伸帮助平衡",
        "en": "Sit your hips back and down, reaching your arms forwards for balance."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "在自己能控制的幅度下蹲，再平稳站起",
        "en": "Squat only as far as you can control, then stand up smoothly."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "保持呼吸，双脚持续稳定着地",
        "en": "Keep breathing and keep both feet planted."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "膝盖失控内扣，脚跟明显离地",
      "en": "Letting the knees collapse inwards or lifting the heels."
    },
    {
      "zh": "为追求深度而突然塌腰或失去平衡",
      "en": "Forcing depth by losing trunk control or balance."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝与踝：膝盖沿脚尖方向移动，脚跟保持稳定承重。",
        "en": "Knees and ankles: let the knees follow the toes while keeping the heels planted."
      },
      {
        "zh": "腰背：保持躯干可控，深度以当前活动范围和平衡能力为限。",
        "en": "Lower back: keep the trunk controlled and choose a depth that suits your current mobility and balance."
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
        "zh": "已有医嘱限制下肢负重或髋、膝、踝活动时，先取得许可。",
        "en": "Obtain clearance first if lower-limb loading or hip, knee or ankle movement has been restricted."
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
    "h-chair-step-up",
    "w-wall-sit"
  ],
  "regressions": [],
  "progressions": [
    "h-bulgarian"
  ],
  "defaultDose": {
    "mode": "reps",
    "sets": 3,
    "reps": 12,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      4
    ],
    "reps": [
      6,
      18
    ],
    "restSeconds": [
      0,
      60
    ]
  },
  "rhythm": {
    "kind": "rep_updown",
    "leadSeconds": 0,
    "source": "b001-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.4
      },
      {
        "id": "squatDown",
        "seconds": 1.5
      },
      {
        "id": "bottomHold",
        "seconds": 0.4
      },
      {
        "id": "standUp",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 0.3
      }
    ]
  },
  "countingSemantics": "One complete down-and-up counts as one rep; 8 seconds contains two bilateral reps.",
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
    "名称与主要点沿用 HipLab 已有 h-squat 音频原句；不把旧 rhythm.reps=8 当作新的默认剂量，defaultDose.reps=12 保持。",
    "替代是相同臀腿目标的不同体位/支撑形式；h-bulgarian为后脚抬高单腿主力蹲的进阶候选，不代表已接受统一难度顺序。降阶可先缩小同ID幅度，仓库无独立小幅深蹲ID。",
    "相位来自catalog/v2/batches/b001.json真实秒区间；剂量数字与范围保持旧catalog，rhythm不附旧reps来覆盖默认剂量。",
    "双语注意、通用禁用筛查、协同肌群与关系均已有具体草稿，pending表示未审而非缺数据；协同包含姿势稳定或次要拉伸角色，不作为肌电激活或额外高亮处方。",
    "关系目标为本仓库真实ID候选，但未必已有同模型可发布v2包；不得自动回退弃用模型素材。空关系数组的缺口见逐动作说明。",
    "医学通用筛查与证据边界沿用catalog/v2/definition-evidence.md所列AAOS/NHS一手资料；不编造疾病特异绝对禁忌。所有编辑与医学审核保持pending。"
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
      "path": "drill-anim/specs/h-squat-r2.js",
      "sha256": "7900bbd851ef7cf52caaca787c478ecbc621cde6cb93573a03f25368ee31464a",
      "bytes": 466,
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
        "path": "drill-anim/specs/h-squat.js",
        "sha256": "349e5313795134d9554245b07c13ca94c6f9102a4d41c2ed8ae61cd782e1e58d",
        "bytes": 2778,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 2.1,
      "end": 8
    },
    "highlightMuscles": [
      "quadriceps",
      "glute-max"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-squat-evidence.json",
            "sha256": "92bccc1d37c4134e36f6ac626d735e9fd6dd099b4448dc112e867477e4a1a74d",
            "bytes": 7849
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          63,
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
            "path": "qa/reviews/h-squat-evidence.json",
            "sha256": "92bccc1d37c4134e36f6ac626d735e9fd6dd099b4448dc112e867477e4a1a74d",
            "bytes": 7849
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          63,
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
            "path": "qa/reviews/h-squat-evidence.json",
            "sha256": "92bccc1d37c4134e36f6ac626d735e9fd6dd099b4448dc112e867477e4a1a74d",
            "bytes": 7849
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          63,
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
            "path": "qa/reviews/h-squat-evidence.json",
            "sha256": "92bccc1d37c4134e36f6ac626d735e9fd6dd099b4448dc112e867477e4a1a74d",
            "bytes": 7849
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          63,
          90,
          120,
          150,
          180,
          210,
          239,
          240
        ]
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
    "skins": {
      "realistic": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "d802f9f734122dba67a65c50b077c620c583150da7b6dc497c9c1c1944323aac",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/h-squat/layer-manifest.json",
          "sha256": "6c018605b4708b9f9b3b7a54c96e191ecaf0fda7c681606d67156b58d087ca03",
          "bytes": 12329
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-squat/body/index.json",
            "sha256": "1a4269a67da527bb1321b2ad34d2d290c4d02c50cad284304f42b450fc31085b",
            "bytes": 53129
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
            "path": "masters/realistic/h-squat/highlight/index.json",
            "sha256": "679d648368b95f78f0ec575d02e4c60cf8633779d5aceb980e0c81fe239e3fdd",
            "bytes": 54089
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
            "path": "masters/realistic/h-squat/shadow/index.json",
            "sha256": "d3a456c95f30cdf7a8f0a10434e1e720895a0e5a0a1b0ebb8e8f9e48eec7db81",
            "bytes": 53369
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
        "occlusionSha256": "d802f9f734122dba67a65c50b077c620c583150da7b6dc497c9c1c1944323aac",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/h-squat/layer-manifest.json",
          "sha256": "0bec9c6dc0d1393a1d9d3154a08737d1382e35f4a686d40647e603fd548aa67c",
          "bytes": 12581
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/h-squat/body/index.json",
            "sha256": "42fc63251a1ed66aa838b57ffb2f907d372a7dfc3a997b13f98ea60f19450089",
            "bytes": 53369
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
        "occlusionSha256": "d802f9f734122dba67a65c50b077c620c583150da7b6dc497c9c1c1944323aac",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/h-squat/layer-manifest.json",
          "sha256": "878a884d341170a623df32abb0c41c9e3966d90d91707dea35915f8bf3b3d9c7",
          "bytes": 12581
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/h-squat/body/index.json",
            "sha256": "038a54f65a6b6ad9e96b2d8cacced0c503168d4d52c418967e07033e146f637c",
            "bytes": 53369
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
        "occlusionSha256": "d802f9f734122dba67a65c50b077c620c583150da7b6dc497c9c1c1944323aac",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/h-squat/layer-manifest.json",
          "sha256": "df46f97c94810358f307dfbffb147159aa61e8e0225200f82fc3da57c6ba1fd2",
          "bytes": 12589
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/h-squat/body/index.json",
            "sha256": "90000c5d4410e09e6a049c6fb42d9fa345d0ef1dedb9239185e15d0cfb84c697",
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
      },
      "hologram": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "d802f9f734122dba67a65c50b077c620c583150da7b6dc497c9c1c1944323aac",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/h-squat/layer-manifest.json",
          "sha256": "99d7115c5abc0a7acbfe1d669e5423267032a0a6077ecdc3dae0ad8e2efc20a7",
          "bytes": 12573
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/h-squat/body/index.json",
            "sha256": "d56ba6a81697751aeba9e5bc5f5c78560d09dc0164cac47598fd24eecc534e84",
            "bytes": 52889
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
          "path": "qa/reviews/h-squat-evidence.json",
          "sha256": "92bccc1d37c4134e36f6ac626d735e9fd6dd099b4448dc112e867477e4a1a74d",
          "bytes": 7849
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
          "path": "derivatives/realistic/h-squat/dark/loop.720.mp4",
          "sha256": "671fbe632a8b2e909cbf41e2773057a79169273df2151cf8ff419be3c9b3c000",
          "bytes": 457758,
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
          "path": "derivatives/realistic/h-squat/dark/cover.720.jpg",
          "sha256": "684295ae59bb8e741efe5cf3eb3bc0bc30dd6d7c6bb49c190fe6b0ef5f997928",
          "bytes": 28720,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-squat/dark/thumbnail.240.jpg",
          "sha256": "bc22609dacf6795715ea4ca747eea158c7fe814a5a4d71fadabe80bd9117a710",
          "bytes": 5937,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/dark/start.720.png",
              "sha256": "601b9aaac15985d6a88b3edeae7551192679086ab7d4b24e451932c1a0b612d9",
              "bytes": 66907,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/dark/peak.720.png",
              "sha256": "2e185ccac647e7274ba4ab528fb17a14668f42a77e7812a26e0a4bbed83b4000",
              "bytes": 70376,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/dark/end.720.png",
              "sha256": "88a0724b2ba1f7f0cf0e8691fe5acd32bee48a24eaaaf3b48d950cf07734805b",
              "bytes": 67026,
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
          "path": "derivatives/realistic/h-squat/light/loop.720.mp4",
          "sha256": "72e0d1df60e245ebdea27ff5b0e0119a2615ace39d5ffb234834f09c9f3e1f41",
          "bytes": 483212,
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
          "path": "derivatives/realistic/h-squat/light/cover.720.jpg",
          "sha256": "2ea4385ec84c63de86eda3b89658b3b5cd6337ab6aa283012caf1abd1acfb995",
          "bytes": 34483,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-squat/light/thumbnail.240.jpg",
          "sha256": "896372141759d47505e7aa8d34dd1a2b3da64b48ddb8c1c724b480579bc6cdce",
          "bytes": 7920,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/light/start.720.png",
              "sha256": "1b24e3a2cca464d682d76561138af0d1306c771a690153a55244c67c2eb0a944",
              "bytes": 73290,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/light/peak.720.png",
              "sha256": "b821bb04bb07a6229ccde55cc6a0be8afa034e541fcc1f5f5988d116a647bbfd",
              "bytes": 79523,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-squat/light/end.720.png",
              "sha256": "aa3aeeec11ce36ebcb22a0abe9cfee76764cbd71659f1f038cf7818c2cddaa98",
              "bytes": 73578,
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
          "path": "derivatives/tech-white/h-squat/dark/loop.720.mp4",
          "sha256": "2312e1cc5459fa0b19544a611a19414f3f204cbfd87576170d4eadbf4b88c1ea",
          "bytes": 704269,
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
          "path": "derivatives/tech-white/h-squat/dark/cover.720.jpg",
          "sha256": "80db0b7a5c574d6a4c41c6ae61698341c0db38a30ffe15eedfb2fdee0071dd17",
          "bytes": 37454,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-squat/dark/thumbnail.240.jpg",
          "sha256": "57715c73397237cd76ac06dfc9521236920be31a80a6183c55107df4264861c3",
          "bytes": 7702,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/dark/start.720.png",
              "sha256": "1fd50808bafa2524fb4a134d410b691cc869a3b5ccc0063cbf066beeee48e0b4",
              "bytes": 92564,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/dark/peak.720.png",
              "sha256": "6054f02c0a2ebbc9b2ba0fe6070893e27f8ba7a23ad5e9354efe44b7052246a3",
              "bytes": 93885,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/dark/end.720.png",
              "sha256": "0ffc28a7da8eb0b0faee1455ac55b0da5c737f1356df88754feed12a0ac5de0d",
              "bytes": 92610,
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
          "path": "derivatives/tech-white/h-squat/light/loop.720.mp4",
          "sha256": "c6ca572ba7c8f5c031659b78eba324383ce509b2f47ad5502fc16d9e13fa0507",
          "bytes": 634401,
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
          "path": "derivatives/tech-white/h-squat/light/cover.720.jpg",
          "sha256": "92539fc18c551f2ed3af364c5c8851172bc9ffa266bbd3d26e420c1bd510e3d2",
          "bytes": 34137,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-squat/light/thumbnail.240.jpg",
          "sha256": "ddd0c408101fd68275d20255180c27f835e7ad69fc4f71324b6ba6d003bce772",
          "bytes": 6461,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/light/start.720.png",
              "sha256": "e46629efbff25d514cc0ad0a9b338b24de1a05ed35d6e8c6e5c9c7b833f97a7d",
              "bytes": 89231,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/light/peak.720.png",
              "sha256": "4b731d3998c5030bc9ff1643ce2ddf8ba907921c6a335299b93fff3cabc1dfb6",
              "bytes": 90896,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-squat/light/end.720.png",
              "sha256": "0d50492aaa66bde1e785ca5cbecb02668410e37a805a0325e139ceb8595830de",
              "bytes": 89367,
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
          "path": "derivatives/neon-night/h-squat/dark/loop.720.mp4",
          "sha256": "bdfa1477d0da9a23d0cbf451093a93bf1e7d57c9df0d7a63506240f9004af25a",
          "bytes": 739401,
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
          "path": "derivatives/neon-night/h-squat/dark/cover.720.jpg",
          "sha256": "e79c36419a784d5c3fc6c20eedc5a7c8b16951a8fe51b04ea7252f2c041b9f1c",
          "bytes": 36308,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-squat/dark/thumbnail.240.jpg",
          "sha256": "0354620095b8791fb0897c653b25ad66423760c2a0fa0e9058670753e5696661",
          "bytes": 6549,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/dark/start.720.png",
              "sha256": "89cc8c4b2b561e5f81afc08dd6c5a92e1131cfd299c6eeec171eaedc1e312e77",
              "bytes": 90607,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/dark/peak.720.png",
              "sha256": "bb06ca42e7839c006d4255e567ed9d81132908396e0fb3b226fcd88a578b68ce",
              "bytes": 90606,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/dark/end.720.png",
              "sha256": "a1ce0cf3a4295b6153974b7ae06f63c8e771d26ac58a83cfecf62f3509f66db2",
              "bytes": 90528,
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
          "path": "derivatives/neon-night/h-squat/light/loop.720.mp4",
          "sha256": "b4e05627c16dadccacebdff8236362ab2fa7cceb2a68f2beb0ff2d00bed9bfc8",
          "bytes": 826085,
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
          "path": "derivatives/neon-night/h-squat/light/cover.720.jpg",
          "sha256": "4449fd9ce232568197307bd7a4978e618672dec4933d17d4181bf5730de73d25",
          "bytes": 44816,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-squat/light/thumbnail.240.jpg",
          "sha256": "3796c34617daa7136e0d19a77589acbc016fd20de3ff626daa28672c2d577459",
          "bytes": 9178,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/light/start.720.png",
              "sha256": "e231fa32dff2c4f2e49f15a6775900cd0092a730e7a4f785f6e14ff398267d88",
              "bytes": 99929,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/light/peak.720.png",
              "sha256": "0dfe2b0099e76be1a0bd647bc9e1df153513cac4905ccf37d2c8c97b1a28c20d",
              "bytes": 103630,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-squat/light/end.720.png",
              "sha256": "11dafcc08b9814d70405a0ae4e6569617772168ba7f3ae949efa707b143ad877",
              "bytes": 100076,
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
          "path": "derivatives/neon-night-b/h-squat/dark/loop.720.mp4",
          "sha256": "8aa3e730d71ab03b545356049b2931b1c9c255e8e194c71a551d363b1ec637ab",
          "bytes": 758691,
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
          "path": "derivatives/neon-night-b/h-squat/dark/cover.720.jpg",
          "sha256": "eee58cc28d353271332dad966b6c5c686cffb6896399e6e199bce0ec0c564ff4",
          "bytes": 36318,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-squat/dark/thumbnail.240.jpg",
          "sha256": "4ef96c1d7e861d745f48fbfda48d302f24d9c47fcece0d6cec8e40a02a3b2d40",
          "bytes": 6641,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/dark/start.720.png",
              "sha256": "fba2fe0512cacb4c8c046cb68ca2edd42883f94d1a45a29e819f3c5db03a4278",
              "bytes": 90478,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/dark/peak.720.png",
              "sha256": "77222f3436cd106712527febc75018164c3fc4af5791482033583a0814308a3f",
              "bytes": 90394,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/dark/end.720.png",
              "sha256": "5c1e7cbe098cf2e90c49388d91f3ea922edf2a277d32c2197411c549471de00b",
              "bytes": 90466,
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
          "path": "derivatives/neon-night-b/h-squat/light/loop.720.mp4",
          "sha256": "d398be56565e0e222bcef644fd1cb4f0a58af82cfc1d9fb96cb95ba60647f640",
          "bytes": 837317,
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
          "path": "derivatives/neon-night-b/h-squat/light/cover.720.jpg",
          "sha256": "0b9380a71d5081b528ae3fd20d772dec689a4a9a4419bc9cd29fa647974a1bd4",
          "bytes": 44404,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-squat/light/thumbnail.240.jpg",
          "sha256": "2cc0f25cc536d375ff595e2970c36726f417fa2d2ebd68fc12769682292848b1",
          "bytes": 9082,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/light/start.720.png",
              "sha256": "2635241cce03da8cc8f0b5106bb41bdabf878b9873e311790aea830ca6b1a644",
              "bytes": 99859,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/light/peak.720.png",
              "sha256": "5467377078f4af7f81e7a74f97ae3386b70c90855c6ae34c1a4cb7a8f7207c7f",
              "bytes": 103540,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-squat/light/end.720.png",
              "sha256": "320d8707613952ce6a6a251275ef672614ffe598273744ed3fd6b44e573de989",
              "bytes": 99953,
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
          "path": "derivatives/hologram/h-squat/dark/loop.720.mp4",
          "sha256": "fdf8c246494016ef0e7f2365d9671167d8d779b7e5a3d7940888b34dde686e11",
          "bytes": 824657,
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
          "path": "derivatives/hologram/h-squat/dark/cover.720.jpg",
          "sha256": "82d7d259a102708776368341cbaf2108b0697317e1a32d30d4a59df85d9b7b8c",
          "bytes": 35377,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-squat/dark/thumbnail.240.jpg",
          "sha256": "d16beac067c2c7733caf4a7637b9808e47f64634ea71bfa94dab9f4250a96af7",
          "bytes": 6381,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/dark/start.720.png",
              "sha256": "2c33cedff835e82d4c49319a376d86494a52443d4692538ae5c28dcd97c78535",
              "bytes": 109400,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/dark/peak.720.png",
              "sha256": "16e4f5d76c5d506848fad752d0d2d5a13f6dee28e72bba62c6e5b26919709ba5",
              "bytes": 108150,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/dark/end.720.png",
              "sha256": "2131cf5036c2c3fc9cea445d9088e05712c38a6e0acf5f6bfcfecc77d835c28f",
              "bytes": 109258,
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
          "path": "derivatives/hologram/h-squat/light/loop.720.mp4",
          "sha256": "1bbdabd35b7f737c31d8a364dc235409c2fa5a8748b4af06fa30ceae37d87ffb",
          "bytes": 435207,
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
          "path": "derivatives/hologram/h-squat/light/cover.720.jpg",
          "sha256": "ae0d3ab8f97e3d3ec7a33ab1b2002e8c0686a3fd1e078d8b3140b23ace2a7774",
          "bytes": 31430,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-squat/light/thumbnail.240.jpg",
          "sha256": "39253efa76d53545ae79e4073079169c6e11143a1912edfad5ee6b9cb32ba64e",
          "bytes": 6504,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/light/start.720.png",
              "sha256": "56e56d5b4fbd005e9c1e8498ca2e7b000bde8f0bbf141f340cd963ad72489877",
              "bytes": 99177,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/light/peak.720.png",
              "sha256": "1f8f3f6d9269a2bab0b95cc294a695cc9524f613a64a1b4f8eaed886196b3ddd",
              "bytes": 101252,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-squat/light/end.720.png",
              "sha256": "17e11bd62c80ccf994fe5f97f8150ab0430498eb824cc09830572203703f01e1",
              "bytes": 99261,
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
        "path": "derivatives/realistic/h-squat/cover.transparent.1080.png",
        "sha256": "80cbde3c0ee0ae8cb14efa416d115e3eac3d80af692f70c40f03a92ae0af5633",
        "bytes": 141433,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/h-squat/cover.transparent.1080.png",
        "sha256": "585a44644912cac00a2627b6d4f1580dcb902e48eb9d24555bec001950ef9a30",
        "bytes": 178491,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/h-squat/cover.transparent.1080.png",
        "sha256": "756ea04629ba5f9ed1b717a0172a23ca311e340c50c658ee8d296c83222a5b13",
        "bytes": 198887,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/h-squat/cover.transparent.1080.png",
        "sha256": "58b2c774adb9896c6b50e048224e6e1c7e34d46a1814f03afa8b7a69f9fe5f0d",
        "bytes": 198428,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/h-squat/cover.transparent.1080.png",
        "sha256": "fdd455cf7ba852e4557cf433ebbb482342eb79762b4c2b06e2ed579f4639d756",
        "bytes": 296066,
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
        "path": "manifests/framing/h-squat.json",
        "sha256": "95a334bae28d95adc2cb3c63078a8afa56c5931018beb15c636dc6a961eff960",
        "bytes": 295
      }
    },
    "framingId": "fixed-square-95a334bae28d95ad"
  },
  "voice": {
    "actionId": "h-squat",
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
      "path": "manifests/h-squat.json",
      "sha256": "6f3eaed047b5389f61b47f3cab2d817e56d21a71a3883f35c606a58f4fa8caf7",
      "bytes": 27771
    }
  }
}
```
