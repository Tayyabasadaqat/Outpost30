
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  X,
  Crosshair,
  RotateCcw,
} from "lucide-react";

type Location = {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  zoomX: number;
  zoomY: number;
};

const locations: Location[] = [
  {
    id: "rover",
    name: "Lunar Rover",
    description:
      "Explore the Moon, collect samples, and help your crew discover new places.",
    x: 27,
    y: 62,
    zoomX: 28,
    zoomY: 64,
  },
  {
    id: "habitat",
    name: "Living Quarters",
    description:
      "Keep your astronauts safe and manage the systems that support their lives.",
    x: 65,
    y: 65,
    zoomX: 65,
    zoomY: 62,
  },
  {
    id: "greenhouse",
    name: "Moon Greenhouse",
    description:
      "Grow food, care for plants, and keep your lunar garden healthy.",
    x: 77,
    y: 37,
    zoomX: 77,
    zoomY: 39,
  },
  {
    id: "communications",
    name: "Communications",
    description:
      "Stay connected to Mission Control and protect important signals.",
    x: 13,
    y: 31,
    zoomX: 13,
    zoomY: 32,
  },
];

type Props = {
  onSelect: (location: Location | null) => void;
};

export default function LandingHotspots({
  onSelect,
}: Props) {
  const [active, setActive] =
    useState<Location | null>(null);

  function select(location: Location) {
    setActive(location);
    onSelect(location);
  }

  function reset() {
    setActive(null);
    onSelect(null);
  }

  return (
    <div className="landing-hotspot-layer">
      {!active &&
        locations.map((location) => (
          <button
            key={location.id}
            type="button"
            className="landing-hotspot"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
            }}
            aria-label={`Explore ${location.name}`}
            onClick={() => select(location)}
          >
            <span className="landing-hotspot-ring">
              <Crosshair size={17} />
            </span>

            <span className="landing-hotspot-label">
              {location.name}
            </span>
          </button>
        ))}

      {active && (
        <div className="landing-location-panel">
          <button
            type="button"
            className="landing-location-close"
            onClick={reset}
            aria-label="Close location details"
          >
            <X size={19} />
          </button>

          <span className="landing-location-eyebrow">
            LOCATION DISCOVERED
          </span>

          <h2>{active.name}</h2>

          <p>{active.description}</p>

          <Link
            href="/game"
            className="landing-location-enter"
          >
            ENTER MISSION
            <ArrowRight size={18} />
          </Link>

          <button
            type="button"
            className="landing-location-back"
            onClick={reset}
          >
            <RotateCcw size={15} />
            Back to Moon Base
          </button>
        </div>
      )}
    </div>
  );
}

export type { Location };
