// app/api/orders/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function POST(request) {
  try {
    const { productId, userUid } = await request.json();

    if (!productId || !userUid) {
      console.log("HTTP Status: 400 - Missing productId or userUid");
      return NextResponse.json(
        { success: false, message: "productId و userUid مطلوبان" },
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await Product.findById(productId);

    if (!product) {
      console.log("HTTP Status: 404 - Product not found:", productId);
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const order = await Order.create({
      productId: product._id,
      productName: product.name,
      amount: product.price,
      userUid,
      status: "pending",
    });

    console.log("HTTP Status: 201 - Order created:", order._id.toString());
    return NextResponse.json(
      { success: true, message: "تم إنشاء الطلب بنجاح", data: order },
      { status: 201 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error creating order:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء الطلب", error: error.message },
      { status: 500 }
    );
  }
}
