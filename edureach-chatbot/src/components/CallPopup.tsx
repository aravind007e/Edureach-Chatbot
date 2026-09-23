import { useState, useEffect, useRef } from "react";
import { X, Phone, CheckCircle, AlertCircle, Mic, Radio, Volume2, Square, Send, Headphones } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { initiateCall } from "../services/vapi.service";
import { sendMessage } from "../services/chat.service";
import { vapiFormContent } from "../data/content";

interface CallPopupProps {
  open: boolean;
  onClose: () => void;
}

type CallStatus = "form" | "calling" | "done" | "error" | "webcall";

interface TranscriptMessage {
  sender: "user" | "bot";
  text: string;
}

export default function CallPopup({ open, onClose }: CallPopupProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<CallStatus>("form");
  const [errorMessage, setErrorMessage] = useState("");

  // Web Call states
  const [webcallStatus, setWebcallStatus] = useState<"ringing" | "connected" | "ended">("ringing");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const ringToneRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, thinking]);

  // Clean up Web Call resources on unmount or close
  useEffect(() => {
    return () => {
      cleanupWebCall();
    };
  }, []);

  const cleanupWebCall = () => {
    if (ringToneRef.current) {
      ringToneRef.current.stop();
      ringToneRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleClose = () => {
    cleanupWebCall();
    reset();
    onClose();
  };

  const playRingTone = () => {
    if (!window.AudioContext && !(window as any).webkitAudioContext) return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      let isPlaying = true;

      const playPair = () => {
        if (!isPlaying) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 2);
        osc2.stop(ctx.currentTime + 2);

        setTimeout(playPair, 4000);
      };

      playPair();

      return {
        stop: () => {
          isPlaying = false;
          ctx.close().catch(() => {});
        }
      };
    } catch {
      return null;
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Choose premium female English voice
    const femaleVoice = voices.find(v => 
      (v.name.includes("Google US English") || v.name.includes("Microsoft Zira") || v.name.includes("Natural") || v.name.includes("female")) && v.lang.startsWith("en")
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const startWebCall = () => {
    cleanupWebCall();
    setStatus("webcall");
    setWebcallStatus("ringing");
    setSeconds(0);
    setTranscript([]);
    setThinking(false);

    // Play ringing tone
    ringToneRef.current = playRingTone();

    // Answer call after 3.5 seconds
    setTimeout(() => {
      if (ringToneRef.current) {
        ringToneRef.current.stop();
        ringToneRef.current = null;
      }
      setWebcallStatus("connected");

      // Start call timer
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Intro message from Ava
      const welcome = `Hi ${user?.name?.split(" ")[0] || "there"}, this is Ava from EduReach Admissions. I saw you were interested in ${course || "our courses"} and wanted to know about ${topic || "admissions"}. I'm happy to answer any questions you have!`;
      setTranscript([{ sender: "bot", text: welcome }]);
      speakText(welcome);
    }, 3500);
  };

  const handleWebCallSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || thinking) return;

    setInput("");
    setTranscript((prev) => [...prev, { sender: "user", text: textToSend }]);
    setThinking(true);

    try {
      const chatResponse = await sendMessage(textToSend, "voice");
      setTranscript((prev) => [...prev, { sender: "bot", text: chatResponse.message }]);
      speakText(chatResponse.message);
    } catch {
      const errorMsg = "Sorry, I am having trouble connecting to my knowledge base right now. Could you repeat that?";
      setTranscript((prev) => [...prev, { sender: "bot", text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setThinking(false);
    }
  };

  const endWebCall = () => {
    cleanupWebCall();
    setWebcallStatus("ended");
    toast.success("Call ended successfully");
    setTimeout(() => {
      reset();
    }, 1500);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone || !course || !topic) {
      toast.error("Please fill in all fields");
      return;
    }
    setStatus("calling");
    try {
      await initiateCall({ phone, course, topic });
      setStatus("done");
      toast.success("Call initiated!");
    } catch (err: any) {
      setStatus("error");
      const errMsg = err.response?.data?.message || err.message || "Failed to initiate call.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  const reset = () => {
    setStatus("form");
    setPhone("");
    setCourse("");
    setTopic("");
    setErrorMessage("");
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden relative border border-slate-100 flex flex-col">
        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors duration-200 z-10 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-t-[24px] px-6 py-6 shadow-md flex-shrink-0">
          <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-white/90" />
            Talk to Our AI Counselor
          </h3>
          <p className="text-white/80 text-sm mt-1">Get personalized guidance on courses, admissions & more</p>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* 1. Phone Form */}
          {status === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <input type="text" value={user?.name || ""} readOnly
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-[14px] bg-slate-50 text-slate-550 text-sm cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210"
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 placeholder-slate-500 rounded-[14px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-colors duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Interested Course *</label>
                <select required value={course} onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-[14px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-colors duration-200 bg-white cursor-pointer">
                  <option value="">Select a course</option>
                  {vapiFormContent.courses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">What do you want to know? *</label>
                <select required value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-[14px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-colors duration-200 bg-white cursor-pointer">
                  <option value="">Select a topic</option>
                  {vapiFormContent.topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 rounded-[14px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer h-12 flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> Call Me Now
                </button>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or Speak Instantly</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <button type="button" onClick={startWebCall}
                  className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white py-3.5 rounded-[14px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer h-12 flex items-center justify-center gap-2">
                  <Headphones className="w-4 h-4" /> Start Web Voice Call
                </button>
              </div>
            </form>
          )}

          {/* 2. Ringing/Calling Dial State */}
          {status === "calling" && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-[#7C3AED]/20 animate-ping [animation-duration:1.8s] scale-150" />
                <div className="absolute inset-0 rounded-full bg-[#2563EB]/20 animate-ping [animation-duration:2.2s] scale-125" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center border-4 border-white shadow-xl">
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="font-heading text-2xl font-bold text-slate-800 mb-2">Connecting with Ava...</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-4 leading-relaxed">
                Our AI Admissions Counselor is dialing your number <strong className="text-slate-700">{phone}</strong>.
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 animate-pulse">
                <Radio className="w-4 h-4 text-[#2563EB]" />
                <span>Call Dispatch in Progress</span>
              </div>
            </div>
          )}

          {/* 3. Call Completed successfully */}
          {status === "done" && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto mb-4 animate-bounce" />
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Call Initiated!</h3>
              <p className="text-gray-500 text-sm mb-5">You'll receive a call shortly on {phone}.</p>
              <button onClick={reset} className="text-[#2563EB] font-bold text-sm hover:underline cursor-pointer">Request Another Call</button>
            </div>
          )}

          {/* 4. Vapi API Error Fallback Option */}
          {status === "error" && (
            <div className="text-center py-6 px-4 space-y-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-[#EF4444] border border-red-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-bold text-gray-900">Phone Call Failed</h3>
                <p className="text-red-500 text-xs leading-relaxed max-w-sm mx-auto bg-red-50 border border-red-100 rounded-xl py-3 px-4 text-left font-mono">
                  {errorMessage}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Headphones className="w-4.5 h-4.5 text-[#7C3AED]" /> Try a Web Voice Call instead!
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  You can speak directly to Counselor Ava inside your web browser right now. This uses your microphone and browser speakers, requires no external connection, and has no authorization limits.
                </p>
                <button onClick={startWebCall}
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-[12px] font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm hover:shadow flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" /> Start Web Voice Call
                </button>
              </div>
              <div className="pt-2">
                <button onClick={reset} className="text-slate-400 hover:text-slate-650 text-xs font-semibold hover:underline">
                  Go Back to Form
                </button>
              </div>
            </div>
          )}

          {/* 5. Web Call Voice Assistant Simulator Screen */}
          {status === "webcall" && (
            <div className="flex flex-col h-[480px]">
              {/* Call Status & Avatar Header */}
              <div className="text-center py-4 border-b border-slate-100 flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center mx-auto mb-3 shadow-md">
                  {webcallStatus === "connected" && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-[#7C3AED]/20 animate-ping [animation-duration:2s] scale-125" />
                      <div className="absolute inset-0 rounded-full bg-[#2563EB]/25 animate-ping [animation-duration:1.5s]" />
                    </>
                  )}
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Counselor Ava (Admissions)</h4>
                
                {webcallStatus === "ringing" ? (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider animate-pulse">Ringing...</span>
                  </div>
                ) : webcallStatus === "connected" ? (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
                    <span className="text-xs text-[#22C55E] font-bold uppercase tracking-wider">Connected · {formatTime(seconds)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Call Disconnected</span>
                  </div>
                )}
              </div>

              {/* Call Transcript area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 my-4 rounded-2xl border border-slate-100 max-h-[220px]">
                {transcript.length === 0 && webcallStatus === "ringing" && (
                  <div className="text-center text-slate-400 text-xs pt-12">
                    <p className="animate-pulse">Connecting audio lines...</p>
                  </div>
                )}
                
                {transcript.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#2563EB] text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-150 rounded-tl-none shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-150 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center h-8">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#7C3AED]/40 rounded-full animate-bounce [animation-duration:1s]" />
                        <span className="w-1.5 h-1.5 bg-[#7C3AED]/60 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Interaction Controls */}
              {webcallStatus === "connected" && (
                <div className="space-y-3 flex-shrink-0">
                  {/* Quick question prompts */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <button onClick={() => handleWebCallSend("What are the hostel facilities like?")} disabled={thinking}
                      className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-[#7C3AED]/5 hover:border-[#7C3AED]/35 hover:text-[#7C3AED] cursor-pointer transition-all duration-200 font-semibold">
                      Hostel & Labs?
                    </button>
                    <button onClick={() => handleWebCallSend("Tell me about average placements and salary packages.")} disabled={thinking}
                      className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-[#7C3AED]/5 hover:border-[#7C3AED]/35 hover:text-[#7C3AED] cursor-pointer transition-all duration-200 font-semibold">
                      Salary packages?
                    </button>
                    <button onClick={() => handleWebCallSend("How do I submit the application form?")} disabled={thinking}
                      className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-[#7C3AED]/5 hover:border-[#7C3AED]/35 hover:text-[#7C3AED] cursor-pointer transition-all duration-200 font-semibold">
                      How to apply?
                    </button>
                  </div>

                  {/* Input form */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking}
                      onKeyDown={(e) => e.key === "Enter" && handleWebCallSend()}
                      placeholder="Ask Ava something directly..."
                      className="flex-1 px-2 py-1 placeholder-slate-400 text-slate-800 text-xs focus:outline-none disabled:opacity-50" />
                    <button onClick={() => handleWebCallSend()} disabled={!input.trim() || thinking}
                      className="w-8 h-8 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 disabled:opacity-40">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* End Call Button Footer */}
              <div className="pt-4 mt-auto border-t border-slate-100 flex justify-center flex-shrink-0">
                <button onClick={endWebCall}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5 fill-current" /> End Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}