// Popup.tsx
import { Html } from "@react-three/drei";
import type { ReactNode } from "react";


type Props = {
  children: ReactNode;
  offset?: [number, number, number];
  interactive?: boolean; 
  onHover?: (isHovered: boolean) => void; 
};

export function Popup({
  children,
  offset = [0, 0.5, 0],
  interactive = false,
  onHover,
}: Props) {
  return (
    <Html
      position={offset}
      center
      zIndexRange={[9999, 9998]}
      occlude={false}
      sprite
      style={{
        pointerEvents: interactive ? "auto" : "none",
        transform: "none",
      }}
      wrapperClass="popup-wrapper"
    >
      <div
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
        style={{
          background: "#111",
          color: "white",
          padding: "12px 14px",
          borderRadius: "10px",
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          minWidth: 220,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
        // Optional: prevent clicks from selecting text
            onMouseDown={(e) => {
              if (!interactive) e.preventDefault();
            }}
      >
        {children}
      </div>
    </Html>
  );
}
