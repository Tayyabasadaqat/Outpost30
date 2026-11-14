"use client";

import { useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";


type Place = "Habitat" | "Greenhouse" | "Solar Panels";

export type FocusTarget = Place | "Rover" | null;

type SceneProps = {
  explore: boolean;
  onSelect: (place: Place) => void;
  focus?: FocusTarget;
};

// Earth floating above the lunar horizon
function Earth() {
  const earth = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (earth.current) {
      earth.current.rotation.y =
        state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <group position={[8, 8, -16]} ref={earth}>
      <mesh>
        <sphereGeometry args={[2.1, 48, 48]} />
        <meshStandardMaterial
          color="#2c9be8"
          emissive="#124b99"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Stylized continents */}
      {[
        [-0.6, 0.4, 1.92],
        [0.6, -0.5, 1.8],
        [1.5, 0.8, 1.1],
      ].map((p, i) => (
        <mesh
          key={i}
          position={p as [number, number, number]}
          scale={[0.7, 0.45, 0.15]}
        >
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#66cb9c" />
        </mesh>
      ))}

      <mesh>
        <sphereGeometry args={[2.18, 48, 48]} />
        <meshBasicMaterial
          color="#66cfff"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Lunar surface and rocks
function MoonGround() {
  const rocks = Array.from({ length: 35 }, (_, i) => {
    const angle = i * 2.4;
    const distance = 3.4 + i * 0.33;

    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      size: 0.15 + (i % 5) * 0.08,
    };
  });

  return (
    <group>
      <mesh position={[0, -20.1, 0]} receiveShadow>
        <sphereGeometry args={[20, 80, 48]} />
        <meshStandardMaterial
          color="#777f9a"
          roughness={1}
        />
      </mesh>

      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.x, 0.05, rock.z]}
          scale={[
            rock.size * 1.4,
            rock.size,
            rock.size,
          ]}
          rotation={[0.2, i * 0.6, 0]}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 2 ? "#555d78" : "#9299ad"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main habitat
function Habitat({
  onSelect,
}: {
  onSelect: SceneProps["onSelect"];
}) {
  return (
    <group
      position={[0.7, 0, -1]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Habitat");
      }}
    >
      {/* Base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[2, 2.1, 0.7, 40]} />
        <meshStandardMaterial
          color="#d6dce9"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Warm interior */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[1.83, 1.83, 0.1, 40]} />
        <meshStandardMaterial
          color="#ffbf7b"
          emissive="#f79a4c"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Glass dome */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry
          args={[
            1.85,
            40,
            24,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshPhysicalMaterial
          color="#9edbfa"
          transparent
          opacity={0.4}
          roughness={0.16}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dome frame */}
      <mesh
        position={[0, 0.73, 0]}
        rotation={[0, 0.5, 0]}
      >
        <torusGeometry
          args={[1.85, 0.045, 8, 50, Math.PI]}
        />
        <meshStandardMaterial color="#d9f3ff" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.6, 2]} castShadow>
        <boxGeometry args={[0.9, 1.15, 0.48]} />
        <meshStandardMaterial color="#bdc9d8" />
      </mesh>

      <mesh position={[0, 0.64, 2.27]}>
        <boxGeometry args={[0.63, 0.87, 0.05]} />
        <meshStandardMaterial
          color="#ffcf91"
          emissive="#ffa54c"
          emissiveIntensity={1}
        />
      </mesh>

      <pointLight
        position={[0, 1.1, 0]}
        color="#ffbb75"
        intensity={15}
        distance={6}
      />
    </group>
  );
}

// Tiny plants in a glowing greenhouse
function Greenhouse({
  onSelect,
}: {
  onSelect: SceneProps["onSelect"];
}) {
  return (
    <group
      position={[4.3, 0, 1.4]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Greenhouse");
      }}
    >
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.45, 0.44, 32]} />
        <meshStandardMaterial color="#b7c6d6" />
      </mesh>

      {/* Plants */}
      {[-0.65, 0, 0.65].map((x) => (
        <group key={x} position={[x, 0.5, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#49ac71" />
          </mesh>

          <mesh
            position={[-0.18, 0.55, 0]}
            scale={[0.3, 0.17, 0.15]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#71ed9b" />
          </mesh>

          <mesh
            position={[0.2, 0.7, 0]}
            scale={[0.3, 0.17, 0.15]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#4dcf82" />
          </mesh>
        </group>
      ))}

      {/* Transparent greenhouse dome */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry
          args={[
            1.35,
            36,
            20,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshPhysicalMaterial
          color="#8dfcd0"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        position={[0, 1, 0]}
        color="#83ffae"
        intensity={8}
        distance={4}
      />
    </group>
  );
}

// Solar power system
function SolarPanels({
  onSelect,
}: {
  onSelect: SceneProps["onSelect"];
}) {
  return (
    <group
      position={[-3.6, 0, -1.3]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("Solar Panels");
      }}
    >
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.13, 1, 12]} />
            <meshStandardMaterial color="#b9c6d8" />
          </mesh>

          <group
            position={[0, 1.15, 0]}
            rotation={[-0.45, 0, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[2, 1.3, 0.12]} />
              <meshStandardMaterial
                color="#163b82"
                metalness={0.6}
                roughness={0.25}
                emissive="#102a64"
                emissiveIntensity={0.3}
              />
            </mesh>

            {[-0.65, 0, 0.65].map((line) => (
              <mesh key={line} position={[line, 0, 0.07]}>
                <boxGeometry args={[0.025, 1.24, 0.015]} />
                <meshStandardMaterial color="#7bdcff" />
              </mesh>
            ))}

            <mesh position={[0, 0, 0.07]}>
              <boxGeometry args={[1.96, 0.025, 0.015]} />
              <meshStandardMaterial color="#7bdcff" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// Small lunar rover
function Rover() {
  return (
    <group
      position={[-3, 0, 3.8]}
      rotation={[0, -0.45, 0]}
    >
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.4, 0.5, 0.85]} />
        <meshStandardMaterial color="#e8e6df" />
      </mesh>

      <mesh position={[-0.15, 0.98, 0]}>
        <boxGeometry args={[0.65, 0.4, 0.72]} />
        <meshStandardMaterial
          color="#8acdfa"
          emissive="#174c87"
          emissiveIntensity={0.35}
        />
      </mesh>

      {[-0.5, 0.5].flatMap((x) =>
        [-0.54, 0.54].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.28, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.26, 0.26, 0.16, 16]} />
            <meshStandardMaterial color="#202c43" />
          </mesh>
        ))
      )}

      <mesh position={[0.35, 1.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
        <meshStandardMaterial color="#e3e9f2" />
      </mesh>

      <mesh position={[0.35, 1.96, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color="#ffc86e"
          emissive="#ffad41"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// Our friendly astronaut
function Astronaut() {
  const astronaut = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (astronaut.current) {
      astronaut.current.position.y =
        Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
    }
  });

  return (
    <group
      ref={astronaut}
      position={[-1, 0, 3]}
      rotation={[0, 0.35, 0]}
    >
      {/* Backpack */}
      <mesh position={[0, 1, -0.28]}>
        <boxGeometry args={[0.65, 0.9, 0.36]} />
        <meshStandardMaterial color="#bdc9e2" />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.38, 0.55, 6, 14]} />
        <meshStandardMaterial color="#f6f5fa" />
      </mesh>

      {/* Helmet */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshStandardMaterial
          color="#f4f7ff"
          metalness={0.15}
        />
      </mesh>

      {/* Visor */}
      <mesh
        position={[0, 1.9, 0.4]}
        scale={[1, 0.75, 0.35]}
      >
        <sphereGeometry args={[0.43, 24, 20]} />
        <meshStandardMaterial
          color="#193d75"
          metalness={0.65}
          roughness={0.15}
        />
      </mesh>

      {/* Arms */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 1.08, 0]}>
          <capsuleGeometry args={[0.16, 0.48, 4, 8]} />
          <meshStandardMaterial color="#e9ecf8" />
        </mesh>
      ))}

      {/* Legs */}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]}>
          <capsuleGeometry args={[0.17, 0.4, 4, 8]} />
          <meshStandardMaterial color="#f6f5fa" />
        </mesh>
      ))}

      {/* Suit badge */}
      <mesh position={[0, 1.1, 0.4]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#67e4ee"
          emissive="#2995bc"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

function MoonWorld({
  onSelect,
}: {
  onSelect: SceneProps["onSelect"];
}) {
  return (
    <>
      <color attach="background" args={["#080e22"]} />

      <fog
        attach="fog"
        args={["#080e22", 27, 65]}
      />

      <ambientLight intensity={1.6} />

      <hemisphereLight
        color="#bcd3ff"
        groundColor="#252844"
        intensity={1.5}
      />

      <directionalLight
        position={[-5, 12, 7]}
        intensity={2.5}
        color="#fff0da"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <pointLight
        position={[5, 4, 2]}
        intensity={18}
        color="#a58dff"
        distance={14}
      />

      <Stars
        radius={80}
        depth={40}
        count={1400}
        factor={3}
        fade
        speed={0.35}
      />

      <Earth />
      <MoonGround />
      <Habitat onSelect={onSelect} />
      <Greenhouse onSelect={onSelect} />
      <SolarPanels onSelect={onSelect} />
      <Rover />
      <Astronaut />
    </>
  );
}


const cameraLocations = {
  overview: {
    position: [9, 6, 12],
    target: [0, 0.8, 0],
  },
  Habitat: {
    position: [4, 3.5, 6],
    target: [0.7, 1, -1],
  },
  Greenhouse: {
    position: [6.8, 3.2, 5],
    target: [4.3, 0.9, 1.4],
  },
  "Solar Panels": {
    position: [-6.5, 3.8, 5],
    target: [-3.6, 1, -1.3],
  },
  Rover: {
    position: [-5.5, 2.8, 7],
    target: [-3, 0.7, 3.8],
  },
} satisfies Record<
  string,
  { position: number[]; target: number[] }
>;

function CameraDirector({
  focus,
  controlsRef,
}: {
  focus: FocusTarget;
  controlsRef: React.RefObject<
    ComponentRef<typeof OrbitControls> | null
  >;
}) {
  const { camera } = useThree();
  const moving = useRef(true);

  const destination =
    cameraLocations[focus ?? "overview"];

  const targetPosition = new THREE.Vector3(
    ...(
      destination.position as [number, number, number]
    )
  );

  const targetLookAt = new THREE.Vector3(
    ...(destination.target as [number, number, number])
  );

  useEffect(() => {
    moving.current = true;
  }, [focus]);

  useFrame((_, delta) => {
    if (!moving.current || !controlsRef.current) {
      return;
    }

    // Frame-rate-independent smooth movement
    const speed = 1 - Math.exp(-2.8 * delta);

    camera.position.lerp(targetPosition, speed);

    controlsRef.current.target.lerp(
      targetLookAt,
      speed
    );

    controlsRef.current.update();

    const positionDone =
      camera.position.distanceTo(targetPosition) < 0.04;

    const lookAtDone =
      controlsRef.current.target.distanceTo(
        targetLookAt
      ) < 0.04;

    if (positionDone && lookAtDone) {
      moving.current = false;
    }
  });

  return null;
}


export default function LunarScene({
  explore,
  onSelect,
  focus = null,
}: SceneProps) {
  const controlsRef =
    useRef<ComponentRef<typeof OrbitControls>>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [9, 6, 12],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      <MoonWorld onSelect={onSelect} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        autoRotate={explore && focus === null}
        autoRotateSpeed={0.6}
        minDistance={3}
        maxDistance={22}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0.8, 0]}
      />

      <CameraDirector
        focus={focus}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}
