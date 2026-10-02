import API from "./api";

export interface SourceCitation {
  source: string;
  chunkIndex: number;
  section: string;
  similarity?: number;
}

export interface ChatResponseData {
  message: string;
  sources?: SourceCitation[];
  intent?: "conversational" | "knowledge_retrieval" | "fallback";
  timingMs?: {
    router?: number;
    embedding: number;
    retrieval: number;
    llm: number;
    total: number;
  };
}

export const sendMessage = async (
  message: string,
  mode: "text" | "voice" = "text"
): Promise<ChatResponseData> => {
  const res = await API.post<{ success: boolean; data: ChatResponseData }>("/chat/message", {
    message,
    mode,
  });
  return res.data.data;
};