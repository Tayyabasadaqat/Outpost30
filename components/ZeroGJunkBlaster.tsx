"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Crosshair, HelpCircle, RotateCcw, ShieldAlert, Sparkles, X } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Kind = "recycle" | "hazard";
type Waste = { label: string; kind: Kind; fact: string; color: string };
type Shot = { x: number; y: number; vx: number; vy: number; age: number; target: number };
type Phase = "tutorial" | "playing" | "won" | "lost";
type Game = { phase: Phase; index: number; score: number; mistakes: number; seconds: number; aimX: number; shot: Shot | null; obstacles: number; elapsed: number; message: string; shake: number; lastFact: string };

const W = 960, H = 550, START_X = 480, START_Y = 135, GOAL_Y = 460;
const GRAVITY = 255, FLIGHT = 1.2;
const ITEMS: Waste[] = [
  { label: "ALUMINUM SCRAP", kind: "recycle", fact: "Metals can be melted and reused, saving cargo mass on long missions.", color: "#8de8ff" },
  { label: "USED FILTER", kind: "hazard", fact: "Contaminated filters must be isolated until they can be handled safely.", color: "#ffad7b" },
  { label: "PLASTIC OFFCUTS", kind: "recycle", fact: "Some plastics can be reprocessed into useful new parts.", color: "#8de8ff" },
  { label: "LEAKING CELL", kind: "hazard", fact: "Damaged batteries need isolation to protect the crew and equipment.", color: "#ffad7b" },
  { label: "METAL BRACKETS", kind: "recycle", fact: "Sorting materials makes recycling more effective.", color: "#8de8ff" },
  { label: "CHEMICAL WIPES", kind: "hazard", fact: "Chemical-contaminated items cannot go into ordinary recycling.", color: "#ffad7b" },
  { label: "PACKAGING FILM", kind: "recycle", fact: "Reducing and reusing packaging reduces mission waste.", color: "#8de8ff" },
  { label: "BROKEN BATTERY", kind: "hazard", fact: "Electrical waste needs careful containment and processing.", color: "#ffad7b" },
  { label: "STEEL FASTENERS", kind: "recycle", fact: "Recovering metals helps crews make the most of limited supplies.", color: "#8de8ff" },
  { label: "DIRTY SOLVENT", kind: "hazard", fact: "Hazardous liquid waste must be contained separately.", color: "#ffad7b" },
];
const SETTINGS = {
  safe: { seconds: 175, mistakes: 5, speed: 0.62, width: 250 },
  risky: { seconds: 150, mistakes: 4, speed: 0.95, width: 225 },
  dangerous: { seconds: 130, mistakes: 3, speed: 1.3, width: 205 },
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const init = (cfg: typeof SETTINGS.safe): Game => ({ phase: "tutorial", index: 0, score: 0, mistakes: cfg.mistakes, seconds: cfg.seconds, aimX: 260, shot: null, obstacles: 0, elapsed: 0, message: "AIM AT THE MATCHING BAY, THEN LAUNCH YOUR JUNK CAPSULE!", shake: 0, lastFact: "" });

export default function ZeroGJunkBlaster({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const cfg = SETTINGS[strategy];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(init(cfg));
  const [ui, setUi] = useState<Game>(() => ({ ...gameRef.current }));
  const [help, setHelp] = useState(false);
  const live = useRef({ busy, help });
  live.current = { busy, help };
  const sync = useCallback(() => setUi({ ...gameRef.current }), []);
  const reset = useCallback(() => { gameRef.current = init(cfg); setHelp(false); sync(); }, [cfg, sync]);
  const start = useCallback(() => { gameRef.current.phase = "playing"; sync(); }, [sync]);
  const aim = useCallback((x: number) => { const g = gameRef.current; if (g.phase !== "playing" || g.shot || live.current.help) return; g.aimX = clamp(x, 40, 920); sync(); }, [sync]);
  const fire = useCallback(() => {
    const g = gameRef.current;
    if (g.phase !== "playing" || g.shot || live.current.busy || live.current.help) return;
    g.shot = { x: START_X, y: START_Y, vx: (g.aimX - START_X) / FLIGHT, vy: (GOAL_Y - START_Y - 0.5 * GRAVITY * FLIGHT ** 2) / FLIGHT, age: 0, target: g.aimX };
    g.message = "CAPSULE AWAY! WATCH FOR THE MOVING SPACE DEBRIS.";
    sync();
  }, [sync]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (["Space", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.code === "Space" || e.code === "Enter") { if (!e.repeat) fire(); }
      if (e.code === "ArrowLeft" || e.key.toLowerCase() === "a") aim(gameRef.current.aimX - 37);
      if (e.code === "ArrowRight" || e.key.toLowerCase() === "d") aim(gameRef.current.aimX + 37);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [aim, fire]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const g = gameRef.current;
      if (g.phase !== "playing" || live.current.help || live.current.busy) return;
      g.seconds = Math.max(0, g.seconds - 1);
      if (!g.seconds) { g.phase = "lost"; g.message = "RECYCLER SHUT DOWN. TRY AGAIN!"; }
      sync();
    }, 1000);
    return () => window.clearInterval(id);
  }, [sync]);
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0, last = 0, syncStamp = 0;
    function draw(time: number) {
      const dt = last ? Math.min((time - last) / 1000, .04) : 0;
      last = time;
      const g = gameRef.current;
      const active = g.phase === "playing" && !live.current.help && !live.current.busy;
      if (active) {
        g.elapsed += dt;
        g.shake = Math.max(0, g.shake - dt * 2.5);
        if (g.shot) {
          const shot = g.shot;
          const oldY = shot.y;
          shot.age += dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.vy += GRAVITY * dt;
          // An orbiting piece of machinery can knock a capsule off course.
          const obstacleX = START_X + Math.sin(g.elapsed * cfg.speed * 1.8) * 275;
          if (oldY < 310 && shot.y >= 310 && Math.abs(shot.x - obstacleX) < 48) {
            shot.vx += shot.x < obstacleX ? -145 : 145;
            g.message = "BONK! THE ROTATING ARM DEFLECTED YOUR SHOT!";
            g.shake = .6;
          }
          if (shot.y >= GOAL_Y || shot.x < -40 || shot.x > W + 40 || shot.age > 3.3) {
            const item = ITEMS[g.index];
            const inLeft = shot.x >= 60 && shot.x <= 60 + cfg.width;
            const inRight = shot.x >= W - 60 - cfg.width && shot.x <= W - 60;
            const correct = (item.kind === "recycle" && inLeft) || (item.kind === "hazard" && inRight);
            if (correct) {
              g.score += 1;
              g.lastFact = item.fact;
              g.message = `NICE SHOT! ${item.label} SECURED. ${item.fact}`;
              g.index += 1;
              if (g.index >= ITEMS.length) { g.phase = "won"; g.message = "RECYCLING SYSTEM RESTORED!"; }
            } else {
              g.mistakes -= 1;
              g.shake = 1;
              g.message = "WRONG BAY OR MISSED! AIM DEEPER INTO THE HIGHLIGHTED ZONE.";
              if (g.mistakes <= 0) { g.phase = "lost"; g.message = "TOO MANY MISROUTED PACKAGES. TRY AGAIN!"; }
            }
            g.shot = null;
            sync();
          }
        }
      }
      ctx!.clearRect(0, 0, W, H);
      const bg = ctx!.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#020b1d"); bg.addColorStop(1, "#08335a"); ctx!.fillStyle = bg; ctx!.fillRect(0, 0, W, H);
      for (let i = 0; i < 78; i++) { const x = (i * 137 + 42) % W, y = (i * 79 + 27) % 430; ctx!.fillStyle = i % 4 === 0 ? "#84b6da" : "#537491"; ctx!.fillRect(x, y, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1); }
      ctx!.strokeStyle = "#2a5174"; ctx!.lineWidth = 2;
      for (let i = 0; i < 7; i++) { ctx!.beginPath(); ctx!.moveTo(0, 45 + i * 60); ctx!.lineTo(W, 45 + i * 60); ctx!.stroke(); }
      // Receiving bays
      const bay = (x: number, color: string, name: string, subtitle: string) => {
        ctx!.fillStyle = color + "22"; ctx!.fillRect(x, GOAL_Y, cfg.width, 80);
        ctx!.strokeStyle = color; ctx!.lineWidth = 5; ctx!.strokeRect(x, GOAL_Y, cfg.width, 80);
        ctx!.font = "900 23px system-ui"; ctx!.fillStyle = color; ctx!.textAlign = "center"; ctx!.fillText(name, x + cfg.width / 2, GOAL_Y + 34);
        ctx!.font = "bold 12px system-ui"; ctx!.fillStyle = "#ffffff"; ctx!.fillText(subtitle, x + cfg.width / 2, GOAL_Y + 56);
      };
      bay(60, "#79ddff", "♻ RECYCLER", "METAL / PLASTIC");
      bay(W - 60 - cfg.width, "#ffb075", "⚠ ISOLATION", "BATTERY / HAZARD");
      // Moving orbital hazard
      const obstacleX = START_X + Math.sin(g.elapsed * cfg.speed * 1.8) * 275;
      ctx!.save(); ctx!.translate(obstacleX, 310); ctx!.rotate(Math.sin(g.elapsed) * .15);
      ctx!.fillStyle = "#9f5968"; ctx!.strokeStyle = "#ff7c91"; ctx!.lineWidth = 3;
      ctx!.beginPath(); ctx!.roundRect(-45, -16, 90, 32, 8); ctx!.fill(); ctx!.stroke();
      ctx!.fillStyle = "#ffd60a"; ctx!.fillRect(-9, -8, 18, 16);
      ctx!.restore();
      ctx!.font = "bold 12px system-ui"; ctx!.textAlign = "center"; ctx!.fillStyle = "#ffb3bc"; ctx!.fillText("MOVING MACHINE — AVOID!", obstacleX, 282);
      // Launcher and sight
      ctx!.save(); ctx!.translate(START_X, START_Y);
      ctx!.fillStyle = "#153b61"; ctx!.strokeStyle = "#ffd60a"; ctx!.lineWidth = 4;
      ctx!.beginPath(); ctx!.arc(0, 0, 39, 0, Math.PI * 2); ctx!.fill(); ctx!.stroke();
      ctx!.font = "900 13px system-ui"; ctx!.fillStyle = "#ffd60a"; ctx!.textAlign = "center"; ctx!.fillText("LAUNCH", 0, 5);
      ctx!.restore();
      if (g.phase === "playing" && !g.shot) {
        const vx = (g.aimX - START_X) / FLIGHT;
        const vy = (GOAL_Y - START_Y - .5 * GRAVITY * FLIGHT * FLIGHT) / FLIGHT;
        ctx!.fillStyle = "#ffd60a";
        for (let t = .1; t < FLIGHT; t += .095) {
          ctx!.beginPath(); ctx!.arc(START_X + vx * t, START_Y + vy * t + .5 * GRAVITY * t * t, 3.8, 0, Math.PI * 2); ctx!.fill();
        }
        ctx!.strokeStyle = "#ffd60a"; ctx!.lineWidth = 2;
        ctx!.beginPath(); ctx!.arc(g.aimX, GOAL_Y - 8, 16, 0, 2 * Math.PI); ctx!.stroke();
      }
      if (g.shot) {
        ctx!.fillStyle = ITEMS[g.index].color + "35";
        ctx!.beginPath(); ctx!.arc(g.shot.x, g.shot.y, 21, 0, Math.PI * 2); ctx!.fill();
        ctx!.fillStyle = ITEMS[g.index].color; ctx!.strokeStyle = "white"; ctx!.lineWidth = 3;
        ctx!.beginPath(); ctx!.arc(g.shot.x, g.shot.y, 12, 0, Math.PI * 2); ctx!.fill(); ctx!.stroke();
      }
      raf = window.requestAnimationFrame(draw);
      if (time - syncStamp > 130) { syncStamp = time; if (g.phase === "playing") sync(); }
    }
    raf = window.requestAnimationFrame(draw);
    return () => { window.cancelAnimationFrame(raf); };
  }, [cfg, sync]);
  const item = ITEMS[Math.min(ui.index, ITEMS.length - 1)];
  const clock = `${Math.floor(ui.seconds / 60).toString().padStart(2, "0")}:${(ui.seconds % 60).toString().padStart(2, "0")}`;
  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    aim((e.clientX - rect.left) / rect.width * W);
  };
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#27476c] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div><p className="text-[10px] font-bold tracking-[.22em] text-[#ffd60a]">DAY 24 · WASTE PROCESSING</p><h1 className="text-xl font-black sm:text-2xl">ZERO-G JUNK BLASTER</h1></div>
        <div className="flex items-center gap-3"><span className="text-xs font-bold text-[#ffd60a]">{ui.score}/{ITEMS.length} RECOVERED</span><span className="rounded-lg border border-[#3c607e] px-3 py-2 text-sm font-bold">⏱ {clock}</span><button aria-label="How to play" onClick={() => setHelp(true)} className="rounded-lg border border-[#486a88] p-2"><HelpCircle size={19} /></button><button aria-label="Close mission" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-[#003566]"><X size={21} /></button></div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#31557a] bg-[#001d3d] p-3">
          <div><p className="text-[10px] font-black tracking-[.16em] text-[#a9c2d9]">CURRENT CARGO · {Math.min(ui.index + 1, 10)} OF 10</p><p className="text-base font-black text-white">{item.label}</p></div>
          <div className={`rounded-lg border px-3 py-2 text-xs font-black ${item.kind === "recycle" ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-orange-400 bg-orange-400/10 text-orange-200"}`}>{item.kind === "recycle" ? "♻ AIM LEFT · RECYCLER" : "⚠ AIM RIGHT · ISOLATION"}</div>
          <div className="text-xs font-black text-[#ffd60a]">REPAIR CHANCES: {"♥ ".repeat(Math.max(0, ui.mistakes))}</div>
        </div>
        <div className="relative min-h-[210px] flex-1 overflow-hidden rounded-2xl border border-[#365c7e] bg-[#061a2b]" style={{ maxHeight: "min(66vh, 570px)" }}>
          <canvas ref={canvasRef} width={W} height={H} className="h-full w-full touch-none cursor-crosshair object-fill" onPointerMove={pointer} onPointerDown={e => { pointer(e); fire(); }} aria-label="Waste launcher: aim at the matching recycling bay then fire" />
          {ui.phase === "won" && <div className="absolute inset-0 z-10 grid place-items-center bg-[#000814eF] p-5 text-center"><div className="max-w-sm"><CheckCircle2 className="mx-auto mb-4 text-[#ffd60a]" size={55}/><h2 className="text-3xl font-black">RECYCLER ONLINE!</h2><p className="mt-3 text-sm text-[#b9cee0]">All 10 waste packages secured! You protected the habitat and recovered reusable materials.</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE"}</button></div></div>}
          {ui.phase === "lost" && <div className="absolute inset-0 z-10 grid place-items-center bg-[#000814ed] p-5 text-center"><div><ShieldAlert className="mx-auto mb-4 text-[#ffc300]" size={50}/><h2 className="text-3xl font-black">RECYCLER NEEDS A RESET</h2><p className="mt-3 text-[#bbcee0]">Try aiming closer to the middle of each bay.</p><button onClick={reset} className="mt-5 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw className="mr-2 inline" size={18}/>TRY AGAIN</button></div></div>}
        </div>
        <p role="status" aria-live="polite" className="my-2 min-h-5 text-center text-xs font-bold text-[#ffd60a]">{ui.message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3"><button disabled={ui.phase !== "playing" || !!ui.shot || busy} onClick={() => aim(gameRef.current.aimX - 50)} className="rounded-xl border border-[#547393] bg-[#001d3d] px-6 py-3 disabled:opacity-40"><ArrowLeft /></button><button disabled={ui.phase !== "playing" || !!ui.shot || busy} onClick={fire} className="flex min-w-44 items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-6 py-3 font-black text-[#000814] disabled:opacity-40"><Crosshair size={19}/> FIRE CAPSULE</button><button disabled={ui.phase !== "playing" || !!ui.shot || busy} onClick={() => aim(gameRef.current.aimX + 50)} className="rounded-xl border border-[#547393] bg-[#001d3d] px-6 py-3 disabled:opacity-40"><ArrowRight /></button><button onClick={reset} disabled={busy} className="rounded-lg border border-[#56728c] p-3"><RotateCcw size={18}/></button></div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-[#b1c5dc]"><span>MOVE MOUSE / ← → TO AIM</span><span>CLICK / SPACE TO FIRE · AVOID MOVING ARM</span></div>
      </div>
      {(ui.phase === "tutorial" || help) && <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#000814f2] p-4"><div className="w-full max-w-md rounded-2xl border border-[#ffd60a66] bg-[#001d3d] p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black tracking-widest text-[#ffd60a]">DAY 24 · HOW TO PLAY</p><h2 className="mt-1 text-2xl font-black">ZERO-G JUNK BLASTER</h2></div>{help && <button onClick={() => setHelp(false)} aria-label="Close instructions"><X/></button>}</div><div className="space-y-3 text-sm text-[#dbe9f5]"><p>🎯 <b>AIM:</b> Move your mouse or press ← / →. Follow the dotted golden arc.</p><p>🚀 <b>FIRE:</b> Click or press Space to launch a waste capsule.</p><p>♻️ <b>BLUE LEFT:</b> Reusable metal and plastic belong in the recycler.</p><p>⚠️ <b>ORANGE RIGHT:</b> Contaminated filters and batteries go to isolation.</p><p>🛰️ <b>DODGE:</b> The moving red machine can knock your capsule away!</p><p>🏆 <b>WIN:</b> Secure all 10 packages before time or repair chances run out.</p></div><div className="mt-5 rounded-xl bg-[#082c4d] p-3 text-xs text-[#a9c8e2]">NASA learning: spacecraft waste systems try to recover usable materials while safely containing hazardous waste. This launcher is an arcade simplification.</div><button onClick={() => { if (ui.phase === "tutorial") start(); setHelp(false); }} className="mt-5 w-full rounded-xl bg-[#ffc300] py-4 font-black text-[#000814]">{ui.phase === "tutorial" ? "START RECYCLING MISSION" : "BACK TO MISSION"}</button></div></div>}
    </div>
  );
}
