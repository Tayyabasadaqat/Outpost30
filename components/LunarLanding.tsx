"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ArrowDown, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Rocket, X } from "lucide-react";
import type { Strategy } from "@/components/MissionStrategy";

type Props = { strategy?: Strategy; onComplete: () => void; onClose: () => void; busy?: boolean };
type Flight = { x: number; altitude: number; vx: number; vy: number; fuel: number; phase: "ready" | "flying" | "landed" | "crashed" };
const START: Flight = { x: -4.3, altitude: 12, vx: 0.85, vy: -0.6, fuel: 100, phase: "ready" };
const SETTINGS = {
  safe: { gravity: 1.22, maxSpeed: 2.1, fuelBurn: 10.5, pad: 2.0 },
  risky: { gravity: 1.55, maxSpeed: 1.7, fuelBurn: 13, pad: 1.75 },
  dangerous: { gravity: 1.9, maxSpeed: 1.35, fuelBurn: 16, pad: 1.5 },
};
const fixed = (n: number) => Number(n).toFixed(1);

function Lander({ flight, thrust }: { flight: React.MutableRefObject<Flight>; thrust: React.MutableRefObject<Set<string>> }) {
  const group = useRef<THREE.Group>(null);
  const fire = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const state = flight.current;
    group.current.position.set(state.x, state.altitude + 0.52, 0);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -state.vx * 0.055, 0.05);
    if (fire.current) {
      const firing = state.phase === "flying" && thrust.current.has("up") && state.fuel > 0;
      fire.current.visible = firing;
      fire.current.scale.y = 0.7 + Math.sin(clock.elapsedTime * 31) * 0.13;
    }
  });
  return (
    <group ref={group} position={[START.x, START.altitude + .52, 0]}>
      <mesh castShadow position={[0,.55,0]}><cylinderGeometry args={[.65,.78,1.25,8]}/><meshStandardMaterial color="#e0e7eb" metalness={.65} roughness={.33}/></mesh>
      <mesh castShadow position={[0,1.23,0]}><coneGeometry args={[.66,.5,8]}/><meshStandardMaterial color="#ffc300" metalness={.4} roughness={.3}/></mesh>
      <mesh position={[0,.61,.67]}><circleGeometry args={[.25,24]}/><meshStandardMaterial color="#0b2c4f" emissive="#17538b" emissiveIntensity={.45}/></mesh>
      {[-1,1].map((side)=><group key={side}>
        <mesh castShadow position={[side*.62,-.17,0]} rotation={[0,0,side*.39]}><cylinderGeometry args={[.07,.07,1.24,10]}/><meshStandardMaterial color="#9faebf" metalness={.8}/></mesh>
        <mesh castShadow position={[side*.91,-.65,0]}><boxGeometry args={[.7,.08,.45]}/><meshStandardMaterial color="#c9d4dc" metalness={.65}/></mesh>
        <mesh position={[side*.82,.6,0]}><boxGeometry args={[.44,.5,.08]}/><meshStandardMaterial color="#003566" metalness={.4}/></mesh>
      </group>)}
      <mesh ref={fire} position={[0,-.82,0]} rotation={[Math.PI,0,0]} visible={false}><coneGeometry args={[.28,1.35,12]}/><meshBasicMaterial color="#ffd60a" transparent opacity={.9}/></mesh>
      <pointLight position={[0,-.8,0]} color="#ffc300" intensity={2} distance={5}/>
    </group>
  );
}

function CameraRig() {
  const {camera} = useThree();
  useFrame(() => { camera.lookAt(0,6.3,0); });
  return null;
}
function MoonWorld({flight, thrust, padRadius}: {flight: React.MutableRefObject<Flight>;thrust:React.MutableRefObject<Set<string>>;padRadius:number}) {
  return <>
    <color attach="background" args={["#000814"]}/>
    <fog attach="fog" args={["#000814",32,75]}/>
    <ambientLight intensity={.75}/>
    <directionalLight position={[-6,19,8]} intensity={2.7} color="#f7f1db" castShadow shadow-mapSize={[1024,1024]}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.05,0]}><planeGeometry args={[100,100]}/><meshStandardMaterial color="#555e70" roughness={1}/></mesh>
    <mesh position={[0,.05,0]} receiveShadow><cylinderGeometry args={[padRadius,padRadius+.23,.14,56]}/><meshStandardMaterial color="#192c45" metalness={.4} roughness={.68}/></mesh>
    <mesh position={[0,.13,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[padRadius-.22,padRadius-.13,64]}/><meshBasicMaterial color="#ffd60a" side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.15,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.43,.5,48]}/><meshBasicMaterial color="#ffc300" side={THREE.DoubleSide}/></mesh>
    {Array.from({length:35},(_,i)=>{
      const angle=i*2.399, radius=5.2+(i%9)*1.3, x=Math.cos(angle)*radius, z=Math.sin(angle)*radius;
      return <mesh key={i} position={[x,.15,z]} rotation={[i*.3,i*.7,0]} scale={[.4+(i%4)*.16,.32+(i%3)*.13,.45]} castShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2===0?"#798392":"#394658"} roughness={1}/></mesh>;
    })}
    {[-1,1].map((side)=><group key={side} position={[side*3.1,.2,0]}><mesh><cylinderGeometry args={[.1,.16,.4,10]}/><meshStandardMaterial color="#8396b1"/></mesh><mesh position={[0,.25,0]}><sphereGeometry args={[.12,12,12]}/><meshBasicMaterial color="#ffd60a"/></mesh><pointLight position={[0,.5,0]} color="#ffd60a" intensity={2} distance={5}/></group>)}
    <Lander flight={flight} thrust={thrust}/>
    <CameraRig/>
  </>;
}

function Control({label, name, active, onDown, onUp, icon}: {label:string;name:string;active:boolean;onDown:(name:string)=>void;onUp:(name:string)=>void;icon:React.ReactNode}) {
  return <button type="button" aria-label={label} aria-pressed={active} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onDown(name)}} onPointerUp={()=>onUp(name)} onPointerCancel={()=>onUp(name)} onLostPointerCapture={()=>onUp(name)} className={`grid h-14 w-14 touch-none place-items-center rounded-xl border transition ${active?"border-[#ffd60a] bg-[#ffc300] text-[#000814]":"border-[#6e819c] bg-[#001d3d]/90 text-white hover:border-[#ffc300]"}`}>{icon}</button>;
}

export default function LunarLanding({strategy="safe",onComplete,onClose,busy=false}:Props) {
  const config=SETTINGS[strategy];
  const flight=useRef<Flight>({...START});
  const controls=useRef(new Set<string>());
  const [display,setDisplay]=useState<Flight>({...START});
  const [active,setActive]=useState<string[]>([]);
  const [attempts,setAttempts]=useState(0);
  const lastUi=useRef(0);
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase(); const mapped=k==="arrowup"||k==="w"||k===" "?"up":k==="arrowleft"||k==="a"?"left":k==="arrowright"||k==="d"?"right":null;if(mapped){e.preventDefault();controls.current.add(mapped);setActive([...controls.current])}};
    const up=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();const mapped=k==="arrowup"||k==="w"||k===" "?"up":k==="arrowleft"||k==="a"?"left":k==="arrowright"||k==="d"?"right":null;if(mapped){controls.current.delete(mapped);setActive([...controls.current])}};
    const blur=()=>{controls.current.clear();setActive([])};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur)};
  },[]);
  function reset(){controls.current.clear();setActive([]);flight.current={...START, phase:"ready"};setDisplay({...flight.current});lastUi.current=0;setAttempts(v=>v+1)}
  function press(k:string){controls.current.add(k);setActive([...controls.current])}
  function release(k:string){controls.current.delete(k);setActive([...controls.current])}
  function tick(dt:number,elapsed:number){
    const f=flight.current;if(f.phase!=="flying")return;
    const d=Math.min(dt,.045);let ax=0, ay=-config.gravity;
    if(controls.current.has("left"))ax-=2.35;
    if(controls.current.has("right"))ax+=2.35;
    if(controls.current.has("up")&&f.fuel>0){ay+=3.8;f.fuel=Math.max(0,f.fuel-config.fuelBurn*d)}
    f.vx=THREE.MathUtils.clamp(f.vx+ax*d,-5,5);f.vy=THREE.MathUtils.clamp(f.vy+ay*d,-8,5);
    f.x=THREE.MathUtils.clamp(f.x+f.vx*d,-11,11);f.altitude=Math.max(0,f.altitude+f.vy*d);
    if(f.altitude<=0){f.phase=Math.abs(f.x)<config.pad&&Math.abs(f.vx)<1.05&&Math.abs(f.vy)<config.maxSpeed?"landed":"crashed";controls.current.clear();setActive([])}
    if(elapsed-lastUi.current>.07||f.phase!=="flying"){setDisplay({...f});lastUi.current=elapsed}
  }
  const status=display.phase==="landed"?"LANDING CONFIRMED":display.phase==="crashed"?"HARD LANDING":Math.abs(display.vy)>config.maxSpeed&&display.altitude<5?"DESCENT TOO FAST":"GUIDANCE ONLINE";
  return <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#000814] text-white">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#001d3d] px-4 py-3 sm:px-7">
      <div><p className="text-[10px] font-black tracking-[.22em] text-[#ffd60a]">OUTPOST 30 / DAY 01 / FLIGHT DECK</p><h2 className="text-lg font-black sm:text-2xl">Lunar Landing</h2></div>
      <button aria-label="Close landing mission" disabled={busy} onClick={onClose} className="rounded-lg border border-white/20 p-2"><X size={20}/></button>
    </header>
    <div className="relative min-h-0 flex-1">
      <Canvas shadows dpr={[1,1.5]} camera={{position:[0,11,27],fov:48}}><FlightSimulation tick={tick}/><MoonWorld flight={flight} thrust={controls} padRadius={config.pad}/></Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/15 bg-[#001d3d]/90 p-3 backdrop-blur-md sm:left-6 sm:top-6 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-widest text-[#ffd60a]"><Rocket size={15}/> FLIGHT TELEMETRY</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm">
          <div><span className="block text-slate-400">ALTITUDE</span><strong className="text-lg tabular-nums">{fixed(display.altitude)} m</strong></div>
          <div><span className="block text-slate-400">VERTICAL SPEED</span><strong className={`text-lg tabular-nums ${Math.abs(display.vy)>config.maxSpeed?"text-rose-300":"text-white"}`}>{fixed(display.vy)} m/s</strong></div>
          <div><span className="block text-slate-400">HORIZONTAL SPEED</span><strong className="text-lg tabular-nums">{fixed(display.vx)} m/s</strong></div>
          <div><span className="block text-slate-400">FUEL</span><strong className="text-lg tabular-nums text-[#ffd60a]">{Math.ceil(display.fuel)}%</strong></div>
        </div>
        <div className="mt-4 border-t border-white/10 pt-3 text-xs"><span className="text-slate-400">TARGET: </span><span className="text-[#ffd60a]">pad center ±{config.pad}m</span><br/><span className="text-slate-400">SAFE DESCENT: </span>{`< ${config.maxSpeed} m/s`}</div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 max-w-[165px] rounded-xl border border-[#ffc300]/30 bg-[#001d3d]/90 p-3 text-right sm:right-6 sm:top-6 sm:max-w-xs sm:p-4"><p className="text-xs font-black text-[#ffd60a]">{status}</p><p className="mt-2 text-xs leading-5 text-slate-300">Hold thrust to slow descent. Steer over the glowing landing pad.</p></div>
      {display.phase==="ready"&&<div className="absolute inset-0 grid place-items-center bg-[#000814]/35 p-4"><div className="max-w-sm rounded-2xl border border-[#ffc300]/40 bg-[#001d3d]/95 p-7 text-center shadow-2xl"><Rocket className="mx-auto mb-4 text-[#ffd60a]" size={42}/><p className="text-xs font-bold tracking-widest text-[#ffd60a]">COMMANDER, YOU HAVE CONTROL</p><h3 className="mt-3 text-3xl font-black">Bring us home.</h3><p className="mt-3 text-sm leading-6 text-slate-300">Land gently inside the illuminated circle. Use <strong>↑ / W / Space</strong> for thrust and <strong>← → / A D</strong> to steer.</p><button onClick={()=>{flight.current.phase="flying";setDisplay({...flight.current})}} className="mt-6 w-full rounded-xl bg-[#ffc300] px-5 py-4 font-black text-[#000814]">BEGIN DESCENT</button></div></div>}
      {(display.phase==="landed"||display.phase==="crashed")&&<div className="absolute inset-0 grid place-items-center bg-[#000814]/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[#ffc300]/30 bg-[#001d3d] p-7 text-center"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#003566]">{display.phase==="landed"?<CheckCircle2 size={30} className="text-[#ffd60a]"/>:<Rocket size={30} className="text-rose-300"/>}</div><h3 className="text-3xl font-black">{display.phase==="landed"?"Touchdown!":"Landing unsuccessful"}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{display.phase==="landed"?"You controlled descent and protected the crew. Mission Control confirms a safe landing.":"The lander touched down too fast or outside the pad. Adjust thrust earlier and reduce sideways speed."}</p><p className="mt-3 text-xs text-[#ffd60a]">{attempts} retry attempts</p><button disabled={busy} onClick={display.phase==="landed"?onComplete:reset} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc300] py-4 font-black text-[#000814] disabled:opacity-50">{display.phase==="landed"?(busy?"SAVING...":"CONFIRM LANDING · CONTINUE"):"RETRY LANDING"}{display.phase==="crashed"&&<RotateCcw size={18}/>}</button></div></div>}
      {display.phase==="flying"&&<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between sm:bottom-7 sm:left-7 sm:right-7"><div className="flex gap-2"><Control label="Steer left" name="left" active={active.includes("left")} onDown={press} onUp={release} icon={<ArrowLeft/>}/><Control label="Steer right" name="right" active={active.includes("right")} onDown={press} onUp={release} icon={<ArrowRight/>}/></div><div className="flex flex-col items-center gap-2"><span className="rounded-lg bg-[#001d3d]/95 px-3 py-1 text-[10px] font-bold tracking-widest text-[#ffd60a]">HOLD THRUST</span><Control label="Fire landing engine" name="up" active={active.includes("up")} onDown={press} onUp={release} icon={<ArrowDown className="rotate-180"/>}/></div></div>}
    </div>
    <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#001d3d] px-4 py-3 text-[11px] text-slate-300 sm:px-7"><span>FLIGHT PRACTICE · SIMULATED PHYSICS</span><button onClick={reset} className="flex items-center gap-2 font-bold text-[#ffd60a]"><RotateCcw size={15}/> RESTART</button></footer>
  </div>;
}
function FlightSimulation({tick}:{tick:(delta:number,elapsed:number)=>void}){useFrame(({clock},delta)=>tick(delta,clock.elapsedTime));return null;}
