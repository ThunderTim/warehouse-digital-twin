import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  /** Source mesh from the GLB (we only read its transform + geometry) */
  mesh: THREE.Mesh;
  onClick?: (mesh: THREE.Mesh) => void;

  /** Hover highlight */
  color?: string; // default: yellow
  opacity?: number; // 0..1
  /** Small lift to avoid z-fighting with coplanar surfaces */
  zBias?: number;
};

/**
 * Unity mental model:
 * - This is a "HoverHit" MonoBehaviour wrapper.
 * - We render an always-present invisible hit mesh for raycasting.
 * - On hover, we render a semi-transparent yellow mesh as the highlight.
 */
export function HoverHit({
  mesh,
  onClick,
  color = "#ffd400",
  opacity = 0.18,
  zBias = 0.001,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const hitMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    // keep it unlit + unaffected by tone mapping
    (mat as any).toneMapped = false;
    return mat;
  }, []);

  const highlightMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
    });
    (mat as any).toneMapped = false;

    // helps when highlight and surfaces are very close
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;

    return mat;
  }, [color, opacity]);

  return (
    <group position={mesh.position} rotation={mesh.rotation} scale={mesh.scale}>
      {/* Always-present invisible hit target */}
      <mesh
        geometry={mesh.geometry}
        material={hitMaterial}
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

      {/* Hover highlight */}
      {hovered && (
        <mesh
          geometry={mesh.geometry}
          material={highlightMaterial}
          position={[0, 0, zBias]}
          renderOrder={50}
        />
      )}
    </group>
  );
}
