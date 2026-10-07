// =======================================================
// EduReach — Vector Retrieval Service
// In-memory Cosine Similarity Ranking over MongoDB Stored Vectors
// Supports dimension mismatch protection, LRU query embedding cache,
// and high-resolution timing metrics.
// =======================================================

import KnowledgeDoc from "../models/knowladge-doc.model.ts";
import { generateEmbedding } from "./embedding.service.ts";

export interface RetrievedChunk {
  text: string;
  source: string;
  chunkIndex: number;
  section: string;
  similarity: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  embeddingTimeMs: number;
  retrievalTimeMs: number;
  fromEmbeddingCache: boolean;
}

// In-memory cache of chunks and their vectors to ensure fast sub-millisecond query latency
let cachedChunks: Array<{
  text: string;
  embedding: number[];
  source: string;
  chunkIndex: number;
  section: string;
}> | null = null;

// LRU Query Embedding Cache (avoids repeating ~900ms Ollama embedding calls for identical queries)
const queryEmbeddingCache = new Map<string, number[]>();
const MAX_QUERY_CACHE_SIZE = 150;

export const invalidateRetrievalCache = (): void => {
  cachedChunks = null;
  queryEmbeddingCache.clear();
};

/**
 * Safely clears all stored chunks from MongoDB and invalidates in-memory cache.
 */
export const clearStoredDocuments = async (): Promise<number> => {
  const result = await KnowledgeDoc.deleteMany({});
  invalidateRetrievalCache();
  return result.deletedCount || 0;
};

/**
 * Calculates mathematical cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Loads and caches document chunks with their embeddings from MongoDB.
 */
export const getStoredChunks = async () => {
  if (cachedChunks && cachedChunks.length > 0) {
    return cachedChunks;
  }

  const docs = await KnowledgeDoc.find({}).select("text embedding metadata").lean();
  cachedChunks = docs
    .filter((doc) => Array.isArray(doc.embedding) && doc.embedding.length > 0)
    .map((doc) => {
      const meta = (doc.metadata as Record<string, unknown>) || {};
      return {
        text: doc.text,
        embedding: doc.embedding,
        source: String(meta.source || "edureach-knowledge.txt"),
        chunkIndex: typeof meta.chunkIndex === "number" ? meta.chunkIndex : 0,
        section: String(meta.section || "General"),
      };
    });

  return cachedChunks;
};

export const normalizeQueryKey = (q: string): string =>
  q
    .toLowerCase()
    .replace(/[\s\t\n]+/g, " ")
    .replace(/[?!.,;:]+$/, "")
    .trim();

/**
 * Retrieves query embedding using the LRU cache to avoid unnecessary Ollama embedding requests.
 */
const getOrGenerateQueryVector = async (
  query: string
): Promise<{ vector: number[]; fromCache: boolean; timeMs: number }> => {
  const normalizedKey = normalizeQueryKey(query);
  const cached = queryEmbeddingCache.get(normalizedKey);

  if (cached && cached.length > 0) {
    return { vector: cached, fromCache: true, timeMs: 0 };
  }

  const start = performance.now();
  const vector = await generateEmbedding(query);
  const timeMs = Math.round(performance.now() - start);

  if (vector && vector.length > 0) {
    if (queryEmbeddingCache.size >= MAX_QUERY_CACHE_SIZE) {
      const firstKey = queryEmbeddingCache.keys().next().value;
      if (firstKey) queryEmbeddingCache.delete(firstKey);
    }
    queryEmbeddingCache.set(normalizedKey, vector);
  }

  return { vector, fromCache: false, timeMs };
};

const COMMON_QUERIES = [
  "What is the admission process?",
  "What courses do you offer?",
  "What are the B.Tech eligibility requirements?",
  "What are the placement opportunities?",
  "What is the fee structure?",
  "What scholarships are available?",
  "What facilities are available?",
];

/**
 * Pre-warms the document chunks and common query embeddings in memory
 * to eliminate cold-start database and Ollama embedding latency.
 */
export const warmKnowledgeCache = async (): Promise<void> => {
  await getStoredChunks();
};

export const prewarmQueryEmbeddings = async (): Promise<void> => {
  for (const q of COMMON_QUERIES) {
    const key = normalizeQueryKey(q);
    if (!queryEmbeddingCache.has(key)) {
      try {
        const vec = await generateEmbedding(q);
        if (vec && vec.length > 0) {
          queryEmbeddingCache.set(key, vec);
        }
      } catch {
        break; // Stop background warming if Ollama is unreachable
      }
    }
  }
};


/**
 * Retrieves top-K chunks and returns detailed timing metrics.
 */
export const retrieveRelevantChunksWithMetrics = async (
  query: string,
  topK?: number,
  minSimilarity?: number
): Promise<RetrievalResult> => {
  const configuredTopK = topK ?? parseInt(process.env.RAG_TOP_K || "3", 10);
  const configuredMinSimilarity =
    minSimilarity ?? parseFloat(process.env.RAG_MIN_SIMILARITY || "0.40");

  // 1. Generate or retrieve query vector from cache
  const { vector: queryVector, fromCache, timeMs: embeddingTimeMs } =
    await getOrGenerateQueryVector(query);

  if (!queryVector || queryVector.length === 0) {
    return { chunks: [], embeddingTimeMs, retrievalTimeMs: 0, fromEmbeddingCache: fromCache };
  }

  // 2. Fetch stored document chunks from memory cache (or MongoDB on initial call)
  const retrievalStart = performance.now();
  const chunks = await getStoredChunks();
  if (!chunks || chunks.length === 0) {
    console.warn("⚠️ No knowledge document chunks found in MongoDB. Run `npm run ingest`.");
    return { chunks: [], embeddingTimeMs, retrievalTimeMs: 0, fromEmbeddingCache: fromCache };
  }

  // 3. Compute cosine similarity & filter
  let dimensionMismatchCount = 0;
  const scoredChunks: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.embedding.length !== queryVector.length) {
      dimensionMismatchCount++;
      continue;
    }

    const similarity = cosineSimilarity(queryVector, chunk.embedding);

    if (similarity >= configuredMinSimilarity) {
      scoredChunks.push({
        text: chunk.text,
        source: chunk.source,
        chunkIndex: chunk.chunkIndex,
        section: chunk.section,
        similarity,
      });
    }
  }

  if (dimensionMismatchCount > 0) {
    console.warn(
      `⚠️ Embedding dimension mismatch for ${dimensionMismatchCount}/${chunks.length} chunks! Re-index with: npm run ingest`
    );
  }

  // 4. Rank by similarity in descending order
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  const topChunks = scoredChunks.slice(0, configuredTopK);
  const retrievalTimeMs = Math.round(performance.now() - retrievalStart);

  return {
    chunks: topChunks,
    embeddingTimeMs,
    retrievalTimeMs,
    fromEmbeddingCache: fromCache,
  };
};

/**
 * Backward-compatible helper returning just the chunks.
 */
export const retrieveRelevantChunks = async (
  query: string,
  topK?: number,
  minSimilarity?: number
): Promise<RetrievedChunk[]> => {
  const result = await retrieveRelevantChunksWithMetrics(query, topK, minSimilarity);
  return result.chunks;
};
