"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
  DoubleSide
} from "three";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

// Player interface
interface Player {
  id: string;
  color: string;
}

interface BlockchainMatrix3DProps {
  players: Player[];
  isActive?: boolean;
}

// Perlin noise function for organic movement
function noise(x: number, y: number, z: number): number {
  return Math.sin(x * 0.5) * Math.cos(y * 0.5) * Math.sin(z * 0.5);
}

// Matrix configuration - massive scale
const MATRIX_CONFIG = {
  gridSize: { x: 20, y: 15, z: 30 }, // 9000 cubes total
  spacing: 2.5,
  cubeSize: 0.8,
  defaultColor: "#00FFFF", // Cyan neon
  glowIntensity: 2.5,
};

// Cube instances component
function CubeInstances({ players, isActive }: BlockchainMatrix3DProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const [assignedCubes, setAssignedCubes] = useState<Map<string, number>>(new Map());
  
  const totalCubes = MATRIX_CONFIG.gridSize.x * MATRIX_CONFIG.gridSize.y * MATRIX_CONFIG.gridSize.z;
  
  // Generate cube positions
  const cubeData = useMemo(() => {
    const data: { position: Vector3; offset: Vector3 }[] = [];
    const { gridSize, spacing } = MATRIX_CONFIG;
    
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const position = new Vector3(
            (x - gridSize.x / 2) * spacing,
            (y - gridSize.y / 2) * spacing,
            (z - gridSize.z / 2) * spacing
          );
          
          // Random offset for organic movement
          const offset = new Vector3(
            Math.random() * 0.5,
            Math.random() * 0.5,
            Math.random() * 0.5
          );
          
          data.push({ position, offset });
        }
      }
    }
    
    return data;
  }, []);

  // Assign cubes to new players
  useEffect(() => {
    const newAssignments = new Map(assignedCubes);
    
    players.forEach((player) => {
      if (!newAssignments.has(player.id)) {
        // Find a free cube
        let cubeIndex;
        do {
          cubeIndex = Math.floor(Math.random() * totalCubes);
        } while (Array.from(newAssignments.values()).includes(cubeIndex));
        
        newAssignments.set(player.id, cubeIndex);
      }
    });
    
    setAssignedCubes(newAssignments);
  }, [players, totalCubes, assignedCubes]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    const dummy = new Object3D();
    const defaultColor = new Color(MATRIX_CONFIG.defaultColor);
    
    cubeData.forEach((cube, i) => {
      const { position, offset } = cube;
      
      // Perlin noise wave movement
      const waveX = noise(position.x * 0.1 + time * 0.3, position.y * 0.1, position.z * 0.1) * 0.3;
      const waveY = noise(position.x * 0.1, position.y * 0.1 + time * 0.2, position.z * 0.1) * 0.3;
      const waveZ = noise(position.x * 0.1, position.y * 0.1, position.z * 0.1 + time * 0.25) * 0.3;
      
      dummy.position.set(
        position.x + waveX + Math.sin(time + offset.x) * 0.1,
        position.y + waveY + Math.cos(time + offset.y) * 0.1,
        position.z + waveZ + Math.sin(time + offset.z) * 0.1
      );
      
      // Unique rotation for each cube
      dummy.rotation.x = time * 0.1 + offset.x;
      dummy.rotation.y = time * 0.15 + offset.y;
      dummy.rotation.z = time * 0.08 + offset.z;
      
      // Pulsing scale
      const pulse = 1 + Math.sin(time * 2 + i * 0.1) * 0.05;
      dummy.scale.setScalar(MATRIX_CONFIG.cubeSize * pulse);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Color assignment
      let color = defaultColor;
      
      // Check if this cube is assigned to a player
      assignedCubes.forEach((cubeIndex, playerId) => {
        if (cubeIndex === i) {
          const player = players.find(p => p.id === playerId);
          if (player) {
            color = new Color(player.color);
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCubes]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={MATRIX_CONFIG.defaultColor}
        emissive={MATRIX_CONFIG.defaultColor}
        emissiveIntensity={MATRIX_CONFIG.glowIntensity}
        transparent
        opacity={0.6}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}

// Connection lines component
function ConnectionLines({ players }: BlockchainMatrix3DProps) {
  const linesRef = useRef<any>(null);
  const timeRef = useRef(0);
  
  const { gridSize, spacing } = MATRIX_CONFIG;
  
  // Generate connection lines
  const lineData = useMemo(() => {
    const lines: { start: Vector3; end: Vector3 }[] = [];
    
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          const pos = new Vector3(
            (x - gridSize.x / 2) * spacing,
            (y - gridSize.y / 2) * spacing,
            (z - gridSize.z / 2) * spacing
          );
          
          // Connect to neighbors (right, up, forward)
          if (x < gridSize.x - 1) {
            lines.push({
              start: pos.clone(),
              end: pos.clone().add(new Vector3(spacing, 0, 0))
            });
          }
          if (y < gridSize.y - 1) {
            lines.push({
              start: pos.clone(),
              end: pos.clone().add(new Vector3(0, spacing, 0))
            });
          }
          if (z < gridSize.z - 1) {
            lines.push({
              start: pos.clone(),
              end: pos.clone().add(new Vector3(0, 0, spacing))
            });
          }
        }
      }
    }
    
    return lines;
  }, [gridSize, spacing]);

  // Create line geometry
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    
    lineData.forEach(({ start, end }) => {
      positions.push(start.x, start.y, start.z);
      positions.push(end.x, end.y, end.z);
    });
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    
    return geometry;
  }, [lineData]);

  useFrame((state, delta) => {
    timeRef.current += delta;
  });

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry}>
      <lineBasicMaterial
        color={MATRIX_CONFIG.defaultColor}
        transparent
        opacity={0.3}
        linewidth={2}
      />
    </lineSegments>
  );
}

// Data packets moving through lines
function DataPackets() {
  const particlesRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);
  const particleCount = 500;
  
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, () => ({
      startPos: new Vector3(
        (Math.random() - 0.5) * MATRIX_CONFIG.gridSize.x * MATRIX_CONFIG.spacing,
        (Math.random() - 0.5) * MATRIX_CONFIG.gridSize.y * MATRIX_CONFIG.spacing,
        (Math.random() - 0.5) * MATRIX_CONFIG.gridSize.z * MATRIX_CONFIG.spacing
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      speed: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    const dummy = new Object3D();
    const color = new Color(MATRIX_CONFIG.defaultColor);
    
    particleData.forEach((particle, i) => {
      const t = (time * particle.speed) % 1;
      
      dummy.position.copy(particle.startPos).add(
        particle.velocity.clone().multiplyScalar(t * 10)
      );
      
      dummy.scale.setScalar(0.1 + Math.sin(t * Math.PI) * 0.05);
      
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
      particlesRef.current!.setColorAt(i, color);
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) {
      particlesRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial
        color={MATRIX_CONFIG.defaultColor}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    // Smooth orbital camera movement
    const radius = 60;
    camera.position.x = Math.sin(time * 0.1) * radius;
    camera.position.z = Math.cos(time * 0.1) * radius;
    camera.position.y = 10 + Math.sin(time * 0.05) * 5;
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Main scene component
function Scene({ players, isActive }: BlockchainMatrix3DProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 20, 0]} intensity={1} color="#00FFFF" />
      <pointLight position={[20, 0, 20]} intensity={0.5} color="#DC1FFF" />
      <pointLight position={[-20, 0, -20]} intensity={0.5} color="#00FFA3" />
      
      {/* Matrix components */}
      <CubeInstances players={players} isActive={isActive} />
      <ConnectionLines players={players} isActive={isActive} />
      <DataPackets />
      
      {/* Camera */}
      <CameraController />
      
      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.ADD}
        />
        <ChromaticAberration
          offset={[0.001, 0.001]}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

// Main component export
export default function BlockchainMatrix3D({ players = [], isActive = false }: BlockchainMatrix3DProps) {
  return (
    <div className="w-full h-full relative">
      {/* Reflective floor effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [40, 20, 40], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 30, 100]} />
        
        <Scene players={players} isActive={isActive} />
      </Canvas>
      
      {/* Digital fog overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,255,255,0.05) 50%, rgba(0,0,0,0.8) 100%)"
        }}
      />
    </div>
  );
}
