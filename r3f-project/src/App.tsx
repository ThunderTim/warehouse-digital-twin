// App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { CampusModel } from "./components/CampusModel";
import { Bldg22Model } from "./components/Bldg22Model";
import type { ViewMode, Selection } from "./types";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [selection, setSelection] = useState<Selection>({});

  // Helper to go back one level
  const goBack = () => {
    switch (viewMode) {
      case "building":
        setViewMode("campus");
        setSelection({});
        break;
      case "bay":
        setViewMode("building");
        setSelection({ buildingId: selection.buildingId });
        break;
      case "rack":
        setViewMode("bay");
        setSelection({ 
          buildingId: selection.buildingId, 
          bayId: selection.bayId 
        });
        break;
      case "row":
        setViewMode("rack");
        setSelection({ 
          buildingId: selection.buildingId,
          bayId: selection.bayId,
          rackId: selection.rackId,
        });
        break;
      case "slot":
        setViewMode("row");
        setSelection({
          buildingId: selection.buildingId,
          bayId: selection.bayId,
          rackId: selection.rackId,
          rowId: selection.rowId,
        });
        break;
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* Back button - shown when not at campus level */}
      {viewMode !== "campus" && (
        <button
          onClick={goBack}
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
          ← Back
        </button>
      )}

      {/* Debug: Current view indicator */}
      <div 
        style={{ 
          position: "absolute", 
          top: 20, 
          right: 20, 
          zIndex: 10, 
          color: "#fff", 
          background: "#333", 
          padding: "8px 12px", 
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
      >
        view: {viewMode}
        {selection.buildingId && ` | bldg: ${selection.buildingId}`}
        {selection.bayId && ` | bay: ${selection.bayId}`}
        {selection.rackId && ` | rack: ${selection.rackId}`}
      </div>

      {/* 3D Canvas */}
      <Canvas>
        <ambientLight intensity={8.6} />
        <directionalLight position={[5, 10, 5]} intensity={3.2} />
        <Suspense fallback={null}>
          
          {/* Campus scene - show when no building selected */}
          {!selection.buildingId && (
            <CampusModel
              onSelectBuilding={(id) => {
                setSelection({ buildingId: id });
                setViewMode("building");
              }}
            />
          )}

          {/* Building scene - show when building is selected */}
          {selection.buildingId && (
            <Bldg22Model
              viewMode={viewMode}
              setViewMode={setViewMode}
              selection={selection}
              setSelection={setSelection}
            />
          )}
          
        </Suspense>
      </Canvas>
    </div>
  );
}