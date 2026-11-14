
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type LunarHabitatProps = {
  onSelect: () => void;
  power?: number;
};

function Window({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.62, 0.56, 0.09]} />
        <meshStandardMaterial
          color="#263b55"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[0.48, 0.4, 0.025]} />
        <meshStandardMaterial
          color="#8ddfff"
          emissive="#38a2d3"
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.14}
        />
      </mesh>
    </group>
  );
}

export default function LunarHabitat({
  onSelect,
  power = 90,
}: LunarHabitatProps) {
  const warning = useRef<THREE.Mesh>(null);
  const isLowPower = power <= 30;

  useFrame(({ clock }) => {
    if (!warning.current) return;

    const material = warning.current
      .material as THREE.MeshStandardMaterial;

    material.emissiveIntensity = isLowPower
      ? 1 + Math.sin(clock.elapsedTime * 7) * 0.8
      : 0.35;
  });

  return (
    <group
      position={[0.7, 0, -1]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {/* Landing foundation */}
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.15, 3.35, 0.32, 48]} />
        <meshStandardMaterial
          color="#4c596d"
          metalness={0.45}
          roughness={0.7}
        />
      </mesh>

      {/* Support legs */}
      {[
        [-1.65, 0, -1],
        [1.65, 0, -1],
        [-1.65, 0, 1],
        [1.65, 0, 1],
      ].map(([x, y, z], index) => (
        <mesh
          key={index}
          position={[x, y + 0.48, z]}
          castShadow
        >
          <cylinderGeometry args={[0.11, 0.15, 0.65, 12]} />
          <meshStandardMaterial
            color="#879bb0"
            metalness={0.75}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Main habitat body */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 2.05, 2.85]} />
        <meshStandardMaterial
          color="#c4cdd7"
          metalness={0.45}
          roughness={0.38}
        />
      </mesh>

      {/* Upper roof */}
      <mesh position={[0, 2.49, 0]} castShadow>
        <boxGeometry args={[4.85, 0.26, 3.05]} />
        <meshStandardMaterial
          color="#566b81"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Raised roof housing */}
      <mesh position={[0, 2.78, -0.15]} castShadow>
        <boxGeometry args={[2.6, 0.36, 1.9]} />
        <meshStandardMaterial
          color="#899bad"
          metalness={0.65}
          roughness={0.36}
        />
      </mesh>

      {/* Exterior metal reinforcement */}
      {[-1.85, -0.95, 0.95, 1.85].map((x) => (
        <mesh key={x} position={[x, 1.35, 1.47]}>
          <boxGeometry args={[0.09, 2.1, 0.14]} />
          <meshStandardMaterial
            color="#53677c"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Panoramic front windows */}
      <Window position={[-1.3, 1.68, 1.48]} />
      <Window position={[0, 1.68, 1.48]} />
      <Window position={[1.3, 1.68, 1.48]} />

      {/* Airlock entrance */}
      <group position={[0, 0.7, 1.64]}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 1.55, 0.55]} />
          <meshStandardMaterial
            color="#526880"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0, 0.29]}>
          <boxGeometry args={[1.03, 1.3, 0.07]} />
          <meshStandardMaterial
            color="#a9c1d2"
            metalness={0.6}
            roughness={0.34}
          />
        </mesh>

        <mesh position={[0, 0.23, 0.35]}>
          <boxGeometry args={[0.62, 0.3, 0.025]} />
          <meshStandardMaterial
            color="#143650"
            emissive="#2ac2d5"
            emissiveIntensity={0.7}
          />
        </mesh>

        <mesh position={[0.36, -0.3, 0.35]}>
          <boxGeometry args={[0.09, 0.22, 0.03]} />
          <meshStandardMaterial
            color="#ffc477"
            emissive="#ffad42"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* Entrance stairs */}
      {[0, 1, 2].map((step) => (
        <mesh
          key={step}
          position={[0, 0.16 + step * 0.11, 2.55 - step * 0.19]}
          castShadow
        >
          <boxGeometry
            args={[1.4, 0.12, 0.38]}
          />
          <meshStandardMaterial color="#8492a5" />
        </mesh>
      ))}

      {/* Roof antenna */}
      <mesh position={[1.7, 3.35, -0.6]}>
        <cylinderGeometry args={[0.035, 0.06, 1.4, 12]} />
        <meshStandardMaterial
          color="#d5e4ee"
          metalness={0.85}
        />
      </mesh>

      <mesh position={[1.7, 4.05, -0.6]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial
          color="#7ce3ff"
          emissive="#32a8f0"
          emissiveIntensity={1.7}
        />
      </mesh>

      {/* Status indicator */}
      <mesh
        ref={warning}
        position={[-1.9, 2.7, 1.25]}
      >
        <sphereGeometry args={[0.17, 20, 16]} />
        <meshStandardMaterial
          color={isLowPower ? "#ff4056" : "#57efb3"}
          emissive={isLowPower ? "#ff1438" : "#29c88c"}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Warm light around entrance */}
      <pointLight
        position={[0, 1.45, 2.4]}
        color="#ffc98c"
        intensity={power <= 15 ? 1 : 5}
        distance={5}
        decay={2}
      />

      {/* Ground-level guide lights */}
      {[-2.6, 2.6].map((x) => (
        <group key={x} position={[x, 0.35, 1.8]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.18, 0.4, 12]} />
            <meshStandardMaterial color="#485a70" />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial
              color="#ffcf83"
              emissive="#ffae54"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
