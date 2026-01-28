import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export function DebugNodeNames({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    const names: string[] = [];
    scene.traverse((o) => {
      if (o.name) names.push(o.name);
    });
    console.log(
      "Nodes containing 'cam':",
      names.filter((n) => n.toLowerCase().includes("cam"))
    );
  }, [scene]);

  return null;
}
