// Bldg22Model.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Interactable } from "../interaction/Interactable";
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
  onCameraUpdate?: (config: { position: [number, number, number]; lookAt: [number, number, number] }) => void;
};

export function Bldg22Model({
  url = "/models/bldg-22.glb",
  viewMode,
  setViewMode,
  selection,
  setSelection,
  onCameraUpdate,
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

  // Fix floor material
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
      if ((obj as THREE.Camera).isCamera) {
        obj.visible = false;
      }

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

  // Handle bay click
  const handleBayClick = (meshName: string) => {
    console.log("[Bldg22] clicked:", meshName, "at viewMode:", viewMode);
    const bayId = meshName.replace("__HIIT", "").replace("__HIT", "");
    setSelection({ ...selection, bayId });
    setViewMode("bay");
  };

  // Get bay label for popup
  const getBayLabel = (meshName: string): string => {
    return meshName.replace("__HIIT", "").replace("__HIT", "").replace("_", " ");
  };

  // Check if bays should be interactive
  const baysAreInteractive = viewMode === "building";

  return (
  <>
    <primitive object={scene} />

    {/* Bay hover targets - only interactive at building level */}
    {hoverMeshes.map((mesh) => (
      <group
        key={mesh.uuid}
        position={mesh.position}
        rotation={mesh.rotation}
        scale={mesh.scale}
      >
        <Interactable
          isInteractive={baysAreInteractive}
          popupMode="hover"
          popupOffset={[0, 1, 0]}
          onClick={() => handleBayClick(mesh.name)}
          popupContent={
            <div>
              <h3>{getBayLabel(mesh.name)}</h3>
              <p>Bay info here</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("button clicked - open image view popup");
                }}
              >
                View Images
              </button>
            </div>
          }
        >
          {(hovered) => (
            <>
              {/* Invisible hit target (always present for raycasting) */}
              <mesh geometry={mesh.geometry}>
                <meshBasicMaterial
                  transparent
                  opacity={0}
                  depthWrite={false}
                />
              </mesh>

              {/* Highlight on hover */}
              {hovered && baysAreInteractive && (
                <mesh
                  geometry={mesh.geometry}
                  position={[0, 0, 0.001]}
                  renderOrder={50}
                >
                  <meshBasicMaterial
                    color="#ffd400"
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </>
          )}
        </Interactable>
      </group>
    ))}

    {/* Bay contents */}
    {bayTransform && (
      <Bay3WContents
        bayTransform={bayTransform}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selection={selection}
        setSelection={setSelection}
        onCameraUpdate={onCameraUpdate}
      />
    )}
  </>
);
}

useGLTF.preload("/models/bldg-22.glb");