
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function ApolloLander() {
  const { scene } = useGLTF(
    "/models/apollo-lunar-module.glb"
  );

  const model = useMemo(() => {
    const clone = scene.clone(true);

    // Keep the original model proportions.
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    bounds.getSize(size);
    bounds.getCenter(center);

    // Fit the model to approximately 2.8 scene units tall.
    const scale = 2.8 / Math.max(size.y, 0.001);

    clone.scale.setScalar(scale);

    // Center horizontally and place its bottom at ground level.
    clone.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale
    );

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  return (
    <group
      position={[7.2, 0, -3]}
      rotation={[0, -0.3, 0]}
    >
      {/* Landing area */}
      <mesh
        position={[0, 0.04, 0]}
        receiveShadow
      >
        <cylinderGeometry args={[2.6, 2.75, 0.08, 48]} />
        <meshStandardMaterial
          color="#596579"
          metalness={0.15}
          roughness={0.95}
        />
      </mesh>

      {/* NASA model */}
      <primitive object={model} />

      {/* Small landing-site light */}
      <pointLight
        position={[0, 2.8, 1]}
        color="#ffcc87"
        intensity={8}
        distance={6}
      />
    </group>
  );
}

useGLTF.preload("/models/apollo-lunar-module.glb");
