"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Shield, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { onComplete: () => void; onClose: () => void; busy?: boolean; strategy?: Strategy };
type Drop = { x: number; y: number; vy: number; kind: "clean" | "dirty" | "ice"; r: number; converted?: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type World = {
  x: number; vx: number; drops: Drop[]; sparks: Spark[]; clean: number; health: number;
  seconds: number; cooldown: number; burst: number; phase: "playing" | "won" | "lost";
  t: number; spawn: number; combo: number; misses: number; message: string; messageUntil: number;
};
const W = 1000, H = 580, TARGET = 24;
const options: Record<Strategy, { time: number; spawn: number; fall: number; dirty: number; health: number; pulse: number }> = {
  safe: { time: 125, spawn: .65, fall: 155, dirty: .28, health: 100, pulse: 3.2 },
  risky: { time: 105, spawn: .53, fall: 195, dirty: .39, health: 85, pulse: 4.3 },
  dangerous: { time: 90, spawn: .44, fall: 240, dirty: .47, health: 70, pulse: 5.4 },
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const stageName = (count: number) => count < 8 ? "CAPTURE WATER" : count < 16 ? "FILTER IMPURITIES" : "UV PURIFICATION";
const createWorld = (strategy: Strategy): World => ({ x: W / 2, vx: 0, drops: [], sparks: [], clean: 0, health: options[strategy].health, seconds: options[strategy].time, cooldown: 0, burst: 0, phase: "playing", t: 0, spawn: 0, combo: 0, misses: 0, message: "", messageUntil: 0 });
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, color: string, blur = 18) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function particles(w: World, x: number, y: number, color: string) {
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI * 2 / 12;
    w.sparks.push({ x, y, vx: Math.cos(a) * (65 + i * 9), vy: Math.sin(a) * (65 + i * 9), life: .65, color });
  }
}
const STAR_DOTS = Array.from({ length: 75 }, (_, i) => ({ x: (i * 193 + 41) % W, y: (i * 317 + 13) % H, r: .5 + (i % 3) * .5 }));
function draw(ctx: CanvasRenderingContext2D, w: World) {
  const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#000814"); bg.addColorStop(.6, "#001d3d"); bg.addColorStop(1, "#001126");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  STAR_DOTS.forEach(p => glow(ctx, p.x, p.y, p.r, "#cfeaff55", 2));
  // Water-processing chamber and illuminated pipes (moving, not static controls).
  rounded(ctx, 29, 31, W - 58, H - 62, 24, "#03172f");
  ctx.lineWidth = 2; ctx.strokeStyle = "#23517b"; ctx.strokeRect(45, 47, W - 90, H - 94);
  for (let i = 0; i < 7; i++) {
    const x = 125 + i * 125;
    ctx.strokeStyle = "#18446d55"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, H - 66); ctx.stroke();
  }
  // Overhead water duct with animated flow.
  rounded(ctx, 72, 72, W - 144, 34, 15, "#274d71");
  rounded(ctx, 78, 78, W - 156, 21, 10, "#007da0");
  for (let i = 0; i < 14; i++) {
    const x = 85 + ((i * 85 + w.t * 75) % (W - 170));
    rounded(ctx, x, 83, 29, 8, 4, "#9cefff66");
  }
  // Reservoir on left side.
  rounded(ctx, 59, 135, 98, 220, 15, "#102b46");
  ctx.strokeStyle = "#66c8e1"; ctx.lineWidth = 3; ctx.strokeRect(71, 147, 74, 194);
  const level = (w.clean / TARGET) * 174;
  rounded(ctx, 78, 330 - level, 61, level, 8, "#13aad1");
  for (let i = 0; i < Math.floor(w.clean / 3); i++) {
    const yy = 326 - (i * 18 % Math.max(1, level));
    glow(ctx, 96 + (i * 13) % 32, yy, 3, "#cffaff", 6);
  }
  ctx.fillStyle = "#d8f7ff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.fillText("TANK", 108, 377);
  ctx.fillStyle = "#ffd60a"; ctx.font = "bold 20px Arial"; ctx.fillText(`${Math.round(w.clean / TARGET * 100)}%`, 108, 405);
  // Catcher at bottom: robot purifier cart.
  ctx.save(); ctx.translate(w.x, H - 93);
  if (w.burst > 0) { ctx.strokeStyle = `rgba(255,214,10,${w.burst / .45})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 110 + (1 - w.burst / .45) * 55, 0, Math.PI * 2); ctx.stroke(); }
  rounded(ctx, -55, -12, 110, 47, 15, "#8baec4");
  rounded(ctx, -48, -5, 96, 35, 10, "#003566");
  rounded(ctx, -35, -31, 70, 30, 12, "#d9efff");
  rounded(ctx, -26, -24, 52, 17, 7, "#11a8d9");
  glow(ctx, 0, -20, 6, "#ffd60a", 13);
  glow(ctx, -37, 27, 7, "#ffd60a", 15); glow(ctx, 37, 27, 7, "#ffd60a", 15);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.fillText("PURIFIER", 0, 52);
  ctx.restore();
  // Falling droplets and contaminants.
  for (const d of w.drops) {
    ctx.save(); ctx.translate(d.x, d.y);
    if (d.kind === "dirty") {
      ctx.rotate(w.t * 1.9); glow(ctx, 0, 0, d.r, "#e45b6d", 13);
      ctx.strokeStyle = "#ffc2a9"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke();
    } else if (d.kind === "ice") {
      ctx.rotate(Math.PI / 4); ctx.shadowBlur = 18; ctx.shadowColor = "#ffd60a";
      rounded(ctx, -d.r, -d.r, d.r * 2, d.r * 2, 5, "#ffc300");
    } else {
      ctx.shadowBlur = 19; ctx.shadowColor = "#00c6ff";
      ctx.fillStyle = "#00b6ed"; ctx.beginPath(); ctx.moveTo(0, -d.r * 1.45); ctx.bezierCurveTo(d.r * 1.4, 0, d.r, d.r, 0, d.r); ctx.bezierCurveTo(-d.r, d.r, -d.r * 1.4, 0, 0, -d.r * 1.45); ctx.fill();
      glow(ctx, -4, 0, 4, "#daf9ff", 5);
    }
    ctx.restore();
  }
  for (const p of w.sparks) glow(ctx, p.x, p.y, Math.max(1, p.life * 4), p.color, 5);
  ctx.fillStyle = "#abcbe3"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center";
  ctx.fillText(stageName(w.clean), W / 2, 140);
  if (w.t < w.messageUntil && w.message) { rounded(ctx, 348, 163, 304, 43, 12, "#001126ed"); ctx.fillStyle = "#ffd60a"; ctx.fillText(w.message, W / 2, 189); }
}

export default function WaterRecycling({ onComplete, onClose, busy = false, strategy = "safe" }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(createWorld(strategy));
  const keys = useRef(new Set<string>());
  const [hud, setHud] = useState({ clean: 0, health: options[strategy].health, seconds: options[strategy].time, phase: "playing" as World["phase"], cooldown: 0, combo: 0 });
  const [help, setHelp] = useState(true);
  const [restart, setRestart] = useState(0);
  const option = options[strategy];
  const pulse = useCallback(() => {
    const w = world.current;
    if (w.phase !== "playing" || help || w.cooldown > 0) return;
    w.cooldown = option.pulse; w.burst = .45;
    let purified = 0;
    for (const d of w.drops) {
      const distance = Math.hypot(w.x - d.x, (H - 93) - d.y);
      if (d.kind === "dirty" && distance < 175) { d.kind = "clean"; d.converted = true; purified++; particles(w, d.x, d.y, "#ffd60a"); }
    }
    w.message = purified ? `UV PULSE PURIFIED ${purified}!` : "NO CONTAMINANTS IN RANGE"; w.messageUntil = w.t + 1.2;
  }, [help, option.pulse]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["a", "d", "arrowleft", "arrowright", " ", "e"].includes(k)) { e.preventDefault(); if ((k === " " || k === "e") && !e.repeat) pulse(); else keys.current.add(k); }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [pulse]);
  useEffect(() => {
    const c = canvas.current, ctx = c?.getContext("2d"); if (!ctx) return;
    let frameId = 0, last = 0, lastHud = 0;
    function tick(stamp: number) {
      const dt = last ? Math.min(.05, (stamp - last) / 1000) : 0; last = stamp;
      const w = world.current;
      if (w.phase === "playing" && !help) {
        w.t += dt; w.seconds -= dt; w.cooldown = Math.max(0, w.cooldown - dt); w.burst = Math.max(0, w.burst - dt);
        const direction = Number(keys.current.has("d") || keys.current.has("arrowright")) - Number(keys.current.has("a") || keys.current.has("arrowleft"));
        w.vx += (direction * 470 - w.vx) * Math.min(1, dt * 12);
        w.x = clamp(w.x + w.vx * dt, 195, W - 70);
        w.spawn += dt;
        if (w.spawn >= option.spawn) {
          w.spawn -= option.spawn;
          const kind: Drop["kind"] = Math.random() < option.dirty ? "dirty" : Math.random() < .13 ? "ice" : "clean";
          w.drops.push({ x: 220 + Math.random() * (W - 300), y: 110, vy: option.fall * (.8 + Math.random() * .55), kind, r: 12 + Math.random() * 5 });
        }
        w.drops = w.drops.filter(d => {
          d.y += d.vy * dt;
          if (d.y > H - 118 && d.y < H - 62 && Math.abs(d.x - w.x) < 53) {
            if (d.kind === "dirty") { w.health -= 15; w.combo = 0; w.message = "CONTAMINATED! -15 FILTER"; particles(w, d.x, d.y, "#ff6477"); }
            else { w.clean += d.kind === "ice" ? 2 : 1; w.combo++; w.message = d.kind === "ice" ? "ICE RECOVERED +2" : w.combo > 2 ? `COMBO ×${w.combo}` : "CLEAN WATER COLLECTED"; particles(w, d.x, d.y, d.kind === "ice" ? "#ffd60a" : "#42dfff"); }
            w.messageUntil = w.t + 1.2; return false;
          }
          if (d.y > H - 40) { if (d.kind !== "dirty") { w.health -= 2; w.combo = 0; } return false; }
          return true;
        });
        w.sparks = w.sparks.filter(s => s.life > 0);
        w.sparks.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 2.1; });
        if (w.clean >= TARGET) w.phase = "won";
        else if (w.health <= 0 || w.seconds <= 0) w.phase = "lost";
      }
      if (ctx) draw(ctx, w);
      if (stamp - lastHud > 110) {
        lastHud = stamp;
        setHud({ clean: w.clean, health: Math.max(0, w.health), seconds: Math.max(0, w.seconds), phase: w.phase, cooldown: Math.max(0, w.cooldown), combo: w.combo });
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [help, restart, strategy, option.dirty, option.fall, option.spawn]);
  const reset = () => { world.current = createWorld(strategy); keys.current.clear(); setHud({ clean: 0, health: option.health, seconds: option.time, phase: "playing", cooldown: 0, combo: 0 }); setHelp(false); setRestart(v => v + 1); };
  const changeDirection = (k: string, down: boolean) => { if (down) keys.current.add(k); else keys.current.delete(k); };
  const remaining = Math.ceil(hud.seconds);
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#000814] font-sans text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#23507a] bg-[#001d3d] px-3 py-3 sm:px-6">
        <div><p className="text-[10px] font-extrabold tracking-[.17em] text-[#ffc300]">DAY 04 / LIFE SUPPORT</p><h2 className="text-lg font-black sm:text-2xl">H₂O DEFENDER</h2></div>
        <div className="flex items-center gap-3"><span className="rounded-lg border border-[#ffc300]/40 px-3 py-2 text-xs font-black text-[#ffd60a]">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span><button type="button" onClick={onClose} disabled={busy} aria-label="Close Day 4"><X size={22}/></button></div>
      </header>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-[#001326] px-3 py-2 text-xs font-bold sm:px-6">
        <span className="text-[#ffd60a]">{stageName(hud.clean)}</span>
        <div className="flex gap-4"><span>WATER {Math.min(TARGET, hud.clean)}/{TARGET}</span><span className={hud.health < 30 ? "text-rose-300" : "text-[#ffd60a]"}>FILTER {Math.round(hud.health)}%</span><span>COMBO {hud.combo}</span></div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <canvas ref={canvas} width={W} height={H} className="h-full w-full object-contain" aria-label="Water recycling arcade game: catch clean water and use UV pulses to purify contaminants"/>
        {help && <div className="absolute inset-0 grid place-items-center bg-[#000814]/90 p-5"><div className="max-w-md text-center"><p className="text-xs font-black tracking-widest text-[#ffd60a]">ALERT · WATER RESERVES LOW</p><h3 className="mt-3 text-4xl font-black">SAVE THE WATER!</h3><p className="mt-4 text-base leading-7 text-slate-200">Move with <b>← →</b> or <b>A / D</b>. Catch <b className="text-cyan-300">blue water</b> and <b className="text-[#ffd60a]">yellow ice</b>. Avoid <b className="text-rose-300">red contamination</b>. Press <b>SPACE</b> near red drops to purify them!</p><button onClick={() => setHelp(false)} className="mt-6 rounded-xl bg-[#ffc300] px-10 py-4 font-black text-[#000814]">START RESCUE →</button></div></div>}
        {!help && hud.phase === "playing" && <>
          <div className="absolute bottom-4 left-4 flex gap-2 touch-none sm:bottom-6 sm:left-6"><DPad k="a" onChange={changeDirection}><ArrowLeft size={24}/></DPad><DPad k="d" onChange={changeDirection}><ArrowRight size={24}/></DPad></div>
          <button type="button" onClick={pulse} disabled={hud.cooldown > 0 || busy} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-[#ffc300] px-4 py-3 font-black text-[#000814] disabled:opacity-45 sm:bottom-6 sm:right-6"><Zap size={18}/>{hud.cooldown > 0 ? `RECHARGE ${hud.cooldown.toFixed(1)}s` : "UV PULSE [SPACE]"}</button>
        </>}
        {!help && hud.phase !== "playing" && <div className="absolute inset-0 grid place-items-center bg-[#000814]/85 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[#ffc300]/40 bg-[#001d3d] p-7 text-center"><div className="mb-3 flex justify-center"><Shield className="text-[#ffd60a]" size={42}/></div><h3 className="text-3xl font-black">{hud.phase === "won" ? "WATER SUPPLY SAVED!" : "FILTER SYSTEM FAILED"}</h3><p className="mt-4 text-sm leading-6 text-slate-200">{hud.phase === "won" ? "Great work! Water was recovered, screened, and purified. Real water recycling relies on several treatment steps and careful monitoring." : "Too much contaminated water reached the system, or the reserve ran out. Try a new strategy!"}</p><button disabled={busy} onClick={hud.phase === "won" ? onComplete : reset} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814] disabled:opacity-50">{hud.phase === "won" ? busy ? "SAVING..." : "COMPLETE MISSION →" : "RETRY MISSION"}</button></div></div>}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#23507a] bg-[#001d3d] px-3 py-2 text-[11px] text-slate-300 sm:px-6"><span>← → / A D MOVE · SPACE PURIFY RED DROPS</span><button onClick={reset} disabled={busy} className="flex items-center gap-1 font-bold text-[#ffd60a] disabled:opacity-50"><RotateCcw size={15}/> RESTART</button></footer>
    </div>
  );
}
function DPad({ k, onChange, children }: { k: string; onChange: (key: string, down: boolean) => void; children: ReactNode }) {
  return <button type="button" aria-label={`Move ${k}`} className="flex h-12 w-14 touch-none items-center justify-center rounded-xl border border-[#ffc300]/50 bg-[#001d3d]/95 text-[#ffd60a] active:bg-[#003566]" onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onChange(k, true); }} onPointerUp={() => onChange(k, false)} onPointerCancel={() => onChange(k, false)} onLostPointerCapture={() => onChange(k, false)}>{children}</button>;
}
