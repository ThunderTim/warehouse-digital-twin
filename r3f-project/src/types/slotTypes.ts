// src/types/slotTypes.ts
export type RawSlot = {
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