// Bldg22Model.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { HoverHit } from "../interaction/HoverHit";
import { Bay3WContents } from "../components/Bay3WContents";
import type { ViewMode, Selection } from "../types";

type GLTFResult = {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
};

type Props = {
  url?: string;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
};

export function Bldg22Model({
  url = "/models/bldg-22.glb",
  viewMode,
  setViewMode,
  selection,
  setSelection,
}: Props) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;

  // Derive __HIIT meshes 
  const hoverMeshes = useMemo(() => {
    return Object.values(nodes)
      .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
      .filter((m) => m.name.includes("__HIIT"))
      .filter((m) => !m.name.includes("__ORIG"));
  }, [nodes]);

  // Debug
  useEffect(() => {
    console.log("[Bldg22] viewMode:", viewMode);
    console.log("[Bldg22] selection:", selection);
    console.log("[Bldg22] __HIIT meshes:", hoverMeshes.map((m) => m.name));
  }, [viewMode, selection, hoverMeshes]);

  // Fix floor material (no camera setup here anymore!)
  useEffect(() => {
    const floor = scene.getObjectByName("building-22-map") as THREE.Mesh | null;
    if (!floor) return;

    const oldMat = floor.material;
    const srcMat = Array.isArray(oldMat) ? oldMat[0] : oldMat;
    const tex = (srcMat as any)?.map as THREE.Texture | undefined;
    
    if (!tex) {
      console.warn("building-22-map has no material.map texture");
      return;
    }

    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    const unlit = new THREE.MeshBasicMaterial({ map: tex });
    (unlit as any).toneMapped = false;

    floor.material = unlit;
    floor.material.needsUpdate = true;
  }, [scene]);

  // Hide GLB helper meshes and cameras
  useEffect(() => {
    scene.traverse((obj) => {
      // Hide cameras (we're using our own)
      if ((obj as THREE.Camera).isCamera) {
        obj.visible = false;
      }

      if (!(obj as any).isMesh) return;

      // __ORIG: always invisible
      if (obj.name.includes("__ORIG")) {
        obj.visible = false;
        (obj as any).raycast = () => null;
      }

      // __HIIT / __HIT: hide originals 
      if (obj.name.includes("__HIIT") || obj.name.includes("__HIT")) {
        obj.visible = false;
        (obj as any).raycast = () => null;
      }
    });
  }, [scene]);

  // Get bay node
  const bay = useMemo(() => {
    return (nodes?.["BAY_3W__ORIG"] as THREE.Object3D | undefined)
      ?? scene.getObjectByName("BAY_3W__ORIG")
      ?? null;
  }, [nodes, scene]);

  const bayTransform = useMemo(() => {
    if (!bay) return null;
    return {
      position: bay.position,
      rotation: bay.rotation,
    };
  }, [bay]);

  // Handle clicks based on viewMode
  const handleHitClick = (mesh: THREE.Mesh) => {
    const meshName = mesh.name;
    console.log("[Bldg22] clicked:", meshName, "at viewMode:", viewMode);

    if (viewMode === "building") {
      const bayId = meshName.replace("__HIIT", "").replace("__HIT", "");
      setSelection({ ...selection, bayId });
      setViewMode("bay");
      return;
    }

    if (viewMode === "bay") {
      const rackId = meshName.replace("__HIIT", "").replace("__HIT", "");
      setSelection({ ...selection, rackId });
      setViewMode("rack");
      return;
    }
  };

  return (
    <>
      <primitive object={scene} />

      {/* Bay/Rack hover targets */}
      {hoverMeshes.map((mesh) => (
        <HoverHit
          key={mesh.uuid}
          mesh={mesh}
          color="#ffd400"
          opacity={0.22}
          isInteractive={viewMode === "building"}
          onClick={() => handleHitClick(mesh)}
        />
      ))}

      {/* Bay contents */}
      {bayTransform && (
        <Bay3WContents 
          bayTransform={bayTransform}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selection={selection}
          setSelection={setSelection}
        />
      )}
    </>
  );
}

useGLTF.preload("/models/bldg-22.glb");