/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Slider {
  name: string;
  variableName: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description?: string;
  targetLiteral?: string;
}

export interface CameraData {
    position: [number, number, number];
    rotation: [number, number];
    roll: number;
}

export type ViewMode = 'cockpit' | 'chase';

export type GameState = 'playing' | 'gameover' | 'quiz' | 'idle';

export interface SessionQuestion {
    question: string;
    answer: string;
    correct: boolean;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    topic: string;
}

export interface ShipConfig {
    complexity: number;
    fold1: number;
    fold2: number;
    fold3: number;
    scale: number;
    stretch: number;
    taper: number;
    twist: number;
    asymmetryX: number;
    asymmetryY: number;
    asymmetryZ: number;
    twistAsymX: number;
    scaleAsymX: number;
    fold1AsymX: number;
    fold2AsymX: number;
    
    chaseDistance?: number;
    chaseVerticalOffset?: number;
    pitchOffset?: number;
    generalScale?: number;
    translucency?: number;
}
