// src/controllers/buildingConfigs.ts
// Single source of truth for building and bay layout.
// Camera centers are always computed from origin + size — never stored manually.

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export type BayConfig = {
  bayId: string;
  label: string;
  /** [x, z] offset from building's NW corner in world space */
  originLocal: [number, number];
  width: number;
  length: number;
  /** false = bay exists but has no data / not yet in use */
  active: boolean;
};

export type BuildingConfig = {
  buildingId: string;
  label: string;
  /** [x, z] NW corner of this building in world space. Y is always 0. */
  originWorld: [number, number];
  size: { width: number; length: number };
  bays: BayConfig[];
};

// ─────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────

export const BUILDING_CONFIGS: Record<string, BuildingConfig> = {

  "bldg-00": {
    buildingId: "bldg-00",
    label: "Building 00",
    originWorld: [0, 0],
    size: { width: 120, length: 188 },
    bays: [
      {
        bayId: "BAY_00_NW",
        label: "Bay NW",
        originLocal: [0, 0],
        width: 60,
        length: 94,
        active: true,
      },
      {
        bayId: "BAY_00_NE",
        label: "Bay NE",
        originLocal: [60, 0],
        width: 60,
        length: 94,
        active: false,
      },
      {
        bayId: "BAY_00_SW",
        label: "Bay SW",
        originLocal: [0, 94],
        width: 60,
        length: 94,
        active: false,
      },
      {
        bayId: "BAY_00_SE",
        label: "Bay SE",
        originLocal: [60, 94],
        width: 60,
        length: 94,
        active: false,
      },
    ],
  },

  "bldg-22": {
    buildingId: "bldg-22",
    label: "Building 22",
    originWorld: [0, 0],   // update once GLB world position is confirmed
    size: { width: 120, length: 160 },
    bays: [
      {
        bayId: "BAY_3W",
        label: "Bay 3 West",
        originLocal: [0, 0],
        width: 60,
        length: 94,
        active: false,   // placeholder until Bldg22 is rebuilt
      },
      {
        bayId: "BAY_3E",
        label: "Bay 3 East",
        originLocal: [60, 0],
        width: 60,
        length: 94,
        active: false,
      },
    ],
  },

};

// ─────────────────────────────────────────────────
// Helpers — all centers computed, never stored
// ─────────────────────────────────────────────────

export function getBuildingConfig(id: string): BuildingConfig | undefined {
  return BUILDING_CONFIGS[id];
}

export function getBuildingWorldCenter(id: string): [number, number, number] | null {
  const cfg = BUILDING_CONFIGS[id];
  if (!cfg) return null;
  return [
    cfg.originWorld[0] + cfg.size.width  / 2,
    0,
    cfg.originWorld[1] + cfg.size.length / 2,
  ];
}

export function getBayConfig(buildingId: string, bayId: string): BayConfig | undefined {
  return BUILDING_CONFIGS[buildingId]?.bays.find((b) => b.bayId === bayId);
}

export function getActiveBays(buildingId: string): BayConfig[] {
  return BUILDING_CONFIGS[buildingId]?.bays.filter((b) => b.active) ?? [];
}

export function getBayWorldOrigin(buildingId: string, bayId: string): [number, number, number] | null {
  const cfg = BUILDING_CONFIGS[buildingId];
  const bay = cfg?.bays.find((b) => b.bayId === bayId);
  if (!cfg || !bay) return null;
  return [
    cfg.originWorld[0] + bay.originLocal[0],
    0,
    cfg.originWorld[1] + bay.originLocal[1],
  ];
}

export function getBayWorldCenter(buildingId: string, bayId: string): [number, number, number] | null {
  const origin = getBayWorldOrigin(buildingId, bayId);
  const bay = getBayConfig(buildingId, bayId);
  if (!origin || !bay) return null;
  return [
    origin[0] + bay.width  / 2,
    0,
    origin[2] + bay.length / 2,
  ];
}