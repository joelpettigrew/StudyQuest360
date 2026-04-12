import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { AnswerBank, Assignment } from '../types';
import { replaceConceptAndQuestions, generateAnswerBank } from '../services/answerBankService';
import { Loader2, X, RefreshCw, BookOpen, BrainCircuit, Plus, Trash2, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnswerBankViewProps {
  studentId: string;
  assignments: Assignment[];
  grade?: string;
}

export default function AnswerBankView({ studentId, assignments, grade }: AnswerBankViewProps) {
  const [answerBanks, setAnswerBanks] = useState<AnswerBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState<string | null>(null);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  useEffect(() => {
    if (!studentId) {
      console.warn("AnswerBankView: No studentId provided");
      return;
    }
    console.log(`Fetching Answer Banks for Student ID: ${studentId}`);
    const q = query(
      collection(db, 'answer_banks'),
      where('studentId', '==', studentId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Answer Bank Snapshot received: ${snapshot.size} docs for student ${studentId}`);
      const banks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AnswerBank));
      // Sort client-side to avoid index requirement
      const sortedBanks = banks.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAnswerBanks(sortedBanks);
      if (sortedBanks.length > 0 && !selectedBankId) {
        setSelectedBankId(sortedBanks[0].id);
      }
    }, (error) => {
      console.error("Answer Bank fetch error:", error);
    });

    return () => unsubscribe();
  }, [studentId]);

  const selectedBank = answerBanks.find(b => b.id === selectedBankId);
  const relatedAssignment = assignments.find(a => a.id === selectedBank?.assignmentId);

  const handleReject = async (bank: AnswerBank, term: string) => {
    if (!relatedAssignment) return;
    
    setLoadingAlternatives(term);
    try {
      const currentTerms = bank.concepts.map(c => c.term);
      const result = await replaceConceptAndQuestions(
        bank.id, 
        term, 
        relatedAssignment.topic || relatedAssignment.title, 
        relatedAssignment.subject, 
        grade,
        currentTerms
      );

      if (result && result.concept) {
        const updatedConcepts = bank.concepts.map(c => 
          c.term === term ? { ...result.concept, status: 'kept' as const } : c
        );
        
        // Also replace questions that were related to the old term, or just add the new ones
        // For simplicity and to satisfy "remove that Q&A", we'll filter out questions containing the old term
        // and add the new ones.
        const filteredQuestions = bank.questions.filter(q => 
          !q.question.toLowerCase().includes(term.toLowerCase()) && 
          !q.correctAnswer.toLowerCase().includes(term.toLowerCase())
        );

        await updateDoc(doc(db, 'answer_banks', bank.id), { 
          concepts: updatedConcepts,
          questions: [...filteredQuestions, ...result.questions]
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAlternatives(null);
    }
  };

  const handleRejectQuestion = async (bank: AnswerBank, questionIdx: number) => {
    const updatedQuestions = bank.questions.filter((_, i) => i !== questionIdx);
    await updateDoc(doc(db, 'answer_banks', bank.id), { questions: updatedQuestions });
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = (e.target as any).topic.value;
    const subject = (e.target as any).subject.value;
    
    if (!topic || !subject) return;

    setIsGeneratingSubject(true);
    try {
      await generateAnswerBank(null, studentId, topic, subject, grade);
      setShowSubjectForm(false);
      (e.target as any).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const exportBank = (bank: AnswerBank) => {
    const assignment = assignments.find(a => a.id === bank.assignmentId);
    const title = assignment?.title || bank.topic || bank.subject || 'StudyQuest_AnswerBank';
    
    let content = `STUDYQUEST360 ANSWER BANK: ${title.toUpperCase()}\n`;
    content += `Generated on: ${new Date(bank.createdAt).toLocaleDateString()}\n`;
    content += `====================================================\n\n`;
    
    content += `CONCEPTS:\n`;
    bank.concepts.forEach((c, i) => {
      content += `${i + 1}. ${c.term}: ${c.definition}\n`;
    });
    
    content += `\nQUESTIONS & ANSWERS:\n`;
    bank.questions.forEach((q, i) => {
      content += `Q${i + 1}: ${q.question}\n`;
      content += `A: ${q.correctAnswer}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_AnswerBank.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto font-serif">
      <header className="flex items-center justify-between mb-12 bg-[#fdf6e3] p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#8b5cf6] rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-[#7c3aed]">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-[#4a3f35] uppercase tracking-widest">Answer Bank</h2>
            <p className="text-[#8c7b68] font-sans font-medium text-lg">Review and customize the concepts for your games.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSubjectForm(!showSubjectForm)}
          className="flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#7c3aed] transition-all shadow-md border-2 border-[#7c3aed]"
        >
          <Plus size={20} />
          Add Quest Subject
        </button>
      </header>

      {showSubjectForm && (
        <div className="mb-12 bg-white p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-[#4a3f35] uppercase tracking-widest">New Quest Subject</h3>
            <button onClick={() => setShowSubjectForm(false)} className="text-[#8c7b68] hover:text-rose-500 transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#8c7b68] uppercase tracking-widest px-1">Subject</label>
                <input 
                  name="subject"
                  placeholder="e.g. Biology, History, Math" 
                  className="w-full px-4 py-3 bg-[#fdf6e3] border-2 border-[#e6d5b8] rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[#8c7b68] uppercase tracking-widest px-1">Topic</label>
                <input 
                  name="topic"
                  placeholder="e.g. Photosynthesis, Civil War" 
                  className="w-full px-4 py-3 bg-[#fdf6e3] border-2 border-[#e6d5b8] rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isGeneratingSubject}
              className="w-full py-4 bg-[#8b5cf6] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#7c3aed] transition-all shadow-md border-2 border-[#7c3aed] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingSubject ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
              {isGeneratingSubject ? 'Generating Concepts...' : 'Generate Answer Bank'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-black text-[#4a3f35] uppercase tracking-widest mb-4">Quests</h3>
          <div className="space-y-2">
            {answerBanks.map(bank => {
              const assignment = assignments.find(a => a.id === bank.assignmentId);
              return (
                <button
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl font-bold transition-all border-2 font-sans",
                    selectedBankId === bank.id
                      ? "bg-[#8b5cf6] text-white border-[#7c3aed] shadow-md"
                      : "bg-white text-[#4a3f35] border-[#e6d5b8] hover:border-[#d4c4a8]"
                  )}
                >
                  {assignment?.title || bank.topic || bank.subject || 'Unknown Quest'}
                </button>
              );
            })}
            {answerBanks.length === 0 && (
              <p className="text-[#8c7b68] italic font-sans text-sm">No answer banks generated yet. Add a quest to generate one!</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          {selectedBank ? (
            <div className="bg-white p-8 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-2 border-[#fdf6e3] pb-4">
                <h3 className="text-2xl font-black text-[#4a3f35] uppercase tracking-widest">
                  Concepts for: {relatedAssignment?.title || selectedBank.topic || selectedBank.subject}
                </h3>
                <button
                  onClick={() => exportBank(selectedBank)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold font-sans hover:bg-emerald-600 transition-all shadow-md"
                >
                  <Download size={18} />
                  Export Bank
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedBank.concepts.map((concept, idx) => (
                  <div key={idx} className="bg-[#fdf6e3] p-6 rounded-2xl border-2 border-[#e6d5b8]">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-[#8b5cf6] mb-2">{concept.term}</h4>
                        <p className="text-[#4a3f35] font-sans">{concept.definition}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReject(selectedBank, concept.term)}
                          disabled={loadingAlternatives === concept.term}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl font-bold font-sans transition-colors disabled:opacity-50"
                        >
                          {loadingAlternatives === concept.term ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          Reject & Replace
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-black text-[#4a3f35] mb-6 uppercase tracking-widest border-b-2 border-[#fdf6e3] pb-4">
                  Associated Questions
                </h3>
                <div className="space-y-4">
                  {selectedBank.questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans group relative">
                      <button 
                        onClick={() => handleRejectQuestion(selectedBank, idx)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove Question"
                      >
                        <Trash2 size={16} />
                      </button>
                      <p className="font-bold text-slate-800 mb-2 pr-8">{q.question}</p>
                      <p className="text-sm text-emerald-600 font-bold">Answer: {q.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] border-4 border-[#e6d5b8] shadow-lg text-center">
              <BookOpen size={48} className="mx-auto text-[#e6d5b8] mb-4" />
              <h3 className="text-2xl font-black text-[#8c7b68] uppercase tracking-widest">Select a Quest</h3>
              <p className="text-[#8c7b68] font-sans mt-2">Choose a quest from the list to view its answer bank.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
