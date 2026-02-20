// src/models/Bldg00Model.tsx
// No GLB — geometry is fully config-driven from buildingConfigs + bay JSON data.

import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { Html } from "@react-three/drei";
import { Interactable } from "../interaction/Interactable";
import { BayContents } from "../components/BayContents";
import { BayMapLayer } from "../components/BayMapLayer";
import type { ViewMode, Selection } from "../types/viewTypes";
import type { BayData, MapLayerData } from "../types/slotTypes";
import type { Inventory } from "../types/Inventory";
import { validateBayData, extractMapLayer } from "../utils/bayDataUtils";
import {
  getBuildingConfig,
  getActiveBays,
  getBayWorldOrigin,
} from "../controllers/buildingConfigs";

import bay00NWData from "../data/BLDG-template-Bay00.json";

const BUILDING_ID = "bldg-00";

const BAY_DATA: Record<string, BayData> = {
  "BAY_00_NW": bay00NWData as unknown as BayData,
};

type BayTransform = { position: THREE.Vector3; rotation: THREE.Euler };
type BayMapEntry = { bayId: string; mapLayer: MapLayerData; transform: BayTransform };

type Props = {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCameraUpdate?: (config: {
    position: [number, number, number];
    lookAt: [number, number, number];
  }) => void;
  fillByLocation: Map<string, number>;
  itemsByLocation: Map<string, Inventory[]>;  // ← new
};

export function Bldg00Model({
  viewMode,
  setViewMode,
  selection,
  setSelection,
  onCameraUpdate,
  fillByLocation,
  itemsByLocation,  // ← new
}: Props) {
  const buildingCfg = getBuildingConfig(BUILDING_ID)!;
  const activeBays  = getActiveBays(BUILDING_ID);

  useEffect(() => {
    for (const [id, data] of Object.entries(BAY_DATA)) {
      if (!validateBayData(data)) console.warn(`[Bldg00] JSON shape mismatch for ${id}`);
    }
  }, []);

  const baysAreInteractive = viewMode === "building";
  const activeBayId   = selection.bayId ?? null;
  const activeBayData = activeBayId ? BAY_DATA[activeBayId] : null;

  const allBayMapLayers = useMemo<BayMapEntry[]>(() => {
    return Object.entries(BAY_DATA).flatMap(([bayId, data]) => {
      const wo = getBayWorldOrigin(BUILDING_ID, bayId);
      if (!wo) return [];
      return [{
        bayId,
        mapLayer: extractMapLayer(data),
        transform: {
          position: new THREE.Vector3(wo[0], wo[1], wo[2]),
          rotation: new THREE.Euler(0, 0, 0),
        },
      }];
    });
  }, []);

  const activeBayTransform = useMemo<BayTransform | null>(() => {
    if (!activeBayId) return null;
    const wo = getBayWorldOrigin(BUILDING_ID, activeBayId);
    if (!wo) return null;
    return {
      position: new THREE.Vector3(wo[0], wo[1], wo[2]),
      rotation: new THREE.Euler(0, 0, 0),
    };
  }, [activeBayId]);

  return (
    <>
      {/* ── Bay hitboxes — one per active bay ────────────────────────── */}
      {activeBays.map((bay) => {
        const worldOrigin = getBayWorldOrigin(BUILDING_ID, bay.bayId);
        if (!worldOrigin) return null;
        const [wx, wy, wz] = worldOrigin;
        const cx = wx + bay.width  / 2;
        const cy = wy + 10;
        const cz = wz + bay.length / 2;
        const labelOffset = cx * -.50;

        return (
          <group key={bay.bayId}>
            <Interactable
              isInteractive={baysAreInteractive}
              popupMode="hover"
              popupOffset={[0, 1, 0]}
              onClick={() => {
                if (!baysAreInteractive) return;
                setSelection({ ...selection, bayId: bay.bayId });
                setViewMode("bay");
              }}
              popupContent={
                <div style={{ padding: "8px" }}>
                  <strong>{bay.label}</strong>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>{bay.width}′ × {bay.length}′</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>Click to open</div>
                </div>
              }
            >
              {(hovered) => (
                <>
                  {baysAreInteractive && (
                    <mesh position={[cx, cy, cz]}>
                      <boxGeometry args={[bay.width, 20, bay.length]} />
                      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                  )}

                  {hovered && baysAreInteractive && (
                    <mesh position={[cx, cy, cz]}>
                      <boxGeometry args={[bay.width, 20, bay.length]} />
                      <meshBasicMaterial color="#ffd400" transparent opacity={0.12} depthWrite={false} />
                    </mesh>
                  )}

                  {viewMode !== "slot" && (
                    <lineSegments position={[cx, 0, cz]}>
                      <edgesGeometry args={[new THREE.BoxGeometry(bay.width, 0.1, bay.length)]} />
                      <lineBasicMaterial color={hovered && baysAreInteractive ? "#ffd400" : "#555"} />
                    </lineSegments>
                  )}

                  {(viewMode === "building" || viewMode === "bay") && (
                    <Html position={[labelOffset, 8, cz]} center style={{ pointerEvents: "none" }}>
                      <div style={{
                        color: hovered && baysAreInteractive ? "#2e2d2a" : "#646462",
                        fontSize: "16px", fontFamily: "monospace", fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {bay.label}
                      </div>
                    </Html>
                  )}
                </>
              )}
            </Interactable>
          </group>
        );
      })}

      {/* ── Inactive bay outlines ─────────────────────────────────────── */}
      {viewMode !== "slot" && viewMode !== "rack" && buildingCfg.bays
        .filter((b) => !b.active)
        .map((bay) => {
          const worldOrigin = getBayWorldOrigin(BUILDING_ID, bay.bayId);
          if (!worldOrigin) return null;
          const [wx, , wz] = worldOrigin;
          return (
            <group key={bay.bayId}>
              <lineSegments position={[wx + bay.width / 2, 0, wz + bay.length / 2]}>
                <edgesGeometry args={[new THREE.BoxGeometry(bay.width, 0.1, bay.length)]} />
                <lineBasicMaterial color="#333" />
              </lineSegments>
              <Html position={[wx + bay.width / 2, 4, wz + bay.length / 2]} center style={{ pointerEvents: "none" }}>
                <div style={{
                  color: "#444", fontSize: "12px", fontFamily: "monospace", whiteSpace: "nowrap",
                }}>
                  {bay.label} (inactive)
                </div>
              </Html>
            </group>
          );
        })}

      {/* ── Map layers ────────────────────────────────────────────────── */}
      {viewMode === "building" && allBayMapLayers.map(({ bayId, mapLayer, transform }) => (
        <BayMapLayer key={bayId} mapLayer={mapLayer} bayTransform={transform} showLabels={true} labelOpacity={0.15} />
      ))}
      {(viewMode === "bay" || viewMode === "rack") &&
        allBayMapLayers
          .filter(({ bayId }) => bayId === activeBayId)
          .map(({ bayId, mapLayer, transform }) => (
            <BayMapLayer key={bayId} mapLayer={mapLayer} bayTransform={transform} showLabels={viewMode === "bay"} labelOpacity={0.85} />
          ))
      }

      {/* ── Bay contents — racks + slots ─────────────────────────────── */}
      {activeBayId && activeBayData && activeBayTransform && (
        <BayContents
          bayId={activeBayId}
          bayData={activeBayData}
          bayTransform={activeBayTransform}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selection={selection}
          setSelection={setSelection}
          onCameraUpdate={onCameraUpdate}
          fillByLocation={fillByLocation}
          itemsByLocation={itemsByLocation}  // ← new
        />
      )}
    </>
  );
}