

// HoverHit.tsx
import * as THREE from "three";
import { useMemo, useState, useEffect } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { Popup } from "../interaction/PopUp"


type Props = {
  mesh: THREE.Mesh;
  outlineColor?: string;
  outlineScale?: number;
  onClick?: (mesh: THREE.Mesh) => void;
  renderBase?: boolean;
  fillOnHover?: boolean;
  fillOpacity?: number;
  isInteractive?: boolean;
  /** Popup content - if provided, shows on hover */
  popupContent?: ReactNode;
  popupOffset?: [number, number, number];
};

export function Hoverable({
  mesh,
  outlineColor = "#ffb700",
  outlineScale = 1.16,
  onClick,
  renderBase = true,
  isInteractive = true,
  popupContent,
  popupOffset = [0, 1, 0],
}: Props) {
  const [hovered, setHovered] = useState(false);

  const baseMaterial = useMemo(() => {
    const m = mesh.material;
    return Array.isArray(m) ? m.map((x) => x.clone()) : m.clone();
  }, [mesh]);

  const outlineMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(outlineColor),
      side: THREE.BackSide,
    });
    mat.depthTest = true;
    mat.depthWrite = false;
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1.1;
    return mat;
  }, [outlineColor]);

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

  // Reset if becomes non-interactive while hovered
  if (!isInteractive && hovered) {
    setHovered(false);
    document.body.style.cursor = "default";
  }

  const baseRenderOrder = 31;
  const outlineRenderOrder = 21;

  return (
    <group
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Hover outline */}
      {hovered && isInteractive && (
        <mesh
          geometry={mesh.geometry}
          material={outlineMaterial}
          scale={[outlineScale, outlineScale, outlineScale]}
          renderOrder={outlineRenderOrder}
        />
      )}

      {/* Base mesh */}
      {renderBase && (
        <mesh
          geometry={mesh.geometry}
          material={baseMaterial as any}
          renderOrder={baseRenderOrder}
        />
      )}

      {/* Popup on hover */}
      {hovered && isInteractive && popupContent && (
        <Popup offset={popupOffset}>{popupContent}</Popup>
      )}
    </group>
  );
}