import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { GameScene } from './QuestSnake/GameScene';
import { useGameStore } from '../store/questSnakeStore';
import { UI } from './QuestSnake/UI';

interface QuestSnakeGameProps {
  tries: number;
  isLockedOut: boolean;
  parentSettings: any;
  onTryUsed: () => void;
  onScore: (score: number) => void;
  assignments: any[];
  answerBanks: any[];
  user: any;
}

export function QuestSnakeGame({ tries, isLockedOut, onTryUsed, onScore, user, assignments, answerBanks }: QuestSnakeGameProps) {
  // No need to connect to socket for single player
  // const { connect } = useGameStore();

  // useEffect(() => {
  //   connect();
  // }, [connect]);

  return (
    <div className="w-full h-[600px] bg-black overflow-hidden relative rounded-[2rem] border-4 border-[#e6d5b8] shadow-2xl">
      <Canvas
        shadows
        camera={{ position: [0, 0, 50], fov: 60 }}
        gl={{ antialias: false }}
      >
        <color attach="background" args={['#050505']} />
        <GameScene answerBanks={answerBanks} onScore={onScore} onTryUsed={onTryUsed} />
        <EffectComposer>
          <Bloom
            luminanceThreshold={1.5}
            mipmapBlur
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>
      <UI onPlayAgain={onTryUsed} />
    </div>
  );
}
