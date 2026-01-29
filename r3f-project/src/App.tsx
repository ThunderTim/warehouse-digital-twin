//App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CampusModel } from "./components/CampusModel";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        <ambientLight intensity={6.6} />
        <directionalLight position={[5, 10, 5]} intensity={2.12} />

        <Suspense fallback={null}>
          <CampusModel url="/models/campus.glb" />
        </Suspense>
      </Canvas>
    </div>
  );
}
