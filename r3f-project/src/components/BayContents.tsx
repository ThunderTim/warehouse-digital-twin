// src/components/BayContents.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";
import { RackHitboxes } from "./RackHitboxes";
import { getCameraForRack, type RackBounds } from "../utils/rackUtils";
import type { ViewMode, Selection } from "../types/viewTypes";
import type { RawSlot } from "../types/slotTypes";  // Shared type

type BayTransform = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

type SlotRecord = {
  id: string;
  rack: number;
  size: [number, number, number];
  pos: [number, number, number];
  fillPct: number;
};

type Props = {
  bayId: string;           // NEW
  slots: RawSlot[];        // NEW - passed in, not imported
  bayTransform: BayTransform;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCameraUpdate?: (config: { position: [number, number, number]; lookAt: [number, number, number] }) => void;
};

function toVec3(arr: number[]): [number, number, number] {
  return [arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0];
}

function mapDbPosToThree(pos: [number, number, number]): [number, number, number] {
  const [x, y, z] = pos;
  return [x, z, y];
}

export function BayContents({
  bayId,
  slots: rawSlots,        // Renamed to avoid confusion
  bayTransform,
  viewMode,
  setViewMode,
  selection,
  setSelection,
  onCameraUpdate,
}: Props) {
  
  const slots: SlotRecord[] = useMemo(() => {
    return rawSlots.map((r) => ({
      id: r.id,
      rack: r.rack,
      size: toVec3(r.size),
      pos: mapDbPosToThree(toVec3(r.pos)),
      fillPct: r.fillPct,
    }));
  }, [rawSlots]);

  const slotsAreInteractive = viewMode === "rack" || viewMode === "row";

  const bayPos: [number, number, number] = useMemo(() => {
    return [bayTransform.position.x, bayTransform.position.y, bayTransform.position.z];
  }, [bayTransform.position]);

  const handleRackClick = (rack: RackBounds) => {
    console.log(`[BayContents:${bayId}] rack clicked:`, rack.rackId);
    setSelection({ ...selection, rackId: rack.rackId });
    setViewMode("rack");

    if (onCameraUpdate) {
      const cameraConfig = getCameraForRack(rack, bayPos);
      onCameraUpdate(cameraConfig);
    }
  };

  const handleSlotClick = (slotId: string) => {
    if (!slotsAreInteractive) return;
    console.log(`[BayContents:${bayId}] slot clicked:`, slotId);
    setSelection({ ...selection, slotId });
    setViewMode("slot");
  };

  const visibleSlots = useMemo(() => {
    if (viewMode === "rack" || viewMode === "row" || viewMode === "slot") {
      const rackNum = selection.rackId ? parseInt(selection.rackId.replace("rack-", "")) : null;
      if (rackNum !== null) {
        return slots.filter(s => s.rack === rackNum);
      }
    }
    return slots;
  }, [slots, viewMode, selection.rackId]);

  const showSlotLabels = viewMode === "bay" || viewMode === "rack" || viewMode === "row" || viewMode === "slot";



  return (
    <group>
      {/* Rack Hitboxes - only at bay level */}
      {viewMode === "bay" && (
        <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
          <RackHitboxes
            slots={rawSlots}
            isInteractive={true}
            selectedRackId={selection.rackId}
            onRackClick={handleRackClick}
          />
        </SpawnInBay>
      )}

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
            showLabel={showSlotLabels}           // NEW
            onClick={() => handleSlotClick(rec.id)}
          />
        </SpawnInBay>
      ))}
    </group>
  );
}