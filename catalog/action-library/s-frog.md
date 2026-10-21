# 青蛙式 / Frog Stretch

ID: `s-frog`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "青蛙式",
    "en": "Frog Stretch"
  },
  "purpose": {
    "zh": "拉伸大腿内侧",
    "en": "Explore a comfortable inner-thigh stretch in a wide-knee position."
  },
  "tags": {
    "category": "stretch",
    "activeMuscles": [
      "adductors"
    ],
    "synergistMuscles": [
      "abs",
      "erectors"
    ],
    "equipment": [
      "mat"
    ],
    "position": "quadruped",
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
        "zh": "膝盖向两侧打开，脚尖朝外，臀部慢慢往后坐",
        "en": "Knees wide, toes out, sit your hips back slowly"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "缓慢移动，停在自己能控制的幅度",
        "en": "Move slowly and stop within a range you can control."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "保持呼吸，回程也要平稳",
        "en": "Keep breathing and return smoothly."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "强压髋部追求过大的幅度",
      "en": "Forcing the hips into an excessive range."
    },
    {
      "zh": "出现不适仍弹震或继续加深",
      "en": "Bouncing or pushing deeper despite discomfort."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "膝：使用舒适垫面，膝部承托不适时不要继续加宽。",
        "en": "Knees: use comfortable padding and do not widen the stance through knee discomfort."
      },
      {
        "zh": "大腿内侧与髋：缓慢后坐，只保留可控拉伸感，不弹震、不让他人强压。",
        "en": "Inner thighs and hips: rock back slowly within a controlled stretch without bouncing or being pushed."
      },
      {
        "zh": "腰背：保持躯干可控，不为更深后坐强行塌腰或憋气。",
        "en": "Lower back: keep the trunk controlled instead of forcing a deeper rock through the lower back or breath-holding."
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
        "zh": "已有医嘱限制跪撑或髋外展活动范围时，先取得许可，不自行增加分腿幅度。",
        "en": "Obtain clearance first if kneeling support or hip-abduction range has been restricted."
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
    "s-butterfly",
    "h-adductor-rock"
  ],
  "regressions": [
    "s-butterfly",
    "h-butterfly-active"
  ],
  "progressions": [],
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
        "id": "prepare",
        "seconds": 0.6
      },
      {
        "id": "rockBack",
        "seconds": 3.2
      },
      {
        "id": "return",
        "seconds": 3.2
      },
      {
        "id": "reset",
        "seconds": 1
      }
    ]
  },
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
    "定义内容已补为具体双语草稿；cautions、contraindications、关系候选和协同标签有数据，review pending表示待审核，不表示这些字段缺数据。",
    "禁用条件仅覆盖疼痛停止与既有临床限制等通用筛查，不是疾病特异的完整绝对禁忌清单；未据此宣称任何疾病或术后状态均禁止运动。",
    "旧catalog明确alternative=s-butterfly。h-adductor-rock的源spec同样是内收肌目标的后摇；h-butterfly-active旧catalog为仰卧主动开合、level1，可作去掉四足宽膝承重要求的降阶候选。",
    "独立进阶ID仍缺：旧catalog中没有经确认的更高等级同模式蛙式ID。增加幅度必须是可控且无痛的个体调整，不把横劈叉、强压或不相干力量动作自动当作进阶。",
    "abs/erectors标签表示本后摇动作的躯干稳定协同，并非额外腰部拉伸目标；内收肌仍是主要目标。",
    "证据/推断边界见catalog/v2/definition-evidence.md（仓库原目录/源spec与权威一手资料；全部编辑审核仍pending）。",
    "医学安全参考：AAOS Spine Conditioning Program https://www.orthoinfo.org/recovery/spine-conditioning-program/ ; Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program/ ; NHS Strength exercises https://www.nhs.uk/live-well/exercise/strength-exercises/ ; retrieved 2026-10-21."
  ],
  "countingSemantics": "Timed mobility/stretching: do not count the 8-second demonstration as an 8-second static hold. One loop shows one slow backward rock and return; default seconds=40 spans five demonstration loops. No sustained peak hold is encoded."
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
      "path": "drill-anim/specs/s-frog-r3.js",
      "sha256": "2a4814bdebdf1b65029cdf04e0f10e49dc3e4bfb84ce78149dc5ab2f388a6307",
      "bytes": 843,
      "normalization": "lf"
    },
    "keyMoments": {
      "start": 0,
      "peak": 3.8,
      "end": 8
    },
    "highlightMuscles": [
      "adductors"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/s-frog-evidence.json",
            "sha256": "d3b3c103fb6231275e4cfe773a28ec607fa05a54c52a928f9886c93a578bfedb",
            "bytes": 5545
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          114,
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
            "path": "qa/reviews/s-frog-evidence.json",
            "sha256": "d3b3c103fb6231275e4cfe773a28ec607fa05a54c52a928f9886c93a578bfedb",
            "bytes": 5545
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          114,
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
            "path": "qa/reviews/s-frog-evidence.json",
            "sha256": "d3b3c103fb6231275e4cfe773a28ec607fa05a54c52a928f9886c93a578bfedb",
            "bytes": 5545
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          114,
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
            "path": "qa/reviews/s-frog-evidence.json",
            "sha256": "d3b3c103fb6231275e4cfe773a28ec607fa05a54c52a928f9886c93a578bfedb",
            "bytes": 5545
          }
        ],
        "framesReviewed": [
          0,
          30,
          60,
          90,
          114,
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
        "path": "drill-anim/lib/foot-orient.mjs",
        "sha256": "eb7b0452b75ef7701a2baf359908272bd3139a04ef56eacfffc4084b732ce431",
        "bytes": 2808,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/s-frog-r2.js",
        "sha256": "3acf8825596f68d494ca1cb938fc76cdabe7f8cdf3c2827c71ba3ce408eabffa",
        "bytes": 1129,
        "normalization": "lf"
      },
      {
        "root": "repo",
        "path": "drill-anim/specs/s-frog.js",
        "sha256": "bf056bbfb6f1024a18077509ecdf691d2ce4118b32b95930a6fefb2e80915277",
        "bytes": 4125,
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
        "occlusionSha256": "cef52b712344f16db86f18148a8c94f062ceee50da4f58cc74328448c1400564",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/s-frog/layer-manifest.json",
          "sha256": "3b092d4e7e953393f0a029df00bdb03d87c1e3c35db14600741996777c8683cb",
          "bytes": 13082
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/s-frog/body/index.json",
            "sha256": "5fe215e997d92aab2a6ce640d95c3bdec3624c68b62ff957342289f4a12a303a",
            "bytes": 52649
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
            "path": "masters/realistic/s-frog/highlight/index.json",
            "sha256": "64e203fdab582e18e2bab812b078c6535102ee062466fdf1df48e67d708142b4",
            "bytes": 53849
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
            "path": "masters/realistic/s-frog/shadow/index.json",
            "sha256": "13c1e7256f1c05174456526cca0b99de76bc2fec11cecf4a5438664aad496c9b",
            "bytes": 53129
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
        "occlusionSha256": "cef52b712344f16db86f18148a8c94f062ceee50da4f58cc74328448c1400564",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/s-frog/layer-manifest.json",
          "sha256": "99a59cf757214fca3d99af9d97636ef0dceb226269ff1a61ea5ff3ad32f32d26",
          "bytes": 13334
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/s-frog/body/index.json",
            "sha256": "aa3137e25c3b423eff66f73181ba5916518e21ebfc0af4ccf5d2ef9ffcbadd23",
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
      },
      "neon-night": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "cef52b712344f16db86f18148a8c94f062ceee50da4f58cc74328448c1400564",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/s-frog/layer-manifest.json",
          "sha256": "3a653f6fc1f374eea30aa59351df27b52baa4194357022ffad51ed34a2ad3d40",
          "bytes": 13334
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/s-frog/body/index.json",
            "sha256": "d44acd8251fdb593cfdd5126474eb84c6abc3fc1efe51026db5b0c0ebf868bc9",
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
      },
      "neon-night-b": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "cef52b712344f16db86f18148a8c94f062ceee50da4f58cc74328448c1400564",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/s-frog/layer-manifest.json",
          "sha256": "1ba5bb147bf4757c9cf56c5b2c606b4afacfe4609f8536accfe9ff3c04efd0e8",
          "bytes": 13342
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/s-frog/body/index.json",
            "sha256": "b20960d933b96dfb3e8c3f8ca97045322ef186b1f94c7f79a8d668c11299b69a",
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
      "hologram": {
        "geometrySha256": "aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152",
        "occlusionSha256": "cef52b712344f16db86f18148a8c94f062ceee50da4f58cc74328448c1400564",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/s-frog/layer-manifest.json",
          "sha256": "c51854360c9866691c8faace1715740b3c1f18de13037e2e15bff48d45537dfe",
          "bytes": 13326
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/s-frog/body/index.json",
            "sha256": "4fd38ab06d0b5b284b1ac73f0f28e9bd7cfa34b1af94a0fa390324d03a20a1f1",
            "bytes": 52409
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
          "path": "qa/reviews/s-frog-evidence.json",
          "sha256": "d3b3c103fb6231275e4cfe773a28ec607fa05a54c52a928f9886c93a578bfedb",
          "bytes": 5545
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
          "path": "derivatives/realistic/s-frog/dark/loop.720.mp4",
          "sha256": "e7e1c0e40c5a0e23af51cb93561296f0676c3fb95e4981f7e1d5bacb7bffc637",
          "bytes": 337969,
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
          "path": "derivatives/realistic/s-frog/dark/cover.720.jpg",
          "sha256": "0c8232335ea763dca0f0e66e329ee4b9e5cd210d79b0759d86c91cf26d6e9a22",
          "bytes": 24372,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/s-frog/dark/thumbnail.240.jpg",
          "sha256": "635c1b1b09fb7a6c6ab66d91ebf10414c6e2bb49197fc4a161b44901f53880b6",
          "bytes": 5094,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/dark/start.720.png",
              "sha256": "334394b2d833d64a15c409194457a5c2793ad114746ebb7d51d7105180daa784",
              "bytes": 64925,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/dark/peak.720.png",
              "sha256": "ef0571d36a7816ad7231d93e6fb7168d9c84225a2da6e4946f3b096a867d2001",
              "bytes": 63681,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/dark/end.720.png",
              "sha256": "d8527884b4c8221184eef09a032f16c8e1d541848768dea9ef096ac617230dc8",
              "bytes": 64936,
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
          "path": "derivatives/realistic/s-frog/light/loop.720.mp4",
          "sha256": "24c0134822d4b5b92ae75de3d3c9788be5afb37e6dca6acc232bb19fb74f30be",
          "bytes": 337190,
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
          "path": "derivatives/realistic/s-frog/light/cover.720.jpg",
          "sha256": "5998e915ce5c2edf930bff1ad3a1ad842b2b38c28fb204512e94d0c29b9531f5",
          "bytes": 28327,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/s-frog/light/thumbnail.240.jpg",
          "sha256": "b70baa28f2fd47b76a63675f42a8e547e949843e952d17f6c591b9b9c26f7d7f",
          "bytes": 6529,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/light/start.720.png",
              "sha256": "1c943b601e907b02e23d0523543b99d957180e7cfc99e01f22bd842c46770e4f",
              "bytes": 71214,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/light/peak.720.png",
              "sha256": "6643d09283dbb0a19cc6283e70c0fb6d84e653dd046e3d4049803c5fa1678023",
              "bytes": 69889,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/s-frog/light/end.720.png",
              "sha256": "902795229b0c88cccd3cb734cd0d90317e46494e57749d455cfb52af7940390b",
              "bytes": 71190,
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
          "path": "derivatives/tech-white/s-frog/dark/loop.720.mp4",
          "sha256": "3955f16d3fe9afc0653c8089491e0f347b49eaa6aa75c93929f544cbf39f9a9b",
          "bytes": 378883,
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
          "path": "derivatives/tech-white/s-frog/dark/cover.720.jpg",
          "sha256": "6d6c1c391d3b69c8abd482157fac0f9eef45936f8733cbaa493d4d8e59cc940e",
          "bytes": 31559,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/s-frog/dark/thumbnail.240.jpg",
          "sha256": "86a72ce43b756fe8df91a06fb4b4cfdcb221e57ec3e8a30a7239aa84fccb57fb",
          "bytes": 6729,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/dark/start.720.png",
              "sha256": "e50859e8f4a0ffc7134456e506ae972aa3e56725d6842c746fc609769dde4c25",
              "bytes": 86487,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/dark/peak.720.png",
              "sha256": "b83a3f81a67e997fba51aace937616d6cb9f858fad474f70cfdc33e0c25665cd",
              "bytes": 84848,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/dark/end.720.png",
              "sha256": "8f181d91db732c9e6d7bbe66195bc38e0568946e58414a131156f618a861458c",
              "bytes": 86527,
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
          "path": "derivatives/tech-white/s-frog/light/loop.720.mp4",
          "sha256": "cf14d223db6f8af4431a496166f7d6241803fcc8eab0a516500d7f1531d7151c",
          "bytes": 383488,
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
          "path": "derivatives/tech-white/s-frog/light/cover.720.jpg",
          "sha256": "a1eddf25ccdd383ab9b3d484daaea2248ea8cd0efaf559a7629640ee406ee567",
          "bytes": 33218,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/s-frog/light/thumbnail.240.jpg",
          "sha256": "44cf2ccd602bfa249a42cac801fd054bcdcbcf142c2a6040522cdeed8f4b3e91",
          "bytes": 7203,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/light/start.720.png",
              "sha256": "fcefa76292ac67e4ba4cddc99c95e43b1ebc8a6c86efb18c5980586e5c85500e",
              "bytes": 88577,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/light/peak.720.png",
              "sha256": "dbca69efcb777d785a5547fc5ecdc49b0f8efedc9ae6448ce7cce81428c4e2e2",
              "bytes": 87157,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/s-frog/light/end.720.png",
              "sha256": "e59bbd6e071d355cb52b6950ef3e21b1f1e918f5cb6669f89b6bdcc246f3fefc",
              "bytes": 88630,
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
          "path": "derivatives/neon-night/s-frog/dark/loop.720.mp4",
          "sha256": "8cd0a4ca1b46e8f422b0dd590998f2d0a0421a83274b1e39755ad0268c746ffc",
          "bytes": 376445,
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
          "path": "derivatives/neon-night/s-frog/dark/cover.720.jpg",
          "sha256": "9025360cbd5e896518d78d6e3128632928eb1cb80af21815aac72b3e95624c07",
          "bytes": 31182,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/s-frog/dark/thumbnail.240.jpg",
          "sha256": "b224f46ed437a5a84d519645b7c4187150198430e6f3722951559dd6ddb2773e",
          "bytes": 6185,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/dark/start.720.png",
              "sha256": "520a0686f347952c7846be7f97fe80dad2171889debd445e2349a355935374f1",
              "bytes": 85702,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/dark/peak.720.png",
              "sha256": "67d6cece59478602f0a007b0783baabb16a45a31af526d995e12ff58b2c69668",
              "bytes": 83395,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/dark/end.720.png",
              "sha256": "09358cebc05de5cdb249ee06376a582e8d9e1dd6e239a1acd4a1dd2e9787d765",
              "bytes": 85627,
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
          "path": "derivatives/neon-night/s-frog/light/loop.720.mp4",
          "sha256": "823c661b8974d4abb6d05b476df834a3eb5ef39782c57f661251adbe65eb2c43",
          "bytes": 409735,
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
          "path": "derivatives/neon-night/s-frog/light/cover.720.jpg",
          "sha256": "520b15faa4c1e895f66633403682cec68f58896516510de0ef2ab24741edff25",
          "bytes": 35709,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/s-frog/light/thumbnail.240.jpg",
          "sha256": "7f60026dd349146406fde7be545766fba0f1526dfb110d9a46fa54f84a23e2af",
          "bytes": 7783,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/light/start.720.png",
              "sha256": "3d955aeac5e6f46254bfee4e904071cc2660ec5e0702d30171aa196517420d05",
              "bytes": 92946,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/light/peak.720.png",
              "sha256": "5c7eea82185e46b8300b971ffc4d7d84bf1b8bd5b45cd14321a5ef849bd11965",
              "bytes": 90731,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/s-frog/light/end.720.png",
              "sha256": "2aa83b3dda228b0eb73dbb71e2581cf6b7162f87571bcde2641fc92556f1be3c",
              "bytes": 93092,
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
          "path": "derivatives/neon-night-b/s-frog/dark/loop.720.mp4",
          "sha256": "a36d4014c126c11951f2fd95ebee01fd01c4713350a225ddef864e969e66a142",
          "bytes": 388348,
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
          "path": "derivatives/neon-night-b/s-frog/dark/cover.720.jpg",
          "sha256": "11d00233916f9b3fdb3ba9ef68c6f7d5aa0d435ee5fc07e7eeafe23d8cb543a1",
          "bytes": 31103,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/s-frog/dark/thumbnail.240.jpg",
          "sha256": "c66e678c78d8756abdada5f103b45c51428f9877d85c36d4b7f576ecc20db523",
          "bytes": 6233,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/dark/start.720.png",
              "sha256": "8e8c921dc8ab6a96a5c43f914d27bce5ea44252fe2333ed60cd2898f957a36ea",
              "bytes": 85340,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/dark/peak.720.png",
              "sha256": "56e7bc7fb86f690ddc41378b355c2bc1b070c9955f39c9cf6065e14d95a3f0af",
              "bytes": 83023,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/dark/end.720.png",
              "sha256": "d4e5577fcb4211e05c47f0286abe13020135a208220383a00f2d4db9e42f8fcb",
              "bytes": 85212,
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
          "path": "derivatives/neon-night-b/s-frog/light/loop.720.mp4",
          "sha256": "c5ad2377676dcb9315b8555b3ae2e2705dc100050814f8f7d602f3b462c4c5f0",
          "bytes": 418051,
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
          "path": "derivatives/neon-night-b/s-frog/light/cover.720.jpg",
          "sha256": "2274c112d39c6f619653a101b13577c78c4323ad187a5a990ae1b0254cf196e3",
          "bytes": 35525,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/s-frog/light/thumbnail.240.jpg",
          "sha256": "6d39e43c9f0c5717a1742f193563c327acbe27e2558a8a15cc07b6b4ffdb39c0",
          "bytes": 7812,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/light/start.720.png",
              "sha256": "4d18637b17fe99ee70fea1e5bc1fe5eb14dd2ea6ce51a079b74d41ea6a47fe51",
              "bytes": 92772,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/light/peak.720.png",
              "sha256": "ad3aba11c3a7263ecceb2327068e34e84a3b0896e94cd8927c6cb280fd42f82e",
              "bytes": 90517,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/s-frog/light/end.720.png",
              "sha256": "0494de2191e6b810b4d1ad8c5cdc436fb80ad0ddd93c13855b66846c50cdc3e1",
              "bytes": 92723,
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
          "path": "derivatives/hologram/s-frog/dark/loop.720.mp4",
          "sha256": "f5652dfe1bcf1abd4948a3947501f2220e10cebc5cde8876a23f0e88f5b8e0a5",
          "bytes": 461693,
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
          "path": "derivatives/hologram/s-frog/dark/cover.720.jpg",
          "sha256": "9902bc359d563efbb15c48714ae57522b9a4f5e53fc799099a1bf58cbfe14b60",
          "bytes": 30153,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/s-frog/dark/thumbnail.240.jpg",
          "sha256": "1147a40487ab5f401f752417137edba167ae190cd00da2a908800414083f3d24",
          "bytes": 5991,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/dark/start.720.png",
              "sha256": "4ad3b85e822f1aaf77e8a781f51dc36d1c8631ea7ef27f9e305fbf669f2b3112",
              "bytes": 90172,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/dark/peak.720.png",
              "sha256": "5b7fd4bbbf098c013307a671f8695216bca07f4e3e39a72ff44e87614931d626",
              "bytes": 87901,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/dark/end.720.png",
              "sha256": "926fec6736ec7d39b69c26a982abb62b97a48de9744b097188d5a9586f2e25af",
              "bytes": 90176,
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
          "path": "derivatives/hologram/s-frog/light/loop.720.mp4",
          "sha256": "0200c7cf4089495f5c24c2083ee7144cb5c2e6fab85b7b3919178e1bbd138e84",
          "bytes": 275159,
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
          "path": "derivatives/hologram/s-frog/light/cover.720.jpg",
          "sha256": "b3230c7a2b93e228df9ab416bb18bb1ecbe446d2f00983f9811c77d2b6f79c29",
          "bytes": 28645,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/s-frog/light/thumbnail.240.jpg",
          "sha256": "096c25b02b37e62a3fbfec550187dd4923d9f24e61e314e926c3055b60ff6136",
          "bytes": 6824,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/light/start.720.png",
              "sha256": "2413750dfec3a301b81b8aea01561a6cc84514c2615565c057cca256507eeb51",
              "bytes": 83284,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/light/peak.720.png",
              "sha256": "6d1aa497967a8876c5a39b1198d07213cad247bc53db61ee281a8e205deb0044",
              "bytes": 82798,
              "width": 720,
              "height": 720,
              "frame": 114
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/s-frog/light/end.720.png",
              "sha256": "79ecef1512de572259b07936e6bcfbbbf6627cd6e4db22e775dca4f79d23c350",
              "bytes": 83260,
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
        "path": "derivatives/realistic/s-frog/cover.transparent.1080.png",
        "sha256": "d2bf8abbc33e6db36c8f24519f3f58885e5de07df585a9c6fb6385cf6d7214a9",
        "bytes": 147796,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/s-frog/cover.transparent.1080.png",
        "sha256": "94ad0132e7a15873fe340661ac53dd2651f63e5efd25663e5df20b739c45f01d",
        "bytes": 187782,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/s-frog/cover.transparent.1080.png",
        "sha256": "c0dd8736ade5977258f90b337b31eef9ecc3c186081a0294f70c1ba29c15fa29",
        "bytes": 194361,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/s-frog/cover.transparent.1080.png",
        "sha256": "ea307443fbc7559f8dd2359fae28e3f9585e3b7cd7a9999ca9982c3c5b7aab29",
        "bytes": 194906,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/s-frog/cover.transparent.1080.png",
        "sha256": "f2e2462ad5b19158675063687db0ee4e4504f65f350830329626f6ebac344124",
        "bytes": 230424,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/s-frog.json",
        "sha256": "f3e11305500c6d0620e794ce1052e66a7f225913132cc9bfa34595295f8d6d8a",
        "bytes": 293
      }
    },
    "framingId": "fixed-square-f3e11305500c6d06",
    "compositor": {
      "root": "repo",
      "path": "tools/action-package-v2/composite.py",
      "sha256": "fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507",
      "bytes": 21548
    }
  },
  "voice": {
    "actionId": "s-frog",
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
      "path": "manifests/s-frog.json",
      "sha256": "0610c95bda6b0e60e3f2d3bac7e7aa1560c327af99f940043e8cca3aa4fea1df",
      "bytes": 27701
    }
  }
}
```
