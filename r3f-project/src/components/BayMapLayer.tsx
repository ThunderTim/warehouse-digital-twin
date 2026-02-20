// src/components/BayMapLayer.tsx
// Pure static render of all map elements.
// All positions received here are CENTER-based (normalized in bayDataUtils).
// BoxGeometry is center-based by default — so localPos maps directly, no offset needed.

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { SpawnInBay } from "../functions/SpawnInBay";
import type { MapLayerData } from "../types/slotTypes";
import { bleach } from "three/examples/jsm/tsl/display/BleachBypass.js";

type BayTransform = { position: THREE.Vector3; rotation: THREE.Euler };
type Props = { 
  mapLayer: MapLayerData; 
  bayTransform: BayTransform; 
  showLabels?: boolean;
  labelOpacity?: number;  
};

export function BayMapLayer({ mapLayer, bayTransform , showLabels, labelOpacity}: Props) {
  return (
    <group>
      <BuildingOutline mapLayer={mapLayer} bayTransform={bayTransform} />
      <FloorGrid       mapLayer={mapLayer} bayTransform={bayTransform} />
      <FloorGuides     mapLayer={mapLayer} bayTransform={bayTransform} showLabels={showLabels} labelOpacity={labelOpacity}/>
      <Zones           mapLayer={mapLayer} bayTransform={bayTransform} showLabels={showLabels} />
      <Doors           mapLayer={mapLayer} bayTransform={bayTransform} showLabels={showLabels} />
      <LoadingDocks    mapLayer={mapLayer} bayTransform={bayTransform} showLabels={showLabels} />
    
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
function FloorGuides({ mapLayer, bayTransform, showLabels = true, labelOpacity= 0.85 }: Props) {
  return (
    <>
      {mapLayer.floorGuides.map((fg) => {
        const geo = new THREE.BoxGeometry(fg.size[0], 0.01, fg.size[2]);

        // Infer orientation from footprint — wider than deep = horizontal (sections along X)
        const isHorizontal = fg.size[0] >= fg.size[2];
        const sections = (fg.sections ?? []).slice().reverse();
        const count = sections.length;

        return (
          <SpawnInBay key={fg.id} bayTransform={bayTransform} localPos={fg.position}>
            {/* Outline box */}
            <lineSegments>
              <edgesGeometry args={[geo]} />
              <lineBasicMaterial color={fg.color} />
            </lineSegments>

            {/* FILL HERE */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[fg.size[0], fg.size[2]]} />
            <meshBasicMaterial color={fg.color} transparent opacity={0.15} depthWrite={false} />
          </mesh>

            {/* Rack label — sits at the near edge center */}
            {showLabels && <Html
              position={isHorizontal
                ? [0, 1, fg.size[2] / 2 + 0.5]   // south edge for horizontal
                : [-fg.size[0] / 2 - 0.5, 1, 0]  // west edge for vertical
              }
              center
              style={{ pointerEvents: "none" }}
            >
              <div style={{
                color:      fg.color,
                
                fontSize:   "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: "rgba(0,0,0,0.45)",
                padding:    "1px 5px",
                borderRadius: "3px",
              }}>
                {fg.label}
              </div>
            </Html>}

            {/* Section letters — evenly spaced along the rack's long axis */}
            {showLabels &&sections.map((sec, i) => {
              // t goes 0→1 across the sections, inset slightly from the edges
              const t = count === 1 ? 0.5 : i / (count - 1);
              const inset = 2.75; // units from guide edge

              const pos: [number, number, number] = isHorizontal
                ? [
                    -fg.size[0] / 2 + inset + t * (fg.size[0] - inset * 2),
                    1,
                    0,
                  ]
                : [
                    0,
                    1,
                    -fg.size[2] / 2 + inset + t * (fg.size[2] - inset * 2),
                  ];

              return (
                <Html key={sec} position={pos} center style={{ pointerEvents: "none" }}>
                  
                  <div style={{
                    color:      "black", //THIS IS THE RACK SECTION LABEL COLOR
                    opacity: labelOpacity,
                    fontSize:   "9px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    
                    margin: "12px 0px",
                    
                  }}>
                    {sec}
                  </div>
                </Html>
              );
            })}
          </SpawnInBay>
        );
      })}
    </>
  );
}




// ─────────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────────
function Zones({ mapLayer, bayTransform, showLabels }: Props) {
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
          {showLabels && (
          <Html position={[0, z.size[1] + 1, 0]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: z.borderColor, fontSize: "11px", fontFamily: "monospace",
              fontWeight: 600, whiteSpace: "nowrap",
            }}>
              {z.label}
            </div>
          </Html>)}
        </SpawnInBay>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────
// Doors
// ─────────────────────────────────────────────────
function Doors({ mapLayer, bayTransform , showLabels}: Props) {
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
            {showLabels && (
              <Html position={[0, d.size[1] / 2 + 1, 0]} center style={{ pointerEvents: "none" }}>
              <div style={{
                color, fontSize: "10px", fontFamily: "monospace",
                 whiteSpace: "nowrap",
              }}>
                {d.label}
              </div>
            </Html>)}
          </SpawnInBay>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────
// Loading Docks
// ─────────────────────────────────────────────────
function LoadingDocks({ mapLayer, bayTransform, showLabels }: Props) {
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
          {showLabels && (
          <Html position={[0, d.size[1] / 2 + 1, 0]} center style={{ pointerEvents: "none" }}>
            <div style={{
              color: d.color, fontSize: "10px", fontFamily: "monospace",
               whiteSpace: "nowrap",
            }}>
              {d.label}
            </div>
          </Html>)}
        </SpawnInBay>
      ))}
    </>
  );
}