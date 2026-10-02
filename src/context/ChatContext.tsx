import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { sendMessage, type SourceCitation } from "../services/chat.service";

export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  sources?: SourceCitation[];
  isError?: boolean;
  failedQuery?: string;
}

interface ChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  messages: Message[];
  sending: boolean;
  sendUserMessage: (text: string) => Promise<void>;
  retryMessage: (failedQuery?: string) => Promise<void>;
  resetChat: (userName?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, userName }: { children: ReactNode; userName?: string }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  // Initialize or update welcome message when user logs in/out
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: `Hi ${userName || "there"}! I'm EduReach Bot, your AI academic counselor. Ask me anything about courses, fees, admissions, scholarships, placements, or campus life.`,
        sender: "bot",
      },
    ]);
  }, [userName]);

  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = { id: Date.now(), text: trimmed, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const data = await sendMessage(trimmed);
      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.message,
        sender: "bot",
        sources: data.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const serverErrMsg = err?.response?.data?.message;
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: serverErrMsg || "Sorry, something went wrong while connecting to the AI counselor. Please check your connection or try again.",
        sender: "bot",
        isError: true,
        failedQuery: trimmed,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (failedQuery?: string) => {
    if (sending) return;
    const query = failedQuery || [...messages].reverse().find((m) => m.failedQuery)?.failedQuery;
    if (query) {
      await sendUserMessage(query);
    }
  };

  const resetChat = (name?: string) => {
    setMessages([
      {
        id: Date.now(),
        text: `Hi ${name || "there"}! I'm EduReach Bot, your AI academic counselor. Ask me anything about courses, fees, admissions, scholarships, placements, or campus life.`,
        sender: "bot",
      },
    ]);
  };

  return (
    <ChatContext.Provider value={{ chatOpen, setChatOpen, messages, sending, sendUserMessage, retryMessage, resetChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
