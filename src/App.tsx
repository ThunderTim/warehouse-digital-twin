import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { DataProvider, NavigationProvider, useWarehouseData, useNavigation } from "./context";
import { runStartupDiagnostics, DiagnosticResult } from "./utils";
import warehouseData from "./data/warehouse-data.json";
import { WarehouseData } from "./types";
import "./App.css";

// Main scene component (will switch based on navigation)
function Scene() {
  const { current } = useNavigation();
  const { data } = useWarehouseData();
  
  return (
    <>
      {/* Temporary: display current view level */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={
          current.level === "campus" ? "green" :
          current.level === "building" ? "blue" :
          current.level === "bay" ? "orange" : "red"
        } />
      </mesh>
      
      {/* Basic lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </>
  );
}

// Debug UI overlay
function DebugUI() {
  const { current, breadcrumbs, navigate, goBack, canGoBack } = useNavigation();
  const { data } = useWarehouseData();
  
  return (
    <div className="debug-ui">
      <div className="debug-panel">
        <h3>Navigation Debug</h3>
        <p><strong>Level:</strong> {current.level}</p>
        <p><strong>Target:</strong> {current.targetId || "(none)"}</p>
        <p><strong>Camera:</strong> {current.cameraMode}</p>
        {current.highlightedSlotId && (
          <p><strong>Highlighted:</strong> {current.highlightedSlotId}</p>
        )}
        
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.level}>
              {i > 0 && " > "}
              <button 
                onClick={() => navigate(crumb.level, crumb.targetId)}
                className={crumb.level === current.level ? "active" : ""}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
        
        <div className="debug-actions">
          <button onClick={goBack} disabled={!canGoBack}>
            ← Back
          </button>
          
          {current.level === "campus" && (
            <button onClick={() => navigate("building", "bldg-22")}>
              → Building 22
            </button>
          )}
          
          {current.level === "building" && (
            <button onClick={() => navigate("bay", "3W")}>
              → Bay 3W
            </button>
          )}
          
          {current.level === "bay" && (
            <button onClick={() => navigate("rack", "18")}>
              → Rack 18
            </button>
          )}
        </div>
        
        <div className="debug-stats">
          <h4>Data Stats</h4>
          <p>Buildings: {Object.keys(data.buildings).length}</p>
          <p>Bays: {Object.keys(data.bays).length}</p>
          <p>Racks: {Object.keys(data.racks).length}</p>
          <p>Slots: {data.slots.length}</p>
        </div>
      </div>
    </div>
  );
}

// Error display component
function ErrorDisplay({ result }: { result: DiagnosticResult }) {
  return (
    <div className="error-overlay">
      <div className="error-panel">
        <h2>⚠️ Startup Validation Failed</h2>
        <p>Fix the following errors before proceeding:</p>
        <ul>
          {result.errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
        {result.warnings.length > 0 && (
          <>
            <h3>Warnings:</h3>
            <ul>
              {result.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// App content (inside providers)
function AppContent() {
  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 5, 5], fov: 50 }}
        style={{ background: "#1a1a2e" }}
      >
        <Scene />
      </Canvas>
      <DebugUI />
    </div>
  );
}

// Main App with providers and validation
function App() {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  
  // Run diagnostics on mount
  useEffect(() => {
    const result = runStartupDiagnostics(warehouseData as WarehouseData);
    setDiagnosticResult(result);
  }, []);
  
  // Show loading while validating
  if (!diagnosticResult) {
    return <div className="loading">Validating data...</div>;
  }
  
  // Show errors if validation failed
  if (!diagnosticResult.valid) {
    return <ErrorDisplay result={diagnosticResult} />;
  }
  
  // Render app with providers
  return (
    <DataProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </DataProvider>
  );
}

export default App;
