// src/types/slotTypes.ts

// ============================================
// RAW JSON TYPES - match BLDG-template-Bay00.json exactly
// ============================================

type Vec3 = { x: number; y: number; z: number };
type StyleDef = { color?: string; lineWidth?: number; opacity?: number; fillColor?: string; borderColor?: string; pattern?: string };

export type RawContainer = {
  id: string;
  rack: string;       // "R01" or "01"
  section: string;
  level: number;
  slot: string | number | null;
  position: Vec3;
  dimensions: Vec3;
};

export type RawRack = {
  id: string;
  rack_number: string; // "R01"
  type: "rack";
  orientation?: string;
  position: Vec3;
  dimensions: Vec3;
  sections: string[];
  levels: number;
  slots_per_section: number;
};

export type RawRackHitbox = {
  id: string;
  type: "rack_hitbox";
  rack_ref: string;   // "R01"
  position: Vec3;
  dimensions: Vec3;
  interactive?: boolean;
};

export type RawZone = {
  id: string;
  type: "zone";
  label: string;
  position: Vec3;
  dimensions: Vec3;
  style: StyleDef;
};

export type RawDoor = {
  id: string;
  type: "door";
  label: string;
  position: Vec3;
  dimensions: Vec3;
  door_type: "standard" | "emergency";
};

export type RawLoadingDock = {
  id: string;
  type: "loading_dock";
  label: string;
  position: Vec3;
  dimensions: Vec3;
  style?: StyleDef;
};

export type RawFloorGuide = {
  id: string;
  type: "floor_guide";
  label: string;
  position: Vec3;
  dimensions: Vec3;
  style: StyleDef;
};

export type RawBuildingOutline = {
  id: string;
  type: "building_outline";
  label: string;
  position: Vec3;
  dimensions: Vec3;
  style: StyleDef;
};

export type RawFloorGrid = {
  id: string;
  type: "floor_grid";
  position: Vec3;
  dimensions: Vec3;
  grid_spacing: { x: number; z: number };
  style: StyleDef;
};

/** Full bay JSON structure */
export type BayData = {
  building: string;
  bay: string;
  bay_origin: Vec3 & { note?: string };
  metadata: {
    total_containers: number;
    total_racks: number;
    units: string;
    coordinate_system: { x: string; y: string; z: string };
  };
  building_outline?: RawBuildingOutline;
  floor_grid?: RawFloorGrid;
  zones?: RawZone[];
  doors?: RawDoor[];
  loading_docks?: RawLoadingDock[];
  floor_guides?: RawFloorGuide[];
  racks: RawRack[];
  rack_hitboxes?: RawRackHitbox[];
  containers: RawContainer[];
  errors?: string[];
  warnings?: string[];
};

// ============================================
// INTERNAL RENDER TYPES - used by components
// ============================================

/** Processed container ready for SlotContainer / SpawnInBay */
export type SlotRecord = {
  id: string;
  rackRef: string;    // normalized rack id e.g. "01"
  section: string;
  level: number;
  slot: string | null;
  position: [number, number, number];  // center
  size: [number, number, number];
  fillPct?: number;
};

/** Processed rack hitbox ready for RackHitboxes */
export type RackHitboxRecord = {
  id: string;
  rackRef: string;    // "R01"
  position: [number, number, number];  // center (direct from JSON)
  size: [number, number, number];      // dimensions (direct from JSON)
  sections: string[];
  levels: number;
  containerCount: number;
  interactive: boolean;
};

/** All static map layer data extracted from the JSON */
export type MapLayerData = {
  buildingOutline: {
    position: [number, number, number];
    size: [number, number, number];
    color: string;
  } | null;
  floorGrid: {
    position: [number, number, number];
    size: [number, number, number];
    spacing: [number, number];  // [x, z]
    color: string;
    opacity: number;
  } | null;
  zones: {
    id: string;
    label: string;
    position: [number, number, number];
    size: [number, number, number];
    fillColor: string;
    borderColor: string;
  }[];
  doors: {
    id: string;
    label: string;
    position: [number, number, number];
    size: [number, number, number];
    doorType: "standard" | "emergency";
  }[];
  loadingDocks: {
    id: string;
    label: string;
    position: [number, number, number];
    size: [number, number, number];
    color: string;
  }[];
  floorGuides: {
    id: string;
    label: string;
    position: [number, number, number];
    size: [number, number, number];
    color: string;
  }[];
};