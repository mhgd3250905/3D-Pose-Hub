// deltoids-B-r2-gc1: ground-contact fix r1·M2 (2026-11-04) of deltoids-B-r2.js. 左支撑手 floor→fingertips（同 x/z），clear 25.3 mm：手 −18.3→≈+1 mm，左肘随之离开地面下
export default {
  "id": "deltoids-B-r2-gc1",
  "name": "哑铃土耳其起立",
  "nameEn": "Dumbbell Turkish Get-Up (to high bridge)",
  "timeline": {
    "duration": 8,
    "tracks": {
      "elb": [
        [
          0,
          0
        ],
        [
          0.3,
          0
        ],
        [
          1.5,
          1
        ],
        [
          6.5,
          1
        ],
        [
          7.7,
          0
        ]
      ],
      "sit": [
        [
          0,
          0
        ],
        [
          1.5,
          0
        ],
        [
          2.6,
          1
        ],
        [
          5.4,
          1
        ],
        [
          6.5,
          0
        ]
      ],
      "brg": [
        [
          0,
          0
        ],
        [
          2.6,
          0
        ],
        [
          3.7,
          1
        ],
        [
          4.3,
          1
        ],
        [
          5.4,
          0
        ]
      ],
      "arc": [
        [
          0,
          0
        ],
        [
          2.6,
          0
        ],
        [
          3.15,
          1
        ],
        [
          3.7,
          0
        ],
        [
          4.3,
          0
        ],
        [
          4.85,
          1
        ],
        [
          5.4,
          0
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        0.04,
        0.12,
        -0.04
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
              1,
              0,
              0
            ],
            0
          ],
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
        "right": {
          "mode": "free",
          "frame": "world",
          "relax": 0,
          "wrist": [
            -0.36,
            0.66,
            0.2
          ],
          "finger": [
            0,
            1,
            0
          ],
          "normal": [
            1,
            0,
            0
          ],
          "poleUp": [
            -0.2,
            0.3,
            1
          ]
        },
        "left": {
          "mode": "fingertips",
          "floor": 0,
          "clear": 0.0253,
          "at": [
            -0.05,
            -0.5
          ],
          "finger": [
            0.7,
            0,
            -0.7
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "poleUp": [
            0,
            1.5,
            -0.2
          ],
          "relax": 0
        }
      },
      "feet": {
        "right": {
          "mode": "floor",
          "at": [
            0.52,
            0.14
          ],
          "heading": 90,
          "pitch": 0
        },
        "left": {
          "mode": "floor",
          "at": [
            0.86,
            -0.36
          ],
          "heading": 115,
          "pitch": -72
        }
      },
      "constraints": [
        {
          "type": "reach",
          "limb": "leftArm",
          "angle": 165,
          "weight": 2
        },
        {
          "type": "joint",
          "joint": "pelvis",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.136,
          "weight": 10
        },
        {
          "type": "joint",
          "joint": "leftElbow",
          "axis": [
            0,
            1,
            0
          ],
          "value": 0.07,
          "weight": 0
        },
        {
          "type": "reach",
          "limb": "leftLeg",
          "angle": 177,
          "weight": 60
        }
      ],
      "solve": {
        "vars": [
          "px",
          "py",
          "pz"
        ],
        "reg": {
          "px": 6,
          "py": 0.3,
          "pz": 10
        }
      }
    },
    "deltas": {
      "elb": {
        "pelvis": [
          0.06,
          0.12,
          -0.07
        ],
        "hips": {
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              -40
            ],
            [
              [
                0,
                0,
                1
              ],
              -35
            ]
          ]
        },
        "hands": {
          "right": {
            "wrist": [
              -0.25,
              1.11,
              -0.27
            ]
          }
        },
        "constraints": [
          {
            "angle": 85
          },
          {
            "value": 0.255
          },
          {
            "weight": 5
          },
          {
            "weight": 45
          }
        ]
      },
      "sit": {
        "pelvis": [
          0.04,
          0.12,
          -0.06
        ],
        "hips": {
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              15
            ],
            [
              [
                0,
                0,
                1
              ],
              -10
            ]
          ]
        },
        "hands": {
          "right": {
            "wrist": [
              -0.2,
              0.63,
              0.13
            ]
          }
        },
        "constraints": [
          {
            "angle": 258
          },
          {
            "value": 0.039
          },
          {
            "weight": -5
          },
          {
            "weight": 75
          }
        ]
      },
      "brg": {
        "pelvis": [
          0.14,
          0.12,
          -0.05
        ],
        "hips": {
          "rot": [
            [
              [
                1,
                0,
                0
              ],
              5
            ],
            [
              [
                0,
                0,
                1
              ],
              30
            ]
          ]
        },
        "hands": {
          "right": {
            "wrist": [
              -0.6,
              0.65,
              0.34
            ]
          }
        },
        "constraints": [
          {
            "angle": 165
          },
          {
            "value": 0.318
          },
          {
            "weight": 0
          },
          {
            "weight": 60
          }
        ]
      },
      "arc": {
        "pelvis": [
          -0.019999999999999997,
          0.12,
          -0.04
        ],
        "constraints": [
          {},
          {
            "value": 0.066
          },
          {},
          {}
        ]
      }
    }
  },
  "highlight": {
    "groups": [
      "deltoids"
    ],
    "side": "both",
    "pulseTrack": "sit",
    "pulseBase": 0.35
  },
  "camera": {
    "dir": [
      0.9,
      0.55,
      0.8
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftPalm",
      "rightPalm"
    ],
    "pad": 0.15,
    "k": 1,
    "drift": 2,
    "at": 4,
    "driftPeriod": 8
  },
  "frame": {
    "mode": "fit",
    "width": 600,
    "height": 640,
    "cx": 558,
    "cy": 498
  },
  "stillAt": 4,
  "shadow": {
    "joints": [
      "leftPalm",
      "rightAnkle",
      "leftAnkle",
      "pelvis"
    ],
    "blobs": [
      {
        "j": "leftPalm",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      },
      {
        "j": "rightAnkle",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      },
      {
        "j": "leftAnkle",
        "rx": 40,
        "ry": 10,
        "a": 0.6
      },
      {
        "j": "pelvis",
        "rx": 80,
        "ry": 16,
        "a": 0.45
      }
    ],
    "bands": []
  },
  "props": [
    {
      "type": "mat",
      "at": [
        0.15,
        0,
        -0.2
      ],
      "size": [
        1.83,
        1,
        0.006
      ]
    },
    {
      "type": "gripHand",
      "side": "right"
    },
    {
      "type": "dumbbell",
      "length": 0.32,
      "plate": 0.045,
      "attach": "rightHand",
      "offset": [
        -0.0987,
        -0.0336,
        0.0205
      ],
      "rot": [
        [
          [
            0,
            -0.9858,
            -0.1679
          ],
          97.609
        ]
      ]
    }
  ],
  "keyFrames": [
    1.5,
    2.6,
    4
  ],
  "qa": {
    "pins": [
      {
        "c": "handL",
        "when": "always"
      },
      {
        "c": "footR",
        "when": "always"
      },
      {
        "c": "footL",
        "when": "always"
      }
    ],
    "straight": [
      {
        "j": "elbow.right",
        "min": 176
      },
      {
        "j": "knee.left",
        "min": 172
      }
    ],
    "allowContact": [
      "forearmL|torso",
      "upperArmL|torso",
      "handR|head"
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
    "skin": "realistic"
  },
  "draftNative8": {
    "version": 1,
    "originalSpecId": "deltoids-B",
    "originalDuration": 12,
    "method": "independently-authored-local-phase-tracks",
    "sourceSlices": null,
    "phases": [
      {
        "id": "prepare",
        "start": 0,
        "end": 0.3
      },
      {
        "id": "elbow-rise",
        "start": 0.3,
        "end": 1.5
      },
      {
        "id": "sit-rise",
        "start": 1.5,
        "end": 2.6
      },
      {
        "id": "bridge-rise",
        "start": 2.6,
        "end": 3.7
      },
      {
        "id": "bridge-hold",
        "start": 3.7,
        "end": 4.3
      },
      {
        "id": "bridge-lower",
        "start": 4.3,
        "end": 5.4
      },
      {
        "id": "sit-lower",
        "start": 5.4,
        "end": 6.5
      },
      {
        "id": "elbow-lower",
        "start": 6.5,
        "end": 7.7
      },
      {
        "id": "reset",
        "start": 7.7,
        "end": 8
      }
    ],
    "semantics": "One full supine-to-elbow-to-sit-to-high-bridge and reverse sequence, right dumbbell/left support unchanged. Independently authored rise/lower durations1.2/1.1/1.1s and0.6s high-bridge plateau. Source moving time8.8s alone cannot fit8s unchanged; new cadence requires review. This is the half get-up, not a standing get-up.",
    "globalTimeStretch": false,
    "sourceQA": "pending",
    "visualQA": "pending",
    "editorialReview": "pending",
    "releaseEligible": false
  }
};
