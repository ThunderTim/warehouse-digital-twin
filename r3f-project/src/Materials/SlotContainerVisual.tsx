// SlotContainerVisual.tsx
import * as THREE from "three";
import { useMemo } from "react";
import { Line } from "@react-three/drei";

type Props = {
  size: [number, number, number];
  fillPct: number;
  fillColor?: THREE.ColorRepresentation; // flat fill color — driven by fillPct in SlotContainer
  edgeColor?: THREE.ColorRepresentation;
  edgeWidth?: number;
  fillOpacity?: number;
};

// Opacity for the white volume shell — raise to make containers feel more solid,
// lower to keep them readable when packed tightly.
const SHELL_OPACITY = 0.82;

export function SlotContainerVisual({
  size,
  fillPct,
  fillColor   = "#708979",
  edgeColor   = "#6d6d6d",
  edgeWidth   = 1.5,
  fillOpacity = 0.82,
}: Props) {
  const [w, h, d] = size;
  const halfH = h / 2;

  const clamped = Math.max(0, Math.min(1, fillPct));
  const isEmpty = clamped <= 0.001;

  // Fill mesh slightly inset so it doesn't share faces with the edge cage
  const fw = w * 0.99;
  const fd = d * 0.99;
  const fillH    = h * clamped;
  const fillPosY = -halfH + fillH / 2;

  // ── 12-edge cage (outer box corners) ────────────────────────────────
  const corners = useMemo(() => {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const p000 = new THREE.Vector3(-hw, -hh, -hd);
    const p100 = new THREE.Vector3( hw, -hh, -hd);
    const p110 = new THREE.Vector3( hw,  hh, -hd);
    const p010 = new THREE.Vector3(-hw,  hh, -hd);
    const p001 = new THREE.Vector3(-hw, -hh,  hd);
    const p101 = new THREE.Vector3( hw, -hh,  hd);
    const p111 = new THREE.Vector3( hw,  hh,  hd);
    const p011 = new THREE.Vector3(-hw,  hh,  hd);
    return {
      topLoop: [p010, p110, p111, p011, p010],
      botLoop: [p000, p100, p101, p001, p000],
      v1: [p000, p010],
      v2: [p100, p110],
      v3: [p101, p111],
      v4: [p001, p011],
    };
  }, [w, h, d]);

  // Seam ring at fill surface level
  const seamY = -halfH + fillH;
  const seamPoints = useMemo(() => {
    if (isEmpty || clamped >= 0.999) return null;
    const hw = fw / 2, hd = fd / 2;
    return [
      new THREE.Vector3(-hw, seamY, -hd),
      new THREE.Vector3( hw, seamY, -hd),
      new THREE.Vector3( hw, seamY,  hd),
      new THREE.Vector3(-hw, seamY,  hd),
      new THREE.Vector3(-hw, seamY, -hd),
    ];
  }, [fw, fd, seamY, isEmpty, clamped]);

  return (
    <group>

      {/* ── HITBOX: invisible full-size mesh so empty slots still catch
          hover/click events ──────────────────────────────────────────── */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── VOLUME SHELL: semi-opaque white box gives each container a
          sense of physical presence even when empty. Rendered before the
          fill so the fill sits visually on top. depthWrite=false avoids
          z-fighting with the fill mesh. ──────────────────────────────── */}
      <mesh>
        <boxGeometry args={[fw, h * 0.995, fd]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={SHELL_OPACITY}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ── FILL: flat solid color box sitting inside the cage ───────── */}
      {!isEmpty && fillH > 0.001 && (
        <mesh position={[0, fillPosY, 0]}>
          <boxGeometry args={[fw, fillH, fd]} />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={fillOpacity}
            depthWrite={true}
          />
        </mesh>
      )}

      {/* ── SEAM: ring at fill surface ───────────────────────────────── */}
      {seamPoints && (
        <Line
          points={seamPoints}
          color={fillColor}   // seam matches fill color for a clean join
          lineWidth={edgeWidth * 0.8}
          depthWrite={true}
          depthTest={true}
          transparent
          opacity={0.7}
        />
      )}

      {/* ── CAGE: all 12 edges ───────────────────────────────────────── */}
      {(["topLoop", "botLoop", "v1", "v2", "v3", "v4"] as const).map((key) => (
        <Line
          key={key}
          points={corners[key]}
          color={edgeColor}
          lineWidth={edgeWidth}
          depthWrite={true}
          depthTest={true}
        />
      ))}

    </group>
  );
}