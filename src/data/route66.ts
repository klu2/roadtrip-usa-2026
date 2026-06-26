// Historic U.S. Route 66 — "The Mother Road" — Chicago, IL → Santa Monica, CA.
// A static decorative overlay for the map: the classic ~2,448-mile alignment
// (post-1937 main line through Albuquerque) painted as a brown dashed line with
// Route 66 shields and city labels dropped along it "from time to time".
//
// Not part of the trip data (src/data/trip.ts) and not generated from photos —
// these are hand-picked waypoints that trace a recognisable Route 66, ordered
// west-bound from Chicago. Coords are [lat, lon].

export const ROUTE_66: [number, number][] = [
  // Illinois
  [41.8757, -87.6244], // Chicago — Grant Park (eastern terminus)
  [41.525, -88.0817], // Joliet
  [41.095, -88.4254], // Dwight
  [40.8809, -88.6298], // Pontiac
  [40.4842, -88.9937], // Bloomington / Normal
  [40.1486, -89.3648], // Lincoln
  [39.7817, -89.6501], // Springfield, IL
  [39.1753, -89.654], // Litchfield
  [38.77, -90.0846], // Mitchell / Edwardsville
  // Missouri
  [38.627, -90.1994], // St. Louis
  [38.5028, -90.6249], // Eureka
  [38.2081, -91.1604], // Sullivan
  [37.9514, -91.7713], // Rolla
  [37.6806, -92.6638], // Lebanon
  [37.209, -93.2923], // Springfield, MO
  [37.1764, -94.3102], // Carthage
  [37.0842, -94.5133], // Joplin
  // Kansas (the famous 13-mile stretch)
  [37.0759, -94.6402], // Galena
  [37.0234, -94.7355], // Baxter Springs
  // Oklahoma
  [36.8745, -94.8772], // Miami
  [36.6387, -95.1541], // Vinita
  [36.3126, -95.616], // Claremore
  [36.154, -95.9928], // Tulsa
  [35.9987, -96.1142], // Sapulpa
  [35.8307, -96.3911], // Bristow
  [35.7017, -96.8809], // Chandler
  [35.6628, -97.3256], // Arcadia
  [35.4676, -97.5164], // Oklahoma City
  [35.5323, -97.955], // El Reno
  [35.5156, -98.967], // Clinton
  [35.4117, -99.4043], // Elk City
  [35.2156, -99.8665], // Erick
  // Texas (the Panhandle)
  [35.2142, -100.2496], // Shamrock
  [35.2334, -100.5998], // McLean
  [35.2042, -101.1099], // Groom
  [35.222, -101.8313], // Amarillo
  [35.2731, -102.6735], // Adrian (geo-midpoint of Route 66)
  [35.1789, -103.0386], // Glenrio (TX/NM line)
  // New Mexico
  [35.1717, -103.725], // Tucumcari
  [34.9387, -104.6819], // Santa Rosa
  [34.9897, -106.0492], // Moriarty
  [35.0844, -106.6504], // Albuquerque
  [35.1473, -107.8514], // Grants
  [35.5281, -108.7426], // Gallup
  // Arizona
  [34.9025, -110.1665], // Holbrook
  [35.0242, -110.6974], // Winslow ("standin' on the corner")
  [35.1983, -111.6513], // Flagstaff
  [35.2495, -112.191], // Williams
  [35.3258, -112.8747], // Seligman
  [35.5294, -113.4254], // Peach Springs
  [35.1894, -114.053], // Kingman
  [35.0264, -114.3833], // Oatman
  // California
  [34.8481, -114.6141], // Needles
  [34.5581, -115.7445], // Amboy
  [34.7197, -116.1611], // Ludlow
  [34.8958, -117.0173], // Barstow
  [34.5362, -117.2928], // Victorville
  [34.1083, -117.2898], // San Bernardino
  [34.1478, -118.1445], // Pasadena
  [34.0522, -118.2437], // Los Angeles
  [34.0099, -118.496], // Santa Monica Pier (western terminus)
];

// A subset of the route that gets a Route 66 shield + city label on the map —
// the iconic stops, spaced out so the markers don't crowd each other.
export const ROUTE_66_STOPS: { c: [number, number]; label: string }[] = [
  { c: [41.8757, -87.6244], label: "Chicago" },
  { c: [39.7817, -89.6501], label: "Springfield" },
  { c: [38.627, -90.1994], label: "St. Louis" },
  { c: [37.209, -93.2923], label: "Springfield" },
  { c: [36.154, -95.9928], label: "Tulsa" },
  { c: [35.4676, -97.5164], label: "Oklahoma City" },
  { c: [35.222, -101.8313], label: "Amarillo" },
  { c: [35.1717, -103.725], label: "Tucumcari" },
  { c: [35.0844, -106.6504], label: "Albuquerque" },
  { c: [35.5281, -108.7426], label: "Gallup" },
  { c: [35.1983, -111.6513], label: "Flagstaff" },
  { c: [35.1894, -114.053], label: "Kingman" },
  { c: [34.8958, -117.0173], label: "Barstow" },
  { c: [34.0099, -118.496], label: "Santa Monica" },
];
