"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, Send, ChevronDown, Bot, User, FileText, Sparkles, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export function GeminiPromptBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Flash Mendalam");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    if (!textToSend) setInputText("");
    setMessages((prev) => [...prev, { sender: "user", text: query.trim() }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query.trim(),
          currentPath: window.location.pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal menghubungi server AI");
      }

      setMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Mohon maaf, server AI kami saat ini sedang sibuk karena antrean tinggi. Silakan hubungi nomor WhatsApp Sekretaris kami yang tertera di bagian bawah (Footer) untuk bantuan lebih lanjut. Terima kasih!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Bagian Riwayat Percakapan (Muncul jika ada pesan) */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-3xl p-6 shadow-xl space-y-6 max-h-[500px] overflow-y-auto text-sm sm:text-base leading-relaxed"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 items-start ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.sender === "user" ? "bg-blue-600 text-white" : "bg-[#008000] text-white"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div
                  className={`max-w-[85%] px-5 py-4 rounded-3xl shadow-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none font-medium"
                      : "bg-gray-50 text-gray-800 border border-gray-200/60 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-[#008000] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-gray-50 text-gray-800 border border-gray-200/60 px-6 py-4 rounded-3xl rounded-bl-none shadow-sm flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kotak Prompt / Pencarian Minimalis */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white border border-gray-200/90 rounded-full py-3 sm:py-4 px-6 sm:px-8 shadow-2xl shadow-gray-200/60 transition-all duration-300 hover:shadow-gray-300/80 flex items-center gap-4 relative"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Yuk, tulis atau buat sesuatu bersama..."
          className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg text-gray-800 placeholder-gray-500 py-1 font-normal w-full"
        />
        {inputText.trim() && (
          <button
            type="submit"
            disabled={isLoading}
            className="p-2.5 bg-[#008000] hover:bg-[#006600] text-white rounded-full transition-colors shadow-md flex items-center justify-center cursor-pointer disabled:bg-gray-300 shrink-0"
            title="Kirim Pertanyaan"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
}
