"use client";
import RoverExploration from "@/components/RoverExploration";
import SolarRepair from "@/components/SolarRepair";
import WaterRecycling from "@/components/WaterRecycling";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Rocket,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import MissionIntro from "@/components/MissionIntro";
import ResourceMeters from "@/components/ResourceMeters";

import type { FocusTarget } from "@/components/LunarScene";
import type {
  MissionChallenge,
  MissionChoice,
  MissionHistory,
  MissionState,
  ResourceChanges,
} from "@/lib/mission";
import type { GameEmergency } from "@/lib/emergency-engine";
import type { NASATimelineEntry } from "@/lib/nasa-event-engine";

import {
  loadMission,
  saveMission,
} from "@/lib/mission-storage";

const LunarScene = dynamic(
  () => import("@/components/LunarScene"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-cyan-100">
        Preparing your Moon base...
      </div>
    ),
  }
);

type GameState = MissionState & {
  nasaTimeline: NASATimelineEntry[];
  nasaDataMode: "live" | "historical";
  resolvedEmergencies: string[];
  emergencyHistory: {
    day: number;
    emergencyId: string;
    choiceId: string;
    feedback: string;
  }[];
};

type ApiResponse = {
  success: boolean;
  error?: string;
  message?: string;
  state?: GameState;
  challenge?: MissionChallenge | null;
  emergency?: GameEmergency | null;
  nextChallenge?: MissionChallenge | null;
  nextEmergency?: GameEmergency | null;
  decision?: MissionHistory;
};

type Screen =
  | "loading"
  | "base"
  | "intro"
  | "mission"
  | "rover"
  | "repair"
  | "water"
  | "emergency"
  | "result"
  | "finished";

type Outcome = {
  title: string;
  message: string;
  effects: ResourceChanges;
};

const resourceNames: Record<string, string> = {
  oxygen: "Oxygen",
  water: "Water",
  food: "Food",
  power: "Power",
  health: "Crew Health",
};

function isSavedGame(
  state: MissionState | null
): state is GameState {
  if (!state) return false;

  const value = state as Partial<GameState>;

  return (
    Array.isArray(value.nasaTimeline) &&
    Array.isArray(value.resolvedEmergencies) &&
    Array.isArray(value.emergencyHistory) &&
    (value.nasaDataMode === "live" ||
      value.nasaDataMode === "historical")
  );
}

async function missionRequest(
  body: Record<string, unknown>
): Promise<ApiResponse> {
  const response = await fetch("/api/mission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as ApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Mission request failed.");
  }

  return data;
}

function getMissionFocus(
  challenge: MissionChallenge | null
): FocusTarget {
  if (!challenge) return null;

  const text =
    `${challenge.category} ${challenge.title}`.toLowerCase();

  if (
    text.includes("greenhouse") ||
    text.includes("food") ||
    text.includes("plant")
  ) {
    return "Greenhouse";
  }

  if (
    text.includes("solar") ||
    text.includes("power") ||
    text.includes("battery")
  ) {
    return "Solar Panels";
  }

  if (
    text.includes("rover") ||
    text.includes("exploration") ||
    text.includes("navigation") ||
    text.includes("sample")
  ) {
    return "Rover";
  }

  return "Habitat";
}

function EffectLabels({
  effects,
}: {
  effects: ResourceChanges;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Object.entries(effects).map(([key, value]) => (
        <span
          key={key}
          className={`rounded-full border px-3 py-2 text-xs font-bold ${
            (value ?? 0) > 0
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
              : (value ?? 0) < 0
                ? "border-rose-300/25 bg-rose-300/10 text-rose-200"
                : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          {resourceNames[key] ?? key}:{" "}
          {(value ?? 0) > 0 ? "+" : ""}
          {value ?? 0}
        </span>
      ))}
    </div>
  );
}

export default function GamePage() {
  const initialized = useRef(false);

  const [gameState, setGameState] =
    useState<GameState | null>(null);

  const [challenge, setChallenge] =
    useState<MissionChallenge | null>(null);

  const [emergency, setEmergency] =
    useState<GameEmergency | null>(null);

  const [nextChallenge, setNextChallenge] =
    useState<MissionChallenge | null>(null);

  const [nextEmergency, setNextEmergency] =
    useState<GameEmergency | null>(null);

  const [screen, setScreen] = useState<Screen>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const [focus, setFocus] =
    useState<FocusTarget>(null);

  const [selectedBuilding, setSelectedBuilding] =
    useState<string | null>(null);

  const [selectedChoice, setSelectedChoice] =
    useState<string | null>(null);

  // Start a new game or restore an existing one.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initialize() {
      try {
        const saved = loadMission();

        if (isSavedGame(saved)) {
          const data = await missionRequest({
            action: "challenge",
            state: saved,
          });

          setGameState(saved);
          setChallenge(data.challenge ?? null);
          setEmergency(data.emergency ?? null);
          setScreen(
            saved.status === "active" ? "base" : "finished"
          );
        } else {
          const data = await missionRequest({
            action: "start",
          });

          if (!data.state) {
            throw new Error("Mission state was not returned.");
          }

          setGameState(data.state);
          setChallenge(data.challenge ?? null);
          setEmergency(data.emergency ?? null);
          saveMission(data.state);
          setScreen("base");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to start mission."
        );
        setScreen("loading");
      }
    }

    void initialize();
  }, []);

  // Show the cinematic introduction before choices.
  useEffect(() => {
    if (screen !== "intro") return;

    const timer = window.setTimeout(() => {
     setScreen(
  challenge?.day === 3
    ? "repair"
    : challenge?.day === 4
      ? "water"
      : challenge?.day === 5
        ? "rover"
        : "mission"
);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [screen, challenge?.day]);

  function beginDay() {
    setError("");
    setSelectedChoice(null);
    setSelectedBuilding(null);

    if (emergency) {
      setScreen("emergency");
      return;
    }

    if (!challenge) {
      setError("No mission challenge is available.");
      return;
    }

    setFocus(getMissionFocus(challenge));
    setScreen("intro");
  }

  async function submitDecision(choice: MissionChoice) {
    if (!gameState || busy) return;

    setBusy(true);
    setError("");

    try {
      const data = await missionRequest({
        action: "decide",
        state: gameState,
        choiceId: choice.id,
      });

      if (!data.state) {
        throw new Error("Updated mission state is missing.");
      }

      setGameState(data.state);
      saveMission(data.state);

      setNextChallenge(data.nextChallenge ?? null);
      setNextEmergency(data.nextEmergency ?? null);

      setOutcome({
        title: "Mission Update!",
        message:
          data.decision?.feedback ??
          data.message ??
          choice.feedback,
        effects: data.decision?.effects ?? choice.effects,
      });

      setScreen("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit decision."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resolveEmergency(choiceId: string) {
    if (!gameState || !emergency || busy) return;

    const choice = emergency.choices.find(
      (item) => item.id === choiceId
    );

    if (!choice) return;

    setBusy(true);
    setError("");

    try {
      const data = await missionRequest({
        action: "resolve-emergency",
        state: gameState,
        emergencyId: emergency.id,
        choiceId,
      });

      if (!data.state) {
        throw new Error("Updated mission state is missing.");
      }

      setGameState(data.state);
      saveMission(data.state);

      setNextEmergency(data.nextEmergency ?? null);
      setNextChallenge(data.challenge ?? null);

      setOutcome({
        title: "Emergency Response!",
        message: data.message ?? choice.feedback,
        effects: choice.effects,
      });

      setScreen("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resolve emergency."
      );
    } finally {
      setBusy(false);
    }
  }

  function continueGame() {
    setOutcome(null);
    setSelectedChoice(null);

    if (!gameState || gameState.status !== "active") {
      setScreen("finished");
      return;
    }

    setEmergency(nextEmergency);
    setChallenge(nextChallenge);
    setFocus(getMissionFocus(nextChallenge));
    setScreen("base");
  }

  async function startNewGame() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const data = await missionRequest({
        action: "start",
      });

      if (!data.state) {
        throw new Error("Unable to create a new mission.");
      }

      setGameState(data.state);
      setChallenge(data.challenge ?? null);
      setEmergency(data.emergency ?? null);
      setNextChallenge(null);
      setNextEmergency(null);
      setOutcome(null);
      setSelectedChoice(null);
      setFocus(null);
      setSelectedBuilding(null);

      saveMission(data.state);
      setScreen("base");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to restart the mission."
      );
    } finally {
      setBusy(false);
    }
  }

  const isFinished =
    gameState?.status === "completed" ||
    gameState?.status === "failed";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080e22] text-white">
      {/* 3D lunar environment */}
      <div className="absolute inset-0">
        <LunarScene
  explore={false}
  focus={focus}
  power={gameState?.resources.power ?? 90}
  health={gameState?.resources.health ?? 100}
  onSelect={(place) => {
    if (screen === "base") {
      setSelectedBuilding(place);
      setFocus(place);
    }
  }}
/>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080e22] via-transparent to-[#080e22]/40" />

      {/* Top navigation */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 sm:p-8">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-[#101b33]/85 px-4 py-3 text-sm font-bold backdrop-blur-xl"
        >
          <ArrowLeft size={17} />
          Base
        </Link>

        <div className="rounded-full border border-white/15 bg-[#101b33]/90 px-5 py-3 text-sm font-black backdrop-blur-xl">
          DAY {String(gameState?.day ?? 1).padStart(2, "0")} / 30
        </div>
      </header>

      {/* Selected building */}
      {selectedBuilding && screen === "base" && (
        <div className="absolute right-4 top-24 z-10 rounded-2xl border border-cyan-300/20 bg-[#101b33]/95 px-5 py-4 backdrop-blur-xl">
          <button
            onClick={() => setSelectedBuilding(null)}
            className="absolute right-3 top-2 text-slate-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-cyan-200">MOON BASE</p>
          <h2 className="mt-2 pr-6 text-lg font-black">
            {selectedBuilding}
          </h2>
        </div>
      )}

      {/* HUD */}
      {gameState && screen !== "finished" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-8">
          <div className="pointer-events-auto mx-auto max-w-4xl space-y-4">
            <ResourceMeters resources={gameState.resources} />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-[#101b33]/85 px-4 py-2 text-xs text-slate-200">
                ⭐ Score: {gameState.score}
              </span>

              <span className="rounded-full bg-[#101b33]/85 px-4 py-2 text-xs text-slate-200">
                Crew Morale: {gameState.crew.morale}%
              </span>
            </div>

            {screen === "base" && (
              <button
                onClick={beginDay}
                className="mx-auto flex items-center gap-3 rounded-2xl bg-[#ffd080] px-8 py-4 font-black text-[#17213a] transition hover:scale-105"
              >
                {emergency ? (
                  <>
                    <ShieldAlert size={20} />
                    RESPOND TO EMERGENCY
                  </>
                ) : (
                  <>
                    <Rocket size={20} />
                    BEGIN DAY {String(gameState.day).padStart(2, "0")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {screen === "loading" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080e22]/90 p-6">
          <div className="text-center">
            <LoaderCircle
              size={42}
              className="mx-auto mb-5 animate-spin text-cyan-300"
            />
            <h2 className="text-2xl font-black">
              Preparing Mission...
            </h2>

            {error && (
              <div className="mt-5 max-w-md space-y-4">
                <p className="text-sm text-rose-200">{error}</p>
                <button
                  onClick={startNewGame}
                  disabled={busy}
                  className="rounded-xl bg-[#ffd080] px-6 py-3 font-bold text-slate-900 disabled:opacity-50"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cinematic intro */}
      {screen === "intro" && challenge && (
        <MissionIntro
          day={gameState?.day ?? challenge.day}
          title={challenge.title}
          location={challenge.category}
          onSkip={() =>
  setScreen(
    challenge?.day === 3
      ? "repair"
      : challenge?.day === 4
        ? "water"
        : challenge?.day === 5
          ? "rover"
          : "mission"
  )
}
        />
      )}

{/* INTERACTIVE SOLAR REPAIR — DAY 3 */}
{screen === "repair" && challenge?.day === 3 && (
  <SolarRepair
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={() => {
      const safeChoice = challenge.choices.find(
        (choice) => choice.id === "safe"
      );

      if (safeChoice) {
        void submitDecision(safeChoice);
      } else {
        setError("Solar mission choice is missing.");
      }
    }}
  />
)}

{/* INTERACTIVE WATER RECYCLING — DAY 4 */}
{screen === "water" && challenge?.day === 4 && (
  <WaterRecycling
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={() => {
      const safeChoice = challenge.choices.find(
        (choice) => choice.id === "safe"
      );

      if (safeChoice) {
        void submitDecision(safeChoice);
      } else {
        setError("Water recycling mission choice is missing.");
      }
    }}
  />
)}

{/* DAY 5 — PLAYABLE ROVER EXPEDITION */}
{screen === "rover" && challenge?.day === 5 && (
  <RoverExploration
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={() => {
      const safeChoice = challenge.choices.find(
        (choice) => choice.id === "safe"
      );

      if (safeChoice) {
        void submitDecision(safeChoice);
      } else {
        setError("Rover mission choice is missing.");
      }
    }}
  />
)}

      {/* Normal mission choices */}
      {screen === "mission" && challenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/75 p-4 backdrop-blur-md">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="real-mission-title"
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-cyan-200/20 bg-[#101b34] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-cyan-200">
                DAY {challenge.day} · {challenge.category}
              </span>
              <button
                aria-label="Close mission"
                onClick={() => setScreen("base")}
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="real-mission-title"
              className="text-3xl font-black"
            >
              {challenge.title}
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              {challenge.description}
            </p>

            {challenge.nasaEventId && (
              <p className="mt-4 rounded-xl bg-cyan-300/10 p-3 text-xs text-cyan-200">
                NASA DONKI observation · {challenge.nasaEventId}
              </p>
            )}

            <div className="mt-7 space-y-3">
              {challenge.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => setSelectedChoice(choice.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedChoice === choice.id
                      ? "border-cyan-300 bg-cyan-300/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="block font-bold">
                    {choice.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-300">
                    {choice.description}
                  </span>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedChoice || busy}
              onClick={() => {
                const choice = challenge.choices.find(
                  (item) => item.id === selectedChoice
                );
                if (choice) void submitDecision(choice);
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd080] px-6 py-4 font-black text-slate-900 disabled:opacity-40"
            >
              {busy ? "Processing..." : "CONFIRM DECISION"}
              <ArrowRight size={19} />
            </button>
          </section>
        </div>
      )}

      {/* Emergency choices */}
      {screen === "emergency" && emergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#180c18]/85 p-4 backdrop-blur-md">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-title"
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-rose-300/30 bg-[#211528] p-6 shadow-2xl sm:p-8"
          >
            <AlertTriangle
              size={39}
              className="mb-4 text-rose-300"
            />

            <p className="text-xs font-black tracking-widest text-rose-300">
              {emergency.severity.toUpperCase()} ALERT
            </p>

            <h2
              id="emergency-title"
              className="mt-3 text-3xl font-black"
            >
              {emergency.title}
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              {emergency.description}
            </p>

            <div className="mt-7 space-y-3">
              {emergency.choices.map((choice) => (
                <button
                  key={choice.id}
                  disabled={busy}
                  onClick={() => {
                    void resolveEmergency(choice.id);
                  }}
                  className="block w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition hover:border-rose-300/50 hover:bg-white/10 disabled:opacity-50"
                >
                  <span className="block font-bold">
                    {choice.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-300">
                    {choice.description}
                  </span>
                </button>
              ))}
            </div>
            {busy && (
              <p className="mt-4 text-center text-sm">
                Applying emergency response...
              </p>
            )}
          </section>
        </div>
      )}

      {/* Results */}
      {screen === "result" && outcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/80 p-4 backdrop-blur-md">
          <section className="w-full max-w-lg rounded-[28px] border border-white/15 bg-[#101b34] p-7 text-center shadow-2xl">
            <CheckCircle2
              size={45}
              className="mx-auto mb-4 text-emerald-300"
            />

            <h2 className="text-3xl font-black">
              {outcome.title}
            </h2>

            <p className="my-6 leading-7 text-slate-300">
              {outcome.message}
            </p>

            <EffectLabels effects={outcome.effects} />

            <p className="mt-4 text-xs text-slate-400">
              Changes include simulated mission operations.
            </p>

            <button
              onClick={continueGame}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd080] p-4 font-black text-slate-900"
            >
              {isFinished ? "VIEW MISSION REPORT" : "CONTINUE"}
              <ArrowRight size={19} />
            </button>
          </section>
        </div>
      )}

      {/* Mission report */}
      {screen === "finished" && gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/90 p-4 backdrop-blur-xl">
          <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-amber-200/20 bg-[#101b34] p-7 text-center shadow-2xl sm:p-10">
            <Sparkles
              size={48}
              className="mx-auto mb-5 text-[#ffd080]"
            />

            <h1 className="text-3xl font-black">
              {gameState.status === "completed"
                ? "Mission Accomplished!"
                : "Mission Ended"}
            </h1>

            <p className="mt-4 text-slate-300">
              {gameState.status === "completed"
                ? "You guided your crew through 30 mission days!"
                : "The Moon base needs another brave commander."}
            </p>

            <div className="mt-7 space-y-3">
              <p className="text-xl font-bold">
                ⭐ Score: {gameState.score}
              </p>

              <p className="text-sm text-slate-300">
                Days completed: {gameState.history.length} / 30
              </p>

              <ResourceMeters resources={gameState.resources} />
            </div>

            <button
              onClick={startNewGame}
              disabled={busy}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd080] p-4 font-black text-slate-900 disabled:opacity-50"
            >
              <RotateCcw size={19} />
              {busy ? "Preparing..." : "START NEW MISSION"}
            </button>
          </section>
        </div>
      )}

      {/* Request errors */}
      {error && screen !== "loading" && (
        <div
          role="alert"
          className="fixed left-4 right-4 top-24 z-[70] mx-auto max-w-lg rounded-xl border border-rose-300/30 bg-[#321a26] p-4 text-sm text-rose-100 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
