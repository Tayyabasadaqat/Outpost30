
"use client";

import {
  Zap,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

type ResourceMetersProps = {
  power?: number;
  lifeSupport?: number;
  crewSafety?: number;
};

export default function ResourceMeters({
  power = 80,
  lifeSupport = 85,
  crewSafety = 90,
}: ResourceMetersProps) {
  const resources = [
    {
      label: "POWER",
      value: power,
      icon: Zap,
      color: "#f4c76e",
    },
    {
      label: "LIFE SUPPORT",
      value: lifeSupport,
      icon: HeartPulse,
      color: "#78d4c5",
    },
    {
      label: "CREW SAFETY",
      value: crewSafety,
      icon: ShieldCheck,
      color: "#80b8f9",
    },
  ];

  return (
    <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
      {resources.map((resource) => {
        const Icon = resource.icon;
        const value = Math.max(
          0,
          Math.min(100, resource.value)
        );

        return (
          <div
            key={resource.label}
            className="rounded-2xl border border-white/10 bg-[#14223b]/90 p-3 backdrop-blur-xl sm:p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon
                size={17}
                color={resource.color}
              />

              <span className="truncate text-[9px] font-bold tracking-wider text-slate-300 sm:text-xs">
                {resource.label}
              </span>
            </div>

            <div className="mb-3 text-xl font-extrabold text-white sm:text-2xl">
              {value}%
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${value}%`,
                  backgroundColor: resource.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
