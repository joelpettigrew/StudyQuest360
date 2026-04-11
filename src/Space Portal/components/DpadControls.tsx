/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

const DpadButton: React.FC<{
  onPress: () => void;
  onRelease: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
  isKeyPressed?: boolean;
}> = ({ onPress, onRelease, children, className = '', ariaLabel, isKeyPressed = false }) => {
  const [isPointerPressed, setIsPointerPressed] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activePointerId.current !== null) return;
    
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Pointer capture failed.", err);
    }
    activePointerId.current = e.pointerId;

    setIsPointerPressed(true);
    onPress();
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (activePointerId.current === e.pointerId) {
      activePointerId.current = null;
      setIsPointerPressed(false);
      onRelease();
    }
  };

  const isVisuallyPressed = isPointerPressed || isKeyPressed;

  return (
    <div
      role="button"
      aria-label={ariaLabel}
      className={`w-10 h-10 sm:w-14 sm:h-14 bg-gray-500/30 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-transform duration-100 ease-in-out select-none touch-none ${className} ${isVisuallyPressed ? 'bg-white/40 scale-90' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onLostPointerCapture={handlePointerUpOrCancel}
    >
      {children}
    </div>
  );
};

export const DpadControls: React.FC = () => {
  const { pressKey, releaseKey, cameraControlsEnabled, pressedKeys } = useAppContext();

  if (!cameraControlsEnabled) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex justify-between items-end pointer-events-none z-30" aria-hidden="true">
      {/* Left Side: Thrust & Boost */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        <DpadButton 
          onPress={() => pressKey('shift')} 
          onRelease={() => releaseKey('shift')} 
          ariaLabel="Boost" 
          className="!w-32 !h-16 sm:!w-48 sm:!h-24 !rounded-2xl bg-[#d32f2f]/80 border-2 border-[#5d4037] shadow-xl" 
          isKeyPressed={pressedKeys.has('shift')}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-black uppercase tracking-widest text-[#f4e4bc]">BOOST</span>
            <span className="text-[10px] sm:text-xs opacity-60 text-[#f4e4bc]">SHIFT</span>
          </div>
        </DpadButton>
        <DpadButton 
          onPress={() => pressKey(' ')} 
          onRelease={() => releaseKey(' ')} 
          ariaLabel="Thrust" 
          className="!w-32 !h-16 sm:!w-48 sm:!h-24 !rounded-2xl bg-[#8d6e63]/80 border-2 border-[#5d4037] shadow-xl" 
          isKeyPressed={pressedKeys.has(' ')}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg sm:text-2xl font-black uppercase tracking-widest text-[#f4e4bc]">Thrust</span>
            <span className="text-[10px] sm:text-xs opacity-60 text-[#f4e4bc]">SPACE</span>
          </div>
        </DpadButton>
      </div>

      {/* Right Side: Directional Arrows */}
      <div className="pointer-events-auto">
        <div className="grid grid-cols-3 grid-rows-3 w-32 h-32 sm:w-48 sm:h-48 gap-1">
          <div className="col-start-2 row-start-1 flex justify-center items-center">
            <DpadButton 
              onPress={() => pressKey('arrowup')} 
              onRelease={() => releaseKey('arrowup')} 
              ariaLabel="Up" 
              className="bg-[#8d6e63]/80 border-2 border-[#5d4037]"
              isKeyPressed={pressedKeys.has('arrowup')}
            >
              <ChevronUpIcon className="w-6 h-6 sm:w-10 sm:h-10 text-[#f4e4bc]" />
            </DpadButton>
          </div>
          <div className="col-start-1 row-start-2 flex justify-center items-center">
            <DpadButton 
              onPress={() => pressKey('arrowleft')} 
              onRelease={() => releaseKey('arrowleft')} 
              ariaLabel="Left" 
              className="bg-[#8d6e63]/80 border-2 border-[#5d4037]"
              isKeyPressed={pressedKeys.has('arrowleft')}
            >
              <ChevronLeftIcon className="w-6 h-6 sm:w-10 sm:h-10 text-[#f4e4bc]" />
            </DpadButton>
          </div>
          <div className="col-start-3 row-start-2 flex justify-center items-center">
            <DpadButton 
              onPress={() => pressKey('arrowright')} 
              onRelease={() => releaseKey('arrowright')} 
              ariaLabel="Right" 
              className="bg-[#8d6e63]/80 border-2 border-[#5d4037]"
              isKeyPressed={pressedKeys.has('arrowright')}
            >
              <ChevronRightIcon className="w-6 h-6 sm:w-10 sm:h-10 text-[#f4e4bc]" />
            </DpadButton>
          </div>
          <div className="col-start-2 row-start-3 flex justify-center items-center">
            <DpadButton 
              onPress={() => pressKey('arrowdown')} 
              onRelease={() => releaseKey('arrowdown')} 
              ariaLabel="Down" 
              className="bg-[#8d6e63]/80 border-2 border-[#5d4037]"
              isKeyPressed={pressedKeys.has('arrowdown')}
            >
              <ChevronDownIcon className="w-6 h-6 sm:w-10 sm:h-10 text-[#f4e4bc]" />
            </DpadButton>
          </div>
        </div>
      </div>
    </div>
  );
};
