import app from "./app.ts";
import connectDB from "./config/database.config.ts";
import { initializeKnowledgeBase } from "./services/rag.service.ts";

const PORT = parseInt(process.env.PORT || "5000", 10);

const start = async (): Promise<void> => {
  try {
    // 1. Connect Mongoose (for users collection)
    await connectDB();

    // 2. Index knowledge base if not already done
    //    First run: loads .txt → splits → embeds → stores in MongoDB
    //    Subsequent runs: sees data exists, skips
    await initializeKnowledgeBase();

    // 3. Start Express listening on 0.0.0.0 for seamless IPv4/IPv6 support
    app.listen(PORT, "0.0.0.0", () => {
      console.log(` EduReach Server is running!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Node: ${process.version}`);
      console.log(` Press Ctrl+C to stop`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();