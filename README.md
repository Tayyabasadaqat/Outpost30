OUTPOST 30 🌕
An interactive 30-day lunar mission survival and astronaut training simulator.

OUTPOST 30 puts players in command of a simulated lunar outpost. Over 30 mission days, they must make operational decisions, maintain life-support systems, manage limited resources, protect crew wellbeing, and respond to emergencies. Choices have consequences: poor resource management can cause the mission to fail.

Built as a two-person hackathon project for NASA Space Apps Challenge 2026 (Junior Astronaut).
Project status: The TypeScript/Next.js mission backend and automated gameplay test are working. Frontend integration and the complete player-facing demo are still in progress.

Key features
- 30 daily mission challenges: Landing, habitat setup, exploration, equipment maintenance, science, medical response, and mission completion.
- Meaningful decisions: Safe, risky, and dangerous choices affect resources and score differently.
- Resource simulation: Tracks oxygen, water, food, power, and crew health.
- Crew and equipment state: Tracks fatigue, morale, life support, solar panels, and the water recycler across days.
- Dynamic emergencies: Detects conditions such as exhaustion and shortages, and requires an emergency response before the regular mission can proceed.
- NASA space-weather integration: Uses recorded solar-flare observations from NASA DONKI to create scenario-based training missions.
- Live/historical data modes: Attempts to retrieve NASA observations and can fall back to a locally stored dataset of historical NASA records if the remote service is unavailable.
- Mission reports: Tracks completed days, choices, score, and mission success or failure.
- Local save/resume utilities: Browser storage helpers are available for frontend integration.
How NASA data is used
OUTPOST 30 uses NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) solar-flare observations. The game assigns recorded observations to simulated mission days and creates decision-making exercises around them.

Important: NASA observations are real historical records; their placement on the game's 30-day timeline and their gameplay consequences are simulated. OUTPOST 30 is not a solar-flare forecast, radiation-dose calculator, or operational astronaut safety tool. "Live" mode means the records were retrieved from the NASA service during the session; it does not imply the observed events are occurring in real time.

NASA DONKI: https://ccmc.gsfc.nasa.gov/donki/

NASA Images API is also used through a separate lunar-image endpoint in the project.
Tech stack
- Next.js (App Router)
- React and TypeScript
- Node.js runtime for API routes
- NASA DONKI API for solar-flare observations
- NASA Images API for imagery discovery
- PowerShell for automated API/gameplay testing
- Browser localStorage for prototype save/resume utilities
Getting started
Prerequisites
- Node.js and npm
- PowerShell (to run the provided automated test script)
Run locally
git clone <your-repository-url>
cd <your-project-folder>
npm install
npm run dev
Open http://localhost:3000 in your browser.

To check the mission API, open http://localhost:3000/api/mission. The GET endpoint returns a health-check response and the list of supported actions.
Some NASA endpoints may be temporarily unavailable. The configured historical-data fallback allows the simulation to run using previously obtained NASA observations. Do not replace authentic records with invented NASA data.

Mission API
Endpoint: POST /api/mission
Content-Type: application/json
Action	Purpose
start	Create a new 30-day mission and schedule NASA-derived scenarios.
challenge	Retrieve the current daily challenge, or an emergency requiring attention.
decide	Submit a daily mission choice and advance the game state.
resolve-emergency	Respond to an emergency without advancing the day.
summary	Retrieve mission statistics and emergency history.


Start a mission
curl -X POST http://localhost:3000/api/mission \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
The response includes a state object. Send that updated state back with each subsequent request.
Request the current challenge
{
  "action": "challenge",
  "state": { "...": "state returned by the previous request" }
}
If the response sets requiresEmergencyResponse to true, resolve the reported emergency before making the daily decision.
Submit a daily decision
{
  "action": "decide",
  "state": { "...": "current game state" },
  "choiceId": "safe"
}
Choice IDs are safe, risky, and dangerous for the current implementation.
Resolve an emergency
{
  "action": "resolve-emergency",
  "state": { "...": "current game state" },
  "emergencyId": "crew-exhaustion",
  "choiceId": "safe"
}
An emergency can be resolved only once per mission day. A resolution updates crew/equipment/resources without consuming the day's normal or NASA mission.
Prototype architecture note: The API currently accepts game state from the client. This is suitable for the hackathon prototype, but a production release would require server-authoritative state, stronger validation, and anti-tampering protections.

Project structure
app/
  api/
    mission/route.ts           # Mission API
    nasa/lunar-images/route.ts # NASA imagery endpoint
lib/
  mission.ts                   # Mission definitions, choices, scoring
  mission-effects.ts           # Day-specific resource consequences
  dynamic-engine.ts            # Consumption, fatigue, production, warnings
  emergency-engine.ts          # Emergency detection and response choices
  nasa.ts                      # NASA data retrieval and fallback
  nasa-event-engine.ts         # NASA event timeline and training scenarios
  mission-storage.ts           # Local save/resume helpers
data/
  nasa-flr.json                # Local NASA historical observations
scripts/
  test-mission.ps1             # Automated 30-day gameplay test
Other frontend components and pages may also be present as the interface is integrated.
Testing
Start the development server:
npm run dev
Then, in a separate Windows PowerShell terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-mission.ps1
The test starts a mission, resolves triggered emergencies using the safe response, plays all 30 days, and verifies mission completion and coverage of scheduled NASA scenarios.
Latest successful test (November 14, 2026)
Metric	Result
Mission days completed	30/30
Scheduled NASA scenarios completed	8/8
Emergencies resolved	2
Final score	3,300
Final crew health	99
Final crew fatigue	50
Final oxygen	32
Final water	50
Final food	37
Final power	61
Mission status	Completed


Automated test result: ALL TESTS PASSED!

These are results from one successful all-safe test run, not a guarantee that every possible decision sequence will succeed. NASA scenario counts can vary with the retrieved historical dataset.
Current limitations and next steps
- Connect the frontend game flow to all API actions, including emergency resolution.
- Verify saving and resuming from the player-facing interface.
- Test risky/dangerous decisions and failure scenarios end to end.
- Finish integration, responsive behavior, deployment, and the judge-facing demo.
- Equipment wear and morale balancing can be refined after the core playable experience is stable.
Team
Developed by a two-person team:
- Simulation/backend: Mission logic, resources, emergencies, NASA data, and APIs.
- Frontend/experience: Interactive game UI, visualization, and player experience.
Acknowledgments
- NASA Space Apps Challenge for the hackathon and inspiration.
- NASA DONKI for authentic recorded space-weather data.
- NASA Images API for access to NASA imagery metadata and assets.
OUTPOST 30 is an independent educational hackathon prototype and is not an official NASA mission simulator or NASA-endorsed operational tool.