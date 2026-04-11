/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, RefObject, MutableRefObject } from 'react';
import { Slider, CameraData, ViewMode, ShipConfig, GameState, Question } from '../types';

// Define the shape of the context's value
export interface AppContextType {
  // Shader State
  activeShaderCode: string;
  
  // Slider State
  sliders: Slider[];
  uniforms: { [key: string]: number };
  handleUniformChange: (variableName: string, value: number) => void;
  
  // Settings State
  isHdEnabled: boolean;
  isFpsEnabled: boolean;
  isInteracting: boolean;
  setIsInteracting: (interacting: boolean) => void;

  // Camera State
  allUniforms: { [key: string]: number };
  cameraRef: MutableRefObject<CameraData>;
  renderCameraRef: MutableRefObject<CameraData>;
  cameraVelocityRef: MutableRefObject<[number, number, number]>;
  cameraAngularVelocityRef: MutableRefObject<[number, number]>;
  pressKey: (key: string) => void;
  releaseKey: (key: string) => void;
  cameraControlsEnabled: boolean;
  pressedKeys: Set<string>;
  isMoving: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  collisionState: 'none' | 'approaching' | 'colliding';
  collisionProximity: number;

  // Game State
  gameState: GameState;
  startGame: () => void;
  restartGame: () => void;
  score: number;
  lives: number;
  currentQuestion: Question | null;
  answerQuestion: (index: number) => void;

  // Ship Config
  shipConfig: ShipConfig;
  effectiveShipConfigRef: MutableRefObject<ShipConfig>;
}

// Create the context with a default null value
export const AppContext = createContext<AppContextType | null>(null);

// Create a provider component
export const AppProvider: React.FC<{ value: AppContextType; children: React.ReactNode }> = ({ value, children }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a custom hook for easy consumption
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
