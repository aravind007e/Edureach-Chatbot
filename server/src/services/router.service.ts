// =======================================================
// EduReach — Lightweight Agentic Query Router
// Deterministic intent classifier that directs queries to
// direct conversation, vector RAG retrieval, or out-of-scope fallback.
// =======================================================

export type QueryIntent = "DIRECT_CONVERSATION" | "KNOWLEDGE_RETRIEVAL" | "OUT_OF_SCOPE";

export interface RoutingDecision {
  intent: QueryIntent;
  directResponse?: string;
  reasoning: string;
  cleanQuery: string;
}

const GREETINGS_PATTERN =
  /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy|sup)(\s+(there|bot|counselor|ava|edureach))?[\s!.,?]*$/i;

const BOT_IDENTITY_PATTERN =
  /^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|help|tell\s+me\s+about\s+yourself)[\s!.,?]*$/i;

const GRATITUDE_OR_FAREWELL_PATTERN =
  /^(thanks|thank\s+you|thx|bye|goodbye|see\s+you|exit|quit)[\s!.,?]*$/i;

const OUT_OF_SCOPE_PATTERN =
  /(write\s+(a\s+)?(python|javascript|code|script|poem|essay)|recipe\s+for|capital\s+of|weather\s+in|who\s+won\s+the\s+world\s+cup|solve\s+this\s+math|movie\s+recommendation)/i;

/**
 * Strips prompt hints or trailing parentheticals added by voice callers
 * such as "(Respond in a friendly, conversational spoken tone)".
 */
export const sanitizeQuery = (query: string): string => {
  return query
    .replace(/\s*\([^)]*(spoken|tone|voice|concise|friendly)[^)]*\)\s*$/gi, "")
    .trim();
};

/**
 * Routes user queries into appropriate action pipelines.
 */
export const routeUserQuery = (query: string, isVoice = false): RoutingDecision => {
  const clean = sanitizeQuery(query);
  const normalized = clean.toLowerCase();

  // 1. Direct Greetings
  if (GREETINGS_PATTERN.test(normalized)) {
    const greetingText = isVoice
      ? "Hello! I am Ava, your AI admissions counselor for EduReach College. How can I help you today?"
      : "Hello! I am EduReach Bot, your AI academic counselor for EduReach College. I can help you with admissions, course details, fee structures, scholarships, placements, campus facilities, and faculty information. How can I assist you today?";

    return {
      intent: "DIRECT_CONVERSATION",
      directResponse: greetingText,
      reasoning: "Matched greeting pattern — returned instant counselor welcome.",
      cleanQuery: clean,
    };
  }

  // 2. Identity and Capability Questions
  if (BOT_IDENTITY_PATTERN.test(normalized)) {
    const identityText = isVoice
      ? "I am Ava, the AI counselor for EduReach College. I can answer all your questions about our B.Tech, M.Tech, and MBA programs, admissions, tuition fees, hostels, and placements. What would you like to ask?"
      : "I am EduReach Bot, an AI counselor designed for EduReach College, Hyderabad. I provide accurate, grounded answers regarding:\n- Academic courses (B.Tech, M.Tech, MBA)\n- Admission processes & eligibility\n- Tuition & hostel fee structures\n- Scholarships and financial aid\n- Placement statistics & top recruiting companies\n- Campus facilities, clubs, and fests\n\nWhat would you like to know?";

    return {
      intent: "DIRECT_CONVERSATION",
      directResponse: identityText,
      reasoning: "Matched identity query — returned overview of capabilities without DB search.",
      cleanQuery: clean,
    };
  }

  // 3. Gratitude or Farewell
  if (GRATITUDE_OR_FAREWELL_PATTERN.test(normalized)) {
    return {
      intent: "DIRECT_CONVERSATION",
      directResponse:
        "You're welcome! Feel free to ask if you have any more questions about EduReach College. Have a wonderful day!",
      reasoning: "Matched gratitude/farewell pattern — returned polite conversational sign-off.",
      cleanQuery: clean,
    };
  }

  // 4. Memory or Chat History Queries
  if (normalized.includes("what did i ask") || normalized.includes("previous question")) {
    return {
      intent: "DIRECT_CONVERSATION",
      directResponse:
        "You can view our recent conversation right here in the chat drawer. I answer each query using our official EduReach knowledge base.",
      reasoning: "Matched session memory inquiry.",
      cleanQuery: clean,
    };
  }

  // 5. Explicitly Out-of-Scope non-college queries
  if (OUT_OF_SCOPE_PATTERN.test(normalized)) {
    return {
      intent: "OUT_OF_SCOPE",
      directResponse:
        "I specialize strictly in EduReach College academic counseling (admissions, courses, fees, campus facilities, and placements). I cannot assist with external topics or coding tasks. Please ask anything regarding EduReach College!",
      reasoning: "Detected off-topic or general knowledge prompt out of institutional scope.",
      cleanQuery: clean,
    };
  }

  // 6. Default to Knowledge-base Retrieval (RAG)
  return {
    intent: "KNOWLEDGE_RETRIEVAL",
    reasoning: "College inquiry routed to vector embedding similarity retrieval.",
    cleanQuery: clean,
  };
};
