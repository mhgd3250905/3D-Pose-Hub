# 死虫式 / Dead Bug

ID: `w-dead-bug`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "死虫式",
    "en": "Dead Bug"
  },
  "purpose": {
    "zh": "练腹部",
    "en": "Practice trunk control while moving opposite limbs."
  },
  "tags": {
    "category": "core",
    "activeMuscles": [
      "abs"
    ],
    "synergistMuscles": [
      "obliques",
      "hip-flexors"
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
        "zh": "下背紧贴地面，对侧手脚慢慢伸远",
        "en": "Keep your lower back on the floor and slowly extend the opposite arm and leg"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "回程缓慢，回到起始位再换另一组手脚",
        "en": "Return slowly to the starting position before alternating limbs."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "保持呼吸，动作幅度以腰背稳定为限",
        "en": "Keep breathing and limit your reach to the range you can control."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "伸手伸腿时腰背明显拱起",
      "en": "Arching the lower back as the limbs extend."
    },
    {
      "zh": "用甩动代替缓慢控制",
      "en": "Swinging the limbs instead of controlling the movement."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰背：伸远手脚时保持躯干可控；一旦腰背明显拱起，缩小活动幅度。",
        "en": "Lower back: shorten the limb reach if you cannot keep your trunk controlled."
      },
      {
        "zh": "髋前侧：伸腿范围以舒适、可控为限，不用憋气维持姿势。",
        "en": "Front of the hip: keep the leg range comfortable and controlled, and keep breathing."
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
        "zh": "已有医嘱限制仰卧训练或脊柱、髋关节活动时，先取得许可再做。",
        "en": "Obtain clearance first if a clinician has restricted supine exercise or spinal or hip movement."
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
    "w-bird-dog",
    "h-forearm-plank"
  ],
  "regressions": [],
  "progressions": [
    "abs-A"
  ],
  "defaultDose": {
    "mode": "reps",
    "sets": 3,
    "reps": 10,
    "restSeconds": 30
  },
  "doseRange": {
    "sets": [
      1,
      4
    ],
    "reps": [
      5,
      15
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
        "id": "extend",
        "seconds": 1.2
      },
      {
        "id": "hold",
        "seconds": 0.7
      },
      {
        "id": "return",
        "seconds": 1.3
      },
      {
        "id": "reset",
        "seconds": 0.5
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
    "关系草稿：w-bird-dog/h-forearm-plank是躯干控制目标的替代，不是相同体位或相同处方；abs-A的旧catalog反向alternative明确指向w-dead-bug，作为更长杠杆的进阶候选，不能只按level数值自动分级。",
    "独立降阶ID仍缺：同ID可缩小手脚伸远幅度、先练单个肢体或腹部稳定，但仓库尚无相应独立演示ID；不把卷腹冒充相同抗伸展模式的降阶。",
    "协同标签为编辑推断：obliques参与躯干控制，hip-flexors参与腿部位置控制；不是额外高亮处方，需运动专业审阅。",
    "证据/推断边界见catalog/v2/definition-evidence.md（仓库原目录/源spec与权威一手资料；全部编辑审核仍pending）。",
    "医学安全参考：AAOS Spine Conditioning Program https://www.orthoinfo.org/recovery/spine-conditioning-program/ ; Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program/ ; NHS Strength exercises https://www.nhs.uk/live-well/exercise/strength-exercises/ ; retrieved 2026-10-21."
  ],
  "movementSides": "alternating-cross-body: first pair right arm + left leg, then left arm + right leg at second 4; reset at second 8",
  "countingSemantics": "One controlled extension and return of one opposite arm/leg pair counts as one rep. Alternate pairs; the 8-second clip contains two reps, one per pair. Default reps=10 means 10 total alternating reps, 5 per pair, not 10 per side."
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
      "path": "drill-anim/specs/w-dead-bug-r2.js",
      "sha256": "3f9a007890add3f27f3f7871a6050eba2a4eb81d704d161a237b592c7ed42b4d",
      "bytes": 358,
      "normalization": "lf"
    },
    "keyMoments": {
      "start": 0,
      "peak": 1.8666666666666667,
      "end": 8
    },
    "highlightMuscles": [
      "abs"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T11:18:05.625879+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "6bef930596459eeb6c15fc535915c7677e6eeae2bff028e3a344b4178863f2cb",
            "bytes": 6021
          }
        ],
        "framesReviewed": [
          0,
          30,
          56,
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
        "reviewedAt": "2026-10-21T11:18:05.625879+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "6bef930596459eeb6c15fc535915c7677e6eeae2bff028e3a344b4178863f2cb",
            "bytes": 6021
          }
        ],
        "framesReviewed": [
          0,
          30,
          56,
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
        "reviewedAt": "2026-10-21T11:18:05.625879+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "6bef930596459eeb6c15fc535915c7677e6eeae2bff028e3a344b4178863f2cb",
            "bytes": 6021
          }
        ],
        "framesReviewed": [
          0,
          30,
          56,
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
        "reviewedAt": "2026-10-21T11:18:05.625879+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "6bef930596459eeb6c15fc535915c7677e6eeae2bff028e3a344b4178863f2cb",
            "bytes": 6021
          }
        ],
        "framesReviewed": [
          0,
          30,
          56,
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
        "path": "drill-anim/lib/ss-geo.mjs",
        "sha256": "45ca774079e3a85ecc4f924a3220d4baa721f0435e16f6e6e21ffa19e17e8603",
        "bytes": 3700,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/w-dead-bug.js",
        "sha256": "89c13a96b9cb23f6fe055586ef2990506f65d4b996257f33fffad7d4660a894a",
        "bytes": 4534,
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
        "occlusionSha256": "251a5aeec54dd0b82763d974e97f97ae582139367621a4e0de69d2f9c2335750",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/w-dead-bug/layer-manifest.json",
          "sha256": "8a9fee5565ff74784cc828a8290b4b8738b3ef35a32150aec63df1a866f5b2e9",
          "bytes": 13108
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/w-dead-bug/body/index.json",
            "sha256": "4a473c5df1c4702da4a8d37699b246c8b616f20ef9b9e1dc9523d4d343750bf3",
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
            "path": "masters/realistic/w-dead-bug/highlight/index.json",
            "sha256": "75a1b95c8e2d04f956e1b03c00406eb1a4c5b0f13cfa6c67250c440732003fb1",
            "bytes": 54809
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
            "path": "masters/realistic/w-dead-bug/shadow/index.json",
            "sha256": "d271cc0c5ce23a6ccc9df88e2f991b9f45efb0fd87d32301b8acb8c8cf462c56",
            "bytes": 54089
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
        "occlusionSha256": "251a5aeec54dd0b82763d974e97f97ae582139367621a4e0de69d2f9c2335750",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/w-dead-bug/layer-manifest.json",
          "sha256": "9ab0146b879dbc714431b57e5f296361f0c3a5a99055145d177f708e80d64b3a",
          "bytes": 13360
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/w-dead-bug/body/index.json",
            "sha256": "5147116f569f133c45479d32f862834f6ed018b2164ab8467f3fcd58bdeecea4",
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
        "occlusionSha256": "251a5aeec54dd0b82763d974e97f97ae582139367621a4e0de69d2f9c2335750",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/w-dead-bug/layer-manifest.json",
          "sha256": "f2f9aa6682b688e49f3afa799e16ac43ad4cc780628545bbb6ff4a2fc221c282",
          "bytes": 13360
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/w-dead-bug/body/index.json",
            "sha256": "38293f0802444af6a574ad72f9faa6acd378622f6b45205d48411313a4442e1b",
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
        "occlusionSha256": "251a5aeec54dd0b82763d974e97f97ae582139367621a4e0de69d2f9c2335750",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/w-dead-bug/layer-manifest.json",
          "sha256": "792f8216faef0ab2b80382684eaab732615b9984e324684e78088182f3c98657",
          "bytes": 13368
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/w-dead-bug/body/index.json",
            "sha256": "87aa3c14f9c3ca5288a1e83a3d05eec419466a33f4e8328f22c287cdb44ae63c",
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
        "occlusionSha256": "251a5aeec54dd0b82763d974e97f97ae582139367621a4e0de69d2f9c2335750",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/w-dead-bug/layer-manifest.json",
          "sha256": "c967668e518185a2f4cc477a988a2a5de3119ad2d1b4879b68f1eebbf8134deb",
          "bytes": 13352
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/w-dead-bug/body/index.json",
            "sha256": "f09071f4b7885fa4517afc27d8cb257182e1df83fce8f2b6074b085a0393d8ce",
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
      "reviewedAt": "2026-10-21T11:18:05.625879+00:00",
      "evidence": [
        {
          "root": "media",
          "path": "qa/reviews/w-dead-bug-evidence.json",
          "sha256": "6bef930596459eeb6c15fc535915c7677e6eeae2bff028e3a344b4178863f2cb",
          "bytes": 6021
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
          "path": "derivatives/realistic/w-dead-bug/dark/loop.720.mp4",
          "sha256": "fd1dbacb604f1bac5b145a7aa16e5b67a0c4814cfc809b12c345ddf42f169487",
          "bytes": 403056,
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
          "path": "derivatives/realistic/w-dead-bug/dark/cover.720.jpg",
          "sha256": "e50701b59dd4a154b6a2cd94365492999cefd0e25a220c309dee717995e12cbc",
          "bytes": 25978,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "07bacd0aa6339a00553c74500423bed2e162a4bfb23726e73cdda3b29b6fabd0",
          "bytes": 5266,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/dark/start.720.png",
              "sha256": "3fb54f6ab18b3b21e1f72954895ed8281d7f5a4c28324d60ffa26a03dc9974bc",
              "bytes": 59181,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/dark/peak.720.png",
              "sha256": "58592e7ce0e740d5534ac026c8cd0c5afd37e1428ec5e3474fdfd8156f92436c",
              "bytes": 64291,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/dark/end.720.png",
              "sha256": "c104654e6480857c36aabb3f0263d6653c3c3cc8597c97cef006d01bb94ece48",
              "bytes": 59476,
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
          "path": "derivatives/realistic/w-dead-bug/light/loop.720.mp4",
          "sha256": "479eae343806bddbb65400a82d9ba51958e0365cf2589025d6baad2402c69c45",
          "bytes": 424570,
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
          "path": "derivatives/realistic/w-dead-bug/light/cover.720.jpg",
          "sha256": "f391e15939ef00d62a9d7ff8c38ac2a14dc4b494afcd16dacbca7dd5557fd60c",
          "bytes": 30154,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "8de980112d9697633ed002ea689c7301d21c5321a0ba9ed78c5248ed593d1919",
          "bytes": 6718,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/light/start.720.png",
              "sha256": "4498f65bdb07cd6491fc8314a4b68278976c98f636f8f0367b316de7ae0f9439",
              "bytes": 68139,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/light/peak.720.png",
              "sha256": "eb0739bbeb0fe70f96e8491be793499295f5df650664141fdf4a05edbed75d48",
              "bytes": 70837,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/light/end.720.png",
              "sha256": "a728f4d5c67e45c870183f0f42ef664ee88c3fc7ce740e7eb25dfcd8f4698994",
              "bytes": 68393,
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
          "path": "derivatives/tech-white/w-dead-bug/dark/loop.720.mp4",
          "sha256": "2c46ab51cb3d001aa0d16695b32084dbebc5fc33e61e171da4243b81ed6c3ad6",
          "bytes": 529427,
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
          "path": "derivatives/tech-white/w-dead-bug/dark/cover.720.jpg",
          "sha256": "a29ea70a3b17ac17afdd49a9999b8bc8c8baa4a2978df7e0ce9028da0c084926",
          "bytes": 34768,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "dbae882dec574e8789c0663da1bf606831d57bce5ee99c3f58d14b8a36101e3b",
          "bytes": 7013,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/dark/start.720.png",
              "sha256": "961c2735fda0c02242e203617668ee2ff04d10a6c6b86257493b02cad8064523",
              "bytes": 78818,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/dark/peak.720.png",
              "sha256": "439928a0ca54ec7066af76bb52ce2076b30db020e890a32e599c57104adb1592",
              "bytes": 87850,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/dark/end.720.png",
              "sha256": "419c4cb4cc530775924e3e2821b89ec333159b685d02a67ee6a973a15ae6f728",
              "bytes": 78964,
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
          "path": "derivatives/tech-white/w-dead-bug/light/loop.720.mp4",
          "sha256": "2c0d1dc595e36c425ab6d5624e18e0056ded0de285907b09042d4eebe1b51922",
          "bytes": 516079,
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
          "path": "derivatives/tech-white/w-dead-bug/light/cover.720.jpg",
          "sha256": "aac6f0b382e2c344ddc7d4761c41778f1534c259a8dc4aadb8b4f5a876b1a653",
          "bytes": 33547,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "afe6b7e73fa11885f92470aa8fc1f7da3c0afad0334b1d44a59dad3d42f2a767",
          "bytes": 6523,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/light/start.720.png",
              "sha256": "9bd71f1ac0bf4012a79dedb823617ca22472a76971bea42fd466110f230b6f57",
              "bytes": 81025,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/light/peak.720.png",
              "sha256": "b2db8b523af383fc378b317c02d21724805a8a0b56d96efa5be9d9c8019b5907",
              "bytes": 86967,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/light/end.720.png",
              "sha256": "9e4fc4286bb2b5bdb45c4895b1ee05fd4538e7b9f8b1a4e65c4f9ffcf1cbd212",
              "bytes": 81393,
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
          "path": "derivatives/neon-night/w-dead-bug/dark/loop.720.mp4",
          "sha256": "98b79ee3d9d5369577250664fe3e3874b5fa597d5c66fb4072fbbae6591a04b5",
          "bytes": 504972,
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
          "path": "derivatives/neon-night/w-dead-bug/dark/cover.720.jpg",
          "sha256": "0da9f74fdd961993019f86e3af98cddd1b88a42833792f46fd03f34d7835ab0b",
          "bytes": 34462,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "d89e3fcea2e56c183bd70a3ae381023b40872bf557a29acfa9697f4a22517b7e",
          "bytes": 6529,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/dark/start.720.png",
              "sha256": "a14f203710cdfdc6934292d3eaf6fcf5c8113562000c87518477d791d95a9785",
              "bytes": 79185,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/dark/peak.720.png",
              "sha256": "054c5f6abbfb487adba1e38b7e97e973287c2f48089ae1ae6cf9c2cfd2954879",
              "bytes": 88005,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/dark/end.720.png",
              "sha256": "753f016c7d2b9373f6144e189528ecc41eb958e9917e98f155d2def78c73b4f8",
              "bytes": 79210,
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
          "path": "derivatives/neon-night/w-dead-bug/light/loop.720.mp4",
          "sha256": "d32b3ea811f72eaf716f438d57baf6150622af41199c07e6ff6c1e904e2bb484",
          "bytes": 588121,
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
          "path": "derivatives/neon-night/w-dead-bug/light/cover.720.jpg",
          "sha256": "adec572c172597b42fcc51914d797335dd4ee8d95bafda4479aa371c443ad715",
          "bytes": 40002,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "11168749e6926e89888a05b4ea907a19c62865d2d2694809e7f101b35f476ddf",
          "bytes": 8335,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/light/start.720.png",
              "sha256": "61ea013537a78ade53d474de78fc615ee34300dad5b6e8083a758bd6d11497ae",
              "bytes": 88917,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/light/peak.720.png",
              "sha256": "c37b1a4bdfbf637c351ec44230f5497838e723115c9ed99767f0e868b29bd3ff",
              "bytes": 97034,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/light/end.720.png",
              "sha256": "d11be35391fa48b1b52552c6a3ce9372456dc1b5b38d035f8042a4da19690f68",
              "bytes": 89065,
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
          "path": "derivatives/neon-night-b/w-dead-bug/dark/loop.720.mp4",
          "sha256": "575115a0374451482dc42580523f03fcb59cba22239361c8f079250b52fc43ff",
          "bytes": 517572,
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
          "path": "derivatives/neon-night-b/w-dead-bug/dark/cover.720.jpg",
          "sha256": "9bcd695427fc1b9bf7c95bc54f4fe453e555a8492a39fd20f1d8a089348d24a1",
          "bytes": 34455,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "ef4a6f4130fdd5bd6382b902ac64785176ce225693daff7381cf9edbebaecaae",
          "bytes": 6552,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/dark/start.720.png",
              "sha256": "bcac1e8443b27dbddea724108bc1c37a328b456b98c8a90d499d1d0ece5865ae",
              "bytes": 78585,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/dark/peak.720.png",
              "sha256": "063e4d924bfdad257f0851eeae930ac4c1efe73820286762121f37d713e7114e",
              "bytes": 87583,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/dark/end.720.png",
              "sha256": "3a7396f490e0b5f5660043a7cec6127c416a9588fddec3537dfc0690627d4d38",
              "bytes": 78785,
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
          "path": "derivatives/neon-night-b/w-dead-bug/light/loop.720.mp4",
          "sha256": "a7da6e3ca602ed57198df1bc4c71fc08ef592233c428ded41c95b3b13e0b3fda",
          "bytes": 599749,
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
          "path": "derivatives/neon-night-b/w-dead-bug/light/cover.720.jpg",
          "sha256": "6937b24af338fe53ae90b8f469fd60da09fa175748ea0aa3e453deac7de10b96",
          "bytes": 39756,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "86131fcba7ddc0dea940bef459ed959ac5f310701ba73895e863696ace401a1f",
          "bytes": 8290,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/light/start.720.png",
              "sha256": "e8a038bcb0bc029b8ee470c92b7f3d65e82e70b1ed701d80359fa93801c9d5b0",
              "bytes": 88252,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/light/peak.720.png",
              "sha256": "42a8220408eac678cce205c2de42babdd908566bf573393e7e0a60d7db08421b",
              "bytes": 96811,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/light/end.720.png",
              "sha256": "41801c801c200ca9ba4a2bfb6e458d0daf3626391f0ccbf769b109b1ba05d1fa",
              "bytes": 88702,
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
          "path": "derivatives/hologram/w-dead-bug/dark/loop.720.mp4",
          "sha256": "4a1cbbe06a01cd28e48502a5c0220001b1bba86ac5f017369b3da2394412d811",
          "bytes": 618494,
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
          "path": "derivatives/hologram/w-dead-bug/dark/cover.720.jpg",
          "sha256": "10fc924f25593e5de4b95b0761b258dde251522a87c8743ef639c35225b87ed2",
          "bytes": 32867,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "7d5bf64b609ff4ed671a7df577a0f1ef3fc5203b783080483879409e2f081ba6",
          "bytes": 6142,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/dark/start.720.png",
              "sha256": "a52694660511e514ee05d50a32e6c4a25757975a6ccd0969fdc5b9459de4bcff",
              "bytes": 80969,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/dark/peak.720.png",
              "sha256": "2455dc34f0c6752f455a592cbfa3cae1b9003b64780fc1b002754efdcdda63a8",
              "bytes": 89960,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/dark/end.720.png",
              "sha256": "7cab914d57b9116180d620c74c1353fb0db9c3a035b474f79a6fcf515f706c01",
              "bytes": 80997,
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
          "path": "derivatives/hologram/w-dead-bug/light/loop.720.mp4",
          "sha256": "f6d9b18fa7621a6a007dcf073cd208e633041f1dc92938802d983ea9d87bbd2e",
          "bytes": 367327,
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
          "path": "derivatives/hologram/w-dead-bug/light/cover.720.jpg",
          "sha256": "e8b334625920a366007992c224acf87eaddbfb12e6418adea2418909e4569328",
          "bytes": 28626,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "b966e615650189e376b3e1082d8f0a35e17c8a9ee08f5ef55569395715556ca8",
          "bytes": 6189,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/light/start.720.png",
              "sha256": "ac9800ac4f9127013c7cd4451b04288647e17c5a60d7f5c7b9047ba92267d858",
              "bytes": 77115,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/light/peak.720.png",
              "sha256": "b3b4f3e9dc56baad568a0f69aac9977693d7d9aef1168dee4e318cb95b713780",
              "bytes": 81959,
              "width": 720,
              "height": 720,
              "frame": 56
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/light/end.720.png",
              "sha256": "b77f3c4b3618284e987637a018e0fcd0137b8bf1498682eaace3dd8cdb1e91fa",
              "bytes": 77242,
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
        "path": "derivatives/realistic/w-dead-bug/cover.transparent.1080.png",
        "sha256": "4b636e1260501e8f85616c11123e673a711d5cd5e2fc5d7e730bd0684aa052ff",
        "bytes": 142962,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/w-dead-bug/cover.transparent.1080.png",
        "sha256": "4b5501cfe736e5d67b3136414b06fba1f41e19e497df8eda1b97862b8a5087b6",
        "bytes": 183781,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/w-dead-bug/cover.transparent.1080.png",
        "sha256": "fbe31dc8ba87cfa08507bec2ecd27147ec2b6831e0a75ff1b9295d114f22118f",
        "bytes": 200936,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/w-dead-bug/cover.transparent.1080.png",
        "sha256": "e72864bbcfe172c7ac9f67ac8ad3eb67feae2d7089e5585a4418a60a72e15428",
        "bytes": 201299,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/w-dead-bug/cover.transparent.1080.png",
        "sha256": "8dbddda0f5213c30d5636e369e76ac11965f38c4fc5aab98d56b96160d35ae06",
        "bytes": 226514,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/w-dead-bug.json",
        "sha256": "61f4513a5d89e47eac496a35e15117e5a8a36d4dad3c3e172c0f64396608c308",
        "bytes": 293
      }
    },
    "framingId": "fixed-square-61f4513a5d89e47e",
    "compositor": {
      "root": "repo",
      "path": "tools/action-package-v2/composite.py",
      "sha256": "fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507",
      "bytes": 21548
    }
  },
  "voice": {
    "actionId": "w-dead-bug",
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
      "path": "manifests/w-dead-bug.json",
      "sha256": "ee93b967835c451e08d6896d1ad3d945fdff4dea88b20d19e616a65eabbd2a20",
      "bytes": 27983
    }
  }
}
```
