import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  mesh: THREE.Mesh;
  outlineColor?: string;     // hex string like "#ffcc00"
  outlineScale?: number;     // e.g. 1.06 (small is usually enough)
  onClick?: (mesh: THREE.Mesh) => void;

  // New options
  renderBase?: boolean;      // default true
  fillOnHover?: boolean;     // default false
  fillOpacity?: number;      // e.g. 0.15
};

export function Hoverable({
  mesh,
  outlineColor = "#ffb700",
  outlineScale = 1.16,
  onClick,
  renderBase = true,
  
}: Props) {
  const [hovered, setHovered] = useState(false);

  // clone the original material so we don't mutate shared materials
  const baseMaterial = useMemo(() => {
    const m = mesh.material;
    return Array.isArray(m) ? m.map((x) => x.clone()) : m.clone();
  }, [mesh]);

  // outline material (unlit, solid)
  const outlineMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(outlineColor),
      side: THREE.BackSide,
    });
    mat.depthTest = true;  
    mat.depthWrite = false
;
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1.1;



    return mat;
  }, [outlineColor]);

  

  // render ordering (helps with coplanar / near-coplanar)
  const baseRenderOrder = 31;
  
  const outlineRenderOrder = 21;

  return (
    <group
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
    >
      {/* Hover visuals */}
      {hovered && (
        <>
          

          <mesh
            geometry={mesh.geometry}
            material={outlineMaterial}
            scale={[outlineScale, outlineScale, outlineScale]}
            renderOrder={outlineRenderOrder}
          />
        </>
      )}

      {/* Base mesh (optional) */}
      {renderBase && (
        <mesh
          geometry={mesh.geometry}
          material={baseMaterial as any}
          renderOrder={baseRenderOrder}
        />
      )}
    </group>
  );
}
