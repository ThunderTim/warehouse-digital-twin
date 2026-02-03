// rackUtils.ts
// Utilities for calculating rack bounds and camera positions

type RawSlot = {
  id: string;
  rack: number;
  sect: string;
  pos: number[];
  size: number[];
};

export type RackBounds = {
  rackId: string;
  rackNumber: number;
  // Center and size in Three.js space (after axis swap)
  center: [number, number, number];
  size: [number, number, number];
  // Which way the rack faces (determined by section order)
  // 'positive' = front faces +Z direction (camera should be at +Z looking toward -Z)
  // 'negative' = front faces -Z direction (camera should be at -Z looking toward +Z)
  facing: "positive" | "negative";
};

/**
 * Calculate bounding box and facing direction for each rack
 */
export function calculateRackBounds(slots: RawSlot[]): RackBounds[] {
  // Group slots by rack number
  const rackGroups = new Map<number, RawSlot[]>();

  for (const slot of slots) {
    const existing = rackGroups.get(slot.rack) || [];
    existing.push(slot);
    rackGroups.set(slot.rack, existing);
  }

  const rackBounds: RackBounds[] = [];

  for (const [rackNumber, rackSlots] of rackGroups) {
    // Find min/max in raw data space
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    // Track section positions to determine facing
    let sectionAx: number | null = null;
    let lastSectionX: number | null = null;
    let lastSectionName = "A";

    for (const slot of rackSlots) {
      const [x, y, z] = slot.pos;
      const [w, h, d] = slot.size;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);

      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
      maxZ = Math.max(maxZ, z + d);

      if (slot.sect === "A") {
        sectionAx = x;
      }
      if (slot.sect > lastSectionName) {
        lastSectionName = slot.sect;
        lastSectionX = x;
      }
    }

    // Determine facing: if A is at higher X than last section, rack is reversed
    const facing: "positive" | "negative" =
      sectionAx !== null && lastSectionX !== null && sectionAx > lastSectionX
        ? "positive"
        : "negative";

    // Convert to Three.js coordinates (swap Y and Z)
    // Raw: [x, y, z] -> Three: [x, z, y]
    const center: [number, number, number] = [
      (minX + maxX) / 2,
      (minZ + maxZ) / 2,  // Z becomes Y (height)
      (minY + maxY) / 2,  // Y becomes Z (depth)
    ];

    const size: [number, number, number] = [
      maxX - minX,
      maxZ - minZ,  // height
      maxY - minY,  // depth
    ];

    rackBounds.push({
      rackId: `rack-${rackNumber}`,
      rackNumber,
      center,
      size,
      facing,
    });
  }

  rackBounds.sort((a, b) => a.rackNumber - b.rackNumber);
  return rackBounds;
}

/**
 * Generate camera position and lookAt target for viewing a rack
 * 
 * Simple logic:
 * 1. Get rack center (the point we look at)
 * 2. Offset camera position based on facing direction
 * 3. Optionally offset the lookAt target
 * 4. Return both position and lookAt target
 * 
 * @param rack - The rack bounds
 * @param bayPosition - World position of the bay origin
 * @param options - Camera and lookAt offset options
 */
export function getCameraForRack(
  rack: RackBounds,
  bayPosition: [number, number, number] = [0, 0, 0],
  options: {
    // Camera position offsets (relative to rack center)
    forward?: number;   // Distance in front of rack (perpendicular to rack face)
    up?: number;        // Height above rack center
    lateral?: number;   // Side-to-side offset (along rack length)
    // LookAt offsets (adjust what point on the rack we look at)
    lookAtUp?: number;      // Look higher/lower than rack center
    lookAtLateral?: number; // Look left/right of rack center
    lookAtForward?: number; // Look in front of/behind rack center
  } = {}
): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  const { 
    // Camera position defaults
    forward = 30, 
    up = 0.2, 
    lateral = 0,
    // LookAt defaults (0 = look at exact rack center)
    lookAtUp = 0,
    lookAtLateral = 0,
    lookAtForward = 50,
  } = options;

  // Rack center in world space
  const rackWorldCenter: [number, number, number] = [
    bayPosition[0] + rack.center[0],
    bayPosition[1] + rack.center[1],
    bayPosition[2] + rack.center[2],
  ];

  // Flip direction based on rack facing
  // If facing "positive", camera goes to -Z side (in front of rack)
  // If facing "negative", camera goes to +Z side (in front of rack)
  const facingMultiplier = rack.facing === "positive" ? -1 : 1;

  const position: [number, number, number] = [
    rackWorldCenter[0] + lateral,
    rackWorldCenter[1] + up,
    rackWorldCenter[2] + (forward * facingMultiplier),
  ];

  // LookAt target: rack center + optional offsets (also flipped for forward)
  const lookAt: [number, number, number] = [
    rackWorldCenter[0] + lookAtLateral,
    rackWorldCenter[1] + lookAtUp,
    rackWorldCenter[2] + (lookAtForward * facingMultiplier),
  ];

  // Debug output
  console.log(`[getCameraForRack] rack ${rack.rackNumber}:`, {
    facing: rack.facing,
    rackCenter: rackWorldCenter,
    cameraPos: position,
    lookAt: lookAt,
  });

  return { position, lookAt };
}