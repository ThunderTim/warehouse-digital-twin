// cameraPositions.ts — define these based on your scene
export const cameraConfigs = {
  building: {
    // Top-down overview of whole building
    position: [0, 150, 0] as const,
    lookAt: [0, 0, 0] as const,
  },
  bay: {
    // Top-down of specific bay (you'd offset based on bayId)
    position: [0, 80, 0] as const,
    lookAt: [0, 0, 0] as const,
  },
  rack: {
    // Isometric/front view of rack
    // Position will be calculated based on which rack + which side is "front"
    position: [20, 15, 20] as const,
    lookAt: [0, 5, 0] as const,
  },
  row: {
    // Closer view of row
    position: [10, 8, 10] as const,
    lookAt: [0, 4, 0] as const,
  },
  slot: {
    // Isolated slot view
    position: [3, 2, 3] as const,
    lookAt: [0, 1, 0] as const,
  },
};