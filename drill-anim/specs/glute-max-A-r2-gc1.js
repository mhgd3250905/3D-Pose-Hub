// glute-max-A-r2-gc1: ground-contact fix r1·M2 (2026-11-04) of glute-max-A-r2.js. 双手 clear +8.4 mm
export default {
  "id": "glute-max-A-r2-gc1",
  "name": "单腿臀桥",
  "nameEn": "Single-Leg Glute Bridge",
  "timeline": {
    "duration": 8,
    "tracks": {
      "lift": [
        [
          0,
          0
        ],
        [
          0.3,
          0
        ],
        [
          1.3,
          1
        ],
        [
          2.9,
          1
        ],
        [
          3.9,
          0
        ],
        [
          4.3,
          0
        ],
        [
          5.3,
          1
        ],
        [
          6.9,
          1
        ],
        [
          7.9,
          0
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        0,
        0.115,
        0
      ],
      "hips": {
        "up": [
          -1,
          0,
          0
        ],
        "front": [
          0,
          1,
          0
        ],
        "rot": [
          [
            [
              0,
              0,
              1
            ],
            0
          ]
        ]
      },
      "chest": {
        "waist": [
          [
            [
              0,
              0,
              1
            ],
            0
          ]
        ]
      },
      "hands": {
        "left": {
          "mode": "fingertips",
          "at": [
            0,
            -0.265
          ],
          "finger": [
            1,
            0,
            -0.05
          ],
          "poleUp": [
            0.35,
            1.1,
            -0.1
          ],
          "floor": 0,
          "clear": 0.025338,
          "normal": [
            0,
            -1,
            0
          ],
          "relax": 0
        },
        "right": {
          "mode": "fingertips",
          "at": [
            0,
            0.265
          ],
          "finger": [
            1,
            0,
            0.05
          ],
          "poleUp": [
            -0.35,
            1.1,
            -0.1
          ],
          "floor": 0,
          "clear": 0.025338,
          "normal": [
            0,
            -1,
            0
          ],
          "relax": 0
        }
      },
      "feet": {
        "left": {
          "mode": "floor",
          "at": [
            0.52,
            -0.12
          ],
          "heading": 90,
          "pitch": 0,
          "poleLow": [
            0.12,
            0.55,
            0.6
          ]
        },
        "right": {
          "mode": "free",
          "frame": "hips",
          "ankle": [
            -0.085,
            0.0969,
            0.1121
          ],
          "rot": [
            [
              [
                0,
                0,
                1
              ],
              -6
            ]
          ],
          "poleLow": [
            -0.09,
            0.5,
            0.6
          ]
        }
      },
      "constraints": [
        {
          "type": "joint",
          "joint": "shoulderCenter",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.095,
          "weight": 0.5
        },
        {
          "type": "joint",
          "joint": "head",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.127,
          "weight": 1
        },
        {
          "type": "joint",
          "joint": "shoulderCenter",
          "axis": [
            1,
            0,
            0
          ],
          "value": -0.47,
          "weight": 0.1
        },
        {
          "type": "joint",
          "joint": "pelvis",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.15,
          "weight": 0.6
        },
        {
          "type": "reach",
          "limb": "rightArm",
          "angle": 176,
          "weight": 1
        },
        {
          "type": "reach",
          "limb": "leftArm",
          "angle": 176,
          "weight": 1
        }
      ],
      "solve": {
        "vars": [
          "px",
          "py"
        ],
        "reg": {
          "px": 3,
          "py": 0.5
        }
      }
    },
    "deltas": {
      "lift": {
        "hips": {
          "rot": [
            [
              [
                0,
                0,
                1
              ],
              29
            ]
          ]
        },
        "chest": {
          "waist": [
            [
              [
                0,
                0,
                1
              ],
              -17.4
            ]
          ]
        },
        "constraints": [
          {},
          {},
          {},
          {
            "weight": 0
          }
        ]
      }
    }
  },
  "highlight": {
    "groups": [
      "glute-max"
    ],
    "side": "both",
    "pulseAt": [
      2.1,
      6.1
    ],
    "pulseWidth": 0.8,
    "pulseBase": 0.25
  },
  "camera": {
    "dir": [
      0.05,
      0.13,
      1
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightAnkle",
      "leftPalm"
    ],
    "pad": 0.14,
    "k": 0.7,
    "drift": 0.9,
    "at": 2.1
  },
  "frame": {
    "mode": "fit",
    "width": 760,
    "cx": 492,
    "cy": 540
  },
  "shadow": {
    "joints": [
      "leftToe",
      "leftAnkle",
      "rightPalm",
      "leftPalm",
      "pelvis",
      "shoulderCenter",
      "head"
    ],
    "blobs": [
      {
        "j": "leftAnkle",
        "rx": 46,
        "ry": 11,
        "a": 0.6
      },
      {
        "j": "shoulderCenter",
        "rx": 90,
        "ry": 14,
        "a": 0.55
      },
      {
        "j": "head",
        "rx": 55,
        "ry": 12,
        "a": 0.5
      }
    ],
    "bands": [
      {
        "from": "shoulderCenter",
        "to": "leftAnkle",
        "mid": "pelvis",
        "rx": 60,
        "ry": 12,
        "a": 0.25,
        "dy": 4,
        "sag": 0.6
      }
    ]
  },
  "props": [
    {
      "type": "mat",
      "at": [
        0,
        0,
        0
      ],
      "size": [
        1.83,
        0.61,
        0.006
      ]
    }
  ],
  "keyFrames": [
    0,
    0.8,
    2.1
  ],
  "stillAt": 2.1,
  "qa": {
    "pins": [
      {
        "c": "handR",
        "when": "always"
      },
      {
        "c": "handL",
        "when": "always"
      },
      {
        "c": "footL",
        "when": "always"
      }
    ],
    "straight": [
      {
        "j": "knee.right",
        "min": 172
      }
    ],
    "allowContact": [
      "handR|thighR",
      "handL|thighL",
      "forearmR|torso",
      "forearmL|torso",
      "upperArmR|torso",
      "upperArmL|torso"
    ]
  },
  "modelProfile": "training-human-v2plus",
  "fps": 30,
  "size": 1080,
  "alignClavicles": false,
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
  }
};
