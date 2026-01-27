import { WarehouseData } from "../types/warehouse";
import { Scene } from "three";

export interface DiagnosticResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    buildings: number;
    bays: number;
    racks: number;
    slots: number;
    filledSlots: number;
    availableSlots: number;
    emptySlots: number;
  };
}

/**
 * Validate warehouse data structure and references
 * Call this on app startup before rendering
 */
export function validateWarehouseData(data: WarehouseData): DiagnosticResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Campus → Building references
  for (const buildingId of data.campus.buildings) {
    if (!data.buildings[buildingId]) {
      errors.push(`Campus references missing building: ${buildingId}`);
    }
  }
  
  // 2. Building → Bay references
  for (const [buildingId, building] of Object.entries(data.buildings)) {
    for (const bayId of building.bays) {
      if (!data.bays[bayId]) {
        errors.push(`Building ${buildingId} references missing bay: ${bayId}`);
      }
    }
  }
  
  // 3. Bay → Rack references
  for (const [bayId, bay] of Object.entries(data.bays)) {
    for (const rackId of bay.racks) {
      if (!data.racks[rackId]) {
        errors.push(`Bay ${bayId} references missing rack: ${rackId}`);
      } else if (data.racks[rackId].bayId !== bayId) {
        errors.push(`Rack ${rackId} bayId mismatch: expected ${bayId}, got ${data.racks[rackId].bayId}`);
      }
    }
  }
  
  // 4. Slot validation
  const slotIds = new Set<string>();
  let filledCount = 0;
  let availableCount = 0;
  let emptyCount = 0;
  const threshold = data.config.filledThreshold;
  
  for (const slot of data.slots) {
    // Unique ID check
    if (slotIds.has(slot.id)) {
      errors.push(`Duplicate slot ID: ${slot.id}`);
    }
    slotIds.add(slot.id);
    
    // Bay reference
    if (!data.bays[slot.bayId]) {
      errors.push(`Slot ${slot.id} references missing bay: ${slot.bayId}`);
    } else {
      // Rack reference within bay
      const bay = data.bays[slot.bayId];
      if (!bay.racks.includes(slot.rackId)) {
        errors.push(`Slot ${slot.id} references rack ${slot.rackId} not in bay ${slot.bayId}`);
      }
    }
    
    // Type checks
    if (typeof slot.rackId !== "string") {
      errors.push(`Slot ${slot.id} has non-string rackId: ${typeof slot.rackId}`);
    }
    
    // Range checks
    if (slot.fillPercent < 0 || slot.fillPercent > 100) {
      warnings.push(`Slot ${slot.id} has invalid fillPercent: ${slot.fillPercent}`);
    }
    
    // Count by fill state
    if (slot.fillPercent === 0) {
      emptyCount++;
    } else if (slot.fillPercent >= threshold) {
      filledCount++;
    } else {
      availableCount++;
    }
  }
  
  // 5. Rack validation
  for (const [rackId, rack] of Object.entries(data.racks)) {
    if (!data.bays[rack.bayId]) {
      errors.push(`Rack ${rackId} references missing bay: ${rack.bayId}`);
    }
    
    if (typeof rack.id !== "string") {
      errors.push(`Rack ${rackId} has non-string id: ${typeof rack.id}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      buildings: Object.keys(data.buildings).length,
      bays: Object.keys(data.bays).length,
      racks: Object.keys(data.racks).length,
      slots: data.slots.length,
      filledSlots: filledCount,
      availableSlots: availableCount,
      emptySlots: emptyCount,
    },
  };
}

/**
 * Validate GLB scene has required meshes for a building
 * Call this after loading each building GLB
 */
export function validateBuildingGLB(
  buildingId: string,
  scene: Scene,
  bays: { id: string; hitMesh: string }[]
): DiagnosticResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const bay of bays) {
    // Check hit mesh
    if (!scene.getObjectByName(bay.hitMesh)) {
      errors.push(`Missing hit mesh in ${buildingId}.glb: ${bay.hitMesh}`);
    }
    
    // Check origin locator
    const originName = `origin_${bay.id}`;
    if (!scene.getObjectByName(originName)) {
      errors.push(`Missing origin locator in ${buildingId}.glb: ${originName}`);
    }
  }
  
  // Check for view-container (optional but recommended)
  if (!scene.getObjectByName("view-container")) {
    warnings.push(`No view-container found in ${buildingId}.glb (optional)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      buildings: 0,
      bays: bays.length,
      racks: 0,
      slots: 0,
      filledSlots: 0,
      availableSlots: 0,
      emptySlots: 0,
    },
  };
}

/**
 * Print diagnostic results to console
 */
export function printDiagnostics(result: DiagnosticResult, label: string = "WAREHOUSE VIZ"): void {
  console.log("\n========================================");
  console.log(`${label} - STARTUP DIAGNOSTICS`);
  console.log("========================================");
  
  if (result.stats.slots > 0) {
    console.log(`✓ Data loaded:`);
    console.log(`  - ${result.stats.buildings} buildings`);
    console.log(`  - ${result.stats.bays} bays`);
    console.log(`  - ${result.stats.racks} racks`);
    console.log(`  - ${result.stats.slots} slots`);
    console.log(`    • ${result.stats.filledSlots} filled (≥70%)`);
    console.log(`    • ${result.stats.availableSlots} available (1-69%)`);
    console.log(`    • ${result.stats.emptySlots} empty (0%)`);
  }
  
  if (result.warnings.length > 0) {
    console.log(`\nWARNINGS (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  } else {
    console.log(`\nWARNINGS (0): (none)`);
  }
  
  if (result.errors.length > 0) {
    console.log(`\nERRORS (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`  ✗ ${e}`));
    console.log(`\nStatus: FAILED - Fix errors before proceeding`);
  } else {
    console.log(`\nERRORS (0): (none)`);
    console.log(`\nStatus: READY ✓`);
  }
  
  console.log("========================================\n");
}

/**
 * Run all diagnostics and return combined result
 */
export function runStartupDiagnostics(data: WarehouseData): DiagnosticResult {
  const result = validateWarehouseData(data);
  printDiagnostics(result);
  return result;
}
