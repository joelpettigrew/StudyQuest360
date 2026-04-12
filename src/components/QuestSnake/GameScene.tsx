/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useLocalGameStore } from '../../store/localQuestSnakeStore';
import { WORLD_SIZE, TURN_SPEED, BOOST_SPEED, BASE_SPEED } from '../../types/QuestSnakeTypes';
import * as THREE from 'three';
import { Sphere, Grid, Text } from '@react-three/drei';

const localCollectedOrbs = new Set<string>();
const localCollectedQuestionMarks = new Set<string>();

function Snake({ playerId, color }: { playerId: string, color: string }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useRef<{x: number, y: number}[]>([]);
  const { gameState } = useLocalGameStore();

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;
    if (!gameState) return;
    
    const player = gameState.players[playerId];
    if (!player || player.segments.length === 0) {
      bodyRef.current.count = 0;
      headRef.current.visible = false;
      return;
    }
    
    headRef.current.visible = true;
    const count = player.segments.length;
    bodyRef.current.count = Math.max(0, count - 1);
    
    while (currentPositions.current.length < count) {
      const idx = currentPositions.current.length;
      currentPositions.current.push({ 
        x: player.segments[idx]?.x || 0, 
        y: player.segments[idx]?.y || 0 
      });
    }

    for (let i = 0; i < count; i++) {
      let targetX = player.segments[i].x;
      let targetY = player.segments[i].y;
      
      const curr = currentPositions.current[i];
      curr.x = targetX;
      curr.y = targetY;
      
      if (i === 0) {
        headRef.current.position.set(curr.x, curr.y, 0.5);
      } else {
        dummy.position.set(curr.x, curr.y, 0.5);
        dummy.updateMatrix();
        bodyRef.current.setMatrixAt(i - 1, dummy.matrix);
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Sphere ref={headRef} castShadow receiveShadow args={[0.9, 8, 8]}>
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.6 + fresnel * 4.0);
              `
            );
          }}
        />
      </Sphere>
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 2000]} castShadow receiveShadow frustumCulled={false}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.3 + fresnel * 2.0);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}

function Orbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);
  const { gameState } = useLocalGameStore();

  useFrame(() => {
    if (!meshRef.current) return;
    if (!gameState) return;

    let i = 0;
    for (const orbId in gameState.orbs) {
      const orb = gameState.orbs[orbId];
      dummy.position.set(orb.x, orb.y, 0.5);
      dummy.scale.setScalar(0.5 + Math.sin(Date.now() * 0.005 + orb.x) * 0.1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.set(orb.color);
      meshRef.current.setColorAt(i, colorObj);
      i++;
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, 1000]} castShadow receiveShadow frustumCulled={false}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        roughness={0.1}
        metalness={0.9}
        toneMapped={false}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            totalEmissiveRadiance += diffuseColor.rgb * 3.0;
            `
          );
        }}
      />
    </instancedMesh>
  );
}

function Hazards() {
  const gameState = useLocalGameStore(s => s.gameState);
  if (!gameState) return null;

  return (
    <>
      {Object.values(gameState.hazards).map((hazard) => (
        <group key={hazard.id} position={[hazard.x, hazard.y, 0.5]}>
          <Sphere args={[hazard.radius, 32, 32]} castShadow>
            <meshStandardMaterial 
              color={hazard.type === 'slime' ? '#4ade80' : hazard.type === 'beholder' ? '#f87171' : '#fbbf24'} 
              transparent 
              opacity={0.8}
              roughness={0}
              metalness={0.5}
            />
          </Sphere>
          <Text
            position={[0, 0, hazard.radius + 0.5]}
            fontSize={1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {hazard.type.toUpperCase()}
          </Text>
        </group>
      ))}
    </>
  );
}

function QuestionMarks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { gameState } = useLocalGameStore();

  useFrame(() => {
    if (!meshRef.current) return;
    if (!gameState) return;

    let i = 0;
    for (const id in gameState.questionMarks) {
      const qm = gameState.questionMarks[id];
      dummy.position.set(qm.x, qm.y, 1);
      dummy.rotation.y = Date.now() * 0.002;
      dummy.scale.setScalar(2.5 + Math.sin(Date.now() * 0.01) * 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      i++;
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, 10]} castShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} />
    </instancedMesh>
  );
}

export function GameScene({ answerBanks, onScore, onTryUsed }: { answerBanks: any[], onScore: (score: number) => void, onTryUsed: () => void }) {
  const { 
    gameState, 
    playerId, 
    updatePlayer, 
    collectOrb, 
    collectQuestionMark, 
    startQuestion, 
    tick,
    isPaused
  } = useLocalGameStore();
  const { camera } = useThree();
  const inputs = useRef({ left: false, right: false, boost: false });
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const [lightTarget] = useState(() => new THREE.Object3D());

  const generateQuestion = () => {
    if (!answerBanks || answerBanks.length === 0) {
      startQuestion({
        question: "A wizard has 5 spell slots and uses 2. How many are left?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2
      });
      return;
    }

    const bank = answerBanks[Math.floor(Math.random() * answerBanks.length)];
    const q = bank.questions[Math.floor(Math.random() * bank.questions.length)];
    
    const options = [q.correctAnswer, ...q.distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(q.correctAnswer);

    startQuestion({
      question: q.question,
      options,
      correctIndex
    });
  };

  const localPlayerRef = useRef<{
    active: boolean;
    segments: {x: number, y: number}[];
    score: number;
    currentAngle: number;
    isBoosting: boolean;
  }>({
    active: false,
    segments: [],
    score: 10,
    currentAngle: 0,
    isBoosting: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && !inputs.current.left) { inputs.current.left = true; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && !inputs.current.right) { inputs.current.right = true; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && !inputs.current.boost) { inputs.current.boost = true; }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && inputs.current.left) { inputs.current.left = false; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && inputs.current.right) { inputs.current.right = false; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && inputs.current.boost) { inputs.current.boost = false; }
    };

    const handleBlur = () => {
      inputs.current = { left: false, right: false, boost: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((state, delta) => {
    if (!gameState || !playerId || isPaused) return;
    
    const player = gameState.players[playerId];
    if (player && player.state === 'alive') {
      
      // Initialize from store if not active
      if (!localPlayerRef.current.active && player.segments.length > 0) {
        localPlayerRef.current.active = true;
        localPlayerRef.current.segments = [...player.segments];
        localPlayerRef.current.score = player.score;
        localPlayerRef.current.currentAngle = player.currentAngle;
      }

      if (!localPlayerRef.current.active) return;

      // Local movement logic
      if (inputs.current.left) localPlayerRef.current.currentAngle += TURN_SPEED * delta;
      if (inputs.current.right) localPlayerRef.current.currentAngle -= TURN_SPEED * delta;
      
      localPlayerRef.current.isBoosting = inputs.current.boost;
      const speed = localPlayerRef.current.isBoosting ? BOOST_SPEED : BASE_SPEED;
      
      const head = { ...localPlayerRef.current.segments[0] };
      head.x += Math.cos(localPlayerRef.current.currentAngle) * speed * delta;
      head.y += Math.sin(localPlayerRef.current.currentAngle) * speed * delta;

      // Boundary check
      const boundary = WORLD_SIZE / 2;
      if (head.x < -boundary) head.x = -boundary;
      if (head.x > boundary) head.x = boundary;
      if (head.y < -boundary) head.y = -boundary;
      if (head.y > boundary) head.y = boundary;

      localPlayerRef.current.segments.unshift(head);

      const targetLength = Math.floor(localPlayerRef.current.score);
      while (localPlayerRef.current.segments.length > targetLength) {
        localPlayerRef.current.segments.pop();
      }

      // Check orb collisions
      for (const orbId in gameState.orbs) {
        const orb = gameState.orbs[orbId];
        const dx = head.x - orb.x;
        const dy = head.y - orb.y;
        if (dx * dx + dy * dy < 4) {
          const bonus = localPlayerRef.current.isBoosting ? 2 : 1;
          localPlayerRef.current.score += orb.value * 2 * bonus;
          collectOrb(orbId);
        }
      }

      // Check question mark collisions
      for (const id in gameState.questionMarks) {
        const qm = gameState.questionMarks[id];
        const dx = head.x - qm.x;
        const dy = head.y - qm.y;
        if (dx * dx + dy * dy < 16) {
          collectQuestionMark(id);
          generateQuestion();
        }
      }

      // Check hazard collisions
      let collided = false;
      for (const id in gameState.hazards) {
        const hazard = gameState.hazards[id];
        const dx = head.x - hazard.x;
        const dy = head.y - hazard.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < hazard.radius * hazard.radius) {
          collided = true;
          break;
        }
      }

      // Check self collisions
      const segmentsToCheck = localPlayerRef.current.segments.slice(10);
      for (const seg of segmentsToCheck) {
        const dx = head.x - seg.x;
        const dy = head.y - seg.y;
        if (dx * dx + dy * dy < 2.25) {
          collided = true;
          break;
        }
      }

      if (collided) {
        localPlayerRef.current.active = false;
        updatePlayer({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'dead'
        });
        onScore(Math.floor(localPlayerRef.current.score));
        return;
      }

      // Update store state
      updatePlayer({
        segments: localPlayerRef.current.segments,
        score: localPlayerRef.current.score,
        currentAngle: localPlayerRef.current.currentAngle,
        isBoosting: localPlayerRef.current.isBoosting,
        state: 'alive'
      });

      // Tick the world
      tick(delta);

      const targetZ = Math.min(45, Math.max(20, 20 + localPlayerRef.current.score * 0.2));
      
      // Smooth camera follow predicted head
      camera.position.x += (head.x - camera.position.x) * 10 * delta;
      camera.position.y += (head.y - camera.position.y) * 10 * delta;
      camera.position.z += (targetZ - camera.position.z) * 4 * delta;
      camera.lookAt(camera.position.x, camera.position.y, 0);

      // Make the directional light follow the camera to keep shadows crisp
      if (lightRef.current) {
        lightRef.current.position.set(camera.position.x + 10, camera.position.y - 10, 30);
        lightTarget.position.set(camera.position.x, camera.position.y, 0);
      }
    } else {
      localPlayerRef.current.active = false;
    }
  });

  if (!gameState) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      
      <directionalLight
        ref={lightRef}
        target={lightTarget}
        castShadow
        intensity={2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-bias={-0.001}
      />
      <primitive object={lightTarget} />

      {/* Ground plane to receive shadows */}
      <mesh receiveShadow position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#1c1917" roughness={1} />
      </mesh>

      <Grid
        position={[0, 0, -0.1]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WORLD_SIZE, WORLD_SIZE]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#44403c"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#78350f"
        fadeDistance={100}
        fadeStrength={1}
      />

      <Orbs />
      <Hazards />
      <QuestionMarks />

      {Object.values(gameState.players).map((player) => {
        if (player.state !== 'alive' || player.segments.length === 0) return null;
        return (
          <Snake
            key={player.id}
            playerId={player.id}
            color={player.color}
          />
        );
      })}
    </>
  );
}
