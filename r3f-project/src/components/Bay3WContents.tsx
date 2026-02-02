// Bay3WContents.tsx
import * as THREE from "three";
import { useMemo } from "react";
import bay3Slots from "../data/bay3_slots.json";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";
import { RackHitboxes } from "./RackHitboxes";
import { getCameraForRack, type RackBounds } from "../utils/rackUtilis";
import type { ViewMode, Selection } from "../types";

type BayTransform = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

type RawSlot = {
  id: string;
  label: string;
  rack: number;
  sect: string;
  level: number;
  slot: number;
  size: number[];
  pos: number[];
  fillPct: number;
};

type SlotRecord = {
  id: string;
  rack: number;
  size: [number, number, number];
  pos: [number, number, number];
  fillPct: number;
};

type Props = {
  bayTransform: BayTransform;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCameraUpdate?: (config: { position: [number, number, number]; rotation: [number, number, number] }) => void;
};

function toVec3(arr: number[]): [number, number, number] {
  return [arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0];
}

function mapDbPosToThree(pos: [number, number, number]): [number, number, number] {
  const [x, y, z] = pos;
  return [x, z, y]; // Three: X, Y(up), Z
}

export function Bay3WContents({ 
  bayTransform, 
  viewMode, 
  setViewMode, 
  selection, 
  setSelection,
  onCameraUpdate,
}: Props) {
  const raw = bay3Slots as RawSlot[];

  // Process slots for rendering
  const slots: SlotRecord[] = useMemo(() => {
    return raw.map((r) => {
      const size = toVec3(r.size);
      const rawPos = toVec3(r.pos);

      return {
        id: r.id,
        rack: r.rack,
        size,
        pos: mapDbPosToThree(rawPos),
        fillPct: r.fillPct,
      };
    });
  }, [raw]);

  // Determine interactivity based on viewMode
  const racksAreInteractive = viewMode === "bay";
  const slotsAreInteractive = viewMode === "row";

  // Get bay position as array for camera calculations
  const bayPos: [number, number, number] = useMemo(() => {
    return [bayTransform.position.x, bayTransform.position.y, bayTransform.position.z];
  }, [bayTransform.position]);

  // Handle rack click
  const handleRackClick = (rack: RackBounds) => {
    console.log("[Bay3WContents] rack clicked:", rack.rackId, rack);
    
    // Update selection
    setSelection({ ...selection, rackId: rack.rackId });
    setViewMode("rack");

    // Calculate camera position for this rack
    if (onCameraUpdate) {
      const cameraConfig = getCameraForRack(rack, bayPos);
      console.log("[Bay3WContents] calculated camera:", cameraConfig);
      onCameraUpdate(cameraConfig);
    }
  };

  // Handle slot click
  const handleSlotClick = (slotId: string) => {
    if (!slotsAreInteractive) return;
    console.log("[Bay3WContents] slot clicked:", slotId);
    setSelection({ ...selection, slotId });
    setViewMode("slot");
  };

  // Filter slots to only show selected rack's slots when in rack/row/slot view
  const visibleSlots = useMemo(() => {
    if (viewMode === "rack" || viewMode === "row" || viewMode === "slot") {
      // Extract rack number from rackId (e.g., "rack-18" -> 18)
      const rackNum = selection.rackId ? parseInt(selection.rackId.replace("rack-", "")) : null;
      if (rackNum !== null) {
        return slots.filter(s => s.rack === rackNum);
      }
    }
    return slots;
  }, [slots, viewMode, selection.rackId]);

  return (
    <group>
      {/* Rack Hitboxes - only interactive at bay level */}
      <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
        <RackHitboxes
          slots={raw}
          isInteractive={racksAreInteractive}
          selectedRackId={selection.rackId}
          onRackClick={handleRackClick}
        />
      </SpawnInBay>

      {/* Slot containers */}
      {visibleSlots.map((rec, index) => (
        <SpawnInBay
          key={`${rec.id}-${index}`}
          bayTransform={bayTransform}
          localPos={rec.pos}
        >
          <SlotContainer 
            size={rec.size} 
            fillPct={rec.fillPct}
            slotId={rec.id}
            isInteractive={slotsAreInteractive}
            isSelected={selection.slotId === rec.id}
            onClick={() => handleSlotClick(rec.id)}
          />
        </SpawnInBay>
      ))}
    </group>
  );
}