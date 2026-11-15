"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock3, HelpCircle, Package,
  RotateCcw, ShieldAlert, Trash2, X, Zap, Leaf, Droplets, Cookie,
} from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Kind = "meal" | "hydration" | "ration" | "spoiled";
type Pack = { id: number; kind: Kind; x: number; y: number; speed: number; done: boolean };
type Phase = "ready" | "playing" | "won" | "lost";
const KINDS: Kind[] = ["meal", "hydration", "ration", "spoiled"];
const LANES = [
  { name: "MEALS", kind: "meal" as Kind, color: "#75E9A4", icon: Leaf, short: "1" },
  { name: "WATER SNACKS", kind: "hydration" as Kind, color: "#7CCBFF", icon: Droplets, short: "2" },
  { name: "RATIONS", kind: "ration" as Kind, color: "#FFD60A", icon: Cookie, short: "3" },
];
const SETUP = {
  safe: { health: 6, total: 19, goal: 12, speed: 10, interval: 3900, timer: 180 },
  risky: { health: 5, total: 19, goal: 13, speed: 12, interval: 3450, timer: 165 },
  dangerous: { health: 4, total: 21, goal: 15, speed: 14, interval: 3100, timer: 155 },
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const paint: Record<Kind, { color: string; label: string; code: string }> = {
  meal: { color: "#75E9A4", label: "MEAL PACK", code: "M" },
  hydration: { color: "#7CCBFF", label: "WATER SNACK", code: "W" },
  ration: { color: "#FFD60A", label: "EMERGENCY RATION", code: "R" },
  spoiled: { color: "#FF6B82", label: "SPOILED!", code: "!" },
};

export default function PantryPanic({ strategy = "safe", busy = false, onComplete, onClose }: Props) {
  const opts = SETUP[strategy];
  const [phase, setPhase] = useState<Phase>("ready");
  const [gate, setGate] = useState(0);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [sorted, setSorted] = useState(0);
  const [missed, setMissed] = useState(0);
  const [remaining, setRemaining] = useState(opts.timer);
  const [scanned, setScanned] = useState(0);
  const [feedback, setFeedback] = useState("SELECT A BAY TO DIRECT THE SORTING GATE.");
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [help, setHelp] = useState(false);
  const state = useRef({
    packs: [] as Pack[], gate: 0, sorted: 0, missed: 0, dispatched: 0,
    processed: 0, elapsed: 0, sinceSpawn: 9999, last: 0, id: 0,
    phase: "ready" as Phase, lastUi: 0, remaining: opts.timer, paused: false,
  });
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signal = useCallback((text: string, kind: "good" | "bad") => {
    setFeedback(text);
    setFlash(kind);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFlash(null), 350);
  }, []);
  const choose = useCallback((index: number) => {
    if (state.current.phase !== "playing") return;
    state.current.gate = clamp(index, 0, 2);
    setGate(state.current.gate);
  }, []);
  const start = useCallback(() => {
    state.current = {
      packs: [], gate: 0, sorted: 0, missed: 0, dispatched: 0, processed: 0,
      elapsed: 0, sinceSpawn: 9999, last: 0, id: 0,
      phase: "playing", lastUi: 0, remaining: opts.timer, paused: false,
    };
    setPhase("playing"); setGate(0); setPacks([]); setSorted(0); setMissed(0);
    setRemaining(opts.timer); setScanned(0); setFlash(null);
    setFeedback("SORT THE CRATES! EJECT RED SPOILED PACKS.");
  }, [opts.timer]);
  const eject = useCallback(() => {
    const s = state.current;
    if (s.phase !== "playing") return;
    // The ejector can only reach packages in its highlighted central zone.
    const target = s.packs.filter(p => !p.done && p.x >= 38 && p.x <= 78)
      .sort((a, b) => b.x - a.x)[0];
    if (!target) { setFeedback("WAIT FOR A CRATE TO ENTER THE EJECT ZONE!"); return; }
    target.done = true;
    s.processed++;
    if (target.kind === "spoiled") {
      signal("NICE! SPOILED FOOD REMOVED.", "good");
    } else {
      s.missed++;
      signal("OOPS! THAT FOOD WAS STILL GOOD.", "bad");
    }
    setScanned(s.processed);
    setMissed(s.missed);
  }, [signal]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!["1", "2", "3", "arrowup", "arrowdown", "a", "d", "arrowleft", "arrowright", " ", "enter"].includes(e.key.toLowerCase())) return;
      if (state.current.phase !== "playing") return;
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === "1" || k === "2" || k === "3") choose(Number(k) - 1);
      else if (k === "arrowup" || k === "a" || k === "arrowleft") choose(state.current.gate - 1);
      else if (k === "arrowdown" || k === "d" || k === "arrowright") choose(state.current.gate + 1);
      else if (k === " " || k === "enter") { if (!e.repeat) eject(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, eject]);
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const s = state.current;
      if (!s.last) s.last = now;
      const dt = Math.min((now - s.last) / 1000, 0.05);
      s.last = now;
      if (s.phase === "playing" && !busy && !s.paused) {
        s.elapsed += dt;
        s.remaining = Math.max(0, opts.timer - Math.floor(s.elapsed));
        s.sinceSpawn += dt * 1000;
        if (s.dispatched < opts.total && s.sinceSpawn >= opts.interval) {
          s.sinceSpawn = 0;
          const id = s.id++;
          // Four spoiled packages per run, scattered rather than all at the end.
          const bad = id % 5 === 3;
          const kind = bad ? "spoiled" : KINDS[(id * 7 + Math.floor(id / 4)) % 3];
          s.packs.push({ id, kind, x: -13, y: 0, speed: opts.speed + (id % 3) * 1.2, done: false });
          s.dispatched++;
        }
        for (const p of s.packs) {
          if (p.done) continue;
          p.x += p.speed * dt;
          if (p.x >= 86) {
            p.done = true;
            s.processed++;
            if (p.kind === LANES[s.gate].kind) {
              s.sorted++;
              signal(`${paint[p.kind].label} STORED! +1`, "good");
            } else {
              s.missed++;
              signal(p.kind === "spoiled" ? "CONTAMINATION! EJECT SPOILED FOOD!" : "WRONG STORAGE BAY!", "bad");
            }
          }
        }
        s.packs = s.packs.filter(p => !p.done || p.x < 100).filter(p => !p.done);
        const health = opts.health - s.missed;
        const remainPossible = opts.total - s.processed;
        if (s.sorted >= opts.goal) {
          s.phase = "won"; setPhase("won");
        } else if (health <= 0 || s.remaining <= 0 || s.sorted + remainPossible < opts.goal) {
          s.phase = "lost"; setPhase("lost");
        } else if (s.processed >= opts.total) {
          s.phase = s.sorted >= opts.goal ? "won" : "lost";
          setPhase(s.phase);
        }
        if (now - s.lastUi > 45 || s.phase !== "playing") {
          s.lastUi = now; setPacks([...s.packs]); setSorted(s.sorted);
          setMissed(s.missed); setScanned(s.processed); setRemaining(s.remaining);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); state.current.last = 0; };
  }, [busy, opts.goal, opts.health, opts.interval, opts.speed, opts.timer, opts.total, signal]);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  const openHelp = () => { state.current.paused = true; setHelp(true); };
  const closeHelp = () => { state.current.paused = false; state.current.last = 0; setHelp(false); };
  const health = Math.max(0, opts.health - missed);
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const nextPack = packs.filter(p => !p.done && p.x >= -10 && p.x < 86).sort((a, b) => b.x - a.x)[0];
  const hint = nextPack?.kind === "spoiled"
    ? nextPack.x >= 38 && nextPack.x <= 78
      ? "RED CRATE IN EJECT ZONE — PRESS SPACE NOW!"
      : "RED SPOILED CRATE — WAIT UNTIL IT ENTERS THE PINK ZONE, THEN PRESS SPACE"
    : nextPack ? `INCOMING ${paint[nextPack.kind].label} — SELECT ${LANES.find(l => l.kind === nextPack.kind)?.short} BEFORE THE YELLOW GATE`
    : "WATCH FOR THE NEXT CRATE. MATCH ITS LABEL TO 1, 2 OR 3.";
  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#31506e] bg-[#001d3d] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Package size={24} /></span>
          <div><p className="text-[10px] font-black tracking-[.22em] text-[#ffd60a]">DAY 10 · FOOD INVENTORY</p><h2 className="text-xl font-black sm:text-2xl">PANTRY PANIC</h2></div>
        </div>
        <div className="flex items-center gap-3 text-sm font-black">
          <span className="text-[#ffd60a]">{sorted}/{opts.goal} SAVED</span>
          <span className="rounded-lg border border-[#456888] px-3 py-2"><Clock3 className="mr-1 inline" size={16} />{clock}</span>
          <button aria-label="Instructions" onClick={openHelp} className="rounded-lg border border-[#456888] p-2"><HelpCircle size={18}/></button>
          <button aria-label="Close game" onClick={onClose} disabled={busy} className="p-2"><X size={20}/></button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-3 py-3 sm:px-5">
        <div className="flex w-full max-w-5xl flex-wrap justify-between gap-2 text-xs font-black tracking-wide">
          <span className="text-[#bfd8ec]">FOOD QUALITY <span className="text-[#ff8797]">{"♥ ".repeat(health)}</span><span className="text-[#526780]">{"♡ ".repeat(opts.health - health)}</span></span>
          <span className="text-[#8db0cf]">PACKAGES CHECKED {scanned}/{opts.total}</span>
        </div>
        <section className={`relative min-h-[255px] w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border bg-[#061327] ${flash === "bad" ? "border-[#FF6B82]" : flash === "good" ? "border-[#75E9A4]" : "border-[#345876]"}`}>
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#326080 1px,transparent 1px),linear-gradient(90deg,#326080 1px,transparent 1px)", backgroundSize: "40px 40px" }}/>
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-lg border border-[#325576] bg-[#001d3daa] px-3 py-2 text-xs font-black text-[#bfd8ec]"><Zap size={15} className="text-[#ffd60a]"/>AUTOMATED LUNAR PANTRY</div>
          <div className="absolute left-[4%] right-[4%] top-[36%] h-[28%] overflow-hidden rounded-xl border-y-4 border-[#476583] bg-[#152e48] shadow-[inset_0_0_35px_#000a]" style={{backgroundImage:"repeating-linear-gradient(90deg,transparent 0px,transparent 30px,#426080 31px,#426080 35px)"}}/>
          <div className="absolute left-[13%] top-[31%] text-[10px] font-black tracking-widest text-[#7296b9]">INCOMING SUPPLIES →</div>
          <div className="absolute left-[38%] top-[33%] h-[35%] w-[40%] rounded-lg border-2 border-dashed border-[#ff6b8280] bg-[#ff6b820b]"/>
          <div className="absolute left-[41%] top-[67%] text-[10px] font-black text-[#ff9aad]">EJECT ZONE · SPACE</div>
          <div className="absolute right-[12%] top-[31%] h-[37%] w-2 rounded-md bg-[#ffd60a] shadow-[0_0_20px_#ffd60a88]"/>
          {packs.map(p => (
            <div key={p.id} className="absolute z-20 flex h-[24%] min-h-16 w-[17%] min-w-24 max-w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg border-2 bg-[#001d3d] shadow-[0_5px_16px_#000b]" style={{left:`${p.x}%`,top:"50%",borderColor:paint[p.kind].color}}>
              <span className="text-2xl font-black" style={{color:paint[p.kind].color}}>{paint[p.kind].code}</span>
              <span className="text-center text-[11px] font-black leading-tight tracking-normal sm:text-xs" style={{color:paint[p.kind].color}}>{paint[p.kind].label}</span>
            </div>
          ))}
          <div className="absolute bottom-3 right-3 flex w-[42%] max-w-60 flex-col gap-1.5">
            {LANES.map((l, i) => {
              const Icon = l.icon;
              return <div key={l.name} className={`flex items-center justify-between rounded-lg border px-2 py-2 text-[10px] font-black transition-all sm:px-3 ${gate===i ? "bg-[#113858] shadow-[0_0_14px_#ffc30033]" : "bg-[#001323] opacity-60"}`} style={{borderColor: gate===i ? l.color : "#34516f"}}><span className="flex items-center gap-1.5"><Icon size={15} color={l.color}/>{l.name}</span><span style={{color:l.color}}>{gate === i ? "◀" : l.short}</span></div>;
            })}
          </div>
          {phase === "ready" && <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#000814f5] p-3 sm:p-5"><div className="w-full max-w-xl text-center"><p className="mb-1 text-[10px] font-black tracking-[.22em] text-[#ffd60a]">DAY 10 · YOUR MISSION</p><h3 className="text-2xl font-black sm:text-3xl">SAVE THE MOON BASE PANTRY!</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#c5d5e7] sm:text-sm">Read each crate's label. Choose its matching storage bay <b>before it reaches the yellow gate.</b></p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{key:"1",name:"MEALS",color:"#75E9A4"},{key:"2",name:"WATER",color:"#7CCBFF"},{key:"3",name:"RATIONS",color:"#FFD60A"},{key:"SPACE",name:"SPOILED",color:"#FF6B82"}].map(item=><div key={item.key} className="rounded-xl border bg-[#001d3d] p-2" style={{borderColor:item.color}}><div className="mx-auto mb-1 w-fit rounded-md bg-[#071326] px-3 py-1 text-sm font-black" style={{color:item.color}}>{item.key}</div><p className="text-[11px] font-black" style={{color:item.color}}>{item.name}</p></div>)}</div><p className="mt-3 text-xs text-[#b9d2e5]"><b className="text-[#ffd60a]">IMPORTANT:</b> 1/2/3 switch the selected bay. <b>SPACE</b> only works when a red spoiled crate is inside the <b className="text-[#ff9aab]">pink dashed eject zone</b>.</p><p className="mt-1 text-[11px] text-[#9fb8cc]">Wrong choices cost a heart. Save {opts.goal} good packages to win!</p><button onClick={start} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#ffc300] px-7 py-3 font-black text-[#000814]">GOT IT · START GAME <ArrowRight size={18}/></button></div></div>}
          {phase === "won" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-5"><div className="max-w-sm text-center"><CheckCircle2 size={52} className="mx-auto mb-3 text-[#75E9A4]"/><h3 className="text-3xl font-black">FOOD SUPPLY SAVED!</h3><p className="mt-3 text-sm text-[#c5d5e7]">You organized the crew's meals and protected the pantry from spoiled supplies.</p><button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy ? "SAVING..." : "MISSION COMPLETE · CONTINUE"}</button></div></div>}
          {phase === "lost" && <div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-5"><div className="max-w-sm text-center"><ShieldAlert size={52} className="mx-auto mb-3 text-[#FF6B82]"/><h3 className="text-3xl font-black">PANTRY EMERGENCY!</h3><p className="mt-3 text-sm text-[#c5d5e7]">Too many supplies were misplaced. Try again and sort more carefully!</p><button onClick={start} className="mt-6 rounded-xl bg-[#ffc300] px-8 py-4 font-black text-[#000814]"><RotateCcw size={18} className="mr-2 inline"/>RETRY MISSION</button></div></div>}
        </section>
        {phase === "playing" && <div className="w-full max-w-5xl rounded-lg border border-[#315475] bg-[#001d3d] px-3 py-2 text-center text-xs font-black text-[#ffd60a]" aria-live="off">{hint}</div>}
        <p aria-live="polite" className="min-h-5 text-center text-xs font-black tracking-wider text-[#ffd60a]">{feedback}</p>
        <div className="grid w-full max-w-5xl grid-cols-3 gap-2 sm:gap-3">
          {LANES.map((l, i) => { const Icon = l.icon; return <button key={l.name} onClick={()=>choose(i)} disabled={phase!=="playing"||busy} className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-[11px] font-black transition-transform active:scale-95 sm:flex-row sm:justify-center sm:gap-3 sm:text-sm ${gate===i && phase==="playing"?"bg-[#173c59]":"bg-[#001d3d]"} disabled:opacity-70`} style={{borderColor:gate===i&&phase==="playing" ? l.color : "#3b5875"}}><Icon size={22} color={l.color}/><span>{l.short} · {l.name}</span></button>; })}
        </div>
        <div className="flex w-full max-w-5xl items-center justify-between gap-3">
          <span className="text-[10px] font-bold text-[#94b4d0]">1 / 2 / 3 TO SWITCH BAYS</span>
          <button onClick={eject} disabled={phase!=="playing"||busy} className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#ff6b82] bg-[#621d34] px-4 py-3 text-xs font-black text-white active:scale-95 disabled:opacity-40"><Trash2 size={18}/> EJECT SPOILED · SPACE</button>
          <button onClick={start} disabled={busy} title="Restart" aria-label="Restart" className="rounded-lg border border-[#3b5875] p-3 text-[#ffd60a] disabled:opacity-50"><RotateCcw size={18}/></button>
        </div>
        <p className="max-w-5xl text-center text-[10px] leading-4 text-[#9bb3cb]">NASA FACT · Astronaut foods are carefully packaged, tracked and planned so crews receive enough nutrition and supplies throughout a mission.</p>
      </main>
      {help && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814eb] p-4"><div className="w-full max-w-md rounded-2xl border border-[#ffc30077] bg-[#001d3d] p-5 sm:p-6"><div className="flex justify-between"><h3 className="text-xl font-black">HOW TO PLAY · PAUSED</h3><button onClick={closeHelp} aria-label="Close instructions"><X/></button></div><p className="mt-3 text-sm text-[#c5d5e7]">Match the moving crate label before it reaches the glowing yellow gate.</p><div className="mt-4 grid grid-cols-2 gap-2">{[{key:"1",label:"MEALS",color:"#75E9A4"},{key:"2",label:"WATER SNACKS",color:"#7CCBFF"},{key:"3",label:"RATIONS",color:"#FFD60A"},{key:"SPACE",label:"SPOILED",color:"#FF6B82"}].map(item=><div key={item.key} className="rounded-lg border p-3 text-center" style={{borderColor:item.color}}><span className="text-lg font-black" style={{color:item.color}}>{item.key}</span><p className="text-xs font-bold text-white">{item.label}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-[#c5d5e7]">For <b className="text-[#ff9aad]">SPOILED</b> crates, wait until they enter the <b>pink dashed eject zone</b>, then press <b>SPACE</b>. Selecting 1, 2 or 3 changes the bay; you don't need to press it repeatedly.</p><button onClick={closeHelp} className="mt-5 w-full rounded-xl bg-[#ffc300] py-3 font-black text-[#000814]">RESUME GAME</button></div></div>}
    </div>
  );
}
