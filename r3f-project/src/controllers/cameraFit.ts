import * as THREE from "three";

export type FitRect = {
  center: [number, number, number]; // [x,y,z] (y usually 0)
  width: number;   // x span
  length: number;  // z span
  fovDeg: number;
  aspect: number;
  padding?: number; // e.g. 1.15 = 15% margin
  yawRad?: number;  // rotate around Y to align “north”
  baseY?: number;   // add extra height offset if desired
};



export function fitTopDownCameraToRect({
  center,
  width,
  length,
  fovDeg,
  aspect,
  padding = 1.15,
  yawRad = 0,
  baseY = 0,
}: FitRect) {
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const t = Math.tan(fov / 2);

  // required height to fit length (vertical)
  const hForLength = (length * 0.5) / t;

  // required height to fit width (horizontal)
  const hForWidth = (width * 0.5) / (t * aspect);

  const height = Math.max(hForLength, hForWidth) * padding + baseY;

  return {
    position: [center[0], center[1] + height, center[2]] as [number, number, number],
    rotation: [-Math.PI / 2, yawRad, 0] as [number, number, number],
    fov: fovDeg,
    near: 1,
    far: Math.max(2000, height * 6),
  };
}



