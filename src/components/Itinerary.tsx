import { buildAllDays } from "@/lib/day";
import DayCard from "./DayCard";

export default function Itinerary() {
  const days = buildAllDays();
  return (
    <div className="itinerary">
      {days.map((day, idx) => (
        <DayCard key={day.iso} day={day} last={idx === days.length - 1} />
      ))}
    </div>
  );
}
