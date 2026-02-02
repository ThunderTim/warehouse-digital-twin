// CampusModel.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Hoverable } from "../interaction/Hoverable";

type GLTFResult = {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
};

export function CampusModel({
  url = "/models/campus.glb",
  onSelectBuilding,
}: {
  url?: string;
  onSelectBuilding?: (id: string) => void;
}) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;

  // Derive hover meshes
  const hoverMeshes = useMemo(() => {
    return Object.values(nodes)
      .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
      .filter((m) => m.name.includes("__HIT") || m.name.includes("__HIIT"));
  }, [nodes]);

  // Fix floor material (no camera setup here anymore!)
  useEffect(() => {
    const floor = scene.getObjectByName("floor-map") as THREE.Mesh | null;
    if (!floor) return;

    const oldMat = floor.material;
    const srcMat = Array.isArray(oldMat) ? oldMat[0] : oldMat;
    const tex = (srcMat as any)?.map as THREE.Texture | undefined;
    
    if (!tex) {
      console.warn("floor-map has no material.map texture");
      return;
    }

    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    const unlit = new THREE.MeshBasicMaterial({ map: tex });
    (unlit as any).toneMapped = false;

    floor.material = unlit;
    floor.material.needsUpdate = true;

    // Move floor slightly down to avoid z-fighting
    floor.position.y -= 2.02;
    floor.renderOrder = 0;
    floor.material.depthWrite = false;
  }, [scene]);

  // Hide any cameras in the GLB (we're using our own)
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Camera).isCamera) {
        obj.visible = false;
      }
    });
  }, [scene]);

  return (
    <>
      <primitive object={scene} />

      {hoverMeshes.map((mesh) => (
        <Hoverable
          key={mesh.uuid}
          mesh={mesh}
          onClick={() => {
            if (mesh.name.includes("bldg-22__HIT")) {
              onSelectBuilding?.("bldg-22");
            }
          }}
        />
      ))}
    </>
  );
}