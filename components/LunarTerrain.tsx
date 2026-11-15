
"use client";

import { useMemo } from "react";
import * as THREE from "three";

function random(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function Crater({
  x,
  z,
  radius,
}: {
  x: number;
  z: number;
  radius: number;
}) {
  return (
    <group position={[x, 0, z]}>
      {/* Raised crater rim */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        castShadow
      >
        <torusGeometry args={[radius, radius * 0.16, 10, 40]} />
        <meshStandardMaterial
          color="#828a9b"
          roughness={1}
        />
      </mesh>

      {/* Dark crater interior */}
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[radius * 0.87, 40]} />
        <meshStandardMaterial
          color="#4f5669"
          roughness={1}
        />
      </mesh>
    </group>
  );
}

export default function LunarTerrain() {
  const rocks = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => {
        const angle = random(i + 1) * Math.PI * 2;
        const distance = 6 + random(i + 300) * 21;

        return {
          x: Math.cos(angle) * distance,
          z: Math.sin(angle) * distance,
          size: 0.1 + random(i + 500) * 0.48,
          rotation: random(i + 800) * Math.PI,
        };
      }),
    []
  );

  const craters = [
    { x: -10, z: -7, radius: 2 },
    { x: 10, z: 8, radius: 2.8 },
    { x: 3, z: -13, radius: 3.5 },
    { x: -12, z: 9, radius: 1.5 },
    { x: 15, z: -10, radius: 2.2 },
  ];

  return (
    <group>
      {/* Lunar surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.09, 0]}
      >
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial
          color="#737b89"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Crater formations */}
      {craters.map((crater, i) => (
        <Crater key={i} {...crater} />
      ))}

      {/* Scattered lunar rocks */}
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[
            rock.x,
            rock.size * 0.35,
            rock.z,
          ]}
          rotation={[0.2, rock.rotation, 0.1]}
          scale={[
            rock.size,
            rock.size * 0.65,
            rock.size * 0.85,
          ]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={
              i % 3 === 0
                ? "#9ca3b1"
                : i % 3 === 1
                  ? "#636b7c"
                  : "#858c9a"
            }
            roughness={1}
          />
        </mesh>
      ))}

      {/* Distant hills */}
      {[
        [-22, -28, 8],
        [5, -32, 11],
        [28, -24, 9],
        [-30, 7, 6],
      ].map(([x, z, scale], i) => (
        <mesh
          key={i}
          position={[x, -scale * 0.35, z]}
          scale={[scale * 2, scale, scale * 1.5]}
          receiveShadow
        >
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial
            color="#495267"
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
