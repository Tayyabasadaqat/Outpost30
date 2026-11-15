
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Rocket,
  RotateCcw,
  MousePointer2,
  X,
  ShieldCheck,
  Zap,
  HeartPulse,
} from "lucide-react";

import type {
  FocusTarget,
  Place,
} from "@/components/LunarScene";
import "./landing.css";

// ==========================================
// EXISTING 3D SCENE — UNCHANGED
// ==========================================

const LunarScene = dynamic(
  () => import("@/components/LunarScene"),
  {
    ssr: false,
    loading: () => (
      <div className="real3d-loading">
        <span className="real3d-loading-orbit">✦</span>
        Preparing Moon Base...
      </div>
    ),
  }
);


const placeDetails: Record<
  Place,
  {
    title: string;
    description: string;
  }
> = {
  Habitat: {
    title: "Lunar Habitat",
    description:
      "Your astronauts live and work here. Keep their home safe!",
  },

  Greenhouse: {
    title: "Moon Greenhouse",
    description:
      "Grow plants and help provide food for your crew.",
  },

  "Solar Panels": {
    title: "Power Station",
    description:
      "Collect sunlight to keep the Moon base running.",
  },

  Rover: {
    title: "Lunar Exploration Rover",
    description:
      "Meet our Moon explorer! Rovers help astronauts " +
      "travel across rocky lunar terrain, carry equipment, " +
      "and investigate places far from their landing site. " +
      "This rover is part of your OUTPOST 30 mission!",
  },

  Apollo: {
    title: "Apollo Lunar Module",
    description:
      "Explore a NASA-sourced 3D model of an Apollo lunar " +
      "module! In 1969, Apollo 11's lunar module, Eagle, " +
      "carried Neil Armstrong and Buzz Aldrin to the Moon. " +
      "It used rocket engines for a controlled landing. " +
      "This model connects our game to real NASA history.",
  },
};

type Dialog = "briefing" | "help" | null;

// ==========================================
// LANDING PAGE
// ==========================================

export default function Home() {
  const [focus, setFocus] =
    useState<FocusTarget>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  const [dialog, setDialog] =
    useState<Dialog>(null);

  // Existing scene interactions stay intact.
  function selectBuilding(place: Place) {
    setSelectedPlace(place);
    setFocus(place);
  }

  function resetCamera() {
    setFocus(null);
    setSelectedPlace(null);
  }

  return (
    <main className="real3d-landing">

      {/* ====================================
          INTERACTIVE 3D MOON BASE
          ==================================== */}

      <div className="real3d-world">
        <LunarScene
          explore={false}
          focus={focus}
          onSelect={selectBuilding}
        />
      </div>

      {/* Existing atmosphere overlay */}
      <div className="real3d-atmosphere" />

      {/* ====================================
          TOP HEADER
          ==================================== */}

      <header className="real3d-header">

        {/* Existing branding */}
        <Link href="/" className="real3d-brand">
          <span className="real3d-brand-symbol">
            <Rocket size={19} />
          </span>

          OUTPOST <strong>30</strong>
        </Link>

        {/* Clear, minimal navigation */}
        <div className="real3d-header-actions">

          {/* Game briefing */}
          <button
            type="button"
            onClick={() => setDialog("briefing")}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#001D3D]/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:border-[#FFC300]/70 hover:bg-[#003566] sm:px-4 sm:text-sm"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">
              Game Briefing
            </span>
            <span className="sm:hidden">
              Briefing
            </span>
          </button>

          {/* How to play */}
          <button
            type="button"
            onClick={() => setDialog("help")}
            aria-label="How to play OUTPOST 30"
            title="How to play"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#001D3D]/75 text-white backdrop-blur-md transition hover:border-[#FFC300] hover:text-[#FFD60A]"
          >
            <HelpCircle size={20} />
          </button>

          {/* PLAY -> WELCOME PAGE */}
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFC300] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#000814] shadow-[0_6px_22px_rgba(255,195,0,0.23)] transition hover:bg-[#FFD60A] hover:shadow-[0_8px_30px_rgba(255,195,0,0.36)] sm:px-6 sm:text-sm"
          >
            Play
            <ArrowRight size={17} />
          </Link>

        </div>
      </header>

      {/* ====================================
          MINIMAL BOTTOM BRANDING
          No large hero text over the 3D view
          ==================================== */}

      {!selectedPlace && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 w-[90%] -translate-x-1/2 text-center sm:bottom-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#FFD60A]/90 sm:text-xs">
            Explore Your Lunar Outpost
          </p>
          <p className="mt-2 text-xs text-white/70 sm:text-sm">
            Select a building to discover its mission.
          </p>
        </div>
      )}

      {/* ====================================
          EXISTING CLICKABLE BUILDING DETAILS
          PRESERVED
          ==================================== */}

      {selectedPlace && (
        <aside className="real3d-location">

          <button
            type="button"
            className="real3d-location-close"
            aria-label="Close location"
            onClick={resetCamera}
          >
            <X size={20} />
          </button>

          <span className="real3d-location-tag">
            LOCATION DISCOVERED
          </span>

            <h2>
              {placeDetails[selectedPlace].title}
            </h2>

            <p>
              {placeDetails[selectedPlace].description}
            </p>

            {selectedPlace === "Apollo" && (
              <a
                href="https://www.nasa.gov/mission/apollo-11/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#FFD60A] underline underline-offset-4 hover:text-white"
              >
                Explore Apollo 11 — NASA
              </a>
            )}

          {/* No duplicate Play button here. */}

          <button
            type="button"
            onClick={resetCamera}
            className="real3d-location-reset"
          >
            <RotateCcw size={16} />
            Back to overview
          </button>

        </aside>
      )}

      {/* ====================================
          BOTTOM CONTROLS
          ==================================== */}

      <div className="real3d-bottom">
        <div className="real3d-control-tip">
          <MousePointer2 size={16} />
          DRAG TO LOOK AROUND
        </div>

        <button
          type="button"
          className="real3d-reset"
          onClick={resetCamera}
        >
          <RotateCcw size={15} />
          RESET VIEW
        </button>
      </div>

      {/* ====================================
          GAME BRIEFING / HOW TO PLAY MODALS
          ==================================== */}

      {dialog && (
        <div
          className="real3d-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDialog(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="outpost-modal-title"
            className="real3d-modal"
          >

            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setDialog(null)}
              className="real3d-modal-close"
            >
              <X size={20} />
            </button>

            {dialog === "briefing" ? (
              <>
                <span className="real3d-location-tag">
                  MISSION CONTROL
                </span>

                <h2 id="outpost-modal-title">
                  Your Mission Briefing
                </h2>

                <p>
                  You are the commander of OUTPOST 30,
                  a lunar research base. For 30
                  simulated days, keep your crew safe,
                  manage essential resources, and
                  overcome challenges on the Moon.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    {
                      icon: ShieldCheck,
                      label: "Survive",
                    },
                    {
                      icon: Zap,
                      label: "Manage",
                    },
                    {
                      icon: HeartPulse,
                      label: "Protect",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-[#003566]/50 p-3"
                    >
                      <item.icon
                        size={21}
                        className="text-[#FFC300]"
                      />
                      <span className="text-xs font-semibold text-white">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm text-white/75">
                  Your decisions affect oxygen, water,
                  food, power, crew health, and the
                  future of the Moon base.
                </p>
              </>
            ) : (
              <>
                <span className="real3d-location-tag">
                  COMMANDER'S GUIDE
                </span>

                <h2 id="outpost-modal-title">
                  How to Play
                </h2>

                <div className="mt-4 space-y-3 text-left">
                  {[
                    [
                      "01",
                      "Explore the base",
                      "Click the 3D buildings to learn what they do.",
                    ],
                    [
                      "02",
                      "Start your mission",
                      "Press Play to begin your 30-day adventure.",
                    ],
                    [
                      "03",
                      "Complete daily challenges",
                      "Follow instructions, solve minigames, and choose your actions.",
                    ],
                    [
                      "04",
                      "Manage your resources",
                      "Keep oxygen, water, food, power, and crew health above zero.",
                    ],
                    [
                      "05",
                      "Ask ORBI for help",
                      "Your robot companion shares mission hints and NASA facts.",
                    ],
                  ].map(([number, title, description]) => (
                    <div
                      key={number}
                      className="flex gap-3"
                    >
                      <span className="shrink-0 font-bold text-[#FFC300]">
                        {number}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {title}
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-white/70">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Link
              href="/welcome"
              className="real3d-start mt-6 inline-flex items-center justify-center gap-2"
            >
              <Rocket size={18} />
              Let's Play
              <ArrowRight size={17} />
            </Link>

          </section>
        </div>
      )}

    </main>
  );
}