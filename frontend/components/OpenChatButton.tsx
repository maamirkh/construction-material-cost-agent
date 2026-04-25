"use client";

import { MessageSquare } from "lucide-react";

export default function OpenChatButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-chatbot"));
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 border border-slate-700 hover:border-orange-500/60 text-slate-300 hover:text-orange-400 px-3 py-2 rounded-lg text-sm font-medium transition-all"
    >
      <MessageSquare className="w-4 h-4" />
      AI Assistant
    </button>
  );
}
