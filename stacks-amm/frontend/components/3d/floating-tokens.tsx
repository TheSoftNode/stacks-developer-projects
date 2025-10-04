"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Torus, Box, Sphere, MeshTransmissionMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

// Liquidity Pool Ring - represents the AMM pool
function LiquidityPool({ position, color }: { position: [number, number, number]; color: string }) {
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torusRef.current) {
      torusRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      torusRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <Torus ref={torusRef} args={[1.5, 0.3, 32, 100]} position={position}>
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Torus>
    </Float>
  );
}

// Token Cube - represents different SIP-010 tokens
function TokenCube({ position, color }: { position: [number, number, number]; color: string }) {
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (boxRef.current) {
      boxRef.current.rotation.x = state.clock.getElapsedTime() * 0.4;
      boxRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Box ref={boxRef} args={[1, 1, 1]} position={position}>
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Box>
    </Float>
  );
}

// Swap Arrow/Cone - represents token swaps
function SwapIndicator({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      ref.current.position.x = position[0] + Math.sin(state.clock.getElapsedTime()) * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[0, 0, Math.PI / 2]}>
      <coneGeometry args={[0.3, 1, 4]} />
      <meshStandardMaterial color="#14b8a6" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

// Glass Sphere - represents liquidity/value
function LiquiditySphere({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere args={[0.8, 64, 64]} position={position}>
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={512}
          transmission={1}
          roughness={0.1}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.1}
          anisotropy={0.3}
          color={color}
        />
      </Sphere>
    </Float>
  );
}

export function FloatingTokens() {
  return (
    <>
      {/* Lighting setup for dramatic effect */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#14b8a6" />
      <pointLight position={[10, -10, -5]} intensity={0.6} color="#ea580c" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={1} color="#10b981" />

      {/* Center Liquidity Pool Ring - Orange (main AMM pool) */}
      <LiquidityPool position={[0, 0, 0]} color="#ea580c" />

      {/* Token Cubes - different tokens in the ecosystem */}
      <TokenCube position={[-3, 1.5, -1]} color="#14b8a6" />
      <TokenCube position={[3, 1.5, -1]} color="#10b981" />

      {/* Glass Spheres - representing liquidity */}
      <LiquiditySphere position={[-2, -1.5, 1]} color="#0ea5e9" />
      <LiquiditySphere position={[2, -1.5, 1]} color="#8b5cf6" />

      {/* Swap Indicators - showing token exchange */}
      <SwapIndicator position={[-1, 0, 2]} />
      <SwapIndicator position={[1, 0, 2]} />
    </>
  );
}
