// SlotContainerVisual.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { ShellMaterial } from "./ShellMaterial";

type Props = {
  geometry: THREE.BufferGeometry;
  size: [number, number, number];
  fillPct: number;
  edgeColor?: THREE.ColorRepresentation;
  edgeWidth?: number;
  shellColor?: THREE.ColorRepresentation;
  shellOpacity?: number;
  fillColor?: THREE.ColorRepresentation;
  fillOpacity?: number;
};

export function SlotContainerVisual({
  size,
  fillPct,
  edgeColor = "#ffffff",
  edgeWidth = 2.5,

  shellColor = "#dbe2ff",
  shellOpacity = 0.52,

  fillColor = "#2f5bff",
  fillOpacity = 0.85,
}: Props) {
  const [w, h, d] = size;
  const halfH = h / 2;

  const clamped = Math.max(0, Math.min(1, fillPct));

  // Fill scales from bottom: adjust position so "bottom stays put"
  const fillScaleY = clamped;
  const fillPosY = -halfH + (h * fillScaleY) / 2;

  // Build box corner points (local space)
  const corners = useMemo(() => {
    const hw = w / 2, hh = h / 2, hd = d / 2;

    // 8 corners
    const p000 = new THREE.Vector3(-hw, -hh, -hd);
    const p100 = new THREE.Vector3( hw, -hh, -hd);
    const p110 = new THREE.Vector3( hw,  hh, -hd);
    const p010 = new THREE.Vector3(-hw,  hh, -hd);

    const p001 = new THREE.Vector3(-hw, -hh,  hd);
    const p101 = new THREE.Vector3( hw, -hh,  hd);
    const p111 = new THREE.Vector3( hw,  hh,  hd);
    const p011 = new THREE.Vector3(-hw,  hh,  hd);

    // edges as polylines (4 loops + 4 verticals)
    const topLoop = [p010, p110, p111, p011, p010];
    const botLoop = [p000, p100, p101, p001, p000];
    const v1 = [p000, p010];
    const v2 = [p100, p110];
    const v3 = [p101, p111];
    const v4 = [p001, p011];

    return { topLoop, botLoop, v1, v2, v3, v4 };
  }, [w, h, d]);

  return (
    <group>
      {/* SHELL: transparent container faces */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <ShellMaterial
          baseColor={shellColor}
          opacity={shellOpacity}
          halfHeight={halfH}
          fresnelPower={2.2}
          fresnelStrength={0.9}
          yFadeStrength={0.25}
        />
      </mesh>

      {/* FILL: solid volume rising in Y */}
      {clamped > 0 && (
        <mesh position={[0, fillPosY, 0]} scale={[1, fillScaleY, 1]}>
          <boxGeometry args={[w * 0.98, h, d * 0.98]} />
          <meshBasicMaterial
            color={fillColor}
            transparent
            opacity={fillOpacity}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* EDGES: thick outline using fat lines */}
      <Line points={corners.topLoop} color={edgeColor} lineWidth={edgeWidth} />
      <Line points={corners.botLoop} color={edgeColor} lineWidth={edgeWidth} />
      <Line points={corners.v1} color={edgeColor} lineWidth={edgeWidth} />
      <Line points={corners.v2} color={edgeColor} lineWidth={edgeWidth} />
      <Line points={corners.v3} color={edgeColor} lineWidth={edgeWidth} />
      <Line points={corners.v4} color={edgeColor} lineWidth={edgeWidth} />
    </group>
  );
}
