# 卷腹 / Crunch

ID: `h-crunch`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "卷腹",
    "en": "Crunch"
  },
  "purpose": {
    "zh": "练腹部",
    "en": "Train controlled trunk flexion with a small curl of the upper back."
  },
  "tags": {
    "category": "core",
    "activeMuscles": [
      "abs"
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
        "zh": "用腹部卷起上背，双手沿大腿向前伸",
        "en": "Use your abs to curl your upper back up and reach your hands along your thighs"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "双脚踩稳，缓慢把肩胛区域卷离垫面",
        "en": "Keep the feet planted and slowly curl the shoulder-blade area off the mat."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "颈部自然延长，不用抬头带动身体",
        "en": "Keep the neck long rather than leading the movement with the head."
      },
      "primary": false
    },
    {
      "id": "cue4",
      "text": {
        "zh": "缓慢放回，保持呼吸，不憋气猛起",
        "en": "Lower slowly and keep breathing instead of jerking up or holding your breath."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "猛抬头、下巴紧压胸口或用惯性起身",
      "en": "Throwing the head, pressing the chin hard into the chest or using momentum."
    },
    {
      "zh": "把小幅卷腹做成完整坐起，腰背失去控制",
      "en": "Turning the small crunch into a full sit-up and losing lower-back control."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "颈：头颈跟随上背自然移动，不猛伸或猛缩。",
        "en": "Neck: let the head follow the upper back naturally without forcing it forwards or backwards."
      },
      {
        "zh": "腰背：维持小幅可控卷起，双脚与骨盆保持稳定。",
        "en": "Lower back: keep the curl small and controlled while the feet and pelvis stay stable."
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
        "zh": "已有医嘱限制仰卧训练或脊柱屈曲时，先取得许可。",
        "en": "Obtain clearance first if supine exercise or spinal flexion has been restricted."
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
    "w-dead-bug"
  ],
  "regressions": [],
  "progressions": [
    "h-reverse-crunch"
  ],
  "defaultDose": {
    "mode": "reps",
    "sets": 3,
    "reps": 15,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      4
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
    "source": "b001-source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.4
      },
      {
        "id": "curlUp",
        "seconds": 1.2
      },
      {
        "id": "squeeze",
        "seconds": 0.6
      },
      {
        "id": "rollDown",
        "seconds": 1.4
      },
      {
        "id": "reset",
        "seconds": 0.4
      }
    ]
  },
  "countingSemantics": "One curl and controlled lowering counts as one rep; 8 seconds contains two reps.",
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
    "源spec双臂沿大腿前伸，并未手扶耳侧；旧catalog首条扶耳cue与源不同，本稿已按真实轨迹更正。",
    "旧h-reverse-crunch.alternative明确指向h-crunch，反向列进阶为教学候选；w-dead-bug是腹部控制目标替代而非等价屈曲动作。独立降阶ID未有，先用同ID更小幅度。",
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
      "path": "drill-anim/specs/h-crunch-r2.js",
      "sha256": "0b46489fdcc2fb8d91aa175d5c1f70ee96830d1df75bfb3ea7b40d8e2fef8813",
      "bytes": 468,
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
        "path": "drill-anim/specs/h-crunch.js",
        "sha256": "6e8b9f79d994da108335d4383ab189e7e3b27290f2466a2c021e5055c5b7fe8d",
        "bytes": 2967,
        "normalization": "lf"
      }
    ],
    "keyMoments": {
      "start": 0,
      "peak": 1.9,
      "end": 8
    },
    "highlightMuscles": [
      "abs"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T22:29:22.610332+08:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-crunch-evidence.json",
            "sha256": "f04bcc03e2d6742eb5e7e6e306a58a11bda39a993d88d718c04d310da27a6fc0",
            "bytes": 7859
          }
        ],
        "framesReviewed": [
          0,
          30,
          57,
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
            "path": "qa/reviews/h-crunch-evidence.json",
            "sha256": "f04bcc03e2d6742eb5e7e6e306a58a11bda39a993d88d718c04d310da27a6fc0",
            "bytes": 7859
          }
        ],
        "framesReviewed": [
          0,
          30,
          57,
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
            "path": "qa/reviews/h-crunch-evidence.json",
            "sha256": "f04bcc03e2d6742eb5e7e6e306a58a11bda39a993d88d718c04d310da27a6fc0",
            "bytes": 7859
          }
        ],
        "framesReviewed": [
          0,
          30,
          57,
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
            "path": "qa/reviews/h-crunch-evidence.json",
            "sha256": "f04bcc03e2d6742eb5e7e6e306a58a11bda39a993d88d718c04d310da27a6fc0",
            "bytes": 7859
          }
        ],
        "framesReviewed": [
          0,
          30,
          57,
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
        "occlusionSha256": "223a0ee0858c3003c576f4e0a1309299ca6d940e3935932a742dec19239f5d69",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/h-crunch/layer-manifest.json",
          "sha256": "4609ffd161766792e3a653034ea68e1d39e692c90e3755ba8b4d6cae66307065",
          "bytes": 13096
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-crunch/body/index.json",
            "sha256": "b52e3f30bd2480383e70941ea39559b38e6339a2e2d2f2363d532ea5409241c9",
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
            "path": "masters/realistic/h-crunch/highlight/index.json",
            "sha256": "108968823c0ee878ee88fdd032a955e695df26a53728548a6e887de87c61fe58",
            "bytes": 54329
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
            "path": "masters/realistic/h-crunch/shadow/index.json",
            "sha256": "363ea0f9aeef1908fc25b4ace15cb58010c215639d518d48620baae21dd72e52",
            "bytes": 53609
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
        "occlusionSha256": "223a0ee0858c3003c576f4e0a1309299ca6d940e3935932a742dec19239f5d69",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/h-crunch/layer-manifest.json",
          "sha256": "b79ee9e9709e14faee10debb81c7305b295d2a27e8b5834e43611050946cbc7f",
          "bytes": 13348
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/h-crunch/body/index.json",
            "sha256": "ca4070b7b4d4d405ed28a88ebeeac5f0bc9185a9e7891ddccd6af428afe43162",
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
        "occlusionSha256": "223a0ee0858c3003c576f4e0a1309299ca6d940e3935932a742dec19239f5d69",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/h-crunch/layer-manifest.json",
          "sha256": "911b9369c675a811b349a99c58be408e042f51fd663b48fee3bbb6af0e81ed7b",
          "bytes": 13348
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/h-crunch/body/index.json",
            "sha256": "ffcfa33910414e931da0d814497d7e7fc8cbe318b9b7f21f69ee4b9880d1114c",
            "bytes": 53414
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
        "occlusionSha256": "223a0ee0858c3003c576f4e0a1309299ca6d940e3935932a742dec19239f5d69",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/h-crunch/layer-manifest.json",
          "sha256": "8bcfd7d94d9a19a95cabb0c85144a752aea926b8dd422310d6e5ae00981f800b",
          "bytes": 13356
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/h-crunch/body/index.json",
            "sha256": "6c2b6e6d1e546d136aab7a257f3ccc27b6782a74e3529cbfbf426863a55dfa0a",
            "bytes": 53888
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
        "occlusionSha256": "223a0ee0858c3003c576f4e0a1309299ca6d940e3935932a742dec19239f5d69",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/h-crunch/layer-manifest.json",
          "sha256": "e48c01a1620047f1d95bd097dc6e86f12ba062b10bba6702bfb96c8e8ac2854b",
          "bytes": 13341
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/h-crunch/body/index.json",
            "sha256": "6e2a978c0597c1cc388793afaab399965bd2de78de8e339eff22a92202fa52a6",
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
          "path": "qa/reviews/h-crunch-evidence.json",
          "sha256": "f04bcc03e2d6742eb5e7e6e306a58a11bda39a993d88d718c04d310da27a6fc0",
          "bytes": 7859
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
          "path": "derivatives/realistic/h-crunch/dark/loop.720.mp4",
          "sha256": "aa2cb73c89e2324990159aa1aa2fc0c7a9bf87ee804b42f4f5b59b755f5fec14",
          "bytes": 385866,
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
          "path": "derivatives/realistic/h-crunch/dark/cover.720.jpg",
          "sha256": "4987c516e14c6c9cb7643ded9837b0a953f4702d767e5a4d9d0f9536db6b5ee5",
          "bytes": 27697,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-crunch/dark/thumbnail.240.jpg",
          "sha256": "c0dbbc13d6ecf939e12d6baa6c54f0070b04b614ffb48d0517ce12465820e238",
          "bytes": 5433,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/dark/start.720.png",
              "sha256": "cd20f49158108d4c3d69ef2c73c7f5c08f79fccf69a8520cf2f7db479c5f54fa",
              "bytes": 58852,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/dark/peak.720.png",
              "sha256": "bcdf170f9d28f5a7f7dadd39b10309baa6e51d22b3c77d006f602c4b50e5068c",
              "bytes": 69790,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/dark/end.720.png",
              "sha256": "383c2c8823c71da6f3c3dc776705b1cb2f4b8aca64251bcab3b84013610dc7bc",
              "bytes": 58917,
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
          "path": "derivatives/realistic/h-crunch/light/loop.720.mp4",
          "sha256": "cf37d628920a2ba85c8251a6ee498cdbb381b99c2d3ea414734118df77c428ee",
          "bytes": 386444,
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
          "path": "derivatives/realistic/h-crunch/light/cover.720.jpg",
          "sha256": "d0c13ff4afaccc650abf50316124855f80fb81ced574fdfee6aecf4b47470d35",
          "bytes": 31706,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-crunch/light/thumbnail.240.jpg",
          "sha256": "741ff9e89a5584cccfad0b7f7a54991f704c5da6b2f62b79254fcecb0353c228",
          "bytes": 6830,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/light/start.720.png",
              "sha256": "9c8c59bbc4285b92e93c89c8e3f18f7b456e50af5c4e3b36c5d0d39aca4c4676",
              "bytes": 63498,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/light/peak.720.png",
              "sha256": "015ff389317ff2bf20edcb84ab6923261652cc4005b0c93f0457c6904835d6cc",
              "bytes": 75623,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-crunch/light/end.720.png",
              "sha256": "5e208807a8ba699d7e88fb55046fe9f54f46a5e640d147ef98f3f3d779c69d07",
              "bytes": 63571,
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
          "path": "derivatives/tech-white/h-crunch/dark/loop.720.mp4",
          "sha256": "cf8a79e9953f7720d6c3ca04cf7556a617224b32b5b252cd811c1c972e417c73",
          "bytes": 488672,
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
          "path": "derivatives/tech-white/h-crunch/dark/cover.720.jpg",
          "sha256": "61e1bf41898cbdf997eb3c424b677f5f2c218ef728052ad9c21a643cae0174e1",
          "bytes": 35943,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-crunch/dark/thumbnail.240.jpg",
          "sha256": "26aa76f3b034722be48a7c8d481e9449141a15c1896c1e321b2281f862ab9b6a",
          "bytes": 7050,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/dark/start.720.png",
              "sha256": "40a8c6507d2bf1ef95f63902dacb7938de09b41ec5ec997cdc4e813f69ac83d6",
              "bytes": 80938,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/dark/peak.720.png",
              "sha256": "5a14a112962ed92dc0aa9b567ec30a20665be40da664365e47fb7f24a0baef1c",
              "bytes": 92492,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/dark/end.720.png",
              "sha256": "b02c30d04524398ab3fba796d6e06f061a582cf7aa1b9fe4d84e4bf32743691e",
              "bytes": 81027,
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
          "path": "derivatives/tech-white/h-crunch/light/loop.720.mp4",
          "sha256": "0e60b979a77d9d0dee974a8a043f4d3d01fc5c0fdc77daf55003d380cafa5f4f",
          "bytes": 482476,
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
          "path": "derivatives/tech-white/h-crunch/light/cover.720.jpg",
          "sha256": "04b0081f6bdea03dfb5735c27d71fa04c3d134d54bebe50820d0bd40d1ef1dc1",
          "bytes": 35787,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-crunch/light/thumbnail.240.jpg",
          "sha256": "750d568e7824d7e29864017df02a738768ff460ddbf5f2bbbb4ada6dc147c10f",
          "bytes": 6943,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/light/start.720.png",
              "sha256": "158e6019ba905d83376f5ddb901828b5a74a49090ae34bdcedb8dd49e5145a72",
              "bytes": 81921,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/light/peak.720.png",
              "sha256": "38ffece3b1d53ad05066969de80ac5cca5646923a3d25089dbfa102eba354775",
              "bytes": 92157,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-crunch/light/end.720.png",
              "sha256": "2222e26b27286ba062757ccb01b0ae53be7bc9219165358949778b125c9facc9",
              "bytes": 82010,
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
          "path": "derivatives/neon-night/h-crunch/dark/loop.720.mp4",
          "sha256": "603e1f1ce7aee94e51de285488c75fc11e9ee47cbb50d87e914d9d8feefdb823",
          "bytes": 476855,
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
          "path": "derivatives/neon-night/h-crunch/dark/cover.720.jpg",
          "sha256": "a05160c32a00e50e50009d708b7b81e681aa18573b0e0c93bb3781e96f5c5903",
          "bytes": 35863,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-crunch/dark/thumbnail.240.jpg",
          "sha256": "606419ba81b7419d8c2c4a8279e5ea7ff7f07065c465e311e41b0fd43a4a7d18",
          "bytes": 6578,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/dark/start.720.png",
              "sha256": "e695066c2425136261c1cb5595635f516170354d289ee073e4a8b119553c0c3c",
              "bytes": 82098,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/dark/peak.720.png",
              "sha256": "6fc2b46c177ea607b5aa5ded3ce552a034bf0e1e7f67e935ff267ce124875fa8",
              "bytes": 92188,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/dark/end.720.png",
              "sha256": "7a5d7e0afe2acd6140ac8d421211ebeeeb41e8b9e6177fbc6f27e44a55fd406b",
              "bytes": 82151,
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
          "path": "derivatives/neon-night/h-crunch/light/loop.720.mp4",
          "sha256": "36598ea55e7c05500ef5a559a05bfb494de0c0b1d7e3e8b4d3a77144df7e4ac0",
          "bytes": 508778,
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
          "path": "derivatives/neon-night/h-crunch/light/cover.720.jpg",
          "sha256": "be0da726c4ecc36a8fd1607cf61549c4397c48ba680df1409c15fdfc06d42ad3",
          "bytes": 41098,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-crunch/light/thumbnail.240.jpg",
          "sha256": "0eb1bf0bb69799a1cacaa4e92dbae3d35d4588bdddb3cf1f1adfd62fa1c576f4",
          "bytes": 8298,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/light/start.720.png",
              "sha256": "699fea94bc79eccbfe321e912a331ef7fbd7df04604bd3afa850f3d9a063f9c9",
              "bytes": 87144,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/light/peak.720.png",
              "sha256": "55cbd7cd65fae0c66eaae641691362cd5de3db5c8c19a7ae5c81637177050c7e",
              "bytes": 99762,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-crunch/light/end.720.png",
              "sha256": "b4965d8e4f44462c2f0e34079ed13a2e655fbe9f1a383766c4bc1e059b871022",
              "bytes": 87423,
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
          "path": "derivatives/neon-night-b/h-crunch/dark/loop.720.mp4",
          "sha256": "e1db67a0db41f99dc5cdc4d7690de8fd2b9d2d10ec3979f03bb75449f234ec84",
          "bytes": 489056,
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
          "path": "derivatives/neon-night-b/h-crunch/dark/cover.720.jpg",
          "sha256": "956081d809bba7e32baa78e8f0f8ade6d8ae2fabbe6456dcb072812eac49206f",
          "bytes": 35769,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-crunch/dark/thumbnail.240.jpg",
          "sha256": "77fda7a724c62ab6e6bc2b6b708ffc192d3a0207cbe741cf3bd703f4d5149d5c",
          "bytes": 6605,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/dark/start.720.png",
              "sha256": "a85c2f7669585cc0be7c8289afbbeefe25fa98dc0897ba3d391144c372f6ac8d",
              "bytes": 81802,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/dark/peak.720.png",
              "sha256": "ec68e1808ac974d322bd1b803721511f02920e4320da0dd86e562431ca9340f2",
              "bytes": 91879,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/dark/end.720.png",
              "sha256": "a90e70cae24663a6c38fd9bea4482db4dd8ff99ddf01d49b1d5bbebc37744a0c",
              "bytes": 81842,
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
          "path": "derivatives/neon-night-b/h-crunch/light/loop.720.mp4",
          "sha256": "250866db23b496dfc744a4340ae675664b7828fbb35e49d7f1fe2d5c200ed980",
          "bytes": 518504,
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
          "path": "derivatives/neon-night-b/h-crunch/light/cover.720.jpg",
          "sha256": "9569400671070b18ae38f39b6f3bdf4acf55d7258def417563d0941c9a57c09a",
          "bytes": 40784,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-crunch/light/thumbnail.240.jpg",
          "sha256": "db3d514f6f01bd0cadde2ed8729c7d51454b180ae7d594686f6343678d77c220",
          "bytes": 8230,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/light/start.720.png",
              "sha256": "cd80552637e0ba762e6fdebab5cc43952488b70b12a0a454340bcf9524448e64",
              "bytes": 86959,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/light/peak.720.png",
              "sha256": "0a2e277cdd0fd5d6a59bb9d818b88e938ba804b1008ef8a0a500f581868a17a0",
              "bytes": 99592,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-crunch/light/end.720.png",
              "sha256": "2dad1dae50fdacdc36fd59825a87f2a1b19a2ad29e865a70387e28ca58b4d66e",
              "bytes": 87151,
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
          "path": "derivatives/hologram/h-crunch/dark/loop.720.mp4",
          "sha256": "2896974c38e67c84e26e0ab623f19ad337b156f9b031541145c6d9f726dc159c",
          "bytes": 605749,
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
          "path": "derivatives/hologram/h-crunch/dark/cover.720.jpg",
          "sha256": "3d97ba08b5df3ff3b22aeede04f3a5fb5fe0c359711c27610be9dc01aa9249af",
          "bytes": 34382,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-crunch/dark/thumbnail.240.jpg",
          "sha256": "a381a5393e55f8d4605ae558325acee7228ad3cf4eb2bc7fbdd5c08f50928204",
          "bytes": 6167,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/dark/start.720.png",
              "sha256": "e0e1d301d529391c4e3b9637babfdd3fb0ca5841ce49a5bf5094982a79b139d8",
              "bytes": 87537,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/dark/peak.720.png",
              "sha256": "9593f9b04f10e68fbeaecc1177b8856cf1beebe25542fe82bfc2c7af34339c14",
              "bytes": 97685,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/dark/end.720.png",
              "sha256": "432fb907d5d3d48717f49914f07529096d9742378fbb57ea567cb3650c51e74e",
              "bytes": 87611,
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
          "path": "derivatives/hologram/h-crunch/light/loop.720.mp4",
          "sha256": "ce0acc428e12d52283cb824331682a87853ee72f4a115dbbb910c0330499a575",
          "bytes": 331337,
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
          "path": "derivatives/hologram/h-crunch/light/cover.720.jpg",
          "sha256": "4850a18179227fa6de2f671600f9ddcee8df87cab58ca22307e7a7e9ae191f36",
          "bytes": 30096,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-crunch/light/thumbnail.240.jpg",
          "sha256": "39bcc38e2de8602142b97be6ed9348a38ce16d27f613614c6f582061f4a37e54",
          "bytes": 6497,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/light/start.720.png",
              "sha256": "cbad99fb7b06e2e5c77da77f83521e5aefa4ef9072a997ae9ecad9733ab6c9d7",
              "bytes": 78363,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/light/peak.720.png",
              "sha256": "e42509a49910727ba297d090c9fa986e5225bec8de1a23dcca0b900afcd16eda",
              "bytes": 87515,
              "width": 720,
              "height": 720,
              "frame": 57
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-crunch/light/end.720.png",
              "sha256": "a386217af0da9c9281f1345f85648248a81cf7b70cf8e3b20e31aedf98182283",
              "bytes": 78172,
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
        "path": "derivatives/realistic/h-crunch/cover.transparent.1080.png",
        "sha256": "bd2924fba48c3a2855808ce52e0c669f532ae6de881f19b0a3af9a1167806c54",
        "bytes": 157242,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/h-crunch/cover.transparent.1080.png",
        "sha256": "747a6ac5fbe727f11262578394398ef756b7a6da2a4180f4b12ce39111f2443f",
        "bytes": 197137,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/h-crunch/cover.transparent.1080.png",
        "sha256": "209bdb5ce5652304ae68643734126058a477d299b03696b7b2e2487ffd994c01",
        "bytes": 211466,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/h-crunch/cover.transparent.1080.png",
        "sha256": "b2e84db7a201e5e7bff2e9b5e8ae51289e76856f2c2ae15c8fad3c1084bc86d4",
        "bytes": 211533,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/h-crunch/cover.transparent.1080.png",
        "sha256": "1e0e1c71a141b2f13354d1e2d49e18171c1a0d4edf1ac73d996e4f2c185fdd9b",
        "bytes": 256603,
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
        "path": "manifests/framing/h-crunch.json",
        "sha256": "2b890b433b21378a20556110990197cf4eb57dc3738873e466b60b9d029b0898",
        "bytes": 293
      }
    },
    "framingId": "fixed-square-2b890b433b21378a"
  },
  "voice": {
    "actionId": "h-crunch",
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
      "path": "manifests/h-crunch.json",
      "sha256": "715fa28d9bbfe74f4d2147cc3eeb6ed4a906686a59f8250009677a67ba718294",
      "bytes": 27837
    }
  }
}
```
