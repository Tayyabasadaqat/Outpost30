
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Rocket } from "lucide-react";

const LOADING_DURATION = 4800;

const LOADING_MESSAGES = [
  "Preparing your moon base...",
  "Getting your mission ready...",
  "Ready for launch!",
];

function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 65 }, (_, index) => ({
        id: index,
        x: (index * 47.31 + 13.7) % 100,
        y: (index * 29.87 + 7.2) % 100,
        size: index % 7 === 0 ? 2.5 : 1.2,
        delay: (index % 12) * 0.25,
      })),
    []
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: 0.55,
            animation: `outpost-twinkle 3s ease-in-out ${star.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Loading progress
  useEffect(() => {
    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;

      const nextProgress = Math.min(
        100,
        Math.floor((elapsed / LOADING_DURATION) * 100)
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(timer);
        setIsReady(true);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, []);

  // Automatically enter the game
  useEffect(() => {
    if (!isReady) return;

    const timer = window.setTimeout(() => {
      router.replace("/game");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isReady, router]);

  const messageIndex = Math.min(
    LOADING_MESSAGES.length - 1,
    Math.floor((progress / 100) * LOADING_MESSAGES.length)
  );

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#000814] px-5 py-12 text-white">

      {/* Background stars */}
      <StarField />

      {/* Atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-1/3 h-[420px] w-[420px] rounded-full bg-[#003566]/30 blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-10 h-[400px] w-[400px] rounded-full bg-[#FFC300]/10 blur-[115px]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">

        {/* Animated Moon */}
        <div className="relative mb-8 flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">

          {/* Outer orbit */}
          <div
            className="absolute inset-0 rounded-full border border-[#FFC300]/20"
            style={{
              animation: "outpost-orbit 16s linear infinite",
            }}
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 rounded-full bg-[#FFC300] shadow-[0_0_16px_#FFC300]" />
          </div>

          {/* Inner orbit */}
          <div className="absolute inset-5 rounded-full border border-dashed border-white/10" />

          {/* Yellow Moon glow */}
          <div className="absolute inset-10 rounded-full bg-[#FFD60A]/20 blur-[35px]" />

          {/* Moon body */}
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-[#e9eef5] via-[#a6b6c9] to-[#566d86] shadow-[inset_-18px_-14px_25px_rgba(0,8,20,0.55),0_0_50px_rgba(255,214,10,0.14)] sm:h-36 sm:w-36"
            style={{
              animation: "outpost-float 4s ease-in-out infinite",
            }}
          >
            {/* Moon craters */}
            <div className="absolute left-[20%] top-[26%] h-7 w-7 rounded-full border border-[#71859c]/25 bg-[#889db1]/35 shadow-inner" />

            <div className="absolute right-[17%] top-[40%] h-9 w-9 rounded-full border border-[#71859c]/20 bg-[#7c91a6]/30 shadow-inner" />

            <div className="absolute bottom-[18%] left-[43%] h-5 w-5 rounded-full border border-[#71859c]/20 bg-[#71859c]/25 shadow-inner" />

            <Moon
              size={48}
              strokeWidth={1}
              className="relative text-white/55"
            />
          </div>

          {/* Orbiting rocket */}
          <div className="absolute bottom-6 right-3 rounded-full border border-[#FFC300]/35 bg-[#001D3D] p-2.5 text-[#FFC300] shadow-[0_0_22px_rgba(255,195,0,0.15)]">
            <Rocket size={20} />
          </div>
        </div>

        {/* Welcome title */}
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.34em] text-[#FFC300] sm:text-xs">
          Welcome, Commander
        </p>

        <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl md:text-6xl">
          OUTPOST <span className="text-[#FFC300]">30</span>
        </h1>

        <h2 className="mt-3 text-lg font-semibold tracking-[0.12em] text-[#FFD60A] sm:text-2xl">
          SAVE OUR MOON BASE
        </h2>

        {/* One short description */}
        <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          Complete 30 lunar missions, manage resources,
          and keep your astronaut crew safe.
        </p>

        {/* Loading progress */}
        <div className="mt-12 w-full max-w-lg">

          <div className="mb-3 flex items-center justify-between gap-3 text-xs">
            <span
              aria-live="polite"
              className="text-slate-300"
            >
              {LOADING_MESSAGES[messageIndex]}
            </span>

            <span className="font-mono font-bold text-[#FFD60A]">
              {progress}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Mission preparation progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full border border-white/10 bg-[#001D3D]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFC300] to-[#FFD60A] shadow-[0_0_15px_rgba(255,195,0,0.45)] transition-[width] duration-75 ease-linear"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes outpost-twinkle {
          from {
            opacity: 0.15;
            transform: scale(0.8);
          }
          to {
            opacity: 0.9;
            transform: scale(1.3);
          }
        }

        @keyframes outpost-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes outpost-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}