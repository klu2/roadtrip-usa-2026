import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./globals.css";
import Lightbox from "@/components/Lightbox";

export const metadata: Metadata = {
  title: "WM-Roadtrip 2026 — Österreich",
  description:
    "Mit Österreich unterwegs — 4 Mann, 3 Spiele, 19 Tage. FIFA WM 2026 in den USA.",
  openGraph: {
    title: "WM-Roadtrip 2026 — Österreich",
    description:
      "Mit Österreich unterwegs — 4 Mann, 3 Spiele, 19 Tage. FIFA WM 2026 in den USA.",
    type: "website",
    locale: "de_AT",
  },
  twitter: {
    card: "summary_large_image",
    title: "WM-Roadtrip 2026 — Österreich",
    description:
      "Mit Österreich unterwegs — 4 Mann, 3 Spiele, 19 Tage. FIFA WM 2026 in den USA.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ED2939",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Lightbox />
        <Analytics />
      </body>
    </html>
  );
}
