"use client";

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { useRef, useMemo, useEffect, useState } from "react";
import { 
  InstancedMesh, 
  Object3D, 
  Color, 
  Vector3, 
  BufferGeometry, 
  BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  Mesh,
  TorusGeometry,
  RingGeometry,
  Group
} from "three";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { motion, AnimatePresence } from "framer-motion";

// Player interface
interface Player {
  id: string;
  color: string;
}

interface BlockchainMatrix3DProps {
  players: Player[];
  isActive?: boolean;
  playerCount?: number;
}

// Perlin-like noise
function noise3D(x: number, y: number, z: number, time: number): number {
  return (
    Math.sin(x * 0.5 + time) * 
    Math.cos(y * 0.5 + time * 0.7) * 
    Math.sin(z * 0.5 + time * 0.5)
  );
}

// Matrix configuration
const MATRIX_CONFIG = {
  gridSize: { x: 18, y: 12, z: 25 }, // 5400 cubes
  spacing: 2.8,
  cubeSize: 0.9,
  defaultColor: "#00FFFF",
  glowIntensity: 3.0,
};

// Holographic ring shader
const HolographicRingShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float dist = length(vUv - 0.5);
      float ring = smoothstep(0.45, 0.48, dist) * smoothstep(0.52, 0.49, dist);
      
      // Scanning lines
      float scan = sin(vUv.y * 50.0 + time * 5.0) * 0.5 + 0.5;
      
      // Data glitches
      float glitch = step(0.95, sin(vUv.x * 100.0 + time * 10.0));
      
      float alpha = ring * (0.7 + scan * 0.3 + glitch * 0.5) * opacity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

// Holographic ring component for player join
function HolographicRing({ position, color, scale = 1 }: { position: Vector3; color: string; scale?: number }) {
  const ringRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  
  const shaderMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(color) },
        opacity: { value: 1.0 }
      },
      vertexShader: HolographicRingShader.vertexShader,
      fragmentShader: HolographicRingShader.fragmentShader,
      transparent: true,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
  }, [color]);
  
  useFrame((state, delta) => {
    if (!ringRef.current) return;
    
    timeRef.current += delta;
    shaderMaterial.uniforms.time.value = timeRef.current;
    
    // Rotate the ring
    ringRef.current.rotation.x = timeRef.current * 0.5;
    ringRef.current.rotation.y = timeRef.current * 0.7;
    
    // Pulse scale
    const pulse = 1 + Math.sin(timeRef.current * 3) * 0.1;
    ringRef.current.scale.setScalar(scale * pulse);
  });
  
  return (
    <mesh ref={ringRef} position={position} material={shaderMaterial}>
      <ringGeometry args={[1.5, 2, 32]} />
    </mesh>
  );
}

// Player join effect component
function PlayerJoinEffect({ cubeIndex, color, onComplete }: { cubeIndex: number; color: string; onComplete: () => void }) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const [isActive, setIsActive] = useState(true);
  
  // Calculate position from cube index
  const position = useMemo(() => {
    const { gridSize, spacing } = MATRIX_CONFIG;
    const x = cubeIndex % gridSize.x;
    const y = Math.floor(cubeIndex / gridSize.x) % gridSize.y;
    const z = Math.floor(cubeIndex / (gridSize.x * gridSize.y));
    
    return new Vector3(
      (x - gridSize.x / 2) * spacing,
      (y - gridSize.y / 2) * spacing,
      (z - gridSize.z / 2) * spacing
    );
  }, [cubeIndex]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    // Fade out after 2.5 seconds
    if (time > 2.5) {
      groupRef.current.scale.setScalar(1 - (time - 2.5) * 2);
    }
  });
  
  if (!isActive) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Multiple holographic rings */}
      <HolographicRing position={new Vector3(0, 0, 0)} color={color} scale={1} />
      <HolographicRing position={new Vector3(0, 0, 0)} color={color} scale={1.5} />
      <HolographicRing position={new Vector3(0, 0, 0)} color={color} scale={2} />
      
      {/* Electric particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 3;
        const pos = new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );
        
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// Enhanced cube instances with player join animations
function EnhancedCubeInstances({ players, isActive }: BlockchainMatrix3DProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const [assignedCubes, setAssignedCubes] = useState<Map<string, number>>(new Map());
  const [joinEffects, setJoinEffects] = useState<Array<{ cubeIndex: number; color: string; id: string }>>([]);
  const prevPlayerCountRef = useRef(0);
  
  const totalCubes = MATRIX_CONFIG.gridSize.x * MATRIX_CONFIG.gridSize.y * MATRIX_CONFIG.gridSize.z;
  
  // Generate cube positions with organic distribution
  const cubeData = useMemo(() => {
    const data: { position: Vector3; offset: Vector3; baseRotation: Vector3 }[] = [];
    const { gridSize, spacing } = MATRIX_CONFIG;
    
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const position = new Vector3(
            (x - gridSize.x / 2) * spacing,
            (y - gridSize.y / 2) * spacing,
            (z - gridSize.z / 2) * spacing
          );
          
          const offset = new Vector3(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );
          
          const baseRotation = new Vector3(
            Math.random() * 0.02 - 0.01,
            Math.random() * 0.02 - 0.01,
            Math.random() * 0.02 - 0.01
          );
          
          data.push({ position, offset, baseRotation });
        }
      }
    }
    
    return data;
  }, []);

  // Detect new players and trigger join effects
  useEffect(() => {
    if (players.length > prevPlayerCountRef.current) {
      const newPlayers = players.slice(prevPlayerCountRef.current);
      const newAssignments = new Map(assignedCubes);
      const newEffects: Array<{ cubeIndex: number; color: string; id: string }> = [];
      
      newPlayers.forEach((player) => {
        if (!newAssignments.has(player.id)) {
          // Find a free cube
          let cubeIndex;
          do {
            cubeIndex = Math.floor(Math.random() * totalCubes);
          } while (Array.from(newAssignments.values()).includes(cubeIndex));
          
          newAssignments.set(player.id, cubeIndex);
          newEffects.push({ cubeIndex, color: player.color, id: player.id });
        }
      });
      
      setAssignedCubes(newAssignments);
      setJoinEffects(prev => [...prev, ...newEffects]);
    }
    
    prevPlayerCountRef.current = players.length;
  }, [players, totalCubes, assignedCubes]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    const dummy = new Object3D();
    const defaultColor = new Color(MATRIX_CONFIG.defaultColor);
    
    cubeData.forEach((cube, i) => {
      const { position, offset, baseRotation } = cube;
      
      // Perlin noise wave
      const waveX = noise3D(position.x * 0.08, position.y * 0.08, position.z * 0.08, time * 0.3) * 0.4;
      const waveY = noise3D(position.x * 0.08, position.y * 0.08 + 100, position.z * 0.08, time * 0.25) * 0.4;
      const waveZ = noise3D(position.x * 0.08, position.y * 0.08, position.z * 0.08 + 100, time * 0.28) * 0.4;
      
      dummy.position.set(
        position.x + waveX + Math.sin(time * 0.5 + offset.x) * 0.15,
        position.y + waveY + Math.cos(time * 0.4 + offset.y) * 0.15,
        position.z + waveZ + Math.sin(time * 0.45 + offset.z) * 0.15
      );
      
      // Unique slow rotation
      dummy.rotation.x += baseRotation.x;
      dummy.rotation.y += baseRotation.y;
      dummy.rotation.z += baseRotation.z;
      
      // Asynchronous pulse
      const pulse = 1 + Math.sin(time * 1.5 + offset.x * 10) * 0.08;
      dummy.scale.setScalar(MATRIX_CONFIG.cubeSize * pulse);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Color and emissive intensity
      let color = defaultColor.clone();
      let emissiveIntensity = 1.0;
      
      assignedCubes.forEach((cubeIndex, playerId) => {
        if (cubeIndex === i) {
          const player = players.find(p => p.id === playerId);
          if (player) {
            color = new Color(player.color);
            emissiveIntensity = 2.5 + Math.sin(time * 3 + offset.x) * 0.5;
          }
        }
      });
      
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, totalCubes]}>
        <boxGeometry args={[1, 1, 1]}>
          <bufferAttribute attach="attributes-position" />
        </boxGeometry>
        <meshPhysicalMaterial
          color={MATRIX_CONFIG.defaultColor}
          emissive={MATRIX_CONFIG.defaultColor}
          emissiveIntensity={MATRIX_CONFIG.glowIntensity}
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.9}
          transmission={0.5}
          thickness={0.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </instancedMesh>
      
      {/* Player join effects */}
      {joinEffects.map((effect) => (
        <PlayerJoinEffect
          key={effect.id}
          cubeIndex={effect.cubeIndex}
          color={effect.color}
          onComplete={() => {
            setJoinEffects(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}
    </>
  );
}

// Enhanced connection lines with data packets
function EnhancedConnectionLines() {
  const linesRef = useRef<any>(null);
  const timeRef = useRef(0);
  
  const { gridSize, spacing } = MATRIX_CONFIG;
  
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const defaultColor = new Color(MATRIX_CONFIG.defaultColor);
    
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const pos = new Vector3(
            (x - gridSize.x / 2) * spacing,
            (y - gridSize.y / 2) * spacing,
            (z - gridSize.z / 2) * spacing
          );
          
          // Connect to neighbors
          if (x < gridSize.x - 1) {
            positions.push(pos.x, pos.y, pos.z);
            positions.push(pos.x + spacing, pos.y, pos.z);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
          }
          if (y < gridSize.y - 1) {
            positions.push(pos.x, pos.y, pos.z);
            positions.push(pos.x, pos.y + spacing, pos.z);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
          }
          if (z < gridSize.z - 1) {
            positions.push(pos.x, pos.y, pos.z);
            positions.push(pos.x, pos.y, pos.z + spacing);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
          }
        }
      }
    }
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
    
    return geometry;
  }, [gridSize, spacing]);

  useFrame((state, delta) => {
    timeRef.current += delta;
  });

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.25}
        linewidth={1}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
}

// Data packets with trails
function DataPackets() {
  const particlesRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const particleCount = 800;
  
  const particleData = useMemo(() => {
    const { gridSize, spacing } = MATRIX_CONFIG;
    
    return Array.from({ length: particleCount }, () => {
      const startX = Math.floor(Math.random() * gridSize.x);
      const startY = Math.floor(Math.random() * gridSize.y);
      const startZ = Math.floor(Math.random() * gridSize.z);
      
      const direction = Math.floor(Math.random() * 3); // 0=x, 1=y, 2=z
      
      return {
        startPos: new Vector3(
          (startX - gridSize.x / 2) * spacing,
          (startY - gridSize.y / 2) * spacing,
          (startZ - gridSize.z / 2) * spacing
        ),
        direction,
        speed: Math.random() * 0.5 + 0.3,
        offset: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    const dummy = new Object3D();
    const color = new Color(MATRIX_CONFIG.defaultColor);
    
    particleData.forEach((particle, i) => {
      const t = ((time * particle.speed + particle.offset) % (Math.PI * 2)) / (Math.PI * 2);
      const distance = MATRIX_CONFIG.spacing * 3;
      
      const pos = particle.startPos.clone();
      
      if (particle.direction === 0) {
        pos.x += Math.sin(t * Math.PI * 2) * distance;
      } else if (particle.direction === 1) {
        pos.y += Math.sin(t * Math.PI * 2) * distance;
      } else {
        pos.z += Math.sin(t * Math.PI * 2) * distance;
      }
      
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.08 + Math.sin(t * Math.PI) * 0.04);
      
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
      
      const brightness = 0.5 + Math.sin(t * Math.PI) * 0.5;
      color.multiplyScalar(brightness);
      particlesRef.current!.setColorAt(i, color);
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) {
      particlesRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshBasicMaterial
        color={MATRIX_CONFIG.defaultColor}
        transparent
        opacity={0.9}
        blending={AdditiveBlending}
      />
    </instancedMesh>
  );
}

// Camera with smooth orbital movement
function CameraRig() {
  const { camera } = useThree();
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    const radius = 70;
    const height = 15;
    
    camera.position.x = Math.sin(time * 0.08) * radius;
    camera.position.z = Math.cos(time * 0.08) * radius;
    camera.position.y = height + Math.sin(time * 0.05) * 8;
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Main scene
function Scene({ players, isActive }: BlockchainMatrix3DProps) {
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.15} color="#001a33" />
      <pointLight position={[0, 30, 0]} intensity={2} color="#00FFFF" distance={100} />
      <pointLight position={[30, 10, 30]} intensity={1.5} color="#DC1FFF" distance={80} />
      <pointLight position={[-30, 10, -30]} intensity={1.5} color="#00FFA3" distance={80} />
      <pointLight position={[0, -20, 0]} intensity={0.8} color="#0066FF" distance={60} />
      
      {/* Matrix components */}
      <EnhancedCubeInstances players={players} isActive={isActive} />
      <EnhancedConnectionLines />
      <DataPackets />
      
      {/* Camera */}
      <CameraRig />
      
      {/* Post-processing */}
      <EffectComposer multisampling={8}>
        <Bloom
          intensity={3.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.ADD}
          radius={0.8}
        />
        <ChromaticAberration
          offset={[0.002, 0.002]}
          blendFunction={BlendFunction.NORMAL}
        />
        <Vignette
          offset={0.3}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

// Main export
export default function BlockchainMatrix3DAdvanced({ 
  players = [], 
  isActive = false,
  playerCount = 0 
}: BlockchainMatrix3DProps) {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Reflective floor gradient */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)"
        }}
      />
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [60, 25, 60], fov: 65, near: 0.1, far: 1000 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000814", 40, 120]} />
        
        <Scene players={players} isActive={isActive} />
      </Canvas>
      
      {/* Digital fog overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,255,255,0.03) 40%, rgba(0,0,0,0.7) 100%)",
          mixBlendMode: "screen"
        }}
      />
      
      {/* Scanlines effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)"
        }}
      />
    </div>
  );
}
