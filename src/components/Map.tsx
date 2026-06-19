"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { TRIP } from "@/data/trip";
import { TRACK } from "@/data/track";
import { ROUTE_GEOMETRY } from "@/data/route-geometry";
import { PHOTOS } from "@/data/photos";
import { fmtDate, stayBadge } from "@/lib/format";

/** Comparable local-time value from "YYYY-MM-DD" + "HH:MM" (no timezone). */
function localKey(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm || 0);
}

const BALL_SVG = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#fff" stroke="#181513" stroke-width="1.5"/><polygon points="16,8 21,11.6 19,17.5 13,17.5 11,11.6" fill="#181513"/><path d="M16 1 L16 8 M1 16 L11 11.6 M31 16 L21 11.6 M6 26 L13 17.5 M26 26 L19 17.5" stroke="#181513" stroke-width="1.2" fill="none"/></svg>`;

// Car icon marking the start of the road trip (rental pickup at SFO).
const CAR_SVG = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#fff" stroke="#181513" stroke-width="1.5"/><g transform="translate(4 4)" fill="#ED2939"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></g></svg>`;

interface Props {
  /** When true, scroll wheel zooms the map (use on dedicated map page). */
  interactive?: boolean;
  /** Class for the host div. Defaults to `map-host`. */
  className?: string;
  /** Hotel or game id to zoom in on and pop open. */
  focusId?: string;
}

export default function TripMap({ interactive = false, className, focusId }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !hostRef.current) return;

      const map = L.map(hostRef.current, {
        zoomControl: true,
        scrollWheelZoom: interactive,
        attributionControl: true,
      });
      mapRef.current = map;
      const markers: Record<string, ReturnType<typeof L.marker>> = {};

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 18,
        }
      ).addTo(map);

      // The route has two parts. The portion we've already driven is the
      // GPS track snapped onto real OSM roads (ROUTE_GEOMETRY) — drawn as a
      // solid line. The upcoming legs we have no photos for yet are drawn as
      // a dashed "planned" line connecting the remaining hotels/games in
      // chronological order, continuing from where the driven line ends.
      const ROADTRIP_START = "2026-06-16"; // car pickup; SF days were on foot
      const lastTrackKey = TRACK.length
        ? Math.max(
            ...TRACK.map((p) => {
              const [date, time] = p.t.split("T");
              return localKey(date, time.slice(0, 5));
            })
          )
        : -Infinity;

      // Driven, road-snapped line.
      if (ROUTE_GEOMETRY.length > 1) {
        L.polyline(ROUTE_GEOMETRY, {
          color: "#181513",
          weight: 3,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      // Upcoming anchors (no GPS yet): hotels/games after the last photo.
      const future: { coords: [number, number]; key: number }[] = [];
      TRIP.hotels.forEach((h) => {
        if (h.checkIn < ROADTRIP_START) return;
        const key = localKey(h.checkIn, "22:00");
        if (key > lastTrackKey) future.push({ coords: h.coords, key });
      });
      TRIP.games.forEach((g) => {
        if (g.reachedOnFoot) return;
        const t = g.kickoff.match(/(\d{1,2}):(\d{2})/);
        const key = localKey(g.date, t ? `${t[1]}:${t[2]}` : "20:00");
        if (key > lastTrackKey) future.push({ coords: g.coords, key });
      });
      future.sort((a, b) => a.key - b.key);

      const plannedLatLngs = [
        ...(ROUTE_GEOMETRY.length ? [ROUTE_GEOMETRY.at(-1)!] : []),
        ...future.map((f) => f.coords),
      ];
      if (plannedLatLngs.length > 1) {
        L.polyline(plannedLatLngs, {
          color: "#181513",
          weight: 2.5,
          opacity: 0.55,
          dashArray: "6 6",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      const routeLatLngs = [...ROUTE_GEOMETRY, ...future.map((f) => f.coords)];

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
        const marker = L.marker(h.coords, { icon })
          .addTo(map)
          .bindPopup(
            `<div class="pop-title">Nacht ${badge} · ${h.city.split(",")[0]}</div>` +
              `<div class="pop-sub">${ci.day} ${ci.month} – ${co.day} ${co.month}</div>` +
              `<div style="margin-top:6px;">${h.name}</div>`
          );
        markers[h.id] = marker;
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
        const marker = L.marker(g.coords, { icon })
          .addTo(map)
          .bindPopup(
            `<div class="pop-title">${g.home} vs ${g.away}</div>` +
              `<div class="pop-sub">${d.weekday}, ${d.day} ${d.month} · ${g.kickoff}</div>` +
              `<div style="margin-top:6px;">${g.stadium}<br>${g.city}</div>`
          );
        markers[g.id] = marker;
      });

      // Car icon at the very start of the road trip (rental pickup, SFO).
      if (TRACK.length) {
        const start = TRACK[0].c;
        const carIcon = L.divIcon({
          className: "car-pin",
          html: CAR_SVG,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        L.marker(start, { icon: carIcon })
          .addTo(map)
          .bindPopup(
            `<div class="pop-title">Tour-Start · SFO</div>` +
              `<div class="pop-sub">Mietwagen abgeholt</div>`
          );
      }

      // Curated photo markers — framed thumbnails grouped into clusters. Clicking a
      // marker opens the global gallery lightbox at that photo (chronological order).
      if (PHOTOS.length) {
        const photoSlides = PHOTOS.map((p) => ({
          src: p.full,
          alt: p.caption || "",
          caption: p.caption || "",
        }));
        const cluster = (L as typeof L & { markerClusterGroup: Function }).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 44,
          iconCreateFunction: (c: { getChildCount: () => number }) =>
            L.divIcon({
              className: "photo-cluster",
              html:
                `<svg class="photo-cluster__cam" viewBox="0 0 24 24" aria-hidden="true">` +
                `<path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>` +
                `</svg>` +
                `<span class="photo-cluster__n">${c.getChildCount()}</span>`,
              iconSize: [38, 38],
              iconAnchor: [19, 19],
            }),
        });
        PHOTOS.forEach((p, i) => {
          const icon = L.divIcon({
            className: "photo-pin",
            html: `<span class="photo-pin__frame"><img src="${p.thumb}" alt="" loading="lazy"/></span>`,
            iconSize: [54, 60],
            iconAnchor: [27, 60],
          });
          const m = L.marker(p.coords, { icon });
          m.on("click", () => {
            window.dispatchEvent(
              new CustomEvent("lightbox:open", { detail: { slides: photoSlides, index: i } })
            );
          });
          cluster.addLayer(m);
        });
        cluster.addTo(map);
      }

      // Dev-only debug layer: number every GPS waypoint and show its source
      // photo, so bad points can be spotted and removed. Gated on NODE_ENV,
      // so it never appears in the production build.
      if (process.env.NODE_ENV === "development") {
        TRACK.forEach((p, i) => {
          L.circleMarker(p.c, {
            radius: 5,
            color: "#1d4ed8",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindTooltip(String(i), {
              permanent: true,
              direction: "top",
              className: "wp-label",
              offset: [0, -3],
            })
            .bindPopup(
              `<div class="pop-title">#${i} · ${p.t.slice(11, 19)}</div>` +
                `<div style="margin-top:4px;font-family:monospace;font-size:11px;word-break:break-all;">${p.f}</div>` +
                `<div class="pop-sub" style="margin-top:4px;">${p.c[0]}, ${p.c[1]}</div>`
            );
        });
      }

      if (routeLatLngs.length) {
        map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [30, 30] });
      } else {
        map.setView([39, -98], 4);
      }

      // Focus a specific marker if requested via ?focus=<id> —
      // keep the trip-wide fitBounds zoom and just open the popup.
      if (focusId && markers[focusId]) {
        markers[focusId].openPopup();
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [interactive, focusId]);

  return <div ref={hostRef} className={className || "map-host"} />;
}
