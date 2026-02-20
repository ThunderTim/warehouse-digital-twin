// src/utils/bayDataUtils.ts
import type {
  BayData,
  RawContainer,
  RawRack,
  RawRackHitbox,
  SlotRecord,
  RackHitboxRecord,
  MapLayerData,
} from "../types/slotTypes";

function stripRackPrefix(v: string): string {
  return v.startsWith("R") ? v.slice(1) : v;
}

function cornerToCenter(
  pos: { x: number; y: number; z: number },
  dim: { x: number; y: number; z: number }
): [number, number, number] {
  return [pos.x + dim.x / 2, pos.y + dim.y / 2, pos.z + dim.z / 2];
}

function toTuple3(v: { x: number; y: number; z: number }): [number, number, number] {
  return [v.x, v.y, v.z];
}

function containerToSlotRecord(c: RawContainer): SlotRecord {
  return {
    id: c.id,
    rackRef: stripRackPrefix(c.rack),
    section: c.section,
    level: c.level,
    slot: c.slot == null ? null : String(c.slot),
    position: cornerToCenter(c.position, c.dimensions),
    size: [c.dimensions.x, c.dimensions.y, c.dimensions.z],
    fillPct: undefined,
  };
}

function buildRackHitboxRecord(
  hitbox: RawRackHitbox,
  rack: RawRack,
  containerCount: number,
): RackHitboxRecord {
  return {
    id: hitbox.id,
    rackRef: hitbox.rack_ref,
    position: cornerToCenter(hitbox.position, hitbox.dimensions),
    size: [hitbox.dimensions.x, hitbox.dimensions.y, hitbox.dimensions.z],
    sections: rack?.sections ?? [],
    levels: rack?.levels ?? 0,
    containerCount,
    interactive: hitbox.interactive ?? true,
    // Use facing from JSON if provided.
    // Otherwise auto-detect: sections run along the longer horizontal axis,
    // so camera should face from the perpendicular axis.
    // e.g. rack depth(z)=24 > width(x)=3 → sections run along Z → face from X → [1,0]
    frontFacing: rack?.facing ?? (
      (rack?.dimensions?.z ?? 0) > (rack?.dimensions?.x ?? 0) ? [1, 0] : [0, 1]
    ),
  };
}

export function extractMapLayer(data: BayData): MapLayerData {
  const o = data.building_outline;
  const g = data.floor_grid;

  return {
    buildingOutline: o ? {
      position: cornerToCenter(o.position, o.dimensions),
      size: [o.dimensions.x, o.dimensions.y || 0.01, o.dimensions.z],
      color: o.style?.color ?? "#FF6600",
    } : null,

    floorGrid: g ? {
      position: toTuple3(g.position),  // kept as corner — line generator builds from here
      size: [g.dimensions.x, g.dimensions.y, g.dimensions.z],
      spacing: [g.grid_spacing.x, g.grid_spacing.z],
      color: g.style?.color ?? "#CCCCCC",
      opacity: g.style?.opacity ?? 0.3,
    } : null,

    zones: (data.zones ?? []).map((z) => ({
      id: z.id,
      label: z.label,
      position: cornerToCenter(z.position, z.dimensions),
      size: [z.dimensions.x, z.dimensions.y || 0.1, z.dimensions.z] as [number, number, number],
      fillColor: z.style?.fillColor ?? "#FFFFFF22",
      borderColor: z.style?.borderColor ?? "#FFFFFF",
    })),

    doors: (data.doors ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      position: cornerToCenter(d.position, d.dimensions),
      size: [d.dimensions.x, d.dimensions.y, d.dimensions.z] as [number, number, number],
      doorType: d.door_type,
    })),

    loadingDocks: (data.loading_docks ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      position: cornerToCenter(d.position, d.dimensions),
      size: [d.dimensions.x, d.dimensions.y, d.dimensions.z] as [number, number, number],
      color: d.style?.color ?? "#FF00FF",
    })),

    floorGuides: (data.floor_guides ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      position: cornerToCenter(f.position, f.dimensions),
      size: [f.dimensions.x, f.dimensions.y || 0.01, f.dimensions.z] as [number, number, number],
      color: f.style?.color ?? "#FFCC00",
      sections: f.sections, 
      
    })),
  };
}

export function processBayData(bayData: unknown): {
  slots: SlotRecord[];
  hitboxes: RackHitboxRecord[];
  mapLayer: MapLayerData;
} {
  const d = bayData as BayData;

  if (!d || !Array.isArray(d.containers) || !Array.isArray(d.racks)) {
    console.warn("[bayDataUtils] Invalid or empty bay data");
    return { slots: [], hitboxes: [], mapLayer: emptyMapLayer() };
  }

  const rackByRef = new Map<string, RawRack>(d.racks.map((r) => [r.rack_number, r]));

  const containerCountByRef = new Map<string, number>();
  for (const c of d.containers) {
    const ref = c.rack.startsWith("R") ? c.rack : `R${c.rack}`;
    containerCountByRef.set(ref, (containerCountByRef.get(ref) ?? 0) + 1);
  }

  const hitboxes: RackHitboxRecord[] = (d.rack_hitboxes ?? []).map((h) => {
    const rack = rackByRef.get(h.rack_ref);
    if (!rack) console.warn(`[bayDataUtils] No rack found for hitbox: ${h.rack_ref}`);
    return buildRackHitboxRecord(h, rack ?? { sections: [], levels: 0 } as any, containerCountByRef.get(h.rack_ref) ?? 0);
  });

  return {
    slots: d.containers.map(containerToSlotRecord),
    hitboxes,
    mapLayer: extractMapLayer(d),
  };
}

export function filterSlotsByRack(slots: SlotRecord[], rackRef: string): SlotRecord[] {
  return slots.filter((s) => s.rackRef === rackRef);
}

export function filterSlotsBySection(slots: SlotRecord[], rackRef: string, section: string): SlotRecord[] {
  return slots.filter((s) => s.rackRef === rackRef && s.section === section);
}

export function parseRackId(rackId: string): string | null {
  const match = rackId.match(/rack-(\w+)/);
  return match ? match[1] : null;
}

export function validateBayData(data: unknown): boolean {
  const d = data as any;
  return d != null && typeof d.building === "string" && typeof d.bay === "string" && Array.isArray(d.containers) && Array.isArray(d.racks);
}

function emptyMapLayer(): MapLayerData {
  return { buildingOutline: null, floorGrid: null, zones: [], doors: [], loadingDocks: [], floorGuides: [] };
}