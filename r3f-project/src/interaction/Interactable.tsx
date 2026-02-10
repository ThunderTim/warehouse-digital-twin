// Interactable.tsx
import { useState, useEffect, type ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Popup } from "../interaction/PopUp";

type Props = {
  /** Is this currently interactive? (like Unity's enabled) */
  isInteractive?: boolean;

  /** What to show in the popup */
  popupContent?: ReactNode;

  /** Popup position offset */
  popupOffset?: [number, number, number];

  /** Click handler */
  onClick?: () => void;

  /** Render prop - receives hover state so children can react */
  children: ReactNode | ((hovered: boolean) => ReactNode);

  /** NEW: show popup on hover or click */
  popupMode?: "hover" | "click";
};



export function Interactable({
  isInteractive = true,
  popupContent,
  popupOffset = [0, 0.5, 0],
  onClick,
  children,
  popupMode = "hover", // ✅ default here
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false); // ✅ inside component
  const [popupHovered, setPopupHovered] = useState(false);

  // Reset hover + popup when becoming non-interactive
  useEffect(() => {
    if (!isInteractive) {
      if (hovered) setHovered(false);
      if (popupOpen) setPopupOpen(false);
      document.body.style.cursor = "default";
    }
  }, [isInteractive, hovered, popupOpen]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "default";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isInteractive) return;
    e.stopPropagation();

    if (popupContent && popupMode === "click") {
      setPopupOpen((v) => !v);
    }

    onClick?.();
  };

  const shouldShowPopup =
  !!isInteractive &&
  !!popupContent &&
  (popupMode === "hover" ? (hovered || popupHovered) : popupOpen);

  const resolvedChildren =
    typeof children === "function" ? children(hovered) : children;

  return (
    <group
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {resolvedChildren}

      {shouldShowPopup && (
        <Popup
          offset={popupOffset}
          interactive={true}  // ← always allow pointer events now
          onHover={setPopupHovered}
        >
          {popupContent}
        </Popup>
      )}
    </group>
  );
}
