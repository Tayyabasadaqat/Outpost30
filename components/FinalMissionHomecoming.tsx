"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, ChevronRight, CircleHelp, Heart, Home, Orbit, Play, Rocket, RotateCcw, Shield, Sparkles, X, Zap } from "lucide-react";

type Strategy = "safe" | "risky" | "dangerous";
type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Chapter = 0 | 1 | 2;
type Mode = "tutorial" | "playing" | "interlude" | "failed" | "victory";
type Vec = { x: number; y: number };
type Debris = Vec & { vx: number; vy: number; radius: number; spin: number };
type State = {
  x: number; y: number; vx: number; vy: number; progress: number; health: number; fuel: number;
  elapsed: number; seconds: number; beacons: number; shield: number; landingSpeed: number;
  objects: Debris[]; pickups: Vec[]; invuln: number; spawn: number; glow: number;
};
const W = 960, H = 540;
const CFG = {
  safe: { lives: 5, time: [95, 105, 115], debris: 0.78, corridor: 145 },
  risky: { lives: 4, time: [82, 94, 105], debris: 1, corridor: 118 },
  dangerous: { lives: 3, time: [75, 85, 95], debris: 1.24, corridor: 100 },
} as const;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const dist = (a: Vec, b: Vec) => Math.hypot(a.x-b.x, a.y-b.y);
const STARS = Array.from({ length: 90 }, (_, i) => ({x: (i*173+41)%960, y:(i*311+73)%540, r: i%7===0?1.8:0.8, phase:i*1.37}));
const waypoints: Vec[] = [{x:290,y:164},{x:615,y:378},{x:822,y:165}];
const names = ["LUNAR ASCENT", "DEEP-SPACE CORRIDOR", "EARTH HOMECOMING"];
const objectives = ["Hold thrust and guide your spacecraft through the ascent corridor.", "Navigate three navigation beacons while dodging orbital debris.", "Manage descent speed and land inside the glowing recovery zone."];
const facts = ["The Moon has about one-sixth of Earth's surface gravity, but lunar launch still needs careful guidance.", "Spacecraft navigate using tracking, calculations and planned course corrections; this obstacle course is fictionalized.", "Returning crews must carefully control their descent and landing systems. The landing shown here is a simplified arcade simulation."];
function fresh(chapter:Chapter, cfg: typeof CFG[Strategy]): State {
  return {
    x: chapter===1?90:480, y:chapter===0?440:chapter===1?275:72,
    vx:0,vy:chapter===2?22:0,progress:0,health:cfg.lives,fuel:100,
    elapsed:0,seconds:cfg.time[chapter],beacons:0,shield:100,landingSpeed:22,
    objects:chapter===1? [{x:380,y:290,vx:0,vy:40,radius:23,spin:0},{x:700,y:230,vx:0,vy:-45,radius:26,spin:0}]:[],
    pickups:[],invuln:0,spawn:0,glow:0
  };
}
function ship(ctx:CanvasRenderingContext2D, x:number,y:number,angle=0,flame=false,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  if(flame){ const g=ctx.createLinearGradient(0,13,0,75);g.addColorStop(0,"#fff4a4");g.addColorStop(.5,"#ffc300");g.addColorStop(1,"#fb584a00");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-10,20);ctx.lineTo(0,65+Math.random()*10);ctx.lineTo(10,20);ctx.fill(); }
  ctx.shadowBlur=17;ctx.shadowColor="#82d9ff";ctx.fillStyle="#d3e8f8";
  ctx.beginPath();ctx.moveTo(0,-33);ctx.lineTo(15,-9);ctx.lineTo(15,19);ctx.lineTo(-15,19);ctx.lineTo(-15,-9);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle="#003566";ctx.fillRect(-15,4,30,7);ctx.fillStyle="#ffc300";ctx.fillRect(-15,15,30,4);
  ctx.beginPath();ctx.arc(0,-10,7,0,Math.PI*2);ctx.fillStyle="#70d5ff";ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle="#97a8b9";ctx.fillRect(-24,2,8,23);ctx.fillRect(16,2,8,23);ctx.restore();
}
function earth(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number) {
  const grad=ctx.createRadialGradient(cx-r*.3,cy-r*.4,5,cx,cy,r);
  grad.addColorStop(0,"#75d6ef");grad.addColorStop(.62,"#1679aa");grad.addColorStop(1,"#072846");
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-1,0,Math.PI*2);ctx.clip();ctx.fillStyle="#77bfa1";
  ctx.beginPath();ctx.ellipse(cx-r*.23,cy-r*.2,r*.23,r*.32,.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.45,cy+r*.18,r*.28,r*.23,-.4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#d7fbff77";ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(cx,cy,r*.8,r*.27,.45,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.strokeStyle="#81ddff70";ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r+5,0,Math.PI*2);ctx.stroke();
}
function render(ctx:CanvasRenderingContext2D,s:State,chapter:Chapter,mode:Mode,now:number,corridor:number, keys:Record<string,boolean>) {
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#000814");bg.addColorStop(1,"#002044");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(const p of STARS){ctx.fillStyle=`rgba(198,225,255,${.24+.55*(.5+.5*Math.sin(now*.0017+p.phase))})`;ctx.beginPath();ctx.arc(p.x,(p.y+(chapter===0?s.progress*2.2:chapter===2?s.progress*.5:0))%H,p.r,0,Math.PI*2);ctx.fill();}
  if(chapter===0){
    ctx.fillStyle="#1b3049";ctx.beginPath();ctx.ellipse(480,610,680,285,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#53657b";ctx.beginPath();ctx.ellipse(480,565,650,160,0,0,Math.PI*2);ctx.fill();
    const center = 480 + Math.sin(s.progress*.045)*75;
    const left=center-corridor,right=center+corridor;
    ctx.fillStyle="#0d365055";ctx.fillRect(left,0,right-left,H);
    ctx.setLineDash([11,18]);ctx.strokeStyle="#ffcf3388";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,0);ctx.lineTo(left,H);ctx.moveTo(right,0);ctx.lineTo(right,H);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<7;i++){const yy=(i*99+s.progress*7)%650-60;ctx.fillStyle="#5d7180";ctx.beginPath();ctx.ellipse(70+(i*197)%800,yy,18,7,0,0,Math.PI*2);ctx.fill();}
    ship(ctx,s.x,s.y,clamp(s.vx/320,-.25,.25),!!keys.thrust,1);
    ctx.fillStyle="#d3e9fa";ctx.font="bold 15px sans-serif";ctx.fillText("ASCENT CORRIDOR",22,32);
  } else if(chapter===1){
    earth(ctx,870,65,72);ctx.fillStyle="#73879a";ctx.beginPath();ctx.arc(80,510,75,0,Math.PI*2);ctx.fill();
    waypoints.forEach((b,i)=>{
      if(i<s.beacons)return;
      ctx.shadowBlur=i===s.beacons?25:4;ctx.shadowColor="#ffd60a";ctx.strokeStyle=i===s.beacons?"#ffc300":"#546477";ctx.lineWidth=i===s.beacons?7:3;
      ctx.beginPath();ctx.arc(b.x,b.y,31+Math.sin(now*.003+i)*4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle=i===s.beacons?"#fff2b1":"#7e8ea0";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText(`RELAY ${i+1}`,b.x,b.y-46);ctx.textAlign="left";
    });
    s.objects.forEach(d=>{ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.spin);ctx.fillStyle="#8091a4";ctx.strokeStyle="#d7c3ad";ctx.lineWidth=2;ctx.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,rr=d.radius*(j%2?.86:1.1);const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
    ship(ctx,s.x,s.y,clamp(s.vx/270,-.35,.35),keys.up||keys.right,.95);
    if(keys.shield&&s.shield>0){ctx.strokeStyle="#67deff99";ctx.lineWidth=5;ctx.beginPath();ctx.arc(s.x,s.y,44,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle="#d3e9fa";ctx.font="bold 15px sans-serif";ctx.fillText("FOLLOW THE GOLDEN RINGS",22,32);
  } else {
    earth(ctx,480,615,620);
    const padX=480,padY=470;
    ctx.fillStyle="#071c33dd";ctx.fillRect(0,470,W,70);
    ctx.fillStyle="#ffce37";ctx.shadowColor="#ffc300";ctx.shadowBlur=20;ctx.fillRect(padX-100,padY-4,200,7);ctx.shadowBlur=0;
    ctx.fillStyle="#e1f3ff";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("RECOVERY ZONE",padX,padY+26);ctx.textAlign="left";
    ctx.setLineDash([6,10]);ctx.strokeStyle="#77d8ff77";ctx.lineWidth=3;ctx.strokeRect(padX-110,45,220,410);ctx.setLineDash([]);
    ship(ctx,s.x,s.y,0,keys.thrust,.9);
    ctx.fillStyle="#d3e9fa";ctx.font="bold 15px sans-serif";ctx.fillText("GUIDE CAPSULE TO LANDING ZONE",22,32);
  }
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#00081433");grad.addColorStop(.75,"#00081400");grad.addColorStop(1,"#00081499");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  if(s.invuln>0){ctx.strokeStyle="#ff476688";ctx.lineWidth=14;ctx.strokeRect(0,0,W,H);}
}

export default function FinalMissionHomecoming({strategy="safe",onComplete,onClose,busy=false}:Props){
  const cfg=CFG[strategy];
  const [chapter,setChapter]=useState<Chapter>(0);
  const [mode,setMode]=useState<Mode>("tutorial");

const [view, setView] = useState<{
  progress: number;
  health: number;
  fuel: number;
  seconds: number;
  beacons: number;
  shield: number;
  speed: number;
}>({
  progress: 0,
  health: cfg.lives,
  fuel: 100,
  seconds: cfg.time[0],
  beacons: 0,
  shield: 100,
  speed: 0,
});
  const [message,setMessage]=useState("THE FINAL MISSION BEGINS");
  const canvas=useRef<HTMLCanvasElement|null>(null);
  const state=useRef<State>(fresh(0,cfg));
  const chapterRef=useRef<Chapter>(0);
  const modeRef=useRef<Mode>("tutorial");
  const keys=useRef<Record<string,boolean>>({});
  const last=useRef(0);const uiLast=useRef(0);
  const busyRef=useRef(busy);busyRef.current=busy;
  const switchMode=(m:Mode)=>{modeRef.current=m;setMode(m);keys.current={};};
  const reset=useCallback(()=>{
    chapterRef.current=0;state.current=fresh(0,cfg);setChapter(0);switchMode("tutorial");
    setMessage("THE FINAL MISSION BEGINS");setView({progress:0,health:cfg.lives,fuel:100,seconds:cfg.time[0],beacons:0,shield:100,speed:0});
  },[cfg]);
  const go=()=>{
    state.current=fresh(chapterRef.current,cfg);
    setMessage(chapterRef.current===0?"HOLD SPACE TO THRUST!":chapterRef.current===1?"FOLLOW THE GOLDEN RELAY RINGS!":"LAND GENTLY IN THE CENTER!");
    switchMode("playing");
  };
  const advance=()=>{
    const next=(chapterRef.current+1) as Chapter;
    if(next>2)return;
    chapterRef.current=next;setChapter(next);state.current=fresh(next,cfg);
    setMessage(next===1?"STEER THROUGH ALL THREE GOLDEN NAVIGATION RINGS!":"EARTH IN SIGHT! BRAKE BEFORE TOUCHDOWN!");
    switchMode("playing");
  };
  useEffect(()=>{
    const handleDown=(ev:KeyboardEvent)=>{
      const k=ev.key.toLowerCase();
      if(ev.code==="Space"||["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k))ev.preventDefault();
      if(k==="a"||k==="arrowleft")keys.current.left=true;
      if(k==="d"||k==="arrowright")keys.current.right=true;
      if(k==="w"||k==="arrowup")keys.current.up=true;
      if(k==="s"||k==="arrowdown")keys.current.down=true;
      if(ev.code==="Space"||k===" ")keys.current.thrust=true;
      if(k==="shift")keys.current.shield=true;
    };
    const handleUp=(ev:KeyboardEvent)=>{
      const k=ev.key.toLowerCase();
      if(k==="a"||k==="arrowleft")keys.current.left=false;
      if(k==="d"||k==="arrowright")keys.current.right=false;
      if(k==="w"||k==="arrowup")keys.current.up=false;
      if(k==="s"||k==="arrowdown")keys.current.down=false;
      if(ev.code==="Space"||k===" ")keys.current.thrust=false;
      if(k==="shift")keys.current.shield=false;
    };
    const blur=()=>{keys.current={};};
    window.addEventListener("keydown",handleDown);window.addEventListener("keyup",handleUp);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",handleDown);window.removeEventListener("keyup",handleUp);window.removeEventListener("blur",blur);};
  },[]);
  useEffect(()=>{
    let raf=0;let isActive=true;
    const tick=(now:number)=>{
      if(!isActive)return;
      const dt=last.current?Math.min((now-last.current)/1000,.04):0;last.current=now;
      const s=state.current;const c=chapterRef.current;const k=keys.current;
      const running=modeRef.current==="playing"&&!busyRef.current;
      if(running&&dt>0){
        s.elapsed+=dt;s.seconds=Math.max(0,cfg.time[c]-s.elapsed);s.invuln=Math.max(0,s.invuln-dt);s.glow+=dt;
        const horiz=Number(!!k.right)-Number(!!k.left);
        if(c===0){
          s.vx=clamp(s.vx+horiz*680*dt-s.vx*2.5*dt,-260,260);s.x=clamp(s.x+s.vx*dt,45,915);
          const center=480+Math.sin(s.progress*.045)*75;
          if(Math.abs(s.x-center)>cfg.corridor&&s.invuln<=0){s.health--;s.invuln=1.8;setMessage("WARNING! RETURN TO THE SAFE FLIGHT CORRIDOR!");}
          if(k.thrust&&s.fuel>0){s.progress+=dt*14.5;s.fuel=Math.max(0,s.fuel-dt*5.1);}
          else {s.progress=Math.max(0,s.progress-dt*2.0);s.fuel=Math.min(100,s.fuel+dt*3.6);}
          if(s.progress>=100){switchMode("interlude");setMessage("LUNAR ORBIT REACHED. ASCENT COMPLETE!");}
        }else if(c===1){
          const vertical=Number(!!k.down)-Number(!!k.up);
          s.vx=clamp(s.vx+horiz*740*dt-s.vx*3.5*dt,-270,270);
          s.vy=clamp(s.vy+vertical*740*dt-s.vy*3.5*dt,-270,270);
          s.x=clamp(s.x+s.vx*dt,38,920);s.y=clamp(s.y+s.vy*dt,45,475);
          if(k.shield&&s.shield>0)s.shield=Math.max(0,s.shield-dt*35);else s.shield=Math.min(100,s.shield+dt*17);
          if(s.beacons<3&&dist(s,waypoints[s.beacons])<46){s.beacons++;s.progress=s.beacons*100/3;setMessage(`RELAY ${s.beacons}/3 SECURED!`);}
          s.objects.forEach(d=>{
            d.x+=d.vx*dt;d.y+=d.vy*dt;d.spin+=dt*.7;
            if(d.y<65||d.y>460)d.vy*=-1;
            if(d.x<110||d.x>860)d.vx*=-1;
            if(dist(d,s)<d.radius+22&&s.invuln<=0&&!(k.shield&&s.shield>0)){s.health--;s.invuln=1.6;setMessage("DEBRIS IMPACT! AVOID THE NEXT COLLISION!");}
          });
          if(s.beacons>=3){switchMode("interlude");setMessage("NAVIGATION COMPLETE! EARTH IN SIGHT.");}
        }else{
          s.vx=clamp(s.vx+horiz*640*dt-s.vx*2.8*dt,-190,190);
          s.x=clamp(s.x+s.vx*dt,42,918);
          // Gravity, active braking and safe descent. Release thrust to descend.
          s.vy=clamp(s.vy+(k.thrust?-85:44)*dt,14,115);
          s.y+=s.vy*dt;s.landingSpeed=s.vy;
          s.progress=clamp((s.y-72)/3.9,0,100);
          if(s.y>=442){
            if(Math.abs(s.x-480)<=113&&s.vy<=74){s.progress=100;switchMode("victory");setMessage("TOUCHDOWN CONFIRMED! CREW HOME SAFE!");}
            else{ s.health--;s.y=90;s.x=480;s.vx=0;s.vy=25;s.invuln=1;setMessage("UNSAFE APPROACH! TRY THE LANDING AGAIN.");}
          }
        }
        if(s.health<=0||s.seconds<=0){switchMode("failed");setMessage(s.health<=0?"SAFETY LIMIT REACHED. RESTART THE FINAL CHAPTER.":"MISSION WINDOW CLOSED. RETRY THIS CHAPTER.");}
      }
      if(now-uiLast.current>110){uiLast.current=now;setView({progress:s.progress,health:s.health,fuel:s.fuel,seconds:s.seconds,beacons:s.beacons,shield:s.shield,speed:s.landingSpeed});}
      const context=canvas.current?.getContext("2d");if(context)render(context,s,c,modeRef.current,now,cfg.corridor,keys.current);
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>{isActive=false;cancelAnimationFrame(raf);last.current=0;};
  },[cfg]);
  const begin=()=>{chapterRef.current=0;setChapter(0);go();};
  const retry=()=>{state.current=fresh(chapterRef.current,cfg);go();};
  const controls=[{key:"left",icon:ArrowLeft,label:"LEFT"},{key:"right",icon:ArrowRight,label:"RIGHT"},{key:"up",icon:ArrowUp,label:"UP"},{key:"thrust",icon:Zap,label:chapter===0?"SPACE · THRUST":chapter===2?"SPACE · BRAKE":"THRUST"}];
  return <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#284a6e] bg-[#00142c] px-3 py-3 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffc300] text-[#000814]"><Rocket size={24}/></span><div><p className="text-[10px] font-extrabold tracking-[.18em] text-[#ffd60a]">OUTPOST 30 · DAY 30 · GRAND FINALE</p><h2 className="text-base font-black sm:text-2xl">OPERATION: HOMECOMING</h2></div></div>
      <div className="flex items-center gap-2"><span className="hidden rounded-lg border border-[#30587a] px-3 py-2 text-xs font-bold text-[#ffd60a] sm:block">CHAPTER {chapter+1} / 3</span><button aria-label="How to play" className="rounded-lg border border-[#30587a] p-2" onClick={()=>switchMode("tutorial")}><CircleHelp size={20}/></button><button aria-label="Close game" disabled={busy} className="rounded-lg p-2 hover:bg-[#003566]" onClick={onClose}><X size={21}/></button></div>
    </header>
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5">
      <div className="flex items-center gap-2 text-xs font-black text-[#ffd60a]"><Orbit size={16}/>{names[chapter]}</div>
      <div className="flex items-center gap-3 text-xs font-bold"><span className="flex items-center gap-1 text-[#fca5ad]"><Heart size={15}/> {"♥".repeat(Math.max(0,view.health))}</span><span className="text-[#b6d1e9]">{String(Math.floor(Math.max(0,view.seconds)/60)).padStart(2,"0")}:{String(Math.floor(Math.max(0,view.seconds)%60)).padStart(2,"0")}</span></div>
    </div>
    <div className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden border-y border-[#244563] sm:rounded-2xl sm:border">
      <canvas ref={canvas} width={W} height={H} className="h-full w-full object-contain" aria-label={`Animated gameplay for ${names[chapter]}`}/>
      {(mode==="tutorial"||mode==="failed"||mode==="interlude"||mode==="victory")&&<div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#000814e8] p-3 sm:p-7">
        <div className="w-full max-w-lg rounded-3xl border border-[#517092] bg-[#001d3d] p-5 text-center shadow-[0_24px_70px_#000b] sm:p-8">
          {mode==="tutorial"?<><div className="mb-3 text-4xl">🌙 🚀 🌍</div><p className="text-xs font-black tracking-[.2em] text-[#ffd60a]">THE FINAL 30-DAY MISSION</p><h3 className="mt-2 text-3xl font-black">BRING EVERYONE HOME.</h3><p className="mt-3 text-sm leading-6 text-[#bed3e7]">Three playable chapters. One final journey. You completed 29 days surviving on the Moon—now it's time to return to Earth.</p><div className="my-5 space-y-2 text-left text-sm">{["01 · LAUNCH — A/D to steer, HOLD SPACE for thrust. Stay between the golden lines.","02 · NAVIGATE — WASD to steer through three gold rings. HOLD SHIFT for a temporary shield.","03 · LAND — A/D to center the capsule. HOLD SPACE to slow your descent."].map(x=><div key={x} className="rounded-xl border border-[#375776] bg-[#061832] p-3">{x}</div>)}</div><p className="mb-4 text-xs text-[#9cb8d4]">You can retry each chapter without replaying the whole finale.</p><button onClick={modeRef.current==="tutorial"&&chapter>0?go:begin} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]"><Play size={19}/> {chapter===0?"BEGIN THE FINAL MISSION":"RESUME THIS CHAPTER"}</button></>:
          mode==="failed"?<><Shield className="mx-auto mb-3 text-[#ffd60a]" size={50}/><h3 className="text-3xl font-black">MISSION RETRY</h3><p className="my-4 text-sm text-[#c3d4e4]">{message}</p><button onClick={retry} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] p-4 font-black text-[#000814]"><RotateCcw size={19}/> RETRY CHAPTER {chapter+1}</button></>:
          mode==="interlude"?<><CheckCircle2 className="mx-auto mb-3 text-[#ffd60a]" size={55}/><p className="text-xs font-black tracking-[.2em] text-[#ffd60a]">CHAPTER {chapter+1} COMPLETE</p><h3 className="mt-3 text-3xl font-black">{chapter===0?"MOON DEPARTURE SUCCESS!":"EARTH APPROACH SECURED!"}</h3><p className="my-4 text-sm leading-6 text-[#b8cce0]">{facts[chapter]}</p><button onClick={()=>{if(chapter===0||chapter===1){advance();} }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">CONTINUE TO CHAPTER {chapter+2}<ChevronRight size={19}/></button></>:
          <><Sparkles className="mx-auto mb-3 text-[#ffd60a]" size={56}/><p className="text-xs font-black tracking-[.2em] text-[#ffd60a]">MISSION ACCOMPLISHED · 30 / 30</p><h3 className="mt-3 text-4xl font-black">WELCOME HOME, COMMANDER.</h3><p className="mt-4 text-base leading-7 text-[#d3e2f2]">Thirty days. Thirty challenges. One incredible journey. You kept the crew alive, protected the Moon base, and brought everyone safely home.</p><div className="mt-5 grid grid-cols-3 gap-2">{["30 DAYS","3 CHAPTERS","1 CREW SAFE"].map(x=><div key={x} className="rounded-xl border border-[#b69d36] bg-[#071d3b] p-3 text-[11px] font-black text-[#ffd60a]">{x}</div>)}</div><p className="mt-4 text-xs text-[#bdd4e7]">{facts[2]}</p><button disabled={busy} onClick={onComplete} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814] disabled:opacity-50"><Home size={19}/>{busy?"SAVING FINAL MISSION...":"COMPLETE OUTPOST 30"}<ArrowRight size={19}/></button></>}
        </div>
      </div>}
    </div>
    <div className="mx-auto w-full max-w-6xl shrink-0 px-3 pb-3 pt-2 sm:px-5">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-[#c6d8e9]">{message}</span><span className="whitespace-nowrap text-xs font-extrabold text-[#ffd60a]">{chapter===1?`${view.beacons}/3 RINGS`: `${Math.floor(view.progress)}%`}</span></div>
      <div className="my-2 h-2 overflow-hidden rounded-full bg-[#193757]"><div className="h-full rounded-full bg-[#ffc300] transition-[width] duration-100" style={{width:`${clamp(view.progress,0,100)}%`}}/></div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-[#a9bfd6]"><span>{chapter===0?`ENGINE RESERVE ${Math.floor(view.fuel)}%`:chapter===1?`SHIELD ${Math.floor(view.shield)}%`:`DESCENT SPEED ${Math.floor(view.speed)} (SAFE BELOW 74)`}</span><span className="hidden sm:block">{objectives[chapter]}</span></div>
      <div className="mt-3 flex justify-center gap-2 sm:gap-4">
        {controls.filter(x=>chapter!==1||x.key!=="thrust").map(({key,icon:Icon,label})=><button key={key} disabled={mode!=="playing"||busy} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current[key]=true;}} onPointerUp={()=>{keys.current[key]=false;}} onPointerCancel={()=>{keys.current[key]=false;}} onLostPointerCapture={()=>{keys.current[key]=false;}} className={`flex h-12 min-w-[70px] touch-none items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold disabled:opacity-40 ${key==="thrust"?"border-[#ffc300] bg-[#ffc300] text-[#000814]":"border-[#416383] bg-[#001d3d] text-white"}`}><Icon size={19}/>{label}</button>)}
        {chapter===1&&<button disabled={mode!=="playing"||busy} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.shield=true;}} onPointerUp={()=>keys.current.shield=false} onPointerCancel={()=>keys.current.shield=false} onLostPointerCapture={()=>keys.current.shield=false} className="flex h-12 items-center gap-2 rounded-xl border border-[#79cde9] bg-[#003566] px-4 text-xs font-black disabled:opacity-40"><Shield size={18}/> SHIELD</button>}
        {chapter===1&&<button disabled={mode!=="playing"||busy} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.down=true;}} onPointerUp={()=>keys.current.down=false} onPointerCancel={()=>keys.current.down=false} onLostPointerCapture={()=>keys.current.down=false} className="h-12 rounded-xl border border-[#416383] bg-[#001d3d] px-4 text-xs font-black disabled:opacity-40">DOWN</button>}
      </div>
    </div>
  </div>;
}
