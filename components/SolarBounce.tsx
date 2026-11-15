"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Play, RotateCcw, ShieldAlert, Sun, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Phase = "tutorial" | "ready" | "playing" | "won" | "lost" | "paused";
type Tile = { x: number; y: number; w: number; h: number; alive: boolean; group: number; spark: number };
type Drop = { x: number; y: number; vy: number };
type Game = { phase: Phase; x: number; ballX: number; ballY: number; vx: number; vy: number; lives: number; time: number; cleaned: number; tiles: Tile[]; drops: Drop[]; widened: number; paddleWidth: number; flash: number; note: string; pointerX: number | null; last: number; publish: number; keyL: boolean; keyR: boolean; sparkles: {x:number;y:number;life:number}[] };
const W = 900, H = 530;
const CFG = {
  safe: { time: 170, lives: 6, speed: 320, paddle: 158 },
  risky: { time: 145, lives: 5, speed: 355, paddle: 139 },
  dangerous: { time: 125, lives: 4, speed: 388, paddle: 125 },
};
const C = ["#6ddaff", "#78efa9", "#ffd60a"];
function makeTiles(): Tile[] {
  const a: Tile[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    a.push({ x: 92+c*103, y: 92+r*59, w: 91, h: 44, alive: true, group: r, spark: 0 });
  }
  return a;
}
function newGame(strategy: Strategy): Game {
  const cfg=CFG[strategy];
  return {phase:"tutorial", x:W/2, ballX:W/2, ballY:H-86, vx:0, vy:0, lives:cfg.lives, time:cfg.time, cleaned:0,tiles:makeTiles(),drops:[],widened:0,paddleWidth:cfg.paddle,flash:0,note:"CLEAR ALL 21 DUSTY SOLAR CELLS",pointerX:null,last:0,publish:0,keyL:false,keyR:false,sparkles:[]};
}
const TOTAL=21;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function draw(ctx:CanvasRenderingContext2D,g:Game,now:number){
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#030c20");bg.addColorStop(1,"#092443");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(let i=0;i<65;i++){const x=(i*127+48)%W,y=(i*73+19)%H;ctx.globalAlpha=.22+(i%4)*.08;ctx.fillStyle="#daeaff";ctx.fillRect(x,y,i%5===0?2:1,i%5===0?2:1);}ctx.globalAlpha=1;
  ctx.fillStyle="#162e4b";ctx.beginPath();ctx.ellipse(125,600,260,130,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(735,600,320,120,0,0,Math.PI*2);ctx.fill();
  ctx.font="800 13px system-ui";ctx.fillStyle="#acc6e0";ctx.fillText("LUNAR SOLAR FARM  •  ARRAY 03",27,32);
  ctx.fillStyle="#ffd60a";ctx.textAlign="right";ctx.fillText(`${Math.round(g.cleaned/TOTAL*100)}% POWER RESTORED`,W-27,32);ctx.textAlign="left";
  for(const tile of g.tiles){
    if(!tile.alive)continue;
    ctx.shadowColor=C[tile.group];ctx.shadowBlur=tile.spark>0?22:5;
    roundRect(ctx,tile.x,tile.y,tile.w,tile.h,5,"#123a5b",C[tile.group]);ctx.shadowBlur=0;
    ctx.fillStyle="#1a5b7a";for(let n=1;n<4;n++)ctx.fillRect(tile.x+tile.w*n/4, tile.y+3,1,tile.h-6);
    ctx.fillStyle="#728294";ctx.globalAlpha=.78;
    for(let i=0;i<9;i++){const sx=tile.x+11+(i*23)%71,sy=tile.y+9+(i*13)%27;ctx.beginPath();ctx.arc(sx,sy,2+(i%3),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }
  ctx.strokeStyle="#416489";ctx.lineWidth=3;ctx.strokeRect(19,68, W-38, H-93);
  const pw=g.paddleWidth+(g.widened>0?62:0);const px=g.x-pw/2;
  ctx.shadowColor="#ffc300";ctx.shadowBlur=22;roundRect(ctx,px,H-57,pw,17,8,"#ffc300","#ffe987");ctx.shadowBlur=0;
  ctx.fillStyle="#001d3d";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText("CLEANING DRONE CONTROL",g.x,H-45);ctx.textAlign="left";
  if(g.phase==="ready"){
    ctx.strokeStyle="#ffd60a88";ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(g.x,H-83);ctx.lineTo(g.x+56, H-188);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.shadowColor="#86e9ff";ctx.shadowBlur=22;ctx.fillStyle="#a9edff";ctx.beginPath();ctx.arc(g.ballX,g.ballY,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#003566";ctx.lineWidth=3;ctx.beginPath();ctx.arc(g.ballX,g.ballY,5,0,Math.PI*2);ctx.stroke();
  for(const d of g.drops){ctx.shadowColor="#ffe05c";ctx.shadowBlur=12;roundRect(ctx,d.x-13,d.y-13,26,26,6,"#ffc300");ctx.shadowBlur=0;ctx.font="bold 17px system-ui";ctx.textAlign="center";ctx.fillStyle="#000814";ctx.fillText("+",d.x,d.y+6);ctx.textAlign="left";}
  for(const s of g.sparkles){ctx.globalAlpha=s.life;ctx.fillStyle="#ffed8e";ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  if(g.flash>0){ctx.fillStyle=`rgba(255,214,10,${g.flash*.1})`;ctx.fillRect(0,0,W,H);}
  if(g.phase==="ready"){ctx.textAlign="center";ctx.fillStyle="#fff1b3";ctx.font="800 18px system-ui";ctx.fillText("PRESS SPACE OR LAUNCH TO FIRE THE DRONE",W/2, H-112);ctx.textAlign="left";}
}
export default function SolarBounce({strategy="safe",onComplete,onClose,busy=false}:Props){
  const cfg=CFG[strategy];
  const canvas=useRef<HTMLCanvasElement>(null);
  const ref=useRef<Game>(newGame(strategy));
  const [hud,setHud]=useState({phase:"tutorial" as Phase,time:cfg.time,lives:cfg.lives,cleaned:0,widened:0,note:"CLEAR ALL 21 DUSTY SOLAR CELLS"});
  const [help,setHelp]=useState(false);
  const updateHud=useCallback((g:Game)=>setHud({phase:g.phase,time:Math.ceil(g.time),lives:g.lives,cleaned:g.cleaned,widened:g.widened,note:g.note}),[]);
  const reset=useCallback(()=>{ref.current=newGame(strategy);setHelp(false);updateHud(ref.current);},[strategy,updateHud]);
  const launch=useCallback(()=>{
    const g=ref.current;if(busy||help)return;
    if(g.phase==="tutorial"){g.phase="ready";g.note="MOVE THE PADDLE. LAUNCH YOUR CLEANING DRONE!";updateHud(g);return;}
    if(g.phase==="ready"){
      g.phase="playing";g.ballX=g.x;g.ballY=H-83;g.vx=cfg.speed*.43;g.vy=-cfg.speed*.9;g.note="BOUNCE THE DRONE INTO DUSTY PANELS";updateHud(g);
    }
  },[busy,cfg.speed,help,updateHud]);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if([" ","arrowleft","arrowright"].includes(k))e.preventDefault();if(k==="arrowleft"||k==="a")ref.current.keyL=true;if(k==="arrowright"||k==="d")ref.current.keyR=true;if((k===" "||k==="enter")&&!e.repeat)launch();};
    const up=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(k==="arrowleft"||k==="a")ref.current.keyL=false;if(k==="arrowright"||k==="d")ref.current.keyR=false;};
    const blur=()=>{ref.current.keyL=false;ref.current.keyR=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[launch]);
  useEffect(()=>{
    const cvs=canvas.current;const ctx=cvs?.getContext("2d");if(!cvs||!ctx)return;
    let id=0;
    function loop(now:number){
      const g=ref.current;const dt=g.last?Math.min((now-g.last)/1000,.035):0;g.last=now;
      if(!help&&!busy&&(g.phase==="ready"||g.phase==="playing")){
        if(g.pointerX!==null)g.x=clamp(g.pointerX,45,W-45);
        else g.x=clamp(g.x+(Number(g.keyR)-Number(g.keyL))*640*dt,45,W-45);
        if(g.phase==="ready"){g.ballX=g.x;g.ballY=H-83;}
        if(g.phase==="playing"){
          g.time=Math.max(0,g.time-dt);
          g.widened=Math.max(0,g.widened-dt);g.flash=Math.max(0,g.flash-dt*3);
          g.ballX+=g.vx*dt;g.ballY+=g.vy*dt;
          const r=11;
          if(g.ballX<30+r){g.ballX=30+r;g.vx=Math.abs(g.vx);}if(g.ballX>W-30-r){g.ballX=W-30-r;g.vx=-Math.abs(g.vx);}
          if(g.ballY<67+r){g.ballY=67+r;g.vy=Math.abs(g.vy);}
          const pw=g.paddleWidth+(g.widened>0?62:0);
          if(g.vy>0&&g.ballY+r>=H-57&&g.ballY-r<=H-35&&Math.abs(g.ballX-g.x)<pw/2+8){
            g.ballY=H-68;const speed=Math.hypot(g.vx,g.vy);const angle=clamp((g.ballX-g.x)/(pw/2),-1,1);
            g.vx=angle*speed*.85;g.vy=-Math.sqrt(Math.max(speed*speed-g.vx*g.vx, speed*speed*.4));
          }
          for(const tile of g.tiles){
            if(!tile.alive)continue;
            const nx=clamp(g.ballX,tile.x,tile.x+tile.w),ny=clamp(g.ballY,tile.y,tile.y+tile.h);
            const dx=g.ballX-nx,dy=g.ballY-ny;
            if(dx*dx+dy*dy<=r*r){
              tile.alive=false;g.cleaned++;g.flash=.8;
              if(Math.abs(dx)>Math.abs(dy))g.vx*=-1;else g.vy*=-1;
              for(let i=0;i<8;i++)g.sparkles.push({x:tile.x+Math.random()*tile.w,y:tile.y+Math.random()*tile.h,life:1});
              if(g.cleaned%7===0)g.note="SOLAR ARRAY RESTORED! KEEP GOING!";
              if(g.cleaned===7)g.note="LUNAR DUST IS SHARP AND STICKY — KEEP CLEANING!";
              if(g.cleaned===14)g.note="SOLAR CELLS TURN SUNLIGHT INTO ELECTRICITY!";
              if(g.cleaned%5===0)g.drops.push({x:tile.x+tile.w/2,y:tile.y+tile.h,vy:126});
              if(g.cleaned===TOTAL){g.phase="won";g.note="ALL SOLAR ARRAYS RESTORED!";}
              break;
            }
          }
          g.drops=g.drops.filter(d=>{d.y+=d.vy*dt;if(d.y>H-60&&d.y<H-30&&Math.abs(d.x-g.x)<pw/2+15){g.widened=11;g.note="POWER-UP! EXTRA-WIDE PADDLE FOR 11 SECONDS";return false;}return d.y<H+20;});
          g.sparkles=g.sparkles.filter(s=>{s.life-=dt*2.2;return s.life>0;});
          if(g.ballY>H+14){g.lives--;if(g.lives<=0){g.phase="lost";g.note="DRONES LOST. TRY AGAIN!";}else{g.phase="ready";g.note="DRONE RECOVERED. PRESS SPACE TO RELAUNCH!";g.ballY=H-83;g.vx=0;g.vy=0;}}
          if(g.time<=0&&g.phase!=="won"){g.phase="lost";g.note="SOLAR ARRAY POWER CRITICAL! TRY AGAIN.";}
        }
      }
      draw(ctx!,g,now);
      if(now-g.publish>95){g.publish=now;updateHud(g);}
      id=requestAnimationFrame(loop);
    }
    id=requestAnimationFrame(loop);return ()=>cancelAnimationFrame(id);
  },[busy,help,updateHud]);
  const pointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const rect=e.currentTarget.getBoundingClientRect();ref.current.pointerX=clamp((e.clientX-rect.left)/rect.width*W,45,W-45);
  };
  const setKey=(dir:"left"|"right",value:boolean)=>{if(dir==="left")ref.current.keyL=value;else ref.current.keyR=value;if(value)ref.current.pointerX=null;};
  const overlay=hud.phase==="tutorial"||hud.phase==="won"||hud.phase==="lost"||help;
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#244669] bg-[#001d3d] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Sun size={23}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-[#ffd60a]">DAY 21 · SOLAR PANEL DUST</p><h2 className="text-xl font-black sm:text-2xl">SOLAR BOUNCE</h2></div></div>
      <div className="flex items-center gap-3"><span className="rounded-lg border border-[#3a6286] px-3 py-2 text-xs font-bold">⏱ {String(Math.floor(hud.time/60)).padStart(2,"0")}:{String(hud.time%60).padStart(2,"0")}</span><button aria-label="How to play" onClick={()=>setHelp(true)} className="rounded-lg border border-[#3a6286] p-2"><HelpCircle size={19}/></button><button aria-label="Close mission" onClick={onClose} disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]"><X size={20}/></button></div>
    </header>
    <main className="relative flex min-h-0 flex-1 flex-col items-center gap-2 px-3 pb-3 pt-2 sm:px-6">
      <div className="flex w-full max-w-5xl items-center justify-between gap-3 text-xs font-black"><span className="text-[#ffd60a]">SOLAR CELLS CLEANED: {hud.cleaned}/{TOTAL}</span><span className="text-[#f4c9a4]">DRONES: {"● ".repeat(hud.lives)}<span className="text-[#40556d]">{"○ ".repeat(Math.max(0,cfg.lives-hud.lives))}</span></span></div>
      <div className="h-2 w-full max-w-5xl overflow-hidden rounded-full bg-[#163552]"><div className="h-full rounded-full bg-[#ffc300] transition-[width] duration-150" style={{width:`${hud.cleaned/TOTAL*100}%`}}/></div>
      <div className="relative flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#315475] bg-[#04142a]">
        <canvas ref={canvas} width={W} height={H} onPointerMove={pointer} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointer(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} className="h-full w-full touch-none object-contain" style={{aspectRatio:`${W}/${H}`}} aria-label="Solar Bounce play field"/>
        {overlay&&<div className="absolute inset-0 z-30 flex items-center justify-center bg-[#000814e9] p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ffd60a77] bg-[#001d3d] p-5 text-center shadow-2xl sm:p-7">
            {hud.phase==="won"&&!help?<><CheckCircle2 className="mx-auto mb-3 text-[#ffd60a]" size={50}/><h3 className="text-2xl font-black">SOLAR POWER RESTORED!</h3><p className="mt-3 text-sm leading-6 text-slate-300">All 21 solar cells cleaned! The Moon base has electricity again.</p><button onClick={onComplete} disabled={busy} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50">{busy?"SAVING...":"MISSION COMPLETE · CONTINUE"}</button></>:
            hud.phase==="lost"&&!help?<><ShieldAlert className="mx-auto mb-3 text-[#ffc300]" size={48}/><h3 className="text-2xl font-black">POWER CRITICAL!</h3><p className="mt-2 text-sm text-slate-300">The solar panels still need cleaning. Try again and keep your drone in play.</p><button onClick={reset} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><RotateCcw className="mr-2 inline" size={18}/>TRY AGAIN</button></>:
            <><div className="mb-3 flex items-center justify-center gap-2 text-[#ffd60a]"><Zap size={25}/><h3 className="text-2xl font-black">HOW TO PLAY</h3></div><p className="mb-4 text-sm text-slate-200">Bounce your cleaning drone into <b>21 dusty solar cells</b>. Don't let it fall!</p><div className="space-y-3 text-left text-sm"><p><b className="text-[#ffd60a]">← → / A D:</b> Move the golden paddle (or move your mouse).</p><p><b className="text-[#ffd60a]">SPACE:</b> Launch the blue cleaning drone.</p><p><b className="text-[#ffd60a]">BOUNCE:</b> Catch the drone with your paddle and hit every dusty panel.</p><p><b className="text-[#ffd60a]">GOLD +:</b> Catch falling power-ups to make your paddle wider.</p></div><p className="mt-4 text-xs text-slate-400">Real solar arrays produce electricity from sunlight. Lunar dust can reduce their performance.</p><button onClick={()=>{if(help)setHelp(false);else launch();}} className="mt-5 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><Play className="mr-2 inline" size={17}/>{help?"BACK TO GAME":"LET'S CLEAN!"}</button></>}
          </div>
        </div>}
      </div>
      <p className="min-h-4 text-center text-[11px] font-black tracking-wide text-[#ffd60a]" role="status">{hud.note}</p>
      <div className="flex w-full max-w-3xl items-center justify-center gap-3">
        <button aria-label="Move paddle left" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setKey("left",true);}} onPointerUp={()=>setKey("left",false)} onPointerCancel={()=>setKey("left",false)} onLostPointerCapture={()=>setKey("left",false)} disabled={overlay||busy} className="grid h-14 w-24 touch-none place-items-center rounded-xl border border-[#456d8d] bg-[#001d3d] disabled:opacity-40"><ArrowLeft size={27}/></button>
        <button onClick={launch} disabled={hud.phase!=="ready"||help||busy} className="h-14 min-w-36 rounded-xl bg-[#ffc300] px-5 text-sm font-black text-[#000814] disabled:opacity-40">LAUNCH DRONE</button>
        <button aria-label="Move paddle right" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setKey("right",true);}} onPointerUp={()=>setKey("right",false)} onPointerCancel={()=>setKey("right",false)} onLostPointerCapture={()=>setKey("right",false)} disabled={overlay||busy} className="grid h-14 w-24 touch-none place-items-center rounded-xl border border-[#456d8d] bg-[#001d3d] disabled:opacity-40"><ArrowRight size={27}/></button>
        <button aria-label="Restart" onClick={reset} disabled={busy} className="rounded-lg border border-[#476181] p-3 text-[#ffd60a] disabled:opacity-40"><RotateCcw size={19}/></button>
      </div>
    </main>
  </div>;
}
