/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState } from 'react';
import { useLocalGameStore } from '../../store/localQuestSnakeStore';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';

export function UI({ onPlayAgain }: { onPlayAgain: () => void }) {
  const { gameState, playerId, initGame, answerQuestion, resetGame, sessionQuestions } = useLocalGameStore();
  const [selectedColor, setSelectedColor] = useState('#d97706'); // Default Amber Gold

  const COLORS = [
    { name: 'Crimson', hex: '#dc2626' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Royal', hex: '#2563eb' },
    { name: 'Arcane', hex: '#7c3aed' },
    { name: 'Iron', hex: '#4b5563' },
    { name: 'Bronze', hex: '#92400e' },
    { name: 'Deep', hex: '#1e40af' },
  ];

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';
  const isPaused = gameState?.isPaused;
  const activeQuestion = gameState?.activeQuestion;
  const isMyQuestion = activeQuestion?.playerId === playerId;

  const handleAnswer = (idx: number) => {
    if (!activeQuestion) return;
    const correct = idx === activeQuestion.correctIndex;
    answerQuestion(correct);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-serif">
      {/* Loading Question Overlay */}
      <AnimatePresence>
        {isPaused && !activeQuestion && isAlive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-40"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-amber-500 font-bold uppercase tracking-[0.3em] text-sm animate-pulse">
                Consulting the Arcane...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto relative">
        <div className="flex flex-col gap-1 z-10">
          <h1 className="text-4xl font-bold text-amber-500 tracking-tight" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0 0 20px rgba(245,158,11,0.3)' }}>
            QUEST SNAKE
          </h1>
          <div className="text-xs uppercase tracking-[0.2em] text-amber-200/60 font-sans font-bold">
            Dungeon Crawler
          </div>
          {isAlive && (
            <div className="mt-2 px-3 py-1 bg-amber-950/40 border border-amber-500/30 rounded-md backdrop-blur-sm inline-block">
              <span className="text-amber-200/80 text-sm uppercase tracking-wider">Score: </span>
              <span className="text-amber-400 font-bold text-lg">{Math.floor(player.score)}</span>
            </div>
          )}
        </div>
        
        {/* Controls Hint */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex gap-4 opacity-80 pointer-events-none hidden sm:flex">
          <div className="flex items-center gap-2 text-xs font-sans text-amber-100 bg-amber-950/40 px-4 py-2 rounded-lg backdrop-blur-sm border border-amber-500/20 shadow-lg">
            <span className="font-bold bg-amber-500/20 px-2 py-1 rounded border border-amber-500/40">A</span>
            <span className="font-bold bg-amber-500/20 px-2 py-1 rounded border border-amber-500/40">D</span>
            <span className="text-amber-200/70 uppercase tracking-widest text-[10px] ml-1">Steer</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-sans text-amber-100 bg-amber-950/40 px-4 py-2 rounded-lg backdrop-blur-sm border border-amber-500/20 shadow-lg">
            <span className="font-bold bg-amber-500/20 px-2 py-1 rounded border border-amber-500/40">SPACE</span>
            <span className="text-amber-200/70 uppercase tracking-widest text-[10px] ml-1">Sprint</span>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <AnimatePresence>
        {activeQuestion && isMyQuestion && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-900 border-2 border-amber-600 p-8 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.2)] max-w-lg w-full"
            >
              <div className="flex items-center gap-3 mb-6 text-amber-500 uppercase tracking-[0.3em] text-xs font-bold border-b border-amber-900/50 pb-4">
                <span className="bg-amber-600 text-stone-900 px-2 py-0.5 rounded">?</span>
                Arcane Challenge
              </div>
              
              <h3 className="text-2xl text-amber-50 font-bold mb-8 leading-tight">
                {activeQuestion.question}
              </h3>
              
              <div className="grid gap-3">
                {activeQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full p-4 text-left bg-stone-800 hover:bg-amber-900/40 border border-stone-700 hover:border-amber-500/50 rounded-xl text-amber-200 transition-all active:scale-[0.98] group flex items-center gap-4"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-stone-700 group-hover:bg-amber-600 group-hover:text-stone-900 rounded-lg font-bold text-sm transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 text-center text-amber-500/40 text-[10px] uppercase tracking-widest">
                Correct answer grants +90 Power
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menus */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-stone-950/80 backdrop-blur-md"
          >
            <div className="bg-stone-900 p-10 rounded-3xl border border-amber-900/50 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-md w-full flex flex-col items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
              
              {isDead ? (
                <div className="text-center w-full max-h-[70vh] flex flex-col">
                  <h2 className="text-5xl font-bold text-red-600 mb-4 tracking-tighter" style={{ textShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
                    Fallen in Battle
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-amber-200/60 uppercase tracking-widest text-xs mb-4">
                    <span>Power Level: {Math.floor(player.score)}</span>
                  </div>
                  
                  {sessionQuestions.length > 0 && (
                    <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar text-left space-y-4 bg-black/20 p-4 rounded-xl border border-amber-900/20">
                      <h3 className="text-amber-500 font-bold uppercase tracking-widest text-[10px] mb-2">Arcane Knowledge Gained:</h3>
                      {sessionQuestions.map((q, i) => (
                        <div key={i} className="border-l-2 border-amber-900/50 pl-3 py-1">
                          <p className="text-amber-100/90 text-sm font-medium mb-1">{q.question}</p>
                          <p className={`text-xs font-bold ${q.correct ? 'text-emerald-500' : 'text-amber-500/60'}`}>
                            {q.correct ? '✓ Correct' : '✗ Missed'} — Answer: {q.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-amber-200/40 text-[10px] uppercase tracking-[0.2em] leading-relaxed mb-6">
                    Your journey ends here.<br />
                    Use another Quest Key to continue.
                  </p>

                  <button
                    onClick={() => {
                      onPlayAgain();
                      resetGame();
                    }}
                    className="w-full py-5 bg-amber-600 text-stone-950 font-black text-xl rounded-xl hover:bg-amber-500 transition-all active:scale-95 shadow-[0_10px_20px_rgba(217,119,6,0.2)] uppercase tracking-widest"
                  >
                    Play Again (1 Key)
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center w-full">
                    <h2 className="text-4xl font-bold text-amber-500 mb-4 tracking-tight">
                      Enter the Dungeon
                    </h2>
                    <p className="text-amber-200/40 text-xs uppercase tracking-[0.2em] leading-relaxed mb-6">
                      Steer with A/D keys<br />
                      Hold Space to sprint
                    </p>
                    
                    <div className="mb-2">
                      <div className="text-amber-500/60 text-[10px] uppercase tracking-widest mb-3 font-bold">
                        Choose Your Hero's Aura
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => setSelectedColor(c.hex)}
                            className={`w-full aspect-square rounded-lg border-2 transition-all ${
                              selectedColor === c.hex 
                                ? 'border-amber-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                : 'border-transparent opacity-50 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => initGame(selectedColor)}
                    className="w-full py-5 bg-amber-600 text-stone-950 font-black text-xl rounded-xl hover:bg-amber-500 transition-all active:scale-95 shadow-[0_10px_20px_rgba(217,119,6,0.2)] uppercase tracking-widest"
                  >
                    Begin Quest
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
