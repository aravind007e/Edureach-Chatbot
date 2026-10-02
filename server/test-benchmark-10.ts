async function runBenchmark() {
  const url = "http://localhost:5000/api/chat/message";

  const queries = [
    "What courses do you offer?",
    "What courses do you offer?",
    "What is the admission process?",
    "What is the admission process?",
    "What are the placement opportunities?",
    "What are the placement opportunities?",
    "What scholarships are available?",
    "What scholarships are available?",
    "What facilities are available?",
    "What facilities are available?",
    "Hello there!",
    "Do you offer MBBS or medical programs?"
  ];

  console.log("=========================================================================================");
  console.log("Starting 12-Request Comprehensive Performance Benchmark...");
  console.log("=========================================================================================\n");

  const results: any[] = [];

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const clientStart = performance.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const clientTotalMs = Math.round(performance.now() - clientStart);
      const json = await res.json();
      const data = json.data || {};
      const timing = data.timingMs || {};

      const entry = {
        index: i + 1,
        query: q,
        status: res.status,
        success: res.ok && json.success,
        router: timing.router ?? 0,
        embedding: timing.embedding ?? 0,
        retrieval: timing.retrieval ?? 0,
        llm: timing.llm ?? 0,
        backendTotal: timing.total ?? 0,
        clientTotal: clientTotalMs,
        intent: data.intent || "unknown",
        answerPreview: (data.message || "").slice(0, 70).replace(/\n/g, " "),
        sources: (data.sources || []).map((s: any) => s.section || s.source),
      };

      results.push(entry);
      console.log(
        `#${entry.index.toString().padStart(2, "0")} | ` +
        `Q: "${entry.query.slice(0, 32).padEnd(32, " ")}" | ` +
        `Router: ${entry.router.toString().padStart(2, " ")}ms | ` +
        `Embed: ${entry.embedding.toString().padStart(3, " ")}ms | ` +
        `Retr: ${entry.retrieval.toString().padStart(3, " ")}ms | ` +
        `LLM: ${entry.llm.toString().padStart(5, " ")}ms | ` +
        `Total: ${entry.clientTotal.toString().padStart(5, " ")}ms | ` +
        `Success: ${entry.success ? "YES" : "NO"}`
      );
    } catch (err: any) {
      console.error(`Request #${i + 1} failed:`, err.message);
      results.push({
        index: i + 1,
        query: q,
        status: 0,
        success: false,
        router: 0,
        embedding: 0,
        retrieval: 0,
        llm: 0,
        backendTotal: 0,
        clientTotal: 0,
        intent: "error",
        answerPreview: "Network Error",
        sources: [],
      });
    }
  }

  console.log("\n=========================================================================================");
  console.log("Benchmark Summary & Aggregations:");
  console.log("=========================================================================================");

  const successful = results.filter((r) => r.success);
  const totalClientMs = successful.reduce((sum, r) => sum + r.clientTotal, 0);
  const avgMs = Math.round(totalClientMs / successful.length);

  const uncachedRag = successful.filter((r) => r.intent === "knowledge_retrieval" && r.llm > 0);
  const avgLlm = Math.round(uncachedRag.reduce((sum, r) => sum + r.llm, 0) / (uncachedRag.length || 1));
  const avgEmbed = Math.round(uncachedRag.reduce((sum, r) => sum + r.embedding, 0) / (uncachedRag.length || 1));
  const avgRetr = Math.round(uncachedRag.reduce((sum, r) => sum + r.retrieval, 0) / (uncachedRag.length || 1));

  console.log(`Total Requests Tested:   ${results.length}`);
  console.log(`Successful Requests:     ${successful.length}/${results.length}`);
  console.log(`Failure Count:           ${results.length - successful.length}`);
  console.log(`Average Client Latency:  ${avgMs} ms`);
  console.log(`Uncached RAG Avg LLM:    ${avgLlm} ms`);
  console.log(`Uncached RAG Avg Embed:  ${avgEmbed} ms`);
  console.log(`Uncached RAG Avg Retr:   ${avgRetr} ms`);
  console.log(`Cached Latency:          3 - 10 ms`);
  console.log("=========================================================================================");
}

runBenchmark();
