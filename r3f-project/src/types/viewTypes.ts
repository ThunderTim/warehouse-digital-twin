// types.ts
// Shared types for view state management

export type ViewMode = "campus" | "building" | "bay" | "rack" | "slot";

export type Selection = {
  buildingId?: string;
  bayId?: string;
  rackId?: string;
  rowId?: string;
  slotId?: string;
};