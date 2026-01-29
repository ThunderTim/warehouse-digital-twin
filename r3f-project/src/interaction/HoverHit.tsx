import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  mesh: THREE.Mesh;
  onClick?: (mesh: THREE.Mesh) => void;

  // hover visuals
  outlineColor?: string;
  outlineScale?: number;

  // translucent fill on hover (shows floor texture through it)
  fillOpacity?: number; // 0..1 (e.g. 0.18)
};

export function HoverHit({
  mesh,
  onClick,
  outlineColor = "#ffcc00",
  outlineScale = 1.06,
  
}: Props) {
  const [hovered, setHovered] = useState(false);

  const outlineMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(outlineColor),
      side: THREE.BackSide,
    });
    mat.depthTest = true;
    mat.depthWrite = false;
    return mat;
  }, [outlineColor]);

  

  return (
    <group
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        console.log("HOVER IN:", mesh.name);
        setHovered(true);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        console.log("HOVER OUT:", mesh.name);
        setHovered(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick?.(mesh);
      }}
    >
      {hovered && (
        <>
          
          

          {/* outline shell */}
          <mesh
            geometry={mesh.geometry}
            material={outlineMaterial}
            scale={[outlineScale, outlineScale, outlineScale]}
            renderOrder={25}
          />
        </>
      )}
    </group>
  );
}
