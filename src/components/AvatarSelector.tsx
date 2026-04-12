import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wand2, 
  Sword, 
  Shield, 
  Ghost, 
  BrainCircuit, 
  Rocket, 
  Flame, 
  Crown, 
  Gem, 
  Zap 
} from 'lucide-react';

interface AvatarSelectorProps {
  currentAvatar: string | undefined;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

const avatars = [
  { id: 'wizard', icon: <Wand2 size={32} />, label: 'Wizard', color: 'bg-purple-100 text-purple-600' },
  { id: 'knight', icon: <Sword size={32} />, label: 'Knight', color: 'bg-slate-100 text-slate-600' },
  { id: 'guardian', icon: <Shield size={32} />, label: 'Guardian', color: 'bg-blue-100 text-blue-600' },
  { id: 'mystic', icon: <Ghost size={32} />, label: 'Mystic', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'scholar', icon: <BrainCircuit size={32} />, label: 'Scholar', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'explorer', icon: <Rocket size={32} />, label: 'Explorer', color: 'bg-rose-100 text-rose-600' },
  { id: 'warrior', icon: <Flame size={32} />, label: 'Warrior', color: 'bg-orange-100 text-orange-600' },
  { id: 'leader', icon: <Crown size={32} />, label: 'Leader', color: 'bg-amber-100 text-amber-600' },
  { id: 'hunter', icon: <Gem size={32} />, label: 'Hunter', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'speedster', icon: <Zap size={32} />, label: 'Speedster', color: 'bg-yellow-100 text-yellow-600' },
];

export const AvatarIcon = ({ id, className }: { id: string | undefined, className?: string }) => {
  const avatar = avatars.find(a => a.id === id) || avatars[0];
  return (
    <div className={`flex items-center justify-center rounded-full ${avatar.color} ${className}`}>
      {avatar.icon}
    </div>
  );
};

export default function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="relative w-full max-w-lg bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl p-10 space-y-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Choose Your Avatar</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => {
                onSelect(avatar.id);
                onClose();
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
                currentAvatar === avatar.id 
                  ? 'border-brand-500 bg-brand-50' 
                  : 'border-slate-100 hover:border-brand-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${avatar.color}`}>
                {avatar.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {avatar.label}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-slate-400 font-medium italic">"Your avatar represents your spirit in the realm of knowledge."</p>
        </div>
      </motion.div>
    </div>
  );
}
