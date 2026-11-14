
import { readFile } from "node:fs/promises";
import path from "node:path";

export type SpaceWeatherEvent = {
  id: string;
  type: "solar_flare" | "solar_particle_event";
  observedAt: string;
  severity: "low" | "medium" | "high";
  title: string;
  source: string;
};

type FlareRecord = {
  flrID?: string;
  beginTime?: string;
  classType?: string;
};

const NASA_URL =
  "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR";

function getSeverity(flareClass: string) {
  if (flareClass.startsWith("X")) return "high" as const;
  if (flareClass.startsWith("M")) return "medium" as const;
  return "low" as const;
}

export async function getSpaceWeather() {
  let records: FlareRecord[];
  let mode: "live" | "historical";

  try {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 9);

    const url = new URL(NASA_URL);
    url.searchParams.set(
      "startDate",
      start.toISOString().slice(0, 10)
    );
    url.searchParams.set(
      "endDate",
      end.toISOString().slice(0, 10)
    );
    url.searchParams.set("catalog", "M2M_CATALOG");
    url.searchParams.set("class", "ALL");
    url.searchParams.set("version", "Latest");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`NASA HTTP ${response.status}`);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid NASA data");
    }

    records = data;
    mode = "live";
  } catch {
    // Use authentic NASA observations saved locally.
    const filePath = path.join(
      process.cwd(),
      "data",
      "nasa-flr.json"
    );

    try {
      const content = await readFile(filePath, "utf-8");
      const data: unknown = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new Error("Local NASA data must be an array");
      }

      records = data;
      mode = "historical";
    } catch {
      return {
        success: false,
        source: "NASA DONKI",
        mode: "unavailable" as const,
        events: [] as SpaceWeatherEvent[],
        error: "NASA API unavailable and no valid local dataset found",
      };
    }
  }

  const events: SpaceWeatherEvent[] = records.map(
    (event, index) => {
      const flareClass = event.classType ?? "Unknown";

      return {
        id: event.flrID ?? `flare-${index}`,
        type: "solar_flare",
        observedAt: event.beginTime ?? "",
        severity: getSeverity(flareClass),
        title: `${flareClass} Solar Flare`,
        source: "NASA DONKI",
      };
    }
  );

  return {
    success: true,
    source: "NASA DONKI",
    mode,
    events,
  };
}
