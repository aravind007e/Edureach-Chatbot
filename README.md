# EduReach — RAG-Powered Educational Assistant

EduReach is a full-stack, AI-powered educational assistant designed to provide prospective and enrolled students with instant, accurate, and grounded answers about college admissions, courses, fees, scholarships, placements, faculty, campus facilities, and student life.

The system uses **Vector RAG with lightweight intent-based routing**, combining deterministic query intent classification with dense vector semantic search to retrieve factual institutional documentation before generating responses. This architecture ensures high factual reliability, eliminates hallucinations through strict negative prompt constraints, and maintains single-second local inference latency without unpredictable autonomous loops.

---

## 1. Project Overview

Navigating college websites to find specific details—such as branch-wise tuition fees, hostel expenses, admission criteria, or placement statistics—often involves digging through disparate brochures, static tables, and lengthy circulars.

**EduReach — RAG-Powered Educational Assistant** solves this challenge by serving as an interactive, 24/7 academic counselor. Students can ask natural-language questions in a chat interface or engage via web-based voice conversations. Instead of allowing an LLM to generate answers from general training data, EduReach grounds every answer in an institutional knowledge base using local vector embeddings and localized LLM inference.

### Core Architectural Pillars
- **Vector Retrieval-Augmented Generation (RAG)**: Chunks institutional knowledge, computes dense embeddings, and retrieves the most relevant excerpts based on cosine similarity.
- **Lightweight Intent-Based Routing**: Fast, pattern-based query classification that instantly handles greetings and out-of-scope inquiries without wasting GPU/CPU cycles on vector search or LLM generation.
- **Strict Grounding & Hallucination Prevention**: Prompts are constrained to answer strictly from retrieved knowledge chunks; if the required information is not present, the assistant gracefully falls back to official admissions office contact details.
- **Verifiable Source Citations**: Every retrieved answer references the exact source document and section header (e.g., `FEE STRUCTURE 2024-2025`).
- **Privacy-Preserving Local AI**: Powered by [Ollama](https://ollama.com), running `nomic-embed-text` and `llama3.2:3b` entirely on-premises with zero third-party per-token API costs for LLM inference.

---

## 2. Key Features

- **Accurate Academic Q&A**: Answers queries across B.Tech, M.Tech, and MBA programs, seat matrix, syllabus specializations, eligibility, and counseling quotas.
- **Transparent Fee & Scholarship Breakdown**: Provides line-item breakdowns of tuition, lab fees, exam fees, hostel accommodations, and merit/sports/need-based scholarships.
- **Placement & Recruiter Insights**: Shares verified placement statistics (92% overall placement rate, highest/average packages, participating recruiters like Google, TCS, Infosys, Amazon, Microsoft).
- **Fast Intent Routing**: Resolves greetings, bot identity questions, and out-of-scope topics in `<5ms` via deterministic rule matching.
- **Voice Assistant Layer**: Integrated with Vapi to power natural web-based voice conversations and telephone counseling dispatch.
- **Secure Student Authentication**: User registration and login powered by JSON Web Tokens (JWT) and bcrypt password hashing.
- **Interactive UI/UX**: Clean, responsive frontend featuring an animated slide-out chat drawer, instant starter questions, source badges, and dedicated authentication screens.

---

## 3. System Architecture

### Online Query Flow

```text
User
  │
  ▼
React + TypeScript Frontend
  │  (HTTP POST /api/chat/message)
  ▼
Express REST API
  │
  ▼
Intent-Based Query Router
  ├── [DIRECT_CONVERSATION] ──► Instant Counselor Greeting
  ├── [OUT_OF_SCOPE]         ──► Polite Scope Refusal
  └── [KNOWLEDGE_RETRIEVAL]
        │
        ▼
      Query Embedding (nomic-embed-text via Ollama)
        │
        ▼
      MongoDB Vector Retrieval (Cosine Similarity)
        │
        ▼
      Top-K Relevant Knowledge Chunks
        │
        ▼
      Grounded Prompt (Context Injection + Negative Constraints)
        │
        ▼
      Llama 3.2 via Ollama
        │
        ▼
      AI Response (Answer + Verifiable Source Badges)
```

### Offline / Ingestion Flow

```text
Knowledge Base (edureach-knowledge.txt)
  │
  ▼
Document Chunking (Section-aware, ~300–600 chars, sentence boundaries)
  │
  ▼
nomic-embed-text (Ollama /api/embed)
  │
  ▼
768-dimensional Embeddings
  │
  ▼
MongoDB (knowledge_docs collection)
```

---

## 4. RAG Pipeline

The Retrieval-Augmented Generation pipeline is implemented across dedicated TypeScript backend services:

1. **Section-Aware Chunking (`document.service.ts`)**:
   - Parses `server/knowledge-base/edureach-knowledge.txt`.
   - Recognizes institutional section headers (`ABOUT US`, `COURSES OFFERED`, `FEE STRUCTURE 2024-2025`, `ADMISSIONS PROCESS`, `PLACEMENT STATISTICS 2023-2024`, etc.).
   - Splits content into coherent paragraph chunks (~300–600 characters) preserving sentence boundaries.
   - Attaches rich metadata to each chunk: `{ text, source, chunkIndex, section, charCount }`.

2. **Embedding Generation (`embedding.service.ts`)**:
   - Sends chunk texts to Ollama's `/api/embed` endpoint (with automatic fallback to `/api/embeddings`).
   - Uses `nomic-embed-text` to generate dense 768-dimensional numerical vectors.
   - Features built-in health checking, URL normalization (`localhost` vs `127.0.0.1` IPv4 fallback), and controlled batching to prevent overwhelming system resources.

3. **Storage & Vector Retrieval (`retrieval.service.ts`)**:
   - Stores chunks alongside their 768-dimensional embeddings in MongoDB (`knowledge_docs` collection).
   - Loads and caches chunk vectors in memory on the backend for ultra-low latency.
   - Evaluates mathematical cosine similarity between the query vector $A$ and document vector $B$:
     $$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\|_2 \|B\|_2} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
   - Filters out chunks below `RAG_MIN_SIMILARITY` (default `0.40`), ranks in descending order, and selects the top-K chunks (`RAG_TOP_K`, default `3`–`4`).

4. **Grounded Prompt Construction (`rag.service.ts`)**:
   - Formats retrieved chunks with section identifiers into the prompt.
   - Applies strict negative instructions:
     - *"Answer the user's question accurately using ONLY the CONTEXT CHUNKS below."*
     - *"Do NOT invent facts, numbers, or dates."*
     - *"If the answer is not in the context, reply with the official fallback contact."*

5. **Inference (`llama3.2:3b`)**:
   - Invokes Ollama with `temperature: 0.2`, `num_ctx: 1024`, and `keep_alive: "30m"`.
   - Low temperature suppresses creative hallucination, prioritizing deterministic factual synthesis.

---

## 5. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 7, React Hot Toast |
| **Backend** | Node.js 24, Express 5, TypeScript |
| **Database** | MongoDB, Mongoose 9 |
| **AI Inference** | [Ollama](https://ollama.com) (local runtime) |
| **LLM Generation** | Llama 3.2 3B (`llama3.2:3b`) |
| **Embeddings** | Nomic Embed Text (`nomic-embed-text`, 768 dimensions) |
| **Vector Retrieval**| In-memory mathematical Cosine Similarity over MongoDB stored vectors |
| **Voice Layer** | Vapi integration for web-based voice interaction & outbound calls |
| **Authentication** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`) |

---

## 6. Project Structure

```text
edureach-chatbot/
├── README.md                          # Primary project documentation
├── server/                            # Backend (Node.js + Express + TypeScript)
│   ├── .env.example                   # Environment configuration template
│   ├── package.json                   # Backend dependencies & npm scripts
│   ├── tsconfig.json                  # TypeScript compiler configuration
│   ├── knowledge-base/
│   │   └── edureach-knowledge.txt     # Institutional knowledge base text
│   └── src/
│       ├── server.ts                  # Server entry point & DB connection
│       ├── app.ts                     # Express application configuration & CORS
│       ├── config/
│       │   └── database.config.ts     # Mongoose MongoDB connection
│       ├── controllers/
│       │   ├── auth.controller.ts     # User register, login, session handlers
│       │   ├── chat.controller.ts     # Chat message & RAG query handler
│       │   └── vapi.controller.ts     # Vapi outbound phone call handler
│       ├── middleware/
│       │   ├── auth.middleware.ts     # JWT verification middleware
│       │   └── error-handler.middleware.ts # Global error handler
│       ├── models/
│       │   ├── user.model.ts          # Student user Mongoose schema
│       │   └── knowladge-doc.model.ts # Document chunk & vector Mongoose schema
│       ├── routes/
│       │   ├── auth.routes.ts         # /api/auth routes
│       │   ├── chat.routes.ts         # /api/chat routes
│       │   └── vapi.routes.ts         # /api/vapi routes
│       ├── scripts/
│       │   ├── check-ollama.ts        # Ollama connectivity & model diagnostic tool
│       │   ├── ingest.ts              # Knowledge base chunking & embedding CLI
│       │   └── test-services.ts       # Unit tests for chunking, router & math
│       ├── services/
│       │   ├── document.service.ts    # Section-aware chunking logic
│       │   ├── embedding.service.ts   # Ollama API client for nomic-embed-text
│       │   ├── rag.service.ts         # End-to-end RAG orchestrator & prompt builder
│       │   ├── retrieval.service.ts   # Cosine similarity ranking & vector cache
│       │   ├── router.service.ts      # Deterministic intent-based query router
│       │   └── vapi.service.ts        # Vapi API integration client
│       └── utils/
│           └── helpers.ts             # Shared utility functions
└── edureach-chatbot/                  # Frontend (React 19 + TypeScript + Vite)
    ├── package.json                   # Frontend dependencies & npm scripts
    ├── vite.config.ts                 # Vite bundler configuration
    ├── tsconfig.json                  # TypeScript configuration
    ├── index.html                     # Application HTML entry point
    └── src/
        ├── App.tsx                    # React Router configuration & layouts
        ├── main.tsx                   # React root mount
        ├── components/
        │   ├── ChatDrawer.tsx         # Slide-out RAG chat drawer with source tags
        │   ├── CallPopup.tsx          # Web voice call & phone counselor modal
        │   ├── FloatingChatButton.tsx # Floating trigger button for chat
        │   ├── Navbar.tsx             # Responsive header with auth states
        │   └── ...                    # Landing page presentation sections
        ├── context/
        │   └── AuthContext.tsx        # Authentication React Context provider
        ├── data/
        │   └── content.ts             # Landing page copy, courses, quotes, and links
        ├── pages/
        │   ├── HomePage.tsx           # Main portal landing page
        │   ├── LoginPage.tsx          # Student login page
        │   └── SignUp.tsx             # Student registration page
        └── services/
            ├── api.ts                 # Axios instance with interceptors
            ├── auth.service.ts        # Auth API calls (register, login, getMe)
            ├── chat.service.ts        # Chat API calls
            └── vapi.service.ts        # Call scheduling API calls
```

---

## 7. How It Works

1. **User Submits Query**:
   A student types a question in the `ChatDrawer` (e.g., *"What is the tuition fee for B.Tech AI & DS and what scholarships are offered?"*).
2. **Intent Classification**:
   The backend `router.service.ts` inspects the input:
   - If the query is a simple greeting or identity question (*"Hi"*, *"Who are you?"*), it immediately returns a friendly counseling greeting without invoking embeddings or LLMs.
   - If the query is completely unrelated (*"Write a python script for merge sort"*), it returns an out-of-scope disclaimer explaining that EduReach Bot specializes in college counseling.
   - If the query is institutional, it proceeds to the vector retrieval pipeline.
3. **Query Embedding**:
   `embedding.service.ts` converts the sanitized user query into a 768-dimensional vector via Ollama (`nomic-embed-text`).
4. **Cosine Similarity Retrieval**:
   `retrieval.service.ts` compares the query vector against all indexed chunk vectors in memory, filters out scores below `0.40`, and extracts the top 3–4 chunks.
5. **Prompt Assembly & Guardrails**:
   `rag.service.ts` combines the retrieved chunks into a prompt bounded by negative constraints.
6. **Llama 3.2 Synthesis**:
   Ollama executes local generation using `llama3.2:3b`.
7. **Delivery with Sources**:
   The API responds with the generated answer, timing metrics, and source citations (section name and document source). The frontend displays the answer with clickable source pills.

---

## 8. Authentication

EduReach includes a complete JWT-based authentication system to manage student sessions:

- **Registration (`POST /api/auth/register`)**: Creates student accounts with full name, email, password, and optional phone number. Passwords are automatically hashed using `bcryptjs` with salt rounds.
- **Login (`POST /api/auth/login`)**: Authenticates credentials and returns a signed JSON Web Token (JWT) valid for 7 days.
- **Current User Profile (`GET /api/auth/me`)**: Protected route verifying the `Authorization: Bearer <token>` header to restore student sessions.
- **State Management**: Handled on the frontend via `AuthContext.tsx`, managing login state, user details, and automatic header injection in Axios.

---

## 9. Voice Assistant

Vapi provides the voice conversation layer and connects users to the AI assistant through web-based voice interaction:

- **Web Voice Assistant**: Students can initiate a voice session directly in the browser via `CallPopup.tsx`. It provides real-time speech synthesis and conversational exchanges with Counselor Ava using the RAG backend in `"voice"` mode (returning concise 2-sentence spoken responses).
- **Outbound Telephony Counselor**: Authenticated students can request an outbound phone call. The backend communicates with the Vapi API (`POST https://api.vapi.ai/call`) to dispatch an automated counseling phone call to the student's mobile number, passing personalized context (interested course and inquiry topic).

---

## 10. Installation and Setup

### Prerequisites
1. **Node.js**: Version `>= 20.0.0` (Node.js 24 recommended).
2. **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or a free MongoDB Atlas connection URI.
3. **Ollama**: Download and install from [ollama.com](https://ollama.com).

### Step 1: Install & Launch Ollama Models
Start the Ollama daemon and pull the required models:

```bash
# Start Ollama service
ollama serve

# Pull the LLM generation model (approx 2.0 GB)
ollama pull llama3.2:3b

# Pull the embedding model (768 dimensions, approx 274 MB)
ollama pull nomic-embed-text
```

### Step 2: Backend Installation
Open a terminal and navigate to the `server` directory:

```bash
cd server
npm install
```

Create your `.env` configuration file by copying `.env.example`:

```bash
cp .env.example .env
```

Verify your Ollama installation and embedding models with the diagnostic utility:

```bash
npm run check:ollama
```

### Step 3: Frontend Installation
Open a second terminal and navigate to the `edureach-chatbot` directory:

```bash
cd edureach-chatbot
npm install
```

---

## 11. Environment Variables

Configure `server/.env` based on the following template (placeholders only; never commit real secrets):

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/edureach

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Ollama LLM & Embedding Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# RAG Retrieval Settings
RAG_TOP_K=4
RAG_MIN_SIMILARITY=0.40

# AI Voice Counselor (Vapi)
VAPI_API_KEY=your_vapi_api_key
VAPI_ASSISTANT_ID=your_vapi_assistant_id
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
```

---

## 12. Running the Project

Use the actual scripts configured in each `package.json`:

### Backend Scripts (`server/package.json`)

```bash
# In server/ directory:

# 1. Run Ollama and environment diagnostics
npm run check:ollama

# 2. Ingest and embed the knowledge base into MongoDB
npm run ingest

# 3. Run unit tests (chunking, router, and cosine similarity)
npm test

# 4. Start the backend in development mode (with file watcher)
npm run dev

# 5. Build TypeScript to JavaScript
npm run build

# 6. Start the compiled production server
npm run start
```

### Frontend Scripts (`edureach-chatbot/package.json`)

```bash
# In edureach-chatbot/ directory:

# 1. Start the Vite development server
npm run dev

# 2. Build for production (TypeScript check + Vite bundle)
npm run build

# 3. Preview production build locally
npm run preview

# 4. Run ESLint code checks
npm run lint
```

Once running, access the web portal at `http://localhost:5173` and the backend API at `http://localhost:5000`.

---

## 13. API Overview

All backend endpoints are prefixed with `/api`:

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new student account | No |
| `POST` | `/api/auth/login` | Authenticate student and return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes (`Bearer <token>`) |

#### Sample Registration Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "phone": "+91-9876543210"
}
```

### Chat & Knowledge Retrieval (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Submit a student question to the RAG pipeline | Optional |

#### Sample Request:
```json
{
  "message": "What is the fee structure for B.Tech CSE and what scholarships exist?",
  "mode": "text"
}
```

#### Sample Response:
```json
{
  "success": true,
  "data": {
    "message": "For B.Tech Computer Science and Engineering (CSE):\n- Tuition Fee: Rs 1,50,000 per year\n- Lab Fee: Rs 15,000 per year\n- Exam Fee: Rs 5,000 per year\n- Day Scholar Total: Rs 1,70,000 per year\n- Hosteller Total: Rs 2,50,000 per year (including Rs 80,000 hostel & mess)\n\nScholarships Available:\n- Merit Scholarship: 50% tuition waiver for top 10 rankers\n- Need-based Scholarship: Up to 100% fee waiver\n- Sports Scholarship: 25% fee waiver for state/national athletes\n- SC/ST/OBC government fee reimbursement.",
    "sources": [
      {
        "source": "edureach-knowledge.txt",
        "chunkIndex": 6,
        "section": "FEE STRUCTURE 2024-2025",
        "similarity": 0.842
      }
    ],
    "intent": "knowledge_retrieval",
    "timingMs": {
      "embedding": 142,
      "retrieval": 2,
      "llm": 890,
      "total": 1034
    }
  }
}
```

### Voice Calling (`/api/vapi`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vapi/call` | Dispatch an outbound AI voice counselor call | Yes (`Bearer <token>`) |

---

## 14. RAG Ingestion

The ingestion workflow is responsible for converting unstructured institutional text into structured, queryable vectors:

1. **Document Loading**: Reads the raw text file from `server/knowledge-base/edureach-knowledge.txt`.
2. **Section Chunking**: Detects uppercase topic boundaries and partitions content into paragraph chunks (~300–600 characters) while maintaining sentence integrity.
3. **Embedding Computation**: Calls Ollama's `nomic-embed-text` to generate a 768-dimensional float array for each chunk.
4. **MongoDB Persistence**:
   - Replaces existing documents in the `knowledge_docs` collection to prevent duplicate indexing.
   - Saves chunk text, vector embeddings, and metadata (`source`, `section`, `chunkIndex`, `charCount`).
5. **Execution**:
   Run ingestion manually at any time via:
   ```bash
   npm run ingest
   ```
   *Note: On server startup (`server.ts`), the application checks MongoDB. If `knowledge_docs` is empty and Ollama is available, it automatically triggers initial ingestion.*

---

## 15. Performance / Response Optimization

The EduReach backend employs several optimizations to deliver fast response times on local consumer hardware:

1. **In-Memory Vector Cache**:
   After the initial fetch from MongoDB, all chunk embeddings are cached in server RAM. Computing cosine similarity over hundreds of chunks takes `<2ms`.
2. **Query Embedding Cache (LRU)**:
   Maintains a Least-Recently-Used (LRU) cache of generated query vectors (`MAX_QUERY_CACHE_SIZE = 150`). Identical queries bypass the ~150ms Ollama embedding call entirely.
3. **Response Cache**:
   Stores complete RAG responses with a 10-minute TTL for repeated questions, returning instant responses in `<5ms`.
4. **Deterministic Intent Router**:
   Non-informational queries (greetings, identity, off-topic requests) are resolved immediately via regex patterns, avoiding unnecessary embedding computation and LLM generation.
5. **Ollama Inference Tuning**:
   - `keep_alive: "30m"` keeps the model warm in RAM to eliminate cold-start loading delays.
   - `num_ctx: 1024` limits context evaluation to what is strictly necessary.
   - `num_predict: 200` (or `85` for voice) limits output tokens to concise, focused answers.

---

## 16. Future Improvements

- **Hybrid Search**: Combine dense vector cosine similarity with sparse BM25 keyword search (reciprocal rank fusion) for enhanced precision on exact course codes and acronyms.
- **Cross-Encoder Re-Ranking**: Introduce a lightweight re-ranking step over the top-10 candidate chunks before passing them to the generator.
- **Streaming Responses**: Stream response tokens directly to the frontend chat UI via Server-Sent Events (SSE).
- **Multi-Document Upload**: Admin portal for uploading PDF, DOCX, and CSV circulars with automatic OCR and table parsing.
- **Conversational Memory**: Multi-turn dialogue history tracking within MongoDB sessions while maintaining strict factual grounding.
