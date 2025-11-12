"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useVoiceChatStore } from "@/lib/store";

function CosmicSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);

  const { audioLevel, appState } = useVoiceChatStore();

  // Create gradient colors for the cosmic effect
  const colors = useMemo(
    () => ({
      idle: new THREE.Color(0x2d3748), // Darker Gray
      listening: new THREE.Color(0x6366f1), // Indigo
      thinking: new THREE.Color(0x8b5cf6), // Purple
      speaking: new THREE.Color(0x06b6d4), // Cyan
    }),
    [],
  );

  const emissiveColors = useMemo(
    () => ({
      idle: new THREE.Color(0x1a202c),
      listening: new THREE.Color(0x4338ca),
      thinking: new THREE.Color(0x6d28d9),
      speaking: new THREE.Color(0x0891b2),
    }),
    [],
  );

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.getElapsedTime();

    // Base rotation - calm and continuous
    if (appState === "idle") {
      meshRef.current.rotation.x = Math.sin(time * 0.15) * 0.08;
      meshRef.current.rotation.y = time * 0.1;
      meshRef.current.rotation.z = Math.cos(time * 0.15) * 0.08;
    } else if (appState === "thinking") {
      meshRef.current.rotation.x = Math.sin(time * 0.4) * 0.15;
      meshRef.current.rotation.y = time * 0.3;
      meshRef.current.rotation.z = Math.cos(time * 0.4) * 0.15;
    }

    // Dramatic chaotic movement when listening
    if (appState === "listening") {
      const intensity = audioLevel * 1.2;
      meshRef.current.rotation.x += Math.sin(time * 8) * intensity * 0.08;
      meshRef.current.rotation.y += Math.cos(time * 6) * intensity * 0.08;
      meshRef.current.rotation.z += Math.sin(time * 7) * intensity * 0.08;
    }

    // Active movement when speaking
    if (appState === "speaking") {
      meshRef.current.rotation.x += Math.sin(time * 4) * 0.04;
      meshRef.current.rotation.y += Math.cos(time * 3) * 0.04;
      meshRef.current.rotation.z += Math.sin(time * 3.5) * 0.04;
    }

    // Smooth color transitions
    const targetColor = colors[appState];
    const targetEmissive = emissiveColors[appState];
    materialRef.current.color.lerp(targetColor, 0.08);
    materialRef.current.emissive.lerp(targetEmissive, 0.08);

    // Dramatic distortion based on audio level and state
    if (appState === "listening") {
      materialRef.current.distort = 0.4 + audioLevel * 0.8;
      materialRef.current.speed = 3 + audioLevel * 5;
      materialRef.current.emissiveIntensity = 0.8 + audioLevel * 0.4;
    } else if (appState === "thinking") {
      materialRef.current.distort = 0.3 + Math.sin(time * 2) * 0.15;
      materialRef.current.speed = 2.5;
      materialRef.current.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.2;
    } else if (appState === "speaking") {
      materialRef.current.distort = 0.35 + Math.sin(time * 4) * 0.2;
      materialRef.current.speed = 3;
      materialRef.current.emissiveIntensity = 0.7 + Math.sin(time * 2.5) * 0.2;
    } else {
      materialRef.current.distort = 0.2;
      materialRef.current.speed = 1.2;
      materialRef.current.emissiveIntensity = 0.4;
    }

    // Dramatic scale pulse based on state
    let pulseScale = 1;
    if (appState === "listening") {
      pulseScale = 1 + audioLevel * 0.35 + Math.sin(time * 4) * 0.1;
    } else if (appState === "thinking") {
      pulseScale = 1 + Math.sin(time * 1.5) * 0.08;
    } else if (appState === "speaking") {
      pulseScale = 1 + Math.sin(time * 2) * 0.1;
    } else {
      pulseScale = 1 + Math.sin(time * 1) * 0.04;
    }
    meshRef.current.scale.setScalar(pulseScale);
  });

  return (
    <Sphere ref={meshRef} args={[1, 128, 128]}>
      <MeshDistortMaterial
        ref={materialRef}
        color={colors.idle}
        attach="material"
        distort={0.2}
        speed={1.2}
        roughness={0.2}
        metalness={0.9}
        emissive={emissiveColors.idle}
        emissiveIntensity={0.4}
      />
    </Sphere>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { appState, audioLevel } = useVoiceChatStore();

  const particlesCount = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const seed = 12345; // Deterministic seed for stable particle positions
    let random = seed;

    // Simple seeded random function
    const seededRandom = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };

    for (let i = 0; i < particlesCount; i++) {
      const radius = 2.5 + seededRandom() * 4;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(seededRandom() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();

    if (appState === "listening") {
      pointsRef.current.rotation.y = time * 0.15;
      pointsRef.current.rotation.x = Math.sin(time * 0.3) * 0.3;
    } else if (appState === "thinking") {
      pointsRef.current.rotation.y = time * 0.1;
      pointsRef.current.rotation.x = Math.sin(time * 0.2) * 0.25;
    } else {
      pointsRef.current.rotation.y = time * 0.05;
      pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.15;
    }

    // Dramatic opacity and size based on state
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (appState === "listening") {
      material.opacity = 0.7 + audioLevel * 0.3;
      material.size = 0.04 + audioLevel * 0.04;
    } else if (appState === "thinking") {
      material.opacity = 0.5 + Math.sin(time * 2) * 0.3;
      material.size = 0.035 + Math.sin(time * 2) * 0.015;
    } else if (appState === "speaking") {
      material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
      material.size = 0.04;
    } else {
      material.opacity = 0.35;
      material.size = 0.025;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={0x8b5cf6}
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function AudioVisualizer() {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#8b5cf6" />
        <pointLight position={[0, 10, -10]} intensity={0.8} color="#06b6d4" />
        <spotLight
          position={[0, 8, 0]}
          angle={0.6}
          penumbra={1}
          intensity={1.5}
          color="#6366f1"
        />

        <CosmicSphere />
        <ParticleField />
      </Canvas>
    </div>
  );
}
