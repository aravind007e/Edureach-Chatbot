// =======================================================
// EduReach — Knowledge Base CLI Ingestion Script
// Run via: npm run ingest
// =======================================================

import mongoose from "mongoose";
import connectDB from "../config/database.config.ts";
import { ingestKnowledgeBase } from "../services/rag.service.ts";
import { checkOllamaHealth, extractErrorMessage } from "../services/embedding.service.ts";

const runIngestion = async () => {
  console.log("=============================================");
  console.log("📦 EduReach Document Ingestion Pipeline");
  console.log("=============================================");

  // 1. Check Ollama Embedding Service
  console.log("\nChecking Ollama embedding service connection...");
  const health = await checkOllamaHealth();

  if (!health.available) {
    console.error(`\n❌ Ollama service is not running (${health.resolvedUrl}).`);
    console.error(`   Error: ${health.error}`);
    console.error("👉 Please start Ollama first with: ollama serve\n");
    process.exit(1);
  }

  if (!health.embeddingModelFound) {
    console.error(`\n❌ Embedding model "${health.embeddingModel}" is not installed.`);
    console.error(`👉 Run: ollama pull ${health.embeddingModel}\n`);
    process.exit(1);
  }

  console.log(`✅ Embedding service verified with model: ${health.embeddingModel}`);

  // 2. Connect to Database
  console.log("\nConnecting to MongoDB...");
  await connectDB();

  // 3. Ingest knowledge base
  try {
    const count = await ingestKnowledgeBase();
    console.log(`\n🎉 Success! Ingested and embedded ${count} chunks into MongoDB collection: knowledge_docs\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: unknown) {
    const msg = extractErrorMessage(err);
    console.error("\n❌ Ingestion failed:", msg);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runIngestion();
