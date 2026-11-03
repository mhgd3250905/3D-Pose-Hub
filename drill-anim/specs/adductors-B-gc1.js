// adductors-B-gc1: ground-contact fix r1·M2 (2026-11-04) of adductors-B.js. 左支撑手 floor→fingertips（同 x/z），clear 25.3 mm：手 −18.3→≈+1 mm
export default {
  "id": "adductors-B-gc1",
  "name": "屈膝哥本哈根侧撑",
  "nameEn": "Short-Lever Copenhagen Plank",
  "timeline": {
    "duration": 8,
    "tracks": {
      "lift": [
        [
          0,
          0
        ],
        [
          0.2,
          0
        ],
        [
          1.3,
          1
        ],
        [
          3.7,
          1
        ],
        [
          4,
          0
        ],
        [
          4.2,
          0
        ],
        [
          5.3,
          1
        ],
        [
          7.7,
          1
        ],
        [
          8,
          0
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        -0.48,
        0.24,
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
          0,
          1
        ],
        "rot": [
          [
            [
              0,
              0,
              1
            ],
            0
          ],
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
          "clear": 0.0253,
          "at": [
            0,
            0.215
          ],
          "finger": [
            0.15,
            0,
            1
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "poleUp": [
            0.6,
            1.25,
            -0.15
          ],
          "relax": 0
        },
        "right": {
          "mode": "free",
          "frame": "hips",
          "palmAt": [
            -0.165,
            1.06,
            0.03
          ],
          "finger": [
            0.05,
            -0.35,
            0.94
          ],
          "normal": [
            1,
            0,
            0
          ],
          "poleUp": [
            -0.55,
            1.15,
            -0.25
          ],
          "touch": {
            "clear": 0.0015,
            "from": 0,
            "iters": 20
          }
        }
      },
      "feet": {
        "right": {
          "mode": "free",
          "frame": "world",
          "ankle": [
            -0.87,
            0.496,
            -0.405
          ],
          "rot": [
            [
              [
                0,
                1,
                0
              ],
              180
            ],
            [
              [
                0,
                0,
                1
              ],
              -90
            ]
          ],
          "pole": [
            -1.26,
            0.49,
            0.3
          ]
        },
        "left": {
          "mode": "free",
          "frame": "hips",
          "ankle": [
            0.0815,
            0.341,
            -0.173
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
          ],
          "poleLow": [
            0.1,
            0.6,
            0.9
          ]
        }
      },
      "constraints": [
        {
          "type": "mid",
          "limb": "leftArm",
          "at": [
            0,
            0.0475,
            0
          ],
          "weight": 4
        },
        {
          "type": "joint",
          "joint": "leftShoulder",
          "axis": [
            1,
            0,
            0
          ],
          "value": 0,
          "weight": 0.3
        },
        {
          "type": "joint",
          "joint": "leftShoulder",
          "axis": [
            0,
            0,
            1
          ],
          "value": 0,
          "weight": 0.3
        },
        {
          "type": "mid",
          "limb": "rightLeg",
          "at": [
            -0.86,
            0.49,
            0
          ],
          "weight": 4
        },
        {
          "type": "joint",
          "joint": "pelvis",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.215,
          "weight": 0.6
        }
      ],
      "solve": {
        "vars": [
          "px",
          "py",
          "pz",
          "h0",
          "h1"
        ],
        "reg": {
          "px": 0.5,
          "py": 0.5,
          "pz": 0.5,
          "h0": 0.01,
          "h1": 0.05
        }
      }
    },
    "deltas": {
      "lift": {
        "feet": {
          "left": {
            "ankle": [
              0.096,
              0.341,
              -0.173
            ]
          }
        },
        "constraints": [
          {},
          {},
          {},
          {
            "at": [
              -0.86,
              0.485,
              0
            ]
          },
          {
            "value": 0.33
          }
        ]
      }
    }
  },
  "highlight": {
    "groups": [
      "adductors"
    ],
    "side": "right",
    "pulseTrack": "lift",
    "pulseBase": 0.3
  },
  "camera": {
    "dir": [
      -0.1,
      0.12,
      1
    ],
    "fit": [
      "head",
      "leftPalm",
      "leftElbow",
      "leftToe",
      "rightToe",
      "pelvis",
      "rightKnee",
      "rightElbow"
    ],
    "pad": 0.13,
    "k": 0.75,
    "drift": 2,
    "at": 2.4
  },
  "frame": {
    "mode": "fit",
    "width": 840,
    "cx": 512,
    "cy": 530
  },
  "stillAt": 2.4,
  "shadow": {
    "joints": [
      "leftPalm",
      "leftElbow",
      "pelvis",
      "leftShoulder",
      "leftAnkle"
    ],
    "blobs": [
      {
        "j": "leftElbow",
        "rx": 46,
        "ry": 12,
        "a": 0.7
      },
      {
        "j": "leftPalm",
        "rx": 40,
        "ry": 11,
        "a": 0.6
      }
    ],
    "bands": []
  },
  "props": [
    {
      "type": "mat",
      "at": [
        -0.25,
        0,
        0.05
      ],
      "size": [
        1,
        0.61,
        0.006
      ]
    },
    {
      "type": "bench",
      "at": [
        -1,
        0,
        -0.08
      ],
      "yaw": 90,
      "length": 1,
      "height": 0.4305
    }
  ],
  "keyFrames": [
    0.2,
    1.3,
    2.4
  ],
  "qa": {
    "pins": [
      {
        "c": "handL",
        "when": "always"
      }
    ],
    "straight": [],
    "allowContact": [
      "handR|torso",
      "forearmR|torso",
      "thighL|shinL",
      "thighR|shinR"
    ]
  }
};
