// Bldg22Model.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { HoverHit } from "../interaction/HoverHit";
import { Bay3WContents } from "../components/Bay3WContents";
import { CameraController } from "../controllers/CameraController"
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

// =====================================================
// 📷 CAMERA POSITIONS - EDIT THESE!
// =====================================================
// position = [x, y, z] where the camera sits
// rotation = [x, y, z] Euler angles in RADIANS

const CAMERA_POSITIONS: Record<ViewMode, {
  position: [number, number, number];
  rotation: [number, number, number];
  fov: number;
}> = {
  // here X, Z, Y from c4d values 
  campus: {
    position: [0, 300, 0],
    rotation: [-1.57, 0, 0],
    fov: 22,
  },
  building: { 
    // should se all bays
    position: [13.5, 1033, 90],
    rotation: [-1.530, 0, 0],
    fov: 22,
  },
  bay: {
    position: [99.75, 200, -49.95],
    rotation: [-1.5009831567151237, 0, 0],
    fov: 30,
  },
  rack: {
    // TODO: Enter rack camera values
    position: [80, 25, -40],
    rotation: [-0.8, 0, 0],
    fov: 40,
  },
  row: {
    // TODO: Enter row camera values
    position: [85, 15, -45],
    rotation: [-0.6, 0, 0],
    fov: 45,
  },
  slot: {
    // TODO: Enter slot camera values
    position: [90, 10, -50],
    rotation: [-0.4, 0, 0],
    fov: 50,
  },
};
// =====================================================

export function Bldg22Model({
  url = "/models/bldg-22.glb",
  viewMode,
  setViewMode,
  selection,
  setSelection,
}: Props) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;
  const { set, size } = useThree();

  // Get camera config for current viewMode
  const cameraConfig = useMemo(() => {
    const config = CAMERA_POSITIONS[viewMode];
    console.log("[Camera] viewMode:", viewMode, "config:", config);
    return config;
  }, [viewMode, selection]);

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
  }, [viewMode, selection]);

  // Initial camera setup + floor material
  useEffect(() => {
    const cam = scene.getObjectByName("CAM_START") as THREE.PerspectiveCamera | null;
    if (cam) {
      set({ camera: cam });
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();
    }

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
  }, [scene, set, size.width, size.height]);

  // Hide GLB helper meshes
  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as any).isMesh) return;

      if (obj.name.includes("__ORIG")) {
        obj.visible = false;
        (obj as any).raycast = () => null;
      }

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

      {/* 📷 Camera Controller - moves based on viewMode */}
      <CameraController
        position={cameraConfig.position}
        rotation={cameraConfig.rotation}
        fov={cameraConfig.fov}
      />

      {/* Bay/Rack hover targets */}
      {hoverMeshes.map((mesh) => (
        <HoverHit
          key={mesh.uuid}
          mesh={mesh}
          color="#ffd400"
          opacity={0.22}
          isInteractive={viewMode === "building" || viewMode === "bay"}
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