// cameraTypes.ts
import * as THREE from "three";

export type CameraBase = {
  camera: THREE.PerspectiveCamera;
  basePos: THREE.Vector3;
  baseQuat: THREE.Quaternion;
  lookObj?: THREE.Object3D;
};
