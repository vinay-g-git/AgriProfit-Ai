import type { LocationName } from "@/types";

/**
 * Representative coordinates for each supported `LocationName`, used to
 * auto-fetch a live weather outlook (see src/services/weatherService.server.ts).
 * These are state-capital-level points, not the farmer's exact field — good
 * enough for a regional rainfall/temperature outlook in this demo, not a
 * substitute for a hyperlocal forecast.
 */
export const locationCoordinates: Record<
  Exclude<LocationName, "Other">,
  { lat: number; lon: number; label: string }
> = {
  Karnataka: { lat: 12.9716, lon: 77.5946, label: "Bengaluru, Karnataka" },
  "Tamil Nadu": { lat: 13.0827, lon: 80.2707, label: "Chennai, Tamil Nadu" },
  "Andhra Pradesh": { lat: 16.5062, lon: 80.648, label: "Vijayawada, Andhra Pradesh" },
  Telangana: { lat: 17.385, lon: 78.4867, label: "Hyderabad, Telangana" },
};
