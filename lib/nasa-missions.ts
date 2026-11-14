
/* ==========================================
   OUTPOST 30 — NASA MISSION INTEGRATION
   ========================================== */

import {
  getSpaceWeather,
  type SpaceWeatherEvent,
} from "@/lib/nasa";

import {
  getChallenge,
  type MissionChallenge,
} from "@/lib/mission";

// Days featuring NASA space-weather training.
const NASA_MISSION_DAYS = [8, 16, 26];

export function isNASAMissionDay(day: number): boolean {
  return NASA_MISSION_DAYS.includes(day);
}

// ------------------------------------------
// CONVERT NASA OBSERVATIONS INTO CHALLENGES
// ------------------------------------------

export async function getNASAMissionChallenge(
  day: number
): Promise<MissionChallenge | null> {
  const baseChallenge = getChallenge(day);

  if (!baseChallenge) return null;

  if (!isNASAMissionDay(day)) {
    return baseChallenge;
  }

  const nasaData = await getSpaceWeather();

  // Never invent NASA records.
  if (!nasaData.success || nasaData.events.length === 0) {
    return baseChallenge;
  }

  const events = nasaData.events
    .filter(
      (event: SpaceWeatherEvent) =>
        event.type === "solar_flare" &&
        Boolean(event.observedAt)
    )
    .sort((a, b) =>
      a.observedAt.localeCompare(b.observedAt)
    );

  if (events.length === 0) {
    return baseChallenge;
  }

  // Select a reproducible recorded observation.
  const missionIndex = NASA_MISSION_DAYS.indexOf(day);
  const event = events[missionIndex % events.length];

  const severityLabel =
    event.severity === "high"
      ? "high"
      : event.severity === "medium"
      ? "moderate"
      : "low";

  return {
    ...baseChallenge,

    title: `NASA Mission: ${event.title}`,

    description:
      `NASA DONKI recorded ${event.title} on ` +
      `${event.observedAt}. ` +
      `Use this ${severityLabel}-intensity solar flare ` +
      `observation as the basis for a simulated ` +
      `astronaut radiation-safety exercise. ` +
      `This is not a prediction of lunar radiation exposure.`,

    category: "NASA Space Weather",

    nasaEventId: event.id,
    nasaSource: event.source,

    choices: [
      {
        id: "safe",
        label: "Move crew to shelter and review instruments",
        description:
          "Prioritize radiation-safety procedures.",
        effects: {
          power: -6,
          oxygen: -2,
          health: 0,
        },
        score: 100,
        feedback:
          "Crew followed the radiation-safety protocol.",
      },
      {
        id: "risky",
        label: "Reduce outdoor operations",
        description:
          "Limit exposure during the training scenario.",
        effects: {
          power: -3,
          oxygen: -4,
          health: -5,
        },
        score: 50,
        feedback:
          "Operations continued with increased simulated risk.",
      },
      {
        id: "dangerous",
        label: "Continue outdoor operations",
        description:
          "Ignore the training safety procedures.",
        effects: {
          oxygen: -8,
          power: -5,
          health: -20,
        },
        score: 0,
        feedback:
          "The simulated crew suffered a serious safety incident.",
      },
    ],
  };
}