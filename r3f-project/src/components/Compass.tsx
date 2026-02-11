import arrow from "../assets/icon_arrowNorth.svg";
import compassRing from "../assets/icon_compassRing.svg";
import type { ViewMode } from "../types/viewTypes";

type Props = {
  viewMode: ViewMode;
  /** degrees to rotate arrow clockwise; overrides viewMode mapping if provided */
  angleDeg?: number;
  /** optional: placement */
  top?: number;
  right?: number;
};

const DEFAULT_ANGLES: Record<ViewMode, number> = {
  campus: -25,
  building: 90,
  bay: 90,
  rack: 90,
  row: 90,
  slot: 90,
};

/** 
 * >>>>>>>
 * We can compute the arrow rotation from the camera’s yaw 
 * (so it’s always correct even if the camera rotates smoothly), 
 * using useThree() inside a small CompassController 
 * hook/component and passing angleDeg into <Compass />.
 */

export function Compass({ viewMode, angleDeg }: Props) {
  const deg = angleDeg ?? DEFAULT_ANGLES[viewMode];

  return (
    <div className="compass">
      <img className="compass-ring" src={compassRing} alt="" />
      <img
            className="compass-arrow"
            src={arrow}
            alt="North"
            style={{ transform: `rotate(${deg}deg) scale(0.55)` }}
            />
    </div>
  );
}