// app/api/seed/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();

    const result = await Product.deleteMany({ name: "منتج تجريبي" });

    console.log("HTTP Status: 200 - Deleted demo products:", result.deletedCount);
    return NextResponse.json(
      {
        success: true,
        message: `تم حذف ${result.deletedCount} من المنتج التجريبي`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error deleting demo product:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء حذف المنتج التجريبي", error: error.message },
      { status: 500 }
    );
  }
}
