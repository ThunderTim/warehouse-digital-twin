// src/components/SlotContainer.tsx
import * as THREE from "three";
import { useMemo } from "react";

type Props = {
  size: [number, number, number]; // [w,h,d]
  fillPct: number; // 0..1
  shrinkPct?: number; // 0..1 (visual buffer)
  frontIsNegativeZ?: boolean;
};

export function SlotContainer({
  size,
  fillPct,
  // SHRINK BUFFER !!!! 5%
  shrinkPct = 0.95,
  frontIsNegativeZ = false,
}: Props) {
  const { color, opacity } = useMemo(() => {
    if (fillPct <= 0) return { color: "#dddddd", opacity: 0.18 };
    if (fillPct < 0.7) return { color: "#2f5bff", opacity: 0.95 };
    return { color: "#86a8ff", opacity: 0.6 };
  }, [fillPct]);

  const geometry = useMemo(() => {
    const [w, h, d] = size;

    // 🔹 apply uniform visual shrink
    const sw = w * shrinkPct;
    const sh = h * shrinkPct;
    const sd = d * shrinkPct;

    const g = new THREE.BoxGeometry(sw, sh, sd);

    // pivot stays front-left-bottom
    const zHalf = sd / 2;
    g.translate(sw / 2, sh / 2, frontIsNegativeZ ? -zHalf : zHalf);

    return g;
  }, [size, shrinkPct, frontIsNegativeZ]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={new THREE.Color(color)} transparent opacity={opacity} />
    </mesh>
  );
}
