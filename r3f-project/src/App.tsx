// App.tsx
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useMemo, useCallback } from "react";
import { CampusModel } from "./components/CampusModel";

import { CameraController } from "./controllers/CameraController"
import { CAMERA_POSITIONS } from "./controllers/cameraPositions";
import type { ViewMode, Selection } from "./types/viewTypes";
import rawInventory from "./data/inventory.json";
import type { Inventory } from "../src/types/Inventory";
import type { InventoryApi } from "./types/InventoryApi";
import { mapInventory } from "./utils/mapInventory";
import { InventoryDropdown } from "./components/InventoryDropdown";
import companyLogo from "../src/assets/ccsoft_logo_opt.png"
import { Compass } from "./components/Compass";
import './index.css'
import './App.css' 
import { BuildingLoader } from "./components/BuildingLoader";

import { ImagePreview } from "./components/ImagePreview";
import {fitTopDownCameraToRect} from ".//controllers/cameraFit";

import { CameraDebug } from "./components/CameraDebug";

import { CanvasSizeReporter } from "./components/CanvasSizeReporter";
import {
  getBuildingConfig,
  getBuildingWorldCenter,
  getBayConfig,
  getBayWorldCenter,
  getBayWorldOrigin,
} from "./controllers/buildingConfigs";

type DynamicCamera = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [selection, setSelection] = useState<Selection>({});
  const [dynamicCamera, setDynamicCamera] = useState<DynamicCamera | null>(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);

  // ─────────────────────────────────────────────────
  // Camera config
  // ─────────────────────────────────────────────────
  const cameraConfig = useMemo(() => {
    const aspect = canvasSize.width / canvasSize.height;

    switch (viewMode) {
      case "campus":
        return { ...CAMERA_POSITIONS.campus, lookAt: undefined };

      case "building": {
        const center = getBuildingWorldCenter(selection.buildingId!);
        const cfg    = getBuildingConfig(selection.buildingId!);
        if (!center || !cfg) return { ...CAMERA_POSITIONS.campus, lookAt: undefined };
        return {
          ...fitTopDownCameraToRect({
            center,
            width:   cfg.size.width,
            length:  cfg.size.length,
            fovDeg:  22,
            aspect,
            padding: 1.15,
          }),
          lookAt: undefined,
        };
      }

      case "bay": {
        const center = getBayWorldCenter(selection.buildingId!, selection.bayId!);
        const bay    = getBayConfig(selection.buildingId!, selection.bayId!);
        if (!center || !bay) return { ...CAMERA_POSITIONS.campus, lookAt: undefined };
        return {
          ...fitTopDownCameraToRect({
            center,
            width:   bay.width,
            length:  bay.length,
            fovDeg:  30,
            aspect,
            padding: 1.15,
          }),
          lookAt: undefined,
        };
      }

      case "rack":
      case "slot":
        if (dynamicCamera) {
          return {
            position:  dynamicCamera.position,
            lookAt:    dynamicCamera.lookAt,
            rotation:  undefined,
            fov:       45,
          };
        }
        return { ...CAMERA_POSITIONS.rack, lookAt: undefined };

      default:
        return { ...CAMERA_POSITIONS.campus, lookAt: undefined };
    }
  }, [viewMode, selection, dynamicCamera, canvasSize]);

  const [rackCamera, setRackCamera] = useState<DynamicCamera | null>(null);

  const handleCameraUpdate = (config: DynamicCamera) => {
    setDynamicCamera(config);
    if (viewMode === "bay") setRackCamera(config);
  };

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
      case "slot":
        setViewMode("rack");
        setSelection({
          buildingId: selection.buildingId,
          bayId: selection.bayId,
          rackId: selection.rackId,
        });
        if (rackCamera) setDynamicCamera(rackCamera);
        break;
    }
  };

  // ─────────────────────────────────────────────────
  // Inventory
  // ─────────────────────────────────────────────────
  const inventoryItems: Inventory[] = useMemo(() => {
    const apiItems: InventoryApi[] = Array.isArray(rawInventory)
      ? (rawInventory as InventoryApi[])
      : [rawInventory as InventoryApi];
    return apiItems.map(mapInventory).filter((x) => x.ok);
  }, []);

  const [selectedSku, setSelectedSku] = useState<string>(
    inventoryItems[0]?.sku ?? ""
  );

  // ─────────────────────────────────────────────────
  // fillByLocation — binId → 0–1 fill fraction
  // ─────────────────────────────────────────────────
  const fillByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventoryItems) {
      if (!map.has(item.binId)) {
        map.set(item.binId, item.fullness / 100);
      }
    }
    return map;
  }, [inventoryItems]);

  // ─────────────────────────────────────────────────
  // itemsByLocation — binId → Inventory[]
  // All items that share a bin are grouped here so the
  // slot popup can list every SKU stored in that location.
  // ─────────────────────────────────────────────────
  const itemsByLocation = useMemo(() => {
    const map = new Map<string, Inventory[]>();
    for (const item of inventoryItems) {
      const existing = map.get(item.binId);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.binId, [item]);
      }
    }
    return map;
  }, [inventoryItems]);

  const selectedInventory = useMemo(
    () => inventoryItems.find((x) => x.sku === selectedSku),
    [inventoryItems, selectedSku]
  );

  return (
    <div className="mainContainer">
      {/* Left nav */}
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
                  <ImagePreview
                    src={selectedInventory.imageUrl}
                    alt={selectedInventory.skuPart}
                    modalTitle={selectedInventory.skuPart}
                  />
                ) : (
                  <div style={{ opacity: 0.7 }}>No item image.</div>
                )}

                {selectedInventory.rackImageUrl ? (
                  <ImagePreview
                    src={selectedInventory.rackImageUrl}
                    alt={selectedInventory.skuPart}
                    modalTitle={selectedInventory.skuPart}
                  />
                ) : (
                  <div style={{ opacity: 0.7 }}>No Rack image.</div>
                )}
                <div><b>Rack URL:</b> {selectedInventory.rackImageUrl ?? "(missing)"}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right — 3D canvas */}
      <div className="vizWindow">
        <Compass viewMode={viewMode} />

        {viewMode !== "campus" && (
          <button
            onClick={goBack}
            style={{
              position: "absolute",
              top: 20, left: 20, zIndex: 10,
              padding: "10px 16px", fontSize: "14px",
              borderRadius: "6px", border: "none",
              cursor: "pointer", background: "#111", color: "white",
            }}
          >
            ← Back
          </button>
        )}

        <div
          style={{
            position: "absolute",
            top: 20, right: 20, zIndex: 10,
            color: "#fff", background: "#333",
            padding: "8px 12px", borderRadius: "4px",
            fontFamily: "monospace", fontSize: "12px",
          }}
        >
          view: {viewMode}
          {selection.buildingId && ` | bldg: ${selection.buildingId}`}
          {selection.bayId && ` | bay: ${selection.bayId}`}
          {selection.rackId && ` | rack: ${selection.rackId}`}
        </div>

        <Canvas>
          <CanvasSizeReporter onSizeChange={handleCanvasSizeChange} />
          <CameraDebug enabled={true} />
          <CameraController
            position={cameraConfig.position}
            rotation={cameraConfig.rotation}
            lookAt={cameraConfig.lookAt}
            fov={cameraConfig.fov}
            smooth={1}
          />

          <ambientLight intensity={8.6} />
          <directionalLight position={[5, 10, 5]} intensity={3.2} />

          <Suspense fallback={null}>
            {!selection.buildingId && (
              <CampusModel
                onSelectBuilding={(id) => {
                  setSelection({ buildingId: id });
                  setViewMode("building");
                }}
              />
            )}

            {selection.buildingId && (
              <BuildingLoader
                buildingId={selection.buildingId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selection={selection}
                setSelection={setSelection}
                onCameraUpdate={handleCameraUpdate}
                fillByLocation={fillByLocation}
                itemsByLocation={itemsByLocation}   
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}