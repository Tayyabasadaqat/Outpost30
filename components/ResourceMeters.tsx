
"use client";

import {
  Droplets,
  HeartPulse,
  Sprout,
  Wind,
  Zap,
} from "lucide-react";

import type { Resources } from "@/lib/mission";

type ResourceMetersProps = {
  resources: Resources;
};

const resourceConfig = [
  {
    key: "oxygen",
    label: "Oxygen",
    icon: Wind,
    color: "#79d9ff",
  },
  {
    key: "water",
    label: "Water",
    icon: Droplets,
    color: "#67b6ff",
  },
  {
    key: "food",
    label: "Food",
    icon: Sprout,
    color: "#92e9a6",
  },
  {
    key: "power",
    label: "Power",
    icon: Zap,
    color: "#ffd080",
  },
  {
    key: "health",
    label: "Crew Health",
    icon: HeartPulse,
    color: "#ffa5ad",
  },
] as const;

export default function ResourceMeters({
  resources,
}: ResourceMetersProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
      {resourceConfig.map((item) => {
        const Icon = item.icon;
        const value = Math.max(
          0,
          Math.min(100, resources[item.key])
        );

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-white/10 bg-[#101b33]/90 p-3 backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon
                size={17}
                color={item.color}
              />

              <span className="text-[10px] font-bold text-slate-200">
                {item.label}
              </span>
            </div>

            <p className="mb-3 text-2xl font-black text-white">
              {Math.round(value)}
              <span className="ml-0.5 text-xs text-slate-400">
                %
              </span>
            </p>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${value}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
