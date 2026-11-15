"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flame, HelpCircle, RotateCcw, Snowflake, Target, Thermometer, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Ammo = "cool" | "heat";
type Phase = "intro" | "playing" | "won" | "lost";
type Node = { id: number; x: number; y: number; kind: Ammo; hp: number; maxHp: number; label: string; phase: number; speed: number };
type Shot = { x: number; y: number; vx: number; vy: number; kind: Ammo; age: number };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; maxAge: number; color: string };
type FX = { x: number; y: number; age: number; color: string };
const W = 900, H = 455;
const CONFIG = {
  safe: { time: 155, integrity: 6, speed: 0.67, hp: 2 },
  risky: { time: 135, integrity: 5, speed: 0.91, hp: 2 },
  dangerous: { time: 120, integrity: 4, speed: 1.12, hp: 3 },
};
const ROUNDS = [
  { title: "OVERHEAT ALERT", goal: "Cool down the overheating solar inverter and radiator.", color: "#80d9ff" },
  { title: "FREEZE ALERT", goal: "Warm the frozen oxygen valve and battery.", color: "#ffc300" },
  { title: "THERMAL MELTDOWN", goal: "Save all four systems. Switch between coolant and heat!", color: "#ffd60a" },
];
const roundNodes = (round: number, hp: number, speed: number): Node[] => {
  const specs: Array<[number, number, Ammo, string]> = round === 0
    ? [[450, 155, "cool", "SOLAR INVERTER"], [710, 285, "cool", "RADIATOR"]]
    : round === 1
      ? [[475, 288, "heat", "OXYGEN VALVE"], [720, 145, "heat", "BATTERY"]]
      : [[390, 136, "cool", "INVERTER"], [620, 123, "heat", "OXYGEN VALVE"], [485, 290, "heat", "BATTERY"], [765, 280, "cool", "RADIATOR"]];
  return specs.map(([x, y, kind, label], id) => ({ id, x, y, kind, hp, maxHp: hp, label, phase: id * 2.2 + round * 0.9, speed: speed * (0.75 + id * 0.15) }));
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const colorFor = (kind: Ammo) => kind === "cool" ? "#79dcff" : "#ffc300";

type Sim = { nodes: Node[]; shots: Shot[]; sparks: Spark[]; fx: FX[]; aim: { x: number; y: number }; elapsed: number; cooldown: number; round: number; time: number; integrity: number; score: number; hit: number; initial: number; phase: Phase; paused: boolean; startClock: number };
const newSim = (strategy: Strategy): Sim => {
  const c = CONFIG[strategy];
  return { nodes: roundNodes(0, c.hp, c.speed), shots: [], sparks: [], fx: [], aim: { x: 590, y: 200 }, elapsed: 0, cooldown: 0, round: 0, time: c.time, integrity: c.integrity, score: 0, hit: 0, initial: c.integrity, phase: "intro", paused: false, startClock: 0 };
};

export default function ThermalStrike({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [showHelp, setShowHelp] = useState(false);
  const [ammo, setAmmo] = useState<Ammo>("cool");
  const ammoRef = useRef<Ammo>("cool");
  const [hud, setHud] = useState({ time: CONFIG[strategy].time, integrity: CONFIG[strategy].integrity, round: 0, score: 0, remaining: 2, hit: 0, total: 4 });
  const [message, setMessage] = useState("CHOOSE THE RIGHT TOOL. SAVE THE BASE.");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Sim>(newSim(strategy));
  const keyRef = useRef({ left: false, right: false, up: false, down: false });
  const last = useRef(0);
  const lastHud = useRef(0);
  const mouseRef = useRef(false);
  const helpRef = useRef(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const config = CONFIG[strategy];
  const choose = useCallback((next: Ammo) => { ammoRef.current = next; setAmmo(next); }, []);
  const reset = useCallback(() => {
    const s = newSim(strategy);
    sim.current = s;
    choose("cool");
    setPhase("intro"); setShowHelp(false); helpRef.current = false;
    setMessage("CHOOSE THE RIGHT TOOL. SAVE THE BASE.");
    setHud({ time: s.time, integrity: s.integrity, round: 0, score: 0, remaining: 2, hit: 0, total: 4 });
    last.current = 0;
  }, [strategy, choose]);
  const start = () => {
    const s = sim.current;
    if (s.phase !== "intro") return;
    s.phase = "playing"; setPhase("playing");
    setMessage("LEVEL 1: BLUE COOLANT ON RED-HOT SYSTEMS!");
  };
  const fire = useCallback(() => {
    const s = sim.current;
    if (s.phase !== "playing" || helpRef.current || busyRef.current || s.cooldown > 0) return;
    const dx = s.aim.x - 100, dy = s.aim.y - 345;
    const len = Math.max(1, Math.hypot(dx, dy));
    if (dy > 30) return;
    const kind = ammoRef.current;
    s.shots.push({ x: 100, y: 345, vx: dx / len * 660, vy: dy / len * 660, kind, age: 0 });
    s.cooldown = 0.19;
  }, []);

  const aimPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    sim.current.aim.x = clamp((event.clientX - rect.left) / rect.width * W, 130, W - 20);
    sim.current.aim.y = clamp((event.clientY - rect.top) / rect.height * H, 30, 325);
    mouseRef.current = true;
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "1", "2", "a", "d", "w", "s"].includes(k)) e.preventDefault();
      if (k === "1") choose("cool");
      if (k === "2") choose("heat");
      if (k === "arrowleft" || k === "a") keyRef.current.left = true;
      if (k === "arrowright" || k === "d") keyRef.current.right = true;
      if (k === "arrowup" || k === "w") keyRef.current.up = true;
      if (k === "arrowdown" || k === "s") keyRef.current.down = true;
      if (k === " " && !e.repeat) fire();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keyRef.current.left = false;
      if (k === "arrowright" || k === "d") keyRef.current.right = false;
      if (k === "arrowup" || k === "w") keyRef.current.up = false;
      if (k === "arrowdown" || k === "s") keyRef.current.down = false;
    };
    const blur = () => { keyRef.current = { left: false, right: false, up: false, down: false }; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [choose, fire]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = (now: number) => {
      if (!last.current) last.current = now;
      const dt = Math.min((now - last.current) / 1000, 0.04);
      last.current = now;
      const s = sim.current;
      const running = s.phase === "playing" && !helpRef.current && !busyRef.current;
      if (running) {
        s.elapsed += dt;
        s.time = Math.max(0, s.time - dt);
        s.cooldown = Math.max(0, s.cooldown - dt);
        const k = keyRef.current;
        if (k.left || k.right || k.up || k.down) {
          mouseRef.current = false;
          s.aim.x = clamp(s.aim.x + (Number(k.right) - Number(k.left)) * 400 * dt, 130, W - 20);
          s.aim.y = clamp(s.aim.y + (Number(k.down) - Number(k.up)) * 400 * dt, 30, 325);
        }
        for (const shot of s.shots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.age += dt; }
        for (const node of s.nodes) {
          if (node.hp <= 0) continue;
          const nx = node.x + Math.sin(s.elapsed * node.speed + node.phase) * (s.round === 2 ? 39 : 28);
          const ny = node.y + Math.cos(s.elapsed * node.speed * 1.2 + node.phase) * (s.round === 2 ? 25 : 19);
          for (const shot of s.shots) {
            if (shot.age > 5 || Math.hypot(shot.x - nx, shot.y - ny) > 35) continue;
            shot.age = 100;
            const good = shot.kind === node.kind;
            s.fx.push({ x: nx, y: ny, age: 0, color: good ? colorFor(shot.kind) : "#fb7185" });
            for (let j = 0; j < 12; j++) {
              const angle = Math.PI * 2 * j / 12;
              s.sparks.push({ x: shot.x, y: shot.y, vx: Math.cos(angle) * (60 + j * 11), vy: Math.sin(angle) * (60 + j * 11), age: 0, maxAge: 0.35 + j * 0.02, color: good ? colorFor(shot.kind) : "#fb7185" });
            }
            if (good) {
              node.hp -= 1; s.hit += 1; s.score += node.hp === 0 ? 150 : 50;
              setMessage(node.hp === 0 ? `${node.label} REPAIRED! NICE SHOT!` : `DIRECT HIT! ${node.label} IS RECOVERING!`);
            } else {
              s.integrity = Math.max(0, s.integrity - 1);
              setMessage("WRONG TOOL! BLUE COOLS HOT · GOLD WARMS FROZEN!");
            }
            break;
          }
        }
        s.shots = s.shots.filter(p => p.age < 5 && p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);
        if (s.nodes.every(n => n.hp <= 0)) {
          if (s.round === 2) {
            s.phase = "won"; setPhase("won"); setMessage("THERMAL SYSTEMS RESTORED! THE CREW IS SAFE!");
          } else {
            s.round += 1; s.nodes = roundNodes(s.round, config.hp, config.speed);
            s.shots = [];
            if (s.round === 1) choose("heat");
            else choose("cool");
            setMessage(s.round === 1 ? "LEVEL 2: GOLD HEAT PULSE ON FROZEN SYSTEMS!" : "FINAL LEVEL: SWITCH TOOLS! BLUE FOR HOT, GOLD FOR FROZEN!");
          }
        }
        if (s.phase === "playing" && (s.time <= 0 || s.integrity <= 0)) {
          s.phase = "lost"; setPhase("lost");
          setMessage(s.time <= 0 ? "TIME RAN OUT. TRY AGAIN!" : "EQUIPMENT SAFETY LOST. TRY AGAIN!");
        }
      }
      for (const p of s.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.age += dt; }
      for (const f of s.fx) f.age += dt;
      s.sparks = s.sparks.filter(p => p.age < p.maxAge);
      s.fx = s.fx.filter(f => f.age < 0.55);
      // Background: starfield and lunar thermal control bay
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#030e1f"); bg.addColorStop(1, "#0c3150");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 56; i++) {
        const x = (i * 179 + 41) % W, y = (i * 83 + 7) % 335;
        ctx.fillStyle = `rgba(193,225,253,${0.18 + ((i * 7) % 10) / 28})`;
        ctx.fillRect(x, y, (i % 4 === 0) ? 2 : 1, (i % 4 === 0) ? 2 : 1);
      }
      ctx.strokeStyle = "#26547a55"; ctx.lineWidth = 1;
      for (let i = 30; i < W; i += 55) { ctx.beginPath(); ctx.moveTo(i, 42); ctx.lineTo(i, 365); ctx.stroke(); }
      for (let i = 70; i < 360; i += 55) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
      // Lunar surface and structures
      ctx.fillStyle = "#17283b"; ctx.beginPath(); ctx.moveTo(0, 377); ctx.lineTo(155, 350); ctx.lineTo(305, 385); ctx.lineTo(480, 354); ctx.lineTo(640, 380); ctx.lineTo(900, 354); ctx.lineTo(900, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = "#334963"; ctx.fillRect(0, 408, W, 47);
      ctx.fillStyle = "#67839f"; ctx.fillRect(0, 408, W, 3);
      // Connection cables on back wall
      for (const node of s.nodes) {
        const nx = node.x + Math.sin(s.elapsed * node.speed + node.phase) * (s.round === 2 ? 39 : 28);
        const ny = node.y + Math.cos(s.elapsed * node.speed * 1.2 + node.phase) * (s.round === 2 ? 25 : 19);
        if (node.hp <= 0) {
          ctx.fillStyle = "#1b473d"; ctx.strokeStyle = "#5de8af"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(nx - 40, ny - 39, 80, 78, 12); ctx.fill(); ctx.stroke();
          ctx.font = "bold 31px system-ui"; ctx.fillStyle = "#82f2b9"; ctx.textAlign = "center"; ctx.fillText("✓", nx, ny + 11);
          continue;
        }
        const color = node.kind === "cool" ? "#ff6d72" : "#87c7ff";
        const aura = ctx.createRadialGradient(nx, ny, 9, nx, ny, 63);
        aura.addColorStop(0, node.kind === "cool" ? "#fc575344" : "#6bbdf844"); aura.addColorStop(1, "#00000000");
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(nx, ny, 63, 0, 2 * Math.PI); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = color;
        ctx.fillStyle = "#041c33";
        ctx.beginPath(); ctx.roundRect(nx - 41, ny - 38, 82, 76, 11); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
        ctx.fillText(node.kind === "cool" ? "OVERHEATING" : "FROZEN", nx, ny - 48);
        ctx.font = "bold 28px system-ui"; ctx.fillText(node.kind === "cool" ? "☀" : "❄", nx, ny + 9);
        ctx.fillStyle = "#a8c6df"; ctx.font = "bold 10px system-ui"; ctx.fillText(node.label, nx, ny + 60);
        for (let j = 0; j < node.maxHp; j++) {
          ctx.fillStyle = j < node.hp ? color : "#234e57";
          ctx.fillRect(nx - node.maxHp * 9 + j * 18, ny + 23, 14, 4);
        }
      }
      // Laser sight and launcher
      const dx = s.aim.x - 100, dy = s.aim.y - 345, ang = Math.atan2(dy, dx);
      ctx.setLineDash([8, 9]); ctx.strokeStyle = colorFor(ammoRef.current) + "77"; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(100, 345); ctx.lineTo(s.aim.x, s.aim.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = colorFor(ammoRef.current); ctx.beginPath(); ctx.arc(s.aim.x, s.aim.y, 16, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.aim.x - 24, s.aim.y); ctx.lineTo(s.aim.x - 9, s.aim.y); ctx.moveTo(s.aim.x + 9, s.aim.y); ctx.lineTo(s.aim.x + 24, s.aim.y); ctx.moveTo(s.aim.x, s.aim.y - 24); ctx.lineTo(s.aim.x, s.aim.y - 9); ctx.moveTo(s.aim.x, s.aim.y + 9); ctx.lineTo(s.aim.x, s.aim.y + 24); ctx.stroke();
      ctx.save(); ctx.translate(100, 345); ctx.rotate(ang);
      ctx.shadowColor = colorFor(ammoRef.current); ctx.shadowBlur = 17;
      ctx.fillStyle = "#183f61"; ctx.strokeStyle = "#91b9d3"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-12, -13, 66, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = colorFor(ammoRef.current); ctx.fillRect(35, -9, 16, 18);
      ctx.restore();
      ctx.fillStyle = "#002544"; ctx.strokeStyle = "#7193a7"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(45, 364, 108, 43, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = colorFor(ammoRef.current); ctx.fillRect(63, 381, 72, 5);
      for (const shot of s.shots) {
        ctx.save(); ctx.shadowColor = colorFor(shot.kind); ctx.shadowBlur = 23; ctx.fillStyle = colorFor(shot.kind);
        ctx.beginPath(); ctx.arc(shot.x, shot.y, 8, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
      }
      for (const p of s.sparks) { ctx.globalAlpha = Math.max(0, 1 - p.age / p.maxAge); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1;
      for (const f of s.fx) { ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - f.age / 0.55; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(f.x, f.y, 12 + f.age * 85, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (now - lastHud.current > 100) {
        setHud({ time: Math.ceil(s.time), integrity: s.integrity, round: s.round, score: s.score, remaining: s.nodes.filter(n => n.hp > 0).length, hit: s.hit, total: s.nodes.reduce((a, n) => a + n.maxHp, 0) });
        lastHud.current = now;
      }
      raf = window.requestAnimationFrame(draw);
    };
    raf = window.requestAnimationFrame(draw);
    return () => { window.cancelAnimationFrame(raf); last.current = 0; };
  }, [config.hp, config.speed, choose]);
  const toggleHelp = () => { if (phase !== "playing") return; helpRef.current = !helpRef.current; setShowHelp(helpRef.current); };
  const chooseAndFire = (kind: Ammo) => { choose(kind); };
  const clock = `${String(Math.floor(hud.time / 60)).padStart(2, "0")}:${String(hud.time % 60).padStart(2, "0")}`;
  const finished = phase === "won" || phase === "lost";
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#274866] bg-[#001d3d] px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Thermometer size={23}/></span><div><p className="text-[10px] font-black tracking-[.22em] text-[#ffd60a]">DAY 12 · THERMAL CONTROL</p><h2 className="text-lg font-black leading-tight sm:text-2xl">THERMAL STRIKE</h2></div></div>
        <div className="flex items-center gap-3"><span className="text-xs font-bold text-[#ffd60a]">LEVEL {hud.round + 1}/3</span><span className="flex items-center gap-1.5 rounded-lg border border-[#45617b] px-3 py-2 text-sm font-bold"><Clock3 size={16}/>{clock}</span><button aria-label="How to play" onClick={toggleHelp} className="rounded-lg border border-[#45617b] p-2 disabled:opacity-50" disabled={phase !== "playing"}><HelpCircle size={19}/></button><button aria-label="Close game" onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]"><X size={21}/></button></div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-6">
        <div className="mx-auto mb-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Target className="text-[#ffd60a]" size={18}/><span className="text-xs font-black tracking-wide sm:text-sm">{ROUNDS[hud.round].title}</span></div><div className="flex items-center gap-3 text-xs"><span className="font-bold text-[#ff8997]">SAFETY {"♥".repeat(hud.integrity)}<span className="text-[#36485d]">{"♡".repeat(config.integrity - hud.integrity)}</span></span><span className="font-bold text-[#ffd60a]">SCORE {hud.score}</span></div></div>
        <div className="relative mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-[#31516e] bg-[#06172b] shadow-[0_16px_50px_#0008]">
          <canvas ref={canvasRef} width={W} height={H} className="h-full w-full touch-none object-fill" aria-label="Thermal strike game field. Aim using your mouse or arrow keys, then fire." onPointerMove={aimPointer} onPointerDown={e => { aimPointer(e); fire(); }} />
          {(phase === "intro" || finished || showHelp) && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ef] p-4"><div className="w-full max-w-md rounded-2xl border border-[#45617b] bg-[#001d3d] p-5 text-center shadow-xl sm:p-7">
            {phase === "intro" ? <><Zap className="mx-auto mb-2 text-[#ffd60a]" size={38}/><p className="text-xs font-bold tracking-widest text-[#ffd60a]">DAY 12 · BASE EMERGENCY</p><h3 className="mt-2 text-2xl font-black">THERMAL STRIKE</h3><p className="mt-2 text-sm text-slate-300">Equipment is overheating and freezing. Fire the right repair pulse at each moving target!</p><div className="my-4 grid grid-cols-2 gap-2"><div className="rounded-lg border border-[#79dcff80] bg-[#00233a] p-3"><Snowflake className="mx-auto mb-1 text-[#79dcff]"/><p className="text-xs font-bold text-[#79dcff]">BLUE = COOL HOT</p></div><div className="rounded-lg border border-[#ffc30080] bg-[#362b08] p-3"><Flame className="mx-auto mb-1 text-[#ffc300]"/><p className="text-xs font-bold text-[#ffd60a]">GOLD = WARM COLD</p></div></div><p className="mb-4 text-xs leading-5 text-slate-200">Move mouse to aim, <b>click to fire</b>. Press <b>1</b> for blue or <b>2</b> for gold. You can also use arrow keys to aim and Space to fire.</p><button onClick={start} className="w-full rounded-xl bg-[#ffc300] px-5 py-3.5 font-black text-[#000814]">START REPAIR MISSION</button></>
            : phase === "won" ? <><CheckCircle2 className="mx-auto mb-3 text-[#7ce7ac]" size={46}/><h3 className="text-3xl font-black">BASE SAVED!</h3><p className="mt-2 text-sm text-slate-300">All thermal systems are back in their safe range. Great work, engineer!</p><p className="mt-2 text-xs text-[#ffd60a]">REAL SCIENCE: Lunar habitats need insulation, radiators and active thermal regulation to control heat.</p><button disabled={busy} onClick={onComplete} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-60">{busy ? "SAVING MISSION..." : "MISSION COMPLETE · CONTINUE"}</button></>
            : phase === "lost" ? <><Thermometer className="mx-auto mb-3 text-[#ff8997]" size={42}/><h3 className="text-2xl font-black">THERMAL EMERGENCY!</h3><p className="mt-3 text-sm text-slate-300">You ran out of time or the equipment took too much damage.</p><button onClick={reset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><RotateCcw size={18}/> TRY AGAIN</button></>
            : <><HelpCircle className="mx-auto mb-3 text-[#ffd60a]" size={40}/><h3 className="text-2xl font-black">HOW TO PLAY</h3><p className="mt-3 text-sm text-slate-200">Aim with the mouse and click to fire, or move the aim with arrow keys and press Space.</p><div className="my-4 space-y-2 text-left text-sm"><p><span className="font-black text-[#79dcff]">1 / BLUE COOLANT</span> → red overheating equipment</p><p><span className="font-black text-[#ffd60a]">2 / GOLD HEAT</span> → blue frozen equipment</p><p>Repair every target in all three levels. Wrong shots cost safety hearts.</p></div><button onClick={toggleHelp} className="w-full rounded-xl bg-[#ffc300] px-5 py-3.5 font-black text-[#000814]">RESUME MISSION</button></>}
          </div></div>}
        </div>
        <div className="mx-auto mt-3 w-full max-w-5xl"><p aria-live="polite" role="status" className="mb-2 min-h-5 text-center text-xs font-black tracking-wide text-[#ffd60a]">{message}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-3"><button disabled={phase !== "playing" || busy} onClick={() => chooseAndFire("cool")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black sm:text-sm ${ammo === "cool" ? "border-[#79dcff] bg-[#064165] text-[#b5edff] ring-1 ring-[#79dcff]" : "border-[#355775] bg-[#001d3d] text-[#afcce0]"}`}><Snowflake size={20}/> 1 · BLUE COOLANT</button><button disabled={phase !== "playing" || busy} onClick={() => chooseAndFire("heat")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black sm:text-sm ${ammo === "heat" ? "border-[#ffc300] bg-[#594208] text-[#ffe88d] ring-1 ring-[#ffc300]" : "border-[#355775] bg-[#001d3d] text-[#afcce0]"}`}><Flame size={20}/> 2 · GOLD HEAT</button><button disabled={phase !== "playing" || busy} onClick={fire} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-6 py-3 text-sm font-black text-[#000814] disabled:opacity-40 sm:col-span-1"><Zap size={19}/> FIRE · SPACE</button></div><div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold text-[#aac0d4]"><span>{ROUNDS[hud.round].goal}</span><button onClick={reset} disabled={busy} className="flex shrink-0 items-center gap-1 text-[#ffd60a]"><RotateCcw size={13}/>RESTART</button></div></div>
      </div>
    </div>
  );
}
