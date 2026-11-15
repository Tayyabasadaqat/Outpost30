"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Crosshair, HelpCircle, Radar, RotateCcw, ShieldCheck, Waves, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "playing" | "won" | "lost";
type Crack = { x: number; y: number; angle: number; strength: number; name: string };
const CRACKS: Crack[] = [
  { x: 17, y: 29, angle: -26, strength: 1, name: "OBSERVATION WINDOW" },
  { x: 78, y: 22, angle: 38, strength: 1.3, name: "UPPER PRESSURE SEAL" },
  { x: 55, y: 44, angle: -12, strength: 1.1, name: "CENTRAL HATCH" },
  { x: 29, y: 71, angle: 27, strength: 1.2, name: "LOWER SERVICE PANEL" },
  { x: 83, y: 75, angle: -30, strength: 1.4, name: "AIRLOCK JOINT" },
];
const DIFFICULTY = {
  safe: { time: 135, pressure: 100, drain: 0.22, weld: 1.0, visibility: 3.7, scans: 7 },
  risky: { time: 115, pressure: 90, drain: 0.32, weld: 0.86, visibility: 3.3, scans: 6 },
  dangerous: { time: 100, pressure: 84, drain: 0.43, weld: 0.75, visibility: 3.0, scans: 5 },
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function HabitatBreachHunters({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const cfg = DIFFICULTY[strategy];
  const [phase, setPhase] = useState<Phase>("tutorial");
  const [showHelp, setShowHelp] = useState(false);
  const [pressure, setPressure] = useState(cfg.pressure);
  const [remaining, setRemaining] = useState(cfg.time);
  const [sealed, setSealed] = useState<boolean[]>(() => CRACKS.map(() => false));
  const [progress, setProgress] = useState<number[]>(() => CRACKS.map(() => 0));
  const [scans, setScans] = useState(cfg.scans);
  const [reveal, setReveal] = useState(0);
  const [scanCooldown, setScanCooldown] = useState(0);
  const [beam, setBeam] = useState<number | null>(null);
  const [message, setMessage] = useState("SCAN THE WALL, THEN HOLD TO WELD THE CRACKS!");
  const [sparks, setSparks] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const tickRef = useRef(0);
  const state = useRef({ phase: "tutorial" as Phase, pressure: cfg.pressure, time: cfg.time, scannedUntil: 0, cooldownUntil: 0, scans: cfg.scans, sealed: CRACKS.map(() => false), progress: CRACKS.map(() => 0), beam: null as number | null, elapsed: 0 });
  const setup = useCallback(() => {
    state.current = { phase: "tutorial", pressure: cfg.pressure, time: cfg.time, scannedUntil: 0, cooldownUntil: 0, scans: cfg.scans, sealed: CRACKS.map(() => false), progress: CRACKS.map(() => 0), beam: null, elapsed: 0 };
    setPhase("tutorial"); setShowHelp(false); setPressure(cfg.pressure); setRemaining(cfg.time); setSealed(CRACKS.map(() => false)); setProgress(CRACKS.map(() => 0)); setScans(cfg.scans); setReveal(0); setScanCooldown(0); setBeam(null); setMessage("SCAN THE WALL, THEN HOLD TO WELD THE CRACKS!"); setSparks(null); setSeconds(0); tickRef.current = 0;
  }, [cfg.pressure, cfg.scans, cfg.time]);
  const scan = useCallback(() => {
    const s = state.current;
    if (s.phase !== "playing" || s.scans <= 0 || s.cooldownUntil > s.elapsed || busy) return;
    s.scans -= 1; s.scannedUntil = s.elapsed + cfg.visibility; s.cooldownUntil = s.elapsed + 2.8;
    setScans(s.scans); setReveal(s.scannedUntil); setScanCooldown(s.cooldownUntil); setMessage("SCANNER ONLINE! GLOWING RED LINES ARE PRESSURE LEAKS.");
  }, [busy, cfg.visibility]);
  const start = () => {state.current.phase = "playing"; setPhase("playing"); setMessage("PRESS SCAN! THEN HOLD A RED CRACK TO REPAIR IT."); scan();};
  const finishBeam = useCallback(() => { state.current.beam = null; setBeam(null); }, []);
  const startBeam = useCallback((i: number) => {
    const s = state.current;
    if (s.phase !== "playing" || s.sealed[i] || busy) return;
    if (s.scannedUntil < s.elapsed) { setMessage("CRACKS ARE HIDDEN! PRESS SCAN TO REVEAL THEM."); return; }
    s.beam = i; setBeam(i); setMessage(`WELDING ${CRACKS[i].name} — KEEP HOLDING!`);
  }, [busy]);
  useEffect(() => {
    const onUp = () => finishBeam();
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.key.toLowerCase() === "r") && state.current.phase === "playing") { e.preventDefault(); scan(); }
      if (e.key === "Escape") finishBeam();
    };
    window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp); window.addEventListener("keydown", onKey);
    return () => {window.removeEventListener("pointerup", onUp);window.removeEventListener("pointercancel", onUp);window.removeEventListener("keydown", onKey);};
  }, [finishBeam, scan]);
  useEffect(() => {
    if (phase !== "playing" || showHelp || busy) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(), dt = clamp((now - last) / 1000, 0, .15); last = now;
      const s = state.current; if (s.phase !== "playing") return;
      s.elapsed += dt; s.time -= dt;
      const unsealed = s.sealed.filter(v => !v).length;
      s.pressure = clamp(s.pressure - dt * (cfg.drain * (0.48 + unsealed * .39)), 0, 100);
      if (s.beam !== null && s.scannedUntil > s.elapsed && !s.sealed[s.beam]) {
        const i = s.beam;
        s.progress[i] = Math.min(1, s.progress[i] + dt * cfg.weld / (1.6 * CRACKS[i].strength));
        if (s.progress[i] >= 1) {
          s.sealed[i] = true; s.pressure = Math.min(100, s.pressure + 7);
          s.beam = null; setBeam(null); setSealed([...s.sealed]); setSparks(i);
          setMessage(`${CRACKS[i].name} SEALED! PRESS SCAN FOR THE NEXT LEAK.`);
          if (s.sealed.every(Boolean)) { s.phase = "won"; setPhase("won"); setMessage("ALL BREACHES SEALED. HABITAT PRESSURE STABILIZED!"); }
        }
      }
      if (s.beam !== null && s.scannedUntil <= s.elapsed) { s.beam = null; setBeam(null); setMessage("SCAN EXPIRED! PRESS SPACE OR CLICK SCAN AGAIN."); }
      if (s.phase === "playing" && (s.pressure <= 0 || s.time <= 0)) {s.phase = "lost";setPhase("lost");setMessage("HABITAT PRESSURE CRITICAL! RESTART THE REPAIR.");}
      setPressure(s.pressure); setRemaining(s.time); setProgress([...s.progress]); setSeconds(s.elapsed); tickRef.current++;
    }, 45);
    return () => window.clearInterval(id);
  }, [busy, cfg.drain, cfg.weld, phase, showHelp]);
  useEffect(() => { if (sparks === null) return; const t = window.setTimeout(() => setSparks(null), 750); return () => window.clearTimeout(t); }, [sparks]);
  const count = sealed.filter(Boolean).length;
  const visible = phase !== "playing" || seconds < reveal;
  const clock = `${String(Math.floor(Math.max(0, remaining) / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, remaining) % 60)).padStart(2, "0")}`;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white select-none">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#34506f] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 22 · HABITAT LEAK</p><h1 className="text-lg font-black sm:text-2xl">BREACH HUNTERS</h1></div>
        <div className="flex items-center gap-2"><span className="rounded-lg border border-[#47627d] px-3 py-2 text-xs font-black text-[#ffd60a]">{count}/5 SEALED</span><span className="rounded-lg border border-[#47627d] px-3 py-2 font-mono text-xs">{clock}</span><button aria-label="Help" onClick={() => {finishBeam();setShowHelp(true);}} className="rounded-lg border border-[#47627d] p-2"><HelpCircle size={18}/></button><button aria-label="Close game" onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]"><X size={21}/></button></div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border border-[#2c536f] bg-[#001d3d] px-3 py-2"><Waves size={17} className={pressure < 28 ? "text-rose-400" : "text-[#81e1ff]"}/><span>PRESSURE</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#132b43]"><div className={`h-full transition-[width] ${pressure < 28 ? "bg-rose-400" : "bg-[#80dfff]"}`} style={{width:`${pressure}%`}}/></div><span>{Math.round(pressure)}%</span></div>
          <div className="flex items-center gap-2 rounded-xl border border-[#2c536f] bg-[#001d3d] px-3 py-2 text-[#ffd60a]"><Radar size={17}/>{scans} SCANS</div>
        </div>
        <div className="relative min-h-[250px] flex-1 overflow-hidden rounded-2xl border border-[#35516c] bg-[#061629]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 540" preserveAspectRatio="none" aria-label="Interior of lunar habitat with leak sites">
            <defs>
              <radialGradient id="breachGlow"><stop offset="0%" stopColor="#295679"/><stop offset="100%" stopColor="#061629"/></radialGradient>
              <pattern id="breachGrid" width="60" height="55" patternUnits="userSpaceOnUse"><path d="M60 0H0V55" fill="none" stroke="#29435e" strokeWidth="1.2"/></pattern>
            </defs>
            <rect width="900" height="540" fill="url(#breachGlow)"/>
            <path d="M40 92 Q450 -10 860 92 L860 485 Q450 547 40 485Z" fill="#102b43" stroke="#52738b" strokeWidth="12"/>
            <path d="M48 100 Q450 6 852 100 L852 477 Q450 529 48 477Z" fill="url(#breachGrid)" stroke="#183c58" strokeWidth="5"/>
            <path d="M420 95v390M480 95v390" stroke="#526e84" strokeWidth="7" opacity=".55"/>
            <rect x="366" y="182" width="168" height="180" rx="15" fill="#081f36" stroke="#658199" strokeWidth="8"/>
            <rect x="388" y="202" width="124" height="137" rx="8" fill="#003566" stroke="#ffd60a" strokeWidth="3"/>
            <path d="M413 228h74M413 252h74M413 276h74M413 300h74" stroke="#6a90aa" strokeWidth="7" strokeLinecap="round" opacity=".5"/>
            <rect x="81" y="108" width="190" height="124" rx="16" fill="#051529" stroke="#577d9e" strokeWidth="7"/>
            <circle cx="176" cy="170" r="47" fill="#071b35" stroke="#5883a5" strokeWidth="3"/>
            <circle cx="176" cy="170" r="34" fill="#192e4b"/>
            <path d="M145 186l33-43 26 38" stroke="#8cb4ce" strokeWidth="3" fill="none"/>
            <rect x="641" y="94" width="174" height="115" rx="14" fill="#051529" stroke="#507f98" strokeWidth="7"/>
            <path d="M669 150l22 16 24-31 17 14 27-25" stroke="#ffd60a" strokeWidth="4" fill="none"/>
            <rect x="75" y="375" width="223" height="76" rx="10" fill="#092139" stroke="#4c6c87" strokeWidth="6"/>
            <rect x="622" y="382" width="210" height="62" rx="10" fill="#092139" stroke="#4c6c87" strokeWidth="6"/>
            <g opacity=".78"><path d="M42 482H856" stroke="#879aab" strokeWidth="8"/><path d="M50 493H850" stroke="#192f49" strokeWidth="20"/></g>
            <text x="450" y="38" fill="#c7d8e9" fontWeight="bold" fontSize="13" letterSpacing="4" textAnchor="middle">LUNAR HABITAT · PRESSURIZED INTERIOR</text>
            {CRACKS.map((c,i) => {const left=c.x*9,top=c.y*5.4;const isDone=sealed[i];const showCrack=visible || isDone;return <g key={c.name} transform={`translate(${left} ${top}) rotate(${c.angle})`} opacity={showCrack?1:.12}>
              {!isDone && showCrack && <><circle r="34" fill="#ff4364" opacity=".12"><animate attributeName="r" values="28;39;28" dur="1.5s" repeatCount="indefinite"/></circle><path d="M-22 -16L-9 -5L-12 8L3 -1L11 16L20 10" fill="none" stroke="#ff5872" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path d="M-22 -16L-9 -5L-12 8L3 -1L11 16L20 10" fill="none" stroke="#ffdce4" strokeWidth="1.5"/><path d="M0 -32l-6 -15M0 -32l8 -14" stroke="#85e9ff" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 5"/></>}
              {isDone && <><circle r="21" fill="#0d4f54" stroke="#7cf3ce" strokeWidth="3"/><path d="M-10 0l7 7 14-16" fill="none" stroke="#b8ffe5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>}
              {!isDone && showCrack && progress[i]>0 && <circle r="28" fill="none" stroke="#ffd60a" strokeWidth="5" strokeDasharray={`${progress[i]*176} 176`} transform="rotate(-90)"/>}
              {sparks === i && <circle r="22" fill="none" stroke="#ffd60a" strokeWidth="6" opacity=".8"><animate attributeName="r" values="10;70" dur=".7s" fill="freeze"/></circle>}
            </g>;})}
          </svg>
          {CRACKS.map((c, i) => (
            <button key={c.name} type="button" aria-label={`Weld ${c.name}`} onPointerDown={(e) => {e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startBeam(i);}} onPointerUp={finishBeam} onPointerCancel={finishBeam} onLostPointerCapture={finishBeam}
              disabled={phase !== "playing" || sealed[i] || !visible || busy}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full ${visible&&!sealed[i] ? "cursor-crosshair border-2 border-[#ffd60a]/70 bg-[#ff4263]/15 shadow-[0_0_24px_#fa426066]" : ""} ${sealed[i] ? "pointer-events-none" : ""}`}
              style={{left:`${c.x}%`,top:`${c.y}%`,width:"min(9vw,74px)",height:"min(9vw,74px)",minWidth:38,minHeight:38}}>
              {phase === "playing" && visible && !sealed[i] && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#000814d9] px-2 py-1 text-[9px] font-black tracking-wide text-[#ffd60a]">{Math.round(progress[i]*100)}%</span>}
            </button>
          ))}
          {beam !== null && <div className="pointer-events-none absolute bottom-[9%] left-1/2 z-20 -translate-x-1/2 rounded-lg border border-[#ffd60a] bg-[#001d3df0] px-5 py-2 text-xs font-black tracking-widest text-[#ffd60a] animate-pulse"><Zap className="mr-2 inline" size={16}/> WELDING — KEEP HOLDING!</div>}
          {phase === "playing" && !visible && <div className="pointer-events-none absolute inset-0 grid place-items-center"><p className="rounded-xl border border-[#ffd60a]/40 bg-[#000814e0] px-6 py-3 text-center text-sm font-black tracking-wider text-[#ffd60a]">LEAKS HIDDEN · USE YOUR SCANNER</p></div>}
          {phase === "tutorial" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814e8] p-4"><div className="w-full max-w-md rounded-2xl border border-[#ffc300]/50 bg-[#001d3d] p-6 shadow-2xl"><p className="mb-1 text-xs font-black tracking-widest text-[#ffd60a]">MISSION BRIEFING</p><h2 className="mb-3 text-3xl font-black">SEAL THE BREACH!</h2><p className="mb-5 text-sm text-[#d6e4f2]">Air is escaping from five cracks in the Moon base. Find and repair every leak before pressure reaches zero.</p><div className="space-y-3 text-sm font-bold"><p>📡 <span className="text-[#ffd60a]">1. SCAN</span> to reveal glowing red cracks.</p><p>🎯 <span className="text-[#ffd60a]">2. HOLD</span> your mouse or finger on a crack to weld it.</p><p>⚡ <span className="text-[#ffd60a]">3. RE-SCAN</span> when cracks disappear. Seal all five!</p></div><p className="mt-5 text-xs text-[#a9c2d6]">Keyboard: SPACE or R = scan · Mouse/touch = hold to weld</p><button onClick={start} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 text-sm font-black text-[#000814]">START THE RESCUE →</button></div></div>}
          {(phase === "won" || phase === "lost") && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814eb] p-4"><div className="w-full max-w-sm text-center">{phase === "won" ? <ShieldCheck className="mx-auto mb-3 text-[#7cf3ce]" size={58}/> : <AlertTriangle className="mx-auto mb-3 text-[#ff758b]" size={58}/>}<h2 className="text-3xl font-black">{phase === "won" ? "HABITAT SEALED!" : "PRESSURE LOST!"}</h2><p className="mt-3 text-sm text-[#c8d8e7]">{phase === "won" ? "All five leaks repaired. The astronauts can breathe safely again!" : "The base needs another repair attempt. Try scanning and welding quickly."}</p><button disabled={busy} onClick={phase === "won" ? onComplete : setup} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 text-sm font-black text-[#000814] disabled:opacity-50">{phase === "won" ? busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE" : "TRY AGAIN"}</button></div></div>}
        </div>
        <div role="status" aria-live="polite" className="min-h-5 text-center text-xs font-black tracking-wide text-[#ffd60a]">{message}</div>
        <div className="flex shrink-0 items-center justify-center gap-3 pb-2"><button disabled={phase!=="playing"||scans<=0||scanCooldown>seconds||busy} onClick={scan} className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814] disabled:opacity-40"><Radar size={19}/>{scanCooldown>seconds&&phase==="playing" ? "RECHARGING..." : "SCAN FOR LEAKS"}</button><button onClick={setup} disabled={busy} className="rounded-xl border border-[#526c86] bg-[#001d3d] p-3" aria-label="Restart"><RotateCcw size={19}/></button></div>
      </div>
      {showHelp && <div className="absolute inset-0 z-[90] grid place-items-center bg-[#000814eb] p-4"><div className="w-full max-w-sm rounded-xl border border-[#ffc300]/60 bg-[#001d3d] p-6"><h3 className="mb-3 text-xl font-black text-[#ffd60a]">HOW TO PLAY</h3><p className="mb-2">1. Click SCAN or press Space to reveal cracks.</p><p className="mb-2">2. Click and HOLD on a red crack until it's 100% welded.</p><p className="mb-4">3. Repeat for all five before pressure runs out.</p><button onClick={() => setShowHelp(false)} className="w-full rounded-lg bg-[#ffc300] p-3 font-black text-[#000814]">BACK TO GAME</button></div></div>}
    </div>
  );
}
