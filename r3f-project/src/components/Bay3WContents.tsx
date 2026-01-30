import * as THREE from "three";
import bay3Slots from "../data/bay3_slots.json";
import { SpawnInBay } from "../functions/SpawnInBay";
import { SlotContainer } from "./SlotContainer";

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
  size: [number, number, number];
  pos: [number, number, number];
  fillPct: number;
};

function toVec3(arr: number[]): [number, number, number] {
  return [arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0];
}

function mapDbPosToThree(pos: [number, number, number]): [number, number, number] {
  const [x, y, z] = pos;         // from Excel: POS X, POS Y, POS Z
  return [x, z, y];              // Three: X, Y(up), Z
  // if forward/back is reversed, use: return [x, z, -y];
}


export function Bay3WContents({ bayTransform }: { bayTransform: BayTransform }) {
  const raw = bay3Slots as RawSlot[];

  const slots: SlotRecord[] = raw.map((r) => {
    const size = toVec3(r.size);
    const rawPos = toVec3(r.pos);

    return {
      id: r.id,
      size,
      pos: mapDbPosToThree(rawPos), // 👈 AXIS FIX HERE
      fillPct: r.fillPct,
    };
  });

  return (
    <>
      {slots.map((rec, index) => (
        <SpawnInBay
          key={`${rec.id}-${index}`}   // avoid duplicate key warning
          bayTransform={bayTransform}
          localPos={rec.pos}
        >
          <SlotContainer size={rec.size} fillPct={rec.fillPct} />
        </SpawnInBay>
      ))}
    </>
  );
}