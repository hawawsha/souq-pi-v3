"use client";
import { useState } from "react";

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "أهلاً بك في Hawawsheh Store! كيف أقدر أساعدك اليوم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || data.response || "عذراً، حدث خطأ في الرد." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "تعذر الاتصال بالمساعد حالياً." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-50 font-sans">
      {isOpen ? (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col">
          {/* رأس النافذة */}
          <div className="bg-purple-700 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-bold text-sm">مساعد Hawawsheh الذكي</span>
            <button onClick={() => setIsOpen(false)} className="text-white font-bold">✕</button>
          </div>

          {/* الرسائل */}
          <div className="p-3 h-64 overflow-y-auto space-y-2 bg-gray-50 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-xl max-w-[85%] ${
                  m.role === "user"
                    ? "bg-purple-600 text-white mr-auto"
                    : "bg-white text-gray-800 border border-gray-200 ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">جاري الكتابة...</div>}
          </div>

          {/* حقل الإدخال */}
          <div className="p-2 border-t bg-white flex gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-600"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              إرسال
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2"
        >
          <span>💬 مساعد المتجر</span>
        </button>
      )}
    </div>
  );
}
