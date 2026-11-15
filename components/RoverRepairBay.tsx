"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, CircleHelp, Clock3, RotateCcw, ScanLine, ShieldAlert, Wrench, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Phase = "intro" | "scan" | "wires" | "calibrate" | "won" | "lost";
type Wire = "cyan" | "yellow" | "green";
const COLORS: Record<Wire,string> = { cyan: "#72dafa", yellow: "#ffd60a", green: "#81e6a4" };
const WIRES: Wire[] = ["cyan", "yellow", "green"];
const config = {
  safe: { timer: 190, health: 5, scanRadius: 8, calibrateRadius: 12, speed: 37 },
  risky: { timer: 155, health: 4, scanRadius: 7, calibrateRadius: 10, speed: 45 },
  dangerous: { timer: 130, health: 3, scanRadius: 6, calibrateRadius: 9, speed: 52 },
};
const FAULTS = [19, 52, 82];

export default function RoverRepairBay({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const difficulty = config[strategy];
  const [phase, setPhase] = useState<Phase>("intro");
  const [help, setHelp] = useState(false);
  const [time, setTime] = useState(difficulty.timer);
  const [health, setHealth] = useState(difficulty.health);
  const [cursor, setCursor] = useState(4);
  const [scanFound, setScanFound] = useState<number[]>([]);
  const [selectedWire, setSelectedWire] = useState<Wire | null>(null);
  const [connected, setConnected] = useState<Wire[]>([]);
  const [calibration, setCalibration] = useState(0);
  const [message, setMessage] = useState("Get your tools ready. The rover needs you!");
  const [flash, setFlash] = useState(false);
  const phaseRef = useRef<Phase>("intro");
  const cursorRef = useRef(4);
  const directionRef = useRef(1);
  const foundRef = useRef<number[]>([]);
  const connectionsRef = useRef<Wire[]>([]);
  const calibrationRef = useRef(0);
  const healthRef = useRef(difficulty.health);
  const timeRef = useRef(difficulty.timer);
  const lastRef = useRef(0);
  const cooldownRef = useRef(0);
  const pauseRef = useRef(false);

  const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
  const loseHealth = useCallback((reason: string) => {
    if (phaseRef.current === "won" || phaseRef.current === "lost") return;
    healthRef.current = Math.max(0, healthRef.current - 1);
    setHealth(healthRef.current);
    setMessage(reason);
    setFlash(true);
    if (healthRef.current === 0) changePhase("lost");
  }, []);
  const restart = () => {
    cursorRef.current = 4; directionRef.current = 1; foundRef.current = [];
    connectionsRef.current = []; calibrationRef.current = 0;
    healthRef.current = difficulty.health; timeRef.current = difficulty.timer;
    cooldownRef.current = 0; lastRef.current = 0; pauseRef.current = false;
    setCursor(4); setScanFound([]); setConnected([]); setSelectedWire(null);
    setCalibration(0); setHealth(difficulty.health); setTime(difficulty.timer);
    setHelp(false); setFlash(false); setMessage("Get your tools ready. The rover needs you!");
    changePhase("intro");
  };
  const start = () => { setMessage("STEP 1: Press SCAN when the beam reaches each red fault!"); changePhase("scan"); };

  const action = useCallback(() => {
    if (busy || pauseRef.current || Date.now() < cooldownRef.current) return;
    if (phaseRef.current !== "scan" && phaseRef.current !== "calibrate") return;
    cooldownRef.current = Date.now() + 300;
    const pos = cursorRef.current;
    if (phaseRef.current === "scan") {
      const target = FAULTS.find((spot, i) => !foundRef.current.includes(i) && Math.abs(pos - spot) <= difficulty.scanRadius);
      if (target === undefined) { loseHealth("Missed! Time the scan when the beam crosses a red fault."); return; }
      const idx = FAULTS.indexOf(target);
      foundRef.current = [...foundRef.current, idx];
      setScanFound([...foundRef.current]);
      setMessage(`FAULT ${foundRef.current.length}/3 FOUND! ${foundRef.current.length < 3 ? "Scan the next red marker." : "Scanner complete. Reconnect the cables!"}`);
      if (foundRef.current.length === 3) changePhase("wires");
    } else {
      const targets = [28, 68, 45];
      const target = targets[calibrationRef.current];
      if (Math.abs(pos - target) > difficulty.calibrateRadius) { loseHealth("Outside the green zone! Wait for the moving needle."); return; }
      calibrationRef.current += 1;
      setCalibration(calibrationRef.current);
      setMessage(calibrationRef.current === 3 ? "ROVER REPAIRED! ALL SYSTEMS ONLINE." : `Motor tuned ${calibrationRef.current}/3. Hit the next green zone!`);
      cursorRef.current = 3; directionRef.current = 1; setCursor(3);
      if (calibrationRef.current === 3) changePhase("won");
    }
  }, [busy, difficulty.scanRadius, difficulty.calibrateRadius, loseHealth]);

  const connectWire = (end: Wire) => {
    if (phaseRef.current !== "wires" || busy || pauseRef.current || !selectedWire || connectionsRef.current.includes(end)) return;
    if (end !== selectedWire) { loseHealth("Wrong cable! Match the SAME color on both sides."); setSelectedWire(null); return; }
    connectionsRef.current = [...connectionsRef.current, end];
    setConnected([...connectionsRef.current]); setSelectedWire(null);
    setMessage(`CABLE CONNECTED ${connectionsRef.current.length}/3!`);
    if (connectionsRef.current.length === 3) {
      cursorRef.current = 3; directionRef.current = 1; setCursor(3);
      setMessage("STEP 3: Stop the moving needle in each green target!");
      changePhase("calibrate");
    }
  };

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && ["scan", "calibrate"].includes(phaseRef.current)) {
        e.preventDefault(); if (!e.repeat) action();
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [action]);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, .05);
      lastRef.current = now;
      if (!pauseRef.current && !busy && (phaseRef.current === "scan" || phaseRef.current === "calibrate")) {
        cursorRef.current += dt * difficulty.speed * directionRef.current;
        if (cursorRef.current >= 97) { cursorRef.current = 97; directionRef.current = -1; }
        if (cursorRef.current <= 3) { cursorRef.current = 3; directionRef.current = 1; }
        setCursor(cursorRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lastRef.current = 0; };
  }, [difficulty.speed, busy]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pauseRef.current || busy || !["scan", "wires", "calibrate"].includes(phaseRef.current)) return;
      timeRef.current = Math.max(0, timeRef.current - 1);
      setTime(timeRef.current);
      if (timeRef.current <= 0) { setMessage("The repair window has closed!"); changePhase("lost"); }
    }, 1000);
    return () => window.clearInterval(id);
  }, [busy]);
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(false), 350); return () => clearTimeout(t); }, [flash]);
  const target = [28, 68, 45][Math.min(calibration,2)];
  const playable = phase === "scan" || phase === "wires" || phase === "calibrate";
  const showHelp = () => { pauseRef.current = true; setHelp(true); };
  const hideHelp = () => { pauseRef.current = false; setHelp(false); lastRef.current = 0; };
  const clock = `${String(Math.floor(time / 60)).padStart(2,"0")}:${String(time%60).padStart(2,"0")}`;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
      <header className="flex items-center justify-between gap-2 border-b border-[#244466] bg-[#001D3D] px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFC300] text-[#000814]"><Wrench size={23}/></span><div><p className="text-[10px] font-bold tracking-[.2em] text-[#FFD60A]">DAY 11 · ROVER MAINTENANCE</p><h2 className="text-lg font-black tracking-tight sm:text-2xl">ROVER REPAIR BAY</h2></div></div>
        <div className="flex items-center gap-2"><span className="flex items-center gap-1 rounded-lg border border-[#42627f] px-2 py-2 text-xs font-black"><Clock3 size={14}/>{clock}</span><button aria-label="How to play" onClick={showHelp} className="rounded-lg border border-[#42627f] p-2"><CircleHelp size={19}/></button><button aria-label="Close" onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]"><X/></button></div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#FFD60A]"><ShieldAlert size={17}/> REPAIR KITS <span className="text-white">{"● ".repeat(health)}<span className="text-[#52677e]">{"○ ".repeat(difficulty.health-health)}</span></span></div><span className="text-xs text-[#B8CADD]">{strategy.toUpperCase()} STRATEGY</span></div>
        <div className="grid grid-cols-3 gap-2">{[{n:"01",t:"SCAN",done:scanFound.length===3,active:phase==="scan"},{n:"02",t:"REWIRE",done:connected.length===3,active:phase==="wires"},{n:"03",t:"CALIBRATE",done:calibration===3,active:phase==="calibrate"}].map(item=><div key={item.n} className={`rounded-xl border px-2 py-3 text-center text-xs font-black sm:text-sm ${item.done?"border-[#81e6a4] bg-[#103b3a] text-[#81e6a4]":item.active?"border-[#FFC300] bg-[#282e34] text-[#FFD60A]":"border-[#27405c] bg-[#091b31] text-[#7d94ae]"}`}>{item.done?"✓":item.n} · {item.t}</div>)}</div>
        <section className={`relative flex min-h-[280px] flex-1 flex-col justify-between overflow-hidden rounded-2xl border bg-[#07192d] p-4 sm:min-h-[330px] sm:p-6 ${flash?"border-[#f87171]":"border-[#30516c]"}`}>
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(#a8d6ff 1px,transparent 1px)",backgroundSize:"29px 29px"}}/>
          <div className="relative z-10 flex items-center justify-between"><span className="text-[10px] font-black tracking-[.2em] text-[#87abd0]">MAINTENANCE CAMERA // LIVE</span><span className="flex items-center gap-1 text-xs text-[#81e6a4]"><Activity size={13}/> SYSTEM {phase==="won"?"ONLINE":"CHECK"}</span></div>
          <svg className="relative z-10 mx-auto w-full max-w-2xl" viewBox="0 0 660 290" aria-label="Illustration of a lunar rover on a repair platform"><defs><linearGradient id="roverBody" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6e8dac"/><stop offset="1" stopColor="#244666"/></linearGradient></defs><ellipse cx="330" cy="255" rx="285" ry="20" fill="#002342" opacity=".7"/><path d="M45 257 H610" stroke="#55708d" strokeWidth="6" strokeLinecap="round"/>{[170,485].map(x=><g key={x}><circle cx={x} cy="221" r="43" fill="#0a1428" stroke="#9aaebf" strokeWidth="9"/><circle cx={x} cy="221" r="23" fill="#173958" stroke="#FFC300" strokeWidth="5"/><path d={`M${x-19} 221h38 M${x} 202v38`} stroke="#b7d2e6" strokeWidth="4"/></g>)}<path d="M135 146 L168 111 H488 L522 147 V196 H135Z" fill="url(#roverBody)" stroke="#b2d0e3" strokeWidth="4"/><rect x="183" y="129" width="120" height="49" rx="8" fill="#001D3D" stroke="#FFC300" strokeWidth="3"/><path d="M197 154h25m10 0h15m10 0h25" stroke="#72dafa" strokeWidth="4" strokeLinecap="round"/><rect x="321" y="130" width="158" height="49" rx="7" fill="#00162b" stroke="#6892b4" strokeWidth="3"/><path d="M345 143h106M345 155h74M345 166h97" stroke="#81e6a4" strokeWidth="4"/><path d="M330 110V55h6" stroke="#b8c9d8" strokeWidth="8"/><rect x="300" y="43" width="70" height="25" rx="7" fill="#FFC300" stroke="#fff2ac" strokeWidth="3"/><circle cx="325" cy="55" r="7" fill="#003566"/><rect x="125" y="113" width="42" height="17" rx="4" fill="#ffc300"/><path d="M488 133l43 -20" stroke="#c1d2df" strokeWidth="6"/><circle cx="531" cy="114" r="11" fill="#79cfff"/><rect x="216" y="184" width="220" height="16" rx="7" fill="#001d3d" stroke="#516e87" strokeWidth="2"/>{phase==="scan" && FAULTS.filter((_,i)=>!scanFound.includes(i)).map((spot,i)=><g key={spot}><circle cx={140+spot*3.8} cy={150+(i%2)*13} r="13" fill="#fa5369" opacity=".25"/><circle cx={140+spot*3.8} cy={150+(i%2)*13} r="7" fill="#fa5369"/></g>)}{phase==="won" && <g><circle cx="330" cy="75" r="38" fill="#165e44" opacity=".8"/><path d="M312 75l12 12 24 -25" stroke="#81e6a4" strokeWidth="9" fill="none" strokeLinecap="round"/></g>}</svg>
          <div className="relative z-10 rounded-lg border border-[#304d69] bg-[#001D3D]/90 px-3 py-3 text-center text-sm font-bold text-[#FFD60A]" role="status" aria-live="polite">{message}</div>
        </section>
        {phase === "scan" && <section className="rounded-2xl border border-[#355470] bg-[#001D3D] p-4 sm:p-5"><h3 className="mb-1 text-lg font-black"><ScanLine className="mr-2 inline text-[#FFD60A]"/>FIND THE 3 FAULTS</h3><p className="mb-4 text-sm text-[#b9cde0]">Hit <b className="text-white">SCAN</b> when the moving white beam reaches a red fault marker.</p><div className="relative mb-4 h-16 rounded-lg bg-[#081426] px-3"><div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 bg-[#496482]"/>{FAULTS.map((pos,i)=><div key={i} className={`absolute top-1/2 h-8 w-3 -translate-x-1/2 -translate-y-1/2 rounded ${scanFound.includes(i)?"bg-[#81e6a4]":"bg-[#ff6176] shadow-[0_0_20px_#fa536999]"}`} style={{left:`${pos}%`}}/>)}<div className="absolute top-2 bottom-2 w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_15px_#fff]" style={{left:`${cursor}%`}}/></div><button onClick={action} disabled={busy} className="w-full rounded-xl bg-[#FFC300] p-4 text-lg font-black text-[#000814]">SCAN NOW · SPACE <span className="text-sm">({scanFound.length}/3)</span></button></section>}
        {phase === "wires" && <section className="rounded-2xl border border-[#355470] bg-[#001D3D] p-4 sm:p-5"><h3 className="mb-1 text-lg font-black"><Zap className="mr-2 inline text-[#FFD60A]"/>RECONNECT THE CABLES</h3><p className="mb-4 text-sm text-[#b9cde0]">Click a loose cable on the left, then click the <b className="text-white">same color</b> socket on the right. The sockets are mixed up!</p><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="space-y-3">{WIRES.map(w=><button key={w} disabled={connected.includes(w)} onClick={()=>setSelectedWire(w)} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-4 text-sm font-black ${selectedWire===w?"border-white bg-[#244462]":"border-[#456582] bg-[#0d2944]"} disabled:opacity-40`}><span className="h-4 w-4 rounded-full" style={{background:COLORS[w]}}/>{w.toUpperCase()} {connected.includes(w)?"✓":""}</button>)}</div><div className="text-center text-2xl text-[#FFD60A]">→</div><div className="space-y-3">{(["green","cyan","yellow"] as Wire[]).map(w=><button key={w} disabled={connected.includes(w)} onClick={()=>connectWire(w)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#456582] bg-[#0d2944] px-3 py-4 text-sm font-black disabled:opacity-40"><span className="h-4 w-4 rounded-full" style={{background:COLORS[w]}}/>{connected.includes(w)?"CONNECTED":`${w.toUpperCase()} SOCKET`}</button>)}</div></div><p className="mt-3 text-center text-sm text-[#FFD60A]">{connected.length}/3 CABLES CONNECTED</p></section>}
        {phase === "calibrate" && <section className="rounded-2xl border border-[#355470] bg-[#001D3D] p-4 sm:p-5"><h3 className="mb-1 text-lg font-black"><Activity className="mr-2 inline text-[#FFD60A]"/>TUNE THE ROVER MOTOR</h3><p className="mb-4 text-sm text-[#b9cde0]">Press <b className="text-white">LOCK</b> when the moving white needle is inside the green zone. Get 3 perfect locks!</p><div className="relative mb-4 h-16 rounded-lg bg-[#081426] px-3"><div className="absolute inset-x-3 top-1/2 h-2 -translate-y-1/2 rounded bg-[#496482]"/><div className="absolute top-3 bottom-3 rounded-lg bg-[#28b685]/60 shadow-[0_0_15px_#42d8a888]" style={{left:`${target-difficulty.calibrateRadius}%`,width:`${difficulty.calibrateRadius*2}%`}}/><div className="absolute top-2 bottom-2 w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_15px_#fff]" style={{left:`${cursor}%`}}/></div><button onClick={action} disabled={busy} className="w-full rounded-xl bg-[#FFC300] p-4 text-lg font-black text-[#000814]">LOCK CALIBRATION · SPACE <span className="text-sm">({calibration}/3)</span></button></section>}
        {playable && <button onClick={restart} disabled={busy} className="mx-auto flex items-center gap-2 text-xs font-bold text-[#8eafd2] hover:text-white"><RotateCcw size={15}/> RESTART REPAIR</button>}
        {(phase === "intro" || phase === "won" || phase === "lost" || help) && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814]/95 p-4"><div className="w-full max-w-md rounded-2xl border border-[#FFC300]/50 bg-[#001D3D] p-6 text-center shadow-2xl sm:p-8">{phase === "won" && !help ? <><CheckCircle2 className="mx-auto mb-3 text-[#81e6a4]" size={55}/><h3 className="mb-3 text-3xl font-black">ROVER SAVED!</h3><p className="mb-5 text-sm leading-6 text-[#bdd1e5]">You found three faults, repaired the control cables, and calibrated the motor. Ready to explore!</p><button disabled={busy} onClick={onComplete} className="w-full rounded-xl bg-[#FFC300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></> : phase === "lost" && !help ? <><ShieldAlert className="mx-auto mb-3 text-[#ff6176]" size={55}/><h3 className="mb-3 text-3xl font-black">REPAIR FAILED</h3><p className="mb-5 text-sm text-[#bdd1e5]">No worries, chief engineer. The rover can be repaired on another attempt!</p><button onClick={restart} className="w-full rounded-xl bg-[#FFC300] px-5 py-4 font-black text-[#000814]">TRY AGAIN</button></> : <><Wrench className="mx-auto mb-3 text-[#FFD60A]" size={48}/><h3 className="mb-2 text-2xl font-black">ROVER REPAIR SCHOOL</h3><p className="mb-5 text-sm text-[#bdd1e5]">Three quick challenges. Learn the controls in seconds!</p><div className="mb-5 space-y-3 text-left text-sm"><p><b className="text-[#FFD60A]">01 · SCAN:</b> Press Space or SCAN when the white beam touches a red fault.</p><p><b className="text-[#FFD60A]">02 · REWIRE:</b> Click a colored cable, then its matching socket.</p><p><b className="text-[#FFD60A]">03 · CALIBRATE:</b> Press Space or LOCK when the needle crosses the green target.</p></div><p className="mb-5 text-xs text-[#8cabc7]">Misses cost repair kits. Timer starts when you begin. Real rover maintenance uses testing, diagnostics, repairs and verification.</p><button onClick={help?hideHelp:start} className="w-full rounded-xl bg-[#FFC300] px-5 py-4 font-black text-[#000814]">{help?"BACK TO GAME":"LET'S FIX THE ROVER!"}</button></>}</div></div>}
      </main>
    </div>
  );
}
