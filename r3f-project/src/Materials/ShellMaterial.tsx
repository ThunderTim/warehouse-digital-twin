// ShellMaterial.tsx
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// 1️⃣ Create material
export const ShellMaterialImpl = shaderMaterial(
  {
    baseColor: new THREE.Color("#9db9e4"),
    opacity: 0.22,
    fresnelPower: 2.2,
    fresnelStrength: 0.9,
    yFadeStrength: 0.35,
    halfHeight: 0.5,
  },
  /* glsl */ `
    varying vec3 vNormalW;
    varying vec3 vPosL;

    void main() {
      vPosL = position;
      vNormalW = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    varying vec3 vNormalW;
    varying vec3 vPosL;

    uniform vec3 baseColor;
    uniform float opacity;
    uniform float fresnelPower;
    uniform float fresnelStrength;
    uniform float yFadeStrength;
    uniform float halfHeight;

    void main() {
      float f = pow(1.0 - abs(dot(vNormalW, vec3(0.0,0.0,1.0))), fresnelPower);
      float fres = clamp(f * fresnelStrength, 0.0, 1.0);

      float y01 = (vPosL.y + halfHeight) / (2.0 * halfHeight);
      float yFade = mix(1.0, 1.0 + yFadeStrength, y01);

      vec3 col = baseColor * (1.0 + fres * 0.6) * yFade;
      gl_FragColor = vec4(col, opacity);
    }
  `
);

// 2️⃣ Register with R3F
extend({ ShellMaterialImpl });

// 3️⃣ Tell TypeScript about the JSX tag
declare global {
  namespace JSX {
    interface IntrinsicElements {
      shellMaterialImpl: any;
    }
  }
}

// 4️⃣ Friendly wrapper component
export function ShellMaterial(props: {
  baseColor?: THREE.ColorRepresentation;
  opacity?: number;
  fresnelPower?: number;
  fresnelStrength?: number;
  yFadeStrength?: number;
  halfHeight: number;
}) {
  return <shellMaterialImpl transparent depthWrite={false} {...props} />;
}
