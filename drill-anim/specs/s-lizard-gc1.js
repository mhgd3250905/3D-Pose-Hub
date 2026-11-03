// s-lizard-gc1: ground-contact fix r1·M2 (2026-11-04) of s-lizard.js. 双手 palmAt y +24.7 mm（砖面）；后脚踝 +11 mm、跖屈 −3°
export default {
  "id": "s-lizard-gc1",
  "name": "蜥蜴式低弓步",
  "nameEn": "Lizard Lunge",
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
        0.355,
        -0.02
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
            26
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
            38
          ]
        ]
      },
      "hands": {
        "left": {
          "mode": "free",
          "frame": "world",
          "relax": 0,
          "palmAt": [
            0.16,
            0.1847,
            0.569
          ],
          "finger": [
            0,
            0,
            1
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "pole": [
            0.6,
            0.5,
            0.3
          ]
        },
        "right": {
          "mode": "free",
          "frame": "world",
          "relax": 0,
          "palmAt": [
            -0.125,
            0.1847,
            0.556
          ],
          "finger": [
            0,
            0,
            1
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "pole": [
            -0.6,
            0.5,
            0.3
          ]
        }
      },
      "feet": {
        "right": {
          "mode": "floor",
          "at": [
            -0.32,
            0.6
          ],
          "heading": -24,
          "pitch": 0,
          "pole": [
            -0.5,
            0.9,
            0.4
          ]
        },
        "left": {
          "mode": "free",
          "frame": "world",
          "ankle": [
            0.1,
            0.0515,
            -0.69
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
            0.1,
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
            0.1,
            0.0516,
            -0.2
          ],
          "axes": [
            0,
            1,
            0
          ],
          "weight": 3
        },
        {
          "type": "reach",
          "limb": "leftArm",
          "angle": 170,
          "weight": 1
        },
        {
          "type": "reach",
          "limb": "rightArm",
          "angle": 170,
          "weight": 1
        }
      ],
      "solve": {
        "vars": [
          "py",
          "c0"
        ],
        "reg": {
          "py": 0.1,
          "c0": 0.05
        }
      }
    },
    "deltas": {
      "open": {
        "constraints": [
          {
            "at": [
              0.1,
              0.0542,
              -0.2
            ]
          }
        ],
        "pelvis": [
          0,
          0.297,
          0.035
        ],
        "hips": {
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              23
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
              29
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
    "pulseBase": 0.3
  },
  "camera": {
    "dir": [
      0.85,
      0.25,
      0.55
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightKnee",
      "leftPalm"
    ],
    "pad": 0.14,
    "k": 1,
    "drift": 0.9,
    "at": 3.8
  },
  "frame": {
    "mode": "fit",
    "width": 760,
    "height": 560,
    "cx": 512,
    "cy": 560
  },
  "stillAt": 3.8,
  "shadow": {
    "joints": [
      "leftToe",
      "rightToe",
      "rightAnkle",
      "leftKnee",
      "pelvis",
      "leftPalm"
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
      },
      {
        "j": "leftPalm",
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
        "rx": 80,
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
        -0.05,
        0,
        -0.1
      ],
      "size": [
        0.61,
        1.83,
        0.006
      ],
      "yaw": 0
    },
    {
      "type": "mat",
      "at": [
        0.16,
        0.1594,
        0.575
      ],
      "size": [
        0.11,
        0.23,
        0.1594
      ]
    },
    {
      "type": "mat",
      "at": [
        -0.125,
        0.1594,
        0.575
      ],
      "size": [
        0.11,
        0.23,
        0.1594
      ]
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
      },
      {
        "c": "handL",
        "when": "always"
      },
      {
        "c": "handR",
        "when": "always"
      }
    ],
    "jointPins": [
      {
        "j": "leftKnee",
        "axes": "xz"
      },
      {
        "j": "leftAnkle"
      }
    ],
    "straight": [
      {
        "j": "elbow.left",
        "min": 166
      },
      {
        "j": "elbow.right",
        "min": 166
      }
    ],
    "allowContact": [
      "forearmR|shinR",
      "handR|footR",
      "upperArmR|thighR",
      "forearmR|thighR",
      "torso|thighR"
    ]
  }
};
