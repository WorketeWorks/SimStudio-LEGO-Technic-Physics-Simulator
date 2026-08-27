export type StoredConnector = {
  local: [number, number, number];
  axis: [number, number, number];
  kind: "round" | "axle" | "half";
  role: "socket" | "shaft";
  diameter: number;
  length?: number;
  rotationOnly?: boolean;
};

// Generated from the reviewed maps exported by Sim Studio's map editor.
export const preloadedConnectionMaps: Record<string, StoredConnector[]> = {
  "44": [
    {
      "local": [
        -0.25,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6500000000000001
    }
  ],
  "2477": [
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -3.885780586188048e-16,
        -3
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        2,
        -2.7755575615628914e-16,
        -4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        1,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "2736": [
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 1
    }
  ],
  "2780": [
    {
      "local": [
        -0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.45,
      "length": 1
    },
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.45,
      "length": 1
    }
  ],
  "2825": [
    {
      "local": [
        0,
        -0.25,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.25,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.25,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    },
    {
      "local": [
        0,
        -0.25,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    }
  ],
  "3167": [
    {
      "local": [
        1,
        5.551115123125783e-17,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        1,
        5.551115123125783e-17,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -1,
        5.551115123125783e-17,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -1,
        5.551115123125783e-17,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -0.012499999999999997,
        -0.04999999999999999
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125
    }
  ],
  "3648": [
    {
      "local": [
        0.5,
        -0.5,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -0.5,
        -0.5,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -0.5,
        0.5,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0.5,
        0.5,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "3649": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1
    }
  ],
  "3673": [
    {
      "local": [
        -0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.94
    },
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.94
    }
  ],
  "3713": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "4185": [
    {
      "local": [
        0,
        1,
        -0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0.8660500049591064,
        0.5148829996585846,
        -0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5803550183773043
    },
    {
      "local": [
        -0.8660500049591064,
        0.5148829996585846,
        -0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5803550183773043
    },
    {
      "local": [
        0.8660500049591064,
        -0.5,
        0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5952380180358887
    },
    {
      "local": [
        0,
        -1,
        0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -0.8660500049591064,
        -0.5,
        0.009999999999999995
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5952380180358887
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "4274": [
    {
      "local": [
        -0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.5
    },
    {
      "local": [
        0.25,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "half",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.564
    }
  ],
  "6536": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002,
      "length": 0.5
    }
  ],
  "6558": [
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000531196594239,
      "length": 1.41
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000531196594239,
      "length": 1.41
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000531196594239,
      "length": 1.41
    }
  ],
  "6573": [
    {
      "local": [
        0,
        0,
        -1.5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        1.5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    },
    {
      "local": [
        0,
        -0.75,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.6,
      "rotationOnly": true
    }
  ],
  "6628": [
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "6632": [
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    }
  ],
  "10197": [
    {
      "local": [
        0,
        1,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 1.9500000000000002,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "10928": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "11214": [
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 1.41
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "11455": [
    {
      "local": [
        0,
        0.028165515694617838,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0563310313892367
    },
    {
      "local": [
        0,
        0.028165515694617838,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0563310313892367
    },
    {
      "local": [
        1,
        -3.885780586188048e-16,
        -3
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "11478": [
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000006
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000006
    },
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000006
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000006
    },
    {
      "local": [
        0,
        0,
        2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000006
    }
  ],
  "15100": [
    {
      "local": [
        0.025,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        -1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "15458": [
    {
      "local": [
        -5,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -4,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -4,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        4,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        4,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -3,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -3,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "18651": [
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 1.41
    },
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 2
    }
  ],
  "22961": [
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.6000000000000001,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "26287": [
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "27940": [
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.6,
      "length": 1
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.6,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32002": [
    {
      "local": [
        -0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.705
    },
    {
      "local": [
        0.25,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "half",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 0.705
    }
  ],
  "32009": [
    {
      "local": [
        0,
        4.996003610813204e-16,
        2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        3,
        4.996003610813204e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        6
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        2,
        4.996003610813204e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        0,
        4.996003610813204e-16,
        8
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000009
    },
    {
      "local": [
        1,
        4.996003610813204e-16,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        4,
        4.996003610813204e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000009
    }
  ],
  "32013": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "32014": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1,
        -1.1102230246251565e-16
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "32016": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0.3827,
        -0.9239
      ],
      "axis": [
        0,
        0.3827103611637435,
        -0.9238683777778722
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32034": [
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "32039": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32054": [
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.9000000000000001,
      "length": 1.41
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.24,
      "length": 0.5
    }
  ],
  "32056": [
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.7089799970388413
    },
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        2,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32062": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "shaft",
      "diameter": 0.6000000000000002,
      "length": 1
    }
  ],
  "32063": [
    {
      "local": [
        0,
        0.010000000000000009,
        0.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0.010000000000000009,
        1.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0.010000000000000009,
        2.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.010000000000000009,
        -2.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.010000000000000009,
        -1.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0.039999999999999994,
        -0.5076099991798402
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.7923900008201599
    }
  ],
  "32065": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.7089799970388413
    },
    {
      "local": [
        0,
        0.010000000000000009,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0.010000000000000009,
        2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0.010000000000000009,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.010000000000000009,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.010000000000000009,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        -0.010000000000000009,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "32138": [
    {
      "local": [
        -1,
        0.5,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 1.9000000000000001,
      "length": 1.41
    },
    {
      "local": [
        -1,
        -0.5,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 1.9000000000000001,
      "length": 1.41
    },
    {
      "local": [
        1,
        0.5,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 1.9000000000000001,
      "length": 1.41
    },
    {
      "local": [
        1,
        -0.5,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 1.9000000000000001,
      "length": 1.41
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.9000000000000002
    }
  ],
  "32140": [
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        1,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32184": [
    {
      "local": [
        0,
        1,
        -1.1102230246251565e-16
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -1,
        1.1102230246251565e-16
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "32192": [
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0.707107,
        -0.707107
      ],
      "axis": [
        0,
        0.7070651705941915,
        -0.7071483893304197
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32198": [
    {
      "local": [
        0,
        0,
        0.1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5
    }
  ],
  "32249": [
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000003
    },
    {
      "local": [
        1,
        -1.1102230246251565e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000003
    },
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000003
    },
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000003
    },
    {
      "local": [
        2,
        -1.1102230246251565e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000003
    }
  ],
  "32251": [
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        2,
        -3.608224830031759e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        3,
        -3.608224830031759e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        1,
        -3.608224830031759e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        -6
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000009
    },
    {
      "local": [
        0,
        -3.608224830031759e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000009
    },
    {
      "local": [
        4,
        -3.608224830031759e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 0.5000000000000009
    }
  ],
  "32269": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32270": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "32271": [
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        -4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.7999999999999999
    },
    {
      "local": [
        0,
        0,
        -6
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.7999999999999999
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0.8,
        0,
        -6.6
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        1.6,
        0,
        -7.2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "32291": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0.5,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        -0.5,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    }
  ],
  "32449": [
    {
      "local": [
        0,
        0,
        0.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        -0.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        -1.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        1.5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    }
  ],
  "32498": [
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000007
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000007
    },
    {
      "local": [
        0,
        1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000007
    }
  ],
  "32556": [
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8000000000000002,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "39790": [
    {
      "local": [
        5,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        -7.216449660063518e-16,
        -6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        7.216449660063518e-16,
        6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        -7.216449660063518e-16,
        -6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        7.216449660063518e-16,
        6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -5,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        5,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        3,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        1,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        3,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        1,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        5,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -3,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -1,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -3,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -1,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        -5,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.000000000000002
    },
    {
      "local": [
        4,
        -8.326672684688674e-16,
        -7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        0,
        -8.604228440844963e-16,
        -7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        -8.326672684688674e-16,
        -7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        -4,
        -8.326672684688674e-16,
        -7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -2,
        -8.326672684688674e-16,
        -7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        4,
        8.326672684688674e-16,
        7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        2,
        8.326672684688674e-16,
        7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -4,
        8.326672684688674e-16,
        7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -2,
        8.326672684688674e-16,
        7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        0,
        8.604228440844963e-16,
        7
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "39793": [
    {
      "local": [
        1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    }
  ],
  "39794": [
    {
      "local": [
        3,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        3,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        3,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        3,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        3,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -3,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -3,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -3,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -3,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -3,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        3,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        3,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        3,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        1,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -1,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -1,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        1,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        3,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        3,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        -3,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000016
    },
    {
      "local": [
        2,
        6.106226635438361e-16,
        5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -2,
        6.106226635438361e-16,
        5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        0,
        6.38378239159465e-16,
        5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        -6.106226635438361e-16,
        -5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        2,
        -6.106226635438361e-16,
        -5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        0,
        -6.38378239159465e-16,
        -5
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "41677": [
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    }
  ],
  "41678": [
    {
      "local": [
        -0.75,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6394999980926515
    },
    {
      "local": [
        0.75,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6394999980926515
    },
    {
      "local": [
        -0.5,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0.5,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "42003": [
    {
      "local": [
        0,
        1,
        -1.1102230246251565e-16
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "45590": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1
    }
  ],
  "46372": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.7000000000000001
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "48496": [
    {
      "local": [
        0,
        0.25,
        -2.7755575615628914e-17
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1.5,
        -1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        0,
        1.5000000000000004,
        1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        0,
        -0.5,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -0.5,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "48989": [
    {
      "local": [
        0,
        1,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        1,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -1,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        1,
        -1
      ],
      "axis": [
        0,
        0,
        -1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -1,
        -1
      ],
      "axis": [
        0,
        0,
        -1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "55615": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        2,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        2,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        -1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        2,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        -1,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        -1,
        -2
      ],
      "axis": [
        0,
        -1,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "60483": [
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.24,
      "length": 0.5
    }
  ],
  "62462": [
    {
      "local": [
        -0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 1.0000000000000002,
      "length": 0.94
    },
    {
      "local": [
        0.5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 1.0000000000000002,
      "length": 0.94
    }
  ],
  "62821": [
    {
      "local": [
        0,
        0,
        -1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    },
    {
      "local": [
        0,
        0,
        1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 0.5
    }
  ],
  "63869": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.7000000000000001
    },
    {
      "local": [
        0,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        -1,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        1,
        -1,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "64178": [
    {
      "local": [
        2,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        2,
        -6.106226635438361e-16,
        -5
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        2,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        2,
        6.106226635438361e-16,
        5
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        2,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -2,
        -6.106226635438361e-16,
        -5
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        -2,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -2,
        6.106226635438361e-16,
        5
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        -2,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        -2,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        -2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        2,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        -2,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        -2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000013
    },
    {
      "local": [
        1,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        -1,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        0,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        1,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        -1,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        0,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    }
  ],
  "64179": [
    {
      "local": [
        2,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        -2,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        -2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        2,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        -2,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        -2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000009
    },
    {
      "local": [
        1,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        -1,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        0,
        -0.012500000000000386,
        -3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        1,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        -1,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    },
    {
      "local": [
        0,
        -0.012499999999999609,
        3.05
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8125000000000001
    }
  ],
  "64782": [
    {
      "local": [
        -5,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -5,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        5,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -4,
        0,
        2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        -4,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        4,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        4,
        0,
        2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000007
    },
    {
      "local": [
        -3,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        -2.498001805406602e-16,
        -2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -3,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        2,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        2.498001805406602e-16,
        2
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "67491": [
    {
      "local": [
        1,
        -9.71445146547012e-16,
        -8
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        1,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        1,
        -7.216449660063518e-16,
        -6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        1,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        9.71445146547012e-16,
        8
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        1,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        1,
        7.216449660063518e-16,
        6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        -4.996003610813204e-16,
        -4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -1,
        -9.71445146547012e-16,
        -8
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        -1,
        -7.216449660063518e-16,
        -6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        2.220446049250313e-16,
        2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -1,
        -2.220446049250313e-16,
        -2
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        4.996003610813204e-16,
        4
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.5999999999999999
    },
    {
      "local": [
        -1,
        9.71445146547012e-16,
        8
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000003
    },
    {
      "local": [
        -1,
        7.216449660063518e-16,
        6
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        0,
        -9
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        -9
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        -5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        -7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        5
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        7
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        9
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        9
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        0,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        1,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        0,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        -1,
        0,
        3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000024
    },
    {
      "local": [
        0,
        -1.1379786002407855e-15,
        -9
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.1379786002407855e-15,
        9
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "71709": [
    {
      "local": [
        -3,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -3,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -3,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        3,
        0,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        2,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        2,
        0,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        -1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -1.1102230246251565e-16,
        -1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        -1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        1,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.1102230246251565e-16,
        1
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "80286": [
    {
      "local": [
        1,
        -2.7755575615628914e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -4
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    },
    {
      "local": [
        0,
        -2.7755575615628914e-16,
        -3
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1.0000000000000004
    }
  ],
  "87082": [
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        -1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        -1,
        0,
        0
      ],
      "kind": "round",
      "role": "shaft",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "87408": [
    {
      "local": [
        0,
        0.5,
        -5.551115123125783e-17
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        2.5,
        -1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.5,
        -1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        0,
        2.5,
        1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        1.5000000000000004,
        1.25
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [
        0,
        0.5,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        0,
        0.5,
        1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "92907": [
    {
      "local": [
        0.75,
        -1,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6499449968338014
    },
    {
      "local": [
        0.75,
        -0.9999999999999999,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6499449968338012
    },
    {
      "local": [
        -0.75,
        -1,
        0
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6499449968338014
    },
    {
      "local": [
        -0.75,
        -0.9999999999999999,
        1
      ],
      "axis": [
        1,
        0,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6499449968338012
    },
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8
    }
  ],
  "99021": [
    {
      "local": [
        0,
        0,
        -5.551115123125783e-17
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6,
      "length": 1
    }
  ],
  "99773": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.7089799970388413
    },
    {
      "local": [
        -1,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.7089799970388413
    },
    {
      "local": [
        1,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.7089799970388413
    },
    {
      "local": [
        0,
        0,
        -1
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8
    },
    {
      "local": [
        0,
        0,
        -2
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "half",
      "role": "socket",
      "diameter": 0.8000000000000002
    },
    {
      "local": [
        -2,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [
        2,
        0,
        0
      ],
      "axis": [
        0,
        1,
        0
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "4265c": [
    {
      "local": [
        0,
        0,
        0
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6325250029563905
    }
  ],
  "6538c": [
    {
      "local": [
        0,
        5.551115123125783e-17,
        0.51
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    },
    {
      "local": [
        0,
        -5.551115123125783e-17,
        -0.49
      ],
      "axis": [
        0,
        0,
        1
      ],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6000000000000001
    }
  ],
  "18947": [
    {
      "local": [0, 0, 0],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "35188": [
    {
      "local": [0, 0, 0],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "6539": [
    {
      "local": [0, 0, 0],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "4159": [
    {
      "local": [0, 0.5, 0],
      "axis": [0, 1, 0],
      "kind": "round",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [-1, 0, 0],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6
    },
    {
      "local": [1, 0, 0],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.6
    }
  ],
  "6538": [
    {
      "local": [0, 0, 0.5],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    },
    {
      "local": [0, 0, -0.5],
      "axis": [0, 0, 1],
      "kind": "axle",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ],
  "6542": [
    {
      "local": [0, 0, 0],
      "axis": [0, 0, 1],
      "kind": "round",
      "role": "socket",
      "diameter": 0.8,
      "length": 1
    }
  ]
};
