/* US states crossed on the trip → German name + local flag SVG.
   Flags are public-domain SVGs downloaded into public/states/.
   No runtime fetching (same rationale as stadium/hotel photos). */

export const US_STATES: Record<string, { name: string; flag: string }> = {
  CA: { name: "Kalifornien", flag: "/states/ca.svg" },
  NV: { name: "Nevada", flag: "/states/nv.svg" },
  AZ: { name: "Arizona", flag: "/states/az.svg" },
  NM: { name: "New Mexico", flag: "/states/nm.svg" },
  TX: { name: "Texas", flag: "/states/tx.svg" },
  OK: { name: "Oklahoma", flag: "/states/ok.svg" },
  KS: { name: "Kansas", flag: "/states/ks.svg" },
  MO: { name: "Missouri", flag: "/states/mo.svg" },
};
