import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";


export type SelectState = {
  hoveredUuid: string | null;
  selectedUuid: string | null;
};

export function Model({
  url,
  select,
  setSelect,
}: {
  url: string;
  select: SelectState;
  setSelect: React.Dispatch<React.SetStateAction<SelectState>>;
}) {
  const { scene } = useGLTF(url);

  // clone so we can safely tweak materials per mesh without touching drei cache
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // make materials unique per mesh (so emissive highlight doesn't affect siblings)
  useMemo(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
      }
    });
  }, [cloned]);

  // Apply hover/selection highlight (emissive)
  useEffect(() => {
  cloned.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const isHovered = mesh.uuid === select.hoveredUuid;
    const isSelected = mesh.uuid === select.selectedUuid;

    for (const m of mats) {
      const mat = m as THREE.MeshStandardMaterial;
      if (!("emissive" in mat)) continue;

      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;

      if (isHovered) {
        mat.emissive.set(0x2a7fff);
        mat.emissiveIntensity = 0.6;
      }

      if (isSelected) {
        mat.emissive.set(0xffaa00);
        mat.emissiveIntensity = 1.2;
      }

      mat.needsUpdate = true;
    }
  });
}, [cloned, select.hoveredUuid, select.selectedUuid]);


  return (
    <primitive
      object={cloned}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setSelect((s) => ({ ...s, hoveredUuid: e.object.uuid }));
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setSelect((s) => ({ ...s, hoveredUuid: null }));
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const uuid = e.object.uuid;
        setSelect((s) => ({
          ...s,
          selectedUuid: s.selectedUuid === uuid ? null : uuid,
        }));
      }}
    />
  );
}

useGLTF.preload("/models/campus.glb");
