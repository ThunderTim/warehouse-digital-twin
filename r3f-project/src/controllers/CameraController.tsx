// CameraController.tsx
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

type Props = {
  position: [number, number, number];
  rotation?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
  smooth?: number;
};

export function CameraController({
  position,
  rotation,
  lookAt,
  fov = 50,
  near = 0.1,
  far = 2000,
  smooth = 0.08,
}: Props) {
  const { camera, size } = useThree();

  const targetPos    = useRef(new THREE.Vector3(...position));
  const targetLookAt = useRef<THREE.Vector3 | null>(lookAt ? new THREE.Vector3(...lookAt) : null);
  const targetQuat   = useRef(new THREE.Quaternion());

  // FOV / aspect on mount
  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov    = fov;
      cam.near   = near;
      cam.far    = far;
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();
    }
  }, [camera, fov, near, far, size]);

  // Update targets when props change
  useEffect(() => {
    targetPos.current.set(...position);

    if (lookAt) {
      targetLookAt.current = new THREE.Vector3(...lookAt);
      // No pre-computed quaternion — lookAt is applied live in useFrame
    } else if (rotation) {
      targetLookAt.current = null;
      targetQuat.current.setFromEuler(new THREE.Euler(...rotation));
    }

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov  = fov;
      cam.near = near;
      cam.far  = far;
      cam.updateProjectionMatrix();
    }
  }, [position, rotation, lookAt, fov, near, far, camera]);

  // Aspect on resize
  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();
    }
  }, [camera, size]);

  useFrame(() => {
    // Lerp position
    camera.position.lerp(targetPos.current, smooth);

    if (targetLookAt.current) {
      // lookAt mode: recalculate facing every frame from current position.
      // This ensures the camera always points at the target regardless of
      // where it is mid-lerp — the pre-computed quaternion approach was wrong
      // because it assumed the camera was already at the final position.
      camera.lookAt(targetLookAt.current);
    } else {
      // Rotation mode: slerp toward target quaternion
      camera.quaternion.slerp(targetQuat.current, smooth);
    }
  });

  return null;
}