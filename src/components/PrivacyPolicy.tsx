import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-100 p-8 md:p-16 space-y-12"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto">
              <Shield size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Privacy Policy</h1>
            <p className="text-slate-500 font-medium">Last Updated: April 7, 2026</p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <Eye className="text-blue-500" />
                <h2>What We Collect</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                StudyQuest360 collects minimal information to provide our service. This includes your name and email address provided via Google Login, and the homework assignments you enter into the system. For students, we also track game scores and study progress to help you learn.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <Lock className="text-purple-500" />
                <h2>How We Use Your Data</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                Your data is used exclusively to power the StudyQuest360 experience. We use AI to help generate study guides and scrolls based on your assignments. We do not sell your data to third parties. Parents can see their linked students' progress to help support their learning journey.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <Shield className="text-emerald-500" />
                <h2>Security</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                We use industry-standard security measures provided by Google Firebase to protect your information. All data is encrypted in transit and at rest. Access is strictly controlled via secure authentication and database rules.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                <h2>Children's Privacy</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                StudyQuest360 is designed for students. We require a parent to link with a student account to ensure a safe and supervised learning environment. We comply with COPPA guidelines and prioritize the safety of our younger users.
              </p>
            </section>
          </div>

          <div className="pt-12 border-t border-slate-100 text-center text-slate-400 font-medium">
            <p>© 2026 StudyQuest360. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
