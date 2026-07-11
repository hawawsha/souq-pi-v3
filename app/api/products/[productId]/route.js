// app/api/products/[productId]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const { productId } = params;

    console.log("Fetching product by productId:", productId);

    await dbConnect();

    const product = await Product.findOne({ productId });

    if (!product) {
      console.log("HTTP Status: 404 - Product not found:", productId);
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    console.log("HTTP Status: 200 - Product found:", product.name);
    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    console.log("HTTP Status: 500 - Error fetching product:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب المنتج", error: error.message },
      { status: 500 }
    );
  }
}
