import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Users, BookOpen, Gamepad2, Clock, Shield, ChevronRight, User, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { UserProfile, Assignment, GameSession } from '../types';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  users: UserProfile[];
  assignments: Assignment[];
  gameSessions: GameSession[];
  connections: any[];
  onImpersonate: (user: UserProfile) => void;
}

export default function AdminDashboard({ users, assignments, gameSessions, connections, onImpersonate }: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const stats = useMemo(() => {
    const students = users.filter(u => u.role === 'student');
    const parents = users.filter(u => u.role === 'parent');
    return {
      totalUsers: users.length,
      totalStudents: students.length,
      totalParents: parents.length,
      totalQuests: assignments.length,
      totalGamePlays: gameSessions.length,
    };
  }, [users, assignments, gameSessions]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const getStudentQuests = (studentId: string) => assignments.filter(a => a.studentId === studentId).length;
  const getStudentGames = (studentId: string) => gameSessions.filter(s => s.studentId === studentId).length;
  const getParentNames = (studentId: string) => {
    const parentIds = connections.filter(c => c.studentId === studentId).map(c => c.parentId);
    if (parentIds.length === 0) return 'None';
    return parentIds.map(pid => users.find(u => u.uid === pid)?.displayName || 'Unknown').join(', ');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Shield className="text-brand-500" size={32} />
            Admin Command Center
          </h2>
          <p className="text-slate-500 font-medium">Monitoring the StudyQuest360 realm</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard icon={<Users size={24} />} label="Total Users" value={stats.totalUsers} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={<User size={24} />} label="Students" value={stats.totalStudents} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={<Users size={24} />} label="Parents" value={stats.totalParents} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={<BookOpen size={24} />} label="Total Quests" value={stats.totalQuests} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={<Gamepad2 size={24} />} label="Game Plays" value={stats.totalGamePlays} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* User Management */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">User Directory</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-black uppercase tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Relationship</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Level/XP</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {user.displayName}
                          {user.email === 'pettigrewjoel@gmail.com' && (
                            <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[8px] font-black uppercase rounded border border-brand-200">Admin</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      user.role === 'student' ? "bg-purple-50 text-purple-600 border-purple-100" :
                      user.role === 'parent' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {user.role || 'Unset'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-600">
                      {user.role === 'student' ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-black">Parents</span>
                          {getParentNames(user.uid)}
                        </div>
                      ) : user.role === 'parent' ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-black">Linked Kids</span>
                          {connections.filter(c => c.parentId === user.uid).length}
                        </div>
                      ) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-900">{getStudentQuests(user.uid)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">Quests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-900">{getStudentGames(user.uid)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">Games</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-slate-900">Lvl {user.level || 1}</div>
                      <div className="text-xs text-slate-500 font-medium">({user.xp || 0} XP)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onImpersonate(user)}
                      className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                    >
                      Impersonate
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: number, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", bg, color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}
