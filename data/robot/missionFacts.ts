
/* ==========================================
   OUTPOST 30 — ORBI MISSION FACT LIBRARY
   30 DAYS × 3 FACTS = 90 FACTS

   NASA science and mission history are factual.
   OUTPOST 30 game activities are simulated.
   ========================================== */

export type RobotFact = {
  id: string;
  text: string;
  sourceTitle: string;
  sourceUrl: string;
};

export type MissionFactEntry = {
  day: number;
  topic: string;
  facts: RobotFact[];
};

// Official NASA reference pages
export const NASA_SOURCES = {
  apollo:
    "https://www.nasa.gov/mission/apollo-11/",

  apolloHistory:
    "https://science.nasa.gov/moon/exploration/",

  lifeSupport:
    "https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/",

  station:
    "https://www.nasa.gov/international-space-station/space-station-facts-and-figures/",

  spaceWeather:
    "https://science.nasa.gov/sun/solar-storms-and-flares/",

  moonDust:
    "https://www.nasa.gov/reference/moonbase-environment/",

  plants:
    "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/",

  rover:
    "https://science.nasa.gov/moon/exploration/",

  exploration:
    "https://science.nasa.gov/moon/exploration/",
} as const;

function makeFact(
  id: string,
  text: string,
  sourceTitle: string,
  sourceUrl: string
): RobotFact {
  return {
    id,
    text,
    sourceTitle,
    sourceUrl,
  };
}

export const MISSION_FACTS: Record<
  number,
  MissionFactEntry
> = {
  // ========================================
  // DAY 1 — LUNAR LANDING
  // ========================================

  1: {
    day: 1,
    topic: "Lunar Landing",
    facts: [
      makeFact(
        "1-1",
        "Apollo 11 landed the first humans on the Moon on July 20, 1969!",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "1-2",
        "The Apollo 11 lunar module was named Eagle. It carried Neil Armstrong and Buzz Aldrin down to the Moon.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "1-3",
        "Apollo 11 astronauts landed in a place called the Sea of Tranquility.",
        "NASA — Moon Exploration",
        NASA_SOURCES.apolloHistory
      ),
    ],
  },

  // DAY 2 — LIFE SUPPORT

  2: {
    day: 2,
    topic: "Life Support",
    facts: [
      makeFact(
        "2-1",
        "Astronauts need life-support machines because space does not have breathable air.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "2-2",
        "Spacecraft life-support systems help control oxygen, air pressure, and cabin temperature.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "2-3",
        "NASA uses special equipment to remove carbon dioxide from the air astronauts breathe.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 3 — SOLAR POWER

  3: {
    day: 3,
    topic: "Solar Energy",
    facts: [
      makeFact(
        "3-1",
        "The International Space Station uses large solar arrays to produce electricity from sunlight.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "3-2",
        "Solar panels can provide electricity without needing fuel to burn.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "3-3",
        "Space stations store electrical energy in batteries so they can keep working when sunlight is blocked.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
    ],
  },

  // DAY 4 — WATER RECYCLING

  4: {
    day: 4,
    topic: "Water Recycling",
    facts: [
      makeFact(
        "4-1",
        "Astronauts on the International Space Station recycle water to reduce the need for supplies from Earth.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "4-2",
        "NASA's water recovery system can clean water collected from the air inside the spacecraft.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "4-3",
        "Recycled water goes through special filters and treatment before astronauts can drink it.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 5 — LUNAR EXPLORATION

  5: {
    day: 5,
    topic: "Lunar Exploration",
    facts: [
      makeFact(
        "5-1",
        "Apollo astronauts explored the Moon to collect rocks and learn how its surface formed.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "5-2",
        "The Moon has much weaker gravity than Earth, so astronauts can make long, bouncing steps.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "5-3",
        "Astronauts wear spacesuits during moonwalks because the lunar surface has almost no atmosphere.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 6 — HABITAT PRESSURE

  6: {
    day: 6,
    topic: "Habitat Safety",
    facts: [
      makeFact(
        "6-1",
        "Space habitats must keep air inside at a safe pressure for astronauts.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "6-2",
        "Sensors help spacecraft crews monitor air pressure and other important conditions.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "6-3",
        "Life-support systems also help circulate and clean the air inside a spacecraft.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 7 — COMMUNICATIONS

  7: {
    day: 7,
    topic: "Space Communication",
    facts: [
      makeFact(
        "7-1",
        "Apollo astronauts communicated with teams on Earth during their missions.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "7-2",
        "Mission Control helps astronauts monitor their spacecraft and plan activities.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "7-3",
        "The Moon is so far away that radio signals take more than one second to travel between it and Earth.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 8 — RADIATION MONITORING

  8: {
    day: 8,
    topic: "Space Weather",
    facts: [
      makeFact(
        "8-1",
        "Solar flares are powerful bursts of energy released by the Sun.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "8-2",
        "NASA monitors activity on the Sun because space weather can affect spacecraft.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "8-3",
        "Earth's atmosphere and magnetic field help protect us from harmful space radiation.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
    ],
  },

  // DAY 9 — LUNAR DUST

  9: {
    day: 9,
    topic: "Lunar Dust",
    facts: [
      makeFact(
        "9-1",
        "Moon dust is made of tiny pieces of broken rock and minerals.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
      makeFact(
        "9-2",
        "Lunar dust can stick to spacesuits and equipment, making cleaning difficult.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
      makeFact(
        "9-3",
        "Moon dust is sharp and abrasive because there is almost no wind or flowing water to smooth it.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
    ],
  },

  // DAY 10 — FOOD INVENTORY

  10: {
    day: 10,
    topic: "Astronaut Food",
    facts: [
      makeFact(
        "10-1",
        "Astronauts need carefully planned food supplies because spacecraft cannot visit a grocery store.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
      makeFact(
        "10-2",
        "NASA studies how to grow fresh vegetables in space to help support longer missions.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
      makeFact(
        "10-3",
        "The International Space Station has a small plant-growing system called Veggie.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
    ],
  },

  // DAY 11 — ROVER MAINTENANCE

  11: {
    day: 11,
    topic: "Lunar Rovers",
    facts: [
      makeFact(
        "11-1",
        "Apollo 15, 16, and 17 astronauts used special vehicles to drive across the Moon.",
        "NASA — Moon Exploration",
        NASA_SOURCES.rover
      ),
      makeFact(
        "11-2",
        "Lunar rovers helped astronauts explore places too far away to reach on foot.",
        "NASA — Moon Exploration",
        NASA_SOURCES.rover
      ),
      makeFact(
        "11-3",
        "Rovers helped astronauts carry scientific tools and collect more lunar samples.",
        "NASA — Moon Exploration",
        NASA_SOURCES.rover
      ),
    ],
  },

  // DAY 12 — TEMPERATURE CONTROL

  12: {
    day: 12,
    topic: "Thermal Control",
    facts: [
      makeFact(
        "12-1",
        "Sunlit and shadowed areas on the Moon can have very different temperatures.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
      makeFact(
        "12-2",
        "A lunar habitat needs equipment to keep astronauts at comfortable temperatures.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "12-3",
        "Spacecraft use temperature-control systems to protect people and equipment.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 13 — SAMPLE COLLECTION

  13: {
    day: 13,
    topic: "Lunar Samples",
    facts: [
      makeFact(
        "13-1",
        "Apollo astronauts brought hundreds of kilograms of Moon rocks and soil back to Earth.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "13-2",
        "Scientists study Moon rocks to understand the Moon's ancient history.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "13-3",
        "Moon rocks help researchers learn about impacts and volcanic activity long ago.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 14 — BATTERIES

  14: {
    day: 14,
    topic: "Spacecraft Batteries",
    facts: [
      makeFact(
        "14-1",
        "Batteries store electricity so spacecraft can use power when sunlight is unavailable.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "14-2",
        "The International Space Station relies on solar arrays and stored electrical energy.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "14-3",
        "Spacecraft need reliable power for communications, computers, and other important systems.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
    ],
  },

  // DAY 15 — CREW FATIGUE

  15: {
    day: 15,
    topic: "Astronaut Wellbeing",
    facts: [
      makeFact(
        "15-1",
        "Astronauts follow daily schedules that include work, meals, exercise, and sleep.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "15-2",
        "Rest and exercise help astronauts stay ready for demanding activities.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "15-3",
        "Space missions require teamwork because crews must solve problems together.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
    ],
  },

  // DAY 16 — SOLAR FLARE RESPONSE

  16: {
    day: 16,
    topic: "Solar Flares",
    facts: [
      makeFact(
        "16-1",
        "NASA groups solar flares into classes such as C, M, and X based on their strength.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "16-2",
        "X-class solar flares are stronger than M-class solar flares.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "16-3",
        "Some solar storms release fast-moving particles that can create radiation risks for astronauts.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
    ],
  },

  // DAY 17 — GREENHOUSE

  17: {
    day: 17,
    topic: "Growing Plants in Space",
    facts: [
      makeFact(
        "17-1",
        "NASA has grown lettuce and other plants aboard the International Space Station.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
      makeFact(
        "17-2",
        "Plants need light, water, and nutrients to grow, even in space.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
      makeFact(
        "17-3",
        "NASA's Veggie experiment uses special lights to help plants grow.",
        "NASA — Growing Plants in Space",
        NASA_SOURCES.plants
      ),
    ],
  },

  // DAY 18 — OXYGEN GENERATOR

  18: {
    day: 18,
    topic: "Oxygen Generation",
    facts: [
      makeFact(
        "18-1",
        "The space station can make breathable oxygen by splitting water into oxygen and hydrogen.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "18-2",
        "The process of using electricity to split water is called electrolysis.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "18-3",
        "Recycling water and making oxygen help reduce the supplies astronauts need from Earth.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 19 — NAVIGATION

  19: {
    day: 19,
    topic: "Lunar Navigation",
    facts: [
      makeFact(
        "19-1",
        "The Moon has craters, hills, and rocky terrain that explorers must navigate.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "19-2",
        "Lunar rovers let astronauts explore beyond the area around their landing site.",
        "NASA — Moon Exploration",
        NASA_SOURCES.rover
      ),
      makeFact(
        "19-3",
        "Planning a route helps astronauts avoid obstacles and use their exploration time wisely.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 20 — MEDICAL EMERGENCY

  20: {
    day: 20,
    topic: "Astronaut Health",
    facts: [
      makeFact(
        "20-1",
        "Space crews monitor their health because living and working in space affects the human body.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "20-2",
        "Astronauts exercise regularly to help protect their muscles and bones during space missions.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "20-3",
        "Long space missions require careful planning for food, water, air, and medical needs.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 21 — SOLAR PANEL DUST

  21: {
    day: 21,
    topic: "Solar Panel Maintenance",
    facts: [
      makeFact(
        "21-1",
        "Moon dust can coat solar arrays and reduce their performance.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
      makeFact(
        "21-2",
        "Lunar dust can also get into moving mechanisms and damage equipment.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
      makeFact(
        "21-3",
        "NASA studies ways to protect Moon equipment from dust during long missions.",
        "NASA — Lunar Environment",
        NASA_SOURCES.moonDust
      ),
    ],
  },

  // DAY 22 — HABITAT LEAK

  22: {
    day: 22,
    topic: "Habitat Pressure",
    facts: [
      makeFact(
        "22-1",
        "Spacecraft cabins need controlled air pressure to keep astronauts safe.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "22-2",
        "A spacecraft's life-support system helps monitor the air its crew breathes.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "22-3",
        "Space habitats need careful maintenance because they operate in a harsh environment.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 23 — SCIENTIFIC EXPERIMENT

  23: {
    day: 23,
    topic: "Lunar Science",
    facts: [
      makeFact(
        "23-1",
        "Apollo astronauts placed scientific instruments on the Moon.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "23-2",
        "Moon experiments helped scientists study moonquakes and the lunar environment.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "23-3",
        "Scientists still study samples collected during the Apollo missions.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 24 — WASTE PROCESSING

  24: {
    day: 24,
    topic: "Recycling in Space",
    facts: [
      makeFact(
        "24-1",
        "NASA recovers water from several sources aboard the space station, including wastewater.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "24-2",
        "Recycling helps reduce how much water must be launched from Earth.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "24-3",
        "Life-support systems must keep recycled water clean and safe for astronauts.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
    ],
  },

  // DAY 25 — COMMUNICATION RELAY

  25: {
    day: 25,
    topic: "Space Communication",
    facts: [
      makeFact(
        "25-1",
        "Apollo missions depended on communication between astronauts and ground teams.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "25-2",
        "Spacecraft transmit information about their systems so teams can monitor mission conditions.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "25-3",
        "Mission Control uses communications to help astronauts plan and respond to problems.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
    ],
  },

  // DAY 26 — RADIATION PREPAREDNESS

  26: {
    day: 26,
    topic: "Radiation Safety",
    facts: [
      makeFact(
        "26-1",
        "Solar storms can send energetic particles through space.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "26-2",
        "Space-weather forecasting helps mission planners prepare for changing solar activity.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
      makeFact(
        "26-3",
        "Astronauts beyond Earth's protective atmosphere need to consider space radiation during mission planning.",
        "NASA — Solar Storms and Flares",
        NASA_SOURCES.spaceWeather
      ),
    ],
  },

  // DAY 27 — EMERGENCY POWER

  27: {
    day: 27,
    topic: "Power Management",
    facts: [
      makeFact(
        "27-1",
        "The International Space Station uses solar energy to power many important systems.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "27-2",
        "Spacecraft need electricity for computers, communication, and environmental controls.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
      makeFact(
        "27-3",
        "Stored power helps spacecraft keep running when their solar panels are not receiving sunlight.",
        "NASA — Space Station Facts",
        NASA_SOURCES.station
      ),
    ],
  },

  // DAY 28 — FINAL EXPLORATION

  28: {
    day: 28,
    topic: "Moon Exploration",
    facts: [
      makeFact(
        "28-1",
        "Twelve astronauts walked on the Moon during the Apollo program.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "28-2",
        "Apollo astronauts used tools, cameras, and experiments to study the Moon.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "28-3",
        "Samples from the Moon help scientists investigate how our solar system developed.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },

  // DAY 29 — MISSION PREPARATION

  29: {
    day: 29,
    topic: "Mission Readiness",
    facts: [
      makeFact(
        "29-1",
        "NASA missions use detailed preparation and equipment checks to reduce risks.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "29-2",
        "Keeping spacecraft systems working together is essential for a successful mission.",
        "NASA — Life Support",
        NASA_SOURCES.lifeSupport
      ),
      makeFact(
        "29-3",
        "Astronauts and mission controllers work as a team to solve difficult challenges.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
    ],
  },

  // DAY 30 — MISSION COMPLETION

  30: {
    day: 30,
    topic: "Mission Completion",
    facts: [
      makeFact(
        "30-1",
        "Apollo 11 returned safely to Earth on July 24, 1969.",
        "NASA — Apollo 11",
        NASA_SOURCES.apollo
      ),
      makeFact(
        "30-2",
        "The Apollo program brought back hundreds of kilograms of lunar rocks and soil for scientific study.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
      makeFact(
        "30-3",
        "Each Moon mission gives scientists and engineers knowledge that can help plan future exploration.",
        "NASA — Moon Exploration",
        NASA_SOURCES.exploration
      ),
    ],
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getMissionFacts(
  day: number
): RobotFact[] {
  return MISSION_FACTS[day]?.facts ?? [];
}

export function getMissionTopic(
  day: number
): string {
  return (
    MISSION_FACTS[day]?.topic ??
    "Lunar Mission"
  );
}

export function getFactById(
  factId: string
): RobotFact | null {
  for (const entry of Object.values(MISSION_FACTS)) {
    const fact = entry.facts.find(
      (item) => item.id === factId
    );

    if (fact) return fact;
  }

  return null;
}