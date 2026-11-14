
/* ==========================================
   OUTPOST 30 — MISSION API
   NASA + DYNAMIC EMERGENCY INTEGRATION
   ========================================== */

import { NextRequest, NextResponse } from "next/server";

import {
  startMission,
  getChallenge,
  makeDecision,
  getMissionSummary,
  type MissionState,
  type MissionChallenge,
  type ResourceName,
} from "@/lib/mission";

import { getSpaceWeather } from "@/lib/nasa";

import {
  generateNASATimeline,
  generateNASAScenario,
  type NASATimelineEntry,
} from "@/lib/nasa-event-engine";

import {
  detectGameEmergencies,
  type GameEmergency,
} from "@/lib/emergency-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==========================================
// EXTENDED MISSION STATE
// ==========================================

type EmergencyRecord = {
  day: number;
  emergencyId: string;
  choiceId: string;
  feedback: string;
};

type GameState = MissionState & {
  nasaTimeline: NASATimelineEntry[];
  nasaDataMode: "live" | "historical";

  // Prevent repeated emergency rewards.
  resolvedEmergencies: string[];

  // Keep an audit of emergency decisions.
  emergencyHistory: EmergencyRecord[];
};

// ==========================================
// HELPERS
// ==========================================

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

function isGameState(value: unknown): value is GameState {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const state = value as Partial<GameState>;

  if (
    !Number.isInteger(state.day) ||
    (state.day ?? 0) < 1 ||
    (state.day ?? 0) > 30
  ) {
    return false;
  }

  if (
    state.status !== "active" &&
    state.status !== "completed" &&
    state.status !== "failed"
  ) {
    return false;
  }

  if (
    typeof state.score !== "number" ||
    !Number.isFinite(state.score) ||
    state.score < 0 ||
    !Array.isArray(state.history)
  ) {
    return false;
  }

  const resources = state.resources;

  if (!resources) return false;

  const keys: ResourceName[] = [
    "oxygen",
    "water",
    "food",
    "power",
    "health",
  ];

  if (
    !keys.every(
      (key) =>
        typeof resources[key] === "number" &&
        Number.isFinite(resources[key]) &&
        resources[key] >= 0 &&
        resources[key] <= 100
    )
  ) {
    return false;
  }

  const crew = state.crew;
  const equipment = state.equipment;

  if (!crew || !equipment) return false;

  const conditions = [
    crew.fatigue,
    crew.morale,
    equipment.lifeSupport,
    equipment.solarPanels,
    equipment.waterRecycler,
  ];

  if (
    !conditions.every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(state.nasaTimeline) ||
    !state.nasaTimeline.every(
      (entry) =>
        entry &&
        Number.isInteger(entry.day) &&
        entry.day >= 1 &&
        entry.day <= 30 &&
        typeof entry.event?.id === "string" &&
        typeof entry.event?.observedAt === "string" &&
        typeof entry.event?.title === "string" &&
        typeof entry.event?.source === "string" &&
        entry.event.source.startsWith("NASA DONKI")
    )
  ) {
    return false;
  }

  if (
    state.nasaDataMode !== "live" &&
    state.nasaDataMode !== "historical"
  ) {
    return false;
  }

  if (
    !Array.isArray(state.resolvedEmergencies) ||
    !state.resolvedEmergencies.every(
      (item) => typeof item === "string"
    ) ||
    !Array.isArray(state.emergencyHistory)
  ) {
    return false;
  }

  return true;
}

// ==========================================
// DAILY CHALLENGE
// ==========================================

function getGameChallenge(
  state: GameState
): MissionChallenge | null {
  const base = getChallenge(state.day);

  if (!base) return null;

  const nasaEntry = state.nasaTimeline.find(
    (entry) => entry.day === state.day
  );

  if (!nasaEntry) return base;

  const scenario = generateNASAScenario(
    state.day,
    nasaEntry.event,
    state.resources
  );

  return {
    day: state.day,
    title: scenario.title,
    description: scenario.description,
    category: "NASA Space Weather",
    nasaEventId: scenario.eventId,
    nasaSource: scenario.source,

    choices: scenario.choices.map((choice) => ({
      ...choice,
      description:
        `Operational priority: ${scenario.priority}. ` +
        "Simulated training consequences.",
    })),
  };
}

// ==========================================
// UNRESOLVED EMERGENCIES
// ==========================================

function getPendingEmergencies(
  state: GameState
): GameEmergency[] {
  if (state.status !== "active") return [];

  return detectGameEmergencies(state).filter(
    (emergency) => {
      const key = `${state.day}:${emergency.id}`;

      return !state.resolvedEmergencies.includes(key);
    }
  );
}

function getCurrentEmergency(
  state: GameState
): GameEmergency | null {
  return getPendingEmergencies(state)[0] ?? null;
}

// ==========================================
// GET — HEALTH CHECK
// ==========================================

export async function GET() {
  return NextResponse.json({
    success: true,
    game: "OUTPOST 30",
    engine: "Dynamic Lunar Mission Simulator",
    status: "online",
    totalDays: 30,
    nasaIntegration: true,
    scheduling: "data-driven",
    emergencySystem: true,
    actions: [
      "start",
      "challenge",
      "decide",
      "resolve-emergency",
      "summary",
    ],
  });
}

// ==========================================
// POST — MISSION ACTIONS
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request body.");
    }

    const { action, state, choiceId, emergencyId } = body;

    // ======================================
    // START MISSION
    // ======================================

    if (action === "start") {
      const nasaData = await getSpaceWeather();

      if (
        !nasaData.success ||
        nasaData.events.length === 0
      ) {
        return errorResponse(
          "Authentic NASA observations are unavailable.",
          503
        );
      }

      const timeline = generateNASATimeline(
        nasaData.events,
        30
      );

      if (timeline.length === 0) {
        return errorResponse(
          "No valid NASA DONKI events found.",
          503
        );
      }

      const newState: GameState = {
        ...startMission(),

        nasaTimeline: timeline,

        nasaDataMode:
          nasaData.mode === "live"
            ? "live"
            : "historical",

        resolvedEmergencies: [],
        emergencyHistory: [],
      };

      return NextResponse.json({
        success: true,
        message: "Welcome to OUTPOST 30, Commander!",
        state: newState,
        challenge: getGameChallenge(newState),
        emergency: getCurrentEmergency(newState),
        nasaEventCount: timeline.length,
        nasaDataMode: newState.nasaDataMode,

        nasaTimeline: timeline.map((entry) => ({
          day: entry.day,
          eventId: entry.event.id,
          title: entry.event.title,
          observedAt: entry.event.observedAt,
        })),
      });
    }

    if (!isGameState(state)) {
      return errorResponse(
        "Invalid game state. Start a new mission."
      );
    }

    // ======================================
    // GET CURRENT CHALLENGE
    // ======================================

    if (action === "challenge") {
      if (state.status !== "active") {
        return errorResponse("Mission is not active.");
      }

      const emergency = getCurrentEmergency(state);
      const challenge = getGameChallenge(state);

      return NextResponse.json({
        success: true,
        day: state.day,

        // Emergency must be handled first.
        requiresEmergencyResponse: Boolean(emergency),
        emergency,
        pendingEmergencies: getPendingEmergencies(state),

        challenge: emergency ? null : challenge,

        resources: state.resources,
        crew: state.crew,
        equipment: state.equipment,

        score: state.score,
        isNASAMission: Boolean(challenge?.nasaEventId),
        nasaEventId: challenge?.nasaEventId ?? null,
        nasaSource: challenge?.nasaSource ?? null,
        nasaDataMode: state.nasaDataMode,
      });
    }

    // ======================================
    // RESOLVE EMERGENCY
    // ======================================

    if (action === "resolve-emergency") {
      if (state.status !== "active") {
        return errorResponse("Mission is not active.");
      }

      const emergency = getCurrentEmergency(state);

      if (!emergency) {
        return errorResponse(
          "No unresolved emergency exists."
        );
      }

      // Only resolve the highest-priority emergency.
      if (emergency.id !== emergencyId) {
        return errorResponse(
          "Resolve the current priority emergency first."
        );
      }

      const choice = emergency.choices.find(
        (item) => item.id === choiceId
      );

      if (!choice) {
        return errorResponse(
          "Invalid emergency response choice."
        );
      }

      // Apply immediate resource consequences.
      const resources = { ...state.resources };

      for (const key of Object.keys(
        choice.effects
      ) as ResourceName[]) {
        resources[key] = clamp(
          resources[key] + (choice.effects[key] ?? 0)
        );
      }

      // Apply crew consequences.
      const crew = { ...state.crew };

      if (choice.crewEffects) {
        for (const key of [
          "fatigue",
          "morale",
        ] as const) {
          crew[key] = clamp(
            crew[key] +
            (choice.crewEffects[key] ?? 0)
          );
        }
      }

      // Apply equipment consequences.
      const equipment = { ...state.equipment };

      if (choice.equipmentEffects) {
        for (const key of [
          "lifeSupport",
          "solarPanels",
          "waterRecycler",
        ] as const) {
          equipment[key] = clamp(
            equipment[key] +
            (choice.equipmentEffects[key] ?? 0)
          );
        }
      }

      const resolutionKey =
        `${state.day}:${emergency.id}`;

      const failed = (
        Object.values(resources).some(
          (value) => value <= 0
        )
      );

      const updatedState: GameState = {
        ...state,

        resources,
        crew,
        equipment,

        status: failed ? "failed" : "active",

        resolvedEmergencies: [
          ...state.resolvedEmergencies,
          resolutionKey,
        ],

        emergencyHistory: [
          ...state.emergencyHistory,
          {
            day: state.day,
            emergencyId: emergency.id,
            choiceId: choice.id,
            feedback: choice.feedback,
          },
        ],
      };

      const nextEmergency =
        getCurrentEmergency(updatedState);

      return NextResponse.json({
        success: true,
        message: choice.feedback,
        resolvedEmergency: emergency.id,
        state: updatedState,

        nextEmergency,

        challenge:
          updatedState.status === "active" &&
          !nextEmergency
            ? getGameChallenge(updatedState)
            : null,

        summary: getMissionSummary(updatedState),
      });
    }

    // ======================================
    // NORMAL / NASA MISSION DECISION
    // ======================================

    if (action === "decide") {
      if (state.status !== "active") {
        return errorResponse("Mission is not active.");
      }

      // Block progression if an emergency is pending.
      const emergency = getCurrentEmergency(state);

      if (emergency) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Resolve the current emergency before advancing.",
            emergency,
          },
          { status: 409 }
        );
      }

      const challenge = getGameChallenge(state);

      if (!challenge) {
        return errorResponse(
          "Mission challenge not found.",
          404
        );
      }

      if (
        !challenge.choices.some(
          (choice) => choice.id === choiceId
        )
      ) {
        return errorResponse(
          "Invalid mission decision."
        );
      }

      const updatedMission = makeDecision(
        state,
        choiceId,
        challenge
      );

      const updatedState: GameState = {
        ...state,
        ...updatedMission,
      };

      const lastDecision =
        updatedState.history[
          updatedState.history.length - 1
        ];

      const nextEmergency =
        getCurrentEmergency(updatedState);

      const nextChallenge =
        updatedState.status === "active" &&
        !nextEmergency
          ? getGameChallenge(updatedState)
          : null;

      return NextResponse.json({
        success: true,
        message: lastDecision.feedback,
        decision: lastDecision,

        wasNASAMission: Boolean(challenge.nasaEventId),
        nasaEventId: challenge.nasaEventId ?? null,
        nasaSource: challenge.nasaSource ?? null,

        state: updatedState,
        nextEmergency,
        nextChallenge,

        summary: getMissionSummary(updatedState),
      });
    }

    // ======================================
    // MISSION SUMMARY
    // ======================================

    if (action === "summary") {
      return NextResponse.json({
        success: true,
        summary: getMissionSummary(state),
        nasaEventsScheduled: state.nasaTimeline.length,
        nasaDataMode: state.nasaDataMode,
        emergenciesResolved:
          state.emergencyHistory.length,
        emergencyHistory: state.emergencyHistory,
      });
    }

    return errorResponse("Unknown mission action.");

  } catch (error) {
    console.error("Mission API Error:", error);

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Internal mission error.",
      error instanceof SyntaxError ? 400 : 500
    );
  }
}