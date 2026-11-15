"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, CircleHelp, Clock3, Heart, RotateCcw, Shield, ShieldAlert, Sun, Users, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Phase = "intro" | "playing" | "won" | "lost";
type Person = { name: string; x: number; y: number; state: "waiting" | "following" | "safe"; color: string };
type Simulation = { x: number; y: number; exposure: number; shield: number; shieldActive: boolean; storm: number; remaining: number; people: Person[]; message: string; lastHit: number };
const SET: Record<Strategy, { time: number; speed: number; storm: number; damage: number }> = {
  safe: { time: 155, speed: 32, storm: 0.8, damage: 13 },
  risky: { time: 135, speed: 34, storm: 1.05, damage: 17 },
  dangerous: { time: 120, speed: 36, storm: 1.3, damage: 20 },
};
const CREW: Person[] = [
  { name: "NOVA", x: 77, y: 23, state: "waiting", color: "#8de6fa" },
  { name: "ORION", x: 82, y: 72, state: "waiting", color: "#ffd60a" },
  { name: "LUNA", x: 29, y: 22, state: "waiting", color: "#95f3b4" },
];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (x: number, y: number, a: number, b: number) => Math.hypot(x - a, y - b);
const bunker = { x: 11, y: 82 };
function fresh(config: typeof SET.safe): Simulation {
  return { x: 13, y: 80, exposure: 100, shield: 100, shieldActive: false, storm: 0, remaining: config.time,
    people: CREW.map(p => ({ ...p })), message: "Find an astronaut. Get close to recruit them, then return to the shelter!", lastHit: 0 };
}

export default function SolarFlareShelter({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const cfg = SET[strategy];
  const [phase, setPhase] = useState<Phase>("intro");
  const [help, setHelp] = useState(false);
  const [view, setView] = useState<Simulation>(() => fresh(cfg));
  const state = useRef<Simulation>(fresh(cfg));
  const phaseRef = useRef<Phase>("intro");
  const keys = useRef({ up: false, down: false, left: false, right: false, shield: false });
  const previous = useRef(0);
  const lastRender = useRef(0);
  const reset = useCallback(() => {
    state.current = fresh(cfg);
    phaseRef.current = "intro";
    keys.current = { up: false, down: false, left: false, right: false, shield: false };
    setView(fresh(cfg));
    setPhase("intro");
    setHelp(false);
  }, [cfg]);
  const start = () => { phaseRef.current = "playing"; setPhase("playing"); setHelp(false); };
  const press = (k: keyof typeof keys.current, on: boolean) => { keys.current[k] = on; };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "w" || k === "arrowup") press("up", true);
      if (k === "s" || k === "arrowdown") press("down", true);
      if (k === "a" || k === "arrowleft") press("left", true);
      if (k === "d" || k === "arrowright") press("right", true);
      if (k === " ") press("shield", true);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") press("up", false);
      if (k === "s" || k === "arrowdown") press("down", false);
      if (k === "a" || k === "arrowleft") press("left", false);
      if (k === "d" || k === "arrowright") press("right", false);
      if (k === " ") press("shield", false);
    };
    const blur = () => { keys.current = { up: false, down: false, left: false, right: false, shield: false }; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - (previous.current || now)) / 1000, 0.05);
      previous.current = now;
      if (phaseRef.current === "playing" && !help && !busy) {
        const s = state.current;
        const k = keys.current;
        const vx = Number(k.right) - Number(k.left);
        const vy = Number(k.down) - Number(k.up);
        const mag = Math.max(1, Math.hypot(vx, vy));
        s.x = clamp(s.x + (vx / mag) * cfg.speed * dt, 4, 96);
        s.y = clamp(s.y + (vy / mag) * cfg.speed * dt, 7, 94);
        s.remaining = Math.max(0, s.remaining - dt);
        s.storm += dt;
        s.shieldActive = k.shield && s.shield > 1;
        s.shield = clamp(s.shield + (s.shieldActive ? -34 : 12) * dt, 0, 100);
        // A sweeping radiation-warning front. Real solar radiation does not travel in visible red stripes.
        const bandY = 15 + (s.storm * 22 * cfg.storm) % 88;
        const band2Y = 15 + ((s.storm * 22 * cfg.storm + 47) % 88);
        const danger = Math.abs(s.y - bandY) < 5 || Math.abs(s.y - band2Y) < 4;
        const atShelter = dist(s.x, s.y, bunker.x, bunker.y) < 12;
        if (danger && !atShelter && !s.shieldActive) {
          s.exposure = Math.max(0, s.exposure - cfg.damage * dt);
          if (now - s.lastHit > 1000) { s.message = "RADIATION ALERT! Hold SPACE to shield or hurry to shelter!"; s.lastHit = now; }
        }
        // Only one astronaut follows at a time, to make each rescue a deliberate mission.
        const following = s.people.find(p => p.state === "following");
        if (!following) {
          const close = s.people.find(p => p.state === "waiting" && dist(s.x, s.y, p.x, p.y) < 9);
          if (close) { close.state = "following"; s.message = `${close.name} IS FOLLOWING YOU! RETURN TO THE YELLOW SHELTER!`; }
        } else {
          following.x += (s.x - following.x) * Math.min(1, 5 * dt);
          following.y += (s.y + 5 - following.y) * Math.min(1, 5 * dt);
          if (atShelter && dist(following.x, following.y, bunker.x, bunker.y) < 20) {
            following.state = "safe";
            following.x = 5 + s.people.filter(p => p.state === "safe").length * 5;
            following.y = 88;
            s.message = `${following.name} SAFE! Find the next astronaut.`;
          }
        }
        if (s.people.every(p => p.state === "safe")) {
          phaseRef.current = "won"; setPhase("won"); s.message = "ALL THREE CREW MEMBERS RESCUED!";
        } else if (s.exposure <= 0 || s.remaining <= 0) {
          phaseRef.current = "lost"; setPhase("lost"); s.message = "THE RESCUE WINDOW CLOSED. TRY AGAIN!";
        }
        if (now - lastRender.current >= 40) { setView({ ...s, people: s.people.map(p => ({ ...p })) }); lastRender.current = now; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); previous.current = 0; };
  }, [cfg, help, busy]);
  const saved = view.people.filter(p => p.state === "safe").length;
  const count = view.people.filter(p => p.state === "following").length;
  const stripe = 15 + (view.storm * 22 * cfg.storm) % 88;
  const stripe2 = 15 + ((view.storm * 22 * cfg.storm + 47) % 88);
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#28476a] bg-[#001d3d] px-4 py-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Sun size={23}/></span><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 16 · SOLAR FLARE RESPONSE</p><h2 className="text-lg font-black sm:text-2xl">SHELTER SPRINT</h2></div></div>
      <div className="flex items-center gap-2"><span className="rounded-lg border border-[#355c7c] p-2 text-xs font-black"><Users size={14} className="mr-1 inline text-[#ffd60a]"/>{saved}/3 SAFE</span><span className="rounded-lg border border-[#355c7c] p-2 text-xs font-black"><Clock3 size={14} className="mr-1 inline text-[#ffd60a]"/>{Math.ceil(view.remaining)}s</span><button onClick={() => setHelp(true)} aria-label="How to play" className="rounded-lg border border-[#355c7c] p-2"><CircleHelp size={18}/></button><button onClick={onClose} disabled={busy} aria-label="Close" className="p-2"><X size={20}/></button></div>
    </header>
    <main className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-3 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 text-xs font-black sm:grid-cols-3">
        <div><div className="mb-1 flex justify-between"><span>SUIT SAFETY</span><span>{Math.ceil(view.exposure)}%</span></div><div className="h-2 overflow-hidden rounded bg-[#294158]"><div className="h-full bg-[#7ae5a5] transition-[width]" style={{width:`${view.exposure}%`}}/></div></div>
        <div><div className="mb-1 flex justify-between"><span>SHIELD CHARGE</span><span>{Math.ceil(view.shield)}%</span></div><div className="h-2 overflow-hidden rounded bg-[#294158]"><div className="h-full bg-[#ffd60a] transition-[width]" style={{width:`${view.shield}%`}}/></div></div>
        <div className="col-span-2 flex items-center justify-between text-[#ffd60a] sm:col-span-1"><span>{count ? "ESCORT CREW TO SHELTER!" : "FIND ASTRONAUTS!"}</span><button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 text-xs"><RotateCcw size={13}/> RESTART</button></div>
      </div>
      <div className="relative mx-auto min-h-[260px] w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-[#375779] bg-[#07162b]">
        <svg viewBox="0 0 1000 620" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Lunar rescue field">
          <defs><pattern id="moon16" width="55" height="55" patternUnits="userSpaceOnUse"><circle cx="12" cy="17" r="2" fill="#607992" opacity=".42"/><circle cx="39" cy="41" r="1.4" fill="#607992" opacity=".26"/></pattern><linearGradient id="flare16" x1="0" x2="1"><stop offset="0" stopColor="#ff5353" stopOpacity="0"/><stop offset="0.5" stopColor="#fb5454" stopOpacity=".44"/><stop offset="1" stopColor="#ff5353" stopOpacity="0"/></linearGradient></defs>
          <rect width="1000" height="620" fill="#0a1d36"/><rect width="1000" height="620" fill="url(#moon16)"/>
          {[{x:440,y:300,r:43},{x:620,y:420,r:32},{x:540,y:95,r:22},{x:350,y:480,r:28},{x:860,y:320,r:20}].map((c,i)=><g key={i}><ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r*.52} fill="#243c56" stroke="#344f69" strokeWidth="4"/><ellipse cx={c.x-7} cy={c.y-4} rx={c.r*.55} ry={c.r*.25} fill="#172d45"/></g>)}
          <rect x="0" y={stripe*6.2-23} width="1000" height="46" fill="url(#flare16)"/><path d={`M0 ${stripe*6.2} H1000`} stroke="#ff7777" strokeWidth="3" strokeDasharray="16 12" opacity=".75"/>
          <rect x="0" y={stripe2*6.2-18} width="1000" height="36" fill="url(#flare16)"/><path d={`M0 ${stripe2*6.2} H1000`} stroke="#ff7777" strokeWidth="2" strokeDasharray="12 16" opacity=".6"/>
          <circle cx={bunker.x*10} cy={bunker.y*6.2} r="76" fill="#ffc300" opacity=".1"/><rect x="26" y="437" width="168" height="157" rx="30" fill="#001d3d" stroke="#ffd60a" strokeWidth="6"/><path d="M44 500 Q110 421 178 500" fill="none" stroke="#ffd60a" strokeWidth="5"/><rect x="70" y="504" width="79" height="70" rx="9" fill="#173d56" stroke="#7cf2ca" strokeWidth="3"/><text x="110" y="471" textAnchor="middle" fill="#ffd60a" fontSize="20" fontWeight="bold">SHELTER</text><text x="110" y="586" textAnchor="middle" fill="#fff" fontSize="16">SAFE ZONE</text>
          {view.people.map((p,i)=><g key={p.name} transform={`translate(${p.x*10} ${p.y*6.2})`}><circle r="23" fill={p.state==="safe"?"#78eba5":p.color} opacity=".18"/><circle r="16" fill="#eaf4ff" stroke={p.color} strokeWidth="5"/><rect x="-13" y="11" width="26" height="22" rx="7" fill={p.color}/><circle cx="-5" cy="-1" r="3" fill="#17334d"/><circle cx="5" cy="-1" r="3" fill="#17334d"/><text y="-29" textAnchor="middle" fontSize="20" fontWeight="bold" fill={p.color}>{p.state==="safe"?"✓ ":p.state==="following"?"↳ ":""}{p.name}</text></g>)}
          <g transform={`translate(${view.x*10} ${view.y*6.2})`}><circle r={view.shieldActive?39:28} fill={view.shieldActive?"#ffd60a":"#87c9ff"} opacity={view.shieldActive?.28:.13}/>{view.shieldActive&&<circle r="36" fill="none" stroke="#ffd60a" strokeWidth="5"/>}<circle r="19" fill="#fff" stroke="#ffd60a" strokeWidth="4"/><rect x="-17" y="13" width="34" height="28" rx="9" fill="#ffd60a"/><rect x="-12" y="-8" width="24" height="13" rx="5" fill="#001d3d"/><text y="-32" textAnchor="middle" fontSize="19" fontWeight="bold" fill="#fff">YOU</text></g>
        </svg>
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-red-500/40 bg-[#250e1b]/80 px-2 py-1 text-[10px] font-bold text-red-200"><Zap size={12} className="inline"/> SOLAR STORM ACTIVE</div>
        {(phase === "intro" || help || phase === "won" || phase === "lost") && <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814]/95 p-4"><div className="w-full max-w-md text-center">
          {phase === "won"&&!help ? <><CheckCircle2 size={54} className="mx-auto mb-3 text-[#8fe4ac]"/><h3 className="text-3xl font-black">CREW SAFE!</h3><p className="mt-3 text-sm text-slate-300">All three astronauts reached radiation shelter. Mission accomplished!</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></> :
          phase === "lost"&&!help ? <><ShieldAlert size={50} className="mx-auto mb-3 text-[#ff9292]"/><h3 className="text-3xl font-black">RESCUE INTERRUPTED</h3><p className="mt-3 text-slate-300">Protect your suit and bring the crew into shelter faster.</p><button onClick={reset} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]">TRY AGAIN</button></> :
          <><Shield size={48} className="mx-auto mb-3 text-[#ffd60a]"/><p className="text-xs font-black tracking-[.2em] text-[#ffd60a]">DAY 16 · HOW TO PLAY</p><h3 className="mt-2 text-2xl font-black">SOLAR FLARE SHELTER SPRINT</h3><div className="mt-5 space-y-3 text-left text-sm text-slate-200"><p><strong className="text-[#ffd60a]">1.</strong> Use <strong>WASD / arrow keys</strong> to move your astronaut.</p><p><strong className="text-[#ffd60a]">2.</strong> Reach another astronaut to bring them along. Escort <strong>one at a time</strong> back to the yellow SHELTER.</p><p><strong className="text-[#ffd60a]">3.</strong> Hold <strong>SPACE</strong> for temporary protection when red storm bands pass. Your shield recharges when released.</p><p><strong className="text-[#ffd60a]">4.</strong> Save all <strong>three astronauts</strong> before the timer or suit safety runs out.</p></div><p className="mt-4 text-[11px] text-slate-400">Science note: the visible bands are a gameplay metaphor. Real radiation protection requires shielding and safe shelter, not dodging visible beams.</p><button onClick={() => { if(phaseRef.current==="intro") start(); else setHelp(false); }} className="mt-5 w-full rounded-xl bg-[#ffc300] py-4 font-black text-[#000814]">{phaseRef.current==="intro"?"START RESCUE!":"RESUME GAME"}</button></>}
        </div></div>}
      </div>
      <div className="mx-auto w-full max-w-5xl text-center text-xs font-bold text-[#ffd60a]" role="status" aria-live="polite">{view.message}</div>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2"><div className="grid grid-cols-3 gap-1"><div/><button aria-label="Move up" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press("up",true);}} onPointerUp={()=>press("up",false)} onPointerCancel={()=>press("up",false)} onLostPointerCapture={()=>press("up",false)} className="grid h-10 w-12 touch-none place-items-center rounded-lg border border-[#395d81] bg-[#001d3d]"><ArrowUp/></button><div/>{([["left",ArrowLeft],["down",ArrowDown],["right",ArrowRight]] as const).map(([k,Icon])=><button key={k} aria-label={`Move ${k}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(k,true);}} onPointerUp={()=>press(k,false)} onPointerCancel={()=>press(k,false)} onLostPointerCapture={()=>press(k,false)} className="grid h-10 w-12 touch-none place-items-center rounded-lg border border-[#395d81] bg-[#001d3d]"><Icon/></button>)}</div><button onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press("shield",true);}} onPointerUp={()=>press("shield",false)} onPointerCancel={()=>press("shield",false)} onLostPointerCapture={()=>press("shield",false)} className="flex h-14 touch-none items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 font-black text-[#000814]"><Shield size={20}/> HOLD SHIELD</button></div>
    </main>
  </div>;
}
