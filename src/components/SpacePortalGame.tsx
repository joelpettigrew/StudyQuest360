import React from 'react';
import SpacePortalApp from '../Space Portal/App';
import { GameProps } from './Game';

export function SpacePortalGame({ tries, onTryUsed, onScore, isLockedOut, parentSettings, answerBanks }: GameProps) {
  if (isLockedOut) {
    return (
      <div className="bg-[#fdf6e3] rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg p-6 text-[#4a3f35] min-h-[500px] flex flex-col items-center justify-center text-center font-serif">
        <div className="w-20 h-20 bg-white border-4 border-[#e6d5b8] rounded-3xl flex items-center justify-center mb-6 text-[#8c7b68]">
          <span className="text-4xl">🔒</span>
        </div>
        <h4 className="text-2xl font-black mb-2 uppercase tracking-widest">Arena Locked</h4>
        <p className="text-[#8c7b68] max-w-xs font-sans font-medium">
          Your parent has locked games between {parentSettings?.schoolHoursStart} and {parentSettings?.schoolHoursEnd}.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <SpacePortalApp 
        answerBanks={answerBanks} 
        onScore={onScore} 
        onTryUsed={onTryUsed} 
      />
    </div>
  );
}
