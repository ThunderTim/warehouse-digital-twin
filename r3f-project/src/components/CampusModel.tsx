import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Hoverable } from "../interaction/Hoverable";
import { useLayoutEffect } from "react";



type GLTFResult = {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
};

export function CampusModel({ url = "/models/campus.glb" }: { url?: string }) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;
  const { set, size } = useThree();

  

  // ✅ derive hover meshes (not a side-effect)
  const hoverMeshes = useMemo(() => {
    return Object.values(nodes)
      .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
      .filter((m) => m.name.includes("__HIT") || m.name.includes("__HIIT"));
  }, [nodes]);

  // ✅ side-effect: set camera once after load
  useEffect(() => {
    const cam = scene.getObjectByName("CAM_START") as THREE.PerspectiveCamera | null;
  if (!cam) return;

  // make active
  set({ camera: cam });

  // ✅ fix initial warp
  cam.aspect = size.width / size.height;
  cam.updateProjectionMatrix();
    
    
    const floor = scene.getObjectByName("floor-map") as THREE.Mesh | null;
  if (!floor) return;

  const oldMat = floor.material;
  const srcMat = Array.isArray(oldMat) ? oldMat[0] : oldMat;

  const tex = (srcMat as any)?.map as THREE.Texture | undefined;
  if (!tex) {
    console.warn("floor-map has no material.map texture");
    return;
  }

  // ✅ Make the texture display correctly
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  // ✅ Unlit material (ignores lights)
  const unlit = new THREE.MeshBasicMaterial({ map: tex });

  // ✅ Avoid renderer tone-mapping affecting it (keeps true whites/blacks)
  (unlit as any).toneMapped = false;

  floor.material = unlit;
  floor.material.needsUpdate = true;


  }, [scene, set, size.width, size.height]);

  return (
    <>
      <primitive object={scene} />
      
      

      {hoverMeshes.map((mesh) => (
        <Hoverable
          key={mesh.uuid}
          mesh={mesh}
          onClick={() => console.log("clicked", mesh.name)}
        />

        
      ))}
    </>
  );
}
