// s-pigeon-gc2: ground-contact fix r1·M3 (2026-11-04) of s-pigeon-gc1.js. 方案 A：双手+立砖外移到两髋外侧（左 x 0.33/z −0.02、右 x −0.35/z −0.04）；骨盆 +45 mm；后脚改 free（踝 y 0.0505、z −0.80、跖屈 154.8°）；臀下垫块重排
export default {
  "id": "s-pigeon-gc2",
  "name": "鸽子式",
  "nameEn": "Pigeon Pose",
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
        0.235,
        0
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
            48
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
            -43
          ]
        ]
      },
      "hands": {
        "left": {
          "mode": "free",
          "frame": "world",
          "relax": 0,
          "palmAt": [
            0.33,
            0.2803,
            -0.02
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
            0.75,
            0.3,
            -0.4
          ]
        },
        "right": {
          "mode": "free",
          "frame": "world",
          "relax": 0,
          "palmAt": [
            -0.35,
            0.2803,
            -0.04
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
            -0.75,
            0.3,
            -0.4
          ]
        }
      },
      "feet": {
        "right": {
          "mode": "floor",
          "at": [
            0.08,
            0.2
          ],
          "heading": 90,
          "roll": 90,
          "pole": [
            -0.6,
            -0.03556458136,
            0.35
          ],
          "thighTwist": 90
        },
        "left": {
          "mode": "free",
          "frame": "world",
          "ankle": [
            0.12,
            0.0505,
            -0.8
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
            0.23,
            0.04528893989,
            -0.345
          ],
          "thighTwist": -30
        }
      },
      "constraints": [
        {
          "type": "mid",
          "limb": "leftLeg",
          "at": [
            0.2207489696,
            0.05,
            -0.34292612548
          ],
          "axes": [
            0,
            1,
            0
          ],
          "weight": 3
        },
        {
          "type": "mid",
          "limb": "rightLeg",
          "at": [
            -0.32929393381,
            0.05,
            0.18684350198
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
        "vars": [],
        "reg": {}
      }
    },
    "deltas": {
      "open": {
        "chest": {
          "waist": [
            [
              [
                1,
                0,
                0
              ],
              -39
            ]
          ]
        }
      }
    }
  },
  "highlight": {
    "groups": [
      "glute-max"
    ],
    "side": "right",
    "pulseTrack": "open",
    "pulseBase": 0.45
  },
  "camera": {
    "dir": [
      -0.85,
      0.32,
      -0.45
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightKnee",
      "leftPalm",
      "rightPalm"
    ],
    "pad": 0.14,
    "k": 1,
    "drift": 0.9,
    "at": 0
  },
  "frame": {
    "mode": "fit",
    "width": 500,
    "height": 590,
    "cx": 512,
    "cy": 540
  },
  "stillAt": 3.8,
  "shadow": {
    "joints": [
      "leftToe",
      "rightAnkle",
      "leftKnee",
      "rightKnee",
      "pelvis"
    ],
    "blobs": [
      {
        "j": "pelvis",
        "rx": 70,
        "ry": 14,
        "a": 0.6
      },
      {
        "j": "leftKnee",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      },
      {
        "j": "rightKnee",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      }
    ],
    "bands": [
      {
        "from": "leftToe",
        "to": "rightAnkle",
        "mid": "pelvis",
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
        0,
        0,
        -0.15
      ],
      "size": [
        0.72,
        1.83,
        0.006
      ],
      "yaw": 0
    },
    {
      "type": "mat",
      "at": [
        0.33,
        0.255,
        -0.02
      ],
      "size": [
        0.11,
        0.23,
        0.255
      ]
    },
    {
      "type": "mat",
      "at": [
        -0.35,
        0.255,
        -0.04
      ],
      "size": [
        0.11,
        0.23,
        0.255
      ]
    },
    {
      "type": "mat",
      "at": [
        -0.085,
        0.058,
        -0.08
      ],
      "size": [
        0.21,
        0.26,
        0.058
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
        "c": "footL",
        "when": "always"
      },
      {
        "c": "footR",
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
        "j": "leftKnee"
      },
      {
        "j": "rightKnee"
      },
      {
        "j": "leftAnkle"
      },
      {
        "j": "rightAnkle"
      }
    ],
    "allowContact": [
      "footR|thighL",
      "shinR|thighL",
      "footR|kneeL",
      "thighR|shinR",
      "torso|thighR"
    ]
  }
};
