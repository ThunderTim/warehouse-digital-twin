// PopUp.tsx
import { Html } from "@react-three/drei";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
  // Portal target — render Html into document.body so it escapes the
  // Canvas stacking context entirely. Without this, any overflow:hidden
  // or z-index on the canvas wrapper clips the popup.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  if (!portalTarget) return null;

  return (
    <Html
      position={offset}
      center
      portal={{ current: portalTarget }}
      zIndexRange={[9999, 9998]}
      occlude={false}
      style={{
        pointerEvents: interactive ? "auto" : "none",
      }}
      wrapperClass="popup-wrapper"
    >
      <div
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
        onMouseDown={(e) => { if (!interactive) e.preventDefault(); }}
        style={{
          background: "rgba(15, 15, 20, 0.92)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          color: "white",
          padding: "12px 14px",
          borderRadius: "10px",
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          minWidth: 220,
          boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          zIndex: 9999,
          position: "relative",
        }}
      >
        {children}
      </div>
    </Html>
  );
}