import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";

import { Model, type SelectState } from "./components/Model";
import { UseGltfCamera } from "./components/UseGltfCamera";
import { CameraParallax } from "./components/CameraParallax";
import type { CameraBase } from "./components/cameraTypes";

export default function App() {
  const [select, setSelect] = useState<SelectState>({
    hoveredUuid: null,
    selectedUuid: null,
  });

  const camBaseRef = useRef<CameraBase | null>(null);

  

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        <Suspense fallback={null}>
          <UseGltfCamera
            url="/models/campus.glb"
            cameraName="CAM_START"
            lookName="CAM_LOOK"
            outRef={camBaseRef}
          />

          <CameraParallax baseRef={camBaseRef} strength={4} lerp={0.12} zPush={1.5} />
          <axesHelper args={[50]} />
          <gridHelper args={[500, 50]} />



          <Model url="/models/campus.glb" select={select} setSelect={setSelect} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
