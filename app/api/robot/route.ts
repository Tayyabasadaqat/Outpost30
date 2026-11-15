
/* ==========================================
   OUTPOST 30 — ORBI ROBOT API

   POST /api/robot

   Mission-aware educational assistant
   NASA facts, hints, and curated answers

   No external AI API required.
   ========================================== */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  processRobotRequest,
  type RobotAction,
  type RobotContext,
} from "@/lib/robot/robotKnowledge";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

// ==========================================
// API TYPES
// ==========================================

type RobotRequestBody = {
  action?: RobotAction;
  context?: RobotContext;

  question?: string;

  previousFactId?: string | null;
  previousHint?: string | null;
};

// ==========================================
// VALIDATION HELPERS
// ==========================================

function isValidAction(
  value: unknown
): value is RobotAction {
  return (
    value === "question" ||
    value === "fact" ||
    value === "hint"
  );
}

function isValidContext(
  value: unknown
): value is RobotContext {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const context = value as Partial<RobotContext>;

  if (
    !Number.isInteger(context.day) ||
    (context.day ?? 0) < 1 ||
    (context.day ?? 0) > 30
  ) {
    return false;
  }

  if (
    context.missionTitle !== undefined &&
    (
      typeof context.missionTitle !== "string" ||
      context.missionTitle.length > 200
    )
  ) {
    return false;
  }

  if (
    context.missionDescription !== undefined &&
    (
      typeof context.missionDescription !== "string" ||
      context.missionDescription.length > 1000
    )
  ) {
    return false;
  }

  if (
    context.difficulty !== undefined &&
    ![
      "safe",
      "risky",
      "dangerous",
    ].includes(context.difficulty)
  ) {
    return false;
  }

  if (
    context.gameStatus !== undefined &&
    (
      typeof context.gameStatus !== "string" ||
      context.gameStatus.length > 60
    )
  ) {
    return false;
  }

  return true;
}

function errorResponse(
  error: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

// ==========================================
// GET — ROBOT API STATUS
// ==========================================

export async function GET() {
  return NextResponse.json({
    success: true,
    assistant: "ORBI",
    game: "OUTPOST 30",
    status: "online",

    description:
      "Mission-aware educational robot assistant.",

    supportedDays: 30,

    capabilities: [
      "NASA educational facts",
      "Mission-specific hints",
      "Curated space-science questions",
      "Local fallback support",
    ],

    actions: [
      "question",
      "fact",
      "hint",
    ],

    requiresApiKey: false,
  });
}

// ==========================================
// POST — ASK ORBI
// ==========================================

export async function POST(
  request: NextRequest
) {
  try {
    let body: RobotRequestBody;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body."
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request body must be an object."
      );
    }

    // --------------------------------------
    // VALIDATE ACTION
    // --------------------------------------

    if (!isValidAction(body.action)) {
      return errorResponse(
        "Action must be question, fact, or hint."
      );
    }

    // --------------------------------------
    // VALIDATE MISSION CONTEXT
    // --------------------------------------

    if (!isValidContext(body.context)) {
      return errorResponse(
        "Valid mission context is required. " +
          "Day must be between 1 and 30."
      );
    }

    // --------------------------------------
    // VALIDATE OPTIONAL FIELDS
    // --------------------------------------

    if (
      body.question !== undefined &&
      (
        typeof body.question !== "string" ||
        body.question.length > 500
      )
    ) {
      return errorResponse(
        "Question must be a string of up to 500 characters."
      );
    }

    if (
      body.previousFactId !== undefined &&
      body.previousFactId !== null &&
      (
        typeof body.previousFactId !== "string" ||
        body.previousFactId.length > 40
      )
    ) {
      return errorResponse(
        "Invalid previous fact identifier."
      );
    }

    if (
      body.previousHint !== undefined &&
      body.previousHint !== null &&
      (
        typeof body.previousHint !== "string" ||
        body.previousHint.length > 500
      )
    ) {
      return errorResponse(
        "Invalid previous hint."
      );
    }

    // --------------------------------------
    // PROCESS MISSION REQUEST
    // --------------------------------------

    const result = processRobotRequest(
      body.action,
      body.context,
      {
        question: body.question,
        previousFactId: body.previousFactId,
        previousHint: body.previousHint,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...result,

      assistant: "ORBI",

      // Educational facts and game rules
      // should remain distinguishable.
      educationalNotice:
        "NASA facts are educational. " +
        "Mission hints refer to the simulated OUTPOST 30 game.",

      poweredBy:
        "Curated NASA educational knowledge",
    });

  } catch (error) {
    console.error(
      "ORBI Robot API Error:",
      error
    );

    return errorResponse(
      "ORBI encountered a problem. Please try again.",
      500
    );
  }
}