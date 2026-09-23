// =======================================================
// EduReach — Ollama Diagnostic Script
// Run via: npm run check:ollama
// =======================================================

import {
  checkOllamaHealth,
  generateEmbedding,
  getEmbeddingModel,
  getLLMModel,
  normalizeBaseUrl,
  extractErrorMessage,
} from "../services/embedding.service.ts";

const runDiagnostics = async () => {
  console.log("==========================================");
  console.log("🔍 EduReach AI & Ollama Diagnostic Check");
  console.log("==========================================");

  const configuredBaseUrl = normalizeBaseUrl();
  const configuredLLM = getLLMModel();
  const configuredEmbeddingModel = getEmbeddingModel();

  console.log(`\nConfigured Settings:`);
  console.log(`- Base URL:        ${configuredBaseUrl}`);
  console.log(`- LLM Model:       ${configuredLLM}`);
  console.log(`- Embedding Model: ${configuredEmbeddingModel}\n`);

  // Step 1: Check Ollama connectivity and model availability
  console.log("Checking Ollama service connectivity...");
  const health = await checkOllamaHealth();

  if (!health.available) {
    console.error(`\n❌ Ollama: FAILED`);
    console.error(`   Could not connect to Ollama at ${health.resolvedUrl}`);
    console.error(`   Error: ${health.error}`);
    console.error(`\n👉 Remediation:`);
    console.error(`   1. Ensure Ollama is installed from https://ollama.com`);
    console.error(`   2. Start Ollama by running: ollama serve`);
    console.error(`   3. If running on a custom port/host, verify OLLAMA_BASE_URL in server/.env\n`);
    process.exit(1);
  }

  console.log(`✅ Ollama: OK (${health.resolvedUrl})`);

  // Step 2: Check LLM model
  if (health.llmModelFound) {
    console.log(`✅ LLM model: ${health.llmModel} [INSTALLED]`);
  } else {
    console.warn(`⚠️ LLM model: ${health.llmModel} [MISSING]`);
    console.warn(`👉 Run: ollama pull ${health.llmModel}`);
  }

  // Step 3: Check Embedding model
  if (health.embeddingModelFound) {
    console.log(`✅ Embedding model: ${health.embeddingModel} [INSTALLED]`);
  } else {
    console.error(`❌ Embedding model: ${health.embeddingModel} [MISSING]`);
    console.error(`👉 Run: ollama pull ${health.embeddingModel}`);
    console.error(`   Available models on system: ${health.availableModels.join(", ") || "none"}\n`);
    process.exit(1);
  }

  // Step 4: Test Embedding Generation
  console.log("\nTesting real vector embedding generation...");
  const testSample = "EduReach College engineering and technology Hyderabad";

  try {
    const startTime = Date.now();
    const vector = await generateEmbedding(testSample);
    const duration = Date.now() - startTime;

    console.log(`✅ Embedding generation: OK (${duration}ms)`);
    console.log(`✅ Embedding dimensions: ${vector.length}`);
    console.log(`   Sample vector prefix: [${vector.slice(0, 3).map((n) => n.toFixed(4)).join(", ")}, ...]`);

    console.log("\n🎉 All Ollama checks passed! Your RAG system is ready for indexing and querying.\n");
    process.exit(0);
  } catch (err: unknown) {
    const msg = extractErrorMessage(err);
    console.error(`❌ Embedding generation: FAILED`);
    console.error(`   Error: ${msg}`);
    console.error(`👉 Ensure model "${health.embeddingModel}" is fully pulled: ollama pull ${health.embeddingModel}\n`);
    process.exit(1);
  }
};

runDiagnostics();
