
/* ==========================================
   OUTPOST 30 — DYNAMIC EMERGENCY ENGINE
   ========================================== */

import type {
  MissionState,
  ResourceChanges,
  CrewStatus,
  EquipmentStatus,
} from "@/lib/mission";

// ==========================================
// TYPES
// ==========================================

export type EmergencySeverity =
  | "warning"
  | "critical";

export type EmergencyChoice = {
  id: "safe" | "risky" | "dangerous";
  label: string;
  description: string;
  effects: ResourceChanges;
  crewEffects?: Partial<CrewStatus>;
  equipmentEffects?: Partial<EquipmentStatus>;
  score: number;
  feedback: string;
};

export type GameEmergency = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: EmergencySeverity;
  trigger: string;
  choices: EmergencyChoice[];
};

// ==========================================
// EMERGENCY FACTORY
// ==========================================

function createEmergency(
  id: string,
  type: string,
  title: string,
  description: string,
  severity: EmergencySeverity,
  trigger: string,
  choices: EmergencyChoice[]
): GameEmergency {
  return {
    id,
    type,
    title,
    description,
    severity,
    trigger,
    choices,
  };
}

// ==========================================
// CREW EXHAUSTION
// ==========================================

function crewExhaustion(
  state: MissionState
): GameEmergency {
  const fatigue = state.crew.fatigue;

  return createEmergency(
    "crew-exhaustion",
    "crew",
    "Crew Exhaustion Emergency",
    `Crew fatigue has reached ${fatigue}%. ` +
      "The astronauts require attention before " +
      "continuing demanding mission activities.",
    fatigue >= 90 ? "critical" : "warning",
    `Crew fatigue >= 70%`,
    [
      {
        id: "safe",
        label: "Schedule emergency crew rest",
        description:
          "Pause operations and prioritize recovery.",
        effects: {
          food: -3,
          water: -4,
          power: -2,
          health: 4,
        },
        crewEffects: {
          fatigue: -25,
          morale: 5,
        },
        score: 100,
        feedback:
          "Crew rest completed. Fatigue reduced.",
      },
      {
        id: "risky",
        label: "Rotate crew shifts",
        description:
          "Reduce workload without stopping operations.",
        effects: {
          food: -2,
          water: -2,
          health: -1,
        },
        crewEffects: {
          fatigue: -10,
          morale: 1,
        },
        score: 50,
        feedback:
          "Crew shifts adjusted. Recovery was limited.",
      },
      {
        id: "dangerous",
        label: "Continue full operations",
        description:
          "Ignore fatigue and maintain the schedule.",
        effects: {
          health: -12,
        },
        crewEffects: {
          fatigue: 12,
          morale: -10,
        },
        score: 0,
        feedback:
          "Crew exhaustion caused additional health risks.",
      },
    ]
  );
}

// ==========================================
// OXYGEN SHORTAGE
// ==========================================

function oxygenEmergency(
  state: MissionState
): GameEmergency {
  const oxygen = state.resources.oxygen;

  return createEmergency(
    "oxygen-shortage",
    "life-support",
    "Critical Oxygen Reserves",
    `Oxygen has dropped to ${oxygen}%. ` +
      "The crew must stabilize life support.",
    oxygen <= 15 ? "critical" : "warning",
    "Oxygen <= 30%",
    [
      {
        id: "safe",
        label: "Activate emergency oxygen recycling",
        description:
          "Use power to restore oxygen reserves.",
        effects: {
          oxygen: 16,
          power: -9,
        },
        equipmentEffects: {
          lifeSupport: -4,
        },
        score: 100,
        feedback:
          "Emergency oxygen recycling restored supplies.",
      },
      {
        id: "risky",
        label: "Reduce crew oxygen consumption",
        description:
          "Conserve oxygen by limiting activities.",
        effects: {
          oxygen: 7,
          health: -3,
        },
        crewEffects: {
          morale: -4,
        },
        score: 50,
        feedback:
          "Oxygen conservation helped, but stressed the crew.",
      },
      {
        id: "dangerous",
        label: "Ignore the oxygen warning",
        description:
          "Continue operations without intervention.",
        effects: {
          oxygen: -12,
          health: -10,
        },
        score: 0,
        feedback:
          "Oxygen reserves declined to dangerous levels.",
      },
    ]
  );
}

// ==========================================
// POWER SHORTAGE
// ==========================================

function powerEmergency(
  state: MissionState
): GameEmergency {
  const power = state.resources.power;

  return createEmergency(
    "power-shortage",
    "power",
    "Habitat Power Emergency",
    `Power reserves are at ${power}%. ` +
      "Essential habitat systems could be affected.",
    power <= 15 ? "critical" : "warning",
    "Power <= 30%",
    [
      {
        id: "safe",
        label: "Activate backup power system",
        description:
          "Recover usable power while limiting activity.",
        effects: {
          power: 16,
          oxygen: -3,
        },
        equipmentEffects: {
          solarPanels: -3,
        },
        score: 100,
        feedback:
          "Backup power restored essential services.",
      },
      {
        id: "risky",
        label: "Shut down nonessential systems",
        description:
          "Conserve resources at reduced efficiency.",
        effects: {
          power: 7,
          health: -3,
        },
        score: 50,
        feedback:
          "Power consumption was reduced temporarily.",
      },
      {
        id: "dangerous",
        label: "Continue full power consumption",
        description:
          "Ignore the declining energy reserves.",
        effects: {
          power: -12,
          health: -5,
        },
        score: 0,
        feedback:
          "Power reserves dropped further.",
      },
    ]
  );
}

// ==========================================
// WATER SHORTAGE
// ==========================================

function waterEmergency(
  state: MissionState
): GameEmergency {
  return createEmergency(
    "water-shortage",
    "water",
    "Water Supply Emergency",
    `Water reserves are at ${state.resources.water}%. ` +
      "The recycling system needs immediate attention.",
    state.resources.water <= 15
      ? "critical"
      : "warning",
    "Water <= 30%",
    [
      {
        id: "safe",
        label: "Repair emergency water recycler",
        description:
          "Restore water processing capacity.",
        effects: {
          water: 15,
          power: -7,
        },
        equipmentEffects: {
          waterRecycler: 5,
        },
        score: 100,
        feedback:
          "Water recycling operations were restored.",
      },
      {
        id: "risky",
        label: "Apply emergency water rationing",
        description:
          "Conserve water at the cost of crew comfort.",
        effects: {
          water: 6,
          health: -3,
        },
        crewEffects: {
          morale: -5,
        },
        score: 50,
        feedback:
          "Water rationing stabilized short-term supplies.",
      },
      {
        id: "dangerous",
        label: "Ignore water shortage",
        description:
          "Continue normal water consumption.",
        effects: {
          water: -12,
          health: -8,
        },
        score: 0,
        feedback:
          "Water supplies reached dangerous levels.",
      },
    ]
  );
}

// ==========================================
// FOOD SHORTAGE
// ==========================================

function foodEmergency(
  state: MissionState
): GameEmergency {
  return createEmergency(
    "food-shortage",
    "food",
    "Crew Food Supply Emergency",
    `Food reserves have reached ${state.resources.food}%.`,
    state.resources.food <= 15
      ? "critical"
      : "warning",
    "Food <= 30%",
    [
      {
        id: "safe",
        label: "Reorganize emergency food reserves",
        description:
          "Recover accessible supplies and reduce waste.",
        effects: {
          food: 12,
          power: -4,
        },
        score: 100,
        feedback:
          "Food inventory and conservation procedures completed.",
      },
      {
        id: "risky",
        label: "Introduce strict food rationing",
        description:
          "Extend supplies with reduced crew comfort.",
        effects: {
          food: 5,
          health: -3,
        },
        crewEffects: {
          morale: -6,
        },
        score: 50,
        feedback:
          "Food supplies were conserved at a cost.",
      },
      {
        id: "dangerous",
        label: "Ignore food inventory warnings",
        description:
          "Continue normal consumption.",
        effects: {
          food: -10,
          health: -8,
        },
        score: 0,
        feedback:
          "Food shortages worsened.",
      },
    ]
  );
}

// ==========================================
// EQUIPMENT FAILURE
// ==========================================

function equipmentEmergency(
  system: keyof EquipmentStatus,
  condition: number
): GameEmergency {
  const names: Record<keyof EquipmentStatus, string> = {
    lifeSupport: "Life Support",
    solarPanels: "Solar Panels",
    waterRecycler: "Water Recycler",
  };

  const name = names[system];

  return createEmergency(
    `equipment-${system}`,
    "equipment",
    `${name} Malfunction`,
    `${name} condition is ${condition}%. ` +
      "Maintenance is required.",
    condition <= 20 ? "critical" : "warning",
    `${name} condition <= 45%`,
    [
      {
        id: "safe",
        label: `Repair ${name}`,
        description:
          "Perform a complete equipment repair.",
        effects: {
          power: -8,
          oxygen: -3,
        },
        equipmentEffects: {
          [system]: 18,
        },
        score: 100,
        feedback:
          `${name} repair completed successfully.`,
      },
      {
        id: "risky",
        label: `Perform temporary ${name} maintenance`,
        description:
          "Apply a quick repair with limited reliability.",
        effects: {
          power: -4,
        },
        equipmentEffects: {
          [system]: 7,
        },
        score: 50,
        feedback:
          `${name} received temporary maintenance.`,
      },
      {
        id: "dangerous",
        label: `Ignore ${name} malfunction`,
        description:
          "Continue using damaged equipment.",
        effects: {
          health: -5,
        },
        equipmentEffects: {
          [system]: -12,
        },
        score: 0,
        feedback:
          `${name} condition deteriorated further.`,
      },
    ]
  );
}

// ==========================================
// LOW MORALE
// ==========================================

function moraleEmergency(
  state: MissionState
): GameEmergency {
  return createEmergency(
    "low-morale",
    "crew",
    "Crew Morale Crisis",
    `Crew morale has fallen to ${state.crew.morale}%.`,
    state.crew.morale <= 10
      ? "critical"
      : "warning",
    "Crew morale <= 25%",
    [
      {
        id: "safe",
        label: "Organize crew recovery session",
        description:
          "Improve crew wellbeing and communication.",
        effects: {
          food: -3,
          power: -2,
        },
        crewEffects: {
          morale: 18,
          fatigue: -5,
        },
        score: 100,
        feedback:
          "Crew wellbeing improved.",
      },
      {
        id: "risky",
        label: "Reduce workload temporarily",
        description:
          "Provide limited recovery time.",
        effects: {
          power: -1,
        },
        crewEffects: {
          morale: 7,
        },
        score: 50,
        feedback:
          "Morale improved slightly.",
      },
      {
        id: "dangerous",
        label: "Ignore crew concerns",
        description:
          "Continue normal operations.",
        effects: {
          health: -5,
        },
        crewEffects: {
          morale: -10,
          fatigue: 8,
        },
        score: 0,
        feedback:
          "Crew morale deteriorated.",
      },
    ]
  );
}

// ==========================================
// DETECT DYNAMIC EMERGENCIES
// ==========================================

export function detectGameEmergencies(
  state: MissionState
): GameEmergency[] {
  const emergencies: GameEmergency[] = [];

  if (state.status !== "active") {
    return emergencies;
  }

  // Crew emergencies
  if (state.crew.fatigue >= 70) {
    emergencies.push(crewExhaustion(state));
  }

  if (state.crew.morale <= 25) {
    emergencies.push(moraleEmergency(state));
  }

  // Resource emergencies
  if (state.resources.oxygen <= 30) {
    emergencies.push(oxygenEmergency(state));
  }

  if (state.resources.power <= 30) {
    emergencies.push(powerEmergency(state));
  }

  if (state.resources.water <= 30) {
    emergencies.push(waterEmergency(state));
  }

  if (state.resources.food <= 30) {
    emergencies.push(foodEmergency(state));
  }

  // Equipment emergencies
  const equipmentSystems: (
    keyof EquipmentStatus
  )[] = [
    "lifeSupport",
    "solarPanels",
    "waterRecycler",
  ];

  for (const system of equipmentSystems) {
    const condition = state.equipment[system];

    if (condition <= 45) {
      emergencies.push(
        equipmentEmergency(system, condition)
      );
    }
  }

  // Critical situations appear first.
  return emergencies.sort((a, b) => {
    if (a.severity === b.severity) return 0;

    return a.severity === "critical" ? -1 : 1;
  });
}

// ==========================================
// GET HIGHEST PRIORITY EMERGENCY
// ==========================================

export function getPriorityEmergency(
  state: MissionState
): GameEmergency | null {
  const emergencies = detectGameEmergencies(state);

  return emergencies.length > 0
    ? emergencies[0]
    : null;
}