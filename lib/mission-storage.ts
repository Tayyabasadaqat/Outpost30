
/* ==========================================
   OUTPOST 30 — MISSION SAVE SYSTEM
   ========================================== */

import type { MissionState } from "@/lib/mission";

const STORAGE_KEY = "outpost30_mission_v1";

// ==========================================
// SAVE MISSION
// ==========================================

export function saveMission(
  state: MissionState
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    return true;
  } catch (error) {
    console.error("Mission save failed:", error);
    return false;
  }
}

// ==========================================
// LOAD SAVED MISSION
// ==========================================

export function loadMission(): MissionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return null;

    const state: MissionState = JSON.parse(saved);

    if (
      !state ||
      !Number.isInteger(state.day) ||
      state.day < 1 ||
      state.day > 30 ||
      !["active", "completed", "failed"].includes(
        state.status
      ) ||
      !state.resources ||
      !Array.isArray(state.history)
    ) {
      return null;
    }

    return state;
  } catch (error) {
    console.error("Mission load failed:", error);
    return null;
  }
}

// ==========================================
// DELETE SAVED MISSION
// ==========================================

export function clearMission(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Mission clear failed:", error);
    return false;
  }
}

// ==========================================
// CHECK FOR SAVED MISSION
// ==========================================

export function hasSavedMission(): boolean {
  return loadMission() !== null;
}