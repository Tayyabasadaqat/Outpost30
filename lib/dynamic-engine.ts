
/* ==========================================
   OUTPOST 30 — DYNAMIC SIMULATION ENGINE
   Equipment, Crew, Resources & Emergencies
   ========================================== */

import type {
  MissionState,
  ResourceChanges,
  Resources,
  ResourceName,
  MissionHistory,
} from "@/lib/mission";

// ==========================================
// TYPES
// ==========================================

export type EmergencyLevel = "warning" | "critical";

export type Emergency = {
  id: string;
  resource: ResourceName;
  level: EmergencyLevel;
  message: string;
};

export type DynamicResult = {
  effects: ResourceChanges;
  consumption: ResourceChanges;
  production: ResourceChanges;
  emergencies: Emergency[];
  fatigue: number;
  equipmentEfficiency: number;
  explanation: string[];
};

// ==========================================
// HELPERS
// ==========================================

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function addEffect(
  effects: ResourceChanges,
  key: ResourceName,
  amount: number
) {
  effects[key] = (effects[key] ?? 0) + amount;
}

// ==========================================
// EQUIPMENT EFFICIENCY
// ==========================================

export function calculateEquipmentEfficiency(
  history: MissionHistory[]
): number {
  // Compatibility helper for existing callers.
  // Main simulation now reads stored equipment.
  let efficiency = 85;

  const maintenanceDays = [
    2, 3, 4, 6, 9, 14, 18, 21, 22, 24, 27,
  ];

  for (const entry of history) {
    if (!maintenanceDays.includes(entry.day)) continue;

    if (
      entry.feedback.includes(
        "procedure was completed safely"
      ) ||
      entry.feedback.includes(
        "Mission Control confirms"
      )
    ) {
      efficiency += 3;
    } else if (
      entry.feedback.includes(
        "Mission safety was compromised"
      )
    ) {
      efficiency -= 10;
    } else {
      efficiency -= 3;
    }
  }

  return clamp(efficiency);
}

function getStoredEquipmentEfficiency(
  state: MissionState
): number {
  const equipment = state.equipment ?? {
    lifeSupport: 90,
    solarPanels: 85,
    waterRecycler: 90,
  };

  return Math.round(
    (
      equipment.lifeSupport +
      equipment.solarPanels +
      equipment.waterRecycler
    ) / 3
  );
}

// ==========================================
// CREW FATIGUE
// ==========================================


export function calculateCrewFatigue(
  state: MissionState
): number {
  // Begin with persistent fatigue.
  // Emergency rest modifies this value directly.
  let fatigue = state.crew?.fatigue ?? 0;

  const lastDecision =
    state.history[state.history.length - 1];

  // No completed decision means no new workload.
  if (!lastDecision) {
    return clamp(fatigue);
  }

  // Base daily workload.
  fatigue += 3;

  // Demanding activities increase exhaustion.
  const demandingDays = [5, 11, 13, 19, 23, 28];

  if (demandingDays.includes(lastDecision.day)) {
    fatigue += 5;
  }

  // Unsafe decisions create additional stress.
  if (
    lastDecision.feedback.includes(
      "Mission safety was compromised"
    ) ||
    lastDecision.feedback.includes(
      "serious crew safety incident"
    )
  ) {
    fatigue += 8;
  }

  // Medical treatment and rest reduce fatigue.
  if (
    lastDecision.day === 15 &&
    lastDecision.choice.toLowerCase().includes("rest")
  ) {
    fatigue -= 25;
  }

  if (
    lastDecision.day === 20 &&
    lastDecision.choice.toLowerCase().includes(
      "medical care"
    )
  ) {
    fatigue -= 20;
  }

  // Low supplies increase physical strain.
  if (state.resources.oxygen < 30) {
    fatigue += 4;
  }

  if (state.resources.water < 30) {
    fatigue += 4;
  }

  if (state.resources.food < 30) {
    fatigue += 3;
  }

  // Poor morale increases stress.
  if ((state.crew?.morale ?? 85) < 30) {
    fatigue += 3;
  }

  return clamp(fatigue);
}

// ==========================================
// EQUIPMENT-BASED CONSUMPTION
// ==========================================

export function calculateConsumption(
  state: MissionState,
  efficiency: number
): ResourceChanges {
  const equipment = state.equipment ?? {
    lifeSupport: 90,
    solarPanels: 85,
    waterRecycler: 90,
  };

  let oxygen = -2;
  let water = -2;
  let food = -2;
  let power = -1;

  // Damaged life support wastes oxygen.
  if (equipment.lifeSupport < 70) {
    oxygen -= 1;
  }

  if (equipment.lifeSupport < 40) {
    oxygen -= 2;
    power -= 1;
  }

  // Poor water recycling increases losses.
  if (equipment.waterRecycler < 70) {
    water -= 1;
  }

  if (equipment.waterRecycler < 40) {
    water -= 2;
  }

  // Overall equipment problems require power.
  if (efficiency < 60) {
    power -= 2;
  }

  // EVA and exploration use extra oxygen.
  if ([5, 13, 19, 28].includes(state.day)) {
    oxygen -= 2;
  }

  // Poor morale increases supply demand.
  if ((state.crew?.morale ?? 85) < 30) {
    food -= 1;
  }

  return { oxygen, water, food, power };
}

// ==========================================
// SOLAR POWER PRODUCTION
// ==========================================

export function calculateProduction(
  state: MissionState,
  _efficiency: number
): ResourceChanges {
  const solarDeployment = state.history.find(
    (entry) => entry.day === 3
  );

  if (!solarDeployment) return {};

  const solarCondition =
    state.equipment?.solarPanels ?? 85;

  // Simulated power production by condition.
  let generation = 0;

  if (solarCondition >= 85) {
    generation = 3;
  } else if (solarCondition >= 60) {
    generation = 2;
  } else if (solarCondition >= 30) {
    generation = 1;
  }

  // A failed solar deployment reduces output.
  if (
    solarDeployment.choice ===
    "Skip the landing inspection"
  ) {
    generation = Math.max(0, generation - 1);
  }

  return { power: generation };
}

// ==========================================
// CREW HEALTH
// ==========================================

export function calculateHealthEffects(
  state: MissionState,
  fatigue: number
): ResourceChanges {
  let health = 0;

  // Fatigue becomes increasingly harmful.
  if (fatigue >= 80) {
    health -= 6;
  } else if (fatigue >= 60) {
    health -= 4;
  } else if (fatigue >= 40) {
    health -= 2;
  }

  if (state.resources.oxygen < 25) {
    health -= 5;
  }

  if (state.resources.water < 25) {
    health -= 4;
  }

  if (state.resources.food < 25) {
    health -= 3;
  }

  // Recover when conditions are favorable.
  if (
    fatigue < 25 &&
    state.resources.oxygen >= 50 &&
    state.resources.water >= 50 &&
    state.resources.food >= 50
  ) {
    health += 1;
  }

  return { health };
}

// ==========================================
// RESOURCE EMERGENCIES
// ==========================================

export function detectEmergencies(
  resources: Resources
): Emergency[] {
  const alerts: Emergency[] = [];

  const names: Record<ResourceName, string> = {
    oxygen: "Oxygen",
    water: "Water",
    food: "Food",
    power: "Power",
    health: "Crew health",
  };

  const keys = Object.keys(names) as ResourceName[];

  for (const key of keys) {
    const value = resources[key];

    if (value <= 15) {
      alerts.push({
        id: `critical-${key}`,
        resource: key,
        level: "critical",
        message:
          `CRITICAL: ${names[key]} is at ${value}%.`,
      });
    } else if (value <= 30) {
      alerts.push({
        id: `warning-${key}`,
        resource: key,
        level: "warning",
        message:
          `WARNING: ${names[key]} is low (${value}%).`,
      });
    }
  }

  return alerts;
}

// ==========================================
// MAIN SIMULATION CALCULATION
// ==========================================

export function calculateDynamicEffects(
  state: MissionState,
  baseEffects: ResourceChanges
): DynamicResult {
  const efficiency =
    getStoredEquipmentEfficiency(state)

    const fatigue = state.crew?.fatigue ?? 0;
  const consumption = calculateConsumption(
    state,
    efficiency
  );

  const production = calculateProduction(
    state,
    efficiency
  );

  const healthEffects = calculateHealthEffects(
    state,
    fatigue
  );

  const effects: ResourceChanges = {
    ...baseEffects,
  };

  const explanation: string[] = [];

  // Apply consumption, production and health.
  for (const changes of [
    consumption,
    production,
    healthEffects,
  ]) {
    for (
      const key of Object.keys(changes) as ResourceName[]
    ) {
      addEffect(
        effects,
        key,
        changes[key] ?? 0
      );
    }
  }

  // Low power reduces oxygen repair efficiency.
  if (
    state.resources.power < 20 &&
    (baseEffects.oxygen ?? 0) > 0
  ) {
    addEffect(
      effects,
      "oxygen",
      -Math.ceil(
        (baseEffects.oxygen ?? 0) * 0.5
      )
    );

    explanation.push(
      "Low power limited oxygen restoration."
    );
  }

  if (fatigue >= 40) {
    explanation.push(
      "Crew fatigue is affecting health."
    );
  }

  if (efficiency < 60) {
    explanation.push(
      "Habitat equipment efficiency is low."
    );
  }

  const predicted: Resources = {
    ...state.resources,
  };

  for (
    const key of Object.keys(predicted) as ResourceName[]
  ) {
    predicted[key] = clamp(
      predicted[key] + (effects[key] ?? 0)
    );
  }

  return {
    effects,
    consumption,
    production,
    emergencies: detectEmergencies(predicted),
    fatigue,
    equipmentEfficiency: efficiency,
    explanation,
  };
}