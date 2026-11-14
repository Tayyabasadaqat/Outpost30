
"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  X,
} from "lucide-react";

type Props = {
  onComplete: () => void;
  onClose: () => void;
  busy?: boolean;
};

const ROCKS = [
  [-3, -3, 0.8],
  [2, -2, 1],
  [-1, 2, 0.9],
  [4, 3, 0.75],
  [-4, 4, 0.7],
  [0, -5, 0.6],
  [5, -5, 0.85],
  [-5, 0, 0.7],
] as const;

const SAMPLES = [
  [-5, -5],
  [4, -4],
  [3, 5],
] as const;

const START = new THREE.Vector3(0, 0, 5);

function RoverModel() {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.1, 0.45, 1.5]} />
        <meshStandardMaterial
          color="#e1e8ef"
          metalness={0.45}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, 1.05, -0.1]} castShadow>
        <boxGeometry args={[0.85, 0.3, 0.85]} />
        <meshStandardMaterial
          color="#365876"
          metalness={0.5}
        />
      </mesh>

      {[-0.65, 0.65].map((x) =>
        [-0.5, 0.5].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.35, z]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.3, 0.2, 18]} />
            <meshStandardMaterial
              color="#17202d"
              roughness={0.9}
            />
          </mesh>
        ))
      )}

      <mesh position={[0, 1.47, -0.35]}>
        <cylinderGeometry args={[0.035, 0.035, 0.65]} />
        <meshStandardMaterial color="#9caec1" />
      </mesh>

      <mesh position={[0, 1.82, -0.35]}>
        <boxGeometry args={[0.4, 0.22, 0.25]} />
        <meshStandardMaterial color="#d8e7f5" />
      </mesh>

      <mesh position={[0, 0.7, -0.77]}>
        <boxGeometry args={[0.65, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#b9eeff"
          emissive="#35a6e0"
          emissiveIntensity={1.8}
        />
      </mesh>
    </group>
  );
}

type WorldProps = {
  keys: React.MutableRefObject<Set<string>>;
  collected: number[];
  onCollect: (index: number) => void;
  resetKey: number;
};

function RoverWorld({
  keys,
  collected,
  onCollect,
  resetKey,
}: WorldProps) {
  const rover = useRef<THREE.Group>(null);
  const collectedRef = useRef(new Set<number>(collected));

  useEffect(() => {
    collectedRef.current = new Set(collected);
  }, [collected]);

  useFrame((_, delta) => {
    if (!rover.current) return;

    const current = rover.current.position;
    const direction = new THREE.Vector3();

    const pressed = keys.current;

    if (pressed.has("w") || pressed.has("arrowup")) {
      direction.z -= 1;
    }

    if (pressed.has("s") || pressed.has("arrowdown")) {
      direction.z += 1;
    }

    if (pressed.has("a") || pressed.has("arrowleft")) {
      direction.x -= 1;
    }

    if (pressed.has("d") || pressed.has("arrowright")) {
      direction.x += 1;
    }

    if (direction.lengthSq() === 0) return;

    direction.normalize();

    const next = current.clone().addScaledVector(
      direction,
      Math.min(delta, 0.05) * 4
    );

    next.x = THREE.MathUtils.clamp(next.x, -7, 7);
    next.z = THREE.MathUtils.clamp(next.z, -7, 7);

    const collision = ROCKS.some(([x, z, radius]) => {
      return (
        Math.hypot(next.x - x, next.z - z) <
        radius + 0.55
      );
    });

    if (!collision) {
      current.copy(next);

      const targetAngle = Math.atan2(
        -direction.x,
        -direction.z
      );

      rover.current.rotation.y = THREE.MathUtils.lerp(
        rover.current.rotation.y,
        targetAngle,
        Math.min(1, delta * 10)
      );
    }

    SAMPLES.forEach(([x, z], index) => {
      if (collectedRef.current.has(index)) return;

      if (Math.hypot(current.x - x, current.z - z) < 0.9) {
        collectedRef.current.add(index);
        onCollect(index);
      }
    });
  });

  return (
    <>
      <color attach="background" args={["#070c17"]} />
      <fog attach="fog" args={["#070c17", 19, 38]} />

      <ambientLight intensity={0.9} />

      <directionalLight
        position={[-7, 14, 7]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* MOON SURFACE */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial
          color="#596272"
          roughness={1}
        />
      </mesh>

      {/* EXPLORATION BOUNDARY */}
      <gridHelper
        args={[14, 14, "#6d8598", "#3e4f60"]}
        position={[0, 0.012, 0]}
      />

      {/* ROCK OBSTACLES */}
      {ROCKS.map(([x, z, radius], index) => (
        <mesh
          key={index}
          position={[x, radius * 0.42, z]}
          scale={[radius, radius * 0.85, radius]}
          rotation={[0.3, index * 0.7, 0.2]}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={index % 2 ? "#9299a4" : "#404a59"}
            roughness={1}
          />
        </mesh>
      ))}

      {/* SCIENTIFIC SAMPLES */}
      {SAMPLES.map(([x, z], index) => {
        if (collected.includes(index)) return null;

        return (
          <group key={index} position={[x, 0.45, z]}>
            <mesh>
              <octahedronGeometry args={[0.38]} />
              <meshStandardMaterial
                color="#8eecff"
                emissive="#19b8ff"
                emissiveIntensity={2.4}
                metalness={0.3}
              />
            </mesh>

            <pointLight
              color="#39cbff"
              intensity={2}
              distance={3}
            />

            <mesh
              position={[0, -0.42, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.45, 0.6, 32]} />
              <meshBasicMaterial
                color="#67dfff"
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* PLAYER ROVER */}
      <group
        key={resetKey}
        ref={rover}
        position={START.toArray()}
      >
        <RoverModel />
      </group>
    </>
  );
}

export default function RoverExploration({
  onComplete,
  onClose,
  busy = false,
}: Props) {
  const [collected, setCollected] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const keys = useRef(new Set<string>());

  const completed = collected.length === SAMPLES.length;

  useEffect(() => {
    function down(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (
        ["w", "a", "s", "d", "arrowup",
          "arrowdown", "arrowleft", "arrowright"].includes(key)
      ) {
        event.preventDefault();
        keys.current.add(key);
      }
    }

    function up(event: KeyboardEvent) {
      keys.current.delete(event.key.toLowerCase());
    }

    function blur() {
      keys.current.clear();
    }

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  function reset() {
    keys.current.clear();
    setCollected([]);
    setResetKey((value) => value + 1);
  }

  function collect(index: number) {
    setCollected((previous) =>
      previous.includes(index)
        ? previous
        : [...previous, index]
    );
  }

  function press(key: string) {
    keys.current.add(key);
  }

  function release(key: string) {
    keys.current.delete(key);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#050a13] text-white">
      {/* HUD */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1627] px-4 py-3 sm:px-7">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-cyan-300">
            DAY 05 · SURFACE EXPLORATION
          </p>
          <h2 className="text-base font-black sm:text-xl">
            LUNAR ROVER EXPEDITION
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-bold">
            SAMPLES {collected.length}/3
          </span>

          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close expedition"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* 3D GAME WORLD */}
      <div className="relative min-h-0 flex-1">
        <Canvas
          shadows
          camera={{
            position: [0, 15, 15],
            fov: 48,
          }}
        >
          <RoverWorld
            keys={keys}
            collected={collected}
            onCollect={collect}
            resetKey={resetKey}
          />
        </Canvas>

        {/* INSTRUCTIONS */}
        <div className="pointer-events-none absolute left-4 top-4 max-w-[260px] rounded-xl border border-white/10 bg-[#071324]/85 p-4 backdrop-blur-md">
          <p className="text-xs font-black text-cyan-200">
            MISSION OBJECTIVE
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-300">
            Drive across the lunar surface.
            Avoid rocks and collect all three glowing samples.
          </p>
        </div>

        {/* MOBILE / DESKTOP D-PAD */}
        {!completed && (
          <div className="absolute bottom-5 left-5 select-none">
            <div className="mb-1 flex justify-center">
              <Control
                direction="w"
                icon={<ArrowUp size={22} />}
                press={press}
                release={release}
              />
            </div>

            <div className="flex gap-1">
              <Control
                direction="a"
                icon={<ArrowLeft size={22} />}
                press={press}
                release={release}
              />

              <Control
                direction="s"
                icon={<ArrowDown size={22} />}
                press={press}
                release={release}
              />

              <Control
                direction="d"
                icon={<ArrowRight size={22} />}
                press={press}
                release={release}
              />
            </div>
          </div>
        )}

        {/* COMPLETION */}
        {completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#020712]/80 p-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-emerald-300/40 bg-[#0d2230] p-8 text-center">
              <CheckCircle2
                size={48}
                className="mx-auto text-emerald-300"
              />

              <h3 className="mt-5 text-3xl font-black">
                EXPEDITION COMPLETE
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                All three samples recovered!
                Your crew can now study the Moon&apos;s surface.
              </p>

              <button
                onClick={onComplete}
                disabled={busy}
                className="mt-6 w-full rounded-xl bg-emerald-300 px-6 py-4 font-black text-[#06251c] disabled:opacity-50"
              >
                {busy
                  ? "SAVING..."
                  : "RETURN TO MISSION CONTROL"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0b1627] px-4 py-3 text-xs text-slate-300 sm:px-7">
        <span>WASD / ARROW KEYS TO DRIVE</span>

        <button
          onClick={reset}
          disabled={busy}
          className="flex items-center gap-2 font-bold text-cyan-200"
        >
          <RotateCcw size={15} />
          RESTART
        </button>
      </footer>
    </div>
  );
}

function Control({
  direction,
  icon,
  press,
  release,
}: {
  direction: string;
  icon: React.ReactNode;
  press: (key: string) => void;
  release: (key: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Drive ${direction}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        press(direction);
      }}
      onPointerUp={() => release(direction)}
      onPointerCancel={() => release(direction)}
      onLostPointerCapture={() => release(direction)}
      onContextMenu={(event) => event.preventDefault()}
      className="flex h-12 w-12 touch-none items-center justify-center rounded-xl border border-cyan-200/35 bg-[#102a41]/90 text-cyan-100 active:bg-cyan-500/50"
    >
      {icon}
    </button>
  );
}
