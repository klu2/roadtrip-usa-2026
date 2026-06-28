import Link from "next/link";
import Image from "next/image";
import type { TripPhoto } from "@/data/trip.types";

interface Props {
  photos: TripPhoto[];
  /** Detail-page href the strip links into. */
  href: string;
  max?: number;
}

export default function PhotoStrip({ photos, href, max = 5 }: Props) {
  if (!photos.length) return null;
  const shown = photos.slice(0, max);
  const overflow = photos.length - shown.length;

  return (
    <Link href={href} className="photo-strip" prefetch aria-label={`${photos.length} Fotos ansehen`}>
      {shown.map((p) => (
        <span className="photo-strip-thumb" key={p.id}>
          {/* ≤72px slots → the 200px thumb is plenty even at 2–3× DPR. */}
          <Image src={p.thumb} alt="" fill sizes="72px" />
        </span>
      ))}
      {overflow > 0 && <span className="photo-strip-more">+{overflow}</span>}
    </Link>
  );
}
