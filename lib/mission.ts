
/* ==========================================
   OUTPOST 30 — LUNAR MISSION GAME ENGINE
   ========================================== */

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
};

const INITIAL_RESOURCES: Resources = {
  oxygen: 90,
  water: 85,
  food: 85,
  power: 90,
  health: 100,
};

// Daily resource consumption
const DAILY_CONSUMPTION: ResourceChanges = {
  oxygen: -2,
  water: -2,
  food: -2,
  power: -2,
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
    description: "Your spacecraft has landed. Secure the landing site.",
    category: "Landing",
    best: "Run the landing safety checklist",
    risky: "Begin unloading immediately",
    worst: "Skip the landing inspection",
  },
  {
    title: "Activate Life Support",
    description: "The habitat needs a stable oxygen supply.",
    category: "Life Support",
    best: "Calibrate the oxygen system",
    risky: "Use emergency oxygen reserves",
    worst: "Delay the oxygen system setup",
  },
  {
    title: "Solar Array Deployment",
    description: "Your base requires electricity.",
    category: "Power",
    best: "Deploy and inspect solar panels",
    risky: "Use backup batteries",
    worst: "Operate without power checks",
  },
  {
    title: "Water Recycling",
    description: "The water recycling unit has reduced efficiency.",
    category: "Water",
    best: "Repair the recycling filters",
    risky: "Use stored water reserves",
    worst: "Ignore the warning",
  },
  {
    title: "First Lunar Exploration",
    description: "The crew prepares for its first surface mission.",
    category: "Exploration",
    best: "Check suits and oxygen supplies",
    risky: "Reduce preparation time",
    worst: "Explore without safety checks",
  },
  {
    title: "Habitat Pressure Alert",
    description: "A sensor detects a possible air leak.",
    category: "Life Support",
    best: "Locate and seal the leak",
    risky: "Increase oxygen flow",
    worst: "Ignore the pressure alert",
  },
  {
    title: "Communication Breakdown",
    description: "Communication with Mission Control is unstable.",
    category: "Communication",
    best: "Repair the communication antenna",
    risky: "Switch to low-power signals",
    worst: "Continue without communication",
  },
  {
    title: "Radiation Monitoring",
    description: "Space-weather observations require a safety review.",
    category: "NASA Space Weather",
    best: "Shelter crew and check radiation instruments",
    risky: "Reduce outdoor activity",
    worst: "Continue all outdoor operations",
  },
  {
    title: "Lunar Dust Emergency",
    description: "Abrasive lunar dust affects important equipment.",
    category: "Maintenance",
    best: "Clean and protect equipment seals",
    risky: "Perform a quick inspection",
    worst: "Ignore dust contamination",
  },
  {
    title: "Food Inventory",
    description: "Your crew needs to review food supplies.",
    category: "Food",
    best: "Organize food rationing",
    risky: "Use extra food for crew morale",
    worst: "Ignore food consumption",
  },
  {
    title: "Rover Maintenance",
    description: "The lunar rover reports a mechanical fault.",
    category: "Rover",
    best: "Repair the rover before departure",
    risky: "Use the rover at reduced speed",
    worst: "Drive without repairs",
  },
  {
    title: "Thermal Control",
    description: "Habitat temperature regulation is unstable.",
    category: "Habitat",
    best: "Repair the thermal control system",
    risky: "Use backup heating",
    worst: "Ignore temperature warnings",
  },
  {
    title: "Sample Collection",
    description: "Collect lunar samples for scientific analysis.",
    category: "Science",
    best: "Follow the sample collection protocol",
    risky: "Collect samples quickly",
    worst: "Skip contamination controls",
  },
  {
    title: "Battery Failure",
    description: "One battery bank is malfunctioning.",
    category: "Power",
    best: "Isolate and repair the battery",
    risky: "Transfer loads to backup power",
    worst: "Ignore the battery warning",
  },
  {
    title: "Crew Fatigue",
    description: "Crew members are showing signs of exhaustion.",
    category: "Crew",
    best: "Schedule rest and medical checks",
    risky: "Reduce workload slightly",
    worst: "Continue the full work schedule",
  },
  {
    title: "Solar Flare Response",
    description: "Review solar activity and crew radiation protection.",
    category: "NASA Space Weather",
    best: "Move crew to the radiation shelter",
    risky: "Shorten surface operations",
    worst: "Ignore radiation safety procedures",
  },
  {
    title: "Greenhouse Maintenance",
    description: "The experimental plant system needs attention.",
    category: "Research",
    best: "Repair the greenhouse controls",
    risky: "Use manual watering",
    worst: "Leave the greenhouse unattended",
  },
  {
    title: "Oxygen Generator Fault",
    description: "The oxygen generation unit is losing efficiency.",
    category: "Life Support",
    best: "Repair the oxygen generator",
    risky: "Switch to emergency oxygen",
    worst: "Continue normal operations",
  },
  {
    title: "Lunar Navigation",
    description: "Your rover needs a safe route across lunar terrain.",
    category: "Navigation",
    best: "Analyze terrain and plan a route",
    risky: "Choose the shortest route",
    worst: "Travel without navigation checks",
  },
  {
    title: "Medical Emergency",
    description: "A crew member reports a health problem.",
    category: "Medical",
    best: "Provide medical care immediately",
    risky: "Monitor symptoms while working",
    worst: "Ignore the symptoms",
  },
  {
    title: "Solar Panel Dust",
    description: "Dust is reducing solar panel efficiency.",
    category: "Power",
    best: "Clean and inspect solar panels",
    risky: "Use reserve power",
    worst: "Ignore declining power output",
  },
  {
    title: "Habitat Leak",
    description: "The habitat has a small pressure leak.",
    category: "Emergency",
    best: "Isolate and seal the leak",
    risky: "Increase oxygen supply temporarily",
    worst: "Leave the leak untreated",
  },
  {
    title: "Scientific Experiment",
    description: "Conduct a low-gravity research experiment.",
    category: "Science",
    best: "Follow the complete experiment protocol",
    risky: "Perform a shortened experiment",
    worst: "Skip safety procedures",
  },
  {
    title: "Waste Processing",
    description: "The waste recycling system requires servicing.",
    category: "Maintenance",
    best: "Repair and test the recycling system",
    risky: "Use temporary waste storage",
    worst: "Ignore the system warning",
  },
  {
    title: "Communication Relay",
    description: "A relay needs adjustment for reliable communication.",
    category: "Communication",
    best: "Recalibrate the relay system",
    risky: "Operate with reduced signal quality",
    worst: "Disable communication checks",
  },
  {
    title: "Radiation Preparedness",
    description: "The crew reviews a space-weather safety alert.",
    category: "NASA Space Weather",
    best: "Review NASA data and prepare shelter",
    risky: "Limit external activities",
    worst: "Ignore the safety alert",
  },
  {
    title: "Emergency Power",
    description: "Your base is running low on stored electricity.",
    category: "Power",
    best: "Reduce nonessential power use",
    risky: "Drain backup batteries",
    worst: "Maintain maximum consumption",
  },
  {
    title: "Final Exploration",
    description: "Complete the last major lunar exploration task.",
    category: "Exploration",
    best: "Plan a safe scientific expedition",
    risky: "Shorten the mission preparation",
    worst: "Ignore mission safety checks",
  },
  {
    title: "Mission Preparation",
    description: "Prepare your crew and equipment for mission completion.",
    category: "Mission",
    best: "Inspect equipment and verify supplies",
    risky: "Perform only essential inspections",
    worst: "Skip final inspections",
  },
  {
    title: "Mission Complete",
    description: "Finish the 30-day lunar survival mission.",
    category: "Final Mission",
    best: "Complete the final safety review",
    risky: "Rush the completion procedure",
    worst: "Skip mission closure checks",
  },
];

// ==========================================
// CREATE A NEW MISSION
// ==========================================

export function startMission(): MissionState {
  return {
    day: 1,
    resources: { ...INITIAL_RESOURCES },
    score: 0,
    status: "active",
    history: [],
  };
}

// ==========================================
// GET CURRENT CHALLENGE
// ==========================================

export function getChallenge(
  day: number
): MissionChallenge | null {
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    return null;
  }

  const data = DAILY_CHALLENGES[day - 1];

  // Game design values, not NASA measurements.
  const choices: MissionChoice[] = [
    {
      id: "safe",
      label: data.best,
      description: "Prioritize crew and mission safety.",
      
    effects: {
    oxygen: 2,
    water: 2,
    food: 2,
    power: 2,
    health: 1,
    },
      score: 100,
      feedback:
        "Excellent decision! Mission Control approves.",
    },
    {
      id: "risky",
      label: data.risky,
      description: "Save time, but accept greater risk.",
      effects: {
        oxygen: -5,
        water: -3,
        power: -2,
        health: -5,
      },
      score: 50,
      feedback:
        "Mission continues, but the crew faces additional risks.",
    },
    {
      id: "dangerous",
      label: data.worst,
      description: "Ignore recommended safety procedures.",
      effects: {
        oxygen: -10,
        power: -8,
        health: -15,
      },
      score: 0,
      feedback:
        "Unsafe decision! Crew safety has been compromised.",
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
// RESOURCE MANAGEMENT
// ==========================================

function clampResource(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyResourceChanges(
  resources: Resources,
  changes: ResourceChanges
): Resources {
  const updated = { ...resources };

  for (const key of Object.keys(updated) as ResourceName[]) {
    updated[key] = clampResource(
      updated[key] + (changes[key] ?? 0)
    );
  }

  return updated;
}

// ==========================================
// PLAYER DECISION ENGINE
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

if (challenge && challenge.day !== state.day) {
  throw new Error("Challenge does not match mission day.");
}

  if (!challenge) {
    throw new Error("Invalid mission day.");
  }

  const choice = challenge.choices.find(
    (item) => item.id === choiceId
  );

  if (!choice) {
    throw new Error("Invalid mission choice.");
  }

  // Apply consequences of the player's choice.
  let resources = applyResourceChanges(
    state.resources,
    choice.effects
  );

  // Consume daily supplies.
  resources = applyResourceChanges(
    resources,
    DAILY_CONSUMPTION
  );

  const historyEntry: MissionHistory = {
    day: state.day,
    challenge: challenge.title,
    choice: choice.label,
    feedback: choice.feedback,
    effects: choice.effects,
  };

  const history = [...state.history, historyEntry];

  const score = state.score + choice.score;

  // Check whether the crew survived.
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

  return {
    day:
      status === "active"
        ? state.day + 1
        : state.day,
    resources,
    score,
    status,
    history,
  };
}

// ==========================================
// MISSION SUMMARY
// ==========================================

export function getMissionSummary(state: MissionState) {
  const completedDays = state.history.length;

  const maxScore = completedDays * 100;

  const percentage =
    maxScore > 0
      ? Math.round((state.score / maxScore) * 100)
      : 0;

  return {
    daysCompleted: completedDays,
    totalDays: 30,
    score: state.score,
    performance: percentage,
    status: state.status,
    resources: state.resources,
    result:
      state.status === "completed"
        ? "MISSION SUCCESSFUL"
        : state.status === "failed"
        ? "MISSION FAILED"
        : "MISSION IN PROGRESS",
  };
}