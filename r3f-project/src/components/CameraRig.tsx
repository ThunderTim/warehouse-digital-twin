// CameraRig.tsx
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

export type CameraBasePose = {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  lookAt: THREE.Vector3;
};

export function CameraRig({
  baseRef,
  strength = 0.18,
  lerp = 0.08,
  zPush = 0,
}: {
  baseRef: React.MutableRefObject<CameraBasePose | null>;
  strength?: number;
  lerp?: number;
  zPush?: number;
}) {
  const { camera, mouse } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const base = baseRef.current;
    if (!base) return; // wait until authored pose is set

    const dx = mouse.x * strength;
    const dy = mouse.y * strength;

    // camera-local axes from authored quaternion
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(base.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(base.quat);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(base.quat);

    targetPos.current
      .copy(base.pos)
      .addScaledVector(right, dx)
      .addScaledVector(up, dy)
      .addScaledVector(forward, dy * zPush);

    camera.position.lerp(targetPos.current, lerp);
    camera.quaternion.slerp(base.quat, lerp);
  });

  return null;
}
