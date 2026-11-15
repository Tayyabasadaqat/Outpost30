"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BatteryCharging, Check, CheckCircle2, Clock3, Compass, DoorOpen, Fuel, HelpCircle, LockKeyhole, PackageCheck, Play, RadioTower, RotateCcw, ShieldAlert, Sparkles, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Task = "fuel" | "wiring" | "cargo" | "signal";
type Phase = "tutorial" | "explore" | "task" | "won" | "lost";
type Position = { x: number; y: number };
const CFG = { safe: { time: 270, lives: 5, speed: 34, tolerance: 10 }, risky: { time: 235, lives: 4, speed: 39, tolerance: 8 }, dangerous: { time: 205, lives: 3, speed: 43, tolerance: 7 } };
const STATIONS: { id: Task; x: number; y: number; name: string; short: string; color: string }[] = [
  { id: "fuel", x: 23, y: 29, name: "FUEL SYSTEM", short: "Balance fuel pressure", color: "#fbc629" },
  { id: "wiring", x: 77, y: 29, name: "POWER CONTROL", short: "Reconnect circuits", color: "#75d5ff" },
  { id: "cargo", x: 23, y: 73, name: "CARGO LOCK", short: "Secure supply containers", color: "#9ce6ad" },
  { id: "signal", x: 77, y: 73, name: "EARTH LINK", short: "Align the transmitter", color: "#d8b3ff" },
];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const COLORS = ["#ffc300", "#67cdfd", "#96e8ab"];

export default function LaunchReadyFinalCountdown({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const cfg = CFG[strategy];
  const [phase, setPhase] = useState<Phase>("tutorial");
  const [task, setTask] = useState<Task>("fuel");
  const [position, setPosition] = useState<Position>({ x: 50, y: 51 });
  const [done, setDone] = useState<Task[]>([]);
  const [time, setTime] = useState(cfg.time);
  const [health, setHealth] = useState(cfg.lives);
  const [message, setMessage] = useState("EXPLORE THE HANGAR · INSPECT ALL FOUR SYSTEMS");
  const [help, setHelp] = useState(false);
  const [fuelLevel, setFuelLevel] = useState(8);
  const [fuelHold, setFuelHold] = useState(false);
  const [fuelDone, setFuelDone] = useState(false);
  const [wireSelection, setWireSelection] = useState<number | null>(null);
  const [wires, setWires] = useState<number[]>([]);
  const [scan, setScan] = useState(0);
  const [cargoLocks, setCargoLocks] = useState(0);
  const [angle, setAngle] = useState(24);
  const [alignment, setAlignment] = useState(0);
  const [signalOn, setSignalOn] = useState(false);
  const keys = useRef({ l: false, r: false, u: false, d: false });
  const posRef = useRef<Position>({ x: 50, y: 51 });
  const phaseRef = useRef<Phase>("tutorial");
  const taskRef = useRef<Task>("fuel");
  const helpRef = useRef(false);
  const busyRef = useRef(busy);
  const last = useRef(0);
  const display = useRef(0);
  const scanRef = useRef(0);
  const fuelRef = useRef(8);
  const angleRef = useRef(24);
  const alignRef = useRef(0);
  const holdingRef = useRef(false);
  const signalRef = useRef(false);
  const doneRef = useRef<Task[]>([]);
  const healthRef = useRef(cfg.lives);
  const timeRef = useRef(cfg.time);
  const taskComplete = useRef(false);
  const faultCooldown = useRef(0);
  const taskOpen = useRef(false);
  const updatePhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { helpRef.current = help; }, [help]);

  const reset = useCallback(() => {
    posRef.current = { x: 50, y: 51 }; keys.current = { l: false, r: false, u: false, d: false };
    phaseRef.current = "tutorial"; taskRef.current = "fuel"; doneRef.current = [];
    healthRef.current = cfg.lives; timeRef.current = cfg.time; taskComplete.current = false;
    fuelRef.current = 8; scanRef.current = 0; angleRef.current = 24; alignRef.current = 0;
    holdingRef.current = false; signalRef.current = false; taskOpen.current = false;
    setPhase("tutorial"); setTask("fuel"); setPosition({ x: 50, y: 51 }); setDone([]);
    setTime(cfg.time); setHealth(cfg.lives); setMessage("EXPLORE THE HANGAR · INSPECT ALL FOUR SYSTEMS");
    setFuelLevel(8); setFuelHold(false); setFuelDone(false); setWireSelection(null); setWires([]);
    setScan(0); setCargoLocks(0); setAngle(24); setAlignment(0); setSignalOn(false); setHelp(false);
  }, [cfg.lives, cfg.time]);

  const openTask = useCallback(() => {
    if (phaseRef.current !== "explore" || helpRef.current || busyRef.current) return;
    const station = STATIONS.find(s => !doneRef.current.includes(s.id) && dist(posRef.current, s) < 17);
    if (!station) { setMessage("MOVE CLOSER TO A GLOWING STATION AND PRESS E!"); return; }
    taskRef.current = station.id; taskOpen.current = true; taskComplete.current = false;
    setTask(station.id); setMessage(`${station.name} · PERFORM FINAL INSPECTION`);
    fuelRef.current = 8; holdingRef.current = false; setFuelHold(false); setFuelLevel(8); setFuelDone(false);
    setWires([]); setWireSelection(null); scanRef.current = 0; setScan(0); setCargoLocks(0);
    angleRef.current = 24; alignRef.current = 0; signalRef.current = false;
    setAngle(24); setAlignment(0); setSignalOn(false);
    updatePhase("task");
  }, []);

  const mistake = useCallback((reason: string) => {
    if (faultCooldown.current > 0 || phaseRef.current !== "task") return;
    faultCooldown.current = .55;
    healthRef.current = Math.max(0, healthRef.current - 1);
    setHealth(healthRef.current); setMessage(reason);
    if (healthRef.current === 0) { holdingRef.current = false; updatePhase("lost"); }
  }, []);

  const finishTask = useCallback(() => {
    if (phaseRef.current !== "task" || taskComplete.current) return;
    taskComplete.current = true;
    const id = taskRef.current;
    doneRef.current = [...doneRef.current, id]; setDone([...doneRef.current]);
    setMessage(`${STATIONS.find(s => s.id === id)?.name} VERIFIED! ${doneRef.current.length}/4 CHECKS COMPLETE`);
    holdingRef.current = false; signalRef.current = false;
    if (doneRef.current.length === 4) { updatePhase("won"); }
    else { updatePhase("explore"); taskOpen.current = false; }
  }, []);

  const releaseFuel = useCallback(() => {
    holdingRef.current = false; setFuelHold(false);
    if (phaseRef.current !== "task" || taskRef.current !== "fuel") return;
    const val = fuelRef.current;
    if (val >= 70 - cfg.tolerance && val <= 70 + cfg.tolerance) { setFuelDone(true); finishTask(); }
    else { mistake("PRESSURE OUT OF RANGE! AIM FOR THE GREEN BAND."); fuelRef.current = 8; setFuelLevel(8); }
  }, [cfg.tolerance, finishTask, mistake]);

  const lockCargo = useCallback(() => {
    if (phaseRef.current !== "task" || taskRef.current !== "cargo") return;
    if (Math.abs(scanRef.current - 50) <= cfg.tolerance + 5) {
      setCargoLocks(prev => { const next = prev + 1; if (next >= 3) queueMicrotask(finishTask); return next; });
      scanRef.current = 0; setScan(0); setMessage("CARGO CLAMP SECURED! GET READY FOR THE NEXT ONE.");
    } else mistake("MISS! LOCK THE CLAMP WHEN THE SCANNER ENTERS THE GREEN ZONE.");
  }, [cfg.tolerance, finishTask, mistake]);

  const chooseWire = (id: number, left: boolean) => {
    if (phaseRef.current !== "task" || taskRef.current !== "wiring") return;
    if (left) { setWireSelection(id); return; }
    if (wireSelection === null) { setMessage("CLICK A COLORED CABLE ON THE LEFT FIRST."); return; }
    if (wireSelection !== id) { mistake("WRONG SOCKET! MATCH THE SAME COLORS."); setWireSelection(null); return; }
    if (!wires.includes(id)) { const next = [...wires, id]; setWires(next); if (next.length === 3) finishTask(); }
    setWireSelection(null);
  };

  const activate = useCallback(() => {
    if (phaseRef.current === "tutorial") { updatePhase("explore"); return; }
    if (phaseRef.current === "explore") { openTask(); return; }
    if (phaseRef.current === "task" && taskRef.current === "cargo") lockCargo();
  }, [openTask, lockCargo]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", "e", " "].includes(k)) e.preventDefault();
      if (k === "a" || k === "arrowleft") keys.current.l = true;
      if (k === "d" || k === "arrowright") keys.current.r = true;
      if (k === "w" || k === "arrowup") keys.current.u = true;
      if (k === "s" || k === "arrowdown") keys.current.d = true;
      if (e.repeat || helpRef.current) return;
      if (k === "e" || k === "enter") activate();
      if (k === " " && phaseRef.current === "task" && taskRef.current === "cargo") lockCargo();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") keys.current.l = false;
      if (k === "d" || k === "arrowright") keys.current.r = false;
      if (k === "w" || k === "arrowup") keys.current.u = false;
      if (k === "s" || k === "arrowdown") keys.current.d = false;
    };
    const blur = () => { keys.current = { l: false, r: false, u: false, d: false }; holdingRef.current = false; signalRef.current = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [activate, lockCargo]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - (last.current || now)) / 1000, .05); last.current = now;
      if (!helpRef.current && !busyRef.current) {
        faultCooldown.current = Math.max(0, faultCooldown.current - dt);
        if (phaseRef.current === "explore") {
          const dx = Number(keys.current.r) - Number(keys.current.l);
          const dy = Number(keys.current.d) - Number(keys.current.u);
          if (dx || dy) { const len = Math.hypot(dx, dy); posRef.current = { x: clamp(posRef.current.x + dx / len * cfg.speed * dt, 6, 94), y: clamp(posRef.current.y + dy / len * cfg.speed * dt, 12, 88) }; }
        }
        if (phaseRef.current === "task") {
          if (taskRef.current === "fuel" && holdingRef.current) {
            fuelRef.current = Math.min(100, fuelRef.current + dt * 31);
            if (fuelRef.current >= 99) { holdingRef.current = false; setFuelHold(false); mistake("OVERPRESSURE! RELEASE IN THE GREEN ZONE."); fuelRef.current = 8; }
          }
          if (taskRef.current === "cargo") scanRef.current = (Math.sin(now / 520) * .5 + .5) * 100;
          if (taskRef.current === "signal" && signalRef.current) {
            const target = 66 + Math.sin(now / 1500) * 9;
            if (Math.abs(angleRef.current - target) < cfg.tolerance + 4) {
              alignRef.current = Math.min(2.8, alignRef.current + dt);
              if (alignRef.current >= 2.8) finishTask();
            } else alignRef.current = Math.max(0, alignRef.current - dt * 1.5);
          }
        }
        if (phaseRef.current === "explore" || phaseRef.current === "task") {
          timeRef.current = Math.max(0, timeRef.current - dt);
          if (timeRef.current <= 0) { updatePhase("lost"); setMessage("PREPARATION WINDOW EXPIRED!"); }
        }
      }
      if (now - display.current > 45) {
        display.current = now; setPosition({ ...posRef.current }); setTime(Math.ceil(timeRef.current));
        if (phaseRef.current === "task") {
          if (taskRef.current === "fuel") setFuelLevel(fuelRef.current);
          else if (taskRef.current === "cargo") setScan(scanRef.current);
          else if (taskRef.current === "signal") { setAlignment(alignRef.current); }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); last.current = 0; };
  }, [cfg.speed, cfg.tolerance, finishTask, mistake]);

  const nearby = STATIONS.find(s => !done.includes(s.id) && dist(position, s) < 17);
  const active = STATIONS.find(s => s.id === task)!;
  const clock = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
  const targetAngle = 66 + Math.sin(Date.now() / 1500) * 9;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#345372] bg-[#001d3d] px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Zap size={23}/></div><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 29 · MISSION PREPARATION</p><h1 className="text-base font-black sm:text-2xl">LAUNCH READY <span className="text-[#ffc300]">// FINAL COUNTDOWN</span></h1></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><span className="hidden text-xs font-black text-[#ffd60a] sm:inline">SYSTEMS {done.length}/4</span><span className="flex items-center gap-1 rounded-lg border border-[#50708d] p-2 text-xs font-bold"><Clock3 size={15}/>{clock}</span><button onClick={() => setHelp(true)} className="rounded-lg border border-[#50708d] p-2" aria-label="How to play"><HelpCircle size={18}/></button><button onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" aria-label="Close"><X size={20}/></button></div>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col p-3 sm:p-5">
        <div className="mx-auto mb-3 flex w-full max-w-6xl flex-wrap justify-between gap-2 text-xs font-bold"><span className="text-[#d4e7ff]">MISSION: VERIFY EVERY SYSTEM BEFORE DEPARTURE</span><span className="text-[#ffd60a]">REPAIR KITS {"● ".repeat(health)}<span className="text-[#51637b]">{"○ ".repeat(cfg.lives-health)}</span></span></div>
        <div className="relative mx-auto min-h-[270px] w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-[#345779] bg-[#091b30]" style={{backgroundImage:"radial-gradient(#55749455 1px, transparent 1px)",backgroundSize:"34px 34px"}}>
          <div className="pointer-events-none absolute inset-x-[13%] top-[9%] h-[83%] rounded-[40%] border border-[#446483] bg-[#102c48]/45 shadow-[inset_0_0_55px_#000a]"/>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[29%] w-[21%] -translate-x-1/2 -translate-y-1/2 rounded-[48%] border-2 border-[#ffc300aa] bg-[#00284c] shadow-[0_0_42px_#ffc30022]"><div className="flex h-full flex-col items-center justify-center gap-1 text-center"><span className="text-2xl sm:text-4xl">🚀</span><span className="text-[8px] font-black tracking-[.15em] text-[#ffd60a] sm:text-xs">DEPARTURE</span></div></div>
          <div className="pointer-events-none absolute left-[49%] top-[8%] h-[84%] w-[2%] bg-[#456583]/30"/>
          <div className="pointer-events-none absolute left-[8%] top-[48%] h-[4%] w-[84%] bg-[#456583]/30"/>
          {STATIONS.map(s => {
            const complete = done.includes(s.id); const near = nearby?.id === s.id;
            const Icon = s.id === "fuel" ? Fuel : s.id === "wiring" ? BatteryCharging : s.id === "cargo" ? PackageCheck : RadioTower;
            return <div key={s.id} className={`absolute z-10 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-xl border bg-[#001d3ded] p-3 text-center shadow-[0_8px_30px_#0008] sm:w-40 ${near?"animate-pulse border-[#ffd60a]":complete?"border-[#6be5ad]":"border-[#396184]"}`} style={{left:`${s.x}%`,top:`${s.y}%`}}><Icon size={25} color={complete?"#8defad":s.color}/><span className="text-[9px] font-black tracking-wide sm:text-xs">{s.name}</span><span className="text-[9px] font-bold" style={{color:complete?"#8defad":near?"#ffd60a":"#9fbbd3"}}>{complete?"✓ VERIFIED":near?"PRESS E TO INSPECT":"NEEDS INSPECTION"}</span></div>;
          })}
          <div className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{left:`${position.x}%`,top:`${position.y}%`}}><div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#fff] bg-[#2a6184] text-xl shadow-[0_0_25px_#86d9ff88]">👨‍🚀</div><span className="mt-1 rounded bg-[#000814dc] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#ffe78d]">YOU</span></div>
          {(phase === "tutorial" || phase === "won" || phase === "lost" || phase === "task") && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814eb] p-3 backdrop-blur-sm">
            <section className="max-h-full w-full max-w-lg overflow-auto rounded-2xl border border-[#4c6c8a] bg-[#001d3d] p-4 shadow-2xl sm:p-7">
              {phase === "tutorial" && <><p className="mb-1 text-xs font-bold tracking-widest text-[#ffd60a]">MISSION BRIEFING · DAY 29</p><h2 className="text-2xl font-black sm:text-3xl">FINAL LAUNCH CHECKS</h2><p className="mt-3 text-sm leading-6 text-[#d1deeb]">Before tomorrow's final mission, inspect the four hangar systems. Walk up to a station and press <b className="text-[#ffd60a]">E</b> to start a hands-on challenge.</p><div className="my-4 grid grid-cols-2 gap-2 text-xs">{STATIONS.map(s=><div key={s.id} className="rounded-lg border border-[#365978] bg-[#092d50] p-3"><b style={{color:s.color}}>{s.name}</b><p className="mt-1 text-[#b4c8dc]">{s.short}</p></div>)}</div><p className="mb-4 text-xs text-[#b4c8dc]">MOVE: WASD / ARROWS · INTERACT: E · FOUR CHECKS · LIMITED REPAIR KITS</p><button onClick={() => updatePhase("explore")} className="w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><Play className="mr-2 inline" size={19}/> START FINAL INSPECTION</button></>}
              {phase === "task" && <><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">SYSTEM {done.length+1} OF 4</p><h2 className="text-xl font-black">{active.name}</h2></div><button onClick={() => {holdingRef.current=false;signalRef.current=false;updatePhase("explore");}} className="rounded-lg border border-[#4c6c8a] p-2" aria-label="Back to hangar"><X size={18}/></button></div>
                {task === "fuel" && <div className="space-y-4"><p className="text-sm text-[#d3e2f0]">Hold **PRESSURIZE** to fill the fuel line. <b className="text-[#ffc300]">Release inside the GREEN BAND</b> near 70%.</p><div className="relative mt-6 h-10 overflow-hidden rounded-xl bg-[#071c34]"><div className="absolute inset-y-0 bg-[#25895b99]" style={{left:`${70-cfg.tolerance}%`,width:`${cfg.tolerance*2}%`}}/><div className="h-full bg-[#ffc300] transition-none" style={{width:`${fuelLevel}%`}}/><div className="absolute inset-0 grid place-items-center text-sm font-black text-white drop-shadow-lg">{Math.round(fuelLevel)}% PRESSURE</div></div><button onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);holdingRef.current=true;setFuelHold(true);}} onPointerUp={releaseFuel} onPointerCancel={releaseFuel} onLostPointerCapture={()=>{if(holdingRef.current)releaseFuel();}} className="w-full touch-none rounded-xl bg-[#ffc300] px-5 py-4 text-sm font-black text-[#000814]">{fuelHold?"RELEASE IN THE GREEN BAND!":"HOLD TO PRESSURIZE"}</button>{fuelDone&&<p>Fuel verified!</p>}</div>}
                {task === "wiring" && <div className="space-y-4"><p className="text-sm text-[#d3e2f0]">Click a colored cable on the LEFT, then click its matching socket on the RIGHT. Connect all three.</p><div className="grid grid-cols-2 gap-8 rounded-xl border border-[#476180] bg-[#071c34] p-4"><div className="space-y-4">{[0,1,2].map(i=><button key={i} disabled={wires.includes(i)} onClick={()=>chooseWire(i,true)} className={`flex h-12 w-full items-center gap-2 rounded-lg border px-3 text-xs font-bold ${wireSelection===i?"border-white bg-[#385370]":"border-[#34516a]"}`}><span className="h-5 w-5 rounded-full" style={{background:COLORS[i]}}/>{wires.includes(i)?"✓ CONNECTED":`CABLE ${i+1}`}</button>)}</div><div className="space-y-4">{[2,0,1].map(i=><button key={i} disabled={wires.includes(i)} onClick={()=>chooseWire(i,false)} className="flex h-12 w-full items-center gap-2 rounded-lg border border-[#34516a] px-3 text-xs font-bold"><span className="h-5 w-5 rounded-full" style={{background:COLORS[i]}}/>{wires.includes(i)?"✓ CONNECTED":"SOCKET"}</button>)}</div></div><p className="text-xs text-[#8ee6b1]">{wires.length}/3 CIRCUITS CONNECTED</p></div>}
                {task === "cargo" && <div className="space-y-4"><p className="text-sm text-[#d3e2f0]">Secure <b className="text-[#ffc300]">three cargo clamps</b>. Press <b>Space</b> or the button when the white marker crosses the GREEN CENTER.</p><div className="relative mt-8 h-12 rounded-xl border border-[#395675] bg-[#071c34]"><div className="absolute inset-y-0 bg-[#227d55bb]" style={{left:`${50-(cfg.tolerance+5)}%`,width:`${2*(cfg.tolerance+5)}%`}}/><div className="absolute inset-y-[-7px] w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_14px_white]" style={{left:`${scan}%`}}/></div><p className="text-center text-sm font-bold text-[#ffd60a]">CLAMPS LOCKED {cargoLocks}/3</p><button onClick={lockCargo} className="w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">LOCK CARGO · SPACE</button></div>}
                {task === "signal" && <div className="space-y-4"><p className="text-sm text-[#d3e2f0]">Aim the transmitter at Earth's moving signal. Use the arrows to adjust, then <b className="text-[#ffc300]">HOLD SYNC</b> while aligned for 3 seconds.</p><div className="relative mx-auto h-40 w-40 rounded-full border-4 border-[#375e80] bg-[#071c34]"><div className="absolute inset-2 rounded-full border border-dashed border-[#617b95]"/><div className="absolute bottom-1/2 left-1/2 h-[38%] w-1 origin-bottom rounded bg-[#86dfff]" style={{transform:`translateX(-50%) rotate(${targetAngle}deg)`}}/><div className="absolute bottom-1/2 left-1/2 h-[38%] w-1 origin-bottom rounded bg-[#ffc300]" style={{transform:`translateX(-50%) rotate(${angle}deg)`}}/><div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"/></div><div className="flex justify-center gap-3"><button onClick={()=>{angleRef.current=clamp(angleRef.current-5,-70,130);setAngle(angleRef.current);}} className="rounded-xl border border-[#688aaa] bg-[#14395a] px-7 py-3"><ArrowLeft/></button><button onClick={()=>{angleRef.current=clamp(angleRef.current+5,-70,130);setAngle(angleRef.current);}} className="rounded-xl border border-[#688aaa] bg-[#14395a] px-7 py-3"><ArrowRight/></button></div><div className="h-3 overflow-hidden rounded-full bg-[#122d47]"><div className="h-full bg-[#8ee6b1]" style={{width:`${Math.min(100,alignment/2.8*100)}%`}}/></div><button onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);signalRef.current=true;setSignalOn(true);}} onPointerUp={()=>{signalRef.current=false;setSignalOn(false);}} onPointerCancel={()=>{signalRef.current=false;setSignalOn(false);}} onLostPointerCapture={()=>{signalRef.current=false;setSignalOn(false);}} className="w-full touch-none rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">{signalOn?"HOLDING SYNC...":"HOLD TO SYNC EARTH LINK"}</button><p className="text-center text-xs text-[#aac7da]">GOLD = YOUR ANTENNA · BLUE = EARTH SIGNAL</p></div>}
                <div className="mt-5 rounded-lg bg-[#0b2d4e] p-3 text-center text-xs font-bold text-[#ffd60a]" role="status">{message}</div></>}
              {phase === "won" && <div className="text-center"><CheckCircle2 size={62} className="mx-auto mb-4 text-[#9af0b6]"/><p className="text-xs font-bold tracking-widest text-[#ffc300]">ALL FOUR SYSTEMS VERIFIED</p><h2 className="mt-2 text-3xl font-black">READY FOR DAY 30!</h2><p className="my-5 text-sm leading-6 text-[#cfdfec]">Fuel balanced. Power restored. Cargo secured. Earth communications synchronized. Your lunar crew is ready for the final mission.</p><button disabled={busy} onClick={onComplete} className="w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING MISSION...":"MISSION COMPLETE · CONTINUE"} <ArrowRight className="ml-1 inline" size={19}/></button></div>}
              {phase === "lost" && <div className="text-center"><ShieldAlert size={59} className="mx-auto mb-4 text-[#ff8b89]"/><h2 className="text-3xl font-black">INSPECTION INTERRUPTED!</h2><p className="my-5 text-sm text-[#cfdfec]">Repair kits or preparation time ran out. Reboot the hangar checks and try again.</p><button onClick={reset} className="w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><RotateCcw className="mr-2 inline"/> RESTART MISSION</button></div>}
            </section>
          </div>}
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row"><p className="text-xs font-bold tracking-wide text-[#ffc300]" role="status">{phase==="explore"&&nearby?`PRESS E · ${nearby.name}`:message}</p><div className="flex items-center gap-2"><button onClick={()=>{posRef.current.y=clamp(posRef.current.y-9,12,88);setPosition({...posRef.current});}} disabled={phase!=="explore"} className="rounded-lg border border-[#426487] bg-[#092b4e] p-2 disabled:opacity-40" aria-label="Move up">↑</button><button onClick={()=>{posRef.current.x=clamp(posRef.current.x-9,6,94);setPosition({...posRef.current});}} disabled={phase!=="explore"} className="rounded-lg border border-[#426487] bg-[#092b4e] p-2 disabled:opacity-40" aria-label="Move left"><ArrowLeft/></button><button onClick={()=>{posRef.current.y=clamp(posRef.current.y+9,12,88);setPosition({...posRef.current});}} disabled={phase!=="explore"} className="rounded-lg border border-[#426487] bg-[#092b4e] p-2 disabled:opacity-40" aria-label="Move down">↓</button><button onClick={()=>{posRef.current.x=clamp(posRef.current.x+9,6,94);setPosition({...posRef.current});}} disabled={phase!=="explore"} className="rounded-lg border border-[#426487] bg-[#092b4e] p-2 disabled:opacity-40" aria-label="Move right"><ArrowRight/></button><button onClick={openTask} disabled={phase!=="explore"||!nearby} className="rounded-lg bg-[#ffc300] px-4 py-3 text-xs font-black text-[#000814] disabled:opacity-40">E · INSPECT</button></div></div>
        <div className="mx-auto mt-2 flex w-full max-w-6xl gap-1.5">{STATIONS.map(s=><div key={s.id} className={`h-2 flex-1 rounded-full ${done.includes(s.id)?"bg-[#92e4ab]":"bg-[#26486a]"}`}/>)}</div>
      </main>
      {help && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814ef] p-4"><div className="w-full max-w-sm rounded-2xl border border-[#ffc30077] bg-[#001d3d] p-6"><h2 className="mb-3 text-xl font-black">HOW TO PLAY</h2><p className="mb-3 text-sm text-[#d6e6f4]">Walk to each glowing station with WASD or arrow keys. Press E or tap INSPECT. Complete its special challenge to verify the system.</p><p className="mb-4 text-sm font-bold text-[#ffc300]">ALL FOUR STATIONS = DAY 29 COMPLETE</p><button onClick={()=>setHelp(false)} className="w-full rounded-lg bg-[#ffc300] p-3 font-black text-[#000814]">BACK TO MISSION</button></div></div>}
    </div>
  );
}
