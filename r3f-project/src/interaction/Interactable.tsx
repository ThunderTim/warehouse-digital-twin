// Interactable.tsx
import { useState, useEffect, type ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Popup } from "./Popup";

type Props = {
  /** Is this currently interactive? (like Unity's enabled) */
  isInteractive?: boolean;
  
  /** What to show in the popup */
  popupContent?: ReactNode;
  
  /** Popup position offset */
  popupOffset?: [number, number, number];
  
  /** Click handler */
  onClick?: () => void;
  
  /** 
   * Render prop - receives hover state so children can react to it
   * Like Unity's OnMouseEnter/OnMouseExit changing a material
   */
  children: ReactNode | ((hovered: boolean) => ReactNode);
};

export function Interactable({
  isInteractive = true,
  popupContent,
  popupOffset = [0, 0.5, 0],
  onClick,
  children,
}: Props) {
  const [hovered, setHovered] = useState(false);

  // Reset hover when becoming non-interactive
  useEffect(() => {
    if (!isInteractive && hovered) {
      setHovered(false);
      document.body.style.cursor = "default";
    }
  }, [isInteractive, hovered]);

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
    onClick?.();
  };

  // Resolve children - either static or function that receives hovered
  const resolvedChildren = typeof children === "function" 
    ? children(hovered) 
    : children;

  return (
    <group
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {resolvedChildren}

      {/* Popup - automatically shows on hover */}
      {hovered && isInteractive && popupContent && (
        <Popup offset={popupOffset}>{popupContent}</Popup>
      )}
    </group>
  );
}