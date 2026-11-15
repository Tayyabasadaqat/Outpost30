"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, CheckCircle2, ChevronRight, CircleHelp,
  Gauge, Lightbulb, RotateCcw, Wind, X,
} from "lucide-react";
import type { Strategy } from "@/components/MissionStrategy";

type Props = {
  strategy?: Strategy;
  onComplete: () => void;
  onClose: () => void;
  busy?: boolean;
};
type Tile = { kind: "straight" | "corner" | "empty"; rotation: number };
type Port = "N" | "E" | "S" | "W";
const ALL: Port[] = ["N", "E", "S", "W"];
const OPPOSITE: Record<Port, Port> = { N: "S", E: "W", S: "N", W: "E" };
const PATH = [4, 5, 9, 10, 11];
const GOAL = PATH[PATH.length - 1];
const DEFAULT: Tile[] = [
  { kind: "corner", rotation: 1 }, { kind: "straight", rotation: 0 }, { kind: "corner", rotation: 2 }, { kind: "empty", rotation: 0 },
  { kind: "straight", rotation: 0 }, { kind: "corner", rotation: 0 }, { kind: "straight", rotation: 1 }, { kind: "corner", rotation: 3 },
  { kind: "corner", rotation: 3 }, { kind: "corner", rotation: 1 }, { kind: "straight", rotation: 0 }, { kind: "straight", rotation: 0 },
  { kind: "empty", rotation: 0 }, { kind: "straight", rotation: 1 }, { kind: "corner", rotation: 0 }, { kind: "corner", rotation: 2 },
];
const SETTINGS = {
  safe: { low: 38, high: 70, hold: 2 },
  risky: { low: 46, high: 62, hold: 2.7 },
  dangerous: { low: 52, high: 58, hold: 3.3 },
};

// The route deliberately crosses five tiles. The other tiles are distractors.
const TARGET_ROTATIONS: Record<number, number> = { 4: 1, 5: 2, 9: 0, 10: 1, 11: 1 };

function ports(tile: Tile): Port[] {
  if (tile.kind === "empty") return [];
  const base: Port[] = tile.kind === "straight" ? ["N", "S"] : ["N", "E"];
  return base.map((p) => ALL[(ALL.indexOf(p) + tile.rotation) % 4]);
}
function nextIndex(index: number, port: Port) {
  const row = Math.floor(index / 4), col = index % 4;
  if (port === "N") return row > 0 ? index - 4 : -1;
  if (port === "S") return row < 3 ? index + 4 : -1;
  if (port === "W") return col > 0 ? index - 1 : -1;
  return col < 3 ? index + 1 : -1;
}
function findPath(tiles: Tile[]): number[] {
  if (!ports(tiles[4]).includes("W") || !ports(tiles[GOAL]).includes("E")) return [];
  const queue: [number, number[]][] = [[4, [4]]];
  const visited = new Set<number>([4]);
  while (queue.length) {
    const [idx, path] = queue.shift()!;
    if (idx === GOAL) return path;
    for (const p of ports(tiles[idx])) {
      const neighbor = nextIndex(idx, p);
      if (neighbor < 0 || visited.has(neighbor) || !ports(tiles[neighbor]).includes(OPPOSITE[p])) continue;
      visited.add(neighbor);
      queue.push([neighbor, [...path, neighbor]]);
    }
  }
  return [];
}

function PipeTile({ tile, connected, hint, routeTile, index, onClick, locked }: {
  tile: Tile;
  connected: boolean;
  hint: boolean;
  routeTile: boolean;
  index: number;
  locked: boolean;
  onClick: () => void;
}) {
  const possible = ports(tile);
  return (
    <button type="button" onClick={onClick} disabled={locked || tile.kind === "empty"}
      aria-label={`Row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}. ${tile.kind} pipe. Click to rotate clockwise.`}
      className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#ffd60a] ${
        hint ? "border-[#ffd60a] bg-[#003566] ring-4 ring-[#ffc300]/35 animate-pulse" :
        connected ? "border-[#ffd60a] bg-[#003566]" :
        routeTile ? "border-[#355b82] bg-[#001d3d] hover:border-[#ffc300]" :
        "border-[#1e3b5b] bg-[#001529] hover:border-[#5d88af]"
      }`}
    >
      {tile.kind === "empty" ? <span className="text-[9px] tracking-widest text-[#506c88]">EMPTY</span> :
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          {possible.map((p) => {
            const isVertical = p === "N" || p === "S";
            const x = p === "W" ? 0 : p === "E" ? 50 : 50;
            const y = p === "N" ? 0 : p === "S" ? 50 : 50;
            return (
              <g key={p}>
                <rect x={isVertical ? x - 13 : x} y={isVertical ? y : y - 13}
                  width={isVertical ? 26 : 50} height={isVertical ? 50 : 26} rx="5"
                  fill={connected ? "#ffc300" : "#648bad"} />
                <rect x={isVertical ? x - 5 : x} y={isVertical ? y : y - 5}
                  width={isVertical ? 10 : 50} height={isVertical ? 50 : 10}
                  fill={connected ? "#fff5b0" : "#abc6d8"} />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="13" fill={connected ? "#ffd60a" : "#9cb7cd"} />
        </svg>}
      {index === 4 && <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r bg-[#ffc300] px-1.5 py-0.5 text-[9px] font-black text-[#000814]">IN</span>}
      {index === GOAL && <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l bg-[#ffc300] px-1.5 py-0.5 text-[9px] font-black text-[#000814]">OUT</span>}
      {hint && <span className="absolute right-1 top-1 rounded bg-[#ffd60a] px-1.5 py-0.5 text-[9px] font-black text-[#000814]">CLICK</span>}
    </button>
  );
}

export default function LifeSupportPipes({ strategy = "safe", onComplete, onClose, busy = false }: Props) {
  const [tiles, setTiles] = useState<Tile[]>(() => DEFAULT.map((t) => ({ ...t })));
  const [pressure, setPressure] = useState(85);
  const [valve, setValve] = useState(false);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const setting = SETTINGS[strategy];
  const route = useMemo(() => findPath(tiles), [tiles]);
  const routeReady = route.length > 0;
  const pressureReady = pressure >= setting.low && pressure <= setting.high;
  const ready = routeReady && pressureReady && valve;
  const completed = progress >= 100;
  const nextTile = PATH.find((i) => tiles[i].rotation !== TARGET_ROTATIONS[i]);
  const hintText = routeReady
    ? "Great! The oxygen route is connected. Adjust pressure on the right."
    : nextTile === undefined
      ? "Your route tiles are aligned. Check the connection from IN to OUT."
      : `Rotate the pipe in row ${Math.floor(nextTile / 4) + 1}, column ${nextTile % 4 + 1}. Follow the yellow CLICK marker.`;

  useEffect(() => {
    if (!running || completed) return;
    if (!ready) {
      setRunning(false);
      setProgress(0);
      setFailed((v) => v + 1);
      return;
    }
    const interval = window.setInterval(() => setProgress((p) => Math.min(100, p + 100 / (setting.hold * 10))), 100);
    return () => window.clearInterval(interval);
  }, [running, ready, completed, setting.hold]);

  function rotate(index: number) {
    if (running || completed || showTutorial) return;
    setTiles((old) => old.map((tile, i) => i === index ? { ...tile, rotation: (tile.rotation + 1) % 4 } : tile));
  }
  function finishTutorial() {
    setShowTutorial(false);
    setHintVisible(true);
  }
  function reset() {
    setTiles(DEFAULT.map((t) => ({ ...t })));
    setPressure(85);
    setValve(false);
    setProgress(0);
    setRunning(false);
    setFailed(0);
    setHintVisible(false);
  }
  const objectives = [
    { name: "Connect the oxygen pipes", done: routeReady, tip: "Rotate pipe pieces until IN connects to OUT." },
    { name: "Set pressure to a safe level", done: pressureReady, tip: `Move the slider between ${setting.low}% and ${setting.high}%.` },
    { name: "Open the main supply valve", done: valve, tip: "Tap the CLOSED valve to switch it to OPEN." },
  ];
  const completeCount = objectives.filter((o) => o.done).length;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#000814] text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#001d3d] px-4 py-3 sm:px-7">
        <div>
          <p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">OUTPOST 30 / DAY 02 / LIFE SUPPORT</p>
          <h2 className="text-lg font-black sm:text-2xl">Restore the Oxygen Supply</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setTutorialStep(0); setShowTutorial(true); }} className="flex items-center gap-2 rounded-lg border border-[#ffc300]/40 px-3 py-2 text-xs font-bold text-[#ffd60a]"><CircleHelp size={17} /> HOW TO PLAY</button>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close life support" className="rounded-lg border border-white/20 p-2"><X size={20} /></button>
        </div>
      </header>

      {/* The objective checklist always stays visible, even after the tutorial. */}
      <div className="shrink-0 border-b border-white/10 bg-[#00152c] px-4 py-3 sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 sm:gap-3">
          <span className="mr-2 text-xs font-black text-[#ffd60a]">MISSION STEPS {completeCount}/3</span>
          {objectives.map((o, i) => (
            <span key={o.name} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${o.done ? "border-[#ffc300]/50 bg-[#ffc300]/15 text-[#ffdf68]" : "border-[#355376] text-[#a6bdd2]"}`}>
              {o.done ? <Check size={14} /> : <span className="font-black">{i + 1}</span>}{o.name}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">STEP 01 / PIPE CONNECTION</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">Connect IN → OUT</h3>
                <p className="mt-2 max-w-lg text-xs leading-6 text-slate-300 sm:text-sm">Start at the yellow <b>IN</b> label on the left. Click the pipes to rotate them until oxygen can reach <b>OUT</b> on the right. You don't need every pipe.</p>
              </div>
              <Wind size={28} className="shrink-0 text-[#ffd60a]" />
            </div>
            <div className="relative mx-auto mt-5 max-w-[450px]">
              <div className="grid grid-cols-4 gap-2 rounded-xl bg-[#000814] p-2 sm:gap-3 sm:p-3">
                {tiles.map((tile, index) => (
                  <PipeTile key={index} index={index} tile={tile} connected={route.includes(index)}
                    routeTile={PATH.includes(index)} hint={hintVisible && !routeReady && index === nextTile}
                    locked={running || completed} onClick={() => rotate(index)} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className={`text-sm font-bold ${routeReady ? "text-[#ffd60a]" : "text-slate-300"}`}>
                {routeReady ? "✓ Oxygen pipe connected!" : "Pipe route not connected yet"}
              </span>
              <button type="button" disabled={routeReady} onClick={() => setHintVisible((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-[#ffc300]/50 bg-[#ffc300]/10 px-4 py-2 text-xs font-bold text-[#ffd60a] disabled:opacity-40">
                <Lightbulb size={16} /> {hintVisible ? "HIDE HINT" : "SHOW ME A HINT"}
              </button>
            </div>
            {hintVisible && <p role="status" className="mt-3 rounded-lg border border-[#ffc300]/30 bg-[#000814] p-3 text-sm leading-6 text-[#ffdf76]">{hintText}</p>}
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-5 sm:p-6">
              <p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">STEP 02 / PRESSURE</p>
              <h3 className="mt-2 text-xl font-black">Balance oxygen pressure</h3>
              <p className="mt-2 text-xs leading-6 text-slate-300">Drag the slider until the pressure indicator says <b>STABLE</b>.</p>
              <div className="mt-5 text-center"><Gauge size={32} className="mx-auto text-[#ffd60a]" />
                <strong className={`mt-2 block text-5xl tabular-nums ${pressureReady ? "text-[#ffd60a]" : "text-white"}`}>{pressure}<span className="text-xl">%</span></strong>
                <p className={`mt-2 text-xs font-black tracking-widest ${pressureReady ? "text-[#ffd60a]" : "text-amber-200"}`}>{pressureReady ? "✓ STABLE PRESSURE" : pressure > setting.high ? "↓ TOO HIGH — LOWER IT" : "↑ TOO LOW — RAISE IT"}</p>
              </div>
              <input type="range" min={0} max={100} value={pressure} disabled={running || completed} onChange={(e) => setPressure(Number(e.target.value))} aria-label="Simulated oxygen pressure" className="mt-6 w-full cursor-pointer accent-[#ffc300]" />
              <div className="mt-1 flex justify-between text-[11px] text-slate-300"><span>0%</span><span className="font-bold text-[#ffd60a]">TARGET: {setting.low}–{setting.high}%</span><span>100%</span></div>
            </div>
            <div className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-5 sm:p-6">
              <p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">STEP 03 / VALVE</p>
              <h3 className="mt-2 text-xl font-black">Open the oxygen valve</h3>
              <p className="mt-2 text-xs text-slate-300">Once the pipes and pressure are ready, open the main valve.</p>
              <button type="button" onClick={() => setValve((v) => !v)} disabled={running || completed}
                className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-4 font-black ${valve ? "border-[#ffc300] bg-[#ffc300]/10 text-[#ffd60a]" : "border-white/20 bg-[#000814] text-white"}`}>
                <span>MAIN SUPPLY VALVE</span><span>{valve ? "✓ OPEN" : "CLOSED — TAP TO OPEN"}</span>
              </button>
            </div>
            <div className="rounded-xl border border-[#284d74] bg-[#001d3d]/80 p-5">
              <p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">STARTUP / OXYGEN FLOW</p>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#000814]"><div className="h-full rounded-full bg-[#ffd60a] transition-all duration-150" style={{ width: `${progress}%` }} /></div>
              <p role="status" className="mt-3 text-sm text-slate-300">{completed ? "✓ Life support online! Oxygen supply restored." : running ? "Oxygen flowing to the habitat..." : ready ? "✓ All 3 steps done! Press ACTIVATE LIFE SUPPORT below." : `Complete the ${3 - completeCount} remaining mission step${3 - completeCount === 1 ? "" : "s"}.`}</p>
              {failed > 0 && <p className="mt-2 text-xs text-amber-300">Startup interrupted {failed} time(s). Check your settings and try again.</p>}
            </div>
            <div className="rounded-xl border border-[#ffc300]/20 bg-[#000814] p-4 text-xs leading-6 text-slate-300"><strong className="text-[#ffd60a]">REAL SPACE SCIENCE</strong><p>Spacecraft life-support systems monitor air composition and cabin pressure. This minigame uses fictional pressure percentages to teach the idea of regulating oxygen safely.</p></div>
          </section>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#001d3d] px-4 py-3 sm:px-7">
        <button type="button" onClick={reset} disabled={busy || running} className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm font-bold"><RotateCcw size={16} /> RESET SYSTEM</button>
        <button type="button" onClick={completed ? onComplete : () => setRunning(true)} disabled={busy || (!completed && (!ready || running))} className="flex items-center gap-2 rounded-xl bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814] disabled:cursor-not-allowed disabled:opacity-35">
          {completed ? (busy ? "SAVING..." : "OXYGEN RESTORED · CONTINUE") : running ? "STARTING..." : "ACTIVATE LIFE SUPPORT"}
          {completed ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </footer>

      {showTutorial && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#000814]/90 p-4 backdrop-blur-md">
          <section role="dialog" aria-modal="true" aria-labelledby="life-tutorial-title" className="relative w-full max-w-lg rounded-2xl border border-[#ffc300]/50 bg-[#001d3d] p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setShowTutorial(false)} aria-label="Close tutorial" className="absolute right-4 top-4 p-2 text-white"><X size={18} /></button>
            <span className="text-xs font-black tracking-[.2em] text-[#ffd60a]">MISSION TRAINING · {tutorialStep + 1} OF 3</span>
            <div className="mt-4 flex gap-2">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= tutorialStep ? "bg-[#ffd60a]" : "bg-[#35587d]"}`} />)}</div>
            <h2 id="life-tutorial-title" className="mt-6 text-2xl font-black sm:text-3xl">{["Connect the pipes", "Balance the pressure", "Open the valve"][tutorialStep]}</h2>
            <p className="mt-4 min-h-24 text-sm leading-7 text-slate-200">{[
              "Tap a pipe piece to turn it 90°. Your goal is a continuous path from the yellow IN label to OUT. You can ignore the extra pipes! If you get stuck, use SHOW ME A HINT to highlight the next pipe.",
              `Once your pipe path is ready, move the pressure slider into the yellow target range (${setting.low}–${setting.high}%). The display will say STABLE PRESSURE when it is correct.`,
              "Lastly, tap MAIN SUPPLY VALVE to open it. When all three objectives have check marks, activate life support and watch the oxygen-flow bar fill up.",
            ][tutorialStep]}</p>
            <div className="mt-6 flex justify-between gap-3">
              <button type="button" onClick={() => setShowTutorial(false)} className="rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-slate-300">SKIP TUTORIAL</button>
              <button type="button" onClick={() => tutorialStep < 2 ? setTutorialStep((s) => s + 1) : finishTutorial()} className="flex items-center gap-2 rounded-lg bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814]">
                {tutorialStep === 2 ? "LET'S PLAY" : "NEXT"} <ChevronRight size={18} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
