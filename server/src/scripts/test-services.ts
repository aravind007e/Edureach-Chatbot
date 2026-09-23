import { loadAndChunkKnowledgeBase } from "../services/document.service.ts";
import { routeUserQuery } from "../services/router.service.ts";
import { cosineSimilarity } from "../services/retrieval.service.ts";

async function runTests() {
  console.log("=== Testing Document Chunking ===");
  const chunks = await loadAndChunkKnowledgeBase();
  console.log("Total chunks created:", chunks.length);
  if (chunks.length < 5) throw new Error("Expected at least 5 chunks");
  console.log("First chunk section:", chunks[0]?.section);
  console.log("First chunk length:", chunks[0]?.charCount);
  console.log("Fourth chunk section:", chunks[3]?.section);

  console.log("\n=== Testing Lightweight Agentic Router ===");
  const r1 = routeUserQuery("Hi there!");
  console.log("Greeting test:", r1.intent, "-", r1.reasoning);
  if (r1.intent !== "DIRECT_CONVERSATION") throw new Error("Greeting routing failed");

  const r2 = routeUserQuery("What is the B.Tech CSE fee?");
  console.log("Course fee test:", r2.intent, "-", r2.reasoning);
  if (r2.intent !== "KNOWLEDGE_RETRIEVAL") throw new Error("Fee query routing failed");

  const r3 = routeUserQuery("Write a python script for binary search");
  console.log("Coding task test:", r3.intent, "-", r3.reasoning);
  if (r3.intent !== "OUT_OF_SCOPE") throw new Error("Out-of-scope query routing failed");

  console.log("\n=== Testing Cosine Similarity Math ===");
  const simIdentical = cosineSimilarity([1, 2, 3], [1, 2, 3]);
  const simOrthogonal = cosineSimilarity([1, 0], [0, 1]);
  const simOpposite = cosineSimilarity([1, 1], [-1, -1]);

  console.log("Identical vectors similarity (expected 1.0):", simIdentical.toFixed(4));
  console.log("Orthogonal vectors similarity (expected 0.0):", simOrthogonal.toFixed(4));
  console.log("Opposite vectors similarity (expected -1.0):", simOpposite.toFixed(4));

  if (Math.abs(simIdentical - 1.0) > 0.0001) throw new Error("Identical similarity math failed");
  if (Math.abs(simOrthogonal - 0.0) > 0.0001) throw new Error("Orthogonal similarity math failed");
  if (Math.abs(simOpposite - -1.0) > 0.0001) throw new Error("Opposite similarity math failed");

  console.log("\n✅ All unit tests passed cleanly!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
