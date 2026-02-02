// cameraPositions.ts
// Centralized camera positions for all views

export type CameraConfig = {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians
  fov: number;
  near?: number;
  far?: number;
};

// =====================================================
// 📷 CAMERA POSITIONS - EDIT THESE!
// =====================================================
// position = [x, y, z] where the camera sits
// rotation = [x, y, z] Euler angles in RADIANS
//
// Tip: -1.5708 (-π/2) = looking straight down
//      0 = looking at horizon

export const CAMERA_POSITIONS: {
  campus: CameraConfig;
  building: CameraConfig;
  bays: Record<string, CameraConfig>;
  rack: CameraConfig;
  row: CameraConfig;
  slot: CameraConfig;
} = {
  // ─────────────────────────────────────────────────
  // CAMPUS VIEW (top-down of whole campus)
  // ─────────────────────────────────────────────────
  campus: {
    position: [12, 1500.61, 115.9],
    rotation: [-1.51, 0, 0],
    fov: 22,
    near: 1,
    far: 5000,
  },

  // ─────────────────────────────────────────────────
  // BUILDING VIEW (top-down of building interior)
  // ─────────────────────────────────────────────────
  building: {
    position: [0, 1100.61, 60],
    rotation: [-1.5009831567151237, 0, 0],
    fov: 22,
  },

  // ─────────────────────────────────────────────────
  // BAY VIEWS (one per bay)
  // ─────────────────────────────────────────────────
  bays: {
    "BAY_3W": {
      position: [97.25, 260, -52.9],
      rotation: [-1.55, 0, 0],
      fov: 30,
    },
    "BAY_3E": {
      position: [97.25, 260, 75.9],
      rotation: [-1.5009831567151237, 0, 0],
      fov: 30,
    },
    "BAY_6W": {
      position: [-99, 260, -55.9],
      rotation: [-1.5009831567151237, 0, 0],
      fov: 30,
    },
    "BAY_6E": {
      position: [-99, 260, 75.9],
      rotation: [-1.5009831567151237, 0, 0],
      fov: 30,
    },
  },

  // ─────────────────────────────────────────────────
  // RACK / ROW / SLOT (placeholder - will be dynamic)
  // ─────────────────────────────────────────────────
  rack: {
    position: [80, 25, -40],
    rotation: [-0.8, 0, 0],
    fov: 40,
  },
  row: {
    position: [85, 15, -45],
    rotation: [-0.6, 0, 0],
    fov: 45,
  },
  slot: {
    position: [90, 10, -50],
    rotation: [-0.4, 0, 0],
    fov: 50,
  },
};

// Helper to get bay camera (with fallback)
export function getBayCamera(bayId: string): CameraConfig {
  const bayKey = bayId.replace("__HIIT", "").replace("__HIT", "");
  return CAMERA_POSITIONS.bays[bayKey] ?? CAMERA_POSITIONS.bays["BAY_3W"];
}