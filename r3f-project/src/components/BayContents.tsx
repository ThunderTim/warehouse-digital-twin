// src/components/BayContents.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";
import { RackHitboxes } from "./RackHitboxes";
import { getCameraForRack } from "../utils/rackUtils";
import type { ViewMode, Selection } from "../types/viewTypes";
import type { BayData } from "../types/slotTypes";
import {
  processBayData,
  filterSlotsByRack,
  parseRackId,
} from "../utils/bayDataUtils";

type BayTransform = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

type Props = {
  bayId: string;
  bayData: BayData;
  bayTransform: BayTransform;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCameraUpdate?: (config: {
    position: [number, number, number];
    lookAt: [number, number, number];
  }) => void;
};

export function BayContents({
  bayId,
  bayData,
  bayTransform,
  viewMode,
  setViewMode,
  selection,
  setSelection,
  onCameraUpdate,
}: Props) {
  const { slots, hitboxes } = useMemo(() => processBayData(bayData), [bayData]);

  bayId == null;

  const bayPos = useMemo<[number, number, number]>(
    () => [bayTransform.position.x, bayTransform.position.y, bayTransform.position.z],
    [bayTransform.position]
  );

  // ── Rack click → rack view ──────────────────────────────────────────
  const handleRackClick = (rackRef: string) => {
    const rackId = `rack-${rackRef}`;
    setSelection({ ...selection, rackId });
    setViewMode("rack");

    const hitbox = hitboxes.find((h) => h.rackRef === rackRef || `rack-${h.rackRef.replace("R", "")}` === rackId);
    if (hitbox && onCameraUpdate) {
      onCameraUpdate(getCameraForRack(hitbox, bayPos));
    }
  };

  const handleSlotClick = (slotId: string) => {
    setSelection({ ...selection, slotId });
    setViewMode("slot");
  };

  // ── Visible slots: all at bay level, filtered at rack/below ────────
  const visibleSlots = useMemo(() => {
    if (viewMode === "rack" || viewMode === "row" || viewMode === "slot") {
      const rackRef = selection.rackId ? parseRackId(selection.rackId) : null;
      if (rackRef) return filterSlotsByRack(slots, rackRef);
    }
    return slots;
  }, [slots, viewMode, selection.rackId]);

  const slotsAreInteractive = viewMode === "rack" || viewMode === "row";

  const showSlotLabels =
    viewMode === "bay" ||
    viewMode === "rack" ||
    viewMode === "row" ||
    viewMode === "slot";

  return (
    <group>
      {/* Rack hitboxes — bay view only */}
      {viewMode === "bay" && (
        <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
          <RackHitboxes
            hitboxes={hitboxes}
            selectedRackId={selection.rackId}
            onRackClick={handleRackClick}
          />
        </SpawnInBay>
      )}

      {/* Slot containers */}
      {visibleSlots.map((slot, i) => (
        <SpawnInBay
          key={`${slot.id}-${i}`}
          bayTransform={bayTransform}
          localPos={slot.position}
        >
          <SlotContainer
            size={slot.size}
            fillPct={slot.fillPct ?? 0}
            slotId={slot.id}
            isInteractive={slotsAreInteractive}
            isSelected={selection.slotId === slot.id}
            showLabel={showSlotLabels}
            onClick={() => handleSlotClick(slot.id)}
          />
        </SpawnInBay>
      ))}
    </group>
  );
}