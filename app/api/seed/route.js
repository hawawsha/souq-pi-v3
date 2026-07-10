// app/api/seed/route.js
// مسار مؤقت: زُر هذا الرابط مرة واحدة فقط لإضافة منتج تجريبي حقيقي إلى قاعدة البيانات
// يمكنك حذف هذا الملف بعد الاستخدام لأسباب أمنية

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();

    const existing = await Product.findOne({ name: "منتج تجريبي" });

    if (existing) {
      console.log("HTTP Status: 200 - Demo product already exists:", existing._id.toString());
      return NextResponse.json(
        { success: true, message: "المنتج التجريبي موجود مسبقاً", data: existing },
        { status: 200 }
      );
    }

    const product = await Product.create({
      name: "منتج تجريبي",
      description: "منتج لاختبار عملية الشراء عبر Pi Network",
      price: 1,
      imageUrl: "",
      stock: 100,
    });

    console.log("HTTP Status: 201 - Demo product created:", product._id.toString());
    return NextResponse.json(
      { success: true, message: "تم إنشاء المنتج التجريبي بنجاح", data: product },
      { status: 201 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error seeding product:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء المنتج التجريبي", error: error.message },
      { status: 500 }
    );
  }
}
