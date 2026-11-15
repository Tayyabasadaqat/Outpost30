"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { onComplete: (success: boolean) => void; onClose: () => void; busy?: boolean; strategy?: Strategy };
type Point = { x: number; y: number };
type Meteor = Point & { vx: number; vy: number; radius: number };
type Particle = Point & { vx: number; vy: number; life: number; color: string };
type World = {
  player: Point & { vx: number; vy: number; face: number };
  cores: boolean[];
  repaired: boolean[];
  carrying: boolean;
  charge: number;
  seconds: number;
  hits: number;
  meteors: Meteor[];
  particles: Particle[];
  phase: "playing" | "won" | "lost";
  toast: string;
  toastUntil: number;
  now: number;
  cameraShake: number;
};
const W = 1100, H = 620;
const BASE = { x: 115, y: 315 };
const STATIONS: Point[] = [{ x: 260, y: 120 }, { x: 865, y: 150 }, { x: 810, y: 475 }];
const CORES: Point[] = [{ x: 490, y: 115 }, { x: 535, y: 480 }, { x: 965, y: 320 }];
const cfg = {
  safe: { time: 165, speed: 265, hazards: 3, drain: 0.25 },
  risky: { time: 125, speed: 275, hazards: 4, drain: 0.34 },
  dangerous: { time: 100, speed: 290, hazards: 6, drain: 0.45 },
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const dust = Array.from({ length: 125 }, (_, i) => ({
  x: ((i * 467 + 59) % (W - 10)) + 5,
  y: ((i * 241 + 101) % (H - 10)) + 5,
  r: 1 + (i % 5) * 0.45,
}));
function makeWorld(strategy: Strategy): World {
  return {
    player: { x: BASE.x, y: BASE.y, vx: 0, vy: 0, face: 0 },
    cores: [false, false, false], repaired: [false, false, false], carrying: false,
    charge: 100, seconds: cfg[strategy].time, hits: 0,
    meteors: Array.from({ length: cfg[strategy].hazards }, (_, i) => ({
      x: 380 + ((i * 179) % 550), y: 95 + ((i * 137) % 430),
      vx: (i % 2 ? -1 : 1) * (55 + i * 9),
      vy: (i % 3 ? 1 : -1) * (37 + i * 7), radius: 19 + (i % 3) * 5,
    })),
    particles: [], phase: "playing", toast: "", toastUntil: 0, now: 0, cameraShake: 0,
  };
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, power = 18) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = power; circle(ctx, x, y, r, color); ctx.restore();
}
function draw(ctx: CanvasRenderingContext2D, w: World) {
  ctx.clearRect(0, 0, W, H);
  const ground = ctx.createLinearGradient(0, 0, W, H);
  ground.addColorStop(0, "#101d32"); ground.addColorStop(0.65, "#18253c"); ground.addColorStop(1, "#0a1527");
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (w.cameraShake > 0) ctx.translate((Math.random() - 0.5) * w.cameraShake, (Math.random() - 0.5) * w.cameraShake);
  // Lunar dust and etched craters
  for (const d of dust) circle(ctx, d.x, d.y, d.r, "#ffffff14");
  for (const [x, y, r] of [[360, 305, 78], [710, 330, 95], [1000, 525, 64], [100, 85, 45]]) {
    ctx.beginPath(); ctx.ellipse(x, y, r, r * .55, -.3, 0, Math.PI * 2);
    ctx.strokeStyle = "#95a6bd26"; ctx.lineWidth = 12; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 4, y + 5, r * .79, r * .42, -.3, 0, Math.PI * 2);
    ctx.fillStyle = "#050b1655"; ctx.fill();
  }
  // Return base / mission vehicle
  ctx.save(); ctx.translate(BASE.x, BASE.y);
  ctx.strokeStyle = "#ffd60a88"; ctx.lineWidth = 4; ctx.setLineDash([10, 7]);
  ctx.beginPath(); ctx.arc(0, 0, 57, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  round(ctx, -37, -32, 74, 64, 12, "#dbe4e9");
  round(ctx, -24, -22, 48, 42, 8, "#003566");
  round(ctx, -15, -12, 30, 19, 5, "#53bff2");
  glow(ctx, -33, 0, 5, "#ffc300", 12); glow(ctx, 33, 0, 5, "#ffc300", 12);
  ctx.fillStyle = "#ffd60a"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center"; ctx.fillText("BASE", 0, 84); ctx.restore();
  // Solar stations
  STATIONS.forEach((p, i) => {
    const ok = w.repaired[i]; ctx.save(); ctx.translate(p.x, p.y);
    ctx.strokeStyle = ok ? "#67f0b0" : "#ffc300"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI * 2); ctx.stroke();
    round(ctx, -51, -31, 102, 62, 7, "#31435c");
    for (let n = 0; n < 3; n++) {
      round(ctx, -43 + n * 29, -24, 25, 47, 3, ok ? "#0c689b" : "#102945");
      ctx.strokeStyle = ok ? "#8edfff" : "#5d7697"; ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-43 + n * 29, -11 + j * 12); ctx.lineTo(-18 + n * 29, -11 + j * 12); ctx.stroke(); }
    }
    glow(ctx, 0, -35, 7, ok ? "#66f3bd" : "#ff775b", 20);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center";
    ctx.fillText(`ARRAY 0${i + 1}`, 0, 84);
    ctx.fillStyle = ok ? "#72f6c0" : "#ffd60a";
    ctx.font = "bold 12px Arial"; ctx.fillText(ok ? "ONLINE" : "OFFLINE", 0, 101);
    ctx.restore();
  });
  // Collectible energy cores
  CORES.forEach((p, i) => {
    if (w.cores[i]) return;
    const bob = Math.sin(w.now * 3 + i) * 5;
    ctx.save(); ctx.translate(p.x, p.y + bob);
    ctx.rotate(Math.PI / 4 + w.now * .4);
    ctx.shadowBlur = 30; ctx.shadowColor = "#ffd60a";
    round(ctx, -16, -16, 32, 32, 5, "#ffc300");
    round(ctx, -9, -9, 18, 18, 2, "#fff1a8"); ctx.restore();
    ctx.fillStyle = "#ffd60a"; ctx.textAlign = "center"; ctx.font = "bold 12px Arial";
    ctx.fillText("POWER CORE", p.x, p.y + 42);
  });
  // Moving debris (danger)
  w.meteors.forEach((m, i) => {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(w.now * (i % 2 ? -.8 : .7));
    ctx.shadowBlur = 20; ctx.shadowColor = "#f97316";
    ctx.beginPath();
    for (let a = 0; a < 8; a++) {
      const angle = a / 8 * Math.PI * 2;
      const r = m.radius * (a % 2 ? .81 : 1.15);
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = "#a9442f"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#ffb05b"; ctx.stroke(); ctx.restore();
  });
  // Astronaut jetpack; glowing exhaust depends on motion
  const p = w.player; const moving = Math.hypot(p.vx, p.vy) > 10;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.face);
  if (moving) {
    ctx.fillStyle = "#ffc300bb"; ctx.beginPath(); ctx.moveTo(-10, 20);
    ctx.lineTo(0, 30 + 10 * Math.sin(w.now * 33)); ctx.lineTo(10, 20); ctx.fill();
  }
  circle(ctx, 0, 6, 21, "#95a7bd");
  round(ctx, -17, 0, 34, 32, 12, "#e9f2ff");
  round(ctx, -25, 5, 9, 20, 4, "#d3dfed"); round(ctx, 16, 5, 9, 20, 4, "#d3dfed");
  glow(ctx, 0, -7, 21, "#dce8ef", 6);
  round(ctx, -15, -17, 30, 19, 9, "#123955");
  round(ctx, -10, -13, 20, 10, 5, "#8bd5ff");
  if (w.carrying) glow(ctx, 25, -22, 10, "#ffd60a", 26);
  ctx.restore();
  // Particles
  for (const part of w.particles) circle(ctx, part.x, part.y, Math.max(.5, part.life * 5), part.color);
  ctx.restore();
  // In-world contextual labels
  if (w.phase === "playing") {
    const station = STATIONS.findIndex((p, i) => !w.repaired[i] && dist(w.player, p) < 86);
    if (station >= 0) {
      round(ctx, clamp(w.player.x - 116, 10, W - 242), clamp(w.player.y - 101, 10, H - 65), 232, 36, 9, "#000814e8");
      ctx.fillStyle = "#ffd60a"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center";
      ctx.fillText(w.carrying ? "PRESS E / REPAIR TO INSTALL" : "FIND A YELLOW POWER CORE", clamp(w.player.x, 126, W - 126), clamp(w.player.y - 78, 35, H - 40));
    }
  }
}

export default function SolarRepair({ onComplete, onClose, busy = false, strategy = "safe" }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(makeWorld(strategy));
  const keys = useRef(new Set<string>());
  const onCompleteRef = useRef(onComplete);
  const [hud, setHud] = useState({ seconds: cfg[strategy].time, charge: 100, repaired: 0, cores: 0, carrying: false, phase: "playing" as World["phase"], hits: 0, toast: "" });
  const [restart, setRestart] = useState(0);
  const [help, setHelp] = useState(true);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const act = useCallback(() => {
    const w = world.current;
    if (w.phase !== "playing" || !w.carrying) return;
    const index = STATIONS.findIndex((p, i) => !w.repaired[i] && dist(w.player, p) < 86);
    if (index < 0) return;
    w.repaired[index] = true; w.carrying = false; w.charge = clamp(w.charge + 12, 0, 100);
    w.toast = `ARRAY 0${index + 1} RESTORED!`; w.toastUntil = w.now + 2;
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399, s = 45 + (i % 7) * 19;
      w.particles.push({ x: STATIONS[index].x, y: STATIONS[index].y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color: i % 2 ? "#ffd60a" : "#72f6c0" });
    }
  }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e", " "].includes(k)) e.preventDefault();
      if (k === "e" || k === " ") { if (!e.repeat) act(); } else keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [act]);
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0, last = 0, lastHud = 0;
    const frame = (stamp: number) => {
      const dt = last ? Math.min((stamp - last) / 1000, .04) : 0; last = stamp;
      const w = world.current;
      if (w.phase === "playing" && !help) {
        w.now += dt; w.seconds -= dt; w.charge -= cfg[strategy].drain * dt;
        let dx = Number(keys.current.has("d") || keys.current.has("arrowright")) - Number(keys.current.has("a") || keys.current.has("arrowleft"));
        let dy = Number(keys.current.has("s") || keys.current.has("arrowdown")) - Number(keys.current.has("w") || keys.current.has("arrowup"));
        const mag = Math.hypot(dx, dy) || 1; dx /= mag; dy /= mag;
        w.player.vx += (dx * cfg[strategy].speed - w.player.vx) * Math.min(1, dt * 8);
        w.player.vy += (dy * cfg[strategy].speed - w.player.vy) * Math.min(1, dt * 8);
        const nextX = clamp(w.player.x + w.player.vx * dt, 30, W - 30);
        const nextY = clamp(w.player.y + w.player.vy * dt, 30, H - 30);
        w.player.x = nextX; w.player.y = nextY;
        if (Math.abs(w.player.vx) + Math.abs(w.player.vy) > 10) w.player.face = Math.atan2(w.player.vy, w.player.vx) + Math.PI / 2;
        CORES.forEach((p, i) => {
          if (!w.cores[i] && !w.carrying && dist(w.player, p) < 38) {
            w.cores[i] = true; w.carrying = true;
            w.toast = "CORE ACQUIRED — INSTALL AT A RED ARRAY"; w.toastUntil = w.now + 2.5;
          }
        });
        w.meteors.forEach((m) => {
          m.x += m.vx * dt; m.y += m.vy * dt;
          if (m.x < 50 || m.x > W - 50) m.vx *= -1;
          if (m.y < 45 || m.y > H - 45) m.vy *= -1;
          if (dist(w.player, m) < m.radius + 20 && w.now > ((w as World & { invulnerableUntil?: number }).invulnerableUntil ?? -1)) {
            (w as World & { invulnerableUntil?: number }).invulnerableUntil = w.now + 1.3;
            w.hits++; w.charge -= 13; w.cameraShake = 18;
            w.toast = "DEBRIS HIT! -13 ENERGY"; w.toastUntil = w.now + 1.5;
          }
        });
        w.cameraShake = Math.max(0, w.cameraShake - dt * 45);
        w.particles = w.particles.filter(p => p.life > 0);
        w.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4; });
        if (w.repaired.every(Boolean) && dist(w.player, BASE) < 62) w.phase = "won";
        if (w.seconds <= 0 || w.charge <= 0) w.phase = "lost";
      }
      draw(ctx, w);
      if (stamp - lastHud > 100) {
        lastHud = stamp;
        setHud({ seconds: Math.max(0, w.seconds), charge: Math.max(0, w.charge), repaired: w.repaired.filter(Boolean).length,
          cores: w.cores.filter(Boolean).length, carrying: w.carrying, phase: w.phase, hits: w.hits,
          toast: w.now < w.toastUntil ? w.toast : "" });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [help, restart, strategy]);
  const reset = () => { world.current = makeWorld(strategy); keys.current.clear(); setHelp(false); setRestart(n => n + 1); };
  const direction = (k: string, down: boolean) => { if (down) keys.current.add(k); else keys.current.delete(k); };
  const finished = hud.repaired === 3;
  const objective = finished ? "RETURN TO THE BASE" : hud.carrying ? "INSTALL CORE AT A RED ARRAY" : "COLLECT A YELLOW POWER CORE";
  const remaining = Math.ceil(hud.seconds);
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#000814] font-sans text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1f4164] bg-[#001d3d] px-3 py-3 sm:px-6">
        <div><p className="text-[10px] font-extrabold tracking-[.17em] text-[#ffc300]">DAY 03 / SOLAR RESCUE</p><h2 className="text-lg font-black sm:text-2xl">JETPACK POWER RUN</h2></div>
        <div className="flex items-center gap-3"><span className="rounded-lg border border-[#ffc300]/40 px-3 py-2 text-xs font-black text-[#ffd60a]">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2,"0")}</span><button type="button" onClick={onClose} disabled={busy} aria-label="Close mission"><X size={22}/></button></div>
      </header>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-[#001326] px-3 py-2 text-xs font-bold sm:px-6">
        <span className="text-[#ffd60a]">⚡ {objective}</span>
        <div className="flex gap-4"><span>ARRAYS {hud.repaired}/3</span><span className={hud.charge < 25 ? "text-red-400" : "text-[#ffd60a]"}>ENERGY {Math.round(hud.charge)}%</span><span>HITS {hud.hits}</span></div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <canvas ref={canvas} width={W} height={H} className="h-full w-full object-contain" aria-label="Playable lunar jetpack rescue game" />
        {hud.toast && <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-[#001d3d]/95 px-4 py-2 text-center text-sm font-black text-[#ffd60a]">{hud.toast}</p>}
        {!help && hud.phase === "playing" && <div className="absolute bottom-3 left-3 grid touch-none grid-cols-3 gap-1 sm:bottom-5 sm:left-5">
          <span/><DPad k="w" onChange={direction}><ArrowUp size={21}/></DPad><span/>
          <DPad k="a" onChange={direction}><ArrowLeft size={21}/></DPad>
          <DPad k="s" onChange={direction}><ArrowDown size={21}/></DPad>
          <DPad k="d" onChange={direction}><ArrowRight size={21}/></DPad>
        </div>}
        {!help && hud.phase === "playing" && <button type="button" onClick={act} disabled={!hud.carrying || busy} className="absolute bottom-5 right-4 flex items-center gap-2 rounded-2xl bg-[#ffc300] px-5 py-4 text-sm font-black text-[#000814] shadow-lg disabled:opacity-35 sm:right-6"><Zap size={20}/> INSTALL [E]</button>}
        {help && <div className="absolute inset-0 grid place-items-center bg-[#000814]/90 p-4"><div className="max-w-md text-center"><p className="mb-3 text-xs font-black tracking-widest text-[#ffd60a]">COMMANDER, YOUR BASE IS LOSING POWER!</p><h3 className="mb-5 text-4xl font-black">JETPACK RESCUE</h3><p className="mb-6 text-base leading-7 text-slate-200">Fly with <b>WASD</b> or the arrows. Grab a yellow core, fly to a broken solar array, press <b>E</b> to install it. Repair all 3, then return to base. Dodge moving space debris!</p><button className="rounded-xl bg-[#ffc300] px-9 py-4 text-base font-black text-[#000814]" onClick={() => setHelp(false)}>LAUNCH! 🚀</button></div></div>}
        {hud.phase !== "playing" && !help && <div className="absolute inset-0 grid place-items-center bg-[#000814]/85 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[#ffc300]/45 bg-[#001d3d] p-7 text-center"><div className="mb-4 text-5xl">{hud.phase === "won" ? "🏆" : "⚠️"}</div><h3 className="text-3xl font-black">{hud.phase === "won" ? "BASE POWER RESTORED!" : "MISSION FAILED"}</h3><p className="mt-3 text-sm text-slate-200">{hud.phase === "won" ? `All solar arrays are online. ${hud.hits} debris hits.` : "Your battery ran out or time expired. Try a new route!"}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{hud.phase === "won" ? <button onClick={() => onCompleteRef.current(true)} disabled={busy} className="rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy ? "SAVING..." : "COMPLETE MISSION →"}</button> : <button onClick={reset} className="flex items-center gap-2 rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]"><RotateCcw size={17}/> RETRY</button>}</div></div></div>}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1f4164] bg-[#001d3d] px-3 py-2 text-[11px] text-slate-300 sm:px-6"><span>WASD / ARROWS MOVE · E INSTALL · AVOID DEBRIS</span><button onClick={reset} disabled={busy} className="flex items-center gap-1 font-bold text-[#ffd60a] disabled:opacity-50"><RotateCcw size={15}/> RESTART</button></footer>
    </div>
  );
}
function DPad({ k, onChange, children }: { k: string; onChange: (key: string, down: boolean) => void; children: ReactNode }) {
  return <button type="button" aria-label={`Move ${k}`} className="flex h-11 w-11 touch-none items-center justify-center rounded-xl border border-[#ffc300]/50 bg-[#001d3d]/95 text-[#ffd60a] active:bg-[#003566]" onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onChange(k,true); }} onPointerUp={() => onChange(k,false)} onPointerCancel={() => onChange(k,false)} onLostPointerCapture={() => onChange(k,false)}>{children}</button>;
}
