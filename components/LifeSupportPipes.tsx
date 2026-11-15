"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Gauge, RotateCcw, Wind, X } from "lucide-react";
import type { Strategy } from "@/components/MissionStrategy";

type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Tile = { kind: "straight" | "corner" | "empty"; rotation: number };
type Port = "N" | "E" | "S" | "W";
const ALL: Port[] = ["N", "E", "S", "W"];
const OPPOSITE: Record<Port,Port> = { N:"S",E:"W",S:"N",W:"E" };
const PATH = [4,5,9,10,11]; // 4x4: (1,0) → (1,1) → (2,1) → (2,2) → (2,3)
const GOAL = PATH[PATH.length-1];
const DEFAULT: Tile[] = [
  {kind:"corner",rotation:1},{kind:"straight",rotation:0},{kind:"corner",rotation:2},{kind:"empty",rotation:0},
  {kind:"straight",rotation:0},{kind:"corner",rotation:0},{kind:"straight",rotation:1},{kind:"corner",rotation:3},
  {kind:"corner",rotation:3},{kind:"corner",rotation:1},{kind:"straight",rotation:0},{kind:"straight",rotation:0},
  {kind:"empty",rotation:0},{kind:"straight",rotation:1},{kind:"corner",rotation:0},{kind:"corner",rotation:2},
];
const SETTINGS={safe:{low:38,high:70,hold:2.0},risky:{low:46,high:62,hold:2.7},dangerous:{low:52,high:58,hold:3.3}};
function ports(tile:Tile):Port[]{
  if(tile.kind==="empty")return [];
  const base:Port[]=tile.kind==="straight"?["N","S"]:["N","E"];
  return base.map(p=>ALL[(ALL.indexOf(p)+tile.rotation)%4]);
}
function nextIndex(index:number,port:Port){const row=Math.floor(index/4),col=index%4; if(port==="N")return row>0?index-4:-1;if(port==="S")return row<3?index+4:-1;if(port==="W")return col>0?index-1:-1;return col<3?index+1:-1;}
function findPath(tiles:Tile[]):number[]{
  if(!ports(tiles[4]).includes("W")||!ports(tiles[GOAL]).includes("E"))return [];
  const q:[number,number[]][]=[[4,[4]]],visited=new Set<number>([4]);
  while(q.length){const [idx,path]=q.shift()!;if(idx===GOAL)return path;
    for(const p of ports(tiles[idx])){const neighbor=nextIndex(idx,p);if(neighbor<0||visited.has(neighbor)||!ports(tiles[neighbor]).includes(OPPOSITE[p]))continue;visited.add(neighbor);q.push([neighbor,[...path,neighbor]]);}
  }
  return [];
}
function PipeTile({tile,active,highlight,onClick,index}: {tile:Tile;active:boolean;highlight:boolean;onClick:()=>void;index:number}){
  const possible=ports(tile);
  return <button type="button" onClick={onClick} aria-label={`Rotate pipe ${index+1}`} className={`relative aspect-square overflow-hidden rounded-lg border transition-all duration-200 ${active?"border-[#ffc300] bg-[#003566] shadow-[inset_0_0_20px_#ffd60a20]":"border-[#345476] bg-[#001d3d] hover:border-[#ffd60a]"}`}>
    {tile.kind==="empty"?<span className="text-[10px] tracking-widest text-[#4e6987]">EMPTY</span>:
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <circle cx="50" cy="50" r="12" fill={highlight?"#ffd60a":"#52718f"}/>
      {possible.map(p=>{const v=p==="N"?{x:50,y:0,w:18,h:50}:p==="S"?{x:50,y:50,w:18,h:50}:p==="W"?{x:0,y:50,w:50,h:18}:{x:50,y:50,w:50,h:18};return <g key={p}><rect x={p==="N"||p==="S"?v.x-13:v.x} y={p==="E"||p==="W"?v.y-13:v.y} width={p==="N"||p==="S"?26:v.w} height={p==="E"||p==="W"?26:v.h} rx="5" fill={highlight?"#ffd60a":"#617d9a"}/><rect x={p==="N"||p==="S"?v.x-5:v.x} y={p==="E"||p==="W"?v.y-5:v.y} width={p==="N"||p==="S"?10:v.w} height={p==="E"||p==="W"?10:v.h} fill={highlight?"#fff5a8":"#a7becf"}/></g>})}
      <circle cx="50" cy="50" r="12" fill={highlight?"#ffd60a":"#829fb7"}/>
    </svg>}
    {index===4&&<span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r bg-[#ffc300] px-1 text-[8px] font-black text-[#000814]">IN</span>}
    {index===GOAL&&<span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l bg-[#ffc300] px-1 text-[8px] font-black text-[#000814]">OUT</span>}
  </button>;
}
export default function LifeSupportPipes({strategy="safe",onComplete,onClose,busy=false}:Props){
  const [tiles,setTiles]=useState<Tile[]>(()=>DEFAULT.map(t=>({...t})));
  const [pressure,setPressure]=useState(85);
  const [valve,setValve]=useState(false);
  const [progress,setProgress]=useState(0);
  const [running,setRunning]=useState(false);
  const [failed,setFailed]=useState(0);
  const setting=SETTINGS[strategy];
  const route=useMemo(()=>findPath(tiles),[tiles]);
  const routeReady=route.length>0;
  const pressureReady=pressure>=setting.low&&pressure<=setting.high;
  const ready=routeReady&&pressureReady&&valve;
  const completed=progress>=100;
  useEffect(()=>{
    if(!running||completed)return;
    if(!ready){setRunning(false);setProgress(0);setFailed(v=>v+1);return;}
    const interval=window.setInterval(()=>setProgress(p=>Math.min(100,p+100/(setting.hold*10))),100);
    return()=>window.clearInterval(interval);
  },[running,ready,completed,setting.hold]);
  function rotate(index:number){if(running||completed)return;setTiles(old=>old.map((tile,i)=>i===index?{...tile,rotation:(tile.rotation+1)%4}:tile));}
  function reset(){setTiles(DEFAULT.map(t=>({...t})));setPressure(85);setValve(false);setProgress(0);setRunning(false);setFailed(0)}
  return <div className="fixed inset-0 z-[70] flex flex-col bg-[#000814] text-white">
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#001d3d] px-4 py-3 sm:px-7"><div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">OUTPOST 30 / DAY 02 / LIFE SUPPORT</p><h2 className="text-lg font-black sm:text-2xl">Oxygen Systems</h2></div><button onClick={onClose} disabled={busy} aria-label="Close life support" className="rounded-lg border border-white/20 p-2"><X size={20}/></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6"><div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">01 / RECONNECT SUPPLY</p><h3 className="mt-2 text-xl font-black sm:text-2xl">Build the oxygen pipeline</h3><p className="mt-2 max-w-lg text-xs leading-6 text-slate-300 sm:text-sm">Click the pipe segments to rotate them. Create a continuous route from the oxygen generator to the habitat tank.</p></div><Wind size={28} className="shrink-0 text-[#ffd60a]"/></div>
        <div className="relative mx-auto mt-6 max-w-[450px]">
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-[#000814] p-2 sm:gap-3 sm:p-3">{tiles.map((tile,index)=><PipeTile key={index} index={index} tile={tile} active={route.includes(index)} highlight={running||completed?route.includes(index):false} onClick={()=>rotate(index)}/>)}</div>
        </div>
        <div className={`mt-5 flex items-center gap-3 rounded-lg border p-3 text-sm ${routeReady?"border-[#ffc300]/50 bg-[#ffc300]/10 text-[#ffe88a]":"border-white/10 bg-[#000814]/70 text-slate-300"}`}><span className={`size-2 rounded-full ${routeReady?"bg-[#ffd60a]":"bg-rose-400"}`}/>{routeReady?"OXYGEN ROUTE CONNECTED":"No continuous oxygen route detected"}</div>
      </section>
      <section className="space-y-5">
        <div className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-5 sm:p-6"><p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">02 / BALANCE THE SYSTEM</p><h3 className="mt-2 text-xl font-black">Pressure regulation</h3><p className="mt-3 text-xs leading-6 text-slate-300">Regulate simulated oxygen pressure before opening the supply valve.</p>
          <div className="mt-6 text-center"><Gauge size={34} className="mx-auto text-[#ffd60a]"/><strong className={`mt-2 block text-5xl tabular-nums ${pressureReady?"text-[#ffd60a]":"text-white"}`}>{pressure}<span className="text-xl">%</span></strong><p className="mt-2 text-xs font-bold tracking-widest text-slate-300">{pressureReady?"STABLE PRESSURE":pressure>setting.high?"PRESSURE TOO HIGH":"PRESSURE TOO LOW"}</p></div>
          <input type="range" min={0} max={100} value={pressure} disabled={running||completed} onChange={e=>setPressure(Number(e.target.value))} aria-label="Simulated oxygen pressure" className="mt-7 w-full cursor-pointer accent-[#ffc300]"/><div className="mt-1 flex justify-between text-[11px] text-slate-300"><span>0%</span><span className="text-[#ffd60a]">SAFE {setting.low}–{setting.high}%</span><span>100%</span></div>
          <button onClick={()=>setValve(v=>!v)} disabled={running||completed} className={`mt-6 flex w-full items-center justify-between rounded-xl border px-4 py-4 font-black ${valve?"border-[#ffc300] bg-[#ffc300]/10 text-[#ffd60a]":"border-white/20 bg-[#000814] text-white"}`}><span>MAIN SUPPLY VALVE</span><span>{valve?"OPEN":"CLOSED"}</span></button>
        </div>
        <div className="rounded-2xl border border-[#284d74] bg-[#001d3d]/80 p-5 sm:p-6"><p className="text-[10px] font-bold tracking-widest text-[#ffd60a]">03 / SYSTEM STARTUP</p><h3 className="mt-2 text-xl font-black">Oxygen flow</h3><div className="mt-5 h-4 overflow-hidden rounded-full bg-[#000814]"><div className="h-full rounded-full bg-[#ffd60a] transition-all duration-150" style={{width:`${progress}%`}}/></div><p className="mt-3 text-sm text-slate-300">{completed?"Life support online. Crew oxygen supply restored.":running?"Pressurizing system...":ready?"All systems ready. Start oxygen flow.":"Connect the pipeline, set pressure, and open the valve."}</p>{failed>0&&<p className="mt-2 text-xs text-amber-300">Startup interrupted {failed} time(s). Check settings and retry.</p>}</div>
        <div className="rounded-xl border border-white/10 bg-[#000814]/80 p-4 text-xs leading-6 text-slate-300"><strong className="text-[#ffd60a]">SCIENCE NOTE</strong><p>Real spacecraft life-support systems monitor gases and cabin pressure. This training puzzle uses simplified fictional pressure percentages.</p></div>
      </section>
    </div></div>
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#001d3d] px-4 py-3 sm:px-7"><button onClick={reset} disabled={busy} className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm font-bold"><RotateCcw size={16}/> RESET SYSTEM</button><button onClick={completed?onComplete:()=>setRunning(true)} disabled={busy||(!completed&&!ready)||running} className="flex items-center gap-2 rounded-xl bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814] disabled:cursor-not-allowed disabled:opacity-35">{completed?(busy?"SAVING...":"OXYGEN RESTORED · CONTINUE"):running?"STARTING...":"ACTIVATE LIFE SUPPORT"}{completed?<CheckCircle2 size={18}/>:<ArrowRight size={18}/>}</button></footer>
  </div>;
}
