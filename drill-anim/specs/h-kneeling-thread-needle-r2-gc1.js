// h-kneeling-thread-needle-r2-gc1: ground-contact fix r1·M2 (2026-11-04) of h-kneeling-thread-needle-r2.js. 双手 clear +8.4 mm；四足基座骨盆 0.3842→0.4388、髋俯仰 12.778→7.778°；穿针段胸俯仰峰值 −24°（时间点不变）
export default {
  "id": "h-kneeling-thread-needle-r2-gc1",
  "name": "跪姿穿针",
  "nameEn": "Kneeling Thread the Needle",
  "modelProfile": "training-human-v2plus",
  "v2plus": {
    "outfit": "compression",
    "torso": "base",
    "limbs": "base",
    "hands": "base",
    "skin": "realistic",
    "handPose": {
      "left": "palm-floor",
      "right": "palm-floor"
    }
  },
  "size": 1080,
  "alignClavicles": false,
  "fps": 30,
  "timeline": {
    "duration": 8,
    "tracks": {
      "thread": [
        [
          0,
          0,
          "smooth"
        ],
        [
          1,
          0,
          "smooth"
        ],
        [
          3,
          1,
          "smooth"
        ],
        [
          5,
          1,
          "smooth"
        ],
        [
          7,
          0,
          "smooth"
        ],
        [
          8,
          0,
          "smooth"
        ]
      ],
      "k0": [
        [
          0,
          2.96474,
          "smooth"
        ],
        [
          1,
          2.96474,
          "smooth"
        ],
        [
          3,
          -21.03526,
          "smooth"
        ],
        [
          5,
          -21.03526,
          "smooth"
        ],
        [
          7,
          2.96474,
          "smooth"
        ],
        [
          8,
          2.96474,
          "smooth"
        ]
      ],
      "k1": [
        [
          0,
          0,
          "smooth"
        ],
        [
          1,
          0,
          "smooth"
        ],
        [
          3,
          55,
          "smooth"
        ],
        [
          5,
          55,
          "smooth"
        ],
        [
          7,
          0,
          "smooth"
        ],
        [
          8,
          0,
          "smooth"
        ]
      ],
      "k11": [
        [
          0,
          0,
          "smooth"
        ],
        [
          1,
          0,
          "smooth"
        ],
        [
          3,
          1,
          "smooth"
        ],
        [
          5,
          1,
          "smooth"
        ],
        [
          7,
          0,
          "smooth"
        ],
        [
          8,
          0,
          "smooth"
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        -0.43,
        0.4388,
        0
      ],
      "hips": {
        "up": [
          1,
          0,
          0
        ],
        "front": [
          0,
          -1,
          0
        ],
        "rot": [
          [
            [
              0,
              0,
              1
            ],
            7.778
          ]
        ]
      },
      "chest": {
        "body": [
          [
            [
              0,
              0,
              1
            ],
            0
          ]
        ],
        "waist": [
          [
            [
              1,
              0,
              0
            ],
            0
          ]
        ]
      },
      "hands": {
        "left": {
          "mode": "fingertips",
          "floor": 0,
          "clear": 0.025338,
          "at": [
            0,
            -0.19
          ],
          "finger": [
            1,
            0,
            0
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "poleUp": [
            0.24,
            0.95,
            0.18
          ]
        },
        "right": {
          "relax": 0,
          "blendPole": true,
          "plant": {
            "mode": "fingertips",
            "floor": 0,
            "clear": 0.025338,
            "at": [
              0,
              0.19
            ],
            "finger": [
              1,
              0,
              0
            ],
            "normal": [
              0,
              -1,
              0
            ],
            "poleUp": [
              -0.24,
              0.95,
              0.18
            ]
          },
          "free": {
            "mode": "free",
            "frame": "world",
            "wrist": [
              -0.1,
              0.055,
              -0.3
            ],
            "finger": [
              0,
              0,
              -1
            ],
            "normal": [
              0,
              1,
              0
            ],
            "poleUp": [
              -0.4,
              1.6,
              0.2
            ]
          },
          "w": 0,
          "arc": 0.06,
          "arcDir": [
            0,
            1,
            0
          ]
        }
      },
      "feet": {
        "left": {
          "mode": "floor",
          "floor": 0,
          "at": [
            -0.868,
            -0.15
          ],
          "heading": 90,
          "pitch": 62,
          "pole": [
            -0.515,
            0.0347,
            -0.15
          ]
        },
        "right": {
          "mode": "floor",
          "floor": 0,
          "at": [
            -0.868,
            0.15
          ],
          "heading": 90,
          "pitch": 62,
          "pole": [
            -0.515,
            0.0347,
            0.15
          ]
        }
      },
      "constraints": [],
      "solve": {
        "vars": [],
        "reg": {}
      }
    },
    "deltas": {
      "k0": {
        "chest": {
          "body": [
            [
              {},
              1
            ]
          ]
        }
      },
      "k1": {
        "chest": {
          "waist": [
            [
              {},
              1
            ]
          ]
        }
      },
      "k11": {
        "hands": {
          "right": {
            "w": 1
          }
        }
      }
    }
  },
  "highlight": {
    "groups": [
      "scapular",
      "deltoids",
      "lats"
    ],
    "side": "right",
    "pulseTrack": "thread",
    "pulseBase": 0.3
  },
  "camera": {
    "dir": [
      0.3,
      0.45,
      -1
    ],
    "fit": [
      "head",
      "leftPalm",
      "rightPalm",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightKnee"
    ],
    "pad": 0.15,
    "k": 0.55,
    "drift": 0,
    "at": 3
  },
  "frame": {
    "mode": "fit",
    "width": 840,
    "height": 800,
    "cx": 512,
    "cy": 520
  },
  "stillAt": 4,
  "props": [
    {
      "type": "mat",
      "at": [
        -0.45,
        0,
        0
      ],
      "size": [
        1.83,
        0.7,
        0.006
      ]
    }
  ],
  "keyFrames": [
    0,
    2,
    4,
    6,
    7.9
  ],
  "qa": {
    "pins": [
      {
        "c": "handL",
        "when": "always"
      },
      {
        "c": "footL",
        "when": "always"
      },
      {
        "c": "footR",
        "when": "always"
      }
    ],
    "jointPins": [
      {
        "j": "leftKnee"
      },
      {
        "j": "rightKnee"
      }
    ],
    "allowContact": [
      "thighL|shinL",
      "thighR|shinR"
    ]
  }
};
