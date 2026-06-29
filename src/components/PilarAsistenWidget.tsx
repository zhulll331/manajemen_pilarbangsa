"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Sparkles, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export function PilarAsistenWidget() {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: pathname.includes("/dashboard")
        ? "Halo Pengurus Pilar Bangsa! 🤖 Saya Pilar Asisten siap membantu Anda memonitor Proker, mengecek AD/ART, dan mengelola operasional UKM. Ada yang bisa saya bantu?"
        : "Halo! Selamat datang di portal resmi UKM Pilar Bangsa. 🤖 Saya Pilar Asisten. Ada yang ingin Anda tanyakan seputar organisasi atau pendaftaran?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Otomatis scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
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
          text: `⚠️ Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDashboard = pathname.includes("/dashboard");

  return (
    <div className={`fixed z-50 ${isDashboard ? "bottom-20 right-6" : "bottom-6 right-6"}`}>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-[#008000] hover:bg-[#006600] text-white rounded-full flex items-center justify-center shadow-2xl animate-pulse cursor-pointer group transition-all"
            title="Buka Pilar Asisten AI"
          >
            <Bot className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="chatbox"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-0 sm:right-0 sm:w-[360px] sm:h-[500px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[100000] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#008000] px-4 py-3.5 flex items-center justify-between text-white shadow-md shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">Pilar Asisten</h3>
                  <p className="text-[10px] text-green-100 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" /> AI Co-Pilot UKM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-sm">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 items-end ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-end">
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white text-gray-800 border border-gray-200/80 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer / Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanyakan sesuatu ke Pilar Asisten..."
                className="flex-1 px-4 py-2 text-sm bg-gray-100 focus:bg-white border border-gray-200 focus:border-green-600 rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-[#008000] hover:bg-[#006600] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
