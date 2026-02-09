// SlotContainer.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { Interactable } from "../interaction/Interactable";

type Props = {
  size: [number, number, number];
  fillPct: number;
  shrinkPct?: number;
  frontIsNegativeZ?: boolean;
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

  const popupOffset = useMemo<[number, number, number]>(() => {
    const [w, h, d] = size;
    const sw = w * shrinkPct;
    const sh = h * shrinkPct;
    const sd = d * shrinkPct;
    return [sw / 2, sh + 0.3, (frontIsNegativeZ ? -1 : 1) * (sd / 2)];
  }, [size, shrinkPct, frontIsNegativeZ]);

  // Color logic based on fill
  const getColor = (hovered: boolean) => {
    if (isSelected) return "#00ff88";
    if (hovered) return "#ffd400";
    if (fillPct <= 0) return "#dddddd";
    if (fillPct < 0.7) return "#2f5bff";
    return "#86a8ff";
  };

  const getOpacity = (hovered: boolean) => {
    if (isSelected) return 0.95;
    if (hovered) return 0.9;
    if (fillPct <= 0) return 0.18;
    return fillPct < 0.7 ? 1 : 0.6;
  };

  return (
    <Interactable
      isInteractive={isInteractive}
      onClick={onClick}
      popupContent={
        <div>
          <strong>{slotId}</strong>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>
            {Math.round(fillPct * 100)}% filled
          </div>
        </div>
      }
      popupOffset={popupOffset}
    >
      {(hovered) => (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color={new THREE.Color(getColor(hovered))}
            transparent
            opacity={getOpacity(hovered)}
          />
        </mesh>
      )}
    </Interactable>
  );
}