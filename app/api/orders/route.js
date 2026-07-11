// app/api/orders/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Notification from "@/models/Notification";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Received order request body:", JSON.stringify(body));

    const { productId, buyerUid, buyerUsername } = body;

    if (!productId || !buyerUid) {
      console.log(
        "HTTP Status: 400 - Missing productId or buyerUid | productId:",
        productId,
        "| buyerUid:",
        buyerUid
      );
      return NextResponse.json(
        { success: false, message: "productId و buyerUid مطلوبان" },
        { status: 400 }
      );
    }

    await dbConnect();

    // productId هنا هو الـ UUID المخزّن في حقل product.productId، وليس الـ Mongo _id
    const product = await Product.findOne({ productId });

    if (!product) {
      console.log("HTTP Status: 404 - Product not found:", productId);
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const order = await Order.create({
      buyer: {
        uid: buyerUid,
        username: buyerUsername || buyerUid,
      },
      seller: {
        uid: product.seller?.uid || "souq-pi",
        username: product.seller?.username || "Souq Pi",
      },
      product: {
        productId: product.productId,
        name: product.name,
        price: product.price,
      },
      payment: {
        amount: product.price,
        status: "pending",
      },
      status: "pending",
    });

    console.log("HTTP Status: 201 - Order created:", order.orderId);

    // إنشاء إشعار للمشتري بنفس نمط البيانات الحقيقية الموجودة بالقاعدة
    try {
      await Notification.create({
        uid: order.buyer.uid,
        type: "payment",
        title: "Payment pending",
        message: `Payment of ${order.payment.amount} PI for order ${order.orderId}`,
        data: {
          orderId: order.orderId,
          amount: order.payment.amount,
          status: order.payment.status,
        },
      });
    } catch (notifError) {
      console.log("Warning: failed to create notification:", notifError.message);
    }

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
