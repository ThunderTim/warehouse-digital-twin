import React from "react";
import type { ViewMode, Selection } from "../types/viewTypes";
import type { Inventory } from "../types/Inventory";
import { Html } from "@react-three/drei";

import { Bldg22Model } from "./Bldg22Model";
import { Bldg00Model } from "./Bldg00Model";

type DynamicCamera = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

type Props = {
  buildingId: string;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  selection: Selection;
  setSelection: React.Dispatch<React.SetStateAction<Selection>>;
  onCameraUpdate: (config: DynamicCamera) => void;
  fillByLocation: Map<string, number>;
  itemsByLocation: Map<string, Inventory[]>;  // ← new
};

const BUILDINGS: Record<
  string,
  { ready: boolean; Component?: React.ComponentType<any>; label?: string }
> = {
  "bldg-22": { ready: true, Component: Bldg22Model, label: "Building 22" },
  "bldg-00": { ready: true, Component: Bldg00Model, label: "Building 00" },
};

export function BuildingLoader(props: Props) {
  const def = BUILDINGS[props.buildingId];

  if (!def) {
    return (
      <Html center>
        <div className="building-message">Unknown building: {props.buildingId}</div>
      </Html>
    );
  }

  if (!def.ready || !def.Component) {
    return (
      <Html center>
        <div className="building-message">
          {def.label ?? props.buildingId} is currently in development
        </div>
      </Html>
    );
  }

  const Cmp = def.Component;

  return (
    <Cmp
      viewMode={props.viewMode}
      setViewMode={props.setViewMode}
      selection={props.selection}
      setSelection={props.setSelection}
      onCameraUpdate={props.onCameraUpdate}
      fillByLocation={props.fillByLocation}
      itemsByLocation={props.itemsByLocation}  // ← new
    />
  );
}