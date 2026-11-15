"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, BatteryCharging, CheckCircle2, Clock3, HelpCircle, RotateCcw, Shield, X, Zap, Play, MapPin } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "playing" | "won" | "lost";
type V = { x:number; y:number };
type S = { phase:Phase; x:number; y:number; hp:number; time:number; carrying:number; done:boolean[]; collected:boolean[]; pulse:number; pulseFX:number; invuln:number; message:string; stamp:number };
const W=1000,H=550;
const stations = [
  {x:125,y:125,name:"OXYGEN",label:"01",color:"#76ddff"},
  {x:872,y:119,name:"HABITAT",label:"02",color:"#97f0ac"},
  {x:853,y:440,name:"EARTH LINK",label:"03",color:"#ffd60a"},
];
const batteries = [ {x:326,y:450}, {x:560,y:120}, {x:753,y:362} ];
const walls=[
  {x:270,y:92,w:34,h:250},{x:270,y:410,w:34,h:60},
  {x:460,y:0,w:34,h:135},{x:460,y:210,w:34,h:220},
  {x:670,y:92,w:34,h:235},{x:670,y:405,w:34,h:80},
];
const hazards=[ {x:360,y:295,axis:"y" as const,amp:115,speed:1.25}, {x:570,y:290,axis:"y" as const,amp:118,speed:1.55}, {x:765,y:260,axis:"x" as const,amp:65,speed:1.45} ];
const config = {
  safe:{time:155,hp:100,speed:230},risky:{time:130,hp:85,speed:232},dangerous:{time:112,hp:70,speed:235}
};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const distance=(a:V,b:V)=>Math.hypot(a.x-b.x,a.y-b.y);
const collides=(x:number,y:number,r=18)=>walls.some(w=>x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h);
const fresh=(t:number,hp:number):S=>({phase:"tutorial",x:93,y:447,hp,time:t,carrying:-1,done:[false,false,false],collected:[false,false,false],pulse:0,pulseFX:0,invuln:0,message:"COLLECT THE POWER CELLS. RESTART ALL THREE SYSTEMS!",stamp:0});

export default function BlackoutGridCommander({strategy="safe",onComplete,onClose,busy=false}:Props){
  const difficulty=config[strategy];
  const sim=useRef<S>(fresh(difficulty.time,difficulty.hp));
  const [view,setView]=useState<S>(()=>({...sim.current}));
  const [help,setHelp]=useState(false);
  const keys=useRef({left:false,right:false,up:false,down:false});
  const last=useRef(0);
  const paused=useRef(false);paused.current=help||busy;
  const sync=useCallback(()=>setView({...sim.current,done:[...sim.current.done],collected:[...sim.current.collected]}),[]);
  const reset=useCallback(()=>{sim.current=fresh(difficulty.time,difficulty.hp);keys.current={left:false,right:false,up:false,down:false};setHelp(false);sync();},[difficulty.hp,difficulty.time,sync]);
  const start=()=>{sim.current.phase="playing";sim.current.message="FIND A GLOWING BATTERY AND TAKE IT TO ITS MATCHING GENERATOR.";sync();};
  const pulse=useCallback(()=>{const g=sim.current;if(g.phase!=="playing"||paused.current||g.pulse>0)return;g.pulse=8;g.pulseFX=.65;g.message="ELECTRIC SHOCKWAVE! HAZARDS STUNNED FOR A MOMENT.";sync();},[sync]);
  const interact=useCallback(()=>{
    const g=sim.current;if(g.phase!=="playing"||paused.current)return;
    if(g.carrying<0){const i=batteries.findIndex((b,n)=>!g.collected[n]&&distance(g,b)<56);if(i>=0){g.carrying=i;g.collected[i]=true;g.message=`${stations[i].name} POWER CELL COLLECTED! FIND THE MATCHING GENERATOR.`;sync();}else{g.message="MOVE CLOSER TO A GLOWING BATTERY, THEN PRESS E.";sync();}}
    else {const target=stations[g.carrying];if(distance(g,target)<78){g.done[g.carrying]=true;g.message=`${target.name} ONLINE! ${g.done.filter(Boolean).length}/3 GENERATORS REPAIRED.`;g.carrying=-1;if(g.done.every(Boolean)){g.phase="won";g.message="THE MOON BASE HAS POWER AGAIN!";}sync();}else{g.message=`DELIVER THIS BATTERY TO THE ${target.name} GENERATOR.`;sync();}}
  },[sync]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowup","arrowdown"," ","w","a","s","d","e"].includes(k))e.preventDefault();
      if(k==="a"||k==="arrowleft")keys.current.left=true;if(k==="d"||k==="arrowright")keys.current.right=true;
      if(k==="w"||k==="arrowup")keys.current.up=true;if(k==="s"||k==="arrowdown")keys.current.down=true;
      if(k==="e"&&!e.repeat)interact();if(k===" "&&!e.repeat)pulse();};
    const up=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==="a"||k==="arrowleft")keys.current.left=false;if(k==="d"||k==="arrowright")keys.current.right=false;if(k==="w"||k==="arrowup")keys.current.up=false;if(k==="s"||k==="arrowdown")keys.current.down=false;};
    const blur=()=>{keys.current={left:false,right:false,up:false,down:false};};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[interact,pulse]);
  useEffect(()=>{let raf=0;let published=0;const tick=(now:number)=>{
    if(!last.current)last.current=now;const dt=Math.min((now-last.current)/1000,.045);last.current=now;
    const g=sim.current;
    if(g.phase==="playing"&&!paused.current){
      g.time=Math.max(0,g.time-dt);g.stamp+=dt;g.pulse=Math.max(0,g.pulse-dt);g.pulseFX=Math.max(0,g.pulseFX-dt);g.invuln=Math.max(0,g.invuln-dt);
      const vx=Number(keys.current.right)-Number(keys.current.left),vy=Number(keys.current.down)-Number(keys.current.up),m=Math.hypot(vx,vy)||1;
      const vel=difficulty.speed*(g.carrying>=0?.84:1);
      const nx=clamp(g.x+vx/m*vel*dt,28,W-28),ny=clamp(g.y+vy/m*vel*dt,28,H-28);
      if(!collides(nx,g.y))g.x=nx;if(!collides(g.x,ny))g.y=ny;
      if(g.pulseFX<=0&&g.invuln<=0){for(const h of hazards){const pos={x:h.x+(h.axis==="x"?Math.sin(g.stamp*h.speed)*h.amp:0),y:h.y+(h.axis==="y"?Math.sin(g.stamp*h.speed)*h.amp:0)};
        if(distance(g,pos)<39){g.hp=Math.max(0,g.hp-22);g.invuln=1.45;g.message="ELECTRIC SPARK! KEEP MOVING OR USE SPACE TO STUN THE HAZARDS.";if(g.hp===0)g.phase="lost";break;}}
      }
      if(g.time<=0){g.phase="lost";g.message="THE BACKUP POWER EXPIRED. TRY THE RESCUE AGAIN!";}
      if(now-published>48){sync();published=now;}
    }
    raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);last.current=0;};},[difficulty.speed,sync]);
  const time=`${String(Math.floor(view.time/60)).padStart(2,"0")}:${String(Math.floor(view.time%60)).padStart(2,"0")}`;
  const next=view.carrying>=0?stations[view.carrying]:null;
  const goal=view.done.filter(Boolean).length;
  const btn=(direction:keyof typeof keys.current, Icon:typeof ArrowLeft)=> <button type="button" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current[direction]=true;}} onPointerUp={()=>keys.current[direction]=false} onPointerCancel={()=>keys.current[direction]=false} onLostPointerCapture={()=>keys.current[direction]=false} className="grid h-12 w-12 touch-none place-items-center rounded-xl border border-[#457093] bg-[#082742] text-white active:bg-[#17517b]"><Icon size={22}/></button>;
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#284766] bg-[#001d3d] px-4 py-3">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Zap size={22}/></div><div><div className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 27 · EMERGENCY POWER</div><h2 className="text-lg font-black sm:text-2xl">BLACKOUT RUN</h2></div></div>
      <div className="flex items-center gap-3 text-xs font-bold"><span className="text-[#ffd60a]">{goal}/3 ONLINE</span><span className="flex items-center gap-1"><Shield size={15} className="text-[#9de6c2]"/> {Math.ceil(view.hp)}%</span><span className="flex items-center gap-1"><Clock3 size={15} className="text-[#ffd60a]"/>{time}</span><button aria-label="How to play" onClick={()=>setHelp(true)} className="rounded-lg border border-[#54718e] p-2"><HelpCircle size={17}/></button><button aria-label="Exit game" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div>
    </header>
    <main className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 pb-2 text-xs font-semibold"><span className="text-[#ffd60a]">{next?`DELIVER TO ${next.name}`:"COLLECT A POWER CELL · PRESS E"}</span><span className="text-[#83ddff]">SPACE = SHOCKWAVE {view.pulse>0?`(${Math.ceil(view.pulse)}s)` : "READY"}</span></div>
      <div className="relative mx-auto min-h-[230px] w-full max-w-5xl flex-1 overflow-hidden rounded-2xl border border-[#385575] bg-[#061529]">
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Top-down lunar base with three power generators and three batteries to collect">
          <defs><pattern id="floor27" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#294866" strokeWidth="1" opacity=".45"/></pattern><radialGradient id="glow27"><stop stopColor="#0d3556"/><stop offset="1" stopColor="#061529"/></radialGradient></defs>
          <rect width={W} height={H} fill="url(#glow27)"/><rect width={W} height={H} fill="url(#floor27)"/>
          <path d="M30 485 H960" stroke="#42688a" strokeWidth="4" strokeDasharray="12 18" opacity=".45"/>
          {walls.map((w,i)=><g key={i}><rect x={w.x} y={w.y} width={w.w} height={w.h} rx="7" fill="#2c4259" stroke="#7393b0" strokeWidth="3"/><path d={`M${w.x+8} ${w.y+15}v${Math.max(0,w.h-30)}`} stroke="#ffc300" strokeWidth="3" strokeDasharray="9 14" opacity=".65"/></g>)}
          {stations.map((s,i)=><g key={s.name} transform={`translate(${s.x} ${s.y})`}><circle r="54" fill={view.done[i]?"#6def9a14":"#ffc30009"} stroke={view.done[i]?"#70eba4":"#5f7e9c"} strokeDasharray={view.done[i]?"none":"9 7"} strokeWidth="4"/><rect x="-32" y="-30" width="64" height="60" rx="10" fill="#082846" stroke={view.done[i]?"#71f0ac":"#ffd60a"} strokeWidth="4"/><path d="M-8 -11h16v13H-8zM-12 7h24" fill="none" stroke={view.done[i]?"#71f0ac":"#ffd60a"} strokeWidth="4"/><text y="-70" textAnchor="middle" fill={s.color} fontSize="20" fontWeight="900">{s.name}</text><text y="87" textAnchor="middle" fill="#d0e4f4" fontSize="15" fontWeight="bold">{view.done[i]?"✓ POWER RESTORED":"GENERATOR"}</text></g>)}
          {batteries.map((b,i)=>!view.collected[i]&&<g key={i} transform={`translate(${b.x} ${b.y})`}><circle r="32" fill="#ffc30022" stroke="#ffc300" strokeWidth="2" strokeDasharray="4 5"/><rect x="-17" y="-20" width="34" height="40" rx="6" fill="#ffc300"/><rect x="-8" y="-25" width="16" height="5" fill="#fff4a1"/><path d="M2 -14L-8 2H1L-4 14L13 -5H3Z" fill="#001d3d"/><text textAnchor="middle" y="52" fill="#ffdc6a" fontSize="15" fontWeight="bold">CELL {i+1}</text></g>)}
          {hazards.map((h,i)=>{const x=h.x+(h.axis==="x"?Math.sin(view.stamp*h.speed)*h.amp:0),y=h.y+(h.axis==="y"?Math.sin(view.stamp*h.speed)*h.amp:0);return <g key={i} transform={`translate(${x} ${y})`} opacity={view.pulseFX>0?.3:1}><circle r="31" fill="#ff47652e" stroke="#ff7184" strokeWidth="3"/><path d="M0 -22L8 -7L23 -10L13 4L20 20L3 13L-8 23L-10 6L-24 0L-8 -9Z" fill="#ff5367"/><circle r="8" fill="#ffd9dc"/></g>})}
          {view.pulseFX>0&&<circle cx={view.x} cy={view.y} r={40+(1-view.pulseFX/.65)*105} fill="none" stroke="#8cecff" strokeWidth="10" opacity={view.pulseFX/.65}/>} 
          <g transform={`translate(${view.x} ${view.y})`} opacity={view.invuln>0&&Math.sin(view.stamp*22)>0?.42:1}><circle r="24" fill="#ffd60a26" stroke="#ffd60a" strokeWidth="3"/><rect x="-12" y="-10" width="24" height="27" rx="7" fill="#dbeaf3"/><ellipse cy="-16" rx="13" ry="12" fill="#ccefff" stroke="#ffffff" strokeWidth="3"/><rect x="-9" y="-21" width="18" height="11" rx="5" fill="#35749f"/>{view.carrying>=0&&<g transform="translate(23 -18)"><rect x="-9" y="-13" width="18" height="25" rx="4" fill="#ffc300"/><path d="M2 -9L-4 0H2L-2 8L8 -3H3Z" fill="#001d3d"/></g>}</g>
          {next&&<path d={`M${view.x} ${view.y}L${next.x} ${next.y}`} stroke="#ffd60a" strokeDasharray="8 12" strokeWidth="3" opacity=".5"/>}
        </svg>
        {view.phase==="tutorial"&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-4"><div className="max-w-md rounded-2xl border border-[#ffc30066] bg-[#001d3d] p-6 text-center shadow-2xl"><Zap size={43} className="mx-auto mb-3 text-[#ffc300]"/><h3 className="text-2xl font-black">THE MOON BASE IS DARK!</h3><p className="mt-2 text-sm leading-6 text-slate-200">Find <b className="text-[#ffd60a]">3 golden power cells</b> and deliver each to its matching generator. Dodge electric drones and use your shockwave to stun them!</p><div className="my-4 rounded-lg bg-[#082b4d] p-3 text-left text-xs leading-6 text-white">🎮 <b>WASD / ARROWS</b> — move<br/>🔋 <b>E</b> — pick up / install power cell<br/>⚡ <b>SPACE</b> — stun electric drones (8s cooldown)<br/>🏁 Repair all 3 generators before time runs out</div><button onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-3 font-black text-[#000814]"><Play size={18}/> START RESCUE</button></div></div>}
        {view.phase==="won"&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-5"><div className="max-w-md text-center"><CheckCircle2 size={60} className="mx-auto mb-3 text-[#ffc300]"/><h3 className="text-3xl font-black">POWER RESTORED!</h3><p className="mt-3 text-slate-200">All three generators are running. You saved the lunar outpost!</p><button disabled={busy} onClick={onComplete} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] p-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}<ArrowRight size={18}/></button></div></div>}
        {view.phase==="lost"&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ed] p-5"><div className="max-w-md text-center"><Zap size={52} className="mx-auto mb-3 text-[#ff6b82]"/><h3 className="text-3xl font-black">BASE POWER FAILED</h3><p className="mt-3 text-slate-200">You can do this! Use your shockwave to get past the electrical drones.</p><button onClick={reset} className="mt-6 flex items-center gap-2 rounded-xl bg-[#ffc300] px-8 py-4 font-black text-[#000814]"><RotateCcw size={18}/> RETRY MISSION</button></div></div>}
        {help&&<div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ef] p-4"><div className="w-full max-w-sm rounded-2xl border border-[#ffd60a] bg-[#001d3d] p-5"><h3 className="mb-3 text-xl font-black">HOW TO PLAY</h3><p className="text-sm leading-7">WASD / arrows — move<br/>E — pick up cells and install them at matching generators<br/>Space — shockwave to stun electric drones<br/>Deliver all three cells before time runs out!</p><button onClick={()=>setHelp(false)} className="mt-4 w-full rounded-lg bg-[#ffc300] p-3 font-black text-[#000814]">BACK TO GAME</button></div></div>}
      </div>
      <div className="mx-auto w-full max-w-5xl pt-2"><div className="min-h-5 text-center text-[11px] font-bold tracking-wide text-[#ffd60a]">{view.message}</div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><div className="grid gap-1"> <div className="flex justify-center">{btn("up",ArrowUp)}</div><div className="flex gap-1">{btn("left",ArrowLeft)}{btn("down",ArrowDown)}{btn("right",ArrowRight)}</div></div><span className="hidden text-xs text-slate-300 sm:block">MOVE</span></div><div className="flex gap-2"><button disabled={view.phase!=="playing"||busy} onClick={interact} className="flex h-14 items-center gap-2 rounded-xl bg-[#ffc300] px-4 font-black text-[#000814] disabled:opacity-50"><BatteryCharging size={19}/> E · {view.carrying>=0?"INSTALL":"PICK UP"}</button><button disabled={view.phase!=="playing"||view.pulse>0||busy} onClick={pulse} className="flex h-14 items-center gap-2 rounded-xl border border-[#70d8fa] bg-[#003566] px-4 font-black text-white disabled:opacity-50"><Zap size={18}/> {view.pulse>0?`${Math.ceil(view.pulse)}s`:"SPACE · PULSE"}</button></div><button onClick={reset} disabled={busy} className="flex items-center gap-1 text-xs font-bold text-[#ffd60a]"><RotateCcw size={15}/> RESTART</button></div><div className="mt-2 flex gap-2">{stations.map((s,i)=><div key={s.name} className={`flex-1 rounded-md border px-2 py-1 text-center text-[10px] font-black ${view.done[i]?"border-[#67e9a1] bg-[#103a31] text-[#81f3b0]":"border-[#375777] bg-[#08213a] text-[#8da9bf]"}`}>{s.name} {view.done[i]?"✓":"○"}</div>)}</div></div>
    </main>
  </div>;
}
