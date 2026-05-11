"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="map-host" />,
});

interface Props {
  interactive?: boolean;
  className?: string;
}

export default function MapClient(props: Props) {
  return <TripMap {...props} />;
}
