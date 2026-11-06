// o-stand-lunge-kn1: knee fix r1 (2026-11-06) of o-stand-lunge.js: pelvis height rescaled to the v3 leg (kn-lib g); per-frame pelvis-y correction kn1y (back leg straighter ~20-25 deg)
export default {
  "id": "o-stand-lunge-kn1",
  "name": "扶椅站姿弓步屈髋拉伸",
  "nameEn": "Chair-Supported Standing Hip Flexor Stretch",
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
      ],
      "kn1y": [
        [
          0,
          0.02963,
          "linear"
        ],
        [
          0.6,
          0.02963,
          "linear"
        ],
        [
          2,
          0.10615,
          "linear"
        ],
        [
          3.8,
          0.11784,
          "linear"
        ],
        [
          5.6,
          0.10615,
          "linear"
        ],
        [
          7,
          0.02963,
          "linear"
        ]
      ]
    }
  },
  "pose": {
    "base": {
      "pelvis": [
        0,
        0.81125,
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
            -1,
            0,
            0.1
          ],
          "pole": [
            0.75,
            1.15,
            -0.35
          ]
        },
        "right": {
          "mode": "free",
          "frame": "world",
          "palmAt": [
            -0.32,
            0.985,
            0.04
          ],
          "wrist": [
            -0.3,
            1,
            -0.03
          ],
          "finger": [
            -0.2,
            -0.2,
            1
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "pole": [
            -0.6,
            0.9,
            -0.4
          ]
        }
      },
      "feet": {
        "right": {
          "mode": "floor",
          "at": [
            -0.11,
            0.36
          ],
          "heading": -3,
          "pitch": 0
        },
        "left": {
          "mode": "floor",
          "at": [
            0.1,
            -0.42
          ],
          "heading": 3,
          "pitch": 38
        }
      },
      "constraints": [],
      "solve": {
        "vars": [],
        "reg": {}
      }
    },
    "deltas": {
      "open": {
        "pelvis": [
          0,
          0.75125,
          0.05
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
              7
            ]
          ]
        }
      },
      "kn1y": {
        "pelvis": [
          {},
          1.81125
        ]
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
      1,
      0.15,
      0.3
    ],
    "fit": [
      "head",
      "leftToe",
      "rightToe",
      "pelvis",
      "leftKnee",
      "rightKnee",
      "rightWrist"
    ],
    "pad": 0.18,
    "k": 1.1,
    "drift": 0.9,
    "at": 3.8
  },
  "frame": {
    "mode": "fit",
    "width": 600,
    "height": 700,
    "cx": 512,
    "cy": 520
  },
  "stillAt": 3.8,
  "shadow": {
    "joints": [
      "leftToe",
      "rightToe",
      "leftAnkle",
      "rightAnkle",
      "pelvis"
    ],
    "blobs": [
      {
        "j": "rightAnkle",
        "rx": 46,
        "ry": 11,
        "a": 0.6
      },
      {
        "j": "leftToe",
        "rx": 36,
        "ry": 9,
        "a": 0.55
      }
    ],
    "bands": []
  },
  "props": [
    {
      "type": "officeChair",
      "at": [
        -0.62,
        0,
        0.05
      ],
      "yaw": -90,
      "seatY": 0.46
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
      }
    ],
    "allowContact": [
      "handL|torso"
    ]
  }
};
