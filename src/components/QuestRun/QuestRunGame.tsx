/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useStore } from './store';
import { GameStatus } from './types';
import { CameraController } from './World/CameraController';
import { HUD } from './UI/HUD';
import { Player } from './World/Player';
import { LevelManager } from './World/LevelManager';
import { Environment } from './World/Environment';
import { Effects } from './World/Effects';
import { GameProps } from '../Game';

export function QuestRunGame(props: GameProps) {
  const { status, startGame } = useStore();

  // Sync score back to parent when game ends
  useEffect(() => {
    if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
      const finalScore = useStore.getState().score;
      props.onScore(finalScore);
    }
  }, [status, props]);

  const handleStart = () => {
    if (props.tries <= 0 || props.isLockedOut) return;
    props.onTryUsed();
    startGame(props.answerBanks || []);
  };

  return (
    <div className="w-full aspect-video min-h-[450px] max-h-[75vh] relative bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl font-sans">
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={60} />
        <CameraController />
        
        <Suspense fallback={null}>
          <Environment />
          <LevelManager />
          <Player />
          <Effects />
        </Suspense>
      </Canvas>

      <HUD onStart={handleStart} tries={props.tries} isLockedOut={props.isLockedOut} parentSettings={props.parentSettings} />
    </div>
  );
}
