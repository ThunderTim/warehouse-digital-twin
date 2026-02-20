// GradientFillMaterial.tsx
import * as THREE from "three";
import { useMemo } from "react";

type Props = {
  bottomColor: THREE.ColorRepresentation;
  topColor:    THREE.ColorRepresentation;
  opacity?:    number;
  halfHeight:  number;
};

function createGradientMaterial(
  bottomColor: THREE.ColorRepresentation,
  topColor:    THREE.ColorRepresentation,
  opacity:     number,
  halfHeight:  number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  true,
    side:        THREE.DoubleSide,   // visible from all angles through the shell
    uniforms: {
      bottomColor: { value: new THREE.Color(bottomColor) },
      topColor:    { value: new THREE.Color(topColor) },
      opacity:     { value: opacity },
      halfHeight:  { value: halfHeight },
    },
    vertexShader: /* glsl */ `
      varying float vT;
      uniform float halfHeight;
      void main() {
        vT = clamp((position.y + halfHeight) / (2.0 * halfHeight), 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vT;
      uniform vec3  bottomColor;
      uniform vec3  topColor;
      uniform float opacity;
      void main() {
        float t   = smoothstep(0.0, 1.0, vT);
        vec3  col = mix(bottomColor, topColor, t);
        gl_FragColor = vec4(col, opacity);
      }
    `,
  });
}

export function GradientFillMaterial({ bottomColor, topColor, opacity = 0.88, halfHeight }: Props) {
  const mat = useMemo(
    () => createGradientMaterial(bottomColor, topColor, opacity, halfHeight),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(bottomColor), JSON.stringify(topColor), opacity, halfHeight]
  );
  return <primitive object={mat} />;
}