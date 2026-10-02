import connectDB from "./src/config/database.config.ts";
import { retrieveRelevantChunksWithMetrics } from "./src/services/retrieval.service.ts";

async function testRetrieval() {
  await connectDB();
  const queries = [
    "What courses do you offer?",
    "How can I apply?",
    "What is the admission process?",
    "What are the placement opportunities?",
    "What scholarships are available?",
    "What facilities are available?"
  ];

  for (const q of queries) {
    const res = await retrieveRelevantChunksWithMetrics(q, 3);
    console.log("\n==============================================");
    console.log("Query:", q);
    console.log("Embedding:", res.embeddingTimeMs, "ms | Retrieval:", res.retrievalTimeMs, "ms | Chunks:", res.chunks.length);
    res.chunks.forEach((c, i) => {
      console.log(`  [Chunk ${i+1}] Section: ${c.section} | Sim: ${c.similarity.toFixed(3)}`);
      console.log(`  Preview: ${c.text.slice(0, 100).replace(/\n/g, " ")}...`);
    });
  }
  process.exit(0);
}
testRetrieval();
