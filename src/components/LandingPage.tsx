import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Zap, Map, Skull, ArrowRight, Loader2, ScrollText, X, Shield, FileText, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '/studyquestMarketing.png';

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export default function LandingPage({ onLogin, isLoggingIn }: LandingPageProps) {
  const [videoEnded, setVideoEnded] = React.useState(false);
  const [showLegalModal, setShowLegalModal] = React.useState<'privacy' | 'terms' | 'support' | null>(null);

  const LegalModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setShowLegalModal(null)}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="relative w-full max-w-4xl max-h-[80vh] bg-slate-900 border-4 border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            <h3 className="text-3xl font-black uppercase tracking-tighter">
              {showLegalModal === 'privacy' && 'Privacy Policy'}
              {showLegalModal === 'terms' && 'Terms of Service'}
              {showLegalModal === 'support' && 'Support Center'}
            </h3>
          </div>
          <button 
            onClick={() => setShowLegalModal(null)}
            className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 font-sans">
          {showLegalModal === 'privacy' && (
            <div className="space-y-6 text-slate-300">
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Shield className="text-blue-400" size={20} />
                  Your Data, Your Quest
                </h4>
                <p className="leading-relaxed">At StudyQuest360, we believe your academic journey is personal. We collect only the data necessary to provide our adaptive learning experience, including your grade level, subjects, and study progress.</p>
              </section>
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Information We Collect</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account Information: Name, email, and profile preferences.</li>
                  <li>Academic Data: Grades, subjects, and assignment details you provide.</li>
                  <li>Usage Data: How you interact with the Quest Trail and Arena games.</li>
                </ul>
              </section>
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">How We Use It</h4>
                <p className="leading-relaxed">We use your data to personalize the Oracle's explanations, track your XP, and provide parents with progress reports. We never sell your data to third parties.</p>
              </section>
            </div>
          )}
          
          {showLegalModal === 'terms' && (
            <div className="space-y-6 text-slate-300">
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <FileText className="text-purple-400" size={20} />
                  The Rules of the Realm
                </h4>
                <p className="leading-relaxed">By using StudyQuest360, you agree to embark on an honest academic adventure. Our tools are designed to support learning, not to bypass it.</p>
              </section>
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">User Conduct</h4>
                <p className="leading-relaxed">Users are expected to use the AI Oracle for educational support. Any attempt to exploit the system or use it for academic dishonesty is a violation of our terms.</p>
              </section>
              <section className="space-y-4">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Account Safety</h4>
                <p className="leading-relaxed">You are responsible for maintaining the security of your account and your Quest Keys. Do not share your login credentials with others.</p>
              </section>
            </div>
          )}
          
          {showLegalModal === 'support' && (
            <div className="space-y-8 text-slate-300 text-center py-12">
              <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-600/30">
                <Mail className="text-blue-400" size={48} />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Need Assistance?</h4>
                <p className="text-xl font-medium">Our team of scholars is ready to help you with any technical or academic questions.</p>
              </div>
              <div className="pt-8">
                <a 
                  href="mailto:studyquest360@pettigrewlab.com"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40"
                >
                  Email Support
                </a>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-sm">studyquest360@pettigrewlab.com</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-serif overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Legal Modal */}
      <AnimatePresence>
        {showLegalModal && <LegalModal />}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-4">
          <img src={logo} alt="StudyQuest360 Logo" className="w-9 h-9 md:w-11 md:h-11 object-contain" referrerPolicy="no-referrer" />
          <span className="text-3xl md:text-4xl font-black tracking-tighter uppercase font-sans">STUDYQUEST360<span className="text-purple-400">.COM</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-8 py-3 bg-blue-600 text-white font-black uppercase tracking-wider hover:bg-blue-500 transition-all rounded-xl border-2 border-blue-600 font-sans text-sm shadow-lg shadow-blue-900/20 active:scale-95"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login / Sign Up'}
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
            <span>Personalized AI Learning Paths for Every Grade</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase text-slate-100">
              The Easiest <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                Homework Tracker
              </span>
              <br />
              Students Actually <span className="underline decoration-blue-400 underline-offset-8">Want</span> to Use.
            </h1>
            
            <h2 className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-tight">
              Turn Homework Into a Quest, Not a Chore.
            </h2>
          </div>
          
          <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-3xl mx-auto leading-tight font-sans">
            Select your grade, link your topics, and let StudyQuest360 build a personalized path that tracks your progress, unlocks rewards, and makes every assignment feel like an adventure.
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
                alt="StudyQuest360 AI Study Tool Dashboard Showcase" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </video>
          ) : (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src="/StudyQuest360_Hero.png" 
              alt="StudyQuest360 Interactive Quest Trail and Game Arena" 
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
          <span className="mx-4">• STUDENT HABIT TRACKER FOR HOMEWORK</span>
          <span className="mx-4">• ADAPTIVE STUDY PATHS</span>
          <span className="mx-4">• PERSONALIZED ACADEMIC SUPPORT</span>
          <span className="mx-4">• GAMIFY YOUR CURRICULUM</span>
          <span className="mx-4">• STUDENT HABIT TRACKER FOR HOMEWORK</span>
          <span className="mx-4">• ADAPTIVE STUDY PATHS</span>
          <span className="mx-4">• PERSONALIZED ACADEMIC SUPPORT</span>
          <span className="mx-4">• GAMIFY YOUR CURRICULUM</span>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Map size={48} className="text-blue-400" />}
            title="Homework, Gamified"
            desc="See the finish line. We turn messy planners into a visual 'Quest Trail' where every assignment turned in is a level up. Student habit tracker for homework."
            color="border-blue-500"
            bgHover="hover:bg-blue-500/10"
          />
          <FeatureCard 
            icon={<Zap size={48} className="text-purple-400" />}
            title="The Smart Path"
            desc="Bored following a generic curriculum? The student puts their subjects in, and StudyQuest360 builds lessons for them. Adaptive study paths for middle and high school."
            color="border-purple-500"
            bgHover="hover:bg-purple-500/10"
          />
          <FeatureCard 
            icon={<Gamepad2 size={48} className="text-purple-400" />}
            title="Contextual Support"
            desc="Stuck on a concept? The Oracle explains complex topics using analogies your student actually loves... whether it's sports, gaming, or fantasy. Personalized academic support in context."
            color="border-purple-400"
            bgHover="hover:bg-purple-400/10"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center mb-20">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-8">
            <FAQItem 
              q="How does StudyQuest360 encourage students to track their own homework?" 
              a="By turning a to-do list into a gamified 'Quest Board.' Students earn XP and Quest Keys for every assignment tracked and submitted, making academic organization feel like a high-score challenge rather than a chore." 
            />
            <FAQItem 
              q="Can I use StudyQuest360 for any school subject?" 
              a="Yes. StudyQuest360 is subject-agnostic. Students select their grade level and specific topics—from Right Triangles to Photosynthesis—and the system dynamically generates the relevant learning path and support tools." 
            />
            <FAQItem 
              q="How do parents monitor progress without micromanaging?" 
              a="The Parent Dashboard provides real-time 'Battle History' and activity graphs. You can see daily study streaks and XP gains at a glance, allowing you to celebrate their wins without hovering over their shoulder." 
            />
          </div>
          <div className="space-y-8">
            <FAQItem 
              q="Does the AI provide the answers or help the student learn?" 
              a="Our 'Oracle' AI is designed for contextual support, not cheating. It provides personalized explanations and analogies (e.g., explaining geometry through sports) to help students understand the 'why' behind their homework, fostering independent critical thinking." 
            />
            <FAQItem 
              q="What grade levels are supported?" 
              a="Our AI can generate study paths for students from elementary through high school, tailoring the difficulty and content to their specific level." 
            />
            <FAQItem 
              q="Can I use this for homeschooling?" 
              a="Absolutely! StudyQuest360 is designed to gamify any curriculum, providing structure and engagement for independent learners of all ages." 
            />
          </div>
          <div className="space-y-8">
            <FAQItem 
              q="What are 'Quest Keys'?" 
              a="Quest Keys are earned through study sessions and are used to unlock epic games in the Arena, rewarding students for their hard work." 
            />
            <FAQItem 
              q="Can I set screen time limits?" 
              a="Yes! Parents can set educational lockouts to ensure students focus on their quests during specific school hours." 
            />
            <FAQItem 
              q="Is my student's data safe?" 
              a="We prioritize student privacy and data security, using industry-standard encryption and parental controls to keep the learning environment safe." 
            />
          </div>
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

      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-900 text-center space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <button 
            onClick={() => setShowLegalModal('privacy')}
            className="text-slate-400 hover:text-white transition-colors font-bold text-sm underline underline-offset-4 uppercase tracking-widest"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setShowLegalModal('terms')}
            className="text-slate-400 hover:text-white transition-colors font-bold text-sm underline underline-offset-4 uppercase tracking-widest"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setShowLegalModal('support')}
            className="text-slate-400 hover:text-white transition-colors font-bold text-sm underline underline-offset-4 uppercase tracking-widest"
          >
            Support
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">© 2026 StudyQuest360. All rights reserved.</p>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">powered by PettigrewLab LLC</p>
        </div>
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

function FAQItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="space-y-3 text-left">
      <h4 className="text-xl font-black uppercase tracking-tight text-slate-100">{q}</h4>
      <p className="text-slate-400 font-medium leading-relaxed">{a}</p>
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
