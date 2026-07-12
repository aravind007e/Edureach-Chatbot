import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedKnowledge: string | null = null;

const loadKnowledgeBase = async (): Promise<string> => {
  if (cachedKnowledge) return cachedKnowledge;
  const filePath = path.join(__dirname, "../../knowledge-base/edureach-knowledge.txt");
  cachedKnowledge = await fs.readFile(filePath, "utf-8");
  return cachedKnowledge;
};

export const initializeKnowledgeBase = async (): Promise<void> => {
  try {
    const text = await loadKnowledgeBase();
    console.log(`[RAG Service] Knowledge base initialized (${text.length} characters)`);
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("[RAG Service] WARNING: GOOGLE_API_KEY is not set in .env!");
    }
  } catch (error: any) {
    console.error("[RAG Service] Initialization failed:", error?.message || error);
  }
};

export const getRAGResponse = async (question: string): Promise<string> => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return "Google API key is missing. Please add GOOGLE_API_KEY to your server/.env file.";
    }

    const knowledge = await loadKnowledgeBase();
    const prompt = `You are EduReach Bot, a friendly AI counselor for EduReach College, Hyderabad.
Answer the user's question accurately using ONLY the knowledge base provided below.
Be concise, professional, and friendly. Use bullet points for lists when appropriate.
If the answer is not contained within the knowledge base, respond exactly with: "I don't have that specific information. Please contact our admissions office at admissions@edureach.edu.in or call +91 9876543210."

=== KNOWLEDGE BASE ===
${knowledge}
=== END KNOWLEDGE BASE ===

User Question: ${question}

Answer:`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return replyText.trim();
  } catch (error: any) {
    console.error("[RAG Service] Error generating response:", error?.message || error);
    return "I'm having trouble connecting to the AI right now. Please contact admissions@edureach.edu.in or call +91 9876543210.";
  }
};
