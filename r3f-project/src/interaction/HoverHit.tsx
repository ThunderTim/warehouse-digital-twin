// HoverHit.tsx
import * as THREE from "three";
import { useMemo, useState, useEffect } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { Popup } from "../interaction/PopUp"

type Props = {
  mesh: THREE.Mesh;
  onClick?: (mesh: THREE.Mesh) => void;
  color?: string;
  opacity?: number;
  zBias?: number;
  isInteractive?: boolean;
  popupContent?: ReactNode;
  popupOffset?: [number, number, number];
};

export function HoverHit({
  mesh,
  onClick,
  color = "#ffd400",
  opacity = 0.88,
  zBias = 0.001,
  isInteractive = true,
  popupContent,
  popupOffset = [0, 0.5, 0],
}: Props) {
  const [hovered, setHovered] = useState(false);

  // DEBUG: Log when hover state changes
  useEffect(() => {
    console.log(`[HoverHit] ${mesh.name} | hovered: ${hovered} | isInteractive: ${isInteractive}`);
  }, [hovered, isInteractive, mesh.name]);

  // DEBUG: Log when popup SHOULD render
  const shouldShowPopup = hovered && isInteractive && !!popupContent;
  useEffect(() => {
    if (shouldShowPopup) {
      console.log(`[HoverHit] POPUP VISIBLE for: ${mesh.name}`);
    }
  }, [shouldShowPopup, mesh.name]);

  const hitMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    (mat as any).toneMapped = false;
    return mat;
  }, []);

  const highlightMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    (mat as any).toneMapped = false;
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
    return mat;
  }, [color, opacity]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    console.log(`[HoverHit] pointerOver: ${mesh.name} | isInteractive: ${isInteractive}`);
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    console.log(`[HoverHit] pointerOut: ${mesh.name}`);
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

  if (!isInteractive && hovered) {
    setHovered(false);
    document.body.style.cursor = "default";
  }

  return (
    <group position={mesh.position} rotation={mesh.rotation} scale={mesh.scale}>
      {/* Invisible hit target */}
      <mesh
        geometry={mesh.geometry}
        material={hitMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Hover highlight */}
      {hovered && isInteractive && (
        <mesh
          geometry={mesh.geometry}
          material={highlightMaterial}
          position={[0, 0, zBias]}
          renderOrder={50}
        />
      )}

      {/* Popup on hover */}
      {shouldShowPopup && (
        <Popup offset={popupOffset}>{popupContent}</Popup>
      )}
    </group>
  );
}