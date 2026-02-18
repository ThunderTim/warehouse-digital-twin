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
  slotId?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  showLabel?: boolean;
  edgeWidth?: number;
  onClick?: () => void;
};

/**
 * SlotContainer renders a single container/slot box.
 * 
 * IMPORTANT: Position data is now CENTER-BASED.
 * The parent component (SpawnInBay) places this group at the container's center,
 * so the geometry should be centered at origin (no offset needed).
 */
export function SlotContainer({
  size,
  fillPct,
  shrinkPct = 0.95,
  slotId,
  isInteractive = false,
  isSelected = false,
  showLabel = false,
  edgeWidth = 2.5,
  onClick,
}: Props) {
  // Apply shrink to create visual gaps between containers
  const dims = useMemo(() => {
    const [w, h, d] = size;
    return {
      sw: w * shrinkPct,
      sh: h * shrinkPct,
      sd: d * shrinkPct,
    };
  }, [size, shrinkPct]);

  // Geometry is now centered at origin (no translate needed)
  // Parent positions us at the container's center point
  const geometry = useMemo(() => {
    const { sw, sh, sd } = dims;
    return new THREE.BoxGeometry(sw, sh, sd);
    // NOTE: No translate() - data is already center-based
  }, [dims]);

  // Popup appears above the container
  const popupOffset = useMemo<[number, number, number]>(() => {
    const { sh } = dims;
    return [0, sh / 2 + 0.3, 0];
  }, [dims]);

  const isEmpty = fillPct <= 0.001;

  const edgeColor = isSelected ? "#00ff88" : "#838383";
  const hoverEdgeColor = "#ffd400";

  const fillColor =
    fillPct <= 0 ? "#000000" :
    fillPct > 0.7 ? "#ff402f" :
    "#3727b2";

  return (
    <group>
      {/* HTML label - centered on container, always faces camera */}
      {showLabel && slotId && (
        <Html
          position={[0, 0, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            
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