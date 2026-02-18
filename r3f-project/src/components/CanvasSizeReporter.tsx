// src/components/CanvasSizeReporter.tsx
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

type Props = {
  onSizeChange: (width: number, height: number) => void;
};

export function CanvasSizeReporter({ onSizeChange }: Props) {
  const { size } = useThree();

  useEffect(() => {
    onSizeChange(size.width, size.height);
  }, [size.width, size.height, onSizeChange]);

  return null;
}