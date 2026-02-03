// CameraController.tsx
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

type Props = {
  position: [number, number, number];
  // Use EITHER rotation OR lookAt (not both)
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
  fov = 22,
  near = 0.1,
  far = 2000,
  smooth = 0.08,
}: Props) {
  const { camera, size } = useThree();

  const targetPos = useRef(new THREE.Vector3(...position));
  const targetLookAt = useRef(lookAt ? new THREE.Vector3(...lookAt) : null);
  const targetQuat = useRef(new THREE.Quaternion());

  // Set up camera on mount
  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      cam.near = near;
      cam.far = far;
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();
    }
  }, [camera, fov, near, far, size]);

  // Update targets when props change
  useEffect(() => {
    targetPos.current.set(...position);

    if (lookAt) {
      // Using lookAt mode
      targetLookAt.current = new THREE.Vector3(...lookAt);
      
      // Calculate the quaternion for this lookAt
      const tempCam = new THREE.Object3D();
      tempCam.position.set(...position);
      tempCam.lookAt(...lookAt);
      targetQuat.current.copy(tempCam.quaternion);
    } else if (rotation) {
      // Using rotation mode
      targetLookAt.current = null;
      const euler = new THREE.Euler(...rotation);
      targetQuat.current.setFromEuler(euler);
    }

    // Update FOV/near/far
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }, [position, rotation, lookAt, fov, near, far, camera]);

  useFrame(() => {
    // Smoothly lerp camera position
    camera.position.lerp(targetPos.current, smooth);

    // Smoothly slerp camera rotation
    camera.quaternion.slerp(targetQuat.current, smooth);
  });

  return null;
}