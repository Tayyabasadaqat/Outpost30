
/* ==========================================
   OUTPOST 30 — LUNAR MISSION GAME ENGINE
   ========================================== */

import { getMissionEffects } from "@/lib/mission-effects";

import {
  calculateDynamicEffects,
  calculateCrewFatigue,
  detectEmergencies,
} from "@/lib/dynamic-engine";

// ==========================================
// TYPES
// ==========================================

export type ResourceName =
  | "oxygen"
  | "water"
  | "food"
  | "power"
  | "health";

export type Resources = Record<ResourceName, number>;

export type ResourceChanges = Partial<Resources>;

export type MissionChoice = {
  id: string;
  label: string;
  description: string;
  effects: ResourceChanges;
  score: number;
  feedback: string;
};

export type MissionChallenge = {
  day: number;
  title: string;
  description: string;
  category: string;
  choices: MissionChoice[];
  nasaEventId?: string;
  nasaSource?: string;
};

export type MissionStatus =
  | "active"
  | "completed"
  | "failed";

export type CrewStatus = {
  fatigue: number;
  morale: number;
};

export type EquipmentStatus = {
  lifeSupport: number;
  solarPanels: number;
  waterRecycler: number;
};

export type MissionEmergency = {
  id: string;
  resource: ResourceName;
  level: "warning" | "critical";
  message: string;
};

export type MissionHistory = {
  day: number;
  challenge: string;
  choice: string;
  feedback: string;
  effects: ResourceChanges;
};

export type MissionState = {
  day: number;
  resources: Resources;
  score: number;
  status: MissionStatus;
  history: MissionHistory[];

  crew: CrewStatus;
  equipment: EquipmentStatus;
  emergencies: MissionEmergency[];
};

// ==========================================
// INITIAL RESOURCES
// ==========================================

const INITIAL_RESOURCES: Resources = {
  oxygen: 90,
  water: 85,
  food: 85,
  power: 90,
  health: 100,
};

// ==========================================
// CHALLENGE DEFINITIONS
// ==========================================

type ChallengeDefinition = {
  title: string;
  description: string;
  category: string;
  best: string;
  risky: string;
  worst: string;
};

const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    title: "Lunar Landing",
    description:
      "Your spacecraft has landed. Secure the landing site.",
    category: "Landing",
    best: "Run the landing safety checklist",
    risky: "Begin unloading immediately",
    worst: "Skip the landing inspection",
  },
  {
    title: "Activate Life Support",
    description:
      "The habitat needs a stable oxygen supply.",
    category: "Life Support",
    best: "Calibrate the oxygen system",
    risky: "Use emergency oxygen reserves",
    worst: "Delay the oxygen system setup",
  },
  {
    title: "Solar Array Deployment",
    description:
      "Your base requires electricity.",
    category: "Power",
    best: "Deploy and inspect solar panels",
    risky: "Use backup batteries",
    worst: "Operate without power checks",
  },
  {
    title: "Water Recycling",
    description:
      "The water recycling unit has reduced efficiency.",
    category: "Water",
    best: "Repair the recycling filters",
    risky: "Use stored water reserves",
    worst: "Ignore the warning",
  },
  {
    title: "First Lunar Exploration",
    description:
      "The crew prepares for its first surface mission.",
    category: "Exploration",
    best: "Check suits and oxygen supplies",
    risky: "Reduce preparation time",
    worst: "Explore without safety checks",
  },
  {
    title: "Habitat Pressure Alert",
    description:
      "A sensor detects a possible air leak.",
    category: "Life Support",
    best: "Locate and seal the leak",
    risky: "Increase oxygen flow",
    worst: "Ignore the pressure alert",
  },
  {
    title: "Communication Breakdown",
    description:
      "Communication with Mission Control is unstable.",
    category: "Communication",
    best: "Repair the communication antenna",
    risky: "Switch to low-power signals",
    worst: "Continue without communication",
  },
  {
    title: "Radiation Monitoring",
    description:
      "Space-weather observations require a safety review.",
    category: "NASA Space Weather",
    best: "Shelter crew and check radiation instruments",
    risky: "Reduce outdoor activity",
    worst: "Continue all outdoor operations",
  },
  {
    title: "Lunar Dust Emergency",
    description:
      "Abrasive lunar dust affects important equipment.",
    category: "Maintenance",
    best: "Clean and protect equipment seals",
    risky: "Perform a quick inspection",
    worst: "Ignore dust contamination",
  },
  {
    title: "Food Inventory",
    description:
      "Your crew needs to review food supplies.",
    category: "Food",
    best: "Organize food rationing",
    risky: "Use extra food for crew morale",
    worst: "Ignore food consumption",
  },
  {
    title: "Rover Maintenance",
    description:
      "The lunar rover reports a mechanical fault.",
    category: "Rover",
    best: "Repair the rover before departure",
    risky: "Use the rover at reduced speed",
    worst: "Drive without repairs",
  },
  {
    title: "Thermal Control",
    description:
      "Habitat temperature regulation is unstable.",
    category: "Habitat",
    best: "Repair the thermal control system",
    risky: "Use backup heating",
    worst: "Ignore temperature warnings",
  },
  {
    title: "Sample Collection",
    description:
      "Collect lunar samples for scientific analysis.",
    category: "Science",
    best: "Follow the sample collection protocol",
    risky: "Collect samples quickly",
    worst: "Skip contamination controls",
  },
  {
    title: "Battery Failure",
    description:
      "One battery bank is malfunctioning.",
    category: "Power",
    best: "Isolate and repair the battery",
    risky: "Transfer loads to backup power",
    worst: "Ignore the battery warning",
  },
  {
    title: "Crew Fatigue",
    description:
      "Crew members are showing signs of exhaustion.",
    category: "Crew",
    best: "Schedule rest and medical checks",
    risky: "Reduce workload slightly",
    worst: "Continue the full work schedule",
  },
  {
    title: "Solar Flare Response",
    description:
      "Review solar activity and crew radiation protection.",
    category: "NASA Space Weather",
    best: "Move crew to the radiation shelter",
    risky: "Shorten surface operations",
    worst: "Ignore radiation safety procedures",
  },
  {
    title: "Greenhouse Maintenance",
    description:
      "The experimental plant system needs attention.",
    category: "Research",
    best: "Repair the greenhouse controls",
    risky: "Use manual watering",
    worst: "Leave the greenhouse unattended",
  },
  {
    title: "Oxygen Generator Fault",
    description:
      "The oxygen generation unit is losing efficiency.",
    category: "Life Support",
    best: "Repair the oxygen generator",
    risky: "Switch to emergency oxygen",
    worst: "Continue normal operations",
  },
  {
    title: "Lunar Navigation",
    description:
      "Your rover needs a safe route across lunar terrain.",
    category: "Navigation",
    best: "Analyze terrain and plan a route",
    risky: "Choose the shortest route",
    worst: "Travel without navigation checks",
  },
  {
    title: "Medical Emergency",
    description:
      "A crew member reports a health problem.",
    category: "Medical",
    best: "Provide medical care immediately",
    risky: "Monitor symptoms while working",
    worst: "Ignore the symptoms",
  },
  {
    title: "Solar Panel Dust",
    description:
      "Dust is reducing solar panel efficiency.",
    category: "Power",
    best: "Clean and inspect solar panels",
    risky: "Use reserve power",
    worst: "Ignore declining power output",
  },
  {
    title: "Habitat Leak",
    description:
      "The habitat has a small pressure leak.",
    category: "Emergency",
    best: "Isolate and seal the leak",
    risky: "Increase oxygen supply temporarily",
    worst: "Leave the leak untreated",
  },
  {
    title: "Scientific Experiment",
    description:
      "Conduct a low-gravity research experiment.",
    category: "Science",
    best: "Follow the complete experiment protocol",
    risky: "Perform a shortened experiment",
    worst: "Skip safety procedures",
  },
  {
    title: "Waste Processing",
    description:
      "The waste recycling system requires servicing.",
    category: "Maintenance",
    best: "Repair and test the recycling system",
    risky: "Use temporary waste storage",
    worst: "Ignore the system warning",
  },
  {
    title: "Communication Relay",
    description:
      "A relay needs adjustment for reliable communication.",
    category: "Communication",
    best: "Recalibrate the relay system",
    risky: "Operate with reduced signal quality",
    worst: "Disable communication checks",
  },
  {
    title: "Radiation Preparedness",
    description:
      "The crew reviews a space-weather safety alert.",
    category: "NASA Space Weather",
    best: "Review NASA data and prepare shelter",
    risky: "Limit external activities",
    worst: "Ignore the safety alert",
  },
  {
    title: "Emergency Power",
    description:
      "Your base is running low on stored electricity.",
    category: "Power",
    best: "Reduce nonessential power use",
    risky: "Drain backup batteries",
    worst: "Maintain maximum consumption",
  },
  {
    title: "Final Exploration",
    description:
      "Complete the last major lunar exploration task.",
    category: "Exploration",
    best: "Plan a safe scientific expedition",
    risky: "Shorten the mission preparation",
    worst: "Ignore mission safety checks",
  },
  {
    title: "Mission Preparation",
    description:
      "Prepare your crew and equipment for mission completion.",
    category: "Mission",
    best: "Inspect equipment and verify supplies",
    risky: "Perform only essential inspections",
    worst: "Skip final inspections",
  },
  {
    title: "Mission Complete",
    description:
      "Finish the 30-day lunar survival mission.",
    category: "Final Mission",
    best: "Complete the final safety review",
    risky: "Rush the completion procedure",
    worst: "Skip mission closure checks",
  },
];

// ==========================================
// START NEW MISSION
// ==========================================

export function startMission(): MissionState {
  return {
    day: 1,

    resources: { ...INITIAL_RESOURCES },

    score: 0,
    status: "active",
    history: [],

    crew: {
      fatigue: 0,
      morale: 85,
    },

    equipment: {
      lifeSupport: 90,
      solarPanels: 85,
      waterRecycler: 90,
    },

    emergencies: [],
  };
}

// ==========================================
// GET DAILY CHALLENGE
// ==========================================

export function getChallenge(
  day: number
): MissionChallenge | null {
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    return null;
  }

  const data = DAILY_CHALLENGES[day - 1];
  const effects = getMissionEffects(day);

  const choices: MissionChoice[] = [
    {
      id: "safe",
      label: data.best,
      description:
        "Follow the recommended procedure. Manage resources carefully.",
      effects: { ...effects.safe },
      score: 100,
      feedback:
        "Mission Control confirms the procedure was completed safely.",
    },
    {
      id: "risky",
      label: data.risky,
      description:
        "Take a shortcut that may save resources but increase risk.",
      effects: { ...effects.risky },
      score: 50,
      feedback:
        "The operation succeeded with additional complications.",
    },
    {
      id: "dangerous",
      label: data.worst,
      description:
        "Ignore safety procedures and risk mission resources.",
      effects: { ...effects.dangerous },
      score: 0,
      feedback:
        "Mission safety was compromised by this decision.",
    },
  ];

  return {
    day,
    title: data.title,
    description: data.description,
    category: data.category,
    choices,
  };
}

// ==========================================
// RESOURCE HELPERS
// ==========================================

function clampResource(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyResourceChanges(
  resources: Resources,
  changes: ResourceChanges
): Resources {
  const updated = { ...resources };

  for (const key of Object.keys(
    updated
  ) as ResourceName[]) {
    updated[key] = clampResource(
      updated[key] + (changes[key] ?? 0)
    );
  }

  return updated;
}

// ==========================================
// EQUIPMENT CONDITIONS
// ==========================================

function updateEquipment(
  equipment: EquipmentStatus,
  day: number,
  choiceId: string
): EquipmentStatus {
  const updated = { ...equipment };

  const equipmentDays: Record<
    number,
    keyof EquipmentStatus
  > = {
    2: "lifeSupport",
    3: "solarPanels",
    4: "waterRecycler",
    6: "lifeSupport",
    9: "solarPanels",
    14: "solarPanels",
    18: "lifeSupport",
    21: "solarPanels",
    22: "lifeSupport",
    24: "waterRecycler",
    27: "solarPanels",
  };

  const target = equipmentDays[day];

  if (!target) {
    return updated;
  }

  const change =
    choiceId === "safe"
      ? 8
      : choiceId === "risky"
        ? -4
        : -15;

  updated[target] = clampResource(
    updated[target] + change
  );

  return updated;
}

// ==========================================
// CREW MORALE
// ==========================================

function updateMorale(
  currentMorale: number,
  choiceId: string,
  emergencyCount: number
): number {
  let change =
    choiceId === "safe"
      ? 1
      : choiceId === "risky"
        ? -4
        : -10;

  change -= emergencyCount * 3;

  return clampResource(currentMorale + change);
}

// ==========================================
// DYNAMIC PLAYER DECISION ENGINE
// ==========================================

export function makeDecision(
  state: MissionState,
  choiceId: string,
  missionChallenge?: MissionChallenge
): MissionState {
  if (state.status !== "active") {
    throw new Error("Mission is no longer active.");
  }

  const challenge =
    missionChallenge ?? getChallenge(state.day);

  if (!challenge || challenge.day !== state.day) {
    throw new Error("Invalid mission challenge.");
  }

  const choice = challenge.choices.find(
    (item) => item.id === choiceId
  );

  if (!choice) {
    throw new Error("Invalid mission choice.");
  }

  // ========================================
  // CALCULATE DYNAMIC CONSEQUENCES
  // ========================================

  const simulation = calculateDynamicEffects(
    state,
    choice.effects
  );

  // Dynamic effects already include resource
  // consumption, production and health changes.
  const resources = applyResourceChanges(
    state.resources,
    simulation.effects
  );

  // ========================================
  // RECORD MISSION HISTORY
  // ========================================

  const historyEntry: MissionHistory = {
    day: state.day,
    challenge: challenge.title,
    choice: choice.label,
    feedback: choice.feedback,
    effects: simulation.effects,
  };

  const history = [...state.history, historyEntry];

  // ========================================
  // SCORING
  // ========================================

  let earnedScore = choice.score;

  if (
    simulation.equipmentEfficiency >= 85 &&
    choiceId === "safe"
  ) {
    earnedScore += 10;
  }

  const criticalEmergencies =
    simulation.emergencies.filter(
      (emergency) =>
        emergency.level === "critical"
    );

  earnedScore = Math.max(
    0,
    earnedScore - criticalEmergencies.length * 15
  );

  const score = state.score + earnedScore;

  // ========================================
  // CHECK MISSION STATUS
  // ========================================

  const crewFailed =
    resources.oxygen <= 0 ||
    resources.water <= 0 ||
    resources.food <= 0 ||
    resources.power <= 0 ||
    resources.health <= 0;

  let status: MissionStatus = "active";

  if (crewFailed) {
    status = "failed";
  } else if (state.day === 30) {
    status = "completed";
  }

  const nextDay =
    status === "active"
      ? state.day + 1
      : state.day;

  // ========================================
  // UPDATE EQUIPMENT
  // ========================================

  const newEquipment = updateEquipment(
    state.equipment ?? {
      lifeSupport: 90,
      solarPanels: 85,
      waterRecycler: 90,
    },
    state.day,
    choiceId
  );

  // ========================================
  // UPDATE CREW MORALE
  // ========================================

  const newMorale = updateMorale(
    state.crew?.morale ?? 85,
    choiceId,
    simulation.emergencies.length
  );

  // ========================================
  // PRESERVE EXISTING FATIGUE
  // ========================================

  // IMPORTANT:
  // Never reset fatigue to zero here.
  // Emergency rest must persist between days.

  const currentFatigue =
    state.crew?.fatigue ?? 0;

  // ========================================
  // BUILD UPDATED STATE
  // ========================================

  const updatedBaseState: MissionState = {
    ...state,

    day: nextDay,
    resources,
    score,
    status,
    history,

    crew: {
      fatigue: currentFatigue,
      morale: newMorale,
    },

    equipment: newEquipment,

    emergencies: detectEmergencies(resources),
  };

  // ========================================
  // CALCULATE NEXT-DAY FATIGUE
  // ========================================

  // Adds the completed day's workload to
  // the preserved fatigue value.

  const newFatigue = calculateCrewFatigue(
    updatedBaseState
  );

  return {
    ...updatedBaseState,

    crew: {
      ...updatedBaseState.crew,
      fatigue: newFatigue,
    },
  };
}

// ==========================================
// MISSION SUMMARY
// ==========================================

export function getMissionSummary(
  state: MissionState
) {
  const completedDays = state.history.length;

  const maxScore = completedDays * 100;

  const percentage =
    maxScore > 0
      ? Math.round(
          (state.score / maxScore) * 100
        )
      : 0;

  return {
    daysCompleted: completedDays,
    totalDays: 30,
    score: state.score,
    performance: percentage,
    status: state.status,

    resources: state.resources,
    crew: state.crew,
    equipment: state.equipment,
    emergencies: state.emergencies,

    result:
      state.status === "completed"
        ? "MISSION SUCCESSFUL"
        : state.status === "failed"
          ? "MISSION FAILED"
          : "MISSION IN PROGRESS",
  };
}