# EduReach — Vector RAG & Agentic College Intelligence Platform

EduReach is a full-stack, AI-powered college intelligence platform designed to provide prospective students with instant, accurate, and grounded answers about admissions, courses, fees, scholarships, placements, faculty, and campus life.

The platform integrates:
- **Vector Retrieval-Augmented Generation (RAG)** with paragraph/section-aware chunking and cosine similarity retrieval.
- **Lightweight Agentic Query Router** that intelligently categorizes user intent before querying vector storage.
- **Grounded Answer Generation** with negative constraints preventing hallucinations.
- **Source/Citation-Aware Responses** providing verifiable institutional references to students.
- **AI Voice Counselor ("Ava")** powered by Vapi for real-time outbound telephone guidance.
- **JWT Authentication** ensuring secured student access to interactive features.

---

## Architecture Overview

```text
========================================================================
OFFLINE / INGESTION PIPELINE (CLI: npm run ingest OR Server Startup):
========================================================================

 ┌───────────────────────────────────────────────┐
 │ server/knowledge-base/edureach-knowledge.txt  │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Document Chunking Service                     │
 │ (Section-aware, ~500 chars, sentence bounds)  │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Ollama Embedding Service                      │
 │ POST /api/embed (model: nomic-embed-text)     │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ MongoDB Vector Storage                        │
 │ Collection: knowledge_docs                    │
 │ Schema: { text, embedding, metadata }         │
 └───────────────────────────────────────────────┘

========================================================================
ONLINE / QUERY-TIME RAG PIPELINE (React ChatDrawer -> Backend):
========================================================================

 User Question: "What are the B.Tech CSE tuition and hostel fees?"
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Lightweight Agentic Query Router              │
 └───────┬───────────────────────┬───────────────┘
         │                       │
 [Greeting/Identity]     [Off-Topic/Baking/Coding]
         │                       │
         ▼                       ▼
  Direct Counselor       Polite Refusal:
  Welcome Message        "I specialize in EduReach..."
                                 │
                         [College Inquiry]
                                 ▼
 ┌───────────────────────────────────────────────┐
 │ Ollama Query Embedding                        │
 │ Generates dense numeric vector for question   │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Vector Retrieval Service                      │
 │ - In-memory / MongoDB Cosine Similarity       │
 │ - Threshold Filter (similarity >= 0.40)       │
 │ - Rank & Select Top-K chunks (top 4)          │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Grounded Prompt Builder                       │
 │ - Strict context injection                    │
 │ - Negative constraints (No hallucinations)    │
 │ - Fallback directive for missing info         │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ Ollama LLM Generation                         │
 │ Model: llama3.2:3b | Temperature: 0.2         │
 └───────────────────────┬───────────────────────┘
                         │
                         ▼
 ┌───────────────────────────────────────────────┐
 │ API Response to Frontend                      │
 │ {                                             │
 │   message: "B.Tech tuition fee is...",        │
 │   sources: ["FEE STRUCTURE 2024-2025"],      │
 │   intent: "knowledge_retrieval"               │
 │ }                                             │
 └───────────────────────────────────────────────┘
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, React Router 7
- **Backend**: Node.js 24, Express 5, TypeScript
- **Database & Storage**: MongoDB / Mongoose
- **Local AI & RAG Engine**:
  - LLM: [Ollama](https://ollama.com) (`llama3.2:3b`)
  - Embeddings: Ollama (`nomic-embed-text` or `all-minilm`)
  - Vector Similarity: High-performance in-memory Cosine Similarity over MongoDB stored vectors
- **Voice Intelligence**: Vapi AI Outbound Calling API
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing

---

## Engineering Implementation Details

### 1. Document Chunking Pipeline (`document.service.ts`)
- Rather than naive token or fixed-character slicing, the chunker uses **section-aware structural chunking**:
  - Identifies uppercase topic headers (`ABOUT US`, `COURSES OFFERED`, `FEE STRUCTURE 2024-2025`, `ADMISSIONS PROCESS`, `PLACEMENT STATISTICS`, etc.).
  - Partitions content into paragraph chunks (~300–600 characters) preserving full sentence boundaries.
  - Attaches rich metadata: `{ text, source, chunkIndex, section, charCount }`.

### 2. Embedding Generation (`embedding.service.ts`)
- Interfaces with the local Ollama daemon at `http://localhost:11434`.
- Supports the modern `/api/embed` endpoint with automatic fallback to `/api/embeddings`.
- Configurable embedding model via `OLLAMA_EMBEDDING_MODEL` in `.env`.
- Includes health checking (`checkEmbeddingService()`) to verify daemon availability and model readiness.

### 3. Vector Storage & Cosine Similarity (`retrieval.service.ts`)
- **Storage**: Chunks and vectors (`number[]`) persist in MongoDB in the `knowledge_docs` collection via Mongoose `KnowledgeDoc`.
- **Vector Search**: Real-time mathematical cosine similarity calculation:
  $$\text{similarity}(A, B) = \frac{A \cdot B}{\|A\|_2 \|B\|_2}$$
- **Filtering & Ranking**: Filters out chunks below `RAG_MIN_SIMILARITY` (default `0.40`), ranks by descending score, and selects the top `RAG_TOP_K` (default `4`).
- **Caching**: Stored vectors are cached in-memory on the backend for sub-2ms retrieval latency.

### 4. Lightweight Agentic Query Router (`router.service.ts`)
- Deterministic, transparent intent classification prior to executing vector lookups:
  1. `DIRECT_CONVERSATION`: Greetings ("Hi", "Hello there"), identity ("Who are you?"), gratitude ("Thank you") $\rightarrow$ Instant counselor response without DB querying.
  2. `OUT_OF_SCOPE`: Generic requests ("Write a python script", "Capital of France") $\rightarrow$ Polite refusal clarifying institutional scope.
  3. `KNOWLEDGE_RETRIEVAL`: Institutional queries (fees, courses, admissions, hostel, placements) $\rightarrow$ Dispatched to embedding generation and vector search.

### 5. Grounded Prompt & Hallucination Guardrails (`rag.service.ts`)
- Injects strictly the retrieved context chunks into the prompt.
- Enforces strict negative instructions:
  - Answer using ONLY the provided context chunks.
  - Do NOT invent or extrapolate facts, fees, or contact numbers.
  - If context is insufficient, fall back to official admissions contact: `admissions@edureach.edu.in` / `+91 9876543210`.

### 6. Source-Aware Frontend (`ChatDrawer.tsx`)
- Displays clean, clickable source badges below assistant responses (e.g., `📌 Sources: FEE STRUCTURE 2024-2025 · COURSES OFFERED`).
- Preserves quick questions, responsive drawer animations, guest lock screen, and existing theme styles.

---

## Honest Architectural Disclosure

- **Vector Search Engine**: Implemented via Node.js vector cosine similarity ranking over document embeddings stored in MongoDB. It does **not** rely on MongoDB Atlas proprietary Search indexes or external vector databases (Pinecone/Chroma), making it completely portable and self-contained on any MongoDB instance.
- **Agentic Routing**: Implemented via a deterministic, rule-based query classifier. It does **not** introduce unpredictable, multi-turn autonomous loops, guaranteeing low latency, zero prompt token waste on greetings, and 100% predictable interview demonstrations.

---

## Setup & Running Guide

### Prerequisites
1. Node.js >= 20 (Node.js 24 recommended)
2. MongoDB running locally or a MongoDB Atlas URI
3. [Ollama](https://ollama.com) installed

### Step 1: Install Ollama & Pull Models
```bash
# 1. Download and install Ollama from https://ollama.com

# 2. Pull the LLM generation model (Llama 3.2 3B)
ollama pull llama3.2:3b

# 3. Pull the embedding model (Nomic Embed Text)
ollama pull nomic-embed-text

# 4. Ensure Ollama is running
ollama serve
```

### Step 2: Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables (.env)
# Review or update server/.env:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/edureach
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3.2:3b
# OLLAMA_EMBEDDING_MODEL=nomic-embed-text
# RAG_TOP_K=4
# RAG_MIN_SIMILARITY=0.40

# Ingest and embed the knowledge base into MongoDB
npm run ingest

# Run unit tests (verifies chunking, router, and cosine similarity)
npm test

# Start the server
npm run dev
```

### Step 3: Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd edureach-chatbot

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` to explore the portal and chat with EduReach Bot.

---

## API Reference

### Send Message / Ask AI Counselor
- **Endpoint**: `POST /api/chat/message`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "message": "What is the fee for B.Tech CSE and what scholarships are offered?"
}
```

- **Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "message": "For B.Tech Computer Science and Engineering (CSE):\n- Tuition Fee: Rs 1,50,000 per year\n- Lab Fee: Rs 15,000 per year\n- Exam Fee: Rs 5,000 per year\n- Day Scholar Total: Rs 1,70,000 per year\n- Hosteller Total: Rs 2,50,000 per year (including Rs 80,000 hostel & mess)\n\nScholarships Available:\n- Merit Scholarship: 50% tuition waiver for top 10 rankers\n- Need-based Scholarship: Up to 100% fee waiver\n- Sports Scholarship: 25% fee waiver for state/national level athletes\n- SC/ST/OBC fee reimbursement available.",
    "sources": [
      {
        "source": "edureach-knowledge.txt",
        "chunkIndex": 6,
        "section": "FEE STRUCTURE 2024-2025",
        "similarity": 0.842
      }
    ],
    "intent": "knowledge_retrieval"
  }
}
```

---

## Potential Technical Interview Questions & Answers

#### Q1: Why did you implement chunk-level Vector RAG instead of injecting the entire knowledge base file into the LLM prompt?
> **Answer**: Injecting the whole document into every prompt causes:
> 1. **Context Window Exhaustion**: As institutional documentation grows (syllabi, policies, regulations), it quickly exceeds LLM context limits.
> 2. **High Latency & Resource Waste**: Every prompt processes thousands of tokens that are completely irrelevant to the specific question asked.
> 3. **Lost in the Middle Effect**: LLMs often miss details buried in lengthy prompt contexts.
> 
> Vector RAG chunks the document, embeds each chunk, and retrieves only the top 3–4 semantically relevant paragraphs. This ensures fast generation, low memory overhead, and precise grounding.

#### Q2: How does the embedding model differ from the generation model?
> **Answer**:
> - The **embedding model** (`nomic-embed-text`) maps text into a dense mathematical vector space (e.g., 768 dimensions) where semantically similar texts have high cosine similarity. It does not generate text.
> - The **generation model** (`llama3.2:3b`) takes the retrieved textual context and user prompt, synthesizes the facts, and constructs a fluent, natural language answer.

#### Q3: How do you prevent hallucinations in this architecture?
> **Answer**: Hallucination defense is enforced at three levels:
> 1. **Similarity Score Threshold**: If the top retrieved chunks have a similarity score below `RAG_MIN_SIMILARITY` (0.40), the system immediately halts generation and returns a safe fallback message.
> 2. **Negative Constraints in the System Prompt**: The prompt strictly instructs the LLM: *"Answer using ONLY the provided CONTEXT CHUNKS. Do NOT invent facts or extrapolate."*
> 3. **Low Temperature**: Generation temperature is pinned to `0.2`, suppressing creative extrapolation in favor of deterministic factual recall.

#### Q4: Why did you choose a deterministic query router instead of an LLM-based agentic router?
> **Answer**: An LLM-based classifier incurs an additional LLM call (adding 500ms–1500ms of latency and extra compute) just to identify a greeting or trivial greeting. A deterministic regex/rule-based router handles greetings and off-topic queries in less than 1 millisecond with 100% predictable behavior, saving compute exclusively for real knowledge retrieval.

#### Q5: How is vector retrieval computed without an external vector database?
> **Answer**: Document chunks and their high-dimensional embedding vectors are stored in MongoDB. At query time, the query vector is compared against document vectors using the mathematical cosine similarity formula:
> $$\frac{A \cdot B}{\|A\| \|B\|}$$
> Vectors are cached in-memory on the Node.js server, allowing real-time similarity ranking across hundreds of chunks in single-digit milliseconds without requiring additional third-party SaaS infrastructure.
