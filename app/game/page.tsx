"use client";
import RoverExploration from "@/components/RoverExploration";
import LunarLanding from "@/components/LunarLanding";
import LifeSupportPipes from "@/components/LifeSupportPipes";
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

import MissionStrategy, {
  type Strategy,
} from "@/components/MissionStrategy";

// Local-only snapshots for replaying previous days while testing.
const DEV_HISTORY_KEY = "outpost30_dev_day_snapshots_v1";

function readDaySnapshots(): Record<number, GameState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEV_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Record<number, GameState>) : {};
  } catch {
    return {};
  }
}

function saveDaySnapshot(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    const snapshots = readDaySnapshots();
    // Preserve the FIRST state for that day, not a partially played state.
    if (!snapshots[state.day]) {
      snapshots[state.day] = structuredClone(state);
      localStorage.setItem(DEV_HISTORY_KEY, JSON.stringify(snapshots));
    }
  } catch (error) {
    console.warn("Could not save developer day snapshot", error);
  }
}

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
  | "landing"
  | "lifeSupport"
  | "rover"
  | "repair"
  | "water"
  | "emergency"
  | "result"
  | "finished"
  | "strategy";

type Outcome = {
  title: string;
  message: string;
  effects: ResourceChanges;
};

const scienceNotes: Record<number, string> = {
  1: "A successful lunar landing requires controlling descent speed and landing position. The Apollo lunar modules used throttleable descent engines and astronaut-guided landing procedures.",
  2: "Crewed spacecraft need carefully controlled cabin oxygen and pressure. Real life-support systems use sensors, valves, and gas management equipment; the puzzle simplifies this process.",
  3: "Solar arrays convert sunlight into electricity. Dust accumulation and shadows can reduce the power available to a lunar base.",
  4: "Recycling water reduces the amount of fresh water that must be carried from Earth. The real International Space Station uses multiple water-recovery processes.",
  5: "Lunar rovers can help explore places that would be difficult or risky for astronauts to reach on foot. Scientists study rock samples to understand lunar geology.",
};

type ActivityPerformance = {
  day: number;
  strategy: Strategy;
  seconds: number;
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

  const [selectedStrategy, setSelectedStrategy] =
    useState<Strategy | null>(null);

  // Client-side performance metrics. These do NOT alter backend resources yet.
  const activityStartedAt = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [performance, setPerformance] = useState<ActivityPerformance | null>(null);

  useEffect(() => {
    const active = screen === "landing" || screen === "lifeSupport" || screen === "repair" || screen === "water" || screen === "rover";
    if (!active) return;

    // A retry after closing the activity starts a fresh run.
    if (activityStartedAt.current === null) {
      activityStartedAt.current = Date.now();
      setElapsedSeconds(0);
    }
    const update = () => {
      if (activityStartedAt.current !== null) {
        setElapsedSeconds(Math.floor((Date.now() - activityStartedAt.current) / 1000));
      }
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  // The strategy is selected before each activity.
  function beginActivity(strategy: Strategy) {
    if (!challenge) return;

    setSelectedStrategy(strategy);
    setPerformance(null);
    activityStartedAt.current = null;
    setElapsedSeconds(0);
    setError("");

    if (challenge.day === 1) {
      setScreen("landing");
    } else if (challenge.day === 2) {
      setScreen("lifeSupport");
    } else if (challenge.day === 3) {
      setScreen("repair");
    } else if (challenge.day === 4) {
      setScreen("water");
    } else if (challenge.day === 5) {
      setScreen("rover");
    } else {
      // Retain the existing decision interface for other days.
      setSelectedChoice(strategy);
      setScreen("mission");
    }
  }

  // Submit the actual chosen strategy after a minigame succeeds.
  function completeActivity() {
    if (!challenge || !selectedStrategy) {
      setError("Choose a mission strategy before playing.");
      return;
    }

    const choice = challenge.choices.find(
      (item) => item.id === selectedStrategy
    );

    if (!choice) {
      setError("Selected strategy is not available for this mission.");
      return;
    }

    const elapsed = activityStartedAt.current === null
      ? elapsedSeconds
      : Math.floor((Date.now() - activityStartedAt.current) / 1000);
    setPerformance({
      day: challenge.day,
      strategy: selectedStrategy,
      seconds: elapsed,
    });
    activityStartedAt.current = null;
    void submitDecision(choice);
  }

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

          saveDaySnapshot(saved);
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

          saveDaySnapshot(data.state);
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
    setScreen("strategy");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [screen, challenge?.day]);

  function beginDay() {
    setError("");
    setSelectedStrategy(null);
    setPerformance(null);
    activityStartedAt.current = null;
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

      saveDaySnapshot(gameState);
      saveDaySnapshot(data.state);
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

      saveDaySnapshot(gameState);
      saveDaySnapshot(data.state);
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
    setPerformance(null);
    activityStartedAt.current = null;
    setSelectedStrategy(null);
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

      if (typeof window !== "undefined") {
        localStorage.removeItem(DEV_HISTORY_KEY);
      }
      saveDaySnapshot(data.state);
      setGameState(data.state);
      setChallenge(data.challenge ?? null);
      setEmergency(data.emergency ?? null);
      setNextChallenge(null);
      setNextEmergency(null);
      setOutcome(null);
      setPerformance(null);
      activityStartedAt.current = null;
      setSelectedStrategy(null);
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

  // Development testing only: restore the ENTIRE previous day's saved state.
  async function goToPreviousDay() {
    if (!gameState || gameState.day <= 1 || busy) return;

    const previous = readDaySnapshots()[gameState.day - 1];
    if (!previous) {
      setError("No saved snapshot for that day. Snapshots are created as you play.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const data = await missionRequest({
        action: "challenge",
        state: previous,
      });
      // Validate challenge retrieval BEFORE changing local state.
      if (previous.status === "active" && !data.challenge && !data.emergency) {
        throw new Error("Could not load the earlier day's mission.");
      }

      // Forget future checkpoints: the player may make different decisions now.
      const snapshots = readDaySnapshots();
      for (const key of Object.keys(snapshots)) {
        if (Number(key) > previous.day) delete snapshots[Number(key)];
      }
      localStorage.setItem(DEV_HISTORY_KEY, JSON.stringify(snapshots));

      setGameState(previous);
      saveMission(previous);
      setChallenge(data.challenge ?? null);
      setEmergency(data.emergency ?? null);
      setNextChallenge(null);
      setNextEmergency(null);
      setOutcome(null);
      setPerformance(null);
      activityStartedAt.current = null;
      setSelectedStrategy(null);
      setSelectedChoice(null);
      setSelectedBuilding(null);
      setFocus(getMissionFocus(data.challenge ?? null));
      setScreen("base");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore day.");
    } finally {
      setBusy(false);
    }
  }

  const isFinished =
    gameState?.status === "completed" ||
    gameState?.status === "failed";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000814] text-white">
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

        <div className="pointer-events-auto flex items-center gap-2">
          {process.env.NODE_ENV === "development" &&
            screen === "base" && gameState && gameState.day > 1 && (
              <button
                type="button"
                onClick={() => void goToPreviousDay()}
                disabled={busy}
                title="Developer testing: restore the previous day's complete saved state"
                className="flex items-center gap-1 rounded-full border border-[#ffc300]/50 bg-[#001d3d]/95 px-3 py-3 text-xs font-bold text-[#ffd60a] disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">PREVIOUS DAY (TEST)</span>
                <span className="sm:hidden">TEST -1</span>
              </button>
            )}
          <div className="rounded-full border border-white/15 bg-[#001d3d]/90 px-4 py-3 text-sm font-black backdrop-blur-xl">
            DAY {String(gameState?.day ?? 1).padStart(2, "0")} / 30
          </div>
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
                className="mx-auto flex items-center gap-3 rounded-2xl bg-[#ffc300] px-8 py-4 font-black text-[#17213a] transition hover:scale-105"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000814]/90 p-6">
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
                  className="rounded-xl bg-[#ffc300] px-6 py-3 font-bold text-slate-900 disabled:opacity-50"
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
          onSkip={() => setScreen("strategy")}
        />
      )}

      {/* STRATEGY SELECTION — BEFORE THE DAILY ACTIVITY */}
      {screen === "strategy" && challenge && (
        <MissionStrategy
          day={challenge.day}
          title={challenge.title}
          description={challenge.description}
          onChoose={beginActivity}
        />
      )}

      {/* DAY 1 — INTERACTIVE 3D LUNAR LANDING */}
      {screen === "landing" && challenge?.day === 1 && (
        <LunarLanding
          key={`landing-${gameState?.day}-${selectedStrategy}`}
          strategy={selectedStrategy ?? "safe"}
          busy={busy}
          onClose={() => setScreen("base")}
          onComplete={completeActivity}
        />
      )}

      {/* DAY 2 — LIFE SUPPORT PIPE NETWORK */}
      {screen === "lifeSupport" && challenge?.day === 2 && (
        <LifeSupportPipes
          key={`life-support-${gameState?.day}-${selectedStrategy}`}
          strategy={selectedStrategy ?? "safe"}
          busy={busy}
          onClose={() => setScreen("base")}
          onComplete={completeActivity}
        />
      )}

      {/* INTERACTIVE SOLAR REPAIR — DAY 3 */}
{screen === "repair" && challenge?.day === 3 && (
  <SolarRepair
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={completeActivity}
  />
)}

{/* INTERACTIVE WATER RECYCLING — DAY 4 */}
{screen === "water" && challenge?.day === 4 && (
  <WaterRecycling
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={completeActivity}
  />
)}

{/* DAY 5 — PLAYABLE ROVER EXPEDITION */}
{screen === "rover" && challenge?.day === 5 && (
  <RoverExploration
    busy={busy}
    onClose={() => setScreen("base")}
    onComplete={completeActivity}
  />
)}

      {/* Real gameplay elapsed time for Days 3, 4 and 5 */}
      {(screen === "landing" || screen === "lifeSupport" || screen === "repair" || screen === "water" || screen === "rover") && !busy && (
        <div className="pointer-events-none fixed right-4 top-[76px] z-[80] rounded-xl border border-[#ffc300]/40 bg-[#000814]/90 px-4 py-2 text-xs font-bold text-[#ffd60a] shadow-lg">
          MISSION TIME · {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
          {String(elapsedSeconds % 60).padStart(2, "0")}
        </div>
      )}

      {/* Normal mission choices */}
      {screen === "mission" && challenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/75 p-4 backdrop-blur-md">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="real-mission-title"
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-cyan-200/20 bg-[#001d3d] p-6 shadow-2xl sm:p-8"
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc300] px-6 py-4 font-black text-slate-900 disabled:opacity-40"
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
          <section className="w-full max-w-lg rounded-[28px] border border-white/15 bg-[#001d3d] p-7 text-center shadow-2xl">
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

            {performance && (
              <div className="mb-5 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-[#003566] bg-[#000814] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Completion time</p>
                  <p className="mt-1 text-xl font-black text-[#ffd60a]">
                    {Math.floor(performance.seconds / 60)}m {performance.seconds % 60}s
                  </p>
                </div>
                <div className="rounded-xl border border-[#003566] bg-[#000814] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Your approach</p>
                  <p className="mt-1 text-xl font-black capitalize text-[#ffd60a]">
                    {performance.strategy === "safe" ? "Careful" : performance.strategy === "risky" ? "Quick" : "Emergency"}
                  </p>
                </div>
              </div>
            )}

            <EffectLabels effects={outcome.effects} />

            {performance && scienceNotes[performance.day] && (
              <div className="mt-5 rounded-xl border border-[#ffc300]/25 bg-[#000814] p-4 text-left">
                <p className="text-xs font-black tracking-widest text-[#ffd60a]">SPACE SCIENCE DISCOVERY</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{scienceNotes[performance.day]}</p>
              </div>
            )}

            <p className="mt-4 text-xs text-slate-400">
              Changes include simulated mission operations.
            </p>

            <button
              onClick={continueGame}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc300] p-4 font-black text-slate-900"
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
          <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-amber-200/20 bg-[#001d3d] p-7 text-center shadow-2xl sm:p-10">
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
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc300] p-4 font-black text-slate-900 disabled:opacity-50"
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
