// =======================================================
// EduReach — Vector Retrieval-Augmented Generation (RAG) Service
// Vector RAG with lightweight intent-based routing,
// high-resolution timing instrumentation, query caching,
// strictly grounded prompts, and tuned Ollama inference.
// =======================================================

import os from "node:os";
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
    router?: number;
    embedding: number;
    retrieval: number;
    prompt?: number;
    llm: number;
    total: number;
  };
}

export const FALLBACK_MESSAGE =
  "I don't have enough information in the EduReach knowledge base to answer that accurately. Please contact the EduReach admissions office at admissions@edureach.edu.in or call +91 9876543210.";

export const OLLAMA_OFFLINE_MESSAGE =
  "The AI counselor is currently unable to connect to the local Ollama service. Please ensure Ollama is running (`ollama serve`), or contact our admissions office at admissions@edureach.edu.in or call +91 9876543210.";

// Recent Full Response Cache (10-minute TTL for identical queries)
interface CachedResponseEntry {
  result: RAGResponseResult;
  timestamp: number;
}
const responseCache = new Map<string, CachedResponseEntry>();
const RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESPONSE_CACHE = 150;

export const clearResponseCache = (): void => {
  responseCache.clear();
};

/**
 * Sanitizes errors by redacting any sensitive credentials, URLs, or secrets.
 */
export const sanitizeErrorMessage = (err: unknown): string => {
  const raw = extractErrorMessage(err);
  return raw
    .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "mongodb://[REDACTED]")
    .replace(/(?:key|secret|token|password|auth)=?[a-z0-9_\-\.]+/gi, "[REDACTED]")
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "[REDACTED]");
};

/**
 * Formatted safe error logger matching required diagnostic specification.
 */
export const logRagError = (stage: string, err: unknown): void => {
  const safe = sanitizeErrorMessage(err);
  console.error(`[RAG ERROR]\nstage: ${stage}\nerror: ${safe}`);
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
    .map((c) => `[${c.section}]: ${c.text}`)
    .join("\n\n");

  if (isVoice) {
    return `You are Ava, admissions counselor for EduReach College.
Answer concisely in 1-2 spoken sentences (under 30 words) using ONLY this context:
${contextText}

Question: ${question}
Spoken Answer:`;
  }

  return `You are EduReach Bot, official AI counselor for EduReach College, Hyderabad.
Answer accurately and concisely (under 50 words) using ONLY the context below. If not present in context, reply exactly "${FALLBACK_MESSAGE}".

CONTEXT:
${contextText}

Question: ${question}
Answer:`;
};

/**
 * Ingests the edureach-knowledge.txt document into MongoDB with vector embeddings.
 */
export const ingestKnowledgeBase = async (): Promise<number> => {
  console.log(" Starting knowledge base ingestion...");

  try {
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
  } catch (err) {
    logRagError("ingestion", err);
    throw err;
  }
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
        logRagError("initial_ingestion", ingestError);
        console.warn("   You can run `npm run ingest` once Ollama is ready.");
      }
    } else {
      console.log(` Knowledge base verified (${existingCount} chunks in MongoDB).`);
    }
  } catch (error: unknown) {
    logRagError("startup_initialization", error);
  }
};

/**
 * Vector RAG with lightweight intent-based routing, timing instrumentation,
 * query caching, and tuned Ollama generation parameters.
 */
export const getRAGResponse = async (
  question: string,
  mode: "text" | "voice" = "text"
): Promise<RAGResponseResult> => {
  const requestStart = performance.now();
  const cleanQuestion = question.trim();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!cleanQuestion) {
    return {
      answer: "Please provide a valid question so I can assist you.",
      sources: [],
      intent: "conversational",
      timingMs: { router: 0, embedding: 0, retrieval: 0, prompt: 0, llm: 0, total: 0 },
    };
  }

  const isVoice = mode === "voice";
  // Normalize whitespace and trailing punctuation for reliable cache hits
  const normalizedQuestion = cleanQuestion
    .toLowerCase()
    .replace(/[\s\t\n]+/g, " ")
    .replace(/[?!.,;:]+$/, "")
    .trim();
  const cacheKey = `${mode}:${normalizedQuestion}`;

  // 1. Check Full Response Cache
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < RESPONSE_CACHE_TTL_MS) {
    const total = Math.round(performance.now() - requestStart);
    console.log(
      `[RAG TIMING]\n` +
        `requestId: ${requestId}\n` +
        `cache: HIT\n` +
        `router: 0 ms\n` +
        `embedding: 0 ms\n` +
        `retrieval: 0 ms\n` +
        `prompt: 0 ms\n` +
        `llm: 0 ms\n` +
        `total: ${total} ms`
    );
    return {
      ...cachedResponse.result,
      timingMs: { router: 0, embedding: 0, retrieval: 0, prompt: 0, llm: 0, total },
    };
  }

  // 2. Intent-Based Routing
  const routeStart = performance.now();
  let routing;
  try {
    routing = routeUserQuery(cleanQuestion, isVoice);
  } catch (routeErr) {
    logRagError("router", routeErr);
    routing = {
      intent: "KNOWLEDGE_RETRIEVAL" as const,
      reasoning: "Router fallback due to exception",
      cleanQuery: cleanQuestion,
    };
  }
  const routingTimeMs = Math.round(performance.now() - routeStart);

  if (routing.intent === "DIRECT_CONVERSATION") {
    const total = Math.round(performance.now() - requestStart);
    console.log(
      `[RAG TIMING]\n` +
        `requestId: ${requestId}\n` +
        `cache: MISS\n` +
        `router: ${routingTimeMs} ms\n` +
        `embedding: 0 ms\n` +
        `retrieval: 0 ms\n` +
        `prompt: 0 ms\n` +
        `llm: 0 ms\n` +
        `total: ${total} ms`
    );
    return {
      answer: routing.directResponse || "Hello! How can I help you regarding EduReach College?",
      sources: [],
      intent: "conversational",
      timingMs: { router: routingTimeMs, embedding: 0, retrieval: 0, prompt: 0, llm: 0, total },
    };
  }

  if (routing.intent === "OUT_OF_SCOPE") {
    const total = Math.round(performance.now() - requestStart);
    console.log(
      `[RAG TIMING]\n` +
        `requestId: ${requestId}\n` +
        `cache: MISS\n` +
        `router: ${routingTimeMs} ms\n` +
        `embedding: 0 ms\n` +
        `retrieval: 0 ms\n` +
        `prompt: 0 ms\n` +
        `llm: 0 ms\n` +
        `total: ${total} ms`
    );
    return {
      answer: routing.directResponse || FALLBACK_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { router: routingTimeMs, embedding: 0, retrieval: 0, prompt: 0, llm: 0, total },
    };
  }

  // 3. Vector Retrieval with Timing & Embedding Cache
  // Text queries retrieve top 2 cohesive chunks; voice queries use top 2 for spoken brevity
  const topK = isVoice ? 2 : Math.max(1, Math.min(3, parseInt(process.env.RAG_TOP_K || "2", 10)));
  let retrievalResult;

  try {
    retrievalResult = await retrieveRelevantChunksWithMetrics(routing.cleanQuery, topK);
  } catch (retrievalError: unknown) {
    logRagError("retrieval", retrievalError);
    const total = Math.round(performance.now() - requestStart);
    return {
      answer: OLLAMA_OFFLINE_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { router: routingTimeMs, embedding: 0, retrieval: 0, prompt: 0, llm: 0, total },
    };
  }

  const { chunks: relevantChunks, embeddingTimeMs, retrievalTimeMs } = retrievalResult;

  // 4. Quality Check (If no relevant chunks retrieved)
  if (relevantChunks.length === 0) {
    const total = Math.round(performance.now() - requestStart);
    console.log(
      `[RAG DEBUG]\n` +
        `query: ${cleanQuestion}\n` +
        `route: ${routing.intent}\n` +
        `embedding_time: ${embeddingTimeMs} ms\n` +
        `retrieval_time: ${retrievalTimeMs} ms\n` +
        `top_k: 0\n` +
        `similarity_scores: []\n` +
        `retrieved_source: none\n` +
        `retrieved_chunk: none\n` +
        `context_length: 0 chars\n` +
        `llm_time: 0 ms\n` +
        `total_time: ${total} ms`
    );
    console.log(
      `[RAG TIMING]\n` +
        `requestId: ${requestId}\n` +
        `cache: MISS\n` +
        `router: ${routingTimeMs} ms\n` +
        `embedding: ${embeddingTimeMs} ms\n` +
        `retrieval: ${retrievalTimeMs} ms (0 chunks)\n` +
        `prompt: 0 ms\n` +
        `llm: 0 ms\n` +
        `total: ${total} ms`
    );
    return {
      answer: FALLBACK_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { router: routingTimeMs, embedding: embeddingTimeMs, retrieval: retrievalTimeMs, prompt: 0, llm: 0, total },
    };
  }

  // 5. Grounded Prompt Construction
  const promptStart = performance.now();
  const prompt = buildGroundedPrompt(routing.cleanQuery, relevantChunks, isVoice);
  const promptTimeMs = Math.round(performance.now() - promptStart);
  const llmModel = getLLMModel();
  const maxTokens = isVoice ? 35 : 65; // Compact token budget prevents long generation delays

  // 6. Ollama Generation with Tuned Context, Stop Tokens & Keep-Alive
  const llmStart = performance.now();
  let answer = "";

  try {
    // Tuning CPU thread count to 4 (P-cores) to prevent E-core context switching/lock contention
    const cpuThreads = Math.min(4, os.cpus().length || 4);
    const { response } = await fetchOllama("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel,
        prompt,
        stream: false,
        keep_alive: "60m", // Keep model warm in RAM to avoid cold-start delays
        options: {
          temperature: 0.1, // Low temperature for factual fidelity
          num_predict: maxTokens,
          num_ctx: 1536, // 1536 tokens accommodates 3 full chunks and prompt instructions without truncation
          num_thread: cpuThreads,
        },
        stop: ["\n\nQuestion:", "\nQuestion:", "\nUser:", "\nStudent:", "=== END", "\n\nUser:"],
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
    logRagError("llm", llmError);
    const total = Math.round(performance.now() - requestStart);
    return {
      answer: OLLAMA_OFFLINE_MESSAGE,
      sources: [],
      intent: "fallback",
      timingMs: { router: routingTimeMs, embedding: embeddingTimeMs, retrieval: retrievalTimeMs, prompt: promptTimeMs, llm: 0, total },
    };
  }

  const llmTimeMs = Math.round(performance.now() - llmStart);
  const totalTimeMs = Math.round(performance.now() - requestStart);

  // Standardized diagnostic logs
  const similarityScores = relevantChunks.map((c) => Number(c.similarity.toFixed(3))).join(", ");
  const retrievedSources = relevantChunks.map((c) => c.section).join(", ");
  const retrievedChunkSummary = relevantChunks
    .map((c) => `[#${c.chunkIndex} ${c.section}: ${c.text.replace(/\s+/g, " ").substring(0, 60)}...]`)
    .join(" | ");
  const contextLength = relevantChunks.reduce((acc, c) => acc + c.text.length, 0);

  console.log(
    `[RAG DEBUG]\n` +
      `query: ${cleanQuestion}\n` +
      `route: ${routing.intent}\n` +
      `embedding_time: ${embeddingTimeMs} ms\n` +
      `retrieval_time: ${retrievalTimeMs} ms\n` +
      `top_k: ${relevantChunks.length}\n` +
      `similarity_scores: [${similarityScores}]\n` +
      `retrieved_source: ${retrievedSources}\n` +
      `retrieved_chunk: ${retrievedChunkSummary}\n` +
      `context_length: ${contextLength} chars\n` +
      `llm_time: ${llmTimeMs} ms\n` +
      `total_time: ${totalTimeMs} ms`
  );

  console.log(
    `[RAG TIMING]\n` +
      `requestId: ${requestId}\n` +
      `cache: MISS\n` +
      `router: ${routingTimeMs} ms\n` +
      `embedding: ${embeddingTimeMs} ms\n` +
      `retrieval: ${retrievalTimeMs} ms\n` +
      `prompt: ${promptTimeMs} ms\n` +
      `llm: ${llmTimeMs} ms\n` +
      `total: ${totalTimeMs} ms\n` +
      `LLM model: ${llmModel}\n` +
      `embedding model: ${process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text"}\n` +
      `retrieved chunk count: ${relevantChunks.length}\n` +
      `prompt size: ${prompt.length} chars`
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
      router: routingTimeMs,
      embedding: embeddingTimeMs,
      retrieval: retrievalTimeMs,
      prompt: promptTimeMs,
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
