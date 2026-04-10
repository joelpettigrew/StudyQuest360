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
  Trees,
  Flag
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
  AnswerBank,
  Trial,
  GlobalTopic
} from './types';

import forest1 from './components/Forest1.png';
import forest2 from './components/Forest2.png';
import lake from './components/lake.png';
import lake2 from './components/lake2.png';
import lakeandtrees from './components/lakeandtrees.png';
import mountains from './components/Mountains.png';
import mountains2 from './components/mountains2.png';
import mountains3 from './components/mountains3.png';

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
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isStudyAssistOpen, setIsStudyAssistOpen] = useState(false);
  const [isLinkGuardianOpen, setIsLinkGuardianOpen] = useState(false);
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

  const [trials, setTrials] = useState<Trial[]>([]);
  const [isAddTrialModalOpen, setIsAddTrialModalOpen] = useState(false);
  const [isTrialStudyOpen, setIsTrialStudyOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);

  const isAdminUser = user?.email === 'pettigrewjoel@gmail.com' || user?.role === 'admin';

  const handleAddTrial = async (data: any) => {
    if (!user) return;
    try {
      const targetUser = impersonatedStudent || user;
      const trialData = {
        ...data,
        studentId: targetUser.uid,
        status: 'not-started',
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'trials'), trialData);
      setIsAddTrialModalOpen(false);
      
      // Process each topic for global database and answer bank in background
      Promise.all(data.topics.map((topic: string) => 
        processTopicForGlobalDB(topic, data.subject, targetUser.grade || '9th Grade', targetUser.uid)
      )).catch(err => console.error("Background topic processing failed:", err));
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trials');
    }
  };

  const processTopicForGlobalDB = async (topic: string, subject: string, grade: string, studentId: string) => {
    try {
      // Check global_topics
      const q = query(
        collection(db, 'global_topics'),
        where('subject', '==', subject),
        where('topic', '==', topic),
        where('grade', '==', grade)
      );
      const snapshot = await getDocs(q);
      
      let globalData: any;
      
      if (snapshot.empty) {
        // Generate new via AI
        const aiResponse = await generateAIAnswerBankData(topic, subject, grade);
        if (aiResponse) {
          const newGlobalTopic = {
            subject,
            topic,
            grade,
            concepts: aiResponse.concepts,
            questions: aiResponse.questions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const globalDoc = await addDoc(collection(db, 'global_topics'), newGlobalTopic);
          globalData = { ...newGlobalTopic, id: globalDoc.id };
        }
      } else {
        globalData = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
      }

      if (globalData) {
        // Populate student's answer bank from global data
        await addDoc(collection(db, 'answer_banks'), {
          studentId,
          assignmentId: 'trial_topic',
          topic,
          subject,
          concepts: globalData.concepts.map((c: any) => ({ ...c, status: 'kept' })),
          relationships: [],
          questions: globalData.questions,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error processing global topic:", error);
    }
  };

  const generateAIAnswerBankData = async (topic: string, subject: string, grade: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const prompt = `Create an educational answer bank for a ${grade} student studying ${subject}: ${topic}.
    Return JSON with:
    1. concepts: array of {term, definition} (8-12 items)
    2. questions: array of {question, correctAnswer, distractors: string[]} (10-15 items)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) return null;
      // Clean markdown if present
      const jsonStr = text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("AI Generation failed", e);
      return null;
    }
  };

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

    const qTrials = query(collection(db, 'trials'), where('studentId', '==', targetUid));
    const unsubscribeTrials = onSnapshot(qTrials, (snapshot) => {
      setTrials(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trial)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'trials');
    });

    return () => {
      unsubscribeUser();
      unsubscribeScrolls();
      unsubscribeAssignments();
      unsubscribeGameSessions();
      unsubscribeStudyHistory();
      unsubscribeAnswerBanks();
      unsubscribeTrials();
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

  const handleDeleteTrial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'trials');
    }
  };

  const handleToggleTrialComplete = async (trial: Trial) => {
    try {
      const newStatus = trial.status === 'completed' ? 'not-started' : 'completed';
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completedAt = new Date().toISOString();
      } else {
        updateData.completedAt = null;
      }
      await updateDoc(doc(db, 'trials', trial.id), updateData);
      
      if (newStatus === 'completed') {
        const targetUser = impersonatedStudent || user;
        if (targetUser) {
          await updateDoc(doc(db, 'users', targetUser.uid), {
            xp: (targetUser.xp || 0) + 200 // Trials give more XP
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trials/${trial.id}`);
    }
  };

  const handleUpdateTrial = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'trials', id), data);
      setEditingTrial(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trials/${id}`);
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
      // Now using global DB logic
      await processTopicForGlobalDB(data.topic || data.title, data.subject, targetUser.grade || '9th Grade', targetUser.uid);
      
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

  const isLockedOut = useMemo(() => {
    if (!parentSettings) return false;
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
    const daysType = parentSettings.blockedDaysType || 'all';

    // Check if current day is a blocked day
    if (daysType === 'weekdays') {
      if (currentDay === 0 || currentDay === 6) return false; // Weekend, not blocked
    } else if (daysType === 'weekends') {
      if (currentDay >= 1 && currentDay <= 5) return false; // Weekday, not blocked
    }

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

  const filteredItems = useMemo(() => {
    const filteredAssignments = assignments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           a.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const matchesSubject = subjectFilter === 'all' || a.subject.trim().toLowerCase() === subjectFilter.toLowerCase();
      if (!matchesSubject) return false;

      if (dateFilter) {
        return isSameDay(parseISO(a.dueDate), dateFilter) && a.status !== 'completed';
      }

      if (showOverdueOnly) {
        return isBefore(parseISO(a.dueDate), startOfDay(new Date())) && a.status !== 'completed';
      }

      if (filter === 'all') return a.status !== 'completed';
      if (filter === 'today') return isToday(parseISO(a.dueDate)) && a.status !== 'completed';
      if (filter === 'upcoming') return isAfter(parseISO(a.dueDate), startOfDay(new Date())) && !isToday(parseISO(a.dueDate)) && a.status !== 'completed';
      if (filter === 'done') return a.status === 'completed';
      return true;
    }).map(a => ({ ...a, type: 'assignment' as const }));

    const filteredTrials = trials.filter(t => {
      const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.topics.some(tp => tp.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      const matchesSubject = subjectFilter === 'all' || t.subject.trim().toLowerCase() === subjectFilter.toLowerCase();
      if (!matchesSubject) return false;

      if (dateFilter) {
        return isSameDay(parseISO(t.dueDate), dateFilter);
      }

      if (showOverdueOnly) {
        return isBefore(parseISO(t.dueDate), startOfDay(new Date()));
      }

      if (filter === 'done') return t.status === 'completed';
      if (filter === 'all') return t.status !== 'completed';
      if (filter === 'today') return isToday(parseISO(t.dueDate)) && t.status !== 'completed';
      if (filter === 'upcoming') return isAfter(parseISO(t.dueDate), startOfDay(new Date())) && !isToday(parseISO(t.dueDate)) && t.status !== 'completed';
      return true;
    }).map(t => ({ ...t, type: 'trial' as const }));

    return [...filteredAssignments, ...filteredTrials].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [assignments, trials, filter, searchQuery, subjectFilter, dateFilter, showOverdueOnly]);

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
  const isGuardianView = user.role === 'parent' || (isAdminUser && adminView === 'parent');

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
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Guardian Link Required</h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                To begin your adventure, you need to link your account with a guardian. 
                Share your ID with them, or enter their ID below.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Student ID</p>
                <p className="text-2xl font-mono font-black text-brand-600 select-all cursor-pointer bg-white py-3 rounded-xl border-2 border-brand-100 shadow-sm flex items-center justify-center gap-2 group" onClick={() => {
                  navigator.clipboard.writeText(user.uid);
                  alert("ID Copied to clipboard!");
                }}>
                  {user.uid}
                  <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Enter Guardian ID</p>
                <div className="flex gap-2">
                  <input 
                    id="parent-id-input"
                    type="text" 
                    placeholder="Paste Guardian ID here..." 
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
                            setGlobalError("Guardian ID not found. Please check the ID and try again.");
                            return;
                          }
                          const parentData = parentDoc.data() as UserProfile;
                          if (parentData.role !== 'parent' && parentData.role !== 'admin') {
                            setGlobalError("This ID does not belong to a guardian account.");
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
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">I am a Guardian</h3>
                    <ArrowRight className="text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Manage quests, monitor progress, and ensure safety.</p>
                </button>
              </div>

              <div className="pt-8 border-t-2 border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Have a Guardian Link Code?</p>
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
            {isAdminUser ? 'Back to Admin' : 'Back to Guardian Dashboard'}
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
              isLockedOut={isLockedOut}
              parentSettings={parentSettings}
              sessions={gameSessions}
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
            <header className="bg-[#fdf6e3] p-4 rounded-[2rem] border-4 border-[#e6d5b8] shadow-2xl relative overflow-hidden z-40 mb-4">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section: Welcome & Level */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                      <Trophy size={28} className="drop-shadow-lg" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-[#4a3f35] w-7 h-7 rounded-full border-2 border-white flex items-center justify-center font-black text-xs shadow-md">
                      {activeUser.level}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-black text-[#4a3f35] tracking-tight leading-tight">
                      Welcome, <span className="text-[#8b5cf6]">{activeUser.displayName}</span>!
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#8b5cf6]/20">
                        {getLevelTitle(activeUser.level)}
                      </span>
                      <div className="w-32 h-2 bg-[#e6d5b8] rounded-full overflow-hidden border border-[#d4c4a8] shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(activeUser.xp)}%` }}
                          className="h-full bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] bg-[length:200%_100%] animate-shimmer"
                        />
                      </div>
                      <span className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">
                        {activeUser.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Controls & Stats */}
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 justify-end">
                  {/* Grade Selector */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest font-sans ml-1">Grade</span>
                    <select 
                      value={activeUser.grade || ''} 
                      onChange={(e) => handleUpdateGrade(e.target.value)}
                      className="text-xs font-black text-[#4a3f35] bg-white px-3 py-2 rounded-xl border-2 border-[#e6d5b8] outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all shadow-sm font-sans min-w-[140px] appearance-none cursor-pointer hover:border-[#8b5cf6]"
                    >
                      <option value="">Select Grade</option>
                      {['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quest Keys */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-[#e6d5b8] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-[#8c7b68] uppercase tracking-widest font-sans">Keys</span>
                      <span className="text-lg font-black text-[#4a3f35] leading-none">{activeUser.tries || 0}</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200 shadow-inner group">
                      <Key size={16} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                    </div>
                  </div>

                  {/* Add Guardian Button */}
                  <button 
                    onClick={() => setIsLinkGuardianOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#8c7b68] rounded-2xl font-black text-sm hover:bg-[#fdf6e3] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-200 border-2 border-[#e6d5b8] font-sans group"
                  >
                    <Users size={18} className="group-hover:scale-110 transition-transform" />
                    <span>Add Guardian</span>
                  </button>

                  {/* New Trial Button */}
                  <button 
                    onClick={() => setIsAddTrialModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/30 border-2 border-amber-600 font-sans group min-w-[140px]"
                  >
                    <Flame size={18} className="group-hover:animate-pulse" />
                    <span>New Trial</span>
                  </button>

                  {/* New Quest Button */}
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#8b5cf6] text-white rounded-2xl font-black text-sm hover:bg-[#7c3aed] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#8b5cf6]/30 border-2 border-[#7c3aed] font-sans group min-w-[140px]"
                  >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>New Quest</span>
                  </button>
                </div>
              </div>
            </header>

            <AssignmentTimeline 
              assignments={assignments} 
              trials={trials}
              onSelect={(a) => {
                setSelectedAssignment(a);
                questBoardRef.current?.scrollIntoView({ behavior: 'smooth' });
              }} 
              onTrialSelect={(t) => {
                setSelectedTrial(t);
                setIsTrialStudyOpen(true);
              }}
              onDateSelect={(date) => {
                setDateFilter(date);
                setShowOverdueOnly(false);
                setFilter('all');
                questBoardRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOverdueSelect={() => {
                setShowOverdueOnly(true);
                setDateFilter(null);
                setFilter('all');
                questBoardRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              selectedDate={dateFilter}
              isOverdueSelected={showOverdueOnly}
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
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[#8c7b68] font-bold font-sans">
                              {dateFilter ? `Quests for ${format(dateFilter, 'MMM do')}` : showOverdueOnly ? 'Overdue Quests' : 'Manage your active learning adventures'}
                            </p>
                            {(dateFilter || showOverdueOnly) && (
                              <button 
                                onClick={() => { setDateFilter(null); setShowOverdueOnly(false); }}
                                className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-widest hover:underline"
                              >
                                (Clear Filter)
                              </button>
                            )}
                          </div>
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
                        {filteredItems.length > 0 ? filteredItems.map(item => (
                          item.type === 'assignment' ? (
                            <AssignmentRow 
                              key={item.id} 
                              assignment={item} 
                              onToggle={() => handleToggleComplete(item)} 
                              onDelete={() => handleDeleteAssignment(item.id)}
                              onSelect={() => {
                                setSelectedAssignment(item);
                              }}
                              onStudy={() => {
                                setSelectedAssignment(item);
                                setSelectedTopic(item.topic || item.title);
                                setIsStudyAssistOpen(true);
                              }}
                              onTraining={() => {
                                setTrainingAssignment(item);
                                setIsTrainingOpen(true);
                              }}
                              onEdit={() => setEditingAssignment(item)}
                              isSelected={selectedAssignment?.id === item.id}
                            />
                          ) : (
                            <TrialRow 
                              key={item.id}
                              trial={item}
                              onToggle={() => handleToggleTrialComplete(item)} 
                              onDelete={() => handleDeleteTrial(item.id)}
                              onSelect={() => {
                                setSelectedTrial(item);
                                setIsTrialStudyOpen(true);
                              }}
                              onEdit={() => setEditingTrial(item)}
                              isSelected={selectedTrial?.id === item.id}
                            />
                          )
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
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
                  <h3 className="text-2xl font-black text-slate-900">The Oracle</h3>
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

        {isLinkGuardianOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLinkGuardianOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Guardian</h3>
                <button onClick={() => setIsLinkGuardianOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 font-medium">Enter another guardian's ID to link them to your account.</p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian ID</label>
                  <input 
                    id="extra-guardian-id"
                    type="text" 
                    placeholder="Paste Guardian ID here..." 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <button 
                  onClick={async () => {
                    const pid = (document.getElementById('extra-guardian-id') as HTMLInputElement).value.trim();
                    if (pid) {
                      try {
                        const parentDoc = await getDoc(doc(db, 'users', pid));
                        if (!parentDoc.exists()) {
                          alert("Guardian ID not found!");
                          return;
                        }
                        const parentData = parentDoc.data() as UserProfile;
                        if (parentData.role !== 'parent' && parentData.role !== 'admin') {
                          alert("This ID does not belong to a guardian account.");
                          return;
                        }
                        await setDoc(doc(db, 'connections', `${pid}_${user.uid}`), {
                          studentId: user.uid,
                          parentId: pid,
                          createdAt: new Date().toISOString()
                        });
                        setIsLinkGuardianOpen(false);
                        alert("Guardian added successfully!");
                      } catch (e) {
                        alert("Failed to link guardian.");
                      }
                    }
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                  Link Guardian
                </button>
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
        {editingTrial && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <EditTrialForm 
                trial={editingTrial} 
                onUpdate={handleUpdateTrial} 
                onClose={() => setEditingTrial(null)} 
              />
            </motion.div>
          </div>
        )}

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

        {isAddTrialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddTrialModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              <AddTrialForm onAdd={handleAddTrial} onClose={() => setIsAddTrialModalOpen(false)} />
            </motion.div>
          </div>
        )}

        {isTrialStudyOpen && selectedTrial && (
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
                  <h3 className="text-2xl font-black text-slate-900">Trial Preparation</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Subject: {selectedTrial.subject}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsTrialStudyOpen(false);
                    setSelectedTrial(null);
                  }}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedTrial.topics.map((topic, i) => (
                    <div key={i} className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                          <Flame size={20} />
                        </div>
                        <h4 className="font-black text-amber-900">{topic}</h4>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedTopic(topic);
                          setIsStudyAssistOpen(true);
                        }}
                        className="w-full py-3 bg-white border-2 border-amber-200 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Wand2 size={16} />
                        Study Topic
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                      <BrainCircuit size={32} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black">Trial Training</h4>
                      <p className="text-slate-400 font-medium">Randomized practice across all trial topics</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Create a dummy assignment for training module
                      const dummyAssignment: Assignment = {
                        id: 'trial-training',
                        studentId: selectedTrial.studentId,
                        parentId: '', // Required by interface
                        title: `Trial Training: ${selectedTrial.subject}`,
                        subject: selectedTrial.subject,
                        topic: selectedTrial.topics.join(','), // Use comma separated for TrainingModule to detect
                        dueDate: selectedTrial.dueDate,
                        priority: 'high',
                        status: 'not-started',
                        xp: 0,
                        createdAt: new Date().toISOString()
                      };
                      setTrainingAssignment(dummyAssignment);
                      setIsTrainingOpen(true);
                    }}
                    className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-500/20"
                  >
                    Start Training Mode
                  </button>
                </div>
              </div>
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

function GameZone({ user, assignments, answerBanks, isLockedOut, onTryUsed, onScore, sessions = [], parentSettings }: { user: UserProfile, assignments: Assignment[], answerBanks: AnswerBank[], isLockedOut: boolean, onTryUsed: () => void, onScore: (gameId: string, score: number) => void, sessions?: any[], parentSettings: ParentSettings | null }) {
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
          isLockedOut={isLockedOut}
          parentSettings={parentSettings}
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
          isLockedOut={isLockedOut}
          parentSettings={parentSettings}
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
          isLockedOut={isLockedOut}
          parentSettings={parentSettings}
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
          isLockedOut={isLockedOut}
          parentSettings={parentSettings}
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Guardian Link Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter your guardian's link code" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-400 font-medium">Ask your guardian for their code in their dashboard.</p>
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
        <span className="hidden sm:inline">Guardian</span>
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

function EditTrialForm({ trial, onUpdate, onClose }: { trial: Trial, onUpdate: (id: string, data: any) => void, onClose: () => void }) {
  const [subject, setSubject] = useState(trial.subject);
  const [topics, setTopics] = useState(trial.topics);
  const [dueDate, setDueDate] = useState(trial.dueDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(trial.id, { subject, topics, dueDate });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Trial</h3>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
          <input 
            type="text" 
            required 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Topics (3 required)</label>
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <input 
                key={i}
                type="text" 
                required 
                placeholder={`Topic ${i + 1}`}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                value={topics[i] || ''}
                onChange={(e) => {
                  const newTopics = [...topics];
                  newTopics[i] = e.target.value;
                  setTopics(newTopics);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Due Date</label>
          <input 
            type="date" 
            required 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <button 
        type="submit"
        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-amber-600 transition-all active:scale-95"
      >
        Save Changes
      </button>
    </form>
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

const TrialRow: React.FC<{ 
  trial: Trial, 
  onToggle: () => void,
  onDelete: () => void, 
  onSelect: () => void, 
  onEdit: () => void,
  isSelected?: boolean 
}> = ({ trial, onToggle, onDelete, onSelect, onEdit, isSelected }) => {
  return (
    <div className={cn(
      "group p-6 flex items-center gap-6 transition-all hover:bg-white/50 cursor-pointer border-l-8", 
      trial.status === 'completed' ? "opacity-60 border-transparent" : isSelected ? "border-amber-500 bg-amber-500/5" : "border-transparent"
    )}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={cn(
          "w-12 h-12 rounded-2xl border-4 flex items-center justify-center transition-all shadow-lg transform active:scale-90",
          trial.status === 'completed' 
            ? "bg-emerald-500 border-emerald-600 text-white rotate-[360deg]" 
            : "bg-amber-100 border-amber-200 text-amber-600 hover:border-amber-500"
        )}>
          {trial.status === 'completed' ? <CheckCircle2 size={24} strokeWidth={3} /> : <Flame size={24} strokeWidth={3} />}
        </button>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-tighter",
          trial.status === 'completed' ? "text-emerald-600" : "text-amber-600"
        )}>
          {trial.status === 'completed' ? 'Conquered' : 'Trial'}
        </span>
      </div>
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#8c7b68] uppercase tracking-widest font-sans">
            <Calendar size={14} />
            {format(parseISO(trial.dueDate), 'MMMM d, yyyy')}
          </div>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-full border border-amber-200 font-sans">
            {trial.subject}
          </span>
        </div>
        <h5 className={cn("text-xl font-black text-[#4a3f35] truncate leading-tight", trial.status === 'completed' && "line-through text-slate-400")}>
          Trial: {trial.topics.join(', ')}
        </h5>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md border-2 border-amber-600 flex items-center gap-2">
          <Wand2 size={16} />
          Prepare
        </button>
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

function AssignmentTimeline({ 
  assignments, 
  trials = [],
  onSelect, 
  onTrialSelect,
  onDateSelect, 
  onOverdueSelect, 
  selectedDate, 
  isOverdueSelected 
}: { 
  assignments: Assignment[], 
  trials?: Trial[],
  onSelect: (a: Assignment) => void,
  onTrialSelect: (t: Trial) => void,
  onDateSelect: (date: Date) => void,
  onOverdueSelect: () => void,
  selectedDate: Date | null,
  isOverdueSelected: boolean
}) {
  const today = startOfDay(new Date());
  // User requested 14 flags
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  
  const OrnateCompassRose = ({ x, y, scale = 1 }: { x: number, y: number, scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className="pointer-events-none">
      <circle cx="0" cy="0" r="45" fill="none" stroke="#a68a5c" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="0" cy="0" r="40" fill="none" stroke="#2c241a" strokeWidth="0.5" />
      <path d="M 0,-50 L 8,0 L 0,50 L -8,0 Z" fill="#a68a5c" stroke="#2c241a" strokeWidth="1" />
      <path d="M -50,0 L 0,-8 L 50,0 L 0,8 Z" fill="#a68a5c" stroke="#2c241a" strokeWidth="1" />
      <path d="M 30,-30 L 0,0 L -30,30 M -30,-30 L 0,0 L 30,30" fill="none" stroke="#2c241a" strokeWidth="0.8" />
      <text x="0" y="-55" textAnchor="middle" className="fill-[#2c241a] font-serif text-[14px] font-bold">N</text>
      <text x="55" y="5" textAnchor="middle" className="fill-[#2c241a] font-serif text-[14px] font-bold">E</text>
      <text x="0" y="65" textAnchor="middle" className="fill-[#2c241a] font-serif text-[14px] font-bold">S</text>
      <text x="-55" y="5" textAnchor="middle" className="fill-[#2c241a] font-serif text-[14px] font-bold">W</text>
    </g>
  );

  const BrassCompass = () => (
    <div className="w-12 h-12 relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-[#8c6d46] bg-[#5c4033] shadow-lg" />
      <div className="absolute inset-2 rounded-full border-2 border-[#a68a5c] bg-[#fdf6e3]" />
      <div className="w-1 h-8 bg-[#2c241a] rounded-full rotate-45 relative z-10" />
      <div className="w-2 h-2 bg-[#a68a5c] rounded-full absolute z-20" />
    </div>
  );

  const PennantFlag = ({ color, active, count }: { color: string, active: boolean, count: number }) => (
    <g className={cn("transition-all duration-500", active ? "scale-110" : "")}>
      <path d="M 0,0 V 60" fill="none" stroke="#5c4033" strokeWidth="3" strokeLinecap="round" />
      <path d="M -2,0 H 2" fill="none" stroke="#5c4033" strokeWidth="2" />
      <path 
        d="M 0,5 L 40,15 L 0,25 Z" 
        fill={color} 
        stroke="#2c241a" 
        strokeWidth="1" 
        className="opacity-90"
      />
      <text x="12" y="18" textAnchor="middle" className="fill-[#2c241a] font-bold text-[12px] pointer-events-none">
        {count > 0 ? count : ""}
      </text>
      <path d="M 40,15 L 45,14 M 40,15 L 44,17" fill="none" stroke="#2c241a" strokeWidth="0.5" />
    </g>
  );

  const WantedPoster = ({ count, onClick, active }: { count: number, onClick: () => void, active: boolean }) => (
    <motion.div 
      initial={{ rotate: -5 }}
      whileHover={{ rotate: 0, scale: 1.05 }}
      onClick={onClick}
      className={cn(
        "absolute bottom-8 left-8 z-40 cursor-pointer transition-all",
        active ? "ring-4 ring-rose-400 rounded-lg scale-110" : ""
      )}
    >
      <div className="w-24 h-32 bg-[#f4e4bc] border-2 border-[#2c241a] shadow-lg relative p-2 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10" />
        <div className="w-full border-b border-[#2c241a] pb-1 mb-1">
          <p className="text-[8px] font-black uppercase tracking-widest text-rose-800 font-['Cinzel']">Wanted</p>
        </div>
        <Skull size={24} className="text-rose-900 mb-1 opacity-80" />
        <p className="text-[6px] font-bold text-[#2c241a] uppercase tracking-tight font-['Cinzel']">Overdue</p>
        <p className="text-xl font-black text-rose-900 font-['Cinzel']">{count}</p>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#e6d5b8] rotate-45 border-t border-r border-[#2c241a]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#e6d5b8] -rotate-45 border-t border-l border-[#2c241a]" />
      </div>
    </motion.div>
  );

  const pathPoints = useMemo(() => {
    // 14 points in a weave - adjusted spacing to fit viewBox
    return Array.from({ length: 14 }, (_, i) => ({
      x: 60 + i * 82,
      y: 300 + Math.sin(i * 0.8) * 110
    }));
  }, []);

  const backgroundElements = useMemo(() => {
    const images = [mountains, forest1, mountains2, forest2, lake, lake2, lakeandtrees, mountains3];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    // viewBox is 1200x650. Center is 600, 325.
    // Original size was approx 600x275. 300% increase means 1800x825.
    const imgW = 1800;
    const imgH = 825;

    return [{
      src: randomImage,
      x: 600 - imgW / 2,
      y: 325 - imgH / 2,
      w: imgW,
      h: imgH,
      quadId: 0
    }];
  }, []);

  const svgPath = useMemo(() => {
    let d = `M ${pathPoints[0].x},${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      const p = pathPoints[i];
      const prev = pathPoints[i-1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      d += ` C ${cp1x},${prev.y} ${cp2x},${p.y} ${p.x},${p.y}`;
    }
    return d;
  }, [pathPoints]);

  return (
    <div className="w-full bg-[#fdf6e3] rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl mb-12 overflow-hidden relative font-serif">
      {/* Parchment Scroll Container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-[650px] bg-[#e6d5b8] overflow-hidden"
      >
        {/* Parchment Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#8c6d46]/10 via-transparent to-[#8c6d46]/10 pointer-events-none" />
        
        {/* Tattered Edges */}
        <div className="absolute inset-0 border-[12px] border-transparent" style={{ 
          borderImageSource: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          borderImageSlice: 30,
          filter: 'contrast(1.2) sepia(0.5)'
        }} />

        {/* Header Section - Moved to avoid overlap */}
        <div className="absolute top-8 left-12 z-20 flex items-start gap-4">
          <div className="space-y-0">
            <h3 className="text-4xl font-bold text-[#2c241a] tracking-tight font-['Cinzel'] leading-none">THE QUEST TRAIL</h3>
            <p className="text-[#5c4033] font-medium text-[10px] uppercase tracking-[0.2em] opacity-80 font-['Cinzel']">Chart your journey through the realms of knowledge</p>
          </div>
        </div>

        {/* Map Content SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 650">
          {/* Compass Rose - Moved to top right */}
          <OrnateCompassRose x={1100} y={50} scale={1} />
          
          {/* PNG Background Elements */}
          <defs>
            {backgroundElements.map((el, i) => (
              <radialGradient key={`grad-${i}`} id={`edgeFade-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            ))}
            {backgroundElements.map((el, i) => (
              <mask key={`mask-${i}`} id={`maskFade-${i}`}>
                <rect 
                  x={el.x} 
                  y={el.y} 
                  width={el.w} 
                  height={el.h} 
                  fill={`url(#edgeFade-${i})`} 
                />
              </mask>
            ))}
          </defs>
          {backgroundElements.map((el, i) => (
            <image 
              key={i}
              href={el.src}
              x={el.x}
              y={el.y}
              width={el.w}
              height={el.h}
              style={{ mixBlendMode: 'multiply' }}
              className="pointer-events-none opacity-30"
              mask={`url(#maskFade-${i})`}
            />
          ))}

          {/* Labels */}
          
          {/* The Trail Path */}
          <path 
            d={svgPath} 
            fill="none" 
            stroke="#2c241a" 
            strokeWidth="3" 
            strokeDasharray="6 8" 
            strokeLinecap="round"
            className="opacity-40"
          />

          {/* Markers and Dates */}
          {days.map((day, i) => {
            const point = pathPoints[i];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isFirst = i === 0;
            const isWknd = isSaturday(day) || isSunday(day);
            const dayAssignments = assignments.filter(a => isSameDay(parseISO(a.dueDate), day) && a.status !== 'completed');
            const dayTrials = trials.filter(t => isSameDay(parseISO(t.dueDate), day) && t.status !== 'completed');
            
            return (
              <g key={day.toISOString()} transform={`translate(${point.x}, ${point.y - 60})`}>
                <rect 
                  x="-20" y="0" width="60" height="100" 
                  fill="transparent" 
                  className="cursor-pointer"
                  onClick={() => onDateSelect(day)}
                />
                
                <PennantFlag 
                  color={isFirst ? "#d97706" : dayAssignments.length > 0 ? "#8b5cf6" : isWknd ? "#cbd5e1" : "#94a3b8"} 
                  active={!!isSelected}
                  count={dayAssignments.length}
                />

                {dayTrials.length > 0 && (
                  <g transform="translate(0, 55)" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onTrialSelect(dayTrials[0]); }}>
                    <motion.g
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <path d="M -8,0 Q 0,-15 8,0 Q 0,10 -8,0" fill="#f59e0b" />
                      <path d="M -4,0 Q 0,-8 4,0 Q 0,5 -4,0" fill="#ef4444" />
                      <Flame size={16} x={-8} y={-12} className="text-amber-500" />
                    </motion.g>
                  </g>
                )}

                <g transform="translate(0, 80)">
                  <text 
                    textAnchor="middle" 
                    className={cn(
                      "fill-[#2c241a] font-['Homemade_Apple'] text-[12px] transition-all",
                      isSelected ? "text-[14px] opacity-100" : "opacity-60"
                    )}
                  >
                    {format(day, 'EEE MMM d')}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Overdue Section */}
        {assignments.filter(a => isBefore(parseISO(a.dueDate), today) && a.status !== 'completed').length > 0 && (
          <WantedPoster 
            count={assignments.filter(a => isBefore(parseISO(a.dueDate), today) && a.status !== 'completed').length}
            onClick={onOverdueSelect}
            active={isOverdueSelected}
          />
        )}
      </motion.div>
    </div>
  );
}

function AddTrialForm({ onAdd, onClose }: { onAdd: (a: any) => Promise<void>, onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [topic1, setTopic1] = useState('');
  const [topic2, setTopic2] = useState('');
  const [topic3, setTopic3] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({ 
        subject, 
        topics: [topic1, topic2, topic3].filter(t => t.trim() !== ''),
        dueDate: new Date(dueDate + 'T12:00:00').toISOString()
      });
    } catch (err: any) {
      setError(err.message || "Failed to add trial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Flame size={24} />
          </div>
          <h3 className="text-2xl font-black text-slate-900">New Trial</h3>
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
          <input required placeholder="e.g. Math, English" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Trial</label>
          <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topics (3 Required)</label>
          <input required placeholder="Topic 1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic1} onChange={e => setTopic1(e.target.value)} />
          <input required placeholder="Topic 2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic2} onChange={e => setTopic2(e.target.value)} />
          <input required placeholder="Topic 3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={topic3} onChange={e => setTopic3(e.target.value)} />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
        {isSubmitting ? 'Preparing Trial...' : 'Create Trial'}
      </button>
    </form>
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
