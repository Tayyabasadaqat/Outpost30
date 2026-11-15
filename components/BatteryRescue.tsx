"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, BatteryCharging, Bolt, CheckCircle2, CircleHelp, Clock3, RotateCcw, ShieldCheck, Wrench, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Phase = "intro" | "screws" | "detect" | "replace" | "sync" | "won" | "lost";
const SETTINGS = {
  safe: { seconds: 155, mistakes: 5, syncWidth: 23, speed: 1.05 },
  risky: { seconds: 130, mistakes: 4, syncWidth: 18, speed: 1.35 },
  dangerous: { seconds: 110, mistakes: 3, syncWidth: 15, speed: 1.65 },
};
const CELL_NAMES = ["A1", "A2", "A3", "B1", "B2", "B3"];
const FAULT = 4;
const instructions: { heading: string; desc: string }[] = [
  { heading: "OPEN THE BATTERY CASE", desc: "Tap all four glowing screws to remove the cover." },
  { heading: "FIND THE BAD CELL", desc: "One battery is overheating. Inspect the red, sparking cell to isolate it." },
  { heading: "SWAP THE CELL", desc: "Take a spare battery from the tray, then click the empty socket." },
  { heading: "RESTART THE GRID", desc: "Press SPACE / SYNC when the moving lightning bolt is inside the GREEN zone. Get three perfect pulses!" },
];
export default function BatteryRescue({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const config = SETTINGS[strategy];
  const [phase, setPhase] = useState<Phase>("intro");
  const [help, setHelp] = useState(false);
  const [screws, setScrews] = useState<number[]>([]);
  const [selectedSpare, setSelectedSpare] = useState(false);
  const [mistakes, setMistakes] = useState(config.mistakes);
  const [seconds, setSeconds] = useState(config.seconds);
  const [pulses, setPulses] = useState(0);
  const [needle, setNeedle] = useState(0);
  const [feedback, setFeedback] = useState("The main battery bank is failing!");
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const phaseRef = useRef<Phase>("intro");
  const needleRef = useRef(0);
  const pulsesRef = useRef(0);
  const mistakesRef = useRef(config.mistakes);
  const lastPulse = useRef(0);
  const mark = useCallback((p: Phase) => { phaseRef.current = p; setPhase(p); }, []);
  const reset = () => {
    mark("intro"); setHelp(false); setScrews([]); setSelectedSpare(false);
    mistakesRef.current = config.mistakes; setMistakes(config.mistakes);
    setSeconds(config.seconds); pulsesRef.current = 0; setPulses(0);
    needleRef.current = 0; setNeedle(0); lastPulse.current = 0;
    setFlash(null); setFeedback("The main battery bank is failing!");
  };
  const penalize = useCallback((msg: string) => {
    const next = mistakesRef.current - 1;
    mistakesRef.current = next;
    setMistakes(next);
    setFeedback(msg);
    setFlash("bad");
    if (next <= 0) mark("lost");
  }, [mark]);
  const sync = useCallback(() => {
    if (phaseRef.current !== "sync" || busy) return;
    const now = Date.now();
    if (now - lastPulse.current < 420) return;
    lastPulse.current = now;
    if (Math.abs(needleRef.current - 50) <= config.syncWidth / 2) {
      const next = pulsesRef.current + 1;
      pulsesRef.current = next; setPulses(next); setFlash("good");
      if (next === 3) {
        mark("won"); setFeedback("POWER RESTORED! All habitat systems are online.");
      } else {
        setFeedback(`Pulse ${next}/3 successful! Wait for the next green zone.`);
      }
    } else {
      penalize("BAD TIMING! Wait until the lightning bolt crosses the green zone.");
    }
  }, [busy, config.syncWidth, mark, penalize]);
  useEffect(() => {
    if (phase === "intro" || phase === "won" || phase === "lost" || help || busy) return;
    const id = window.setInterval(() => setSeconds(old => {
      if (old <= 1) { mark("lost"); setFeedback("Battery repair window expired."); return 0; }
      return old - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [phase, help, busy, mark]);
  useEffect(() => {
    if (phase !== "sync" || help) return;
    let raf = 0;
    let start = 0;
    const animate = (t: number) => {
      if (!start) start = t;
      const position = 50 + 50 * Math.sin((t - start) * .0028 * config.speed - Math.PI / 2);
      needleRef.current = position;
      setNeedle(position);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, help, config.speed]);
  useEffect(() => {
    if (phase !== "sync" || help) return;
    function keydown(e: KeyboardEvent) {
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) sync(); }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [phase, help, sync]);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 450);
    return () => clearTimeout(id);
  }, [flash]);
  const unscrew = (i: number) => {
    if (phase !== "screws" || screws.includes(i)) return;
    const next = [...screws, i]; setScrews(next); setFlash("good");
    if (next.length === 4) { mark("detect"); setFeedback("CASE OPEN! Find the overheating red cell."); }
    else setFeedback(`${next.length}/4 screws removed. Keep going!`);
  };
  const inspect = (i: number) => {
    if (phase !== "detect") return;
    if (i === FAULT) { mark("replace"); setFeedback("FAULT ISOLATED! Select the spare battery below."); setFlash("good"); }
    else penalize("That cell is healthy. Look for the red sparking one!");
  };
  const swap = (i: number) => {
    if (phase !== "replace") return;
    if (i !== FAULT) return;
    if (!selectedSpare) { setFeedback("Pick up the SPARE BATTERY from the tray first!"); return; }
    mark("sync"); setFeedback("NEW CELL INSTALLED! Time three green-zone sync pulses."); setFlash("good");
  };
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const step = phase === "screws" ? 0 : phase === "detect" ? 1 : phase === "replace" ? 2 : 3;
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#234663] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-[#ffc300] p-2 text-[#000814]"><BatteryCharging size={24}/></div><div><div className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 14 · BATTERY FAILURE</div><h1 className="text-lg font-black sm:text-2xl">BATTERY RESCUE</h1></div></div>
      <div className="flex items-center gap-2"><span className="flex items-center gap-1 rounded-lg border border-[#496888] px-3 py-2 text-xs font-bold"><Clock3 size={15}/>{clock}</span><button onClick={() => setHelp(true)} aria-label="Instructions" className="rounded-lg border border-[#496888] p-2"><CircleHelp size={18}/></button><button onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div>
    </header>
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black text-[#ffd60a]">{phase === "intro" ? "EMERGENCY INCOMING" : phase === "won" ? "MISSION COMPLETE" : phase === "lost" ? "REPAIR FAILED" : `STEP ${step + 1}/4 · ${instructions[step].heading}`}</span><span className="text-xs font-bold text-slate-300">REPAIR KITS: <span className="text-[#ffd60a]">{"● ".repeat(Math.max(0, mistakes))}</span><span className="text-slate-600">{"○ ".repeat(config.mistakes - Math.max(0, mistakes))}</span></span></div>
      <div className="flex gap-1.5">{instructions.map((a,i) => <div key={a.heading} className={`h-2 flex-1 rounded-full ${phase === "won" || i < step ? "bg-[#ffd60a]" : i === step ? "bg-[#73e9ff]" : "bg-[#244364]"}`}/>)}</div>
      <div className={`relative flex min-h-[320px] flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 sm:p-6 ${flash === "bad" ? "border-rose-400" : flash === "good" ? "border-[#ffd60a]" : "border-[#345673]"}`} style={{background: "radial-gradient(ellipse at 50% 35%, #143c61 0%, #061426 65%, #000814 100%)"}}>
        <div className="pointer-events-none absolute inset-0 opacity-15" style={{backgroundImage:"linear-gradient(#93b5d122 1px,transparent 1px),linear-gradient(90deg,#93b5d122 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
        {(phase === "intro" || phase === "won" || phase === "lost") && <div className="relative z-10 max-w-md text-center">
          {phase === "intro" ? <><Zap className="mx-auto mb-3 text-[#ffd60a]" size={56}/><h2 className="text-3xl font-black">POWER EMERGENCY!</h2><p className="mt-3 text-sm leading-6 text-slate-300">An overheating battery cell could shut down the lunar habitat. Open the case, remove the bad cell, install a spare, then restart the power grid.</p><div className="mt-5 grid grid-cols-2 gap-2 text-left">{instructions.map((a,i)=><div key={a.heading} className="rounded-lg border border-[#355371] bg-[#001d3d] p-3 text-xs"><span className="text-[#ffd60a]">0{i+1}</span><div className="mt-1 font-bold">{a.heading}</div></div>)}</div><button onClick={() => {mark("screws");setFeedback("Tap the four yellow screws to open the case!");}} className="mt-5 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]">START REPAIR <ArrowRight className="inline" size={18}/></button></> : <>{phase === "won" ? <CheckCircle2 className="mx-auto mb-3 text-[#ffd60a]" size={65}/> : <AlertTriangle className="mx-auto mb-3 text-rose-400" size={65}/>}<h2 className="text-3xl font-black">{phase === "won" ? "POWER RESTORED!" : "POWER FAILURE!"}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{phase === "won" ? "The damaged battery is safely isolated and a healthy replacement is powering the habitat." : "The repair wasn't completed in time. Give it another shot!"}</p><button disabled={busy} onClick={phase === "won" ? onComplete : reset} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]">{phase === "won" ? busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE" : "TRY AGAIN"}</button></>}
        </div>}
        {(phase === "screws" || phase === "detect" || phase === "replace") && <div className="relative z-10 w-full max-w-[560px]">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black tracking-widest text-[#9bbedb]"><Wrench size={14}/> BATTERY BANK · PANEL 07</div>
          <div className="relative rounded-3xl border-[8px] border-[#56718b] bg-[#091a2b] p-6 shadow-[0_20px_70px_#000a,inset_0_0_28px_#000] sm:p-9">
            {phase === "screws" ? <><div className="flex h-[190px] items-center justify-center rounded-xl border-2 border-[#8ea4b7] bg-[#183a55] shadow-[inset_0_0_50px_#001627]"><div className="text-center"><Bolt className="mx-auto text-[#ffc300]" size={53}/><p className="mt-2 font-black tracking-widest">POWER CELL ACCESS</p><p className="mt-1 text-xs text-[#a9c0d5]">REMOVE FOUR SCREWS</p></div></div>{[["-top-4","-left-4"],["-top-4","-right-4"],["-bottom-4","-left-4"],["-bottom-4","-right-4"]].map(([a,b],i)=><button key={i} aria-label={`Remove screw ${i+1}`} disabled={screws.includes(i)} onClick={()=>unscrew(i)} className={`absolute ${a} ${b} grid h-12 w-12 place-items-center rounded-full border-[5px] border-[#596d83] text-2xl font-black transition-transform active:scale-90 ${screws.includes(i)?"bg-[#273444] text-[#53657b]":"animate-pulse bg-[#ffc300] text-[#000814] shadow-[0_0_16px_#ffc30088]"}`}>{screws.includes(i)?"✓":"+"}</button>)}</> : <div className="grid grid-cols-3 gap-3 sm:gap-4">{CELL_NAMES.map((name,i) => <button key={name} onClick={()=>phase === "detect"?inspect(i):swap(i)} disabled={phase === "replace" && i !== FAULT} className={`relative flex min-h-[98px] flex-col items-center justify-center rounded-xl border-2 transition-transform active:scale-95 ${i === FAULT && phase === "detect" ? "animate-pulse border-rose-400 bg-rose-950/60 shadow-[0_0_24px_#ff4f6c66]" : i===FAULT && phase==="replace" ? "border-dashed border-[#ffd60a] bg-[#1a2c3c]" : "border-[#4a8299] bg-[#123d50]"}`}><BatteryCharging size={30} className={i===FAULT && phase === "detect" ? "text-rose-400" : "text-[#78e4be]"}/><span className="mt-2 text-xs font-black">{name}</span><span className={`text-[10px] font-bold ${i===FAULT && phase==="detect"?"text-rose-300":"text-[#97b5c7]"}`}>{i===FAULT?(phase==="detect"?"⚡ OVERHEAT":"EMPTY SOCKET"):"NOMINAL"}</span></button>)}</div>}
          </div>
          {phase === "replace" && <button onClick={()=>{setSelectedSpare(true);setFeedback("SPARE PICKED UP! Click the highlighted EMPTY SOCKET.");}} className={`mx-auto mt-5 flex w-full max-w-xs items-center justify-center gap-3 rounded-xl border-2 p-4 font-black ${selectedSpare?"border-[#ffd60a] bg-[#3b320e] text-[#ffd60a]":"border-[#4b8cb0] bg-[#003566] text-white"}`}><BatteryCharging size={22}/> {selectedSpare ? "SPARE READY · CLICK EMPTY SOCKET" : "PICK UP SPARE BATTERY"}</button>}
        </div>}
        {phase === "sync" && <div className="relative z-10 w-full max-w-xl"><div className="mb-6 text-center"><Zap className="mx-auto mb-2 text-[#ffd60a]" size={46}/><h2 className="text-2xl font-black">GRID RESTART</h2><p className="mt-2 text-sm text-[#b6cbdf]">Time the electric pulse. Hit the green zone three times!</p></div><div className="mb-3 flex justify-between text-xs font-black text-[#ffd60a]"><span>SYNC METER</span><span>{pulses}/3 PULSES</span></div><div className="relative h-16 overflow-hidden rounded-2xl border-2 border-[#537492] bg-[#09233a]"><div className="absolute inset-y-0 bg-[#67df9b44]" style={{left:`${50 - config.syncWidth/2}%`,width:`${config.syncWidth}%`}}/><div className="absolute inset-y-0 border-x-2 border-[#74ffaa]" style={{left:`${50-config.syncWidth/2}%`,width:`${config.syncWidth}%`}}/><div className="absolute inset-y-1 w-2 -translate-x-1/2 rounded bg-[#ffd60a] shadow-[0_0_20px_#ffc300]" style={{left:`${needle}%`}}/></div><div className="mt-3 flex justify-center gap-2">{[0,1,2].map(i=><div key={i} className={`h-4 w-16 rounded-full ${i<pulses?"bg-[#74ffaa]":"bg-[#254762]"}`}/>)}</div><button onClick={sync} className="mt-8 w-full rounded-xl bg-[#ffc300] p-5 text-lg font-black text-[#000814] shadow-[0_0_24px_#ffc30044]"><Zap className="mr-2 inline"/> SPACE / SYNC!</button><p className="mt-3 text-center text-xs text-slate-400">Watch the yellow bar — tap when it's inside the green center.</p></div>}
      </div>
      <div role="status" aria-live="polite" className="min-h-7 text-center text-sm font-bold text-[#ffd60a]">{feedback}</div>
      <div className="flex items-center justify-between gap-3 text-xs text-[#a7bfd4]"><span><ShieldCheck size={14} className="mr-1 inline text-[#75e0a1]"/> Damaged batteries must be isolated before replacement.</span><button onClick={reset} disabled={busy} className="flex shrink-0 items-center gap-1 font-bold text-[#ffd60a]"><RotateCcw size={15}/> RESTART</button></div>
    </main>
    {help && <div className="fixed inset-0 z-[95] grid place-items-center bg-[#000814ee] p-4"><div className="w-full max-w-md rounded-2xl border border-[#ffc30088] bg-[#001d3d] p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">HOW TO PLAY</h2><button onClick={()=>setHelp(false)} aria-label="Close instructions"><X size={21}/></button></div><div className="space-y-3">{instructions.map((a,i)=><div key={a.heading}><p className="text-sm font-bold text-[#ffd60a]">{i+1}. {a.heading}</p><p className="text-xs leading-5 text-slate-300">{a.desc}</p></div>)}</div><button onClick={()=>setHelp(false)} className="mt-6 w-full rounded-xl bg-[#ffc300] p-3 font-black text-[#000814]">GOT IT!</button></div></div>}
  </div>;
}
