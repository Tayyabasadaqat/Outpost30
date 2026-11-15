"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BedDouble, CheckCircle2, CircleHelp, Clock3,
  Coffee, HeartPulse, RotateCcw, ShieldAlert, Sparkles, Users, Wrench, X,
} from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Action = "work" | "rest" | "eat";
type Phase = "intro" | "playing" | "won" | "lost";
type Crew = { name: string; job: string; initials: string; energy: number; color: string };

const START_CREW: Crew[] = [
  { name: "NOVA", job: "SYSTEMS ENGINEER", initials: "NV", energy: 85, color: "#7ed6ff" },
  { name: "ORION", job: "LIFE SUPPORT", initials: "OR", energy: 75, color: "#ffc300" },
  { name: "LUNA", job: "SCIENTIST", initials: "LU", energy: 80, color: "#8deda9" },
];
const TASKS = [
  { title: "Inspect oxygen systems", detail: "Life support must stay operational" },
  { title: "Repair radio relays", detail: "Earth needs a communication check" },
  { title: "Check habitat pressure", detail: "Prevent dangerous pressure loss" },
  { title: "Service the rover", detail: "Prepare equipment for tomorrow" },
  { title: "Record lunar samples", detail: "Finish today's science logs" },
  { title: "Secure night systems", detail: "Prepare the habitat for rest" },
];
const CONFIG = {
  safe: { time: 180, energyCost: 25, restGain: 42, rations: 5, safety: 4, required: 10 },
  risky: { time: 155, energyCost: 29, restGain: 38, rations: 4, safety: 3, required: 10 },
  dangerous: { time: 135, energyCost: 33, restGain: 35, rations: 3, safety: 2, required: 10 },
};
const LABELS: Record<Action, string> = { work: "WORK", rest: "REST", eat: "EAT" };
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export default function CrewFatigueCommand({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const config = CONFIG[strategy];
  const [phase, setPhase] = useState<Phase>("intro");
  const [help, setHelp] = useState(false);
  const [crew, setCrew] = useState<Crew[]>(START_CREW.map(c => ({ ...c })));
  const [assignments, setAssignments] = useState<Action[]>(["work", "work", "rest"]);
  const [shift, setShift] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [rations, setRations] = useState(config.rations);
  const [safety, setSafety] = useState(config.safety);
  const [seconds, setSeconds] = useState(config.time);
  const [message, setMessage] = useState("Assign a job to every astronaut, then run the shift.");
  const [log, setLog] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (phase !== "playing" || help || busy) return;
    const id = window.setInterval(() => setSeconds(t => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [phase, help, busy]);
  useEffect(() => { if (phase === "playing" && seconds <= 0) setPhase("lost"); }, [phase, seconds]);
  useEffect(() => {
    if (!highlight) return;
    const id = window.setTimeout(() => setHighlight(false), 450);
    return () => window.clearTimeout(id);
  }, [highlight]);

  const assignedWorkers = assignments.filter(a => a === "work").length;
  const selectedMeals = assignments.filter(a => a === "eat").length;
  const ready = selectedMeals <= rations;
  const need = config.required;
  const remainingShifts = 6 - shift;
  const possibleRemaining = remainingShifts * 2;
  const status = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

  const reset = () => {
    setPhase("intro"); setHelp(false); setCrew(START_CREW.map(c => ({ ...c })));
    setAssignments(["work", "work", "rest"]); setShift(0); setTasksDone(0);
    setRations(config.rations); setSafety(config.safety); setSeconds(config.time);
    setMessage("Assign a job to every astronaut, then run the shift."); setLog([]); setHighlight(false);
  };
  const runShift = () => {
    if (phase !== "playing" || busy || !ready) return;
    let work = 0;
    let incidents = 0;
    let eaten = 0;
    const changes: string[] = [];
    const updated = crew.map((person, i) => {
      const a = assignments[i];
      let energy = person.energy;
      if (a === "rest") { energy = clamp(energy + config.restGain); changes.push(`${person.name} rested (+${config.restGain} energy)`); }
      else if (a === "eat") { eaten++; energy = clamp(energy + 32); changes.push(`${person.name} ate (+32 energy)`); }
      else if (energy < config.energyCost) {
        incidents++; energy = clamp(energy - 6);
        changes.push(`${person.name} was too exhausted to work!`);
      } else {
        work++; energy = clamp(energy - config.energyCost);
        changes.push(`${person.name} completed a task`);
      }
      return { ...person, energy };
    });
    const completed = Math.min(2, work);
    const nextTasks = tasksDone + completed;
    const nextSafety = Math.max(0, safety - incidents);
    const nextShift = shift + 1;
    setCrew(updated); setTasksDone(nextTasks); setSafety(nextSafety); setRations(r => r - eaten);
    setShift(nextShift); setHighlight(true);
    setLog(old => [`SHIFT ${nextShift}: ${completed}/2 jobs done${incidents ? ` · ${incidents} safety incident${incidents > 1 ? "s" : ""}` : ""}`, ...old].slice(0, 4));
    setMessage(incidents ? "CREW EXHAUSTED! Make tired astronauts REST or EAT before working again." : completed === 2 ? "EXCELLENT SHIFT! Two jobs complete. Keep the crew rested." : "Shift complete. You need two workers per shift to stay on schedule.");
    if (nextTasks >= need && nextSafety > 0) setPhase("won");
    else if (nextSafety <= 0 || nextShift >= 6 || nextTasks + (6 - nextShift) * 2 < need) setPhase("lost");
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#294760] bg-[#001d3d] px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><HeartPulse size={26}/></div><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 15 · CREW FATIGUE</p><h2 className="text-xl font-black tracking-tight sm:text-2xl">MISSION CONTROL: CREW RESCUE</h2></div></div>
        <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-sm font-bold text-[#ffd60a]"><Clock3 size={16}/>{status}</span><button onClick={() => setHelp(true)} className="rounded-lg border border-[#3e6080] p-2" aria-label="How to play"><CircleHelp size={19}/></button><button onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" aria-label="Close"><X size={21}/></button></div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-5 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-[#2a4d6b] bg-[#071d34] p-3"><p className="text-[10px] font-bold tracking-wider text-[#9cbbd5]">SHIFT</p><p className="mt-1 text-2xl font-black text-white">{Math.min(shift + 1, 6)}<span className="text-base text-[#6b91af]"> / 6</span></p></div>
          <div className="rounded-xl border border-[#2a4d6b] bg-[#071d34] p-3"><p className="text-[10px] font-bold tracking-wider text-[#9cbbd5]">TASKS DONE</p><p className="mt-1 text-2xl font-black text-[#ffd60a]">{tasksDone}<span className="text-base text-[#6b91af]"> / {need}</span></p></div>
          <div className="rounded-xl border border-[#2a4d6b] bg-[#071d34] p-3"><p className="text-[10px] font-bold tracking-wider text-[#9cbbd5]">SAFETY / MEALS</p><p className="mt-1 text-lg font-black text-white">{safety} <span className="text-[#ff7288]">♥</span><span className="mx-2 text-[#365673]">/</span>{rations} <span className="text-[#ffc300]">●</span></p></div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#2a526e] bg-[radial-gradient(ellipse_at_top,#073964,#041323_70%)] p-4 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-[#ffc300]/10"/>
          <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black tracking-[.2em] text-[#ffd60a]">CURRENT PRIORITY</p><h3 className="mt-1 text-xl font-black sm:text-2xl">{TASKS[Math.min(shift, 5)].title}</h3><p className="mt-1 text-xs text-[#a6c3da]">{TASKS[Math.min(shift, 5)].detail}</p></div><div className="rounded-xl border border-[#ffc300]/40 bg-[#001d3d] px-4 py-3 text-center"><p className="text-xs text-[#c5d7e7]">EACH SHIFT</p><p className="text-xl font-black text-[#ffd60a]">2 JOBS</p></div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#183c57]"><div className="h-full rounded-full bg-[#ffc300] transition-all duration-500" style={{width:`${Math.min(100, tasksDone / need * 100)}%`}}/></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black tracking-wide">YOUR 3 ASTRONAUTS</p><p className="text-xs text-[#9cb5c8]">Choose WORK, REST, or EAT for each astronaut before running the shift.</p></div><div className="flex items-center gap-2 text-xs font-bold text-[#ffd60a]"><Users size={16}/>{assignedWorkers} ASSIGNED TO WORK</div></div>
        <div className="grid gap-3 md:grid-cols-3">
          {crew.map((person, i) => {
            const tired = person.energy < config.energyCost;
            return <section key={person.name} className={`rounded-2xl border p-4 transition-colors ${tired ? "border-[#d36c55] bg-[#2d1b22]" : "border-[#244a6c] bg-[#081b32]"}`}>
              <div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 text-sm font-black" style={{borderColor:person.color,color:person.color,background:"#00182b"}}>{person.initials}</div><div className="min-w-0"><p className="text-lg font-black">{person.name}</p><p className="text-[10px] tracking-wide text-[#a0b9ce]">{person.job}</p></div></div>
              <div className="mt-5 flex items-center justify-between text-xs"><span className="font-bold text-[#c3d7e8]">ENERGY</span><span className={`font-black ${tired ? "text-[#ff8a78]" : "text-[#89ebb0]"}`}>{person.energy}%</span></div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#102c44]"><div className="h-full rounded-full transition-all duration-500" style={{width:`${person.energy}%`,background:person.energy < 35 ? "#f47e63" : person.color}}/></div>
              <p className={`mt-2 min-h-5 text-[11px] font-bold ${tired?"text-[#ff9c8f]":"text-[#95b6c9]"}`}>{tired ? "⚠ TOO TIRED TO WORK — LET THEM REST" : person.energy < 55 ? "Getting tired — consider a break" : "Ready for duty"}</p>
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {(["work", "rest", "eat"] as Action[]).map(a => <button key={a} disabled={phase !== "playing" || busy} onClick={() => setAssignments(old => old.map((v,j) => i===j?a:v))} className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-1 py-3 text-[10px] font-black transition-colors ${assignments[i] === a ? "border-[#ffc300] bg-[#ffc300] text-[#000814]" : "border-[#335570] bg-[#001428] text-[#c4d5e5] hover:border-[#ffd60a]"} disabled:cursor-not-allowed disabled:opacity-60`}>{a === "work" ? <Wrench size={18}/> : a === "rest" ? <BedDouble size={18}/> : <Coffee size={18}/>} {LABELS[a]}</button>)}
              </div>
            </section>;
          })}
        </div>
        <div className="rounded-2xl border border-[#284d6c] bg-[#051a2d] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className={`text-sm font-black ${highlight?"text-[#ffd60a]":"text-white"}`}>{message}</p><p className="mt-2 text-xs text-[#a5c0d5]">WORK: −{config.energyCost} energy · REST: +{config.restGain} energy · EAT: +32 energy, costs 1 meal</p></div><button onClick={runShift} disabled={phase!=="playing"||busy||!ready} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-7 text-sm font-black text-[#000814] disabled:opacity-40"><Activity size={18}/> RUN SHIFT <ArrowRight size={18}/></button></div>
          {!ready && <p className="mt-2 text-xs font-bold text-[#ff9b8b]">Not enough meals! Change an EAT assignment to REST or WORK.</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a8c3d5]"><span>Two successful workers = 2 tasks this shift. Keep everyone healthy.</span><button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 font-bold text-[#ffd60a]"><RotateCcw size={14}/> RESTART</button></div>
        </div>
        {log.length>0 && <div className="space-y-1 text-xs text-[#9bb6c9]">{log.map((entry,i)=><p key={i}>{entry}</p>)}</div>}
      </main>
      {(phase === "intro" || help || phase === "won" || phase === "lost") && <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#000814]/95 p-4 backdrop-blur-sm"><section className="my-auto w-full max-w-lg rounded-2xl border border-[#ffc300]/50 bg-[#001d3d] p-5 shadow-2xl sm:p-8">
        {phase === "won" && !help ? <><CheckCircle2 size={49} className="mx-auto text-[#ffd60a]"/><h3 className="mt-4 text-center text-3xl font-black">CREW SAVED!</h3><p className="mt-3 text-center text-sm leading-6 text-[#b9d0e0]">You finished the critical work without pushing your astronauts beyond their limits. Rest is part of every successful mission.</p><button onClick={onComplete} disabled={busy} className="mt-6 w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></>
        : phase === "lost" && !help ? <><ShieldAlert size={49} className="mx-auto text-[#ff9e84]"/><h3 className="mt-4 text-center text-3xl font-black">CREW NEEDS A RESET</h3><p className="mt-3 text-center text-sm text-[#b9d0e0]">Complete at least {need} tasks in six shifts. Keep energy above the work cost to avoid injuries. REST restores energy for free!</p><button onClick={reset} className="mt-6 w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">TRY AGAIN</button></>
        : <><div className="flex items-center justify-between"><span className="text-xs font-black tracking-widest text-[#ffd60a]">HOW TO PLAY · DAY 15</span>{help&&<button onClick={()=>setHelp(false)} aria-label="Close instructions"><X size={20}/></button>}</div><h3 className="mt-3 text-3xl font-black">SAVE YOUR CREW 👩‍🚀</h3><p className="mt-3 text-sm leading-6 text-[#b9d0e0]">Your astronauts are exhausted, but the Moon base still has urgent jobs. Can you balance work and rest?</p>
          <div className="mt-5 space-y-3 text-sm"><p><span className="font-black text-[#ffd60a]">1 · ASSIGN</span> — Choose WORK, REST or EAT for each astronaut.</p><p><span className="font-black text-[#ffd60a]">2 · RUN SHIFT</span> — Click RUN SHIFT to complete the jobs and update energy.</p><p><span className="font-black text-[#ffd60a]">3 · PROTECT</span> — Tired astronauts cannot work safely. Rest them or give them a meal.</p><p><span className="font-black text-[#ffd60a]">4 · WIN</span> — Complete {need} jobs in at most six shifts. Only two jobs count per shift!</p></div>
          <div className="mt-5 rounded-xl border border-[#41627a] bg-[#05172b] p-3 text-xs text-[#cbdbea]"><Sparkles size={16} className="mb-1 text-[#ffd60a]"/> Space missions include scheduled sleep, food breaks, and monitoring fatigue. This is a simplified training simulation.</div>
          {phase === "intro" ? <button onClick={()=>setPhase("playing")} className="mt-6 w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">START MISSION <ArrowRight className="ml-1 inline" size={18}/></button> : <button onClick={()=>setHelp(false)} className="mt-6 w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">BACK TO GAME</button>}</>}
      </section></div>}
    </div>
  );
}
