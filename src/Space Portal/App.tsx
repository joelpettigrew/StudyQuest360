/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ShaderCanvas } from './components/ShaderCanvas';
import { DpadControls } from './components/DpadControls';
import { Hud } from './components/Hud';
import { ShipOverlay } from './components/ShipOverlay';
import { AppProvider, useAppContext } from './context/AppContext';
import { useAppStoreComplete } from './hooks/useAppStore';

// Optimization: Define static constant outside component to avoid recreation every render
const NAV_KEYS = ['w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export const AppContent: React.FC = () => {
    const {
        activeShaderCode,
        allUniforms,
        renderCameraRef, // Use renderCameraRef for offset support
        cameraControlsEnabled,
        isHdEnabled,
        isFpsEnabled,
        isMoving,
        isInteracting,
        pressedKeys,
        pressKey,
        releaseKey,
        gameState,
        restartGame,
        score,
        lives,
        currentQuestion,
        answerQuestion,
        sessionQuestions,
    } = useAppContext();

    const handleShaderError = useCallback((err: string) => {
        if (err) console.error("Shader Error:", err);
    }, []);

    const isNavigating = NAV_KEYS.some(key => pressedKeys.has(key));
    const shouldReduceQuality = isMoving || isInteracting || isNavigating;

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent scrolling with space/arrows
            if (NAV_KEYS.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            pressKey(e.key);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            releaseKey(e.key);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [pressKey, releaseKey]);

    return (
        <div className="h-full w-full bg-[#f4e4bc] text-[#5d4037] flex flex-col overflow-hidden relative font-serif min-h-[600px] rounded-[2.5rem] border-4 border-[#8d6e63] shadow-2xl">
            <main className={`flex-grow bg-black flex items-center justify-center overflow-hidden relative`}>
                <div
                    className="relative w-full h-full"
                >
                    {activeShaderCode && (
                        <ShaderCanvas
                            key={activeShaderCode}
                            fragmentSrc={activeShaderCode}
                            onError={handleShaderError}
                            uniforms={allUniforms}
                            cameraRef={renderCameraRef} // Use the render-specific camera ref
                            isHdEnabled={isHdEnabled}
                            isFpsEnabled={isFpsEnabled}
                            isPlaying={gameState === 'playing'}
                            shouldReduceQuality={shouldReduceQuality}
                        />
                    )}
                    <ShipOverlay />
                    <Hud />
                </div>
            </main>

            {/* Score and Lives Display */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-8 items-center bg-[#f4e4bc]/80 backdrop-blur-sm border-2 border-[#8d6e63] px-6 py-2 rounded-full text-[#5d4037] shadow-lg">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Score</span>
                    <span className="text-xl font-black">{score}</span>
                </div>
                <div className="h-8 w-[2px] bg-[#8d6e63]/30"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Lives</span>
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < lives ? 'text-red-600' : 'text-gray-400 opacity-30'}`}>❤</span>
                        ))}
                    </div>
                </div>
            </div>

            {gameState === 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center p-12 bg-[#f4e4bc] border-4 border-[#8d6e63] rounded-[3rem] shadow-2xl max-w-lg w-full mx-4 transform transition-all animate-in fade-in zoom-in duration-500 text-[#5d4037] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-map.png')]"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white border-4 border-[#8d6e63] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                                <span className="text-5xl">🚀</span>
                            </div>
                            <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">SPACE PORTAL</h2>
                            <p className="mb-8 text-lg font-medium opacity-80">Fly through portals and answer questions to survive deep space!</p>
                            <button
                                onClick={useAppContext().startGame}
                                className="w-full py-5 bg-[#8d6e63] hover:bg-[#5d4037] text-[#f4e4bc] font-black text-xl rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl uppercase tracking-widest border-b-8 border-[#5d4037]"
                            >
                                Launch Mission
                            </button>
                            <p className="mt-6 text-xs font-bold uppercase tracking-widest opacity-50">Costs 1 Quest Key</p>
                        </div>
                    </div>
                </div>
            )}
            
            {gameState === 'quiz' && currentQuestion && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#f4e4bc] text-[#5d4037] p-8 rounded-lg shadow-2xl max-w-lg w-full mx-4 border-4 border-[#8d6e63] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest bg-[#8d6e63] text-[#f4e4bc] px-2 py-1 rounded">
                                    {currentQuestion.topic}
                                </span>
                                <div className="flex gap-1">
                                    {[...Array(Math.max(0, lives))].map((_, i) => (
                                        <span key={i} className="text-red-600 text-xl">❤</span>
                                    ))}
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-8 leading-tight">
                                {currentQuestion.text}
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => answerQuestion(index)}
                                        className="w-full text-left p-4 rounded border-2 border-[#8d6e63]/30 hover:border-[#8d6e63] hover:bg-[#8d6e63]/10 transition-all font-medium"
                                    >
                                        <span className="inline-block w-8 h-8 rounded-full bg-[#8d6e63] text-[#f4e4bc] text-center leading-8 mr-3 font-bold">
                                            {String.fromCharCode(65 + index)}
                                        </span>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="text-center p-8 bg-[#f4e4bc] border-4 border-[#8d6e63] rounded-[3rem] shadow-2xl max-w-lg w-full mx-4 transform transition-all animate-in fade-in zoom-in duration-300 text-[#5d4037] flex flex-col max-h-[85vh]">
                        <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">MISSION FAILED</h2>
                        <p className="mb-2 text-lg">Your journey has come to an end.</p>
                        <p className="mb-6 font-bold text-2xl">Final Score: {score}</p>
                        
                        {sessionQuestions && sessionQuestions.length > 0 && (
                            <div className="flex-1 overflow-y-auto mb-6 pr-2 text-left space-y-4 bg-black/5 p-4 rounded-2xl border border-[#8d6e63]/20">
                                <h3 className="text-[#8d6e63] font-black uppercase tracking-widest text-[10px] mb-2">Arcane Knowledge Gained:</h3>
                                {sessionQuestions.map((q, i) => (
                                    <div key={i} className="border-l-2 border-[#8d6e63]/50 pl-3 py-1">
                                        <p className="text-[#5d4037] text-sm font-medium mb-1">{q.question}</p>
                                        <p className={`text-xs font-bold ${q.correct ? 'text-emerald-600' : 'text-[#8d6e63]/60'}`}>
                                            {q.correct ? '✓ Correct' : '✗ Missed'} — Answer: {q.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={restartGame}
                            className="w-full py-5 bg-[#8d6e63] hover:bg-[#5d4037] text-[#f4e4bc] font-black text-xl rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl uppercase tracking-widest border-b-8 border-[#5d4037] mt-auto"
                        >
                            Play Again (1 Key)
                        </button>
                    </div>
                </div>
            )}
            
            {cameraControlsEnabled && <DpadControls />}
        </div>
    );
};

interface SpacePortalAppProps {
    answerBanks?: any[];
    onScore?: (score: number) => void;
    onTryUsed?: () => void;
}

const App: React.FC<SpacePortalAppProps> = ({ answerBanks, onScore, onTryUsed }) => {
    const store = useAppStoreComplete(answerBanks, onScore, onTryUsed);
    return (
        <AppProvider value={store}>
            <AppContent />
        </AppProvider>
    );
};

export default App;
