import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { useWarehouseData } from "./DataContext";

// View levels in drill-down order
export type ViewLevel = "campus" | "building" | "bay" | "rack";

// Camera modes
export type CameraMode = "topDown" | "isometric" | "front";

// Current view state
export interface ViewState {
  level: ViewLevel;
  targetId: string | null;
  cameraMode: CameraMode;
  highlightedSlotId?: string; // For direct slot navigation
}

// Navigation context value
interface NavigationContextValue {
  // Current state
  current: ViewState;
  history: ViewState[];
  
  // Navigation actions
  navigate: (level: ViewLevel, targetId: string | null) => void;
  goBack: () => void;
  goToRoot: () => void;
  
  // Direct slot navigation
  jumpToSlot: (slotId: string) => void;
  clearHighlight: () => void;
  
  // Camera mode
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  
  // Computed helpers
  canGoBack: boolean;
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  level: ViewLevel;
  targetId: string | null;
  label: string;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// Initial state
const INITIAL_STATE: ViewState = {
  level: "campus",
  targetId: null,
  cameraMode: "topDown",
};

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [current, setCurrent] = useState<ViewState>(INITIAL_STATE);
  const [history, setHistory] = useState<ViewState[]>([]);
  
  const { data, getBuilding, getBay, getSlot } = useWarehouseData();
  
  // Navigate to a specific view
  const navigate = useCallback((level: ViewLevel, targetId: string | null) => {
    setCurrent((prev) => {
      // Push current state to history
      setHistory((h) => [...h, prev]);
      
      // Determine appropriate camera mode for the level
      let cameraMode: CameraMode = prev.cameraMode;
      if (level === "campus" || level === "building") {
        cameraMode = "topDown";
      } else if (level === "rack") {
        cameraMode = "isometric";
      }
      
      return {
        level,
        targetId,
        cameraMode,
        highlightedSlotId: undefined,
      };
    });
  }, []);
  
  // Go back one level
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      
      const newHistory = [...prev];
      const previousState = newHistory.pop()!;
      
      setCurrent(previousState);
      return newHistory;
    });
  }, []);
  
  // Go back to campus view
  const goToRoot = useCallback(() => {
    setCurrent(INITIAL_STATE);
    setHistory([]);
  }, []);
  
  // Jump directly to a slot
  const jumpToSlot = useCallback((slotId: string) => {
    const slot = getSlot(slotId);
    if (!slot) {
      console.warn(`Slot not found: ${slotId}`);
      return;
    }
    
    // Save current state to history
    setHistory((h) => [...h, current]);
    
    // Navigate to rack view with slot highlighted
    setCurrent({
      level: "rack",
      targetId: slot.rackId,
      cameraMode: "isometric",
      highlightedSlotId: slotId,
    });
  }, [current, getSlot]);
  
  // Clear highlighted slot
  const clearHighlight = useCallback(() => {
    setCurrent((prev) => ({
      ...prev,
      highlightedSlotId: undefined,
    }));
  }, []);
  
  // Set camera mode
  const setCameraMode = useCallback((mode: CameraMode) => {
    setCurrent((prev) => ({ ...prev, cameraMode: mode }));
  }, []);
  
  // Toggle between topDown and isometric
  const toggleCameraMode = useCallback(() => {
    setCurrent((prev) => ({
      ...prev,
      cameraMode: prev.cameraMode === "topDown" ? "isometric" : "topDown",
    }));
  }, []);
  
  // Build breadcrumb trail
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const crumbs: BreadcrumbItem[] = [
      { level: "campus", targetId: null, label: data.campus.name },
    ];
    
    if (current.level === "campus") return crumbs;
    
    // Find building from current path
    // For now, assume we're in bldg-22 (we can enhance this later)
    const buildingId = "bldg-22";
    const building = getBuilding(buildingId);
    if (building) {
      crumbs.push({
        level: "building",
        targetId: buildingId,
        label: building.name,
      });
    }
    
    if (current.level === "building") return crumbs;
    
    // Get bay info - targetId at bay level is the bayId
    if (current.level === "bay" || current.level === "rack") {
      // For rack level, we need to look up the bay from history or slot data
      let bayId: string | null = null;
      
      if (current.level === "bay") {
        bayId = current.targetId;
      } else {
        // At rack level, find bay from history or use highlighted slot
        const bayState = history.find((h) => h.level === "bay");
        if (bayState) {
          bayId = bayState.targetId;
        } else if (current.highlightedSlotId) {
          const slot = getSlot(current.highlightedSlotId);
          bayId = slot?.bayId || null;
        }
      }
      
      if (bayId) {
        const bay = getBay(bayId);
        if (bay) {
          crumbs.push({
            level: "bay",
            targetId: bayId,
            label: bay.name,
          });
        }
      }
    }
    
    if (current.level === "rack" && current.targetId) {
      crumbs.push({
        level: "rack",
        targetId: current.targetId,
        label: `Rack ${current.targetId}`,
      });
    }
    
    return crumbs;
  }, [current, history, data, getBuilding, getBay, getSlot]);
  
  const value = useMemo<NavigationContextValue>(() => ({
    current,
    history,
    navigate,
    goBack,
    goToRoot,
    jumpToSlot,
    clearHighlight,
    setCameraMode,
    toggleCameraMode,
    canGoBack: history.length > 0,
    breadcrumbs,
  }), [
    current,
    history,
    navigate,
    goBack,
    goToRoot,
    jumpToSlot,
    clearHighlight,
    setCameraMode,
    toggleCameraMode,
    breadcrumbs,
  ]);
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to access navigation
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

// Convenience hook for current view level
export function useCurrentView(): ViewState {
  const { current } = useNavigation();
  return current;
}

// Convenience hook for checking specific view level
export function useIsViewLevel(level: ViewLevel): boolean {
  const { current } = useNavigation();
  return current.level === level;
}
