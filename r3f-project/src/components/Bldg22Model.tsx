//BldgModel.tsx
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { HoverHit } from "../interaction/HoverHit";
import { Bay3WContents } from "../components/Bay3WContents";


type GLTFResult = {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
};

export function Bldg22Model({
  url = "/models/bldg-22.glb",
}: {
  url?: string;
}) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;
  const { set, size } = useThree();

  // ✅ derive __HIIT meshes 
  const hoverMeshes = useMemo(() => {
    return Object.values(nodes)
      .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
      .filter((m) => m.name.includes("__HIIT"))
      .filter((m) => !m.name.includes("__ORIG"));
  }, [nodes]);

  //  debug  clicks
  useEffect(() => {
    console.log("[Bldg22] __HIIT meshes:", hoverMeshes.map((m) => m.name));
  }, [hoverMeshes]);

  // camera + floor logic
  useEffect(() => {
    const cam = scene.getObjectByName("CAM_START") as THREE.PerspectiveCamera | null;
    if (!cam) return;

    set({ camera: cam });

    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();

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

  // hide GLB helper meshes so only our React-driven hit/highlight meshes exist
  useEffect(() => {
    scene.traverse((obj) => {
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

  //GET BAY NODE name it bay
  const bay = useMemo(() => {
    return (nodes?.["BAY_3W__ORIG"] as THREE.Object3D | undefined)
      ?? scene.getObjectByName("BAY_3W__ORIG")
      ?? null;
  }, [nodes, scene]);

  //Create a transform position for bay
  const bayTransform = useMemo(() => {
    if (!bay) return null;
    return {
      position: bay.position,
      rotation: bay.rotation,

    };
  }, [bay]);


  return (
    <>
      <primitive object={scene} />

      {hoverMeshes.map((mesh) => (
        <HoverHit
          key={mesh.uuid}
          mesh={mesh}
          color="#ffd400"
          opacity={0.22}
          onClick={() => console.log("clicked", mesh.name)}
        />
      ))}
      <perspectiveCamera position={[97.25, 116.61, -55.9]} rotation={[-1.5009831567151237, 0, 0]} fov={22} />

      {bayTransform && <Bay3WContents bayTransform={bayTransform} />}



    </>
  );
}

useGLTF.preload("/models/bldg-22.glb");
