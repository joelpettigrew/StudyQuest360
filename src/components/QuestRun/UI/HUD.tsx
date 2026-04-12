/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Play, RefreshCw, Lock, Gamepad2, Volume2, VolumeX, Zap } from 'lucide-react';
import { useStore } from '../store';
import { GameStatus, QUEST_COLORS } from '../types';

interface HUDProps {
  onStart: () => void;
  tries: number;
  isLockedOut: boolean;
  parentSettings: any;
}

export const HUD: React.FC<HUDProps> = ({ onStart, tries, isLockedOut, parentSettings }) => {
  const { 
    status, 
    score, 
    lives, 
    level, 
    isMuted, 
    setMuted, 
    targetWord, 
    collectedLetters, 
    missingIndices,
    isBoosting,
    setBoosting,
    setStatus,
    questions,
    currentQuestionIndex
  } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full pointer-events-auto p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" size={18} />
              <span className="text-white font-black text-lg tabular-nums">{score.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart 
                  key={i} 
                  size={16} 
                  className={i < lives ? "text-red-500 fill-red-500" : "text-white/20"} 
                />
              ))}
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-white/60 text-[10px] font-black uppercase tracking-tighter">Level</span>
            <span className="text-white font-black ml-2">{level}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setMuted(!isMuted)}
            className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Riddle Overlay (Top) */}
      {status === GameStatus.PLAYING && (
        <div className="mt-2 flex justify-center w-full pointer-events-auto px-4">
          <div className="bg-black/80 backdrop-blur-md border-2 border-white/10 p-3 rounded-xl text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full max-w-xl">
            <p className="text-white/70 text-[9px] uppercase tracking-widest font-black mb-0.5">Current Riddle</p>
            <h3 className="text-white text-sm font-bold leading-tight">
              {questions[currentQuestionIndex]?.text}
            </h3>
          </div>
        </div>
      )}

      {/* Center Overlays */}
      <AnimatePresence>
        {status === GameStatus.MENU && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl p-10 rounded-[3rem] border-4 border-white/10 shadow-2xl text-center max-w-md">
              <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 rotate-3">
                <Gamepad2 size={48} className="text-white" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">Quest Run</h2>
              <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                Run through the dungeon, dodge obstacles, and collect letters to solve the riddles!
              </p>
              
              {isLockedOut ? (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
                  <div className="flex items-center justify-center gap-2 text-red-500 font-black uppercase text-sm mb-1">
                    <Lock size={16} />
                    <span>Arena Locked</span>
                  </div>
                  <p className="text-red-500/60 text-xs">School hours restriction active</p>
                </div>
              ) : (
                <button 
                  onClick={onStart}
                  disabled={tries <= 0}
                  className={`
                    w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3
                    ${tries > 0 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/40' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                  `}
                >
                  <Play fill="currentColor" />
                  {tries > 0 ? `Start Run (${tries})` : 'No Keys'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {status === GameStatus.GAME_OVER && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center pointer-events-auto"
          >
            <div className="text-center max-w-md w-full px-6 flex flex-col max-h-[85vh]">
              <h2 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter">Fallen!</h2>
              <p className="text-slate-400 text-xl mb-4 font-bold">You scored {score.toLocaleString()} points</p>
              
              {useStore.getState().sessionQuestions.length > 0 && (
                <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar text-left space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                  <h3 className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2">Knowledge Gained:</h3>
                  {useStore.getState().sessionQuestions.map((q, i) => (
                    <div key={i} className="border-l-2 border-indigo-500/50 pl-3 py-1">
                      <p className="text-white/90 text-sm font-medium mb-1">{q.question}</p>
                      <p className={`text-xs font-bold ${q.correct ? 'text-emerald-400' : 'text-indigo-400/60'}`}>
                        {q.correct ? '✓ Correct' : '✗ Missed'} — Answer: {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center mt-auto">
                <button 
                  onClick={() => setStatus(GameStatus.MENU)}
                  className="flex-1 px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Menu
                </button>
                <button 
                  onClick={onStart}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-500/40"
                >
                  Play Again (1 Key)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {status === GameStatus.VICTORY && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center pointer-events-auto"
          >
            <div className="text-center max-w-md w-full px-6 flex flex-col max-h-[85vh]">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/40">
                <Trophy size={40} className="text-white" />
              </div>
              <h2 className="text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">Victory!</h2>
              <p className="text-indigo-200 text-lg mb-4 font-bold">Dungeon Cleared! Score: {score.toLocaleString()}</p>
              
              {useStore.getState().sessionQuestions.length > 0 && (
                <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar text-left space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10">
                  <h3 className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2">Knowledge Gained:</h3>
                  {useStore.getState().sessionQuestions.map((q, i) => (
                    <div key={i} className="border-l-2 border-indigo-500/50 pl-3 py-1">
                      <p className="text-white/90 text-sm font-medium mb-1">{q.question}</p>
                      <p className={`text-xs font-bold ${q.correct ? 'text-emerald-400' : 'text-indigo-400/60'}`}>
                        {q.correct ? '✓ Correct' : '✗ Missed'} — Answer: {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center mt-auto">
                <button 
                  onClick={() => setStatus(GameStatus.MENU)}
                  className="flex-1 px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-2xl"
                >
                  Home
                </button>
                <button 
                  onClick={onStart}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-500/40"
                >
                  Play Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Dashboard Area */}
      {status === GameStatus.PLAYING && (
        <div className="mt-auto w-full pointer-events-auto flex flex-col items-center">
          {/* Dashboard Background */}
          <div className="w-full bg-slate-950/90 backdrop-blur-xl border-t-4 border-slate-800 p-4 flex flex-col items-center gap-3 min-h-[15%] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            {/* Word Progress */}
            <div className="flex flex-wrap justify-center gap-2">
              {targetWord.map((letter, i) => {
                const isCollected = collectedLetters.includes(i);
                const isMissing = missingIndices.includes(i);
                const color = QUEST_COLORS[i % QUEST_COLORS.length];
                
                return (
                  <motion.div
                    key={i}
                    initial={isMissing ? { scale: 0.8, opacity: 0.5 } : { scale: 1, opacity: 1 }}
                    animate={isCollected ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: isMissing ? 0.3 : 1 }}
                    className={`
                      w-9 h-11 rounded-xl flex items-center justify-center text-xl font-black border-2
                      ${isCollected 
                        ? 'bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                        : 'bg-black/40 text-white/20 border-white/10'}
                    `}
                    style={isCollected ? { color: color } : {}}
                  >
                    {isCollected ? letter : (isMissing ? '?' : letter)}
                  </motion.div>
                );
              })}
            </div>

            {/* Boost Button (Mobile) - Integrated into Dashboard */}
            <div className="absolute right-6 bottom-6">
              <button 
                onMouseDown={() => setBoosting(true)}
                onMouseUp={() => setBoosting(false)}
                onTouchStart={() => setBoosting(true)}
                onTouchEnd={() => setBoosting(false)}
                className={`
                  p-4 rounded-full border-2 transition-all shadow-2xl
                  ${isBoosting 
                    ? 'bg-orange-500 border-orange-400 scale-95 shadow-orange-500/50' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'}
                `}
              >
                <Zap className={isBoosting ? "text-white fill-white" : "text-white"} size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
