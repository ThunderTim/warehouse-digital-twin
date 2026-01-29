import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  mesh: THREE.Mesh;
  outlineColor?: string;     // hex string like "#ffcc00"
  outlineScale?: number;     // e.g. 1.06 (small is usually enough)
  onClick?: (mesh: THREE.Mesh) => void;
};

export function Hoverable({
  mesh,
  outlineColor = "#ffcc00",
  outlineScale = 1.32,
  onClick,
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

  // ✅ draw outline on top of everything
  mat.depthTest = false;   // ignore depth buffer
  mat.depthWrite = false;

  return mat;
}, [outlineColor]);


  // keep outline behind but still visible
  // (renderOrder helps if you have coplanar surfaces)
  const baseRenderOrder = 10;
  const outlineRenderOrder = 9;

  return (
    <group
      // group is just to keep both meshes aligned
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
      {/* Outline shell: only shown when hovered */}
      {hovered && (
        <mesh
          geometry={mesh.geometry}
          material={outlineMaterial}
          scale={[outlineScale, outlineScale, outlineScale]}
          renderOrder={outlineRenderOrder}
        />
      )}

      {/* The real mesh */}
      <mesh geometry={mesh.geometry} material={baseMaterial as any} renderOrder={baseRenderOrder} />
    </group>
  );
}
