import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Timer, Target as TargetIcon, ArrowLeft, Sparkles, Zap, Lock } from 'lucide-react';
import { Assignment, AnswerBank, UserProfile } from '../types';

interface TargetPracticeProps {
  tries: number;
  onTryUsed: () => void;
  onScore: (score: number) => void;
  isLockedOut: boolean;
  parentSettings: any;
  assignments: Assignment[];
  answerBanks: AnswerBank[];
  user: UserProfile;
}

interface GameTarget {
  id: string;
  text: string;
  isCorrect: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Question {
  text: string;
  correctAnswer: string;
  distractors: string[];
}

const TARGET_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function TargetPracticeGame({ tries, onTryUsed, onScore, isLockedOut, parentSettings, assignments, answerBanks, user }: TargetPracticeProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(user.highScores?.['target-practice'] || 0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  const generateQuestion = useCallback(() => {
    // Combine assignments and answer banks for questions
    const allQuestions: Question[] = [];
    
    assignments.forEach(a => {
      if (a.status !== 'completed') {
        allQuestions.push({
          text: `What is the key concept of "${a.title}"?`,
          correctAnswer: a.topic || a.title,
          distractors: assignments.filter(other => other.id !== a.id).map(other => other.topic || other.title).slice(0, 5)
        });
      }
    });

    answerBanks.forEach(bank => {
      const keptConcepts = bank.concepts.filter(c => c.status === 'kept');
      keptConcepts.forEach(concept => {
        allQuestions.push({
          text: concept.definition,
          correctAnswer: concept.term,
          distractors: keptConcepts
            .filter(c => c.term !== concept.term)
            .map(c => c.term)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5)
        });
      });
    });

    if (allQuestions.length === 0) {
      // Fallback questions if no assignments/answer banks
      allQuestions.push({
        text: "What is 5 + 7?",
        correctAnswer: "12",
        distractors: ["10", "11", "13", "14"]
      });
      allQuestions.push({
        text: "What is the capital of France?",
        correctAnswer: "Paris",
        distractors: ["London", "Berlin", "Rome", "Madrid"]
      });
    }

    const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    setCurrentQuestion(randomQ);

    // Generate targets
    const answers = [
      { text: randomQ.correctAnswer, isCorrect: true },
      { text: randomQ.distractors[0] || "Wrong 1", isCorrect: false },
      { text: randomQ.distractors[1] || "Wrong 2", isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    const newTargets: GameTarget[] = answers.map((ans, i) => ({
      id: `target-${Date.now()}-${i}`,
      text: ans.text,
      isCorrect: ans.isCorrect,
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 60,
      color: TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)]
    }));

    setTargets(newTargets);
  }, [assignments, answerBanks]);

  const updatePhysics = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    // Define boundaries to avoid UI elements
    const headerHeight = 120; // Approx height of the top stats/timer bar
    const questionBoxHeight = 160; // Approx height of the bottom question box
    const archerWidth = 180; // Width of the archer silhouette area

    setTargets(prev => {
      const newTargets = prev.map(t => {
        let nx = t.x + t.vx;
        let ny = t.y + t.vy;
        let nvx = t.vx;
        let nvy = t.vy;

        // Bounce off walls with UI restrictions
        const minX = (ny > height - questionBoxHeight) ? archerWidth : 0;
        if (nx - t.radius < minX) {
          nvx *= -1;
          nx = minX + t.radius;
        } else if (nx + t.radius > width) {
          nvx *= -1;
          nx = width - t.radius;
        }

        const minY = headerHeight;
        const maxY = height - questionBoxHeight;

        if (ny - t.radius < minY) {
          nvy *= -1;
          ny = minY + t.radius;
        } else if (ny + t.radius > maxY) {
          nvy *= -1;
          ny = maxY - t.radius;
        }

        // Apply friction/slowing
        nvx *= 0.995;
        nvy *= 0.995;

        // Minimum speed
        if (Math.abs(nvx) < 0.2) nvx = (Math.random() - 0.5) * 2;
        if (Math.abs(nvy) < 0.2) nvy = (Math.random() - 0.5) * 2;

        return { ...t, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      // Target-to-target collision (bouncing)
      for (let i = 0; i < newTargets.length; i++) {
        for (let j = i + 1; j < newTargets.length; j++) {
          const t1 = newTargets[i];
          const t2 = newTargets[j];
          const dx = t2.x - t1.x;
          const dy = t2.y - t1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = t1.radius + t2.radius;

          if (distance < minDistance) {
            // Collision detected - resolve overlap
            const overlap = minDistance - distance;
            const nx = dx / distance;
            const ny = dy / distance;
            
            newTargets[i].x -= nx * overlap / 2;
            newTargets[i].y -= ny * overlap / 2;
            newTargets[j].x += nx * overlap / 2;
            newTargets[j].y += ny * overlap / 2;

            // Elastic collision (exchange velocities along normal)
            const p = (t1.vx * nx + t1.vy * ny - t2.vx * nx - t2.vy * ny);
            newTargets[i].vx -= p * nx;
            newTargets[i].vy -= p * ny;
            newTargets[j].vx += p * nx;
            newTargets[j].vy += p * ny;
          }
        }
      }

      return newTargets;
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updatePhysics);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updatePhysics]);

  const startGame = () => {
    if (tries <= 0 && !isLockedOut) return;
    onTryUsed();
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setGameState('playing');
    generateQuestion();
  };

  const handleTargetClick = (target: GameTarget) => {
    if (target.isCorrect) {
      const points = 100 + (streak * 20);
      setScore(s => s + points);
      setStreak(s => s + 1);
      generateQuestion();
    } else {
      // No penalty as per requirements
      // But maybe a visual feedback?
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameover');
      onScore(score);
      if (score > highScore) setHighScore(score);
    }
  }, [timeLeft, gameState, score, highScore, onScore]);

  return (
    <div className="relative w-full h-[600px] bg-[#fdf6e3] rounded-[3rem] border-8 border-[#e6d5b8] overflow-hidden shadow-2xl font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
      
      {/* UI Overlay */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="flex gap-4">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-[#e6d5b8] shadow-sm flex items-center gap-3">
            <Trophy className="text-amber-500" size={20} />
            <span className="font-black text-[#4a3f35] text-xl">{score}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-[#e6d5b8] shadow-sm flex items-center gap-3">
            <Zap className="text-blue-500" size={20} />
            <span className="font-black text-[#4a3f35] text-xl">{streak}</span>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-[#e6d5b8] shadow-sm flex items-center gap-3">
          <Timer className={timeLeft < 10 ? "text-red-500 animate-pulse" : "text-[#8c7b68]"} size={20} />
          <span className={cn("font-black text-xl", timeLeft < 10 ? "text-red-500" : "text-[#4a3f35]")}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full relative">
        {isLockedOut ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#fdf6e3]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-32 h-32 bg-white border-4 border-[#e6d5b8] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                <Lock className="text-[#8c7b68]" size={64} />
              </div>
              <div>
                <h2 className="text-5xl font-black text-[#4a3f35] uppercase tracking-tighter mb-2">Arena Locked</h2>
                <p className="text-[#8c7b68] font-bold max-w-sm mx-auto">
                  Your parent has locked games between {parentSettings?.schoolHoursStart} and {parentSettings?.schoolHoursEnd} 
                  {parentSettings?.blockedDaysType === 'weekdays' ? ' on weekdays' : parentSettings?.blockedDaysType === 'weekends' ? ' on weekends' : ''}.
                </p>
              </div>
            </motion.div>
          </div>
        ) : gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#fdf6e3]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-32 h-32 bg-[#ef4444] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border-4 border-white">
                <TargetIcon size={64} className="text-white" />
              </div>
              <div>
                <h2 className="text-5xl font-black text-[#4a3f35] uppercase tracking-tighter mb-2">Target Practice</h2>
                <p className="text-[#8c7b68] font-bold">Aim true and hit the correct answers!</p>
              </div>
              <button 
                onClick={startGame}
                disabled={tries <= 0 && !isLockedOut}
                className="group relative px-12 py-6 bg-[#ef4444] text-white rounded-[2rem] font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="relative z-10">START QUEST</span>
                <div className="absolute inset-0 bg-white/20 rounded-[2rem] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
              {tries <= 0 && !isLockedOut && (
                <p className="text-rose-500 font-bold animate-bounce">Out of Quest Keys! Wait for school hours or a refill.</p>
              )}
            </motion.div>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Archer Silhouette */}
            <div className="absolute bottom-0 left-0 w-64 h-64 z-10 pointer-events-none">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                {/* Archer Body */}
                <g fill="#2d241e">
                  {/* Legs */}
                  <path d="M60,185 L70,155 L80,155 L90,185 Z" />
                  {/* Torso */}
                  <path d="M55,155 L85,155 L80,125 L60,125 Z" />
                  {/* Head */}
                  <circle cx="70" cy="115" r="10" />
                  {/* Arms */}
                  <path d="M60,130 L95,125 M60,130 L90,145" stroke="#2d241e" strokeWidth="6" strokeLinecap="round" fill="none" />
                </g>
                
                {/* Bow */}
                <path 
                  d="M100,100 Q145,130 100,160" 
                  fill="none" 
                  stroke="#8b5cf6" 
                  strokeWidth="5" 
                  strokeLinecap="round" 
                />
                <line 
                  x1="100" y1="100" 
                  x2="100" y2="160" 
                  stroke="#e6d5b8" 
                  strokeWidth="1.5" 
                  strokeDasharray="2,2"
                />
                
                {/* Arrow */}
                <g transform="translate(85, 130) rotate(-5)">
                  <line 
                    x1="0" y1="0" 
                    x2="55" y2="0" 
                    stroke="#4a3f35" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                  <path d="M55,0 L48,-4 L48,4 Z" fill="#4a3f35" />
                  {/* Fletching */}
                  <path d="M0,0 L8,-5 L15,0 L8,5 Z" fill="#ef4444" />
                </g>
                
                {/* Quiver on back */}
                <rect x="45" y="130" width="12" height="35" rx="3" fill="#4a3f35" transform="rotate(-30 50 145)" />
              </svg>
            </div>

            {/* Question Area */}
            <div className="absolute bottom-12 left-56 right-12 z-20">
              <motion.div 
                key={currentQuestion?.text}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border-4 border-[#e6d5b8] shadow-xl"
              >
                <p className="text-2xl font-black text-[#4a3f35] text-center">
                  {currentQuestion?.text}
                </p>
              </motion.div>
            </div>

            {/* Targets */}
            <AnimatePresence>
              {targets.map(target => (
                <motion.button
                  key={target.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => handleTargetClick(target)}
                  style={{ 
                    position: 'absolute',
                    left: target.x - target.radius,
                    top: target.y - target.radius,
                    width: target.radius * 2,
                    height: target.radius * 2,
                  }}
                  className="rounded-full flex items-center justify-center p-4 text-center cursor-pointer group"
                >
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-white shadow-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: target.color }}
                  />
                  {/* Bullseye Rings */}
                  <div className="absolute inset-2 rounded-full border-2 border-white/30" />
                  <div className="absolute inset-4 rounded-full border-2 border-white/30" />
                  <div className="absolute inset-6 rounded-full border-2 border-white/30" />
                  
                  <span className="relative z-10 text-white font-black text-sm leading-tight drop-shadow-md">
                    {target.text}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[#fdf6e3]/90 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center space-y-8 max-w-md w-full px-8"
            >
              <div className="text-6xl mb-4">🏹</div>
              <h2 className="text-5xl font-black text-[#4a3f35] uppercase tracking-tighter">Quest Complete!</h2>
              
              <div className="bg-white rounded-3xl p-8 border-4 border-[#e6d5b8] shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#8c7b68] uppercase tracking-widest text-sm">Final Score</span>
                  <span className="text-4xl font-black text-[#ef4444]">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#8c7b68] uppercase tracking-widest text-sm">Best Streak</span>
                  <span className="text-2xl font-black text-blue-500">{streak}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="pt-4 flex items-center justify-center gap-2 text-[#f59e0b] font-black uppercase tracking-widest text-sm">
                    <Sparkles size={16} /> New High Score! <Sparkles size={16} />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setGameState('start')}
                  className="flex-1 py-5 bg-[#8c7b68] text-white rounded-2xl font-black text-xl shadow-lg hover:bg-[#7a6a59] transition-all"
                >
                  MENU
                </button>
                <button 
                  onClick={startGame}
                  className="flex-[2] py-5 bg-[#ef4444] text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  PLAY AGAIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
