import { createServerFn } from "@tanstack/react-start";
import { locationCoordinates } from "@/data/locationCoordinates";
import type { LocationName, WeatherSnapshot } from "@/types";

/**
 * Live Weather Integration
 * ------------------------
 * Auto-fetches a short-range rainfall/temperature outlook from Open-Meteo
 * (https://open-meteo.com) — a free, open weather API that needs no API key
 * — for the farmer's selected location, and turns it into the same
 * `WeatherSnapshot` shape the manual "Weather Outlook" fields already use.
 * This means every downstream consumer (multimodal fusion scoring,
 * sustainability engine, AI advisor prompt) already knows how to use it
 * without any further changes.
 *
 * Runs server-side only (server function) so the outbound fetch never
 * happens from the browser.
 */

const FORECAST_DAYS = 7;
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Rough regional reference bands (mm over 7 days) used only to phrase a
// plain-language forecast note — not a scientific climate normal.
const DRY_THRESHOLD_MM = 10;
const WET_THRESHOLD_MM = 70;

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function buildForecastNote(rainfallMm: number): string {
  if (rainfallMm < DRY_THRESHOLD_MM) {
    return `Dry spell expected — only ~${Math.round(rainfallMm)}mm forecast over the next ${FORECAST_DAYS} days`;
  }
  if (rainfallMm > WET_THRESHOLD_MM) {
    return `Above-average rainfall expected — ~${Math.round(rainfallMm)}mm forecast over the next ${FORECAST_DAYS} days`;
  }
  return `Moderate rainfall expected — ~${Math.round(rainfallMm)}mm forecast over the next ${FORECAST_DAYS} days`;
}

export const fetchLiveWeather = createServerFn({ method: "POST" })
  .validator((data: { location: LocationName }) => data)
  .handler(async ({ data }) => {
    if (data.location === "Other" || !(data.location in locationCoordinates)) {
      return {
        available: false as const,
        reason: "unsupported_location" as const,
        message: "Live weather isn't available for this location yet — enter it manually below.",
      };
    }

    const coords = locationCoordinates[data.location as keyof typeof locationCoordinates];

    try {
      const url = new URL(FORECAST_URL);
      url.searchParams.set("latitude", String(coords.lat));
      url.searchParams.set("longitude", String(coords.lon));
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
      url.searchParams.set("forecast_days", String(FORECAST_DAYS));
      url.searchParams.set("timezone", "auto");

      const res = await fetch(url.toString());
      if (!res.ok) {
        return {
          available: false as const,
          reason: "fetch_failed" as const,
          message: "Couldn't reach the weather service just now. Please try again shortly.",
        };
      }

      const json = (await res.json()) as { daily?: OpenMeteoDaily };
      const daily = json.daily;
      if (
        !daily ||
        !daily.precipitation_sum?.length ||
        !daily.temperature_2m_max?.length ||
        !daily.temperature_2m_min?.length
      ) {
        return {
          available: false as const,
          reason: "fetch_failed" as const,
          message: "The weather service returned incomplete data. Please try again shortly.",
        };
      }

      const expectedRainfallMm = Math.round(daily.precipitation_sum.reduce((a, b) => a + b, 0));
      const dailyMeans = daily.temperature_2m_max.map(
        (max, i) => (max + daily.temperature_2m_min[i]!) / 2,
      );
      const avgTemperatureC = Math.round(average(dailyMeans) * 10) / 10;

      const weather: WeatherSnapshot = {
        expectedRainfallMm,
        avgTemperatureC,
        forecastNote: buildForecastNote(expectedRainfallMm),
        source: "auto",
        locationLabel: coords.label,
        fetchedAt: new Date().toISOString(),
      };

      return { available: true as const, weather };
    } catch (err) {
      console.error("[weather] fetchLiveWeather failed:", err);
      return {
        available: false as const,
        reason: "fetch_failed" as const,
        message: "Couldn't reach the weather service just now. Please try again shortly.",
      };
    }
  });
