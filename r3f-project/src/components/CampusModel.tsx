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

  // Derive hover meshes (hitboxes)
  const hoverMeshes = useMemo(() => {
    return Object.values(nodes)
      .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
      .filter((m) => m.name.includes("__HIT") || m.name.includes("__HIIT"));
  }, [nodes]);

  // Fix floor material (separate from camera logic!)
  useEffect(() => {
    const floor = scene.getObjectByName("floor-map") as THREE.Mesh | null;
    if (!floor) {
      console.warn("[CampusModel] floor-map not found");
      return;
    }

    const oldMat = floor.material;
    const srcMat = Array.isArray(oldMat) ? oldMat[0] : oldMat;
    const tex = (srcMat as any)?.map as THREE.Texture | undefined;

    if (!tex) {
      console.warn("[CampusModel] floor-map has no material.map texture");
      return;
    }

    // Make the texture display correctly
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    // Unlit material (ignores lights)
    const unlit = new THREE.MeshBasicMaterial({ map: tex });
    (unlit as any).toneMapped = false;

    floor.material = unlit;
    floor.material.needsUpdate = true;

    // Move floor slightly down to avoid z-fighting
    floor.position.y = -.01;
    floor.position.z = 55;

    // Render floor first
    floor.renderOrder = 0;
    floor.material.depthWrite = false;
  }, [scene]);

  // Hide cameras and hitbox meshes from the GLB scene
  // (we render hitboxes separately via Hoverable)
  useEffect(() => {
    scene.traverse((obj) => {
      // Hide any cameras in the GLB (we use our own)
      if ((obj as THREE.Camera).isCamera) {
        obj.visible = false;
      }

      // Hide hitbox meshes (we render them via Hoverable)
      if ((obj as THREE.Mesh).isMesh) {
        const name = obj.name;
        if (name.includes("__HIT") || name.includes("__HIIT")) {
          obj.visible = false;
          (obj as any).raycast = () => null; // Disable raycasting on original
        }
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
    renderBase={true}
    popupContent={mesh.name.replace("__HIT", "").replace("__HIIT", "")}
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

useGLTF.preload("/models/campus.glb");