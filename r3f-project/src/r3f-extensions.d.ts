import type { ShellMaterialImpl } from "./wherever/ShellMaterial"; 
// ^ update this path to where your ShellMaterial.tsx lives

declare module "@react-three/fiber" {
  interface ThreeElements {
    shellMaterialImpl: any;
  }
}
