import React, { useState, useEffect, useMemo } from 'react';
import { BrainCircuit, X, CheckCircle2, AlertCircle, Trophy, Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { AnswerBank, Assignment, UserProfile } from '../types';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface TrainingModuleProps {
  assignment: Assignment;
  user: UserProfile;
  onClose: () => void;
}

interface MatchingPair {
  term: string;
  definition: string;
}

interface MultipleChoice {
  question: string;
  correctAnswer: string;
  options: string[];
}

export default function TrainingModule({ assignment, user, onClose }: TrainingModuleProps) {
  const [loading, setLoading] = useState(true);
  const [answerBank, setAnswerBank] = useState<AnswerBank | null>(null);
  const [step, setStep] = useState<'intro' | 'matching' | 'multiple-choice' | 'results'>('intro');
  
  // Matching State
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<{id: string, text: string}[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // term -> definitionId
  const [matchingCorrectCount, setMatchingCorrectCount] = useState(0);

  // Multiple Choice State
  const [mcQuestions, setMcQuestions] = useState<MultipleChoice[]>([]);
  const [mcAnswers, setMcAnswers] = useState<Record<number, string>>({});
  const [mcCorrectCount, setMcCorrectCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAnswerBank();
  }, [assignment.id]);

  const fetchAnswerBank = async () => {
    setLoading(true);
    try {
      // If it's a trial training, we might have multiple topics separated by commas
      const topics = assignment.topic.split(',');
      
      if (assignment.id === 'trial-training' || topics.length > 1) {
        // Fetch all answer banks for these topics
        const allBanks: AnswerBank[] = [];
        for (const topic of topics) {
          const q = query(
            collection(db, 'answer_banks'),
            where('studentId', '==', user.uid),
            where('topic', '==', topic.trim())
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            allBanks.push({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AnswerBank);
          }
        }

        if (allBanks.length > 0) {
          // Merge banks
          const mergedBank: AnswerBank = {
            id: 'merged-trial-bank',
            studentId: user.uid,
            assignmentId: 'trial-training',
            topic: assignment.topic,
            subject: assignment.subject,
            concepts: allBanks.flatMap(b => b.concepts),
            relationships: [],
            questions: allBanks.flatMap(b => b.questions),
            createdAt: new Date().toISOString()
          };
          setAnswerBank(mergedBank);
          prepareQuiz(mergedBank);
        } else {
          setAnswerBank(null);
        }
      } else {
        const q = query(
          collection(db, 'answer_banks'),
          where('assignmentId', '==', assignment.id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const bank = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AnswerBank;
          setAnswerBank(bank);
          prepareQuiz(bank);
        } else {
          setAnswerBank(null);
        }
      }
    } catch (error) {
      console.error("Error fetching answer bank:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareQuiz = (bank: AnswerBank) => {
    // 1. Prepare Matching (8 pairs)
    const shuffledConcepts = [...bank.concepts].sort(() => Math.random() - 0.5);
    const selectedConcepts = shuffledConcepts.slice(0, 8);
    const pairs = selectedConcepts.map(c => ({ term: c.term, definition: c.definition }));
    setMatchingPairs(pairs);
    
    const defs = pairs.map((p, i) => ({ id: `def-${i}`, text: p.definition }))
                     .sort(() => Math.random() - 0.5);
    setShuffledDefinitions(defs);

    // 2. Prepare Multiple Choice (2 questions)
    const shuffledQuestions = [...bank.questions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, 2).map(q => {
      const options = [q.correctAnswer, ...q.distractors].sort(() => Math.random() - 0.5);
      return {
        question: q.question,
        correctAnswer: q.correctAnswer,
        options
      };
    });
    setMcQuestions(selectedQuestions);
  };

  const handleMatch = (definitionId: string) => {
    if (!selectedTerm) return;
    setMatches(prev => ({ ...prev, [selectedTerm]: definitionId }));
    setSelectedTerm(null);
  };

  const calculateResults = () => {
    // Calculate matching score
    let matchCorrect = 0;
    matchingPairs.forEach(pair => {
      const matchedDefId = matches[pair.term];
      const matchedDef = shuffledDefinitions.find(d => d.id === matchedDefId);
      if (matchedDef && matchedDef.text === pair.definition) {
        matchCorrect++;
      }
    });
    setMatchingCorrectCount(matchCorrect);

    // Calculate MC score
    let mcCorrect = 0;
    mcQuestions.forEach((q, i) => {
      if (mcAnswers[i] === q.correctAnswer) {
        mcCorrect++;
      }
    });
    setMcCorrectCount(mcCorrect);

    return matchCorrect + mcCorrect;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const totalScore = calculateResults();
    
    try {
      // Reward: 1 Quest Key (tries)
      await updateDoc(doc(db, 'users', user.uid), {
        tries: (user.tries || 0) + 1
      });

      if (totalScore === 10) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error("Error updating user reward:", error);
    } finally {
      setStep('results');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin" />
        <p className="text-[#4a3f35] font-black uppercase tracking-widest text-sm">Preparing Training Grounds...</p>
      </div>
    );
  }

  if (!answerBank) {
    return (
      <div className="p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto border-2 border-amber-100">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-[#4a3f35]">Answer Bank Missing!</h3>
          <p className="text-[#8c7b68] font-bold font-sans">We couldn't find the study materials for this quest. Try refreshing or creating a new quest.</p>
        </div>
        <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Back to Board</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl p-8 h-full flex flex-col relative overflow-hidden font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-5 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-emerald-600">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#4a3f35] uppercase tracking-tight">Quest Training</h3>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{assignment.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-[#8c7b68] hover:text-rose-500 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 text-center py-12"
            >
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-100 shadow-inner">
                <Trophy size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-[#4a3f35]">Ready to Train?</h2>
                <p className="text-lg text-[#8c7b68] font-medium max-w-md mx-auto">
                  Complete this 10-question challenge to master the concepts of this quest and earn a <span className="text-emerald-600 font-black">Quest Key</span>!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-4 bg-white border-2 border-[#e6d5b8] rounded-2xl">
                  <p className="text-2xl font-black text-[#4a3f35]">8</p>
                  <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">Matching</p>
                </div>
                <div className="p-4 bg-white border-2 border-[#e6d5b8] rounded-2xl">
                  <p className="text-2xl font-black text-[#4a3f35]">2</p>
                  <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">Multiple Choice</p>
                </div>
              </div>
              <button 
                onClick={() => setStep('matching')}
                className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 mx-auto"
              >
                Begin Training
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'matching' && (
            <motion.div 
              key="matching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100 flex items-center justify-between">
                <p className="text-sm font-black text-emerald-800 uppercase tracking-widest">Part 1: Concept Matching</p>
                <p className="text-xs font-bold text-emerald-600">{Object.keys(matches).length} / 8 Matched</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Terms */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#8c7b68] uppercase tracking-widest px-2">Terms</h4>
                  {matchingPairs.map((pair) => (
                    <button
                      key={pair.term}
                      onClick={() => setSelectedTerm(pair.term)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl font-bold transition-all border-2 text-sm",
                        selectedTerm === pair.term 
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-lg scale-105" 
                          : matches[pair.term]
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-50"
                            : "bg-white text-[#4a3f35] border-[#e6d5b8] hover:border-emerald-400"
                      )}
                    >
                      {pair.term}
                    </button>
                  ))}
                </div>

                {/* Definitions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#8c7b68] uppercase tracking-widest px-2">Definitions</h4>
                  {shuffledDefinitions.map((def) => {
                    const matchedTerm = Object.keys(matches).find(term => matches[term] === def.id);
                    return (
                      <button
                        key={def.id}
                        onClick={() => handleMatch(def.id)}
                        disabled={!selectedTerm || !!matchedTerm}
                        className={cn(
                          "w-full text-left p-4 rounded-xl font-medium transition-all border-2 text-xs leading-relaxed",
                          matchedTerm 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-50"
                            : selectedTerm
                              ? "bg-white text-[#4a3f35] border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                              : "bg-white text-[#4a3f35] border-[#e6d5b8] opacity-50 cursor-not-allowed"
                        )}
                      >
                        {def.text}
                        {matchedTerm && (
                          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Matched with: {matchedTerm}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-[#e6d5b8]">
                <button 
                  onClick={() => setMatches({})}
                  className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Reset Matches
                </button>
                <button 
                  disabled={Object.keys(matches).length < 8}
                  onClick={() => setStep('multiple-choice')}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  Next Step
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'multiple-choice' && (
            <motion.div 
              key="mc"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100 flex items-center justify-between">
                <p className="text-sm font-black text-emerald-800 uppercase tracking-widest">Part 2: Multiple Choice</p>
                <p className="text-xs font-bold text-emerald-600">{Object.keys(mcAnswers).length} / 2 Answered</p>
              </div>

              {mcQuestions.map((q, idx) => (
                <div key={idx} className="space-y-6">
                  <h4 className="text-xl font-black text-[#4a3f35] leading-tight">
                    <span className="text-emerald-500 mr-2">Q{idx + 9}.</span>
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setMcAnswers(prev => ({ ...prev, [idx]: option }))}
                        className={cn(
                          "w-full text-left p-4 rounded-xl font-bold transition-all border-2 text-sm",
                          mcAnswers[idx] === option 
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md" 
                            : "bg-white text-[#4a3f35] border-[#e6d5b8] hover:border-emerald-400 hover:bg-emerald-50"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-8 border-t border-[#e6d5b8]">
                <button 
                  onClick={() => setStep('matching')}
                  className="text-xs font-black text-[#8c7b68] uppercase tracking-widest hover:underline"
                >
                  Back to Matching
                </button>
                <button 
                  disabled={Object.keys(mcAnswers).length < 2 || isSubmitting}
                  onClick={handleSubmit}
                  className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  Complete Training
                </button>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center py-8"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-100">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-4xl font-black text-[#4a3f35]">Training Complete!</h2>
                <p className="text-lg text-[#8c7b68] font-medium">
                  {matchingCorrectCount + mcCorrectCount === 10 
                    ? "Perfect Score! You are a true master of this quest." 
                    : matchingCorrectCount + mcCorrectCount >= 7
                      ? "Great job! You've shown strong knowledge."
                      : "Keep it up! Every session makes you stronger."}
                </p>
              </div>

              <div className="bg-[#fdf6e3] p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] max-w-md mx-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-[#4a3f35]">{matchingCorrectCount}/8</p>
                    <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">Matching</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-[#4a3f35]">{mcCorrectCount}/2</p>
                    <p className="text-[10px] font-black text-[#8c7b68] uppercase tracking-widest">Multiple Choice</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-[#e6d5b8]">
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Sparkles size={20} />
                    <span className="text-xl font-black uppercase tracking-widest">+1 Quest Key Earned!</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-left max-w-2xl mx-auto">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest px-4 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    What you got right!
                  </h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar p-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl">
                    {matchingPairs.filter(pair => {
                      const matchedDefId = matches[pair.term];
                      const matchedDef = shuffledDefinitions.find(d => d.id === matchedDefId);
                      return matchedDef && matchedDef.text === pair.definition;
                    }).map((pair, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-emerald-100 text-sm">
                        <p className="font-black text-emerald-600 mb-1">{pair.term}</p>
                        <p className="text-slate-600 font-medium">{pair.definition}</p>
                      </div>
                    ))}
                    {mcQuestions.filter((q, i) => mcAnswers[i] === q.correctAnswer).map((q, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-emerald-100 text-sm">
                        <p className="font-black text-slate-800 mb-1">{q.question}</p>
                        <p className="text-emerald-600 font-black">Answer: {q.correctAnswer}</p>
                      </div>
                    ))}
                    {matchingCorrectCount + mcCorrectCount === 0 && (
                      <p className="text-center py-4 text-slate-400 font-bold italic">No correct answers yet, but keep practicing!</p>
                    )}
                  </div>
                </div>

                {(matchingCorrectCount + mcCorrectCount < 10) && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest px-4 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Let's Review These
                    </h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar p-4 bg-rose-50/50 border-2 border-rose-100 rounded-3xl">
                      {matchingPairs.filter(pair => {
                        const matchedDefId = matches[pair.term];
                        const matchedDef = shuffledDefinitions.find(d => d.id === matchedDefId);
                        return !matchedDef || matchedDef.text !== pair.definition;
                      }).map((pair, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-rose-100 text-sm">
                          <p className="font-black text-rose-500 mb-1">{pair.term}</p>
                          <p className="text-slate-400 text-xs line-through mb-1">
                            Your match: {shuffledDefinitions.find(d => d.id === matches[pair.term])?.text || 'None'}
                          </p>
                          <p className="text-emerald-600 font-black">Correct: {pair.definition}</p>
                        </div>
                      ))}
                      {mcQuestions.filter((q, i) => mcAnswers[i] !== q.correctAnswer).map((q, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-rose-100 text-sm">
                          <p className="font-black text-slate-800 mb-1">{q.question}</p>
                          <p className="text-rose-500 text-xs line-through mb-1">Your answer: {mcAnswers[mcQuestions.indexOf(q)] || 'None'}</p>
                          <p className="text-emerald-600 font-black">Correct Answer: {q.correctAnswer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={onClose}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
              >
                Return to Quest Board
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
