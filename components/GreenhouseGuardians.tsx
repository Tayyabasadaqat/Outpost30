"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bug, CheckCircle2, CircleHelp, Clock3,
  Droplets, Heart, Leaf, Lightbulb, RotateCcw, ShieldCheck,
  Sprout, Sun, X, Zap,
} from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Tool = "water" | "light" | "nutrients";
type Phase = "intro" | "playing" | "won" | "lost";
type Plant = { steps: number; pest: boolean; freshness: number };
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };

const X_POS = [15, 38, 62, 85];
const NAMES = ["MOON LETTUCE", "RADISH", "DWARF WHEAT", "SPACE TOMATO"];
const NEEDS: Tool[][] = [
  ["water", "light", "nutrients"],
  ["nutrients", "water", "light"],
  ["light", "nutrients", "water"],
  ["water", "nutrients", "light"],
];
const TOOLS: { id: Tool; name: string; color: string; instruction: string }[] = [
  { id: "water", name: "WATER", color: "#75d7ff", instruction: "Give thirsty roots a drink" },
  { id: "light", name: "GROW LIGHT", color: "#ffd60a", instruction: "Power the LED grow lamps" },
  { id: "nutrients", name: "NUTRIENTS", color: "#8cf0aa", instruction: "Feed the roots nutrients" },
];
const SET = {
  safe: { time: 160, health: 100, speed: 43, pestEvery: 18, pestDamage: 3.5 },
  risky: { time: 138, health: 88, speed: 43, pestEvery: 15, pestDamage: 5 },
  dangerous: { time: 120, health: 78, speed: 43, pestEvery: 12, pestDamage: 6 },
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const freshPlants = (): Plant[] => NAMES.map(() => ({ steps: 0, pest: false, freshness: 100 }));

export default function GreenhouseGuardians({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const cfg = SET[strategy];
  const [phase, setPhase] = useState<Phase>("intro");
  const [help, setHelp] = useState(false);
  const [pos, setPos] = useState(48);
  const [tool, setTool] = useState<Tool>("water");
  const [plants, setPlants] = useState<Plant[]>(freshPlants);
  const [seconds, setSeconds] = useState(cfg.time);
  const [health, setHealth] = useState(cfg.health);
  const [message, setMessage] = useState("Drive to a plant and give it the care shown above its pod!");
  const [spark, setSpark] = useState(-1);
  const [mistakes, setMistakes] = useState(0);
  const stageRef = useRef<Phase>("intro");
  const state = useRef({ pos: 48, time: cfg.time, health: cfg.health, plants: freshPlants(), lastPest: 0, elapsed: 0 });
  const held = useRef({ left: false, right: false });
  const picked = useRef<Tool>("water");
  const prev = useRef(0);
  const lastDisplay = useRef(0);

  const reset = useCallback(() => {
    const ps = freshPlants();
    state.current = { pos: 48, time: cfg.time, health: cfg.health, plants: ps, lastPest: 0, elapsed: 0 };
    held.current = { left: false, right: false };
    picked.current = "water";
    stageRef.current = "intro";
    setPhase("intro"); setHelp(false); setPos(48); setTool("water");
    setPlants(ps); setSeconds(cfg.time); setHealth(cfg.health);
    setSpark(-1); setMistakes(0);
    setMessage("Drive to a plant and give it the care shown above its pod!");
  }, [cfg.health, cfg.time]);

  const start = () => { stageRef.current = "playing"; setPhase("playing"); setHelp(false); };
  const select = useCallback((value: Tool) => { picked.current = value; setTool(value); }, []);

  const interact = useCallback(() => {
    if (stageRef.current !== "playing" || busy || help) return;
    const s = state.current;
    let index = -1;
    let distance = Infinity;
    X_POS.forEach((x, i) => { const d = Math.abs(s.pos - x); if (d < distance) { distance = d; index = i; } });
    if (index < 0 || distance > 10) {
      setMessage("MOVE CLOSER! Drive under a glowing plant pod, then press SPACE.");
      return;
    }
    const plant = s.plants[index];
    if (plant.steps >= 3) { setMessage(`${NAMES[index]} IS ALREADY HEALTHY! Visit another pod.`); return; }
    if (plant.pest) { setMessage("A PEST IS HERE! Press E to clear it first!"); return; }
    const need = NEEDS[index][plant.steps];
    if (picked.current !== need) {
      s.health = clamp(s.health - 4, 0, 100);
      setHealth(s.health); setMistakes(v => v + 1);
      setMessage(`NOT YET! ${NAMES[index]} NEEDS ${need.toUpperCase()}. Pick the matching tool.`);
      if (s.health <= 0) { stageRef.current = "lost"; setPhase("lost"); }
      return;
    }
    const next = s.plants.map((p, i) => i === index ? { ...p, steps: Math.min(3, p.steps + 1), freshness: Math.min(100, p.freshness + 5) } : p);
    s.plants = next; setPlants(next); setSpark(index);
    setMessage(next[index].steps === 3 ? `🌱 ${NAMES[index]} IS FULLY GROWN!` : `GREAT! ${NAMES[index]} IS GROWING. CHECK ITS NEXT NEED!`);
    if (next.every(p => p.steps >= 3)) { stageRef.current = "won"; setPhase("won"); }
  }, [busy, help]);

  const clearPest = useCallback(() => {
    if (stageRef.current !== "playing" || busy || help) return;
    const s = state.current;
    const index = s.plants.findIndex((p, i) => p.pest && Math.abs(s.pos - X_POS[i]) <= 11);
    if (index === -1) { setMessage("GET CLOSE TO THE RED BUG FIRST, THEN PRESS E!"); return; }
    s.plants = s.plants.map((p, i) => i === index ? { ...p, pest: false } : p);
    setPlants(s.plants); setSpark(index);
    setMessage(`PEST REMOVED FROM ${NAMES[index]}! GREAT SAVE!`);
  }, [busy, help]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " ", "e", "1", "2", "3"].includes(k)) e.preventDefault();
      if (k === "arrowleft" || k === "a") held.current.left = true;
      if (k === "arrowright" || k === "d") held.current.right = true;
      if (k === "1") select("water");
      if (k === "2") select("light");
      if (k === "3") select("nutrients");
      if (!e.repeat && k === " ") interact();
      if (!e.repeat && k === "e") clearPest();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") held.current.left = false;
      if (k === "arrowright" || k === "d") held.current.right = false;
    };
    const blur = () => { held.current.left = false; held.current.right = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [interact, clearPest, select]);

  useEffect(() => {
    let id = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - (prev.current || now)) / 1000, .055);
      prev.current = now;
      if (stageRef.current === "playing" && !help && !busy) {
        const s = state.current;
        s.pos = clamp(s.pos + (Number(held.current.right) - Number(held.current.left)) * cfg.speed * dt, 5, 95);
        s.time = Math.max(0, s.time - dt);
        s.elapsed += dt;
        if (s.elapsed - s.lastPest >= cfg.pestEvery) {
          s.lastPest = s.elapsed;
          const possibilities = s.plants.map((p, i) => p.steps < 3 && !p.pest ? i : -1).filter(i => i >= 0);
          if (possibilities.length) {
            const chosen = possibilities[Math.floor(s.elapsed / cfg.pestEvery) % possibilities.length];
            s.plants = s.plants.map((p, i) => i === chosen ? { ...p, pest: true } : p);
            setMessage(`PEST ALERT! A RED BUG IS ATTACKING ${NAMES[chosen]}!`);
          }
        }
        if (s.plants.some(p => p.pest)) {
          s.health = Math.max(0, s.health - cfg.pestDamage * dt * s.plants.filter(p => p.pest).length);
        }
        if (s.health <= 0 || s.time <= 0) {
          stageRef.current = "lost"; setPhase("lost");
          setMessage(s.time <= 0 ? "GREENHOUSE CLOCK EXPIRED!" : "PLANT SAFETY TOO LOW!");
        }
        if (now - lastDisplay.current > 60) {
          setPos(s.pos); setSeconds(Math.ceil(s.time)); setHealth(s.health); setPlants(s.plants);
          lastDisplay.current = now;
        }
      }
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(id); prev.current = 0; };
  }, [busy, cfg.speed, cfg.pestEvery, cfg.pestDamage, help]);

  useEffect(() => { if (spark < 0) return; const id = setTimeout(() => setSpark(-1), 600); return () => clearTimeout(id); }, [spark]);
  const grown = plants.filter(p => p.steps === 3).length;
  const nextIndex = X_POS.reduce((best, x, i) => plants[i].steps >= 3 ? best : Math.abs(pos - x) < Math.abs(pos - X_POS[best]) || plants[best].steps >= 3 ? i : best, 0);
  const relevant = plants[nextIndex];
  const desired = relevant.steps < 3 ? NEEDS[nextIndex][relevant.steps] : "water";
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#224867] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Leaf size={24}/></span><div><div className="text-[10px] font-black tracking-[.22em] text-[#ffd60a]">DAY 17 · GREENHOUSE MAINTENANCE</div><h2 className="text-lg font-black sm:text-2xl">GREENHOUSE GUARDIANS</h2></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><span className="text-xs font-black text-[#96edb5]">🌱 {grown}/4 GROWN</span><span className="flex items-center gap-1 rounded-lg border border-[#466582] px-2 py-1.5 text-sm font-black"><Clock3 size={16} className="text-[#ffd60a]"/>{clock}</span><button aria-label="How to play" className="rounded-lg border border-[#466582] p-2 hover:bg-[#003566]" onClick={() => setHelp(true)}><CircleHelp size={19}/></button><button aria-label="Close game" disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" onClick={onClose}><X size={20}/></button></div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#2c506d] bg-[#001d3d] px-4 py-2"><div className="text-[10px] tracking-wider text-[#aabfd5]">GREENHOUSE SAFETY</div><div className="mt-1 flex items-center gap-2"><Heart size={17} className="text-[#ff7385]"/><div className="h-2 flex-1 rounded-full bg-[#15334b]"><div className="h-full rounded-full bg-[#ff7385]" style={{width:`${health}%`}}/></div><span className="text-sm font-bold">{Math.ceil(health)}%</span></div></div><div className="rounded-xl border border-[#2c506d] bg-[#001d3d] px-4 py-2"><div className="text-[10px] tracking-wider text-[#aabfd5]">CROPS SAVED</div><div className="mt-1 text-lg font-black text-[#96edb5]">{grown} <span className="text-xs text-white">/ 4</span></div></div><div className="col-span-2 rounded-xl border border-[#2c506d] bg-[#001d3d] px-4 py-2 sm:col-span-1"><div className="text-[10px] tracking-wider text-[#aabfd5]">NEXT ACTION</div><div className="mt-1 text-sm font-black text-[#ffd60a]">{grown===4 ? "ALL CROPS SAVED" : `${NAMES[nextIndex]} · ${relevant.pest ? "REMOVE BUG (E)" : desired.toUpperCase()}`}</div></div></div>
        <div className="relative min-h-[340px] flex-1 overflow-hidden rounded-2xl border border-[#315c71] bg-[#071b2b] sm:min-h-[395px]" style={{backgroundImage:"radial-gradient(#6aa7bc29 1px,transparent 1px)",backgroundSize:"26px 26px"}}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#225a5b66] to-transparent"/>
          <div className="absolute inset-x-0 top-[8%] flex justify-evenly opacity-50">{[0,1,2,3,4,5,6,7].map(i=><div key={i} className="h-3 w-3 rounded-full bg-[#ffd60a] shadow-[0_0_17px_#ffd60a]"/>)}</div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] border-t-4 border-[#4d6875] bg-[#243d4c]"/>
          {plants.map((p,i) => {
            const need = p.steps < 3 ? NEEDS[i][p.steps] : null;
            const toolData = TOOLS.find(t=>t.id===need);
            return <div key={NAMES[i]} className="absolute top-[24%] flex w-[23%] -translate-x-1/2 flex-col items-center" style={{left:`${X_POS[i]}%`}}>
              <div className={`relative mb-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-[9px] font-black sm:text-xs ${p.pest ? "border-red-400 bg-[#611f2e] text-white animate-pulse" : p.steps===3 ? "border-[#8cf0aa] bg-[#103b34] text-[#8cf0aa]" : "border-[#406478] bg-[#001d3d] text-white"}`}>{p.pest ? <><Bug size={14}/> BUG! PRESS E</> : p.steps===3 ? <><CheckCircle2 size={14}/> READY!</> : need==="water" ? <><Droplets size={14} className="text-[#75d7ff]"/> WATER</> : need==="light" ? <><Sun size={14} className="text-[#ffd60a]"/> LIGHT</> : <><Zap size={14} className="text-[#8cf0aa]"/> FOOD</>}</div>
              <div className={`relative flex h-28 w-[85%] items-end justify-center rounded-t-[48%] border-2 border-b-0 bg-gradient-to-b from-[#18496b66] to-[#0b2b32] shadow-[inset_0_0_20px_#70dbc61c] sm:h-36 ${spark===i?"border-[#ffd60a]":"border-[#4f9c96]"}`}>
                {p.pest && <div className="absolute right-0 top-3 animate-bounce rounded-full border border-red-300 bg-[#9b253b] p-1 text-white"><Bug size={19}/></div>}
                <div className="relative mb-1 flex flex-col items-center justify-end text-[#8ce8a7]" style={{height:`${20+p.steps*19}%`}}>
                  {p.steps===3 ? <Leaf size={39} strokeWidth={2.4}/> : p.steps===2 ? <Sprout size={38} strokeWidth={2.5}/> : p.steps===1 ? <Sprout size={29}/> : <Sprout size={18} className="opacity-50"/>}
                  <div className="h-[35%] w-1.5 rounded-full bg-[#69d88d]"/>
                </div>
                <div className="absolute bottom-0 h-3 w-full rounded-t-[50%] bg-[#705345]"/>
              </div>
              <div className="w-[95%] rounded-b-xl border border-[#50766d] bg-[#173f4a] px-1 py-2 text-center"><div className="truncate text-[9px] font-black text-[#e3f2ef] sm:text-[11px]">{NAMES[i]}</div><div className="mt-1 flex justify-center gap-1">{[0,1,2].map(j=><div key={j} className={`h-1.5 w-5 rounded-full ${j<p.steps?"bg-[#8cf0aa]":"bg-[#305866]"}`}/>)}</div></div>
            </div>;
          })}
          <div className="absolute bottom-[9%] z-10 flex -translate-x-1/2 flex-col items-center transition-[left] duration-75" style={{left:`${pos}%`}}><div className="relative grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-[#ffd60a] bg-[#003566] shadow-[0_0_22px_#ffc30066]"><span className="text-3xl">🤖</span><span className="absolute -right-3 -top-2 rounded-full border border-[#ffc300] bg-[#001d3d] px-1.5 text-[10px] font-bold text-[#ffd60a]">{picked.current==="water"?"💧":picked.current==="light"?"☀️":"🌿"}</span></div><div className="mt-0.5 h-2 w-20 rounded-full bg-[#1f3446] shadow-[0_0_8px_#000]"/></div>
          {phase === "won" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-5"><div className="max-w-sm text-center"><ShieldCheck className="mx-auto mb-3 text-[#8cf0aa]" size={58}/><h3 className="text-3xl font-black">GREENHOUSE SAVED!</h3><p className="mt-3 text-sm leading-6 text-[#c8d7e5]">All four crops are thriving. The astronauts have a healthier food-growing experiment!</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></div></div>}
          {phase === "lost" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-5"><div className="max-w-sm text-center"><Heart className="mx-auto mb-3 text-[#ff7f8e]" size={53}/><h3 className="text-3xl font-black">GREENHOUSE NEEDS YOU!</h3><p className="mt-3 text-sm text-[#c8d7e5]">Try again. Match the tool to each pod and clear red bugs as soon as they appear.</p><button onClick={reset} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw className="mr-2 inline" size={17}/>RETRY MISSION</button></div></div>}
        </div>
        <div className="rounded-xl border border-[#365b71] bg-[#001d3d] p-3"><p role="status" aria-live="polite" className="mb-3 text-center text-xs font-bold text-[#ffd60a]">{message}</p><div className="flex flex-wrap items-center justify-center gap-2"><button aria-label="Move left" disabled={phase!=="playing"} onPointerDown={e=>{e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);held.current.left=true;}} onPointerUp={()=>held.current.left=false} onPointerCancel={()=>held.current.left=false} onLostPointerCapture={()=>held.current.left=false} className="grid h-12 w-14 touch-none place-items-center rounded-lg border border-[#476b89] bg-[#092e4c] disabled:opacity-40"><ArrowLeft size={23}/></button><button aria-label="Move right" disabled={phase!=="playing"} onPointerDown={e=>{e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);held.current.right=true;}} onPointerUp={()=>held.current.right=false} onPointerCancel={()=>held.current.right=false} onLostPointerCapture={()=>held.current.right=false} className="grid h-12 w-14 touch-none place-items-center rounded-lg border border-[#476b89] bg-[#092e4c] disabled:opacity-40"><ArrowRight size={23}/></button><div className="mx-1 h-10 w-px bg-[#36516b]"/>{TOOLS.map((item,i)=><button key={item.id} onClick={()=>select(item.id)} disabled={phase!=="playing"} className={`flex h-12 items-center gap-1 rounded-lg border px-3 text-xs font-black disabled:opacity-40 ${tool===item.id?"border-[#ffd60a] bg-[#ffc300] text-[#001d3d]":"border-[#476b89] bg-[#092e4c] text-white"}`}>{i+1} · {item.name}</button>)}<button disabled={phase!=="playing"} onClick={interact} className="h-12 rounded-lg bg-[#8cf0aa] px-4 text-xs font-black text-[#001d3d] disabled:opacity-40">SPACE · CARE</button><button disabled={phase!=="playing"} onClick={clearPest} className="flex h-12 items-center gap-1 rounded-lg bg-[#f19b4e] px-4 text-xs font-black text-[#001d3d] disabled:opacity-40"><Bug size={16}/> E · REMOVE BUG</button></div><div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[#a8c3d4]"><span>ARROW KEYS / A D TO MOVE · 1 2 3 TO SELECT TOOLS</span><span>{mistakes} WRONG TOOLS <button onClick={reset} disabled={busy} className="ml-3 text-[#ffd60a]"><RotateCcw size={13} className="inline"/> RESTART</button></span></div></div>
        <p className="px-1 pb-2 text-center text-[11px] text-[#a5bdd0]">SCIENCE: Space greenhouses use carefully controlled water, nutrients and artificial light. Plants can provide food and support life-support research. The robot and bugs are playful game elements.</p>
      </div>
      {(phase==="intro"||help) && <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#000814f2] p-4"><section className="w-full max-w-lg rounded-2xl border border-[#ffc30077] bg-[#001d3d] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 17 · HOW TO PLAY</div>{help && <button aria-label="Close help" onClick={()=>setHelp(false)}><X size={20}/></button>}</div><div className="mt-2 text-3xl font-black">🌱 GREENHOUSE GUARDIANS</div><p className="mt-2 text-sm text-[#c6d7e5]">Your greenhouse crops are in trouble! Drive your friendly robot from pod to pod. Grow all 4 plants before the timer runs out.</p><div className="mt-5 space-y-3">{[
        ["← / → or A / D", "Drive your robot beneath a plant"],
        ["1 💧  2 ☀️  3 🌿", "Choose WATER, LIGHT or NUTRIENTS to match its sign"],
        ["SPACE · CARE", "Press Space while close to the plant to help it grow"],
        ["E · REMOVE BUG", "When a red bug appears, get close and press E!"],
      ].map(([key,value])=><div key={key} className="rounded-xl border border-[#365875] bg-[#082941] p-3"><div className="font-black text-[#ffd60a]">{key}</div><div className="mt-1 text-xs text-[#d1e2ed]">{value}</div></div>)}</div><p className="mt-4 text-xs text-[#a8c6d8]">Each plant needs 3 correct treatments. Wrong tools lower safety. Bugs drain safety until removed. Tutorial pauses time.</p><button onClick={phase==="intro"?start:()=>setHelp(false)} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">{phase==="intro"?"LET'S SAVE THE GREENHOUSE! 🚀":"BACK TO MISSION"}</button></section></div>}
    </div>
  );
}
