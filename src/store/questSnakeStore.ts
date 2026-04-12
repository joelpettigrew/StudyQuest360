/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '../types/QuestSnakeTypes';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  connect: () => void;
  joinGame: (color?: string) => void;
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
  sendCollectQuestionMark: (id: string) => void;
  sendStartQuestion: (data: { question: string, options: string[], correctIndex: number }) => void;
  sendAnswerQuestion: (questionId: string, answerIndex: number) => void;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,
  connect: () => {
    if (get().socket) return;
    
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('init', (id: string) => {
      set({ playerId: id });
    });

    socket.on('state', (state: GameState) => {
      globalGameState.current = state;
      const now = Date.now();
      if (now - lastUiUpdate > 100) { // Throttle React updates to 10Hz
        set({ gameState: state });
        lastUiUpdate = now;
      }
    });

    set({ socket });
  },
  joinGame: (color) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join', { color });
    }
  },
  sendPlayerState: (data) => {
    const { socket } = get();
    if (socket) {
      socket.emit('update_state', data);
    }
  },
  sendCollectOrb: (orbId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('collect_orb', orbId);
    }
  },
  sendCollectQuestionMark: (id) => {
    const { socket } = get();
    if (socket) {
      socket.emit('collect_question_mark', id);
    }
  },
  sendStartQuestion: (data: { question: string, options: string[], correctIndex: number }) => {
    const { socket } = get();
    if (socket) {
      socket.emit('start_question', data);
    }
  },
  sendAnswerQuestion: (questionId, answerIndex) => {
    const { socket } = get();
    if (socket) {
      socket.emit('answer_question', { questionId, answerIndex });
    }
  },
}));
