"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Crosshair, FlaskConical, HelpCircle, RotateCcw, Rocket, X } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "playing" | "won" | "lost";
type Shot = { x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[] };
type Game = { phase: Phase; stage: number; attempts: number; time: number; angle: number; shot: Shot | null; targetX: number; now: number; message: string; hits: number };
const W = 960, H = 540, ORIGIN = { x: 112, y: 415 }, SPEED = 690;
const TRIALS = [
  { name: "EARTH-GRAVITY TEST", grav: 610, x: 585, y: 318, r: 49, note: "Stronger gravity pulls the capsule down faster. Aim high!", detail: "EARTH-LIKE GRAVITY" },
  { name: "MOON-GRAVITY TEST", grav: 175, x: 690, y: 260, r: 50, note: "The Moon has about one-sixth of Earth's gravity. The capsule stays airborne longer!", detail: "LOW-GRAVITY SIMULATION" },
  { name: "MOVING SCIENCE TARGET", grav: 175, x: 715, y: 305, r: 53, note: "Now predict where a moving collector will be when your capsule arrives.", detail: "LUNAR GRAVITY + MOTION" },
] as const;
const SETTINGS = {
  safe: { time: 165, attempts: 12, motion: 32 },
  risky: { time: 135, attempts: 9, motion: 49 },
  dangerous: { time: 115, attempts: 7, motion: 66 },
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const makeGame = (s: typeof SETTINGS.safe): Game => ({ phase: "tutorial", stage: 0, attempts: s.attempts, time: s.time, angle: -30, shot: null, targetX: TRIALS[0].x, now: 0, message: "AIM YOUR LAUNCHER AND HIT THE RESEARCH TARGET!", hits: 0 });

export default function LunarGravityLab({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const cfg = SETTINGS[strategy];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<Game>(makeGame(cfg));
  const [ui, setUi] = useState<Game>(() => ({ ...state.current }));
  const [showHelp, setShowHelp] = useState(false);
  const [flash, setFlash] = useState(0);
  const live = useRef({ busy, help: showHelp });
  live.current = { busy, help: showHelp };
  const snapshot = useCallback(() => { setUi({ ...state.current }); }, []);
  const reset = useCallback(() => { state.current = makeGame(cfg); setFlash(0); setShowHelp(false); snapshot(); }, [cfg, snapshot]);
  const start = () => { state.current.phase = "playing"; state.current.message = TRIALS[0].note; snapshot(); };
  const fire = useCallback(() => {
    const s = state.current;
    if (s.phase !== "playing" || s.shot || s.attempts <= 0 || live.current.busy || live.current.help) return;
    const radians = s.angle * Math.PI / 180;
    s.shot = { x: ORIGIN.x, y: ORIGIN.y, vx: SPEED * Math.cos(radians), vy: SPEED * Math.sin(radians), trail: [] };
    s.attempts--;
    s.message = "CAPSULE LAUNCHED! WATCH ITS CURVED FLIGHT PATH.";
    snapshot();
  }, [snapshot]);
  const aim = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const s = state.current;
    if (!canvas || s.phase !== "playing" || s.shot) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * W, y = (clientY - rect.top) / rect.height * H;
    s.angle = clamp(Math.atan2(y - ORIGIN.y, x - ORIGIN.x) * 180 / Math.PI, -78, -7);
    snapshot();
  }, [snapshot]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
      const s = state.current;
      if (s.phase !== "playing" || live.current.help) return;
      if (e.code === "Space" || e.code === "Enter") { if (!e.repeat) fire(); }
      if (!s.shot && (e.code === "ArrowUp" || e.key.toLowerCase() === "w")) { s.angle = clamp(s.angle - 3, -78, -7); snapshot(); }
      if (!s.shot && (e.code === "ArrowDown" || e.key.toLowerCase() === "s")) { s.angle = clamp(s.angle + 3, -78, -7); snapshot(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [fire, snapshot]);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0, previous = 0, sync = 0;
    const stars = Array.from({ length: 85 }, (_, i) => ({ x: (i * 137 + 53) % W, y: (i * 67 + 19) % 385, r: i % 5 === 0 ? 1.7 : 0.9 }));
    function draw(now: number) {
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 0;
      previous = now;
      const s = state.current, trial = TRIALS[Math.min(s.stage, 2)];
      const active = s.phase === "playing" && !live.current.busy && !live.current.help;
      if (active) {
        s.now += dt;
        s.time = Math.max(0, s.time - dt);
        s.targetX = trial.x + (s.stage === 2 ? Math.sin(s.now * 1.28) * cfg.motion : 0);
        const shot = s.shot;
        if (shot) {
          const oldX = shot.x, oldY = shot.y;
          shot.vy += trial.grav * dt;
          shot.x += shot.vx * dt;
          shot.y += shot.vy * dt;
          shot.trail.push({ x: shot.x, y: shot.y });
          if (shot.trail.length > 70) shot.trail.shift();
          const ax = shot.x - s.targetX, ay = shot.y - trial.y;
          const bx = oldX - s.targetX, by = oldY - trial.y;
          const hit = Math.min(Math.hypot(ax, ay), Math.hypot(bx, by)) < trial.r + 9;
          if (hit) {
            s.shot = null; s.hits++; s.stage++;
            if (s.stage >= TRIALS.length) { s.phase = "won"; s.message = "ALL THREE EXPERIMENTS COMPLETE!"; }
            else { s.angle = s.stage === 1 ? -21 : -20; s.message = `SAMPLE CAPTURED! ${TRIALS[s.stage].note}`; s.targetX = TRIALS[s.stage].x; }
            setFlash(v => v + 1);
            snapshot();
          } else if (shot.y > H - 42 || shot.x > W + 25 || shot.y < -150) {
            s.shot = null;
            s.message = "MISSED! FOLLOW THE DOTTED FLIGHT PATH AND AIM AGAIN.";
            if (s.attempts <= 0) { s.phase = "lost"; s.message = "OUT OF EXPERIMENT CAPSULES!"; }
            snapshot();
          }
        }
        if (s.time <= 0 && s.phase === "playing") { s.phase = "lost"; s.message = "EXPERIMENT WINDOW CLOSED!"; snapshot(); }
      }
      const g = ctx!;
      const background = g.createLinearGradient(0, 0, 0, H);
      background.addColorStop(0, "#000814"); background.addColorStop(1, "#003566");
      g.fillStyle = background; g.fillRect(0, 0, W, H);
      for (const star of stars) { g.globalAlpha = 0.45 + 0.25 * Math.sin(now / 980 + star.x); g.fillStyle = "#d5eaf9"; g.beginPath(); g.arc(star.x, star.y, star.r, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1;
      g.fillStyle = "#1d3049"; g.beginPath(); g.ellipse(430, H + 60, 620, 158, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#43536b"; g.fillRect(0, H - 51, W, 51);
      for (let i = 0; i < 15; i++) { g.strokeStyle = "#253a50"; g.lineWidth = 2; g.beginPath(); g.ellipse((i * 129) % W, H - 28 + i % 3 * 8, 16 + i % 4 * 6, 5, 0, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = "#071b32"; g.fillRect(35, H - 105, 164, 54);
      g.strokeStyle = "#ffd60a"; g.lineWidth = 3; g.strokeRect(35, H - 105, 164, 54);
      g.fillStyle = "#ffd60a"; g.font = "bold 15px system-ui"; g.fillText("GRAVITY LAB", 51, H - 75);
      // Target collector and capture ring.
      g.save(); g.translate(s.targetX, trial.y);
      g.shadowColor = "#79ebff"; g.shadowBlur = 23;
      g.beginPath(); g.arc(0, 0, trial.r, 0, Math.PI * 2); g.fillStyle = "#09375a"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#67dfff"; g.stroke();
      g.shadowBlur = 0; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fillStyle = "#ffc300"; g.fill();
      g.fillStyle = "#d9f8ff"; g.font = "bold 12px system-ui"; g.textAlign = "center"; g.fillText("SAMPLE", 0, -trial.r - 15); g.fillText("COLLECTOR", 0, -trial.r - 1); g.restore();
      // Launch stand and rotating barrel.
      g.fillStyle = "#576c82"; g.fillRect(74, ORIGIN.y + 9, 75, 56);
      g.save(); g.translate(ORIGIN.x, ORIGIN.y); g.rotate(s.angle * Math.PI / 180);
      g.fillStyle = "#ffc300"; g.fillRect(0, -12, 68, 24); g.fillStyle = "#ffec97"; g.fillRect(48, -15, 22, 30); g.restore();
      g.beginPath(); g.arc(ORIGIN.x, ORIGIN.y, 24, 0, Math.PI * 2); g.fillStyle = "#002749"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#ffc300"; g.stroke();
      // Predict trajectory with dots, including real gravitational acceleration.
      if (s.phase === "playing" && !s.shot) {
        const a = s.angle * Math.PI / 180, vx = SPEED * Math.cos(a), vy = SPEED * Math.sin(a);
        for (let t = 0.09; t < 1.9; t += 0.065) {
          const px = ORIGIN.x + vx * t, py = ORIGIN.y + vy * t + 0.5 * trial.grav * t * t;
          if (px > W || py > H - 47 || py < 0) break;
          g.beginPath(); g.arc(px, py, 3.5, 0, Math.PI * 2); g.fillStyle = "#ffd60a99"; g.fill();
        }
      }
      if (s.shot) {
        for (let i = 0; i < s.shot.trail.length; i++) { const p = s.shot.trail[i]; g.fillStyle = `rgba(255,214,10,${0.15 + .7 * i / s.shot.trail.length})`; g.beginPath(); g.arc(p.x, p.y, 3 + 4 * i / s.shot.trail.length, 0, 2 * Math.PI); g.fill(); }
        g.shadowColor = "#ffc300"; g.shadowBlur = 20; g.fillStyle = "#fff1a8"; g.beginPath(); g.arc(s.shot.x, s.shot.y, 12, 0, 2 * Math.PI); g.fill(); g.shadowBlur = 0;
      }
      g.textAlign = "left"; g.fillStyle = "#acc9e4"; g.font = "bold 15px system-ui"; g.fillText(trial.detail, 27, 35);
      g.fillStyle = "#ffd60a"; g.font = "bold 19px system-ui"; g.fillText(`${Math.abs(s.angle).toFixed(0)}° LAUNCH ANGLE`, 27, 65);
      g.fillStyle = "#d2edff"; g.font = "bold 12px system-ui"; g.fillText("GOLD DOTS = PREDICTED CAPSULE PATH", 27, 89);
      if (s.phase !== "playing") { g.fillStyle = "#00081455"; g.fillRect(0, 0, W, H); }
      if (now - sync > 110 && active) { sync = now; snapshot(); }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [cfg.motion, snapshot]);
  const trial = TRIALS[Math.min(ui.stage, 2)];
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#294967] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><FlaskConical size={22}/></span><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 23 · SCIENTIFIC EXPERIMENT</p><h2 className="text-lg font-black sm:text-2xl">GRAVITY LAB</h2></div></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowHelp(true)} className="rounded-lg border border-[#466784] p-2" aria-label="How to play"><HelpCircle size={18}/></button><button onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" aria-label="Close"><X size={20}/></button></div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black"><span className="text-[#ffd60a]">TRIAL {Math.min(ui.stage + 1, 3)}/3 · {trial.name}</span><span>CAPSULES: <span className="text-[#ffd60a]">{ui.attempts}</span></span><span>TIME: <span className="text-[#ffd60a]">{Math.ceil(ui.time)}s</span></span></div>
        <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-[#36597c] bg-[#001d3d]">
          <canvas ref={canvasRef} width={W} height={H} className="h-full w-full touch-none cursor-crosshair object-fill" onPointerMove={e => aim(e.clientX, e.clientY)} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); aim(e.clientX,e.clientY); }} aria-label="Gravity laboratory. Aim toward target using pointer or the arrow controls below." />
          {(ui.phase === "tutorial" || showHelp) && <div className="absolute inset-0 z-20 grid place-items-center overflow-auto bg-[#000814ee] p-4"><div className="w-full max-w-md space-y-4 rounded-2xl border border-[#ffc30088] bg-[#001d3d] p-6 text-center"><Rocket size={34} className="mx-auto text-[#ffc300]"/><h3 className="text-2xl font-black">HOW TO PLAY</h3><p className="text-sm leading-6 text-slate-200">1. Move your mouse or finger to <b className="text-[#ffd60a]">AIM</b> the launcher.<br/>2. Follow the <b className="text-[#ffd60a]">gold dotted path</b> to see where the capsule will fly.<br/>3. Press <b className="text-[#ffd60a]">SPACE</b> or the <b className="text-[#ffd60a]">FIRE</b> button to launch.<br/>4. Hit the glowing blue collector in all three experiments!</p><p className="text-xs text-[#9ec1dc]">The gravity changes between experiments, so you'll need to adjust your aim.</p><button onClick={() => { if (ui.phase === "tutorial") start(); setShowHelp(false); }} className="w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">{ui.phase === "tutorial" ? "START EXPERIMENT" : "BACK TO EXPERIMENT"}</button></div></div>}
          {ui.phase === "won" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-4"><div className="max-w-sm text-center"><CheckCircle2 size={52} className="mx-auto mb-3 text-[#ffd60a]"/><h3 className="text-3xl font-black">SCIENCE SUCCESS!</h3><p className="mt-3 text-sm leading-6 text-slate-200">You finished all 3 gravity experiments! The Moon's weaker gravity changes how objects travel.</p><button onClick={onComplete} disabled={busy} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE"}</button></div></div>}
          {ui.phase === "lost" && <div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-4"><div className="max-w-sm text-center"><h3 className="text-3xl font-black text-[#ffd60a]">EXPERIMENT RETRY</h3><p className="mt-3 text-sm text-slate-200">Try aiming a little higher or lower using the predicted flight path.</p><button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]"><RotateCcw size={18}/> TRY AGAIN</button></div></div>}
        </div>
        <p className="min-h-5 text-center text-xs font-bold text-[#ffd60a]">{ui.message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3"><button onClick={() => {state.current.angle = clamp(state.current.angle - 3, -78, -7); snapshot();}} disabled={ui.phase !== "playing" || !!ui.shot} className="rounded-xl border border-[#4c6e8d] bg-[#001d3d] px-5 py-3 text-sm font-black disabled:opacity-40">AIM HIGHER ↑</button><button onClick={fire} disabled={ui.phase !== "playing" || !!ui.shot || busy} className="flex items-center gap-2 rounded-xl bg-[#ffc300] px-8 py-3 font-black text-[#000814] disabled:opacity-40"><Crosshair size={19}/> FIRE · SPACE</button><button onClick={() => {state.current.angle = clamp(state.current.angle + 3, -78, -7); snapshot();}} disabled={ui.phase !== "playing" || !!ui.shot} className="rounded-xl border border-[#4c6e8d] bg-[#001d3d] px-5 py-3 text-sm font-black disabled:opacity-40">AIM LOWER ↓</button><button onClick={reset} disabled={busy} title="Restart experiment" className="rounded-xl border border-[#4c6e8d] p-3"><RotateCcw size={18}/></button></div>
        <div className="flex gap-2">{TRIALS.map((t, i) => <div key={t.name} className={`h-1.5 flex-1 rounded-full ${i < ui.stage ? "bg-[#ffc300]" : "bg-[#254260]"}`}/>)}</div>
        <p className="text-center text-[11px] text-[#a5bed4]">{trial.note} <span className="ml-2 text-[#ffc300]">This is a simplified physics simulation.</span></p>
      </div>
      <span className="sr-only">Return to your mission using the close button. Completed experiments submit your chosen strategy.</span>
    </div>
  );
}
