// RackHitboxes.tsx
import { useMemo } from "react";
import { calculateRackBounds, type RackBounds } from "../utils/rackUtils";
import { Interactable } from "../interaction/Interactable";

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
};

export function RackHitboxes({
  slots,
  isInteractive,
  selectedRackId,
  onRackClick,
}: Props) {
  const rackBounds = useMemo(() => calculateRackBounds(slots), [slots]);

  return (
    <group>
      {rackBounds.map((rack) => (
        <Interactable
          key={rack.rackId}
          isInteractive={isInteractive}
          onClick={() => onRackClick(rack)}
          popupContent={rack.rackId}
          popupOffset={[0, rack.size[1] / 2 + 0.5, 0]}
        >
          {(hovered) => {
            const isSelected = selectedRackId === rack.rackId;
            const color = isSelected ? "#00ff88" : hovered ? "#ffd400" : "#00aaff";
            const opacity = isSelected ? 0.4 : hovered ? 0.35 : 0.15;

            return (
              <mesh position={rack.center}>
                <boxGeometry args={[rack.size[0], rack.size[1], rack.size[2]]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={opacity}
                  depthWrite={false}
                />
              </mesh>
            );
          }}
        </Interactable>
      ))}
    </group>
  );
}