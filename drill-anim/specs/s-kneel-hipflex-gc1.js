// s-kneel-hipflex-gc1: ground-contact fix r1·M3 (2026-11-04) of s-kneel-hipflex.js. 后脚踝 +11 mm、跖屈 −3°（同 n-half-split-gc1）
export default {
  "id": "s-kneel-hipflex-gc1",
  "name": "半跪髋屈肌拉伸",
  "nameEn": "Half-Kneeling Hip Flexor Stretch",
  "timeline": {
    "duration": 8,
    "tracks": {
      "open": [
        [
          0,
          0
        ],
        [
          0.6,
          0
        ],
        [
          2,
          0.85
        ],
        [
          3.8,
          1
        ],
        [
          5.6,
          0.85
        ],
        [
          7,
          0
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        0,
        0.458,
        0.065
      ],
      "hips": {
        "up": [
          0,
          1,
          0
        ],
        "front": [
          0,
          0,
          1
        ],
        "rot": [
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
      "chest": {
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
          "mode": "free",
          "frame": "hips",
          "wrist": [
            0.171,
            1.1,
            -0.02
          ],
          "finger": [
            -0.15,
            -0.35,
            0.92
          ],
          "normal": [
            -0.9,
            0.35,
            0.1
          ],
          "pole": [
            0.75,
            1.15,
            -0.35
          ],
          "relax": 1,
          "touch": {
            "solve": "bisect",
            "clear": 0.0008
          }
        },
        "right": {
          "mode": "free",
          "frame": "hips",
          "wrist": [
            -0.171,
            1.1,
            -0.02
          ],
          "finger": [
            0.15,
            -0.35,
            0.92
          ],
          "normal": [
            0.9,
            0.35,
            0.1
          ],
          "pole": [
            -0.75,
            1.15,
            -0.35
          ],
          "relax": 1,
          "touch": {
            "solve": "bisect",
            "clear": 0.0008
          }
        }
      },
      "feet": {
        "right": {
          "mode": "floor",
          "at": [
            -0.12,
            0.47
          ],
          "heading": -3,
          "pitch": 0
        },
        "left": {
          "mode": "free",
          "frame": "world",
          "ankle": [
            0.09,
            0.0515,
            -0.36
          ],
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              154.8
            ]
          ],
          "pole": [
            0.085,
            0,
            0.4
          ]
        }
      },
      "constraints": [
        {
          "type": "mid",
          "limb": "leftLeg",
          "at": [
            0.087,
            0.0488,
            0.0496
          ],
          "axes": [
            0,
            1,
            0
          ],
          "weight": 3
        }
      ],
      "solve": {
        "vars": [
          "py"
        ],
        "reg": {
          "py": 0.1
        }
      }
    },
    "deltas": {
      "open": {
        "pelvis": [
          0,
          0.438,
          0.165
        ],
        "hips": {
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              -10
            ]
          ]
        },
        "chest": {
          "waist": [
            [
              [
                1,
                0,
                0
              ],
              8
            ]
          ]
        }
      }
    }
  },
  "highlight": {
    "groups": [
      "hip-flexors"
    ],
    "side": "left",
    "pulseTrack": "open",
    "pulseBase": 0.45
  },
  "camera": {
    "dir": [
      1,
      0.14,
      0.1
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightKnee"
    ],
    "pad": 0.16,
    "k": 1,
    "drift": 0.9,
    "at": 3.8
  },
  "frame": {
    "mode": "fit",
    "width": 600,
    "height": 700,
    "cx": 512,
    "cy": 530
  },
  "stillAt": 3.8,
  "shadow": {
    "joints": [
      "leftToe",
      "rightToe",
      "rightAnkle",
      "leftKnee",
      "pelvis"
    ],
    "blobs": [
      {
        "j": "rightAnkle",
        "rx": 46,
        "ry": 11,
        "a": 0.65
      },
      {
        "j": "leftKnee",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      }
    ],
    "bands": [
      {
        "from": "leftToe",
        "to": "rightAnkle",
        "mid": "leftKnee",
        "rx": 70,
        "ry": 14,
        "a": 0.3,
        "dy": 4,
        "sag": 0
      }
    ]
  },
  "props": [
    {
      "type": "mat",
      "at": [
        0,
        0,
        0.05
      ],
      "size": [
        0.61,
        1.83,
        0.006
      ],
      "yaw": 0
    }
  ],
  "keyFrames": [
    0.3,
    2,
    3.8
  ],
  "qa": {
    "pins": [
      {
        "c": "footR",
        "when": "always"
      },
      {
        "c": "footL",
        "when": "always"
      }
    ],
    "jointPins": [
      {
        "j": "leftKnee"
      },
      {
        "j": "leftAnkle"
      }
    ],
    "touch": [
      {
        "side": "left",
        "max_gap": 1
      },
      {
        "side": "right",
        "max_gap": 1
      }
    ],
    "allowContact": [
      "handL|torso",
      "handR|torso",
      "handL|thighL",
      "handR|thighR"
    ]
  }
};
