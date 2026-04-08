import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BookOpen, Search, Sparkles, Loader2, ExternalLink, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface StudyAssistProps {
  topic: string;
  subject: string;
  blockedTopics: string[];
  interests?: string[];
  grade?: string;
  studentId?: string;
  history?: any[];
}

interface StudyData {
  explanation: string;
  analogy: string;
  keyTopics: string[];
  interestingFacts: string[];
}

export default function StudyAssist({ topic, subject, blockedTopics, interests = [], grade, studentId, history = [] }: StudyAssistProps) {
  const [loading, setLoading] = useState(false);
  const [generatingScroll, setGeneratingScroll] = useState(false);
  const [data, setData] = useState<StudyData | null>(null);
  const [scrollCreated, setScrollCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  // Reset data when topic changes
  useEffect(() => {
    setData(null);
    setError(null);
    setActiveTab('current');
    if (topic) {
      fetchStudyHelp();
    }
  }, [topic]);

  const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const generateInfographic = async () => {
    if (!data || !studentId) return;
    setGeneratingScroll(true);
    setError(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are the AI engine for StudyQuest360 (Project: studyquest360-979db).
      Create an educational scroll about "${topic}". 
      Context: ${data.explanation}. 
      Key Points: ${data.keyTopics.join(', ')}.
      CRITICAL INSTRUCTION: Do not write out specific math equations, numbers, or complex text, as they may render incorrectly. Instead, use visual metaphors (like blocks, apples, scales, or diagrams) to represent the concepts accurately. Ensure the visual metaphors correctly represent the underlying logic (e.g., addition should show combining things, subtraction should show taking away).
      Make it visually appealing, colorful, and suitable for a ${grade || 'student'}. 
      ${interests && interests.length > 0 ? `Incorporate themes of ${interests.join(', ')} into the visual design.` : ''}
      Do not include too much text, focus on visual representation.`;

      console.log("StudyAssist: Generating scroll for topic:", topic);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });
      
      let rawImageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            rawImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!rawImageUrl) {
        console.error("StudyAssist: No image generated in AI response.", response);
        throw new Error("The AI failed to generate an image. Please try again.");
      }

      // Compress image before saving
      const imageUrl = await compressImage(rawImageUrl);
      
      const uid = studentId || auth.currentUser?.uid;
      await addDoc(collection(db, 'scrolls'), {
        topic,
        imageUrl,
        studentId: uid,
        createdAt: serverTimestamp()
      });

      // Cleanup: Keep only last 3
      if (uid) {
        try {
          const scrollsRef = collection(db, 'scrolls');
          const q = query(
            scrollsRef, 
            where('studentId', '==', uid),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          if (snapshot.docs.length > 3) {
            const toDelete = snapshot.docs.slice(3);
            for (const docSnap of toDelete) {
              await deleteDoc(docSnap.ref);
            }
          }
        } catch (cleanupErr) {
          console.warn("StudyAssist: Scroll cleanup failed:", cleanupErr);
        }
      }

      setScrollCreated(true);
      setTimeout(() => setScrollCreated(false), 3000);
    } catch (err: any) {
      console.error("StudyAssist: Scroll error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate scroll.");
    } finally {
      setGeneratingScroll(false);
    }
  };

  const fetchStudyHelp = async () => {
    if (!topic || !topic.trim()) {
      console.warn("StudyAssist: Topic is empty, skipping fetch.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setScrollCreated(false);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const gradeContext = grade ? `for a ${grade} student` : 'for a 9th grade student';
      const interestContext = interests && interests.length > 0 
        ? `The student is interested in ${interests.join(', ')}. Use these interests to frame the explanation and create a fun analogy.`
        : '';

      const prompt = `You are the AI engine for StudyQuest360 (Project: studyquest360-979db).
      You are an expert educational tutor. Your goal is to teach a student (${gradeContext}) about "${topic}" (Subject: ${subject}).

      ${interestContext}

      Please provide:
      1. explanation: A clear, engaging explanation of the topic, written at the appropriate grade level. If interests are provided, use them to make the explanation more relatable.
      2. analogy: A creative analogy that explains the concept. If interests are provided, the analogy MUST be based on one of those interests.
      3. keyTopics: An array of 5 key factual points or vocabulary words related to the subject. These should be strictly educational and NOT framed by the student's interests.
      4. interestingFacts: An array of 2-3 surprising or cool facts about the subject.

      Return ONLY a JSON object. Do not include any markdown formatting like \`\`\`json.`;

      console.log("StudyAssist: Fetching help for topic:", topic);
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              analogy: { type: Type.STRING },
              keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              interestingFacts: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["explanation", "analogy", "keyTopics", "interestingFacts"]
          }
        }
      });
      
      const rawText = response.text || '';
      console.log("StudyAssist: Raw AI response:", rawText);

      if (!rawText) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      // Robust JSON Parsing
      let result: any;
      try {
        // Try direct parse first
        result = JSON.parse(rawText);
      } catch (e) {
        console.warn("StudyAssist: Direct JSON parse failed, attempting cleanup.", e);
        // Attempt to extract JSON from markdown or extra text
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (innerE) {
            console.error("StudyAssist: Failed to parse extracted JSON.", innerE);
            throw new Error("The AI returned an invalid data format. Please try again.");
          }
        } else {
          console.error("StudyAssist: No JSON found in response.");
          throw new Error("The AI did not return a valid response. Please try again.");
        }
      }

      if (!result.explanation || !result.analogy) {
        console.error("StudyAssist: Missing required fields in AI response.", result);
        throw new Error("The AI response was incomplete. Please try again.");
      }

      setData(result);

      // Save to history and cleanup
      if (studentId) {
        try {
          await addDoc(collection(db, 'study_history'), {
            ...result,
            studentId,
            topic,
            createdAt: serverTimestamp()
          });

          // Cleanup: Keep only last 3
          const historyRef = collection(db, 'study_history');
          const q = query(
            historyRef, 
            where('studentId', '==', studentId),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          if (snapshot.docs.length > 3) {
            const toDelete = snapshot.docs.slice(3);
            for (const docSnap of toDelete) {
              await deleteDoc(docSnap.ref);
            }
          }
        } catch (historyErr) {
          console.warn("StudyAssist: History save/cleanup failed:", historyErr);
        }
      }
    } catch (err: any) {
      console.error("StudyAssist Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border-4 border-[#e6d5b8] shadow-2xl p-8 h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-5 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8b5cf6] rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-[#7c3aed]">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#4a3f35] uppercase tracking-tight">Study Assist</h3>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={() => setActiveTab('current')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all",
                  activeTab === 'current' ? "bg-[#8b5cf6] text-white" : "text-[#8c7b68] hover:text-[#4a3f35]"
                )}
              >
                Current
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all",
                  activeTab === 'history' ? "bg-[#8b5cf6] text-white" : "text-[#8c7b68] hover:text-[#4a3f35]"
                )}
              >
                History ({history.length})
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'current' && topic && (
            <button 
              onClick={fetchStudyHelp}
              disabled={loading}
              className="px-6 py-2.5 bg-[#8b5cf6] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#7c3aed] transition-all shadow-lg border-2 border-[#7c3aed] flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : data ? 'Refresh' : 'Start Study'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'history' ? (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10"
          >
            {history.length > 0 ? history.map((item, idx) => (
              <div key={item.id || idx} className="p-6 bg-[#fdf6e3]/50 border-2 border-[#e6d5b8] rounded-2xl space-y-3 hover:border-[#8b5cf6] transition-all group cursor-pointer" onClick={() => { setData(item); setActiveTab('current'); }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-[#4a3f35]">{item.topic}</h4>
                  <ChevronRight size={16} className="text-[#8c7b68] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm text-[#8c7b68] font-medium line-clamp-2">{item.explanation}</p>
              </div>
            )) : (
              <div className="py-12 text-center text-[#8c7b68] italic font-medium">No study history yet.</div>
            )}
          </motion.div>
        ) : !topic && !data ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center flex-1 flex flex-col justify-center relative z-10"
          >
            <div className="w-16 h-16 bg-[#fdf6e3] border-2 border-[#e6d5b8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#8c7b68]">
              <BookOpen size={32} />
            </div>
            <p className="text-[#4a3f35] font-black uppercase tracking-tight">Select an assignment to start!</p>
          </motion.div>
        ) : loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center flex-1 flex flex-col justify-center relative z-10"
          >
            <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
            <p className="text-[#4a3f35] font-black uppercase tracking-widest">Consulting the digital library...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-sm font-black text-center relative z-10"
          >
            {error}
          </motion.div>
        ) : data ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar"
          >
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border-2 border-[#e6d5b8] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-[#8c7b68] uppercase tracking-widest">The Lesson</h4>
                  <button 
                    onClick={generateInfographic}
                    disabled={generatingScroll || scrollCreated}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7c3aed] transition-all disabled:opacity-50 shadow-md"
                  >
                    {generatingScroll ? <Loader2 size={12} className="animate-spin" /> : scrollCreated ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
                    {scrollCreated ? 'Scroll Created!' : 'Create Scroll'}
                  </button>
                </div>
                <p className="text-[#4a3f35] font-medium leading-relaxed text-lg">{data.explanation}</p>
              </div>

              <div className="p-8 bg-[#fdf6e3] rounded-[2rem] border-4 border-[#e6d5b8] space-y-4 shadow-inner relative">
                <div className="absolute top-4 right-4 opacity-10">
                  <Sparkles size={40} className="text-[#8b5cf6]" />
                </div>
                <h4 className="text-sm font-black text-[#8b5cf6] uppercase tracking-widest">Fun Analogy</h4>
                <p className="text-[#4a3f35] font-black text-xl leading-tight italic">"{data.analogy}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border-2 border-[#e6d5b8]">
                  <h4 className="text-xs font-black text-[#8c7b68] uppercase tracking-widest mb-4">Key Concepts</h4>
                  <ul className="space-y-3">
                    {data.keyTopics?.map((topic, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#4a3f35]">
                        <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-[#e6d5b8]">
                  <h4 className="text-xs font-black text-[#8c7b68] uppercase tracking-widest mb-4">Did You Know?</h4>
                  <ul className="space-y-3">
                    {data.interestingFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#4a3f35]">
                        <Sparkles size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
