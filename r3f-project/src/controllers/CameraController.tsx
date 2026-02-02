// CameraController.tsx
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";

type Props = {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles [x, y, z] in radians
  fov?: number;
  smooth?: number; // 0.05 = smooth, 1 = instant
};

export function CameraController({ 
  position, 
  rotation, 
  fov = 22,
  smooth = 0.08 
}: Props) {
  const { camera } = useThree();
  
  const targetPos = useRef(new THREE.Vector3(...position));
  const targetRot = useRef(new THREE.Euler(...rotation));

  // Update targets when props change
  useEffect(() => {
    targetPos.current.set(...position);
    targetRot.current.set(...rotation);
    
    // Update FOV if it's a perspective camera
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [position, rotation, fov, camera]);

  useFrame(() => {
    // Smoothly lerp camera position
    camera.position.lerp(targetPos.current, smooth);
    
    // Smoothly lerp rotation (using quaternions for smooth interpolation)
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot.current);
    camera.quaternion.slerp(targetQuat, smooth);
  });

  return null;
}