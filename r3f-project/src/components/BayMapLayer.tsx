// src/components/BayMapLayer.tsx
// Pure static render of all map elements.
// All positions received here are CENTER-based (normalized in bayDataUtils).
// BoxGeometry is center-based by default — so localPos maps directly, no offset needed.

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { SpawnInBay } from "../functions/SpawnInBay";
import type { MapLayerData } from "../types/slotTypes";

type BayTransform = { position: THREE.Vector3; rotation: THREE.Euler };
type Props = { mapLayer: MapLayerData; bayTransform: BayTransform };

export function BayMapLayer({ mapLayer, bayTransform }: Props) {
  return (
    <group>
      <BuildingOutline mapLayer={mapLayer} bayTransform={bayTransform} />
      <FloorGrid       mapLayer={mapLayer} bayTransform={bayTransform} />
      <FloorGuides     mapLayer={mapLayer} bayTransform={bayTransform} />
      <Zones           mapLayer={mapLayer} bayTransform={bayTransform} />
      <Doors           mapLayer={mapLayer} bayTransform={bayTransform} />
      <LoadingDocks    mapLayer={mapLayer} bayTransform={bayTransform} />
    </group>
  );
}

// ─────────────────────────────────────────────────
// Building Outline
// ─────────────────────────────────────────────────
function BuildingOutline({ mapLayer, bayTransform }: Props) {
  const o = mapLayer.buildingOutline;
  if (!o) return null;
  const geo = useMemo(() => new THREE.BoxGeometry(o.size[0], o.size[1], o.size[2]), [o.size]);
  return (
    <SpawnInBay bayTransform={bayTransform} localPos={o.position}>
      <lineSegments>
        <edgesGeometry args={[geo]} />
        <lineBasicMaterial color={o.color} />
      </lineSegments>
    </SpawnInBay>
  );
}

// ─────────────────────────────────────────────────
// Floor Grid
// Position stays as corner — lines are built from that origin outward.
// ─────────────────────────────────────────────────
function FloorGrid({ mapLayer, bayTransform }: Props) {
  const g = mapLayer.floorGrid;
  if (!g) return null;

  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const [width, , depth] = g.size;
    const [sx, sz] = g.spacing;
    for (let x = 0; x <= width; x += sx) {
      pts.push(new THREE.Vector3(x, 0, 0));
      pts.push(new THREE.Vector3(x, 0, depth));
    }
    for (let z = 0; z <= depth; z += sz) {
      pts.push(new THREE.Vector3(0, 0, z));
      pts.push(new THREE.Vector3(width, 0, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [g]);

  return (
    <SpawnInBay bayTransform={bayTransform} localPos={g.position}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={g.color} transparent opacity={g.opacity} />
      </lineSegments>
    </SpawnInBay>
  );
}

// ─────────────────────────────────────────────────
// Floor Guides
// ─────────────────────────────────────────────────
function FloorGuides({ mapLayer, bayTransform }: Props) {
  return (
    <>
      {mapLayer.floorGuides.map((fg) => {
        const geo = new THREE.BoxGeometry(fg.size[0], 0.01, fg.size[2]);
        return (
          <SpawnInBay key={fg.id} bayTransform={bayTransform} localPos={fg.position}>
            <lineSegments>
              <edgesGeometry args={[geo]} />
              <lineBasicMaterial color={fg.color} />
            </lineSegments>
            <Html position={[0, 1, -fg.size[2] / 2]} center style={{ pointerEvents: "none" }}>
              <div style={{
                color: fg.color,
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 600,
                textShadow: "0 0 4px #1b1b1bc7",
                whiteSpace: "nowrap",
              }}>
                {fg.label}
              </div>
            </Html>
          </SpawnInBay>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────────
function Zones({ mapLayer, bayTransform }: Props) {
  return (
    <>
      {mapLayer.zones.map((z) => (
        <SpawnInBay key={z.id} bayTransform={bayTransform} localPos={z.position}>
          {/* Fill */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[z.size[0], z.size[2]]} />
            <meshBasicMaterial color={z.fillColor.slice(0, 7)} transparent opacity={0.15} depthWrite={false} />
          </mesh>
          {/* Border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(z.size[0], z.size[1], z.size[2])]} />
            <lineBasicMaterial color={z.borderColor} />
          </lineSegments>
          {/* Label */}
          <Html position={[0, z.size[1] + 1, 0]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: z.borderColor, fontSize: "11px", fontFamily: "monospace",
              fontWeight: 600, whiteSpace: "nowrap",
            }}>
              {z.label}
            </div>
          </Html>
        </SpawnInBay>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────
// Doors
// ─────────────────────────────────────────────────
function Doors({ mapLayer, bayTransform }: Props) {
  return (
    <>
      {mapLayer.doors.map((d) => {
        const color = d.doorType === "emergency" ? "#ff4444" : "#44ff88";
        return (
          <SpawnInBay key={d.id} bayTransform={bayTransform} localPos={d.position}>
            <mesh>
              <boxGeometry args={[d.size[0], d.size[1], d.size[2]]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            <Html position={[0, d.size[1] / 2 + 1, 0]} center style={{ pointerEvents: "none" }}>
              <div style={{
                color, fontSize: "10px", fontFamily: "monospace",
                textShadow: "0 0 4px #000", whiteSpace: "nowrap",
              }}>
                {d.label}
              </div>
            </Html>
          </SpawnInBay>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────
// Loading Docks
// ─────────────────────────────────────────────────
function LoadingDocks({ mapLayer, bayTransform }: Props) {
  return (
    <>
      {mapLayer.loadingDocks.map((d) => (
        <SpawnInBay key={d.id} bayTransform={bayTransform} localPos={d.position}>
          <mesh>
            <boxGeometry args={[d.size[0], d.size[1], d.size[2]]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.6} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(d.size[0], d.size[1], d.size[2])]} />
            <lineBasicMaterial color={d.color} />
          </lineSegments>
          <Html position={[0, d.size[1] / 2 + 1, 0]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: d.color, fontSize: "10px", fontFamily: "monospace",
              textShadow: "0 0 4px #000", whiteSpace: "nowrap",
            }}>
              {d.label}
            </div>
          </Html>
        </SpawnInBay>
      ))}
    </>
  );
}