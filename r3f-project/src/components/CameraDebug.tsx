// src/components/CameraDebug.tsx
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

type Props = { enabled?: boolean };

export function CameraDebug({ enabled = true }: Props) {
  if (!enabled) return null;
  return <CameraDebugInner />;
}

function CameraDebugInner() {
  const { camera } = useThree();
  const sphereRef  = useRef<THREE.Mesh>(null);

  // Construct THREE.Line directly — avoids JSX <line> being
  // interpreted as SVG element by TypeScript
  const arrowLine = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)
    );
    return new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: "#00ffff", depthTest: false })
    );
  }, []);

  const dir      = useMemo(() => new THREE.Vector3(), []);
  const arrowEnd = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!sphereRef.current) return;

    sphereRef.current.position.copy(camera.position);

    camera.getWorldDirection(dir);
    arrowEnd.copy(camera.position).addScaledVector(dir, 30);

    const attr = arrowLine.geometry.attributes.position;
    attr.setXYZ(0, camera.position.x, camera.position.y, camera.position.z);
    attr.setXYZ(1, arrowEnd.x, arrowEnd.y, arrowEnd.z);
    attr.needsUpdate = true;
  });

  return (
    <group>
      {/* Magenta sphere at camera position */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ff00ff" depthTest={false} />
      </mesh>

      {/* Cyan line showing facing direction — 30 units long */}
      <primitive object={arrowLine} />

      <CameraLabel camera={camera} />
    </group>
  );
}

function CameraLabel({ camera }: { camera: THREE.Camera }) {
  const groupRef = useRef<THREE.Group>(null);
  const dir      = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position
      .copy(camera.position)
      .setY(camera.position.y + 4);
  });

  // Initial read for first render
  const p = camera.position;
  camera.getWorldDirection(dir);

  return (
    <group ref={groupRef}>
      <Html center style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.8)",
          color: "#ff00ff",
          padding: "6px 10px",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "11px",
          whiteSpace: "nowrap",
          lineHeight: 1.6,
          border: "1px solid #ff00ff44",
        }}>
          <div style={{ color: "#888", fontSize: "10px" }}>CAM POS</div>
          <div>x: {p.x.toFixed(1)}</div>
          <div>y: {p.y.toFixed(1)}</div>
          <div>z: {p.z.toFixed(1)}</div>
          <div style={{ color: "#888", fontSize: "10px", marginTop: 4 }}>FACING</div>
          <div>x: {dir.x.toFixed(2)}</div>
          <div>y: {dir.y.toFixed(2)}</div>
          <div>z: {dir.z.toFixed(2)}</div>
        </div>
      </Html>
    </group>
  );
}