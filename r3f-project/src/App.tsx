// App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useMemo } from "react";
import { CampusModel } from "./components/CampusModel";
import { Bldg22Model } from "./components/Bldg22Model";
import { CameraController } from "./controllers/CameraController"
import { CAMERA_POSITIONS, getBayCamera } from "./controllers/cameraPositions";
import type { ViewMode, Selection } from "./types/viewTypes";
import rawInventory from "./data/inventory.json";
import type { Inventory } from "../src/types/Inventory";
import type { InventoryApi } from "../src/types/InventoryAPI"; // note: InventoryAPI.ts file
import { mapInventory } from "./utils/mapInventory";
import { InventoryDropdown } from "./components/InventoryDropdown";
import companyLogo from "../src/assets/ccsoft_logo_opt.png"
import { Compass } from "./components/Compass";
import './index.css'
import './App.css' 





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

    // ─────────────────────────────────────────────────
  // Inventory (mocked from local JSON for now)
  // ─────────────────────────────────────────────────
  const inventoryItems: Inventory[] = useMemo(() => {
    const apiItems: InventoryApi[] = Array.isArray(rawInventory)
      ? (rawInventory as InventoryApi[])
      : [rawInventory as InventoryApi];

    // Map + keep successes (you can decide later if you want to show errors in UI)
    return apiItems.map(mapInventory).filter((x) => x.ok);
  }, []);

  const [selectedSku, setSelectedSku] = useState<string>(
    inventoryItems[0]?.sku ?? ""
  );

  const selectedInventory = useMemo(
    () => inventoryItems.find((x) => x.sku === selectedSku),
    [inventoryItems, selectedSku]
  );


  

  return (
    <div className="mainContainer">
          {/* Left -Temp Menu */}
          <div className="leftNav">
          <img src={companyLogo} alt="Description of my image" />
          <p>Warehouse Visualization Demo</p>


  {inventoryItems.length === 0 ? (
    <div style={{ fontSize: 12, opacity: 0.8 }}>
      No inventory items loaded.
    </div>
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      <InventoryDropdown
        items={inventoryItems}
        selectedSku={selectedSku}
        onChangeSku={setSelectedSku}
      />

      {selectedInventory && (
        <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <div><b>SKU:</b> {selectedInventory.sku}</div>
          <div><b>Part:</b> {selectedInventory.skuPart}</div>
          <div><b>Bin:</b> {selectedInventory.binId}</div>
          <div><b>Qty:</b> {selectedInventory.availableQty}</div>
          <div>
            <b>Item (W×D×H):</b>{" "}
            {selectedInventory.item.width}×{selectedInventory.item.depth}×{selectedInventory.item.height}
          </div>

          {selectedInventory.imageUrl ? (
            <img
              src={selectedInventory.imageUrl}
              alt={selectedInventory.skuPart}
              style={{ width: "100%", maxWidth: 240, borderRadius: 8 }}
            />
          ) : (
            <div style={{ opacity: 0.7 }}>No image.</div>
          )}
        </div>
      )}
    </div>
  )}
</div>

          {/* Right Warehouse Visualization */}
      
            <div className="vizWindow">
              <Compass viewMode={viewMode} />
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
                    smooth={1}
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

    </div>
    
  );
}