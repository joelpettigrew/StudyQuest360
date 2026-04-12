/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { type Slider, CameraData, ViewMode, ShipConfig, GameState, Question } from '../types';
import { AppContextType } from '../context/AppContext';

import shaderSession from '../sessions/shader-session-1.json';

// Calibrated starting position
const INITIAL_CAMERA_POS: [number, number, number] = [0, 1.5, 0];
const INITIAL_CAMERA_ROT: [number, number] = [0.1, 0.0];

const QUESTIONS: Question[] = [
    { id: '1', text: "What is the process by which plants make their own food?", options: ["Photosynthesis", "Respiration", "Digestion", "Transpiration"], correctIndex: 0, topic: "Biology" },
    { id: '2', text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, topic: "Astronomy" },
    { id: '3', text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, topic: "Geography" },
    { id: '4', text: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correctIndex: 1, topic: "Literature" },
    { id: '5', text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Rome"], correctIndex: 2, topic: "Geography" },
];

const getPlanet1Distance = (p_vec: number[] | Float32Array) => {
    const px = p_vec[0];
    const py = p_vec[1];
    const pz = p_vec[2];

    const radius = 10.0;
    let d = radius - Math.sqrt(px * px + py * py);

    const zSpacing = 15.0;
    const zMod = ((pz % zSpacing) + zSpacing) % zSpacing;
    const zIdx = Math.floor(pz / zSpacing);
    
    const obsX = Math.sin(zIdx * 1.23) * 5.0;
    const obsY = Math.cos(zIdx * 0.87) * 5.0;
    
    const qOx = px - obsX;
    const qOy = py - obsY;
    const obsDist = Math.max(Math.sqrt(qOx*qOx + qOy*qOy) - 1.5, Math.abs(zMod - zSpacing/2) - 1.8);
    
    return Math.min(d, obsDist);
};

export const useAppStoreComplete = (
  answerBanks?: any[], 
  onScore?: (score: number) => void, 
  onTryUsed?: () => void
): AppContextType => {
  const [activeShaderCode, setActiveShaderCode] = useState<string>('');
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [uniforms, setUniforms] = useState<{ [key: string]: number }>({});
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const nextCircleZRef = useRef(75);
  const lastCircleZRef = useRef(0);

  // Map answer banks to questions
  const mappedQuestions = useMemo(() => {
    if (!answerBanks || answerBanks.length === 0) return QUESTIONS;
    
    const qs: Question[] = [];
    answerBanks.forEach(bank => {
      bank.questions.forEach((q: any, idx: number) => {
        const options = [q.correctAnswer, ...q.distractors].sort(() => Math.random() - 0.5);
        qs.push({
          id: `${bank.id}-${idx}`,
          text: q.question,
          options: options,
          correctIndex: options.indexOf(q.correctAnswer),
          topic: bank.topic || bank.subject || 'General'
        });
      });
    });
    return qs.length > 0 ? qs : QUESTIONS;
  }, [answerBanks]);
  
  const cameraRef = useRef<CameraData>({
      position: [...INITIAL_CAMERA_POS],
      rotation: [...INITIAL_CAMERA_ROT],
      roll: 0
  });
  
  const renderCameraRef = useRef<CameraData>({
      position: [...INITIAL_CAMERA_POS],
      rotation: [...INITIAL_CAMERA_ROT],
      roll: 0
  });

  const [viewMode, setViewMode] = useState<ViewMode>('chase');
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const keysPressed = useRef(new Set<string>());
  const cameraVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const cameraAngularVelocityRef = useRef<[number, number]>([0, 0]);
  
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isHdEnabled, setIsHdEnabled] = useState<boolean>(false);
  const [isFpsEnabled, setIsFpsEnabled] = useState<boolean>(false);
  
  const [isMoving, setIsMoving] = useState(false);
  const [collisionState, setCollisionState] = useState<'none' | 'approaching' | 'colliding'>('none');
  const collisionStateRef = useRef<'none' | 'approaching' | 'colliding'>('none');
  const [collisionProximity, setCollisionProximity] = useState(0);
  const [gameState, setGameState] = useState<GameState>('idle');
  const gameStateRef = useRef<GameState>('idle');

  const startGame = useCallback(() => {
    if (onTryUsed) onTryUsed();
    setGameState('playing');
    gameStateRef.current = 'playing';
    setSessionQuestions([]);
  }, [onTryUsed]);

  const [shipConfig, setShipConfig] = useState<ShipConfig>({
      complexity: 5,
      fold1: 0.5,
      fold2: 0.5,
      fold3: 1.0,
      scale: 0.5,
      stretch: 1.0,
      taper: 1.0,
      twist: 1.0,
      asymmetryX: 1.0,
      asymmetryY: 1.0,
      asymmetryZ: 1.0,
      twistAsymX: 1.0,
      scaleAsymX: 1.0,
      fold1AsymX: 0.5,
      fold2AsymX: 0.5,
      generalScale: 1.0,
      chaseDistance: 6.5,
      chaseVerticalOffset: 1.0,
      pitchOffset: 0.0,
      translucency: 1.0
  });

  const effectiveShipConfigRef = useRef<ShipConfig>(shipConfig);

  const pressKey = useCallback((key: string) => {
    const k = key.toLowerCase();
    keysPressed.current.add(k);
    setPressedKeys(new Set(keysPressed.current));
  }, []);

  const releaseKey = useCallback((key: string) => {
    const k = key.toLowerCase();
    keysPressed.current.delete(k);
    setPressedKeys(new Set(keysPressed.current));
  }, []);

  const restartGame = useCallback(() => {
    if (onTryUsed) onTryUsed();
    cameraRef.current.position = [...INITIAL_CAMERA_POS];
    cameraRef.current.rotation = [...INITIAL_CAMERA_ROT];
    cameraVelocityRef.current = [0, 0, 0];
    cameraAngularVelocityRef.current = [0, 0];
    setGameState('playing');
    gameStateRef.current = 'playing';
    setCollisionState('none');
    collisionStateRef.current = 'none';
    setScore(0);
    setLives(3);
    setSessionQuestions([]);
    nextCircleZRef.current = 75;
  }, [onTryUsed]);

  const answerQuestion = useCallback((index: number) => {
    if (!currentQuestion) return;
    const isCorrect = index === currentQuestion.correctIndex;
    
    setSessionQuestions(prev => [...prev, {
      question: currentQuestion.text,
      answer: currentQuestion.options[currentQuestion.correctIndex],
      correct: isCorrect
    }]);

    if (isCorrect) {
      setScore(s => s + 100);
      setGameState('playing');
      gameStateRef.current = 'playing';
    } else {
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setGameState('gameover');
          gameStateRef.current = 'gameover';
          if (onScore) onScore(score);
        } else {
          setGameState('playing');
          gameStateRef.current = 'playing';
        }
        return next;
      });
    }
    setCurrentQuestion(null);
  }, [currentQuestion, onScore, score]);

  useEffect(() => {
    if (shaderSession) {
      setActiveShaderCode(shaderSession.shaderCode);
      setSliders(shaderSession.sliders);
      const initialUniforms: any = {};
      shaderSession.sliders.forEach((s: any) => initialUniforms[s.variableName] = s.defaultValue);
      setUniforms(initialUniforms);
    }
  }, []);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const gameLoop = (time: number) => {
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        if (gameStateRef.current !== 'playing') {
            frameId = requestAnimationFrame(gameLoop);
            return;
        }

        const keys = keysPressed.current;
        const [p, y] = cameraRef.current.rotation;
        const currentPos = cameraRef.current.position;
        
        const isBoosting = keys.has('shift');
        const boostMultiplier = isBoosting ? 5.0 : 1.0;
        const spd = 12.0 * boostMultiplier;
        const rotSpd = 1.5;

        const thrust = keys.has(' ') ? 1.0 : 0.0;
        const targetVel: [number, number, number] = [0, 0, 0];
        
        if (thrust > 0) {
            targetVel[0] = Math.sin(y) * Math.cos(p) * spd;
            targetVel[1] = -Math.sin(p) * spd;
            targetVel[2] = Math.cos(y) * Math.cos(p) * spd;
        }

        const ACCEL = 5.0;
        cameraVelocityRef.current[0] += (targetVel[0] - cameraVelocityRef.current[0]) * ACCEL * dt;
        cameraVelocityRef.current[1] += (targetVel[1] - cameraVelocityRef.current[1]) * ACCEL * dt;
        cameraVelocityRef.current[2] += (targetVel[2] - cameraVelocityRef.current[2]) * ACCEL * dt;

        const targetRotVel = [0, 0];
        if (keys.has('arrowup')) targetRotVel[0] -= rotSpd;
        if (keys.has('arrowdown')) targetRotVel[0] += rotSpd;
        if (keys.has('arrowleft')) targetRotVel[1] -= rotSpd;
        if (keys.has('arrowright')) targetRotVel[1] += rotSpd;

        const ROT_ACCEL = 10.0;
        cameraAngularVelocityRef.current[0] += (targetRotVel[0] - cameraAngularVelocityRef.current[0]) * ROT_ACCEL * dt;
        cameraAngularVelocityRef.current[1] += (targetRotVel[1] - cameraAngularVelocityRef.current[1]) * ROT_ACCEL * dt;

        cameraRef.current.rotation[0] += cameraAngularVelocityRef.current[0] * dt;
        cameraRef.current.rotation[1] += cameraAngularVelocityRef.current[1] * dt;
        cameraRef.current.rotation[0] = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraRef.current.rotation[0]));

        effectiveShipConfigRef.current = shipConfig;

        const proposedPos: [number, number, number] = [
            currentPos[0] + cameraVelocityRef.current[0] * dt,
            currentPos[1] + cameraVelocityRef.current[1] * dt,
            currentPos[2] + cameraVelocityRef.current[2] * dt
        ];

        const dist = getPlanet1Distance(proposedPos);
        if (dist < 0.5) {
            setGameState('gameover');
            gameStateRef.current = 'gameover';
            if (onScore) onScore(score);
        } else {
            cameraRef.current.position = proposedPos;
            setCollisionProximity(Math.max(0, 1.0 - dist / 5.0));
        }

        const currentZ = cameraRef.current.position[2];
        if (currentZ > nextCircleZRef.current && lastCircleZRef.current <= nextCircleZRef.current) {
            const dx = cameraRef.current.position[0];
            const dy = cameraRef.current.position[1];
            const distToCenter = Math.sqrt(dx*dx + dy*dy);
            if (distToCenter < 3.0) {
                setGameState('quiz');
                gameStateRef.current = 'quiz';
                setCurrentQuestion(mappedQuestions[Math.floor(Math.random() * mappedQuestions.length)]);
            }
            nextCircleZRef.current += 150;
        }
        lastCircleZRef.current = currentZ;

        const chaseDist = shipConfig.chaseDistance || 6.5;
        const chaseHeight = shipConfig.chaseVerticalOffset || 1.0;
        renderCameraRef.current.position = [
            cameraRef.current.position[0] - Math.sin(y) * Math.cos(p) * chaseDist,
            cameraRef.current.position[1] + Math.sin(p) * chaseDist + chaseHeight,
            cameraRef.current.position[2] - Math.cos(y) * Math.cos(p) * chaseDist
        ];
        renderCameraRef.current.rotation = [...cameraRef.current.rotation];

        setIsMoving(thrust > 0);
        frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [shipConfig, gameState, mappedQuestions, onScore, score]);

  return {
    activeShaderCode, sliders, uniforms, handleUniformChange: (n, v) => setUniforms(p => ({ ...p, [n]: v })),
    allUniforms: uniforms, cameraRef, renderCameraRef, cameraVelocityRef, cameraAngularVelocityRef,
    pressKey, releaseKey, cameraControlsEnabled: true, pressedKeys, isInteracting, setIsInteracting,
    isHdEnabled, isFpsEnabled, isMoving, collisionState, collisionProximity,
    gameState, startGame, restartGame, score, lives, currentQuestion, answerQuestion, sessionQuestions, viewMode, setViewMode,
    shipConfig, effectiveShipConfigRef
  };
};
