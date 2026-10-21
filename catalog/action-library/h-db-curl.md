# 哑铃交替弯举 / Alternating Dumbbell Curl

ID: `h-db-curl`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "哑铃交替弯举",
    "en": "Alternating Dumbbell Curl"
  },
  "purpose": {
    "zh": "练手臂前侧",
    "en": "Train elbow flexion with alternating dumbbell curls."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "biceps"
    ],
    "synergistMuscles": [
      "forearms"
    ],
    "equipment": [
      "dumbbell"
    ],
    "position": "standing",
    "scenes": [
      "home"
    ],
    "difficulty": 1,
    "trainingType": "strength"
  },
  "unilateral": true,
  "startingSide": "right",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "大臂贴住身体，只动小臂",
        "en": "Keep your upper arms by your sides and move only your forearms"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左右交替弯举，下降时继续控制重量",
        "en": "Alternate arms and keep control of the weight as you lower it."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "身体保持稳定，手腕与前臂保持自然对齐",
        "en": "Keep your body steady and your wrists naturally aligned with your forearms."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "身体前后摆动带起哑铃",
      "en": "Rocking the body to lift the dumbbells."
    },
    {
      "zh": "弯举时肘部大幅前移",
      "en": "Moving the elbows far forward during the curl."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "肘：保持大臂靠近身体，控制屈伸，不用身体摆动带起哑铃。",
        "en": "Elbow: keep the upper arms by the body and control the movement without swinging the torso."
      },
      {
        "zh": "手腕：握稳可控制的重量，手腕自然对齐前臂，下降时保持控制。",
        "en": "Wrist: use a controllable load, keep the wrist aligned with the forearm, and lower under control."
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
        "zh": "已有医嘱限制肘屈伸、腕部用力或上肢负重时，先取得许可再做负重弯举。",
        "en": "Obtain clearance first if a clinician has restricted elbow movement, wrist effort or upper-limb loading."
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
    "h-biceps-self"
  ],
  "regressions": [],
  "progressions": [],
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
    "kind": "rep_alternate",
    "leadSeconds": 0,
    "source": "source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "curlUp",
        "seconds": 1.3
      },
      {
        "id": "squeeze",
        "seconds": 0.4
      },
      {
        "id": "lower",
        "seconds": 1.6
      },
      {
        "id": "reset",
        "seconds": 0.4
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
    "替代h-biceps-self已有源spec和docs/drill-catalog.md条目，动作是另一只手提供阻力的肘屈伸；它尚不在旧catalog/catalog.json的142动作内，也未形成v2发布包，消费端在目标入库前不得自动跳转。",
    "独立降阶/进阶ID仍缺：减小哑铃重量、坐姿弯举属于同动作变式；加重也不是新的动作ID。NHS官方strength页面给出轻重量/可坐姿做的做法，但当前仓库没有相应独立坐姿或进阶弯举ID，不伪造。",
    "forearms标签指握持与腕部稳定的协同，非以腕屈伸代替肘弯举。",
    "证据/推断边界见catalog/v2/definition-evidence.md（仓库原目录/源spec与权威一手资料；全部编辑审核仍pending）。",
    "医学安全参考：AAOS Spine Conditioning Program https://www.orthoinfo.org/recovery/spine-conditioning-program/ ; Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program/ ; NHS Strength exercises https://www.nhs.uk/live-well/exercise/strength-exercises/ ; retrieved 2026-10-21."
  ],
  "countingSemantics": "One arm curl and controlled lowering counts as one rep. Alternate arms; 8 seconds contains two reps, right then left. Default reps=12 means 12 total alternating reps, 6 per arm, not 12 per side."
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
      "path": "drill-anim/specs/h-db-curl-r2.js",
      "sha256": "8c09a863d008c13238e204f02a744cc32daf2045622b08bd03bae54e88dec9d0",
      "bytes": 356,
      "normalization": "lf"
    },
    "keyMoments": {
      "switchPoint": {
        "kind": "in-clip",
        "seconds": 4,
        "semantics": "Right side first, then left at second 4. Each side repetition counts once; unilateral does not double the default dose."
      },
      "start": 0,
      "peak": 2.0,
      "end": 8
    },
    "highlightMuscles": [
      "biceps"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-db-curl-evidence.json",
            "sha256": "6231dfadc18caf0f36d08946fa595eb2a299fe9e024c119d4c32da6c720353f6",
            "bytes": 5495
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-db-curl-evidence.json",
            "sha256": "6231dfadc18caf0f36d08946fa595eb2a299fe9e024c119d4c32da6c720353f6",
            "bytes": 5495
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-db-curl-evidence.json",
            "sha256": "6231dfadc18caf0f36d08946fa595eb2a299fe9e024c119d4c32da6c720353f6",
            "bytes": 5495
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/h-db-curl-evidence.json",
            "sha256": "6231dfadc18caf0f36d08946fa595eb2a299fe9e024c119d4c32da6c720353f6",
            "bytes": 5495
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
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/lib/grip.mjs",
        "sha256": "084a94b206cae21926fc94ee060048bcdc37adfabeb7295e688af81f56ce8be9",
        "bytes": 2819,
        "normalization": "lf"
      },
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
        "path": "drill-anim/specs/h-db-curl.js",
        "sha256": "69613f46f3832566ef5a233eaa0989cd7fea060a6e4d2c32d4f887b04ed5e8f8",
        "bytes": 4699,
        "normalization": "lf"
      }
    ],
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
        "occlusionSha256": "12fa4b4bea81848ae002f84dae3141100482251c2f86d8bf6041ba0ce3c8c872",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/h-db-curl/layer-manifest.json",
          "sha256": "528b4c27c094c294e9bb3b456f73c9d0f4c66c7394a8ee7ecae7e9489f537cf5",
          "bytes": 14678
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/h-db-curl/body/index.json",
            "sha256": "fec00fa658cf646459bba3696c8a0bf04712c9e7ece3338d7d8e7b845e0bb2c9",
            "bytes": 53609
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
            "path": "masters/realistic/h-db-curl/highlight/index.json",
            "sha256": "5ca32c3e71309f94dee1c3b6eabb13c03f3105a4392863dc212277c962c30cbf",
            "bytes": 54569
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
            "path": "masters/realistic/h-db-curl/shadow/index.json",
            "sha256": "fa31d6f76c6d531618a6de0ddc94cb5682064815f43f54c65666928095076de8",
            "bytes": 53849
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
        "occlusionSha256": "12fa4b4bea81848ae002f84dae3141100482251c2f86d8bf6041ba0ce3c8c872",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/h-db-curl/layer-manifest.json",
          "sha256": "eb353ed2944548ded346581ac7d7e0ad9e9550dbc1484c66a1a8dc4c4e12d196",
          "bytes": 14930
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/h-db-curl/body/index.json",
            "sha256": "dea110096ba4408c643cbebea8b746d819e77e3ca9785f419db7322d375943d1",
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
      "neon-night": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "12fa4b4bea81848ae002f84dae3141100482251c2f86d8bf6041ba0ce3c8c872",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/h-db-curl/layer-manifest.json",
          "sha256": "6ffc6f5d5b767e2a607ecc27306a34d0432bb5ebb62edc35d04b2d8dfb2a5c82",
          "bytes": 14930
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/h-db-curl/body/index.json",
            "sha256": "539b8b6c6c7848352950e401adce0bed9e8220397e34a8124a7a091c326af771",
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
      "neon-night-b": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "12fa4b4bea81848ae002f84dae3141100482251c2f86d8bf6041ba0ce3c8c872",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/h-db-curl/layer-manifest.json",
          "sha256": "e9f18df1964e9b4b6a73f91bc5b363c8af1a90e5d210d6bfa58e514fc7ff735c",
          "bytes": 14938
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/h-db-curl/body/index.json",
            "sha256": "6902927caafad2ad22dea6015dc3935b32e9254662aa7ac6c19de1eb2a9c1e10",
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
      "hologram": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "12fa4b4bea81848ae002f84dae3141100482251c2f86d8bf6041ba0ce3c8c872",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/h-db-curl/layer-manifest.json",
          "sha256": "7ceb262e02cd5b3f261c5d342f97c40748c6923a76b6d387fbcdbe6adf331c8c",
          "bytes": 14922
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/h-db-curl/body/index.json",
            "sha256": "e2fbef82b562caf6ecf8d5496f0a35fc9eaf01cb26333c7c8d5d308b64a65b28",
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
      }
    },
    "loopReview": {
      "status": "pass",
      "reviewer": "Codex",
      "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
      "evidence": [
        {
          "root": "media",
          "path": "qa/reviews/h-db-curl-evidence.json",
          "sha256": "6231dfadc18caf0f36d08946fa595eb2a299fe9e024c119d4c32da6c720353f6",
          "bytes": 5495
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
          "path": "derivatives/realistic/h-db-curl/dark/loop.720.mp4",
          "sha256": "4f1546cb920a2e7c424931d97ed87b4cc999ea31cf647bcf038398e148ae95e8",
          "bytes": 328281,
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
          "path": "derivatives/realistic/h-db-curl/dark/cover.720.jpg",
          "sha256": "ae5213f8c513105760f42a53947d469d32e0ad95c5e88c46b7e562b579e25522",
          "bytes": 28641,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-db-curl/dark/thumbnail.240.jpg",
          "sha256": "df80053dd04c91567f02fce83fffe6fd06eb08e9da327904b2c116251c5891d3",
          "bytes": 5743,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-db-curl/dark/start.720.png",
              "sha256": "9e41ca8d986699909d84de9c5b424e32b51f9d6878f57a008e10300745e2c76d",
              "bytes": 71455,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-db-curl/dark/peak.720.png",
              "sha256": "4ae813affb31c70a2be66140ed9beafb8540795d7684ab249a327ebe6c06deee",
              "bytes": 72346,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-db-curl/dark/end.720.png",
              "sha256": "2f006c3e362ab018df310f7081ae00d179e5218c0dfb3c658334bc10885e16dc",
              "bytes": 71693,
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
          "path": "derivatives/realistic/h-db-curl/light/loop.720.mp4",
          "sha256": "0310f8f38f13cf132b03db478d238ab099a44076e88e9d6e4076ea977a1f699a",
          "bytes": 322245,
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
          "path": "derivatives/realistic/h-db-curl/light/cover.720.jpg",
          "sha256": "f02dadb174de58bb2a9313b81e06ad46c6526bc9f82785fe18707de20ccc891d",
          "bytes": 34086,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/h-db-curl/light/thumbnail.240.jpg",
          "sha256": "619f89306fc89512d057df20ed90504f4115f30ea1354e68868e70086defdb43",
          "bytes": 7768,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-db-curl/light/start.720.png",
              "sha256": "73992ea00c89e4d0d41c5697967de7270e3440f1d2e61793ab88d5b7a5bd73b2",
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
              "path": "derivatives/realistic/h-db-curl/light/peak.720.png",
              "sha256": "2019b07634bf620c59e2d15b4b0a2310dd7c49dd8dbaaae58d7206bcd6582eb5",
              "bytes": 79929,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/h-db-curl/light/end.720.png",
              "sha256": "7364a39b81fdd4a4c4124ae6f5c84f733130dd9599d1ac4112c4d749a0933205",
              "bytes": 79393,
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
          "path": "derivatives/tech-white/h-db-curl/dark/loop.720.mp4",
          "sha256": "b6c67330bfa30ff021f7313637290325375b7610a1a12caa85ff599c7bb26f5b",
          "bytes": 430908,
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
          "path": "derivatives/tech-white/h-db-curl/dark/cover.720.jpg",
          "sha256": "4ea356434382e147fb9b01bba082be0b4acdcc8b6a7253c8a871530371343011",
          "bytes": 40202,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-db-curl/dark/thumbnail.240.jpg",
          "sha256": "f30f5fcb4c5417205fd16b8a697cd139382b5489d255f858b30e2249f8dc2d1a",
          "bytes": 7878,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/dark/start.720.png",
              "sha256": "6d121b606f68ba55d79213be27f8bbe0257c44d1339cc7f0adc2f9501217a10b",
              "bytes": 102726,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/dark/peak.720.png",
              "sha256": "987893e55c195eb982f26fbd6a26644033c6ded488290b03648b2f133186aefd",
              "bytes": 102726,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/dark/end.720.png",
              "sha256": "3472437cfc40d819df6398146e69a66dda05af6268f7decbcadcc24b278217a3",
              "bytes": 102950,
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
          "path": "derivatives/tech-white/h-db-curl/light/loop.720.mp4",
          "sha256": "d0e124a198f60182a3eaf924a79295d43b66070deb0ec9beeba7e3b9dd7f129f",
          "bytes": 390639,
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
          "path": "derivatives/tech-white/h-db-curl/light/cover.720.jpg",
          "sha256": "b9ec00fe6b91d418e74b311c0a9eebfa43bf03448215303711695fe91f2c028c",
          "bytes": 38092,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/h-db-curl/light/thumbnail.240.jpg",
          "sha256": "b0ff05cfce5ebc2ade8d8878076a62b2d7588e85522be566394bb2f1a11e96b8",
          "bytes": 7067,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/light/start.720.png",
              "sha256": "f3135729f391d52d812303810791b9cf6a87ff88d2b71c07a7de0f8be295e4f6",
              "bytes": 102231,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/light/peak.720.png",
              "sha256": "68046882bad95718d3b853874537ca00b31dc3e73d6ea12cbd3a73623d8d143a",
              "bytes": 101925,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/h-db-curl/light/end.720.png",
              "sha256": "474457e9abd0680e158ace83295b887d1902da6c8d6a6fa6caf7ce2b539da9ec",
              "bytes": 102354,
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
          "path": "derivatives/neon-night/h-db-curl/dark/loop.720.mp4",
          "sha256": "f8caf7f3bf127019ab8faef9d19108e9efb8e2e4f4b88849d46b45905a720379",
          "bytes": 403303,
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
          "path": "derivatives/neon-night/h-db-curl/dark/cover.720.jpg",
          "sha256": "c5de8c182076e9f1ca92ba5e3aa12779e1b964af2015791285fefdc6de89c478",
          "bytes": 40612,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-db-curl/dark/thumbnail.240.jpg",
          "sha256": "5a0619157d210490e997d120d9aa171c94929f9f98d8c373eabf5cbf5ed1b875",
          "bytes": 7284,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/dark/start.720.png",
              "sha256": "bab58a290110c7498f0f264379b62cd8e2b72d726c8cff810b2966564032634d",
              "bytes": 102230,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/dark/peak.720.png",
              "sha256": "3644d5f0ca788fcd1dd2d0bfcb740de7cf5e7d59a2ef401b9f5ec4819a2d986c",
              "bytes": 102660,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/dark/end.720.png",
              "sha256": "a8b34f76b7dd19e371fe7a486e257268a2e6de5c6b98d1eb83687832d6f61410",
              "bytes": 102401,
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
          "path": "derivatives/neon-night/h-db-curl/light/loop.720.mp4",
          "sha256": "461dad343dc7fcebff59f45f8e4c138239d587c0ad5b84d5f1bf8892b782a9cf",
          "bytes": 427704,
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
          "path": "derivatives/neon-night/h-db-curl/light/cover.720.jpg",
          "sha256": "e91daadc33e8defd161392572fa05170f33e429b6a094ac946dda409882e164a",
          "bytes": 47119,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/h-db-curl/light/thumbnail.240.jpg",
          "sha256": "d9327e635d3db33e02d763a8c4a35d4bbad016079e40f043d6c82dbb296ce29e",
          "bytes": 9361,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/light/start.720.png",
              "sha256": "c8a699e4b41111546b4f07b4852c5c0cffbb6ca9991c73ce3623cf756ebeabca",
              "bytes": 112310,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/light/peak.720.png",
              "sha256": "704120585c2a64875ccf793938b4f22583e076d27a9855efa3877ca1601373de",
              "bytes": 112274,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/h-db-curl/light/end.720.png",
              "sha256": "439d5f914176c7785952c4a73154273cdd1fcaab55939a7be294d88ecc6627e2",
              "bytes": 112266,
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
          "path": "derivatives/neon-night-b/h-db-curl/dark/loop.720.mp4",
          "sha256": "68984842e547209bce8375bebf58ed0e7c879bfc4809f818f7bb75b6b9e252ed",
          "bytes": 413860,
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
          "path": "derivatives/neon-night-b/h-db-curl/dark/cover.720.jpg",
          "sha256": "2f6c9ddd671a680a200a074accdafee7b0a1a66a4be37f0930fd27519546b522",
          "bytes": 40728,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-db-curl/dark/thumbnail.240.jpg",
          "sha256": "e23dc917f079118f2980ea506e61b4afeb579cbe8f013a4b4d0c02971c284587",
          "bytes": 7376,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/dark/start.720.png",
              "sha256": "7995fbcc0ecb7ad6453e5814a69619e9f3b4f5b13ebe2360df9e6a5f63993893",
              "bytes": 101605,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/dark/peak.720.png",
              "sha256": "81f63f2a5e3684fd5d509b07399174452273872b1adc78443cbcf2c73123409a",
              "bytes": 102094,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/dark/end.720.png",
              "sha256": "1b9339081f5a3f02bed908fd39dd8f0503585f6d0a3fd4ca57c9478bf704655c",
              "bytes": 101753,
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
          "path": "derivatives/neon-night-b/h-db-curl/light/loop.720.mp4",
          "sha256": "97f96bcf5d216e9951a831798e1f7adc1ea67036c22c4adc0fbbca3add38ec28",
          "bytes": 436108,
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
          "path": "derivatives/neon-night-b/h-db-curl/light/cover.720.jpg",
          "sha256": "7bc70a787d86ce97e9362bfd27c2decfc0c752083fac0792d536863ad9fe466d",
          "bytes": 46755,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/h-db-curl/light/thumbnail.240.jpg",
          "sha256": "76218722eaf844473147efcb6f278c9568f78f2a93ede5ed3acadc0dc0a5516c",
          "bytes": 9258,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/light/start.720.png",
              "sha256": "b59454a8a055f682f790a4b607f1ce9ebf5a64649881c755a85392390f5aff48",
              "bytes": 111698,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/light/peak.720.png",
              "sha256": "3343a29b538a76d92fa7e294ea68e2f53050b359ce7209468d62842002de0c04",
              "bytes": 111828,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/h-db-curl/light/end.720.png",
              "sha256": "e7a95697e0bcf2158f7a62f15fa3346dcbd9b7360e87d9054bb09e007f87c891",
              "bytes": 111795,
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
          "path": "derivatives/hologram/h-db-curl/dark/loop.720.mp4",
          "sha256": "4e15cf29e4012df1224f52d1501bde68b86a1f8fda4a7a247fe4460f26387a90",
          "bytes": 484080,
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
          "path": "derivatives/hologram/h-db-curl/dark/cover.720.jpg",
          "sha256": "600e595e37ac8355920655bff6ece0921287a190e10ebd6b6709912f636b1532",
          "bytes": 38871,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-db-curl/dark/thumbnail.240.jpg",
          "sha256": "95e6388033cd86eeae26b54ba1dc2dc1b7f05c1236c11eb7fdfc6cbf3c8b80d1",
          "bytes": 6813,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/dark/start.720.png",
              "sha256": "b79ff1ed33863d640e8ba45a8576f2c66ca4f4c4076c61e6f903dd65be87262e",
              "bytes": 117108,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/dark/peak.720.png",
              "sha256": "2bb02aeac2a710d56532fe1f4930268ddd4c74ba203500cee41fc857bd90dbf5",
              "bytes": 117226,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/dark/end.720.png",
              "sha256": "8c613254547600488f4766539081553643bdd011dcb9b8315404d21d56d1a9d1",
              "bytes": 117102,
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
          "path": "derivatives/hologram/h-db-curl/light/loop.720.mp4",
          "sha256": "a4a3291034f0e2081e4d2d40f9dcc7eb0779cc11ee1fbb10a63c46597c55c810",
          "bytes": 302786,
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
          "path": "derivatives/hologram/h-db-curl/light/cover.720.jpg",
          "sha256": "0b4dc6b8fa6215304ff5497d20508136685a2fe14d9328903d5044f102b75a77",
          "bytes": 33049,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/h-db-curl/light/thumbnail.240.jpg",
          "sha256": "aaa41c2751fcfa589082542f54cf3323b97e2c05b781bf9abe381fbc0b3be4a9",
          "bytes": 6660,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/light/start.720.png",
              "sha256": "eb1647379b0ca60772f7c9bc745fd2bf7b8a83896359c083a87909453de0c749",
              "bytes": 108416,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/light/peak.720.png",
              "sha256": "6626e3e76601846979c600ee3e2fa3a6c1dbffb6bfc0f28ca2840f225b600811",
              "bytes": 108099,
              "width": 720,
              "height": 720,
              "frame": 60
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/h-db-curl/light/end.720.png",
              "sha256": "bb9ee554b339aee96b0ad12f49fba161d442e1040a649ad4a21343eb40419758",
              "bytes": 108674,
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
        "path": "derivatives/realistic/h-db-curl/cover.transparent.1080.png",
        "sha256": "ab6a9999a89efdea20d627c22a5fef7027f23ca0fce83a6900f560affba53379",
        "bytes": 151225,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/h-db-curl/cover.transparent.1080.png",
        "sha256": "1d9d5e2a27735ed8d7fbfd6c52d6093acaa4daf9fae781bc2d4348cce433e431",
        "bytes": 206091,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/h-db-curl/cover.transparent.1080.png",
        "sha256": "298980a73260c06375adf73b235d385f0f625fa1ebf0570de918523c9da2f9e6",
        "bytes": 226720,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/h-db-curl/cover.transparent.1080.png",
        "sha256": "cce2c973eedd4110547b2475652423ea63540d9ae20e6298ce48f7797d0d7b70",
        "bytes": 226066,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/h-db-curl/cover.transparent.1080.png",
        "sha256": "23b10e37f2a0eba8665c2e26f31552eb1d53cdfadb7468dae68c64609e8c79eb",
        "bytes": 312058,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/h-db-curl.json",
        "sha256": "9cf8060997ab5bec3f74a83b6156e38bd9cb02c787715c686c0f3fb7b0af5b8f",
        "bytes": 291
      }
    },
    "framingId": "fixed-square-9cf8060997ab5bec",
    "compositor": {
      "root": "repo",
      "path": "tools/action-package-v2/composite.py",
      "sha256": "fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507",
      "bytes": 21548
    }
  },
  "voice": {
    "actionId": "h-db-curl",
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
      "path": "manifests/h-db-curl.json",
      "sha256": "327589442dd56b2f4f3d1b98249ef9c2230a0c9756cd87976796f8c730d30124",
      "bytes": 27934
    }
  }
}
```
