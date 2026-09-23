import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Send, Sparkles, User, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const quickQuestions = [
  "What courses do you offer?",
  "Tell me about placements",
  "What is the fee structure?",
  "How to apply for admissions?",
];

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { user } = useAuth();
  const { messages, sending, sendUserMessage } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || sending) return;

    setInput("");
    await sendUserMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  // Locked screen for guest users
  if (!user) {
    return (
      <div className="fixed top-0 right-0 h-screen w-[420px] max-w-[calc(100vw-2rem)] z-[100] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-150 transform transition-all duration-300">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between text-[#0F172A] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/15">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">EduReach AI Assistant</h3>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Lock Screen Body */}
        <div className="flex-1 bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/20 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="font-heading text-xl font-bold text-[#0F172A]">AI Assistant is Locked</h4>
            <p className="text-[#475569] text-sm leading-relaxed max-w-xs mx-auto">
              Please sign in or create a free student account to ask questions about admissions, placements, and campus life.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[240px] pt-2">
            <Link to="/login" onClick={onClose} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 rounded-[14px] font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 text-center cursor-pointer">
              Sign In
            </Link>
            <Link to="/signup" onClick={onClose} className="bg-white border border-slate-200 hover:border-[#2563EB] text-[#475569] hover:text-[#2563EB] py-3.5 rounded-[14px] font-semibold text-sm transition-all duration-200 text-center cursor-pointer">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-screen w-[420px] max-w-[calc(100vw-2rem)] z-[100] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-150 transform transition-all duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between text-[#0F172A] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/15">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">EduReach AI Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
              </span>
              <span className="text-[10.5px] text-[#475569] font-medium">Online · Active guidance</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-[#475569] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && (
              <div className="w-7 h-7 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-3 rounded-[16px] text-sm leading-relaxed font-normal shadow-sm ${
              msg.sender === "user"
                ? "bg-[#2563EB] text-white rounded-tr-none"
                : "bg-white text-[#0F172A] border border-slate-150 rounded-tl-none"
            }`}>
              <div className="whitespace-pre-line">{msg.text}</div>
              {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-slate-400">Sources:</span>
                  {Array.from(new Set(msg.sources.map((s) => s.section || s.source))).map((sec, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-full border border-blue-100"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {msg.sender === "user" && (
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 text-[#475569] shadow-sm border border-slate-200">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-150 px-4 py-3 rounded-[16px] rounded-tl-none shadow-sm flex items-center h-10">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#2563EB]/40 rounded-full animate-bounce [animation-duration:1s]" />
                <span className="w-2 h-2 bg-[#2563EB]/60 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions & Suggestion Box */}
      {messages.length === 1 && (
        <div className="px-5 py-4 bg-white border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" /> Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button key={q} onClick={() => handleSend(q)}
                className="text-xs px-3.5 py-2 bg-white border border-slate-200 text-[#475569] rounded-[12px] hover:bg-[#2563EB]/5 hover:border-[#2563EB]/30 hover:text-[#2563EB] transition-all duration-200 cursor-pointer shadow-sm font-semibold">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white border-t border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask anything about admissions, courses, placements..." disabled={sending}
            className="flex-1 px-4 py-3 border border-slate-200 placeholder-slate-400 text-[#0F172A] rounded-[14px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-sm disabled:opacity-50 transition-colors duration-200 bg-slate-50/50" />
          <button onClick={() => handleSend()} disabled={!input.trim() || sending}
            className="w-11 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] hover:scale-105 text-white rounded-full flex items-center justify-center disabled:opacity-50 cursor-pointer active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}