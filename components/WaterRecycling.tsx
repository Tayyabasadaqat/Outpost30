
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  RotateCcw,
  X,
  Waves,
} from "lucide-react";

type Props = {
  onComplete: () => void;
  onClose: () => void;
  busy?: boolean;
};

const stages = [
  {
    id: "filter",
    label: "Particle Filter",
    icon: "▦",
    description: "Remove solid particles",
  },
  {
    id: "purify",
    label: "Purification",
    icon: "◈",
    description: "Treat the water",
  },
  {
    id: "tank",
    label: "Storage Tank",
    icon: "◉",
    description: "Store clean water",
  },
];

export default function WaterRecycling({
  onComplete,
  onClose,
  busy = false,
}: Props) {
  const [stage, setStage] = useState(0);
  const [flow, setFlow] = useState(90);
  const [waterLevel, setWaterLevel] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    "Select the first treatment stage."
  );

  const safeFlow = flow >= 40 && flow <= 65;
  const ready = stage === 3 && safeFlow;
  const complete = waterLevel >= 100;

  useEffect(() => {
    if (!running || complete) return;

    const interval = window.setInterval(() => {
      setWaterLevel((current) =>
        Math.min(100, current + 4)
      );
    }, 100);

    return () => window.clearInterval(interval);
  }, [running, complete]);

  function selectStage(index: number) {
    if (running || complete) return;

    if (index === stage) {
      setStage((current) => current + 1);
      setMessage(`${stages[index].label} activated.`);
    } else {
      setMessage(
        "Incorrect sequence! Follow the water treatment process."
      );
      setStage(0);
    }
  }

  function startSystem() {
    if (!ready) return;

    setRunning(true);
    setMessage("Water is moving through the recycling system!");
  }

  function reset() {
    setStage(0);
    setFlow(90);
    setWaterLevel(0);
    setRunning(false);
    setMessage("Select the first treatment stage.");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#02060e]/95 p-3 text-white backdrop-blur-xl sm:p-6">
      <div className="max-h-[96dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#0a1627] shadow-[0_30px_100px_#000a]">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 bg-[#102139] px-5 py-4">
          <div className="flex items-center gap-3">
            <Droplets size={25} className="text-cyan-300" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-300">
                OUTPOST 30 · LIFE SUPPORT
              </p>
              <h2 className="text-lg font-black">
                WATER RECYCLING SYSTEM
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close water system"
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">

          {/* MAIN WATER SYSTEM */}
          <section>
            <p className="mb-2 text-xs font-bold tracking-widest text-cyan-300">
              SYSTEM DIAGNOSTICS
            </p>

            <h3 className="text-2xl font-black">
              Restore clean water.
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Follow the treatment stages in the correct order.
              Then adjust the flow rate to fill the tank.
            </p>

            {/* Interactive stages */}
            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
              {stages.map((item, index) => {
                const active = index < stage;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={running || complete}
                    onClick={() => selectStage(index)}
                    className={`relative rounded-xl border p-3 text-center transition-all sm:p-5 ${
                      active
                        ? "border-cyan-300 bg-cyan-300/15"
                        : "border-white/15 bg-[#15283f] hover:border-cyan-300/60"
                    }`}
                  >
                    <span
                      className={`mb-3 block text-3xl sm:text-4xl ${
                        active ? "text-cyan-300" : "text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="block text-xs font-bold sm:text-sm">
                      {item.label}
                    </span>

                    <span className="mt-2 hidden text-xs text-slate-400 sm:block">
                      {item.description}
                    </span>

                    {active && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-2 top-2 text-emerald-300"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Flowing pipe visualization */}
            <div className="my-7 rounded-xl border border-white/10 bg-[#071220] p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">
                  WASTE WATER
                </span>

                <Waves size={23} className="text-cyan-300" />

                <span className="text-xs font-bold text-slate-300">
                  CLEAN WATER
                </span>
              </div>

              <div className="relative h-5 overflow-hidden rounded-full bg-[#23354a]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-blue-800 via-cyan-500 to-cyan-200 transition-all duration-500 ${
                    running ? "animate-pulse" : ""
                  }`}
                  style={{
                    width: `${
                      running || complete
                        ? 100
                        : (stage / 3) * 100
                    }%`,
                  }}
                />
              </div>

              <p
                role="status"
                className="mt-5 min-h-10 text-center text-sm text-cyan-100"
              >
                {message}
              </p>
            </div>

            {/* Water tank */}
            <div className="flex items-center gap-6 rounded-xl border border-white/10 bg-[#12243a] p-5">
              <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-b-2xl rounded-t-md border-2 border-cyan-200/50 bg-[#06111e]">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-blue-700 to-cyan-300 transition-all duration-200"
                  style={{ height: `${waterLevel}%` }}
                >
                  <div className="absolute inset-x-0 top-0 h-2 bg-cyan-100/40" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400">
                  CLEAN WATER STORAGE
                </p>

                <p className="mt-2 text-4xl font-black tabular-nums text-cyan-200">
                  {waterLevel}%
                </p>

                <p className="mt-3 text-sm text-slate-300">
                  {complete
                    ? "Tank filled. Recycling complete!"
                    : running
                      ? "Recycling in progress..."
                      : "Waiting for system activation"}
                </p>
              </div>
            </div>
          </section>

          {/* CONTROL PANEL */}
          <section className="rounded-xl border border-white/10 bg-[#102139] p-5">
            <p className="text-xs font-bold tracking-widest text-cyan-300">
              FLOW REGULATOR
            </p>

            <div className="py-8 text-center">
              <p className="text-6xl font-black tabular-nums">
                {flow}
                <span className="text-2xl text-slate-400">%</span>
              </p>

              <p
                className={`mt-4 text-xs font-black tracking-widest ${
                  safeFlow ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {safeFlow
                  ? "OPTIMAL FLOW"
                  : flow > 65
                    ? "FLOW TOO FAST"
                    : "FLOW TOO SLOW"}
              </p>
            </div>

            <input
              type="range"
              aria-label="Water flow rate"
              min={0}
              max={100}
              value={flow}
              disabled={running || complete}
              onChange={(event) =>
                setFlow(Number(event.target.value))
              }
              className="w-full cursor-pointer accent-cyan-300"
            />

            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span className="text-emerald-300">
                TARGET: 40–65%
              </span>
              <span>100%</span>
            </div>

            <div
              className={`mt-8 rounded-xl border p-4 ${
                ready || complete
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : "border-amber-400/30 bg-amber-400/5"
              }`}
            >
              <p className="font-bold">
                {complete
                  ? "✓ WATER SYSTEM RESTORED"
                  : ready
                    ? "✓ READY TO RECYCLE"
                    : "SYSTEM NOT READY"}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {complete
                  ? "Clean water is stored for your crew."
                  : ready
                    ? "All treatment stages are online."
                    : "Complete the treatment sequence and balance the flow."}
              </p>
            </div>

            <p className="mt-6 text-xs leading-6 text-slate-400">
              Spacecraft water systems recycle and purify
              water to reduce the need for fresh supplies.
            </p>
          </section>
        </div>

        {/* FOOTER ACTIONS */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#102139] p-5">
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/5"
          >
            <RotateCcw size={17} />
            RESET
          </button>

          {!complete ? (
            <button
              type="button"
              disabled={!ready || running || busy}
              onClick={startSystem}
              className="flex items-center gap-3 rounded-xl bg-cyan-200 px-6 py-3 font-black text-[#09192b] disabled:cursor-not-allowed disabled:opacity-35"
            >
              START RECYCLING
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onComplete}
              className="flex items-center gap-3 rounded-xl bg-emerald-300 px-6 py-3 font-black text-[#08231b] disabled:opacity-50"
            >
              <CheckCircle2 size={19} />
              {busy ? "SAVING..." : "WATER RESTORED · CONTINUE"}
              <ArrowRight size={18} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
