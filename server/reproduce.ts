const url = "http://localhost:5000/api/chat/message";

async function main() {
  console.log("Starting 10 test requests for 'What courses do you offer?'...\n");
  for (let i = 1; i <= 10; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "What courses do you offer?" }),
      });
      const elapsed = Math.round(performance.now() - start);
      const data = await res.json();
      console.log(`Request #${i} | Status: ${res.status} | Total: ${elapsed}ms | Intent: ${data.data?.intent || "N/A"} | Timing: ${JSON.stringify(data.data?.timingMs || {})}`);
      if (!res.ok || !data.success) {
        console.log(`  -> FAILED: ${JSON.stringify(data)}`);
      } else {
        console.log(`  -> Answer sample: ${(data.data?.message || "").slice(0, 80).replace(/\n/g, " ")}...`);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      console.log(`Request #${i} | Network/Fetch ERROR in ${elapsed}ms: ${err.message} | cause: ${JSON.stringify(err.cause || {})}`);
    }
  }
}

main();
