"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, HelpCircle, RadioTower, RotateCcw, Satellite, ShieldAlert, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "playing" | "won" | "lost";
type Game = { phase: Phase; stage: number; x: number; y: number; time: number; integrity: number; pulses: number; invuln: number; elapsed: number; boost: number; message: string; flash: number };
const W = 960, H = 520;
const settings = {
  safe: { time: 160, lives: 5, speed: 175, gates: 69, hazard: 1 },
  risky: { time: 135, lives: 4, speed: 215, gates: 61, hazard: 1.35 },
  dangerous: { time: 115, lives: 3, speed: 245, gates: 55, hazard: 1.75 },
};
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const STATIONS = ["ORBITAL SATELLITE", "DEEP SPACE RELAY", "EARTH RECEIVER"];
const FACTS = [
  "Radio signals carry commands and data between spacecraft and ground stations.",
  "Relay spacecraft can help maintain communication when a direct link is blocked.",
  "A signal to the Moon takes roughly 1.3 seconds to travel one way at light speed.",
];
const makeGame = (cfg: typeof settings.safe): Game => ({ phase:"tutorial",stage:0,x:95,y:260,time:cfg.time,integrity:cfg.lives,pulses:0,invuln:0,elapsed:0,boost:0,message:"GUIDE YOUR SIGNAL THROUGH THREE RELAYS",flash:0 });
const obstacles = [
  { x:305, lane:130, width:36, offset:0.3 },
  { x:445, lane:390, width:44, offset:2.5 },
  { x:590, lane:175, width:40, offset:1.5 },
  { x:725, lane:355, width:40, offset:4.0 },
];

export default function CommunicationRelayRun({ strategy="safe",onComplete,onClose,busy=false }: Props) {
  const cfg = settings[strategy];
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(makeGame(cfg));
  const key = useRef({ up:false,down:false });
  const pointer = useRef<number|null>(null);
  const latest = useRef({busy,help:false});
  const [help,setHelp] = useState(false);
  const [view,setView] = useState<Game>(()=>({...game.current}));
  latest.current = {busy,help};
  const sync = useCallback(()=>setView({...game.current}),[]);
  const reset = useCallback(()=>{game.current=makeGame(cfg);pointer.current=null;key.current={up:false,down:false};setHelp(false);sync();},[cfg,sync]);
  const start = useCallback(()=>{game.current.phase="playing";sync();},[sync]);
  const stationX = (stage:number)=> [365,650,887][stage];
  const gateY = (stage:number,t:number)=>260 + Math.sin(t*(0.91+stage*0.18)+stage*1.8)*118;
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      if (["ArrowUp","ArrowDown","Space"].includes(e.code)) e.preventDefault();
      if (e.code==="ArrowUp"||e.key.toLowerCase()==="w") key.current.up=true;
      if (e.code==="ArrowDown"||e.key.toLowerCase()==="s") key.current.down=true;
    };
    const up=(e:KeyboardEvent)=>{
      if (e.code==="ArrowUp"||e.key.toLowerCase()==="w") key.current.up=false;
      if (e.code==="ArrowDown"||e.key.toLowerCase()==="s") key.current.down=false;
    };
    const blur=()=>{key.current={up:false,down:false};pointer.current=null;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext("2d");if(!ctx)return;
    let raf=0,last=0,publish=0;
    const draw=(t:number)=>{
      const g=game.current;
      const dt=last?Math.min((t-last)/1000,0.045):0;last=t;
      if(g.phase==="playing"&&!latest.current.help&&!latest.current.busy){
        g.elapsed+=dt;g.time=Math.max(0,g.time-dt);g.invuln=Math.max(0,g.invuln-dt);g.flash=Math.max(0,g.flash-dt);g.boost=Math.max(0,g.boost-dt);
        if(g.time<=0){g.phase="lost";g.message="TIME UP — THE SIGNAL WAS LOST";}
        const dy=Number(key.current.down)-Number(key.current.up);
        if(pointer.current!==null)g.y += clamp(pointer.current-g.y,-360*dt,360*dt);
        else g.y+=dy*325*dt;
        g.y=clamp(g.y,60,H-52);
        g.x+= (cfg.speed+(g.boost>0?65:0))*dt;
        const gateX=stationX(g.stage),target=gateY(g.stage,g.elapsed);
        if(g.x>=gateX){
          if(Math.abs(g.y-target)<cfg.gates){
            const done=g.stage;
            g.stage++;g.pulses++;g.flash=0.45;g.boost=2;g.message=`LINK ESTABLISHED: ${STATIONS[done]}!`;
            if(g.stage>=3){g.phase="won";g.message="EARTH CONNECTION RESTORED!";}
            else {g.x=gateX+22;g.y=target;}
          } else {
            g.integrity--;g.flash=0.6;g.invuln=0.7;g.message="MISSED THE RELAY WINDOW! TRY THE APPROACH AGAIN.";
            g.x=doneStart(g.stage);g.y=260;
            if(g.integrity<=0){g.phase="lost";g.message="OUT OF SIGNAL RESTARTS";}
          }
        }
        for(const o of obstacles){
          const oy=o.lane+Math.sin(g.elapsed*(0.85+o.offset)*cfg.hazard+o.offset)*48;
          if(g.invuln===0&&Math.abs(g.x-o.x)<o.width+12&&Math.abs(g.y-oy)<29){
            g.integrity--;g.invuln=1.4;g.flash=0.55;g.message="INTERFERENCE HIT! STEER AROUND THE RED CLOUDS.";
            if(g.integrity<=0){g.phase="lost";g.message="SIGNAL INTEGRITY DEPLETED";}
          }
        }
      }
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#000814");bg.addColorStop(1,"#052a4a");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      for(let i=0;i<75;i++){const sx=(i*137+31)%W,sy=(i*83+19)%H;ctx.fillStyle=i%3===0?"#789cb7":"#c3d8f1";ctx.globalAlpha=.25+(i%4)*.14;ctx.fillRect(sx,sy,i%7===0?2:1,i%7===0?2:1);}ctx.globalAlpha=1;
      ctx.strokeStyle="#1d4868";ctx.lineWidth=1;ctx.setLineDash([5,14]);for(let yy=95;yy<H;yy+=82){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}ctx.setLineDash([]);
      ctx.fillStyle="#315779";ctx.beginPath();ctx.arc(-45,H+92,175,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8d9ca6";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-45,H+92,175,0,Math.PI*2);ctx.stroke();
      const stage=g.stage;
      for(let i=0;i<3;i++){
        const x=stationX(i),y=gateY(i,g.elapsed);
        const linked=i<stage;const active=i===stage;
        ctx.globalAlpha=linked?.38:active?1:.28;
        ctx.strokeStyle=linked?"#79e7ad":"#ffd60a";ctx.lineWidth=active?5:2;ctx.beginPath();ctx.arc(x,y,cfg.gates,0,2*Math.PI);ctx.stroke();
        ctx.strokeStyle=linked?"#79e7ad":"#8bd8ff";ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(x-25,y);ctx.lineTo(x+25,y);ctx.moveTo(x,y-25);ctx.lineTo(x,y+25);ctx.stroke();
        ctx.fillStyle=linked?"#79e7ad":"#ffd60a";ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#ffffff";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillText(linked?"LINKED":STATIONS[i],x,Math.max(23,y-cfg.gates-13));ctx.globalAlpha=1;
      }
      for(const o of obstacles){
        const oy=o.lane+Math.sin(g.elapsed*(0.85+o.offset)*cfg.hazard+o.offset)*48;
        ctx.fillStyle="#ff4d7580";ctx.beginPath();ctx.ellipse(o.x,oy,o.width,29,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#ff7096";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.x,oy,o.width,29,0,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle="#ffacba";ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.fillText("STATIC",o.x,oy+4);
      }
      if(g.phase==="playing"||g.phase==="tutorial"){
        ctx.shadowColor="#8cdeff";ctx.shadowBlur=27;ctx.fillStyle=g.invuln>0?"#ffffff":"#8bdfff";
        ctx.beginPath();ctx.moveTo(g.x+24,g.y);ctx.lineTo(g.x-12,g.y-13);ctx.lineTo(g.x-12,g.y+13);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
        ctx.strokeStyle="#7ddaff6a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Math.max(0,g.x-115),g.y);ctx.lineTo(g.x-19,g.y);ctx.stroke();
      }
      if(g.flash>0){ctx.fillStyle=g.message.startsWith("LINK")?"#8dedaa15":"#ff487019";ctx.fillRect(0,0,W,H);}
      const pulse=gateY(Math.min(stage,2),g.elapsed);
      if(stage<3&&g.phase==="playing"){
        ctx.fillStyle="#ffd60a";ctx.textAlign="right";ctx.font="bold 13px system-ui";ctx.fillText(`NEXT RELAY ↗  ${Math.round(Math.abs(g.y-pulse))}m OFFSET`,W-24,29);
      }
      raf=requestAnimationFrame(draw);
      if(t-publish>90){publish=t;setView({...g});}
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[cfg.gates,cfg.hazard,cfg.speed]);
  const onPointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const r=e.currentTarget.getBoundingClientRect();pointer.current=clamp((e.clientY-r.top)/r.height*H,50,H-50);
  };
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#244669] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><RadioTower size={24}/></span><div><p className="text-[10px] font-bold tracking-[.2em] text-[#ffd60a]">DAY 25 · COMMUNICATION RELAY</p><h2 className="text-lg font-black sm:text-2xl">SIGNAL SURFER</h2></div></div>
      <div className="flex items-center gap-3"><span className="text-xs font-bold text-[#ffd60a]">LINKS {view.pulses}/3</span><span className="rounded-lg border border-[#4c7396] px-3 py-2 text-xs font-black">{Math.floor(view.time/60).toString().padStart(2,"0")}:{Math.floor(view.time%60).toString().padStart(2,"0")}</span><button aria-label="How to play" onClick={()=>setHelp(true)} className="rounded-lg border border-[#4c7396] p-2"><HelpCircle size={19}/></button><button aria-label="Close" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div>
    </header>
    <main className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-6">
      <div className="mx-auto mb-2 flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 text-xs font-black"><span className="text-[#ffd60a]"><Satellite size={15} className="mr-2 inline"/>NEXT: {STATIONS[Math.min(view.stage,2)]}</span><span className="text-[#9cc4df]">SIGNAL RESTARTS: {"● ".repeat(Math.max(0,view.integrity))}<span className="text-slate-500">{"○ ".repeat(Math.max(0,cfg.lives-view.integrity))}</span></span></div>
      <div className="relative mx-auto min-h-[230px] w-full max-w-6xl flex-1 overflow-hidden rounded-2xl border border-[#315475] bg-[#061a32]">
        <canvas ref={canvas} width={W} height={H} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);onPointer(e);}} onPointerMove={e=>{if(e.buttons)onPointer(e);}} onPointerUp={()=>pointer.current=null} onPointerCancel={()=>pointer.current=null} className="h-full w-full touch-none object-fill" aria-label="Guide the glowing transmission through moving relay rings, avoiding red interference clouds"/>
        {view.phase==="tutorial"&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814eb] p-4"><section className="max-w-lg rounded-2xl border border-[#ffc30055] bg-[#001d3d] p-5 text-center sm:p-8"><RadioTower size={42} className="mx-auto mb-3 text-[#ffd60a]"/><h3 className="mb-3 text-2xl font-black">RESTORE CONTACT WITH EARTH!</h3><p className="mb-4 text-sm leading-6 text-slate-200">Your signal flies automatically to the right. <strong>Move UP/DOWN</strong> or drag on the game to fly through the <strong>moving yellow relay rings</strong>. Dodge <strong>red static clouds</strong>. Make all three connections!</p><p className="mb-5 rounded-lg bg-[#003566] px-3 py-2 text-xs text-[#cdeaff]">W/S · ↑/↓ · DRAG TO STEER · 3 RELAYS TO WIN</p><button onClick={start} className="w-full rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]">TRANSMIT SIGNAL <Zap size={17} className="ml-2 inline"/></button></section></div>}
        {(view.phase==="won"||view.phase==="lost")&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#000814ee] p-5"><div className="max-w-md text-center">{view.phase==="won"?<CheckCircle2 size={52} className="mx-auto mb-4 text-[#79e7ad]"/>:<ShieldAlert size={50} className="mx-auto mb-4 text-[#ff7c90]"/>}<h3 className="text-3xl font-black">{view.phase==="won"?"EARTH LINK RESTORED!":"SIGNAL LOST!"}</h3><p className="mt-3 text-sm text-slate-200">{view.phase==="won"?"All three relay connections are active. Mission Control can hear us again!":"Try steering toward the moving rings earlier and avoiding red interference clouds."}</p>{view.phase==="won"?<button disabled={busy} onClick={onComplete} className="mt-6 w-full rounded-xl bg-[#ffc300] px-6 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button>:<button onClick={reset} className="mt-6 rounded-xl bg-[#ffc300] px-7 py-4 font-black text-[#000814]"><RotateCcw size={17} className="mr-2 inline"/>TRY AGAIN</button>}</div></div>}
        {help&&view.phase==="playing"&&<div className="absolute inset-0 z-30 grid place-items-center bg-[#000814ee] p-5"><div className="max-w-sm text-center"><h3 className="text-xl font-black text-[#ffd60a]">CONTROLS</h3><p className="my-4 text-sm leading-6">Hold W / ↑ to move up, S / ↓ to move down, or drag the signal. Fly through the yellow circles. Avoid red clouds. Each correct relay unlocks the next section.</p><button onClick={()=>setHelp(false)} className="rounded-lg bg-[#ffc300] px-6 py-3 font-black text-[#000814]">RESUME</button></div></div>}
      </div>
      <div className="mx-auto mt-3 w-full max-w-6xl text-center"><p className="min-h-5 text-xs font-bold tracking-wide text-[#ffd60a]" aria-live="polite">{view.message}</p><div className="mt-3 flex items-center justify-center gap-4"><button disabled={view.phase!=="playing"||busy} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);key.current.up=true;}} onPointerUp={()=>key.current.up=false} onPointerCancel={()=>key.current.up=false} onLostPointerCapture={()=>key.current.up=false} className="grid h-14 w-20 touch-none place-items-center rounded-xl border border-[#4c7396] bg-[#001d3d] disabled:opacity-40"><ArrowUp/></button><span className="max-w-48 text-xs font-bold text-[#c3d8e9]">STEER THROUGH MOVING RINGS</span><button disabled={view.phase!=="playing"||busy} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);key.current.down=true;}} onPointerUp={()=>key.current.down=false} onPointerCancel={()=>key.current.down=false} onLostPointerCapture={()=>key.current.down=false} className="grid h-14 w-20 touch-none place-items-center rounded-xl border border-[#4c7396] bg-[#001d3d] disabled:opacity-40"><ArrowDown/></button><button onClick={reset} disabled={busy} className="rounded-lg border border-[#4c7396] px-3 py-3 text-xs text-[#ffd60a]"><RotateCcw size={18}/></button></div><p className="mt-2 text-[11px] text-[#97b6cd]">{view.pulses>0?FACTS[Math.min(view.pulses-1,2)]:"SCIENCE: Astronauts use radio communication to send data between the Moon and Earth."}</p></div>
    </main>
  </div>;
}
function doneStart(stage:number){return stage===0?95:stationEntry(stage);}
function stationEntry(stage:number){return [95,385,670][stage]??95;}
