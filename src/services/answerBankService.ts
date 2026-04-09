import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { AnswerBank } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateAnswerBank(assignmentId: string | null, studentId: string, topic: string, subject: string, grade: string = '9th Grade') {
  console.log(`[AnswerBankService] Starting generation for ${topic} (${subject}) - Student: ${studentId}`);
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[AnswerBankService] GEMINI_API_KEY is missing!");
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are the AI engine for StudyQuest360 (Project: studyquest360-979db). 
      Create an educational answer bank for a ${grade} student studying ${subject}: ${topic}.
      
      Generate:
      1. 8-15 key concepts with their definitions.
      2. Relationships between these terms (how one term relates to others).
      3. A question bank of 15-30 questions with 1 correct answer and 3 plausible distractors.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ["term", "definition"]
              }
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  relatedTerms: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["term", "relatedTerms"]
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  distractors: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["question", "correctAnswer", "distractors"]
              }
            }
          },
          required: ["concepts", "relationships", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("[AnswerBankService] Empty response from AI");
      return;
    }

    console.log("[AnswerBankService] AI Response received, parsing...");
    const data = JSON.parse(text);
    
    // Add status to concepts
    const conceptsWithStatus = (data.concepts || []).map((c: any) => ({
      ...c,
      status: 'kept'
    }));

    const answerBankData = {
      studentId,
      assignmentId: assignmentId || 'manual_subject',
      topic,
      subject,
      concepts: conceptsWithStatus,
      relationships: data.relationships || [],
      questions: data.questions || [],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'answer_banks'), answerBankData);
    console.log(`[AnswerBankService] Successfully saved answer bank with ID: ${docRef.id}`);

    // Cleanup old answer banks (keep only latest 15)
    const q = query(
      collection(db, 'answer_banks'),
      where('studentId', '==', studentId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 15) {
      const sortedDocs = snapshot.docs.sort((a, b) => {
        const dateA = new Date(a.data().createdAt).getTime();
        const dateB = new Date(b.data().createdAt).getTime();
        return dateB - dateA;
      });
      const docsToDelete = sortedDocs.slice(15);
      for (const docSnapshot of docsToDelete) {
        await deleteDoc(doc(db, 'answer_banks', docSnapshot.id));
      }
    }

  } catch (error) {
    console.error("Error generating answer bank:", error);
  }
}

export async function replaceConceptAndQuestions(bankId: string, oldTerm: string, topic: string, subject: string, grade: string = '9th Grade', currentConcepts: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: `For the subject "${subject}" and topic "${topic}", provide:
      1. One new key concept (term and definition) that is NOT in this list: ${currentConcepts.join(', ')}.
      2. 3 new questions with 1 correct answer and 3 distractors that specifically relate to this new concept.
      
      Suitable for ${grade}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concept: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  distractors: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["question", "correctAnswer", "distractors"]
              }
            }
          },
          required: ["concept", "questions"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("Error replacing concept:", error);
    return null;
  }
}
