// SlotContainer.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { Interactable } from "../interaction/Interactable";
import { SlotContainerVisual } from "../Materials/SlotContainerVisual";

type Props = {
  size: [number, number, number];
  fillPct: number;
  shrinkPct?: number;
  frontIsNegativeZ?: boolean;
  slotId?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  showLabel?: boolean;
  edgeWidth?: number;
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
  showLabel = false,
  edgeWidth = 2.5,
  onClick,
}: Props) {
  const dims = useMemo(() => {
    const [w, h, d] = size;
    return {
      sw: w * shrinkPct,
      sh: h * shrinkPct,
      sd: d * shrinkPct,
    };
  }, [size, shrinkPct]);

  const geometry = useMemo(() => {
    const { sw, sh, sd } = dims;
    const g = new THREE.BoxGeometry(sw, sh, sd);
    const zHalf = sd / 2;
    g.translate(sw / 2, sh / 2, frontIsNegativeZ ? -zHalf : zHalf);
    return g;
  }, [dims, frontIsNegativeZ]);

  const popupOffset = useMemo<[number, number, number]>(() => {
    const { sw, sh, sd } = dims;
    return [sw / 2, sh + 0.3, (frontIsNegativeZ ? -1 : 1) * (sd / 2)];
  }, [dims, frontIsNegativeZ]);

  // Center of the slot box
  const slotCenter = useMemo<[number, number, number]>(() => {
    const { sw, sh, sd } = dims;
    return [
      sw / 2,
      sh / 2,
      frontIsNegativeZ ? -(sd / 2) : (sd / 2)
    ];
  }, [dims, frontIsNegativeZ]);

  const isEmpty = fillPct <= 0.001;

  const edgeColor = isSelected ? "#00ff88" : "#838383";
  const hoverEdgeColor = "#ffd400";

  const fillColor =
    fillPct <= 0 ? "#000000" :
    fillPct > 0.7 ? "#ff402f" :
    "#3727b2";

  return (
    <group>
      {/* HTML label - fixed screen size, always faces camera */}
      {showLabel && slotId && (
        <Html
          position={slotCenter}
          center                    // Centers the HTML element on the position
          style={{
            pointerEvents: 'none',  // Don't block clicks
            userSelect: 'none',
          }}
        >
          <div style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            textShadow: '0 0 4px #000, 0 0 2px #000',
            whiteSpace: 'nowrap',
          }}>
            {slotId}
          </div>
        </Html>
      )}

      <Interactable
        isInteractive={isInteractive}
        onClick={onClick}
        popupOffset={popupOffset}
        popupContent={
          <div>
            <strong>{slotId}</strong>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>
              {Math.round(fillPct * 100)}% filled
            </div>
          </div>
        }
      >
        {(hovered) => (
          <SlotContainerVisual
            geometry={geometry}
            size={[dims.sw, dims.sh, dims.sd]}
            fillPct={fillPct}
            edgeWidth={hovered || isSelected ? edgeWidth + 0.8 : edgeWidth}
            edgeColor={hovered ? hoverEdgeColor : edgeColor}
            shellOpacity={isEmpty ? 0.16 : 0.22}
            fillColor={fillColor}
            fillOpacity={isEmpty ? 0 : 0.85}
          />
        )}
      </Interactable>
    </group>
  );
}