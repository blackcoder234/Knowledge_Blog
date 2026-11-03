"use client";

import { useState } from "react";
import { Bot, User as UserIcon, Send, Sparkles } from "lucide-react";

interface CopilotChatTabProps {
  chatMessages: Array<{ role: "user" | "assistant"; content: string }>;
  onSendMessage: (msg: string) => Promise<void>;
  chatLoading: boolean;
  selectedModel: string;
}

export default function CopilotChatTab({
  chatMessages,
  onSendMessage,
  chatLoading,
  selectedModel,
}: CopilotChatTabProps) {
  const [chatInput, setChatInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput;
    setChatInput("");
    onSendMessage(msg);
  };

  const quickPrompts = [
    "Brainstorm 3 contrarian article ideas on Distributed Systems",
    "Draft an introductory section on Quantum Error Correction",
    "Suggest 5 clickbait-free titles for our deep learning category",
    "Summarize recent findings from our arXiv feeds",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            <span>AI Editorial Copilot Chat</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Converse with the configured AI provider to brainstorm angles, draft sections, or discuss complex topics.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          Model: <strong className="text-accent">{selectedModel}</strong>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(p)}
            disabled={chatLoading}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-accent/40 text-[11px] transition-all cursor-pointer disabled:opacity-50"
          >
            ✦ {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 text-xs">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <Bot className="w-10 h-10 text-zinc-700 mb-2" />
            <div className="font-semibold text-zinc-400">Ask the Copilot anything</div>
            <div className="text-[11px] max-w-sm mt-1">
              Brainstorm titles, outline complex architectures, or test contrasting theses against KnowledgeLog editorial standards.
            </div>
          </div>
        ) : (
          chatMessages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  m.role === "user"
                    ? "bg-accent text-black font-bold"
                    : "bg-zinc-800 text-accent border border-white/10"
                }`}
              >
                {m.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent/15 text-white border border-accent/20 rounded-tr-none"
                    : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none font-sans"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {chatLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>AI is generating an editorial response...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask for an outline, contrarian thesis, or research summary..."
          disabled={chatLoading}
          className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || chatLoading}
          className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
