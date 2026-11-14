
/* ==========================================
   OUTPOST 30 — UNIQUE MISSION CONSEQUENCES
   ========================================== */

import type { ResourceChanges } from "@/lib/mission";

export type DailyMissionEffects = {
  safe: ResourceChanges;
  risky: ResourceChanges;
  dangerous: ResourceChanges;
};

// Each day has three unique decision outcomes.
// These are GAMEPLAY VALUES, not NASA measurements.
//
// Daily resource consumption is applied separately
// by the mission engine.

const MISSION_EFFECTS: Record<number, DailyMissionEffects> = {

  // DAY 1 — Lunar Landing
  1: {
    safe: { oxygen: -2, power: -3, health: 3 },
    risky: { oxygen: -5, power: -2, health: -5 },
    dangerous: { oxygen: -10, health: -15, power: -8 },
  },

  // DAY 2 — Activate Life Support
  2: {
    safe: { oxygen: 12, power: -5 },
    risky: { oxygen: 6, power: -2, health: -4 },
    dangerous: { oxygen: -15, health: -10 },
  },

  // DAY 3 — Solar Array Deployment
  3: {
    safe: { power: 18, oxygen: -3 },
    risky: { power: 8, health: -5 },
    dangerous: { power: -15, health: -8 },
  },

  // DAY 4 — Water Recycling
  4: {
    safe: { water: 16, power: -4 },
    risky: { water: 7, health: -3 },
    dangerous: { water: -15, health: -7 },
  },

  // DAY 5 — First Lunar Exploration
  5: {
    safe: { oxygen: -4, power: -3, health: 3 },
    risky: { oxygen: -8, health: -5 },
    dangerous: { oxygen: -15, health: -15 },
  },

  // DAY 6 — Habitat Pressure Alert
  6: {
    safe: { oxygen: 10, power: -5 },
    risky: { oxygen: -4, power: -2 },
    dangerous: { oxygen: -18, health: -12 },
  },

  // DAY 7 — Communication Breakdown
  7: {
    safe: { power: -5, health: 2 },
    risky: { power: -2, health: -4 },
    dangerous: { power: -10, health: -8 },
  },

  // DAY 8 — NASA Radiation Mission
  8: {
    safe: { power: -6, oxygen: -2, health: 0 },
    risky: { power: -3, oxygen: -4, health: -5 },
    dangerous: { oxygen: -8, power: -5, health: -20 },
  },

  // DAY 9 — Lunar Dust Emergency
  9: {
    safe: { power: -4, oxygen: -2, health: 3 },
    risky: { power: -2, health: -5 },
    dangerous: { power: -12, health: -10 },
  },

  // DAY 10 — Food Inventory
  10: {
    safe: { food: 14, power: -2 },
    risky: { food: 5, water: -3 },
    dangerous: { food: -15, health: -8 },
  },

  // DAY 11 — Rover Maintenance
  11: {
    safe: { power: -7, oxygen: -2, health: 3 },
    risky: { power: -4, health: -5 },
    dangerous: { power: -15, health: -12 },
  },

  // DAY 12 — Thermal Control
  12: {
    safe: { power: -5, health: 5 },
    risky: { power: -2, health: -5 },
    dangerous: { power: -12, health: -15 },
  },

  // DAY 13 — Sample Collection
  13: {
    safe: { oxygen: -3, power: -3, health: 2 },
    risky: { oxygen: -6, health: -4 },
    dangerous: { oxygen: -12, health: -10 },
  },

  // DAY 14 — Battery Failure
  14: {
    safe: { power: 15, oxygen: -3 },
    risky: { power: 6, health: -6 },
    dangerous: { power: -20, health: -10 },
  },

  // DAY 15 — Crew Fatigue
  15: {
    safe: { health: 15, food: -4, water: -3 },
    risky: { health: 4, food: -2 },
    dangerous: { health: -18 },
  },

  // DAY 16 — NASA Solar Flare Response
  16: {
    safe: { power: -6, oxygen: -2, health: 0 },
    risky: { power: -3, oxygen: -4, health: -5 },
    dangerous: { oxygen: -8, power: -5, health: -20 },
  },

  // DAY 17 — Greenhouse Maintenance
  17: {
    safe: { food: 15, water: -5, power: -4 },
    risky: { food: 6, water: -3 },
    dangerous: { food: -12, water: -10 },
  },

  // DAY 18 — Oxygen Generator Fault
  18: {
    safe: { oxygen: 18, power: -8 },
    risky: { oxygen: 7, health: -5 },
    dangerous: { oxygen: -20, health: -12 },
  },

  // DAY 19 — Lunar Navigation
  19: {
    safe: { oxygen: -3, power: -3, health: 3 },
    risky: { oxygen: -7, health: -6 },
    dangerous: { oxygen: -15, health: -14 },
  },

  // DAY 20 — Medical Emergency
  20: {
    safe: { health: 18, water: -4, food: -3 },
    risky: { health: 6, water: -2 },
    dangerous: { health: -22 },
  },

  // DAY 21 — Solar Panel Dust
  21: {
    safe: { power: 18, oxygen: -4 },
    risky: { power: 7, health: -5 },
    dangerous: { power: -18, health: -8 },
  },

  // DAY 22 — Habitat Leak
  22: {
    safe: { oxygen: 12, power: -5 },
    risky: { oxygen: -5, power: -2 },
    dangerous: { oxygen: -20, health: -15 },
  },

  // DAY 23 — Scientific Experiment
  23: {
    safe: { power: -4, oxygen: -2, health: 3 },
    risky: { power: -2, health: -4 },
    dangerous: { power: -10, health: -10 },
  },

  // DAY 24 — Waste Processing
  24: {
    safe: { water: 14, power: -5 },
    risky: { water: 5, health: -5 },
    dangerous: { water: -15, health: -12 },
  },

  // DAY 25 — Communication Relay
  25: {
    safe: { power: -5, health: 3 },
    risky: { power: -2, health: -5 },
    dangerous: { power: -12, health: -8 },
  },

  // DAY 26 — NASA Radiation Preparedness
  26: {
    safe: { power: -6, oxygen: -2, health: 0 },
    risky: { power: -3, oxygen: -4, health: -5 },
    dangerous: { oxygen: -8, power: -5, health: -20 },
  },

  // DAY 27 — Emergency Power
  27: {
    safe: { power: 16, oxygen: -3 },
    risky: { power: 5, health: -5 },
    dangerous: { power: -20, health: -12 },
  },

  // DAY 28 — Final Exploration
  28: {
    safe: { oxygen: -4, power: -4, health: 5 },
    risky: { oxygen: -8, health: -7 },
    dangerous: { oxygen: -18, health: -15 },
  },

  // DAY 29 — Mission Preparation
  29: {
    safe: {
      oxygen: 7,
      water: 7,
      food: 7,
      power: -5,
      health: 5,
    },
    risky: { oxygen: 3, water: 3, health: -4 },
    dangerous: { power: -12, health: -15 },
  },

  // DAY 30 — Final Mission
  30: {
    safe: {
      oxygen: -3,
      power: -5,
      health: 5,
    },
    risky: {
      oxygen: -7,
      power: -4,
      health: -8,
    },
    dangerous: {
      oxygen: -15,
      power: -12,
      health: -20,
    },
  },
};

// ==========================================
// GET EFFECTS FOR A SPECIFIC DAY
// ==========================================

export function getMissionEffects(
  day: number
): DailyMissionEffects {
  const effects = MISSION_EFFECTS[day];

  if (!effects) {
    throw new Error(
      `No mission effects configured for Day ${day}`
    );
  }

  return effects;
}