"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, X, Send, Building2, Loader2,
  ChevronDown, Sparkles, RotateCcw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  agent?: string;
}

const SUGGESTED = [
  "What is included in gray structure?",
  "How is steel calculated?",
  "Explain plumbing estimate",
  "What affects labour cost?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Building2 className="w-4 h-4 text-orange-400" />
        </div>
      )}

      <div className={`max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Agent label */}
        {!isUser && msg.agent && (
          <span className="text-xs text-orange-400/70 font-medium px-1">{msg.agent}</span>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-orange-500 text-white rounded-tr-sm"
              : "bg-slate-800 border border-slate-700/60 text-slate-100 rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-slate-300">
          You
        </div>
      )}
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm BuildCost AI Assistant 👋\n\nI can help you with construction cost questions, material estimates, building advice, and more. What would you like to know?",
      agent: "Construction Expert Agent",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = () => { setOpen(true); setMinimized(false); };
    window.addEventListener("open-chatbot", handler);
    return () => window.removeEventListener("open-chatbot", handler);
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMsgs.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.detail || data.error || "Something went wrong. Please try again.",
            agent: "System",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, agent: data.agent },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not reach the backend. Please make sure the server is running.",
          agent: "System",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        agent: "Construction Expert Agent",
      },
    ]);
  };

  return (
    <>
      {/* ── Chat Panel ────────────────────────────────────── */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 transition-all duration-300 ${
            minimized ? "w-80 h-14" : "w-96 h-[580px]"
          }`}
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 rounded-t-2xl bg-slate-900/80 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">BuildCost AI</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${minimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => { setOpen(false); setMinimized(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* ── Suggested Questions ── */}
              {messages.length <= 1 && !loading && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-slate-800 hover:bg-orange-500/10 border border-slate-700 hover:border-orange-500/40 text-slate-300 hover:text-orange-300 px-3 py-1.5 rounded-full transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div className="px-3 pb-3 pt-2 border-t border-slate-800 flex-shrink-0">
                <div className="flex items-end gap-2 bg-slate-900 border border-slate-700 focus-within:border-orange-500/60 rounded-xl px-3 py-2 transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about construction…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none min-h-[24px] max-h-[100px] leading-relaxed disabled:opacity-60"
                    style={{ height: "24px" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 text-center mt-1.5">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
