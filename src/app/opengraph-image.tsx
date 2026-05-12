import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WM-Roadtrip 2026 — Mit Österreich durch die USA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Top Austrian red band */}
        <div style={{ flex: 1, background: "#ED2939" }} />

        {/* Middle white band */}
        <div
          style={{
            flex: 1,
            background: "#FBF7F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 80px",
            position: "relative",
          }}
        >
          {/* Soccer ball */}
          <svg
            width={180}
            height={180}
            viewBox="0 0 32 32"
            style={{ flexShrink: 0, marginRight: 50 }}
          >
            <circle
              cx="16"
              cy="16"
              r="15"
              fill="#fff"
              stroke="#181513"
              strokeWidth="1.4"
            />
            <polygon
              points="16,8 21,11.6 19,17.5 13,17.5 11,11.6"
              fill="#181513"
            />
            <path
              d="M16 1 L16 8 M1 16 L11 11.6 M31 16 L21 11.6 M6 26 L13 17.5 M26 26 L19 17.5"
              stroke="#181513"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>

          {/* Text block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "#181513",
                letterSpacing: "-0.04em",
                lineHeight: 0.92,
              }}
            >
              WM-ROADTRIP
            </div>
            <div
              style={{
                fontSize: 92,
                fontWeight: 900,
                color: "#ED2939",
                letterSpacing: "-0.04em",
                lineHeight: 0.92,
                marginTop: 6,
              }}
            >
              2026 · USA
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#4a443f",
                marginTop: 16,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              4 Mann · 3 Spiele · 19 Tage
            </div>
          </div>

          {/* US flag in the top-right corner of the white band */}
          <div
            style={{
              position: "absolute",
              top: 26,
              right: 32,
              display: "flex",
              border: "2px solid #181513",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <svg width={108} height={60} viewBox="0 0 60 33">
              <rect width="60" height="33" fill="#FFFFFF" />
              {/* 7 red stripes */}
              <rect width="60" height="2.54" y="0" fill="#B22234" />
              <rect width="60" height="2.54" y="5.07" fill="#B22234" />
              <rect width="60" height="2.54" y="10.15" fill="#B22234" />
              <rect width="60" height="2.54" y="15.23" fill="#B22234" />
              <rect width="60" height="2.54" y="20.31" fill="#B22234" />
              <rect width="60" height="2.54" y="25.38" fill="#B22234" />
              <rect width="60" height="2.54" y="30.46" fill="#B22234" />
              {/* Blue canton */}
              <rect width="24" height="17.77" fill="#3C3B6E" />
              {/* Stars — simplified white dots */}
              <g fill="#FFFFFF">
                <circle cx="4" cy="3" r="0.8" />
                <circle cx="8" cy="3" r="0.8" />
                <circle cx="12" cy="3" r="0.8" />
                <circle cx="16" cy="3" r="0.8" />
                <circle cx="20" cy="3" r="0.8" />
                <circle cx="6" cy="6.5" r="0.8" />
                <circle cx="10" cy="6.5" r="0.8" />
                <circle cx="14" cy="6.5" r="0.8" />
                <circle cx="18" cy="6.5" r="0.8" />
                <circle cx="4" cy="10" r="0.8" />
                <circle cx="8" cy="10" r="0.8" />
                <circle cx="12" cy="10" r="0.8" />
                <circle cx="16" cy="10" r="0.8" />
                <circle cx="20" cy="10" r="0.8" />
                <circle cx="6" cy="13.5" r="0.8" />
                <circle cx="10" cy="13.5" r="0.8" />
                <circle cx="14" cy="13.5" r="0.8" />
                <circle cx="18" cy="13.5" r="0.8" />
              </g>
            </svg>
          </div>
        </div>

        {/* Bottom Austrian red band */}
        <div style={{ flex: 1, background: "#ED2939" }} />
      </div>
    ),
    { ...size }
  );
}
