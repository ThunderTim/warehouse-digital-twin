// src/utils/rackUtils.ts

import type { RackHitboxRecord } from "../types/slotTypes";

type CameraResult = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

// ─────────────────────────────────────────────────
// TUNING CONSTANTS — adjust these to dial in views
// ─────────────────────────────────────────────────

const RACK_PULLBACK   = 24;   // units away from rack face along facing axis
const RACK_EYE_Y      = 0;    // Y offset from rack center (+ = higher, - = lower)

const ROW_PULLBACK    = 6;   // closer than full rack
const ROW_EYE_Y       = 0;    // Y offset from level height

const SLOT_PULLBACK   = 8;   // distance along facing axis
const SLOT_SIDE       = 0.4;  // fraction of pullback to offset sideways (3/4 angle)
const SLOT_EYE_Y      = 2;    // units above slot center

// Flip camera to opposite side of facing vector.
// 1 = camera placed in facing direction (default)
// -1 = camera placed on opposite side (flip 180°)
const FACING_SIGN     = -1;

// ─────────────────────────────────────────────────

export function getCameraForRack(
  hitbox: RackHitboxRecord,
  bayPos: [number, number, number]
): CameraResult {
  const [hx, hy, hz] = hitbox.position;
  const [fx, fz]     = hitbox.frontFacing;

  const worldCenter: [number, number, number] = [
    bayPos[0] + hx,
    bayPos[1] + hy,
    bayPos[2] + hz,
  ];

  return {
    position: [
      worldCenter[0] + fx * RACK_PULLBACK * FACING_SIGN,
      worldCenter[1] + RACK_EYE_Y,
      worldCenter[2] + fz * RACK_PULLBACK * FACING_SIGN,
    ],
    lookAt: worldCenter,
  };
}

export function getCameraForRow(
  hitbox: RackHitboxRecord,
  bayPos: [number, number, number],
  level?: number
): CameraResult {
  const [hx, hy, hz] = hitbox.position;
  const [, hh]       = hitbox.size;
  const [fx, fz]     = hitbox.frontFacing;

  const levelY = level
    ? (bayPos[1] + hy - hh / 2) + (hh / hitbox.levels) * (level - 0.5)
    : bayPos[1] + hy;

  const worldCenter: [number, number, number] = [
    bayPos[0] + hx,
    levelY,
    bayPos[2] + hz,
  ];

  return {
    position: [
      worldCenter[0] + fx * ROW_PULLBACK  * FACING_SIGN,
      levelY + ROW_EYE_Y,
      worldCenter[2] + fz * ROW_PULLBACK  * FACING_SIGN,
    ],
    lookAt: worldCenter,
  };
}

export function getCameraForSlot(
  slotPosition: [number, number, number],
  slotSize: [number, number, number],
  bayPos: [number, number, number],
  frontFacing: [number, number] = [0, 1]
): CameraResult {
  const [fx, fz] = frontFacing;

  const worldCenter: [number, number, number] = [
    bayPos[0] + slotPosition[0],
    bayPos[1] + slotPosition[1],
    bayPos[2] + slotPosition[2],
  ];

  // Perpendicular axis in XZ (rotate facing 90°) for 3/4 side offset
  const perpX = -fz;
  const perpZ =  fx;

  return {
    position: [
      worldCenter[0] + fx * SLOT_PULLBACK * FACING_SIGN + perpX * SLOT_PULLBACK * SLOT_SIDE,
      worldCenter[1] + SLOT_EYE_Y,
      worldCenter[2] + fz * SLOT_PULLBACK * FACING_SIGN + perpZ * SLOT_PULLBACK * SLOT_SIDE,
    ],
    lookAt: worldCenter,
  };
}