import React, { useState, useEffect } from 'react';
import { Users, Settings as SettingsIcon, Shield, Clock, TrendingUp, Plus, Trash2, Gamepad2, LogOut } from 'lucide-react';
import { db, doc, onSnapshot, setDoc, updateDoc, collection, query, where, auth, signOut, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ParentSettings, Assignment } from '../types';
import { cn } from '../lib/utils';

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
    if (!studentIdInput || isLinking) return;
    setIsLinking(true);
    try {
      // Check if student exists
      const studentDoc = await getDoc(doc(db, 'users', studentIdInput));
      if (!studentDoc.exists()) {
        alert("Student ID not found!");
        return;
      }

      // Check if already linked
      const q = query(collection(db, 'connections'), 
        where('parentId', '==', user.uid), 
        where('studentId', '==', studentIdInput)
      );
      const existing = await getDoc(doc(db, 'connections', `${user.uid}_${studentIdInput}`)); // Wait, I should use a deterministic ID or check query
      // Let's just use addDoc and let the query handle it, or use a deterministic ID
      await setDoc(doc(db, 'connections', `${user.uid}_${studentIdInput}`), {
        parentId: user.uid,
        studentId: studentIdInput,
        createdAt: new Date().toISOString()
      });
      
      setStudentIdInput('');
      alert("Student linked successfully!");
    } catch (error) {
      console.error("Error linking student:", error);
      alert("Failed to link student.");
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

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Parent Command Center 🛡️</h2>
            <p className="text-slate-500 font-medium">Monitoring progress and managing safety.</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="md:hidden p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm"
          >
            <LogOut size={24} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <Users className="text-brand-500" size={24} />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Linked Students</p>
              <p className="text-lg font-bold text-slate-900">{students.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-brand-50 rounded-2xl border border-brand-100 shadow-sm w-full md:w-auto">
            <Shield className="text-brand-600" size={24} />
            <div>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Your Parent ID</p>
              <p className="text-sm font-mono font-bold text-brand-900 select-all cursor-pointer" title="Click to select">{user.uid}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Enter Student ID..." 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-brand-500 transition-all shadow-sm w-full md:w-48"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
            />
            <button 
              onClick={handleLinkStudent}
              disabled={isLinking}
              className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
            >
              Link Student
            </button>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><TrendingUp size={24} className="text-emerald-500" />Student Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map(student => (
              <div key={student.uid} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-brand-500 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.uid}`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{student.displayName}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level {student.level} • {student.xp} XP</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Assignments Done</span><span className="text-slate-900 font-bold">{assignments.filter(a => a.studentId === student.uid && a.status === 'completed').length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Current Streak</span><span className="text-orange-600 font-bold">{student.streak} Days</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Game Tries</span><span className="text-brand-600 font-bold">{student.tries}</span></div>
                </div>
                <button 
                  onClick={() => onImpersonate(student)}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-all text-sm shadow-md shadow-brand-200"
                >
                  <Users size={16} />
                  View as Student
                </button>
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
      </div>
    </div>
  );
}
