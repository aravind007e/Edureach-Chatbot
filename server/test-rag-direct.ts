import connectDB from "./src/config/database.config.ts";
import { getRAGResponse } from "./src/services/rag.service.ts";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Calling getRAGResponse for: 'What courses do you offer?'");
  try {
    const result = await getRAGResponse("What courses do you offer?");
    console.log("RAG Response Success!");
    console.log("Answer:", result.answer);
    console.log("Intent:", result.intent);
    console.log("Sources:", result.sources);
    console.log("Timing:", result.timingMs);
  } catch (err: any) {
    console.error("Direct getRAGResponse EXCEPTION:");
    console.error(err);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
  }
  process.exit(0);
}

run();
