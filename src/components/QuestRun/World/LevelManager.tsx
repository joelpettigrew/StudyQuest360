/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, QUEST_COLORS } from '../types';
import { audio } from '../System/Audio';

// Geometry Constants
const SPIKE_GEO = new THREE.ConeGeometry(0.4, 1.2, 4);
const MONSTER_BODY_GEO = new THREE.SphereGeometry(0.5, 8, 8);
const FIREBALL_GEO = new THREE.SphereGeometry(0.3, 16, 16);
const GEM_GEOMETRY = new THREE.IcosahedronGeometry(0.3, 0);

// Shadow Geometries
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(1.5, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.4, 32);
const SHADOW_MONSTER_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_FIREBALL_GEO = new THREE.CircleGeometry(0.3, 32);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.6, 6);

const PARTICLE_COUNT = 400;
const BASE_LETTER_INTERVAL = 120; 

const getLetterInterval = (level: number) => {
    return BASE_LETTER_INTERVAL * Math.pow(1.2, Math.max(0, level - 1));
};

const FIREBALL_SPEED = 20; 
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = 30; 
            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; 
                    p.pos.set(position[0], position[1], position[2]);
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 8;
                    p.vel.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(speed);
                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(5);
                    p.color.set(color);
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= delta * 1.5;
                p.pos.addScaledVector(p.vel, delta);
                p.vel.y -= delta * 5; 
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * 0.2);
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.8} />
        </instancedMesh>
    );
};

const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    collectGem, 
    collectLetter, 
    collectedLetters,
    missingIndices,
    laneCount,
    setDistance,
    level,
    targetWord,
    isBoosting
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);
  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);

  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && (prevStatus.current === GameStatus.GAME_OVER || prevStatus.current === GameStatus.VICTORY || prevStatus.current === GameStatus.MENU);
    if (isRestart) {
        objectsRef.current = [];
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);
        setRenderTrigger(t => t + 1);
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) playerObjRef.current = group.children[0];
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;
    const effectiveSpeed = isBoosting ? speed * 1.3 : speed;
    const dist = effectiveSpeed * delta;
    distanceTraveled.current += dist;

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    if (playerObjRef.current) playerObjRef.current.getWorldPosition(playerPos);

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.FIREBALL) moveAmount += FIREBALL_SPEED * delta;
        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;
        
        if (obj.type === ObjectType.MONSTER && obj.active && !obj.hasFired) {
             if (obj.position[2] > -60) {
                 obj.hasFired = true;
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.FIREBALL,
                     position: [obj.position[0], 1.0, obj.position[2] + 1],
                     active: true,
                     color: '#ff4400'
                 });
                 hasChanges = true;
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 1.5; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.8) {
                     const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.MONSTER || obj.type === ObjectType.FIREBALL;
                     if (isDamageSource) {
                         const playerBottom = playerPos.y;
                         const playerTop = playerPos.y + 1.8;
                         let objBottom = obj.position[1] - 0.5;
                         let objTop = obj.position[1] + 0.5;
                         if (obj.type === ObjectType.OBSTACLE) { objBottom = 0; objTop = 1.2; }
                         const isHit = (playerBottom < objTop) && (playerTop > objBottom);
                         if (isHit) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                         }
                     } else {
                         const dy = Math.abs(obj.position[1] - playerPos.y);
                         if (dy < 2.0) {
                            if (obj.type === ObjectType.GEM) {
                                collectGem(obj.points || 50);
                                audio.playGemCollect();
                            }
                            if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                                collectLetter(obj.targetIndex);
                                audio.playLetterCollect();
                            }
                            window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { position: obj.position, color: obj.color || '#ffffff' } 
                            }));
                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }
        if (obj.position[2] > REMOVE_DISTANCE) { keep = false; hasChanges = true; }
        if (keep) keptObjects.push(obj);
    }

    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    let furthestZ = 0;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.FIREBALL);
    if (staticObjects.length > 0) furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    else furthestZ = -20;

    if (furthestZ > -SPAWN_DISTANCE) {
         const minGap = 15 + (speed * 0.3); 
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

         if (isLetterDue && targetWord.length > 0) {
             const lane = getRandomLane(laneCount);
             // Only spawn letters that are in missingIndices and NOT yet collected
             const availableIndices = missingIndices.filter(i => !collectedLetters.includes(i));

             if (availableIndices.length > 0) {
                 const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                 const val = targetWord[chosenIndex];
                 const color = QUEST_COLORS[chosenIndex % QUEST_COLORS.length];
                 keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.LETTER,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                    active: true,
                    color: color,
                    value: val,
                    targetIndex: chosenIndex
                 });
                 nextLetterDistance.current += getLetterInterval(level);
                 hasChanges = true;
             }
         } else if (Math.random() > 0.1) {
            const isObstacle = Math.random() > 0.3;
            if (isObstacle) {
                const spawnMonster = level >= 2 && Math.random() < 0.3;
                if (spawnMonster) {
                    const lane = getRandomLane(laneCount);
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.MONSTER,
                        position: [lane * LANE_WIDTH, 1.0, spawnZ],
                        active: true,
                        color: '#ff0000',
                        hasFired: false
                    });
                } else {
                    const lane = getRandomLane(laneCount);
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.OBSTACLE,
                        position: [lane * LANE_WIDTH, 0.6, spawnZ],
                        active: true,
                        color: '#444444'
                    });
                }
            } else {
                const lane = getRandomLane(laneCount);
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ],
                    active: true,
                    color: '#ffd700',
                    points: 50
                });
            }
            hasChanges = true;
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => obj.active ? <GameEntity key={obj.id} data={obj} /> : null)}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if (groupRef.current) groupRef.current.position.set(data.position[0], 0, data.position[2]);
        if (visualRef.current) {
            const baseHeight = data.position[1];
            if (data.type === ObjectType.FIREBALL) {
                 visualRef.current.rotation.z += delta * 10;
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 10) * 0.1;
            } else if (data.type === ObjectType.MONSTER) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 5) * 0.2;
                 visualRef.current.rotation.y += delta * 2;
            } else if (data.type === ObjectType.LETTER || data.type === ObjectType.GEM) {
                visualRef.current.rotation.y += delta * 2;
                visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.1;
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.MONSTER) return SHADOW_MONSTER_GEO;
        if (data.type === ObjectType.FIREBALL) return SHADOW_FIREBALL_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type]);

    return (
        <group ref={groupRef}>
            {shadowGeo && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo}>
                    <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                </mesh>
            )}
            <group ref={visualRef}>
                {data.type === ObjectType.OBSTACLE && (
                    <mesh geometry={SPIKE_GEO} castShadow>
                        <meshStandardMaterial color="#ff0000" emissive="#aa0000" emissiveIntensity={0.5} />
                    </mesh>
                )}
                {data.type === ObjectType.MONSTER && (
                    <mesh geometry={MONSTER_BODY_GEO} castShadow>
                        <meshStandardMaterial color="#880000" emissive="#440000" />
                    </mesh>
                )}
                {data.type === ObjectType.FIREBALL && (
                    <mesh geometry={FIREBALL_GEO}>
                        <meshStandardMaterial color="#ff4400" emissive="#ff0000" emissiveIntensity={2} />
                    </mesh>
                )}
                {data.type === ObjectType.GEM && (
                    <group>
                        <pointLight color={data.color} intensity={2} distance={5} />
                        <mesh geometry={GEM_GEOMETRY} castShadow>
                            <meshStandardMaterial color={data.color} roughness={0} metalness={1} emissive={data.color} emissiveIntensity={2} />
                        </mesh>
                    </group>
                )}
                {data.type === ObjectType.LETTER && (
                    <group>
                        <pointLight color={data.color} intensity={3} distance={6} />
                        <Center scale={1.2}>
                            <Text3D font={FONT_URL} size={0.6} height={0.2}>
                                {data.value}
                                <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} />
                            </Text3D>
                        </Center>
                    </group>
                )}
            </group>
        </group>
    );
});
