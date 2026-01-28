import { PerspectiveCamera } from "@react-three/drei";


export function Scene({
  backlight = true,
  backlightColor,
}: {
  backlight?: boolean;
  backlightColor?: string;
}) {
  return (
    <>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry />
        <meshStandardMaterial />
      </mesh>
      <pointLight position={[1.26, 2.37, 1.53]} color={"#f5c3b3"} /><pointLight position={[-2.15, 3.37, 1.17]} color={"#959dda"} />

      <PerspectiveCamera position={[-1.48, 0.79, 7.88]} rotation={[-0.06981317007977317, -0.017453292519943292, 1.0843673268816397e-19]} aspect={21.12} fov={55} makeDefault={true} />

      {backlight && <pointLight color={backlightColor} name="Back light" position={[1.13, 1.09, -0.17]} scale={0} intensity={22} />}
    </>
  );
}
