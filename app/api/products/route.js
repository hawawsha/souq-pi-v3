// app/api/products/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();

    const products = await Product.find({}).sort({ createdAt: -1 });

    console.log("HTTP Status: 200 - Fetched products:", products.length);
    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error fetching products:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب المنتجات", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name, description, price, imageUrl, stock } = await request.json();

    if (!name || !price) {
      console.log("HTTP Status: 400 - Missing name or price");
      return NextResponse.json(
        { success: false, message: "name و price مطلوبان" },
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await Product.create({
      name,
      description: description || "",
      price,
      imageUrl: imageUrl || "",
      stock: stock ?? 0,
    });

    console.log("HTTP Status: 201 - Product created:", product._id.toString());
    return NextResponse.json(
      { success: true, message: "تم إنشاء المنتج بنجاح", data: product },
      { status: 201 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error creating product:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء المنتج", error: error.message },
      { status: 500 }
    );
  }
}
