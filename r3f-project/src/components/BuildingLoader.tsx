import React from "react";
import type { ViewMode, Selection } from "../types/viewTypes";
import { Html } from "@react-three/drei";

//Import the 3d models / building scenes:
import { Bldg22Model } from "./Bldg22Model";
import { Bldg00Model } from "./Bldg00Model";

// Update with next building when ready
//import { Bldg00Model } from "./Bldg00Model";
//"bldg-00": { ready: true, Component: Bldg00Model, label: "Building 00" },


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
  // Pass Footprint? - building and bay pos & size to contrain camera !?
};

// Central registry
const BUILDINGS: Record<
  string,
  {
    ready: boolean;
    Component?: React.ComponentType<any>;
    label?: string;
  }
> = {
  "bldg-22": { ready: true, Component: Bldg22Model, label: "Building 22" },
  "bldg-00": { ready: true, Component: Bldg00Model, label: "Building 00" },
};

export function BuildingLoader(props: Props) {
  const def = BUILDINGS[props.buildingId];

  // Unknown building
  if (!def) {
    return (
      <Html center>
        <div className="building-message">
          Unknown building: {props.buildingId}
        </div>
      </Html>
    );
  }

  // Known but not ready
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
    />
  );
}