
"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Rocket,
  X,
} from "lucide-react";

export type ResourceChanges = {
  power?: number;
  lifeSupport?: number;
  crewSafety?: number;
};

export type MissionOption = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  changes: ResourceChanges;
  result: string;
};

export type Mission = {
  day: number;
  title: string;
  description: string;
  emoji: string;
  options: MissionOption[];
  scienceFact: string;
};

type MissionCardProps = {
  mission: Mission;
  onClose: () => void;
  onConfirm: (option: MissionOption) => void;
};

export default function MissionCard({
  mission,
  onClose,
  onConfirm,
}: MissionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );

  const selectedOption = mission.options.find(
    (option) => option.id === selectedId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030816]/75 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-title"
        className="animate-[missionEnter_350ms_ease-out] relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-cyan-200/20 bg-[#101b34] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-8"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-cyan-200">
            MISSION {String(mission.day).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close mission"
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mission introduction */}
        <div className="mb-7 text-center">
          <div className="mb-4 text-6xl">
            {mission.emoji}
          </div>

          <h2
            id="mission-title"
            className="text-3xl font-black tracking-tight sm:text-4xl"
          >
            {mission.title}
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            {mission.description}
          </p>
        </div>

        {/* Decisions */}
        <div className="space-y-3">
          {mission.options.map((option) => {
            const isSelected = selectedId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(option.id)}
                className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "scale-[1.01] border-cyan-300 bg-cyan-300/15 shadow-[0_0_25px_rgba(103,232,249,0.12)]"
                    : "border-white/10 bg-white/5 hover:border-cyan-200/40 hover:bg-white/10"
                }`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl">
                  {option.emoji}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold">
                    {option.title}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-300">
                    {option.description}
                  </span>
                </span>

                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-cyan-300 bg-cyan-300 text-[#071323]"
                      : "border-white/30"
                  }`}
                >
                  {isSelected && <Check size={15} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Confirm action */}
        <button
          type="button"
          disabled={!selectedOption}
          onClick={() => {
            if (selectedOption) onConfirm(selectedOption);
          }}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ffd080] px-6 py-4 font-black text-[#14213c] transition hover:bg-[#ffe0a6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Rocket size={20} />
          CONFIRM DECISION
          <ArrowRight size={19} />
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Every choice has a consequence, Commander!
        </p>
      </div>
    </div>
  );
}
