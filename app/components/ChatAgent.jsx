
"use client";

import { useEffect, useRef, useState } from "react";

function AiSparkIcon({ className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.5L14.2 8.8L20.5 11L14.2 13.2L12 19.5L9.8 13.2L3.5 11L9.8 8.8L12 2.5Z"
        fill="white"
      />
      <path
        d="M18.8 15.5L19.8 18.2L22.5 19.2L19.8 20.2L18.8 22.9L17.8 20.2L15.1 19.2L17.8 18.2Z"
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

  // تمرير الرسائل إلى الأسفل
  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, loading, isOpen]);

  // التركيز على حقل الكتابة عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  // إرسال الرسالة
  const sendMessage = async (e) => {
    e?.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error("chat_request_failed");
      }

      const reply =
        typeof data?.reply === "string"
          ? data.reply
          : typeof data?.response === "string"
          ? data.response
          : "";

      if (!reply.trim()) {
        throw new Error("empty_response");
      }

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: reply },
      ]);
    } catch (error) {
      console.error("ChatAgent error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "عذراً، لم أتمكن من معالجة طلبك حالياً. يرجى المحاولة مرة أخرى بعد قليل.",
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
      className="fixed bottom-5 right-5 z-[60]"
      style={{
        fontFamily: "'Tajawal', 'Almarai', sans-serif",
      }}
    >
      {isOpen && (
        <section
          role="dialog"
          aria-label="مساعد Hawawsheh Store الذكي"
          className="
            absolute bottom-16 right-0
            flex flex-col
            w-[calc(100vw-2rem)] sm:w-[380px]
            h-[min(560px,calc(100dvh-7rem))]
            max-h-[calc(100dvh-7rem)]
            overflow-hidden
            rounded-3xl
            border border-indigo-100
            bg-white
            shadow-2xl
            animate-in fade-in slide-in-from-bottom-3
            duration-200
          "
        >
          {/* رأس المحادثة */}
          <header className="
            shrink-0
            flex items-center justify-between
            px-4 py-4
            text-white
            bg-gradient-to-l from-purple-800 via-indigo-700 to-blue-600
          ">
            <div className="flex items-center gap-3">
              <div className="
                flex items-center justify-center
                w-11 h-11
                rounded-2xl
                bg-white/15
                border border-white/20
              ">
                <AiSparkIcon className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-sm">
                  مساعد Hawawsheh الذكي
                </h3>

                <p className="text-[11px] text-blue-100 mt-1">
                  مساعدك للتسوق والإجابة عن استفساراتك
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق المحادثة"
              className="
                w-9 h-9 rounded-full
                flex items-center justify-center
                bg-white/15 hover:bg-white/25
                transition
                text-lg
              "
            >
              ×
            </button>
          </header>

          {/* الرسائل */}
          <div
            className="
              flex-1 min-h-0
              overflow-y-auto
              overscroll-contain
              p-4 space-y-3
              bg-gradient-to-b
              from-indigo-50/50 to-slate-50
            "
            aria-live="polite"
          >
            <div className="text-center text-[10px] text-slate-400 py-1">
              مرحباً بك في عالم Hawawsheh Store
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user"
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`
                    max-w-[85%]
                    px-4 py-3
                    rounded-2xl
                    text-[13px]
                    leading-relaxed
                    whitespace-pre-wrap
                    break-words
                    ${
                      m.role === "user"
                        ? "bg-gradient-to-l from-purple-700 to-indigo-600 text-white rounded-br-sm shadow-sm"
                        : "bg-white text-slate-800 border border-indigo-100 rounded-bl-sm shadow-sm"
                    }
                  `}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* مؤشر التفكير */}
            {loading && (
              <div className="flex justify-end">
                <div className="
                  flex items-center gap-1.5
                  px-4 py-3
                  bg-white
                  border border-indigo-100
                  rounded-2xl rounded-bl-sm
                  shadow-sm
                ">
                  <span className="text-[11px] text-slate-500 ml-1">
                    يكتب الآن
                  </span>

                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="
                        w-1.5 h-1.5
                        rounded-full
                        bg-indigo-600
                        animate-bounce
                      "
                      style={{
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* منطقة الكتابة */}
          <form
            onSubmit={sendMessage}
            className="
              shrink-0
              p-3
              bg-white
              border-t border-indigo-100
            "
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                aria-label="اكتب رسالتك للمساعد"
                autoComplete="off"
                disabled={loading}
                className="
                  flex-1 min-w-0
                  px-4 py-3
                  text-[13px]
                  text-slate-800
                  bg-slate-50
                  border border-slate-200
                  rounded-2xl
                  outline-none
                  focus:border-indigo-500
                  focus:bg-white
                  transition
                  disabled:opacity-60
                "
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="
                  px-4 py-3
                  rounded-2xl
                  text-white text-xs font-bold
                  bg-gradient-to-l from-purple-700 to-blue-600
                  hover:brightness-110
                  disabled:opacity-40
                  transition
                  shrink-0
                "
              >
                إرسال
              </button>
            </div>

            <p className="
              text-center
              text-[10px]
              text-slate-400
              mt-2
            ">
              Hawawsheh Store · مساعدك الذكي
            </p>
          </form>
        </section>
      )}

      {/* زر فتح المساعد */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          isOpen ? "إغلاق المساعد الذكي" : "فتح المساعد الذكي"
        }
        aria-expanded={isOpen}
        className="
          relative
          w-14 h-14
          rounded-full
          flex items-center justify-center
          bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-500
          text-white
          border-2 border-white
          shadow-xl
          hover:scale-105
          hover:brightness-110
          active:scale-95
          transition
        "
      >
        {isOpen ? (
          <span className="text-2xl font-light">×</span>
        ) : (
          <>
            <AiSparkIcon className="w-7 h-7" />
            <span className="
              absolute top-0 right-0
              w-3.5 h-3.5
              rounded-full
              bg-emerald-400
              border-2 border-white
            " />
          </>
        )}
      </button>
    </div>
  );
}
