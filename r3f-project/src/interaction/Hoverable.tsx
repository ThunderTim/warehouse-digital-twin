import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  mesh: THREE.Mesh;
  color?: number;          // emissive hover color
  intensity?: number;      // emissive intensity
  onClick?: (mesh: THREE.Mesh) => void;
};

export function Hoverable({
  mesh,
  color = 0x2a7fff,
  intensity = 0.8,
  onClick,
}: Props) {
  const [hovered, setHovered] = useState(false);

  // clone material so we don't mutate shared materials
  const mat = useMemo(() => {
    const m = mesh.material;
    return Array.isArray(m) ? m.map((x) => x.clone()) : m.clone();
  }, [mesh]);

  // apply emissive when hovered
  useMemo(() => {
    const mats = Array.isArray(mat) ? mat : [mat];
    for (const m of mats) {
      const sm = m as THREE.MeshStandardMaterial;
      if (!("emissive" in sm)) continue;
      sm.emissive.set(hovered ? color : 0x000000);
      sm.emissiveIntensity = hovered ? intensity : 0;
      sm.needsUpdate = true;
    }
  }, [mat, hovered, color, intensity]);

  return (
    <mesh
      geometry={mesh.geometry}
      material={mat as any}
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick?.(mesh);
      }}
    />
  );
}
