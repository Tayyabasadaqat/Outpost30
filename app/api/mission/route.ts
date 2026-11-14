
/* ==========================================
   OUTPOST 30 — MISSION CONTROLLER API
   NASA INTEGRATION ENABLED
   ========================================== */

import { NextRequest, NextResponse } from "next/server";

import {
  startMission,
  makeDecision,
  getMissionSummary,
  type MissionState,
} from "@/lib/mission";

import {
  getNASAMissionChallenge,
  isNASAMissionDay,
} from "@/lib/nasa-missions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==========================================
// VALIDATE MISSION STATE
// ==========================================

function isMissionState(
  value: unknown
): value is MissionState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<MissionState>;

  if (
    typeof state.day !== "number" ||
    !Number.isInteger(state.day) ||
    state.day < 1 ||
    state.day > 30
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

  if (
    !state.resources ||
    typeof state.resources !== "object"
  ) {
    return false;
  }

  const resourceNames = [
    "oxygen",
    "water",
    "food",
    "power",
    "health",
  ] as const;

  return resourceNames.every((name) => {
    const amount = state.resources?.[name];

    return (
      typeof amount === "number" &&
      Number.isFinite(amount) &&
      amount >= 0 &&
      amount <= 100
    );
  });
}

// ==========================================
// GET — API STATUS
// ==========================================

export async function GET() {
  return NextResponse.json({
    success: true,
    game: "OUTPOST 30",
    engine: "Lunar Mission Simulator",
    status: "online",
    totalDays: 30,
    nasaIntegration: true,
    nasaMissionDays: [8, 16, 26],
    actions: [
      "start",
      "challenge",
      "decide",
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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const { action, state, choiceId } = body;

    // --------------------------------------
    // ACTION 1: START MISSION
    // --------------------------------------

    if (action === "start") {
      const newMission = startMission();

      const challenge = await getNASAMissionChallenge(
        newMission.day
      );

      return NextResponse.json({
        success: true,
        message: "Welcome to OUTPOST 30, Commander!",
        state: newMission,
        challenge,
      });
    }

    // All other actions need a valid state.
    if (!isMissionState(state)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid mission state is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // ACTION 2: GET CURRENT CHALLENGE
    // --------------------------------------

    if (action === "challenge") {
      if (state.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Mission is no longer active.",
          },
          { status: 400 }
        );
      }

      const challenge = await getNASAMissionChallenge(
        state.day
      );

      return NextResponse.json({
        success: true,
        day: state.day,
        challenge,
        resources: state.resources,
        score: state.score,
        isNASAMission: isNASAMissionDay(state.day),
        nasaEventId: challenge?.nasaEventId ?? null,
        nasaSource: challenge?.nasaSource ?? null,
      });
    }

    // --------------------------------------
    // ACTION 3: MAKE PLAYER DECISION
    // --------------------------------------

    if (action === "decide") {
      if (typeof choiceId !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "A choice ID is required.",
          },
          { status: 400 }
        );
      }

      if (state.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Mission is no longer active.",
          },
          { status: 400 }
        );
      }

      // Retrieve the appropriate mission challenge.
      const challenge = await getNASAMissionChallenge(
        state.day
      );

      if (!challenge) {
        return NextResponse.json(
          {
            success: false,
            error: "Mission challenge not found.",
          },
          { status: 404 }
        );
      }

      const selectedChoice = challenge.choices.find(
        (choice) => choice.id === choiceId
      );

      if (!selectedChoice) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid mission decision.",
          },
          { status: 400 }
        );
      }

      // Apply NASA-specific or standard consequences.
      const updatedState = makeDecision(
        state,
        choiceId,
        challenge
      );

      const lastDecision =
        updatedState.history[
          updatedState.history.length - 1
        ];

      // Retrieve the next day's challenge.
      const nextChallenge =
        updatedState.status === "active"
          ? await getNASAMissionChallenge(
              updatedState.day
            )
          : null;

      return NextResponse.json({
        success: true,
        message: lastDecision.feedback,
        decision: lastDecision,
        nasaEventId: challenge.nasaEventId ?? null,
        nasaSource: challenge.nasaSource ?? null,
        wasNASAMission: Boolean(challenge.nasaEventId),
        state: updatedState,
        nextChallenge,
        summary: getMissionSummary(updatedState),
      });
    }

    // --------------------------------------
    // ACTION 4: MISSION SUMMARY
    // --------------------------------------

    if (action === "summary") {
      return NextResponse.json({
        success: true,
        summary: getMissionSummary(state),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unknown mission action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Mission API Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal mission error.",
      },
      { status: 500 }
    );
  }
}