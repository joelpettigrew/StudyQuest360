import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Zap, Map, Skull, ArrowRight, Loader2, ScrollText } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onShowPrivacy: () => void;
}

export default function LandingPage({ onLogin, isLoggingIn, onShowPrivacy }: LandingPageProps) {
  const [videoEnded, setVideoEnded] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-serif overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScrollText className="text-blue-400" size={32} />
          <span className="text-2xl font-black tracking-tighter uppercase font-sans">studyquest360<span className="text-purple-400">.com</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-6 py-2 bg-slate-800 text-white font-black uppercase tracking-wider hover:bg-slate-700 transition-colors rounded-none border-2 border-slate-700 font-sans text-sm"
          >
            Student Login
          </button>
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-6 py-2 bg-blue-600 text-white font-black uppercase tracking-wider hover:bg-blue-500 transition-colors rounded-none border-2 border-blue-600 font-sans text-sm"
          >
            Parent Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-48 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 space-y-8 max-w-5xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-full text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 font-sans">
            <Map className="text-blue-400" size={16} />
            <span>Lost track of what's due when?</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase text-slate-100">
            Organization <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              is a Battle.
            </span>
            <br />
            Win the <span className="underline decoration-blue-400 underline-offset-8">Quest</span>.
          </h1>
          
          <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-3xl mx-auto leading-tight font-sans">
            Stop drowning in due dates. Turn your chaotic schedule into an epic adventure. Map your assignments, conquer your classes, and never miss a deadline again.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onLogin}
              disabled={isLoggingIn}
              className="group relative px-8 py-5 bg-blue-600 text-white font-black text-xl uppercase tracking-widest border-4 border-blue-600 hover:bg-blue-500 transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-sans"
            >
              {isLoggingIn ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <ScrollText className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              )}
              {isLoggingIn ? 'Opening Map...' : 'Start Your Adventure'}
            </button>
          </div>
        </motion.div>

        {/* Marketing Video/Image Container */}
        <div className="w-full max-w-4xl aspect-video bg-slate-900 rounded-3xl border-4 border-slate-800 overflow-hidden shadow-2xl relative group">
          {!videoEnded ? (
            <video 
              autoPlay 
              muted 
              playsInline 
              onEnded={() => setVideoEnded(true)}
              className="w-full h-full object-cover"
              poster="/StudyQuest360_Hero.png"
            >
              <source src="/StudyQuest360.mp4" type="video/mp4" />
              {/* Fallback if video fails to load or doesn't exist */}
              <img 
                src="/StudyQuest360_Hero.png" 
                alt="Marketing" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </video>
          ) : (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src="/StudyQuest360_Hero.png" 
              alt="Marketing Poster" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200";
              }}
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
        </div>
      </main>

      {/* Marquee */}
      <div className="w-full bg-purple-600 text-slate-50 py-4 overflow-hidden border-y-4 border-slate-950 rotate-1 scale-105 font-sans">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] font-black uppercase tracking-widest text-2xl">
          <span className="mx-4">• CONQUER YOUR ASSIGNMENTS</span>
          <span className="mx-4">• MAP YOUR JOURNEY</span>
          <span className="mx-4">• BATTLE CONCEPTS</span>
          <span className="mx-4">• BEAT THE BOSS (EXAMS)</span>
          <span className="mx-4">• CONQUER YOUR ASSIGNMENTS</span>
          <span className="mx-4">• MAP YOUR JOURNEY</span>
          <span className="mx-4">• BATTLE CONCEPTS</span>
          <span className="mx-4">• BEAT THE BOSS (EXAMS)</span>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap size={48} className="text-purple-400" />}
            title="AI Study Guides"
            desc="Struggling with a topic, or want a refresher on a concept? Get instant explanations based around things you are interested in. Create scrolls to help understand concepts."
            color="border-purple-500"
            bgHover="hover:bg-purple-500/10"
          />
          <FeatureCard 
            icon={<Map size={48} className="text-blue-400" />}
            title="Quest Timeline"
            desc="The pain of organizing what is due when is over. Your upcoming homework is mapped out on an interactive treasure map."
            color="border-blue-500"
            bgHover="hover:bg-blue-500/10"
          />
          <FeatureCard 
            icon={<Gamepad2 size={48} className="text-purple-400" />}
            title="Battle Concepts"
            desc="Don't just read notes. Battle your assignments in multiple mini-games. Match concepts, drop gravity blocks, and learn while you play."
            color="border-purple-400"
            bgHover="hover:bg-purple-400/10"
          />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center border-t border-slate-900 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Ready to begin?
          </h2>
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-12 py-6 bg-blue-600 text-white font-black text-2xl uppercase tracking-widest border-4 border-blue-600 hover:bg-blue-500 transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(251,191,36,1)] active:translate-y-0 active:shadow-none flex items-center gap-4 mx-auto font-sans"
          >
            {isLoggingIn ? 'Loading...' : 'Join the Quest'}
            <ArrowRight size={28} />
          </button>
        </div>
      </section>

      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-900 text-center space-y-4">
        <div className="space-y-2">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">© 2026 StudyQuest360. All rights reserved.</p>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">powered by PettigrewLab LLC</p>
        </div>
        <button 
          onClick={onShowPrivacy}
          className="text-slate-400 hover:text-white transition-colors font-bold text-sm underline underline-offset-4"
        >
          Privacy Policy
        </button>
      </footer>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, bgHover }: { icon: React.ReactNode, title: string, desc: string, color: string, bgHover: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={cn(
        "p-8 border-4 bg-slate-900 transition-colors duration-300 font-sans",
        color,
        bgHover
      )}
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-black uppercase tracking-wide mb-4 font-serif">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed text-lg">{desc}</p>
    </motion.div>
  );
}
