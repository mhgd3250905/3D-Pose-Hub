# 单腿臀桥 / Single-Leg Glute Bridge

ID: `glute-max-A`. State: review. Release eligible: False.

## Definition

```json
{
  "idMappings": [],
  "name": {
    "zh": "单腿臀桥",
    "en": "Single-Leg Glute Bridge"
  },
  "purpose": {
    "zh": "单腿臀桥，练臀大肌伸髋（每侧）",
    "en": "Practice a single-leg hip bridge with a level pelvis."
  },
  "tags": {
    "category": "strength",
    "activeMuscles": [
      "glute-max"
    ],
    "synergistMuscles": [
      "hamstrings",
      "abs",
      "obliques",
      "hip-abductors"
    ],
    "equipment": [
      "mat"
    ],
    "position": "supine",
    "scenes": [
      "home"
    ],
    "difficulty": 2,
    "trainingType": "strength"
  },
  "unilateral": true,
  "startingSide": "left",
  "cues": [
    {
      "id": "cue1",
      "text": {
        "zh": "一条腿抬起，用臀部把身体推高",
        "en": "One leg up, drive your hips up with your glutes"
      },
      "primary": true
    },
    {
      "id": "cue2",
      "text": {
        "zh": "左脚稳定支撑，保持骨盆朝向一致",
        "en": "Keep the left foot planted and the pelvis level."
      },
      "primary": false
    },
    {
      "id": "cue3",
      "text": {
        "zh": "缓慢放回起始位，不用腰部猛顶",
        "en": "Lower slowly to the starting position without thrusting through the lower back."
      },
      "primary": false
    }
  ],
  "commonErrors": [
    {
      "zh": "抬起时骨盆明显倾斜或旋转",
      "en": "Tilting or rotating the pelvis as you lift."
    },
    {
      "zh": "借腰部过度后仰代替臀部发力",
      "en": "Overarching the lower back instead of driving through the hip."
    }
  ],
  "cautions": {
    "items": [
      {
        "zh": "腰背：抬髋来自臀部，避免用过度拱腰换取高度。",
        "en": "Lower back: lift through the hips rather than forcing extra height by arching the lower back."
      },
      {
        "zh": "骨盆与支撑脚：保持骨盆平稳、左脚稳定支撑，下降时继续控制。",
        "en": "Pelvis and support foot: keep the pelvis level and the left foot planted while lowering under control."
      },
      {
        "zh": "颈肩：头和肩胛区域舒适承托，不把体重压在颈部。",
        "en": "Neck and shoulders: keep the head and shoulder-blade area comfortably supported rather than loading the neck."
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
        "zh": "已有医嘱限制髋伸展、单腿支撑负荷或仰卧训练时，先取得许可。",
        "en": "Obtain clearance first if hip extension, single-leg loading or supine exercise has been restricted."
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
    "w-feet-on-chair-bridge",
    "n-prone-hip-ext"
  ],
  "regressions": [
    "w-feet-on-chair-bridge"
  ],
  "progressions": [],
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
    "kind": "rep_updown",
    "leadSeconds": 0,
    "source": "source-timeline",
    "phases": [
      {
        "id": "prepare",
        "seconds": 0.3
      },
      {
        "id": "lift",
        "seconds": 1
      },
      {
        "id": "squeeze",
        "seconds": 1.6
      },
      {
        "id": "lower",
        "seconds": 1
      },
      {
        "id": "reset",
        "seconds": 0.1
      }
    ]
  },
  "apps": [
    "flarelab",
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
    "旧catalog明确alternative=w-feet-on-chair-bridge。其源spec是双脚椅面支撑的臀桥，去掉持续单侧支撑，列降阶候选；它会增加椅具并偏腘绳肌，不代表对每个人都更轻松。",
    "n-prone-hip-ext是旧catalog内level1的俯卧屈膝髋伸展，可作臀部伸髋目标替代；体位不同，不能照搬单腿臀桥剂量。",
    "独立进阶ID仍缺：当前没有经过比对确认的更高负荷单腿臀桥专用ID；不把不同模式的下肢动作强行列作臀桥进阶。",
    "协同标签依据本仓库臀桥家族及AAOS髋桥肌群说明，再对单腿骨盆控制作编辑推断；不是要求竖脊肌代偿拱腰。",
    "证据/推断边界见catalog/v2/definition-evidence.md（仓库原目录/源spec与权威一手资料；全部编辑审核仍pending）。",
    "医学安全参考：AAOS Spine Conditioning Program https://www.orthoinfo.org/recovery/spine-conditioning-program/ ; Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program/ ; NHS Strength exercises https://www.nhs.uk/live-well/exercise/strength-exercises/ ; retrieved 2026-10-21."
  ],
  "countingSemantics": "One lift and return on the support leg counts as one rep. Default reps=10 is per side; complete all 10 on the left support leg, then cue a side change. The 8-second clip contains two left-support reps and no side change; repeat five loops before switching for the default dose. Opposite-side media is not produced."
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
      "path": "drill-anim/specs/glute-max-A-r2.js",
      "sha256": "dad370c9ebb7670343744e8a84502fd8f6d06d39783af51885baae5b30e1af82",
      "bytes": 1239,
      "normalization": "lf"
    },
    "keyMoments": {
      "switchPoint": {
        "kind": "loop-boundary",
        "seconds": 8,
        "semantics": "The clip demonstrates only the left support side. Second 8 is an available loop boundary, not a mandatory side change. For the default 10 reps per side, complete five loops before cueing the opposite side. No within-clip switch and no mirrored media are produced."
      },
      "start": 0,
      "peak": 2.1,
      "end": 8
    },
    "highlightMuscles": [
      "glute-max"
    ],
    "qa": {
      "intersections": {
        "status": "pass",
        "reviewer": "Codex",
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/glute-max-A-evidence.json",
            "sha256": "756818e4b499d1a70336667bcb5e55339d804ed1ce2edf36e85af21ed204c253",
            "bytes": 5663
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/glute-max-A-evidence.json",
            "sha256": "756818e4b499d1a70336667bcb5e55339d804ed1ce2edf36e85af21ed204c253",
            "bytes": 5663
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/glute-max-A-evidence.json",
            "sha256": "756818e4b499d1a70336667bcb5e55339d804ed1ce2edf36e85af21ed204c253",
            "bytes": 5663
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
        "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
        "evidence": [
          {
            "root": "media",
            "path": "qa/reviews/glute-max-A-evidence.json",
            "sha256": "756818e4b499d1a70336667bcb5e55339d804ed1ce2edf36e85af21ed204c253",
            "bytes": 5663
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
    },
    "demonstratedSide": "left",
    "oppositeSideMedia": "not-produced",
    "dependencies": [
      {
        "root": "repo",
        "path": "drill-anim/specs/glute-max-A.js",
        "sha256": "2d5844dc5caa3cfdd6ff1368133a4f798c4571da8b2908a387eb30d65f6d0c8c",
        "bytes": 3606,
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
        "occlusionSha256": "51b9dfe18d66d834b27c71249c4a708503aa0c18413cce727c2a7bc7ac1c58ad",
        "measurement": {
          "root": "media",
          "path": "masters/realistic/glute-max-A/layer-manifest.json",
          "sha256": "f23557f0df560e7e7144b4664ce521d5f1372e1677ab69071ce85759c4840a43",
          "bytes": 13111
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/realistic/glute-max-A/body/index.json",
            "sha256": "effda3dd68533859cf80d584ec72a9d98d8b4410e827bb0d7e58cde967994a3b",
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
            "path": "masters/realistic/glute-max-A/highlight/index.json",
            "sha256": "9e6454d12d5d565695c8ed57cc6b80602861445f51d867c66afd3b737ca1eeb7",
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
            "path": "masters/realistic/glute-max-A/shadow/index.json",
            "sha256": "dfe2c197f5c2536f3c71565faf60c16c0566b2cd3d8f301c5c40ad2e599920a1",
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
        "occlusionSha256": "51b9dfe18d66d834b27c71249c4a708503aa0c18413cce727c2a7bc7ac1c58ad",
        "measurement": {
          "root": "media",
          "path": "masters/tech-white/glute-max-A/layer-manifest.json",
          "sha256": "4d947e4d6d846d68cbc2aaebb69feb0d56a0fdb70afe198e4684b10be92ed668",
          "bytes": 13363
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/tech-white/glute-max-A/body/index.json",
            "sha256": "65bc73548b62a37cb5f4884391f393b439c73b55f511128e51bebc4f12d72d99",
            "bytes": 54089
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
        "occlusionSha256": "51b9dfe18d66d834b27c71249c4a708503aa0c18413cce727c2a7bc7ac1c58ad",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night/glute-max-A/layer-manifest.json",
          "sha256": "6fedbafcf0caa2b01d55b516a32162e70412a1890f99fcbd16b180992362bf2c",
          "bytes": 13363
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night/glute-max-A/body/index.json",
            "sha256": "73a95361a3576342977bde18695408f137f26652c8b0ce0ca5537ceeaf12da17",
            "bytes": 54245
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
        "occlusionSha256": "51b9dfe18d66d834b27c71249c4a708503aa0c18413cce727c2a7bc7ac1c58ad",
        "measurement": {
          "root": "media",
          "path": "masters/neon-night-b/glute-max-A/layer-manifest.json",
          "sha256": "6fc4b8700295cf47ad643dd04acca393e6f62056ebb27dc8511138a5355ae0fa",
          "bytes": 13371
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/neon-night-b/glute-max-A/body/index.json",
            "sha256": "d9332c858630d65bb9b1363c711966cd3996b731f66d8b24961138e2efe6736d",
            "bytes": 54722
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
        "occlusionSha256": "51b9dfe18d66d834b27c71249c4a708503aa0c18413cce727c2a7bc7ac1c58ad",
        "measurement": {
          "root": "media",
          "path": "masters/hologram/glute-max-A/layer-manifest.json",
          "sha256": "1f3e7cd7084469dcafe011430e1c6ae3f1f30d456ad8aa4e8d79c446e6840cb0",
          "bytes": 13356
        },
        "bodyProps": {
          "sequence": {
            "root": "media",
            "path": "masters/hologram/glute-max-A/body/index.json",
            "sha256": "b735f6c38e322e48684f43face8a6c3c98c4dcc0c6a26c6778d91450a14c986b",
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
      "reviewedAt": "2026-10-21T09:13:40.424285+00:00",
      "evidence": [
        {
          "root": "media",
          "path": "qa/reviews/glute-max-A-evidence.json",
          "sha256": "756818e4b499d1a70336667bcb5e55339d804ed1ce2edf36e85af21ed204c253",
          "bytes": 5663
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
          "path": "derivatives/realistic/glute-max-A/dark/loop.720.mp4",
          "sha256": "f3a6cdf2d67f82998fdb662d2f32b701c438e26e6982063c76b0b7ccec052318",
          "bytes": 288243,
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
          "path": "derivatives/realistic/glute-max-A/dark/cover.720.jpg",
          "sha256": "92ee6cb0036740ed7ba05b91eb1632b6caed1552263608f5a7a3226837dec9dc",
          "bytes": 26638,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/glute-max-A/dark/thumbnail.240.jpg",
          "sha256": "ab060f2b4c814de5f985b923d0653b3dbf51e78231f1c3a9c724915d40ef27b7",
          "bytes": 5413,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/dark/start.720.png",
              "sha256": "6a4ffcaeee5cbe13ea967cb15ad62f2bf3b89626b44fae0e9ea3e10d5be2c28c",
              "bytes": 50632,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/dark/peak.720.png",
              "sha256": "6f0f52b349e3045ec5a8eeb7a84cd258385daee7ad140692663c02afcce76f62",
              "bytes": 60853,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/dark/end.720.png",
              "sha256": "70929a97508f9a7395eb3fa06a7fed66bff47cd844690f53303a3f13447b4f11",
              "bytes": 50369,
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
          "path": "derivatives/realistic/glute-max-A/light/loop.720.mp4",
          "sha256": "cf8ee33e121ca91894374e9484c4f2105c07eadf7f9ec5211d8baff9acdb2cf2",
          "bytes": 291394,
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
          "path": "derivatives/realistic/glute-max-A/light/cover.720.jpg",
          "sha256": "75b46e30fc46cc8e695840183e26f0e7817ca5675c280e4ef7f95bcc6268e49a",
          "bytes": 31144,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/realistic/glute-max-A/light/thumbnail.240.jpg",
          "sha256": "50f1858ec6262f979b0e3e9d881c287ead24abeaa3304d97891d5088db3d60b0",
          "bytes": 7078,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/light/start.720.png",
              "sha256": "78dc08d771e2814c78dc921e99f5c3b25a6f7b884535a8b8f350f93f5e3b6835",
              "bytes": 54666,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/light/peak.720.png",
              "sha256": "a1d68512088ee271d8b46831c06547c766da8233436a0e1fdcfd90a407dc4e1b",
              "bytes": 65753,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/realistic/glute-max-A/light/end.720.png",
              "sha256": "06193532862f683a86900f3075d4984ab15cc6981fb1d70d9fef8fd1217d4ded",
              "bytes": 54256,
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
          "path": "derivatives/tech-white/glute-max-A/dark/loop.720.mp4",
          "sha256": "92344e36cadbaf4d8295da2cb4185ecedb57ace7bf86d68d0eae502986faef69",
          "bytes": 405259,
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
          "path": "derivatives/tech-white/glute-max-A/dark/cover.720.jpg",
          "sha256": "bdec7f6e5ed89f270d5d1aef36c1c3f65f404ba713be0b0d9d4179869f23ecb2",
          "bytes": 36275,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/glute-max-A/dark/thumbnail.240.jpg",
          "sha256": "54c6ce200c63c19cb5770a2f832acb34b1488ea420dc44a7601884620dee5618",
          "bytes": 7303,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/dark/start.720.png",
              "sha256": "91494f43d07150a80e0ea4bb70d3a19188d85527f3f5b6dc3bddb3e4bcaaf034",
              "bytes": 76301,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/dark/peak.720.png",
              "sha256": "35ce6b8dbfe3b4e9823a0d611c03ebf03390f219d0a26d75bb7f268bf2326087",
              "bytes": 85727,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/dark/end.720.png",
              "sha256": "72b7731f3f2edebf89264f332fba9608d05d1e8e3285d3bac34e4c2c0b9b034b",
              "bytes": 76225,
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
          "path": "derivatives/tech-white/glute-max-A/light/loop.720.mp4",
          "sha256": "2ef4923a2c4f4bb70bd71889bcf1faac6c51048de1d6a47c56f16895fddae7d4",
          "bytes": 383673,
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
          "path": "derivatives/tech-white/glute-max-A/light/cover.720.jpg",
          "sha256": "e911bef6dc4c092b7fc357058947de9680b618474e143936ba8d10ef0ab450b1",
          "bytes": 34017,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/tech-white/glute-max-A/light/thumbnail.240.jpg",
          "sha256": "7ac22fb04a40ea6b2d0fa750ebaec1799c8fff5927c3feceeb9a658fd79e3647",
          "bytes": 6532,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/light/start.720.png",
              "sha256": "901464babe3166370eaa43f6ef616be8db031aa8fc4b9a17f54c30ad472bf140",
              "bytes": 74299,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/light/peak.720.png",
              "sha256": "b2c1f459fb61bfd918df9b151334191cd1bd3f6a153d84a4a9b4cabb795528de",
              "bytes": 82039,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/tech-white/glute-max-A/light/end.720.png",
              "sha256": "5e785262a3210d40a9a59125147ea64f1172fb7eca320476dccbc9b99efde198",
              "bytes": 74098,
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
          "path": "derivatives/neon-night/glute-max-A/dark/loop.720.mp4",
          "sha256": "87ffb0eb4cad4c89cb88f05291215130568bd6231c4b5b8ffc8293c825a93a6b",
          "bytes": 405145,
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
          "path": "derivatives/neon-night/glute-max-A/dark/cover.720.jpg",
          "sha256": "0ff67dffbc8682c429a507bee5c85b4aeacc2b3250668f9f846ae4dc4a9fd13e",
          "bytes": 35516,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/glute-max-A/dark/thumbnail.240.jpg",
          "sha256": "a7975ca80d8c8537329a3818c8be2e30edccf9bac282e88f2426edbbab1b447e",
          "bytes": 6496,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/dark/start.720.png",
              "sha256": "b6690d98ac51aa33e60fc9be51e655b90bf1542bf20aecac05bfcc0804b814a0",
              "bytes": 77178,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/dark/peak.720.png",
              "sha256": "7cd4f4df6d41512a3cf5a122c5bb8f049abb959afa9d7a8f6b7ae6edc40cde9c",
              "bytes": 84321,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/dark/end.720.png",
              "sha256": "d32a0627bfe44960dd364e173174bd223be55ad85f5ead21aa969030a0fa2bf8",
              "bytes": 77023,
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
          "path": "derivatives/neon-night/glute-max-A/light/loop.720.mp4",
          "sha256": "c2f6c2840c9d60cb5e218192cf5b71270abe039dfe14c41a3a363207c8f54d2f",
          "bytes": 427644,
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
          "path": "derivatives/neon-night/glute-max-A/light/cover.720.jpg",
          "sha256": "661b5ec257bce0fb8ee4a8ba54f75c62a003c8e0c676e577369b8ad11a999bb3",
          "bytes": 40849,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night/glute-max-A/light/thumbnail.240.jpg",
          "sha256": "85c39f09943b5fbc103cf9daccae06b2fa0590858329435f33b4e1c5d1775ba9",
          "bytes": 8312,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/light/start.720.png",
              "sha256": "dc185585d5cb1d4aea9a816a2d0001c34ddadb1b8733d4bfda851f4d21fde1a7",
              "bytes": 81783,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/light/peak.720.png",
              "sha256": "6b9cca28b4a16b5f5224b3747d5bf45cd4337c09dec6daf6bdd638aaa8f59b5f",
              "bytes": 91213,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night/glute-max-A/light/end.720.png",
              "sha256": "696deeae7ced2d3bde8a9e7894f62a92666fa437f79f2a11d3f2e691de5b1a6f",
              "bytes": 81616,
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
          "path": "derivatives/neon-night-b/glute-max-A/dark/loop.720.mp4",
          "sha256": "f796b5cfc13be9f5f209f676a5c54ba78ee1460d3d3566a7be3b4eefad805046",
          "bytes": 422920,
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
          "path": "derivatives/neon-night-b/glute-max-A/dark/cover.720.jpg",
          "sha256": "e2f63484556db2fc5b35861f40801310601be2942837c2804745f9bc08c6dc68",
          "bytes": 35495,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/glute-max-A/dark/thumbnail.240.jpg",
          "sha256": "29b788dab70b279b63098e95951f7a77dad868ff92c6663cd4375681e986651e",
          "bytes": 6591,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/dark/start.720.png",
              "sha256": "40c38e68b00618e8c274fec41d38649e60b72f0eaf5ac4a8467e0177c797f765",
              "bytes": 76744,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/dark/peak.720.png",
              "sha256": "8b8f50d2696bd071415fb616b2237c66ff6b67bf18732357fd9cd94ca487ca16",
              "bytes": 83783,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/dark/end.720.png",
              "sha256": "a513060f31dcc391afac321dc3c18b6b2f1367292da7b4ce7a4b663b5dc37cc8",
              "bytes": 76791,
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
          "path": "derivatives/neon-night-b/glute-max-A/light/loop.720.mp4",
          "sha256": "37382f044e23b478d1d90a8ec6ce27221401a8f0dcd640f163c65c2fb15d3199",
          "bytes": 440238,
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
          "path": "derivatives/neon-night-b/glute-max-A/light/cover.720.jpg",
          "sha256": "50d9bf23a5d0e938c9368e86701d8039a25f9b2b7abb5872e960ac71f93e7e1d",
          "bytes": 40480,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/neon-night-b/glute-max-A/light/thumbnail.240.jpg",
          "sha256": "97cb7b1b536dd3f6dbdf16d74b03ae9af2c431ea1f5b4a7057afc11c7523599d",
          "bytes": 8225,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/light/start.720.png",
              "sha256": "85f01ea3514bbe4bc1b95f877685edbd624e5d4e7fc3bea4554502c240748aa9",
              "bytes": 81097,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/light/peak.720.png",
              "sha256": "f7e68d32730e231c5effb6b0ca4317d506d9feb650b26b2ee977eeb9d0f99612",
              "bytes": 90982,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/neon-night-b/glute-max-A/light/end.720.png",
              "sha256": "c2c15d04a718acf60aee882a3aec15eb2ce2734fa00520933cca833e1ff20d56",
              "bytes": 81092,
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
          "path": "derivatives/hologram/glute-max-A/dark/loop.720.mp4",
          "sha256": "1ae4d4446cb2c91758982688207f5e510f435302f36b301085054a4b0c60658a",
          "bytes": 484274,
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
          "path": "derivatives/hologram/glute-max-A/dark/cover.720.jpg",
          "sha256": "ef881df614b104f27fa53dcee88cc949e240dbf6718092edc0c734fa6c37c781",
          "bytes": 34343,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/glute-max-A/dark/thumbnail.240.jpg",
          "sha256": "880871e0e9275674be3ac8b69ffd16a5dc1f5e5e61b0e65a2f0844bc3f713b6a",
          "bytes": 6186,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/dark/start.720.png",
              "sha256": "df9edf157f4205df4191953a00c2ede91dc2eb6260e5e21f5e3a4affaebc9232",
              "bytes": 84999,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/dark/peak.720.png",
              "sha256": "736a0a45664b2f68eabad50271426356822f7de4a646d43fa68f9df517fb2ff2",
              "bytes": 91340,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/dark/end.720.png",
              "sha256": "b49bae14a9206a7b748a1b50030981974d00467da8206cea4fd3f8eec8712f6d",
              "bytes": 84943,
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
          "path": "derivatives/hologram/glute-max-A/light/loop.720.mp4",
          "sha256": "da43d789ae6e113b1093c8895263fda0c764ba03b21e09230daa8ba7a44ff31a",
          "bytes": 246816,
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
          "path": "derivatives/hologram/glute-max-A/light/cover.720.jpg",
          "sha256": "717413bafcd00f7f1242e011ebf3d86d7349a49dec3b41b3e68dcf3401760896",
          "bytes": 29521,
          "width": 720,
          "height": 720
        },
        "thumbnail": {
          "root": "media",
          "path": "derivatives/hologram/glute-max-A/light/thumbnail.240.jpg",
          "sha256": "cd048bbc77b015dcd617190fb98b933ecf187ff1693844d55452b81c90c2c21e",
          "bytes": 6310,
          "width": 240,
          "height": 240
        },
        "keyframes": [
          {
            "phase": "start",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/light/start.720.png",
              "sha256": "6bdc3ba549f19965b7d2920f1d7e983ac757f23bfa43e00cd912f6b05ed4af21",
              "bytes": 74475,
              "width": 720,
              "height": 720,
              "frame": 0
            }
          },
          {
            "phase": "peak",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/light/peak.720.png",
              "sha256": "a008804a42e2ceee5c21a4f80c4a7ccab98fea67278ad8a998c817440b8ab1af",
              "bytes": 81565,
              "width": 720,
              "height": 720,
              "frame": 63
            }
          },
          {
            "phase": "end",
            "asset": {
              "root": "media",
              "path": "derivatives/hologram/glute-max-A/light/end.720.png",
              "sha256": "03ba78141e6ab55a8041f34481ffd13698b2a8450182ce97cce710b136346dbb",
              "bytes": 74354,
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
        "path": "derivatives/realistic/glute-max-A/cover.transparent.1080.png",
        "sha256": "5f945bb052f7360737ee7eb9e57cb03e51a57fd75f24031f95b23146fe922fcb",
        "bytes": 133104,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "tech-white": {
        "root": "media",
        "path": "derivatives/tech-white/glute-max-A/cover.transparent.1080.png",
        "sha256": "df2cd8da1710f9083888650e0466cdd8c0f8a33b43093e74b4089c786921295c",
        "bytes": 175772,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night": {
        "root": "media",
        "path": "derivatives/neon-night/glute-max-A/cover.transparent.1080.png",
        "sha256": "f83a3e393146970f529caea336c4640a50aceb2f0ad63bf964da230faf8d288a",
        "bytes": 193727,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "neon-night-b": {
        "root": "media",
        "path": "derivatives/neon-night-b/glute-max-A/cover.transparent.1080.png",
        "sha256": "953c651cc4270fde1d3c959c32613e30a972eaca34d704ccea33a8fc3b96591a",
        "bytes": 194006,
        "width": 1080,
        "height": 1080,
        "alpha": true
      },
      "hologram": {
        "root": "media",
        "path": "derivatives/hologram/glute-max-A/cover.transparent.1080.png",
        "sha256": "dd95ec08206a866a7b3dae47506b88d2a2273f43fc2ae2497badd9885b9866bb",
        "bytes": 232989,
        "width": 1080,
        "height": 1080,
        "alpha": true
      }
    },
    "provenance": {
      "framing": {
        "root": "media",
        "path": "manifests/framing/glute-max-A.json",
        "sha256": "290102b64c04767b4e26ee62f4d89602a109440cc4cad20a8168be896151851b",
        "bytes": 293
      }
    },
    "framingId": "fixed-square-290102b64c04767b",
    "compositor": {
      "root": "repo",
      "path": "tools/action-package-v2/composite.py",
      "sha256": "fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507",
      "bytes": 21548
    }
  },
  "voice": {
    "actionId": "glute-max-A",
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
      "path": "manifests/glute-max-A.json",
      "sha256": "eee66442bd12325aa1c5e0b0cbbea3929c9841bd8267f6bea56f387bc1eea3ce",
      "bytes": 28056
    }
  }
}
```
