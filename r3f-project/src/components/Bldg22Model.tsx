//Bldg22Model.tsx

import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { HoverHit } from "../interaction/HoverHit";




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
    
      
    
      // ✅ derive hover meshes (not a side-effect)
      const hoverMeshes = useMemo(() => {
        return Object.values(nodes)
            .filter((o): o is THREE.Mesh => (o as THREE.Mesh).isMesh)
            .filter((m) => (m.name.includes("__HIT") || m.name.includes("__HIIT")))
            .filter((m) => !m.name.includes("__ORIG"));
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
        
        
      const floor = scene.getObjectByName("building-22-map") as THREE.Mesh | null;
      if (!floor) return;
    
      const oldMat = floor.material;
      const srcMat = Array.isArray(oldMat) ? oldMat[0] : oldMat;
    
      const tex = (srcMat as any)?.map as THREE.Texture | undefined;
      if (!tex) {
        console.warn("building-22-map has no material.map texture");
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

      useEffect(() => {
        scene.traverse((obj) => {
            if ((obj as any).isMesh) {
            if (obj.name.includes("__HIIT") || obj.name.includes("__HIT")) {
  const m = obj as THREE.Mesh;

  // keep it raycastable, but invisible
  const invisible = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  // handle multi-material meshes
  m.material = Array.isArray(m.material)
    ? m.material.map(() => invisible)
    : invisible;
}

if (obj.name.includes("__ORIG")) {
  // ORIG: not rendered AND never raycastable
  obj.visible = false;
  (obj as any).raycast = () => null;
}


            }
        });
        }, [scene]);


return (
    <>
      <primitive object={scene} />
      
      

      {hoverMeshes.map((mesh) => (
            <HoverHit
                key={mesh.uuid}
                mesh={mesh}
                outlineScale={1.10}
                fillOpacity={0.14}
                onClick={() => console.log("clicked", mesh.name)}
            />
            ))}
    </>
  );
}



useGLTF.preload("/models/bldg-22.glb");
