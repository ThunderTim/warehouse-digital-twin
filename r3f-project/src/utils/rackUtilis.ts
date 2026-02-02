// rackUtils.ts
// Utilities for calculating rack bounds and generating hitboxes

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
  // Bounding box in local bay space (before axis swap)
  min: [number, number, number];
  max: [number, number, number];
  // Center and size (after axis swap for Three.js)
  center: [number, number, number];
  size: [number, number, number];
  // Which way the rack faces (determined by section order)
  facing: 'positive' | 'negative'; // In Three.js Z direction
};

/**
 * Calculate bounding box for each rack from slot data
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

    // Track section A and last section positions to determine facing
    let sectionAx: number | null = null;
    let lastSectionX: number | null = null;
    let lastSectionName = 'A';

    for (const slot of rackSlots) {
      const [x, y, z] = slot.pos;
      const [w, h, d] = slot.size;

      // Slot position is corner, so max = pos + size
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
      maxZ = Math.max(maxZ, z + d);

      // Track section positions for facing determination
      if (slot.sect === 'A') {
        sectionAx = x;
      }
      // Track the "last" section (E, D, C, B depending on rack)
      if (slot.sect > lastSectionName) {
        lastSectionName = slot.sect;
        lastSectionX = x;
      }
    }

    // Determine facing direction based on section order
    // If A is at lower X than last section → normal order → faces positive Y (negative Z in Three.js)
    // If A is at higher X than last section → reversed → faces negative Y (positive Z in Three.js)
    const facing: 'positive' | 'negative' = 
      (sectionAx !== null && lastSectionX !== null && sectionAx > lastSectionX) 
        ? 'positive' 
        : 'negative';

    // Convert to Three.js coordinates (swap Y and Z)
    // Raw: [x, y, z] -> Three: [x, z, y]
    const threeMin: [number, number, number] = [minX, minZ, minY];
    const threeMax: [number, number, number] = [maxX, maxZ, maxY];

    // Calculate center and size in Three.js space
    const center: [number, number, number] = [
      (threeMin[0] + threeMax[0]) / 2,
      (threeMin[1] + threeMax[1]) / 2,
      (threeMin[2] + threeMax[2]) / 2,
    ];

    const size: [number, number, number] = [
      threeMax[0] - threeMin[0],
      threeMax[1] - threeMin[1],
      threeMax[2] - threeMin[2],
    ];

    rackBounds.push({
      rackId: `rack-${rackNumber}`,
      rackNumber,
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      center,
      size,
      facing,
    });
  }

  // Sort by rack number for consistent ordering
  rackBounds.sort((a, b) => a.rackNumber - b.rackNumber);

  return rackBounds;
}

/**
 * Generate a camera position to view a specific rack
 * Camera will be positioned in front of the rack (aisle side), looking at its center
 */
export function getCameraForRack(
  rack: RackBounds,
  bayPosition: [number, number, number] = [0, 0, 0],
  options: {
    distance?: number;      // How far from rack center
    heightOffset?: number;  // How high above rack center
    angle?: number;         // Downward angle in radians
  } = {}
): { position: [number, number, number]; rotation: [number, number, number] } {
  const {
    distance = -35,
    heightOffset = 19,
    angle = -0.65,  // ~30 degrees down
  } = options;

  // World position = bay position + rack center
  const worldCenter: [number, number, number] = [
    bayPosition[0] + rack.center[0],
    bayPosition[1] + rack.center[1],
    bayPosition[2] + rack.center[2],
  ];

  // Position camera based on rack facing direction
  // 'positive' facing = camera should be at positive Z (in front)
  // 'negative' facing = camera should be at negative Z (in front)
  const zOffset = rack.facing === 'positive' ? distance : -distance;

  const position: [number, number, number] = [
    worldCenter[0],                           // Same X as rack center
    worldCenter[1] + heightOffset,            // Above rack
    worldCenter[2] + zOffset,                 // In front of rack
  ];

  // Rotation: look toward rack
  // If camera is at positive Z looking toward negative Z: rotation Y = 0
  // If camera is at negative Z looking toward positive Z: rotation Y = PI
  const yRotation = rack.facing === 'positive' ? Math.PI : 0;
  
  const rotation: [number, number, number] = [angle, yRotation, 0];

  return { position, rotation };
}