// SlotContainer.tsx
import * as THREE from "three";
import { useMemo } from "react";
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
  edgeWidth?: number;           // NEW: pass from Bay3WContents
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

    // Anchored box: min corner at (0,0,0), depth extrudes forward or backward
    const g = new THREE.BoxGeometry(sw, sh, sd);

    // Default box is centered at origin; move it so min corner sits at 0,0 and z face aligns with "front"
    const zHalf = sd / 2;
    g.translate(sw / 2, sh / 2, frontIsNegativeZ ? -zHalf : zHalf);

    return g;
  }, [dims, frontIsNegativeZ]);

  const popupOffset = useMemo<[number, number, number]>(() => {
    const { sw, sh, sd } = dims;
    // Above the top, centered in X, and at the “front face” in Z
    return [sw / 2, sh + 0.3, (frontIsNegativeZ ? -1 : 1) * (sd / 2)];
  }, [dims, frontIsNegativeZ]);

  const isEmpty = fillPct <= 0.001;

  // Visual styling (simple + tweakable)
  const edgeColor = isSelected ? "#00ff88" : "#838383";
  const hoverEdgeColor = "#ffd400";

  const fillColor =
    fillPct <= 0 ? "#000000" :
    fillPct > 0.7 ? "#ff402f"  :
    "#3727b2";

  return (
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
  );
}
