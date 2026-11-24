import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "الرسالة مطلوبة" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "مفتاح GEMINI_API_KEY غير موجود في إعدادات Vercel",
        },
        { status: 500 }
      );
    }

    // محاولة جلب المنتجات من المتجر ليعرف المساعد الأسعار والتفاصيل
    let productsContext = "";
    try {
      const origin = new URL(request.url).origin;
      const prodRes = await fetch(`${origin}/api/products`, {
        cache: "no-store",
      });

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const list = Array.isArray(prodData)
          ? prodData
          : prodData?.products || [];

        if (list.length > 0) {
          productsContext =
            "\nقائمة المنتجات المتوفرة حالياً في المتجر:\n" +
            list
              .map(
                (p) =>
                  `- ${p.name || p.title}: السعر ${p.price} Pi (${p.category || "عام"})`
              )
              .join("\n");
        }
      }
    } catch {
      // في حال عدم توفر مسار المنتجات يكمل المساعد بشكل طبيعي
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `أنت المساعد الذكي لمتجر Hawawsheh Store. أجب باللغة العربية بأسلوب ودود ومختصر ومنظم. ساعد الزبائن في البحث عن المنتجات ومعرفة أسعارها بعملة Pi.${productsContext}`,
      },
    });

    const replyText = response?.text?.trim();

    if (!replyText) {
      return NextResponse.json(
        { success: false, message: "لم يتم استلام نص من نموذج Gemini" },
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
      {
        success: false,
        message: error?.message || "حدث خطأ غير متوقع في الخادم",
      },
      { status: 500 }
    );
  }
}
