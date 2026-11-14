
"use client";

import { useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Power,
  RotateCcw,
  X,
  Zap,
} from "lucide-react";

type SolarRepairProps = {
  onComplete: (success: boolean) => void;
  onClose: () => void;
  busy?: boolean;
};

export default function SolarRepair({
  onComplete,
  onClose,
  busy = false,
}: SolarRepairProps) {
  const [circuits, setCircuits] = useState([
    false,
    false,
    false,
  ]);

  const [power, setPower] = useState(35);
  const [activated, setActivated] = useState(false);

  const connected = circuits.filter(Boolean).length;
  const allConnected = connected === 3;
  const balanced = power >= 60 && power <= 80;
  const ready = allConnected && balanced;

  const powerColor =
    power > 80
      ? "#fb7185"
      : power >= 60
        ? "#70e0bc"
        : "#facc70";

  function toggleCircuit(index: number) {
    if (activated) return;

    setCircuits((old) =>
      old.map((value, i) =>
        i === index ? !value : value
      )
    );
  }

  function reset() {
    setCircuits([false, false, false]);
    setPower(35);
    setActivated(false);
  }

  function activate() {
    setActivated(true);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#02050d]/95 p-3 text-white backdrop-blur-xl sm:p-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#5c7d91]/40 bg-[#0a1423] shadow-[0_25px_100px_#0009]">

        {/* TOP BAR */}
        <header className="flex items-center justify-between border-b border-white/10 bg-[#101e30] px-5 py-4">
          <div className="flex items-center gap-3">
            <Zap className="text-amber-300" size={22} />
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-300">
                OUTPOST 30 · ENGINEERING
              </p>
              <h2 className="text-lg font-black">
                SOLAR ARRAY CONTROL
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <X size={21} />
          </button>
        </header>

        <div className="grid gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-8">

          {/* CIRCUIT BOARD */}
          <section>
            <p className="mb-2 text-xs font-bold tracking-widest text-slate-400">
              SYSTEM DIAGNOSTICS
            </p>

            <h3 className="mb-2 text-2xl font-black">
              Restore the power grid.
            </h3>

            <p className="mb-7 text-sm leading-6 text-slate-400">
              Connect all three circuits, then set the
              power output inside the safe zone.
            </p>

            <div className="space-y-3">
              {["Solar Collector", "Battery Bank", "Habitat Grid"].map(
                (name, index) => (
                  <button
                    key={name}
                    onClick={() => toggleCircuit(index)}
                    disabled={activated}
                    aria-pressed={circuits[index]}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      circuits[index]
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : "border-white/10 bg-[#15243a] hover:border-cyan-300/60"
                    }`}
                  >
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-lg ${
                        circuits[index]
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-[#28374b] text-slate-400"
                      }`}
                    >
                      {circuits[index] ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Power size={24} />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold">{name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {circuits[index]
                          ? "Circuit connected"
                          : "Click to connect"}
                      </p>
                    </div>

                    <span
                      className={`h-3 w-3 rounded-full ${
                        circuits[index]
                          ? "bg-emerald-400 shadow-[0_0_15px_#34d399]"
                          : "bg-rose-400"
                      }`}
                    />
                  </button>
                )
              )}
            </div>

            {/* CONNECTION INDICATOR */}
            <div className="mt-5 flex items-center gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors duration-500 ${
                    circuits[i]
                      ? "bg-emerald-400"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {connected} of 3 circuits online
            </p>
          </section>

          {/* POWER CONTROL */}
          <section className="rounded-xl border border-white/10 bg-[#101d30] p-5">
            <div className="mb-6 flex items-center gap-3">
              <BatteryCharging
                size={24}
                className="text-cyan-300"
              />
              <div>
                <p className="text-xs text-slate-400">
                  POWER REGULATOR
                </p>
                <p className="font-bold">
                  Adjust Energy Output
                </p>
              </div>
            </div>

            <div className="py-5 text-center">
              <p
                className="text-6xl font-black tabular-nums"
                style={{ color: powerColor }}
              >
                {power}
                <span className="text-2xl">%</span>
              </p>

              <p className="mt-3 text-xs font-bold tracking-widest">
                {power > 80
                  ? "OVERLOAD WARNING"
                  : balanced
                    ? "OPTIMAL OUTPUT"
                    : "INSUFFICIENT POWER"}
              </p>
            </div>

            <div className="mt-6">
              <input
                aria-label="Power output"
                type="range"
                min="0"
                max="100"
                value={power}
                disabled={activated}
                onChange={(e) =>
                  setPower(Number(e.target.value))
                }
                className="w-full cursor-pointer accent-cyan-300"
              />

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span className="text-emerald-300">
                  SAFE: 60–80%
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* VISUAL POWER DISPLAY */}
            <div className="mt-7">
              <div className="mb-3 flex justify-between text-xs">
                <span className="text-slate-400">
                  Energy Flow
                </span>
                <span>{power}%</span>
              </div>

              <div className="h-5 overflow-hidden rounded bg-[#28374b]">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${power}%`,
                    background: powerColor,
                    boxShadow: `0 0 18px ${powerColor}`,
                  }}
                />
              </div>
            </div>

            {/* STATUS */}
            <div
              className={`mt-7 rounded-xl border p-4 ${
                ready
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : "border-amber-400/30 bg-amber-400/5"
              }`}
            >
              <p className="text-sm font-bold">
                {ready
                  ? "✓ SYSTEM READY"
                  : "⚠ SYSTEM NOT READY"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {ready
                  ? "All circuits connected. Power output is stable."
                  : "Connect the circuits and balance the power to continue."}
              </p>
            </div>
          </section>
        </div>

        {/* BOTTOM ACTIONS */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#101e30] p-5">
          <button
            onClick={reset}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5"
          >
            <RotateCcw size={16} />
            RESET
          </button>

          {!activated ? (
            <button
              onClick={activate}
              disabled={!ready || busy}
              className="flex items-center gap-3 rounded-xl bg-[#b8e9f7] px-6 py-3 font-black text-[#0a1726] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Power size={19} />
              ACTIVATE SOLAR ARRAY
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => onComplete(true)}
              disabled={busy}
              className="flex items-center gap-3 rounded-xl bg-emerald-300 px-6 py-3 font-black text-[#08221c] disabled:opacity-50"
            >
              <CheckCircle2 size={19} />
              {busy ? "SAVING..." : "POWER RESTORED · CONTINUE"}
              <ArrowRight size={18} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
