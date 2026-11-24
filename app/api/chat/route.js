import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "الرسالة مطلوبة" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "مفتاح GEMINI_API_KEY غير مضبوط" },
        { status: 500 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction:
          "أنت المساعد الذكي لمتجر Hawawsheh Store. أجب باللغة العربية بأسلوب ودود ومختصر ومنظم، وساعد الزبائن في الاستفسارات والمنتجات والتسوق بوضوح.",
      },
    });

    const replyText = response?.text?.trim();

    if (!replyText) {
      return NextResponse.json(
        { success: false, message: "لم يتم استلام نص من النموذج" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء التواصل مع المساعد الذكي" },
      { status: 500 }
    );
  }
}
