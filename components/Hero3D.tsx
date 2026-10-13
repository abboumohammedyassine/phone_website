"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Line } from "@react-three/drei";
import * as THREE from "three";

// Signature element: a floating device orbited by a ring of nodes + lines,
// literally representing a delivery network (Yalidine's wilaya coverage)
// wrapping around the product. Ties "tech product" + "nationwide delivery"
// into one image instead of a generic spinning sphere.

function Device() {
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
      <group rotation={[0.15, -0.4, 0.05]}>
        {/* Body */}
        <RoundedBox args={[1.4, 2.9, 0.14]} radius={0.16} smoothness={6}>
          <meshStandardMaterial color="#14171C" metalness={0.6} roughness={0.25} />
        </RoundedBox>
        {/* Screen */}
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[1.22, 2.62]} />
          <meshStandardMaterial
            color="#0B0D10"
            emissive="#F2A63A"
            emissiveIntensity={0.18}
            metalness={0.2}
            roughness={0.4}
          />
        </mesh>
        {/* Screen accent line */}
        <mesh position={[0, -1.1, 0.078]}>
          <planeGeometry args={[0.5, 0.035]} />
          <meshStandardMaterial color="#4DE8E0" emissive="#4DE8E0" emissiveIntensity={1.4} />
        </mesh>
      </group>
    </Float>
  );
}

function NetworkRing() {
  const groupRef = useRef<THREE.Group>(null);
  const nodeCount = 14;

  const nodes = useMemo(() => {
    return new Array(nodeCount).fill(0).map((_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.5 + (i % 3 === 0 ? 0.35 : 0);
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.55,
        Math.sin(angle * 2) * 0.6
      );
    });
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[i % 3 === 0 ? 0.05 : 0.03, 12, 12]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#F2A63A" : "#4DE8E0"}
            emissive={i % 3 === 0 ? "#F2A63A" : "#4DE8E0"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
      <Line
        points={[...nodes, nodes[0]]}
        color="#4DE8E0"
        transparent
        opacity={0.18}
        lineWidth={1}
      />
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.8]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 4]} intensity={40} color="#F2A63A" />
        <pointLight position={[-4, -2, 3]} intensity={25} color="#4DE8E0" />
        <Suspense fallback={null}>
          <Device />
          <NetworkRing />
        </Suspense>
      </Canvas>
    </div>
  );
}
