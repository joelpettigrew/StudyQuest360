import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, Zap, Map, Gamepad2, ArrowRight, Sparkles } from 'lucide-react';

interface StudentOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome, Adventurer!",
    desc: "Your journey to mastering your homework starts here. StudyQuest360 turns your assignments into epic quests.",
    icon: <ScrollText className="text-blue-500" size={48} />,
    color: "bg-blue-50"
  },
  {
    title: "Map Your Quests",
    desc: "Every assignment you add becomes a point on your interactive treasure map. Track your progress and never miss a deadline.",
    icon: <Map className="text-emerald-500" size={48} />,
    color: "bg-emerald-50"
  },
  {
    title: "Battle Concepts",
    desc: "Struggling with a topic? Use AI Study Assist to generate guides and battle concepts in mini-games to earn XP.",
    icon: <Gamepad2 className="text-purple-500" size={48} />,
    color: "bg-purple-50"
  },
  {
    title: "Level Up!",
    desc: "Earn XP for every quest you complete. Level up your character and show off your scholar status!",
    icon: <Zap className="text-amber-500" size={48} />,
    color: "bg-amber-50"
  }
];

export default function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden relative"
      >
        <div className="p-12 md:p-16 text-center space-y-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className={`w-24 h-24 ${steps[currentStep].color} rounded-3xl flex items-center justify-center mx-auto shadow-inner`}>
                {steps[currentStep].icon}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tight uppercase text-slate-900">
                  {steps[currentStep].title}
                </h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                  {steps[currentStep].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} 
                />
              ))}
            </div>

            <button
              onClick={next}
              className="group relative px-12 py-5 bg-blue-600 text-white font-black text-xl uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 shadow-xl shadow-blue-200"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Begin Adventure
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
