import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { CameraBase } from "./cameraTypes";

export function CameraParallax({
  baseRef,
  strength = 2.0,
  lerp = 0.12,
  zPush = 0, // for top-down, keep 0 at first
  lockLookAt = true,
}: {
  baseRef: React.MutableRefObject<CameraBase | null>;
  strength?: number;
  lerp?: number;
  zPush?: number;
  lockLookAt?: boolean;
}) {
  const tmp = useRef({
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    targetLook: new THREE.Vector3(),
  });

  useFrame((state) => {
    const base = baseRef.current;
    if (!base) return;

    const { mouse } = state; // [-1..1]
    const { right, up, forward, targetPos, targetLook } = tmp.current;

    // ✅ WORLD axes (prevents drift inheriting camera roll)
    right.set(1, 0, 0);
    up.set(0, 1, 0);
    forward.set(0, 0, -1);

    const dx = mouse.x * strength;
    const dy = mouse.y * strength;

    targetPos
      .copy(base.basePos)
      .addScaledVector(right, dx)
      .addScaledVector(up, dy)
      .addScaledVector(forward, dy * zPush);

    base.camera.position.lerp(targetPos, lerp);

    if (lockLookAt && base.lookObj) {
      base.lookObj.getWorldPosition(targetLook);
      base.camera.up.set(0, 1, 0);
      base.camera.lookAt(targetLook);

      // ✅ hard kill roll every frame
      const e = new THREE.Euler().setFromQuaternion(base.camera.quaternion, "YXZ");
      e.z = 0;
      base.camera.quaternion.setFromEuler(e);
    } else {
      // keep stable
      base.camera.quaternion.slerp(base.baseQuat, lerp);
    }
  });

  return null;
}
