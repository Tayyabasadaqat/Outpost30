"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, RotateCcw, Sparkles, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; busy?: boolean; onComplete: () => void; onClose: () => void };
type Mode = "ready" | "play" | "win" | "lose";
type Particle = { x: number; y: number; zone: number; size: number; tough: boolean; alive: boolean; jitter: number };
type World = { mode: Mode; elapsed: number; time: number; battery: number; seals: number; pulse: number; cleared: number; particles: Particle[]; x: number; y: number; vacuum: boolean; plume: number; damageCooldown: number; wave: number; feedback: string; feedbackTime: number };
const W = 960, H = 550;
const ZONES = [
  { x: 85, y: 135, w: 345, h: 144, title: "SOLAR PANEL", note: "Dust blocks sunlight" },
  { x: 530, y: 135, w: 345, h: 144, title: "HABITAT SEAL", note: "Dust wears down seals" },
  { x: 85, y: 330, w: 345, h: 144, title: "ROVER CAMERA", note: "Dust obscures cameras" },
  { x: 530, y: 330, w: 345, h: 144, title: "RADIATOR", note: "Dust affects heat control" },
];
const CFG: Record<Strategy, { time: number; battery: number; seals: number; total: number; gust: number }> = {
  safe: { time: 105, battery: 100, seals: 100, total: 64, gust: 0.055 },
  risky: { time: 95, battery: 90, seals: 85, total: 76, gust: 0.085 },
  dangerous: { time: 85, battery: 85, seals: 75, total: 88, gust: 0.12 },
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
function generate(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const z = ZONES[i % 4];
    return { x: rand(z.x + 16, z.x + z.w - 16), y: rand(z.y + 27, z.y + z.h - 14), zone: i % 4, size: rand(4, 10), tough: i % 7 === 0, alive: true, jitter: rand(0, Math.PI * 2) };
  });
}
function create(strategy: Strategy): World {
  const c = CFG[strategy];
  return { mode: "ready", elapsed: 0, time: c.time, battery: c.battery, seals: c.seals, pulse: 100, cleared: 0, particles: generate(c.total), x: 480, y: 300, vacuum: false, plume: 0, damageCooldown: 0, wave: 0, feedback: "", feedbackTime: 0 };
}
function rounded(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  g.fillStyle = fill; g.beginPath(); g.roundRect(x,y,w,h,r); g.fill();
}
function draw(g: CanvasRenderingContext2D, s: World, time: number) {
  const bg = g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#030d1c"); bg.addColorStop(1,"#0b2845"); g.fillStyle = bg; g.fillRect(0,0,W,H);
  for(let i=0;i<85;i++){ const x=(i*197.4+23)%W,y=(i*79.1+12)%110; g.fillStyle=i%3?"#6387a9":"#d4e6ff"; g.fillRect(x,y,1.5,1.5); }
  g.fillStyle="#ffc300";g.font="bold 14px system-ui";g.fillText("MAINTENANCE BAY  •  LUNAR SURFACE",37,49);
  g.fillStyle="#96b7d3";g.font="12px system-ui";g.fillText("REMOVE DUST FROM FOUR CRITICAL SYSTEMS",37,70);
  ZONES.forEach((z,i)=>{
    rounded(g,z.x-7,z.y-8,z.w+14,z.h+16,17,"#102e49");rounded(g,z.x,z.y,z.w,z.h,11,"#07182c");
    g.strokeStyle="#3c6384";g.lineWidth=2;g.strokeRect(z.x+5,z.y+5,z.w-10,z.h-10);
    if(i===0){ for(let a=0;a<5;a++) for(let b=0;b<2;b++)rounded(g,z.x+13+a*64,z.y+37+b*42,57,36,3,"#164b82"); }
    if(i===1){g.strokeStyle="#708ba7";g.lineWidth=15;g.beginPath();g.ellipse(z.x+z.w/2,z.y+85,110,40,0,0,Math.PI*2);g.stroke();g.strokeStyle="#0bd7c8";g.lineWidth=2;g.stroke();}
    if(i===2){rounded(g,z.x+64,z.y+35,z.w-128,85,12,"#31516b");g.beginPath();g.arc(z.x+z.w/2,z.y+78,37,0,Math.PI*2);g.fillStyle="#06213d";g.fill();g.strokeStyle="#7bb4e4";g.lineWidth=7;g.stroke();}
    if(i===3){for(let a=0;a<9;a++)rounded(g,z.x+24+a*34,z.y+33,19,90,4,"#3e627b");}
    const remaining=s.particles.filter(p=>p.zone===i&&p.alive).length;
    const total=s.particles.filter(p=>p.zone===i).length;
    const pct=total?Math.round(100*(total-remaining)/total):100;
    rounded(g,z.x+9,z.y+8,190,25,5,"#000814dd");g.font="bold 12px system-ui";g.fillStyle=pct===100?"#72f0a9":"#e7f0fc";g.fillText(z.title+"  "+pct+"%",z.x+16,z.y+25);
    if(pct===100){g.font="bold 19px system-ui";g.fillStyle="#72f0a9";g.fillText("✓ CLEAN",z.x+z.w-112,z.y+28);}
  });
  s.particles.forEach(p=>{if(!p.alive)return;const wobble=Math.sin(time*1.4+p.jitter)*1.3;g.beginPath();g.ellipse(p.x+wobble,p.y,p.size*1.1,p.size*.68,p.jitter,0,Math.PI*2);g.fillStyle=p.tough?"#e3ba66":"#ac9580";g.globalAlpha=.84;g.fill();g.globalAlpha=1;if(p.tough){g.strokeStyle="#f9e0ab";g.lineWidth=1.2;g.stroke();}});
  // Orange vent warning: damaging seals if suction stays over a fragile fitting.
  const vents = [{x:420,y:262},{x:539,y:457}];
  vents.forEach((v,i)=>{const hot=Math.sin(time*2.4+i*3)>.1;g.beginPath();g.arc(v.x,v.y,19,0,Math.PI*2);g.fillStyle=hot?"#e15f3b":"#744e48";g.fill();g.strokeStyle="#ffca97";g.lineWidth=2;g.stroke();g.fillStyle="#fff2d5";g.font="bold 11px system-ui";g.fillText("!",v.x-3,v.y+4);});
  if(s.vacuum&&s.mode==="play"){
    const r=46;const gr=g.createRadialGradient(s.x,s.y,7,s.x,s.y,r);gr.addColorStop(0,"#68e8ff30");gr.addColorStop(1,"#68e8ff00");g.fillStyle=gr;g.beginPath();g.arc(s.x,s.y,r,0,Math.PI*2);g.fill();
    g.strokeStyle="#5ad9ee";g.lineWidth=2;g.setLineDash([7,6]);g.beginPath();g.arc(s.x,s.y,r,0,Math.PI*2);g.stroke();g.setLineDash([]);
  }
  // Cleaning wand follows pointer, with bright animated nozzle.
  g.save();g.translate(s.x,s.y);g.rotate(-Math.PI/5);rounded(g,-11,-12,22,54,5,"#ffc300");rounded(g,-15,-20,30,19,6,"#567c9c");g.fillStyle="#dbf9ff";g.beginPath();g.arc(0,-22,9,0,Math.PI*2);g.fill();g.shadowBlur=17;g.shadowColor="#65e8ff";g.fillStyle="#6ae8ff";g.beginPath();g.arc(0,-22,5,0,Math.PI*2);g.fill();g.restore();
  if(s.plume>0){g.strokeStyle=`rgba(255,214,10,${Math.min(1,s.plume)})`;g.lineWidth=5;g.beginPath();g.arc(s.x,s.y,75*(1-s.plume/2),0,Math.PI*2);g.stroke();}
  if(s.feedbackTime>0){rounded(g,330,90,300,36,9,"#001d3ddd");g.fillStyle="#ffd60a";g.font="bold 15px system-ui";g.textAlign="center";g.fillText(s.feedback,480,113);g.textAlign="left";}
  rounded(g,9,519,942,23,8,"#001327");g.fillStyle="#a9c5d9";g.font="12px system-ui";g.fillText("DRAG TO AIM  •  HOLD CLICK / SPACE TO VACUUM  •  PRESS E TO BLAST STUBBORN DUST",24,535);
}
export default function LunarDustBusters({strategy="safe",busy=false,onComplete,onClose}:Props){
  const canvas=useRef<HTMLCanvasElement|null>(null);
  const world=useRef<World>(create(strategy));
  const controls=useRef({pointer:false,space:false});
  const [hud,setHud]=useState(()=>({mode:"ready" as Mode,time:CFG[strategy].time,battery:CFG[strategy].battery,seals:CFG[strategy].seals,pulse:100,cleared:0,total:CFG[strategy].total}));
  const [help,setHelp]=useState(false);
  const [tick,setTick]=useState(0);
  const reset=useCallback(()=>{const s=create(strategy);world.current=s;controls.current={pointer:false,space:false};setHud({mode:s.mode,time:s.time,battery:s.battery,seals:s.seals,pulse:s.pulse,cleared:0,total:s.particles.length});setTick(t=>t+1);},[strategy]);
  const start=()=>{if(world.current.mode==="ready"){world.current.mode="play";setHud(h=>({...h,mode:"play"}));}};
  const blast=useCallback(()=>{const s=world.current;if(s.mode!=="play"||s.pulse<70||busy)return;s.pulse=0;s.plume=1;let n=0;s.particles.forEach(p=>{if(p.alive&&Math.hypot(p.x-s.x,p.y-s.y)<90){p.alive=false;n++;}});s.cleared+=n;s.feedback=n?`BURST! +${n} DUST CLEARED`:"NO DUST IN RANGE";s.feedbackTime=1.1;},[busy]);
  useEffect(()=>{const keydown=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if([" ","e","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();if(k===" "&&!e.repeat)controls.current.space=true;if(k==="e"&&!e.repeat)blast();};const keyup=(e:KeyboardEvent)=>{if(e.key===" ")controls.current.space=false;};window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);return()=>{window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);};},[blast]);
  useEffect(()=>{let id=0,prev=0,ui=0;const ctx=canvas.current?.getContext("2d");if(!ctx)return;const loop=(now:number)=>{if(!prev)prev=now;const dt=Math.min((now-prev)/1000,.05);prev=now;const s=world.current;const active=s.mode==="play"&&!busy;const vacuum=controls.current.pointer||controls.current.space;s.vacuum=active&&vacuum&&s.battery>2;if(active){s.elapsed+=dt;s.time=Math.max(0,s.time-dt);s.pulse=Math.min(100,s.pulse+dt*15);s.feedbackTime=Math.max(0,s.feedbackTime-dt);s.plume=Math.max(0,s.plume-dt*1.9);s.damageCooldown=Math.max(0,s.damageCooldown-dt);if(s.vacuum){s.battery=Math.max(0,s.battery-dt*4.4);let cleaned=0;s.particles.forEach(p=>{if(!p.alive)return;const dist=Math.hypot(p.x-s.x,p.y-s.y);if(dist<40&&(!p.tough||Math.random()<dt*3.5)){p.alive=false;cleaned++;}});s.cleared+=cleaned;
      // Vacuuming dangerous connectors causes wear, teaching careful maintenance.
      const nearVent=[{x:420,y:262},{x:539,y:457}].some(v=>Math.hypot(s.x-v.x,s.y-v.y)<24);
      if(nearVent&&s.damageCooldown<=0){s.seals=Math.max(0,s.seals-12);s.damageCooldown=.6;s.feedback="CAREFUL! FRAGILE CONNECTOR";s.feedbackTime=.9;}
    }else{s.battery=Math.min(100,s.battery+dt*8.5);}
    // Gusts bring a little new abrasive dust: quick sweeping matters.
    s.wave+=dt;if(s.wave>8){s.wave=0;const alive=s.particles.filter(p=>p.alive).length;if(alive>6&&Math.random()<CFG[strategy].gust*5){const z=Math.floor(Math.random()*4);const area=ZONES[z];s.particles.push({x:rand(area.x+16,area.x+area.w-16),y:rand(area.y+33,area.y+area.h-12),zone:z,size:rand(4,8),tough:false,alive:true,jitter:rand(0,6)});}}
    if(s.particles.every(p=>!p.alive)){s.mode="win";s.feedback="ALL SYSTEMS CLEAN";}
    else if(s.time<=0||s.seals<=0){s.mode="lose";}
  }
  draw(ctx,s,now/1000);
  if(now-ui>110){ui=now;setHud({mode:s.mode,time:s.time,battery:s.battery,seals:s.seals,pulse:s.pulse,cleared:s.cleared,total:s.particles.length});}
  id=requestAnimationFrame(loop);};id=requestAnimationFrame(loop);return()=>cancelAnimationFrame(id);},[strategy,busy,tick]);
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();world.current.x=clamp((e.clientX-r.left)/r.width*W,16,W-16);world.current.y=clamp((e.clientY-r.top)/r.height*H,16,H-20);};
  const pct=Math.round(hud.cleared/hud.total*100);
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#000814] text-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#274461] bg-[#001d3d] px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#ffc300] p-3 text-[#000814]"><Sparkles size={22}/></div><div><div className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 09 · LUNAR DUST EMERGENCY</div><h2 className="text-lg font-black sm:text-2xl">DUST BUSTERS</h2></div></div><div className="flex items-center gap-2"><span className="rounded-lg border border-[#355a7b] px-3 py-2 text-xs font-black text-[#ffd60a]">{Math.ceil(hud.time)}s</span><button onClick={()=>setHelp(true)} aria-label="Help" className="rounded-lg border border-[#355a7b] p-2"><HelpCircle size={18}/></button><button onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div></header>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-4 sm:px-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:"DUST REMOVED",value:`${pct}%`,color:"#ffd60a"},{label:"FILTER POWER",value:`${Math.ceil(hud.battery)}%`,color:"#6fe1ff"},{label:"SEAL SAFETY",value:`${Math.ceil(hud.seals)}%`,color:hud.seals<35?"#fb7185":"#75f0af"},{label:"UV BLAST",value:`${Math.floor(hud.pulse)}%`,color:"#ffce60"}].map(p=><div key={p.label} className="rounded-xl border border-[#244969] bg-[#001d3d] px-3 py-3"><div className="text-[10px] font-bold tracking-wide text-[#a4c0d8]">{p.label}</div><div className="mt-1 text-xl font-black" style={{color:p.color}}>{p.value}</div></div>)}</div>
      <div className="relative overflow-hidden rounded-2xl border border-[#345775] bg-[#041629] shadow-[0_14px_45px_#0008]"><canvas ref={canvas} width={W} height={H} className="block aspect-[960/550] w-full touch-none cursor-crosshair" onPointerMove={move} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);controls.current.pointer=true;}} onPointerUp={()=>controls.current.pointer=false} onPointerCancel={()=>controls.current.pointer=false} onLostPointerCapture={()=>controls.current.pointer=false}/>
      {hud.mode!=="play"&&<div className="absolute inset-0 z-10 grid place-items-center bg-[#000814d9] p-4 text-center"><div className="max-w-sm"><div className="mb-3 text-4xl">{hud.mode==="win"?"🌟":hud.mode==="lose"?"⚠️":"🧹"}</div><h3 className="text-2xl font-black sm:text-3xl">{hud.mode==="win"?"BASE SAVED!":hud.mode==="lose"?"DUST TOOK OVER!":"DUST EMERGENCY!"}</h3><p className="mt-3 text-sm leading-6 text-[#b9d0e5]">{hud.mode==="win"?"All four critical systems are clean. The crew can safely continue operations.":hud.mode==="lose"?"Your time ran out or the delicate seals were damaged. Give it another go!":"Drag your cleaning wand over dusty equipment. Hold to vacuum, then use a powerful blast for stubborn dust. Avoid the orange warning connectors!"}</p>{hud.mode==="win"?<button disabled={busy} onClick={onComplete} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50"><CheckCircle2 size={18}/>{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button>:hud.mode==="lose"?<button onClick={reset} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">RETRY MISSION</button>:<button onClick={start} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">START CLEANUP</button>}</div></div>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold text-[#afc9dc]">DRAG + HOLD TO VACUUM • <span className="text-[#ffd60a]">E</span> OR BUTTON TO BLAST • AVOID ORANGE CONNECTORS</p><div className="flex items-center gap-2"><button disabled={hud.mode!=="play"||hud.pulse<70||busy} onClick={blast} className="flex items-center gap-2 rounded-xl bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814] disabled:opacity-40"><Zap size={18}/> UV BLAST</button><button onClick={reset} disabled={busy} aria-label="Restart" className="rounded-xl border border-[#355775] p-3 text-[#ffd60a]"><RotateCcw size={19}/></button></div></div>
      <p className="text-xs leading-5 text-[#89abc9]">SCIENCE: Lunar dust is sharp and abrasive. It can affect seals, optics and thermal equipment. Real astronauts use careful dust-control procedures; this cleaning wand is an arcade simplification.</p>
    </main>
    {help&&<div className="fixed inset-0 z-[90] grid place-items-center bg-[#000814e8] p-4"><div className="w-full max-w-sm rounded-2xl border border-[#ffd60a66] bg-[#001d3d] p-6"><div className="flex items-center justify-between"><h3 className="text-xl font-black">HOW TO PLAY</h3><button onClick={()=>setHelp(false)} aria-label="Close help"><X/></button></div><p className="mt-4 text-sm leading-7 text-[#c5daeb]">1. Move the cursor over dusty equipment.<br/>2. Hold mouse, touch, or SPACE to vacuum.<br/>3. Press E or UV BLAST to remove big dust clusters.<br/>4. Stay away from orange connectors to protect seals.<br/>5. Clean every speck before the timer ends.</p><button onClick={()=>setHelp(false)} className="mt-5 w-full rounded-xl bg-[#ffc300] py-3 font-black text-[#000814]">GOT IT!</button></div></div>}
  </div>;
}
