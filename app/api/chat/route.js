"use client";

import { useEffect, useRef, useState } from "react";

function AiSparkIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M12 2.5L14.2 8.8L20.5 11L14.2 13.2L12 19.5L9.8 13.2L3.5 11L9.8 8.8L12 2.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M18.8 15.5L19.8 18.2L22.5 19.2L19.8 20.2L18.8 22.9L17.8 20.2L15.1 19.2L17.8 18.2L18.8 15.5Z"
        fill="#BFDBFE"
      />
    </svg>
  );
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "أهلاً بك في Hawawsheh Store ✨\nيسعدني مساعدتك في العثور على المنتجات ومعرفة الأسعار والتفاصيل. كيف يمكنني مساعدتك؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [messages, loading, isOpen]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.message || data?.error || `خطأ من الخادم (${res.status})`;
        throw new Error(errMsg);
      }

      const reply =
        typeof data?.reply === "string"
          ? data.reply
          : typeof data?.response === "string"
          ? data.response
          : "";

      if (!reply.trim()) {
        throw new Error("لم يتم استلام نص من النموذج");
      }

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (error) {
      console.error("ChatAgent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `⚠️ ${error?.message || "تعذر إتمام الطلب"}`,
        },
      ]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        fontFamily: "'Tajawal', 'Almarai', sans-serif",
      }}
    >
      {isOpen && (
        <section
          role="dialog"
          aria-label="مساعد Hawawsheh Store الذكي"
          style={{
            position: "absolute",
            bottom: "68px",
            right: "0px",
            width: "min(360px, calc(100vw - 40px))",
            height: "min(480px, calc(100dvh - 110px))",
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            border: "1px solid #E0E7FF",
            boxShadow: "0 20px 45px rgba(30, 27, 75, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* رأس النافذة */}
          <header
            style={{
              background: "linear-gradient(135deg, #6B21A8 0%, #4338CA 55%, #2563EB 100%)",
              color: "#FFFFFF",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AiSparkIcon size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  مساعد Hawawsheh الذكي
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#DBEAFE",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  مساعدك للتسوق والاستفسارات
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق المحادثة"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </header>

          {/* منطقة الرسائل */}
          <div
            aria-live="polite"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "14px",
              background: "linear-gradient(180deg, #F5F3FF 0%, #F8FAFC 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "84%",
                      padding: "10px 13px",
                      borderRadius: isUser
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      background: isUser
                        ? "linear-gradient(135deg, #7E22CE 0%, #4F46E5 100%)"
                        : "#FFFFFF",
                      color: isUser ? "#FFFFFF" : "#1E293B",
                      border: isUser ? "none" : "1px solid #E2E8F0",
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                      fontSize: "13px",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "18px 18px 18px 4px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    color: "#4F46E5",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  جاري البحث والكتابة...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* شريط الكتابة */}
          <form
            onSubmit={sendMessage}
            style={{
              padding: "10px 12px",
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              aria-label="اكتب رسالتك للمساعد"
              autoComplete="off"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 12px",
                fontSize: "13px",
                color: "#0F172A",
                backgroundColor: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "10px 14px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #6B21A8 0%, #2563EB 100%)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.45 : 1,
                flexShrink: 0,
              }}
            >
              إرسال
            </button>
          </form>
        </section>
      )}

      {/* زر فتح المساعد الدائري */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"}
        aria-expanded={isOpen}
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #6B21A8 0%, #4F46E5 55%, #2563EB 100%)",
          color: "#FFFFFF",
          border: "2px solid #FFFFFF",
          boxShadow: "0 10px 25px rgba(79, 70, 229, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: "24px", lineHeight: 1 }}>×</span>
        ) : (
          <AiSparkIcon size={24} />
        )}
      </button>
    </div>
  );
}
