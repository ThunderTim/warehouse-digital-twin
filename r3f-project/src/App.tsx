// App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useMemo } from "react";
import { CampusModel } from "./components/CampusModel";
import { Bldg22Model } from "./components/Bldg22Model";
import { CameraController } from "./controllers/CameraController"
import { CAMERA_POSITIONS, getBayCamera } from "./controllers/cameraPositions";
import type { ViewMode, Selection } from "./types";

// Dynamic camera can use lookAt (for rack views) instead of rotation
type DynamicCamera = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [selection, setSelection] = useState<Selection>({});
  const [dynamicCamera, setDynamicCamera] = useState<DynamicCamera | null>(null);

  // ─────────────────────────────────────────────────
  // Calculate camera config based on viewMode + selection
  // ─────────────────────────────────────────────────
  const cameraConfig = useMemo(() => {
    switch (viewMode) {
      case "campus":
        return { ...CAMERA_POSITIONS.campus, lookAt: undefined };

      case "building":
        return { ...CAMERA_POSITIONS.building, lookAt: undefined };

      case "bay":
        if (selection.bayId) {
          return { ...getBayCamera(selection.bayId), lookAt: undefined };
        }
        return { ...CAMERA_POSITIONS.building, lookAt: undefined };

      case "rack":
      case "row":
      case "slot":
        // Use dynamic camera with lookAt
        if (dynamicCamera) {
          return {
            position: dynamicCamera.position,
            lookAt: dynamicCamera.lookAt,
            rotation: undefined,  // Use lookAt, not rotation
            fov: 45,
          };
        }
        return { ...CAMERA_POSITIONS.rack, lookAt: undefined };

      default:
        return { ...CAMERA_POSITIONS.campus, lookAt: undefined };
    }
  }, [viewMode, selection, dynamicCamera]);

  // Handle camera update from child components (rack selection)
  const handleCameraUpdate = (config: DynamicCamera) => {
    console.log("[App] camera update:", config);
    setDynamicCamera(config);
  };

  // Helper to go back one level
  const goBack = () => {
    switch (viewMode) {
      case "building":
        setViewMode("campus");
        setSelection({});
        setDynamicCamera(null);
        break;
      case "bay":
        setViewMode("building");
        setSelection({ buildingId: selection.buildingId });
        setDynamicCamera(null);
        break;
      case "rack":
        setViewMode("bay");
        setSelection({
          buildingId: selection.buildingId,
          bayId: selection.bayId,
        });
        setDynamicCamera(null);
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
      {/* Back button */}
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
          overflow: "visible",
        }}
      >
        view: {viewMode}
        {selection.buildingId && ` | bldg: ${selection.buildingId}`}
        {selection.bayId && ` | bay: ${selection.bayId}`}
        {selection.rackId && ` | rack: ${selection.rackId}`}
      </div>

      {/* 3D Canvas */}
      <Canvas>
        {/* Single camera controller for entire app */}
        <CameraController
          position={cameraConfig.position}
          rotation={cameraConfig.rotation}
          lookAt={cameraConfig.lookAt}
          fov={cameraConfig.fov}
          //near={cameraConfig.near}
          //far={cameraConfig.far}
        />

        <ambientLight intensity={8.6} />
        <directionalLight position={[5, 10, 5]} intensity={3.2} />

        <Suspense fallback={null}>
          {/* Campus scene */}
          {!selection.buildingId && (
            <CampusModel
              onSelectBuilding={(id) => {
                setSelection({ buildingId: id });
                setViewMode("building");
              }}
            />
          )}

          {/* Building scene */}
          {selection.buildingId && (
            <Bldg22Model
              viewMode={viewMode}
              setViewMode={setViewMode}
              selection={selection}
              setSelection={setSelection}
              onCameraUpdate={handleCameraUpdate}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}