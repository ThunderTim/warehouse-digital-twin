import { createContext, useContext, useMemo, ReactNode } from "react";
import {
  WarehouseData,
  SlotData,
  BayData,
  RackData,
  BuildingData,
  SlotFillState,
  getSlotFillState,
} from "../types/warehouse";
import warehouseData from "../data/warehouse-data.json";

// Indexed data structure for fast lookups
interface IndexedWarehouseData extends WarehouseData {
  // Indexed lookups
  slotById: Map<string, SlotData>;
  slotsByBay: Map<string, SlotData[]>;
  slotsByRack: Map<string, SlotData[]>; // key: "bayId-rackId"
  racksByBay: Map<string, RackData[]>;
}

interface DataContextValue {
  data: IndexedWarehouseData;
  
  // Helpers
  getBuilding: (id: string) => BuildingData | undefined;
  getBay: (id: string) => BayData | undefined;
  getRack: (bayId: string, rackId: string) => RackData | undefined;
  getSlot: (id: string) => SlotData | undefined;
  
  // List helpers
  getSlotsForBay: (bayId: string) => SlotData[];
  getSlotsForRack: (bayId: string, rackId: string) => SlotData[];
  getRacksForBay: (bayId: string) => RackData[];
  
  // State helpers
  getSlotFillState: (slot: SlotData) => SlotFillState;
  
  // Config
  filledThreshold: number;
}

const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const indexedData = useMemo<IndexedWarehouseData>(() => {
    const data = warehouseData as WarehouseData;
    
    // Build slot index by ID
    const slotById = new Map<string, SlotData>();
    data.slots.forEach((slot) => {
      slotById.set(slot.id, slot);
    });
    
    // Build slots grouped by bay
    const slotsByBay = new Map<string, SlotData[]>();
    data.slots.forEach((slot) => {
      const existing = slotsByBay.get(slot.bayId) || [];
      existing.push(slot);
      slotsByBay.set(slot.bayId, existing);
    });
    
    // Build slots grouped by rack (key: "bayId-rackId")
    const slotsByRack = new Map<string, SlotData[]>();
    data.slots.forEach((slot) => {
      const key = `${slot.bayId}-${slot.rackId}`;
      const existing = slotsByRack.get(key) || [];
      existing.push(slot);
      slotsByRack.set(key, existing);
    });
    
    // Build racks grouped by bay
    const racksByBay = new Map<string, RackData[]>();
    Object.values(data.racks).forEach((rack) => {
      const existing = racksByBay.get(rack.bayId) || [];
      existing.push(rack);
      racksByBay.set(rack.bayId, existing);
    });
    
    return {
      ...data,
      slotById,
      slotsByBay,
      slotsByRack,
      racksByBay,
    };
  }, []);
  
  const value = useMemo<DataContextValue>(() => ({
    data: indexedData,
    
    // Building lookup
    getBuilding: (id: string) => indexedData.buildings[id],
    
    // Bay lookup
    getBay: (id: string) => indexedData.bays[id],
    
    // Rack lookup
    getRack: (bayId: string, rackId: string) => {
      const rack = indexedData.racks[rackId];
      return rack?.bayId === bayId ? rack : undefined;
    },
    
    // Slot lookup
    getSlot: (id: string) => indexedData.slotById.get(id),
    
    // Get all slots for a bay
    getSlotsForBay: (bayId: string) => indexedData.slotsByBay.get(bayId) || [],
    
    // Get all slots for a specific rack
    getSlotsForRack: (bayId: string, rackId: string) => {
      const key = `${bayId}-${rackId}`;
      return indexedData.slotsByRack.get(key) || [];
    },
    
    // Get all racks for a bay
    getRacksForBay: (bayId: string) => indexedData.racksByBay.get(bayId) || [],
    
    // Get fill state for a slot
    getSlotFillState: (slot: SlotData) => 
      getSlotFillState(slot.fillPercent, indexedData.config.filledThreshold),
    
    // Config values
    filledThreshold: indexedData.config.filledThreshold,
  }), [indexedData]);
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook to access warehouse data
export function useWarehouseData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useWarehouseData must be used within a DataProvider");
  }
  return context;
}

// Convenience hooks for specific data
export function useBuilding(id: string): BuildingData | undefined {
  const { getBuilding } = useWarehouseData();
  return getBuilding(id);
}

export function useBay(id: string): BayData | undefined {
  const { getBay } = useWarehouseData();
  return getBay(id);
}

export function useSlot(id: string): SlotData | undefined {
  const { getSlot } = useWarehouseData();
  return getSlot(id);
}

export function useSlotsForRack(bayId: string, rackId: string): SlotData[] {
  const { getSlotsForRack } = useWarehouseData();
  return getSlotsForRack(bayId, rackId);
}

export function useRacksForBay(bayId: string): RackData[] {
  const { getRacksForBay } = useWarehouseData();
  return getRacksForBay(bayId);
}
