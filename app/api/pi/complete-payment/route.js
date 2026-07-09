import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import piClient from "@/lib/pi/config";

export async function POST(request) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      console.log("HTTP Status: 400 - Missing paymentId or txid");
      return NextResponse.json(
        { success: false, message: "paymentId و txid مطلوبان" },
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findOne({ paymentId });

    if (!order) {
      console.log("HTTP Status: 404 - Order not found for paymentId:", paymentId);
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على الطلب" },
        { status: 404 }
      );
    }

    const completedPayment = await piClient.completePayment(paymentId, txid);

    order.status = "completed";
    order.txid = txid;
    order.completedAt = new Date();

    await order.save();

    console.log("HTTP Status: 200 - Payment completed successfully:", paymentId);
    return NextResponse.json(
      { success: true, message: "تم إتمام الدفع بنجاح", data: completedPayment },
      { status: 200 }
    );
  } catch (error) {
    console.log("HTTP Status: 500 - Error completing payment:", error.message);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إتمام الدفع", error: error.message },
      { status: 500 }
    );
  }
}
