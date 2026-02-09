// RackHitboxes.tsx
import { useMemo, useState, useEffect } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { calculateRackBounds, type RackBounds } from "../utils/rackUtils";
import { Popup } from "../interaction/Popup";

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

  useEffect(() => {
    if (!isInteractive) {
      setHovered(false);
      document.body.style.cursor = "default";
    }
  }, [isInteractive]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

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

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
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

  // Popup offset - above the rack
  const popupOffset: [number, number, number] = [0, rack.size[1] / 2 + 0.5, 0];

  return (
    <mesh
      position={rack.center}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <boxGeometry args={[rack.size[0], rack.size[1], rack.size[2]]} />
      <meshBasicMaterial
        color={currentColor}
        transparent
        opacity={currentOpacity}
        depthWrite={false}
      />

      {/* Popup on hover */}
      {hovered && isInteractive && (
        <Popup offset={popupOffset}>
          {rack.rackId}
        </Popup>
      )}
    </mesh>
  );
}