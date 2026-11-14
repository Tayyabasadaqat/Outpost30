
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import {
  ArrowRight,
  Compass,
  Gamepad2,
  Rocket,
  X,
  RotateCcw,
  MousePointer2,
} from "lucide-react";

import type { FocusTarget } from "@/components/LunarScene";

import "./landing.css";

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

type Place = "Habitat" | "Greenhouse" | "Solar Panels";

const placeDetails: Record<
  Place,
  { title: string; description: string; icon: string }
> = {
  Habitat: {
    title: "Lunar Habitat",
    description:
      "Your astronauts live and work here. Keep their home safe!",
    icon: "🏠",
  },

  Greenhouse: {
    title: "Moon Greenhouse",
    description:
      "Grow plants and help provide food for your crew.",
    icon: "🌱",
  },

  "Solar Panels": {
    title: "Power Station",
    description:
      "Collect sunlight to keep the Moon base running.",
    icon: "⚡",
  },
};

export default function Home() {
  const [focus, setFocus] =
    useState<FocusTarget>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  const [autoExplore, setAutoExplore] = useState(false);

  const [showInstructions, setShowInstructions] =
    useState(false);

  function selectBuilding(place: Place) {
    setAutoExplore(false);
    setSelectedPlace(place);
    setFocus(place);
  }

  function resetCamera() {
    setFocus(null);
    setSelectedPlace(null);
    setAutoExplore(false);
  }

  function exploreBase() {
    setSelectedPlace(null);
    setFocus(null);
    setAutoExplore((current) => !current);
  }

  return (
    <main className="real3d-landing">

      {/* ACTUAL INTERACTIVE 3D SCENE */}
      <div className="real3d-world">
        <LunarScene
          explore={autoExplore}
          focus={focus}
          onSelect={selectBuilding}
        />
      </div>

      {/* Light gradient — doesn't block 3D clicks */}
      <div className="real3d-atmosphere" />

      {/* HEADER */}
      <header className="real3d-header">
        <Link href="/" className="real3d-brand">
          <span className="real3d-brand-symbol">
            <Rocket size={19} />
          </span>

          OUTPOST <strong>30</strong>
        </Link>

        <div className="real3d-header-actions">
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="real3d-icon-button"
            aria-label="How to play"
          >
            <Gamepad2 size={20} />
          </button>

          <Link href="/game" className="real3d-header-play">
            PLAY
            <ArrowRight size={17} />
          </Link>
        </div>
      </header>

      {/* MINIMAL HERO */}
      {!selectedPlace && (
        <section className="real3d-hero">
          <div className="real3d-kicker">
            <span className="real3d-status-light" />
            JUNIOR ASTRONAUT MISSION
          </div>

          <h1>
            Welcome to
            <span> OUTPOST 30.</span>
          </h1>

          <p>
            Your Moon adventure begins here.
          </p>

          <div className="real3d-hero-actions">
            <Link href="/game" className="real3d-start">
              <Rocket size={20} />
              START MISSION
              <ArrowRight size={18} />
            </Link>

            <button
              type="button"
              onClick={exploreBase}
              className="real3d-explore"
            >
              <Compass size={19} />
              {autoExplore
                ? "STOP TOUR"
                : "EXPLORE BASE"}
            </button>
          </div>
        </section>
      )}

      {/* SELECTED BUILDING */}
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

          <div className="real3d-location-icon">
            {placeDetails[selectedPlace].icon}
          </div>

          <h2>
            {placeDetails[selectedPlace].title}
          </h2>

          <p>
            {placeDetails[selectedPlace].description}
          </p>

          <Link
            href="/game"
            className="real3d-location-play"
          >
            ENTER MISSION
            <ArrowRight size={18} />
          </Link>

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

      {/* BOTTOM CONTROLS */}
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

      {/* HOW TO PLAY */}
      {showInstructions && (
        <div className="real3d-modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="real3d-help-title"
            className="real3d-modal"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowInstructions(false)}
              className="real3d-modal-close"
            >
              <X size={20} />
            </button>

            <span className="real3d-location-tag">
              MISSION BRIEFING
            </span>

            <h2 id="real3d-help-title">
              Ready, Commander?
            </h2>

            <p>
              Explore the base, look after your
              crew, and complete 30 days of
              Moon missions.
            </p>

            <div className="real3d-help-steps">
              <span>🌙 Explore</span>
              <span>⚡ Decide</span>
              <span>🚀 Survive</span>
            </div>

            <Link href="/game" className="real3d-start">
              START MISSION
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
      )}

    </main>
  );
}
