// src/components/SlotContainer.tsx
import * as THREE from "three";
import { useMemo } from "react";

type Props = {
  size: [number, number, number]; // [w,h,d]
  fillPct: number; // 0..1
  frontIsNegativeZ?: boolean; // if your "front" points toward -Z
};

export function SlotContainer({ size, fillPct, frontIsNegativeZ = false }: Props) {
  const { color, opacity } = useMemo(() => {
    if (fillPct <= 0) return { color: "#dddddd", opacity: 0.18 };
    if (fillPct < 0.7) return { color: "#2f5bff", opacity: 0.95 };
    return { color: "#86a8ff", opacity: 0.6 };
  }, [fillPct]);

  const geometry = useMemo(() => {
    const [w, h, d] = size;
    const g = new THREE.BoxGeometry(w, h, d);

    // Move geometry so mesh origin is at front-left-bottom corner
    // left -> +w/2, bottom -> +h/2, front -> +/- d/2
    const zHalf = d / 2;
    g.translate(w / 2, h / 2, frontIsNegativeZ ? -zHalf : zHalf);

    return g;
  }, [size, frontIsNegativeZ]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={new THREE.Color(color)} transparent opacity={opacity} />
    </mesh>
  );
}
