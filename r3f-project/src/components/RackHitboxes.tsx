// src/components/RackHitboxes.tsx
// Renders clickable hitboxes for each rack.
// Positions and sizes come directly from the JSON rack_hitboxes — no computation needed.

import * as THREE from "three";
import { Interactable } from "../interaction/Interactable";
import type { RackHitboxRecord } from "../types/slotTypes";

type Props = {
  hitboxes: RackHitboxRecord[];
  selectedRackId?: string | null;
  onRackClick: (rackRef: string) => void;
};

export function RackHitboxes({ hitboxes, selectedRackId, onRackClick }: Props) {
  return (
    <group>
      {hitboxes.map((h) => {
        const rackId = `rack-${h.rackRef.replace("R", "")}`;
        const isSelected = selectedRackId === rackId;

        return (
          <group key={h.id} position={h.position}>
            <Interactable
              isInteractive={h.interactive}
              popupMode="hover"
              popupOffset={[0, h.size[1] / 2 + 0.5, 0]}
              onClick={() => onRackClick(h.rackRef)}
              popupContent={
                <div style={{ padding: "8px", minWidth: "120px" }}>
                  <h4 style={{ margin: "0 0 4px 0" }}>Rack {h.rackRef}</h4>
                  <p style={{ margin: "0", fontSize: "12px" }}>
                    {h.containerCount} containers
                  </p>
                  <p style={{ margin: "0", fontSize: "12px" }}>
                    Sections: {h.sections.join(", ")}
                  </p>
                  <p style={{ margin: "0", fontSize: "12px" }}>
                    Levels: 1–{h.levels}
                  </p>
                </div>
              }
            >
              {(hovered) => (
                <>
                  {/* Invisible hit target */}
                  <mesh>
                    <boxGeometry args={h.size} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                  </mesh>

                  {/* Hover / selected highlight */}
                  {(hovered || isSelected) && (
                    <mesh renderOrder={50}>
                      <boxGeometry args={h.size} />
                      <meshBasicMaterial
                        color={isSelected ? "#00ff00" : "#ffd400"}
                        transparent
                        opacity={isSelected ? 0.3 : 0.2}
                        depthWrite={false}
                      />
                    </mesh>
                  )}

                  {/* Wireframe outline */}
                  {(hovered || isSelected) && (
                    <lineSegments renderOrder={51}>
                      <edgesGeometry args={[new THREE.BoxGeometry(...h.size)]} />
                      <lineBasicMaterial
                        color={isSelected ? "#00ff00" : "#ffd400"}
                      />
                    </lineSegments>
                  )}
                </>
              )}
            </Interactable>
          </group>
        );
      })}
    </group>
  );
}