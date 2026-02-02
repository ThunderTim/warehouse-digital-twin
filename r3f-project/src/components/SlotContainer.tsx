// SlotContainer.tsx
import * as THREE from "three";
import { useMemo, useState } from "react";

type Props = {
  size: [number, number, number];
  fillPct: number;
  shrinkPct?: number;
  frontIsNegativeZ?: boolean;
  
  // New interactivity props
  slotId?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
};

export function SlotContainer({
  size,
  fillPct,
  shrinkPct = 0.95,
  frontIsNegativeZ = false,
  slotId,
  isInteractive = false,
  isSelected = false,
  onClick,
}: Props) {
  const [hovered, setHovered] = useState(false);

  // Base colors based on fill percentage
  const { color, opacity } = useMemo(() => {
    // If selected, use a highlight color
    if (isSelected) {
      return { color: "#00ff88", opacity: 0.95 };
    }
    // If hovered and interactive, brighten
    if (hovered && isInteractive) {
      return { color: "#ffd400", opacity: 0.9 };
    }
    // Default colors based on fill
    if (fillPct <= 0) return { color: "#dddddd", opacity: 0.18 };
    if (fillPct < 0.7) return { color: "#2f5bff", opacity: 0.95 };
    return { color: "#86a8ff", opacity: 0.6 };
  }, [fillPct, hovered, isInteractive, isSelected]);

  const geometry = useMemo(() => {
    const [w, h, d] = size;

    const sw = w * shrinkPct;
    const sh = h * shrinkPct;
    const sd = d * shrinkPct;

    const g = new THREE.BoxGeometry(sw, sh, sd);

    const zHalf = sd / 2;
    g.translate(sw / 2, sh / 2, frontIsNegativeZ ? -zHalf : zHalf);

    return g;
  }, [size, shrinkPct, frontIsNegativeZ]);

  return (
    <mesh 
      geometry={geometry}
      onPointerOver={(e) => {
        if (!isInteractive) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        if (!isInteractive) return;
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        if (!isInteractive) return;
        e.stopPropagation();
        onClick?.();
      }}
    >
      <meshBasicMaterial 
        color={new THREE.Color(color)} 
        transparent 
        opacity={opacity} 
      />
    </mesh>
  );
}