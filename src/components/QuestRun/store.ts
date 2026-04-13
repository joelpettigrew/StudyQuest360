/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { GameStatus, Question } from './types';
import { AnswerBank } from '../../types';

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  level: number;
  speed: number;
  isMuted: boolean;
  isBoosting: boolean;
  laneCount: number;
  distance: number;
  
  // Question State
  questions: Question[];
  currentQuestionIndex: number;
  collectedLetters: number[]; // Indices of letters collected in targetWord
  targetWord: string[]; // The full word to spell
  missingIndices: number[]; // Indices that the player MUST collect
  
  // Session tracking
  sessionQuestions: { question: string, answer: string, correct: boolean }[];
  
  // Actions
  setStatus: (status: GameStatus) => void;
  startGame: (answerBanks: AnswerBank[]) => void;
  takeDamage: () => void;
  collectGem: (points: number) => void;
  collectLetter: (index: number) => void;
  nextQuestion: () => void;
  setMuted: (muted: boolean) => void;
  setBoosting: (boosting: boolean) => void;
  setDistance: (dist: number) => void;
}

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  level: 1,
  speed: 22.5,
  isMuted: true,
  isBoosting: false,
  laneCount: 3,
  distance: 0,
  
  questions: [],
  currentQuestionIndex: 0,
  collectedLetters: [],
  targetWord: [],
  missingIndices: [],
  sessionQuestions: [],
  
  setStatus: (status) => set({ status }),
  
  startGame: (answerBanks) => {
    let gameQuestions: Question[] = [];
    
    if (answerBanks && answerBanks.length > 0) {
      gameQuestions = answerBanks.flatMap(bank => 
        bank.concepts
          .filter(c => c.status === 'kept')
          .map(c => ({
            text: c.description || c.definition, // Use description as question
            answer: c.term.toUpperCase() // Use term as answer
          }))
      );
    }

    // Fallback if no questions
    if (gameQuestions.length === 0) {
      gameQuestions = [
        { text: "A large body of water", answer: "OCEAN" },
        { text: "The star at the center of our solar system", answer: "SUN" },
        { text: "A place where books are kept", answer: "LIBRARY" }
      ];
    }

    // Shuffle
    gameQuestions = gameQuestions.sort(() => Math.random() - 0.5);

    const firstQ = gameQuestions[0];
    const fullWord = firstQ.answer.split('');
    
    // Logic for missing letters:
    // Exclude spaces from being "missing"
    const letterIndices = fullWord
      .map((char, i) => (/[A-Z0-9]/.test(char) ? i : -1))
      .filter(i => i !== -1);

    let missing: number[] = [];
    if (letterIndices.length > 5) {
      // Pick exactly 5 random indices to be missing
      missing = letterIndices.sort(() => Math.random() - 0.5).slice(0, 5);
    } else {
      // All letters are missing if 5 or fewer
      missing = letterIndices;
    }

    // Initial collected letters are those NOT in missing
    const initialCollected = Array.from({ length: fullWord.length }, (_, i) => i)
      .filter(i => !missing.includes(i));

    set({
      status: GameStatus.PLAYING,
      score: 0,
      lives: 3,
      level: 1,
      speed: 22.5,
      distance: 0,
      questions: gameQuestions,
      currentQuestionIndex: 0,
      targetWord: fullWord,
      missingIndices: missing,
      collectedLetters: initialCollected,
      sessionQuestions: []
    });
  },

  takeDamage: () => {
    const { lives, questions, currentQuestionIndex, sessionQuestions } = get();
    if (lives <= 1) {
      const currentQ = questions[currentQuestionIndex];
      const newSession = [...sessionQuestions, {
        question: currentQ.text,
        answer: currentQ.answer,
        correct: false
      }];
      set({ status: GameStatus.GAME_OVER, lives: 0, sessionQuestions: newSession });
    } else {
      set({ lives: lives - 1 });
    }
  },

  collectGem: (points) => set((state) => ({ score: state.score + points })),

  collectLetter: (index) => {
    const { collectedLetters, targetWord, missingIndices } = get();
    if (collectedLetters.includes(index)) return;

    const newCollected = [...collectedLetters, index];
    set({ collectedLetters: newCollected, score: get().score + 100 });

    // Check if all missing letters are collected
    const allCollected = missingIndices.every(idx => newCollected.includes(idx));
    if (allCollected) {
      setTimeout(() => get().nextQuestion(), 500);
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, level, score, sessionQuestions } = get();
    const currentQ = questions[currentQuestionIndex];
    
    const newSession = [...sessionQuestions, {
      question: currentQ.text,
      answer: currentQ.answer,
      correct: true
    }];

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      set({ status: GameStatus.VICTORY, score: score + 1000, sessionQuestions: newSession });
      return;
    }

    const nextQ = questions[nextIndex];
    const fullWord = nextQ.answer.split('');
    
    const letterIndices = fullWord
      .map((char, i) => (/[A-Z0-9]/.test(char) ? i : -1))
      .filter(i => i !== -1);

    let missing: number[] = [];
    if (letterIndices.length > 5) {
      missing = letterIndices.sort(() => Math.random() - 0.5).slice(0, 5);
    } else {
      missing = letterIndices;
    }

    const initialCollected = Array.from({ length: fullWord.length }, (_, i) => i)
      .filter(i => !missing.includes(i));

    set({
      currentQuestionIndex: nextIndex,
      targetWord: fullWord,
      missingIndices: missing,
      collectedLetters: initialCollected,
      level: level + 1,
      speed: 22.5 + (level * 1.5)
    });
  },

  setMuted: (isMuted) => set({ isMuted }),
  setBoosting: (isBoosting) => set({ isBoosting }),
  setDistance: (distance) => set({ distance })
}));
