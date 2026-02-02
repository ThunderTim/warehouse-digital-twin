// Bay3WContents.tsx
import * as THREE from "three";
import bay3Slots from "../data/bay3_slots.json";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";
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
  setSelection 
}: Props) {
  const raw = bay3Slots as RawSlot[];

  const slots: SlotRecord[] = raw.map((r) => {
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

  // Determine if slots should be interactive based on viewMode
  const slotsAreInteractive = viewMode === "row";

  // Handle slot click
  const handleSlotClick = (slotId: string) => {
    if (!slotsAreInteractive) return;
    console.log("[Bay3WContents] slot clicked:", slotId);
    setSelection({ ...selection, slotId });
    setViewMode("slot");
  };

  return (
    <>
      {slots.map((rec, index) => (
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
    </>
  );
}