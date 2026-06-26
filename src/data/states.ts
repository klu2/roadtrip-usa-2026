/* US states crossed on the trip → German name + local flag SVG.
   Flags are public-domain SVGs downloaded into public/states/.
   No runtime fetching (same rationale as stadium/hotel photos).

   `fill`/`border` are the map shading: a pale fill with a darker
   matching border so the eight states read as distinct blocks
   under the warm Positron basemap. `labelAt` is the [lat, lon]
   anchor for the state's flag-and-name badge on the map (hand-
   placed near each state's visual centre — bbox centres land in
   awkward spots for the angled/irregular states). State outlines
   themselves live in ./state-shapes.ts (generated). */

import type { Coords } from "./trip.types";

export interface StateInfo {
  /** German state name. */
  name: string;
  /** Public path to the state flag SVG. */
  flag: string;
  /** Pale polygon fill colour. */
  fill: string;
  /** Darker polygon border colour. */
  border: string;
  /** [lat, lon] anchor for the on-map flag + name badge. */
  labelAt: Coords;
}

export const US_STATES: Record<string, StateInfo> = {
  CA: { name: "Kalifornien", flag: "/states/ca.svg", fill: "#F7D9D4", border: "#D0664F", labelAt: [37.4, -119.8] },
  NV: { name: "Nevada", flag: "/states/nv.svg", fill: "#F5E7C6", border: "#C29A3C", labelAt: [39.4, -117.0] },
  AZ: { name: "Arizona", flag: "/states/az.svg", fill: "#E8DAEE", border: "#946BA6", labelAt: [34.2, -111.6] },
  NM: { name: "New Mexico", flag: "/states/nm.svg", fill: "#D8E9DC", border: "#5C9468", labelAt: [34.3, -106.1] },
  TX: { name: "Texas", flag: "/states/tx.svg", fill: "#D6E3F0", border: "#577FA6", labelAt: [31.2, -99.4] },
  OK: { name: "Oklahoma", flag: "/states/ok.svg", fill: "#F4DCC6", border: "#C07E44", labelAt: [35.5, -98.5] },
  KS: { name: "Kansas", flag: "/states/ks.svg", fill: "#EAE3CF", border: "#998A57", labelAt: [38.5, -98.3] },
  MO: { name: "Missouri", flag: "/states/mo.svg", fill: "#D9E7E5", border: "#5A908B", labelAt: [38.4, -92.7] },
};
