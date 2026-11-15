
/* ==========================================
   OUTPOST 30 — ORBI KNOWLEDGE ENGINE

   NASA facts + mission hints + curated Q&A
   Designed for children aged 7–12

   No paid AI service required.
   ========================================== */

import {
  getMissionFacts,
  getMissionTopic,
  NASA_SOURCES,
  type RobotFact,
} from "@/data/robot/missionFacts";

// ==========================================
// TYPES
// ==========================================

export type RobotContext = {
  day: number;
  missionTitle?: string;
  missionDescription?: string;
  difficulty?: "safe" | "risky" | "dangerous";
  gameStatus?: string;
};

export type RobotAnswer = {
  text: string;
  type: "answer" | "hint" | "fact" | "fallback";
  sourceTitle?: string;
  sourceUrl?: string;
};

export type RobotHint = {
  day: number;
  text: string;
};

type KnowledgeEntry = {
  keywords: string[];
  answer: string;
  sourceTitle: string;
  sourceUrl: string;
};

// ==========================================
// MISSION-SPECIFIC HINTS
// ==========================================

// These are gameplay guidance, not NASA
// operating procedures.
//
// Minigame developers can refine hints to
// match their exact mechanics later.

export const MISSION_HINTS: Record<
  number,
  string[]
> = {
  1: [
    "Watch your landing speed. Slow down before you reach the surface.",
    "Look for a flat landing area without large rocks.",
    "Small, careful adjustments are safer than sudden movements.",
  ],

  2: [
    "Follow the oxygen supply path toward the habitat.",
    "Check that the life-support connections are secure.",
    "Look for warning indicators before activating the system.",
  ],

  3: [
    "Check each solar panel connection carefully.",
    "Solar panels need sunlight and a working electrical connection.",
    "Make sure all required parts are connected before testing the system.",
  ],

  4: [
    "Follow the water through each recycling stage.",
    "Check the filters before sending water through the system.",
    "Think about the correct order of water treatment.",
  ],

  5: [
    "Plan your route before beginning the exploration.",
    "Avoid rocks and other obstacles during rover movement.",
    "Keep an eye on your oxygen and mission objectives.",
  ],

  6: [
    "Look for the source of the pressure warning.",
    "Check the habitat seals and connections.",
    "Fixing the leak is more important than temporarily increasing airflow.",
  ],

  7: [
    "Start by checking the communication equipment.",
    "Inspect the antenna and its connections.",
    "A stable signal is more important than sending messages quickly.",
  ],

  8: [
    "Review the space-weather information carefully.",
    "Consider crew protection before outdoor activities.",
    "Check whether the crew should remain inside the habitat.",
  ],

  9: [
    "Look for dust near sensitive equipment.",
    "Inspect seals and moving parts before continuing.",
    "Careful cleaning can prevent equipment problems.",
  ],

  10: [
    "Check the available food before deciding how much to use.",
    "Think about how many mission days are still remaining.",
    "Try to balance crew needs with your limited supplies.",
  ],

  11: [
    "Inspect the rover before trying to drive.",
    "Check for damaged components and warning lights.",
    "A properly repaired rover is safer than a rushed departure.",
  ],

  12: [
    "Check the habitat temperature indicators.",
    "Look for the system responsible for heating and cooling.",
    "Repairing the main system can be better than relying only on backups.",
  ],

  13: [
    "Choose a safe location before collecting a sample.",
    "Follow the sample-handling steps carefully.",
    "Keep samples separate so scientists can study them properly.",
  ],

  14: [
    "Look for the battery showing a fault.",
    "Check the electrical connections before restarting anything.",
    "Protect the habitat's essential power systems first.",
  ],

  15: [
    "Check your crew's fatigue level.",
    "A tired astronaut may need rest before another difficult task.",
    "Keeping the crew healthy is part of completing the mission.",
  ],

  16: [
    "Look at the available space-weather information.",
    "Think about whether outdoor work should continue.",
    "Crew shelter and radiation protection should be considered first.",
  ],

  17: [
    "Check the greenhouse's water and lighting systems.",
    "Plants need the right conditions to grow.",
    "Inspect the controls before making changes.",
  ],

  18: [
    "Check the oxygen generator's status.",
    "Look for a faulty connection or system component.",
    "Remember that oxygen production can require electrical power.",
  ],

  19: [
    "Look carefully at the terrain ahead.",
    "Avoid steep slopes and large rocks.",
    "The shortest route is not always the safest route.",
  ],

  20: [
    "Check the crew member's health indicators.",
    "Treating the problem early may prevent it from becoming worse.",
    "Consider medical care before returning to demanding activities.",
  ],

  21: [
    "Inspect the solar panels for dust.",
    "Clean affected surfaces carefully.",
    "Remember that less sunlight reaching a panel can mean less power.",
  ],

  22: [
    "Find the possible source of the habitat leak.",
    "Check seals and pressure indicators.",
    "Protecting the habitat's air supply should be your priority.",
  ],

  23: [
    "Read the experiment instructions before beginning.",
    "Check that the equipment is ready.",
    "Careful measurements are more useful than rushing the experiment.",
  ],

  24: [
    "Follow the waste through the processing system.",
    "Check the filters and treatment stages.",
    "Look for a blockage or an equipment warning.",
  ],

  25: [
    "Inspect the communication relay connections.",
    "Check the signal indicator before continuing.",
    "A stable communication link helps Mission Control stay informed.",
  ],

  26: [
    "Read the radiation-safety information first.",
    "Consider whether outdoor activities should be delayed.",
    "Check the crew's protection plan before proceeding.",
  ],

  27: [
    "Find which systems use the most electricity.",
    "Keep essential life-support systems powered.",
    "Reducing unnecessary power use may protect your remaining reserves.",
  ],

  28: [
    "Plan your exploration route carefully.",
    "Watch your remaining oxygen and power.",
    "Collect your mission objectives without taking unnecessary risks.",
  ],

  29: [
    "Inspect important equipment before completing the mission.",
    "Make sure your crew and resources are ready.",
    "Check the mission requirements one final time.",
  ],

  30: [
    "Review your crew's health and remaining supplies.",
    "Complete the final safety checks.",
    "A successful mission means finishing safely, not just quickly.",
  ],
};

// ==========================================
// RANDOM SELECTION
// ==========================================

function randomIndex(length: number): number {
  if (length <= 1) return 0;

  return Math.floor(Math.random() * length);
}

export function getRandomMissionFact(
  day: number,
  previousFactId?: string | null
): RobotFact | null {
  const facts = getMissionFacts(day);

  if (facts.length === 0) {
    return null;
  }

  // Exclude the previous fact to prevent
  // immediate repetition.
  const available = previousFactId
    ? facts.filter(
        (fact) => fact.id !== previousFactId
      )
    : facts;

  const pool =
    available.length > 0 ? available : facts;

  return pool[randomIndex(pool.length)];
}

export function getRandomMissionHint(
  day: number,
  previousHint?: string | null
): RobotHint | null {
  const hints = MISSION_HINTS[day];

  if (!hints || hints.length === 0) {
    return null;
  }

  const available = previousHint
    ? hints.filter(
        (hint) => hint !== previousHint
      )
    : hints;

  const pool =
    available.length > 0 ? available : hints;

  return {
    day,
    text: pool[randomIndex(pool.length)],
  };
}

// ==========================================
// VERIFIED EDUCATIONAL KNOWLEDGE
// ==========================================

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: [
      "landing",
      "land",
      "descent",
      "touchdown",
    ],
    answer:
      "Landing on the Moon is difficult because there is almost no atmosphere to slow a spacecraft down. Lunar landers use rocket engines to control their descent.",
    sourceTitle: "NASA — Apollo 11",
    sourceUrl: NASA_SOURCES.apollo,
  },

  {
    keywords: [
      "apollo",
      "neil armstrong",
      "buzz aldrin",
      "first moon landing",
    ],
    answer:
      "Apollo 11 was the first mission to land humans on the Moon in 1969. Neil Armstrong and Buzz Aldrin walked on the surface while Michael Collins stayed in lunar orbit.",
    sourceTitle: "NASA — Apollo 11",
    sourceUrl: NASA_SOURCES.apollo,
  },

  {
    keywords: [
      "oxygen",
      "breathing",
      "breathe",
      "air supply",
    ],
    answer:
      "Astronauts need oxygen to breathe, just like people on Earth. Spacecraft use life-support systems to provide breathable air and remove carbon dioxide.",
    sourceTitle: "NASA — Life Support",
    sourceUrl: NASA_SOURCES.lifeSupport,
  },

  {
    
    keywords: [
    "solar panel",
    "solar panels",
    "solar energy",
    "solar power",
    "electricity",
    "battery",
    "batteries",
    "photovoltaic",
    ],
    answer:
      "Solar panels turn sunlight into electricity. Spacecraft can store some of that energy in batteries for times when sunlight is unavailable.",
    sourceTitle: "NASA — Space Station Facts",
    sourceUrl: NASA_SOURCES.station,
  },

  {
    keywords: [
      "water",
      "recycle",
      "recycling",
      "drink",
      "filter",
    ],
    answer:
      "Astronauts recycle water so they do not need to bring all their water from Earth. Special equipment cleans and checks the water before it is reused.",
    sourceTitle: "NASA — Life Support",
    sourceUrl: NASA_SOURCES.lifeSupport,
  },

  {
    keywords: [
      "rover",
      "drive",
      "vehicle",
      "wheels",
    ],
    answer:
      "A lunar rover is a vehicle made to travel across the Moon. Apollo astronauts used rovers to explore farther and carry scientific equipment.",
    sourceTitle: "NASA — Moon Exploration",
    sourceUrl: NASA_SOURCES.rover,
  },

  {
    keywords: [
      "spacesuit",
      "space suit",
      "helmet",
      "moonwalk",
    ],
    answer:
      "A spacesuit acts like a tiny spacecraft around an astronaut. It provides oxygen, controls temperature, and helps protect the astronaut from the harsh environment.",
    sourceTitle: "NASA — Moon Exploration",
    sourceUrl: NASA_SOURCES.exploration,
  },

  {
    keywords: [
      "radiation",
      "solar flare",
      "solar storm",
      "space weather",
      "sun storm",
    ],
    answer:
      "The Sun sometimes releases bursts of energy and fast-moving particles. NASA studies space weather because some events can affect spacecraft and astronaut safety.",
    sourceTitle: "NASA — Solar Storms and Flares",
    sourceUrl: NASA_SOURCES.spaceWeather,
  },

  {
    keywords: [
      "moon dust",
      "lunar dust",
      "dust",
      "regolith",
    ],
    answer:
      "Moon dust is made of tiny pieces of rock and minerals. It can stick to spacesuits and damage equipment because its particles are sharp and abrasive.",
    sourceTitle: "NASA — Lunar Environment",
    sourceUrl: NASA_SOURCES.moonDust,
  },

  {
    keywords: [
      "food",
      "eat",
      "meal",
      "vegetables",
      "plants",
      "greenhouse",
    ],
    answer:
      "Astronauts need carefully planned food supplies. NASA also studies growing plants in space to help support longer missions.",
    sourceTitle: "NASA — Growing Plants in Space",
    sourceUrl: NASA_SOURCES.plants,
  },

  {
    keywords: [
      "gravity",
      "jump",
      "weight",
      "floating",
    ],
    answer:
      "Gravity on the Moon is about one-sixth as strong as Earth's gravity. That means you would weigh less there, but you would still have the same mass.",
    sourceTitle: "NASA — Moon Exploration",
    sourceUrl: NASA_SOURCES.exploration,
  },

  {
    keywords: [
      "temperature",
      "hot",
      "cold",
      "thermal",
    ],
    answer:
      "Temperatures on the Moon can change dramatically between sunlight and darkness. Astronauts need protective suits and temperature-controlled habitats.",
    sourceTitle: "NASA — Moon Exploration",
    sourceUrl: NASA_SOURCES.exploration,
  },

  {
    keywords: [
      "communication",
      "radio",
      "antenna",
      "mission control",
      "signal",
    ],
    answer:
      "Astronauts use radio communication to exchange information with Mission Control. Signals between Earth and the Moon take more than one second to travel each way.",
    sourceTitle: "NASA — Apollo 11",
    sourceUrl: NASA_SOURCES.apollo,
  },

  {
    keywords: [
      "moon rock",
      "lunar sample",
      "sample",
      "experiment",
      "scientist",
    ],
    answer:
      "Astronauts collect Moon rocks and soil so scientists can study their history. These samples help researchers learn how the Moon formed and changed.",
    sourceTitle: "NASA — Moon Exploration",
    sourceUrl: NASA_SOURCES.exploration,
  },

  {
    keywords: [
      "sleep",
      "tired",
      "fatigue",
      "rest",
      "health",
      "exercise",
    ],
    answer:
      "Astronauts need sleep, exercise, and medical care to stay healthy. Being rested helps them concentrate and make safer decisions.",
    sourceTitle: "NASA — Space Station Facts",
    sourceUrl: NASA_SOURCES.station,
  },

  {
    keywords: [
      "power failure",
      "power outage",
      "backup power",
      "energy",
    ],
    answer:
      "Spacecraft need electricity for life support, computers, and communication. Backup power systems help keep important equipment working when the main supply has a problem.",
    sourceTitle: "NASA — Space Station Facts",
    sourceUrl: NASA_SOURCES.station,
  },

  {
    keywords: [
      "habitat",
      "pressure",
      "air leak",
      "leak",
    ],
    answer:
      "A lunar habitat is a protected place where astronauts can live and work. It must maintain safe air pressure because the Moon has almost no atmosphere.",
    sourceTitle: "NASA — Life Support",
    sourceUrl: NASA_SOURCES.lifeSupport,
  },
];

// ==========================================
// TEXT HELPERS
// ==========================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function hasKeyword(
  input: string,
  keyword: string
): boolean {
  const normalizedInput = normalizeText(input);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) return false;

  // Exact phrase matching
  if (
    (` ${normalizedInput} `).includes(
      ` ${normalizedKeyword} `
    )
  ) {
    return true;
  }

  // Match common singular/plural variations
  const pluralKeyword = normalizedKeyword + "s";

  if (
    (` ${normalizedInput} `).includes(
      ` ${pluralKeyword} `
    )
  ) {
    return true;
  }

  return false;
}

function findKnowledge(
  question: string
): KnowledgeEntry | null {
  const input = normalizeText(question);

  if (!input) return null;

  let bestMatch: KnowledgeEntry | null = null;
  let highestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;

    for (const keyword of entry.keywords) {
      if (hasKeyword(input, keyword)) {
        // Prefer specific multiword matches.
        score += keyword.includes(" ") ? 3 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch;
}

// ==========================================
// MISSION HINT RESPONSE
// ==========================================

export function getRobotHint(
  context: RobotContext,
  previousHint?: string | null
): RobotAnswer {
  const hint = getRandomMissionHint(
    context.day,
    previousHint
  );

  if (!hint) {
    return {
      type: "fallback",
      text:
        "I don't have a hint for this mission yet. " +
        "Try checking the mission instructions!",
    };
  }

  return {
    type: "hint",
    text: `Mission hint: ${hint.text}`,
  };
}

// ==========================================
// NASA FACT RESPONSE
// ==========================================

export function getRobotFact(
  context: RobotContext,
  previousFactId?: string | null
): {
  answer: RobotAnswer;
  factId: string | null;
} {
  const fact = getRandomMissionFact(
    context.day,
    previousFactId
  );

  if (!fact) {
    return {
      factId: null,
      answer: {
        type: "fallback",
        text:
          "I don't have a NASA fact for this mission yet.",
      },
    };
  }

  return {
    factId: fact.id,
    answer: {
      type: "fact",
      text: `Did you know? ${fact.text}`,
      sourceTitle: fact.sourceTitle,
      sourceUrl: fact.sourceUrl,
    },
  };
}

// ==========================================
// QUESTION-ANSWERING ENGINE
// ==========================================

export function answerRobotQuestion(
  question: string,
  context: RobotContext
): RobotAnswer {
  const input = normalizeText(question);

  if (!input) {
    return {
      type: "fallback",
      text:
        "Ask me anything about your Moon mission, Commander!",
    };
  }

  // Greetings
  if (
    /^(hi|hello|hey|hey orbi|good morning|good evening)$/.test(
      input
    )
  ) {
    return {
      type: "answer",
      text:
        `Hello, Commander! I'm ORBI. ` +
        `Ready to help with Day ${context.day}?`,
    };
  }

  // Mission hints
  if (
    hasKeyword(input, "hint") ||
    hasKeyword(input, "help me") ||
    hasKeyword(input, "what should i do")
  ) {
    return getRobotHint(context);
  }

  // Current mission
  if (
    hasKeyword(input, "current mission") ||
    hasKeyword(input, "today mission") ||
    hasKeyword(input, "my mission") ||
    hasKeyword(input, "objective")
  ) {
    const title =
      context.missionTitle ||
      getMissionTopic(context.day);

    const description =
      context.missionDescription ||
      "Complete your mission carefully and keep your crew safe.";

    return {
      type: "answer",
      text:
        `Today is Day ${context.day}: ${title}. ` +
        description,
    };
  }

  // NASA fact requests
  if (
    hasKeyword(input, "fun fact") ||
    hasKeyword(input, "nasa fact") ||
    hasKeyword(input, "tell me a fact")
  ) {
    return getRobotFact(context).answer;
  }

  // Game-specific resource questions
  if (
    hasKeyword(input, "run out of oxygen") ||
    hasKeyword(input, "oxygen runs out")
  ) {
    return {
      type: "answer",
      text:
        "Astronauts cannot breathe without enough oxygen. " +
        "In OUTPOST 30, running out of oxygen can end your mission, " +
        "so keep an eye on your supplies!",
      sourceTitle: "NASA — Life Support",
      sourceUrl: NASA_SOURCES.lifeSupport,
    };
  }

  // General science questions
  const knowledge = findKnowledge(question);

  if (knowledge) {
    return {
      type: "answer",
      text: knowledge.answer,
      sourceTitle: knowledge.sourceTitle,
      sourceUrl: knowledge.sourceUrl,
    };
  }

  // Unknown questions
  return {
    type: "fallback",
    text:
      "That's a great question, Commander! " +
      "I'm not sure of the answer, so I don't want to guess. " +
      "Try asking me about the Moon, astronauts, " +
      "oxygen, solar power, rovers, or your current mission.",
  };
}

// ==========================================
// UNIFIED ROBOT REQUEST HANDLER
// ==========================================

export type RobotAction =
  | "question"
  | "fact"
  | "hint";

export type RobotKnowledgeResult = {
  success: boolean;
  action: RobotAction;
  day: number;
  response: RobotAnswer;
  factId?: string | null;
  hintText?: string | null;
};

export function processRobotRequest(
  action: RobotAction,
  context: RobotContext,
  options: {
    question?: string;
    previousFactId?: string | null;
    previousHint?: string | null;
  } = {}
): RobotKnowledgeResult {
  if (
    !Number.isInteger(context.day) ||
    context.day < 1 ||
    context.day > 30
  ) {
    return {
      success: false,
      action,
      day: context.day,
      response: {
        type: "fallback",
        text:
          "I couldn't find that mission day. " +
          "Please check the mission information.",
      },
    };
  }

  if (action === "fact") {
    const result = getRobotFact(
      context,
      options.previousFactId
    );

    return {
      success: true,
      action,
      day: context.day,
      response: result.answer,
      factId: result.factId,
    };
  }

  if (action === "hint") {
    const hint = getRandomMissionHint(
      context.day,
      options.previousHint
    );

    return {
      success: true,
      action,
      day: context.day,
      response: hint
        ? {
            type: "hint",
            text: `Mission hint: ${hint.text}`,
          }
        : {
            type: "fallback",
            text: "No hint is available for this day.",
          },
      hintText: hint?.text ?? null,
    };
  }

  return {
    success: true,
    action: "question",
    day: context.day,
    response: answerRobotQuestion(
      options.question ?? "",
      context
    ),
  };
}