// =======================================================
// EduReach — Ollama Vector Embedding Service
// Robust Ollama integration with URL normalization,
// IPv4/localhost fallback, detailed error extraction, and health checks.
// =======================================================

/**
 * Normalizes the base URL by trimming whitespace and removing trailing slashes.
 */
export const normalizeBaseUrl = (url?: string): string => {
  const raw = (url || process.env.OLLAMA_BASE_URL || "http://localhost:11434").trim();
  return raw.replace(/\/+$/, "");
};

export const getEmbeddingModel = (): string =>
  (process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text").trim();

export const getLLMModel = (): string =>
  (process.env.OLLAMA_MODEL || "llama3.2:3b").trim();

export interface OllamaHealthReport {
  available: boolean;
  resolvedUrl: string;
  embeddingModel: string;
  embeddingModelFound: boolean;
  llmModel: string;
  llmModelFound: boolean;
  availableModels: string[];
  error?: string | undefined;
  troubleshooting?: string | undefined;
}

/**
 * Extracts comprehensive technical details from errors, unpacking Node.js fetch causes.
 */
export const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    const cause = (err as { cause?: Error | { code?: string; message?: string; errno?: number } }).cause;
    if (cause) {
      if (typeof cause === "object") {
        const code = "code" in cause ? cause.code : "";
        const msg = "message" in cause ? cause.message : "";
        const detail = [code, msg].filter(Boolean).join(" - ");
        return detail ? `${err.message} (${detail})` : err.message;
      }
      return `${err.message} (${String(cause)})`;
    }
    return err.message;
  }
  return String(err);
};

/**
 * Performs a fetch request with automatic IPv4 fallback (e.g. localhost -> 127.0.0.1)
 * to avoid Windows IPv6 resolution issues when connecting to Ollama.
 */
export const fetchOllama = async (
  endpointPath: string,
  init?: RequestInit
): Promise<{ response: Response; usedUrl: string }> => {
  const primaryBase = normalizeBaseUrl();
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;

  // Candidate URLs to try
  const candidateBases = [primaryBase];
  if (primaryBase.includes("localhost")) {
    candidateBases.push(primaryBase.replace("localhost", "127.0.0.1"));
  } else if (primaryBase.includes("127.0.0.1")) {
    candidateBases.push(primaryBase.replace("127.0.0.1", "localhost"));
  }

  let lastError: unknown = null;

  for (const base of candidateBases) {
    const fullUrl = `${base}${normalizedPath}`;
    try {
      const response = await fetch(fullUrl, init);
      return { response, usedUrl: fullUrl };
    } catch (err) {
      lastError = err;
      // Continue to next candidate (e.g., fallback from localhost to 127.0.0.1)
    }
  }

  const detailedMsg = extractErrorMessage(lastError);
  throw new Error(`Failed to connect to Ollama at ${candidateBases.join(" or ")}: ${detailedMsg}`);
};

/**
 * Validates connection to Ollama and checks if the embedding model and LLM are pulled.
 */
export const checkOllamaHealth = async (): Promise<OllamaHealthReport> => {
  const embeddingModel = getEmbeddingModel();
  const llmModel = getLLMModel();
  const configuredUrl = normalizeBaseUrl();

  try {
    const { response, usedUrl } = await fetchOllama("/api/tags", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        available: false,
        resolvedUrl: usedUrl,
        embeddingModel,
        embeddingModelFound: false,
        llmModel,
        llmModelFound: false,
        availableModels: [],
        error: `Ollama returned HTTP ${response.status}: ${errBody || response.statusText}`,
        troubleshooting: "Ensure Ollama service is healthy and responsive.",
      };
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const availableModels = (data.models || []).map((m) => m.name);

    const embedPrefix = embeddingModel.split(":")[0] || embeddingModel;
    const llmPrefix = llmModel.split(":")[0] || llmModel;

    const embeddingModelFound = availableModels.some((m) => m.startsWith(embedPrefix));
    const llmModelFound = availableModels.some((m) => m.startsWith(llmPrefix));

    return {
      available: true,
      resolvedUrl: usedUrl.replace(/\/api\/tags$/, ""),
      embeddingModel,
      embeddingModelFound,
      llmModel,
      llmModelFound,
      availableModels,
      troubleshooting: !embeddingModelFound
        ? `Embedding model "${embeddingModel}" is not installed. Run: ollama pull ${embeddingModel}`
        : !llmModelFound
        ? `LLM model "${llmModel}" is not installed. Run: ollama pull ${llmModel}`
        : undefined,
    };
  } catch (err: unknown) {
    const detailedMsg = extractErrorMessage(err);
    return {
      available: false,
      resolvedUrl: configuredUrl,
      embeddingModel,
      embeddingModelFound: false,
      llmModel,
      llmModelFound: false,
      availableModels: [],
      error: detailedMsg,
      troubleshooting: "Ensure Ollama is installed and running with: ollama serve",
    };
  }
};

/**
 * Generates an embedding vector for a single string using Ollama.
 * Tries the modern /api/embed endpoint first, then falls back to legacy /api/embeddings.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  const model = getEmbeddingModel();

  // 1. Try modern /api/embed endpoint (Ollama >= 0.1.34)
  try {
    const { response } = await fetchOllama("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: cleanText }),
    });

    if (response.ok) {
      const data = (await response.json()) as { embeddings?: number[][] };
      const vector = data.embeddings?.[0];
      if (Array.isArray(vector) && vector.length > 0) {
        // Validate that all elements are real numbers
        const isValid = vector.every((val) => typeof val === "number" && !isNaN(val));
        if (isValid) {
          return vector;
        }
      }
    } else if (response.status === 404) {
      const errorText = await response.text().catch(() => "");
      if (errorText.toLowerCase().includes("model")) {
        throw new Error(
          `Embedding model "${model}" not found on Ollama. Run: ollama pull ${model}`
        );
      }
      // If endpoint itself not found, fall through to legacy /api/embeddings
    } else {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Ollama /api/embed error (${response.status}): ${errorText}`);
    }
  } catch (err: unknown) {
    // If it's a model-not-found error, propagate immediately
    const msg = extractErrorMessage(err);
    if (msg.includes("not found on Ollama")) {
      throw err;
    }
    // Otherwise fallback to legacy endpoint
  }

  // 2. Fallback to /api/embeddings endpoint
  try {
    const { response } = await fetchOllama("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: cleanText }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      if (response.status === 404 && errText.toLowerCase().includes("model")) {
        throw new Error(
          `Embedding model "${model}" not found on Ollama. Run: ollama pull ${model}`
        );
      }
      throw new Error(`Ollama embedding error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { embedding?: number[] };
    if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new Error("Ollama returned an empty embedding vector.");
    }

    const isValid = data.embedding.every((val) => typeof val === "number" && !isNaN(val));
    if (!isValid) {
      throw new Error("Ollama returned a malformed embedding with non-numeric values.");
    }

    return data.embedding;
  } catch (err: unknown) {
    const detailedMsg = extractErrorMessage(err);
    throw new Error(`Failed to generate embedding with model "${model}": ${detailedMsg}`);
  }
};

/**
 * Generates embeddings for an array of texts sequentially or with controlled batching
 * to prevent overwhelming local system resources.
 */
export const generateEmbeddings = async (
  texts: string[],
  concurrency = 3
): Promise<number[][]> => {
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const slice = texts.slice(i, i + concurrency);
    const promises = slice.map((t) => generateEmbedding(t));
    const batchResults = await Promise.all(promises);

    for (let j = 0; j < batchResults.length; j++) {
      const res = batchResults[j];
      if (res) {
        results[i + j] = res;
      }
    }
  }

  return results;
};
