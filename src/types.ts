export type Priority = 'low' | 'medium' | 'high';
export type Role = 'student' | 'parent' | 'admin';
export type AssignmentStatus = 'not-started' | 'in-progress' | 'completed';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  parentId?: string; // DEPRECATED
  xp: number;
  level: number;
  streak: number;
  longestStreak?: number;
  tries: number;
  grade?: string;
  lastCompletedDate: string | null;
  lastScrollCreatedAt?: string | null;
  interests?: string[];
  highScores?: Record<string, number>;
  assignmentsAddedCount?: number;
  onboarded?: boolean;
}

export interface Connection {
  id: string;
  studentId: string;
  parentId: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  parentId: string;
  title: string;
  subject: string;
  topic: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: Priority;
  xp: number;
  link?: string;
  notes?: string;
  createdAt?: string;
  completedAt?: string | null;
}

export interface Scroll {
  id: string;
  studentId: string;
  topic: string;
  imageUrl: string;
  createdAt: any;
}

export interface GameSession {
  id: string;
  studentId: string;
  gameId: string;
  score: number;
  createdAt: string;
}

export interface StudyHistory {
  id: string;
  studentId: string;
  topic: string;
  summary: string;
  keyConcepts: string[];
  interestingFacts: string[];
  resources: { title: string; url: string }[];
  createdAt: any;
}

export interface ParentSettings {
  parentId: string;
  schoolHoursStart: string;
  schoolHoursEnd: string;
  blockedTopics: string[];
  activeGameId?: string;
  blockedDaysType?: 'weekdays' | 'weekends' | 'all';
}

export interface AnswerBank {
  id: string;
  studentId: string;
  assignmentId: string;
  topic?: string;
  subject?: string;
  concepts: {
    term: string;
    definition: string;
    status: 'kept' | 'rejected';
  }[];
  relationships: {
    term: string;
    relatedTerms: string[];
  }[];
  questions: {
    question: string;
    correctAnswer: string;
    distractors: string[];
  }[];
  createdAt: string;
}

export const XP_PER_LEVEL = 1000;

export function calculateLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function calculateProgress(xp: number) {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
}

export function getLevelTitle(level: number) {
  if (level < 3) return 'Novice Adventurer';
  if (level < 6) return 'Apprentice Mage';
  if (level < 10) return 'Journeyman Scholar';
  if (level < 15) return 'Master Wizard';
  return 'Grandmaster of the Realm';
}
