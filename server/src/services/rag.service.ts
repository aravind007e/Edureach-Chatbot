// =======================================================
// EduReach — Vector Retrieval-Augmented Generation (RAG) Service
// Optimized with timing instrumentation, query caching,
// compact prompt construction, and Ollama generation tuning.
// =======================================================

import KnowledgeDoc from "../models/knowladge-doc.model.ts";
import { loadAndChunkKnowledgeBase } from "./document.service.ts";
import {
  generateEmbeddings,
  checkOllamaHealth,
  fetchOllama,
  getLLMModel,
  extractErrorMessage,
} from "./embedding.service.ts";
import {
  retrieveRelevantChunksWithMetrics,
  invalidateRetrievalCache,
  type RetrievedChunk,
} from "./retrieval.service.ts";
import { routeUserQuery } from "./router.service.ts";

export interface SourceCitation {
  source: string;
  chunkIndex: number;
  section: string;
  similarity?: number;
}

export interface RAGResponseResult {
  answer: string;
  sources: SourceCitation[];
  intent: "conversational" | "knowledge_retrieval" | "fallback";
  timingMs?: {
    embedding: number;
    retrieval: number;
    llm: number;
    total: number;
  };
}

const FALLBACK_MESSAGE =
  "I don't have enough information in the EduReach knowledge base to answer that accurately. Please contact the EduReach admissions office at admissions@edureach.edu.in or call +91 9876543210.";

const OLLAMA_OFFLINE_MESSAGE =
  "The AI counselor is currently unable to connect to the local Ollama service. Please ensure Ollama is running (`ollama serve`), or contact our admissions office at admissions@edureach.edu.in or call +91 9876543210.";

// Recent Full Response Cache (10-minute TTL for identical queries)
interface CachedResponseEntry {
  result: RAGResponseResult;
  timestamp: number;
}
const responseCache = new Map<string, CachedResponseEntry>();
const RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESPONSE_CACHE = 100;

export const clearResponseCache = (): void => {
  responseCache.clear();
};

/**
 * Builds a compact, strictly grounded prompt with context chunks and negative constraints.
 */
export const buildGroundedPrompt = (
  question: string,
  chunks: RetrievedChunk[],
  isVoice = false
): string => {
  const contextText = chunks
    .map((c, idx) => `[Context ${idx + 1} - ${c.section}]: ${c.text}`)
    .join("\n\n");

  if (isVoice) {
    return `You are Ava, the friendly AI admissions counselor for EduReach College, Hyderabad.
Answer the question using ONLY the facts in the CONTEXT below.
Speak naturally in 2 short conversational sentences suitable for speech.
Do NOT use bullet points, asterisks, or markdown.
If the answer is not in the context, say: "I don't have that information. Please contact our admissions team at admissions@edureach.edu.in."

CONTEXT:
${contextText}

Question: ${question}
Spoken Answer:`;
  }

  return `You are EduReach Bot, the official AI counselor for EduReach College, Hyderabad.
Answer the user's question accurately using ONLY the CONTEXT CHUNKS below.
Do NOT invent facts, numbers, or dates.
Be concise and helpful. Use bullet points for lists.
If the answer is not in the context, reply:
"${FALLBACK_MESSAGE}"

=== CONTEXT CHUNKS ===
${contextText}
=== END CONTEXT ===

Question: ${question}
Grounded Answer:`;
};

/**
 * Ingests the edureach-knowledge.txt document into MongoDB with vector embeddings.
 */
export const ingestKnowledgeBase = async (): Promise<number> => {
  console.log(" Starting knowledge base ingestion...");

  const chunks = await loadAndChunkKnowledgeBase();
  console.log(` Created ${chunks.length} structured chunks from knowledge base.`);

  const texts = chunks.map((c) => c.text);
  console.log(" Generating vector embeddings via Ollama...");
  const embeddings = await generateEmbeddings(texts);

  console.log(" Saving chunks and embeddings into MongoDB...");
  await KnowledgeDoc.deleteMany({});

  const docsToInsert = chunks.map((chunk, i) => ({
    text: chunk.text,
    embedding: embeddings[i] || [],
    metadata: {
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
      section: chunk.section,
      charCount: chunk.charCount,
    },
  }));

  await KnowledgeDoc.insertMany(docsToInsert);
  invalidateRetrievalCache();
  clearResponseCache();

  console.log(` Ingestion complete: ${docsToInsert.length} chunks stored in MongoDB.`);
  return docsToInsert.length;
};

/**
 * Validates the knowledge base on server startup.
 * Runs health check BEFORE attempting any ingestion to avoid premature failures.
 */
export const initializeKnowledgeBase = async (): Promise<void> => {
  try {
    const health = await checkOllamaHealth();

    if (!health.available) {
      console.warn(`⚠️ Ollama not reachable at ${health.resolvedUrl}. Ensure Ollama is started with: ollama serve`);
      console.warn(`   Technical details: ${health.error || "Connection refused"}`);
      console.warn(`   Skipping automatic vector ingestion until Ollama is running.`);
      return;
    }

    if (!health.embeddingModelFound) {
      console.warn(`⚠️ Embedding model "${health.embeddingModel}" is not installed.`);
      console.warn(`👉 Pull it with: ollama pull ${health.embeddingModel}`);
      console.warn(`   Skipping automatic vector ingestion until model is pulled.`);
      return;
    }

    if (!health.llmModelFound) {
      console.warn(`⚠️ LLM generation model "${health.llmModel}" is not installed.`);
      console.warn(`👉 Pull it with: ollama pull ${health.llmModel}`);
    } else {
      console.log(`✅ Ollama ready | LLM: ${health.llmModel} | Embeddings: ${health.embeddingModel}`);
    }

    // Check MongoDB collection
    const existingCount = await KnowledgeDoc.countDocuments();
    if (existingCount === 0) {
      console.log(" Knowledge base is empty in MongoDB. Ingesting initial documents...");
      try {
        await ingestKnowledgeBase();
      } catch (ingestError: unknown) {
        const msg = extractErrorMessage(ingestError);
        console.warn(`⚠️ Could not complete initial vector ingestion: ${msg}`);
        console.warn("   You can run `npm run ingest` once Ollama is ready.");
      }
    } else {
      console.log(` Knowledge base verified (${existingCount} chunks in MongoDB).`);
    }
  } catch (error: unknown) {
    const msg = extractErrorMessage(error);
    console.error(" Error initializing knowledge base:", msg);
  }
};

/**
 * Optimized RAG Query Workflow with high-resolution timing metrics,
 * query embedding caching, response caching, and tuned generation parameters.
 */
export const getRAGResponse = async (
  question: string,
  mode: "text" | "voice" = "text"
): Promise<RAGResponseResult> => {
  const requestStart = performance.now();
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    return {
      answer: "Please provide a valid question so I can assist you.",
      sources: [],
      intent: "conversational",
      timingMs: { embedding: 0, retrieval: 0, llm: 0, total: 0 },
    };
  }

  const isVoice = mode === "voice";
  const cacheKey = `${mode}:${cleanQuestion.toLowerCase()}`;

  // 1. Check Full Response Cache
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < RESPONSE_CACHE_TTL_MS) {
    const total = Math.round(performance.now() - requestStart);
    console.log(`[RAG] Cache HIT for "${cleanQuestion}" | Total: ${total}ms`);
    return {
      ...cachedResponse.result,
      timingMs: { embedding: 0, retrieval: 0, llm: 0, total },
    };
  }

  // 2. Agentic Routing
  const routeStart = performance.now();
  const routing = routeUserQuery(cleanQuestion, isVoice);
  const routingTimeMs = Math.round(performance.now() - routeStart);

  if (routing.intent === "DIRECT_CONVERSATION") {
    const total = Math.round(performance.now() - requestStart);
    console.log(`[RAG] Routing: ${routingTimeMs}ms (DIRECT_CONVERSATION) | Total: ${total}ms`);
    return {
      answer: routing.directResponse || "Hello! How can I help you regarding EduReach College?",
      sources: [],
      intent: "conversational",
      timingMs: { embedding: 0, retrieval: 0, llm: 0, total },
    };
  }

  if (routing.intent === "OUT_OF_SCOPE") {
    const total = Math.round(performance.now() - requestStart);
    console.log(`[RAG] Routing: ${routingTimeMs}ms (OUT_OF_SCOPE) | Total: ${total}ms`);
    return {
      answer: routing.directResponse || FALLBACK_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { embedding: 0, retrieval: 0, llm: 0, total },
    };
  }

  // 3. Vector Retrieval with Timing & Embedding Cache
  // For voice queries, retrieve top 2 chunks to minimize prompt evaluation time; for text, retrieve top 3
  const topK = isVoice ? 2 : parseInt(process.env.RAG_TOP_K || "3", 10);
  let retrievalResult;

  try {
    retrievalResult = await retrieveRelevantChunksWithMetrics(routing.cleanQuery, topK);
  } catch (retrievalError: unknown) {
    const msg = extractErrorMessage(retrievalError);
    console.error(" Vector retrieval error:", msg);
    const total = Math.round(performance.now() - requestStart);
    return {
      answer: OLLAMA_OFFLINE_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { embedding: 0, retrieval: 0, llm: 0, total },
    };
  }

  const { chunks: relevantChunks, embeddingTimeMs, retrievalTimeMs, fromEmbeddingCache } =
    retrievalResult;

  // 4. Quality Check
  if (relevantChunks.length === 0) {
    const total = Math.round(performance.now() - requestStart);
    console.log(
      `[RAG] Embedding: ${embeddingTimeMs}ms ${fromEmbeddingCache ? "[cache: HIT]" : "[cache: MISS]"} | ` +
        `Retrieval: ${retrievalTimeMs}ms (0 chunks) | Fallback triggered | Total: ${total}ms`
    );
    return {
      answer: FALLBACK_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { embedding: embeddingTimeMs, retrieval: retrievalTimeMs, llm: 0, total },
    };
  }

  // 5. Grounded Prompt Construction
  const promptStart = performance.now();
  const prompt = buildGroundedPrompt(routing.cleanQuery, relevantChunks, isVoice);
  const promptTimeMs = Math.round(performance.now() - promptStart);

  const llmModel = getLLMModel();
  const maxTokens = isVoice ? 85 : 200; // Concise token budgets for faster completion

  // 6. Ollama Generation with Tuned Context & Keep-Alive
  const llmStart = performance.now();
  let answer = "";

  try {
    const { response } = await fetchOllama("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel,
        prompt,
        stream: false,
        keep_alive: "30m", // Keep model warm in RAM to avoid cold starts
        options: {
          temperature: 0.2,
          num_predict: maxTokens,
          num_ctx: 1024, // Compact context window speeds up prompt evaluation
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Ollama LLM error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { response?: string };
    answer = (data.response || "").trim();

    if (!answer) {
      answer = FALLBACK_MESSAGE;
    }
  } catch (llmError: unknown) {
    const msg = extractErrorMessage(llmError);
    console.error(" Ollama LLM generation error:", msg);
    const total = Math.round(performance.now() - requestStart);
    return {
      answer: OLLAMA_OFFLINE_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { embedding: embeddingTimeMs, retrieval: retrievalTimeMs, llm: 0, total },
    };
  }

  const llmTimeMs = Math.round(performance.now() - llmStart);
  const totalTimeMs = Math.round(performance.now() - requestStart);

  // Print standardized development performance log
  console.log(
    `[RAG] Query: "${routing.cleanQuery}"\n` +
      `[RAG] Routing: ${routingTimeMs}ms\n` +
      `[RAG] Embedding: ${embeddingTimeMs}ms ${fromEmbeddingCache ? "[cache: HIT]" : "[cache: MISS]"}\n` +
      `[RAG] Retrieval: ${retrievalTimeMs}ms (${relevantChunks.length} chunks)\n` +
      `[RAG] Prompt: ${promptTimeMs}ms (${prompt.length} chars)\n` +
      `[RAG] LLM: ${llmTimeMs}ms (max_tokens: ${maxTokens})\n` +
      `[RAG] Total: ${totalTimeMs}ms`
  );

  const sources: SourceCitation[] = relevantChunks.map((c) => ({
    source: c.source,
    chunkIndex: c.chunkIndex,
    section: c.section,
    similarity: Number(c.similarity.toFixed(3)),
  }));

  const finalResult: RAGResponseResult = {
    answer,
    sources,
    intent: "knowledge_retrieval",
    timingMs: {
      embedding: embeddingTimeMs,
      retrieval: retrievalTimeMs,
      llm: llmTimeMs,
      total: totalTimeMs,
    },
  };

  // Cache final response for repeated queries
  if (responseCache.size >= MAX_RESPONSE_CACHE) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });

  return finalResult;
};
