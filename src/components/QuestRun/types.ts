/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  MONSTER = 'MONSTER',
  FIREBALL = 'FIREBALL'
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters
  color?: string;
  targetIndex?: number; // Index in the target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Monsters
}

export interface Question {
  text: string;
  answer: string;
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Fantasy/Gem Colors: Gold, Silver, Emerald, Sapphire, Amethyst, Turquoise
export const QUEST_COLORS = [
    '#FFD700', // Gold
    '#C0C0C0', // Silver
    '#50C878', // Emerald
    '#0F52BA', // Sapphire
    '#9966CC', // Amethyst
    '#00CED1', // Dark Turquoise
    '#FF69B4', // Hot Pink
    '#87CEEB', // Sky Blue
];
