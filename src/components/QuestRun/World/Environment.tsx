/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { LANE_WIDTH } from '../types';

const DungeonDust: React.FC = () => {
  const { speed, isBoosting } = useStore();
  const count = 1000;
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = -Math.random() * 200;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const baseSpeed = speed > 0 ? speed : 2;
    const activeSpeed = isBoosting ? baseSpeed * 1.3 : baseSpeed;

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] += activeSpeed * delta;
        if (positions[i * 3 + 2] > 20) {
            positions[i * 3 + 2] = -180;
        }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffcc66" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
};

const StoneFloor: React.FC = () => {
    const { speed, isBoosting } = useStore();
    const meshRef = useRef<THREE.Group>(null);
    const offsetRef = useRef(0);
    
    useFrame((state, delta) => {
        if (meshRef.current) {
             const baseSpeed = speed > 0 ? speed : 5;
             const activeSpeed = isBoosting ? baseSpeed * 1.3 : baseSpeed;
             offsetRef.current += activeSpeed * delta;
             const cellSize = 10;
             meshRef.current.position.z = -50 + (offsetRef.current % cellSize);
        }
    });

    return (
        <group ref={meshRef} position={[0, -0.05, -50]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 200]} />
                <meshStandardMaterial 
                    color="#2a1a0a" 
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>
            <gridHelper args={[100, 20, "#3a2a1a", "#1a0f05"]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} />
        </group>
    );
};

const LaneGuides: React.FC = () => {
    const { laneCount } = useStore();
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        for (let i = 0; i <= laneCount; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            <mesh position={[0, -0.01, -50]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 400]} />
                <meshStandardMaterial color="#1a120a" roughness={0.8} />
            </mesh>

            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0.01, -50]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.15, 400]} /> 
                    <meshStandardMaterial color="#5a4a3a" emissive="#3a2a1a" emissiveIntensity={0.5} />
                </mesh>
            ))}
        </group>
    );
};

const Castle: React.FC = () => {
    return (
        <group position={[0, 0, -300]}>
            {/* Main Keep */}
            <mesh position={[0, 15, 0]} castShadow>
                <boxGeometry args={[40, 40, 40]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
            </mesh>
            {/* Towers */}
            {[[-25, 25], [25, 25], [-25, -25], [25, -25]].map(([x, z], i) => (
                <group key={i} position={[x, 20, z]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[8, 8, 50, 8]} />
                        <meshStandardMaterial color="#111111" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 30, 0]}>
                        <coneGeometry args={[10, 15, 8]} />
                        <meshStandardMaterial color="#660000" />
                    </mesh>
                </group>
            ))}
            {/* Gate */}
            <mesh position={[0, 10, 20.1]}>
                <boxGeometry args={[15, 20, 0.5]} />
                <meshStandardMaterial color="#0a0502" />
            </mesh>
            {/* Windows */}
            {[[-10, 25], [10, 25], [0, 30]].map(([x, y], i) => (
                <mesh key={`win-${i}`} position={[x, y, 20.1]}>
                    <planeGeometry args={[3, 4]} />
                    <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={4} />
                </mesh>
            ))}
        </group>
    );
};

const Torches: React.FC = () => {
    const { laneCount } = useStore();
    const torchPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        const xOffset = (laneCount * LANE_WIDTH) / 2 + 2;
        for (let z = 0; z > -400; z -= 40) {
            positions.push([-xOffset, 0, z]);
            positions.push([xOffset, 0, z]);
        }
        return positions;
    }, [laneCount]);

    return (
        <group>
            {torchPositions.map((pos, i) => (
                <group key={i} position={pos}>
                    {/* Torch Stand */}
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 2]} />
                        <meshStandardMaterial color="#2a1a10" />
                    </mesh>
                    {/* Torch Flame */}
                    <mesh position={[0, 2.2, 0]}>
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={5} />
                    </mesh>
                    <pointLight position={[0, 2.5, 0]} intensity={5} color="#ff6600" distance={20} decay={2} />
                </group>
            ))}
        </group>
    );
};

export const Environment: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#4a7a9a']} />
      <fog attach="fog" args={['#4a7a9a', 400, 1000]} />
      
      <ambientLight intensity={1.5} color="#ffffff" />
      <pointLight position={[0, 25, 20]} intensity={10} color="#ffaa66" distance={200} decay={1.2} />
      <pointLight position={[0, 50, -200]} intensity={8} color="#ffcc00" distance={400} decay={1.2} />
      <directionalLight position={[10, 50, 50]} intensity={1.5} color="#ffffff" castShadow />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#221100" />
      
      <DungeonDust />
      <StoneFloor />
      <LaneGuides />
      <Torches />
      <Castle />
    </>
  );
};
