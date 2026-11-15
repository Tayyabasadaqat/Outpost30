"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, CheckCircle2, CircleHelp, RotateCcw, Truck, X } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Cargo = { id: number; label: string; short: string; color: string; x: number; y: number; bayX: number; bayY: number };
type World = { x: number; y: number; heading: number; held: number | null; delivered: number[]; integrity: number; seconds: number; hits: number; phase: "playing" | "won" | "lost"; invincible: number; pulse: number; sparks: { x: number; y: number; life: number }[] };
const W = 960, H = 560;
const CARGO: Cargo[] = [
  { id: 0, label: "OXYGEN", short: "O₂", color: "#77dfff", x: 180, y: 115, bayX: 810, bayY: 128 },
  { id: 1, label: "WATER", short: "H₂O", color: "#8aa8ff", x: 690, y: 420, bayX: 810, bayY: 285 },
  { id: 2, label: "FOOD", short: "FOOD", color: "#ffc300", x: 175, y: 418, bayX: 810, bayY: 442 },
];
const ROCKS = [ [290,170,35],[380,285,46],[535,150,39],[610,352,42],[270,355,34],[468,455,30] ] as const;
const PARAMS = {
  safe: { seconds: 150, integrity: 100, speed: 215, drones: 2 },
  risky: { seconds: 123, integrity: 85, speed: 235, drones: 3 },
  dangerous: { seconds: 105, integrity: 70, speed: 245, drones: 4 },
};
const distance = (x: number,y: number,a: number,b: number) => Math.hypot(x-a,y-b);
const clamp = (x: number,min: number,max: number) => Math.min(max,Math.max(min,x));
const fresh = (s: Strategy): World => ({ x: 80,y: 275, heading: 0, held: null,delivered:[],integrity:PARAMS[s].integrity, seconds:PARAMS[s].seconds,hits:0,phase:"playing",invincible:0,pulse:0,sparks:[] });
const rounded = (g: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string) => {g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}};

function draw(g: CanvasRenderingContext2D, world: World, t: number, strategy: Strategy) {
  g.clearRect(0,0,W,H);
  g.fillStyle="#091629";g.fillRect(0,0,W,H);
  // lunar surface speckles: deterministic; no random changes during redraw
  for(let i=0;i<195;i++){const x=(i*137.49+40)%W,y=(i*83.23+17)%H;g.fillStyle=i%4===0?"#41556c":"#24394f";g.beginPath();g.arc(x,y,i%7===0?2:1,0,Math.PI*2);g.fill();}
  g.strokeStyle="#22394f";g.lineWidth=1;
  for(let x=0;x<W;x+=80){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
  for(let y=0;y<H;y+=80){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  // base / bays
  rounded(g,740,40,194,480,16,"#0d2640","#466689");
  g.fillStyle="#b9cfe7";g.font="bold 13px system-ui";g.textAlign="center";g.fillText("OUTPOST STORAGE",837,68);
  CARGO.forEach(c=>{
    const done=world.delivered.includes(c.id);
    const glow=done?"#7be7b4":c.color;
    rounded(g,c.bayX-64,c.bayY-44,128,88,12,done?"#145043":"#112e4a",glow);
    g.strokeStyle=glow;g.setLineDash([5,5]);g.strokeRect(c.bayX-45,c.bayY-24,90,48);g.setLineDash([]);
    g.fillStyle=glow;g.font="900 22px system-ui";g.textAlign="center";g.fillText(done?"✓":c.short,c.bayX,c.bayY+8);
    g.font="bold 10px system-ui";g.fillText(done?"DELIVERED":c.label,c.bayX,c.bayY+29);
  });
  // home beacon
  rounded(g,28,225,107,100,13,"#092944","#ffc300");g.fillStyle="#ffd60a";g.textAlign="center";g.font="bold 12px system-ui";g.fillText("DEPOT",82,250);g.font="28px system-ui";g.fillText("◆",82,286);
  // collectible cargo and pulse
  CARGO.forEach(c=>{
    if(world.delivered.includes(c.id)||world.held===c.id)return;
    const bob=Math.sin(t*3+c.id)*5;
    g.save();g.translate(c.x,c.y+bob);g.shadowColor=c.color;g.shadowBlur=20;rounded(g,-22,-23,44,46,7,"#1c3550",c.color);g.shadowBlur=0;g.fillStyle=c.color;g.textAlign="center";g.font="bold 15px system-ui";g.fillText(c.short,0,6);g.restore();
    g.fillStyle="#deebf8";g.textAlign="center";g.font="bold 10px system-ui";g.fillText(c.label,c.x,c.y-39);
  });
  // obstacle rocks
  ROCKS.forEach(([x,y,r],i)=>{g.fillStyle=i%2?"#58677a":"#48596d";g.strokeStyle="#91a2b3";g.lineWidth=2;g.beginPath();for(let n=0;n<9;n++){let a=(n/9)*Math.PI*2;let rr=r*(.84+.15*Math.sin(n*9+i));let px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(n===0)g.moveTo(px,py);else g.lineTo(px,py);}g.closePath();g.fill();g.stroke();g.fillStyle="#273c50";g.beginPath();g.arc(x-9,y-6,r*.28,0,Math.PI*2);g.fill();});
  // moving hazard drones
  for(let i=0;i<PARAMS[strategy].drones;i++){
    const dx=430+Math.cos(t*(.45+i*.1)+i*2.8)*145;
    const dy=285+Math.sin(t*(.65+i*.1)+i*3.1)*170;
    g.save();g.translate(dx,dy);g.rotate(t*2+i);g.shadowColor="#ff6476";g.shadowBlur=18;rounded(g,-13,-13,26,26,5,"#651c37","#ff8192");g.fillStyle="#ffbbc4";g.fillRect(-4,-4,8,8);g.restore();
  }
  if(world.held!==null){const c=CARGO[world.held];g.strokeStyle=c.color;g.lineWidth=3;g.beginPath();g.moveTo(world.x,world.y-15);g.lineTo(world.x,world.y-46);g.stroke();rounded(g,world.x-17,world.y-75,34,30,5,"#12385a",c.color);g.fillStyle=c.color;g.textAlign="center";g.font="bold 12px system-ui";g.fillText(c.short,world.x,world.y-56);}
  // rover (rotates toward direction)
  g.save();g.translate(world.x,world.y);g.rotate(world.heading);
  g.globalAlpha=world.invincible>0&&Math.floor(t*10)%2===0?.45:1;
  g.shadowColor="#ffd60a";g.shadowBlur=13;
  rounded(g,-21,-23,42,46,8,"#e6edf4","#ffd60a");g.shadowBlur=0;
  rounded(g,-15,-15,30,24,5,"#12466a","#6ebfef");
  g.fillStyle="#ffc300";g.beginPath();g.moveTo(0,-29);g.lineTo(-8,-17);g.lineTo(8,-17);g.closePath();g.fill();
  for(let a of [-1,1])for(let b of [-1,1])rounded(g,a*20-6,b*14-9,12,18,4,"#111925","#647b92");
  g.restore();
  // pulse ring on interaction
  if(world.pulse>0){g.strokeStyle=`rgba(255,214,10,${world.pulse})`;g.lineWidth=3;g.beginPath();g.arc(world.x,world.y,48*(1-world.pulse)+24,0,Math.PI*2);g.stroke();}
  for(const p of world.sparks){g.globalAlpha=clamp(p.life,0,1);g.fillStyle="#ffd60a";g.fillRect(p.x,p.y,3,3);}g.globalAlpha=1;
  // edge walls
  g.strokeStyle="#49627c";g.lineWidth=7;g.strokeRect(4,4,W-8,H-8);
}

export default function CargoDelivery({strategy="safe",onComplete,onClose,busy=false}:Props){
  const canvas=useRef<HTMLCanvasElement>(null);
  const world=useRef<World>(fresh(strategy));
  const key=useRef(new Set<string>());
  const [display,setDisplay]=useState({seconds:PARAMS[strategy].seconds,integrity:PARAMS[strategy].integrity, delivered:0,held:null as number|null,phase:"playing" as World["phase"],hits:0});
  const [hint,setHint]=useState(false);
  const [message,setMessage]=useState("COLLECT SUPPLIES. DELIVER TO MATCHING BAYS.");
  const reset=useCallback(()=>{world.current=fresh(strategy);key.current.clear();setDisplay({seconds:PARAMS[strategy].seconds,integrity:PARAMS[strategy].integrity,delivered:0,held:null,phase:"playing",hits:0});setMessage("COLLECT SUPPLIES. DELIVER TO MATCHING BAYS.");},[strategy]);
  const interact=useCallback(()=>{const w=world.current;if(w.phase!=="playing"||busy)return;
    w.pulse=1;
    if(w.held!==null){const c=CARGO[w.held];if(distance(w.x,w.y,c.bayX,c.bayY)<90){w.delivered.push(c.id);w.held=null;setMessage(`${c.label} SECURED! ${w.delivered.length}/3 DELIVERED`);if(w.delivered.length===3){w.phase="won";setMessage("ALL SUPPLIES DELIVERED!");}}else{setMessage(`WRONG BAY. FOLLOW THE ${c.label} MARKER.`);}}
    else {const c=CARGO.find(c=>!w.delivered.includes(c.id)&&distance(w.x,w.y,c.x,c.y)<64);if(c){w.held=c.id;setMessage(`${c.label} LOADED — DRIVE TO ITS BAY!`);}else{setMessage("GET CLOSE TO A CRATE, THEN PRESS SPACE.");}}
    setDisplay({seconds:Math.ceil(w.seconds),integrity:Math.max(0,Math.round(w.integrity)),delivered:w.delivered.length,held:w.held,phase:w.phase,hits:w.hits});
  },[busy]);
  useEffect(()=>{function down(e:KeyboardEvent){const k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","e"].includes(k)){e.preventDefault();key.current.add(k);}if((k===" "||k==="e")&&!e.repeat)interact();}function up(e:KeyboardEvent){key.current.delete(e.key.toLowerCase());}function blur(){key.current.clear();}window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};},[interact]);
  useEffect(()=>{const ctx=canvas.current?.getContext("2d");if(!ctx)return;let raf=0,last=0,ui=0,clock=0;const tick=(now:number)=>{if(!last)last=now;const dt=Math.min((now-last)/1000,.05);last=now;clock+=dt;const w=world.current;
    if(w.phase==="playing"&&!busy){w.seconds=Math.max(0,w.seconds-dt);if(w.seconds===0){w.phase="lost";setMessage("TIME UP. THE CREW NEEDS THOSE SUPPLIES!");}
      const k=key.current;let dx=Number(k.has("d")||k.has("arrowright"))-Number(k.has("a")||k.has("arrowleft"));let dy=Number(k.has("s")||k.has("arrowdown"))-Number(k.has("w")||k.has("arrowup"));const mag=Math.hypot(dx,dy);
      if(mag>0){dx/=mag;dy/=mag;w.heading=Math.atan2(dx,-dy);const speed=PARAMS[strategy].speed*(w.held===null?1:.83);let nx=clamp(w.x+dx*speed*dt,30,W-30),ny=clamp(w.y+dy*speed*dt,30,H-30);
        const blocked=(x:number,y:number)=>ROCKS.some(([rx,ry,r])=>distance(x,y,rx,ry)<r+25)|| (x>730&&y<82);
        if(!blocked(nx,w.y))w.x=nx;if(!blocked(w.x,ny))w.y=ny;
      }
      w.invincible=Math.max(0,w.invincible-dt);w.pulse=Math.max(0,w.pulse-dt*2);
      for(let i=0;i<PARAMS[strategy].drones;i++){const hx=430+Math.cos(clock*(.45+i*.1)+i*2.8)*145,hy=285+Math.sin(clock*(.65+i*.1)+i*3.1)*170;
        if(w.invincible<=0&&distance(w.x,w.y,hx,hy)<37){w.integrity=Math.max(0,w.integrity-24);w.hits++;w.invincible=1.5;w.sparks=Array.from({length:12},(_,n)=>({x:w.x+Math.cos(n)*23,y:w.y+Math.sin(n)*23,life:1}));setMessage("HAZARD HIT! DRIVE AROUND THE RED DRONES.");if(w.integrity===0){w.phase="lost";setMessage("HAULER DAMAGED. RETRY THE DELIVERY!");}}}
      w.sparks=w.sparks.filter(s=>(s.life-=dt*1.8)>0);
    }
    draw(ctx,w,clock,strategy);
    if(now-ui>140){setDisplay({seconds:Math.ceil(w.seconds),integrity:Math.max(0,Math.round(w.integrity)),delivered:w.delivered.length,held:w.held,phase:w.phase,hits:w.hits});ui=now;}
    raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[strategy,busy]);
  function hold(k:string,down:boolean){if(down)key.current.add(k);else key.current.delete(k);}
  const handlePointer=(k:string)=>(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold(k,true);};
  return <div className="fixed inset-0 z-[70] flex flex-col bg-[#000814] text-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#305071] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-[#ffc300] p-2 text-[#000814]"><Truck size={24}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 07 · LUNAR LOGISTICS</p><h2 className="text-lg font-black sm:text-2xl">CARGO RUSH</h2></div></div>
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold"><span className="text-[#ffd60a]">DELIVERED {display.delivered}/3</span><span className="rounded-lg bg-[#07172d] px-3 py-2">⏱ {Math.floor(display.seconds/60)}:{String(display.seconds%60).padStart(2,"0")}</span><button onClick={()=>setHint(v=>!v)} className="rounded-lg border border-[#4e6885] p-2" aria-label="How to play"><CircleHelp size={19}/></button><button onClick={onClose} disabled={busy} aria-label="Close game"><X size={21}/></button></div>
    </header>
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 text-xs font-bold"><span className="text-[#ffd60a]">{message}</span><span className="whitespace-nowrap">HAULER <span className={display.integrity<35?"text-red-300":"text-emerald-300"}>{display.integrity}%</span></span></div>
      <div className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-[#325174] bg-[#091629]">
        <canvas ref={canvas} width={W} height={H} className="h-full w-full object-contain" aria-label="Top-down lunar cargo driving game"/>
        {hint&&<div className="absolute left-3 top-3 max-w-xs rounded-xl border border-[#ffc300] bg-[#001d3d]/95 p-4 text-sm shadow-xl"><b className="text-[#ffd60a]">HOW TO PLAY</b><p className="mt-2 leading-6">Drive with WASD or arrows. Get close to a crate and press <b>SPACE</b> to load it. Drive into the matching labeled bay and press <b>SPACE</b> again. Avoid red drones.</p><button className="mt-3 rounded-lg bg-[#ffc300] px-3 py-2 font-bold text-[#000814]" onClick={()=>setHint(false)}>GOT IT!</button></div>}
        {display.phase!=="playing"&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814]/90 p-5"><div className="max-w-md text-center">{display.phase==="won"?<CheckCircle2 size={48} className="mx-auto text-[#ffd60a]"/>:<Box size={48} className="mx-auto text-red-300"/>}<h3 className="mt-3 text-3xl font-black">{display.phase==="won"?"SUPPLIES SECURED!":"DELIVERY FAILED"}</h3><p className="mt-3 text-sm text-slate-300">{display.phase==="won"?`All cargo delivered with ${display.integrity}% hauler integrity remaining.`:"Repair the hauler and deliver the supplies before time runs out."}</p><button disabled={busy} onClick={display.phase==="won"?onComplete:reset} className="mt-6 rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-40">{display.phase==="won"?(busy?"SAVING...":"MISSION COMPLETE · CONTINUE"):"RETRY MISSION"}</button></div></div>}
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex touch-none select-none items-center gap-1"><button aria-label="Left" onPointerDown={handlePointer("a")} onPointerUp={()=>hold("a",false)} onPointerCancel={()=>hold("a",false)} onLostPointerCapture={()=>hold("a",false)} className="rounded-lg border border-[#365a7c] bg-[#001d3d] p-3"><ArrowLeft/></button><div className="flex flex-col gap-1"><button aria-label="Up" onPointerDown={handlePointer("w")} onPointerUp={()=>hold("w",false)} onPointerCancel={()=>hold("w",false)} onLostPointerCapture={()=>hold("w",false)} className="rounded-lg border border-[#365a7c] bg-[#001d3d] p-2"><ArrowUp size={17}/></button><button aria-label="Down" onPointerDown={handlePointer("s")} onPointerUp={()=>hold("s",false)} onPointerCancel={()=>hold("s",false)} onLostPointerCapture={()=>hold("s",false)} className="rounded-lg border border-[#365a7c] bg-[#001d3d] p-2"><ArrowDown size={17}/></button></div><button aria-label="Right" onPointerDown={handlePointer("d")} onPointerUp={()=>hold("d",false)} onPointerCancel={()=>hold("d",false)} onLostPointerCapture={()=>hold("d",false)} className="rounded-lg border border-[#365a7c] bg-[#001d3d] p-3"><ArrowRight/></button></div>
        <div className="hidden text-center text-xs font-bold text-[#aabbd0] md:block">WASD / ARROWS · DRIVE &nbsp; | &nbsp; SPACE · PICK UP / DELIVER</div>
        <div className="flex gap-2"><button onClick={interact} disabled={display.phase!=="playing"||busy} className="rounded-xl bg-[#ffc300] px-5 py-3 text-sm font-black text-[#000814] disabled:opacity-50">{display.held!==null?"DELIVER / UNLOAD":"PICK UP"}</button><button onClick={reset} aria-label="Restart" disabled={busy} className="rounded-xl border border-[#385a7a] p-3"><RotateCcw size={19}/></button></div>
      </div>
    </div>
  </div>;
}
