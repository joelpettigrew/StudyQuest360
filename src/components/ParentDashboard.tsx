import React, { useState, useEffect, useMemo } from 'react';
import { Users, Settings as SettingsIcon, Shield, Clock, TrendingUp, Plus, Trash2, Gamepad2, LogOut, X, Calendar, Sparkles, Wand2, ExternalLink, Loader2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, doc, onSnapshot, setDoc, updateDoc, collection, query, where, auth, signOut, getDoc, handleFirestoreError, OperationType, addDoc, serverTimestamp, deleteDoc } from '../firebase';
import { UserProfile, ParentSettings, Assignment, Priority } from '../types';
import { cn } from '../lib/utils';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ParentDashboardProps {
  user: UserProfile;
  onReset: () => void;
  onImpersonate: (student: UserProfile) => void;
}

export default function ParentDashboard({ user, onReset, onImpersonate }: ParentDashboardProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [newBlockedTopic, setNewBlockedTopic] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkStatus, setLinkStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedStudentForQuest, setSelectedStudentForQuest] = useState<UserProfile | null>(null);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);

  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    const cq = query(collection(db, 'connections'), where('parentId', '==', user.uid));
    const unsubscribe = onSnapshot(cq, (snapshot) => {
      setConnections(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'connections');
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const studentIds = connections.map(c => c.studentId);
    if (studentIds.length === 0) {
      setStudents([]);
      return;
    }

    const sq = query(collection(db, 'users'), where('uid', 'in', studentIds));
    const unsubscribe = onSnapshot(sq, (snapshot) => {
      setStudents(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, [connections]);

  useEffect(() => {
    const studentIds = students.map(s => s.uid);
    if (studentIds.length === 0) {
      setAssignments([]);
      return;
    }

    const aq = query(collection(db, 'assignments'), where('studentId', 'in', studentIds));
    const unsubscribe = onSnapshot(aq, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => doc.data() as Assignment));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });
    return () => unsubscribe();
  }, [students]);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', user.uid), (snapshot: any) => {
      if (snapshot.exists()) setSettings(snapshot.data() as ParentSettings);
      else setDoc(snapshot.ref, { parentId: user.uid, schoolHoursStart: '08:00', schoolHoursEnd: '15:00', blockedTopics: [] });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
    });
    return () => unsubscribeSettings();
  }, [user.uid]);

  const handleLinkStudent = async () => {
    const trimmedId = studentIdInput.trim();
    if (!trimmedId || isLinking) return;
    
    if (trimmedId === user.uid) {
      setLinkStatus({ type: 'error', message: "You cannot link to your own account ID!" });
      return;
    }

    setIsLinking(true);
    setLinkStatus(null);
    try {
      // Check if current user is actually a parent in the DB
      if (user.role !== 'parent' && user.role !== 'admin') {
        setLinkStatus({ type: 'error', message: "Your account is not set up as a Parent. Please reset your role and select 'Parent' first." });
        return;
      }

      // Check if student exists
      const studentDoc = await getDoc(doc(db, 'users', trimmedId));
      if (!studentDoc.exists()) {
        setLinkStatus({ type: 'error', message: "Student ID not found! Please double-check the ID." });
        return;
      }

      const studentData = studentDoc.data() as UserProfile;
      if (studentData.role === 'parent' || studentData.role === 'admin') {
        setLinkStatus({ type: 'error', message: "This ID belongs to a parent or admin. You can only link to student accounts." });
        return;
      }

      // Create connection with deterministic ID
      await setDoc(doc(db, 'connections', `${user.uid}_${trimmedId}`), {
        parentId: user.uid,
        studentId: trimmedId,
        createdAt: new Date().toISOString()
      });
      
      setStudentIdInput('');
      setLinkStatus({ type: 'success', message: "Student linked successfully!" });
      setTimeout(() => setLinkStatus(null), 5000);
    } catch (error: any) {
      console.error("Error linking student:", error);
      let msg = "Failed to link student. Please try again.";
      
      // Provide more specific feedback for debugging
      if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
        msg = "Permission denied by database. Please ensure you have selected the 'Parent' role in your profile.";
      } else if (error.code === 'unavailable') {
        msg = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        msg = `Error: ${error.message}`;
      }
      
      setLinkStatus({ type: 'error', message: msg });
    } finally {
      setIsLinking(false);
    }
  };

  const updateHours = (start: string, end: string) => {
    updateDoc(doc(db, 'settings', user.uid), { schoolHoursStart: start, schoolHoursEnd: end });
  };

  const addBlockedTopic = () => {
    if (!newBlockedTopic || !settings) return;
    updateDoc(doc(db, 'settings', user.uid), { blockedTopics: [...settings.blockedTopics, newBlockedTopic] });
    setNewBlockedTopic('');
  };

  const removeBlockedTopic = (topic: string) => {
    if (!settings) return;
    updateDoc(doc(db, 'settings', user.uid), { blockedTopics: settings.blockedTopics.filter(t => t !== topic) });
  };

  const updateActiveGame = (gameId: string) => {
    updateDoc(doc(db, 'settings', user.uid), { activeGameId: gameId });
  };

  const games = [
    { id: 'concept-match', title: 'Concept Match' },
    { id: 'gravity-match', title: 'Gravity Drop' },
    { id: 'questrun', title: 'Quest Run' },
    { id: 'target-practice', title: 'Target Practice' }
  ];

  const getStudentChartData = (studentId: string) => {
    const data = [];
    const studentAssignments = assignments.filter(a => a.studentId === studentId);
    
    for (let i = 13; i >= 0; i--) {
      const date = subDays(startOfDay(new Date()), i);
      
      const created = studentAssignments.filter(a => {
        if (!a.createdAt) return false;
        // Handle both Firestore Timestamp and ISO string
        const createdDate = (a.createdAt as any).toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as any);
        return isSameDay(createdDate, date);
      }).length;

      const completed = studentAssignments.filter(a => {
        if (!a.completedAt) return false;
        const completedDate = (a.completedAt as any).toDate ? (a.completedAt as any).toDate() : new Date(a.completedAt as any);
        return isSameDay(completedDate, date);
      }).length;

      data.push({
        date: format(date, 'MMM dd'),
        created,
        completed
      });
    }
    return data;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Parent Command Center 🛡️</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Monitoring progress and managing safety.</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="md:hidden p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-brand-600 mb-2">
                <Users size={20} />
                <span className="font-black uppercase tracking-widest text-[10px]">Linked Students</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{students.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-brand-600 mb-2">
                <Shield size={20} />
                <span className="font-black uppercase tracking-widest text-[10px]">Your Parent ID</span>
              </div>
              <p className="text-sm font-mono font-bold text-brand-900 select-all cursor-pointer" title="Click to select">{user.uid}</p>
              <button 
                onClick={async () => {
                  try {
                    const testRef = doc(db, 'connections', `test_${user.uid}`);
                    // Use a valid connection schema for the test
                    await setDoc(testRef, { 
                      parentId: user.uid, 
                      studentId: 'test_id', 
                      createdAt: new Date().toISOString() 
                    });
                    alert(`Write test successful!\n\nUID: ${user.uid}\nRole: ${user.role}\nEmail: ${user.email}`);
                    await deleteDoc(testRef);
                  } catch (e: any) {
                    console.error("Test write failed:", e);
                    alert(`Write test failed: ${e.message}\n\nThis usually means your account role isn't being recognized by the database yet.`);
                  }
                }}
                className="mt-2 text-[8px] font-black text-brand-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
              >
                Run Permission Test
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-4">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
        <div className="flex-1 w-full">
          <h3 className="text-xl font-black text-slate-900 mb-2">Link New Student</h3>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enter your student's unique ID to start monitoring their progress.</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Enter Student ID..." 
              className="flex-1 md:w-64 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:outline-none focus:border-brand-500 transition-all shadow-inner"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
            />
            <button 
              onClick={handleLinkStudent}
              disabled={isLinking}
              className="px-8 py-4 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 transition-all shadow-xl shadow-brand-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Link Student
            </button>
          </div>
          {linkStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                linkStatus.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
              )}
            >
              {linkStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {linkStatus.message}
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><TrendingUp size={24} className="text-emerald-500" />Student Activity</h3>
        <div className="grid grid-cols-1 gap-8">
          {students.map(student => (
            <div key={student.uid} className="flex flex-col xl:flex-row gap-8">
              {/* Student Card */}
              <div className="w-full xl:w-[350px] bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-brand-500 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.uid}`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{student.displayName}</h4>
                    <p className="text-[10px] font-mono font-bold text-brand-600 uppercase tracking-tight select-all cursor-pointer" title="Student Link ID - Click to select">ID: {student.uid}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Level {student.level} • {student.xp} XP</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Assignments Done</span><span className="text-slate-900 font-bold">{assignments.filter(a => a.studentId === student.uid && a.status === 'completed').length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Current Streak</span><span className="text-orange-600 font-bold">{student.streak} Days</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Game Tries</span><span className="text-brand-600 font-bold">{student.tries}</span></div>
                </div>
                <div className="flex flex-col gap-2 mt-6">
                  <button 
                    onClick={() => onImpersonate(student)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-all text-sm shadow-md shadow-brand-200"
                  >
                    <Users size={16} />
                    View as Student
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedStudentForQuest(student);
                      setIsQuestModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-brand-500 text-brand-600 rounded-xl font-bold hover:bg-brand-50 transition-all text-sm"
                  >
                    <Plus size={16} />
                    Add Quest
                  </button>
                </div>
              </div>

              {/* Activity Graph for this student */}
              <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[300px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-slate-900">
                    <TrendingUp size={20} className="text-brand-500" />
                    <h3 className="font-black uppercase tracking-widest text-xs">Activity (Last 14 Days)</h3>
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getStudentChartData(student.uid)}>
                      <defs>
                        <linearGradient id={`colorCreated-${student.uid}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`colorCompleted-${student.uid}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        interval={3}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '1rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        name="Quests Created"
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#colorCreated-${student.uid})`} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        name="Quests Done"
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#colorCompleted-${student.uid})`} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><SettingsIcon size={24} className="text-slate-500" />Controls</h3>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4"><Clock size={18} className="text-brand-500" /><h4 className="text-sm font-bold text-slate-900">School Hours (Game Locked)</h4></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start</label><input type="time" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings?.schoolHoursStart || '08:00'} onChange={(e) => updateHours(e.target.value, settings?.schoolHoursEnd || '15:00')} /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">End</label><input type="time" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={settings?.schoolHoursEnd || '15:00'} onChange={(e) => updateHours(settings?.schoolHoursStart || '08:00', e.target.value)} /></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4"><Shield size={18} className="text-rose-500" /><h4 className="text-sm font-bold text-slate-900">Blocked Topics</h4></div>
            <div className="flex gap-2 mb-4"><input type="text" placeholder="e.g., Video Games" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={newBlockedTopic} onChange={(e) => setNewBlockedTopic(e.target.value)} /><button onClick={addBlockedTopic} className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all"><Plus size={20} /></button></div>
            <div className="flex flex-wrap gap-2">{settings?.blockedTopics.map(topic => (<span key={topic} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{topic}<button onClick={() => removeBlockedTopic(topic)} className="hover:text-rose-500"><Trash2 size={12} /></button></span>))}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4"><Gamepad2 size={18} className="text-brand-500" /><h4 className="text-sm font-bold text-slate-900">Active Game</h4></div>
            <select 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              value={settings?.activeGameId || 'concept-match'}
              onChange={(e) => updateActiveGame(e.target.value)}
            >
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.title}</option>
              ))}
            </select>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all border border-rose-100"
            >
              <Trash2 size={18} />
              Reset Account Role
            </button>
            <p className="mt-2 text-[10px] text-slate-400 text-center font-medium uppercase tracking-widest">Danger Zone: Clears role & progress</p>
          </div>
        </div>
      </div>

      {/* Quest Modal */}
      <AnimatePresence>
        {isQuestModalOpen && selectedStudentForQuest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-5 pointer-events-none" />
              <div className="relative z-10">
                <ParentAddAssignmentForm 
                  student={selectedStudentForQuest}
                  onClose={() => setIsQuestModalOpen(false)}
                  onAdd={async (assignmentData) => {
                    try {
                      await addDoc(collection(db, 'assignments'), {
                        ...assignmentData,
                        studentId: selectedStudentForQuest.uid,
                        parentId: user.uid,
                        status: 'pending',
                        createdAt: serverTimestamp()
                      });
                      setIsQuestModalOpen(false);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, 'assignments');
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParentAddAssignmentForm({ student, onAdd, onClose }: { student: UserProfile, onAdd: (a: any) => Promise<void>, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [link, setLink] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<Priority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({ 
        title, 
        subject, 
        topic: topic || title, 
        link,
        dueDate: new Date(dueDate + 'T12:00:00').toISOString(), 
        priority, 
        xp: 100 
      });
    } catch (err: any) {
      console.error("Add quest error:", err);
      setError(err.message || "Failed to add quest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">New Quest</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">For {student.displayName}</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quest Title</label>
          <input autoFocus required placeholder="e.g., Math Homework" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
            <input required placeholder="e.g., Math" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
            <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Study Topic (for AI Assist)</label>
          <input placeholder="e.g., Fractions" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Link (optional)</label>
          <input placeholder="e.g., Google Doc URL" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={link} onChange={e => setLink(e.target.value)} />
        </div>
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-brand-200 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
        {isSubmitting ? 'Assigning Quest...' : 'Assign Quest'}
      </button>
    </form>
  );
}
