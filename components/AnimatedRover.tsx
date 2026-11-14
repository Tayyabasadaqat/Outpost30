
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Wheel({
  x,
  z,
  spin,
}: {
  x: number;
  z: number;
  spin: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group position={[x, 0.4, z]} ref={spin}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.39, 0.39, 0.23, 24]} />
        <meshStandardMaterial
          color="#161c28"
          roughness={0.95}
        />
      </mesh>

      <mesh
        position={[x > 0 ? 0.13 : -0.13, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.19, 0.19, 0.025, 20]} />
        <meshStandardMaterial
          color="#879eb4"
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export default function AnimatedRover() {
  const rover = useRef<THREE.Group>(null);
  const wheel1 = useRef<THREE.Group>(null);
  const wheel2 = useRef<THREE.Group>(null);
  const wheel3 = useRef<THREE.Group>(null);
  const wheel4 = useRef<THREE.Group>(null);
  const wheel5 = useRef<THREE.Group>(null);
  const wheel6 = useRef<THREE.Group>(null);
  const cameraHead = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;

    if (rover.current) {
      // Slow autonomous drive and gentle steering
      rover.current.position.x =
        -3 + Math.sin(time * 0.25) * 0.9;

      rover.current.position.z =
        3.8 + Math.sin(time * 0.17) * 0.55;

      rover.current.rotation.y =
        -0.45 + Math.sin(time * 0.2) * 0.16;

      // Small suspension movement
      rover.current.position.y =
        Math.sin(time * 2) * 0.025;
    }

    const wheels = [
      wheel1,
      wheel2,
      wheel3,
      wheel4,
      wheel5,
      wheel6,
    ];

    wheels.forEach((wheel) => {
      if (wheel.current) {
        wheel.current.rotation.x -= delta * 0.65;
      }
    });

    if (cameraHead.current) {
      cameraHead.current.rotation.y =
        Math.sin(time * 0.55) * 0.45;
    }
  });

  return (
    <group
      ref={rover}
      position={[-3, 0, 3.8]}
      rotation={[0, -0.45, 0]}
    >
      {/* LOWER CHASSIS */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.75, 0.38, 2.35]} />
        <meshStandardMaterial
          color="#566a7e"
          metalness={0.75}
          roughness={0.38}
        />
      </mesh>

      {/* MAIN BODY */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.65, 0.7, 2.1]} />
        <meshStandardMaterial
          color="#e5eaf0"
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>

      {/* FRONT COCKPIT */}
      <mesh
        position={[0, 1.47, 0.65]}
        rotation={[-0.25, 0, 0]}
        castShadow
      >
        <boxGeometry args={[1.42, 0.8, 0.95]} />
        <meshStandardMaterial
          color="#19334d"
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>

      {/* WINDSHIELD */}
      <mesh
        position={[0, 1.53, 1.15]}
        rotation={[-0.25, 0, 0]}
      >
        <boxGeometry args={[1.22, 0.55, 0.035]} />
        <meshStandardMaterial
          color="#7cc4ed"
          emissive="#0e4772"
          emissiveIntensity={0.3}
          metalness={0.55}
          roughness={0.1}
        />
      </mesh>

      {/* ROOF */}
      <mesh position={[0, 1.91, 0.5]} castShadow>
        <boxGeometry args={[1.55, 0.12, 1.5]} />
        <meshStandardMaterial
          color="#d8e0e8"
          metalness={0.5}
        />
      </mesh>

      {/* SIDE DECORATIVE PANELS */}
      {[-0.84, 0.84].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.18, 0]}>
            <boxGeometry args={[0.06, 0.36, 1.8]} />
            <meshStandardMaterial
              color="#24649b"
              metalness={0.6}
            />
          </mesh>

          <mesh position={[x, 1.52, -0.4]}>
            <boxGeometry args={[0.065, 0.08, 0.7]} />
            <meshStandardMaterial
              color="#a3e8ff"
              emissive="#49b9ee"
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      ))}

      {/* SIX WHEELS */}
      <Wheel x={-1.03} z={-0.83} spin={wheel1} />
      <Wheel x={1.03} z={-0.83} spin={wheel2} />
      <Wheel x={-1.03} z={0} spin={wheel3} />
      <Wheel x={1.03} z={0} spin={wheel4} />
      <Wheel x={-1.03} z={0.83} spin={wheel5} />
      <Wheel x={1.03} z={0.83} spin={wheel6} />

      {/* SUSPENSION ARMS */}
      {[-1, 1].map((side) =>
        [-0.83, 0, 0.83].map((z) => (
          <mesh
            key={`${side}-${z}`}
            position={[side * 0.77, 0.57, z]}
            rotation={[0, 0, side * 0.35]}
          >
            <boxGeometry args={[0.68, 0.1, 0.12]} />
            <meshStandardMaterial color="#8a9cab" />
          </mesh>
        ))
      )}

      {/* FRONT HEADLIGHTS */}
      {[-0.53, 0.53].map((x) => (
        <group key={x} position={[x, 1.03, 1.2]}>
          <mesh>
            <boxGeometry args={[0.3, 0.16, 0.08]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#b9eaff"
              emissiveIntensity={2}
            />
          </mesh>

          <spotLight
            position={[0, 0, 0.12]}
            target-position={[0, -0.4, 4]}
            angle={0.45}
            intensity={12}
            distance={9}
            color="#b7e8ff"
          />
        </group>
      ))}

      {/* CAMERA MAST */}
      <mesh position={[0, 2.25, -0.5]}>
        <cylinderGeometry args={[0.05, 0.08, 0.75, 12]} />
        <meshStandardMaterial
          color="#b7cadc"
          metalness={0.75}
        />
      </mesh>

      <group
        ref={cameraHead}
        position={[0, 2.67, -0.5]}
      >
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.3, 0.36]} />
          <meshStandardMaterial color="#d5e0ea" />
        </mesh>

        {[-0.12, 0.12].map((x) => (
          <mesh
            key={x}
            position={[x, 0, 0.2]}
          >
            <cylinderGeometry args={[0.07, 0.07, 0.035, 16]} />
            <meshStandardMaterial
              color="#1b456b"
              emissive="#137cc0"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* ANTENNA */}
      <mesh position={[0.55, 2.3, -0.7]}>
        <cylinderGeometry args={[0.015, 0.025, 0.7, 8]} />
        <meshStandardMaterial color="#cbd8e4" />
      </mesh>

      <mesh position={[0.55, 2.67, -0.7]}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial
          color="#ffbf70"
          emissive="#ff9d38"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}
