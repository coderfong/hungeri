/**
 * Curated Singapore areas for the manual-location fallback (when a user declines
 * geolocation). Avoids a geocoding-API dependency for the MVP; forward geocoding
 * via Mapbox can be layered in later behind the same picker.
 */
export type Area = { name: string; sub: string; lat: number; lng: number };

export const SG_AREAS: Area[] = [
  { name: "Orchard Road", sub: "Central Region", lat: 1.3048, lng: 103.8318 },
  { name: "Marina Bay", sub: "Downtown Core", lat: 1.2834, lng: 103.8607 },
  { name: "Bugis", sub: "Rochor", lat: 1.2996, lng: 103.8559 },
  { name: "Chinatown", sub: "Outram", lat: 1.2829, lng: 103.8443 },
  { name: "Tiong Bahru", sub: "Bukit Merah", lat: 1.2847, lng: 103.8268 },
  { name: "Tanjong Pagar", sub: "Downtown Core", lat: 1.2766, lng: 103.8456 },
  { name: "Holland Village", sub: "Bukit Timah", lat: 1.3115, lng: 103.7965 },
  { name: "Katong / East Coast", sub: "Marine Parade", lat: 1.3057, lng: 103.905 },
  { name: "Serangoon (NEX)", sub: "Serangoon", lat: 1.3506, lng: 103.872 },
  { name: "Jurong East", sub: "West Region", lat: 1.3331, lng: 103.7422 },
  { name: "Tampines", sub: "East Region", lat: 1.3536, lng: 103.9447 },
  { name: "Woodlands", sub: "North Region", lat: 1.4382, lng: 103.789 },
];

/** Default map centre when no location is chosen (central Singapore). */
export const SG_CENTER = { lat: 1.3521, lng: 103.8198 };
