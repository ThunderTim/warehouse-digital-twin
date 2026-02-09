// SlotContainer.tsx
import * as THREE from "three";
import { useMemo, useState } from "react";
import { Text, Billboard } from "@react-three/drei";
import { Popup } from "../interaction/Popup";

type Props = {
  size: [number, number, number];
  fillPct: number;
  shrinkPct?: number;
  frontIsNegativeZ?: boolean;

  slotId?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;

  showLabel?: boolean;
  labelOnHoverOnly?: boolean;
  labelFontSize?: number;
  labelYOffset?: number;
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

  showLabel = false,
  labelOnHoverOnly = true,
  labelFontSize = 0.35,
  labelYOffset = 0.15,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const label = slotId ?? "";

  const { color, opacity } = useMemo(() => {
    if (isSelected) return { color: "#00ff88", opacity: 0.95 };
    if (hovered && isInteractive) return { color: "#ffd400", opacity: 0.9 };

    if (fillPct <= 0) return { color: "#dddddd", opacity: 0.18 };
    if (fillPct < 0.7) return { color: "#2f5bff", opacity: 1 };
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

  const labelPos = useMemo<[number, number, number]>(() => {
    const [w, h, d] = size;

    const sw = w * shrinkPct;
    const sh = h * shrinkPct;
    const sd = d * shrinkPct;

    const x = sw / 2;
    const y = sh + labelYOffset;
    const z = (frontIsNegativeZ ? -1 : 1) * (sd * 0.6);

    return [x, y, z];
  }, [size, shrinkPct, frontIsNegativeZ, labelYOffset]);

  // Popup position - center of the slot, slightly above
  const popupOffset = useMemo<[number, number, number]>(() => {
    const [w, h, d] = size;
    const sw = w * shrinkPct;
    const sh = h * shrinkPct;
    const sd = d * shrinkPct;

    return [sw / 2, sh + 0.3, (frontIsNegativeZ ? -1 : 1) * (sd / 2)];
  }, [size, shrinkPct, frontIsNegativeZ]);

  const shouldShowLabel =
    showLabel &&
    label.length > 0 &&
    (!labelOnHoverOnly || hovered || isSelected);

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
      <meshStandardMaterial
        color={new THREE.Color(color)}
        transparent
        opacity={opacity}
      />

      {shouldShowLabel && (
        <Billboard>
          <Text
            position={labelPos}
            fontSize={labelFontSize}
            anchorX="center"
            anchorY="middle"
            color="#111111"
            material-transparent
            material-opacity={0.85}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={999}
          >
            {label}
          </Text>
        </Billboard>
      )}

      {/* Popup on hover */}
      {hovered && isInteractive && (
        <Popup offset={popupOffset}>
          <div>
            <strong>{slotId}</strong>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>
              {Math.round(fillPct * 100)}% filled
            </div>
          </div>
        </Popup>
      )}
    </mesh>
  );
}