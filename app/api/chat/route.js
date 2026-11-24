
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const PRODUCT_FETCH_TIMEOUT = 8000;
const GEMINI_TIMEOUT = 18000;

// استخراج حالة الخطأ من رد Google
function getErrorStatus(error) {
  const message = String(error?.message || "");

  return (
    Number(error?.status || error?.code) ||
    Number(message.match(/\b(429|500|502|503|504|404)\b/)?.[0]) ||
    0
  );
}

// التحقق من إمكانية الانتقال إلى نموذج آخر
function shouldTryFallback(error) {
  const status = getErrorStatus(error);

  return (
    status === 0 ||
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

// جلب المنتجات من قاعدة بيانات المتجر
async function getProductsContext(request) {
  try {
    const origin = new URL(request.url).origin;

    const response = await fetch(`${origin}/api/products`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(PRODUCT_FETCH_TIMEOUT),
    });

    if (!response.ok) {
      console.error("Products API failed:", response.status);
      return "";
    }

    const data = await response.json();

    const products = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data?.products)
      ? data.data.products
      : [];

    if (!products.length) {
      return "\nلا توجد منتجات متاحة حالياً في قائمة المنتجات.";
    }

    const availableProducts = products
      .filter((product) => {
        if (product.status === "inactive") return false;
        return true;
      })
      .slice(0, 40);

    const productLines = availableProducts.map((product, index) => {
      const name = product.name || product.title || "منتج بدون اسم";
      const price = product.price ?? "غير محدد";
      const category = product.category || "عام";
      const description = String(product.description || "").slice(0, 300);
      const stock = product.stock ?? "غير محدد";

      return [
        `${index + 1}. ${name}`,
        `السعر: ${price} Pi`,
        `القسم: ${category}`,
        `المخزون: ${stock}`,
        description ? `التفاصيل: ${description}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    });

    return `
قائمة المنتجات الحالية في Hawawsheh Store:
${productLines.join("\n")}
`;
  } catch (error) {
    console.error("Products loading error:", error.message);
    return "\nتعذر تحميل قائمة المنتجات حالياً.";
  }
}

export async function POST(request) {
  try {
    // قراءة الرسالة
    const body = await request.json().catch(() => ({}));

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "الرجاء كتابة سؤالك أولاً.",
        },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "الرسالة طويلة جداً. الرجاء اختصار سؤالك.",
        },
        { status: 400 }
      );
    }

    // التحقق من مفتاح Gemini
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return NextResponse.json(
        {
          success: false,
          error: "إعدادات المساعد الذكي غير مكتملة.",
        },
        { status: 500 }
      );
    }

    // تحميل منتجات المتجر
    const productsContext = await getProductsContext(request);

    // إنشاء تعليمات المساعد
    const systemInstruction = `
أنت المساعد الذكي الرسمي لمتجر Hawawsheh Store.

مهمتك:
- مساعدة الزبائن في البحث عن المنتجات.
- الإجابة عن أسئلة الأسعار والمواصفات.
- توضيح تفاصيل المنتجات المتوفرة.
- مساعدة الزبائن في اختيار المنتج المناسب.

قواعد مهمة جداً:

1. تحدث باللغة العربية دائماً، بأسلوب ودود واحترافي.
2. استخدم عملة Pi عند ذكر الأسعار.
3. اعتمد على قائمة المنتجات الموجودة في الأسفل.
4. لا تخترع منتجات أو أسعاراً أو مواصفات غير موجودة.
5. إذا طلب الزبون هاتفاً، ابحث في المنتجات عن الهواتف الموجودة فعلياً.
6. إذا لم تجد المنتج المطلوب، أخبر الزبون بأنه غير موجود حالياً.
7. لا تدّعِ أنك نفذت عملية شراء أو حجز أو فحص طلب.
8. لا تطلب من الزبون معلومات سرية أو كلمات مرور.
9. اجعل إجاباتك مختصرة وواضحة ومنظمة.
10. لا تعرض معلومات داخلية عن قاعدة البيانات أو إعدادات الخادم.
11. إذا كانت بيانات منتج غير محددة، أخبر الزبون بذلك بدلاً من التخمين.

${productsContext}
`;

    // إعداد Gemini
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: GEMINI_TIMEOUT,
      },
    });

    // النموذج الأساسي ثم النماذج الاحتياطية
    const configuredModel = process.env.GEMINI_MODEL;

    const models = [
      configuredModel,
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.8-flash",
    ].filter(
      (model, index, array) =>
        model && array.indexOf(model) === index
    );

    let reply = "";
    let successfulModel = "";

    // تجربة النماذج بالتتابع
    for (const model of models) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        const response = await ai.models.generateContent({
          model,
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 700,
          },
        });

        const text = response?.text?.trim();

        if (!text) {
          throw new Error("Gemini returned an empty response");
        }

        reply = text;
        successfulModel = model;

        console.log(`Gemini success: ${model}`);

        break;
      } catch (error) {
        const status = getErrorStatus(error);

        console.error(
          `Gemini model ${model} failed:`,
          status,
          error?.message
        );

        // أخطاء المفتاح أو الصلاحيات لا تُحل بتغيير النموذج
        if (status === 401 || status === 403) {
          throw error;
        }

        // إذا لم يكن الخطأ مؤقتاً، لا نكرر المحاولة
        if (!shouldTryFallback(error)) {
          break;
        }

        // الانتقال إلى النموذج التالي
        continue;
      }
    }

    // إذا فشلت جميع النماذج
    if (!reply) {
      console.error("All Gemini models failed.");

      return NextResponse.json({
        success: true,
        reply:
          "أعتذر منك، المساعد الذكي مشغول حالياً بسبب ضغط مؤقت على الخدمة. الرجاء المحاولة بعد قليل، وسأكون سعيداً بمساعدتك. ✨",
      });
    }

    // الرد الناجح
    return NextResponse.json({
      success: true,
      reply,
      model: successfulModel,
    });
  } catch (error) {
    console.error("Hawawsheh Chat API Error:", {
      message: error?.message,
      status: getErrorStatus(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "تعذر الاتصال بالمساعد الذكي حالياً. حاول مرة أخرى بعد قليل.",
      },
      { status: 500 }
    );
  }
}
