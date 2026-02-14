import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ReflectionEntry, AIResponse, ChatMessage } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Missing API_KEY. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Helper to clean Markdown code blocks from JSON strings.
 */
const cleanJsonString = (text: string): string => {
  let cleaned = text;
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
  cleaned = cleaned.trim();
  return cleaned;
};

/**
 * Generates the persona instructions based on language.
 */
const getPersonaInstructions = (language: 'arabic' | 'english'): string => {
  if (language === 'arabic') {
    return `
      You are a **Charismatic Senior Medical Mentor in Egypt (Senior Resident level)**.
      **YOUR GOAL:** Give a "Tactical Battle Plan" to a student who failed or is reflecting.

      **YOUR PERSONA:**
      - **Tone:** Informal, Supportive, "Tough Love". Speak like a cool senior resident.
      - **Language:** **Egyptian Arabic** mixed with **English Medical Terms** (The standard hospital language in Egypt).
      - **Visuals:** You **MUST** use Emojis (🩺, 🧠, 🚫, ✅, 💊, 📉, 🎥, 📝) to make the text "scannable" and easy to read.

      **VISUAL & LANGUAGE RULES (CRITICAL FOR READABILITY):**
      1. **RTL Enforcement:** You MUST start every single sentence with an Arabic word or an Emoji followed by Arabic. NEVER start a line with an English word.
         - ❌ Bad: "Anatomy is important because..."
         - ✅ Good: "🧠 الـ Anatomy مهم جداً عشان..."
      2. **English Terms:** Keep medical terms in English, but wrap them in Arabic sentence structures.
      3. **Emojis:** Use emojis at the START of bullet points to act as visual anchors.
    `;
  } else {
    return `
      You are a **Senior Clinical Medical Educator**.
      **YOUR STYLE:**
      - **Tone:** Professional, objective, supportive but firm.
      - **Language:** **English**.
      - **Visuals:** Use emojis sparingly but effectively to structure points.
      - **Specifics:** Provide actionable, evidence-based advice.
    `;
  }
};

export const analyzeReflection = async (
  entry: ReflectionEntry, 
  language: 'arabic' | 'english' = 'arabic',
  previousEntries: ReflectionEntry[] = []
): Promise<AIResponse> => {
  try {
    console.log(`Connecting to Mentor (Gemini 3 Flash) in ${language} mode with ${previousEntries.length} history items...`);

    // 1. Summarize History
    let historyContext = "";
    if (previousEntries.length > 0) {
      const relevantHistory = previousEntries.slice(0, 5); // Take last 5
      historyContext = `
        **STUDENT HISTORY (Previous Reflections):**
        The student has previously logged ${previousEntries.length} cases.
        Here are the last few issues they faced:
        ${relevantHistory.map(e => `- Date: ${e.date}, Tag: ${e.tags.join(', ')}, Issue: ${e.cause}`).join('\n')}
        
        **INSTRUCTION:** Refer to this history if relevant. For example, if they made the same mistake twice, point it out sternly. If they improved, acknowledge it.
      `;
    }

    // 2. Build System Prompt
    const basePersona = getPersonaInstructions(language);
    
    // Custom JSON instruction based on user request for Arabic mode, simplified for English
    let jsonInstruction = "";
    
    if (language === 'arabic') {
      jsonInstruction = `
        **OUTPUT FORMAT (JSON ONLY):**
        Return a single JSON object.

        {
          "situationSummary": "Start with Emoji + Arabic word. (e.g., '🛑 يا دكتور، انت حكمت على نفسك بالفشل قبل ما تبدأ.')",
          "clinicalAnalysis": "Start with Emoji + Arabic word. (e.g., '🧠 المشكلة الحقيقية هي الـ Active Recall، مش الـ Understanding.')",
          "rootCause": "Start with Emoji + Arabic word. (e.g., '📉 السبب الجذري هو الـ Burnout الناتج عن قلة النوم.')",
          "actionPlan": [
            "✅ خطوة 1: (Resource name) -> ذاكر من المصدر ده...",
            "✅ خطوة 2: (Study Technique) -> طبق الطريقة دي...",
            "✅ خطوة 3: (Behavior Fix) -> بلاش تعمل كذا..."
          ]
        }
      `;
    } else {
      jsonInstruction = `
        **JSON OUTPUT STRUCTURE:**
        {
          "situationSummary": "Start with an emoji. Summary.",
          "clinicalAnalysis": "Start with an emoji. Medical analysis.",
          "rootCause": "Start with an emoji. The root reason.",
          "actionPlan": ["Emoji + Step 1", "Emoji + Step 2", "Emoji + Step 3"]
        }
      `;
    }

    const systemInstruction = `
        ${basePersona}

        **TASK:** Analyze the student's failure and create a structured plan.

        ${historyContext}

        **CRITICAL RULES:**
        1. **No Generic Advice:** Be specific (resources, numbers, chapters).
        2. **Analysis:** Find the *technical* root cause.
        
        ${jsonInstruction}
    `;

    const prompt = `
      Analyze this student log:
      Event: ${entry.situation}
      Emotions: ${entry.emotion}
      Analysis: ${entry.cause}
      Lessons: ${entry.learning}
      Plan: ${entry.plan}
      Tags: ${entry.tags.join(', ')}
      
      Return valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situationSummary: { type: Type.STRING },
            clinicalAnalysis: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            actionPlan: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["situationSummary", "clinicalAnalysis", "rootCause", "actionPlan"]
        },
        temperature: 0.5, // Slightly higher for "Charismatic" tone
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Mentor returned empty response.");

    return JSON.parse(cleanJsonString(rawText)) as AIResponse;

  } catch (error) {
    console.error("Mentor Analysis Failed:", error);
    throw new Error("The Mentor is currently unavailable.");
  }
};

export const chatWithMentor = async (
  currentMessage: string,
  chatHistory: ChatMessage[],
  entryContext: ReflectionEntry,
  aiFeedback: AIResponse,
  language: 'arabic' | 'english'
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const persona = getPersonaInstructions(language);

    const contextPrompt = `
      **CONTEXT:**
      The student is discussing a specific clinical reflection.
      
      **THE CASE:**
      Situation: ${entryContext.situation}
      Student's Analysis: ${entryContext.cause}
      
      **YOUR PREVIOUS REPORT:**
      Analysis: ${aiFeedback.clinicalAnalysis}
      Root Cause: ${aiFeedback.rootCause}
      Plan: ${aiFeedback.actionPlan.join(', ')}

      **INSTRUCTION:**
      Answer the student's question. 
      - Maintain the "Charismatic Senior Resident" persona.
      - **Use Emojis** to make it engaging.
      - If Arabic, keep using mixed English medical terms.
      - **CRITICAL RTL:** Start every sentence with an Arabic word or Emoji + Arabic.
      - Be brief, direct, and helpful.
    `;

    // Map internal history to Gemini format
    const historyForGemini = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Initialize chat
    const chatSession = ai.chats.create({
      model: model,
      history: historyForGemini,
      config: {
        systemInstruction: `${persona}\n${contextPrompt}`,
      }
    });

    const result = await chatSession.sendMessage({
      message: currentMessage
    });

    return result.text;

  } catch (error) {
    console.error("Chat Failed:", error);
    throw new Error("Message failed to send.");
  }
};