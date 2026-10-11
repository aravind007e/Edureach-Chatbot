import connectDB from "./src/config/database.config.ts";
import { getRAGResponse, clearResponseCache } from "./src/services/rag.service.ts";

interface TestCase {
  query: string;
  expectedSourceSnippet: string;
  isCollegeRelated: boolean;
}

const testCases: TestCase[] = [
  {
    query: "What is the admission process?",
    expectedSourceSnippet: "ADMISSIONS PROCESS",
    isCollegeRelated: true,
  },
  {
    query: "What courses do you offer?",
    expectedSourceSnippet: "COURSES OFFERED",
    isCollegeRelated: true,
  },
  {
    query: "Which engineering specializations are available?",
    expectedSourceSnippet: "COURSES OFFERED",
    isCollegeRelated: true,
  },
  {
    query: "What is the eligibility for B.Tech admission?",
    expectedSourceSnippet: "ADMISSIONS PROCESS",
    isCollegeRelated: true,
  },
  {
    query: "How to make pasta?",
    expectedSourceSnippet: "none",
    isCollegeRelated: false,
  },
];

async function run() {
  await connectDB();
  clearResponseCache();

  console.log("\n=======================================================");
  console.log(" EduReach Phase 3 End-to-End Benchmark Test Suite");
  console.log("=======================================================\n");

  for (const tc of testCases) {
    console.log(`-------------------------------------------------------`);
    console.log(`QUERY: "${tc.query}"`);
    console.log(`-------------------------------------------------------`);

    const result = await getRAGResponse(tc.query, "text");

    console.log(`Intent: "${result.intent}"`);
    console.log(`Answer:\n${result.answer}`);
    console.log(`Sources:`);
    if (result.sources.length === 0) {
      console.log(`  (none)`);
    } else {
      for (const s of result.sources) {
        console.log(`  - Chunk #${s.chunkIndex} [${s.section}] (similarity: ${s.similarity})`);
      }
    }
    console.log(`Timing: ${result.timingMs?.total} ms (LLM: ${result.timingMs?.llm} ms)`);

    // Verification assertion
    if (tc.isCollegeRelated) {
      const hasExpectedSource = result.sources.some((s) => s.section.includes(tc.expectedSourceSnippet));
      const notFallback = !result.answer.includes("I don't have enough information in the EduReach knowledge base");
      console.log(`Factually Grounded: ${hasExpectedSource && notFallback ? "PASS" : "FAIL"}`);
    } else {
      const isHonestFallback = result.intent === "fallback" && result.sources.length === 0;
      console.log(`Honest Fallback: ${isHonestFallback ? "PASS" : "FAIL"}`);
    }
    console.log("");
  }

  process.exit(0);
}

run();
