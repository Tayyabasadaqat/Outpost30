"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BatteryCharging, CheckCircle2, Compass, HelpCircle, MapPin, Pickaxe, Radar, RotateCcw, Scan, ShieldAlert, X } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Position = { x: number; y: number };
type Specimen = Position & { name: string; detail: string; color: string };
const COLS = 9, ROWS = 6;
const SAMPLES: Specimen[] = [
  { x: 1, y: 1, name: "BASALT", detail: "Dark volcanic rock formed when ancient lunar lava cooled.", color: "#7eb8ff" },
  { x: 7, y: 1, name: "BRECCIA", detail: "Rock made from fragments fused together by impacts.", color: "#ffd36d" },
  { x: 2, y: 4, name: "ANORTHOSITE", detail: "Light-colored rock linked to the Moon's ancient crust.", color: "#d9dfff" },
  { x: 7, y: 4, name: "GLASS BEAD", detail: "Tiny impact glass gives clues about meteorite collisions.", color: "#88ecc2" },
];
const ROCKS = [{x:4,y:1},{x:5,y:4},{x:1,y:3},{x:8,y:3},{x:3,y:0},{x:6,y:2}];
const VENTS = [{x:4,y:2},{x:5,y:3},{x:6,y:5}];
const CHARGERS = [{x:0,y:5},{x:8,y:0}];
const CONFIG = { safe:{time:160,energy:100,scanCost:12,scanCooldown:2600,damage:12}, risky:{time:145,energy:90,scanCost:15,scanCooldown:3100,damage:16}, dangerous:{time:130,energy:80,scanCost:18,scanCooldown:3500,damage:21} };
const same=(a:Position,b:Position)=>a.x===b.x&&a.y===b.y;
const distance=(a:Position,b:Position)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const start={x:4,y:5};

export default function LunarSampleHunt({strategy="safe",busy=false,onComplete,onClose}:Props){
  const config=CONFIG[strategy];
  const [phase,setPhase]=useState<"intro"|"playing"|"won"|"lost">("intro");
  const [showHelp,setShowHelp]=useState(false);
  const [pos,setPos]=useState<Position>(start);
  const [scanned,setScanned]=useState<Position[]>([]);
  const [found,setFound]=useState<number[]>([]);
  const [energy,setEnergy]=useState(config.energy);
  const [seconds,setSeconds]=useState(config.time);
  const [lastScan,setLastScan]=useState(0);
  const [currentTip,setCurrentTip]=useState("Find hidden sample sites with the scanner!");
  const [dust,setDust]=useState<Position>({x:4,y:2});
  const [pulse,setPulse]=useState(false);
  const [batteryPicked,setBatteryPicked]=useState<number[]>([]);
  const [news,setNews]=useState<string|null>(null);
  const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const alertTime=useRef(0);
  const moveLock=useRef(0);
  const scanLock=useRef(0);
  const posRef=useRef(pos);
  const energyRef=useRef(energy);
  const phaseRef=useRef(phase);
  const dustRef=useRef(dust);
  const pickedRef=useRef(batteryPicked);
  useEffect(()=>{posRef.current=pos;},[pos]);
  useEffect(()=>{energyRef.current=energy;},[energy]);
  useEffect(()=>{phaseRef.current=phase;},[phase]);
  useEffect(()=>{dustRef.current=dust;},[dust]);
  useEffect(()=>{pickedRef.current=batteryPicked;},[batteryPicked]);
  const message=(txt:string)=>{setCurrentTip(txt);};
  const reset=()=>{setPhase("intro");setShowHelp(false);setPos(start);setScanned([]);setFound([]);setEnergy(config.energy);setSeconds(config.time);setLastScan(0);setCurrentTip("Find hidden sample sites with the scanner!");setDust({x:4,y:2});setBatteryPicked([]);setPulse(false);setNews(null);posRef.current=start;energyRef.current=config.energy;phaseRef.current="intro";pickedRef.current=[];scanLock.current=0;moveLock.current=0;};
  const lose=useCallback((why:string)=>{phaseRef.current="lost";setPhase("lost");setCurrentTip(why);},[]);
  const enter=(next:Position)=>{
    if(phaseRef.current!=="playing"||busy)return;
    if(next.x<0||next.x>=COLS||next.y<0||next.y>=ROWS)return;
    if(ROCKS.some(r=>same(r,next))){message("Boulder ahead! Go around it.");return;}
    posRef.current=next;setPos(next);
    if(VENTS.some(v=>same(v,next))){const e=Math.max(0,energyRef.current-config.damage);energyRef.current=e;setEnergy(e);message("DUST VENT! Avoid orange hazards.");if(e<=0)lose("The rover suit ran out of power.");}
    const charger=CHARGERS.findIndex(c=>same(c,next));
    if(charger>=0&&!pickedRef.current.includes(charger)){pickedRef.current=[...pickedRef.current,charger];setBatteryPicked(pickedRef.current);const e=Math.min(100,energyRef.current+32);energyRef.current=e;setEnergy(e);message("BATTERY PACK! +32 energy.");}
  };
  const move=useCallback((dx:number,dy:number)=>{if(Date.now()-moveLock.current<115)return;moveLock.current=Date.now();enter({x:posRef.current.x+dx,y:posRef.current.y+dy});},[busy,config.damage,lose]);
  const scan=useCallback(()=>{
    if(phaseRef.current!=="playing"||busy)return;
    const now=Date.now();if(now<scanLock.current){message("Scanner recharging!");return;}
    if(energyRef.current<config.scanCost){message("Low energy! Collect a blue battery pack.");return;}
    scanLock.current=now+config.scanCooldown;setLastScan(now);
    energyRef.current=Math.max(0,energyRef.current-config.scanCost);setEnergy(energyRef.current);
    const nearby=SAMPLES.filter((s,i)=>!found.includes(i)&&distance(s,posRef.current)<=3);
    setScanned(old=>[...old,...nearby.filter(s=>!old.some(o=>same(o,s)))]);
    setPulse(true);window.setTimeout(()=>setPulse(false),650);
    if(nearby.length)message(`PING! ${nearby.length} specimen signal${nearby.length>1?"s":""} nearby. Walk to the glowing rock and press E.`);
    else message("No sample signals nearby. Explore somewhere else!");
    if(energyRef.current<=0)lose("Scanner drained the last of your power.");
  },[busy,config.scanCost,config.scanCooldown,found,lose]);
  const collect=useCallback(()=>{
    if(phaseRef.current!=="playing"||busy)return;
    const i=SAMPLES.findIndex((s,index)=>!found.includes(index)&&same(s,posRef.current)&&scanned.some(a=>same(a,s)));
    if(i<0){message("Stand on a revealed glowing sample, then press E to collect it.");return;}
    const next=[...found,i];setFound(next);setNews(`${SAMPLES[i].name} • ${SAMPLES[i].detail}`);message(`SAMPLE SECURED! ${SAMPLES[i].name}. ${next.length}/4 collected.`);
    if(next.length===SAMPLES.length){phaseRef.current="won";setPhase("won");}
  },[busy,found,scanned]);
  useEffect(()=>{
    function key(e:KeyboardEvent){const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","e","f"].includes(k)){e.preventDefault();}if(phaseRef.current!=="playing"||showHelp)return;
      if(k==="arrowup"||k==="w")move(0,-1);
      else if(k==="arrowdown"||k==="s")move(0,1);
      else if(k==="arrowleft"||k==="a")move(-1,0);
      else if(k==="arrowright"||k==="d")move(1,0);
      else if(k===" "||k==="f")scan();
      else if(k==="e")collect();
    }
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[move,scan,collect,showHelp]);
  useEffect(()=>{
    if(phase!=="playing"||showHelp||busy)return;
    timer.current=setInterval(()=>{setSeconds(t=>{if(t<=1){lose("The expedition timer ran out.");return 0;}return t-1;});},1000);
    return()=>{if(timer.current)clearInterval(timer.current);};
  },[phase,showHelp,busy,lose]);
  const near=SAMPLES.filter((s,i)=>!found.includes(i)&&distance(pos,s)<=3).length;
  const canCollect=SAMPLES.some((s,i)=>!found.includes(i)&&same(s,pos)&&scanned.some(a=>same(a,s)));
  const clock=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const scanReady=Date.now()>=scanLock.current;
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#244669] bg-[#001d3d] px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Pickaxe size={22}/></span><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 13 · LUNAR SCIENCE</p><h2 className="text-lg font-black sm:text-2xl">MOON ROCK HUNT</h2></div></div><div className="flex items-center gap-2"><span className="rounded-lg border border-[#355d81] px-3 py-2 text-xs font-black">{clock}</span><button onClick={()=>setShowHelp(true)} aria-label="How to play" className="rounded-lg border border-[#355d81] p-2"><HelpCircle size={18}/></button><button onClick={onClose} disabled={busy} aria-label="Close game" className="p-2"><X size={21}/></button></div></header>
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#284c6d] bg-[#001d3d] p-3"><p className="text-[10px] font-bold tracking-widest text-slate-400">SAMPLES</p><p className="text-xl font-black text-[#ffd60a]">{found.length} / 4</p></div><div className="rounded-xl border border-[#284c6d] bg-[#001d3d] p-3"><p className="text-[10px] font-bold tracking-widest text-slate-400">SUIT BATTERY</p><div className="mt-1 h-2 rounded-full bg-[#173750]"><div style={{width:`${energy}%`}} className={`h-full rounded-full ${energy<25?"bg-red-400":"bg-[#78e3ae]"}`}/></div><p className="mt-1 text-xs font-bold">{energy}%</p></div><div className="col-span-2 rounded-xl border border-[#284c6d] bg-[#001d3d] p-3 sm:col-span-1"><p className="text-[10px] font-bold tracking-widest text-slate-400">LOCAL SIGNALS</p><p className="text-xl font-black text-[#7ed9ff]">{near?`${near} nearby`:"Search area"}</p></div></div>
      <div className="relative overflow-hidden rounded-2xl border border-[#335576] bg-[#08182b] p-2 shadow-[inset_0_0_50px_#0009] sm:p-4"><div className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(#d0d8ea 1px,transparent 1px)",backgroundSize:"35px 37px"}}/><div className="relative mx-auto grid max-w-[700px] grid-cols-9 gap-1 sm:gap-2">{Array.from({length:COLS*ROWS},(_,n)=>{const x=n%COLS,y=Math.floor(n/COLS),cell={x,y};const me=same(pos,cell),rock=ROCKS.some(r=>same(r,cell)),vent=VENTS.some(v=>same(v,cell)),battery=CHARGERS.findIndex(c=>same(c,cell)),sampleIndex=SAMPLES.findIndex(s=>same(s,cell)),exposed=sampleIndex>=0&&scanned.some(s=>same(s,cell)),done=sampleIndex>=0&&found.includes(sampleIndex);return <button key={n} disabled={phase!=="playing"||busy} onClick={()=>{if(distance(posRef.current,cell)===1)enter(cell);else message("Move one square at a time using WASD, arrows or adjacent tiles.");}} title={`Row ${y+1}, column ${x+1}`} className={`relative aspect-square rounded-lg border transition-colors ${me?"z-10 border-[#ffd60a] bg-[#52451d] shadow-[0_0_18px_#ffd60a99]":rock?"border-[#4e5968] bg-[#374151]":vent?"border-[#ab694a] bg-[#4e2e22]":exposed&&!done?"border-[#ffd60a] bg-[#55451b] animate-pulse":"border-[#2a415a] bg-[#102a42] hover:border-[#6495bf]"}`}><div className="absolute inset-0 grid place-items-center">{me?<span className="text-[17px] sm:text-[27px]">👩‍🚀</span>:rock?<span className="text-[13px] sm:text-[24px]">🪨</span>:vent?<span className="text-[12px] sm:text-[20px]">⚠️</span>:battery>=0&&!batteryPicked.includes(battery)?<BatteryCharging className="h-4 w-4 text-[#75d3ff] sm:h-7 sm:w-7"/>:done?<CheckCircle2 className="h-5 w-5 text-[#84e7bb] sm:h-7 sm:w-7"/>:exposed?<span className="text-[14px] sm:text-[26px]">💎</span>:<span className="text-[8px] text-[#718198]/40">·</span>}</div>{pulse&&distance(pos,cell)<=3&&<div className="pointer-events-none absolute inset-0 rounded-lg border border-[#7ad7ff] bg-[#7ad7ff]/20"/>}</button>;})}</div><div className="relative mt-3 flex flex-wrap justify-between gap-2 text-[10px] font-bold text-slate-300"><span>🪨 BOULDER = BLOCKED</span><span>⚠️ ORANGE = HAZARD</span><span>🔋 BLUE = ENERGY</span><span>💎 GLOW = SAMPLE</span></div></div>
      <div className="rounded-xl border border-[#274b6d] bg-[#001d3d] p-3 text-center text-sm font-semibold text-[#cbe4ff]" role="status">{currentTip}</div>
      <div className="flex flex-wrap items-center justify-center gap-3"><div className="grid grid-cols-3 gap-1"><span/><button onClick={()=>move(0,-1)} disabled={phase!=="playing"||busy} aria-label="Move up" className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718c] bg-[#173653]"><ArrowUp size={20}/></button><span/><button onClick={()=>move(-1,0)} disabled={phase!=="playing"||busy} aria-label="Move left" className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718c] bg-[#173653]"><ArrowLeft size={20}/></button><button onClick={()=>move(0,1)} disabled={phase!=="playing"||busy} aria-label="Move down" className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718c] bg-[#173653]"><ArrowDown size={20}/></button><button onClick={()=>move(1,0)} disabled={phase!=="playing"||busy} aria-label="Move right" className="grid h-11 w-12 place-items-center rounded-lg border border-[#54718c] bg-[#173653]"><ArrowRight size={20}/></button></div><button onClick={scan} disabled={phase!=="playing"||busy||energy<config.scanCost} className="flex h-14 items-center gap-2 rounded-xl bg-[#ffc300] px-5 text-sm font-black text-[#000814] disabled:opacity-40"><Radar size={21}/>SCAN <span className="text-xs">(SPACE)</span></button><button onClick={collect} disabled={phase!=="playing"||busy||!canCollect} className="flex h-14 items-center gap-2 rounded-xl border border-[#77e9ad] bg-[#073c32] px-5 text-sm font-black text-[#a6ffd3] disabled:opacity-40"><Pickaxe size={19}/>COLLECT (E)</button></div>
      <div className="flex items-center justify-between text-xs text-[#b8c9dc]"><span>WASD / ARROWS to move · SPACE to scan · E to collect</span><button onClick={reset} disabled={busy} className="flex items-center gap-1 font-bold text-[#ffd60a]"><RotateCcw size={14}/> RESTART</button></div>
      {news&&<div className="rounded-lg border border-[#376f66] bg-[#08362e] p-3 text-xs text-[#baf7d4]">🔬 {news}</div>}
    </div>
    {(phase==="intro"||phase==="won"||phase==="lost"||showHelp)&&<div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#000814ed] p-4"><div className="w-full max-w-md rounded-2xl border border-[#355d85] bg-[#001d3d] p-6 shadow-2xl"><div className="mb-3 flex justify-center"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ffc300] text-[#000814]">{phase==="won"?<CheckCircle2 size={34}/>:<Scan size={34}/>}</span></div><h3 className="text-center text-2xl font-black">{showHelp?"HOW TO PLAY":phase==="intro"?"MOON ROCK HUNT":phase==="won"?"SCIENCE MISSION COMPLETE!":"MISSION RETRY"}</h3>{(showHelp||phase==="intro")?<><p className="mb-5 mt-2 text-center text-sm text-[#c4d6e9]">Find 4 hidden Moon samples and bring their discoveries back to the research team.</p><div className="space-y-3 text-sm"><p>🕹️ <b>MOVE</b> — WASD / Arrow keys (or tap adjacent tiles)</p><p>📡 <b>SCAN</b> — Press Space to reveal nearby hidden samples</p><p>💎 <b>COLLECT</b> — Walk onto a glowing sample and press E</p><p>🔋 <b>RECHARGE</b> — Collect blue batteries. Avoid orange hazards!</p></div><button onClick={()=>{if(showHelp){setShowHelp(false);}else{phaseRef.current="playing";setPhase("playing");}}} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">{showHelp?"BACK TO GAME":"START EXPEDITION"}</button></>:phase==="won"?<><p className="mt-3 text-center text-sm leading-6 text-[#bed1e5]">All four lunar specimens recovered! Scientists can now study volcanic rock, impact fragments and ancient lunar crust.</p><button onClick={onComplete} disabled={busy} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-40">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></>:<><p className="mt-3 text-center text-sm text-[#c4d6e9]">{currentTip}</p><button onClick={reset} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">TRY AGAIN</button></>}</div></div>}
  </div>;
}
