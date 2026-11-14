
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
} from "lucide-react";

import "./landing.css";

const LunarScene = dynamic(
  () => import("@/components/LunarScene"),
  {
    ssr: false,
    loading: () => (
      <div className="moon-loading">
        Preparing your Moon base... 🌙
      </div>
    ),
  }
);

type Place = "Habitat" | "Greenhouse" | "Solar Panels";

const descriptions: Record<Place, string> = {
  Habitat: "A cozy home that keeps your astronaut crew safe!",
  Greenhouse: "Our little plants help grow food on the Moon.",
  "Solar Panels": "These collect sunlight to power the base.",
};

export default function Home() {
  const [explore, setExplore] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [showHow, setShowHow] = useState(false);

  return (
    <main className="landing">

      {/* INTERACTIVE 3D MOON BASE */}
      <div className="landing-world">
        <LunarScene
          explore={explore}
          onSelect={setSelected}
        />
      </div>

      <div className="landing-shade" />

      {/* HEADER */}
      <header className="landing-header">
        <Link href="/" className="landing-logo">
          <span className="logo-star">✦</span>
          OUTPOST <span>30</span>
        </Link>

        <button
          className="landing-help"
          onClick={() => setShowHow(true)}
        >
          <Gamepad2 size={19} />
          How to Play
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-content">

          <div className="landing-eyebrow">
            <span className="status-dot" />
            CALLING ALL JUNIOR ASTRONAUTS
          </div>

          <h1>
            Your Moon base
            <br />
            <span>needs you!</span>
          </h1>

          <p className="landing-description">
            A little crew. A big adventure.
            <br />
            Can you save the base in 30 days?
          </p>

          <div className="landing-buttons">

            <Link href="/game" className="landing-start">
              <Rocket size={21} />
              START MISSION
              <ArrowRight size={19} />
            </Link>

            <button
              className="landing-explore"
              onClick={() => setExplore(!explore)}
            >
              <Compass size={20} />
              {explore ? "Stop Exploring" : "Explore the Base"}
            </button>

          </div>
        </div>
      </section>

      {/* BOTTOM INFORMATION */}
      <div className="landing-bottom">
        <span>
          ✦ Drag to look around · Click a building
        </span>

        <span className="landing-bottom-right">
          30 DAYS. ONE MOON BASE.
        </span>
      </div>

      {/* BUILDING INFORMATION */}
      {selected && (
        <div className="landing-info">
          <button
            aria-label="Close information"
            onClick={() => setSelected(null)}
          >
            <X size={18} />
          </button>

          <span>YOU DISCOVERED</span>

          <h2>{selected}</h2>

          <p>{descriptions[selected]}</p>
        </div>
      )}

      {/* HOW TO PLAY POPUP */}
      {showHow && (
        <div className="landing-modal-backdrop">
          <div
            className="landing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-heading"
          >
            <button
              className="landing-modal-close"
              onClick={() => setShowHow(false)}
              aria-label="Close instructions"
            >
              <X size={22} />
            </button>

            <div className="landing-modal-emoji">
              🚀
            </div>

            <h2 id="how-heading">
              Hey, Commander!
            </h2>

            <p>
              Explore your Moon base, make important
              decisions, and protect your crew for
              30 mission days.
            </p>

            <div className="landing-steps">
              <span>🌙 Explore</span>
              <span>⚡ Make Choices</span>
              <span>⭐ Save the Base</span>
            </div>

            <Link href="/game" className="landing-start">
              LET&apos;S GO!
              <ArrowRight size={19} />
            </Link>

          </div>
        </div>
      )}
    </main>
  );
}
