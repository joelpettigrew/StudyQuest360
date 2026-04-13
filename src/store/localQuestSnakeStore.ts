import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  Player, 
  WORLD_SIZE, 
  MAX_ORBS, 
  MAX_HAZARDS, 
  MAX_QUESTION_MARKS, 
  INITIAL_LENGTH, 
  SEGMENT_SPACING,
  TICK_RATE
} from '../types/QuestSnakeTypes';

interface LocalGameStore {
  gameState: GameState;
  playerId: string;
  isPaused: boolean;
  sessionQuestions: { question: string, answer: string, correct: boolean }[];
  initGame: (color: string) => void;
  updatePlayer: (data: Partial<Player>) => void;
  collectOrb: (orbId: string) => void;
  collectQuestionMark: (id: string) => void;
  startQuestion: (data: { question: string, options: string[], correctIndex: number }) => void;
  answerQuestion: (correct: boolean) => void;
  tick: (delta: number) => void;
  resetGame: () => void;
}

const COLORS = [
  '#dc2626', '#d97706', '#059669', '#2563eb', '#7c3aed', '#4b5563', '#92400e', '#1e40af'
];

const createInitialState = (): GameState => ({
  players: {},
  orbs: {},
  hazards: {},
  questionMarks: {},
  leaderboard: [],
  activeQuestion: null,
  isPaused: false,
});

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
  gameState: createInitialState(),
  playerId: 'local-player',
  isPaused: false,
  sessionQuestions: [],

  initGame: (color) => {
    const id = 'local-player';
    const startX = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const startY = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const angle = Math.random() * Math.PI * 2;

    const segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      segments.push({
        x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
        y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
      });
    }

    const player: Player = {
      id,
      name: 'Hero',
      color,
      segments,
      score: INITIAL_LENGTH,
      isBoosting: false,
      state: 'alive',
      currentAngle: angle,
      inputs: { left: false, right: false, boost: false },
    };

    const state = createInitialState();
    state.players[id] = player;

    // Initial orbs
    for (let i = 0; i < 50; i++) {
      const orbId = uuidv4();
      state.orbs[orbId] = {
        id: orbId,
        x: (Math.random() - 0.5) * WORLD_SIZE,
        y: (Math.random() - 0.5) * WORLD_SIZE,
        value: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    set({ gameState: state, isPaused: false, sessionQuestions: [] });
  },

  updatePlayer: (data) => {
    set((state) => {
      const player = state.gameState.players[state.playerId];
      if (!player) return state;
      return {
        gameState: {
          ...state.gameState,
          players: {
            ...state.gameState.players,
            [state.playerId]: { ...player, ...data },
          },
        },
      };
    });
  },

  collectOrb: (orbId) => {
    set((state) => {
      const newOrbs = { ...state.gameState.orbs };
      delete newOrbs[orbId];
      return {
        gameState: {
          ...state.gameState,
          orbs: newOrbs,
        },
      };
    });
  },

  collectQuestionMark: (id) => {
    set((state) => {
      const newQM = { ...state.gameState.questionMarks };
      delete newQM[id];
      return {
        isPaused: true,
        gameState: {
          ...state.gameState,
          questionMarks: newQM,
          isPaused: true,
        },
      };
    });
  },

  startQuestion: (data) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        activeQuestion: {
          id: uuidv4(),
          playerId: state.playerId,
          ...data,
        },
      },
    }));
  },

  answerQuestion: (correct) => {
    set((state) => {
      const activeQ = state.gameState.activeQuestion;
      const newSessionQuestions = [...state.sessionQuestions];
      if (activeQ) {
        newSessionQuestions.push({
          question: activeQ.question,
          answer: activeQ.options[activeQ.correctIndex],
          correct
        });
      }

      const player = state.gameState.players[state.playerId];
      const newPlayers = { ...state.gameState.players };
      if (player && correct) {
        newPlayers[state.playerId] = {
          ...player,
          score: player.score + 90 // 20 gems (40 points) + 50 bonus points
        };
      }

      return {
        isPaused: false,
        sessionQuestions: newSessionQuestions,
        gameState: {
          ...state.gameState,
          players: newPlayers,
          activeQuestion: null,
          isPaused: false,
        },
      };
    });
  },

  tick: (delta) => {
    const { gameState, isPaused, playerId } = get();
    if (isPaused || gameState.isPaused) return;

    set((state) => {
      const newState = { ...state.gameState };
      
      // Spawn orbs
      if (Object.keys(newState.orbs).length < MAX_ORBS && Math.random() < 0.1) {
        const id = uuidv4();
        newState.orbs[id] = {
          id,
          x: (Math.random() - 0.5) * WORLD_SIZE,
          y: (Math.random() - 0.5) * WORLD_SIZE,
          value: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      }

      // Spawn hazards
      if (Object.keys(newState.hazards).length < MAX_HAZARDS && Math.random() < 0.005) {
        const id = uuidv4();
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        newState.hazards[id] = {
          id,
          x: (Math.random() - 0.5) * WORLD_SIZE,
          y: (Math.random() - 0.5) * WORLD_SIZE,
          radius: 2 + Math.random() * 3,
          type: 'slime',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      }

      // Spawn question marks
      if (Object.keys(newState.questionMarks).length < MAX_QUESTION_MARKS && Math.random() < 0.002) {
        const id = uuidv4();
        newState.questionMarks[id] = {
          id,
          x: (Math.random() - 0.5) * WORLD_SIZE,
          y: (Math.random() - 0.5) * WORLD_SIZE,
        };
      }

      // Update hazards
      for (const id in newState.hazards) {
        const hazard = newState.hazards[id];
        if (hazard.vx !== undefined && hazard.vy !== undefined) {
          hazard.x += hazard.vx * delta;
          hazard.y += hazard.vy * delta;

          const boundary = WORLD_SIZE / 2;
          if (Math.abs(hazard.x) > boundary) {
            hazard.vx *= -1;
            hazard.x = Math.sign(hazard.x) * boundary;
          }
          if (Math.abs(hazard.y) > boundary) {
            hazard.vy *= -1;
            hazard.y = Math.sign(hazard.y) * boundary;
          }
        }
      }

      return { gameState: newState };
    });
  },

  resetGame: () => {
    set({ gameState: createInitialState(), isPaused: false });
  },
}));
