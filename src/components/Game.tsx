import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gamepad2, Timer, RefreshCw, Lock, Sparkles, Key, Zap, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import Matter from 'matter-js';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';
import { Assignment, UserProfile, AnswerBank } from '../types';

export interface GameProps {
  tries: number;
  onTryUsed: () => void;
  onScore: (score: number) => void;
  isSchoolHours: boolean;
  grade?: string;
  assignments: Assignment[];
  answerBanks?: AnswerBank[];
  user: UserProfile;
}

interface Tile {
  id: string;
  word: string;
  category: string;
  selected: boolean;
}

const DEFAULT_CONCEPTS = [
  { category: 'Science', words: ['Atom', 'Cell', 'Energy', 'Photosynthesis', 'Molecule', 'Gravity', 'Evolution', 'DNA'] },
  { category: 'History', words: ['Colony', 'Revolution', 'Constitution', 'Empire', 'Treaty', 'Dynasty', 'Civilization', 'Monarchy'] },
  { category: 'Math', words: ['Fraction', 'Denominator', 'Equation', 'Geometry', 'Algebra', 'Calculus', 'Integer', 'Variable'] }
];

const getGameConcepts = async (assignments: Assignment[], grade?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const topics = assignments.map(a => `${a.subject}: ${a.topic}`).join(', ');
  const gradeContext = grade ? `for a ${grade} student` : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate educational matching game concepts ${gradeContext}. 
      Use these assignment topics as inspiration: ${topics}.
      If there aren't enough topics, add relevant ones for this grade.
      
      Return a JSON object with:
      - groups: array of { category: string, words: string[] }
      Each group MUST have at least 8 words.
      Provide at least 6 distinct categories.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  words: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["category", "words"]
              }
            }
          },
          required: ["groups"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.groups || DEFAULT_CONCEPTS;
  } catch (err) {
    console.error("Failed to generate game concepts:", err);
    return DEFAULT_CONCEPTS;
  }
};

export function ConceptMatchGame({ tries, onTryUsed, onScore, isSchoolHours, grade, assignments, answerBanks, user }: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'gameover'>('idle');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [concepts, setConcepts] = useState<any[]>(DEFAULT_CONCEPTS);

  const generateTiles = useCallback(async () => {
    setGameState('loading');
    let gameConcepts = DEFAULT_CONCEPTS;
    
    if (answerBanks && answerBanks.length > 0) {
      // Convert answer banks to game concepts format
      const bankConcepts = answerBanks.flatMap(bank => {
        const assignment = assignments.find(a => a.id === bank.assignmentId);
        if (!assignment) return [];
        
        const keptConcepts = bank.concepts.filter(c => c.status === 'kept');
        if (keptConcepts.length < 4) return []; 
        
        return [{
          category: assignment.title,
          words: keptConcepts.map(c => c.term)
        }];
      });
      
      if (bankConcepts.length >= 2) { 
        gameConcepts = bankConcepts;
      }
    } else {
      // Fallback to AI generation based on assignments and grade
      const aiConcepts = await getGameConcepts(assignments, grade);
      if (aiConcepts && aiConcepts.length > 0) {
        gameConcepts = aiConcepts;
      }
    }

    setConcepts(gameConcepts);
    const newTiles: Tile[] = [];
    
    // Pick 4 categories (or repeat if not enough)
    const availableCategories = [...gameConcepts];
    const selectedCategories = [];
    for (let i = 0; i < 4; i++) {
      selectedCategories.push(availableCategories[i % availableCategories.length]);
    }
    
    selectedCategories.forEach(concept => {
      const shuffled = [...concept.words].sort(() => Math.random() - 0.5).slice(0, 4);
      shuffled.forEach(word => {
        newTiles.push({
          id: Math.random().toString(36).substr(2, 9),
          word,
          category: concept.category,
          selected: false
        });
      });
    });
    setTiles(newTiles.sort(() => Math.random() - 0.5));
    setGameState('playing');
    setTimeLeft(60);
  }, [assignments, answerBanks, grade]);

  const startGame = () => {
    if (tries <= 0 || isSchoolHours) return;
    onTryUsed();
    setScore(0);
    generateTiles();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameover');
      onScore(score);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, onScore]);

  const handleTileClick = (tile: Tile) => {
    if (gameState !== 'playing' || tile.selected) return;

    const newSelected = [...selectedTiles, { ...tile, selected: true }];
    setSelectedTiles(newSelected);
    setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, selected: true } : t));

    if (newSelected.length === 4) {
      const firstCategory = newSelected[0].category;
      const allMatch = newSelected.every(t => t.category === firstCategory);

      if (allMatch) {
        setScore(prev => prev + 100);
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399']
        });
        // Remove tiles and replace
        setTimeout(() => {
          setTiles(prev => {
            const remaining = prev.filter(t => !newSelected.find(ns => ns.id === t.id));
            const newBatch: Tile[] = [];
            
            // Find a new category or reuse one but with new words
            const usedCategories = remaining.map(t => t.category);
            const availableConcepts = concepts.filter(c => !usedCategories.includes(c.category));
            const nextConcept = availableConcepts.length > 0 
              ? availableConcepts[Math.floor(Math.random() * availableConcepts.length)]
              : concepts[Math.floor(Math.random() * concepts.length)];

            const shuffled = [...nextConcept.words].sort(() => Math.random() - 0.5).slice(0, 4);
            shuffled.forEach(word => {
              newBatch.push({
                id: Math.random().toString(36).substr(2, 9),
                word,
                category: nextConcept.category,
                selected: false
              });
            });
            return [...remaining, ...newBatch].sort(() => Math.random() - 0.5);
          });
          setSelectedTiles([]);
        }, 300);
      } else {
        // Reset selection
        setTimeout(() => {
          setTiles(prev => prev.map(t => ({ ...t, selected: false })));
          setSelectedTiles([]);
        }, 500);
      }
    }
  };

  return (
    <div className="bg-[#fdf6e3] rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg p-6 text-[#4a3f35] overflow-hidden relative min-h-[500px] flex flex-col font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8b5cf6] rounded-xl flex items-center justify-center text-white shadow-md border-2 border-[#7c3aed]">
            <Gamepad2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">Concept Match</h3>
            <p className="text-xs font-bold text-[#8c7b68] font-sans">Connect 4 matching concepts</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border-2 border-[#e6d5b8] shadow-sm">
            <Timer size={16} className="text-[#8b5cf6]" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border-2 border-[#e6d5b8] shadow-sm">
            <Trophy size={16} className="text-amber-500" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </div>

      {isSchoolHours ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-white border-4 border-[#e6d5b8] rounded-3xl flex items-center justify-center mb-6 text-[#8c7b68]">
            <Lock size={40} />
          </div>
          <h4 className="text-2xl font-black mb-2 uppercase tracking-widest">School Mode Active</h4>
          <p className="text-[#8c7b68] max-w-xs font-sans font-medium">The arena is locked during school hours. Focus on your studies to earn more keys for later!</p>
        </div>
      ) : gameState === 'idle' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-full flex items-center justify-center mb-8 shadow-lg">
            <Gamepad2 size={48} className="text-[#8b5cf6]" />
          </div>
          <h4 className="text-3xl font-black mb-4 uppercase tracking-widest text-[#4a3f35]">Ready for Battle?</h4>
          <p className="text-[#8c7b68] mb-8 max-w-xs font-sans font-medium">Connect 4 tiles of the same subject to score points. Each battle costs 1 Quest Key.</p>
          <button 
            onClick={startGame}
            disabled={tries <= 0}
            className={cn(
              "px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl border-2 font-sans uppercase tracking-widest",
              tries > 0 
                ? "bg-[#8b5cf6] hover:bg-[#7c3aed] border-[#7c3aed] text-white shadow-[#8b5cf6]/20" 
                : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
            )}
          >
            {tries > 0 ? `Enter Arena (${tries} Keys Left)` : 'No Keys Left'}
          </button>
        </div>
      ) : gameState === 'loading' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-full flex items-center justify-center mb-8 shadow-lg animate-spin">
            <RefreshCw size={48} className="text-[#8b5cf6]" />
          </div>
          <h4 className="text-2xl font-black mb-4 uppercase tracking-widest">Summoning Concepts...</h4>
          <p className="text-[#8c7b68] max-w-xs font-sans font-medium">The wizards are creating a custom challenge based on your quests.</p>
        </div>
      ) : gameState === 'playing' ? (
        <div className="relative z-10 flex-1 grid grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <motion.button
              key={tile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTileClick(tile)}
              className={cn(
                "aspect-square p-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border-4 flex items-center justify-center text-center shadow-lg font-serif",
                tile.selected 
                  ? "bg-[#8b5cf6] border-[#7c3aed] text-white shadow-[#8b5cf6]/20" 
                  : "bg-[#fdf6e3] border-[#e6d5b8] text-[#4a3f35] hover:border-[#d4c4a8]"
              )}
            >
              {tile.word}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <h4 className="text-3xl font-black mb-2 text-amber-400">Game Over!</h4>
          <p className="text-slate-400 mb-8">You scored {score} points!</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setGameState('idle')}
              className="px-6 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-all"
            >
              Back to Menu
            </button>
            <button 
              onClick={startGame}
              disabled={tries <= 0}
              className="px-6 py-3 bg-brand-500 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function GravityMatchGame({ tries, onTryUsed, onScore, isSchoolHours, assignments, answerBanks, grade, user }: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [concepts, setConcepts] = useState<any[]>(DEFAULT_CONCEPTS);
  const [matchedGroups, setMatchedGroups] = useState<{category: string, words: string[]}[]>([]);
  
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const bodiesRef = useRef<Map<string, { body: Matter.Body, data: Tile }>>(new Map());

  const startGame = async () => {
    if (tries <= 0 || isSchoolHours) return;
    onTryUsed();
    setGameState('loading');
    setScore(0);
    setSelectedIds([]);
    setMatchedGroups([]);
    
    let gameConcepts = DEFAULT_CONCEPTS;
    if (answerBanks && answerBanks.length > 0) {
      const bankConcepts = answerBanks.flatMap(bank => {
        const assignment = assignments.find(a => a.id === bank.assignmentId);
        if (!assignment) return [];
        const keptConcepts = bank.concepts.filter(c => c.status === 'kept');
        if (keptConcepts.length < 4) return [];
        return [{
          category: assignment.title,
          words: keptConcepts.map(c => c.term)
        }];
      });
      if (bankConcepts.length >= 4) {
        gameConcepts = bankConcepts;
      }
    } else {
      const aiConcepts = await getGameConcepts(assignments, grade);
      if (aiConcepts && aiConcepts.length > 0) {
        gameConcepts = aiConcepts;
      }
    }
    
    setTimeout(() => {
      setConcepts(gameConcepts);
      setGameState('playing');
      setTimeLeft(60);
    }, 1000);
  };

  // Physics Setup
  useEffect(() => {
    if (gameState !== 'playing' || !sceneRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: 600,
        wireframes: false,
        background: 'transparent'
      }
    });
    renderRef.current = render;

    const ground = Matter.Bodies.rectangle(
      sceneRef.current.clientWidth / 2, 
      610, 
      sceneRef.current.clientWidth, 
      20, 
      { isStatic: true, render: { visible: false } }
    );
    const leftWall = Matter.Bodies.rectangle(-10, 300, 20, 600, { isStatic: true, render: { visible: false } });
    const rightWall = Matter.Bodies.rectangle(sceneRef.current.clientWidth + 10, 300, 20, 600, { isStatic: true, render: { visible: false } });

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Initial Drop
    if (concepts.length > 0) {
      for (let i = 0; i < 5; i++) {
        dropBatch();
      }
    }

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [gameState]);

  const dropBatch = () => {
    if (!engineRef.current || !sceneRef.current || concepts.length === 0) return;

    // Get currently active words on screen to avoid duplicates
    const activeWords = new Set(Array.from(bodiesRef.current.values()).map((v: any) => v.data.word));
    
    // Find a concept that has at least 3 words not currently on screen
    const availableConcepts = concepts.filter(c => 
      c.words.filter(w => !activeWords.has(w)).length >= 3
    );

    const randomConcept = availableConcepts.length > 0 
      ? availableConcepts[Math.floor(Math.random() * availableConcepts.length)]
      : concepts[Math.floor(Math.random() * concepts.length)];

    const availableWords = randomConcept.words.filter(w => !activeWords.has(w));
    const wordsToDrop = availableWords.length >= 3 
      ? availableWords.sort(() => Math.random() - 0.5).slice(0, 3)
      : [...randomConcept.words].sort(() => Math.random() - 0.5).slice(0, 3);
    
    wordsToDrop.forEach((word, i) => {
      const id = Math.random().toString(36).substr(2, 9);
      const x = Math.random() * (sceneRef.current!.clientWidth - 100) + 50;
      const y = -50 - (i * 100);
      
      const shapeType = Math.floor(Math.random() * 3);
      let body;
      const size = (Math.random() * 20 + 60) * 1.5; // Doubled size (base was 40-60, now 90-120)

      if (shapeType === 0) {
        body = Matter.Bodies.rectangle(x, y, size * 2, size, {
          chamfer: { radius: 15 },
          render: { fillStyle: '#1e293b', strokeStyle: '#334155', lineWidth: 3 }
        });
      } else if (shapeType === 1) {
        body = Matter.Bodies.circle(x, y, size, {
          render: { fillStyle: '#1e293b', strokeStyle: '#334155', lineWidth: 3 }
        });
      } else {
        body = Matter.Bodies.polygon(x, y, 6, size, {
          render: { fillStyle: '#1e293b', strokeStyle: '#334155', lineWidth: 3 }
        });
      }

      const data: Tile = { id, word, category: randomConcept.category, selected: false };
      body.label = id;
      bodiesRef.current.set(id, { body, data });
      Matter.Composite.add(engineRef.current!.world, body);
    });
  };

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameover');
      onScore(score);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, onScore]);

  // Click Handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState !== 'playing' || !engineRef.current || !sceneRef.current) return;
    
    const rect = sceneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBody = Matter.Query.point(Matter.Composite.allBodies(engineRef.current.world), { x, y })[0];
    if (clickedBody && clickedBody.label !== 'Rectangle Body') { // Ignore walls/ground
      const id = clickedBody.label;
      const entry = bodiesRef.current.get(id);
      if (!entry || selectedIds.includes(id)) return;

      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      
      // Highlight body
      clickedBody.render.fillStyle = '#a855f7'; // Purple-500
      clickedBody.render.strokeStyle = '#d8b4fe'; // Purple-300
      // We don't make it a sensor yet, so it keeps colliding but stays selected
      
      if (newSelected.length === 3) {
        const entries = newSelected.map(sid => bodiesRef.current.get(sid)!);
        const firstCategory = entries[0].data.category;
        const allMatch = entries.every(e => e.data.category === firstCategory);

        if (allMatch) {
          setScore(prev => prev + 150);
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
          
          setMatchedGroups(prev => [...prev, { category: firstCategory, words: entries.map(e => e.data.word) }]);

          // Explosion effect: apply force to all bodies
          const allBodies = Matter.Composite.allBodies(engineRef.current!.world);
          allBodies.forEach(body => {
            if (body.label !== 'Rectangle Body') {
              const forceMagnitude = 0.02 * body.mass;
              Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * forceMagnitude,
                y: -forceMagnitude * 2
              });
            }
          });

          // Matched shapes fly off screen
          entries.forEach(e => {
            e.body.isSensor = true;
            Matter.Body.setVelocity(e.body, { 
              x: (Math.random() - 0.5) * 20, 
              y: -15 
            });
          });

          setTimeout(() => {
            entries.forEach(e => {
              Matter.Composite.remove(engineRef.current!.world, e.body);
              bodiesRef.current.delete(e.data.id);
            });
            setSelectedIds([]);
            dropBatch();
          }, 800);
        } else {
          // Reset highlights
          setTimeout(() => {
            entries.forEach(e => {
              if (e.body) {
                e.body.render.fillStyle = '#1e293b';
                e.body.render.strokeStyle = '#334155';
              }
            });
            setSelectedIds([]);
          }, 500);
        }
      }
    }
  };

  // Custom rendering for labels
  useEffect(() => {
    if (gameState !== 'playing' || !renderRef.current) return;
    
    const context = renderRef.current.context;
    const renderLabels = () => {
      if (gameState !== 'playing') return;
      
      // Clear labels area if needed (Matter.js handles canvas clear, but we draw on top)
      
      bodiesRef.current.forEach(({ body, data }) => {
        // Only render if body is not matched (isSensor is true when matched)
        if (!body.isSensor) {
          const { x, y } = body.position;
          context.save();
          context.translate(x, y);
          context.rotate(body.angle);
          context.fillStyle = 'white';
          context.font = 'bold 24px Inter'; // Doubled font size
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          // Wrap text if too long
          const words = data.word.split(' ');
          if (words.length > 1) {
            context.fillText(words[0], 0, -12);
            context.fillText(words.slice(1).join(' '), 0, 16);
          } else {
            context.fillText(data.word, 0, 0);
          }
          
          context.restore();
        }
      });
      
      requestAnimationFrame(renderLabels);
    };
    
    const animId = requestAnimationFrame(renderLabels);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="bg-[#fdf6e3] rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg p-6 text-[#4a3f35] overflow-hidden relative min-h-[700px] flex flex-col font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8b5cf6] rounded-xl flex items-center justify-center text-white shadow-md border-2 border-[#7c3aed]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">Gravity Drop</h3>
            <p className="text-xs font-bold text-[#8c7b68] font-sans">Match 3 falling shapes</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest">Streak</p>
              <p className="text-sm font-black text-orange-500">{user.streak}d</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest">Keys</p>
              <p className="text-sm font-black text-[#8b5cf6]">{user.tries}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border-2 border-[#e6d5b8] shadow-sm">
            <Timer size={16} className="text-[#8b5cf6]" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border-2 border-[#e6d5b8] shadow-sm">
            <Trophy size={16} className="text-amber-500" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </div>

      {isSchoolHours ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-white border-4 border-[#e6d5b8] rounded-3xl flex items-center justify-center mb-6 text-[#8c7b68]">
            <Lock size={40} />
          </div>
          <h4 className="text-2xl font-black mb-2 uppercase tracking-widest">School Mode Active</h4>
          <p className="text-[#8c7b68] max-w-xs font-sans font-medium">The arena is locked during school hours. Focus on your studies to earn more keys for later!</p>
        </div>
      ) : gameState === 'idle' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-full flex items-center justify-center mb-8 shadow-lg">
            <Sparkles size={48} className="text-[#8b5cf6]" />
          </div>
          <h4 className="text-3xl font-black mb-4 uppercase tracking-widest text-[#4a3f35]">Gravity Challenge</h4>
          <p className="text-[#8c7b68] mb-8 max-w-xs font-sans font-medium">Match 3 shapes of the same subject. Watch them fall and bounce! Each battle costs 1 Quest Key.</p>
          <button 
            onClick={startGame}
            disabled={tries <= 0}
            className={cn(
              "px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl border-2 font-sans uppercase tracking-widest",
              tries > 0 
                ? "bg-[#8b5cf6] hover:bg-[#7c3aed] border-[#7c3aed] text-white shadow-[#8b5cf6]/20" 
                : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
            )}
          >
            {tries > 0 ? `Enter Arena (${tries} Keys Left)` : 'No Keys Left'}
          </button>
        </div>
      ) : gameState === 'loading' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-full flex items-center justify-center mb-8 shadow-lg animate-spin">
            <RefreshCw size={48} className="text-[#8b5cf6]" />
          </div>
          <h4 className="text-2xl font-black mb-4 uppercase tracking-widest">Summoning Concepts...</h4>
          <p className="text-[#8c7b68] max-w-xs font-sans font-medium">The wizards are creating a custom challenge based on your quests.</p>
        </div>
      ) : gameState === 'playing' ? (
        <div className="relative z-10 flex-1 flex gap-4 overflow-hidden">
          <div 
            ref={sceneRef} 
            onClick={handleCanvasClick}
            className="flex-1 relative cursor-crosshair rounded-2xl overflow-hidden bg-white/50 border-4 border-[#e6d5b8] shadow-inner"
          />
          <div className="w-48 bg-white/80 rounded-2xl border-4 border-[#e6d5b8] p-4 overflow-y-auto space-y-4">
            <h4 className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest text-center">Matched Groups</h4>
            <div className="space-y-2">
              {matchedGroups.map((group, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-2 bg-[#fdf6e3] rounded-lg border-2 border-[#e6d5b8]"
                >
                  <p className="text-[10px] font-black text-[#8b5cf6] uppercase mb-1">{group.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.words.map((w, i) => (
                      <span key={i} className="text-[8px] font-bold bg-white border border-[#e6d5b8] text-[#4a3f35] px-1 rounded font-sans">{w}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <h4 className="text-4xl font-black mb-2 text-amber-500 uppercase tracking-widest">Battle Complete!</h4>
          <p className="text-[#8c7b68] mb-8 font-sans font-medium">You scored {score} points!</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setGameState('idle')}
              className="px-6 py-3 bg-white border-2 border-[#e6d5b8] text-[#4a3f35] rounded-xl font-black hover:bg-[#fdf6e3] transition-all font-sans uppercase tracking-widest"
            >
              Back to Menu
            </button>
            <button 
              onClick={startGame}
              disabled={tries <= 0}
              className="px-6 py-3 bg-[#8b5cf6] border-2 border-[#7c3aed] text-white rounded-xl font-black hover:bg-[#7c3aed] transition-all shadow-lg shadow-[#8b5cf6]/20 font-sans uppercase tracking-widest disabled:opacity-50"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestRunGame({ tries, onTryUsed, onScore, isSchoolHours, assignments, answerBanks, user }: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [characterType, setCharacterType] = useState<'wizard' | 'gamer' | 'knight'>('wizard');
  const [currentQuestion, setCurrentQuestion] = useState<{q: string, a: string} | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const speedRef = useRef(3); // Slower initial speed
  
  // Game objects
  const characterRef = useRef({ 
    y: 300, 
    vy: 0, 
    isJumping: false, 
    width: 50, 
    height: 60,
    frame: 0
  });
  const itemsRef = useRef<{x: number, y: number, text: string, isCorrect: boolean, id: string, collected: boolean}[]>([]);
  const obstaclesRef = useRef<{x: number, width: number, height: number, id: string}[]>([]);
  const questionsRef = useRef<{q: string, a: string}[]>([]);
  const backgroundRef = useRef<{x: number, type: 'cloud' | 'tree', speed: number}[]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
    scoreRef.current = score;
    livesRef.current = lives;
  }, [gameState, score, lives]);

  const generateQuestions = useCallback(() => {
    if (!answerBanks || answerBanks.length === 0) {
      return [
        { q: "What is 5 + 5?", a: "10" },
        { q: "What is the capital of USA?", a: "Washington D.C." },
        { q: "What planet is the Red Planet?", a: "Mars" }
      ];
    }

    const allQuestions: {q: string, a: string}[] = [];
    answerBanks.forEach(bank => {
      const keptConcepts = bank.concepts.filter(c => c.status === 'kept');
      keptConcepts.forEach(concept => {
        allQuestions.push({
          q: concept.definition,
          a: concept.term
        });
      });
    });

    return allQuestions.length > 0 ? allQuestions.sort(() => Math.random() - 0.5) : [
      { q: "What is 2 + 2?", a: "4" }
    ];
  }, [answerBanks]);

  const startGame = () => {
    if (tries <= 0 || isSchoolHours) return;
    onTryUsed();
    setGameState('loading');
    setScore(0);
    setStreak(0);
    setLives(3);
    speedRef.current = 3;
    characterRef.current = { y: 300, vy: 0, isJumping: false, width: 50, height: 60, frame: 0 };
    itemsRef.current = [];
    obstaclesRef.current = [];
    backgroundRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * 800,
      type: Math.random() > 0.5 ? 'cloud' : 'tree',
      speed: Math.random() * 0.5 + 0.2
    }));
    
    const qs = generateQuestions();
    questionsRef.current = qs;
    setCurrentQuestion(qs[0]);
    
    setTimeout(() => {
      setGameState('playing');
    }, 1000);
  };

  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    let spawnTimer = 0;
    let obstacleTimer = 0;

    const update = (time: number) => {
      if (gameStateRef.current !== 'playing') return;
      const deltaTime = time - lastTime;
      lastTime = time;

      // Gravity & Jump
      characterRef.current.vy += 0.6; // Gravity
      characterRef.current.y += characterRef.current.vy;
      
      if (characterRef.current.y > 300) {
        characterRef.current.y = 300;
        characterRef.current.vy = 0;
        characterRef.current.isJumping = false;
      }
      
      characterRef.current.frame += 0.1;

      // Background
      backgroundRef.current.forEach(bg => {
        bg.x -= speedRef.current * bg.speed;
        if (bg.x < -100) bg.x = 850;
      });

      // Spawn Items (Answers)
      spawnTimer += deltaTime;
      if (spawnTimer > 2000) {
        if (currentQuestion) {
          itemsRef.current.push({
            x: 850,
            y: 200 + Math.random() * 100,
            text: currentQuestion.a,
            isCorrect: true,
            id: Math.random().toString(36).substr(2, 9),
            collected: false
          });
        }
        spawnTimer = 0;
      }

      // Spawn Obstacles
      obstacleTimer += deltaTime;
      if (obstacleTimer > 3000) {
        obstaclesRef.current.push({
          x: 850,
          width: 30 + Math.random() * 20,
          height: 30 + Math.random() * 40,
          id: Math.random().toString(36).substr(2, 9)
        });
        obstacleTimer = 0;
      }

      // Update Items
      itemsRef.current.forEach(item => {
        item.x -= speedRef.current;
      });
      itemsRef.current = itemsRef.current.filter(item => item.x > -200 && !item.collected);

      // Update Obstacles
      obstaclesRef.current.forEach(obs => {
        obs.x -= speedRef.current;
      });
      obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x > -100);

      // Collisions
      const charRect = {
        x: 100,
        y: characterRef.current.y,
        w: characterRef.current.width,
        h: characterRef.current.height
      };

      // Item collision
      itemsRef.current.forEach(item => {
        if (!item.collected && 
            charRect.x < item.x + 100 && 
            charRect.x + charRect.w > item.x && 
            charRect.y < item.y + 40 && 
            charRect.y + charRect.h > item.y) {
          
          item.collected = true;
          setScore(prev => prev + 100);
          setStreak(prev => prev + 1);
          speedRef.current += 0.05;
          
          // Next question
          questionsRef.current.shift();
          if (questionsRef.current.length === 0) {
            questionsRef.current = generateQuestions();
          }
          setCurrentQuestion(questionsRef.current[0]);
        }
      });

      // Obstacle collision
      obstaclesRef.current.forEach(obs => {
        if (charRect.x < obs.x + obs.width && 
            charRect.x + charRect.w > obs.x && 
            charRect.y + charRect.h > 360 - obs.height) {
          
          // Hit obstacle
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameover');
              onScore(scoreRef.current);
            }
            return newLives;
          });
          setStreak(0);
          obstaclesRef.current = obstaclesRef.current.filter(o => o.id !== obs.id);
        }
      });

      draw();
      animationId = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#bae6fd');
      skyGradient.addColorStop(1, '#fdf6e3');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background elements
      backgroundRef.current.forEach(bg => {
        if (bg.type === 'cloud') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(bg.x, 100, 30, 0, Math.PI * 2);
          ctx.arc(bg.x + 25, 110, 25, 0, Math.PI * 2);
          ctx.arc(bg.x - 25, 110, 25, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.moveTo(bg.x, 360);
          ctx.lineTo(bg.x - 20, 360);
          ctx.lineTo(bg.x, 300);
          ctx.lineTo(bg.x + 20, 360);
          ctx.fill();
        }
      });

      // Ground
      ctx.fillStyle = '#e6d5b8';
      ctx.fillRect(0, 360, canvas.width, 40);
      ctx.fillStyle = '#d4c4a8';
      ctx.fillRect(0, 360, canvas.width, 4);

      // Character
      const charX = 100;
      const charY = characterRef.current.y;
      const bounce = Math.sin(characterRef.current.frame) * 5;
      
      ctx.save();
      ctx.translate(charX, charY + (characterRef.current.isJumping ? 0 : bounce));
      
      // Draw character body
      ctx.fillStyle = characterType === 'wizard' ? '#8b5cf6' : characterType === 'gamer' ? '#3b82f6' : '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(0, 0, 40, 50, 10);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(30, 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(32, 15, 2, 0, Math.PI * 2);
      ctx.fill();

      // Hat/Helmet
      if (characterType === 'wizard') {
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(20, -25);
        ctx.lineTo(45, 5);
        ctx.fill();
      } else if (characterType === 'knight') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(5, -5, 30, 15);
      }
      
      ctx.restore();

      // Items (Answers)
      itemsRef.current.forEach(item => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(item.x, item.y, 180, 50, 25);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#4a3f35';
        ctx.font = 'bold 22px sans-serif'; // Larger font
        ctx.textAlign = 'center';
        ctx.fillText(item.text, item.x + 90, item.y + 32);
      });

      // Obstacles
      obstaclesRef.current.forEach(obs => {
        ctx.fillStyle = '#4a3f35';
        ctx.beginPath();
        ctx.moveTo(obs.x, 360);
        ctx.lineTo(obs.x + obs.width / 2, 360 - obs.height);
        ctx.lineTo(obs.x + obs.width, 360);
        ctx.fill();
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!characterRef.current.isJumping) {
          characterRef.current.vy = -15;
          characterRef.current.isJumping = true;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, characterType, generateQuestions, currentQuestion]);

  return (
    <div className="bg-[#fdf6e3] rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg p-6 text-[#4a3f35] overflow-hidden relative min-h-[600px] flex flex-col font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-md border-2 border-brand-600">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest">Quest Run</h3>
            <p className="text-xs font-bold text-[#8c7b68] font-sans">Run, Jump, and Conquer!</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest">Lives</p>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={cn("w-3 h-3 rounded-full border border-rose-600", i < lives ? "bg-rose-500" : "bg-slate-200")} />
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest">Streak</p>
              <p className="text-sm font-black text-orange-500">{streak}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border-2 border-[#e6d5b8] shadow-sm">
            <Trophy size={16} className="text-amber-500" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'idle' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setCharacterType('wizard')}
              className={cn("p-4 rounded-2xl border-4 transition-all", characterType === 'wizard' ? "border-[#8b5cf6] bg-[#8b5cf6]/10" : "border-[#e6d5b8] bg-white")}
            >
              <div className="w-12 h-12 bg-[#8b5cf6] rounded-full mx-auto mb-2" />
              <p className="text-xs font-black uppercase">Wizard</p>
            </button>
            <button 
              onClick={() => setCharacterType('gamer')}
              className={cn("p-4 rounded-2xl border-4 transition-all", characterType === 'gamer' ? "border-blue-500 bg-blue-500/10" : "border-[#e6d5b8] bg-white")}
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2" />
              <p className="text-xs font-black uppercase">Gamer</p>
            </button>
            <button 
              onClick={() => setCharacterType('knight')}
              className={cn("p-4 rounded-2xl border-4 transition-all", characterType === 'knight' ? "border-amber-500 bg-amber-500/10" : "border-[#e6d5b8] bg-white")}
            >
              <div className="w-12 h-12 bg-amber-500 rounded-full mx-auto mb-2" />
              <p className="text-xs font-black uppercase">Knight</p>
            </button>
          </div>
          <h4 className="text-3xl font-black mb-4 uppercase tracking-widest text-[#4a3f35]">Quest Run Arena</h4>
          <p className="text-[#8c7b68] mb-8 max-w-xs font-sans font-medium">Jump over obstacles to collect the correct answers! Use Space or Up Arrow to jump.</p>
          <button 
            onClick={startGame}
            disabled={tries <= 0}
            className={cn(
              "px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl border-2 font-sans uppercase tracking-widest",
              tries > 0 
                ? "bg-brand-500 hover:bg-brand-600 border-brand-600 text-white shadow-brand-500/20" 
                : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
            )}
          >
            {tries > 0 ? `Start Quest (${tries} Keys)` : 'No Keys Left'}
          </button>
        </div>
      ) : gameState === 'loading' ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-full flex items-center justify-center mb-8 shadow-lg animate-spin">
            <RefreshCw size={48} className="text-brand-500" />
          </div>
          <h4 className="text-2xl font-black mb-4 uppercase tracking-widest">Preparing the Path...</h4>
        </div>
      ) : gameState === 'playing' ? (
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="bg-white/80 border-4 border-[#e6d5b8] rounded-2xl p-4 mb-4 text-center">
            <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest mb-1">Current Challenge</p>
            <h4 className="text-xl font-black text-[#4a3f35]">{currentQuestion?.q}</h4>
          </div>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400} 
            className="w-full h-full bg-white/50 rounded-2xl border-4 border-[#e6d5b8] shadow-inner"
          />
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8">
          <h4 className="text-4xl font-black mb-2 text-amber-500 uppercase tracking-widest">Quest Ended</h4>
          <p className="text-[#8c7b68] mb-8 font-sans font-medium">You scored {score} points with a {streak}x streak!</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setGameState('idle')}
              className="px-6 py-3 bg-white border-2 border-[#e6d5b8] text-[#4a3f35] rounded-xl font-black hover:bg-[#fdf6e3] transition-all font-sans uppercase tracking-widest"
            >
              Back to Menu
            </button>
            <button 
              onClick={startGame}
              disabled={tries <= 0}
              className="px-6 py-3 bg-brand-500 border-2 border-brand-600 text-white rounded-xl font-black hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 font-sans uppercase tracking-widest disabled:opacity-50"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
