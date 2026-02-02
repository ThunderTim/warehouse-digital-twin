// CameraController.tsx
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

type Props = {
  position: [number, number, number];
  rotation: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
  smooth?: number;
};

export function CameraController({ 
  position, 
  rotation, 
  fov = 22,
  near = 0.1,
  far = 2000,
  smooth = 0.08 
}: Props) {
  const { camera, set, size } = useThree();
  
  const targetPos = useRef(new THREE.Vector3(...position));
  const targetRot = useRef(new THREE.Euler(...rotation));

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
  }, [camera, fov, near, far, size, set]);

  // Update targets when props change
  useEffect(() => {
    targetPos.current.set(...position);
    targetRot.current.set(...rotation);
    
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      cam.near = near;
      cam.far = far;
      cam.updateProjectionMatrix();
    }
  }, [position, rotation, fov, near, far, camera]);

  useFrame(() => {
    // Smoothly lerp camera position
    camera.position.lerp(targetPos.current, smooth);
    
    // Smoothly lerp rotation (using quaternions for smooth interpolation)
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot.current);
    camera.quaternion.slerp(targetQuat, smooth);
  });

  return null;
}