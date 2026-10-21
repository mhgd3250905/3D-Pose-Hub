# 四足猫牛式 / Quadruped Cat-Cow

ID: `h-catcow-quad`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "四足猫牛式",
    "en": "Quadruped Cat-Cow"
  },
  "purpose": {
    "zh": "活动下背和腹部",
    "en": "Practice gentle spinal movement from a stable quadruped position."
  },
  "tags": {
    "category": "mobility",
    "activeMuscles": [
      "erectors",
      "abs"
    ],
    "synergistMuscles": [
      "deltoids",
      "forearms"
    ],
    "equipment": [
      "mat"
    ],
    "position": "quadruped",
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
        "zh": "收腹拱背，缓慢抬胸，手脚保持稳定",
        "en": "Round your back, then gently lift your chest, keeping your hands and knees still"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "手掌与膝盖保持稳定支撑，慢慢活动脊柱",
        "en": "Keep your palms and knees stable as you gently move your spine."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "头颈跟随躯干自然活动，保持呼吸",
        "en": "Let your head and neck follow the torso naturally and keep breathing."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "动作过快或用力甩头",
      "en": "Moving too quickly or throwing the head."
    },
    {
      "zh": "手脚不断移动，支撑位置失稳",
      "en": "Shifting the hands and knees and losing a stable base."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "手腕与肩：手掌稳固承托，肩部不过度耸起，手腕不适时改用已审核的坐姿替代。",
        "en": "Wrists and shoulders: keep the palms supported without shrugging; use a reviewed seated alternative if wrist loading is uncomfortable."
      },
      {
        "zh": "膝：使用舒适垫面，膝盖支撑位置保持稳定。",
        "en": "Knees: use comfortable padding and keep the knee support positions stable."
      },
      {
        "zh": "腰背与颈：缓慢在舒适范围内活动，头颈自然跟随躯干，不猛抬头或强行塌腰。",
        "en": "Back and neck: move slowly within a comfortable range, letting the head follow the trunk without throwing it back or forcing the lower back."
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
        "zh": "本动作引发疼痛时停止，不通过加深动作或加重继续；先向医生或物理治疗师确认。",
        "en": "Stop if this exercise causes pain; do not push deeper or add load before seeking clinical advice."
      },
      {
        "zh": "已有医嘱限制脊柱屈伸或手腕、膝部承重时，先取得许可再做四足版本。",
        "en": "Obtain clearance first if spinal flexion/extension or wrist or knee loading has been restricted."
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
    "o-seated-catcow"
  ],
  "regressions": [
    "o-seated-catcow"
  ],
  "progressions": [
    "w-bird-dog"
  ],
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
    "source": "source-timeline",
    "phases": [
      {
        "id": "roundBack",
        "seconds": 1
      },
      {
        "id": "catHold",
        "seconds": 0.6
      },
      {
        "id": "toCow",
        "seconds": 1.2
      },
      {
        "id": "cowHold",
        "seconds": 0.6
      },
      {
        "id": "returnNeutral",
        "seconds": 0.6
      }
    ]
  },
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
    "定义内容已补为具体双语草稿；cautions、contraindications、关系候选和协同标签有数据，review pending表示待审核，不表示这些字段缺数据。",
    "禁用条件仅覆盖疼痛停止与既有临床限制等通用筛查，不是疾病特异的完整绝对禁忌清单；未据此宣称任何疾病或术后状态均禁止运动。",
    "o-seated-catcow源spec是相同猫牛屈伸模式、手放膝上的坐姿版本，可作去掉四足手腕膝承重的替代/降阶；需要稳定椅具，节奏不能照搬四足版本。",
    "w-bird-dog是进一步的四足对侧肢体离地稳定训练，列为脊柱控制目标的进阶草稿，不是让猫牛式做更大屈伸；须先能在中立位稳定支撑并另审手腕/膝适应性。",
    "deltoids/forearms表示手撑承重与腕部稳定的协同，不应成为猫牛式主动举肩或腕屈伸的指令。",
    "证据/推断边界见catalog/v2/definition-evidence.md（仓库原目录/源spec与权威一手资料；全部编辑审核仍pending）。",
    "医学安全参考：AAOS Spine Conditioning Program https://www.orthoinfo.org/recovery/spine-conditioning-program/ ; Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program/ ; NHS Strength exercises https://www.nhs.uk/live-well/exercise/strength-exercises/ ; retrieved 2026-10-21."
  ],
  "countingSemantics": "One cat-to-cow-and-neutral cycle lasts 4 seconds; the 8-second loop contains two cycles. Default seconds=40 is timed movement, 10 cycles at the demonstration cadence, not 40 repetitions."
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
      "path": "drill-anim/specs/h-catcow-quad-r2.js",
      "sha256": "3af9063433dcde4c2b742b573c86010aa23e0f8d3810d2194fe0eb5916830130",
      "bytes": 1430,
      "normalization": "lf"
    },
    "keyMoments": {
      "start": 0,
      "peak": 1.3,
      "end": 8
    },
    "highlightMuscles": [
      "erectors",
      "abs"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-catcow-quad-evidence.json",
            "sha256": "059912823b21d73156ca0d99b0f0875016e082376b1e20b7754bd97a628ee313",
            "bytes": 5555
          }
        ],
        "framesReviewed": [
          0,
          30,
          39,
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-catcow-quad-evidence.json",
            "sha256": "059912823b21d73156ca0d99b0f0875016e082376b1e20b7754bd97a628ee313",
            "bytes": 5555
          }
        ],
        "framesReviewed": [
          0,
          30,
          39,
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-catcow-quad-evidence.json",
            "sha256": "059912823b21d73156ca0d99b0f0875016e082376b1e20b7754bd97a628ee313",
            "bytes": 5555
          }
        ],
        "framesReviewed": [
          0,
          30,
          39,
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-catcow-quad-evidence.json",
            "sha256": "059912823b21d73156ca0d99b0f0875016e082376b1e20b7754bd97a628ee313",
            "bytes": 5555
          }
        ],
        "framesReviewed": [
          0,
          30,
          39,
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
        "path": "drill-anim/specs/h-catcow-quad.js",
        "sha256": "d0d3144351d327f09e60fc811e6648533497b1370cb6e1f58d503d51ff8f7bfb",
        "bytes": 3737,
        "normalization": "lf"
      }
    ]
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
        "occlusionSha256": "a8cbe4e539c86a0e039c3f92c4033206a055feebac3bb0902f1a0bb9ca07b942",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/h-catcow-quad/layer-manifest.json",
          "sha256": "a49f534e487908e3af6bc472b77d08ca7759373322470dae0d0ecfd5c63439b9",
          "bytes": 13145
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-catcow-quad/body/index.json",
            "sha256": "6cade35b01d4102022244c76aa2738302d6901afc7ef4ee00bfccb7ce44606c9",
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
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-catcow-quad/highlight/index.json",
            "sha256": "20ca3726517799f0669310ab68ac002797f7e6c2d4208d444ca5e43a21dd280a",
            "bytes": 55529
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
            "path": "masters/realistic/h-catcow-quad/shadow/index.json",
            "sha256": "33dcf8dd166dfe4bf221c925ff0b5ab431dd1cea440981a8ea168d281ddafb55",
            "bytes": 54809
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
        "occlusionSha256": "a8cbe4e539c86a0e039c3f92c4033206a055feebac3bb0902f1a0bb9ca07b942",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/h-catcow-quad/layer-manifest.json",
          "sha256": "f8bea3f51f615a2f65c6482aff9fec640279b3f2b86be8eb9d6e2e5432ac9e4e",
          "bytes": 13397
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/h-catcow-quad/body/index.json",
            "sha256": "9ee5facd0d615d1e4a6ada077002909f479c8e80fcd8d250f65cb2a614792b8d",
            "bytes": 54569
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
        "occlusionSha256": "a8cbe4e539c86a0e039c3f92c4033206a055feebac3bb0902f1a0bb9ca07b942",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/h-catcow-quad/layer-manifest.json",
          "sha256": "e0e5d21390d694d8b10bc59540217ad59ef2714c7556115143fc1c18284d6893",
          "bytes": 13398
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/h-catcow-quad/body/index.json",
            "sha256": "0a8be18b2df9638eb13824d71409e3c27b93638bc8840a6629bd729b01f2e07b",
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
      "neon-night-b": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "a8cbe4e539c86a0e039c3f92c4033206a055feebac3bb0902f1a0bb9ca07b942",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/h-catcow-quad/layer-manifest.json",
          "sha256": "71d82d3eb3d1535bafd4ab5c919738dcb6aa3aff61234d2f58b1bf81b8d81428",
          "bytes": 13406
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/h-catcow-quad/body/index.json",
            "sha256": "fc846a1fe2de48d0cc714b38fc2e1e6b4de01761f26eedf5a7682b50165056bb",
            "bytes": 55289
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
        "occlusionSha256": "a8cbe4e539c86a0e039c3f92c4033206a055feebac3bb0902f1a0bb9ca07b942",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/h-catcow-quad/layer-manifest.json",
          "sha256": "b6a48b7fc5eaf36aad289177e8b3337dc73574b0d7a44ede18f86a0063a23593",
          "bytes": 13390
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/h-catcow-quad/body/index.json",
            "sha256": "9e7e8301c3747985d9e56406c7626c0b7583ce02fd1d2b4cba9559db755f12d3",
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
      }
    },
    "loopReview": {
      "status": "pass",
      "reviewer": "Codex",
      "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
      "evidence": [
        {
          "root": "media",
          "path": "qa/reviews/h-catcow-quad-evidence.json",
          "sha256": "059912823b21d73156ca0d99b0f0875016e082376b1e20b7754bd97a628ee313",
          "bytes": 5555
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
          "path": "derivatives/realistic/h-catcow-quad/dark/loop.720.mp4",
          "sha256": "c5ac58819d284d4468d76bd6104c231b604845a8ef2cbfda8899538aa727acd2",
          "bytes": 304176,
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
          "path": "derivatives/realistic/h-catcow-quad/dark/cover.720.jpg",
          "sha256": "616e423ab486b3df81105260e1b3ba6c4ffb3f9ea8491ebce0b971acb032eed9",
          "bytes": 25191,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-catcow-quad/dark/thumbnail.240.jpg",
          "sha256": "a3440cd9b16cfa80cfc276e5b651e3cb7688cd500eed75793ab6d5b26e5ec08b",
          "bytes": 5042,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/dark/start.720.png",
              "sha256": "d0341a56deb2d93131af5763b54099c168eb538bbda80baf4ee7248b675d68a2",
              "bytes": 58869,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/dark/peak.720.png",
              "sha256": "cb3edd6784127b13d5a1705743639dcf2d1e5327cc2755ee5d470fc229dd9a4f",
              "bytes": 57860,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/dark/end.720.png",
              "sha256": "9f80bae76bf26a252f851a9f6b5f6e2239e5e2fb36fa8d3e32806639b7c0a2d6",
              "bytes": 58927,
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
          "path": "derivatives/realistic/h-catcow-quad/light/loop.720.mp4",
          "sha256": "0d055a4e1377e3b2b3c7ccb0ead10428eb241a5a0ddcd366de70856cedc25ecc",
          "bytes": 306594,
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
          "path": "derivatives/realistic/h-catcow-quad/light/cover.720.jpg",
          "sha256": "b89e1488ccf9b2ddd9f82b2b3089737c1f559f564b96b9d91a38c461d4ed6c4c",
          "bytes": 29242,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-catcow-quad/light/thumbnail.240.jpg",
          "sha256": "cde2fad2a8cec995507f00363754131b2f05dcb888ee0239424e0bcd72a3b4dd",
          "bytes": 6546,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/light/start.720.png",
              "sha256": "b66f10a145c925a2d6a07c81accc0ba3ecbfc901eff38d0f994c04e4996010ea",
              "bytes": 64671,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/light/peak.720.png",
              "sha256": "0b924ea0cbf366e081ec768ed1af8538b0753aaca7f718e0e92182f2d23deff0",
              "bytes": 63621,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-catcow-quad/light/end.720.png",
              "sha256": "c720be3b2ae0ffb98d37f24a7ecc2af9d0f345afed340554a3b13fdcd60353b4",
              "bytes": 64597,
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
          "path": "derivatives/tech-white/h-catcow-quad/dark/loop.720.mp4",
          "sha256": "9021e8edae19e9a0b59ffc724f79735f9a082b51f8fb68446f36bda9dd5bac12",
          "bytes": 394380,
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
          "path": "derivatives/tech-white/h-catcow-quad/dark/cover.720.jpg",
          "sha256": "985cb6772e0be7dd746fe71f026b69d76c9514fbd6e9d7cf7ebe31a6f17283ae",
          "bytes": 32345,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-catcow-quad/dark/thumbnail.240.jpg",
          "sha256": "09b9b1a75b8dda24474474225c968c5ac76d37754fcebcfbb806063e0365ee1f",
          "bytes": 6606,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/dark/start.720.png",
              "sha256": "88e5f35719608d53bb3d5d8ce087d36002b97d628fb25e9e38de5e0540103855",
              "bytes": 79084,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/dark/peak.720.png",
              "sha256": "ccf5f3d8ee1db0af2124fa0c848beda0ad510ff524704b76ce01f667d855d528",
              "bytes": 78376,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/dark/end.720.png",
              "sha256": "cd84260d71e773409f6c53798cadb7a03ed1de873f08e710aa3003d77e7cd53a",
              "bytes": 79215,
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
          "path": "derivatives/tech-white/h-catcow-quad/light/loop.720.mp4",
          "sha256": "85bd503427618ff2ea7e17fe98c42c1ecc91d013ff1ccfc6da4332c25d9c535d",
          "bytes": 379841,
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
          "path": "derivatives/tech-white/h-catcow-quad/light/cover.720.jpg",
          "sha256": "ac71f7fe37f29b616c791dd7b82113957544aec5b1a1a51afcaa4fb424e74c26",
          "bytes": 32649,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-catcow-quad/light/thumbnail.240.jpg",
          "sha256": "285d9ef4c86473dddf27b388a713446c51568915b95927eb07cda499d8fcaa98",
          "bytes": 6718,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/light/start.720.png",
              "sha256": "2430a77e8bf17c9fb670f42071b3e4712309e9ba8cee39401007449bfdba8f8b",
              "bytes": 79839,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/light/peak.720.png",
              "sha256": "ffd5230c60641ad30a27c841e76dcd0e398b9f195e251f9f9117f88ec8ae18f3",
              "bytes": 78940,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-catcow-quad/light/end.720.png",
              "sha256": "ebdc181ed78b48047a6ede0404af090179a66abccda3ecea3e5abcfba23219f2",
              "bytes": 79833,
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
          "path": "derivatives/neon-night/h-catcow-quad/dark/loop.720.mp4",
          "sha256": "2b7ccd26fd4a9364ea81444de916a14e29c749b2ff9075b20d654826c743ce26",
          "bytes": 398921,
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
          "path": "derivatives/neon-night/h-catcow-quad/dark/cover.720.jpg",
          "sha256": "0ed3fced5062a2ce5ed70537d545f478e88b19d0dd557f07debe17cd0fcd4966",
          "bytes": 32670,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-catcow-quad/dark/thumbnail.240.jpg",
          "sha256": "124f892ac490822a86431e026d8772c62eaa228151d9d4f35041c13e9d4759a7",
          "bytes": 6067,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/dark/start.720.png",
              "sha256": "cb31dbd6ca36893591528964f3b41e5cefa5f603a2c296e8a120df35d3d5852d",
              "bytes": 80141,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/dark/peak.720.png",
              "sha256": "a15ba831ee42d1cd8e96fe73b6c122ea3ab5849fde546a56b000a9192b9cc407",
              "bytes": 79016,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/dark/end.720.png",
              "sha256": "e2afa084e56088e620af8bec2db2e0941503166bb083fe28b58f2ad3909453a9",
              "bytes": 80270,
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
          "path": "derivatives/neon-night/h-catcow-quad/light/loop.720.mp4",
          "sha256": "c46c40eac03fa352746cf96023ea267f742066d5dafceafbff1400d51c0e7a01",
          "bytes": 429931,
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
          "path": "derivatives/neon-night/h-catcow-quad/light/cover.720.jpg",
          "sha256": "25e52fc2afedff8accc1f6561ea8a100ec3f673f6368d4b7b4b365d3133e0aa6",
          "bytes": 37610,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-catcow-quad/light/thumbnail.240.jpg",
          "sha256": "dea5ba5f54392d350d8b715223f387d8faab1446909dc7fb6de136e5225c422a",
          "bytes": 7713,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/light/start.720.png",
              "sha256": "2d657947b052077694f58b615e3cb7a68f496c69f8253c715bdcf80f78c27794",
              "bytes": 86450,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/light/peak.720.png",
              "sha256": "a7ee5377c67b91828d6e518e8f45df6983bfddbd73253a263ebef088dcea099f",
              "bytes": 85080,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-catcow-quad/light/end.720.png",
              "sha256": "f1441ecb32530a3f78db3ef3f197a8faa3d52d1be635ecc4ddf73da2d4bdcaca",
              "bytes": 86456,
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
          "path": "derivatives/neon-night-b/h-catcow-quad/dark/loop.720.mp4",
          "sha256": "8c2ac26abf5f730d11a0b4354d9bdc47ed73702ddef9b59c8558bc454bdb748f",
          "bytes": 412325,
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
          "path": "derivatives/neon-night-b/h-catcow-quad/dark/cover.720.jpg",
          "sha256": "6b8d895f43f85a1998fe0ae6aa9c942e45ec2c4d053c781e73a1c1bc9e29cc88",
          "bytes": 32721,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-catcow-quad/dark/thumbnail.240.jpg",
          "sha256": "2628bff48aed0a5b7583de862117e4b66ae1ea70af404ec955def8e6016b6cbf",
          "bytes": 6147,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/dark/start.720.png",
              "sha256": "4af62428ca163e9b8bddd1c11050fd0479fc6b17ac39fd6053b5362434af5cd6",
              "bytes": 79620,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/dark/peak.720.png",
              "sha256": "61662084750957023edbec795821618ee8f301534f3b83c29ac21641b7aa8210",
              "bytes": 78507,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/dark/end.720.png",
              "sha256": "6622c73fc5d6f526304bf34f2fdef4fe4a3d652f12dc92089bbabde0d884ffec",
              "bytes": 79586,
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
          "path": "derivatives/neon-night-b/h-catcow-quad/light/loop.720.mp4",
          "sha256": "d68ba398ab5cf4fa0d8c3bf0fd2c840f36addf87c014be7a5b4ee11c4f90024d",
          "bytes": 438818,
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
          "path": "derivatives/neon-night-b/h-catcow-quad/light/cover.720.jpg",
          "sha256": "d59c69790eac01134397573182941d5cecf065042c324b5ec5574f62e61f76e9",
          "bytes": 37467,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-catcow-quad/light/thumbnail.240.jpg",
          "sha256": "ddb4011df8ddaaf3aa2a46986737bac0461cae2085a105c2ccb99ad741e54182",
          "bytes": 7696,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/light/start.720.png",
              "sha256": "2e512634868cbf37a06e965d4ffea8bd7eede53f57e9ed84a4c315043a437bfb",
              "bytes": 85977,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/light/peak.720.png",
              "sha256": "032a3d7ce48edd752e9895d05bbe73a12afbdc1a41cafe3e333db33903246272",
              "bytes": 84683,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-catcow-quad/light/end.720.png",
              "sha256": "c5300ebd2484813a9f0a4d006d45111e6af4922d7c7c39697b9c8d4ab687100a",
              "bytes": 86031,
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
          "path": "derivatives/hologram/h-catcow-quad/dark/loop.720.mp4",
          "sha256": "2d0070b857d4138bcfbc1311730c3f6749fb79a537392cb58a19bd3ce8c247f5",
          "bytes": 487459,
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
          "path": "derivatives/hologram/h-catcow-quad/dark/cover.720.jpg",
          "sha256": "405488db598599078e71c8e95c4e98186db9313750c500d666bdc99873552004",
          "bytes": 31526,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-catcow-quad/dark/thumbnail.240.jpg",
          "sha256": "55ff8d6f1d13f387f2e92677ba11899d49915d8914b9437326983ca2de0245fa",
          "bytes": 5752,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/dark/start.720.png",
              "sha256": "c0343321d5971f8ec00aed693b051e44ee8be2d4ffb6a9f716a9c9950ffb1177",
              "bytes": 88158,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/dark/peak.720.png",
              "sha256": "8bb3d90868cda087564710a72574c534c428dfb1e895b73aaa23ac8393651314",
              "bytes": 87259,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/dark/end.720.png",
              "sha256": "f626622f167b3c556b1c57fd5cf6a8192377551a1dcc8ad577283528da84aa3d",
              "bytes": 88099,
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
          "path": "derivatives/hologram/h-catcow-quad/light/loop.720.mp4",
          "sha256": "fa6e9435ca50ba0d77998a6cd341b271834efd43faf5626b03b3140a1d8dc8c9",
          "bytes": 275045,
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
          "path": "derivatives/hologram/h-catcow-quad/light/cover.720.jpg",
          "sha256": "74034ea9ffacc34092d0556f7939fccdd4951d2b25fedf276eaf996de0ce249a",
          "bytes": 28789,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-catcow-quad/light/thumbnail.240.jpg",
          "sha256": "99bb1f8cd1caa229d55fb330a6da7f45c7b50594f21ab4d2a7a4272b6c262e3d",
          "bytes": 6321,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/light/start.720.png",
              "sha256": "5f932bd6d08a8e47395b1a2dea8d3ce819893fbb62cdc1c9c819e6789c332b9c",
              "bytes": 83951,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/light/peak.720.png",
              "sha256": "899ee5f241ce4523deb1d518c36336d26c254b49952c068acb244f8a53374c94",
              "bytes": 82426,
              "width": 720,
              "height": 720,
              "frame": 39
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-catcow-quad/light/end.720.png",
              "sha256": "a1c7140118feb6791c4957a3854f5e0771244175686075f524bdae3963882883",
              "bytes": 83933,
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
        "path": "derivatives/realistic/h-catcow-quad/cover.transparent.1080.png",
        "sha256": "5e9b6be62bcd1c4bd715017669b62bf4e732a0348176598d7734ef43739dc650",
        "bytes": 122514,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/h-catcow-quad/cover.transparent.1080.png",
        "sha256": "af666128c01604f4d300121e96209221d52a7d56ffdc2cbcaa6e160bc11df14b",
        "bytes": 158207,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/h-catcow-quad/cover.transparent.1080.png",
        "sha256": "d1c07e1c18d8885843e0da296c8e262914eae14c1cfe36a8389bd95f4db0890d",
        "bytes": 174214,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/h-catcow-quad/cover.transparent.1080.png",
        "sha256": "ad1c1f067d815fea948e05c18bd0579a2fba0657adc255579938e4b613ab6ac7",
        "bytes": 173733,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/h-catcow-quad/cover.transparent.1080.png",
        "sha256": "76a9ad9ed291a1bb24c682fa47846add9d6395e82d16e30d41d8f3cae739f68a",
        "bytes": 231518,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/h-catcow-quad.json",
        "sha256": "9e7b4a57e37cb15565400f99938785bbf5651331273851713a659bcf278cab0a",
        "bytes": 292
      }
    },
    "framingId": "fixed-square-9e7b4a57e37cb155",
    "compositor": {
      "root": "repo",
      "path": "tools/action-package-v2/composite.py",
      "sha256": "fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507",
      "bytes": 21548
    }
  },
  "voice": {
    "actionId": "h-catcow-quad",
    "manifest": {
      "root": "repo",
      "path": "catalog/voice-v2/manifest.json",
      "sha256": "ba775ace59603e534c3dc979fc8a8cc277836427efcd6b10f2e88e16f696336c",
      "bytes": 195389
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
      "path": "manifests/h-catcow-quad.json",
      "sha256": "ad461951dc79653c08f29af5279d62b13310f7b647934304946ad9896e50f160",
      "bytes": 28202
    }
  }
}
```
