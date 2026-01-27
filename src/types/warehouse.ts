// Warehouse Data Types
// All IDs are strings for type safety

export interface WarehouseData {
  config: Config;
  campus: CampusData;
  buildings: Record<string, BuildingData>;
  bays: Record<string, BayData>;
  racks: Record<string, RackData>;
  slots: SlotData[];
}

export interface Config {
  units: "feet";
  filledThreshold: number; // Default: 70
}

export interface CampusData {
  id: string;
  name: string;
  glbFile: string;
  buildings: string[];
}

export interface BuildingData {
  id: string;
  name: string;
  glbFile: string;
  bays: string[];
  stats: StatsSummary;
}

export interface BayData {
  id: string;
  name: string;
  buildingId: string;
  hitMesh: string;
  dimensions: [number, number]; // [width, depth] in feet
  racks: string[];
  stats: BayStats;
}

export interface RackData {
  id: string;
  bayId: string;
  sections: string[];
  slotCount: number;
}

export interface SlotData {
  id: string;
  label: string;
  bayId: string;
  rackId: string;
  section: string;
  level: number;
  slotPosition: number;
  position: Position3D;
  dimensions: Dimensions3D;
  fillPercent: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions3D {
  width: number;
  height: number;
  depth: number;
}

export interface StatsSummary {
  totalSlots: number;
  filledSlots: number;
  availableSlots: number;
  emptySlots: number;
}

export interface BayStats extends StatsSummary {
  averageFill: number;
}

// Slot fill state based on fillPercent
export type SlotFillState = "empty" | "available" | "filled";

// Helper to determine fill state
export function getSlotFillState(fillPercent: number, threshold: number = 70): SlotFillState {
  if (fillPercent === 0) return "empty";
  if (fillPercent >= threshold) return "filled";
  return "available";
}
