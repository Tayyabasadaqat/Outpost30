
"use client";

import { ArrowRight, Crosshair, Radio } from "lucide-react";

type MissionIntroProps = {
  day: number;
  title: string;
  location: string;
  onSkip: () => void;
};

export default function MissionIntro({
  day,
  title,
  location,
  onSkip,
}: MissionIntroProps) {
  return (
    <div className="mission-intro pointer-events-none fixed inset-0 z-40 overflow-hidden text-white">

      {/* Cinematic black bars */}
      <div className="mission-intro-bar absolute inset-x-0 top-0 h-[12vh] bg-[#030713]/95" />
      <div className="mission-intro-bar absolute inset-x-0 bottom-0 h-[12vh] bg-[#030713]/95" />

      {/* Subtle visual tint */}
      <div className="absolute inset-0 bg-[#071020]/15" />

      {/* Top label */}
      <div className="mission-intro-label absolute left-6 top-6 z-10 sm:left-12 sm:top-10">
        <div className="flex items-center gap-3 text-cyan-200">
          <Radio size={17} className="animate-pulse" />

          <span className="text-[11px] font-bold tracking-[0.25em]">
            MISSION CONTROL
          </span>
        </div>
      </div>

      {/* Center introduction */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="mission-intro-content text-center">

          <div className="mb-5 flex items-center justify-center gap-3 text-cyan-200">
            <Crosshair size={17} />

            <span className="text-xs font-extrabold tracking-[0.3em]">
              DAY {String(day).padStart(2, "0")} / 30
            </span>
          </div>

          <h2 className="text-4xl font-black tracking-tight drop-shadow-[0_6px_25px_rgba(0,0,0,0.8)] sm:text-6xl">
            {title}
          </h2>

          <p className="mt-5 text-xs font-bold tracking-[0.3em] text-[#ffd080] sm:text-sm">
            {location.toUpperCase()}
          </p>

        </div>
      </div>

      {/* Bottom controls */}
      <div className="mission-intro-bottom absolute bottom-7 left-6 right-6 z-10 flex items-center justify-between gap-4 sm:bottom-10 sm:left-12 sm:right-12">

        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />

          <span className="text-[10px] font-bold tracking-widest text-slate-300">
            APPROACHING MISSION AREA
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-[#101b33]/80 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-[#243651]"
        >
          SKIP
          <ArrowRight size={15} />
        </button>

      </div>

      {/* Progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div className="mission-intro-progress h-full bg-[#ffd080]" />
      </div>

    </div>
  );
}
