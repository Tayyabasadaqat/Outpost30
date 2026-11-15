
"use client";

import { ArrowRight, ShieldCheck, Gauge, Zap } from "lucide-react";

export type Strategy = "safe" | "risky" | "dangerous";

type Props = {
  day: number;
  title: string;
  description?: string;
  onChoose: (strategy: Strategy) => void;
};

const strategies = [
  {
    id: "safe" as const,
    name: "Careful Approach",
    label: "LOW RISK",
    detail: "Inspect the system and work carefully.",
    effect: "Easier task · More preparation",
    Icon: ShieldCheck,
  },
  {
    id: "risky" as const,
    name: "Quick Approach",
    label: "MEDIUM RISK",
    detail: "Work faster with fewer safety checks.",
    effect: "Standard task · Greater risk",
    Icon: Gauge,
  },
  {
    id: "dangerous" as const,
    name: "Emergency Approach",
    label: "HIGH RISK",
    detail: "Take a shortcut to restore the system.",
    effect: "Harder task · Highest risk",
    Icon: Zap,
  },
];

export default function MissionStrategy({
  day,
  title,
  description,
  onChoose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center overflow-y-auto bg-[#000814]/95 p-4 text-white">
      <div className="w-full max-w-3xl rounded-2xl border border-[#274b73] bg-[#001d3d] p-5 shadow-2xl md:p-8">
        <div className="mb-6">
          <p className="text-xs font-black tracking-[0.2em] text-[#ffc300]">
            DAY {String(day).padStart(2, "0")} / 30
          </p>

          <h2 className="mt-3 text-3xl font-black md:text-4xl">
            {title}
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            {description ||
              "Choose how your crew will approach today's mission."}
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-[#31547a] bg-[#000814]/60 p-4">
          <p className="text-sm font-bold text-[#ffd60a]">
            COMMANDER'S DECISION
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your strategy affects the challenge and the
            consequences for your Moon base.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {strategies.map(({ id, name, label, detail, effect, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChoose(id)}
              className="group flex min-h-56 flex-col rounded-xl border border-[#31547a] bg-[#003566]/60 p-5 text-left transition hover:-translate-y-1 hover:border-[#ffc300] hover:bg-[#003566] focus-visible:outline-2 focus-visible:outline-[#ffd60a]"
            >
              <div className="mb-5 flex items-center justify-between">
                <Icon size={27} className="text-[#ffd60a]" />

                <span className="text-[10px] font-black tracking-wider text-[#ffd60a]">
                  {label}
                </span>
              </div>

              <h3 className="text-lg font-black">{name}</h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">
                {detail}
              </p>

              <p className="mt-4 text-xs font-semibold text-[#ffd60a]">
                {effect}
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-black">
                SELECT STRATEGY
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
