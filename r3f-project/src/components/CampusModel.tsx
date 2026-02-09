// CampusModel.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Interactable } from "../interaction/Interactable";

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

  // Fix floor material
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

    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    const unlit = new THREE.MeshBasicMaterial({ map: tex });
    (unlit as any).toneMapped = false;

    floor.material = unlit;
    floor.material.needsUpdate = true;
    floor.position.y = -0.01;
    floor.position.z = 55;
    floor.renderOrder = 0;
    floor.material.depthWrite = false;
  }, [scene]);

  // Hide cameras and hitbox meshes from the GLB scene
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Camera).isCamera) {
        obj.visible = false;
      }

      if ((obj as THREE.Mesh).isMesh) {
        const name = obj.name;
        if (name.includes("__HIT") || name.includes("__HIIT")) {
          obj.visible = false;
          (obj as any).raycast = () => null;
        }
      }
    });
  }, [scene]);

  // Extract building ID from mesh name
  const getBuildingId = (meshName: string): string | null => {
    if (meshName.includes("bldg-22")) return "bldg-22";
    // Add more buildings here as needed
    // if (meshName.includes("bldg-23")) return "bldg-23";
    return null;
  };

  // Get display name for popup
  const getBuildingLabel = (meshName: string): string => {
    const id = getBuildingId(meshName);
    if (id === "bldg-22") return "Building 22";
    // Add more as needed
    return meshName.replace("__HIT", "").replace("__HIIT", "");
  };

  return (
    <>
      <primitive object={scene} />

      {hoverMeshes.map((mesh) => {
        const buildingId = getBuildingId(mesh.name);

        return (
          <Interactable
            key={mesh.uuid}
            isInteractive={!!buildingId}
            onClick={() => buildingId && onSelectBuilding?.(buildingId)}
            popupContent={getBuildingLabel(mesh.name)}
            popupOffset={[0, 1, 0]}
          >
            {(hovered) => (
              <group
                position={mesh.position}
                rotation={mesh.rotation}
                scale={mesh.scale}
              >
                {/* Base mesh */}
                <mesh geometry={mesh.geometry}>
                  <meshBasicMaterial
                    color={hovered ? "#ffb700" : "#888888"}
                    transparent
                    opacity={hovered ? 0.9 : 0.7}
                  />
                </mesh>

                {/* Outline on hover */}
                {hovered && (
                  <mesh
                    geometry={mesh.geometry}
                    scale={[1.06, 1.06, 1.06]}
                  >
                    <meshBasicMaterial
                      color="#ffb700"
                      side={THREE.BackSide}
                      depthWrite={false}
                    />
                  </mesh>
                )}
              </group>
            )}
          </Interactable>
        );
      })}
    </>
  );
}

useGLTF.preload("/models/campus.glb");