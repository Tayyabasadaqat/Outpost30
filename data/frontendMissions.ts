
import type { Mission } from "@/components/MissionCard";

export const frontendMissions: Mission[] = [
  {
    day: 1,
    title: "Power Up the Base!",
    emoji: "⚡",
    description:
      "We've landed on the Moon! Our new home needs power. What should we do first?",
    scienceFact:
      "Solar panels turn sunlight into electricity. Moon bases can use them to power important equipment.",
    options: [
      {
        id: "1-solar",
        title: "Set Up Solar Panels",
        description:
          "Collect sunlight, but use some crew time to get started.",
        emoji: "☀️",
        changes: {
          power: 12,
          lifeSupport: -2,
          crewSafety: -2,
        },
        result:
          "The solar panels are working! Your base has more power, but the crew used some supplies setting them up.",
      },
      {
        id: "1-battery",
        title: "Use Backup Batteries",
        description:
          "Get power quickly, but save less for later.",
        emoji: "🔋",
        changes: {
          power: 6,
          lifeSupport: -3,
          crewSafety: 0,
        },
        result:
          "The backup batteries switched on! The base is safe for now, but some supplies were used.",
      },
    ],
  },
  {
    day: 2,
    title: "The Greenhouse!",
    emoji: "🌱",
    description:
      "Our tiny Moon plants need help! How should we care for them?",
    scienceFact:
      "Plants need light, water, and nutrients to grow. Space researchers study how to grow food in controlled environments.",
    options: [
      {
        id: "2-water",
        title: "Water the Plants",
        description:
          "Help the plants grow while using extra supplies.",
        emoji: "💧",
        changes: {
          lifeSupport: 9,
          power: -3,
          crewSafety: 0,
        },
        result:
          "The plants look happier already! Fresh green leaves are growing inside the greenhouse.",
      },
      {
        id: "2-lights",
        title: "Turn On Grow Lights",
        description:
          "Give plants more light, but use electricity.",
        emoji: "💡",
        changes: {
          lifeSupport: 6,
          power: -7,
          crewSafety: 0,
        },
        result:
          "The greenhouse is glowing! The plants are getting the light they need, but power levels have dropped.",
      },
    ],
  },
  {
    day: 3,
    title: "Rover Adventure!",
    emoji: "🚙",
    description:
      "A shiny rock has been spotted near the base. Should we send the rover to investigate?",
    scienceFact:
      "NASA's lunar exploration programs study Moon rocks to learn about the Moon's history and formation.",
    options: [
      {
        id: "3-rover",
        title: "Send the Rover",
        description:
          "Collect a sample while using battery power.",
        emoji: "🤖",
        changes: {
          power: -8,
          crewSafety: 2,
          lifeSupport: 0,
        },
        result:
          "Great discovery! The rover collected a rock sample and returned safely.",
      },
      {
        id: "3-stay",
        title: "Study from the Base",
        description:
          "Save power and keep the crew close to home.",
        emoji: "🔭",
        changes: {
          power: -2,
          crewSafety: 5,
          lifeSupport: 0,
        },
        result:
          "Smart thinking! The crew used cameras to study the area without taking a risky trip.",
      },
    ],
  },
];
