
"use client";

import {
  ArrowRight,
  BookOpen,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import type {
  Mission,
  MissionOption,
  ResourceChanges,
} from "./MissionCard";

type MissionResultProps = {
  mission: Mission;
  option: MissionOption;
  onContinue: () => void;
  isLastMission?: boolean;
};

const resourceInfo = [
  {
    key: "power",
    label: "Power",
    icon: Zap,
  },
  {
    key: "lifeSupport",
    label: "Life Support",
    icon: HeartPulse,
  },
  {
    key: "crewSafety",
    label: "Crew Safety",
    icon: ShieldCheck,
  },
] as const;

export default function MissionResult({
  mission,
  option,
  onContinue,
  isLastMission = false,
}: MissionResultProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/80 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="animate-[missionEnter_350ms_ease-out] max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-emerald-300/20 bg-[#101b34] p-6 text-center text-white shadow-2xl sm:p-9"
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-300/10">
            <Sparkles
              size={38}
              className="text-emerald-300"
            />
          </div>
        </div>

        <p className="mb-3 text-xs font-extrabold tracking-[0.2em] text-emerald-300">
          DECISION COMPLETE
        </p>

        <h2
          id="result-title"
          className="text-3xl font-black sm:text-4xl"
        >
          Mission Update!
        </h2>

        <p className="mt-4 leading-7 text-slate-300">
          {option.result}
        </p>

        {/* Resource effects */}
        <div className="mt-7 grid grid-cols-3 gap-2">
          {resourceInfo.map((resource) => {
            const Icon = resource.icon;
            const change =
              option.changes[
                resource.key as keyof ResourceChanges
              ] ?? 0;

            const isPositive = change > 0;
            const isNegative = change < 0;

            return (
              <div
                key={resource.key}
                className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4"
              >
                <Icon
                  size={21}
                  className="mx-auto mb-3 text-slate-300"
                />

                <div
                  className={`text-xl font-black ${
                    isPositive
                      ? "text-emerald-300"
                      : isNegative
                        ? "text-rose-300"
                        : "text-slate-300"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {change}
                </div>

                <p className="mt-2 text-[10px] font-semibold text-slate-300">
                  {resource.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Educational fact */}
        <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5 text-left">
          <div className="mb-2 flex items-center gap-2 text-cyan-200">
            <BookOpen size={19} />

            <span className="text-xs font-black tracking-wider">
              SPACE SCIENCE!
            </span>
          </div>

          <p className="text-sm leading-6 text-slate-200">
            {mission.scienceFact}
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ffd080] px-6 py-4 font-black text-[#14213c] transition hover:bg-[#ffe0a6]"
        >
          {isLastMission
            ? "FINISH DEMO"
            : "NEXT MISSION"}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
