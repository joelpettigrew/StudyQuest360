import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Settings, Eye, Lock, ArrowRight, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';

interface ParentOnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Guardian Command Center",
    desc: "Welcome to StudyQuest360. As a Guardian, you have full visibility into your student's academic journey.",
    icon: <Shield className="text-blue-500" size={48} />,
    color: "bg-blue-50"
  },
  {
    title: "Linking Your Student",
    desc: "To start, you'll need your student's unique ID. Enter it in your dashboard to link accounts and see their progress in real-time.",
    icon: <Users className="text-emerald-500" size={48} />,
    color: "bg-emerald-50"
  },
  {
    title: "Visibility & Insights",
    desc: "Track completed quests, trial scores, and study streaks. See exactly what topics they are mastering and where they might need a boost.",
    icon: <Eye className="text-purple-500" size={48} />,
    color: "bg-purple-50"
  },
  {
    title: "Safety & Controls",
    desc: "Set 'School Hour' lockouts to restrict gaming during study time, and block specific topics you don't want the AI to generate content for.",
    icon: <Lock className="text-amber-500" size={48} />,
    color: "bg-amber-50"
  }
];

export default function ParentOnboarding({ onComplete }: ParentOnboardingProps) {
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
                  Enter Dashboard
                  <CheckCircle2 className="w-6 h-6" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {currentStep === steps.length - 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4"
              >
                <a 
                  href="https://support.google.com/families/answer/7103338?hl=en#:~:text=You%20can%20create%20a%20Google,controls%20to%20help%20supervise%20them." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-2 underline underline-offset-4"
                >
                  <ExternalLink size={16} />
                  Learn about creating Google Family accounts
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
