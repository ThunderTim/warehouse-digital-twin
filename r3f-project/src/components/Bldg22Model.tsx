// src/models/Bldg22Model.tsx
// Placeholder — full implementation pending Bldg00 template completion.

import { Html } from "@react-three/drei";
import type { ViewMode, Selection } from "../types/viewTypes";

type Props = {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  onCameraUpdate?: (config: {
    position: [number, number, number];
    lookAt: [number, number, number];
  }) => void;
};

export function Bldg22Model(_props: Props) {
  return (
    <Html center>
      <div style={{
        background: "#222",
        color: "#fff",
        padding: "16px 24px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
        border: "1px solid #444",
      }}>
        Building 22 — coming soon
      </div>
    </Html>
  );
}