"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Heart, RotateCcw, ShieldAlert, Wind, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Phase = "intro" | "playing" | "won" | "lost";
type Thing = { x: number; y: number };
type Player = { x: number; y: number; vx: number; vy: number; ground: boolean; inv: number };
type Snapshot = { player: Player; cells: boolean[]; hearts: number; seconds: number; hint: string; botX: number[]; pulse: number };
const W = 900, H = 440;
const GROUND = 362;
const PLATFORMS = [
  {x:0,y:GROUND,w:204,h:78}, {x:250,y:GROUND,w:188,h:78},
  {x:482,y:GROUND,w:191,h:78}, {x:714,y:GROUND,w:186,h:78},
  {x:151,y:274,w:120,h:13}, {x:374,y:265,w:115,h:13},
  {x:593,y:258,w:125,h:13},
];
const CELLS: Thing[] = [{x:193,y:242},{x:439,y:232},{x:655,y:226}];
const CONFIG = {
  safe: {time:165,hearts:5,speed:186,botSpeed:1},
  risky: {time:140,hearts:4,speed:195,botSpeed:1.32},
  dangerous: {time:120,hearts:3,speed:202,botSpeed:1.65},
};
const spawn = (): Player => ({x:45,y:GROUND-30,vx:0,vy:0,ground:true,inv:0});
const initial = (c: typeof CONFIG.safe): Snapshot => ({player:spawn(),cells:[false,false,false],hearts:c.hearts,seconds:c.time,hint:"FIND 3 POWER CELLS • JUMP THE GAPS",botX:[333,562],pulse:0});
const clamp = (n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));

export default function OxygenReactorRun({strategy="safe",busy=false,onComplete,onClose}:Props){
  const cfg=CONFIG[strategy];
  const [phase,setPhase]=useState<Phase>("intro");
  const phaseRef=useRef<Phase>("intro");
  const [showHelp,setShowHelp]=useState(false);
  const [view,setView]=useState<Snapshot>(()=>initial(cfg));
  const world=useRef<Snapshot>(initial(cfg));
  const pressed=useRef({left:false,right:false,jump:false});
  const jumpQueued=useRef(false);
  const activateQueued=useRef(false);
  const last=useRef(0), renderAt=useRef(0);
  const [restarting,setRestarting]=useState(0);

  const reset=useCallback(()=>{
    const s=initial(cfg);world.current=s;setView(s);pressed.current={left:false,right:false,jump:false};
    jumpQueued.current=false;activateQueued.current=false;phaseRef.current="intro";setPhase("intro");
    setShowHelp(false);setRestarting(i=>i+1);
  },[cfg]);
  const start=()=>{phaseRef.current="playing";setPhase("playing");setShowHelp(false);last.current=0;};
  const requestJump=()=>{jumpQueued.current=true;};
  const requestActivate=()=>{activateQueued.current=true;};

  useEffect(()=>{
    const keyDown=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase();
      if(["arrowleft","arrowright","arrowup"," ","a","d","w","e"].includes(k))e.preventDefault();
      if(k==="a"||k==="arrowleft")pressed.current.left=true;
      if(k==="d"||k==="arrowright")pressed.current.right=true;
      if((k==="w"||k==="arrowup"||k===" ")&&!e.repeat)requestJump();
      if(k==="e"&&!e.repeat)requestActivate();
    };
    const keyUp=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase();
      if(k==="a"||k==="arrowleft")pressed.current.left=false;
      if(k==="d"||k==="arrowright")pressed.current.right=false;
    };
    const blur=()=>{pressed.current.left=false;pressed.current.right=false;};
    window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);window.removeEventListener("blur",blur);};
  },[]);

  useEffect(()=>{
    let id=0;
    const run=(now:number)=>{
      if(!last.current)last.current=now;
      const dt=Math.min((now-last.current)/1000,.035);last.current=now;
      const s=world.current;
      if(phaseRef.current==="playing"&&!busy&&!showHelp){
        s.seconds=Math.max(0,s.seconds-dt);
        s.pulse+=dt;
        const p=s.player;
        p.inv=Math.max(0,p.inv-dt);
        const direction=Number(pressed.current.right)-Number(pressed.current.left);
        p.vx=direction*cfg.speed;
        if(jumpQueued.current&&p.ground){p.vy=-460;p.ground=false;}
        jumpQueued.current=false;
        const lastBottom=p.y+30;
        p.x=clamp(p.x+p.vx*dt,8,W-26);
        p.vy=Math.min(650,p.vy+875*dt);
        p.y+=p.vy*dt;
        p.ground=false;
        for(const platform of PLATFORMS){
          if(p.vy>=0&&lastBottom<=platform.y+6&&p.y+30>=platform.y&&p.x+19>platform.x+3&&p.x<platform.x+platform.w-3){
            p.y=platform.y-30;p.vy=0;p.ground=true;break;
          }
        }
        if(p.y>H+20){s.hearts-=1;s.hint="WATCH THE GAPS! TRY THAT JUMP AGAIN.";s.player=spawn();s.player.inv=1.7;}
        CELLS.forEach((item,i)=>{
          if(!s.cells[i]&&Math.hypot(p.x+10-item.x,p.y+15-item.y)<31){
            s.cells[i]=true;
            s.hint=s.cells.every(Boolean)?"ALL CELLS FOUND! REACH THE REACTOR →":"POWER CELL SECURED! KEEP EXPLORING.";
          }
        });
        s.botX=[333+Math.sin(s.pulse*1.6*cfg.botSpeed)*61,562+Math.sin(s.pulse*1.2*cfg.botSpeed+1.2)*55];
        s.botX.forEach((bx)=>{
          if(p.inv<=0&&Math.abs(p.x+10-bx)<27&&p.y+30>GROUND-32&&p.y<GROUND+4){
            s.hearts-=1;p.inv=1.4;p.vy=-235;p.y-=7;s.hint="MAINTENANCE BOT HIT! JUMP TO AVOID IT.";
          }
        });
        if(activateQueued.current){
          if(p.x>800&&p.y>285){
            if(s.cells.every(Boolean)){
              s.hint="OXYGEN GENERATOR RESTARTED!";
              phaseRef.current="won";setPhase("won");
            }else{s.hint=`FIND ${s.cells.filter(v=>!v).length} MORE POWER CELL(S) FIRST!`;}
          }else{s.hint="GET CLOSE TO THE BIG O2 REACTOR ON THE RIGHT!";}
        }
        activateQueued.current=false;
        if(s.hearts<=0||s.seconds<=0){phaseRef.current="lost";setPhase("lost");}
        if(now-renderAt.current>36){setView({...s,player:{...s.player},cells:[...s.cells],botX:[...s.botX]});renderAt.current=now;}
      } else {jumpQueued.current=false;activateQueued.current=false;}
      id=requestAnimationFrame(run);
    };
    id=requestAnimationFrame(run);
    return()=>{cancelAnimationFrame(id);last.current=0;};
  },[cfg,busy,showHelp,restarting]);

  const hold=(k:"left"|"right")=>({
    onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pressed.current[k]=true;},
    onPointerUp:()=>{pressed.current[k]=false;},onPointerCancel:()=>{pressed.current[k]=false;},
    onLostPointerCapture:()=>{pressed.current[k]=false;},
  });
  const missionOn=phase==="playing";
  const p=view.player;
  const camera=clamp(p.x-315,0,270);
  const done=view.cells.filter(Boolean).length;
  const mm=String(Math.floor(view.seconds/60)).padStart(2,"0");
  const ss=String(Math.floor(view.seconds%60)).padStart(2,"0");
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#21476c] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Wind size={23}/></span><div><p className="text-[10px] font-black tracking-[.18em] text-[#ffd60a]">DAY 18 · OXYGEN GENERATOR FAULT</p><h2 className="text-lg font-black sm:text-2xl">O₂ REACTOR RUN</h2></div></div>
      <div className="flex items-center gap-3 text-xs font-black"><span className="text-[#ffd60a]">CELLS {done}/3</span><span className="text-rose-300"><Heart size={14} className="mr-1 inline"/>{view.hearts}</span><span className="rounded-lg border border-[#345d86] px-2 py-2">{mm}:{ss}</span><button aria-label="How to play" className="rounded-lg border border-[#345d86] p-2" onClick={()=>setShowHelp(true)}><CircleHelp size={18}/></button><button aria-label="Exit game" onClick={onClose} disabled={busy}><X size={21}/></button></div>
    </header>
    <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 text-xs font-bold"><span className="text-[#ffd60a]">{view.hint}</span><span className="shrink-0 text-slate-300">{done===3?"GET TO REACTOR →":"COLLECT THE YELLOW CELLS"}</span></div>
      <div className="relative mx-auto min-h-[230px] w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-[#2a537b] bg-[#05142a] shadow-[inset_0_0_80px_#0009]">
        <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Side scrolling lunar oxygen facility platform game">
          <defs><linearGradient id="oxygenSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#02091b"/><stop offset="1" stopColor="#063357"/></linearGradient><linearGradient id="oxygenFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#65758a"/><stop offset="1" stopColor="#2b3a54"/></linearGradient></defs>
          <rect width="900" height="440" fill="url(#oxygenSky)"/>
          {Array.from({length:42},(_,i)=><circle key={i} cx={(i*173+12)%900} cy={(i*71+8)%290} r={i%5===0?1.9:1} fill="#d9e8f9" opacity={.2+(i%4)*.16}/>)}
          <circle cx="118" cy="94" r="42" fill="#f4edc7" opacity=".88"/><circle cx="108" cy="88" r="9" fill="#aaad9c" opacity=".3"/>
          <g transform={`translate(${-camera},0)`}>
            <path d="M0 375 Q90 330 205 371 T440 366 T675 363 T900 370 L900 440 L0 440Z" fill="#142b46"/>
            {PLATFORMS.map((t,i)=><g key={i}><rect x={t.x} y={t.y} width={t.w} height={t.h} rx="4" fill="url(#oxygenFloor)" stroke="#9aacc0" strokeWidth="2"/><rect x={t.x+3} y={t.y+3} width={t.w-6} height="7" fill="#ffc300" opacity=".7"/>{Array.from({length:Math.max(1,Math.floor(t.w/40))},(_,j)=><path key={j} d={`M${t.x+12+j*40} ${t.y+18} l16 0`} stroke="#8aa1b9" strokeWidth="2"/>)}</g>)}
            {[204,438,673].map((x,i)=><g key={i}><path d={`M${x} 354 l23 0 l-12 24Z`} fill="#fb5363" opacity=".8"/></g>)}
            {CELLS.map((c,i)=>!view.cells[i]&&<g key={i} transform={`translate(${c.x},${c.y+Math.sin(view.pulse*3+i)*5})`}><circle r="25" fill="#ffc300" opacity=".12"/><rect x="-12" y="-16" width="24" height="32" rx="5" fill="#ffc300" stroke="#fff2b0" strokeWidth="3"/><path d="M3 -10 L-5 1 L2 1 L-2 11 L9 -3 L1 -3Z" fill="#001d3d"/></g>)}
            {view.botX.map((x,i)=><g key={i} transform={`translate(${x},${GROUND-18})`}><rect x="-21" y="-17" width="42" height="27" rx="8" fill="#e74c64" stroke="#ffc5cf" strokeWidth="2"/><circle cx="-9" cy="-2" r="5" fill="#fff"/><circle cx="9" cy="-2" r="5" fill="#fff"/><circle cx="-9" cy="12" r="5" fill="#08182b"/><circle cx="9" cy="12" r="5" fill="#08182b"/></g>)}
            <g transform="translate(826,280)"><rect x="-40" y="-58" width="85" height="140" rx="12" fill="#003566" stroke="#7ce1ff" strokeWidth="4"/><rect x="-28" y="-44" width="59" height="44" rx="7" fill={done===3?"#227b63":"#001524"} stroke="#ffc300" strokeWidth="2"/><text x="1" y="-15" textAnchor="middle" fontSize="24" fontWeight="900" fill="#ffd60a">O₂</text><rect x="-22" y="15" width="48" height="24" rx="5" fill="#081a31" stroke="#8daec2"/><circle cx="1" cy="27" r="7" fill={done===3?"#7dfa99":"#f65c73"}/><text x="3" y="60" fontSize="11" textAnchor="middle" fill="#fff" fontWeight="bold">REACTOR</text></g>
            <g transform={`translate(${p.x},${p.y})`} opacity={p.inv>0&&Math.floor(p.inv*10)%2===0?.42:1}><rect x="0" y="6" width="20" height="24" rx="7" fill="#e4f2ff" stroke="#74caff" strokeWidth="2"/><rect x="1" y="-7" width="18" height="17" rx="8" fill="#fff" stroke="#8bc9ea" strokeWidth="2"/><rect x="5" y="-3" width="12" height="9" rx="4" fill="#003566"/><rect x="-6" y="11" width="6" height="15" rx="3" fill="#ffc300"/><rect x="20" y="11" width="6" height="15" rx="3" fill="#ffc300"/><rect x="2" y="27" width="7" height="7" rx="1" fill="#ffc300"/><rect x="12" y="27" width="7" height="7" rx="1" fill="#ffc300"/></g>
          </g>
          <text x="18" y="418" fill="#bed9ed" fontSize="12" fontWeight="bold">JUMP OVER GAPS • AVOID RED BOTS • COLLECT YELLOW CELLS</text>
        </svg>
        {(phase==="intro"||showHelp)&&<div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ed] p-4"><div className="w-full max-w-lg rounded-2xl border border-[#ffc30077] bg-[#001d3d] p-5 text-center shadow-2xl sm:p-7"><div className="mb-3 text-4xl">👩‍🚀⚡</div><h3 className="text-2xl font-black">O₂ REACTOR RUN</h3><p className="mt-2 text-sm text-slate-200">The oxygen generator stopped working! Recover 3 power cells and restart the reactor on the far right.</p><div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs font-bold"><span className="rounded-lg bg-[#082c50] p-3">← → / A D: MOVE</span><span className="rounded-lg bg-[#082c50] p-3">SPACE / W: JUMP</span><span className="rounded-lg bg-[#082c50] p-3">⚡ TOUCH 3 YELLOW CELLS</span><span className="rounded-lg bg-[#082c50] p-3">E: RESTART REACTOR</span></div><p className="mt-3 text-xs text-[#ffd60a]">Jump over empty gaps and avoid red maintenance bots!</p><button onClick={()=>{if(phase==="intro")start();else setShowHelp(false);}} className="mt-5 w-full rounded-xl bg-[#ffc300] px-4 py-3 font-black text-[#000814]">{phase==="intro"?"START RESCUE →":"RESUME GAME →"}</button></div></div>}
        {phase==="won"&&<div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-4 text-center"><div className="max-w-md"><CheckCircle2 size={55} className="mx-auto text-[#ffd60a]"/><h3 className="mt-3 text-3xl font-black">OXYGEN RESTORED!</h3><p className="mt-3 text-sm text-slate-300">You recovered the power cells and restarted the oxygen generator. Oxygen generation systems use electricity to split water into oxygen and hydrogen.</p><button disabled={busy} onClick={onComplete} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE →"}</button></div></div>}
        {phase==="lost"&&<div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-4 text-center"><div><ShieldAlert size={51} className="mx-auto text-[#ff8c91]"/><h3 className="mt-3 text-3xl font-black">RESCUE FAILED</h3><p className="mt-2 text-sm text-slate-300">Out of time or suit repairs. Give it another shot!</p><button onClick={reset} className="mt-5 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw className="mr-2 inline" size={17}/>TRY AGAIN</button></div></div>}
      </div>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 sm:gap-4">
        <button {...hold("left")} disabled={!missionOn||busy||showHelp} className="grid h-14 w-16 touch-none place-items-center rounded-xl border border-[#4f7392] bg-[#001d3d] disabled:opacity-40"><ArrowLeft size={26}/></button>
        <button {...hold("right")} disabled={!missionOn||busy||showHelp} className="grid h-14 w-16 touch-none place-items-center rounded-xl border border-[#4f7392] bg-[#001d3d] disabled:opacity-40"><ArrowRight size={26}/></button>
        <button onClick={requestJump} disabled={!missionOn||busy||showHelp} className="h-14 flex-1 rounded-xl bg-[#ffc300] px-5 font-black text-[#000814] disabled:opacity-40 sm:max-w-44">↑ JUMP</button>
        <button onClick={requestActivate} disabled={!missionOn||busy||showHelp} className="h-14 flex-1 rounded-xl border border-[#ffd60a] bg-[#003566] px-3 text-sm font-black text-[#ffd60a] disabled:opacity-40 sm:max-w-48"><Zap size={16} className="mr-1 inline"/>RESTART (E)</button>
        <button onClick={reset} disabled={busy} title="Restart level" className="rounded-xl border border-[#496888] p-3 disabled:opacity-40"><RotateCcw size={19}/></button>
      </div>
    </main>
  </div>;
}
