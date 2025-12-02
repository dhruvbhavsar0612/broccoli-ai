"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useVoiceChatStore } from "@/lib/store";

// Shared refs for real-time audio data (avoids React re-renders)
const audioDataRef = {
  level: 0,
  peak: 0,
  bands: {
    sub: 0,
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    presence: 0,
  },
  targetLevel: 0,
  targetBands: {
    sub: 0,
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    presence: 0,
  },
};

// Smooth interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Easing function for smoother transitions
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function CosmicSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);

  const { appState } = useVoiceChatStore();

  // Create gradient colors for the cosmic effect
  const colors = useMemo(
    () => ({
      idle: new THREE.Color(0x2d3748),
      listening: new THREE.Color(0x6366f1),
      thinking: new THREE.Color(0x8b5cf6),
      speaking: new THREE.Color(0x06b6d4),
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
    const dt = Math.min(state.clock.getDelta(), 0.1);

    // Smooth interpolation of audio data
    const smoothFactor = 1 - Math.pow(0.001, dt);
    audioDataRef.level = lerp(
      audioDataRef.level,
      audioDataRef.targetLevel,
      smoothFactor * 0.5,
    );
    audioDataRef.peak = Math.max(audioDataRef.level, audioDataRef.peak * 0.98);

    // Smooth bands
    const bandKeys = ["sub", "bass", "low", "mid", "high", "presence"] as const;
    for (const key of bandKeys) {
      audioDataRef.bands[key] = lerp(
        audioDataRef.bands[key],
        audioDataRef.targetBands[key],
        smoothFactor * 0.4,
      );
    }

    const { level, peak, bands } = audioDataRef;

    // Base rotation - calm and continuous
    const baseRotationSpeed =
      appState === "idle" ? 0.1 : appState === "thinking" ? 0.3 : 0.15;
    meshRef.current.rotation.y += baseRotationSpeed * dt * 2;

    if (appState === "idle") {
      meshRef.current.rotation.x = Math.sin(time * 0.15) * 0.08;
      meshRef.current.rotation.z = Math.cos(time * 0.15) * 0.08;
    } else if (appState === "thinking") {
      meshRef.current.rotation.x = Math.sin(time * 0.4) * 0.15;
      meshRef.current.rotation.z = Math.cos(time * 0.4) * 0.15;
    }

    // Dramatic chaotic movement when listening - reactive to frequency bands
    if (appState === "listening") {
      const bassImpact = bands.bass * 1.5;
      const midImpact = bands.mid * 1.2;
      const highImpact = bands.high * 0.8;

      meshRef.current.rotation.x +=
        Math.sin(time * 8 + bassImpact * 10) * bassImpact * 0.12;
      meshRef.current.rotation.y +=
        Math.cos(time * 6 + midImpact * 8) * midImpact * 0.1;
      meshRef.current.rotation.z +=
        Math.sin(time * 10 + highImpact * 12) * highImpact * 0.08;
    }

    // Active movement when speaking
    if (appState === "speaking") {
      const speakingIntensity = 0.5 + level * 0.5;
      meshRef.current.rotation.x +=
        Math.sin(time * 4) * 0.04 * speakingIntensity;
      meshRef.current.rotation.y +=
        Math.cos(time * 3) * 0.04 * speakingIntensity;
      meshRef.current.rotation.z +=
        Math.sin(time * 3.5) * 0.04 * speakingIntensity;
    }

    // Smooth color transitions
    const targetColor = colors[appState];
    const targetEmissive = emissiveColors[appState];
    materialRef.current.color.lerp(targetColor, 0.08);
    materialRef.current.emissive.lerp(targetEmissive, 0.08);

    // Enhanced distortion based on frequency bands
    if (appState === "listening") {
      // Bass drives the main distortion
      const bassDistort = 0.3 + bands.bass * 0.6 + bands.sub * 0.3;
      // Mids and highs add complexity
      const complexDistort = bands.mid * 0.2 + bands.high * 0.15;
      materialRef.current.distort = bassDistort + complexDistort + level * 0.3;
      materialRef.current.speed = 3 + bands.mid * 4 + bands.high * 3;
      materialRef.current.emissiveIntensity =
        0.6 + bands.bass * 0.4 + peak * 0.3;
    } else if (appState === "thinking") {
      materialRef.current.distort = 0.3 + Math.sin(time * 2) * 0.15;
      materialRef.current.speed = 2.5;
      materialRef.current.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.2;
    } else if (appState === "speaking") {
      const speakingPulse = Math.sin(time * 4) * 0.2;
      materialRef.current.distort = 0.35 + speakingPulse + level * 0.2;
      materialRef.current.speed = 3 + level * 2;
      materialRef.current.emissiveIntensity = 0.7 + Math.sin(time * 2.5) * 0.2;
    } else {
      materialRef.current.distort = 0.2;
      materialRef.current.speed = 1.2;
      materialRef.current.emissiveIntensity = 0.4;
    }

    // Dramatic scale pulse based on state and audio
    let pulseScale = 1;
    if (appState === "listening") {
      // Bass creates the main pulse
      const bassPulse = bands.bass * 0.25;
      // Sub adds weight
      const subPulse = bands.sub * 0.15;
      // Peak creates sharp accents
      const peakPulse = peak * 0.1;
      // High frequencies add shimmer
      const shimmer = Math.sin(time * 8) * bands.high * 0.05;

      pulseScale = 1 + bassPulse + subPulse + peakPulse + shimmer;
    } else if (appState === "thinking") {
      pulseScale = 1 + Math.sin(time * 1.5) * 0.08;
    } else if (appState === "speaking") {
      pulseScale = 1 + Math.sin(time * 2) * 0.1 + level * 0.05;
    } else {
      pulseScale = 1 + Math.sin(time * 1) * 0.04;
    }

    meshRef.current.scale.setScalar(pulseScale);

    // Update inner glow
    if (innerGlowRef.current) {
      const glowScale =
        appState === "listening"
          ? 0.85 + bands.bass * 0.1
          : appState === "speaking"
            ? 0.87 + level * 0.05
            : 0.85;
      innerGlowRef.current.scale.setScalar(glowScale * pulseScale);
    }
  });

  return (
    <group>
      {/* Inner glow sphere */}
      <Sphere ref={innerGlowRef} args={[0.85, 64, 64]}>
        <meshBasicMaterial
          color={colors.listening}
          transparent
          opacity={0.15}
        />
      </Sphere>

      {/* Main sphere */}
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
    </group>
  );
}

function FrequencyRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const ringMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const { appState } = useVoiceChatStore();

  const ringCount = 5;
  const ringColors = useMemo(
    () => [
      new THREE.Color(0x6366f1), // Indigo - bass
      new THREE.Color(0x8b5cf6), // Purple - low
      new THREE.Color(0xa855f7), // Light purple - mid
      new THREE.Color(0x06b6d4), // Cyan - high
      new THREE.Color(0x22d3ee), // Light cyan - presence
    ],
    [],
  );

  useFrame((state) => {
    if (!ringsRef.current) return;

    const time = state.clock.getElapsedTime();
    const { bands, level } = audioDataRef;
    const bandValues = [
      bands.bass,
      bands.low,
      bands.mid,
      bands.high,
      bands.presence,
    ];

    ringsRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh;
      const bandValue = bandValues[i] || 0;
      const baseScale = 1.3 + i * 0.25;

      if (appState === "listening") {
        // Rings expand based on their frequency band
        const expansion = bandValue * 0.4;
        const pulse =
          Math.sin(time * (3 + i) + i * 0.5) * 0.05 * (1 + bandValue);
        mesh.scale.setScalar(baseScale + expansion + pulse);

        // Rotate rings at different speeds
        mesh.rotation.z = time * (0.2 + i * 0.1) * (1 + bandValue * 0.5);
        mesh.rotation.x = Math.sin(time * 0.5 + i) * 0.2;

        // Update opacity based on band intensity
        if (ringMaterialsRef.current[i]) {
          ringMaterialsRef.current[i].opacity = 0.15 + bandValue * 0.4;
        }
      } else if (appState === "speaking") {
        const speakPulse = Math.sin(time * 2 + i * 0.8) * 0.1;
        mesh.scale.setScalar(baseScale + speakPulse + level * 0.1);
        mesh.rotation.z = time * 0.15;
        mesh.rotation.x = Math.sin(time * 0.3 + i) * 0.1;

        if (ringMaterialsRef.current[i]) {
          ringMaterialsRef.current[i].opacity = 0.1 + level * 0.15;
        }
      } else if (appState === "thinking") {
        const thinkPulse = Math.sin(time * 1.5 + i * 0.6) * 0.08;
        mesh.scale.setScalar(baseScale + thinkPulse);
        mesh.rotation.z = time * 0.1;

        if (ringMaterialsRef.current[i]) {
          ringMaterialsRef.current[i].opacity =
            0.08 + Math.sin(time * 2 + i) * 0.04;
        }
      } else {
        mesh.scale.setScalar(baseScale);
        mesh.rotation.z = time * 0.05;

        if (ringMaterialsRef.current[i]) {
          ringMaterialsRef.current[i].opacity = 0.05;
        }
      }
    });
  });

  return (
    <group ref={ringsRef}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3 + i * 0.25 - 0.02, 1.3 + i * 0.25, 64]} />
          <meshBasicMaterial
            ref={(el) => {
              if (el) ringMaterialsRef.current[i] = el;
            }}
            color={ringColors[i]}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { appState } = useVoiceChatStore();

  const particlesCount = 2000;
  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const basePos = new Float32Array(particlesCount * 3);
    const seed = 12345;
    let random = seed;

    const seededRandom = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };

    for (let i = 0; i < particlesCount; i++) {
      const radius = 2.5 + seededRandom() * 4;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(seededRandom() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;
    }
    return { positions: pos, basePositions: basePos };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const { bands, level, peak } = audioDataRef;

    // Update particle positions based on audio
    const positionAttribute = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    if (appState === "listening") {
      for (let i = 0; i < particlesCount; i++) {
        const baseX = basePositions[i * 3];
        const baseY = basePositions[i * 3 + 1];
        const baseZ = basePositions[i * 3 + 2];

        const dist = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
        const normalizedDist = (dist - 2.5) / 4;

        // Different frequency bands affect different distance ranges
        let expansion = 0;
        if (normalizedDist < 0.33) {
          expansion = bands.bass * 0.8 + bands.sub * 0.5;
        } else if (normalizedDist < 0.66) {
          expansion = bands.mid * 0.6 + bands.low * 0.4;
        } else {
          expansion = bands.high * 0.5 + bands.presence * 0.3;
        }

        // Add some noise
        const noise =
          Math.sin(time * 4 + i * 0.01) * 0.1 * level +
          Math.cos(time * 3 + i * 0.02) * 0.05 * peak;

        const scale = 1 + expansion * 0.5 + noise;

        positionAttribute.setXYZ(
          i,
          baseX * scale,
          baseY * scale,
          baseZ * scale,
        );
      }
      positionAttribute.needsUpdate = true;

      pointsRef.current.rotation.y = time * 0.15;
      pointsRef.current.rotation.x = Math.sin(time * 0.3) * 0.3;
    } else if (appState === "thinking") {
      pointsRef.current.rotation.y = time * 0.1;
      pointsRef.current.rotation.x = Math.sin(time * 0.2) * 0.25;
    } else {
      pointsRef.current.rotation.y = time * 0.05;
      pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.15;
    }

    // Update material properties
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (appState === "listening") {
      material.opacity = 0.5 + level * 0.4 + peak * 0.1;
      material.size = 0.03 + level * 0.03 + bands.high * 0.02;
    } else if (appState === "thinking") {
      material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
      material.size = 0.03 + Math.sin(time * 2) * 0.01;
    } else if (appState === "speaking") {
      material.opacity = 0.5 + Math.sin(time * 3) * 0.15 + level * 0.1;
      material.size = 0.035;
    } else {
      material.opacity = 0.3;
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
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function WaveformRing() {
  const ringRef = useRef<THREE.Line>(null);
  const { appState } = useVoiceChatStore();

  const segments = 128;
  const positions = useMemo(() => {
    const pos = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * 1.8;
      pos[i * 3 + 1] = Math.sin(angle) * 1.8;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ringRef.current) return;

    const time = state.clock.getElapsedTime();
    const { bands, level } = audioDataRef;

    const positionAttribute = ringRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const normalizedAngle = i / segments;

      let radiusOffset = 0;
      if (appState === "listening") {
        // Different parts of the ring respond to different frequencies
        const bandIndex = Math.floor(normalizedAngle * 6);
        const bandValues = [
          bands.sub,
          bands.bass,
          bands.low,
          bands.mid,
          bands.high,
          bands.presence,
        ];
        const bandValue = bandValues[bandIndex] || 0;

        radiusOffset =
          bandValue * 0.3 +
          Math.sin(time * 4 + i * 0.2) * level * 0.1 +
          Math.sin(time * 8 + i * 0.1) * bands.high * 0.05;
      } else if (appState === "speaking") {
        radiusOffset = Math.sin(time * 3 + i * 0.15) * 0.1 * (0.5 + level);
      } else if (appState === "thinking") {
        radiusOffset = Math.sin(time * 2 + i * 0.1) * 0.05;
      }

      const radius = 1.8 + radiusOffset;
      positionAttribute.setXYZ(
        i,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.sin(time + i * 0.1) * 0.1,
      );
    }
    positionAttribute.needsUpdate = true;

    ringRef.current.rotation.z = time * 0.1;

    // Update material
    const material = ringRef.current.material as THREE.LineBasicMaterial;
    if (appState === "listening") {
      material.opacity = 0.4 + level * 0.4;
    } else if (appState === "speaking") {
      material.opacity = 0.3 + level * 0.2;
    } else {
      material.opacity = 0.15;
    }
  });

  return (
    <line ref={ringRef as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={segments}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={0x06b6d4}
        transparent
        opacity={0.15}
        linewidth={2}
      />
    </line>
  );
}

// Audio data updater component
function AudioDataUpdater() {
  const { audioData, audioLevel } = useVoiceChatStore();

  useFrame(() => {
    // Update the shared ref with store data for smooth interpolation
    audioDataRef.targetLevel = audioData.isActive
      ? audioData.level
      : audioLevel;
    if (audioData.isActive && audioData.bands) {
      audioDataRef.targetBands = { ...audioData.bands };
    }
  });

  return null;
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
        dpr={[1, 2]}
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

        <AudioDataUpdater />
        <CosmicSphere />
        <FrequencyRings />
        <WaveformRing />
        <ParticleField />
      </Canvas>
    </div>
  );
}

// Export function to update audio data from external sources
export function updateRealtimeAudioData(data: {
  level: number;
  peak?: number;
  bands?: {
    sub: number;
    bass: number;
    low: number;
    mid: number;
    high: number;
    presence: number;
  };
}) {
  audioDataRef.targetLevel = data.level;
  if (data.peak !== undefined) {
    audioDataRef.peak = Math.max(audioDataRef.peak, data.peak);
  }
  if (data.bands) {
    audioDataRef.targetBands = { ...data.bands };
  }
}
