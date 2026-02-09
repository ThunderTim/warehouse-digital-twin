// Popup.tsx
import { Html } from "@react-three/drei";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  offset?: [number, number, number];
};

export function Popup({ 
  children, 
  offset = [0, 0.5, 0],
}: Props) {
  console.log("[Popup] rendering with offset:", offset);
  
  return (
    <Html
      position={offset}
      center
      zIndexRange={[9999, 9998]}
      occlude={false}
      sprite
      // Try these debug settings:
      style={{
        pointerEvents: "none",
        transform: "none",  // Override any transform issues
      }}
      // This is key - check if the wrapper div exists
      wrapperClass="popup-wrapper"
    >
      <div
        style={{
          background: "red",  // VERY visible
          color: "white",
          padding: "20px 30px",
          borderRadius: "6px",
          fontSize: "18px",
          fontFamily: "system-ui, sans-serif",
          whiteSpace: "nowrap",
          position: "relative",
          zIndex: 99999,
        }}
      >
        DEBUG: {String(children)}
      </div>
    </Html>
  );
}