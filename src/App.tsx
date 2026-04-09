import React, { useState, useEffect, useMemo, Component } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Trophy, 
  Flame, 
  ChevronRight, 
  ExternalLink, 
  Trash2, 
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  Settings,
  Search,
  X,
  Clock,
  LogOut,
  Gamepad2,
  Shield,
  Loader2,
  User,
  Users,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Key,
  Map,
  Skull,
  Zap,
  Target,
  ArrowRight,
  Package,
  FlaskConical,
  Sword,
  Crown,
  Gem,
  Compass,
  MousePointer2,
  Heart,
  Scroll as ScrollIcon,
  Star,
  Moon,
  Sun,
  Ghost,
  Wand2,
  Tent,
  Mountain,
  Trees
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  isToday, 
  isTomorrow, 
  parseISO, 
  isPast, 
  startOfDay, 
  addDays, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  isSaturday, 
  isSunday,
  isAfter,
  isYesterday,
  subDays
} from 'date-fns';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  getDocs
} from './firebase';
import { GoogleGenAI } from "@google/genai";
import { 
  Assignment, 
  UserProfile, 
  calculateLevel, 
  calculateProgress, 
  Priority, 
  XP_PER_LEVEL, 
  Role, 
  AssignmentStatus,
  getLevelTitle,
  ParentSettings,
  Scroll,
  GameSession,
  StudyHistory,
  AnswerBank
} from './types';

// Components
import StudyAssist from './components/StudyAssist';
import TrainingModule from './components/TrainingModule';
import { ConceptMatchGame, GravityMatchGame, QuestRunGame } from './components/Game';
import { TargetPracticeGame } from './components/TargetPractice';
import LandingPage from './components/LandingPage';
import ParentDashboard from './components/ParentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { generateAnswerBank } from './services/answerBankService';
import AnswerBankView from './components/AnswerBankView';
import PrivacyPolicy from './components/PrivacyPolicy';
import StudentOnboarding from './components/StudentOnboarding';

export default function App() {
  return (
    <StudyQuestApp />
  );
}

function StudyQuestApp() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [parentSettings, setParentSettings] = useState<ParentSettings | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isStudyAssistOpen, setIsStudyAssistOpen] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [trainingAssignment, setTrainingAssignment] = useState<Assignment | null>(null);
  const [scrolls, setScrolls] = useState<Scroll[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [viewingScroll, setViewingScroll] = useState<Scroll | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [showAnswerBank, setShowAnswerBank] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [studyHistory, setStudyHistory] = useState<StudyHistory[]>([]);
  const [answerBanks, setAnswerBanks] = useState<AnswerBank[]>([]);
  const [impersonatedStudent, setImpersonatedStudent] = useState<UserProfile | null>(null);
  const [adminView, setAdminView] = useState<'admin' | 'parent' | 'student'>('admin');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [allGameSessions, setAllGameSessions] = useState<GameSession[]>([]);
  const [allConnections, setAllConnections] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const questBoardRef = React.useRef<HTMLDivElement>(null);

  const isAdminUser = user?.email === 'pettigrewjoel@gmail.com' || user?.role === 'admin';

  const handleUpdateAssignment = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'assignments', id), data);
      setEditingAssignment(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `assignments/${id}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        setAuthReady(true);
      } else {
        setUser(null);
        setLoading(false);
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const firebaseUser = auth.currentUser;
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        // Force admin role if email matches
        if (firebaseUser.email === 'pettigrewjoel@gmail.com' && userData.role !== 'admin') {
          updateDoc(userRef, { role: 'admin' });
          userData.role = 'admin';
        }
        setUser(userData);
      } else {
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Hero',
          role: (firebaseUser.email === 'pettigrewjoel@gmail.com' ? 'admin' : '') as any,
          xp: 0,
          level: 1,
          streak: 0,
          tries: 5,
          lastCompletedDate: null,
          assignmentsAddedCount: 0
        };
        setDoc(userRef, newUser);
        setUser(newUser);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setGlobalError(`Failed to load profile: ${error.message}`);
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    });

    const targetUid = impersonatedStudent ? impersonatedStudent.uid : firebaseUser.uid;

    const qScrolls = query(collection(db, 'scrolls'), where('studentId', '==', targetUid));
    const unsubscribeScrolls = onSnapshot(qScrolls, (snapshot) => {
      setScrolls(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Scroll)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'scrolls');
    });

    const qAssignments = query(collection(db, 'assignments'), where('studentId', '==', targetUid));
    const unsubscribeAssignments = onSnapshot(qAssignments, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Assignment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    const qGameSessions = query(collection(db, 'game_sessions'), where('studentId', '==', targetUid));
    const unsubscribeGameSessions = onSnapshot(qGameSessions, (snapshot) => {
      setGameSessions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GameSession)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'game_sessions');
    });

    const qStudyHistory = query(collection(db, 'study_history'), where('studentId', '==', targetUid));
    const unsubscribeStudyHistory = onSnapshot(qStudyHistory, (snapshot) => {
      setStudyHistory(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StudyHistory)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'study_history');
    });

    const qAnswerBanks = query(collection(db, 'answer_banks'), where('studentId', '==', targetUid));
    const unsubscribeAnswerBanks = onSnapshot(qAnswerBanks, (snapshot) => {
      setAnswerBanks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AnswerBank)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'answer_banks');
    });

    return () => {
      unsubscribeUser();
      unsubscribeScrolls();
      unsubscribeAssignments();
      unsubscribeGameSessions();
      unsubscribeStudyHistory();
      unsubscribeAnswerBanks();
    };
  }, [auth.currentUser?.uid, impersonatedStudent]);

  useEffect(() => {
    if (!user?.uid) return;
    
    const qConnections = query(
      collection(db, 'connections'), 
      where(user.role === 'parent' ? 'parentId' : 'studentId', '==', user.uid)
    );
    const unsubscribeConnections = onSnapshot(qConnections, (snapshot) => {
      setConnections(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'connections');
    });

    return () => unsubscribeConnections();
  }, [user?.uid, user?.role]);

  useEffect(() => {
    if (!isAdminUser) return;
    
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as any as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      setAllAssignments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any as Assignment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    const unsubscribeGameSessions = onSnapshot(collection(db, 'game_sessions'), (snapshot) => {
      setAllGameSessions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any as GameSession)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'game_sessions');
    });

    const unsubscribeConnections = onSnapshot(collection(db, 'connections'), (snapshot) => {
      setAllConnections(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'connections');
    });

    return () => {
      unsubscribeUsers();
      unsubscribeAssignments();
      unsubscribeGameSessions();
      unsubscribeConnections();
    };
  }, [isAdminUser]);

  useEffect(() => {
    let parentIdToUse = user?.parentId;
    
    // If student has connections, use the first parent's settings as primary
    if (user?.role === 'student' && connections.length > 0) {
      parentIdToUse = connections[0].parentId;
    }

    if (!parentIdToUse) return;
    
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', parentIdToUse), (doc) => {
      if (doc.exists()) setParentSettings(doc.data() as ParentSettings);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${parentIdToUse}`);
    });
    return () => unsubscribeSettings();
  }, [user?.parentId, user?.role, connections]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setGlobalError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      setGlobalError(`Login failed: ${error.message || 'Unknown error'}. Please check if the domain is authorized in Firebase Console.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSelectRole = async (role: Role, parentId?: string, grade?: string) => {
    if (!user) return;
    
    const profile: UserProfile = { 
      ...user, 
      role,
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      tries: 5, // Give 5 initial tries (Keys)
      lastCompletedDate: null,
      onboarded: true
    };

    if (parentId) {
      // Create a connection if a parentId is provided during role selection
      try {
        await setDoc(doc(db, 'connections', `${parentId}_${user.uid}`), {
          studentId: user.uid,
          parentId: parentId,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error creating connection:", error);
      }
    }

    if (grade) {
      profile.grade = grade;
    }

    if (!role) return;

    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      setUser(profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      throw error;
    }
  };

  const handleToggleComplete = async (assignment: Assignment) => {
    const newStatus: AssignmentStatus = assignment.status === 'completed' ? 'not-started' : 'completed';
    const now = new Date().toISOString();
    
    try {
      await updateDoc(doc(db, 'assignments', assignment.id), { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? now : null
      });

      if (newStatus === 'completed' && activeUser) {
        // Streak logic
        let newStreak = activeUser.streak || 0;
        const lastDate = activeUser.lastCompletedDate ? parseISO(activeUser.lastCompletedDate) : null;
        
        if (!lastDate) {
          newStreak = 1;
        } else if (isYesterday(lastDate)) {
          newStreak += 1;
        } else if (!isToday(lastDate)) {
          newStreak = 1;
        }
        
        const newLongestStreak = Math.max(activeUser.longestStreak || 0, newStreak);

        // Check if on time
        const dueDate = parseISO(assignment.dueDate);
        const isOnTime = isBefore(new Date(), addDays(dueDate, 1));
        
        const xpGain = 100; // 100 XP per quest completed
        const newXp = (activeUser.xp || 0) + xpGain;
        const newLevel = calculateLevel(newXp);
        
        const updates: any = { 
          xp: newXp, 
          level: newLevel,
          lastCompletedDate: now,
          streak: newStreak,
          longestStreak: newLongestStreak
        };

        if (isOnTime) {
          updates.tries = (activeUser.tries || 0) + 1;
        }

        await updateDoc(doc(db, 'users', activeUser.uid), updates);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#f59e0b', '#10b981']
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `assignments/${assignment.id}`);
    }
  };

  const handleAddAssignment = async (data: any) => {
    if (!user) return;
    try {
      const targetUser = impersonatedStudent || user;
      const newCount = (targetUser.assignmentsAddedCount || 0) + 1;
      const updates: any = { assignmentsAddedCount: newCount };
      if (newCount >= 5) {
        updates.assignmentsAddedCount = 0;
        updates.tries = (targetUser.tries || 0) + 1;
      }

      const docRef = await addDoc(collection(db, 'assignments'), {
        ...data,
        studentId: targetUser.uid,
        status: 'not-started',
        xp: 100, // 100 XP per quest
        createdAt: serverTimestamp()
      });
      
      // Generate answer bank asynchronously
      generateAnswerBank(docRef.id, targetUser.uid, data.topic || data.title, data.subject, targetUser.grade);
      
      await updateDoc(doc(db, 'users', targetUser.uid), updates);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding assignment:", error);
      handleFirestoreError(error, OperationType.CREATE, 'assignments');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `assignments/${id}`);
    }
  };

  const handleDeleteScroll = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scrolls', id));
      if (viewingScroll?.id === id) setViewingScroll(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scrolls/${id}`);
    }
  };

  const handleDownloadScroll = (info: Scroll) => {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", info.imageUrl);
    downloadAnchorNode.setAttribute("download", `${info.topic}_scroll.png`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUpdateGrade = async (grade: string) => {
    if (!activeUser) return;
    try {
      await updateDoc(doc(db, 'users', activeUser.uid), { grade });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${activeUser.uid}`);
    }
  };

  const handleResetAccount = async () => {
    if (!user) return;
    try {
      const resetProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: '' as any,
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        tries: 3,
        lastCompletedDate: null
      };
      await setDoc(doc(db, 'users', user.uid), resetProfile);
      setUser(resetProfile);
      setShowResetConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const isSchoolHours = useMemo(() => {
    if (!parentSettings) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = parentSettings.schoolHoursStart.split(':').map(Number);
    const [endH, endM] = parentSettings.schoolHoursEnd.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    return current >= start && current <= end;
  }, [parentSettings]);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(assignments.map(a => a.subject.trim().toLowerCase()));
    return ['all', ...Array.from(uniqueSubjects).map(s => s.charAt(0).toUpperCase() + s.slice(1))];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           a.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const matchesSubject = subjectFilter === 'all' || a.subject.trim().toLowerCase() === subjectFilter.toLowerCase();
      if (!matchesSubject) return false;

      if (filter === 'all') return a.status !== 'completed';
      if (filter === 'today') return isToday(parseISO(a.dueDate)) && a.status !== 'completed';
      if (filter === 'upcoming') return isAfter(parseISO(a.dueDate), startOfDay(new Date())) && !isToday(parseISO(a.dueDate)) && a.status !== 'completed';
      if (filter === 'done') return a.status === 'completed';
      return true;
    }).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [assignments, filter, searchQuery, subjectFilter]);

  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
  }

  if (globalError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-4 border-rose-100 p-12 text-center space-y-8">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900">Quest Error!</h1>
            <p className="text-slate-500 font-medium">{globalError}</p>
          </div>
          <button
            onClick={() => {
              setGlobalError(null);
              setLoading(false);
              handleLogout();
            }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Summoning your Quest...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} isLoggingIn={isLoggingIn} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  }

  const activeUser = impersonatedStudent || user;
  const isStudentView = activeUser?.role === 'student' || (isAdminUser && (adminView === 'student' || adminView === 'admin'));
  const isParentView = user.role === 'parent' || (isAdminUser && adminView === 'parent');

  // Student Onboarding & Linking Logic
  if (isStudentView && !impersonatedStudent && !isAdminUser) {
    if (connections.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-serif">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10 pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl p-12 text-center space-y-10 relative z-10"
          >
            <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 mx-auto border-2 border-brand-100">
              <Users size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Parent Link Required</h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                To begin your adventure, you need to link your account with a parent. 
                Share your ID with them, or enter their ID below.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Student ID</p>
                <p className="text-2xl font-mono font-black text-brand-600 select-all cursor-pointer bg-white py-3 rounded-xl border-2 border-brand-100 shadow-sm">{user.uid}</p>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Enter Parent ID</p>
                <div className="flex gap-2">
                  <input 
                    id="parent-id-input"
                    type="text" 
                    placeholder="Paste Parent ID here..." 
                    className="flex-1 px-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-brand-500 transition-all shadow-inner"
                  />
                  <button 
                    onClick={async () => {
                      const pidInput = (document.getElementById('parent-id-input') as HTMLInputElement).value;
                      const pid = pidInput.trim();
                      if (pid) {
                        try {
                          // Check if parent exists and is a parent
                          const parentDoc = await getDoc(doc(db, 'users', pid));
                          if (!parentDoc.exists()) {
                            setGlobalError("Parent ID not found. Please check the ID and try again.");
                            return;
                          }
                          const parentData = parentDoc.data() as UserProfile;
                          if (parentData.role !== 'parent' && parentData.role !== 'admin') {
                            setGlobalError("This ID does not belong to a parent account.");
                            return;
                          }

                          await setDoc(doc(db, 'connections', `${pid}_${user.uid}`), {
                            studentId: user.uid,
                            parentId: pid,
                            createdAt: new Date().toISOString()
                          });
                        } catch (e) {
                          console.error("Link error:", e);
                          setGlobalError("Failed to link. Please try again.");
                        }
                      }
                    }}
                    className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Link Account
                  </button>
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">
              Sign Out
            </button>
          </motion.div>
        </div>
      );
    }

    if (!user.onboarded) {
      return <StudentOnboarding onComplete={() => updateDoc(doc(db, 'users', user.uid), { onboarded: true })} />;
    }
  }

  if (!user.role && !isAdminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-serif">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl overflow-hidden relative z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-12 space-y-8 border-b-4 md:border-b-0 md:border-r-4 border-[#e6d5b8] bg-[#fdf6e3]/30">
              <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
                <Trophy size={32} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 leading-tight">Choose Your Path, Hero!</h2>
                <p className="text-slate-500 font-medium text-lg">Are you here to conquer quests or to guide a hero on their journey?</p>
              </div>
            </div>
            <div className="p-12 space-y-8">
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => handleSelectRole('student')}
                  className="group p-6 bg-white border-4 border-[#e6d5b8] rounded-3xl hover:border-brand-500 hover:bg-brand-50 transition-all text-left space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">I am a Student</h3>
                    <ArrowRight className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Track homework, earn XP, and battle concepts in games!</p>
                </button>

                <button 
                  onClick={() => handleSelectRole('parent')}
                  className="group p-6 bg-white border-4 border-[#e6d5b8] rounded-3xl hover:border-amber-500 hover:bg-amber-50 transition-all text-left space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">I am a Parent</h3>
                    <ArrowRight className="text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Manage quests, monitor progress, and ensure safety.</p>
                </button>
              </div>

              <div className="pt-8 border-t-2 border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Have a Parent Link Code?</p>
                <div className="flex gap-2">
                  <input 
                    id="parent-link-code"
                    type="text" 
                    placeholder="Enter code here..." 
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-brand-500 transition-all"
                  />
                  <button 
                    onClick={() => {
                      const code = (document.getElementById('parent-link-code') as HTMLInputElement).value;
                      if (code) handleSelectRole('student', code);
                      else setGlobalError("Please enter a valid code!");
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Link & Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isAdminMode = isAdminUser && adminView === 'admin' && !impersonatedStudent && !showGame && !showAnswerBank;

  return (
    <div className="h-screen bg-slate-50 font-sans selection:bg-brand-100 selection:text-brand-900 flex flex-col">
      {impersonatedStudent && (
        <div className="bg-brand-600 text-white px-6 py-2 flex items-center justify-between sticky top-0 z-[60] shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Shield size={16} />
            <span>Viewing as {impersonatedStudent.displayName} ({impersonatedStudent.role})</span>
          </div>
          <button 
            onClick={() => {
              setImpersonatedStudent(null);
              if (isAdminUser) setAdminView('admin');
            }}
            className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-black uppercase tracking-widest transition-colors"
          >
            {isAdminUser ? 'Back to Admin' : 'Back to Parent Dashboard'}
          </button>
        </div>
      )}

      {/* Admin Control Panel (Floating) */}
      {isAdminUser && !impersonatedStudent && (
        <AdminControlPanel 
          currentView={adminView} 
          setView={setAdminView} 
          onReset={() => setShowResetConfirm(true)} 
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

      {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="text-brand-500" size={24} />
            <span className="text-base font-black tracking-tighter uppercase">studyquest360</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-[#fdf6e3] border-r-4 border-[#e6d5b8] p-6 gap-8 flex-shrink-0 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-5 pointer-events-none" />
        <div className="flex items-center gap-2 relative z-10 min-w-0">
          <div className="w-9 h-9 bg-[#8b5cf6] rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-[#7c3aed] flex-shrink-0">
            <Trophy size={20} />
          </div>
          <h1 className="text-base font-black tracking-tighter text-[#4a3f35] uppercase truncate">studyquest360</h1>
        </div>

        <nav className="flex flex-col gap-2 relative z-10">
          {impersonatedStudent && (
            <button 
              onClick={() => {
                setImpersonatedStudent(null);
                if (isAdminUser) setAdminView('admin');
              }}
              className="flex items-center gap-2 px-3 py-2 w-full bg-brand-50 text-brand-700 rounded-xl font-black text-[11px] uppercase tracking-tight hover:bg-brand-100 transition-all mb-4 border-2 border-brand-200 shadow-sm whitespace-nowrap"
            >
              <Shield size={14} className="flex-shrink-0" />
              Return to Portal
            </button>
          )}
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Dashboard" active={!showGame && !showAnswerBank} onClick={() => { setShowGame(false); setShowAnswerBank(false); setIsStudyAssistOpen(false); }} />
          {isStudentView && (
            <>
              <SidebarLink icon={<Gamepad2 size={20} />} label="Game Zone" active={showGame && !showAnswerBank} onClick={() => { setShowGame(true); setShowAnswerBank(false); setIsStudyAssistOpen(false); }} />
              <SidebarLink icon={<BookOpen size={20} />} label="Answer Bank" active={showAnswerBank} onClick={() => { setShowAnswerBank(true); setShowGame(false); setIsStudyAssistOpen(false); }} />
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 px-4">
                  <ScrollIcon size={16} className="text-[#8c7b68]" />
                  <h4 className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">Scrolls</h4>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto px-2">
                  {scrolls.length > 0 ? scrolls.slice(0, 3).map(info => (
                    <div key={info.id} className="group relative flex items-center gap-1">
                      <button 
                        onClick={() => setViewingScroll(info)}
                        className="flex-1 text-left px-3 py-2 rounded-lg text-xs font-bold text-[#4a3f35] hover:bg-white/50 hover:text-[#8b5cf6] transition-all truncate"
                      >
                        {info.topic}
                      </button>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownloadScroll(info)} className="p-1.5 text-[#8c7b68] hover:text-[#8b5cf6]" title="Download"><ExternalLink size={14} /></button>
                        <button onClick={() => handleDeleteScroll(info.id)} className="p-1.5 text-[#8c7b68] hover:text-rose-500" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="px-4 text-[10px] text-[#8c7b68] italic">No scrolls yet</p>
                  )}
                </div>
              </div>
            </>
          )}
          {!isStudentView && (
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 px-4 py-3 w-full text-[#8c7b68] font-bold hover:text-amber-600 transition-all mt-4"
            >
              <Settings size={20} />
              Reset Role
            </button>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t-2 border-[#e6d5b8] space-y-4 relative z-10">
          {isStudentView && (
            <div className="px-2 space-y-4">
              <div className="p-4 bg-white/50 border-2 border-[#e6d5b8] rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">{impersonatedStudent ? "Student ID" : "Your Student ID"}</p>
                <p className="text-xs font-mono font-black text-[#8b5cf6] break-all select-all cursor-pointer" title="Click to select ID">{activeUser.uid}</p>
                <p className="text-[8px] text-[#8c7b68] font-medium italic">Share this with a parent to link accounts</p>
              </div>
              <InterestsManager 
                interests={activeUser.interests || []} 
                onUpdate={(interests) => updateDoc(doc(db, 'users', activeUser.uid), { interests })} 
              />
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-[#8c7b68] font-bold hover:text-rose-500 transition-all">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {isAdminMode ? (
          <AdminDashboard 
            users={allUsers} 
            assignments={allAssignments} 
            gameSessions={allGameSessions} 
            connections={allConnections}
            onImpersonate={(u) => {
              setImpersonatedStudent(u);
              setAdminView(u.role === 'parent' ? 'parent' : 'student');
            }}
          />
        ) : (user.role === 'parent' || (isAdminUser && adminView === 'parent')) && !impersonatedStudent ? (
          <ParentDashboard user={user} onReset={() => setShowResetConfirm(true)} onImpersonate={setImpersonatedStudent} />
        ) : showAnswerBank ? (
          <AnswerBankView studentId={activeUser.uid} assignments={assignments} grade={activeUser.grade} />
        ) : showGame ? (
          <div className="p-6 md:p-12 max-w-6xl mx-auto">
            <GameZone 
              user={activeUser}
              assignments={assignments}
              answerBanks={answerBanks}
              isSchoolHours={isSchoolHours}
              sessions={gameSessions}
              parentSettings={parentSettings}
              onTryUsed={() => updateDoc(doc(db, 'users', activeUser.uid), { tries: activeUser.tries - 1 })}
              onScore={(gameId, score) => {
                const currentHighScore = activeUser.highScores?.[gameId] || 0;
                const newXp = activeUser.xp + (score * 10); // 10 XP per game point
                const newLevel = calculateLevel(newXp);
                const updates: any = { 
                  xp: newXp,
                  level: newLevel
                };
                if (score > currentHighScore) {
                  updates[`highScores.${gameId}`] = score;
                }
                updateDoc(doc(db, 'users', activeUser.uid), updates);
                
                // Track session
                addDoc(collection(db, 'game_sessions'), {
                  studentId: activeUser.uid,
                  gameId,
                  score,
                  createdAt: new Date().toISOString()
                });
              }}
            />
          </div>
        ) : (
          <div className="p-4 md:p-8 lg:p-12 space-y-8 font-serif">
            <header className="bg-[#fdf6e3] p-8 rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl relative overflow-hidden z-40 mb-12">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                {/* Left Section: Welcome & Level */}
                <div className="flex items-center gap-6 flex-1">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 border-white/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                      <Trophy size={40} className="drop-shadow-lg" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-400 text-[#4a3f35] w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-black text-lg shadow-lg">
                      {activeUser.level}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-black text-[#4a3f35] tracking-tight leading-tight">
                      Welcome, <span className="text-[#8b5cf6]">{activeUser.displayName}</span>!
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-3 py-1 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#8b5cf6]/20">
                        {getLevelTitle(activeUser.level)}
                      </span>
                      <div className="w-48 h-3 bg-[#e6d5b8] rounded-full overflow-hidden border border-[#d4c4a8] shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(activeUser.xp)}%` }}
                          className="h-full bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] bg-[length:200%_100%] animate-shimmer"
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">
                        {activeUser.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Controls & Stats */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 justify-end">
                  {/* Grade Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans ml-1">Current Grade</span>
                    <select 
                      value={activeUser.grade || ''} 
                      onChange={(e) => handleUpdateGrade(e.target.value)}
                      className="text-sm font-black text-[#4a3f35] bg-white px-4 py-3 rounded-2xl border-2 border-[#e6d5b8] outline-none focus:ring-4 focus:ring-[#8b5cf6]/20 transition-all shadow-sm font-sans min-w-[160px] appearance-none cursor-pointer hover:border-[#8b5cf6]"
                    >
                      <option value="">Select Grade</option>
                      {['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quest Keys */}
                  <div className="flex items-center gap-4 px-6 py-3 bg-white border-2 border-[#e6d5b8] rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Quest Keys</span>
                      <span className="text-2xl font-black text-[#4a3f35] leading-none">{activeUser.tries || 0}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border-2 border-amber-200 shadow-inner group">
                      <Key size={24} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                    </div>
                  </div>

                  {/* New Quest Button */}
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-[#8b5cf6] text-white rounded-[2rem] font-black text-lg hover:bg-[#7c3aed] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#8b5cf6]/30 border-2 border-[#7c3aed] font-sans group"
                  >
                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                    <span>New Quest</span>
                  </button>
                </div>
              </div>
            </header>

            <AssignmentTimeline 
              assignments={assignments} 
              onSelect={(a) => {
                setSelectedAssignment(a);
                questBoardRef.current?.scrollIntoView({ behavior: 'smooth' });
              }} 
            />

            <div className="relative font-serif">
              <AnimatePresence mode="wait">
                <motion.div 
                  key="quest-board"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8" 
                  ref={questBoardRef}
                >
                  <section className="bg-[#fdf6e3] rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl overflow-hidden flex flex-col min-h-[800px] relative">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10 pointer-events-none" />
                      
                      <div className="p-10 border-b-4 border-[#e6d5b8] flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/50 relative z-10">
                        <div>
                          <h3 className="text-4xl font-black text-[#4a3f35] tracking-tight">Quest Board</h3>
                          <p className="text-[#8c7b68] font-bold font-sans mt-1">Manage your active learning adventures</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#e6d5b8] rounded-2xl shadow-sm">
                            <span className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Subject:</span>
                            <select 
                              value={subjectFilter} 
                              onChange={(e) => setSubjectFilter(e.target.value)}
                              className="text-sm font-black bg-transparent border-none outline-none focus:ring-0 text-[#8b5cf6] font-sans cursor-pointer"
                            >
                              {subjects.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="flex items-center gap-3 px-8 py-4 bg-[#8b5cf6] text-white rounded-2xl font-black hover:bg-[#7c3aed] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#8b5cf6]/20 border-2 border-[#7c3aed] font-sans group"
                          >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                            New Quest
                          </button>
                        </div>
                      </div>

                      <div className="p-6 border-b-4 border-[#e6d5b8] bg-white/80 relative z-10">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8c7b68]" size={24} />
                            <input 
                              type="text" 
                              placeholder="Search your quests..." 
                              className="pl-14 pr-6 py-4 bg-white border-2 border-[#e6d5b8] rounded-2xl text-lg font-bold focus:outline-none w-full transition-all focus:ring-4 focus:ring-[#8b5cf6]/10 text-[#4a3f35] placeholder:text-[#b8a992] font-sans"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          <div className="flex p-2 bg-white/50 border-2 border-[#e6d5b8] rounded-2xl gap-2 shrink-0">
                            <FilterTab active={filter === 'all'} onClick={() => setFilter('all')} label="All Quests" />
                            <FilterTab active={filter === 'today'} onClick={() => setFilter('today')} label="Today" />
                            <FilterTab active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} label="Upcoming" />
                            <FilterTab active={filter === 'done'} onClick={() => setFilter('done')} label="Completed" />
                          </div>
                        </div>
                      </div>

                      <div className="divide-y-2 divide-[#e6d5b8] overflow-y-auto flex-1 custom-scrollbar relative z-10 bg-white/30">
                        {filteredAssignments.length > 0 ? filteredAssignments.map(a => (
                            <AssignmentRow 
                              key={a.id} 
                              assignment={a} 
                              onToggle={() => handleToggleComplete(a)} 
                              onDelete={() => handleDeleteAssignment(a.id)}
                              onSelect={() => {
                                setSelectedAssignment(a);
                              }}
                              onStudy={() => {
                                setSelectedAssignment(a);
                                setSelectedTopic(a.topic || a.title);
                                setIsStudyAssistOpen(true);
                              }}
                              onTraining={() => {
                                setTrainingAssignment(a);
                                setIsTrainingOpen(true);
                              }}
                              onEdit={() => setEditingAssignment(a)}
                              isSelected={selectedAssignment?.id === a.id}
                            />
                        )) : (
                          <div className="p-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-white border-4 border-[#e6d5b8] rounded-[2rem] flex items-center justify-center text-[#b8a992] mx-auto shadow-inner">
                              <Search size={48} />
                            </div>
                            <div className="space-y-2">
                              <p className="text-2xl font-black text-[#4a3f35]">No Quests Found</p>
                              <p className="text-[#8c7b68] font-bold font-sans">Try adjusting your filters or start a new quest!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>

    {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isTrainingOpen && trainingAssignment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <TrainingModule 
                assignment={trainingAssignment}
                user={activeUser}
                onClose={() => {
                  setIsTrainingOpen(false);
                  setTrainingAssignment(null);
                }}
              />
            </motion.div>
          </div>
        )}

        {isStudyAssistOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Study Assistant</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Topic: {selectedTopic}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsStudyAssistOpen(false);
                    setSelectedTopic('');
                  }}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StudyAssist 
                  topic={selectedTopic} 
                  subject={selectedAssignment?.subject || ''}
                  blockedTopics={parentSettings?.blockedTopics || []} 
                  interests={activeUser.interests}
                  grade={activeUser.grade}
                  studentId={activeUser.uid}
                  history={studyHistory}
                />
              </div>
            </motion.div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowResetConfirm(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mx-auto">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900">Reset Account?</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  This will clear your current role, XP, and progress. You'll be taken back to the role selection screen.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleResetAccount}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-[0.98]"
                >
                  Yes, Reset Everything
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {editingAssignment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <EditAssignmentForm 
                assignment={editingAssignment} 
                onUpdate={handleUpdateAssignment} 
                onClose={() => setEditingAssignment(null)} 
              />
            </motion.div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              <AddAssignmentForm onAdd={handleAddAssignment} onClose={() => setIsAddModalOpen(false)} />
            </motion.div>
          </div>
        )}

        {viewingScroll && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-8"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{viewingScroll.topic}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Generated Scroll</p>
                </div>
                <button 
                  onClick={() => setViewingScroll(null)} 
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-12 space-y-12 bg-white flex justify-center">
                <img 
                  src={viewingScroll.imageUrl} 
                  alt={`Scroll about ${viewingScroll.topic}`}
                  className="max-w-full h-auto rounded-2xl shadow-lg border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setViewingScroll(null)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameZone({ user, assignments, answerBanks, isSchoolHours, onTryUsed, onScore, sessions = [], parentSettings }: { user: UserProfile, assignments: Assignment[], answerBanks: AnswerBank[], isSchoolHours: boolean, onTryUsed: () => void, onScore: (gameId: string, score: number) => void, sessions?: any[], parentSettings: ParentSettings | null }) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    if (parentSettings?.activeGameId) {
      setSelectedGame(parentSettings.activeGameId);
    }
  }, [parentSettings?.activeGameId]);

  const games = [
    { id: 'concept-match', title: 'Concept Match', description: 'Match 4 concepts to score points.', icon: <Gamepad2 size={24} />, color: 'bg-[#8b5cf6]' },
    { id: 'gravity-match', title: 'Gravity Drop', description: 'Physics-based concept matching with falling shapes!', icon: <Sparkles size={24} />, color: 'bg-[#f59e0b]' },
    { id: 'questrun', title: 'Quest Run', description: 'Run, jump, and answer questions in this fast-paced arena!', icon: <Zap size={24} />, color: 'bg-[#3b82f6]' },
    { id: 'target-practice', title: 'Target Practice', description: 'Aim and shoot at the correct answers!', icon: <Target size={24} />, color: 'bg-[#ef4444]' }
  ];

  const last14Days = eachDayOfInterval({
    start: subDays(new Date(), 13),
    end: new Date()
  });

  const chartData = last14Days.map(day => {
    const daySessions = sessions.filter(s => {
      try {
        const dateStr = s.createdAt || (s as any).date;
        if (!dateStr) return false;
        // Handle both Firestore Timestamp and ISO string
        const sessionDate = (dateStr as any).toDate ? (dateStr as any).toDate() : parseISO(dateStr as string);
        return isSameDay(sessionDate, day);
      } catch (e) {
        return false;
      }
    });
    return {
      date: format(day, 'MMM d'),
      'Concept Match': daySessions.filter(s => s.gameId === 'concept-match').length,
      'Gravity Drop': daySessions.filter(s => s.gameId === 'gravity-match').length,
      'Quest Run': daySessions.filter(s => s.gameId === 'questrun').length,
      'Target Practice': daySessions.filter(s => s.gameId === 'target-practice').length
    };
  });

  if (selectedGame === 'questrun') {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGame(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all">
          <ChevronRight size={20} className="rotate-180" /> Back to Games
        </button>
        <QuestRunGame 
          tries={user.tries} 
          isSchoolHours={isSchoolHours}
          onTryUsed={onTryUsed}
          onScore={(score) => onScore('questrun', score)}
          assignments={assignments}
          answerBanks={answerBanks}
          user={user}
        />
      </div>
    );
  }

  if (selectedGame === 'target-practice') {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGame(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all">
          <ChevronRight size={20} className="rotate-180" /> Back to Games
        </button>
        <TargetPracticeGame 
          tries={user.tries} 
          isSchoolHours={isSchoolHours}
          onTryUsed={onTryUsed}
          onScore={(score) => onScore('target-practice', score)}
          assignments={assignments}
          answerBanks={answerBanks}
          user={user}
        />
      </div>
    );
  }

  if (selectedGame === 'concept-match') {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGame(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all">
          <ChevronRight size={20} className="rotate-180" /> Back to Games
        </button>
        <ConceptMatchGame 
          tries={user.tries} 
          isSchoolHours={isSchoolHours}
          onTryUsed={onTryUsed}
          onScore={(score) => onScore('concept-match', score)}
          grade={user.grade}
          assignments={assignments}
          answerBanks={answerBanks}
          user={user}
        />
      </div>
    );
  }

  if (selectedGame === 'gravity-match') {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGame(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all">
          <ChevronRight size={20} className="rotate-180" /> Back to Games
        </button>
        <GravityMatchGame 
          tries={user.tries} 
          isSchoolHours={isSchoolHours}
          assignments={assignments}
          answerBanks={answerBanks}
          onTryUsed={onTryUsed}
          onScore={(score) => onScore('gravity-match', score)}
          grade={user.grade}
          user={user}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 font-serif">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#4a3f35] mb-2">The Arena</h2>
          <p className="text-[#8c7b68] font-medium font-sans">Use your keys to battle concepts and earn XP!</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-[#fdf6e3] border-2 border-[#e6d5b8] rounded-2xl shadow-sm">
          <Trophy className="text-amber-500" size={24} />
          <div>
            <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Total XP</p>
            <p className="text-xl font-black text-[#4a3f35]">{user.xp}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#fdf6e3] p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#4a3f35] flex items-center gap-2">
              <Gamepad2 className="text-[#8b5cf6]" /> Choose Your Battle
            </h3>
            
            <div className="relative">
              <select 
                value={selectedGame || ''}
                onChange={(e) => setSelectedGame(e.target.value || null)}
                className="w-full appearance-none bg-white border-2 border-[#e6d5b8] text-[#4a3f35] font-bold text-lg py-4 pl-6 pr-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6] transition-all shadow-sm font-sans"
              >
                <option value="">Select a game...</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.title}</option>
                ))}
              </select>
              <ChevronRight size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7b68] rotate-90 pointer-events-none" />
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-[#e6d5b8]">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200">
                <Key size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Quest Keys Available</p>
                <p className="text-2xl font-black text-[#4a3f35]">{user.tries || 0}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#4a3f35] flex items-center gap-2">
              <Trophy className="text-amber-500" /> High Scores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {games.map(game => (
                <div key={game.id} className="bg-white/80 border-2 border-[#e6d5b8] rounded-2xl p-4 flex items-center justify-between shadow-sm backdrop-blur-sm hover:border-[#8b5cf6] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110", game.color)}>
                      {game.icon}
                    </div>
                    <div>
                      <p className="font-bold text-[#4a3f35] text-sm font-sans">{game.title}</p>
                      <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Best Score</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#8b5cf6] font-sans">{user.highScores?.[game.id] || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#fdf6e3] p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-[#4a3f35] mb-6 flex items-center gap-2">
            <BarChart3 className="text-[#8b5cf6]" /> Game Activity (Last 14 Days)
          </h3>
          <div className="h-[300px] w-full bg-white/50 rounded-2xl p-4 border-2 border-[#e6d5b8]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6d5b8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#8c7b68', fontFamily: 'sans-serif' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#8c7b68', fontFamily: 'sans-serif' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: '2px solid #e6d5b8', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fdf6e3', fontFamily: 'sans-serif' }}
                  cursor={{ fill: '#fdf6e3', opacity: 0.5 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700, fontFamily: 'sans-serif', color: '#4a3f35' }} />
                <Bar dataKey="Concept Match" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Gravity Drop" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Quest Run" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Target Practice" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSelection({ user, onSelect }: { user: UserProfile, onSelect: (role: Role, parentId?: string, grade?: string) => void }) {
  const [role, setRole] = useState<Role | null>(null);
  const [parentId, setParentId] = useState('');
  const [grade, setGrade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grades = ['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900">Choose Your Path</h2>
          <p className="text-slate-500 font-medium text-lg">Are you here to learn or to lead?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => setRole('student')}
            className={cn(
              "p-8 rounded-[2rem] border-4 transition-all text-left space-y-4 group",
              role === 'student' ? "border-brand-500 bg-brand-50/50" : "border-slate-100 hover:border-brand-200"
            )}
          >
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Student</h3>
              <p className="text-slate-500 font-medium">Complete quests, earn XP, and level up your knowledge.</p>
            </div>
          </button>

          <button 
            onClick={() => setRole('parent')}
            className={cn(
              "p-8 rounded-[2rem] border-4 transition-all text-left space-y-4 group",
              role === 'parent' ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 hover:border-emerald-200"
            )}
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Parent</h3>
              <p className="text-slate-500 font-medium">Monitor progress, set school hours, and manage safety.</p>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {role === 'student' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">What grade are you in?</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="">Select your grade...</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Parent Link Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter your parent's link code" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-400 font-medium">Ask your parent for their code in their dashboard.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          disabled={!role || (role === 'student' && !grade) || isSubmitting}
          onClick={async () => {
            if (!role) return;
            setIsSubmitting(true);
            setError(null);
            try {
              await onSelect(role, parentId, grade);
            } catch (err: any) {
              setError(err.message || "Failed to save profile. Please try again.");
              setIsSubmitting(false);
            }
          }}
          className={cn(
            "w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3",
            (role && (role !== 'student' || grade)) ? "bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98]" : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
          Begin Adventure
        </button>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
}



function InterestsManager({ interests, onUpdate }: { interests: string[], onUpdate: (interests: string[]) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const INTEREST_CATEGORIES: Record<string, { icon: React.ReactNode, topics: string[], color: string, gradient: string }> = {
    "Video Games": { 
      icon: <Gamepad2 size={18} />, 
      color: "text-indigo-600",
      gradient: "from-indigo-500 to-purple-600",
      topics: ["Minecraft", "Roblox", "Fortnite", "Starcraft", "Mario games", "Pokémon", "Zelda", "Racing games", "Sports games", "Puzzle games"]
    },
    "Sports": { 
      icon: <Trophy size={18} />, 
      color: "text-emerald-600",
      gradient: "from-emerald-500 to-teal-600",
      topics: ["Basketball", "Soccer", "Football", "Baseball", "Swimming", "Track & field", "Skateboarding", "Gymnastics", "Martial arts", "Surfing"]
    },
    "Fantasy": { 
      icon: <Sparkles size={18} />, 
      color: "text-amber-600",
      gradient: "from-amber-400 to-orange-600",
      topics: ["Superheroes", "Dragons", "Wizards", "Knights", "Magic schools", "Monsters", "Space heroes", "Time travel", "Mythology", "D&D"]
    },
    "Transportation": { 
      icon: <Zap size={18} />, 
      color: "text-blue-600",
      gradient: "from-blue-500 to-cyan-600",
      topics: ["Race cars", "Monster trucks", "Construction vehicles", "Airplanes", "Rockets", "Trains", "Motorcycles", "Electric cars", "Boats", "Robots"]
    },
    "Animals": { 
      icon: <Heart size={18} />, 
      color: "text-rose-600",
      gradient: "from-rose-500 to-pink-600",
      topics: ["Dinosaurs", "Jungle animals", "Ocean animals", "Pets", "Birds", "Insects", "Farm animals", "Arctic animals", "Reptiles", "Endangered species"]
    }
  };

  const handleTopicToggle = (topic: string) => {
    const combined = `${selectedCategory}: ${topic}`;
    if (interests.includes(combined)) {
      onUpdate(interests.filter(i => i !== combined));
    } else {
      onUpdate([...interests, combined]);
    }
  };

  return (
    <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-[2rem] p-4 border-2 border-[#e6d5b8] shadow-inner">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
            <Sparkles size={14} />
          </div>
          <h4 className="text-[10px] font-black text-[#4a3f35] uppercase tracking-widest font-serif">My Interests</h4>
        </div>
        <span className="text-[9px] font-black text-brand-500 bg-white px-2 py-0.5 rounded-full border border-brand-100">{interests.length}</span>
      </div>
      
      {/* Category Selection Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {Object.entries(INTEREST_CATEGORIES).map(([cat, data]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
            title={cat}
            className={cn(
              "aspect-square rounded-xl flex items-center justify-center transition-all relative group",
              selectedCategory === cat 
                ? "bg-brand-500 text-white shadow-lg scale-110 z-10" 
                : "bg-white border border-[#e6d5b8] text-slate-400 hover:border-brand-300 hover:text-brand-500"
            )}
          >
            {data.icon}
            {selectedCategory === cat && (
              <motion.div layoutId="cat-indicator" className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Topic Selection Area */}
      <div className="relative min-h-[120px] flex flex-col">
        <AnimatePresence mode="wait">
          {selectedCategory ? (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3 flex-1"
            >
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                {INTEREST_CATEGORIES[selectedCategory].topics.map(topic => {
                  const isSelected = interests.includes(`${selectedCategory}: ${topic}`);
                  return (
                    <button
                      key={topic}
                      onClick={() => handleTopicToggle(topic)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border shadow-sm",
                        isSelected 
                          ? "bg-brand-500 border-brand-600 text-white" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-brand-200"
                      )}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <MousePointer2 size={20} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                Select a category<br/>to find topics
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Interests Summary */}
      {interests.length > 0 && (
        <div className="pt-3 border-t border-[#e6d5b8] flex flex-wrap gap-1.5">
          {interests.slice(0, 4).map(interest => (
            <span 
              key={interest} 
              className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-bold text-slate-600 group transition-all"
            >
              {interest.split(': ')[1] || interest}
              <button onClick={() => onUpdate(interests.filter(i => i !== interest))} className="text-slate-300 hover:text-rose-500">
                <X size={10} />
              </button>
            </span>
          ))}
          {interests.length > 4 && (
            <span className="text-[8px] font-black text-brand-500 py-1">+{interests.length - 4} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl font-black text-sm transition-all uppercase tracking-widest",
      active 
        ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/20 border-2 border-[#7c3aed]" 
        : "text-[#8c7b68] hover:bg-white/50 hover:text-[#4a3f35]"
    )}>
      {icon}
      {label}
    </button>
  );
}

function AdminControlPanel({ currentView, setView, onReset }: { currentView: string, setView: (v: any) => void, onReset: () => void }) {
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeDatabase = async () => {
    if (!window.confirm("WARNING: This will delete ALL data in the CURRENT database. This cannot be undone. Are you sure?")) return;
    
    setIsWiping(true);
    try {
      const collections = ['users', 'assignments', 'scrolls', 'game_sessions', 'study_history', 'answer_banks', 'connections', 'settings'];
      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, colName, docSnap.id));
        }
      }
      alert("Database wiped successfully. Please refresh.");
      window.location.reload();
    } catch (error) {
      console.error("Wipe failed:", error);
      alert("Wipe failed. Check console for details.");
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center gap-2"
    >
      <div className="px-4 py-2 border-r border-slate-700 hidden md:block">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Control</p>
      </div>
      
      <button 
        onClick={handleWipeDatabase}
        disabled={isWiping}
        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2"
        title="Wipe Database"
      >
        {isWiping ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        <span className="hidden sm:inline text-xs font-bold">Wipe</span>
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />
      <button 
        onClick={() => setView('admin')}
        className={cn(
          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
          currentView === 'admin' ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-400 hover:text-white"
        )}
      >
        <Shield size={14} />
        <span className="hidden sm:inline">Admin</span>
      </button>
      <button 
        onClick={() => setView('parent')}
        className={cn(
          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
          currentView === 'parent' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white"
        )}
      >
        <Users size={14} />
        <span className="hidden sm:inline">Parent</span>
      </button>
      <button 
        onClick={() => setView('student')}
        className={cn(
          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
          currentView === 'student' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
        )}
      >
        <Trophy size={14} />
        <span className="hidden sm:inline">Student</span>
      </button>
      <div className="w-px h-6 bg-slate-700 mx-2" />
      <button 
        onClick={onReset}
        className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-2"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </motion.div>
  );
}

function FilterTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-4 py-2 rounded-xl text-sm font-bold transition-all",
      active ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
    )}>{label}</button>
  );
}

function EditAssignmentForm({ assignment, onUpdate, onClose }: { assignment: Assignment, onUpdate: (id: string, data: any) => void, onClose: () => void }) {
  const [title, setTitle] = useState(assignment.title);
  const [subject, setSubject] = useState(assignment.subject);
  const [topic, setTopic] = useState(assignment.topic);
  const [link, setLink] = useState(assignment.link || '');
  const [dueDate, setDueDate] = useState(format(parseISO(assignment.dueDate), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<Priority>(assignment.priority);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use startOfDay to ensure we don't have timezone shifts
    const parsedDate = parseISO(dueDate);
    onUpdate(assignment.id, { 
      title, 
      subject, 
      topic: topic || title, 
      link,
      dueDate: parsedDate.toISOString(), 
      priority, 
      xp: priority === 'high' ? 500 : 250 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black text-slate-900">Edit Quest</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
      </div>
      <div className="space-y-4">
        <input autoFocus required placeholder="Quest Title" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Subject" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={subject} onChange={e => setSubject(e.target.value)} />
          <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <input placeholder="Study Topic (e.g. Photosynthesis)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic} onChange={e => setTopic(e.target.value)} />
        <input placeholder="Assignment Link (e.g. Google Doc URL)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={link} onChange={e => setLink(e.target.value)} />
      </div>
      <button type="submit" className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-brand-200">Update Quest</button>
    </form>
  );
}

const AssignmentRow: React.FC<{ 
  assignment: Assignment, 
  onToggle: () => void, 
  onDelete: () => void, 
  onSelect: () => void, 
  onStudy: () => void,
  onTraining: () => void,
  onEdit: () => void, 
  isSelected?: boolean 
}> = ({ assignment, onToggle, onDelete, onSelect, onStudy, onTraining, onEdit, isSelected }) => {
  return (
    <div className={cn(
      "group p-6 flex items-center gap-6 transition-all hover:bg-white/50 cursor-pointer border-l-8", 
      assignment.status === 'completed' ? "opacity-60 border-transparent" : isSelected ? "border-[#8b5cf6] bg-[#8b5cf6]/5" : "border-transparent"
    )}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={cn(
          "w-12 h-12 rounded-2xl border-4 flex items-center justify-center transition-all shadow-lg transform active:scale-90",
          assignment.status === 'completed' 
            ? "bg-emerald-500 border-emerald-600 text-white rotate-[360deg]" 
            : "bg-white border-[#e6d5b8] text-[#e6d5b8] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
        )}>
          {assignment.status === 'completed' ? <CheckCircle2 size={24} strokeWidth={3} /> : <Circle size={24} strokeWidth={3} />}
        </button>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-tighter",
          assignment.status === 'completed' ? "text-emerald-600" : "text-[#8c7b68]"
        )}>
          {assignment.status === 'completed' ? 'Turned In' : 'Turn In'}
        </span>
      </div>
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#8c7b68] uppercase tracking-widest font-sans">
            <Calendar size={14} />
            {format(parseISO(assignment.dueDate), 'MMMM d, yyyy')}
          </div>
          <span className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-widest bg-[#8b5cf6]/10 px-3 py-2 rounded-full border border-[#8b5cf6]/20 font-sans">
            {assignment.subject}
          </span>
          {assignment.topic && (
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-sans flex items-center gap-1">
              <Sparkles size={10} />
              {assignment.topic}
            </span>
          )}
          {assignment.link && (
            <a 
              href={assignment.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="text-[#8b5cf6] hover:text-[#7c3aed] p-1 bg-white rounded-md border border-[#e6d5b8] shadow-sm"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <h5 className={cn("text-xl font-black text-[#4a3f35] truncate leading-tight", assignment.status === 'completed' && "line-through text-slate-400")}>
          {assignment.title}
        </h5>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onStudy(); }} 
            className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#7c3aed] transition-all shadow-md border-2 border-[#7c3aed]"
          >
            <Wand2 size={16} />
            Study
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onTraining(); }} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md border-2 border-emerald-600"
          >
            <BrainCircuit size={16} />
            Training
          </button>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-3 bg-white text-[#b8a992] hover:text-[#8b5cf6] rounded-xl border border-[#e6d5b8] shadow-sm transition-all hover:scale-110">
          <Settings size={20} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-3 bg-white text-[#b8a992] hover:text-rose-500 rounded-xl border border-[#e6d5b8] shadow-sm transition-all hover:scale-110">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

function AssignmentTimeline({ assignments, onSelect }: { assignments: Assignment[], onSelect: (a: Assignment) => void }) {
  const today = startOfDay(new Date());
  const twoWeeksLater = addDays(today, 14);
  
  const days = eachDayOfInterval({ start: today, end: twoWeeksLater });

  // Tolkien-like Pencil Elements
  const PencilMountain = ({ x, y, scale = 1 }: { x: number, y: number, scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className="opacity-40 pointer-events-none">
      {/* Main peak */}
      <path d="M 0,40 L 20,0 L 40,40" fill="none" stroke="#8c7b68" strokeWidth="1.5" strokeLinecap="round" />
      {/* Snow cap detail */}
      <path d="M 15,10 L 20,15 L 25,10" fill="none" stroke="#8c7b68" strokeWidth="1" strokeLinecap="round" />
      {/* Shading lines */}
      <path d="M 10,20 L 15,25 M 25,10 L 30,15" fill="none" stroke="#8c7b68" strokeWidth="1" strokeLinecap="round" />
      {/* Base detail */}
      <path d="M 5,30 Q 15,25 25,35" fill="none" stroke="#8c7b68" strokeWidth="1" strokeLinecap="round" />
      {/* Secondary peak */}
      <path d="M 25,40 L 35,20 L 45,40" fill="none" stroke="#8c7b68" strokeWidth="1" strokeLinecap="round" />
      {/* Small rocks */}
      <circle cx="5" cy="42" r="1.5" fill="#8c7b68" />
      <circle cx="45" cy="42" r="1" fill="#8c7b68" />
    </g>
  );

  const PencilTree = ({ x, y, scale = 1 }: { x: number, y: number, scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className="opacity-30 pointer-events-none">
      {/* Trunk */}
      <path d="M 10,40 L 10,30" fill="none" stroke="#8c7b68" strokeWidth="2" strokeLinecap="round" />
      {/* Layers */}
      <path d="M 0,30 L 10,10 L 20,30 Z" fill="none" stroke="#8c7b68" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 2,22 L 10,5 L 18,22 Z" fill="none" stroke="#8c7b68" strokeWidth="1.5" strokeLinecap="round" />
      {/* Texture */}
      <path d="M 5,20 L 15,20 M 7,12 L 13,12" fill="none" stroke="#8c7b68" strokeWidth="1" strokeLinecap="round" />
      {/* Ground lines */}
      <path d="M 5,42 L 15,42" fill="none" stroke="#8c7b68" strokeWidth="0.5" />
    </g>
  );

  const PencilRiver = ({ x, y, width = 100 }: { x: number, y: number, width?: number }) => (
    <g transform={`translate(${x}, ${y})`} className="opacity-20 pointer-events-none">
      <path d={`M 0,0 Q ${width/4},10 ${width/2},0 T ${width},0`} fill="none" stroke="#8c7b68" strokeWidth="1" strokeDasharray="4 2" />
      <path d={`M 5,5 Q ${width/4},15 ${width/2},5 T ${width},5`} fill="none" stroke="#8c7b68" strokeWidth="1" strokeDasharray="4 2" />
    </g>
  );
  
  const getAssignmentsForDay = (day: Date) => {
    return assignments.filter(a => {
      const dueDate = startOfDay(parseISO(a.dueDate));
      return isSameDay(dueDate, day) && a.status !== 'completed';
    });
  };

  const overdue = assignments.filter(a => {
    const dueDate = startOfDay(parseISO(a.dueDate));
    return isBefore(dueDate, today) && a.status !== 'completed';
  });

  const weekendIcons = [
    Package, FlaskConical, Sword, Crown, Gem, Key, Map, Compass, ScrollIcon, BookOpen, Star, Moon, Sun, Ghost, Wand2
  ];

  // Calculate path points for alignment
  const pathPoints = useMemo(() => {
    return days.map((_, i) => ({
      x: i * 120 + 60, // 120 is the min-w-[120px] gap
      y: 128 + Math.sin(i * 0.8) * 40
    }));
  }, [days]);

  const svgPath = useMemo(() => {
    if (pathPoints.length === 0) return "";
    let d = `M 0,128`;
    pathPoints.forEach((p, i) => {
      if (i === 0) {
        d += ` L ${p.x},${p.y}`;
      } else {
        const prev = pathPoints[i-1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (p.x - prev.x) / 2;
        const cp2y = p.y;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
      }
    });
    d += ` L ${pathPoints[pathPoints.length-1].x + 200},128`;
    return d;
  }, [pathPoints]);

  return (
    <div className="w-full bg-[#fdf6e3] p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg mb-8 overflow-hidden relative font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8b5cf6] text-white rounded-xl shadow-md border-2 border-[#7c3aed]">
            <Map size={20} />
          </div>
          <h3 className="text-2xl font-black text-[#4a3f35] uppercase tracking-widest">Quest Map</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#8c7b68]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#7c3aed]"></div>
            <span>Quest Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-rose-600"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>

      <div className="relative h-72 flex items-center z-10 overflow-x-auto custom-scrollbar px-8 py-12">
        {/* Wavy Map Path Line */}
        <svg className="absolute inset-0 h-full pointer-events-none" style={{ width: pathPoints.length * 120 + 200 }}>
          {/* Background Decorations - Placed to avoid path (y ranges 88-168) */}
          {/* Top Area (y < 60) */}
          <PencilMountain x={100} y={20} scale={1.2} />
          <PencilMountain x={400} y={10} scale={1.5} />
          <PencilMountain x={700} y={25} scale={1.1} />
          <PencilMountain x={1000} y={15} scale={1.4} />
          <PencilMountain x={1300} y={20} scale={1.2} />
          <PencilMountain x={1600} y={10} scale={1.6} />

          <PencilTree x={250} y={40} scale={1.1} />
          <PencilTree x={550} y={30} scale={0.9} />
          <PencilTree x={850} y={45} scale={1.2} />
          <PencilTree x={1150} y={35} scale={1} />
          <PencilTree x={1450} y={40} scale={1.3} />

          {/* Bottom Area (y > 200) */}
          <PencilMountain x={200} y={220} scale={1.3} />
          <PencilMountain x={500} y={230} scale={1.1} />
          <PencilMountain x={800} y={215} scale={1.4} />
          <PencilMountain x={1100} y={225} scale={1.2} />
          <PencilMountain x={1400} y={210} scale={1.5} />
          <PencilMountain x={1700} y={230} scale={1.3} />

          <PencilTree x={150} y={210} />
          <PencilTree x={450} y={220} scale={1.2} />
          <PencilTree x={750} y={205} scale={0.8} />
          <PencilTree x={1050} y={215} scale={1.1} />
          <PencilTree x={1350} y={220} scale={0.9} />
          <PencilTree x={1650} y={210} scale={1.2} />
          
          <PencilRiver x={50} y={240} width={300} />
          <PencilRiver x={600} y={250} width={400} />
          <PencilRiver x={1200} y={245} width={500} />

          <path 
            d={svgPath} 
            fill="none" 
            stroke="#d4c4a8" 
            strokeWidth="6" 
            strokeDasharray="12 12" 
            strokeLinecap="round"
          />
        </svg>

        <div className="flex-1 flex gap-0 relative min-w-max items-center">
          {/* Overdue Section */}
          {overdue.length > 0 && (
            <div className="flex flex-col items-center relative group min-w-[120px]" style={{ transform: 'translateY(-20px)' }}>
              <div className="absolute -top-24 flex flex-col-reverse items-center gap-2">
                {overdue.map((a, idx) => {
                  const size = idx >= 3 ? (idx >= 5 ? 'w-6 h-6' : 'w-8 h-8') : 'w-10 h-10';
                  const iconSize = idx >= 3 ? (idx >= 5 ? 12 : 14) : 18;
                  return (
                    <button 
                      key={a.id}
                      onClick={() => onSelect(a)}
                      className={cn(
                        "rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-rose-700 z-20 tooltip-trigger",
                        size
                      )}
                      title={a.title}
                    >
                      <Skull size={iconSize} />
                    </button>
                  );
                })}
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-200 border-4 border-rose-500 z-10 flex items-center justify-center mb-2 shadow-md">
                <div className="w-4 h-4 bg-rose-600 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-[#fdf6e3] px-2 py-1 rounded-md border border-rose-200">Overdue</span>
            </div>
          )}

          {/* Timeline Days */}
          {days.map((day, i) => {
            const dayAssignments = getAssignmentsForDay(day);
            const isWknd = isSaturday(day) || isSunday(day);
            const isTodayDay = isToday(day);
            
            // Use the pre-calculated points for perfect alignment
            const point = pathPoints[i];
            const yOffset = point ? point.y - 128 : 0;
            
            return (
              <div 
                key={day.toISOString()} 
                className="flex flex-col items-center relative group min-w-[120px]" 
                style={{ transform: `translateY(${yOffset}px)` }}
              >
                {dayAssignments.length > 0 && (
                  <div className="absolute -top-24 flex flex-col-reverse items-center gap-2">
                    {dayAssignments.map((a, idx) => {
                      const size = idx >= 3 ? (idx >= 5 ? 'w-6 h-6' : 'w-8 h-8') : 'w-10 h-10';
                      const textSize = idx >= 3 ? (idx >= 5 ? 'text-[8px]' : 'text-[10px]') : 'text-sm';
                      return (
                        <button 
                          key={a.id}
                          onClick={() => onSelect(a)}
                          className={cn(
                            "rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-[#7c3aed] z-20 tooltip-trigger",
                            size
                          )}
                          title={a.title}
                        >
                          <span className={cn("font-black font-sans", textSize)}>{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <div className={cn(
                  "z-10 flex items-center justify-center mt-auto mb-2 transition-all shadow-md",
                  isWknd ? "w-14 h-14 bg-white border-4 border-amber-400 rounded-2xl rotate-[-5deg] hover:rotate-0 hover:scale-110" : "w-8 h-8 rounded-full border-4",
                  !isWknd && isTodayDay ? "bg-amber-200 border-amber-500" : 
                  !isWknd && dayAssignments.length > 0 ? "bg-[#ddd6fe] border-[#8b5cf6]" : 
                  !isWknd ? "bg-[#fdf6e3] border-[#d4c4a8]" : ""
                )}>
                  {isWknd ? (
                    (() => {
                      const WkndIcon = weekendIcons[i % weekendIcons.length];
                      return <WkndIcon size={24} className="text-amber-500" />;
                    })()
                  ) : (
                    <>
                      {isTodayDay && <div className="w-3 h-3 bg-amber-600 rounded-full" />}
                      {!isTodayDay && dayAssignments.length > 0 && <div className="w-3 h-3 bg-[#8b5cf6] rounded-full" />}
                    </>
                  )}
                </div>
                
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isTodayDay ? "text-amber-600" :
                  isWknd ? "text-amber-500" : "text-[#8c7b68]"
                )}>
                  {isTodayDay ? 'Today' : format(day, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddAssignmentForm({ onAdd, onClose }: { onAdd: (a: any) => Promise<void>, onClose: () => void }) {
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
        xp: 100 // 100 XP per quest
      });
    } catch (err: any) {
      console.error("Add quest error:", err);
      setError(err.message || "Failed to add quest. Please check your permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black text-slate-900">New Quest</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertTriangle size={16} />
          {error.includes('insufficient permissions') ? "Permission Denied: You don't have access to add quests for this student." : error}
        </div>
      )}

      <div className="space-y-4">
        <input autoFocus required placeholder="Quest Title" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Subject" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={subject} onChange={e => setSubject(e.target.value)} />
          <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <input placeholder="Study Topic (e.g. Photosynthesis)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic} onChange={e => setTopic(e.target.value)} />
        <input placeholder="Assignment Link (e.g. Google Doc URL)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={link} onChange={e => setLink(e.target.value)} />
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-brand-200 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
        {isSubmitting ? 'Accepting Quest...' : 'Accept Quest'}
      </button>
    </form>
  );
}
