
/* ==========================================
   OUTPOST 30 — NASA EVENT ENGINE
   Real NASA Data + Dynamic Training Scenarios
   ========================================== */

import type {
  SpaceWeatherEvent,
} from "@/lib/nasa";

import type {
  Resources,
  ResourceChanges,
} from "@/lib/mission";

// ==========================================
// TYPES
// ==========================================

export type NASAEventScenario = {
  day: number;
  eventId: string;
  eventTitle: string;
  observedAt: string;
  source: string;
  severity: "low" | "medium" | "high";
  priority: "routine" | "elevated" | "critical";
  title: string;
  description: string;
  choices: {
    id: "safe" | "risky" | "dangerous";
    label: string;
    effects: ResourceChanges;
    score: number;
    feedback: string;
  }[];
};

export type NASATimelineEntry = {
  day: number;
  event: SpaceWeatherEvent;
};

// ==========================================
// DETERMINISTIC EVENT PLACEMENT
// ==========================================

// Produces a stable number from a NASA event ID.
// This is game scheduling, not a prediction.

function hashEventId(id: string): number {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (
      Math.imul(31, hash) + id.charCodeAt(i)
    ) >>> 0;
  }

  return hash;
}

export function generateNASATimeline(
  events: SpaceWeatherEvent[],
  totalDays = 30
): NASATimelineEntry[] {
  if (!Number.isInteger(totalDays) || totalDays < 1) {
    return [];
  }

  const timeline: NASATimelineEntry[] = [];
  const usedDays = new Set<number>();

  // Only accept identifiable NASA observations.
  const validEvents = events
    .filter(
      (event) =>
        event.source.startsWith("NASA DONKI") &&
        Boolean(event.id) &&
        Boolean(event.observedAt) &&
        !Number.isNaN(Date.parse(event.observedAt))
    )
    .sort(
      (a, b) =>
        a.observedAt.localeCompare(b.observedAt) ||
        a.id.localeCompare(b.id)
    );

  for (const event of validEvents) {
    if (usedDays.size >= totalDays) break;

    let day = (hashEventId(event.id) % totalDays) + 1;

    // Avoid placing two events on the same day.
    while (usedDays.has(day)) {
      day = (day % totalDays) + 1;
    }

    usedDays.add(day);
    timeline.push({ day, event });
  }

  return timeline.sort((a, b) => a.day - b.day);
}

// ==========================================
// EVALUATE MISSION CONDITIONS
// ==========================================

function evaluatePriority(
  event: SpaceWeatherEvent,
  resources: Resources
): NASAEventScenario["priority"] {
  const criticalResources =
    resources.oxygen <= 20 ||
    resources.power <= 20 ||
    resources.health <= 30;

  if (criticalResources) {
    return "critical";
  }

  const limitedResources =
    resources.oxygen <= 40 ||
    resources.power <= 40 ||
    resources.health <= 60;

  if (limitedResources || event.severity === "high") {
    return "elevated";
  }

  return "routine";
}

// ==========================================
// GENERATE NASA TRAINING SCENARIO
// ==========================================

export function generateNASAScenario(
  day: number,
  event: SpaceWeatherEvent,
  resources: Resources
): NASAEventScenario {
  const priority = evaluatePriority(event, resources);

  const lowPower = resources.power < 30;
  const lowOxygen = resources.oxygen < 30;

  let safeEffects: ResourceChanges = {
    power: -5,
    oxygen: -2,
    health: 0,
  };

  let safeLabel =
    "Prepare radiation shelter and review instruments";

  if (lowPower) {
    safeLabel =
      "Conserve power and verify shelter readiness";

    safeEffects = {
      power: -2,
      oxygen: -3,
      health: 0,
    };
  } else if (lowOxygen) {
    safeLabel =
      "Suspend EVA operations and conserve oxygen";

    safeEffects = {
      oxygen: -1,
      power: -4,
      health: 0,
    };
  }

  const description =
    `NASA DONKI recorded ${event.title} on ` +
    `${event.observedAt}. ` +
    `Mission Control is using this historical observation ` +
    `for an astronaut safety-training scenario. ` +
    `Current operational priority: ${priority}.`;

  return {
    day,
    eventId: event.id,
    eventTitle: event.title,
    observedAt: event.observedAt,
    source: event.source,
    severity: event.severity,
    priority,
    title: `NASA Training: ${event.title}`,
    description,
    choices: [
      {
        id: "safe",
        label: safeLabel,
        effects: safeEffects,
        score: 100,
        feedback:
          "Crew completed the recommended safety procedure.",
      },
      {
        id: "risky",
        label: "Reduce EVA operations but continue work",
        effects: {
          power: -3,
          oxygen: -5,
          health: -5,
        },
        score: 50,
        feedback:
          "Operations continued with simulated crew risk.",
      },
      {
        id: "dangerous",
        label: "Ignore the training safety alert",
        effects: {
          oxygen: -9,
          power: -6,
          health:
            priority === "critical" ? -25 : -15,
        },
        score: 0,
        feedback:
          "Training scenario resulted in a serious crew safety incident.",
      },
    ],
  };
}

// ==========================================
// FIND TODAY'S NASA SCENARIO
// ==========================================

export function getDailyNASAScenario(
  day: number,
  resources: Resources,
  events: SpaceWeatherEvent[]
): NASAEventScenario | null {
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    return null;
  }

  const timeline = generateNASATimeline(events);

  const scheduled = timeline.find(
    (entry) => entry.day === day
  );

  if (!scheduled) {
    return null;
  }

  return generateNASAScenario(
    day,
    scheduled.event,
    resources
  );
}