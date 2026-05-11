"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { TRIP } from "@/data/trip";
import { fmtDate, stayBadge } from "@/lib/format";

const BALL_SVG = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#fff" stroke="#181513" stroke-width="1.5"/><polygon points="16,8 21,11.6 19,17.5 13,17.5 11,11.6" fill="#181513"/><path d="M16 1 L16 8 M1 16 L11 11.6 M31 16 L21 11.6 M6 26 L13 17.5 M26 26 L19 17.5" stroke="#181513" stroke-width="1.2" fill="none"/></svg>`;

interface Props {
  /** When true, scroll wheel zooms the map (use on dedicated map page). */
  interactive?: boolean;
  /** Class for the host div. Defaults to `map-host`. */
  className?: string;
}

export default function TripMap({ interactive = false, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !hostRef.current) return;

      const map = L.map(hostRef.current, {
        zoomControl: true,
        scrollWheelZoom: interactive,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 18,
        }
      ).addTo(map);

      // Build chronological stops
      const stops: { coords: [number, number]; date: string }[] = [];
      TRIP.hotels.forEach((h) =>
        stops.push({ coords: h.coords, date: h.checkIn })
      );
      TRIP.games.forEach((g) =>
        stops.push({ coords: g.coords, date: g.date })
      );
      stops.sort((a, b) => a.date.localeCompare(b.date));

      const routeLatLngs = stops.map((s) => s.coords);
      if (routeLatLngs.length > 1) {
        L.polyline(routeLatLngs, {
          color: "#181513",
          weight: 2.5,
          opacity: 0.75,
          dashArray: "6 6",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      // Hotel markers — badge shows trip-night number(s), e.g. "1-4" or "6"
      TRIP.hotels.forEach((h) => {
        const badge = stayBadge(h.checkIn, h.checkOut, TRIP.meta.start);
        const approxWidth = Math.max(26, 12 + badge.length * 7);
        const icon = L.divIcon({
          className: "hotel-pin",
          html: badge,
          iconSize: [approxWidth, 26],
          iconAnchor: [approxWidth / 2, 13],
        });
        const ci = fmtDate(h.checkIn);
        const co = fmtDate(h.checkOut);
        L.marker(h.coords, { icon })
          .addTo(map)
          .bindPopup(
            `<div class="pop-title">Nacht ${badge} · ${h.city.split(",")[0]}</div>` +
              `<div class="pop-sub">${ci.day} ${ci.month} – ${co.day} ${co.month}</div>` +
              `<div style="margin-top:6px;">${h.name}</div>`
          );
      });

      // Game markers
      TRIP.games.forEach((g) => {
        const icon = L.divIcon({
          className: "game-pin",
          html: BALL_SVG,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const d = fmtDate(g.date);
        L.marker(g.coords, { icon })
          .addTo(map)
          .bindPopup(
            `<div class="pop-title">${g.home} vs ${g.away}</div>` +
              `<div class="pop-sub">${d.weekday}, ${d.day} ${d.month} · ${g.kickoff}</div>` +
              `<div style="margin-top:6px;">${g.stadium}<br>${g.city}</div>`
          );
      });

      if (routeLatLngs.length) {
        map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [30, 30] });
      } else {
        map.setView([39, -98], 4);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [interactive]);

  return <div ref={hostRef} className={className || "map-host"} />;
}
