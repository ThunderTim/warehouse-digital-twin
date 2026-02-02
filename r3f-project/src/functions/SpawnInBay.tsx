//SpawnInBay.tsx
import * as THREE from "three";
import type { ReactNode } from "react";

type Props = {
  bayTransform: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
  };
  localPos?: [number, number, number];
  children: ReactNode;
};

export function SpawnInBay({ bayTransform, localPos = [0, 0, 0], children }: Props) {
  return (
    <group position={bayTransform.position} rotation={bayTransform.rotation}>
      <group position={localPos}>{children}</group>
    </group>
  );
}
