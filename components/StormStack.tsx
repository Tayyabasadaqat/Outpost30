"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, CheckCircle2, CloudSun, HelpCircle, RotateCcw, Shield, ShieldCheck, Trash2, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "playing" | "won" | "lost";
type Piece = "shield" | "faulty";
type Game = {
  phase: Phase; seconds: number; lane: number; layers: number[]; piece: number; falling: number;
  integrity: number; streak: number; score: number; flash: string; alert: string;
};
const SETTINGS = {
  safe: { seconds: 120, health: 5, speed: 38 },
  risky: { seconds: 105, health: 4, speed: 47 },
  dangerous: { seconds: 90, health: 3, speed: 55 },
};
const PIECES: Piece[] = ["shield", "shield", "faulty", "shield", "shield", "shield", "faulty", "shield", "shield", "shield", "faulty", "shield", "shield", "shield", "faulty", "shield", "shield", "shield", "shield", "shield"];
const CREW = ["NOVA", "ORION", "LUNA"];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const createGame = (cfg: typeof SETTINGS.safe): Game => ({ phase: "tutorial", seconds: cfg.seconds, lane: 1, layers: [0, 0, 0], piece: 0, falling: 0, integrity: cfg.health, streak: 0, score: 0, flash: "", alert: "BUILD 3 SHIELD LAYERS OVER EACH CREW BAY." });

export default function StormStack({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const cfg = SETTINGS[strategy];
  const data = useRef<Game>(createGame(cfg));
  const [view, setView] = useState<Game>(() => ({ ...data.current }));
  const [help, setHelp] = useState(false);
  const busyRef = useRef(busy);
  const helpRef = useRef(false);
  busyRef.current = busy;
  helpRef.current = help;
  const publish = useCallback(() => setView({ ...data.current, layers: [...data.current.layers] }), []);
  const restart = useCallback(() => { data.current = createGame(cfg); setHelp(false); publish(); }, [cfg, publish]);
  const start = useCallback(() => { if (data.current.phase !== "tutorial") return; data.current.phase = "playing"; data.current.alert = "MOVE TO A BAY. PRESS SPACE TO DROP THE BLUE SHIELD!"; publish(); }, [publish]);
  const steer = useCallback((direction: number) => { const g = data.current; if (g.phase !== "playing" || busyRef.current || helpRef.current) return; g.lane = clamp(g.lane + direction, 0, 2); publish(); }, [publish]);
  const advance = useCallback((message: string, bad = false) => {
    const g = data.current;
    g.piece += 1; g.falling = 0; g.flash = bad ? "bad" : "good";
    g.alert = message;
    if (g.layers.every(n => n >= 3)) { g.phase = "won"; g.alert = "SHELTER PREPARED — ALL CREW BAYS PROTECTED!"; }
    else if (g.integrity <= 0 || g.piece >= PIECES.length) { g.phase = "lost"; g.alert = g.integrity <= 0 ? "SHIELD SUPPLIES DAMAGED — TRY AGAIN!" : "OUT OF SHIELD MODULES — TRY AGAIN!"; }
    publish();
  }, [publish]);
  const land = useCallback(() => {
    const g = data.current;
    if (g.phase !== "playing" || busyRef.current || helpRef.current) return;
    const kind = PIECES[g.piece];
    if (kind === "faulty") { g.integrity -= 1; g.streak = 0; advance("DAMAGED MODULE! EJECT RED MODULES WITH X.", true); }
    else if (g.layers[g.lane] >= 3) { g.integrity -= 1; g.streak = 0; advance("THAT BAY IS FULL! CHOOSE AN UNFINISHED CREW BAY.", true); }
    else { g.layers[g.lane]++; g.streak++; g.score += 100 + (g.streak > 2 ? 25 : 0); advance(`${CREW[g.lane]}: SHIELD LAYER ${g.layers[g.lane]}/3 INSTALLED!`); }
  }, [advance]);
  const drop = useCallback(() => { const g = data.current; if (g.phase !== "playing" || busyRef.current || helpRef.current) return; g.falling = 100; land(); }, [land]);
  const eject = useCallback(() => {
    const g = data.current;
    if (g.phase !== "playing" || busyRef.current || helpRef.current) return;
    if (PIECES[g.piece] === "faulty") { g.score += 50; advance("DEFECTIVE MODULE SAFELY REJECTED!", false); }
    else { g.integrity -= 1; g.streak = 0; advance("GOOD MODULE WASTED! ONLY EJECT RED MODULES.", true); }
  }, [advance]);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      if (e.code === "ArrowLeft" || e.key.toLowerCase() === "a") steer(-1);
      else if (e.code === "ArrowRight" || e.key.toLowerCase() === "d") steer(1);
      else if (e.code === "Space" || e.code === "ArrowDown") { if (data.current.phase === "tutorial") start(); else drop(); }
      else if (e.key.toLowerCase() === "x" || e.key.toLowerCase() === "e") eject();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [steer, drop, eject, start]);
  useEffect(() => {
    let raf = 0, last = 0, lastPublish = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.06) : 0; last = now;
      const g = data.current;
      if (g.phase === "playing" && !busyRef.current && !helpRef.current) {
        g.seconds = Math.max(0, g.seconds - dt);
        g.falling += cfg.speed * dt;
        if (g.seconds === 0) { g.phase = "lost"; g.alert = "SPACE WEATHER ALERT: TIME RAN OUT!"; publish(); }
        else if (g.falling >= 100) land();
        if (now - lastPublish > 65) { publish(); lastPublish = now; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cfg.speed, land, publish]);
  const g = view;
  const kind = PIECES[Math.min(g.piece, PIECES.length - 1)];
  const protectedBays = g.layers.filter(n => n === 3).length;
  const total = g.layers.reduce((a, b) => a + b, 0);
  const time = `${String(Math.floor(g.seconds / 60)).padStart(2, "0")}:${String(Math.ceil(g.seconds % 60)).padStart(2, "0")}`;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#285072] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><ShieldCheck size={25}/></span><div><div className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 26 · RADIATION PREPAREDNESS</div><h1 className="text-xl font-black sm:text-2xl">STORM STACK</h1></div></div>
        <div className="flex items-center gap-3"><span className={`rounded-lg border px-3 py-2 text-xs font-black ${g.seconds < 20 ? "border-rose-400 text-rose-300" : "border-[#496888] text-[#ffd60a]"}`}>STORM IN {time}</span><button onClick={() => setHelp(true)} className="rounded-lg border border-[#496888] p-2" aria-label="How to play"><HelpCircle size={19}/></button><button onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" aria-label="Close mission"><X size={21}/></button></div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
        <div className="grid shrink-0 grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#315373] bg-[#001d3d] p-2 text-center"><div className="text-[10px] tracking-wider text-[#a9c5db]">SHIELDS INSTALLED</div><div className="text-xl font-black text-[#ffd60a]">{total}/9</div></div>
          <div className="rounded-xl border border-[#315373] bg-[#001d3d] p-2 text-center"><div className="text-[10px] tracking-wider text-[#a9c5db]">SHELTERS READY</div><div className="text-xl font-black text-[#76e6b0]">{protectedBays}/3</div></div>
          <div className="rounded-xl border border-[#315373] bg-[#001d3d] p-2 text-center"><div className="text-[10px] tracking-wider text-[#a9c5db]">REPAIR CHANCES</div><div className="text-xl font-black text-[#ffb4a3]">{g.integrity}</div></div>
        </div>
        <div className="relative min-h-[270px] flex-1 overflow-hidden rounded-2xl border border-[#315373] bg-[#081a31] shadow-[inset_0_0_65px_#0008]">
          <div className="pointer-events-none absolute inset-0 opacity-25" style={{backgroundImage:"radial-gradient(#98d2f3 1px,transparent 1px)",backgroundSize:"37px 38px"}}/>
          <div className="pointer-events-none absolute left-[-35px] top-5 h-36 w-36 rounded-full bg-[#f6cc64]/10 blur-2xl"/>
          <div className="absolute left-0 right-0 top-3 text-center text-[10px] font-bold tracking-[.25em] text-[#9cbbd5]">SHIELD MODULE DELIVERY RAIL</div>
          <div className="absolute left-[9%] right-[9%] top-[12%] h-2 rounded-full border border-[#7fa3b8] bg-[#163c5a]"/>
          <div className="absolute inset-x-[4%] bottom-[7%] top-[22%] grid grid-cols-3 gap-2 sm:gap-5">
            {CREW.map((name, idx) => (
              <div key={name} className={`relative flex flex-col justify-end rounded-t-2xl border-2 ${g.lane===idx && g.phase==="playing" ? "border-[#ffd60a] bg-[#1c3651]" : "border-[#34516b] bg-[#10253b]"}`}>
                <div className="absolute inset-x-2 top-2 rounded-full bg-[#29455e] px-2 py-1 text-center text-[10px] font-extrabold text-white">{name}</div>
                <div className="mb-2 flex items-center justify-center"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#adc4d3] bg-[#243c58] text-2xl">👩‍🚀</span></div>
                <div className="mx-1 mb-2 flex h-[55%] flex-col-reverse gap-1 sm:mx-4">
                  {Array.from({length:3},(_,j)=><div key={j} className={`flex min-h-0 flex-1 items-center justify-center rounded-md border-2 text-[10px] font-black tracking-wide ${j < g.layers[idx] ? "border-[#ffe47d] bg-[#d5a62d] text-[#00162d] shadow-[0_0_13px_#ffc30055]" : "border-dashed border-[#45647e] bg-[#001d3d] text-[#66839b]"}`}>{j<g.layers[idx]?<span className="flex items-center gap-1"><Shield size={14}/> SHIELD</span>:"EMPTY"}</div>)}
                </div>
                <div className={`mx-2 mb-2 rounded-md py-1 text-center text-[10px] font-black ${g.layers[idx] === 3 ? "bg-[#1b745a] text-[#b7ffe2]" : "bg-[#1c3b54] text-[#a8c8dd]"}`}>{g.layers[idx]===3?"✓ PROTECTED":`${g.layers[idx]}/3 LAYERS`}</div>
              </div>
            ))}
          </div>
          {g.phase==="playing" && <div className="pointer-events-none absolute z-10 -translate-x-1/2" style={{left:`${18 + g.lane * 32}%`,top:`${13 + g.falling * .55}%`,width:"25%"}}><div className={`mx-auto flex h-11 max-w-[135px] items-center justify-center gap-2 rounded-lg border-2 px-2 shadow-[0_0_28px_#0008] ${kind==="faulty"?"border-[#ff7891] bg-[#722b44] text-white":"border-[#fff0a8] bg-[#ffc300] text-[#00152a]"}`}>{kind==="faulty"?<><AlertTriangle size={18}/><span className="text-xs font-black">FAULTY!</span></>:<><Shield size={18}/><span className="text-xs font-black">SHIELD</span></>}</div></div>}
          {g.phase === "won" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-5"><div className="max-w-md text-center"><ShieldCheck className="mx-auto mb-3 text-[#ffd60a]" size={58}/><h2 className="text-3xl font-black">SHELTER READY!</h2><p className="mt-3 text-sm leading-6 text-[#c1d3e1]">All three crew bays have three layers of protective shielding. The crew can shelter before the simulated radiation alert.</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE →"}</button></div></div>}
          {g.phase === "lost" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ec] p-5"><div className="max-w-sm text-center"><AlertTriangle className="mx-auto mb-4 text-[#ffc300]" size={52}/><h2 className="text-3xl font-black">STORM ALERT!</h2><p className="mt-3 text-sm text-[#cbd9e8]">Not all shelter bays were ready in time. You can try the construction run again!</p><button onClick={restart} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]"><RotateCcw size={18}/> TRY AGAIN</button></div></div>}
        </div>
        <div className="shrink-0 text-center text-xs font-extrabold tracking-wide text-[#ffd60a]" role="status" aria-live="polite">{g.alert}</div>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-4">
          <button disabled={g.phase!=="playing"||busy||help} onClick={()=>steer(-1)} className="grid h-14 w-16 place-items-center rounded-xl border border-[#4c6f91] bg-[#001d3d] disabled:opacity-40" aria-label="Move left"><ArrowLeft size={26}/></button>
          <button disabled={g.phase!=="playing"||busy||help} onClick={drop} className="flex h-14 items-center gap-2 rounded-xl bg-[#ffc300] px-6 text-sm font-black text-[#000814] disabled:opacity-40"><ArrowDown size={22}/> DROP</button>
          <button disabled={g.phase!=="playing"||busy||help} onClick={()=>steer(1)} className="grid h-14 w-16 place-items-center rounded-xl border border-[#4c6f91] bg-[#001d3d] disabled:opacity-40" aria-label="Move right"><ArrowRight size={26}/></button>
          <button disabled={g.phase!=="playing"||busy||help} onClick={eject} className="flex h-14 items-center gap-2 rounded-xl border border-[#fa7a8b] bg-[#532a42] px-4 text-xs font-black text-[#ffe6e8] disabled:opacity-40"><Trash2 size={19}/> EJECT RED</button>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 text-[10px] font-bold text-[#aabfd0]"><span>← → MOVE · SPACE DROP · X EJECT</span><span>POINTS {g.score}</span><button onClick={restart} disabled={busy} className="flex items-center gap-1 text-[#ffd60a]"><RotateCcw size={13}/> RESTART</button></div>
      </div>
      {(g.phase === "tutorial" || help) && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814f2] p-4"><div className="w-full max-w-lg rounded-2xl border border-[#ffc30088] bg-[#001d3d] p-5 shadow-2xl sm:p-7"><div className="mb-4 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black tracking-wider text-[#ffd60a]"><CloudSun size={18}/> SPACE WEATHER ALERT</span>{help&&<button onClick={()=>setHelp(false)} aria-label="Close instructions"><X/></button>}</div><h2 className="text-2xl font-black">HOW TO PLAY</h2><p className="mt-2 text-sm text-[#d2e1ec]">Protect NOVA, ORION and LUNA before the simulated storm arrives!</p><div className="mt-5 space-y-3 text-sm"><p><strong className="text-[#ffd60a]">1. MOVE:</strong> Use ← / → or A / D to choose one of three crew bays.</p><p><strong className="text-[#ffd60a]">2. DROP:</strong> Press SPACE to install a BLUE shield module. Stack <strong>3 shields in each bay</strong>.</p><p><strong className="text-[#ff9bad]">3. EJECT:</strong> Press X when a RED faulty module appears. Never install red ones!</p><p><strong className="text-[#ffd60a]">4. WIN:</strong> Build all 9 layers before the clock or your repair chances run out.</p></div><div className="mt-5 rounded-lg border border-[#356184] bg-[#092c49] p-3 text-xs leading-5 text-[#b9d4e5]"><Zap className="mr-1 inline text-[#ffd60a]" size={14}/> Real missions monitor space weather and use designated shelters. Falling shield blocks are a game representation of preparing that protection.</div><button onClick={()=>{if(help)setHelp(false);else start();}} className="mt-5 w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">{help?"BACK TO GAME":"START SHIELD MISSION →"}</button></div></div>}
    </div>
  );
}
