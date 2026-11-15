"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, CheckCircle2, Clock3,
  Hammer, HelpCircle, RotateCcw, Target, X, Zap,
  Leaf, FlaskConical, DoorOpen, Sun, AlertTriangle,
} from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = {
  strategy?: Strategy;
  onComplete: () => void;
  onClose: () => void;
  busy?: boolean;
};
type Phase = "ready" | "dropping" | "won" | "lost";
type GameFrame = { x: number; vx: number; y: number; fallX: number; fallV: number; wind: number };

const MISSIONS = [
  { name: "AIRLOCK", Icon: DoorOpen, target: 27, color: "#ffc300", tip: "The airlock lets astronauts enter without losing cabin pressure." },
  { name: "GREENHOUSE", Icon: Leaf, target: 71, color: "#6fe4a2", tip: "Plants can supply food and help researchers study life in space." },
  { name: "SCIENCE LAB", Icon: FlaskConical, target: 43, color: "#89cfff", tip: "Lunar samples help scientists understand the Moon's history." },
  { name: "SOLAR ARRAY", Icon: Sun, target: 61, color: "#ffd60a", tip: "Solar cells turn sunlight into electricity for equipment." },
] as const;
const SETTINGS = {
  safe: { time: 150, chances: 5, tolerance: 10.5, drift: 0.75 },
  risky: { time: 125, chances: 4, tolerance: 8.5, drift: 1.15 },
  dangerous: { time: 105, chances: 3, tolerance: 7, drift: 1.65 },
};
const START: GameFrame = { x: 50, vx: 0, y: 18, fallX: 50, fallV: 0, wind: 0 };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function MoonBaseBuilder({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const settings = SETTINGS[strategy];
  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [chances, setChances] = useState(settings.chances);
  const [seconds, setSeconds] = useState(settings.time);
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [message, setMessage] = useState("STEER THE CRANE. DROP OVER THE GLOWING PAD.");
  const [frame, setFrame] = useState<GameFrame>(START);
  const [landed, setLanded] = useState<number[]>([]);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);

  const physics = useRef<GameFrame>({ ...START });
  const phaseRef = useRef<Phase>("ready");
  const keys = useRef({ left: false, right: false });
  const lastFrame = useRef(0);
  const visibleFrame = useRef(0);
  const stageRef = useRef(0);
  const chancesRef = useRef(settings.chances);
  const secondsRef = useRef(settings.time);
  const startedRef = useRef(false);
  const finishLock = useRef(false);

  const reset = useCallback(() => {
    physics.current = { ...START };
    phaseRef.current = "ready";
    stageRef.current = 0;
    chancesRef.current = settings.chances;
    secondsRef.current = settings.time;
    startedRef.current = false;
    finishLock.current = false;
    keys.current = { left: false, right: false };
    setFrame({ ...START });
    setStage(0);
    setPhase("ready");
    setChances(settings.chances);
    setSeconds(settings.time);
    setStarted(false);
    setLanded([]);
    setFlash(null);
    setMessage("STEER THE CRANE. DROP OVER THE GLOWING PAD.");
  }, [settings.chances, settings.time]);

  const drop = useCallback(() => {
    if (phaseRef.current !== "ready" || busy) return;
    startedRef.current = true;
    setStarted(true);
    phaseRef.current = "dropping";
    setPhase("dropping");
    physics.current.fallX = physics.current.x;
    physics.current.fallV = physics.current.vx * 0.6;
    physics.current.y = 18;
    setMessage("MODULE RELEASED! WATCH THE LANDING ZONE.");
  }, [busy]);

  useEffect(() => {
    function down(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " ", "enter"].includes(key)) event.preventDefault();
      if (key === "a" || key === "arrowleft") keys.current.left = true;
      if (key === "d" || key === "arrowright") keys.current.right = true;
      if ((key === " " || key === "enter") && !event.repeat) drop();
    }
    function up(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") keys.current.left = false;
      if (key === "d" || key === "arrowright") keys.current.right = false;
    }
    function blur() { keys.current.left = false; keys.current.right = false; }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [drop]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!startedRef.current || phaseRef.current === "won" || phaseRef.current === "lost" || busy) return;
      secondsRef.current = Math.max(0, secondsRef.current - 1);
      setSeconds(secondsRef.current);
      if (secondsRef.current === 0) {
        phaseRef.current = "lost";
        setPhase("lost");
        setMessage("CONSTRUCTION WINDOW CLOSED. TRY AGAIN!");
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    let raf = 0;
    const animate = (now: number) => {
      if (!lastFrame.current) lastFrame.current = now;
      const dt = Math.min((now - lastFrame.current) / 1000, 0.05);
      lastFrame.current = now;
      const p = physics.current;
      const current = phaseRef.current;
      const t = now / 1000;
      p.wind = Math.sin(t * 1.17 + stageRef.current * 1.5) * settings.drift;
      if (current === "ready") {
        const input = Number(keys.current.right) - Number(keys.current.left);
        p.vx = clamp(p.vx + input * dt * 64 - p.vx * dt * 3, -20, 20);
        p.x = clamp(p.x + (p.vx + p.wind) * dt, 7, 93);
        if (p.x === 7 || p.x === 93) p.vx = 0;
      }
      if (current === "dropping") {
        p.y += dt * (37 + (p.y - 18) * 0.65);
        p.fallX = clamp(p.fallX + dt * (p.fallV + p.wind * 1.5), 5, 95);
        if (p.y >= 74 && !finishLock.current) {
          finishLock.current = true;
          // Capture the index BEFORE advancing to the next module.
          // React may execute state updater functions later, after stageRef changes.
          const placedIndex = stageRef.current;
          const placedMission = MISSIONS[placedIndex];
          if (!placedMission) {
            phaseRef.current = "won";
            setPhase("won");
            finishLock.current = false;
            return;
          }
          const hit = Math.abs(p.fallX - placedMission.target) <= settings.tolerance;
          if (hit) {
            const next = placedIndex + 1;
            setLanded(old => old.includes(placedIndex) ? old : [...old, placedIndex]);
            setFlash("good");
            setMessage(`PERFECT! ${placedMission.name} INSTALLED.`);
            setStage(next);
            stageRef.current = next;
            if (next === MISSIONS.length) {
              phaseRef.current = "won";
              setPhase("won");
            } else {
              p.x = 50;
              p.vx = 0;
              p.y = 18;
              phaseRef.current = "ready";
              setPhase("ready");
            }
          } else {
            const left = chancesRef.current - 1;
            chancesRef.current = left;
            setChances(left);
            setFlash("bad");
            setMessage(left ? "MISSED THE PAD! ADJUST FOR SIDEWAYS DRIFT." : "OUT OF REPAIR KITS. TRY AGAIN!");
            p.x = 50;
            p.vx = 0;
            p.y = 18;
            if (left <= 0) { phaseRef.current = "lost"; setPhase("lost"); }
            else { phaseRef.current = "ready"; setPhase("ready"); }
          }
          finishLock.current = false;
        }
      }
      if (now - visibleFrame.current > 35) { setFrame({ ...p }); visibleFrame.current = now; }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(raf); lastFrame.current = 0; };
  }, [settings.drift, settings.tolerance]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(id);
  }, [flash]);

  const current = MISSIONS[Math.min(stage, MISSIONS.length - 1)];
  const Icon = current.Icon;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const moduleX = phase === "dropping" ? frame.fallX : frame.x;
  const moduleY = phase === "dropping" ? frame.y : 18;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#244669] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Hammer size={23}/></span>
          <div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 06 · LUNAR CONSTRUCTION</p><h2 className="text-lg font-black tracking-tight sm:text-2xl">CRANE COMMANDER</h2></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs font-black text-[#ffd60a]">BUILD {Math.min(stage + 1,4)}/4</span>
          <span className={`flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-black ${seconds < 20 ? "border-red-400 text-red-300" : "border-[#496888] text-white"}`}><Clock3 size={15}/>{clock}</span>
          <button aria-label="How to play" onClick={() => setShowHelp(true)} className="rounded-lg border border-[#496888] p-2"><HelpCircle size={17}/></button>
          <button aria-label="Close mission" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-3 sm:px-6">
        <div className="mx-auto mb-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Target size={17} className="text-[#ffd60a]"/><span className="text-xs font-black tracking-wide sm:text-sm">DROP <span className="text-[#ffd60a]">{current.name}</span> ON THE TARGET</span></div>
          <span className="text-xs font-bold text-[#ffd60a]">REPAIR KITS: {"● ".repeat(chances)}<span className="text-[#53657b]">{"○ ".repeat(settings.chances - chances)}</span></span>
        </div>

        <div className={`relative mx-auto min-h-[260px] w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border bg-[#061225] shadow-[inset_0_0_90px_#0009] ${flash === "bad" ? "border-red-400" : flash === "good" ? "border-[#ffd60a]" : "border-[#315475]"}`}>
          <div className="pointer-events-none absolute inset-0" style={{backgroundImage:"radial-gradient(#c4d5ed88 1px,transparent 1px)",backgroundSize:"43px 47px",opacity:.16}} />
          <div className="pointer-events-none absolute left-[12%] top-[8%] h-20 w-20 rounded-full bg-[#f6f2cd] shadow-[0_0_55px_#d4ddbe40] sm:h-28 sm:w-28"/>
          <div className="pointer-events-none absolute bottom-[12%] left-[-8%] h-[20%] w-[38%] rounded-[50%] bg-[#172741]"/>
          <div className="pointer-events-none absolute bottom-[11%] right-[-5%] h-[25%] w-[42%] rounded-[50%] bg-[#12233d]"/>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%] border-t border-[#4e5c70] bg-[#48566c]" style={{backgroundImage:"repeating-linear-gradient(135deg,transparent 0px,transparent 34px,#303c5040 35px,#303c5040 36px)"}}/>
          {/* Track and animated trolley */}
          <div className="absolute left-[4%] right-[4%] top-[8%] h-3 rounded-full border border-[#8a9eb4] bg-[#18324c] shadow-[0_3px_14px_#0009]"/>
          <div className="absolute top-[7%] z-20 h-5 w-12 -translate-x-1/2 rounded-md border-2 border-[#ffdc60] bg-[#ffc300] shadow-[0_0_20px_#ffc30066]" style={{left:`${frame.x}%`}}/>
          {phase !== "won" && phase !== "lost" && <>
            <div className="absolute z-10 w-[3px] -translate-x-1/2 bg-[#b9c4cf]" style={{left:`${frame.x}%`,top:"11%",height:`${Math.max(2,moduleY - 11)}%`}}/>
            <div className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{left:`${moduleX}%`,top:`${moduleY}%`}}>
              <div className="rounded-lg border-2 border-[#ffd60a] bg-[#002449] p-2 shadow-[0_9px_20px_#0009,0_0_15px_#ffc30044] sm:p-3"><Icon size={32} color={current.color}/></div>
              <span className="mt-1 rounded bg-[#000814cc] px-2 py-1 text-[9px] font-black tracking-wide text-white">{current.name}</span>
            </div>
          </>}
          {/* Landing pad - each stage has its own precise target */}
          {phase !== "won" && <div className="absolute z-10 -translate-x-1/2" style={{left:`${current.target}%`,bottom:"15%",width:`${settings.tolerance * 2}%`}}>
            <div className="h-3 w-full rounded-full border-2 border-[#ffd60a] bg-[#ffc30055] shadow-[0_0_28px_#ffc300aa] animate-pulse"/>
            <div className="mt-1 text-center text-[9px] font-black tracking-wider text-[#ffd60a]">DROP ZONE</div>
          </div>}
          {landed.map(i => {
            const mission = MISSIONS[i];
            if (!mission) return null;
            const BuiltIcon = mission.Icon;
            return <div key={mission.name} className="absolute z-10 -translate-x-1/2" style={{left:`${mission.target}%`,bottom:"16%"}}><div className="rounded-t-lg border border-[#bcd4ef] bg-[#003566] p-2 shadow-[0_0_20px_#ffd60a33]"><BuiltIcon color={mission.color} size={24}/></div><div className="h-1 rounded bg-[#ffd60a]"/></div>;
          })}
          {phase !== "won" && <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-[#456684] bg-[#001d3dbb] px-2 py-2 text-xs text-white"><Zap size={14} className="text-[#ffd60a]"/> DRIFT {frame.wind > .2 ? "→" : frame.wind < -.2 ? "←" : "·"}</div>}
          {phase === "won" && <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814e8] p-5"><div className="max-w-sm text-center"><CheckCircle2 className="mx-auto mb-4 text-[#ffd60a]" size={53}/><h3 className="text-3xl font-black">BASE EXPANDED!</h3><p className="mt-3 text-sm leading-6 text-slate-300">All four modules installed. You built a new lunar research outpost!</p><button disabled={busy} onClick={onComplete} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}<ArrowRight size={18}/></button></div></div>}
          {phase === "lost" && <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814e8] p-5"><div className="max-w-sm text-center"><AlertTriangle className="mx-auto mb-4 text-[#ffc300]" size={48}/><h3 className="text-3xl font-black">MISSION RETRY</h3><p className="mt-3 text-sm text-slate-300">The construction crew needs another attempt.</p><button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw size={18}/> TRY AGAIN</button></div></div>}
        </div>

        <div className="mx-auto mt-3 w-full max-w-5xl">
          <div role="status" aria-live="polite" className="mb-3 min-h-5 text-center text-xs font-bold tracking-wide text-[#ffd60a]">{message}</div>
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <button aria-label="Move crane left" onPointerDown={e => {e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.left=true;}} onPointerUp={()=>keys.current.left=false} onPointerCancel={()=>keys.current.left=false} onLostPointerCapture={()=>keys.current.left=false} disabled={phase!=="ready"||busy} className="grid h-14 w-20 touch-none place-items-center rounded-xl border border-[#496a91] bg-[#001d3d] text-white active:bg-[#003566] disabled:opacity-40"><ArrowLeft size={27}/></button>
            <button onClick={drop} disabled={phase!=="ready"||busy} className="flex h-14 min-w-40 items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 text-sm font-black text-[#000814] shadow-[0_5px_25px_#ffc30044] disabled:opacity-40"><ArrowDown size={22}/> DROP MODULE</button>
            <button aria-label="Move crane right" onPointerDown={e => {e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.right=true;}} onPointerUp={()=>keys.current.right=false} onPointerCancel={()=>keys.current.right=false} onLostPointerCapture={()=>keys.current.right=false} disabled={phase!=="ready"||busy} className="grid h-14 w-20 touch-none place-items-center rounded-xl border border-[#496a91] bg-[#001d3d] text-white active:bg-[#003566] disabled:opacity-40"><ArrowRight size={27}/></button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold tracking-wide text-[#a5bbd2]"><span>A/D OR ← → TO STEER</span><span>SPACE TO DROP · {landed.length}/4 INSTALLED</span><button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 text-[#ffd60a]"><RotateCcw size={13}/>RESTART</button></div>
          <div className="mt-2 flex gap-1.5">{MISSIONS.map((m,i)=><div key={m.name} className={`h-1.5 flex-1 rounded-full ${landed.includes(i)?"bg-[#ffd60a]":"bg-[#244465]"}`}/>)}</div>
        </div>
      </div>
      {showHelp && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814ec] p-4"><div className="w-full max-w-sm rounded-2xl border border-[#ffc30066] bg-[#001d3d] p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-black">HOW TO PLAY</h3><button aria-label="Close instructions" onClick={()=>setShowHelp(false)}><X/></button></div><p className="mb-3 text-base font-bold">← → MOVE THE CRANE</p><p className="mb-3 text-base font-bold">↓ DROP ON THE YELLOW PAD</p><p className="mb-5 text-base font-bold">⚡ WATCH THE SIDEWAYS DRIFT</p><p className="mb-5 text-xs text-slate-300">Build four modules before time or repair kits run out.</p><button onClick={()=>setShowHelp(false)} className="w-full rounded-xl bg-[#ffc300] p-3 font-black text-[#000814]">LET'S BUILD!</button></div></div>}
      <div className="sr-only">{started ? "Construction in progress" : "Construction timer begins at the first drop"}</div>
    </div>
  );
}
