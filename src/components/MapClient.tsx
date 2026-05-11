"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="map-host" />,
});

export default function MapClient() {
  return <TripMap />;
}
