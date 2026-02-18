// CampusModel.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Interactable } from "../interaction/Interactable";


// Ready buildings list - add IDs as you finish them
const READY_BUILDINGS = new Set(["bldg-22", "bldg-00"]);



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
  const match = meshName.match(/bldg-(\d+)/);
  return match ? match[0] : null; // returns "bldg-22", "bldg-1217", etc.
};

    // Get display name for popup
  const getBuildingLabel = (meshName: string): string | null => {
  const match = meshName.match(/bldg-(\d+)/);
  return match ? `Building ${match[1]}` : null;
};

//Temporary values
const Items: string = '8,345';
const Today: string = new Date().toDateString(); // () to call it, returns string
const FullAmount: string = '43%';


  //Conditional Formatting inside the JSX
  const getBuildingPopup = (id: string) => (
    <div>
      <h3>{getBuildingLabel(id)}</h3>
      <p>{READY_BUILDINGS.has(id) ? "Click to explore" : "Coming soon"}</p>
      
      
      {id === "bldg-22" || id === "bldg-00" && (
        <>
          <p>Total Inventory: {Items}</p>
          <p>Last Update: {Today}</p>
          <p>Fill Level: {FullAmount}</p>
        </>
      )}
    </div>
  );

  

  
  return (
    <>
      <primitive object={scene} />

      {hoverMeshes.map((mesh) => {
        const buildingId = getBuildingId(mesh.name);

       return (
              <group
                key={mesh.uuid}
                position={mesh.position}
                rotation={mesh.rotation}
                scale={mesh.scale}
              >
                <Interactable
                  isInteractive={!!buildingId}
                  onClick={() => 
                            buildingId && READY_BUILDINGS.has(buildingId) && onSelectBuilding?.(buildingId)
                          }
                  //popupContent={getBuildingLabel(mesh.name)+"text field"}
                  popupContent={buildingId ? getBuildingPopup(buildingId) : null}
                  popupOffset={[0, 1, 0]}
                >
                  {(hovered) => (
                    <>
                      <mesh geometry={mesh.geometry}>
                        <meshBasicMaterial
                          color={hovered ? "#aaff00" : "#888888"}
                          transparent 
                          opacity={hovered ? 0.5 : 0.5}
                        />
                      </mesh>

                      {hovered && (
                        <mesh geometry={mesh.geometry} scale={[1.25, 1.25, 1.25]}>
                          <meshBasicMaterial
                            color="#f67316"
                             transparent 
                             opacity={ 0.5}
                            side={THREE.BackSide}
                            depthWrite={false}
                          />
                        </mesh>
                      )}
                    </>
                  )}
                </Interactable>
              </group>
            );
      })}
    </>
  );
}

useGLTF.preload("/models/campus.glb");