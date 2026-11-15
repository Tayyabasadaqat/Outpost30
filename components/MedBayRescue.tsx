"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, HelpCircle, RotateCcw, Scan, ShieldAlert, X } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onClose: () => void; onComplete: () => void };
type Phase = "tutorial" | "scan" | "sync" | "collect" | "won" | "lost";
type Supply = { id: number; x: number; y: number; bad: boolean };
const CONFIG = {
  safe: { time: 185, hearts: 5, syncSpeed: 0.55, catchSpeed: 15, target: 4, window: 0.19 },
  risky: { time: 155, hearts: 4, syncSpeed: 0.75, catchSpeed: 19, target: 5, window: 0.16 },
  dangerous: { time: 135, hearts: 3, syncSpeed: 0.94, catchSpeed: 23, target: 5, window: 0.14 },
} as const;
const SCAN_SPOTS = [{x:24,y:37,label:"HEART"},{x:52,y:67,label:"BREATHING"},{x:79,y:33,label:"TEMPERATURE"}];
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));

export default function MedBayRescue({ strategy="safe",busy=false,onClose,onComplete }:Props) {
  const cfg=CONFIG[strategy];
  const [phase,setPhase]=useState<Phase>("tutorial");
  const [seconds,setSeconds]=useState<number>(cfg.time);
  const [hearts,setHearts]=useState<number>(cfg.hearts);
  const [scanned,setScanned]=useState<number[]>([]);
  const [syncs,setSyncs]=useState(0);
  const [needle,setNeedle]=useState(0);
  const [flash,setFlash]=useState<"good"|"bad"|null>(null);
  const [collectorX,setCollectorX]=useState(50);
  const [supplies,setSupplies]=useState<Supply[]>([]);
  const [caught,setCaught]=useState(0);
  const [notice,setNotice]=useState("Inspect all three glowing medical sensors.");
  const [showHelp,setShowHelp]=useState(false);
  const live=useRef({phase:"tutorial" as Phase,seconds:cfg.time,hearts:cfg.hearts,needle:0,dir:1,collectorX:50,lastTick:0,spawn:0,seq:0,caught:0,syncs:0, supplies:[] as Supply[],keys:{left:false,right:false}});

  const setPhaseSafe=(p:Phase)=>{live.current.phase=p;setPhase(p);};
  const reset=useCallback(()=>{
    live.current={phase:"tutorial",seconds:cfg.time,hearts:cfg.hearts,needle:0,dir:1,collectorX:50,lastTick:0,spawn:0,seq:0,caught:0,syncs:0,supplies:[],keys:{left:false,right:false}};
    setPhase("tutorial");setSeconds(cfg.time);setHearts(cfg.hearts);setScanned([]);setSyncs(0);setNeedle(0);setFlash(null);setCollectorX(50);setSupplies([]);setCaught(0);setNotice("Inspect all three glowing medical sensors.");setShowHelp(false);
  },[cfg]);
  const begin=()=>{setPhaseSafe("scan");setNotice("Tap each glowing sensor to check vital signs.");};
  const damage=useCallback((text:string)=>{
    const l=live.current;l.hearts=Math.max(0,l.hearts-1);setHearts(l.hearts);setFlash("bad");setNotice(text);
    if(l.hearts===0){l.phase="lost";setPhase("lost");setNotice("MedBot lost too many safety points. Try again!");}
  },[]);
  const scan=(idx:number)=>{
    if(live.current.phase!=="scan"||scanned.includes(idx))return;
    const next=[...scanned,idx];setScanned(next);setFlash("good");
    if(next.length===3){setPhaseSafe("sync");setNotice("Vitals scanned! Press SPACE when the white marker reaches the GREEN section.");}
    else setNotice(`Sensor ${next.length}/3 checked. Find the next glowing marker.`);
  };
  const synchronize=useCallback(()=>{
    const l=live.current;
    if(l.phase!=="sync")return;
    const good=Math.abs(l.needle-0.5)<=cfg.window;
    if(!good){damage("Pulse mistimed! Wait until the white marker reaches green.");return;}
    const next=l.syncs+1;l.syncs=next;setSyncs(next);setFlash("good");
    if(next===3){l.phase="collect";setPhase("collect");setNotice("Monitor stabilized! Move MedBot to catch BLUE recovery packs. Avoid RED hazards!");}
    else setNotice(`Pulse ${next}/3 synchronized! Time the next one.`);
  },[cfg.window,damage]);
  const syncRef=useRef(synchronize);syncRef.current=synchronize;
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if([" ","arrowleft","arrowright","a","d"].includes(k))e.preventDefault();
      if((k===" "||k==="enter")&&!e.repeat)syncRef.current();
      if(k==="a"||k==="arrowleft")live.current.keys.left=true;
      if(k==="d"||k==="arrowright")live.current.keys.right=true;
    };
    const up=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==="a"||k==="arrowleft")live.current.keys.left=false;if(k==="d"||k==="arrowright")live.current.keys.right=false;};
    const blur=()=>{live.current.keys.left=false;live.current.keys.right=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[]);
  useEffect(()=>{
    if(!flash)return;const t=window.setTimeout(()=>setFlash(null),350);return()=>window.clearTimeout(t);
  },[flash]);
  useEffect(()=>{
    if(phase==="tutorial"||phase==="won"||phase==="lost"||showHelp||busy)return;
    let raf=0,prev=0;
    const tick=(now:number)=>{
      if(!prev)prev=now;const dt=Math.min(.055,(now-prev)/1000);prev=now;
      const l=live.current;
      if(l.phase==="sync"){
        l.needle+=l.dir*cfg.syncSpeed*dt;
        if(l.needle>=1){l.needle=1;l.dir=-1;}if(l.needle<=0){l.needle=0;l.dir=1;}
        setNeedle(l.needle);
      }
      if(l.phase==="collect"){
        const direction=Number(l.keys.right)-Number(l.keys.left);
        if(direction){l.collectorX=clamp(l.collectorX+direction*54*dt,9,91);setCollectorX(l.collectorX);}
        l.spawn+=dt;
        if(l.spawn>=1.0){l.spawn=0;l.seq++;l.supplies.push({id:l.seq,x:13+Math.random()*74,y:-5,bad:Math.random()<.32});}
        const kept:Supply[]=[];
        for(const s of l.supplies){const y=s.y+cfg.catchSpeed*dt;
          if(y>=85){
            if(Math.abs(s.x-l.collectorX)<12){
              if(s.bad){l.hearts=Math.max(0,l.hearts-1);setHearts(l.hearts);setNotice("Contaminated supply! Avoid the RED packs.");setFlash("bad");if(l.hearts===0){l.phase="lost";setPhase("lost");}}
              else{l.caught++;setCaught(l.caught);setFlash("good");setNotice(`Safe recovery pack collected! ${Math.min(l.caught,cfg.target)}/${cfg.target}`);
                if(l.caught>=cfg.target){l.phase="won";setPhase("won");setNotice("Patient stabilized. Medical emergency resolved!");}}
            }
          }else kept.push({...s,y});
        }
        l.supplies=kept;setSupplies(kept);
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[phase,showHelp,busy,cfg.syncSpeed,cfg.catchSpeed,cfg.target]);
  useEffect(()=>{
    if(["tutorial","won","lost"].includes(phase)||showHelp||busy)return;
    const id=window.setInterval(()=>{const l=live.current;l.seconds=Math.max(0,l.seconds-1);setSeconds(l.seconds);if(l.seconds===0){l.phase="lost";setPhase("lost");setNotice("Time ran out. Restart the medical response.");}},1000);
    return()=>window.clearInterval(id);
  },[phase,showHelp,busy]);
  const clock=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const step=phase==="scan"?1:phase==="sync"?2:phase==="collect"?3:phase==="won"?3:1;
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#244669] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><HeartPulse size={23}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 20 · MEDICAL EMERGENCY</p><h2 className="text-xl font-black">MEDBAY RESCUE</h2></div></div>
      <div className="flex items-center gap-2"><span className="rounded-lg border border-[#50627d] px-3 py-2 text-xs font-bold">❤️ {hearts}</span><span className="rounded-lg border border-[#50627d] px-3 py-2 text-xs font-bold text-[#ffd60a]">⏱ {clock}</span><button aria-label="How to play" onClick={()=>setShowHelp(true)} className="rounded-lg border border-[#50627d] p-2"><HelpCircle size={19}/></button><button aria-label="Exit game" disabled={busy} onClick={onClose} className="p-2"><X size={21}/></button></div>
    </header>
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4">
      <div className="flex gap-2">{["SCAN VITALS","SYNC MONITOR","RECOVERY"].map((name,i)=><div key={name} className={`flex-1 rounded-lg border p-2 text-center text-[10px] font-black sm:text-xs ${i+1===step?"border-[#ffc300] bg-[#ffc300]/15 text-[#ffd60a]":i+1<step?"border-emerald-500/50 text-emerald-300":"border-[#254260] text-slate-400"}`}>{i+1}. {name}</div>)}</div>
      <div role="status" aria-live="polite" className={`min-h-10 rounded-lg px-3 py-2 text-center text-sm font-bold ${flash==="bad"?"bg-red-800/35 text-red-300":"bg-[#001d3d] text-[#ffd60a]"}`}>{notice}</div>
      <section className={`relative min-h-[330px] flex-1 overflow-hidden rounded-2xl border bg-[#071a2c] ${flash==="bad"?"border-red-400":"border-[#3d6183]"}`}>
        <div className="pointer-events-none absolute inset-0 opacity-15" style={{backgroundImage:"linear-gradient(#7bd5fa55 1px, transparent 1px),linear-gradient(90deg,#7bd5fa55 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
        {phase==="scan"&&<div className="relative mx-auto flex h-full min-h-[340px] max-w-2xl flex-col items-center justify-center gap-4 p-5">
          <div className="text-center text-xs font-bold tracking-[.2em] text-[#86cfff]">MEDICAL SCANNER · SELECT ALL 3 SENSORS</div>
          <div className="relative h-[230px] w-full max-w-lg rounded-2xl border border-[#234563] bg-[#001d3d]">
            <div className="absolute left-1/2 top-1/2 h-[142px] w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-[#84b4d0] bg-[#153b58] shadow-[0_0_40px_#16497d]"/>
            <div className="absolute left-1/2 top-[9%] h-12 w-12 -translate-x-1/2 rounded-full border border-[#88cfff] bg-[#174c70]"/>
            {SCAN_SPOTS.map((spot,i)=><button key={spot.label} onClick={()=>scan(i)} disabled={scanned.includes(i)} className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition-all ${scanned.includes(i)?"border-emerald-400 bg-emerald-700/50 text-emerald-100":"animate-pulse border-[#ffd60a] bg-[#ffc300] text-[#000814]"}`} style={{left:`${spot.x}%`,top:`${spot.y}%`}}>{scanned.includes(i)?<CheckCircle2 size={21}/>:<Scan size={21}/>}<span>{spot.label}</span></button>)}
          </div><div className="text-sm text-slate-300">Tap each glowing marker. {scanned.length}/3 checked.</div>
        </div>}
        {phase==="sync"&&<div className="relative mx-auto flex min-h-[340px] max-w-2xl flex-col items-center justify-center gap-7 p-6">
          <Activity className="text-[#ffd60a]" size={54}/><div className="text-center"><h3 className="text-xl font-black">SYNC THE HEART MONITOR</h3><p className="mt-2 text-sm text-slate-300">Press SPACE when the white marker is inside the green zone.</p></div>
          <div className="relative h-16 w-full max-w-xl overflow-hidden rounded-xl border-2 border-[#345675] bg-[#001326]">
            <div className="absolute inset-y-0 bg-emerald-600/55" style={{left:`${(0.5-cfg.window)*100}%`,width:`${cfg.window*200}%`}}/>
            <div className="absolute inset-y-0 w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_14px_white]" style={{left:`${needle*100}%`}}/>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-white">SAFE ZONE</span>
          </div>
          <div className="font-black text-[#ffd60a]">{syncs}/3 SUCCESSFUL PULSES</div>
          <button onClick={synchronize} className="rounded-xl bg-[#ffc300] px-10 py-4 text-base font-black text-[#000814]">⚡ SYNC NOW · SPACE</button>
        </div>}
        {phase==="collect"&&<div className="relative h-full min-h-[350px] w-full overflow-hidden">
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-[#001d3ddd] px-3 py-2 text-xs font-bold text-[#ffd60a]">BLUE = SAFE · RED = AVOID</div>
          <div className="absolute right-3 top-3 z-10 rounded-lg bg-[#001d3ddd] px-3 py-2 text-xs font-bold">PACKS: {caught}/{cfg.target}</div>
          {supplies.map(s=><div key={s.id} className={`absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-2 text-xl font-black shadow-lg ${s.bad?"border-red-300 bg-red-600 text-white":"border-[#9ae8ff] bg-[#1684d4] text-white"}`} style={{left:`${s.x}%`,top:`${s.y}%`}}>{s.bad?"✕":"+"}</div>)}
          <div className="absolute bottom-[9%] h-14 w-24 -translate-x-1/2 rounded-xl border-2 border-[#ffe675] bg-[#003566] shadow-[0_0_26px_#ffc30055]" style={{left:`${collectorX}%`}}><div className="grid h-full place-items-center text-center text-[11px] font-black text-[#ffd60a]">🤖<span>MEDBOT</span></div></div>
          <div className="absolute inset-x-0 bottom-[6%] h-1 bg-[#ffc300]/50"/>
        </div>}
        {(phase==="won"||phase==="lost")&&<div className="absolute inset-0 z-10 flex items-center justify-center bg-[#000814ed] p-5"><div className="max-w-sm text-center">{phase==="won"?<CheckCircle2 className="mx-auto mb-3 text-[#ffd60a]" size={64}/>:<ShieldAlert className="mx-auto mb-3 text-red-400" size={64}/>}<h3 className="text-3xl font-black">{phase==="won"?"CREW MEMBER STABILIZED!":"MEDICAL MISSION RETRY"}</h3><p className="my-4 text-sm leading-6 text-slate-300">{phase==="won"?"Vitals checked, monitor stabilized, and recovery supplies delivered. Great teamwork!":"Your medical support robot needs another attempt."}</p>{phase==="won"?<button disabled={busy} onClick={onComplete} className="w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING…":"MISSION COMPLETE · CONTINUE"}</button>:<button onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw size={20}/> TRY AGAIN</button>}</div></div>}
        {phase==="tutorial"&&<div className="absolute inset-0 z-10 grid place-items-center bg-[#000814ed] p-4"><div className="w-full max-w-md rounded-2xl border border-[#ffc30066] bg-[#001d3d] p-5 sm:p-7"><div className="mb-4 flex items-center gap-3"><HeartPulse className="text-[#ffd60a]" size={36}/><div><p className="text-xs font-bold text-[#ffd60a]">MISSION BRIEFING</p><h3 className="text-2xl font-black">SAVE THE ASTRONAUT</h3></div></div><div className="space-y-3 text-sm leading-6 text-slate-100"><p><strong className="text-[#ffd60a]">1. SCAN:</strong> Tap all 3 glowing health sensors.</p><p><strong className="text-[#ffd60a]">2. SYNC:</strong> Press SPACE when the moving needle is in green. Do it 3 times.</p><p><strong className="text-[#ffd60a]">3. COLLECT:</strong> Move the MedBot with ← → or A/D. Catch BLUE recovery packs, dodge RED hazards.</p></div><p className="my-4 text-xs text-slate-300">The timer starts when you press Start. This is a simplified science-fiction simulation, not medical advice.</p><button onClick={begin} className="w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">START MEDICAL RESCUE</button></div></div>}
      </section>
      <div className="flex items-center justify-between gap-2"><div className="text-xs text-slate-400">{phase==="collect"?"← → MOVE MEDBOT · CATCH BLUE PACKS":phase==="sync"?"SPACE / SYNC NOW · HIT THE GREEN ZONE":"DAY 20 · MEDICAL TRAINING SIMULATION"}</div><button onClick={reset} disabled={busy} className="flex items-center gap-1 text-xs font-bold text-[#ffd60a]"><RotateCcw size={15}/> RESTART</button></div>
      {phase==="collect"&&<div className="flex justify-center gap-5"><button onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);live.current.keys.left=true;}} onPointerUp={()=>live.current.keys.left=false} onPointerCancel={()=>live.current.keys.left=false} onLostPointerCapture={()=>live.current.keys.left=false} className="grid h-14 w-24 touch-none place-items-center rounded-xl border border-[#456b8e] bg-[#001d3d]"><ArrowLeft size={26}/></button><button onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);live.current.keys.right=true;}} onPointerUp={()=>live.current.keys.right=false} onPointerCancel={()=>live.current.keys.right=false} onLostPointerCapture={()=>live.current.keys.right=false} className="grid h-14 w-24 touch-none place-items-center rounded-xl border border-[#456b8e] bg-[#001d3d]"><ArrowRight size={26}/></button></div>}
      <p className="text-center text-[11px] text-slate-400">SCIENCE FACT: Real crew health response relies on medical assessment, trained personnel, and mission-specific protocols. This game uses fictional controls.</p>
    </main>
    {showHelp&&<div className="fixed inset-0 z-[95] grid place-items-center bg-[#000814ee] p-4"><div className="w-full max-w-sm rounded-2xl border border-[#ffc30070] bg-[#001d3d] p-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">HOW TO PLAY</h3><button onClick={()=>setShowHelp(false)} aria-label="Close help"><X/></button></div><p className="mb-3 text-sm">🔍 SCAN: Tap 3 glowing markers.</p><p className="mb-3 text-sm">💚 SYNC: Press Space on the green zone, 3 times.</p><p className="mb-4 text-sm">🤖 RECOVERY: Move left/right, catch blue, avoid red.</p><button onClick={()=>setShowHelp(false)} className="w-full rounded-xl bg-[#ffc300] p-3 font-black text-[#000814]">BACK TO MISSION</button></div></div>}
  </div>;
}
