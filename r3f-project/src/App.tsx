// App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { CampusModel } from "./components/CampusModel";
import { Bldg22Model } from "./components/Bldg22Model"; // create this



export default function App() {
  const [scene, setScene] = useState<"campus" | "bldg22">("campus");


  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* 🔘 BACK BUTTON (HTML) */}
      {scene === "bldg22" && (
        <button
          onClick={() => setScene("campus")}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
            padding: "10px 16px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: "#111",
            color: "white",
          }}
        >
          ← Back to Campus
        </button>
      )}

      {/* 🎥 3D CANVAS */}
      <Canvas>
        <ambientLight intensity={8.6} />
        <directionalLight position={[5, 10, 5]} intensity={3.2} />
        <Suspense fallback={null}>
          {scene === "campus" && (
            <CampusModel
              onSelectBuilding={(id) => {
                if (id === "bldg-22") setScene("bldg22");
              }}
            />
          )}

          {scene === "bldg22" && <Bldg22Model />}
        </Suspense>
      </Canvas>
    </div>
  );
}