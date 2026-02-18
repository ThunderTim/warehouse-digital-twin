// src/utils/rackUtils.ts
// Camera calculations for rack, row, and slot views.
// Uses RackHitboxRecord (from JSON) directly — no bounds computation.

import type { RackHitboxRecord } from "../types/slotTypes";

type CameraResult = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

/**
 * Camera for viewing an entire rack.
 *
 * Orientation note: sections are ordered A → B → C along the Z axis
 * (depth into warehouse, positive Z = south). Camera is placed at
 * positive Z, looking north (-Z), so sections read left-to-right.
 * TODO: make this configurable per-building when orientation varies.
 */
export function getCameraForRack(
  hitbox: RackHitboxRecord,
  bayPos: [number, number, number]
): CameraResult {
  const [hx, hy, hz] = hitbox.position;
  const [, hh, hd] = hitbox.size;

  // World center of this rack
  const worldCenter: [number, number, number] = [
    bayPos[0] + hx,
    bayPos[1] + hy,
    bayPos[2] + hz,
  ];

  const pullBack = hd * 2.5;
  const riseUp   = hh * 1.5;

  return {
    position: [
      worldCenter[0],
      worldCenter[1] + riseUp,
      worldCenter[2] + pullBack,  // south of rack → looks north → A,B,C left-to-right
    ],
    lookAt: worldCenter,
  };
}

/**
 * Camera for viewing a specific level (row) within a rack.
 */
export function getCameraForRow(
  hitbox: RackHitboxRecord,
  bayPos: [number, number, number],
  level?: number
): CameraResult {
  const [hx, hy, hz] = hitbox.position;
  const [, hh, hd] = hitbox.size;

  const focusY = level
    ? hy - hh / 2 + (hh / hitbox.levels) * level
    : hy;

  const worldCenter: [number, number, number] = [
    bayPos[0] + hx,
    bayPos[1] + focusY,
    bayPos[2] + hz,
  ];

  return {
    position: [
      worldCenter[0],
      worldCenter[1] + hh * 0.2,
      worldCenter[2] + hd * 3,
    ],
    lookAt: worldCenter,
  };
}

/**
 * Camera for viewing a single slot.
 */
export function getCameraForSlot(
  slotPosition: [number, number, number],
  slotSize: [number, number, number],
  bayPos: [number, number, number]
): CameraResult {
  const maxDim = Math.max(...slotSize);

  const worldCenter: [number, number, number] = [
    bayPos[0] + slotPosition[0],
    bayPos[1] + slotPosition[1],
    bayPos[2] + slotPosition[2],
  ];

  return {
    position: [
      worldCenter[0],
      worldCenter[1] + slotSize[1] * 0.5,
      worldCenter[2] + maxDim * 4,
    ],
    lookAt: worldCenter,
  };
}