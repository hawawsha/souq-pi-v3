
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error) =>
  Number(error?.status || error?.statusCode || 0);

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "اكتب سؤالك أولاً." },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, message: "الرسالة طويلة جداً." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return NextResponse.json(
        {
          success: false,
          message: "خدمة المساعد غير مهيأة حالياً.",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    // جلب منتجات المتجر
    let productsContext = "";

    try {
      const origin = new URL(request.url).origin;

      const prodRes = await fetch(
        `${origin}/api/products`,
        { cache: "no-store" }
      );

      if (prodRes.ok) {
        const prodData = await prodRes.json();

        const products = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.products)
          ? prodData.products
          : [];

        if (products.length > 0) {
          productsContext =
            "\n\nمنتجات المتجر الحالية:\n" +
            products.slice(0, 50).map((p) => {
              return `المنتج: ${p.name || p.title || "غير محدد"}
السعر: ${p.price ?? "غير محدد"} Pi
الفئة: ${p.category || "عام"}
المخزون: ${p.stock ?? "غير محدد"}`;
            }).join("\n\n");
        }
      } else {
        console.error(
          "Products API returned:",
          prodRes.status
        );
      }
    } catch (error) {
      console.error("Products fetch error:", error);
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
أنت المساعد الذكي الرسمي لمتجر Hawawsheh Store.

مهامك:
- مساعدة العملاء في العثور على المنتجات.
- الإجابة عن الأسعار والتفاصيل.
- البحث ضمن المنتجات الموجودة في قائمة المتجر.
- الرد باللغة العربية بأسلوب ودود واحترافي.
- الاختصار والتنظيم في الإجابات.

قواعد مهمة:
- جميع الأسعار في المتجر بعملة Pi.
- لا تخترع منتجات أو أسعاراً أو معلومات عن المخزون.
- إذا لم تجد المنتج في القائمة، أخبر العميل بذلك.
- لا تؤكد وجود منتج غير موجود في البيانات.

${productsContext}
`;

    let response;
    let lastError;

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        lastError = null;
        break;

      } catch (error) {
        lastError = error;

        const status = getErrorStatus(error);

        const retryable = [
          429, 500, 502, 503, 504
        ].includes(status);

        console.error(
          `Gemini attempt ${attempt} failed:`,
          status,
          error?.message
        );

        if (!retryable || attempt === maxAttempts) {
          throw error;
        }

        await sleep(1000 * attempt);
      }
    }

    if (lastError || !response) {
      throw lastError || new Error("No Gemini response");
    }

    const reply =
      typeof response.text === "string"
        ? response.text.trim()
        : "";

    if (!reply) {
      throw new Error("Gemini returned an empty response");
    }

    return NextResponse.json({
      success: true,
      reply,
    });

  } catch (error) {
    console.error("Hawawsheh Chat API Error:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    return NextResponse.json(
      {
        success: false,
        message:
          "عذراً، خدمة المساعد تواجه مشكلة مؤقتة. حاول مرة أخرى.",
        code: "CHAT_SERVICE_ERROR",
      },
      { status: 500 }
    );
  }
}
