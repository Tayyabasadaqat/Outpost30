
"use client";

import MissionIntro from "@/components/MissionIntro";
import type { FocusTarget } from "@/components/LunarScene";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";


import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Rocket,
  Sparkles,
} from "lucide-react";

import ResourceMeters from "@/components/ResourceMeters";

import MissionCard, {
  type MissionOption,
} from "@/components/MissionCard";

import MissionResult from "@/components/MissionResult";

import { frontendMissions } from "@/data/frontendMissions";

const LunarScene = dynamic(
  () => import("@/components/LunarScene"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-cyan-100">
        Preparing your Moon base... 🌙
      </div>
    ),
  }
);

type Resources = {
  power: number;
  lifeSupport: number;
  crewSafety: number;
};

const initialResources: Resources = {
  power: 80,
  lifeSupport: 85,
  crewSafety: 90,
};

const missionFocus: Record<number, FocusTarget> = {
  1: "Solar Panels",
  2: "Greenhouse",
  3: "Rover",
};

type GameScreen =
  | "base"
  | "intro"
  | "mission"
  | "result"
  | "finished";
function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function GamePage() {

  const [focusedArea, setFocusedArea] =
  useState<FocusTarget>(null);

  const [missionIndex, setMissionIndex] = useState(0);

  const [resources, setResources] =
    useState<Resources>({ ...initialResources });

  const [screen, setScreen] = useState<GameScreen>("base");

  const [selectedOption, setSelectedOption] =
    useState<MissionOption | null>(null);

  const [selectedBuilding, setSelectedBuilding] =
    useState<string | null>(null);

  const mission = frontendMissions[missionIndex];
  
  useEffect(() => {
  if (screen !== "intro") return;

  const timer = window.setTimeout(() => {
    setScreen("mission");
  }, 2600);

  return () => window.clearTimeout(timer);
}, [screen, missionIndex]);

  // Called once when the player confirms a decision.
  function handleDecision(option: MissionOption) {
    setResources((previous) => ({
      power: clamp(
        previous.power + (option.changes.power ?? 0)
      ),
      lifeSupport: clamp(
        previous.lifeSupport +
          (option.changes.lifeSupport ?? 0)
      ),
      crewSafety: clamp(
        previous.crewSafety +
          (option.changes.crewSafety ?? 0)
      ),
    }));

    setSelectedOption(option);
    setScreen("result");
  }

  function handleNextMission() {
  if (missionIndex + 1 >= frontendMissions.length) {
    setScreen("finished");
    return;
  }

  const nextIndex = missionIndex + 1;
  const nextMission = frontendMissions[nextIndex];

  setMissionIndex(nextIndex);
  setFocusedArea(missionFocus[nextMission.day] ?? null);

  setSelectedOption(null);
  setSelectedBuilding(null);
  setScreen("base");
}

  function restartDemo() {
    setMissionIndex(0);
    setResources({ ...initialResources });
    setSelectedOption(null);
    setSelectedBuilding(null);
    setFocusedArea(null);
    setScreen("base");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080e22] text-white">

      {/* INTERACTIVE 3D MOON WORLD */}
      <div className="absolute inset-0">
      <LunarScene
  explore={false}
  focus={focusedArea}
  onSelect={(place) => {
    setSelectedBuilding(place);
    setFocusedArea(place);
  }}
/>
      </div>

      {/* GRADIENT OVERLAY */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080e22] via-transparent to-[#080e22]/40" />

      {/* TOP GAME HUD */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-3 p-4 sm:p-8">

        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-[#101b33]/85 px-4 py-3 text-sm font-bold backdrop-blur-xl transition hover:bg-[#243651]"
        >
          <ArrowLeft size={17} />
          Base
        </Link>

        <div className="rounded-full border border-cyan-200/20 bg-[#101b33]/85 px-5 py-3 text-xs font-extrabold tracking-[0.15em] backdrop-blur-xl sm:text-sm">
          DAY {String(mission.day).padStart(2, "0")} / 30
        </div>

      </header>

      {/* CLICKABLE BUILDING INFORMATION */}
      {selectedBuilding && screen === "base" && (
        <div className="pointer-events-auto absolute right-4 top-24 z-10 w-60 rounded-2xl border border-cyan-200/20 bg-[#101b33]/95 p-4 shadow-xl backdrop-blur-xl sm:right-8">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-cyan-200">
                MOON BASE
              </p>

              <h2 className="mt-1 text-lg font-black">
                {selectedBuilding}
              </h2>
            </div>

            <button
              onClick={() => setSelectedBuilding(null)}
              aria-label="Close building info"
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM GAME HUD */}
      {screen !== "finished" && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-8">
          <div className="pointer-events-auto mx-auto max-w-3xl space-y-5">

            <ResourceMeters
              power={resources.power}
              lifeSupport={resources.lifeSupport}
              crewSafety={resources.crewSafety}
            />

            {screen === "base" && (
              <button
                onClick={() => {
  setFocusedArea(missionFocus[mission.day] ?? null);
  setSelectedBuilding(null);
  setScreen("intro");
}}
                className="mx-auto flex items-center gap-3 rounded-2xl bg-[#ffd080] px-8 py-4 font-black text-[#17213a] shadow-lg shadow-amber-500/20 transition hover:scale-105 hover:bg-[#ffe0a6]"
              >
                <Rocket size={20} />
                BEGIN DAY {String(mission.day).padStart(2, "0")}
              </button>
            )}

            {screen === "result" && (
              <p className="text-center text-sm font-semibold text-emerald-200">
                <CheckCircle2
                  size={17}
                  className="mr-2 inline"
                />
                Decision recorded!
              </p>
            )}

          </div>
        </div>
      )}
 
{/* CINEMATIC MISSION INTRODUCTION */}
{screen === "intro" && (
  <MissionIntro
    day={mission.day}
    title={mission.title}
    location={
      mission.day === 1
        ? "Solar Power Station"
        : mission.day   === 2
          ? "Moon Greenhouse"
          : mission.day === 3
            ? "Lunar Rover"
            : "Moon Base"
    }
    onSkip={() => setScreen("mission")}
  />
)}

      {/* MISSION POPUP */}
      {screen === "mission" && (
        <MissionCard
          key={mission.day}
          mission={mission}
          onClose={() => setScreen("base")}
          onConfirm={handleDecision}
        />
      )}

      {/* RESULT POPUP */}
      {screen === "result" && selectedOption && (
        <MissionResult
          mission={mission}
          option={selectedOption}
          onContinue={handleNextMission}
          isLastMission={
            missionIndex === frontendMissions.length - 1
          }
        />
      )}

      {/* DEMO COMPLETE */}
      {screen === "finished" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/85 p-5 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[30px] border border-amber-200/20 bg-[#101b34] p-8 text-center shadow-2xl sm:p-12">

            <div className="mb-6 text-7xl">🏆</div>

            <div className="mb-3 flex items-center justify-center gap-2 text-amber-200">
              <Sparkles size={18} />
              <span className="text-xs font-black tracking-widest">
                DEMO COMPLETED
              </span>
              <Sparkles size={18} />
            </div>

            <h1 className="text-3xl font-black sm:text-4xl">
              Great Job, Commander!
            </h1>

            <p className="mt-5 leading-7 text-slate-300">
              You completed all 3 sample missions!
              The full 30-day adventure is coming next.
            </p>

            <div className="mt-7">
              <ResourceMeters
                power={resources.power}
                lifeSupport={resources.lifeSupport}
                crewSafety={resources.crewSafety}
              />
            </div>

            <button
              onClick={restartDemo}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ffd080] px-6 py-4 font-black text-[#17213a] transition hover:bg-[#ffe0a6]"
            >
              <RotateCcw size={19} />
              PLAY DEMO AGAIN
            </button>

          </div>
        </div>
      )}
    </main>
  );
}
