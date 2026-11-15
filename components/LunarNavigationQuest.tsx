"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Radar, RotateCcw, X, MapPin, BatteryCharging, ShieldAlert, CheckCircle2, HelpCircle } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onClose: () => void; onComplete: () => void };
type Point = { x: number; y: number };
const W = 15, H = 9;
const START = { x: 1, y: 1 };
const CHECKPOINTS: Point[] = [{ x: 4, y: 2 }, { x: 9, y: 5 }, { x: 13, y: 7 }];
const ROCKS = new Set([
  "3,0","3,1","3,3","3,4","3,5","3,6","3,7",
  "6,1","6,2","6,3","6,4","6,6","6,7","6,8",
  "9,0","9,1","9,2","9,3","9,4","10,2",
  "11,4","11,5","11,6","11,8", "12,4", "13,4",
  "1,5","2,5","4,7","8,7","10,7", "0,7"
]);
const POWER = [{ x: 4, y: 1 }, { x: 7, y: 4 }, { x: 12, y: 6 }];
const PARAMS = {
  safe: { seconds: 195, hull: 5, fuel: 110, scans: 5, scanRadius: 4 },
  risky: { seconds: 165, hull: 4, fuel: 99, scans: 4, scanRadius: 3 },
  dangerous: { seconds: 140, hull: 3, fuel: 91, scans: 3, scanRadius: 3 },
} as const;
const eq = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const id = (p: Point) => `${p.x},${p.y}`;
const distance = (a: Point, b: Point) => Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const randomHazards = (step: number): Point[] => [{x:5,y:Math.round(5+2*Math.sin(step*.58))},{x:8,y:Math.round(2+2*Math.sin(step*.48+1))},{x:12,y:Math.round(6+Math.sin(step*.7))}];

export default function LunarNavigationQuest({ strategy = "safe", busy = false, onClose, onComplete }: Props) {
  const cfg = PARAMS[strategy];
  const [phase,setPhase] = useState<"tutorial"|"playing"|"won"|"lost">("tutorial");
  const [pos,setPos] = useState<Point>(START);
  const [time,setTime] = useState<number>(cfg.seconds);
  const [fuel,setFuel] = useState<number>(cfg.fuel);
  const [hull,setHull] = useState<number>(cfg.hull);
  const [scans,setScans] = useState<number>(cfg.scans);
  const [checkpoint,setCheckpoint] = useState(0);
  const [batteries,setBatteries] = useState<string[]>([]);
  const [explored,setExplored] = useState<string[]>([id(START)]);
  const [radarUntil,setRadarUntil] = useState(0);
  const [clock,setClock] = useState(0);
  const [steps,setSteps] = useState(0);
  const [notice,setNotice] = useState("Follow the radar. Find the three rescue beacons!");
  const ref = useRef({ pos: START, phase: "tutorial" as "tutorial"|"playing"|"won"|"lost", steps: 0, last: 0 });
  const held = useRef<string|null>(null);

  const reset = useCallback(() => {
    ref.current = {pos:START,phase:"tutorial",steps:0,last:0};
    held.current=null;
    setPhase("tutorial");setPos(START);setTime(cfg.seconds);setFuel(cfg.fuel);setHull(cfg.hull);setScans(cfg.scans);
    setCheckpoint(0);setBatteries([]);setExplored([id(START)]);setRadarUntil(0);setClock(0);setSteps(0);
    setNotice("Follow the radar. Find the three rescue beacons!");
  },[cfg]);
  const begin = () => {ref.current.phase="playing";setPhase("playing");setNotice("GO! Drive toward the first blue beacon.");};
  const scan = useCallback(() => {
    if(ref.current.phase!=="playing")return;
    setScans(s => {if(s<=0){setNotice("No radar charges left! Follow your explored route.");return s;}return s-1;});
    setRadarUntil(t => {if(scans<=0)return t;setNotice("RADAR PULSE! Hidden terrain revealed for 7 seconds.");return Date.now()+7000;});
  },[scans]);
  const move = useCallback((dx:number,dy:number) => {
    if(ref.current.phase!=="playing")return;
    const p=ref.current.pos, next={x:p.x+dx,y:p.y+dy};
    if(next.x<0||next.x>=W||next.y<0||next.y>=H||ROCKS.has(id(next))){setNotice("Boulder ahead! Find another route.");return;}
    ref.current.pos=next;ref.current.steps++;
    const step=ref.current.steps;setSteps(step);setPos(next);
    setExplored(e=>{const n=new Set(e);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const q={x:next.x+xx,y:next.y+yy};if(q.x>=0&&q.x<W&&q.y>=0&&q.y<H)n.add(id(q));}return Array.from(n);});
    setFuel(f=>{const updated=Math.max(0,f-1);if(updated===0){ref.current.phase="lost";setPhase("lost");setNotice("ROVER OUT OF POWER!");}return updated;});
    const hazard = randomHazards(step).some(h=>eq(h,next));
    if(hazard){setHull(h=>{const n=Math.max(0,h-1);if(n===0){ref.current.phase="lost";setPhase("lost");setNotice("ROVER DAMAGED BEYOND REPAIR!");}else setNotice("Ouch! Watch for red moving dust storms.");return n;});}
    const power=POWER.find(q=>eq(q,next));
    if(power){setBatteries(prev=>{if(prev.includes(id(power)))return prev;setFuel(f=>Math.min(cfg.fuel,f+25));setScans(s=>Math.min(cfg.scans+2,s+1));setNotice("POWER CACHE FOUND! +25 fuel, +1 radar pulse.");return [...prev,id(power)];});}
    const target=CHECKPOINTS.findIndex(q=>eq(q,next));
    if(target>=0){setCheckpoint(c=>{
      if(target===c){const value=c+1;if(value===CHECKPOINTS.length){ref.current.phase="won";setPhase("won");setNotice("ALL THREE BEACONS FOUND! Rescue route mapped.");}else setNotice(`BEACON ${value}/3 SECURED! Follow the next marker.`);return value;}
      if(target>c)setNotice("Find the beacons in order! Follow the blue navigation target.");return c;
    });}
  },[cfg.fuel,cfg.scans]);
  const moveRef = useRef(move);moveRef.current=move;
  const scanRef = useRef(scan);scanRef.current=scan;
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      const key=e.key.toLowerCase();
      const dirs:Record<string,string>={w:"up",arrowup:"up",a:"left",arrowleft:"left",s:"down",arrowdown:"down",d:"right",arrowright:"right"};
      if(dirs[key]||key===" "||key==="r")e.preventDefault();
      if(dirs[key]){held.current=dirs[key];if(!e.repeat){const v=dirs[key];moveRef.current(v==="left"?-1:v==="right"?1:0,v==="up"?-1:v==="down"?1:0);ref.current.last=Date.now();}}
      if((key===" "||key==="r")&&!e.repeat)scanRef.current();
    };
    const up=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();const dirs:Record<string,string>={w:"up",arrowup:"up",a:"left",arrowleft:"left",s:"down",arrowdown:"down",d:"right",arrowright:"right"};if(dirs[k]===held.current)held.current=null;};
    const blur=()=>{held.current=null;};
    window.addEventListener("keydown",handler);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",handler);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[]);
  useEffect(()=>{
    if(phase!=="playing")return;
    const loop=window.setInterval(()=>{if(held.current&&Date.now()-ref.current.last>=125){const v=held.current;moveRef.current(v==="left"?-1:v==="right"?1:0,v==="up"?-1:v==="down"?1:0);ref.current.last=Date.now();}},35);
    const timer=window.setInterval(()=>{setClock(Date.now());setTime(t=>{if(t<=1){ref.current.phase="lost";setPhase("lost");setNotice("MISSION TIME EXPIRED!");return 0;}return t-1;});},1000);
    return()=>{window.clearInterval(loop);window.clearInterval(timer);};
  },[phase]);
  const pulseOn=radarUntil>clock;
  const visible = (p:Point)=>distance(p,pos)<=1||explored.includes(id(p))||(pulseOn&&distance(p,pos)<=cfg.scanRadius);
  const target=CHECKPOINTS[Math.min(checkpoint,CHECKPOINTS.length-1)];
  const hazards=randomHazards(steps);
  const moveButton=(v:"up"|"down"|"left"|"right")=>move(v==="left"?-1:v==="right"?1:0,v==="up"?-1:v==="down"?1:0);
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#29486b] bg-[#001d3d] px-4 py-3 sm:px-7">
      <div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 19 · LUNAR NAVIGATION</p><h1 className="text-xl font-black tracking-tight sm:text-2xl">ROVER RADAR QUEST <span className="text-[#ffd60a]">⌁</span></h1></div>
      <div className="flex items-center gap-2"><span className="rounded-lg border border-[#476585] px-3 py-2 text-xs font-bold">⏱ {Math.floor(time/60)}:{String(time%60).padStart(2,"0")}</span><button onClick={()=>{if(ref.current.phase==="playing"){ref.current.phase="tutorial";setPhase("tutorial");}}} aria-label="Instructions" className="rounded-lg border border-[#476585] p-2"><HelpCircle size={18}/></button><button disabled={busy} onClick={onClose} aria-label="Close mission" className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div>
    </header>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 p-3 sm:p-5">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl border border-[#29486b] bg-[#001d3d] px-3 py-2 text-xs font-bold"><span className="text-slate-400">BEACONS</span><p className="mt-1 text-lg text-[#ffd60a]">{checkpoint}/3</p></div>
        <div className="rounded-xl border border-[#29486b] bg-[#001d3d] px-3 py-2 text-xs font-bold"><span className="text-slate-400">ROVER FUEL</span><p className="mt-1 text-lg text-[#8ed7ff]">{fuel}%</p></div>
        <div className="rounded-xl border border-[#29486b] bg-[#001d3d] px-3 py-2 text-xs font-bold"><span className="text-slate-400">ARMOR</span><p className="mt-1 text-lg text-[#91edb5]">{"♥ ".repeat(hull)}<span className="text-slate-600">{"♡ ".repeat(cfg.hull-hull)}</span></p></div>
        <div className="rounded-xl border border-[#29486b] bg-[#001d3d] px-3 py-2 text-xs font-bold"><span className="text-slate-400">RADAR PULSES</span><p className="mt-1 text-lg text-[#ffd60a]">{scans} <span className="text-xs text-slate-400">remaining</span></p></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2b5479] bg-[#09233d] px-4 py-3"><div className="flex items-center gap-2 text-sm font-bold"><MapPin size={19} className="text-[#ffd60a]"/> {checkpoint<3?`Find beacon ${checkpoint+1} of 3`:`All beacons located!`}</div><span className="text-xs text-[#b5d0e6]">{notice}</span></div>
      <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-[#3f6488] bg-[#07192c] p-2 shadow-[0_0_45px_#00356666] sm:p-3">
        <div className="grid w-full grid-cols-[repeat(15,minmax(0,1fr))] gap-[2px] sm:gap-[3px]">
          {Array.from({length:W*H},(_,i)=>{const p={x:i%W,y:Math.floor(i/W)}, show=visible(p), rock=ROCKS.has(id(p)), you=eq(pos,p), beacon=CHECKPOINTS.findIndex(q=>eq(q,p)), hazard=hazards.some(q=>eq(q,p)), charge=POWER.some(q=>eq(q,p))&&!batteries.includes(id(p));
            return <div key={i} className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[3px] border text-[clamp(9px,1.55vw,18px)] font-black transition-colors ${!show?"border-[#071323] bg-[#07101e]":rock?"border-[#48526d] bg-[#293c54]":"border-[#1c466b] bg-[#0c3153]"}`}>
              {show&&rock&&<span className="opacity-80">🪨</span>}
              {show&&!rock&&beacon>=0&&beacon>=checkpoint&&<span className="animate-pulse text-[#80d9ff]">{beacon===2?"🏁":"◆"}</span>}
              {show&&!rock&&charge&&<BatteryCharging size="58%" className="text-[#ffd60a]"/>}
              {show&&!rock&&hazard&&!you&&<span className="animate-pulse text-[#ff6a77]">☄</span>}
              {you&&<div className="z-10 grid h-[88%] w-[88%] place-items-center rounded-md border border-[#ffd60a] bg-[#002549] text-[#ffd60a] shadow-[0_0_15px_#ffd60a77]"><span className="text-[clamp(10px,2vw,20px)]">🚙</span></div>}
              {!show&&<div className="absolute inset-0 bg-[radial-gradient(#59758c40_1px,transparent_1px)] [background-size:7px_7px]"/>}
            </div>;
          })}
        </div>
        {pulseOn&&<div className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-lg border border-[#7edbff] bg-[#001d3de6] px-3 py-2 text-xs font-black text-[#8ce3ff]"><Radar size={16} className="animate-pulse"/> RADAR ACTIVE</div>}
        {(phase==="won"||phase==="lost")&&<div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814ed] p-5"><div className="max-w-md text-center">{phase==="won"?<CheckCircle2 size={54} className="mx-auto mb-4 text-[#ffd60a]"/>:<ShieldAlert size={54} className="mx-auto mb-4 text-[#ff8c86]"/>}<h2 className="text-3xl font-black">{phase==="won"?"ROUTE DISCOVERED!":"ROVER STRANDED!"}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{phase==="won"?"You navigated the lunar terrain, logged three rescue beacons, and found a safe path for the crew.":"The navigation mission needs another attempt. Use radar wisely and avoid hazards."}</p><button disabled={busy} onClick={phase==="won"?onComplete:reset} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814] disabled:opacity-50">{phase==="won"?busy?"SAVING...":"MISSION COMPLETE · CONTINUE":"TRY AGAIN"}</button></div></div>}
        {phase==="tutorial"&&<div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814f5] p-3"><div className="w-full max-w-lg rounded-2xl border border-[#ffc30077] bg-[#001d3d] p-5 text-center sm:p-7"><div className="mb-2 flex justify-center"><Radar className="text-[#ffd60a]" size={34}/></div><h2 className="mb-2 text-2xl font-black">HOW TO PLAY</h2><p className="mb-4 text-sm text-[#bfd0e0]">Drive through the mysterious Moon maze to find <b>3 blue rescue beacons</b> in order.</p><div className="space-y-2 text-left text-sm"><p>🚙 <b>WASD / Arrow keys</b> — Drive the rover</p><p>📡 <b>Space / R</b> — Scan nearby hidden terrain</p><p>🪨 <b>Go around rocks</b> — They block your path</p><p>☄️ <b>Avoid red dust hazards</b> — They damage armor</p><p>🔋 <b>Collect yellow batteries</b> — Refuel and earn radar charges</p><p>◆ <b>Find three blue beacons</b> — Win the mission!</p></div><button onClick={begin} className="mt-5 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814]">START NAVIGATION 🚀</button></div></div>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
        <div className="grid grid-cols-3 gap-1.5"><span/><button onClick={()=>moveButton("up")} disabled={phase!=="playing"} className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718b] bg-[#001d3d] disabled:opacity-40" aria-label="Up"><ArrowUp/></button><span/><button onClick={()=>moveButton("left")} disabled={phase!=="playing"} className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718b] bg-[#001d3d] disabled:opacity-40" aria-label="Left"><ArrowLeft/></button><button onClick={()=>moveButton("down")} disabled={phase!=="playing"} className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718b] bg-[#001d3d] disabled:opacity-40" aria-label="Down"><ArrowDown/></button><button onClick={()=>moveButton("right")} disabled={phase!=="playing"} className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718b] bg-[#001d3d] disabled:opacity-40" aria-label="Right"><ArrowRight/></button></div>
        <button onClick={scan} disabled={phase!=="playing"||scans<=0} className="flex h-14 items-center gap-2 rounded-xl bg-[#ffc300] px-5 text-sm font-black text-[#000814] disabled:opacity-40"><Radar size={21}/> RADAR PULSE <span className="rounded bg-[#0008141f] px-2">{scans}</span></button>
        <button onClick={reset} disabled={busy} className="flex h-12 items-center gap-2 rounded-xl border border-[#45637d] px-4 text-sm font-bold text-[#ffd60a]"><RotateCcw size={16}/> RESTART</button>
      </div>
      <p className="text-center text-[11px] text-[#96aec7]">NAVIGATION SCIENCE · Real lunar rover routes consider terrain, obstacles, slopes and communication limits. This radar maze is a simplified training game.</p>
    </main>
  </div>;
}
