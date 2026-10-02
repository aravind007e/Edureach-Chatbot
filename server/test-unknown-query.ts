import connectDB from "./src/config/database.config.ts";
import { getRAGResponse } from "./src/services/rag.service.ts";

async function testUnknown() {
  await connectDB();
  const queries = [
    "Do you offer MBBS or medical programs?",
    "What is the fee for Aerospace Engineering?",
    "Who is the cricket coach at EduReach?"
  ];

  for (const q of queries) {
    console.log("\n==============================================");
    console.log("Unknown Query:", q);
    const res = await getRAGResponse(q);
    console.log("Answer:\n", res.answer);
    console.log("Sources:", res.sources.map(s => s.section));
    console.log("Timing:", res.timingMs);
  }
  process.exit(0);
}
testUnknown();
