// HoverHit.tsx
import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  /** Source mesh from the GLB (we only read its transform + geometry) */
  mesh: THREE.Mesh;
  onClick?: (mesh: THREE.Mesh) => void;

  /** Hover highlight */
  color?: string;
  opacity?: number;
  
  /** Small lift to avoid z-fighting with coplanar surfaces */
  zBias?: number;

  /** NEW: Controls whether this mesh responds to hover/click */
  isInteractive?: boolean;
};

/**
 * HoverHit - A hover/click target mesh
 * - Renders an invisible hit mesh for raycasting
 * - On hover, shows a semi-transparent highlight
 * - isInteractive controls whether it responds to events
 */
export function HoverHit({
  mesh,
  onClick,
  color = "#ffd400",
  opacity = 0.18,
  zBias = 0.001,
  isInteractive = true,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const hitMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
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
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    return mat;
  }, [color, opacity]);

  // Pointer handlers that respect isInteractive
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "default";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    onClick?.(mesh);
  };

  // Reset hover state if we become non-interactive while hovered
  // (This prevents stuck hover states)
  if (!isInteractive && hovered) {
    setHovered(false);
    document.body.style.cursor = "default";
  }

  return (
    <group position={mesh.position} rotation={mesh.rotation} scale={mesh.scale}>
      {/* Always-present invisible hit target */}
      <mesh
        geometry={mesh.geometry}
        material={hitMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Hover highlight - only shown when hovered AND interactive */}
      {hovered && isInteractive && (
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