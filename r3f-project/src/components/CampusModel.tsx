import * as THREE from "three";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Hoverable } from "../interaction/Hoverable";

type GLTFResult = {
  scene: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
};

export function Campus({ url = "/models/campus.glb" }: { url?: string }) {
  const { scene, nodes } = useGLTF(url) as unknown as GLTFResult;



  // All meshes with "__HIT" get turned into hoverable
  const hoverMeshes = Object.values(nodes)
    .filter((o) => (o as THREE.Mesh).isMesh)
    .map((o) => o as THREE.Mesh)
    .filter(
      (m) =>
        m.name.includes("__HIT") ||
        m.name.includes("__HIIT")
    );



  return (
    <>
      <primitive object={scene} />

      {/*. Add Acamera to the scene */}
      <PerspectiveCamera position={[-4.78, 677.55, 84.71]} rotation={[-1.5009831567151237, 0, 0]} makeDefault={true} manual={true} />

      {/*execute hover function*/}
      {hoverMeshes.map((mesh) => (
        <Hoverable key={mesh.uuid} mesh={mesh} />
      ))}

    </>
  );
}


useGLTF.preload("/models/campus.glb");
