"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="map-host" />,
});

interface Props {
  interactive?: boolean;
  className?: string;
  focusId?: string;
  focusDay?: number;
}

export default function MapClient(props: Props) {
  return <TripMap {...props} />;
}
