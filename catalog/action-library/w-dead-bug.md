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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "ddf0ad40b5594d94e0fc044a1b02dedd976cc7246fb0e5bbf17c7aeecce435b8",
            "bytes": 5549
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "ddf0ad40b5594d94e0fc044a1b02dedd976cc7246fb0e5bbf17c7aeecce435b8",
            "bytes": 5549
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "ddf0ad40b5594d94e0fc044a1b02dedd976cc7246fb0e5bbf17c7aeecce435b8",
            "bytes": 5549
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/w-dead-bug-evidence.json",
            "sha256": "ddf0ad40b5594d94e0fc044a1b02dedd976cc7246fb0e5bbf17c7aeecce435b8",
            "bytes": 5549
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
          "sha256": "570a0c62bcc628c2be14255d7157ba2ceba42a927fec29bd3683fa116fe4595d",
          "bytes": 13118
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/w-dead-bug/body/index.json",
            "sha256": "324b6c3f0961ba171e650e793b5a3f0b8fb5c334d22b57f7910ffc385d099bd5",
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
            "sha256": "8cb0cf37a97108e085909de6ab6171a2715b25be00025d9d899c985262a70bdf",
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
          "sha256": "f22ca3d557c5fad0ec7ccdbbf580cbc352ddb885f04a62691cc009c6ed0a351e",
          "bytes": 13370
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/w-dead-bug/body/index.json",
            "sha256": "56897337b2dcb02fd42cdb416d5b6a1ed872083038f9b953842c6f3b2a4002a3",
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
          "sha256": "b18ee0f842206b5d1ddd79f823c44fb70d587320e9cf6c76c921b81bc747477c",
          "bytes": 13370
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/w-dead-bug/body/index.json",
            "sha256": "880a9a627ed90fb2a851b2fee9eabb436ab7808ad31d5551fc681bab9672d7e4",
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
          "sha256": "7be4dc1d2a9053c5508c3826356951ef3a36eb14c8b9fb024da117a9c94d6c7f",
          "bytes": 13378
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/w-dead-bug/body/index.json",
            "sha256": "0cef4ee5ea11c984eebe5b9fe727ca1f8a57e74613388ae34bee950f7c659a41",
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
          "sha256": "8d56c05169a9ef7ef56efa2c88bb4ce9129316ab2b646e5c072cb30bd5f84051",
          "bytes": 13362
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/w-dead-bug/body/index.json",
            "sha256": "efb8178925a4d26ca442fac14955ff7bb1c5078f951e6d9695205ff55f9bfe5b",
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
          "path": "qa/reviews/w-dead-bug-evidence.json",
          "sha256": "ddf0ad40b5594d94e0fc044a1b02dedd976cc7246fb0e5bbf17c7aeecce435b8",
          "bytes": 5549
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
          "sha256": "c0b0609a8a142cae5f9332568f4a311ff8d94869b9d3788e07e0861d524e8d4c",
          "bytes": 402263,
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
          "sha256": "d92acb6be3570294ce31005b2f87fdc2da52946a09f4cf0aa041330c01d18166",
          "bytes": 25991,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "f0bace02a78309a65d8f29542bc21b0fee192aec959ebcac2a84077d1dd2e914",
          "bytes": 5260,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/dark/start.720.png",
              "sha256": "2e47ecaaa714c774b747dd08b0dcf7439c2f142b17fc43fc55e0da544e81cb43",
              "bytes": 59060,
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
              "sha256": "5ce14186d1db5a2b688c23d339a24e61c5c3e4fe8085fa3fcd6390740a18f3a9",
              "bytes": 64315,
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
              "sha256": "e74acc7b62b2f6e2d418612e6c6faeab6917a08b119b804f59f126eb79bf7e56",
              "bytes": 59586,
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
          "sha256": "88669ad91c4fb551bdbf469f108c8b5968efae2b48999e33cda170bb6b8cc9c5",
          "bytes": 424099,
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
          "sha256": "f8a8d60ba4d6eff57deeba0eb3e7c45d98af4acbb95413b961af5270fe18ad3f",
          "bytes": 30150,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "db85e8cb8f55793ef6da3790da816b2e8978ebf71667f5e44300ffb13cfe9f86",
          "bytes": 6719,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/w-dead-bug/light/start.720.png",
              "sha256": "20521abd3b3d950991928a99e5c60514b0080ab461bde9b920b874397b7d70cc",
              "bytes": 68014,
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
              "sha256": "ebe2ae0ba993721de4823017e8b4865c4627686dbf7eee80e8a86ab9a9d82b91",
              "bytes": 70874,
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
              "sha256": "9707eca29d7222aeea69fffb9bde056e53478ba1ac4a8341221f6be955290d2c",
              "bytes": 68514,
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
          "sha256": "62dc1de33916e61f881d6d27aaf3a879cb2756d4549a146c2dcf963b282ef211",
          "bytes": 527381,
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
          "sha256": "dd266ba27848563a5c5d5aef74e3d280edd0e2fbd45a987c7c0da9dfd421e0df",
          "bytes": 34766,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "5aecbf346534490e06656fdac6dae11a9b9c819b9273cf387abd0d888115bc0b",
          "bytes": 7031,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/dark/start.720.png",
              "sha256": "272a7cd5017604425eaacdcb0e9f0bf0d0254bffef89fc85966780b669a78ce2",
              "bytes": 78605,
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
              "sha256": "db722e33852de0ab9f0953d5d64ff48016eb64ade250b386c22d2c762cba0eb1",
              "bytes": 87623,
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
              "sha256": "d1516b38096187d831a34f052bc0eddd08d9f35ea9f8e3297f79a31e55cd96c6",
              "bytes": 78682,
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
          "sha256": "2e9ad5706d397f7de3ffbbcc1249f4013c90acbd1038359f2ad05b10e607bf6d",
          "bytes": 512627,
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
          "sha256": "1e594e8861f95ffaa0e9b6a2c28afd0fe56e0533647fe8489f0e8f902ee06a96",
          "bytes": 33550,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "f93fb91a9e08ab48db1c255240ca6fe7eafe3342891ac8e4497770bb4380b1af",
          "bytes": 6547,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/w-dead-bug/light/start.720.png",
              "sha256": "d3eeb46dac1b07fafa1536be99fcd202f6fc509f0868300bc9ea437ec4f8065e",
              "bytes": 80839,
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
              "sha256": "58bd0ec54ab1aaae6d3a760ea823462bc917d7d19ca955a5ca38fe70f3489618",
              "bytes": 86791,
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
              "sha256": "56211f4f5452c70320250c743e0498efa8e30476698db24e76c8309dd7d924d3",
              "bytes": 81082,
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
          "sha256": "4cfbbd11106d41cbe59b5539a4ddf5f0ff4a323aca00df7dfee2cd8a4909dcde",
          "bytes": 500228,
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
          "sha256": "0d122edc5614f076071341e3c425a515917cb1a2c0f290469f1b62462c8f250c",
          "bytes": 34314,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "c8ff1ddafae3242a4bdadaf3b366f7c9097c34e88fa14e43f4739b25b3170df5",
          "bytes": 6516,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/dark/start.720.png",
              "sha256": "73cb7c19306acff0a4599616f33c2cc8b96700ece8df992f45a19ef083a29a6f",
              "bytes": 78948,
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
              "sha256": "6f382786137ca5e75cc3e03116400fd7c29a7452554d028e07d1c69815182cce",
              "bytes": 87665,
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
              "sha256": "201f12db23e17fe7fa945b1b7070c0c1f3a4490d06da3661991d899984019ada",
              "bytes": 79000,
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
          "sha256": "1032442fdd030ba9c3ceffb8f6602a0acacb082c1a7ecc04be4bab87e693e43b",
          "bytes": 588126,
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
          "sha256": "19fa817bd13f0539e4c95e8d188b1c1930c144dd35e5a2400fb194365b3fb961",
          "bytes": 39860,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "ff52c88026eb9e6b0f272e6f8876cd8142fe2ad29ddae42070e76a4dde8911a2",
          "bytes": 8314,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/w-dead-bug/light/start.720.png",
              "sha256": "e744c377417eb31a956180d37ea09f50bcedb1d0f48fc14f1a79bc5ed83fc261",
              "bytes": 88652,
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
              "sha256": "9af476fe5e64fb13ce91685085b65ddcfc610f4a30fb67dcfd7b3a25d3b17f16",
              "bytes": 96688,
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
              "sha256": "edf569ddf2731e139e2ab59b9184e4f6be2349f9355118ae634538589b4d6cb8",
              "bytes": 88826,
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
          "sha256": "c66d31e742ab0f263a1908358ea023b131cf753d1960668896b72af573e1eb4f",
          "bytes": 516653,
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
          "sha256": "1a7ca1789fc7ee88ff173914351ce12b2aedb6b81db7500f7bc1bd096ce5a3ff",
          "bytes": 34339,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "84f7ba5add75e607f5373e660e308f0cfb952880ca790f2278c0ae06909a019b",
          "bytes": 6538,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/dark/start.720.png",
              "sha256": "972e0a63993929844d91694aaf7912f7461871c9d6f6355963d5906a0985e304",
              "bytes": 78367,
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
              "sha256": "b659df80e3dcd64271ee67658f4ab97d84ff7462e27b7b726e9094eeaf7faad3",
              "bytes": 87250,
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
              "sha256": "208e04868f068e06a2662f5483703ac27cf2033e1551d308aa0c9afa02127a36",
              "bytes": 78536,
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
          "sha256": "9b86b451971ed3867f82e89b592dc8058e7bcac62f592f20f5cea298993a45b0",
          "bytes": 597043,
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
          "sha256": "ca822fc357b6764f09f36bfa727ff62bbe7f8697cec297f14f89821009d018b3",
          "bytes": 39617,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "eb9000f33bec258f6eba357f1fbd5f883851a661fe1085299c2fd7d992228328",
          "bytes": 8262,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/w-dead-bug/light/start.720.png",
              "sha256": "17ec9fcf6f28d5d91e7a1d48007017eead98aec4d6eb37400b09ab04f82e2d05",
              "bytes": 88001,
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
              "sha256": "e26e659031926bf45f4b04c26b0cc13a454c45995390280b8260f76fa8c2f8b6",
              "bytes": 96478,
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
              "sha256": "5758f72483c8a7c2f67277ea87dc62d603c56ca698d4450ac72cc9c5e5669100",
              "bytes": 88442,
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
          "sha256": "3b4d274d6bbdb37f585251333097c6cae9393be960f50921c56a28104cc472cb",
          "bytes": 614957,
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
          "sha256": "4ab2e21f23421d4ad7b2b893e7adfa5309e563fffed858e5fe5a0e7d32af7bc6",
          "bytes": 32833,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/w-dead-bug/dark/thumbnail.240.jpg",
          "sha256": "bb22191d5b67309f1d79236622632263706292219848622be9b0ab305ab6bafa",
          "bytes": 6145,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/dark/start.720.png",
              "sha256": "2a81250c5d456bcc26c55ab6898a340c49cdc634c043d96142faa891fe27e56e",
              "bytes": 80705,
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
              "sha256": "449c945d7b84cd6b3701add15b9521682fb952fed35183b8323a19778df46eb3",
              "bytes": 89588,
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
              "sha256": "6d72a86fadee8ca58d0f682786fb9c46a255b95efaf33afcce817bb0f5b70249",
              "bytes": 80665,
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
          "sha256": "7d674eb64961cf37cb0c953c2b3d5cbc3a6dfed19e8c855390e00aeb5c9ab866",
          "bytes": 367323,
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
          "sha256": "59ac5e344b1772b20bbafd2598461ecf410bc3b0d78562f15b78f56a68315f6f",
          "bytes": 28824,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/w-dead-bug/light/thumbnail.240.jpg",
          "sha256": "71db6f491d13fe4883a8d26d4ae08649994b5ab2dceaa64ccddcfe294d975b39",
          "bytes": 6260,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/w-dead-bug/light/start.720.png",
              "sha256": "7ce72d13c182d1b850500c7ae0ce32ba4741e85757722d921158e8e08f4a310c",
              "bytes": 77078,
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
              "sha256": "741e800a0a271e4d5c0c3f11d074b8907b18d29b7f9b540cf4c3b7d06612cf3a",
              "bytes": 82120,
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
              "sha256": "fd126d38bca9d824ff1ef9b5236d9e52841339cb61aff17c28b0054c9269abe1",
              "bytes": 77115,
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
        "sha256": "8c790245ece3a4aed3bf8b2240254e51996ae7278b37311ca621045b6fcefcae",
        "bytes": 142971,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/w-dead-bug/cover.transparent.1080.png",
        "sha256": "450e49f4650a5ae1123e3d7c6725b2934f59454fc8b4b09b08ea14a1b86922e3",
        "bytes": 183545,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/w-dead-bug/cover.transparent.1080.png",
        "sha256": "091f07725632232dea7152e8f9c4afa0148174aaa699d45e013a8c311226635f",
        "bytes": 200360,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/w-dead-bug/cover.transparent.1080.png",
        "sha256": "bee2c49ae427e737725bcff23cbe0d1579843fcfe7400169d4e88a4e75009914",
        "bytes": 200740,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/w-dead-bug/cover.transparent.1080.png",
        "sha256": "6edbc7542e765aa9816c69dbf8caeeb1367decd1afc8d214a6d0ada57863b7fc",
        "bytes": 225564,
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
      "sha256": "306225af9711f3b61be8aab5b00f7041022b1a85418f5315fd4d99feb054fc9b",
      "bytes": 27983
    }
  }
}
```
