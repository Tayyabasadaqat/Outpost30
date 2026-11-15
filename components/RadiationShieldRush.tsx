"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, RotateCcw, Shield, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Burst = { x: number; y: number; speed: number; radius: number; strength: number; type: "burst" | "charge" };
type Spark = { x: number; y: number; life: number; color: string };
type World = { shieldX: number; bursts: Burst[]; sparks: Spark[]; elapsed: number; reserve: number; integrity: number; hits: number; blocks: number; charges: number; spawn: number; phase: "ready" | "playing" | "won" | "lost" };
const W = 960;
const H = 570;
const STATIONS = [180, 480, 780];
const SETTINGS = {
  safe: { duration: 42, reserve: 100, integrity: 100, spawn: 1.0, speed: 145, width: 172 },
  risky: { duration: 48, reserve: 85, integrity: 90, spawn: 0.75, speed: 173, width: 148 },
  dangerous: { duration: 52, reserve: 75, integrity: 80, spawn: 0.57, speed: 193, width: 126 },
};
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v));
const initial = (s: Strategy): World => ({ shieldX: 480, bursts: [], sparks: [], elapsed: 0, reserve: SETTINGS[s].reserve, integrity: SETTINGS[s].integrity, hits: 0, blocks: 0, charges: 0, spawn: 0.6, phase: "ready" });

function draw(g: CanvasRenderingContext2D, state: World, strategy: Strategy, tick: number) {
  const p = SETTINGS[strategy];
  const rumble = Math.max(0, 1 - state.reserve / 100);
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#020817"); bg.addColorStop(1, "#0c2541");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) {
    const x = (i * 137.34 + 33) % W;
    const y = (i * 79.21 + 15) % (H * 0.74);
    g.fillStyle = i % 4 === 0 ? "#93bfe5" : "#385b82";
    g.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  g.fillStyle = "#1e3854";
  g.beginPath(); g.ellipse(480, 640, 820, 183, 0, Math.PI, Math.PI * 2); g.fill();
  g.fillStyle = "#596477"; g.fillRect(0, 495, W, 75);
  for (let i = 0; i < 56; i++) { g.fillStyle = i % 3 ? "#778297" : "#3c4c60"; g.fillRect((i * 113) % W, 505 + ((i * 19) % 57), i % 5 + 1, 2); }
  // Habitat zones and astronauts
  STATIONS.forEach((x, i) => {
    const dome = g.createLinearGradient(x - 70, 393, x + 70, 500);
    dome.addColorStop(0, "#cad9e6"); dome.addColorStop(0.45, "#849bb3"); dome.addColorStop(1, "#2d4b66");
    g.fillStyle = dome;
    g.beginPath(); g.moveTo(x - 72, 501); g.arc(x, 501, 72, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = "#c6e4fc"; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = "#09233b"; g.fillRect(x - 34, 442, 68, 35);
    g.fillStyle = state.reserve < 30 ? "#ff667a" : "#ffd60a";
    g.fillRect(x - 27, 450, 54, 8);
    g.font = "900 12px system-ui"; g.textAlign = "center"; g.fillStyle = "#f8fbff";
    g.fillText(["LIFE SUPPORT", "CREW HABITAT", "RESEARCH LAB"][i], x, 531);
    g.strokeStyle = state.reserve < 30 ? "#ff6e81" : "#426b92";
    g.beginPath(); g.arc(x, 470, 87, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  });
  // Ground guide and player's shield
  g.strokeStyle = "#ffc30033"; g.setLineDash([7, 9]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(35, 356); g.lineTo(925, 356); g.stroke(); g.setLineDash([]);
  const x = state.shieldX; const width = p.width;
  g.save(); g.shadowColor = "#ffd60a"; g.shadowBlur = 26;
  const shield = g.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
  shield.addColorStop(0, "#ffc30066"); shield.addColorStop(0.5, "#ffe56d"); shield.addColorStop(1, "#ffc30066");
  g.strokeStyle = shield; g.lineWidth = 14; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - width / 2, 353); g.quadraticCurveTo(x, 340, x + width / 2, 353); g.stroke();
  g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = "#fff7c4"; g.stroke();
  g.fillStyle = "#d6e7f7"; g.fillRect(x - 8, 363, 16, 30);
  g.fillStyle = "#ffc300"; g.fillRect(x - 15, 388, 30, 8);
  g.restore();
  // Incoming storms and bonuses
  state.bursts.forEach(b => {
    g.save();
    if (b.type === "charge") {
      g.shadowColor = "#76edc7"; g.shadowBlur = 20;
      g.fillStyle = "#9df9d7"; g.beginPath(); g.arc(b.x, b.y, b.radius, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#003d38"; g.textAlign = "center"; g.font = "900 17px system-ui"; g.fillText("+", b.x, b.y + 6);
    } else {
      g.translate(b.x, b.y); g.rotate(tick * 0.003 + b.x);
      g.shadowColor = "#ff416d"; g.shadowBlur = 22;
      g.fillStyle = "#ff4466";
      g.beginPath();
      for (let n = 0; n < 12; n++) {
        const ang = n * Math.PI / 6;
        const rad = n % 2 === 0 ? b.radius : b.radius * 0.58;
        if (n === 0) g.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        else g.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      g.closePath(); g.fill();
      g.fillStyle = "#ffd0d9"; g.beginPath(); g.arc(0, 0, b.radius * 0.35, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  });
  state.sparks.forEach(s => {
    g.globalAlpha = clamp(s.life, 0, 1);
    g.fillStyle = s.color; g.beginPath(); g.arc(s.x, s.y, 3 + (1 - s.life) * 9, 0, Math.PI * 2); g.fill();
  });
  g.globalAlpha = 1;
  // On-canvas storm intensity line
  g.textAlign = "left"; g.font = "800 12px system-ui"; g.fillStyle = "#afc9e2";
  g.fillText("SIMULATED SPACE WEATHER · DEFEND THE OUTPOST", 28, 35);
  g.fillStyle = "#1c3a59"; g.fillRect(28, 50, 224, 8);
  g.fillStyle = rumble > .6 ? "#fa6980" : "#ffd60a"; g.fillRect(28, 50, 224 * clamp(0.28 + state.elapsed / p.duration * 0.72, 0, 1), 8);
}

export default function RadiationShieldRush({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const settings = SETTINGS[strategy];
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(initial(strategy));
  const keys = useRef({ left: false, right: false });
  const pointerX = useRef<number | null>(null);
  const lastFrame = useRef(0);
  const spawnNumber = useRef(0);
  const [hud, setHud] = useState(() => initial(strategy));
  const [help, setHelp] = useState(true);

  const reset = useCallback(() => {
    world.current = initial(strategy);
    keys.current = { left: false, right: false };
    pointerX.current = null;
    spawnNumber.current = 0;
    setHud({ ...world.current });
    setHelp(false);
  }, [strategy]);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " "].includes(k)) e.preventDefault();
      if (k === "arrowleft" || k === "a") keys.current.left = true;
      if (k === "arrowright" || k === "d") keys.current.right = true;
    }
    function up(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.current.left = false;
      if (k === "arrowright" || k === "d") keys.current.right = false;
    }
    function blur() { keys.current.left = false; keys.current.right = false; }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  useEffect(() => {
    let raf = 0;
    let displayed = 0;
    lastFrame.current = 0;
    const render = (now: number) => {
      const context = canvas.current?.getContext("2d");
      const delta = lastFrame.current ? Math.min((now - lastFrame.current) / 1000, 0.05) : 0;
      lastFrame.current = now;
      const s = world.current;
      if (s.phase === "playing" && !busy && !help) {
        s.elapsed += delta;
        if (pointerX.current !== null) {
          const diff = pointerX.current - s.shieldX;
          s.shieldX += clamp(diff, -900 * delta, 900 * delta);
        } else {
s.shieldX += (Number(keys.current.right) - Number(keys.current.left)) * 850 * delta;        }
        s.shieldX = clamp(s.shieldX, settings.width / 2 + 8, W - settings.width / 2 - 8);
        s.spawn -= delta;
        if (s.spawn <= 0) {
          spawnNumber.current++;
          const n = spawnNumber.current;
          const isCharge = n % 8 === 0;
          const lane = (n * 137.13 + 120 + Math.sin(n * 1.4) * 50) % 840 + 60;
          s.bursts.push({ x: lane, y: -25, radius: isCharge ? 14 : 17 + n % 4 * 3, speed: settings.speed * (0.88 + (n % 5) * .09), strength: 11 + n % 3 * 4, type: isCharge ? "charge" : "burst" });
          s.spawn = Math.max(0.31, settings.spawn * (1 - s.elapsed / settings.duration * 0.24));
        }
        const survivors: Burst[] = [];
        for (const b of s.bursts) {
          b.y += b.speed * delta;
          if (b.y >= 334 && b.y <= 368 && Math.abs(b.x - s.shieldX) < settings.width / 2 + b.radius * .48) {
            if (b.type === "charge") { s.integrity = Math.min(100, s.integrity + 12); s.charges++; }
            else { s.blocks++; s.integrity = Math.max(0, s.integrity - 1.3); }
            for (let j = 0; j < 9; j++) s.sparks.push({ x: b.x + Math.sin(j * 2.6) * 15, y: 351 + Math.cos(j * 2.9) * 12, life: 1, color: b.type === "charge" ? "#9df9d7" : "#ffd60a" });
          } else if (b.y >= 490) {
            if (b.type === "burst") { s.reserve = Math.max(0, s.reserve - b.strength); s.hits++; }
          } else { survivors.push(b); }
        }
        s.bursts = survivors;
        s.sparks = s.sparks.filter(x => (x.life -= delta * 3) > 0);
        if (s.reserve <= 0 || s.integrity <= 0) s.phase = "lost";
        else if (s.elapsed >= settings.duration) s.phase = "won";
      }
      if (context) draw(context, s, strategy, now);
      if (now - displayed > 95) { setHud({ ...s }); displayed = now; }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf); lastFrame.current = 0; };
  }, [settings.duration, settings.spawn, settings.speed, settings.width, strategy, help, busy]);

  function movePointer(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    pointerX.current = clamp(((e.clientX - r.left) / r.width) * W, 0, W);
  }
  const progress = Math.min(100, hud.elapsed / settings.duration * 100);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#264667] bg-[#001d3d] px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Shield size={24}/></div><div><p className="text-[10px] font-black tracking-[.19em] text-[#ffd60a]">DAY 08 · SPACE WEATHER</p><h2 className="text-lg font-black sm:text-2xl">RADIATION SHIELD RUSH</h2></div></div>
        <div className="flex items-center gap-2"><button title="Instructions" aria-label="Instructions" onClick={() => setHelp(true)} className="rounded-lg border border-[#406387] p-2"><HelpCircle size={18}/></button><button title="Leave mission" aria-label="Leave mission" onClick={onClose} disabled={busy} className="rounded-lg p-2"><X size={22}/></button></div>
      </header>
      <section className="mx-auto grid w-full max-w-5xl shrink-0 grid-cols-3 gap-2 px-3 py-3 text-center sm:gap-4 sm:px-6">
        <div className="rounded-xl bg-[#001d3d] px-2 py-2"><p className="text-[10px] font-bold text-slate-400">BASE SHIELDING</p><p className={`text-xl font-black ${hud.integrity < 25 ? "text-red-300" : "text-[#ffd60a]"}`}>{Math.ceil(hud.integrity)}%</p></div>
        <div className="rounded-xl bg-[#001d3d] px-2 py-2"><p className="text-[10px] font-bold text-slate-400">BASE SAFETY</p><p className={`text-xl font-black ${hud.reserve < 35 ? "text-red-300" : "text-[#ffd60a]"}`}>{Math.ceil(hud.reserve)}%</p></div>
        <div className="rounded-xl bg-[#001d3d] px-2 py-2"><p className="text-[10px] font-bold text-slate-400">STORM</p><p className="text-xl font-black text-[#ffd60a]">{Math.ceil(Math.max(0, settings.duration - hud.elapsed))}s</p></div>
      </section>
      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-2 sm:px-5">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#31577b] shadow-[0_15px_70px_#0008]">
          <canvas ref={canvas} width={W} height={H} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); movePointer(e); }} onPointerMove={e => { if (e.pointerType === "mouse" || e.buttons) movePointer(e); }} onPointerUp={e => { if (e.pointerType !== "mouse") pointerX.current = null; }} onPointerCancel={() => pointerX.current = null} onPointerLeave={() => pointerX.current = null} className="h-full w-full touch-none object-fill" aria-label="Move the gold shield left and right to intercept red incoming bursts" />
          {hud.phase === "won" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814]/95 p-5 text-center"><div className="max-w-sm"><CheckCircle2 className="mx-auto mb-3 text-[#ffd60a]" size={55}/><h3 className="text-3xl font-black">CREW PROTECTED!</h3><p className="mt-2 text-sm text-slate-300">You protected the outpost through the radiation alert.</p><p className="mt-3 text-xs text-[#ffd60a]">{hud.blocks} bursts blocked · {hud.hits} reached the surface</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE"}</button></div></div>}
          {hud.phase === "lost" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814]/95 p-5 text-center"><div className="max-w-sm"><h3 className="text-3xl font-black">OUTPOST EXPOSED</h3><p className="mt-3 text-sm text-slate-300">The shield failed. Try a different strategy and protect the habitat.</p><button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw size={18}/> RESTART MISSION</button></div></div>}
          {help && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814]/95 p-5"><div className="w-full max-w-sm text-center"><Shield className="mx-auto mb-4 text-[#ffd60a]" size={47}/><h3 className="text-3xl font-black">DEFEND THE BASE</h3><p className="mt-4 text-base text-slate-200">MOVE THE GOLD SHIELD.<br/>BLOCK RED BURSTS.<br/>CATCH GREEN ENERGY.</p><p className="mt-4 text-xs text-slate-400">Mouse / touch / A-D / arrow keys · Survive until the storm ends</p><button onClick={() => { setHelp(false); if (world.current.phase === "ready") world.current.phase = "playing"; }} className="mt-7 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]">START DEFENSE <Zap size={18} className="ml-1 inline"/></button></div></div>}
        </div>
      </div>
      <footer className="mx-auto w-full max-w-5xl shrink-0 px-3 pb-3 pt-2 sm:px-6">
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#193654]"><div className="h-full rounded-full bg-[#ffc300] transition-[width] duration-100" style={{width:`${progress}%`}} /></div>
        <div className="flex items-center justify-between gap-2"><button onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId);keys.current.left=true;pointerX.current=null;}} onPointerUp={()=>keys.current.left=false} onPointerCancel={()=>keys.current.left=false} onLostPointerCapture={()=>keys.current.left=false} className="grid h-12 w-20 touch-none place-items-center rounded-xl bg-[#003566] active:bg-[#255e96]" aria-label="Move shield left"><ArrowLeft/></button><span className="text-center text-[10px] font-bold tracking-wide text-[#bdd1e8] sm:text-xs">MOVE TO BLOCK · {hud.blocks} BLOCKED</span><button onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId);keys.current.right=true;pointerX.current=null;}} onPointerUp={()=>keys.current.right=false} onPointerCancel={()=>keys.current.right=false} onLostPointerCapture={()=>keys.current.right=false} className="grid h-12 w-20 touch-none place-items-center rounded-xl bg-[#003566] active:bg-[#255e96]" aria-label="Move shield right"><ArrowRight/></button><button onClick={reset} title="Restart" aria-label="Restart mission" className="rounded-xl border border-[#345a80] p-3 text-[#ffd60a]"><RotateCcw size={18}/></button></div>
        <p className="mt-2 text-center text-[10px] text-slate-500">SCIENCE NOTE: Actual protection relies on monitoring, shielding and moving astronauts to shelter—not catching radiation with a movable shield.</p>
      </footer>
    </div>
  );
}
