// src/components/BayContents.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";
import { RackHitboxes } from "./RackHitboxes";
import { getCameraForRack, getCameraForSlot } from "../utils/rackUtils";
import type { ViewMode, Selection } from "../types/viewTypes";
import type { BayData, SlotRecord } from "../types/slotTypes";
import type { Inventory } from "../types/Inventory";
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
  fillByLocation: Map<string, number>;
  itemsByLocation: Map<string, Inventory[]>;
};

function normalizeRackRef(ref: string): string {
  return ref.startsWith("R") ? ref.slice(1) : ref;
}

export function BayContents({
  bayId,
  bayData,
  bayTransform,
  viewMode,
  setViewMode,
  selection,
  setSelection,
  onCameraUpdate,
  fillByLocation,
  itemsByLocation,
}: Props) {
  const { slots, hitboxes } = useMemo(() => processBayData(bayData), [bayData]);

  const bayPos = useMemo<[number, number, number]>(
    () => [bayTransform.position.x, bayTransform.position.y, bayTransform.position.z],
    [bayTransform.position]
  );

  const selectedRackRef = useMemo(() => {
    if (!selection.rackId) return null;
    const parsed = parseRackId(selection.rackId);
    return parsed ? normalizeRackRef(parsed) : null;
  }, [selection.rackId]);

  const handleRackClick = (rackRef: string) => {
    const normalizedRef = normalizeRackRef(rackRef);
    const rackId = `rack-${normalizedRef}`;
    setSelection({ ...selection, rackId });
    setViewMode("rack");
    const hitbox = hitboxes.find((h) => normalizeRackRef(h.rackRef) === normalizedRef);
    if (hitbox && onCameraUpdate) onCameraUpdate(getCameraForRack(hitbox, bayPos));
  };

  const handleSlotClick = (slot: SlotRecord) => {
    setSelection({ ...selection, slotId: slot.id });
    setViewMode("slot");
    if (onCameraUpdate) {
      const hitbox = selectedRackRef
        ? hitboxes.find((h) => normalizeRackRef(h.rackRef) === selectedRackRef)
        : null;
      const frontFacing = hitbox?.frontFacing ?? [1, 0];
      onCameraUpdate(getCameraForSlot(slot.position, slot.size, bayPos, frontFacing));
    }
  };

  const showRackHitboxes    = viewMode === "bay";
  const showGhostRacks      = viewMode === "bay";
  const showContainers      = viewMode === "rack" || viewMode === "slot";
  const showSlotLabels      = viewMode === "rack";
  const slotsAreInteractive = viewMode === "rack";

  const visibleSlots = useMemo(() => {
    let filtered: SlotRecord[];
    if (viewMode === "slot" && selection.slotId) {
      filtered = slots.filter((s) => s.id === selection.slotId);
    } else if (viewMode === "rack" && selectedRackRef) {
      filtered = filterSlotsByRack(slots, selectedRackRef);
    } else {
      return [];
    }
    return filtered.map((s) => ({
      ...s,
      fillPct: fillByLocation.get(s.id) ?? 0,
    }));
  }, [slots, viewMode, selection.slotId, selectedRackRef, fillByLocation]);

  return (
    <group>
      {showRackHitboxes && (
        <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
          <RackHitboxes
            hitboxes={hitboxes}
            selectedRackId={selection.rackId}
            onRackClick={handleRackClick}
          />
        </SpawnInBay>
      )}

      {showGhostRacks && (
        <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
          {hitboxes.map((h) => (
            <lineSegments key={h.id} position={h.position}>
              <edgesGeometry args={[new THREE.BoxGeometry(...h.size)]} />
              <lineBasicMaterial color="#446" transparent opacity={0.5} />
            </lineSegments>
          ))}
        </SpawnInBay>
      )}

      {viewMode === "rack" && (
        <SpawnInBay bayTransform={bayTransform} localPos={[0, 0, 0]}>
          {hitboxes
            .filter((h) => normalizeRackRef(h.rackRef) !== selectedRackRef)
            .map((h) => (
              <mesh
                key={h.id}
                position={[h.position[0], 0.05, h.position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[h.size[0], h.size[2]]} />
                <meshBasicMaterial
                  color="#848484"
                  transparent
                  opacity={0.55}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
        </SpawnInBay>
      )}

      {showContainers && visibleSlots.map((slot, i) => (
        <SpawnInBay
          key={`${slot.id}-${i}`}
          bayTransform={bayTransform}
          localPos={slot.position}
        >
          <SlotContainer
            size={slot.size}
            fillPct={slot.fillPct ?? 0}
            slotId={slot.id}
            rackRef={slot.rackRef}        // ← rack identifier for popup header
            section={slot.section}
            level={slot.level}
            isInteractive={slotsAreInteractive}
            isSelected={selection.slotId === slot.id}
            showLabel={showSlotLabels}
            popupMode={viewMode === "slot" ? "always" : "hover"}
            items={itemsByLocation.get(slot.id) ?? []}
            onClick={() => handleSlotClick(slot)}
          />
        </SpawnInBay>
      ))}
    </group>
  );
}