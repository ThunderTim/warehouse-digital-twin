// RackHitboxes.tsx
import * as THREE from "three";
import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { calculateRackBounds, type RackBounds } from "../utils/rackUtilis";

type RawSlot = {
  id: string;
  rack: number;
  sect: string;
  pos: number[];
  size: number[];
};

type Props = {
  slots: RawSlot[];
  isInteractive: boolean;
  selectedRackId?: string;
  onRackClick: (rack: RackBounds) => void;
  color?: string;
  hoverColor?: string;
  opacity?: number;
  hoverOpacity?: number;
};

export function RackHitboxes({
  slots,
  isInteractive,
  selectedRackId,
  onRackClick,
  color = "#00aaff",
  hoverColor = "#ffd400",
  opacity = 0.15,
  hoverOpacity = 0.35,
}: Props) {
  // Calculate rack bounds from slots
  const rackBounds = useMemo(() => {
    return calculateRackBounds(slots);
  }, [slots]);

  return (
    <group>
      {rackBounds.map((rack) => (
        <RackHitbox
          key={rack.rackId}
          rack={rack}
          isInteractive={isInteractive}
          isSelected={selectedRackId === rack.rackId}
          onClick={() => onRackClick(rack)}
          color={color}
          hoverColor={hoverColor}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
        />
      ))}
    </group>
  );
}

// Individual rack hitbox
function RackHitbox({
  rack,
  isInteractive,
  isSelected,
  onClick,
  color,
  hoverColor,
  opacity,
  hoverOpacity,
}: {
  rack: RackBounds;
  isInteractive: boolean;
  isSelected: boolean;
  onClick: () => void;
  color: string;
  hoverColor: string;
  opacity: number;
  hoverOpacity: number;
}) {
  const [hovered, setHovered] = useState(false);

  // Determine current color/opacity
  const currentColor = useMemo(() => {
    if (isSelected) return "#00ff88";
    if (hovered && isInteractive) return hoverColor;
    return color;
  }, [isSelected, hovered, isInteractive, hoverColor, color]);

  const currentOpacity = useMemo(() => {
    if (isSelected) return 0.4;
    if (hovered && isInteractive) return hoverOpacity;
    return opacity;
  }, [isSelected, hovered, isInteractive, hoverOpacity, opacity]);

  // Create box geometry for the rack bounds
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(rack.size[0], rack.size[1], rack.size[2]);
  }, [rack.size]);

  // Material
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(currentColor),
      transparent: true,
      opacity: currentOpacity,
      depthWrite: false,
    });
  }, [currentColor, currentOpacity]);

  // Event handlers
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
    console.log("[RackHitbox] clicked:", rack.rackId);
    onClick();
  };

  // Reset hover if becomes non-interactive
  if (!isInteractive && hovered) {
    setHovered(false);
    document.body.style.cursor = "default";
  }

  return (
    <mesh
      position={rack.center}
      geometry={geometry}
      material={material}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}